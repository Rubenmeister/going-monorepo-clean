import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from './auth.service';
import { AuthLayout } from './AuthLayout';
import { Input, Button } from '../../components/ui';
import { SocialLoginButton } from '../../components/ui/SocialLoginButton';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.register(formData);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Crea tu cuenta" 
      subtitle="Empieza a planificar tu próxima aventura"
    >
      <div className="space-y-6">
        {/* Social Login */}
        <div className="grid grid-cols-1 gap-3">
          <SocialLoginButton provider="google" onClick={() => console.log('Google Register')} />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">O regístrate con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
             <Input
              label="Nombre Completo"
              type="text"
              name="name"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="nombre@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Contraseña"
              type="password"
              name="password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            isLoading={isLoading}
          >
            Crear Cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-red hover:text-red-600 transition-colors">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
