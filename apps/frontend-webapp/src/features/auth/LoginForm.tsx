import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from './auth.service';
import { AuthLayout } from './AuthLayout';
import { Input, Button } from '../../components/ui';
import { SocialLoginButton } from '../../components/ui/SocialLoginButton';

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
        {/* Social Login - Icon buttons */}
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => console.log('Google Login')}
            className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition"
            title="Continuar con Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M21.35,11.1H12v3.8h5.6c-0.2,1.3-0.9,2.4-2,3.1v2.6h3.2c1.9-1.7,3-4.3,3-7.4C21.8,12.3,21.6,11.7,21.35,11.1z" fill="#4285F4"/>
              <path d="M12,21.8c2.7,0,5-0.9,6.7-2.4l-3.2-2.6c-0.9,0.6-2,1-3.4,1c-2.6,0-4.8-1.7-5.6-4.1H3.1v2.5C4.8,19.6,8.2,21.8,12,21.8z" fill="#34A853"/>
              <path d="M6.4,13.7c-0.2-0.7-0.3-1.4-0.3-2.1c0-0.7,0.1-1.4,0.3-2.1V7H3.1C2.4,8.5,2,10.2,2,12c0,1.8,0.4,3.5,1.1,5l3.3-2.5V13.7z" fill="#FBBC05"/>
              <path d="M12,4.8c1.5,0,2.8,0.5,3.8,1.5l2.9-2.9C16.9,1.8,14.7,1,12,1C8.2,1,4.8,3.2,3.1,6.5l3.3,2.5C7.2,6.5,9.4,4.8,12,4.8z" fill="#EA4335"/>
            </svg>
          </button>
          <button 
            onClick={() => console.log('Facebook Login')}
            className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition"
            title="Continuar con Facebook"
          >
            <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          <button 
            onClick={() => console.log('Apple Login')}
            className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition"
            title="Continuar con Apple"
          >
            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.311-1.273 3.714 1.35.104 2.715-.688 3.56-1.701z"/>
            </svg>
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
