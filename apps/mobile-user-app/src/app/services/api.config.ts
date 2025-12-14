import axios from 'axios';
import { Platform } from 'react-native';

// 10.0.2.2 es la IP especial del emulador Android para ver el localhost de tu PC
// localhost funciona bien en iOS
const DEV_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3333/api' 
  : 'http://localhost:3333/api';

// Creamos una instancia de Axios configurada
export const api = axios.create({
  baseURL: DEV_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos máximo de espera
});

// Interceptor para logs (Opcional: ayuda a ver errores en la consola)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
