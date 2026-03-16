'use client';

import React, { useState, useRef } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

interface ShareTrackingProps {
  rideId: string;
  origin: string;
  destination: string;
}

interface Contact {
  name: string;
  method: 'sms' | 'email' | 'whatsapp';
  value: string; // phone or email
}

/**
 * ShareTracking — Permite al pasajero compartir su viaje en tiempo real con contactos de confianza.
 * Genera un link único de tracking y lo envía por SMS, email o WhatsApp.
 */
export function ShareTracking({ rideId, origin, destination }: ShareTrackingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    { name: '', method: 'whatsapp', value: '' },
  ]);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  const generateLink = () => {
    const token = btoa(`${rideId}-${Date.now()}`);
    return `${window.location.origin}/tracking/live/${token}`;
  };

  const handleAddContact = () => {
    if (contacts.length >= 5) return;
    setContacts([...contacts, { name: '', method: 'whatsapp', value: '' }]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleContactChange = (index: number, field: keyof Contact, val: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: val };
    setContacts(updated);
  };

  const handleCopyLink = async () => {
    const link = shareLink || generateLink();
    if (!shareLink) setShareLink(link);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      linkRef.current?.select();
      document.execCommand('copy');
    }
  };

  const handleShare = async () => {
    const validContacts = contacts.filter(c => c.value.trim());
    if (validContacts.length === 0) return;

    setSending(true);
    const link = shareLink || generateLink();
    if (!shareLink) setShareLink(link);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`${API_BASE}/transport/${rideId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          contacts: validContacts,
          trackingLink: link,
          origin,
          destination,
        }),
      });

      if (!res.ok) {
        // Servidor devolvió error — usar fallback WhatsApp
        throw new Error(`HTTP ${res.status}`);
      }

      setSent(true);
    } catch {
      // Fallback: abrir WhatsApp directo para cada contacto
      validContacts
        .filter(c => c.method === 'whatsapp')
        .forEach(c => {
          const phone = c.value.replace(/\D/g, '');
          if (!phone) return; // Ignorar si quedó vacío tras limpiar
          const msg = encodeURIComponent(
            `Estoy viajando con Going de ${origin} a ${destination}. Sigue mi viaje en tiempo real: ${link}`
          );
          window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
        });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0033A0]/5 hover:bg-[#0033A0]/10 border border-[#0033A0]/20 transition-all text-sm font-semibold text-[#0033A0]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Compartir ubicación
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Compartir viaje</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {sent ? (
        /* Estado de éxito */
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 mb-1">¡Viaje compartido!</p>
          <p className="text-sm text-gray-500">Tus contactos podrán seguir tu ubicación en tiempo real.</p>
          <button
            onClick={() => { setSent(false); setContacts([{ name: '', method: 'whatsapp', value: '' }]); }}
            className="mt-4 text-sm text-[#0033A0] font-semibold hover:underline"
          >
            Compartir con más personas
          </button>
        </div>
      ) : (
        <>
          {/* Enlace rápido */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Enlace de tracking</label>
            <div className="flex gap-2">
              <input
                ref={linkRef}
                type="text"
                readOnly
                value={shareLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/tracking/live/...`}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#0033A0] text-white hover:bg-[#002680]'
                }`}
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Contactos */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">
              Enviar a contactos ({contacts.length}/5)
            </label>
            {contacts.map((contact, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select
                  value={contact.method}
                  onChange={(e) => handleContactChange(idx, 'method', e.target.value)}
                  className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-28"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
                <input
                  type={contact.method === 'email' ? 'email' : 'tel'}
                  placeholder={contact.method === 'email' ? 'correo@email.com' : '+593 999 999 999'}
                  value={contact.value}
                  onChange={(e) => handleContactChange(idx, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400"
                />
                {contacts.length > 1 && (
                  <button
                    onClick={() => handleRemoveContact(idx)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-xs hover:bg-red-100"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {contacts.length < 5 && (
              <button
                onClick={handleAddContact}
                className="text-xs text-[#0033A0] font-semibold hover:underline mt-1"
              >
                + Agregar contacto
              </button>
            )}
          </div>

          {/* Botón enviar */}
          <button
            onClick={handleShare}
            disabled={sending || contacts.every(c => !c.value.trim())}
            className="w-full py-3 rounded-xl font-bold text-white bg-[#0033A0] hover:bg-[#002680] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {sending ? 'Enviando…' : 'Compartir mi viaje'}
          </button>
        </>
      )}
    </div>
  );
}
