/**
 * Página de solicitud de cuenta para Empresas
 * Ruta: /empresas/solicitud
 *
 * Formulario con selector de tipo y campos condicionales
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TIPOS_CUENTA, INDUSTRY_OPTIONS } from "@/lib/empresas/constants";
import { TipoCuenta } from "@/lib/empresas/types";
import { crearSolicitudEmpresa } from "@/lib/empresas/api";

export default function SolicitudPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoBuscado = (searchParams.get("tipo") ?? "negocio") as TipoCuenta;

  const [tipo, setTipo] = useState<TipoCuenta>(tipoBuscado);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    razonSocial: "",
    ruc: "",
    contactoNombre: "",
    contactoEmail: "",
    contactoTelefono: "",
    industria: "",
    ubicacion: "",
    empleadosEstimados: 0,
    descripcionUso: "",
    notas: "",
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: name === "empleadosEstimados" ? parseInt(value) || 0 : value,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validación básica
      if (!formData.razonSocial.trim()) throw new Error("Razón social es requerida");
      if (!formData.ruc.trim()) throw new Error("RUC es requerido");
      if (!formData.contactoEmail.trim()) throw new Error("Email de contacto es requerido");
      if (!formData.contactoNombre.trim()) throw new Error("Nombre de contacto es requerido");

      const payload = {
        tipoCuenta: tipo,
        estado: "prospect",
        ...formData,
      };

      const result = await crearSolicitudEmpresa(payload);

      // Éxito
      setSubmitted(true);
      setTimeout(() => {
        router.push("/empresas");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar solicitud");
    } finally {
      setLoading(false);
    }
  };

  // Mensaje de éxito
  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Solicitud Enviada
          </h2>
          <p className="text-slate-600 mb-6">
            Hemos recibido tu solicitud. Nuestro equipo de ventas se pondrá en contacto en breve.
          </p>
          <p className="text-sm text-slate-500">
            Redirigiendo en 3 segundos...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Solicitar Cuenta
          </h1>
          <p className="text-slate-600 mt-2">
            Completa el formulario para solicitar tu cuenta en Going para Empresas
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Cuenta */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              ¿Qué tipo de cuenta necesitas?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(TIPOS_CUENTA).map(([key, value]: [string, any]) => (
                <label
                  key={key}
                  className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    tipo === key
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={key}
                    checked={tipo === key}
                    onChange={(e) => setTipo(e.target.value as TipoCuenta)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{value.label}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Pago a {value.plazo} días
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2 italic">
              {TIPOS_CUENTA[tipo].descripcion}
            </p>
          </div>

          {/* Razón Social */}
          <div>
            <label htmlFor="razonSocial" className="block text-sm font-semibold text-slate-900 mb-1">
              Razón Social *
            </label>
            <input
              type="text"
              id="razonSocial"
              name="razonSocial"
              value={formData.razonSocial}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {/* RUC */}
          <div>
            <label htmlFor="ruc" className="block text-sm font-semibold text-slate-900 mb-1">
              RUC *
            </label>
            <input
              type="text"
              id="ruc"
              name="ruc"
              value={formData.ruc}
              onChange={handleInputChange}
              placeholder="0123456789001"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {/* Contacto - Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactoNombre" className="block text-sm font-semibold text-slate-900 mb-1">
                Nombre de Contacto *
              </label>
              <input
                type="text"
                id="contactoNombre"
                name="contactoNombre"
                value={formData.contactoNombre}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label htmlFor="contactoEmail" className="block text-sm font-semibold text-slate-900 mb-1">
                Email de Contacto *
              </label>
              <input
                type="email"
                id="contactoEmail"
                name="contactoEmail"
                value={formData.contactoEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="contactoTelefono" className="block text-sm font-semibold text-slate-900 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              id="contactoTelefono"
              name="contactoTelefono"
              value={formData.contactoTelefono}
              onChange={handleInputChange}
              placeholder="+593 99 123 4567"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Industria y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="industria" className="block text-sm font-semibold text-slate-900 mb-1">
                Industria
              </label>
              <select
                id="industria"
                name="industria"
                value={formData.industria}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Selecciona una industria</option>
                {INDUSTRY_OPTIONS.map((ind: string) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ubicacion" className="block text-sm font-semibold text-slate-900 mb-1">
                Ubicación (Ciudad)
              </label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleInputChange}
                placeholder="Quito, Guayaquil, etc."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Empleados Estimados */}
          <div>
            <label htmlFor="empleadosEstimados" className="block text-sm font-semibold text-slate-900 mb-1">
              Empleados Estimados (Para usar Going)
            </label>
            <input
              type="number"
              id="empleadosEstimados"
              name="empleadosEstimados"
              value={formData.empleadosEstimados}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Descripción de Uso */}
          <div>
            <label htmlFor="descripcionUso" className="block text-sm font-semibold text-slate-900 mb-1">
              ¿Cómo planean usar Going para Empresas?
            </label>
            <textarea
              id="descripcionUso"
              name="descripcionUso"
              value={formData.descripcionUso}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Viajes corporativos, viáticos, transporte ejecutivo, etc."
            />
          </div>

          {/* Notas Adicionales */}
          <div>
            <label htmlFor="notas" className="block text-sm font-semibold text-slate-900 mb-1">
              Información Adicional
            </label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Cualquier información relevante..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Enviando..." : "Enviar Solicitud"}
          </button>

          <p className="text-xs text-slate-600 text-center">
            Los campos marcados con * son obligatorios
          </p>
        </form>
      </div>
    </main>
  );
}
