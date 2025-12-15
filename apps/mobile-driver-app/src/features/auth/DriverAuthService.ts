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

export const driverAuthService = {
  async login(data: any): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    
    // Validate Role
    if (response.data.user.role !== 'DRIVER' && response.data.user.role !== 'ADMIN') {
        throw new Error('Access Denied: Drivers Only');
    }

    if (response.data.accessToken) {
      await AsyncStorage.setItem('driver_user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('driver_token', response.data.accessToken);
    }
    return response.data;
  },

  async logout() {
    await AsyncStorage.removeItem('driver_user');
    await AsyncStorage.removeItem('driver_token');
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('driver_user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};
