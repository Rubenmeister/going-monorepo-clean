'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authFetch, getStoredToken, redirectToLogin } from '@/lib/providers/auth-client';

const DEFAULT_LAT = -0.1807;
const DEFAULT_LNG = -78.4678;
const CATEGORIES = [
  { value: 'ADVENTURE', label: 'Aventura' },
  { value: 'CULTURAL', label: 'Cultural' },
  { value: 'GASTRONOMY', label: 'Gastronomía' },
  { value: 'NATURE', label: 'Naturaleza' },
];

export default function NuevoTourPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', city: '', address: '',
    price: '', durationHours: '', maxGuests: '', category: 'ADVENTURE',
  });

  useEffect(() => {
    if (!getStoredToken()) redirectToLogin('/services/promotores-locales/tours/nuevo');
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    const price = parseFloat(form.price);
    const durationHours = parseFloat(form.durationHours);
    const maxGuests = parseInt(form.maxGuests, 10);
    if (!form.title.trim() || !form.city.trim() || !Number.isFinite(price) || price <= 0) {
      setError('Completa al menos título, ciudad y un precio válido.');
      return;
    }
    setSaving(true); setError(null);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: { address: form.address.trim() || form.city.trim(), city: form.city.trim(), country: 'Ecuador', latitude: DEFAULT_LAT, longitude: DEFAULT_LNG },
        price: { amount: price, currency: 'USD' },
        durationHours: Number.isFinite(durationHours) && durationHours > 0 ? durationHours : 2,
        maxGuests: Number.isFinite(maxGuests) && maxGuests > 0 ? maxGuests : 10,
        category: form.category,
      };
      const res = await authFetch(`${apiUrl}/tours`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push('/services/promotores-locales/tours');
    } catch {
      setError('No se pudo crear el tour. Revisa los datos e intenta de nuevo.');
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6">
        <Link href="/services/promotores-locales/tours" className="text-xs text-gray-400 hover:text-gray-600">← Mis tours</Link>
        <h1 className="text-xl font-black text-gray-900 mt-1 mb-1">Nuevo tour</h1>
        <p className="text-sm text-gray-400 mb-6">Se guarda como <b>borrador</b>. Podrás publicarlo cuando esté listo.</p>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Título *</label>
            <input value={form.title} onChange={set('title')} className={inputCls} placeholder="Tour al volcán Cotopaxi" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Descripción</label>
            <textarea value={form.description} onChange={set('description')} rows={3} className={inputCls} placeholder="Qué incluye el tour, qué lo hace único…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Ciudad *</label>
              <input value={form.city} onChange={set('city')} className={inputCls} placeholder="Latacunga" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Punto de encuentro</label>
              <input value={form.address} onChange={set('address')} className={inputCls} placeholder="Dirección de inicio" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Precio (USD) *</label>
              <input value={form.price} onChange={set('price')} inputMode="decimal" className={inputCls} placeholder="45" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Duración (h)</label>
              <input value={form.durationHours} onChange={set('durationHours')} inputMode="decimal" className={inputCls} placeholder="4" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Cupos</label>
              <input value={form.maxGuests} onChange={set('maxGuests')} inputMode="numeric" className={inputCls} placeholder="10" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
            <select value={form.category} onChange={set('category')} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-[#ff4c41] text-white text-sm font-bold rounded-xl py-3 hover:bg-[#e63e34] transition-colors disabled:opacity-50">
            {saving ? 'Guardando…' : 'Guardar como borrador'}
          </button>
        </form>
      </div>
    </div>
  );
}
