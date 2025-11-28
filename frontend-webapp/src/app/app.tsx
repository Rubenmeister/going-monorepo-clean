import { useState } from 'react';

export function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ESTA ES LA CONEXIÓN REAL AL BACKEND
      const response = await fetch('http://localhost:3333/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // SI LLEGAMOS AQUÍ, ES UN ÉXITO
      alert(`✅ ¡LOGIN EXITOSO!\nBienvenido: ${data.user.name}\nRol: ${data.user.role}`);
      console.log('Datos recibidos del backend:', data);

    } catch (error: any) {
      alert(`❌ FALLÓ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-[#ff4c41]">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-black mb-1">Going</h1>
          <p className="text-gray-500 text-sm">Tu viaje comienza aquí</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ff4c41] focus:ring-2 focus:ring-[#ff4c41]/20 outline-none transition-all"
              placeholder="juan@going.app"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
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
            className="w-full bg-[#ff4c41] hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center"
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;