import { useState, useEffect } from 'react';
import { Save, Key, User, Shield, RefreshCw, Plus, Trash2, Mail } from 'lucide-react';
import api from '../api';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function ConfiguracionView() {
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    rol: 'RRHH',
    area_id: '',
    tenant_id: MOCK_TENANT_ID
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, areaRes] = await Promise.all([
        api.get(`/usuarios?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/areas?tenant_id=${MOCK_TENANT_ID}`)
      ]);
      setUsers(userRes.data);
      setAreas(areaRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      alert("Las contraseñas no coinciden");
      return;
    }
    try {
      await api.put('/auth/password', passwords);
      alert("Contraseña actualizada");
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      alert("Error al cambiar contraseña");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', newUser);
      setShowUserModal(false);
      setNewUser({ email: '', password: '', rol: 'RRHH', area_id: '', tenant_id: MOCK_TENANT_ID });
      fetchData();
    } catch (err) {
      alert("Error al crear usuario");
    }
  };

  const handleSyncDevice = async () => {
    setSyncing(true);
    try {
      await api.post('/dispositivos/sync?sn=TODOS');
      alert("Comandos de sincronización encolados exitosamente.");
    } catch (err) {
      alert("Error al sincronizar dispositivo.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-obsidian-50 tracking-wide uppercase">Configuración del <span className="font-bold text-gold-500">Sistema</span></h1>
        <p className="text-obsidian-400 mt-1">Gestiona usuarios, seguridad y sincronización con hardware.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cambio de Contraseña */}
        <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gold-500/10 rounded-lg text-gold-500">
              <Key size={24} />
            </div>
            <h2 className="text-xl font-bold text-obsidian-100 uppercase tracking-wider">Seguridad</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-obsidian-400 mb-1 uppercase tracking-widest">Contraseña Actual</label>
              <input 
                required
                type="password" 
                className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                value={passwords.current_password}
                onChange={e => setPasswords({...passwords, current_password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-obsidian-400 mb-1 uppercase tracking-widest">Nueva Contraseña</label>
              <input 
                required
                type="password" 
                className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                value={passwords.new_password}
                onChange={e => setPasswords({...passwords, new_password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-obsidian-400 mb-1 uppercase tracking-widest">Confirmar Contraseña</label>
              <input 
                required
                type="password" 
                className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                value={passwords.confirm_password}
                onChange={e => setPasswords({...passwords, confirm_password: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full mt-4 bg-gold-500 text-obsidian-950 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-gold-400 transition-colors flex items-center justify-center space-x-2"
            >
              <Save size={18} />
              <span>Actualizar Contraseña</span>
            </button>
          </form>
        </div>

        {/* Dispositivos / Sincronización */}
        <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gold-500/10 rounded-lg text-gold-500">
              <RefreshCw size={24} />
            </div>
            <h2 className="text-xl font-bold text-obsidian-100 uppercase tracking-wider">Dispositivos</h2>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-obsidian-950 border border-obsidian-800 rounded-xl">
              <p className="text-obsidian-300 text-sm mb-4">Envía todos los empleados y configuraciones actuales al reloj checador para asegurar que estén sincronizados.</p>
              <button 
                onClick={handleSyncDevice}
                disabled={syncing}
                className="w-full bg-obsidian-800 text-gold-500 border border-gold-500/30 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-obsidian-950 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Sincronizando...' : 'Sincronizar Reloj'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de Usuarios */}
      <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-obsidian-800 flex justify-between items-center bg-obsidian-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gold-500/10 rounded-lg text-gold-500">
              <Shield size={24} />
            </div>
            <h2 className="text-xl font-bold text-obsidian-100 uppercase tracking-wider">Gestión de Usuarios</h2>
          </div>
          <button 
            onClick={() => setShowUserModal(true)}
            className="bg-gold-500 text-obsidian-950 px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-gold-400 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-obsidian-950/50 text-obsidian-400 text-xs uppercase tracking-widest font-bold">
                <th className="px-8 py-4">Usuario / Email</th>
                <th className="px-8 py-4">Rol</th>
                <th className="px-8 py-4">Área Asignada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-obsidian-800/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center space-x-3">
                      <Mail size={16} className="text-gold-500" />
                      <span className="text-obsidian-100 font-bold">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      u.rol === 'ROOT' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      u.rol === 'ADMIN' ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' :
                      'bg-obsidian-800 text-obsidian-400 border-obsidian-700'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-obsidian-400 text-sm uppercase">
                    {areas.find(a => a.id === u.area_id)?.nombre_area || 'Acceso Total'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-8">
            <h3 className="text-2xl font-light text-obsidian-50 tracking-wide uppercase mb-6">Nuevo <span className="font-bold text-gold-500">Usuario</span></h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Email</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Contraseña Inicial</label>
                <input 
                  required
                  type="password" 
                  className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Rol</label>
                <select 
                  className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500"
                  value={newUser.rol}
                  onChange={e => setNewUser({...newUser, rol: e.target.value})}
                >
                  <option value="ADMIN">ADMIN (Acceso Total)</option>
                  <option value="RRHH">RRHH (Personal/Horarios)</option>
                  <option value="MANAGER">MANAGER (Solo su área)</option>
                </select>
              </div>
              {newUser.rol === 'MANAGER' && (
                <div>
                  <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Área Asignada</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500"
                    value={newUser.area_id}
                    onChange={e => setNewUser({...newUser, area_id: e.target.value})}
                  >
                    <option value="">Seleccionar área...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre_area}</option>)}
                  </select>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 border border-obsidian-700 text-obsidian-400 rounded-lg font-bold uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-gold-500 text-obsidian-950 rounded-lg font-bold uppercase text-xs tracking-widest">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
