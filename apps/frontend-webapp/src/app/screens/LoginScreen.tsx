import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const LoginScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Going.</Text>
        <Text style={styles.subtitle}>Tu Super App de Viajes</Text>
      </View>

      <View style={styles.form}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.buttonText}>Iniciar como Usuario Demo</Text>
        </TouchableOpacity>
        
        <Text style={styles.footer}>Versión Alpha 0.1</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    padding: 20 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 60 
  },
  logo: { 
    fontSize: 48, 
    fontWeight: '900', 
    color: '#ff4c41' 
  },
  subtitle: { 
    fontSize: 18, 
    color: '#666', 
    marginTop: 10 
  },
  form: { 
    width: '100%', 
    alignItems: 'center' 
  },
  button: { 
    backgroundColor: '#ff4c41', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#ff4c41',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  footer: { 
    textAlign: 'center', 
    marginTop: 30, 
    color: '#999' 
  }
});