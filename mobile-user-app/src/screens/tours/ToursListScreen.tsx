/**
 * ToursListScreen — Destinos y Tours del Ecuador (Mockup #20).
 *
 * Estructura:
 *   - Hero navy con título + subtitle 🇪🇨
 *   - Search bar (ciudad)
 *   - FlatList de tours con banner colorido (tourism palette) +
 *     título + ubicación + descripción + meta (duración/capacidad/categoría)
 *     + precio /persona
 *
 * Theme adaptativo + TOURISM PALETTE para banners (colores vivos de
 * paisaje: ocean/forest/mountain/sunset/sky/beach según categoría).
 *
 * REFIT 2026-05-23:
 *   - Theme tokens (antes hardcoded GOING_BLUE/RED/YELLOW)
 *   - Banners de cards ahora usan tourismPalette por categoría
 *     (matches direction "turismo con colores vivos de paisajes")
 *   - BADGE_COLORS con accent system del theme
 *   - Empty state cleanup
 *
 * TODO declarado:
 *   - Fotos reales de paisajes EC en banners (mockup muestra fotos —
 *     hoy usamos emoji + colored banner como aproximación)
 *   - Tap en card → TourDetail screen (hoy onPress vacío)
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchAPI } from '@services/api';
import { useTheme, tourismPalette, type ThemeTokens, type TourismColor } from '../../theme';

interface Tour {
  id:               string;
  title:            string;
  description?:     string;
  location:         { city: string; country: string };
  price:            { amount: number; currency: string };
  durationHours:    number;
  category?:        string;
  maxParticipants?: number;
  emoji?:           string;
  badge?:           string;
}

/**
 * Mapeo de categoría → color del tourism palette. Cuando no matcheamos
 * explícito, default 'sky' (azul cielo andino).
 */
function tourismColorForCategory(category?: string): TourismColor {
  const c = (category || '').toLowerCase();
  if (c.includes('playa') || c.includes('costa') || c.includes('mar')) return 'ocean';
  if (c.includes('selva') || c.includes('amazon') || c.includes('jungla')) return 'forest';
  if (c.includes('montaña') || c.includes('cotopaxi') || c.includes('andes') || c.includes('volcán')) return 'mountain';
  if (c.includes('atardecer') || c.includes('sunset')) return 'sunset';
  if (c.includes('galápagos') || c.includes('isla')) return 'beach';
  return 'sky';
}

export function ToursListScreen() {
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [items,     setItems]     = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [city,      setCity]      = useState('');

  // Badge colors usando tokens semánticos del theme
  const BADGE_COLORS = useMemo<Record<string, { bg: string; text: string }>>(() => ({
    Icónico:   { bg: `${tokens.warning}18`,    text: tokens.warning    },
    Popular:   { bg: `${tokens.brandRed}18`,   text: tokens.brandRed   },
    Favorito:  { bg: `${tokens.brandNavy}18`,  text: tokens.brandNavy  },
    Cultural:  { bg: `${tokens.success}18`,    text: tokens.success    },
    Relajante: { bg: `${tourismPalette.ocean}22`, text: tourismPalette.ocean },
    Premium:   { bg: `${tokens.premiumBorder}18`, text: tokens.premiumText },
  }), [tokens]);

  const fetchTours = useCallback(async (cityFilter?: string) => {
    setIsLoading(true);
    try {
      const { data } = await searchAPI.tours(
        cityFilter ? { city: cityFilter } : undefined,
      );
      const apiItems: Tour[] = data || [];
      setItems(apiItems);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTours(); }, [fetchTours]);

  const renderItem = ({ item }: { item: Tour }) => {
    const badgeStyle = item.badge ? BADGE_COLORS[item.badge] : null;
    const tourismColor = tourismPalette[tourismColorForCategory(item.category)];
    const durationLabel = item.durationHours >= 24
      ? `${Math.round(item.durationHours / 24)} días`
      : `${item.durationHours}h`;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88}>
        {/* Banner con tourism palette + emoji hero */}
        <View style={[styles.cardBanner, { backgroundColor: `${tourismColor}25` }]}>
          <Text style={styles.cardEmoji}>{item.emoji ?? '🗺️'}</Text>
          {badgeStyle && item.badge && (
            <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{item.badge}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardLocation}>
            <Ionicons name="location-outline" size={13} color={tokens.textTertiary} />
            <Text style={styles.locationText}>
              {item.location?.city}, Ecuador
            </Text>
          </View>
          {item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={tokens.textTertiary} />
                <Text style={styles.metaText}>{durationLabel}</Text>
              </View>
              {item.maxParticipants && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color={tokens.textTertiary} />
                  <Text style={styles.metaText}>Máx. {item.maxParticipants}</Text>
                </View>
              )}
              {item.category && (
                <View style={[styles.categoryTag, { backgroundColor: `${tourismColor}18` }]}>
                  <Text style={[styles.categoryText, { color: tourismColor }]}>
                    {item.category}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>
              ${item.price?.amount}
              <Text style={styles.priceUnit}>/persona</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Destinos & Tours</Text>
        <Text style={styles.heroSub}>Descubre lo mejor del Ecuador 🇪🇨</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={tokens.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder="Ciudad o destino..."
          placeholderTextColor={tokens.textTertiary}
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => fetchTours(city)}
          returnKeyType="search"
        />
        {city.length > 0 && (
          <TouchableOpacity onPress={() => { setCity(''); fetchTours(); }}>
            <Ionicons name="close-circle" size={18} color={tokens.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tokens.brandNavy} />
          <Text style={styles.loadingText}>Cargando tours...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={56} color={tokens.textTertiary} />
          <Text style={styles.emptyText}>No hay tours disponibles</Text>
          <TouchableOpacity onPress={() => fetchTours()}>
            <Text style={styles.retryText}>Ver todos los destinos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // Hero
    hero: {
      backgroundColor: t.brandNavy,
      paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
    },
    heroTitle: {
      fontSize: 22, fontWeight: '900',
      color: t.textOnNavy, marginBottom: 4, letterSpacing: -0.3,
    },
    heroSub: {
      fontSize: 13, fontWeight: '600',
      color: 'rgba(255,255,255,0.75)',
    },

    // Search
    searchBar: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.bgLayer,
      margin: 16, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 11,
      gap: 8,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    input: {
      flex: 1, fontSize: 15, color: t.textPrimary,
    },

    // State
    center: {
      flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8,
    },
    loadingText: { fontSize: 13, color: t.textTertiary, marginTop: 8 },
    emptyText: {
      fontSize: 15, color: t.textSecondary, fontWeight: '700',
    },
    retryText: {
      fontSize: 13, color: t.brandNavy, fontWeight: '800', marginTop: 4,
    },

    // List
    list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },

    // Card
    card: {
      backgroundColor: t.bgLayer,
      borderRadius: 16,
      marginBottom: 14,
      overflow: 'hidden',
      borderWidth: 1, borderColor: t.glassBorder,
    },
    cardBanner: {
      height: 90,
      justifyContent: 'center', alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 16,
      position: 'relative',
    },
    cardEmoji: { fontSize: 44 },
    badge: {
      position: 'absolute',
      top: 10, right: 12,
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 20,
    },
    badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },

    cardBody: { padding: 14, paddingTop: 12 },
    cardTitle: {
      fontSize: 15, fontWeight: '900',
      color: t.textPrimary, marginBottom: 4, lineHeight: 20,
      letterSpacing: -0.2,
    },
    cardLocation: {
      flexDirection: 'row', alignItems: 'center',
      gap: 4, marginBottom: 6,
    },
    locationText: { fontSize: 12, color: t.textTertiary, fontWeight: '600' },
    cardDesc: {
      fontSize: 13, color: t.textSecondary,
      lineHeight: 18, marginBottom: 10,
    },

    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    metaRow: {
      flexDirection: 'row', flexWrap: 'wrap',
      gap: 8, flex: 1,
    },
    metaItem: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
    },
    metaText: { fontSize: 12, color: t.textTertiary, fontWeight: '600' },
    categoryTag: {
      paddingHorizontal: 8, paddingVertical: 2,
      borderRadius: 20,
    },
    categoryText: { fontSize: 10, fontWeight: '900' },
    price: {
      fontSize: 18, fontWeight: '900',
      color: t.brandNavy, letterSpacing: -0.3,
    },
    priceUnit: { fontSize: 11, fontWeight: '700', color: t.textTertiary },
  });
}
