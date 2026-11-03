import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Clock, CheckCircle, AlertCircle, Edit, Trash2, Search, Building2, ArrowUpDown } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import DirectorioView from './views/DirectorioView';
import ReportesView from './views/ReportesView';
import ConfiguracionView from './views/ConfiguracionView';
import Login from './views/Login';
import AreasView from './views/AreasView';
import HorariosView from './views/HorariosView';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function InicioView({ user }) {
  const [recentRecords, setRecentRecords] = useState([]);
  const [stats, setStats] = useState({ asistencias_hoy: 0, retardos_hoy: 0, faltas_hoy: 0, empleados_totales: 0 });
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp_checada', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para edición de registros (Solo ROOT)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editData, setEditData] = useState({ timestamp: '', tipo: '' });

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get(`/areas`, { params: { tenant_id: MOCK_TENANT_ID } });
        setAreas(res.data);
      } catch (error) {
        console.error("Error fetching areas:", error);
      }
    };
    fetchAreas();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const params = { tenant_id: MOCK_TENANT_ID };
      if (selectedArea) params.area_id = selectedArea;

      const [recordsRes, statsRes] = await Promise.all([
        api.get(`/registros/recientes`, { params: { ...params, limit: 100 } }),
        api.get(`/dashboard/stats`, { params: { ...params, fecha_hoy: today } })
      ]);
      setRecentRecords(recordsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedArea]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRecords = useMemo(() => {
    let filtered = recentRecords;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = recentRecords.filter(r => 
        r.nombre_empleado.toLowerCase().includes(lower) || 
        (r.id_reloj && r.id_reloj.toString().includes(lower))
      );
    }

    return [...filtered].sort((a, b) => {
      const key = sortConfig.key;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;

      if (key === 'timestamp_checada') {
        const valA = new Date(a[key]).getTime();
        const valB = new Date(b[key]).getTime();
        return (valA - valB) * direction;
      }

      const valA = a[key]?.toString().toLowerCase() || '';
      const valB = b[key]?.toString().toLowerCase() || '';
      
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }, [recentRecords, sortConfig, searchTerm]);

  const handleEditClick = (reg) => {
    setEditingRecord(reg);
    const date = new Date(reg.timestamp_checada);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const formattedDate = localDate.toISOString().slice(0, 19);
    setEditData({ timestamp: formattedDate, tipo: reg.tipo_registro });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/registros/${editingRecord.id}`, {
        timestamp_checada: editData.timestamp,
        tipo_registro: editData.tipo
      });
      setShowEditModal(false);
      setEditingRecord(null);
      await fetchData();
    } catch (error) {
      alert("Error al editar registro");
    }
  };

  const handleDeleteRecord = async (reg) => {
    if (window.confirm(`¿Seguro que quieres eliminar la checada de ${reg.nombre_empleado}?`)) {
      try {
        await api.delete(`/registros/${reg.id}`);
        await fetchData();
      } catch (error) {
        alert("Error al eliminar registro");
      }
    }
  };

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="space-y-6">
      {/* Hero Banner / Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-obsidian-50 tracking-tight">
              Monitoreo Operativo
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              En vivo
            </span>
          </div>
          <p className="text-obsidian-400 text-sm font-medium capitalize mt-1">{todayStr}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 border border-obsidian-800 rounded-xl text-obsidian-100 text-sm font-semibold focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            >
              <option value="">Todos los Departamentos</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre_area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm hover:border-gold-500/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Asistencias Hoy</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50 mt-3">{stats.asistencias_hoy}</p>
          <p className="text-xs text-obsidian-400 mt-1">Registros de entrada válidos</p>
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm hover:border-gold-500/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Retardos</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3">{stats.retardos_hoy}</p>
          <p className="text-xs text-obsidian-400 mt-1">Fuera de tolerancia de turno</p>
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm hover:border-gold-500/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Ausencias / Faltas</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-red-600 dark:text-red-400 mt-3">{stats.faltas_hoy}</p>
          <p className="text-xs text-obsidian-400 mt-1">Sin marcaje registrado hoy</p>
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm hover:border-gold-500/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Plantilla Activa</span>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-500 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-gold-500 mt-3">{stats.empleados_totales}</p>
          <p className="text-xs text-obsidian-400 mt-1">Colaboradores dados de alta</p>
        </div>
      </div>

      {/* Live Feed Table */}
      <div className="bg-obsidian-900 rounded-2xl border border-obsidian-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-obsidian-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-obsidian-50">Flujo de Checadas en Tiempo Real</h3>
            <p className="text-xs text-obsidian-400 mt-0.5">Actualización automática cada 10 segundos desde terminales biométricas</p>
          </div>
          <div className="w-full md:w-72 relative">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
             <input 
               type="text" 
               placeholder="Buscar por nombre o ID..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-obsidian-950 border border-obsidian-800 rounded-xl text-obsidian-100 text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder-obsidian-500"
             />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950/60 text-obsidian-400 text-xs font-semibold border-b border-obsidian-800">
              <tr>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => handleSort('nombre_empleado')}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Colaborador</span>
                    <ArrowUpDown size={13} className="opacity-60" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => handleSort('timestamp_checada')}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Fecha y Hora</span>
                    <ArrowUpDown size={13} className="opacity-60" />
                  </div>
                </th>
                <th className="px-6 py-3.5">Evento</th>
                {user.rol === 'ROOT' && <th className="px-6 py-3.5 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800/70">
              {loading ? (
                <tr>
                  <td colSpan={user.rol === 'ROOT' ? 4 : 3} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    Sincronizando registros recientes...
                  </td>
                </tr>
              ) : sortedRecords.length > 0 ? (
                sortedRecords.map((reg) => (
                  <tr key={reg.id} className="hover:bg-obsidian-950/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 bg-gold-500/10 text-gold-500 rounded-xl flex items-center justify-center font-bold text-sm border border-gold-500/20">
                          {reg.nombre_empleado.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-obsidian-50">{reg.nombre_empleado}</p>
                          <p className="text-xs text-obsidian-400 font-mono tabular-nums">PIN #{reg.id_reloj}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col font-mono tabular-nums">
                        <span className="text-sm font-bold text-obsidian-50">{format(new Date(reg.timestamp_checada), 'HH:mm:ss')}</span>
                        <span className="text-xs text-obsidian-400">{format(new Date(reg.timestamp_checada), 'dd/MM/yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        reg.tipo_registro === '0' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' 
                          : reg.tipo_registro === '1'
                          ? 'bg-obsidian-950 text-obsidian-200 border-obsidian-700'
                          : reg.tipo_registro === '2'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                          : 'bg-gold-500/15 text-gold-600 dark:text-gold-400 border-gold-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          reg.tipo_registro === '0' ? 'bg-emerald-500' : reg.tipo_registro === '1' ? 'bg-obsidian-400' : 'bg-amber-500'
                        }`} />
                        {reg.tipo_registro === '0' ? 'Entrada' : reg.tipo_registro === '1' ? 'Salida' : reg.tipo_registro === '2' ? 'Salida a Comer' : 'Regreso de Comer'}
                      </span>
                    </td>
                    {user.rol === 'ROOT' && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => handleEditClick(reg)}
                          className="p-2 bg-obsidian-950 border border-obsidian-800 text-obsidian-300 rounded-xl hover:bg-gold-500 hover:text-white dark:hover:text-obsidian-950 hover:border-gold-500 transition-all mr-2"
                          title="Editar Registro"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(reg)}
                          className="p-2 bg-obsidian-950 border border-obsidian-800 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                          title="Eliminar Registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user.rol === 'ROOT' ? 4 : 3} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    No se encontraron registros recientes con el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición (Solo para ROOT) */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-7">
            <h3 className="text-xl font-bold text-obsidian-50 mb-1">Editar Registro de Asistencia</h3>
            <p className="text-gold-500 text-sm font-semibold mb-6">{editingRecord.nombre_empleado}</p>
            
            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-obsidian-400 mb-2 uppercase tracking-wider">Fecha y Hora Exacta</label>
                <input 
                  type="datetime-local" 
                  step="1"
                  required
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums outline-none focus:ring-2 focus:ring-gold-500"
                  value={editData.timestamp}
                  onChange={e => setEditData({...editData, timestamp: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-400 mb-2 uppercase tracking-wider">Tipo de Marcaje</label>
                <select 
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-medium outline-none focus:ring-2 focus:ring-gold-500"
                  value={editData.tipo}
                  onChange={e => setEditData({...editData, tipo: e.target.value})}
                >
                  <option value="0">Entrada</option>
                  <option value="1">Salida</option>
                  <option value="2">Salida a Comer</option>
                  <option value="3">Regreso de Comer</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditingRecord(null); }} 
                  className="flex-1 py-3 border border-obsidian-700 text-obsidian-300 rounded-xl font-semibold text-sm hover:bg-obsidian-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gold-500 text-white dark:text-obsidian-950 rounded-xl font-bold text-sm hover:bg-gold-400 transition-colors shadow-md shadow-gold-500/20"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MainLayout({ theme, toggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const view = location.pathname.split('/')[1] || 'inicio';

  const setView = (newView) => {
    navigate(`/${newView === 'inicio' ? '' : newView}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderView = () => {
    const canAccess = (module) => {
      if (user.rol === 'ROOT') return true;
      if (module === 'inicio') return true;
      
      const permisosArr = user.permisos ? JSON.parse(user.permisos) : [];
      if (Array.isArray(permisosArr) && permisosArr.length > 0) {
        return permisosArr.includes(module);
      }

      return user.rol === 'ADMIN' || user.rol === 'RRHH';
    };

    switch (view) {
      case 'inicio': return <InicioView user={user} />;
      case 'empleados': 
        return canAccess('empleados') ? <DirectorioView user={user} /> : <Navigate to="/" />;
      case 'reportes': 
        return canAccess('reportes') ? <ReportesView /> : <Navigate to="/" />;
      case 'areas': 
        return canAccess('areas') ? <AreasView /> : <Navigate to="/" />;
      case 'horarios': 
        return canAccess('horarios') ? <HorariosView /> : <Navigate to="/" />;
      case 'configuracion': 
        return canAccess('configuracion') ? <ConfiguracionView /> : <Navigate to="/" />;
      default: return <InicioView user={user} />;
    }
  };

  return (
    <DashboardLayout
      currentView={view}
      setView={setView}
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
    >
      {renderView()}
    </DashboardLayout>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smartops_theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('smartops_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Routes>
      <Route path="/login" element={<Login theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <MainLayout theme={theme} toggleTheme={toggleTheme} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
