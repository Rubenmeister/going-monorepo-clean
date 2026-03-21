'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

const DOCS = [
  {
    icon: '🪪',
    label: 'Cédula de identidad',
    status: 'verified',
    expires: null,
  },
  {
    icon: '🚗',
    label: 'Licencia de conducir',
    status: 'verified',
    expires: '2027-06-15',
  },
  {
    icon: '📋',
    label: 'SOAT (Seguro obligatorio)',
    status: 'verified',
    expires: '2026-12-01',
  },
  {
    icon: '🔧',
    label: 'Revisión técnica vehicular',
    status: 'pending',
    expires: null,
  },
  {
    icon: '📄',
    label: 'Matrícula del vehículo',
    status: 'verified',
    expires: '2026-09-30',
  },
];

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  verified: { bg: '#f0fdf4', color: '#22c55e', label: 'Verificado' },
  pending: { bg: '#fef9c3', color: '#ca8a04', label: 'Pendiente' },
  expired: { bg: '#fef2f2', color: '#ef4444', label: 'Vencido' },
};

export default function DocumentsPage() {
  const { token, isReady, init } = useDriver();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const verified = DOCS.filter((d) => d.status === 'verified').length;

  return (
    <AppShell title="Documentos">
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <p className="text-white/50 text-sm mb-1">Estado de documentación</p>
        <h1 className="text-2xl font-black text-white mb-3">Mis Documentos</h1>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(verified / DOCS.length) * 100}%`,
                backgroundColor: '#22c55e',
              }}
            />
          </div>
          <span className="text-sm font-bold text-white">
            {verified}/{DOCS.length}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-1">documentos verificados</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {DOCS.map((doc) => {
          const s = STATUS_STYLES[doc.status];
          return (
            <div
              key={doc.label}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
            >
              <span className="text-2xl">{doc.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {doc.label}
                </p>
                {doc.expires && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vence:{' '}
                    {new Date(doc.expires).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                {s.label}
              </span>
            </div>
          );
        })}

        <button
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white mt-2"
          style={{ backgroundColor: '#ff4c41' }}
        >
          + Subir documento
        </button>
      </div>
    </AppShell>
  );
}
