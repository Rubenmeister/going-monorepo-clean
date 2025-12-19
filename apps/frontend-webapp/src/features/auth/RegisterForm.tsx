import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from './auth.service';
import { AuthLayout } from './AuthLayout';
import { Input, Button } from '../../components/ui';

export function RegisterForm() {
  const [role, setRole] = useState<'user' | 'driver' | 'provider'>('user');
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
      // Pass role to register function. Backend should handle 'user' maps to 'customer' role, etc.
      await authService.register({ ...formData, role });
      
      // Redirect based on role
      if (role === 'user') window.location.href = '/c'; // Customer Dashboard
      else window.location.href = '/p'; // Provider Dashboard
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Crea tu cuenta GOING" 
      subtitle="Únete a la comunidad líder en movilidad y experiencias en Ecuador"
    >
      <div className="space-y-6">
        
        {/* Role Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'user' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pasajero
          </button>
          <button
            type="button"
            onClick={() => setRole('driver')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'driver' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Conductor
          </button>
          <button
            type="button"
            onClick={() => setRole('provider')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'provider' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Anfitrión
          </button>
        </div>

        {/* Dynamic Description based on Role */}
        <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
          {role === 'user' && "Accede a viajes, envíos y experiencias únicas por todo el país."}
          {role === 'driver' && "Genera ingresos conduciendo tu vehículo propio con horarios flexibles."}
          {role === 'provider' && "Publica tus tours, alojamientos o experiencias y llega a miles de usuarios."}
        </div>

        {/* Social Login - Image buttons */}
        <div className="flex justify-center gap-6">
          <button 
            type="button"
            onClick={() => console.log('Google Login')}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Continuar con Google"
          >
            <img src="/assets/google_icon.png" alt="Google" className="w-8 h-8 object-contain" />
          </button>
          <button 
            type="button"
            onClick={() => console.log('Facebook Login')}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Continuar con Facebook"
          >
            <img src="/assets/facebook_icon.png" alt="Facebook" className="w-8 h-8 object-contain" />
          </button>
          <button 
            type="button"
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

            {(role === 'driver' || role === 'provider') && (
               <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                 🔔 Te pediremos más detalles (vehículo, documentos) en el siguiente paso.
               </div>
            )}
          </div>

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            isLoading={isLoading}
          >
            {role === 'user' ? 'Crear Cuenta' : 'Continuar Registro'}
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
