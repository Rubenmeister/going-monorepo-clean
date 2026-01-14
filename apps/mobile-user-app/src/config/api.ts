import { Platform } from 'react-native';

// Priority: VITE_API_URL from environment (for production builds)
// Fallback: localhost (Android Emulator uses 10.0.2.2, iOS Simulator uses localhost)

const getApiUrl = (): string => {
  // Check for environment variable (Vite injects into import.meta.env)
  const envApiUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_API_URL);

  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback for local development
  const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${LOCALHOST}:3000/api`;
};

export const API_URL = getApiUrl();
