import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

export default function EnterpriseLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useEnterpriseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!tenantId) {
      setError('Por favor ingresa el ID de tu empresa');
      setLoading(false);
      return;
    }

    try {
      await login(email, password, tenantId);
      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            <span className="text-[#ff4c41]">Going</span> Enterprise
          </h1>
          <p className="text-slate-400 mt-2">Portal Corporativo B2B</p>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1e40af] flex items-center justify-center text-white">📊</div>
            <div>
              <h3 className="text-white font-medium">Control total de gastos</h3>
              <p className="text-slate-400 text-sm">Visualiza y controla el gasto de transporte de tu empresa en tiempo real.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1e40af] flex items-center justify-center text-white">👥</div>
            <div>
              <h3 className="text-white font-medium">Gestión de usuarios</h3>
              <p className="text-slate-400 text-sm">Administra los permisos y límites de cada colaborador.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1e40af] flex items-center justify-center text-white">📄</div>
            <div>
              <h3 className="text-white font-medium">Facturación consolidada</h3>
              <p className="text-slate-400 text-sm">Recibe una sola factura mensual con todos los viajes de tu empresa.</p>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-sm">
          © 2024 Going. Todos los derechos reservados.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-[#ff4c41]">Going</span> Enterprise
            </h1>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Iniciar sesión</h2>
            <p className="text-slate-500 mb-8">Accede al portal de tu empresa</p>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="form-label">ID de Empresa</label>
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="form-input"
                  placeholder="ej: acme-corp"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="rounded" />
                  Recordarme
                </label>
                <a href="/forgot-password" className="text-[#1e40af] hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center py-3"
              >
                {loading ? 'Iniciando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-8">
              ¿Necesitas una cuenta empresarial?{' '}
              <a href="/contact" className="text-[#1e40af] hover:underline">
                Contacta a ventas
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
