import { api } from './api.config';
// Importamos los tipos compartidos para asegurar que enviamos lo correcto
// Nota: Si el import falla temporalmente, no te preocupes, lo ajustamos luego.
import { User } from '@going-monorepo-clean/shared-types';

export const AuthService = {
  // Función para Login
  login: async (email: string, password: string) => {
    // POST a http://10.0.2.2:3333/api/auth/login
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Devuelve el token y el usuario
  },

  // Función para Registro
  register: async (fullName: string, email: string, password: string, phone: string) => {
    const response = await api.post('/auth/register', { 
      fullName, 
      email, 
      password,
      phone,
      role: 'PASSENGER' // Forzamos el rol desde la app de usuario
    });
    return response.data;
  },
  
  // Función de prueba para ver si el servidor responde
  ping: async () => {
    try {
      await api.get('/'); 
      return true;
    } catch (e) {
      return false;
    }
  }
};
