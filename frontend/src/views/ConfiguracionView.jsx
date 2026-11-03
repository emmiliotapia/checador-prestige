import React, { useState, useEffect, useCallback } from 'react';
import { Save, Key, Shield, RefreshCw, Plus, Trash2, Mail, Edit, Users, Server, Clock, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const AVAILABLE_MODULES = [
  { id: 'empleados', label: 'Directorio' },
  { id: 'horarios', label: 'Turnos' },
  { id: 'areas', label: 'Departamentos' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'configuracion', label: 'Configuración' }
];

const INITIAL_USER_FORM = {
  email: '',
  password: '',
  rol: 'RRHH',
  area_id: '',
  permisos: [],
  tenant_id: MOCK_TENANT_ID
};

export default function ConfiguracionView() {
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingTime, setSyncingTime] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(INITIAL_USER_FORM);

  // Live Clock & Time Sync State
  const [liveTime, setLiveTime] = useState(new Date());
  const [timeSyncMode, setTimeSyncMode] = useState('auto'); // 'auto' | 'custom'
  const [customDateTime, setCustomDateTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"));
  const [tzOffset, setTzOffset] = useState(-8);
  const [rebootOnSync, setRebootOnSync] = useState(false);
  const [lastTimeSyncMsg, setLastTimeSyncMsg] = useState('');

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, areaRes] = await Promise.all([
        api.get(`/usuarios?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/areas?tenant_id=${MOCK_TENANT_ID}`)
      ]);
      setUsers(userRes.data);
      setAreas(areaRes.data);
    } catch (err) {
      console.error("Error al cargar configuración:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      alert("Las contraseñas nuevas no coinciden.");
      return;
    }
    try {
      await api.put('/auth/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      alert("Contraseña actualizada exitosamente.");
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      alert(err.response?.data?.detail || "Error al cambiar contraseña.");
    }
  };

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setFormData(INITIAL_USER_FORM);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    let parsedPermisos = [];
    try {
      parsedPermisos = u.permisos ? JSON.parse(u.permisos) : [];
    } catch {
      parsedPermisos = [];
    }
    setEditingUser(u);
    setFormData({
      email: u.email,
      password: '',
      rol: u.rol,
      area_id: u.area_id || '',
      permisos: Array.isArray(parsedPermisos) ? parsedPermisos : [],
      tenant_id: MOCK_TENANT_ID
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const normalizedAreaId = formData.area_id || null;
      const permisosJson = JSON.stringify(formData.permisos || []);

      if (editingUser) {
        const updatePayload = {
          rol: formData.rol,
          area_id: normalizedAreaId
        };
        if (currentUser.rol === 'ROOT') {
          updatePayload.permisos = permisosJson;
        }
        if (formData.password && formData.password.trim() !== '') {
          updatePayload.password = formData.password;
        }
        await api.put(`/usuarios/${editingUser.id}`, updatePayload);
      } else {
        const createPayload = {
          email: formData.email.trim(),
          password: formData.password,
          rol: formData.rol,
          area_id: normalizedAreaId,
          permisos: currentUser.rol === 'ROOT' ? permisosJson : null,
          tenant_id: MOCK_TENANT_ID
        };
        await api.post('/usuarios', createPayload);
      }

      setShowUserModal(false);
      setEditingUser(null);
      setFormData(INITIAL_USER_FORM);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al guardar usuario.");
    }
  };

  const handleDeleteUser = async (u) => {
    if (window.confirm(`¿Seguro que deseas eliminar la cuenta administrativa "${u.email}"?`)) {
      try {
        await api.delete(`/usuarios/${u.id}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || "Error al eliminar usuario.");
      }
    }
  };

  const handleTogglePermiso = (moduleId) => {
    const current = formData.permisos || [];
    const updated = current.includes(moduleId)
      ? current.filter(id => id !== moduleId)
      : [...current, moduleId];
    setFormData({ ...formData, permisos: updated });
  };

  const handleSyncDevice = async () => {
    setSyncing(true);
    try {
      await api.post('/dispositivos/sync?sn=TODOS');
      alert("Comandos ADMS (RELOAD OPTIONS / RELOAD USERDATA) encolados exitosamente para los dispositivos.");
    } catch (err) {
      alert(err.response?.data?.detail || "Error al encolar sincronización con el dispositivo.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncClockTime = async () => {
    setSyncingTime(true);
    setLastTimeSyncMsg('');
    try {
      const targetIso = timeSyncMode === 'auto'
        ? format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
        : (customDateTime.length === 16 ? `${customDateTime}:00` : customDateTime);

      const res = await api.post('/dispositivos/sync-time', {
        sn: 'TODOS',
        custom_datetime: targetIso,
        tz_offset_hours: Number(tzOffset),
        reboot: rebootOnSync
      });
      setLastTimeSyncMsg(res.data?.message || `Hora (${targetIso.replace('T', ' ')}) enviada a la cola ADMS del reloj.`);
    } catch (err) {
      alert(err.response?.data?.detail || "Error al sincronizar la hora con el reloj biométrico.");
    } finally {
      setSyncingTime(false);
    }
  };

  const visibleUsers = users.filter(u => u.rol !== 'ROOT');
  const adminCount = visibleUsers.filter(u => u.rol === 'ADMIN' || u.rol === 'RRHH').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-obsidian-50 tracking-tight">
            Configuración y Dispositivos
          </h1>
          <p className="text-obsidian-400 text-sm font-medium mt-1">
            Control de acceso por roles (RBAC), sincronización de hora y comandos ADMS para terminales ZKTeco.
          </p>
        </div>
        <button 
          onClick={handleOpenNewUser}
          className="w-full md:w-auto bg-gold-500 text-white dark:text-obsidian-950 px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 hover:bg-gold-600 dark:hover:bg-gold-400 transition-all shadow-md shadow-gold-500/20 font-bold text-sm"
        >
          <Plus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Cuentas del Panel</span>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-500 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5 mt-3">
            <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50">
              {visibleUsers.length}
            </p>
            <span className="text-xs font-medium text-obsidian-400">
              ({adminCount} administrativos)
            </span>
          </div>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Tu Sesión Activa</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-mono text-sm font-bold text-obsidian-50 truncate">{currentUser.email || 'ADMIN'}</p>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {currentUser.rol || 'N/A'}
            </span>
          </div>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Reloj del Sistema</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-mono tabular-nums text-2xl font-bold text-obsidian-50">
              {format(liveTime, 'HH:mm:ss')}
            </p>
            <span className="text-xs font-mono tabular-nums text-obsidian-400 bg-obsidian-950 px-2.5 py-1 rounded-lg border border-obsidian-800">
              UTC{tzOffset >= 0 ? `+${tzOffset}` : tzOffset}:00
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Time Sync + Device Sync + Password */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Sincronización de Hora del Reloj Biométrico (7 cols) */}
        <div className="lg:col-span-7 bg-obsidian-900 border border-obsidian-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-obsidian-800">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-gold-500/15 border border-gold-500/30 rounded-xl flex items-center justify-center text-gold-500">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-obsidian-50">Sincronizar Hora del Reloj Checador</h2>
                  <p className="text-xs text-obsidian-400">Ajusta la fecha, hora exacta y zona horaria en la terminal ZKTeco</p>
                </div>
              </div>

              <div className="inline-flex p-1 bg-obsidian-950 border border-obsidian-800 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setTimeSyncMode('auto')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeSyncMode === 'auto'
                      ? 'bg-gold-500 text-white dark:text-obsidian-950'
                      : 'text-obsidian-400 hover:text-obsidian-100'
                  }`}
                >
                  Hora Actual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomDateTime(format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"));
                    setTimeSyncMode('custom');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeSyncMode === 'custom'
                      ? 'bg-gold-500 text-white dark:text-obsidian-950'
                      : 'text-obsidian-400 hover:text-obsidian-100'
                  }`}
                >
                  Hora Manual
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {timeSyncMode === 'auto' ? (
                <div className="p-5 bg-obsidian-950 border border-obsidian-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-obsidian-400 block">
                      Hora Exacta a Enviar al Reloj
                    </span>
                    <p className="font-mono tabular-nums text-3xl font-extrabold text-gold-500 mt-1">
                      {format(liveTime, 'HH:mm:ss')}
                    </p>
                    <p className="font-mono tabular-nums text-xs text-obsidian-300 mt-0.5">
                      Fecha: {format(liveTime, 'yyyy-MM-dd')}
                    </p>
                  </div>
                  <div className="w-full sm:w-48">
                    <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Zona Horaria</label>
                    <select
                      value={tzOffset}
                      onChange={e => setTzOffset(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono text-xs focus:ring-2 focus:ring-gold-500 outline-none"
                    >
                      <option value={-8}>UTC-08:00 (Tijuana / Pacífico)</option>
                      <option value={-7}>UTC-07:00 (Verano / Sonora)</option>
                      <option value={-6}>UTC-06:00 (Centro CDMX)</option>
                      <option value={-5}>UTC-05:00 (Cancún / Este)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-obsidian-950 border border-obsidian-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                      Fecha y Hora Específica (Segundos incluidos)
                    </label>
                    <input
                      type="datetime-local"
                      step="1"
                      value={customDateTime}
                      onChange={e => setCustomDateTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-obsidian-900 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Zona Horaria del Reloj</label>
                    <select
                      value={tzOffset}
                      onChange={e => setTzOffset(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-obsidian-900 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono text-xs focus:ring-2 focus:ring-gold-500 outline-none"
                    >
                      <option value={-8}>UTC-08:00 (Tijuana / Pacífico)</option>
                      <option value={-7}>UTC-07:00 (Verano / Sonora)</option>
                      <option value={-6}>UTC-06:00 (Centro CDMX)</option>
                      <option value={-5}>UTC-05:00 (Cancún / Este)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rebootOnSync}
                    onChange={e => setRebootOnSync(e.target.checked)}
                    className="w-4 h-4 rounded border-obsidian-700 bg-obsidian-950 accent-gold-500"
                  />
                  <span className="text-xs text-obsidian-300 font-medium">
                    Reiniciar reloj automáticamente tras aplicar la hora (<code className="font-mono text-gold-500">REBOOT</code>)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSyncDevice}
                  disabled={syncing}
                  className="text-xs font-semibold text-obsidian-300 hover:text-gold-500 flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw size={13} className={syncing ? 'animate-spin text-gold-500' : ''} />
                  <span>{syncing ? 'Sincronizando plantilla...' : 'Recargar plantilla de empleados (USERDATA)'}</span>
                </button>
              </div>

              {lastTimeSyncMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{lastTimeSyncMsg} (El reloj lo aplicará en su próximo latido de 15s).</span>
                </div>
              )}
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSyncClockTime}
            disabled={syncingTime}
            className="w-full mt-5 bg-gold-500 text-white dark:text-obsidian-950 py-3 rounded-xl font-bold text-sm hover:bg-gold-600 dark:hover:bg-gold-400 transition-all flex items-center justify-center space-x-2 shadow-md shadow-gold-500/20 disabled:opacity-50"
          >
            <Clock size={17} className={syncingTime ? 'animate-spin' : ''} />
            <span>{syncingTime ? 'Enviando Hora al Reloj...' : 'Sincronizar Hora del Reloj Ahora'}</span>
          </button>
        </div>

        {/* Card 2: Cambio de Contraseña (5 cols) */}
        <div className="lg:col-span-5 bg-obsidian-900 border border-obsidian-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3.5 mb-5 pb-4 border-b border-obsidian-800">
              <div className="w-10 h-10 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center text-gold-500">
                <Key size={19} />
              </div>
              <div>
                <h2 className="text-base font-bold text-obsidian-50">Cambiar Mi Contraseña</h2>
                <p className="text-xs text-obsidian-400">Actualiza la clave de tu cuenta actual</p>
              </div>
            </div>
            <form id="password-form" onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Contraseña Actual</label>
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder-obsidian-500"
                  value={passwords.current_password}
                  onChange={e => setPasswords({...passwords, current_password: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Nueva Contraseña</label>
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder-obsidian-500"
                    value={passwords.new_password}
                    onChange={e => setPasswords({...passwords, new_password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Confirmar</label>
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder-obsidian-500"
                    value={passwords.confirm_password}
                    onChange={e => setPasswords({...passwords, confirm_password: e.target.value})}
                  />
                </div>
              </div>
            </form>
          </div>
          <button 
            type="submit"
            form="password-form"
            className="w-full mt-5 bg-obsidian-950 text-obsidian-100 border border-obsidian-700 py-3 rounded-xl font-bold text-sm hover:bg-gold-500 hover:text-white dark:hover:text-obsidian-950 hover:border-gold-500 transition-all flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>Actualizar Contraseña</span>
          </button>
        </div>
      </div>

      {/* Gestión de Usuarios */}
      <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-obsidian-800 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-obsidian-50">Usuarios y Permisos de Acceso</h2>
            <p className="text-xs text-obsidian-400 mt-0.5">Administra las cuentas y roles del panel administrativo</p>
          </div>
          <span className="text-xs font-semibold text-obsidian-400 bg-obsidian-950 border border-obsidian-800 px-3 py-1 rounded-full">
            {visibleUsers.length} cuentas
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-obsidian-950/60 text-obsidian-400 text-xs font-semibold border-b border-obsidian-800">
                <th className="px-6 py-3.5">Usuario / Correo</th>
                <th className="px-6 py-3.5">Rol</th>
                <th className="px-6 py-3.5">Departamento Asignado</th>
                {currentUser.rol === 'ROOT' && (
                  <th className="px-6 py-3.5">Módulos Habilitados</th>
                )}
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800/70">
              {loading ? (
                <tr>
                  <td colSpan={currentUser.rol === 'ROOT' ? 5 : 4} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    Cargando cuentas de usuario...
                  </td>
                </tr>
              ) : visibleUsers.map(u => {
                let userModules = [];
                try {
                  userModules = u.permisos ? JSON.parse(u.permisos) : [];
                } catch {
                  userModules = [];
                }
                const hasCustomModules = Array.isArray(userModules) && userModules.length > 0;

                return (
                  <tr key={u.id} className="hover:bg-obsidian-950/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center text-gold-500">
                          <Mail size={15} />
                        </div>
                        <span className="text-obsidian-50 font-mono text-sm font-bold">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        u.rol === 'ADMIN' 
                          ? 'bg-gold-500/15 text-gold-600 dark:text-gold-400 border-gold-500/30' 
                          : u.rol === 'RRHH'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-obsidian-950 text-obsidian-300 border-obsidian-700'
                      }`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-obsidian-950 text-obsidian-200 rounded-lg text-xs font-semibold border border-obsidian-800">
                        {areas.find(a => a.id === u.area_id)?.nombre_area || 'Todos los Departamentos'}
                      </span>
                    </td>
                    {currentUser.rol === 'ROOT' && (
                      <td className="px-6 py-4">
                        {hasCustomModules ? (
                          <div className="flex flex-wrap gap-1.5">
                            {userModules.map(modId => (
                              <span key={modId} className="px-2.5 py-0.5 bg-obsidian-950 border border-obsidian-800 text-obsidian-200 rounded-md text-xs font-medium capitalize">
                                {modId}
                              </span>
                            ))}
                          </div>
                        ) : (u.rol === 'ADMIN' || u.rol === 'RRHH') ? (
                          <span className="text-xs text-obsidian-300 font-medium">Acceso Total (Por defecto)</span>
                        ) : (
                          <span className="text-xs text-obsidian-400 italic">Solo Panel en Vivo</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenEditUser(u)}
                          className="p-2 bg-obsidian-950 border border-obsidian-800 text-obsidian-300 rounded-xl hover:bg-gold-500 hover:text-white dark:hover:text-obsidian-950 hover:border-gold-500 transition-all"
                          title="Editar Usuario"
                        >
                          <Edit size={15} />
                        </button>
                        {(currentUser.rol === 'ROOT' || currentUser.rol === 'ADMIN') && u.rol !== 'ROOT' && String(u.id) !== String(currentUser.id) && (
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 bg-obsidian-950 border border-obsidian-800 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                            title="Eliminar Usuario"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-7">
            <h3 className="text-xl font-bold text-obsidian-50 mb-1">
              {editingUser ? 'Editar Cuenta de Usuario' : 'Crear Nueva Cuenta'}
            </h3>
            <p className="text-xs text-obsidian-400 mb-6">Asigna el rol jerárquico y departamento de la cuenta.</p>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                  Usuario o Correo Electrónico
                </label>
                <input 
                  required
                  disabled={!!editingUser}
                  type="text" 
                  placeholder="usuario@casinoprestige.com"
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono text-sm outline-none focus:ring-2 focus:ring-gold-500 disabled:opacity-50"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                  {editingUser ? 'Nueva Contraseña (Opcional - Solo ROOT)' : 'Contraseña Inicial'}
                </label>
                <input 
                  required={!editingUser}
                  type="password" 
                  placeholder={editingUser ? 'Dejar vacío para conservar la actual' : '••••••••'}
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm outline-none focus:ring-2 focus:ring-gold-500 placeholder-obsidian-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Rol</label>
                  <select 
                    className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm outline-none focus:ring-2 focus:ring-gold-500"
                    value={formData.rol}
                    onChange={e => setFormData({...formData, rol: e.target.value})}
                  >
                    <option value="ADMIN">ADMIN (Total)</option>
                    <option value="RRHH">RRHH (Personal)</option>
                    <option value="MANAGER">MANAGER (Por Área)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Departamento</label>
                  <select 
                    className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm outline-none focus:ring-2 focus:ring-gold-500"
                    value={formData.area_id}
                    onChange={e => setFormData({...formData, area_id: e.target.value})}
                  >
                    <option value="">Todos</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre_area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {currentUser.rol === 'ROOT' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-obsidian-300">
                      Permisos por Módulo (Exclusivo ROOT)
                    </label>
                    <span className="text-xs font-medium text-gold-500">
                      {formData.permisos?.length || 0} seleccionados
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 bg-obsidian-950 p-3.5 rounded-xl border border-obsidian-800">
                    {AVAILABLE_MODULES.map(module => {
                      const isChecked = formData.permisos?.includes(module.id);
                      return (
                        <label key={module.id} className="flex items-center space-x-2.5 cursor-pointer group">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-obsidian-700 bg-obsidian-900 accent-gold-500 focus:ring-gold-500"
                            checked={!!isChecked}
                            onChange={() => handleTogglePermiso(module.id)}
                          />
                          <span className={`text-xs font-semibold transition-colors ${
                            isChecked ? 'text-gold-600 dark:text-gold-400' : 'text-obsidian-300 group-hover:text-obsidian-50'
                          }`}>
                            {module.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-obsidian-400 mt-1.5 leading-snug">
                    Para <strong>ADMIN/RRHH</strong>, sin marcar otorga acceso total. Para <strong>MANAGER</strong>, marca los módulos que podrá ver.
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => { setShowUserModal(false); setEditingUser(null); }} 
                  className="flex-1 py-3 border border-obsidian-700 text-obsidian-300 rounded-xl font-semibold text-sm hover:bg-obsidian-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gold-500 text-white dark:text-obsidian-950 rounded-xl font-bold text-sm hover:bg-gold-600 dark:hover:bg-gold-400 transition-colors shadow-md shadow-gold-500/20"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
