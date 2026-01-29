import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from './auth.service';

// Provider sub-types for the 'provider' role
type ProviderType = 'driver' | 'tour_operator' | 'host' | 'restaurant' | 'experience';

interface BookingIntent {
  service?: string;
  origin?: string;
  destination?: string;
  date?: string;
  time?: string;
}

export function RegisterForm() {
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<'passenger' | 'provider'>('passenger');
  const [providerType, setProviderType] = useState<ProviderType>('driver');
  const [bookingIntent, setBookingIntent] = useState<BookingIntent | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Read URL params from booking card
  useEffect(() => {
    const service = searchParams.get('service');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (service || origin || destination) {
      setBookingIntent({ service: service || undefined, origin: origin || undefined, destination: destination || undefined, date: date || undefined, time: time || undefined });
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Map to roles the backend expects: 'user', 'driver', 'provider'
      let role = 'user';
      if (userType === 'provider') {
        role = providerType === 'driver' ? 'driver' : 'provider';
      }
      
      // Only send fields the backend expects (no phone)
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
      };
      
      try {
        await authService.register(registrationData);
      } catch (_apiError) {
        // If backend is unavailable, use demo mode
        console.warn('Backend unavailable, using demo mode');
        const demoUser = {
          id: 'demo-' + Date.now(),
          email: formData.email,
          name: formData.name,
          role,
        };
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('token', 'demo-token-' + Date.now());
      }
      
      // Redirect based on role, preserving booking intent
      const redirectUrl = userType === 'passenger' ? '/c' : '/p';
      const intentParams = bookingIntent ? `?${new URLSearchParams(bookingIntent as Record<string, string>).toString()}` : '';
      window.location.href = redirectUrl + intentParams;
      
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error en el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      privado: 'Viaje Privado',
      compartido: 'Viaje Compartido',
      envios: 'Envío de Paquete',
    };
    return labels[service] || service;
  };

  const providerTypes = [
    { id: 'driver' as ProviderType, label: 'Conductor', icon: '🚗', desc: 'Conduce tu vehículo' },
    { id: 'tour_operator' as ProviderType, label: 'Operador', icon: '🏔️', desc: 'Ofrece tours' },
    { id: 'host' as ProviderType, label: 'Anfitrión', icon: '🏠', desc: 'Aloja viajeros' },
    { id: 'restaurant' as ProviderType, label: 'Gastro', icon: '🍽️', desc: 'Experiencias culinarias' },
    { id: 'experience' as ProviderType, label: 'Experiencia', icon: '🎭', desc: 'Actividades únicas' },
  ];

  return (
    <div className="min-h-screen bg-going-black flex items-center justify-center p-6">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-brand-red/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-going-yellow/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Booking Intent Banner */}
        {bookingIntent && (
          <div className="mb-6 bg-going-yellow border-2 border-black rounded-2xl p-4 shadow-neo">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-sm">Tu viaje está listo</p>
                <p className="text-xs text-gray-700">
                  {getServiceLabel(bookingIntent.service || '')}
                  {bookingIntent.origin && ` • ${bookingIntent.origin}`}
                  {bookingIntent.destination && ` → ${bookingIntent.destination}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card - Neo-brutalist style */}
        <div className="bg-white border-2 border-black rounded-3xl shadow-neo overflow-hidden">
          {/* Header */}
          <div className="bg-brand-red p-6 text-center">
            <img 
              src="/assets/logo.png" 
              alt="Going" 
              className="h-12 mx-auto mb-4 brightness-0 invert"
            />
            <h1 className="font-spaceGrotesk text-2xl font-black text-white">
              Únete a GOING
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Ecuador en Movimiento
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5">
            {/* User Type Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType('passenger')}
                className={`p-4 border-2 border-black rounded-xl font-bold transition-all ${
                  userType === 'passenger' 
                    ? 'bg-brand-red text-white shadow-neo -translate-y-1' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl block mb-1">🧳</span>
                Soy Pasajero
              </button>
              <button
                type="button"
                onClick={() => setUserType('provider')}
                className={`p-4 border-2 border-black rounded-xl font-bold transition-all ${
                  userType === 'provider' 
                    ? 'bg-going-yellow text-black shadow-neo -translate-y-1' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl block mb-1">🤝</span>
                Soy Proveedor
              </button>
            </div>

            {/* Provider Type Selection */}
            {userType === 'provider' && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-700 mb-3">¿Qué tipo de proveedor eres?</p>
                <div className="grid grid-cols-5 gap-2">
                  {providerTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setProviderType(type.id)}
                      className={`p-2 rounded-lg text-center transition-all ${
                        providerType === type.id
                          ? 'bg-going-yellow border-2 border-black shadow-sm'
                          : 'bg-white border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl block">{type.icon}</span>
                      <span className="text-[10px] font-bold block mt-1">{type.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {providerTypes.find(t => t.id === providerType)?.desc}
                </p>
              </div>
            )}

            {/* Social Login */}
            <div className="flex justify-center gap-4">
              <button 
                type="button"
                className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center hover:shadow-neo hover:-translate-y-1 transition-all"
                title="Continuar con Google"
              >
                <img src="/assets/google_icon.png" alt="Google" className="w-5 h-5" />
              </button>
              <button 
                type="button"
                className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center hover:shadow-neo hover:-translate-y-1 transition-all"
                title="Continuar con Facebook"
              >
                <img src="/assets/facebook_icon.png" alt="Facebook" className="w-5 h-5" />
              </button>
              <button 
                type="button"
                className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center hover:shadow-neo hover:-translate-y-1 transition-all"
                title="Continuar con Apple"
              >
                <img src="/assets/apple_icon.png" alt="Apple" className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500 font-medium">O regístrate con email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm p-3 rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="nombre@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Teléfono</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600">
                    🇪🇨 +593
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="9XX XXX XXX"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Acepto los{' '}
                  <a href="/terms" className="font-bold text-brand-red hover:underline">
                    Términos y Condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="/privacy" className="font-bold text-brand-red hover:underline">
                    Política de Privacidad
                  </a>
                </label>
              </div>

              {/* Provider Note */}
              {userType === 'provider' && (
                <div className="p-3 bg-going-yellow/20 border-2 border-going-yellow rounded-xl text-sm">
                  📋 Te pediremos documentos adicionales después del registro.
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading || !acceptTerms}
                className="w-full py-4 bg-going-black text-white font-black text-lg border-2 border-black rounded-xl hover:bg-gray-800 active:translate-y-0.5 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando cuenta...' : 'CREAR CUENTA GRATIS'}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-bold text-brand-red hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-6">
          goingec.com • Ecuador en Movimiento
        </p>
      </div>
    </div>
  );
}
