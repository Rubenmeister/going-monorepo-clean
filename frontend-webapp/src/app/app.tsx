import { useState } from 'react';

export function App() {
  // Estado para alternar entre Login y Registro
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Datos del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Decidimos a qué endpoint llamar
    const endpoint = isLoginView ? 'login' : 'register';
    const url = `http://localhost:3333/api/auth/${endpoint}`;
    
    // Preparamos los datos (Nombre solo va si es registro)
    const bodyData = isLoginView 
      ? { email, password } 
      : { name, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }

      // Éxito
      if (isLoginView) {
        alert('LOGIN EXITOSO\nBienvenido: ' + data.user.name);
      } else {
        alert('REGISTRO EXITOSO\nAhora inicia sesión.');
        setIsLoginView(true); // Ir al login
      }

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-[#ff4c41]">
        
        {/* Cabecera */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-black mb-1">Going</h1>
          <p className="text-gray-500 text-sm">
            {isLoginView ? 'Tu viaje comienza aquí' : 'Únete como socio conductor'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Campo Nombre (Solo en Registro) */}
          {!isLoginView && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ff4c41] focus:ring-2 focus:ring-[#ff4c41]/20 outline-none transition-all"
                placeholder="Ej. Juan Piloto"
                required={!isLoginView}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ff4c41] focus:ring-2 focus:ring-[#ff4c41]/20 outline-none transition-all"
              placeholder="conductor@going.app"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ff4c41] focus:ring-2 focus:ring-[#ff4c41]/20 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#ff4c41] hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-red-500/30"
          >
            {isLoading ? 'Procesando...' : (isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        {/* Interruptor Login/Registro */}
        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-gray-600 text-sm mb-2">
            {isLoginView ? '¿Aún no eres socio?' : '¿Ya tienes cuenta?'}
          </p>
          <button 
            onClick={() => setIsLoginView(!isLoginView)}
            className="text-[#ff4c41] font-black hover:underline text-base"
          >
            {isLoginView ? 'Regístrate Gratis' : 'Ingresa Aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;