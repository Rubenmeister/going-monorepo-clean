import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'going_saved_addresses';

export type AddressType = 'home' | 'work' | 'favorite';

export interface SavedAddress {
  id: string;
  type: AddressType;
  label: string;          // "Casa", "Trabajo", o nombre personalizado
  address: string;        // texto legible
  latitude: number;
  longitude: number;
}

interface SavedAddressesState {
  addresses: SavedAddress[];
  loaded: boolean;
  load: () => Promise<void>;
  save: (addr: Omit<SavedAddress, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (id: string, changes: Partial<SavedAddress>) => Promise<void>;
}

export const useSavedAddressesStore = create<SavedAddressesState>((set, get) => ({
  addresses: [],
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const addresses: SavedAddress[] = raw ? JSON.parse(raw) : [];
      set({ addresses, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  save: async (addr) => {
    const newAddr: SavedAddress = { ...addr, id: Date.now().toString() };
    // Solo una dirección de tipo home y work a la vez
    let addresses = get().addresses.filter(
      a => addr.type === 'favorite' || a.type !== addr.type
    );
    addresses = [newAddr, ...addresses];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    set({ addresses });
  },

  remove: async (id) => {
    const addresses = get().addresses.filter(a => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    set({ addresses });
  },

  update: async (id, changes) => {
    const addresses = get().addresses.map(a => a.id === id ? { ...a, ...changes } : a);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    set({ addresses });
  },
}));
