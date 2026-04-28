import React, { useState } from 'react';
import { Settings, Lock, CheckCircle } from 'lucide-react';
import api from '../api';

export default function ConfiguracionView() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Las nuevas contraseñas no coinciden', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setMessage({ text: 'Contraseña actualizada exitosamente', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || 'Error al cambiar la contraseña', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="text-gold-600" size={24} />
          <h2 className="text-2xl font-bold text-slate-800">Configuración de Cuenta</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Perfil de Usuario</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider">Correo Electrónico</p>
                <p className="font-medium text-slate-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider">Rol en el Sistema</p>
                <span className="inline-block px-3 py-1 bg-gold-100 text-gold-800 font-bold rounded-full text-xs mt-1">
                  {user.rol}
                </span>
                {user.rol === 'ROOT' && (
                  <p className="text-xs text-slate-400 mt-2 italic">Eres el administrador principal (Modo Dios).</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
              <Lock size={18} /> Cambiar Contraseña
            </h3>
            
            {message.text && (
              <div className={`p-3 mb-4 text-sm rounded-lg flex items-center gap-2 ${
                message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'
              }`}>
                {message.type === 'success' && <CheckCircle size={16} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-obsidian-900 text-gold-400 py-2 rounded-lg font-bold hover:bg-obsidian-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
