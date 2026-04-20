'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app/api';

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

interface CorpAccount {
  companyName: string;
  ruc: string;
  plan: string;
  monthlyLimit: number;
  monthlyUsed: number;
  members: number;
  status: 'active' | 'pending' | 'suspended';
}

const PLANS = [
  { id: 'starter',  label: 'Starter',    price: 0,    members: 5,   limit: 500,   color: '#6b7280' },
  { id: 'business', label: 'Business',   price: 99,   members: 25,  limit: 3000,  color: '#0033A0' },
  { id: 'enterprise',label: 'Enterprise',price: 299,  members: 999, limit: 99999, color: '#7c3aed' },
];

export default function CorporatePage() {
  const [corp,    setCorp]    = useState<CorpAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [name,    setName]    = useState('');
  const [hasAccount, setHasAccount] = useState(false);

  // Formulario de solicitud
  const [formCompany,  setFormCompany]  = useState('');
  const [formRuc,      setFormRuc]      = useState('');
  const [formPlan,     setFormPlan]     = useState('business');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    if (!token) { window.location.href = '/auth/login?from=/account/corporate'; return; }
    const p = parseJwt(token);
    if (p) setName(p.firstName || p.name || 'Usuario');

    fetch(`${API_URL}/corporate/account`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCorp({
            companyName:  data.companyName ?? data.name ?? '—',
            ruc:          data.ruc ?? data.taxId ?? '—',
            plan:         data.plan ?? 'starter',
            monthlyLimit: data.monthlyLimit ?? 500,
            monthlyUsed:  data.monthlyUsed ?? data.monthlySpend ?? 0,
            members:      data.teamMembers ?? data.members ?? 1,
            status:       data.status ?? 'active',
          });
          setHasAccount(true);
        } else {
          setHasAccount(false);
        }
      })
      .catch(() => setHasAccount(false))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || '';
    try {
      await fetch(`${API_URL}/corporate/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyName: formCompany, ruc: formRuc, plan: formPlan }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // mostrar éxito igualmente (optimistic)
    } finally {
      setSubmitting(false);
    }
  };

  const plan = PLANS.find(p => p.id === corp?.plan) ?? PLANS[0];
  const progress = corp ? Math.min((corp.monthlyUsed / corp.monthlyLimit) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/account"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Cuenta Corporativa</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />)}
          </div>

        ) : hasAccount && corp ? (
          <>
            {/* Status card */}
            <div className="rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #011627, #0033A0)' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white/60 text-xs mb-0.5">Empresa</p>
                  <p className="text-xl font-black">{corp.companyName}</p>
                  <p className="text-white/50 text-xs">RUC: {corp.ruc}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: plan.color + '30', color: '#fff' }}>
                  {plan.label}
                </span>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-white/60 text-xs">Gasto mensual</p>
                  <p className="text-2xl font-black">${corp.monthlyUsed.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Límite</p>
                  <p className="text-2xl font-black">${corp.monthlyLimit}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Miembros</p>
                  <p className="text-2xl font-black">{corp.members}</p>
                </div>
              </div>
            </div>

            {/* Budget progress */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Presupuesto del mes</span>
                <span className="text-gray-400">${corp.monthlyUsed.toFixed(0)} / ${corp.monthlyLimit}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full transition-all"
                  style={{ width: `${progress}%`, background: progress > 80 ? '#ef4444' : '#0033A0' }} />
              </div>
              {progress > 80 && (
                <p className="text-xs text-red-500 font-medium mt-1">⚠️ Cerca del límite mensual</p>
              )}
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '👥', label: 'Gestionar equipo',  href: '/corporate' },
                { icon: '📋', label: 'Ver aprobaciones',  href: '/corporate/approvals' },
                { icon: '🧾', label: 'Facturas',          href: '/corporate/invoices' },
                { icon: '📊', label: 'Reportes',          href: '/corporate/reports' },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all">
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{a.label}</span>
                </Link>
              ))}
            </div>

            <Link href="/corporate"
              className="block w-full py-4 rounded-2xl text-white font-bold text-sm text-center transition-all hover:opacity-90"
              style={{ backgroundColor: '#0033A0' }}>
              Ir al Portal Corporativo →
            </Link>
          </>

        ) : submitted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-5xl mb-4">✅</p>
            <p className="text-xl font-black text-gray-900 mb-2">¡Solicitud enviada!</p>
            <p className="text-gray-500 text-sm mb-6">
              Nuestro equipo revisará tu solicitud en las próximas 24–48 horas y te contactará al email registrado.
            </p>
            <Link href="/account" className="text-sm text-[#0033A0] font-semibold hover:underline">
              ← Volver a mi cuenta
            </Link>
          </div>

        ) : (
          <>
            {/* Hero */}
            <div className="rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #011627, #0033A0)' }}>
              <p className="text-white/70 text-sm mb-1">Going Empresas</p>
              <h2 className="text-2xl font-black mb-2">Cuenta Corporativa</h2>
              <p className="text-white/60 text-sm">Gestiona viajes, envíos y hospedaje de todo tu equipo en un solo lugar</p>
            </div>

            {/* Planes */}
            <p className="text-sm font-bold text-gray-700 px-1">Elige tu plan</p>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map(p => (
                <button key={p.id} onClick={() => setFormPlan(p.id)}
                  className={`rounded-2xl border-2 p-3 text-center transition-all ${formPlan === p.id ? 'shadow-md' : 'border-gray-100 bg-white'}`}
                  style={formPlan === p.id ? { borderColor: p.color, background: p.color + '08' } : {}}>
                  <p className="text-sm font-black text-gray-900">{p.label}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: p.color }}>
                    {p.price === 0 ? 'Gratis' : `$${p.price}/mes`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{p.members === 999 ? 'Ilimitado' : `Hasta ${p.members} users`}</p>
                  <p className="text-xs text-gray-400">${p.limit === 99999 ? '∞' : p.limit}/mes</p>
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleRequest} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="font-bold text-gray-900">Solicitar cuenta corporativa</p>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 block">Nombre de la empresa</label>
                <input type="text" required value={formCompany} onChange={e => setFormCompany(e.target.value)}
                  placeholder="Ej: Constructora Andina S.A."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 block">RUC</label>
                <input type="text" required value={formRuc} onChange={e => setFormRuc(e.target.value)}
                  placeholder="Ej: 1790012345001"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0]" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#0033A0' }}>
                {submitting ? 'Enviando…' : 'Solicitar cuenta corporativa'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
