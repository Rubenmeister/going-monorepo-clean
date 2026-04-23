/**
 * Página de Favoritos
 * Ruta: /empresas/favoritos
 *
 * Rutas y servicios guardados para reservar con un clic.
 * Se persisten en localStorage bajo la clave "going_favoritos_<userId>".
 * Al pulsar "Reservar", pre-rellena el wizard de /empresas/solicitar
 * vía query params.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/lib/empresas/auth";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ServiceType = "transport" | "accommodation" | "tour" | "experience" | "parcel";

export interface Favorite {
  id:          string;
  name:        string;          // nombre que da el usuario
  serviceType: ServiceType;
  // Transport / Parcel
  origin?:      string;
  destination?: string;
  vehicleType?: string;
  // Tour / Experience / Accommodation
  city?:        string;
  category?:    string;
  // Comunes
  notes?:       string;
  createdAt:    string;
}

// ─── Iconos por tipo ──────────────────────────────────────────────────────────

const TYPE_ICONS: Record<ServiceType, string> = {
  transport:     "🚗",
  accommodation: "🏨",
  tour:          "🗺️",
  experience:    "🎭",
  parcel:        "📦",
};

const TYPE_LABELS: Record<ServiceType, string> = {
  transport:     "Transporte",
  accommodation: "Alojamiento",
  tour:          "Tour",
  experience:    "Experiencia",
  parcel:        "Encomienda",
};

// ─── Helpers localStorage ─────────────────────────────────────────────────────

function storageKey(userId: string) {
  return `going_favoritos_${userId}`;
}

function loadFavorites(userId: string): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
  } catch {
    return [];
  }
}

function saveFavorites(userId: string, favs: Favorite[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(favs));
}

// ─── Modal para crear / editar favorito ───────────────────────────────────────

interface ModalProps {
  initial?: Partial<Favorite>;
  onSave:  (f: Omit<Favorite, "id" | "createdAt">) => void;
  onClose: () => void;
}

const INPUT = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400";
const SELECT = INPUT + " cursor-pointer";

const SERVICE_TYPES: { key: ServiceType; label: string }[] = [
  { key: "transport",     label: "Transporte" },
  { key: "tour",          label: "Tour" },
  { key: "experience",    label: "Experiencia" },
  { key: "accommodation", label: "Alojamiento" },
  { key: "parcel",        label: "Encomienda" },
];

function FavoriteModal({ initial, onSave, onClose }: ModalProps) {
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [serviceType, setServiceType] = useState<ServiceType>(initial?.serviceType ?? "transport");
  const [origin,      setOrigin]      = useState(initial?.origin      ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [vehicleType, setVehicleType] = useState(initial?.vehicleType ?? "sedan");
  const [city,        setCity]        = useState(initial?.city        ?? "");
  const [category,    setCategory]    = useState(initial?.category    ?? "");
  const [notes,       setNotes]       = useState(initial?.notes       ?? "");

  const isTransportOrParcel = serviceType === "transport" || serviceType === "parcel";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          {initial?.id ? "Editar favorito" : "Guardar como favorito"}
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Nombre *</label>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Aeropuerto → Oficina, Hotel Quito…" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Tipo de servicio</label>
          <select className={SELECT} value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
            {SERVICE_TYPES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {isTransportOrParcel ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Origen</label>
              <input className={INPUT} value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Dirección de recogida" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Destino</label>
              <input className={INPUT} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Dirección de llegada" />
            </div>
            {serviceType === "transport" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Vehículo habitual</label>
                <select className={SELECT} value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                  <option value="sedan">Sedán (1–4 pax)</option>
                  <option value="suv">SUV (1–6 pax)</option>
                  <option value="van">Van (7–12 pax)</option>
                  <option value="minibus">Minibús (13–20 pax)</option>
                </select>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Ciudad / destino</label>
              <input className={INPUT} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Quito, Cuenca, Galápagos" />
            </div>
            {serviceType === "tour" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Categoría</label>
                <select className={SELECT} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Cualquier categoría</option>
                  <option value="ADVENTURE">Aventura</option>
                  <option value="CULTURAL">Cultural</option>
                  <option value="GASTRONOMY">Gastronomía</option>
                  <option value="NATURE">Naturaleza</option>
                </select>
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Notas</label>
          <input className={INPUT} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Requerimientos especiales…" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={() => onSave({ name, serviceType, origin, destination, vehicleType, city, category, notes })}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function FavoritosPage() {
  const { session } = useAuthRedirect();
  const router      = useRouter();

  const [favorites,   setFavorites]   = useState<Favorite[]>([]);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Favorite | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const userId = session?.user.id ?? "";

  useEffect(() => {
    if (userId) setFavorites(loadFavorites(userId));
  }, [userId]);

  if (!session) return null;

  function persist(favs: Favorite[]) {
    setFavorites(favs);
    saveFavorites(userId, favs);
  }

  function handleSave(data: Omit<Favorite, "id" | "createdAt">) {
    if (editTarget) {
      persist(favorites.map((f) => f.id === editTarget.id ? { ...editTarget, ...data } : f));
    } else {
      const newFav: Favorite = {
        ...data,
        id:        crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      persist([newFav, ...favorites]);
    }
    setShowModal(false);
    setEditTarget(null);
  }

  function handleDelete(id: string) {
    persist(favorites.filter((f) => f.id !== id));
    setDeleteConfirm(null);
  }

  function handleBook(fav: Favorite) {
    // Pre-rellenar el wizard vía query params
    const params = new URLSearchParams({ serviceType: fav.serviceType });
    if (fav.origin)      params.set("origin",      fav.origin);
    if (fav.destination) params.set("destination", fav.destination);
    if (fav.vehicleType) params.set("vehicleType", fav.vehicleType);
    if (fav.city)        params.set("city",        fav.city);
    if (fav.category)    params.set("category",    fav.category);
    if (fav.notes)       params.set("notes",       fav.notes);
    router.push(`/empresas/solicitar?${params.toString()}`);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Favoritos</h1>
          <p className="text-slate-600 mt-1">Rutas y servicios guardados para reservar con un clic</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo favorito
        </button>
      </div>

      {/* Vacío */}
      {favorites.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-3xl mb-3">⭐</p>
          <p className="text-slate-700 font-medium mb-1">Aún no tienes favoritos guardados</p>
          <p className="text-slate-500 text-sm mb-5">
            Guarda tus rutas y servicios frecuentes para reservarlos con un solo clic.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear mi primer favorito
          </button>
        </div>
      )}

      {/* Lista */}
      {favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((fav) => (
            <div key={fav.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex items-start gap-4">
              {/* Icono */}
              <span className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[fav.serviceType]}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900">{fav.name}</p>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                    {TYPE_LABELS[fav.serviceType]}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                  {fav.origin && fav.destination && (
                    <p>{fav.origin} → {fav.destination}
                      {fav.vehicleType && <span className="text-slate-400 ml-1">· {fav.vehicleType}</span>}
                    </p>
                  )}
                  {fav.city && (
                    <p>{fav.city}
                      {fav.category && <span className="text-slate-400 ml-1">· {fav.category}</span>}
                    </p>
                  )}
                  {fav.notes && <p className="text-slate-400 text-xs">{fav.notes}</p>}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleBook(fav)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reservar
                </button>
                <button
                  onClick={() => { setEditTarget(fav); setShowModal(true); }}
                  className="px-2.5 py-1.5 border border-slate-200 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Editar
                </button>
                {deleteConfirm === fav.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(fav.id)}
                      className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">
                      Confirmar
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="px-2.5 py-1.5 border border-slate-200 text-xs text-slate-500 rounded-lg hover:bg-slate-50">
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(fav.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-50"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {favorites.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-6">
          Al pulsar "Reservar" se pre-rellena el formulario con los datos guardados.
          Los favoritos se guardan en este dispositivo.
        </p>
      )}

      {/* Modal */}
      {showModal && (
        <FavoriteModal
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
