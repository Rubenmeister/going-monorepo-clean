import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Datos bancarios del conductor — dónde recibe su liquidación semanal.
 *
 * El pago a prestadores se revisa los lunes y se transfiere los martes a la
 * cuenta que se registre aquí. Sin estos datos, el conductor no puede cobrar.
 * Conecta con el backend: GET/PUT /drivers/me/bank-account (payment-service),
 * que valida la cédula/RUC con dígito verificador antes de guardar.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';
const GOING_RED = '#FF4C41';
const GOING_GREEN = '#10B981';

// Bancos y cooperativas más comunes en Ecuador — atajo; "Otro" abre texto libre.
const BANCOS = [
  'Banco Pichincha', 'Banco Guayaquil', 'Produbanco', 'Banco del Pacífico',
  'Banco Internacional', 'Banco Bolivariano', 'Banco del Austro', 'Banco ProCredit',
  'Banco de Loja', 'Banco de Machala', 'Banco Solidario', 'Cooperativa JEP',
];

type DocType = 'cedula' | 'ruc';
type AcctType = 'ahorros' | 'corriente';

export function BankAccountScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [maskedActual, setMaskedActual] = useState<string | null>(null);

  const [holderName, setHolderName] = useState('');
  const [documentType, setDocumentType] = useState<DocType>('cedula');
  const [documentNumber, setDocumentNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bancoOtro, setBancoOtro] = useState(false);
  const [accountType, setAccountType] = useState<AcctType>('ahorros');
  const [accountNumber, setAccountNumber] = useState('');

  const token = async () => AsyncStorage.getItem('driver_token');

  useEffect(() => {
    (async () => {
      try {
        const t = await token();
        const { data } = await axios.get(`${API_BASE}/drivers/me/bank-account`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (data?.registrada) {
          setHolderName(data.holderName ?? '');
          setDocumentType((data.documentType as DocType) ?? 'cedula');
          setDocumentNumber(data.documentNumber ?? '');
          setBankName(data.bankName ?? '');
          setBancoOtro(!BANCOS.includes(data.bankName));
          setAccountType((data.accountType as AcctType) ?? 'ahorros');
          setMaskedActual(data.accountNumberMasked ?? null);
          setVerified(!!data.verified);
        }
      } catch {
        /* sin cuenta aún o error de red — se muestra el formulario vacío */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const guardar = async () => {
    // Validación mínima en cliente; el backend revalida (cédula/RUC con checksum).
    if (holderName.trim().length < 3) return Alert.alert('Falta un dato', 'Escribe el nombre del titular de la cuenta.');
    if (!bankName.trim()) return Alert.alert('Falta un dato', 'Elige o escribe tu banco.');
    if (!/^\d+$/.test(documentNumber.trim())) return Alert.alert('Documento', 'La cédula o RUC debe ser solo números.');
    if (!/^\d{5,20}$/.test(accountNumber.replace(/\s|-/g, ''))) return Alert.alert('Cuenta', 'El número de cuenta debe tener solo dígitos (entre 5 y 20).');

    setSaving(true);
    try {
      const t = await token();
      const { data } = await axios.put(
        `${API_BASE}/drivers/me/bank-account`,
        {
          holderName: holderName.trim(),
          documentType,
          documentNumber: documentNumber.trim(),
          bankName: bankName.trim(),
          accountType,
          accountNumber: accountNumber.replace(/\s|-/g, ''),
        },
        { headers: { Authorization: `Bearer ${t}` } },
      );
      setMaskedActual(data?.accountNumberMasked ?? null);
      setVerified(false);
      Alert.alert(
        'Cuenta guardada ✓',
        data?.mensaje ?? 'Se usará en tu liquidación semanal, que se paga los martes.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'No se pudo guardar. Revisa los datos e intenta de nuevo.';
      Alert.alert('Revisa los datos', String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GOING_RED} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Por qué */}
      <View style={styles.info}>
        <Text style={styles.infoTitle}>🏦 ¿Dónde recibes tu pago?</Text>
        <Text style={styles.infoText}>
          Revisamos las liquidaciones los lunes y transferimos los martes a esta cuenta.
          Debe estar a tu nombre (o el del titular que indiques).
        </Text>
      </View>

      {maskedActual && (
        <View style={styles.actual}>
          <Text style={styles.actualLabel}>Cuenta registrada</Text>
          <Text style={styles.actualNum}>{bankName} · {maskedActual}</Text>
          <View style={[styles.badge, { backgroundColor: verified ? GOING_GREEN : '#9CA3AF' }]}>
            <Text style={styles.badgeText}>{verified ? 'Verificada' : 'Pendiente de verificar'}</Text>
          </View>
        </View>
      )}

      <Text style={styles.label}>Nombre del titular</Text>
      <TextInput style={styles.input} value={holderName} onChangeText={setHolderName} placeholder="Como aparece en el banco" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Tipo de documento</Text>
      <View style={styles.seg}>
        {(['cedula', 'ruc'] as DocType[]).map((d) => (
          <TouchableOpacity key={d} style={[styles.segBtn, documentType === d && styles.segBtnOn]} onPress={() => setDocumentType(d)}>
            <Text style={[styles.segText, documentType === d && styles.segTextOn]}>{d === 'cedula' ? 'Cédula' : 'RUC'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} value={documentNumber} onChangeText={setDocumentNumber} placeholder={documentType === 'cedula' ? '10 dígitos' : '13 dígitos'} keyboardType="numeric" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Banco</Text>
      <View style={styles.banks}>
        {BANCOS.map((b) => (
          <TouchableOpacity key={b} style={[styles.chip, bankName === b && !bancoOtro && styles.chipOn]} onPress={() => { setBankName(b); setBancoOtro(false); }}>
            <Text style={[styles.chipText, bankName === b && !bancoOtro && styles.chipTextOn]}>{b}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.chip, bancoOtro && styles.chipOn]} onPress={() => { setBancoOtro(true); setBankName(''); }}>
          <Text style={[styles.chipText, bancoOtro && styles.chipTextOn]}>Otro</Text>
        </TouchableOpacity>
      </View>
      {bancoOtro && (
        <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="Nombre de tu banco o cooperativa" placeholderTextColor="#9CA3AF" />
      )}

      <Text style={styles.label}>Tipo de cuenta</Text>
      <View style={styles.seg}>
        {(['ahorros', 'corriente'] as AcctType[]).map((a) => (
          <TouchableOpacity key={a} style={[styles.segBtn, accountType === a && styles.segBtnOn]} onPress={() => setAccountType(a)}>
            <Text style={[styles.segText, accountType === a && styles.segTextOn]}>{a === 'ahorros' ? 'Ahorros' : 'Corriente'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Número de cuenta</Text>
      <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="Solo números" keyboardType="numeric" placeholderTextColor="#9CA3AF" />

      <TouchableOpacity style={[styles.save, saving && { opacity: 0.6 }]} onPress={guardar} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar cuenta</Text>}
      </TouchableOpacity>

      <Text style={styles.note}>
        Por seguridad, solo guardamos tu cuenta cifrada y mostramos los últimos 4 dígitos.
        Si la cambias, se vuelve a verificar antes del siguiente pago.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  container: { padding: 20, backgroundColor: '#F8F9FA', paddingBottom: 40 },
  info: { backgroundColor: '#FFF0EF', borderRadius: 14, padding: 16, marginBottom: 18 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
  actual: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#E5E7EB' },
  actualLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  actualNum: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 14 },
  seg: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  segBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', paddingVertical: 11, alignItems: 'center' },
  segBtnOn: { borderColor: GOING_RED, backgroundColor: '#FFF0EF' },
  segText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  segTextOn: { color: GOING_RED },
  banks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { borderColor: GOING_RED, backgroundColor: '#FFF0EF' },
  chipText: { fontSize: 12.5, fontWeight: '700', color: '#4B5563' },
  chipTextOn: { color: GOING_RED },
  save: { backgroundColor: GOING_RED, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  note: { fontSize: 11.5, color: '#9CA3AF', lineHeight: 17, marginTop: 14 },
});
