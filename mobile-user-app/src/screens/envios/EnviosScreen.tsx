/**
 * EnviosScreen — Envíos y Encomiendas Going App
 *
 * Colores: Rojo Going App (#FF4C41) SOLO en bordes, iconos y acentos.
 * Flujo: Form → Tracking → Entrega (foto conductor + OTP)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import MapboxGL from '@rnmapbox/maps';
import { useAuthStore } from '../../store/useAuthStore';
import { parcelsAPI } from '../../services/api';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../utils/haptics';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const RED   = '#FF4C41';
const GREEN = '#059669';

const PACKAGE_TYPES = [
  { id: 'small',  label: 'Pequeño', icon: '📦', desc: 'hasta 5 kg', price: 5  },
  { id: 'medium', label: 'Mediano',  icon: '🗃️', desc: '5-20 kg',   price: 8  },
  { id: 'large',  label: 'Grande',   icon: '📫', desc: '20+ kg',    price: 12 },
] as const;

type PackageType = typeof PACKAGE_TYPES[number]['id'];

/** Un punto de entrega de un envío distribuido. */
interface Drop {
  name: string;
  phone: string;
  addr: string;
  lat: number | null;
  lon: number | null;
}

/**
 * 4 esquemas de pago para envíos:
 *  A) sender + card     → tú pagas ahora con tarjeta
 *  B) sender + cash     → tú pagas en efectivo al conductor en pickup
 *  C) recipient + card  → el destinatario paga con tarjeta (link por SMS)
 *  D) recipient + cash  → contra entrega: el destinatario paga en efectivo al recibir
 */
type PaymentScheme = 'A' | 'B' | 'C' | 'D';
// Ola 3: la tarjeta (esquemas A, C) se ENCIENDE por configuración cuando hay
// credenciales de producción de la pasarela (Datafast/DeUna), sin editar código.
// Por defecto OFF → solo efectivo (B, D), lo seguro para el lanzamiento.
const CARD_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_DATAFAST === 'true' ||
  process.env.EXPO_PUBLIC_ENABLE_DEUNA === 'true';
const PAYMENT_SCHEMES: { id: PaymentScheme; label: string; icon: string; sub: string; disabled?: boolean }[] = [
  { id: 'A', label: 'Pago ahora con tarjeta',           icon: '💳', sub: CARD_ENABLED ? 'Visa · Mastercard · Amex' : 'Pago digital — disponible muy pronto', disabled: !CARD_ENABLED },
  { id: 'B', label: 'Pago en efectivo al recoger',       icon: '💵', sub: 'Le pagas a la conductora o conductor al llegar' },
  { id: 'C', label: 'Que pague el destinatario (tarjeta)', icon: '📱', sub: CARD_ENABLED ? 'Le llega un link de pago por SMS' : 'Pago digital — disponible muy pronto', disabled: !CARD_ENABLED },
  { id: 'D', label: 'Contra entrega (el destinatario paga efectivo)', icon: '🤝', sub: 'Cobra al recibir' },
];

function schemeToApi(scheme: PaymentScheme): {
  paymentMethod: 'card' | 'cash';
  payerRole: 'sender' | 'recipient';
} {
  switch (scheme) {
    case 'A': return { paymentMethod: 'card', payerRole: 'sender' };
    case 'B': return { paymentMethod: 'cash', payerRole: 'sender' };
    case 'C': return { paymentMethod: 'card', payerRole: 'recipient' };
    case 'D': return { paymentMethod: 'cash', payerRole: 'recipient' };
  }
}

export function EnviosScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<{ params: any }, 'params'>>();
  const { user }   = useAuthStore();

  const [pkgType,        setPkgType]       = useState<PackageType>('small');
  const [pkgDesc,        setPkgDesc]       = useState('');
  const [pkgPhoto,       setPkgPhoto]      = useState<string | null>(null);
  const [senderAddr,     setSenderAddr]    = useState('');
  const [recipientName,  setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone]= useState('');
  const [recipientAddr,  setRecipientAddr] = useState('');
  const [loading,        setLoading]       = useState(false);
  const [paymentScheme,  setPaymentScheme] = useState<PaymentScheme>('B'); // efectivo por defecto: tarjeta (A/C) deshabilitada hasta integrar pasarela
  const [quotedPrice,    setQuotedPrice]   = useState<number | null>(null);

  // Envío DISTRIBUIDO: varias entregas en una ruta. Cada punto tiene su
  // destinatario y confirma con SU código OTP. +$5 por dirección extra.
  const [distributed,  setDistributed] = useState(false);
  const [drops,        setDrops]       = useState<Drop[]>([{ name: '', phone: '', addr: '', lat: null, lon: null }]);
  const [editingDrop,  setEditingDrop] = useState<number | null>(null);
  const patchDrop = (i: number, p: Partial<Drop>) =>
    setDrops(ds => ds.map((d, j) => (j === i ? { ...d, ...p } : d)));

  // Puntos válidos (con coordenadas). El destino efectivo para cotizar es el
  // ÚLTIMO punto; el número de puntos define el recargo por dirección extra.
  const validDrops   = drops.filter(d => d.lat != null && d.lon != null && d.addr.trim());
  const effDropCount = distributed ? Math.max(1, validDrops.length) : 1;

  // Recibir ubicaciones del LocationPicker
  useEffect(() => {
    const src = route.params?.selectedPickup;
    if (src) setSenderAddr(src.address);
  }, [route.params?.selectedPickup]);

  useEffect(() => {
    const dst = route.params?.selectedDelivery;
    if (dst) setRecipientAddr(dst.address);
  }, [route.params?.selectedDelivery]);

  // Retorno del LocationPicker para un PUNTO de entrega (envío distribuido):
  // se aplica al punto que se estaba editando.
  useEffect(() => {
    const loc = route.params?.selectedDropLoc;
    if (loc?.address && editingDrop != null) {
      patchDrop(editingDrop, { addr: loc.address, lat: loc.latitude, lon: loc.longitude });
      setEditingDrop(null);
    }
  }, [route.params?.selectedDropLoc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Destino efectivo para cotizar: el destinatario único, o el ÚLTIMO punto en
  // distribuido. El nº de puntos define el recargo (+$5 por dirección extra).
  const lastDrop = validDrops[validDrops.length - 1];
  const effDestLat = distributed ? (lastDrop?.lat ?? null) : (route.params?.selectedDelivery?.latitude ?? null);
  const effDestLon = distributed ? (lastDrop?.lon ?? null) : (route.params?.selectedDelivery?.longitude ?? null);

  // Cotización autoritativa: cuando hay origen+destino+tamaño, pedimos el precio
  // real al backend. Es lo que se cobrará.
  useEffect(() => {
    const pickup = route.params?.selectedPickup;
    if (
      typeof pickup?.latitude === 'number' && typeof pickup?.longitude === 'number' &&
      typeof effDestLat === 'number' && typeof effDestLon === 'number'
    ) {
      parcelsAPI
        .quote({
          origin: { lat: pickup.latitude, lng: pickup.longitude },
          destination: { lat: effDestLat, lng: effDestLon },
          packageSize: pkgType,
          dropCount: effDropCount,
        })
        .then(({ data }) => setQuotedPrice(typeof data.price === 'number' ? data.price : null))
        .catch(() => setQuotedPrice(null));
    } else {
      setQuotedPrice(null);
    }
  }, [route.params?.selectedPickup, effDestLat, effDestLon, effDropCount, pkgType]);

  const selectedPkg = PACKAGE_TYPES.find(p => p.id === pkgType)!;
  // Precio mostrado: la cotización autoritativa si ya la tenemos; si no, el
  // estimado local por tamaño (fallback antes de elegir direcciones).
  const totalPrice  = quotedPrice ?? selectedPkg.price;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) { setPkgPhoto(result.assets[0].uri); hapticLight(); }
  };

  const validate = () => {
    if (!senderAddr) { Alert.alert('Falta dirección', 'Ingresa la dirección de recogida.'); return false; }
    if (distributed) {
      if (validDrops.length < 2) { Alert.alert('Envío distribuido', 'Agrega al menos 2 puntos de entrega con dirección.'); return false; }
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        if (d.addr.trim() || d.name.trim() || d.phone.trim()) {
          if (!d.name.trim())  { Alert.alert(`Punto ${i + 1}`, 'Falta el nombre del destinatario.'); return false; }
          if (!d.phone.trim()) { Alert.alert(`Punto ${i + 1}`, 'Falta el teléfono.'); return false; }
          if (d.lat == null)   { Alert.alert(`Punto ${i + 1}`, 'Elige la dirección de entrega.'); return false; }
        }
      }
    } else {
      if (!recipientName)  { Alert.alert('Falta destinatario', 'Ingresa el nombre de quien recibe.'); return false; }
      if (!recipientPhone) { Alert.alert('Falta teléfono', 'Ingresa el teléfono del destinatario.'); return false; }
      if (!recipientAddr)  { Alert.alert('Falta dirección', 'Ingresa la dirección de entrega.'); return false; }
    }
    return true;
  };

  const handleSolicitar = async () => {
    if (!validate()) return;
    hapticMedium(); setLoading(true);
    try {
      // Empaquetamos metadata no-soportada por el DTO (destinatario, tipo, notas,
      // foto) dentro de `description` para no perder información hasta que el
      // backend extienda el contrato.
      const pickup  = route.params?.selectedPickup;
      const dropoff = route.params?.selectedDelivery;
      const descriptionPayload = JSON.stringify({
        packageType: selectedPkg.id,
        packageLabel: selectedPkg.label,
        recipient: { name: recipientName, phone: recipientPhone },
        notes: pkgDesc || undefined,
        hasPhoto: !!pkgPhoto,
      });

      const apiPayment = schemeToApi(paymentScheme);
      // Destino principal = destinatario único, o el ÚLTIMO punto en distribuido
      // (el backend lo re-deriva igual, pero lo enviamos por claridad).
      const lastValid = validDrops[validDrops.length - 1];
      const { data } = await parcelsAPI.create({
        origin: {
          address:   senderAddr,
          latitude:  pickup?.latitude,
          longitude: pickup?.longitude,
        },
        destination: distributed
          ? { address: lastValid.addr, latitude: lastValid.lat!, longitude: lastValid.lon! }
          : { address: recipientAddr, latitude: dropoff?.latitude, longitude: dropoff?.longitude },
        description: descriptionPayload,
        price: { amount: totalPrice, currency: 'USD' },
        packageSize: selectedPkg.id,
        paymentMethod: apiPayment.paymentMethod,
        payerRole:     apiPayment.payerRole,
        ...(distributed
          ? {
              drops: validDrops.map(d => ({
                address: { address: d.addr, latitude: d.lat!, longitude: d.lon! },
                recipientName: d.name.trim(),
                recipientPhone: d.phone.trim(),
              })),
            }
          : { recipientPhone, recipientName }),
      });

      hapticSuccess();

      // Al SEGUIMIENTO REAL (pollea GET /parcels/:id). Antes se mostraba un
      // tracking FALSO con coordenadas de Quito fijas, ETA inventado y un botón
      // donde el propio remitente se auto-marcaba "entregado". El OTP viaja
      // como parámetro para mostrárselo al remitente y que lo comparta.
      navigation.navigate('EnvioTracking', { parcelId: data.id, otpPin: data.otpPin });

      // Caso A (sender+card): el backend devuelve paymentUrl → abrir el pago
      // (Datafast/DeUna) después de dejar montado el rastreador.
      if (data.paymentUrl) {
        setTimeout(() => {
          Linking.openURL(data.paymentUrl!).catch(() =>
            Alert.alert(
              'No se pudo abrir el pago',
              `Abre manualmente: ${data.paymentUrl}`,
            ),
          );
        }, 400);
      }
    } catch (err: any) {
      hapticError();
      const msg = err?.response?.data?.message || err?.message || 'Intenta de nuevo';
      Alert.alert('Error', `No se pudo procesar el envío: ${msg}`);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Image source={require('../../../assets/going-logo-envios.png')} style={s.headerLogo} resizeMode="contain" />
          <View style={s.badge}><Ionicons name="cube-outline" size={12} color={RED} /><Text style={s.badgeText}>ENVÍOS</Text></View>
        </View>
        <Text style={s.headerSub}>De punto a punto · Rastreo · Registro de entrega</Text>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

          {/* QUIÉN ENVÍA */}
          <View style={s.card}>
            <View style={s.cardTitle}><Ionicons name="arrow-up-circle-outline" size={15} color={RED} /><Text style={s.cardTitleText}>QUIÉN ENVÍA</Text></View>
            <View style={s.fieldRow}>
              <Ionicons name="person-outline" size={15} color="#9CA3AF" />
              <Text style={s.fieldVal}>{user?.firstName} {user?.lastName}</Text>
              <TouchableOpacity><Text style={s.fieldAction}>Cambiar</Text></TouchableOpacity>
            </View>
            <View style={s.fieldRow}>
              <Ionicons name="call-outline" size={15} color="#9CA3AF" />
              <Text style={s.fieldVal}>{user?.phone ?? '+593 ...'}</Text>
              <View style={s.verifiedBadge}><Ionicons name="checkmark-circle" size={12} color={GREEN} /><Text style={s.verifiedText}>Verificado</Text></View>
            </View>
            <TouchableOpacity style={s.fieldRow} onPress={() => navigation.navigate('LocationPicker', { title: 'Dirección de recogida', mode: 'origin', accentColor: RED, returnScreen: 'Envios', paramKey: 'selectedPickup' })}>
              <Ionicons name="location-outline" size={15} color={RED} />
              <Text style={senderAddr ? s.fieldVal : s.fieldPh} numberOfLines={1}>{senderAddr || 'Dirección de recogida...'}</Text>
              <Text style={s.fieldAction}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {/* Modo de entrega: un destino o varios (distribuido) */}
          <View style={s.modeRow}>
            {([{ k: false, l: 'Un destino', d: 'Una entrega' }, { k: true, l: 'Varios destinos', d: 'Reparto · +$5 c/u' }] as const).map(m => (
              <TouchableOpacity key={String(m.k)} style={[s.modeBtn, distributed === m.k && s.modeBtnOn]} onPress={() => { setDistributed(m.k); if (m.k) setDrops(ds => (ds.length < 2 ? [...ds, { name: '', phone: '', addr: '', lat: null, lon: null }] : ds)); hapticLight(); }}>
                <Text style={[s.modeLabel, distributed === m.k && { color: RED }]}>{m.l}</Text>
                <Text style={s.modeDesc}>{m.d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* QUIÉN RECIBE — un destino */}
          {!distributed && (
          <View style={s.card}>
            <View style={s.cardTitle}><Ionicons name="arrow-down-circle-outline" size={15} color={RED} /><Text style={s.cardTitleText}>QUIÉN RECIBE</Text></View>
            <View style={s.fieldRow}>
              <Ionicons name="person-outline" size={15} color="#9CA3AF" />
              <TextInput style={s.fieldInput} placeholder="Nombre del destinatario" placeholderTextColor="#9CA3AF" value={recipientName} onChangeText={setRecipientName} />
            </View>
            <View style={s.fieldRow}>
              <Ionicons name="call-outline" size={15} color="#9CA3AF" />
              <TextInput style={s.fieldInput} placeholder="Teléfono del destinatario" placeholderTextColor="#9CA3AF" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
            </View>
            <TouchableOpacity style={s.fieldRow} onPress={() => navigation.navigate('LocationPicker', { title: 'Dirección de entrega', mode: 'destination', accentColor: RED, returnScreen: 'Envios', paramKey: 'selectedDelivery' })}>
              <Ionicons name="location-outline" size={15} color={RED} />
              <Text style={recipientAddr ? s.fieldVal : s.fieldPh} numberOfLines={1}>{recipientAddr || 'Dirección de entrega...'}</Text>
              <Text style={s.fieldAction}>Buscar</Text>
            </TouchableOpacity>
            <View style={s.otpNote}><Ionicons name="lock-closed-outline" size={12} color={RED} /><Text style={s.otpNoteText}>El destinatario confirmará con código OTP al recibir</Text></View>
          </View>
          )}

          {/* PUNTOS DE ENTREGA — varios destinos */}
          {distributed && (
          <View style={s.card}>
            <View style={s.cardTitle}><Ionicons name="arrow-down-circle-outline" size={15} color={RED} /><Text style={s.cardTitleText}>PUNTOS DE ENTREGA</Text></View>
            <Text style={s.multiHint}>Cada punto tiene su destinatario y confirma con su propio código OTP. Se añade $5 por cada dirección extra.</Text>
            {drops.map((d, i) => (
              <View key={i} style={s.dropCard}>
                <View style={s.dropHead}>
                  <Text style={s.dropNum}>Punto {i + 1}</Text>
                  {drops.length > 1 && (
                    <TouchableOpacity onPress={() => setDrops(ds => ds.filter((_, j) => j !== i))}>
                      <Text style={s.dropRemove}>Quitar</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={s.fieldRow}>
                  <Ionicons name="person-outline" size={15} color="#9CA3AF" />
                  <TextInput style={s.fieldInput} placeholder="Nombre del destinatario" placeholderTextColor="#9CA3AF" value={d.name} onChangeText={v => patchDrop(i, { name: v })} />
                </View>
                <View style={s.fieldRow}>
                  <Ionicons name="call-outline" size={15} color="#9CA3AF" />
                  <TextInput style={s.fieldInput} placeholder="Teléfono" placeholderTextColor="#9CA3AF" value={d.phone} onChangeText={v => patchDrop(i, { phone: v })} keyboardType="phone-pad" />
                </View>
                <TouchableOpacity style={s.fieldRow} onPress={() => { setEditingDrop(i); navigation.navigate('LocationPicker', { title: `Dirección ${i + 1}`, mode: 'destination', accentColor: RED, returnScreen: 'Envios', paramKey: 'selectedDropLoc' }); }}>
                  <Ionicons name="location-outline" size={15} color={RED} />
                  <Text style={d.addr ? s.fieldVal : s.fieldPh} numberOfLines={1}>{d.addr || 'Dirección de entrega...'}</Text>
                  <Text style={s.fieldAction}>Buscar</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addDrop} onPress={() => { setDrops(ds => [...ds, { name: '', phone: '', addr: '', lat: null, lon: null }]); hapticLight(); }}>
              <Text style={s.addDropText}>+ Agregar punto de entrega</Text>
            </TouchableOpacity>
          </View>
          )}

          {/* EL PAQUETE */}
          <View style={s.card}>
            <View style={s.cardTitle}><Ionicons name="cube-outline" size={15} color={RED} /><Text style={s.cardTitleText}>EL PAQUETE</Text></View>
            <View style={s.pkgRow}>
              {PACKAGE_TYPES.map(p => (
                <TouchableOpacity key={p.id} style={[s.pkgCard, pkgType === p.id && s.pkgCardActive]} onPress={() => { setPkgType(p.id); hapticLight(); }}>
                  <Text style={s.pkgIcon}>{p.icon}</Text>
                  <Text style={[s.pkgName, pkgType === p.id && { color: RED }]}>{p.label}</Text>
                  <Text style={s.pkgDesc}>{p.desc}</Text>
                  <Text style={[s.pkgPrice, pkgType === p.id && { color: RED }]}>${p.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.descInput} placeholder="Descripción del contenido (ej: documentos, ropa...)" placeholderTextColor="#9CA3AF" value={pkgDesc} onChangeText={setPkgDesc} multiline maxLength={120} />
            <TouchableOpacity style={s.photoArea} onPress={handlePickPhoto}>
              {pkgPhoto
                ? <Image source={{ uri: pkgPhoto }} style={s.photoPreview} resizeMode="cover" />
                : <><Ionicons name="camera-outline" size={22} color={RED} /><Text style={s.photoText}>Foto del paquete (opcional)</Text><Text style={s.photoHint}>Recomendado para reclamaciones</Text></>
              }
            </TouchableOpacity>
          </View>

          {/* CÓMO SE PAGA */}
          <View style={s.card}>
            <View style={s.cardTitle}>
              <Ionicons name="card-outline" size={15} color={RED} />
              <Text style={s.cardTitleText}>CÓMO SE PAGA</Text>
            </View>
            {PAYMENT_SCHEMES.map((scheme) => {
              const active = paymentScheme === scheme.id;
              const disabled = scheme.disabled === true;
              return (
                <TouchableOpacity
                  key={scheme.id}
                  style={[s.schemeRow, active && s.schemeRowActive, disabled && { opacity: 0.55 }]}
                  onPress={() => { if (disabled) return; setPaymentScheme(scheme.id); hapticLight(); }}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <View style={[s.schemeRadio, active && s.schemeRadioActive]}>
                    {active && <View style={s.schemeRadioInner} />}
                  </View>
                  <Text style={s.schemeIcon}>{scheme.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.schemeLabel, active && { color: RED }]}>{scheme.label}</Text>
                    <Text style={s.schemeSub}>{scheme.sub}</Text>
                  </View>
                  {disabled && (
                    <View style={{ backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5 }}>PRONTO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={s.footer}>
          <View><Text style={s.footerLabel}>Estimado</Text><Text style={s.footerPrice}>${totalPrice.toFixed(2)}</Text></View>
          <TouchableOpacity style={[s.ctaBtn, loading && { opacity: 0.7 }]} onPress={handleSolicitar} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Text style={s.ctaBtnText}>Solicitar envío</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 52, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 3, borderBottomColor: RED },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0EF', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { height: 24 },
  badge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0EF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FECACA' },
  badgeText: { fontSize: 9, fontWeight: '900', color: RED },
  headerSub: { fontSize: 10, color: '#9CA3AF', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#fff' },
  scroll: { flex: 1, padding: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#F3F4F6', borderLeftWidth: 4, borderLeftColor: RED, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitleText: { fontSize: 10, fontWeight: '800', color: RED, letterSpacing: 1 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 11, marginBottom: 8, borderWidth: 1.5, borderColor: '#F3F4F6' },
  fieldVal: { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827' },
  fieldPh:  { flex: 1, fontSize: 13, color: '#9CA3AF' },
  fieldAction: { fontSize: 11, fontWeight: '700', color: RED },
  fieldInput: { flex: 1, fontSize: 13, color: '#111827', padding: 0 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText:  { fontSize: 10, fontWeight: '700', color: GREEN },
  otpNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF0EF', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#FECACA', marginTop: 4 },
  otpNoteText: { flex: 1, fontSize: 10, color: RED, fontWeight: '600' },
  // Modo un destino / varios destinos
  modeRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn:    { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 2, borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  modeBtnOn:  { borderColor: RED, backgroundColor: '#FFF0EF' },
  modeLabel:  { fontSize: 12, fontWeight: '800', color: '#374151' },
  modeDesc:   { fontSize: 9, color: '#9CA3AF', marginTop: 2 },
  // Puntos de entrega (distribuido)
  multiHint:  { fontSize: 10, color: '#6B7280', marginBottom: 10, lineHeight: 15 },
  dropCard:   { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1.5, borderColor: '#F3F4F6' },
  dropHead:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dropNum:    { fontSize: 11, fontWeight: '800', color: RED },
  dropRemove: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  addDrop:    { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: RED, backgroundColor: '#FFF7F6' },
  addDropText:{ fontSize: 12, fontWeight: '800', color: RED },
  pkgRow:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pkgCard:      { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  pkgCardActive:{ borderColor: RED, backgroundColor: '#FFF0EF' },
  pkgIcon:  { fontSize: 22, marginBottom: 4 },
  pkgName:  { fontSize: 11, fontWeight: '800', color: '#374151' },
  pkgDesc:  { fontSize: 9, color: '#9CA3AF', marginTop: 1 },
  pkgPrice: { fontSize: 12, fontWeight: '900', color: '#374151', marginTop: 4 },
  descInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 11, borderWidth: 1.5, borderColor: '#F3F4F6', fontSize: 13, color: '#111827', minHeight: 52, textAlignVertical: 'top', marginBottom: 8 },
  photoArea: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 2, borderColor: '#FECACA', borderStyle: 'dashed', padding: 16, alignItems: 'center', gap: 4 },
  photoPreview: { width: '100%', height: 110, borderRadius: 10 },
  photoText: { fontSize: 12, fontWeight: '700', color: RED },
  photoHint: { fontSize: 10, color: '#9CA3AF' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, paddingBottom: 32, borderTopWidth: 2, borderTopColor: '#FEE2E2' },
  footerLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  footerPrice: { fontSize: 26, fontWeight: '900', color: '#111827' },
  ctaBtn: { flex: 1, backgroundColor: RED, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 10, elevation: 6 },
  ctaBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  statusCard: { backgroundColor: '#FFF0EF', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: RED },
  statusText: { fontSize: 13, fontWeight: '800', color: RED },
  statusEta:  { fontSize: 10, color: '#B45309', marginTop: 2 },
  partyRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  partyIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  partyLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
  partyName:  { fontSize: 13, fontWeight: '800', color: '#111827' },
  partyAddr:  { fontSize: 10, color: '#6B7280', marginTop: 1 },
  partyPhone: { fontSize: 10, color: RED, fontWeight: '700', marginTop: 1 },
  partyDivider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 12 },
  otpBox:  { backgroundColor: '#FFF0EF', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA' },
  otpLabel:{ fontSize: 8, fontWeight: '800', color: RED },
  otpCode: { fontSize: 18, fontWeight: '900', color: RED },
  routeStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDot:  { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 3 },
  routeLine: { width: 2, height: 16, backgroundColor: '#FEE2E2', marginLeft: 4, marginVertical: 3 },
  routeAddr: { fontSize: 12, fontWeight: '700', color: '#111827' },
  routeTime: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  pkgSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pkgSummaryName:  { fontSize: 13, fontWeight: '700', color: '#111827' },
  pkgSummaryPrice: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  schemeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
    marginTop: 6,
  },
  schemeRowActive: {
    borderColor: RED, backgroundColor: '#FFF5F4',
  },
  schemeRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  schemeRadioActive: { borderColor: RED },
  schemeRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: RED },
  schemeIcon: { fontSize: 22 },
  schemeLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  schemeSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  paidText:  { fontSize: 10, fontWeight: '700', color: GREEN },
  trackFooter: { flexDirection: 'row', gap: 8, backgroundColor: '#fff', padding: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  trackCallBtn:  { flex: 1, backgroundColor: '#FFF0EF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#FECACA' },
  trackCallText: { fontSize: 12, fontWeight: '800', color: RED },
  trackShareBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  trackShareText:{ fontSize: 12, fontWeight: '800', color: '#374151' },
  trackMapBtn:   { flex: 2, backgroundColor: RED, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: RED, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  trackMapText:  { fontSize: 12, fontWeight: '900', color: '#fff' },
  deliveredIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  deliveredTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 4 },
  deliveredSub:   { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  deliveryPhoto:   { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  deliveryCaption: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  summaryLbl: { fontSize: 12, color: '#6B7280' },
  summaryVal: { fontSize: 12, fontWeight: '700', color: '#111827' },

  // Tracking con mapa
  mapPinRed: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: RED, borderWidth: 2, borderColor: '#fff',
  },
  mapOverlayGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
    // Degradado simulado — en producción usar LinearGradient
    backgroundColor: 'transparent',
  },
  trackFloatHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 52, paddingBottom: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderBottomWidth: 3, borderBottomColor: RED,
  },
  statusPill: {
    position: 'absolute', top: 110, left: 14, right: 14,
    backgroundColor: '#FFF0EF',
    borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#FECACA',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  trackBottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '55%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 8,
  },
  trackHandle: {
    width: 36, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, margin: 10, alignSelf: 'center',
  },
});
