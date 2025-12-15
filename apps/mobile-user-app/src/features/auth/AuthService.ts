import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  async login(data: any): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    if (response.data.accessToken) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('token', response.data.accessToken);
    }
    return response.data;
  },

  async register(data: any): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    if (response.data.accessToken) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('token', response.data.accessToken);
    }
    return response.data;
  },

  async logout() {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }
};
