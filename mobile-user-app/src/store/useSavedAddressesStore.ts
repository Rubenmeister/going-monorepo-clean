import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savedAddressesAPI, type SavedAddressDTO } from '../services/api';

const STORAGE_KEY = 'going_saved_addresses';

export type AddressType = 'home' | 'work' | 'favorite';

export interface SavedAddress {
  id: string;
  type: AddressType;
  label: string;          // "Casa", "Trabajo", o nombre personalizado ("Mamá")
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

async function cacheLocal(list: SavedAddress[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage lleno/bloqueado: el backend es la fuente */
  }
}

async function readLocal(): Promise<SavedAddress[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Sube la lista completa al backend (fuente única, /auth/me/saved-addresses).
 * Devuelve la lista saneada por el servidor, o null si no hay sesión/está offline.
 */
async function syncRemote(list: SavedAddress[]): Promise<SavedAddress[] | null> {
  try {
    const res = await savedAddressesAPI.put(list as SavedAddressDTO[]);
    return (res.data?.savedAddresses as SavedAddress[]) ?? list;
  } catch {
    return null;
  }
}

/**
 * Store de direcciones guardadas. FUENTE ÚNICA = backend (Atlas), con
 * AsyncStorage como caché para carga instantánea y offline. Antes era
 * local-only y no sincronizaba con el webapp; ahora ambos leen el mismo
 * endpoint. Escrituras optimistas: actualiza local + estado, luego sincroniza.
 */
export const useSavedAddressesStore = create<SavedAddressesState>((set, get) => ({
  addresses: [],
  loaded: false,

  load: async () => {
    // Backend primero (sincroniza entre dispositivos); si falla, caché local.
    try {
      const res = await savedAddressesAPI.get();
      const remote = (res.data?.savedAddresses as SavedAddress[]) ?? [];
      await cacheLocal(remote);
      set({ addresses: remote, loaded: true });
      return;
    } catch {
      /* sin sesión / offline → usar caché local */
    }
    set({ addresses: await readLocal(), loaded: true });
  },

  save: async (addr) => {
    const newAddr: SavedAddress = { ...addr, id: Date.now().toString() };
    // Solo una dirección de tipo home y work a la vez; favoritos se acumulan.
    let addresses = get().addresses.filter(
      (a) => addr.type === 'favorite' || a.type !== addr.type,
    );
    addresses = [newAddr, ...addresses];
    await cacheLocal(addresses);
    set({ addresses });
    const synced = await syncRemote(addresses);
    if (synced) {
      await cacheLocal(synced);
      set({ addresses: synced });
    }
  },

  remove: async (id) => {
    const addresses = get().addresses.filter((a) => a.id !== id);
    await cacheLocal(addresses);
    set({ addresses });
    const synced = await syncRemote(addresses);
    if (synced) {
      await cacheLocal(synced);
      set({ addresses: synced });
    }
  },

  update: async (id, changes) => {
    const addresses = get().addresses.map((a) =>
      a.id === id ? { ...a, ...changes } : a,
    );
    await cacheLocal(addresses);
    set({ addresses });
    const synced = await syncRemote(addresses);
    if (synced) {
      await cacheLocal(synced);
      set({ addresses: synced });
    }
  },
}));
