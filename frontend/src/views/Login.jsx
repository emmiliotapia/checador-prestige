import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, Sun, Moon, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Login({ theme, toggleTheme }) {
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
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(usuario));

      navigate('/');
    } catch (err) {
      console.error('Login error', err);
      setError('Credenciales incorrectas o problema de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-obsidian-100 flex flex-col justify-center items-center px-4 relative transition-colors duration-200">
      {/* Top Right Theme Switcher */}
      {toggleTheme && (
        <div className="fixed top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-obsidian-900 border border-obsidian-800 text-obsidian-200 hover:border-gold-500/40 shadow-sm transition-all text-xs font-semibold"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="text-gold-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-gold-500" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="w-full max-w-[420px]">
        {/* Brand Identity */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-obsidian-900 border border-obsidian-800 rounded-2xl flex items-center justify-center p-3 mb-4 shadow-sm">
            <img src="/logo.png" alt="Casino Prestige Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-obsidian-50 tracking-tight">
            Casino <span className="text-gold-500">Prestige</span>
          </h1>
          <p className="text-obsidian-400 text-xs font-medium mt-1 flex items-center gap-1.5">
            <Sparkles size={13} className="text-gold-500" />
            <span>Plataforma de Control de Asistencia y Nómina</span>
          </p>
        </div>

        {/* Modern Card */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-8 rounded-2xl shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-obsidian-50">Iniciar Sesión</h2>
            <p className="text-xs text-obsidian-400 mt-0.5">Ingresa tus credenciales administrativas para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-obsidian-300 text-xs font-semibold mb-2">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-obsidian-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-obsidian-800 rounded-xl bg-obsidian-950 text-obsidian-50 text-sm placeholder-obsidian-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                  placeholder="ejemplo@casinoprestige.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-obsidian-300 text-xs font-semibold mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-obsidian-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-obsidian-800 rounded-xl bg-obsidian-950 text-obsidian-50 text-sm placeholder-obsidian-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md shadow-gold-500/20 text-sm font-bold text-white dark:text-obsidian-950 bg-gold-500 hover:bg-gold-600 dark:hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Verificando acceso...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Entrar al Panel</span>
                </span>
              )}
            </button>
          </form>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mt-8 text-obsidian-400 text-xs font-medium">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>Conectado con Servidor Biométrico ADMS · {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
