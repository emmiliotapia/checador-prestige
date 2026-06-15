import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { format } from 'date-fns';
import { Activity, Clock, CheckCircle, AlertCircle, LogOut, Edit, Trash2, Search } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedArea]);

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

      // Especial para fechas
      if (key === 'timestamp_checada') {
        const valA = new Date(a[key]).getTime();
        const valB = new Date(b[key]).getTime();
        return (valA - valB) * direction;
      }

      // Para otros campos
      const valA = a[key]?.toString().toLowerCase() || '';
      const valB = b[key]?.toString().toLowerCase() || '';
      
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }, [recentRecords, sortConfig, searchTerm]);

  const handleEditClick = (reg) => {
    setEditingRecord(reg);
    // Format timestamp for datetime-local input in local time
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
      // Refresh data
      window.location.reload(); // Quick refresh or re-fetch
    } catch (error) {
      alert("Error al editar registro");
    }
  };

  const handleDeleteRecord = async (reg) => {
    if (window.confirm(`¿Seguro que quieres eliminar la checada de ${reg.nombre_empleado}?`)) {
      try {
        await api.delete(`/registros/${reg.id}`);
        window.location.reload();
      } catch (error) {
        alert("Error al eliminar registro");
      }
    }
  };

  const todayStr = format(new Date(), "eeee, d 'de' MMMM");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-light text-obsidian-50 tracking-wide uppercase">Estado del <span className="font-bold text-gold-500">Casino</span></h2>
            <p className="text-obsidian-400 text-sm font-medium capitalize">{todayStr}</p>
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="flex-1 md:w-64 px-4 py-2 bg-obsidian-900 border border-obsidian-800 rounded-lg text-gold-50 text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all uppercase font-bold tracking-tighter"
            >
              <option value="">Todas las Áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre_area}</option>
              ))}
            </select>
            <span className="text-xs font-bold text-gold-600 uppercase tracking-wider bg-gold-500/10 px-3 py-1.5 rounded-full border border-gold-500/20 animate-pulse whitespace-nowrap">En vivo</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gold-600 to-gold-700 p-6 rounded-2xl text-white shadow-xl shadow-gold-100">
          <div className="flex justify-between items-start">
            <p className="text-gold-100 text-sm font-medium uppercase tracking-wider">Asistencias Hoy</p>
            <CheckCircle size={20} className="text-gold-200" />
          </div>
          <p className="text-4xl font-light mt-1">{stats.asistencias_hoy}</p>
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-xl shadow-black/20">
          <div className="flex justify-between items-start">
            <p className="text-obsidian-400 text-sm font-medium uppercase tracking-wider">Retardos</p>
            <Clock size={20} className="text-yellow-500" />
          </div>
          <p className="text-4xl font-light mt-1 text-yellow-500">{stats.retardos_hoy}</p>
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-xl shadow-black/20">
          <div className="flex justify-between items-start">
            <p className="text-obsidian-400 text-sm font-medium uppercase tracking-wider">Faltas</p>
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <p className="text-4xl font-light mt-1 text-red-500">{stats.faltas_hoy}</p>
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-xl shadow-black/20">
          <div className="flex justify-between items-start">
            <p className="text-obsidian-400 text-sm font-medium uppercase tracking-wider">Empleados Activos</p>
            <Activity size={20} className="text-gold-500" />
          </div>
          <p className="text-4xl font-light mt-1 text-gold-500">{stats.empleados_totales}</p>
        </div>
      </div>

      <div className="bg-obsidian-900 rounded-2xl border border-obsidian-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-obsidian-800 bg-obsidian-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Activity className="text-gold-500" size={20} />
            <h3 className="text-lg font-bold text-obsidian-50 uppercase tracking-widest">Actividad Reciente</h3>
          </div>
          <div className="w-full md:w-64 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={16} />
             <input 
               type="text" 
               placeholder="Buscar empleado..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-obsidian-900 border border-obsidian-800 rounded-lg text-gold-50 text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder-obsidian-500"
             />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950/50 text-obsidian-400 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th 
                  className="px-6 py-4 border-b border-obsidian-800 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => handleSort('nombre_empleado')}
                >
                  Empleado {sortConfig.key === 'nombre_empleado' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 border-b border-obsidian-800 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => handleSort('timestamp_checada')}
                >
                  Fecha y Hora {sortConfig.key === 'timestamp_checada' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 border-b border-obsidian-800">Tipo</th>
                {user.rol === 'ROOT' && <th className="px-6 py-4 border-b border-obsidian-800 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800">
              {loading ? (
                <tr>
                  <td colSpan={user.rol === 'ROOT' ? 4 : 3} className="px-6 py-12 text-center text-obsidian-500 uppercase tracking-widest text-sm">Cargando actividad...</td>
                </tr>
              ) : sortedRecords.length > 0 ? (
                sortedRecords.map((reg) => (
                  <tr key={reg.id} className="hover:bg-obsidian-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gold-500/10 text-gold-500 rounded-full flex items-center justify-center font-bold text-sm border border-gold-500/20 uppercase">
                          {reg.nombre_empleado.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-obsidian-100 uppercase">{reg.nombre_empleado}</p>
                          <p className="text-xs text-gold-500/70 font-mono">ID: {reg.id_reloj}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-obsidian-100 text-sm font-bold tracking-wider">
                      <div className="flex flex-col">
                        <span className="text-xs text-obsidian-400 font-mono">{format(new Date(reg.timestamp_checada), 'yyyy-MM-dd')}</span>
                        <span>{format(new Date(reg.timestamp_checada), 'HH:mm:ss')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        reg.tipo_registro === '0' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : reg.tipo_registro === '1'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : reg.tipo_registro === '2'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {reg.tipo_registro === '0' ? 'Entrada' : reg.tipo_registro === '1' ? 'Salida' : reg.tipo_registro === '2' ? 'Inicio Comida' : 'Fin Comida'}
                      </span>
                    </td>
                    {user.rol === 'ROOT' && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleEditClick(reg)}
                          className="p-2 bg-obsidian-800 text-gold-500 rounded-lg hover:bg-gold-500 hover:text-obsidian-950 transition-all mr-2"
                          title="Editar Registro"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(reg)}
                          className="p-2 bg-obsidian-800 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          title="Eliminar Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user.rol === 'ROOT' ? 4 : 3} className="px-6 py-12 text-center text-obsidian-500 italic">
                    No hay actividad reciente registrada o no coincide con tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición (Solo para ROOT) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-8">
            <h3 className="text-2xl font-light text-obsidian-50 tracking-wide uppercase mb-6">Editar <span className="font-bold text-gold-500">Registro</span></h3>
            <p className="text-obsidian-400 text-sm mb-6 uppercase tracking-widest font-bold">{editingRecord.nombre_empleado}</p>
            
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-obsidian-400 mb-2 uppercase tracking-widest">Nueva Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  step="1"
                  required
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500"
                  value={editData.timestamp}
                  onChange={e => setEditData({...editData, timestamp: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-obsidian-400 mb-2 uppercase tracking-widest">Tipo de Marcaje</label>
                <select 
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500"
                  value={editData.tipo}
                  onChange={e => setEditData({...editData, tipo: e.target.value})}
                >
                  <option value="0">ENTRADA</option>
                  <option value="1">SALIDA</option>
                  <option value="2">INICIO COMIDA</option>
                  <option value="3">FIN COMIDA</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="flex-1 py-3 border border-obsidian-700 text-obsidian-400 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-obsidian-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gold-500 text-obsidian-950 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-gold-400 transition-colors"
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

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Extract view from path
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
    // Verificar permisos si el usuario no es ROOT o ADMIN
    const permisos = user.permisos ? JSON.parse(user.permisos) : null;
    
    // Función para validar acceso modular
    const canAccess = (module) => {
      if (user.rol === 'ROOT') return true;
      if (module === 'inicio') return true;
      
      // Si el usuario tiene permisos específicos definidos, usarlos
      const permisosArr = user.permisos ? JSON.parse(user.permisos) : [];
      if (Array.isArray(permisosArr) && permisosArr.length > 0) {
        return permisosArr.includes(module);
      }

      // De lo contrario, ADMIN y RRHH tienen acceso total por defecto
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
      default: return <InicioView />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-obsidian-950 text-gold-500 py-3 px-6 flex justify-between items-center shadow-lg border-b border-obsidian-800">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          <h1 className="text-xl font-light tracking-widest uppercase">Casino <span className="font-bold">Prestige</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-bold text-obsidian-100 uppercase">{user.email?.split('@')[0]}</p>
            <p className="text-xs text-gold-600 uppercase tracking-wider">{user.rol}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-obsidian-900 rounded-lg hover:bg-obsidian-800 transition-colors text-obsidian-300 hover:text-gold-400">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      
      <DashboardLayout currentView={view} setView={setView} user={user}>
        {renderView()}
      </DashboardLayout>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
