import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://164.92.110.179:8100';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await axios.post(`${API_URL}/api/auth/login`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, usuario } = response.data;
      
      // Save token and user info
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(usuario));

      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      console.error('Login error', err);
      setError('Credenciales incorrectas o problema de red.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-gold-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-gold-400 rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
      
      <div className="z-10 w-full max-w-md px-6">
        {/* Logo or Brand */}
        <div className="text-center mb-10 flex flex-col items-center">
          <img src="/logo.png" alt="Casino Prestige Logo" className="h-24 w-auto mb-4 drop-shadow-2xl" />
          <h1 className="text-4xl font-light text-obsidian-50 tracking-widest uppercase mt-2">
            Casino <span className="font-bold text-gold-500">Prestige</span>
          </h1>
          <p className="text-obsidian-400 mt-2 text-sm uppercase tracking-[0.2em]">SmartOps Time</p>
        </div>

        {/* Login Card */}
        <div className="bg-obsidian-900/80 backdrop-blur-xl border border-obsidian-800 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500/50 text-red-200 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-obsidian-300 text-sm font-medium mb-2 uppercase tracking-wider">Usuario o Correo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-obsidian-500" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-obsidian-700 rounded-lg bg-obsidian-950 text-obsidian-50 placeholder-obsidian-600 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                  placeholder="root"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-obsidian-300 text-sm font-medium mb-2 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-obsidian-500" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-obsidian-700 rounded-lg bg-obsidian-950 text-obsidian-50 placeholder-obsidian-600 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-obsidian-950 bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-600 focus:ring-offset-obsidian-900 transition-colors uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-obsidian-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Acceder al Sistema
                </span>
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8 text-obsidian-500 text-xs tracking-wider">
          &copy; {new Date().getFullYear()} SmartOpsia
        </div>
      </div>
    </div>
  );
}
