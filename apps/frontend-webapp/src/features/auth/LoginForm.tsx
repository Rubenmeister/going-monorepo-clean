import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from './auth.service';
import { AuthLayout } from './AuthLayout';
import { Input, Button } from '../../components/ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.login({ email, password });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Bienvenido de nuevo" 
      subtitle="Ingresa tus datos para acceder a tu cuenta"
    >
      <div className="space-y-6">
        {/* Social Login - Image buttons */}
        <div className="flex justify-center gap-6">
          <button 
            onClick={() => console.log('Google Login')}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Continuar con Google"
          >
            <img src="/assets/google_icon.png" alt="Google" className="w-8 h-8 object-contain" />
          </button>
          <button 
            onClick={() => console.log('Facebook Login')}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Continuar con Facebook"
          >
            <img src="/assets/facebook_icon.png" alt="Facebook" className="w-8 h-8 object-contain" />
          </button>
          <button 
            onClick={() => console.log('Apple Login')}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Continuar con Apple"
          >
            <img src="/assets/apple_icon.png" alt="Apple" className="w-8 h-8 object-contain" />
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">O continúa con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zk" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <div className="space-y-1">
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-brand-red hover:text-red-600 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            isLoading={isLoading}
          >
            Iniciar Sesión
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-semibold text-brand-red hover:text-red-600 transition-colors">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
