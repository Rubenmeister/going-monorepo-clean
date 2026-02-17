import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '../../api/apiClient';

export default function SearchScreen() {
  const [tours, setTours] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.length < 2) return;

    setLoading(true);
    try {
      const [toursResult, experiencesResult] = await Promise.all([
        apiClient.searchTours({ locationCity: text }),
        apiClient.searchExperiences({ locationCity: text }),
      ]);
      setTours(toursResult);
      setExperiences(experiencesResult);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Buscar ciudad..."
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#0033A0" style={styles.loader} />}

      {tours.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tours</Text>
          {tours.map((tour) => (
            <View key={tour.id} style={styles.card}>
              <Text style={styles.cardTitle}>{tour.title}</Text>
              <Text style={styles.cardPrice}>${tour.price.amount}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {tour.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {experiences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiencias</Text>
          {experiences.map((experience) => (
            <View key={experience.id} style={styles.card}>
              <Text style={styles.cardTitle}>{experience.title}</Text>
              <Text style={styles.cardPrice}>${experience.price.amount}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {experience.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!loading && searchText && tours.length === 0 && experiences.length === 0 && (
        <Text style={styles.noResults}>No se encontraron resultados</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#0033A0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0033A0',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontSize: 16,
  },
});
