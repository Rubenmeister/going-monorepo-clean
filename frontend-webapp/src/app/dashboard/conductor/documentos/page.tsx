'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

interface Doc {
  type:           string;
  url:            string | null;
  status:         'pending_review' | 'approved' | 'rejected' | 'not_uploaded';
  rejectedReason?: string | null;
  uploadedAt?:    string;
  expiresAt?:     string;
}

const DOC_TYPES: { type: string; label: string; description: string; icon: string }[] = [
  { type: 'cedula',         label: 'Cédula de identidad', description: 'Documento de identificación nacional',   icon: '🆔' },
  { type: 'licencia',       label: 'Licencia de conducir', description: 'Vigente al menos 30 días',              icon: '🪪' },
  { type: 'matricula',      label: 'Matrícula del vehículo', description: 'Actualizada y a tu nombre',           icon: '📋' },
  { type: 'soat',           label: 'SOAT',                  description: 'Seguro obligatorio vigente',            icon: '🛡️' },
  { type: 'foto_vehiculo',  label: 'Foto del vehículo',     description: 'Frente y costado, placa visible',      icon: '📸' },
];

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  approved:       { label: 'Aprobado',     bg: '#ECFDF5', color: '#10b981' },
  pending_review: { label: 'En revisión',  bg: '#FEF3C7', color: '#f59e0b' },
  rejected:       { label: 'Rechazado',    bg: '#FEF2F2', color: '#ef4444' },
  not_uploaded:   { label: 'No subido',    bg: '#F3F4F6', color: '#6b7280' },
};

export default function DocumentosPage() {
  const [docs, setDocs]       = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_URL}/drivers/me/documents`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setDocs(Array.isArray(d?.documents) ? d.documents : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const docByType: Record<string, Doc | undefined> = Object.fromEntries(docs.map(d => [d.type, d]));

  const expiringSoon = docs.filter(d => {
    if (!d.expiresAt) return false;
    const days = Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Documentos</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Gestiona tu documentación. La carga y reemplazo se hace desde la app móvil.
        </p>
      </div>

      {/* Alerta vencimientos */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {expiringSoon.length === 1
                ? '1 documento vence pronto'
                : `${expiringSoon.length} documentos vencen pronto`}
            </p>
            <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
              {expiringSoon.map(d => {
                const days = Math.ceil((new Date(d.expiresAt!).getTime() - Date.now()) / 86400000);
                const label = DOC_TYPES.find(dt => dt.type === d.type)?.label ?? d.type;
                return (
                  <li key={d.type}>
                    {label} — vence en {days} día{days === 1 ? '' : 's'}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {DOC_TYPES.map(dt => {
            const doc = docByType[dt.type] ?? { type: dt.type, status: 'not_uploaded', url: null };
            const badge = STATUS_BADGE[doc.status] ?? STATUS_BADGE.not_uploaded;
            return (
              <div key={dt.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {dt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-800">{dt.label}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{dt.description}</p>
                  {doc.status === 'rejected' && doc.rejectedReason && (
                    <p className="text-xs text-red-600 mt-1 font-medium">Motivo: {doc.rejectedReason}</p>
                  )}
                  {doc.uploadedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Subido el {new Date(doc.uploadedAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold text-[#0033A0] hover:underline flex-shrink-0">
                    Ver →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800">
        💡 <span className="font-bold">¿Necesitas actualizar un documento?</span> Abre la app móvil
        de Going App Conductor y ve a tu perfil. Las cargas se procesan en 24–48h.
      </div>
    </div>
  );
}
