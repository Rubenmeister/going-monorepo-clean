import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuthToken: (token: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuthToken: async (token: string) => {
    await AsyncStorage.setItem('authToken', token);
    set({ token });
  },

  setUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    set({ user: null, token: null });
  },
}));
