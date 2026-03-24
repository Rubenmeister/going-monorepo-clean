/**
 * Firestore service — Aplicaciones de proveedores Going
 * Colección: provider_applications
 */
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ProviderRole = 'conductor' | 'anfitrion' | 'promotor' | 'operador';

export interface ProviderApplication {
  // Rol
  role: ProviderRole;

  // Datos personales
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;

  // Datos específicos por rol
  vehicleType?: string;          // conductor
  licensePlate?: string;         // conductor
  propertyType?: string;         // anfitrión
  propertyAddress?: string;      // anfitrión
  tourTypes?: string[];          // promotor
  activityTypes?: string[];      // operador
  yearsExperience?: number;

  // Mensaje libre
  about?: string;

  // Estado (lo gestiona el admin)
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected';
}

const COLLECTION = 'provider_applications';

/** Guarda una nueva aplicación de proveedor */
export async function submitProviderApplication(data: ProviderApplication): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Verifica si un email ya tiene aplicación pendiente para ese rol */
export async function hasExistingApplication(email: string, role: ProviderRole): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION),
    where('email', '==', email),
    where('role', '==', role),
    where('status', 'in', ['pending', 'reviewing', 'approved'])
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/** Lista todas las aplicaciones (solo para admin) */
export async function listApplications(role?: ProviderRole) {
  const constraints = role
    ? [where('role', '==', role), orderBy('createdAt', 'desc')]
    : [orderBy('createdAt', 'desc')];
  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ProviderApplication & { createdAt: unknown }) }));
}
