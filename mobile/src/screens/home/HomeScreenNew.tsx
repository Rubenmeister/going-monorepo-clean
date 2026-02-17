import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

const Colors = {
  primary: '#0033A0',
  secondary: '#FF6B35',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray900: '#111827',
};

const { width } = Dimensions.get('window');

const Services = [
  { icon: '🚗', title: 'Transporte', description: 'Viaja cómodamente', color: '#FF6B35' },
  { icon: '🏨', title: 'Alojamiento', description: 'Hospedaje perfecto', color: '#10B981' },
  { icon: '🎫', title: 'Tours', description: 'Explora nuevos lugares', color: '#3B82F6' },
  { icon: '🎭', title: 'Experiencias', description: 'Momentos inolvidables', color: '#F59E0B' },
  { icon: '📦', title: 'Envíos', description: 'Paquetes seguros', color: '#8B5CF6' },
  { icon: '💳', title: 'Pagos', description: 'Opciones seguras', color: '#EC4899' },
];

export default function HomeScreenNew() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!from || !to || !date) return;
    setLoading(true);
    // TODO: Navigate to search results
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>🚀</Text>
          <Text style={styles.heroTitle}>Going</Text>
          <Text style={styles.heroSubtitle}>
            Viaja, explora y vive nuevas experiencias
          </Text>
        </View>
      </View>

      {/* Search Form */}
      <View style={styles.searchContainer}>
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>¿A dónde quieres ir?</Text>

          {/* From Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>¿Desde dónde? 📍</Text>
            <TextInput
              style={styles.input}
              placeholder="Ciudad de origen"
              placeholderTextColor="#9CA3AF"
              value={from}
              onChangeText={setFrom}
            />
          </View>

          {/* To Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>¿Hacia dónde? ✈️</Text>
            <TextInput
              style={styles.input}
              placeholder="Ciudad destino"
              placeholderTextColor="#9CA3AF"
              value={to}
              onChangeText={setTo}
            />
          </View>

          {/* Date Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha 📅</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={[
              styles.searchButton,
              (loading || !from || !to || !date) && styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={loading || !from || !to || !date}
          >
            <Text style={styles.searchButtonText}>
              {loading ? '🔍 Buscando...' : '🔍 Buscar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Nuestros Servicios</Text>

        <View style={styles.servicesGrid}>
          {Services.map((service, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.serviceCard, { borderLeftColor: service.color }]}
              activeOpacity={0.7}
            >
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>¿Listo para tu próxima aventura?</Text>
        <Text style={styles.ctaSubtitle}>
          Únete a millones de viajeros y explora el mundo
        </Text>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>Comenzar Ahora</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Going</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },

  // Hero
  hero: {
    backgroundColor: Colors.primary,
    paddingVertical: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    marginHorizontal: 20,
    marginTop: -40,
    marginBottom: 40,
  },
  searchCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.gray900,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Services
  servicesSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: 20,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
  },

  // CTA
  ctaSection: {
    backgroundColor: Colors.primary,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 40,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  ctaButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: Colors.gray900,
  },
  footerText: {
    color: Colors.white,
    opacity: 0.7,
    fontSize: 14,
  },
});
