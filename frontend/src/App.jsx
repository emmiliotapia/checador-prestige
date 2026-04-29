import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { format } from 'date-fns';
import { Activity, Clock, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import DirectorioView from './views/DirectorioView';
import ReportesView from './views/ReportesView';
import ConfiguracionView from './views/ConfiguracionView';
import Login from './views/Login';
import AreasView from './views/AreasView';
import HorariosView from './views/HorariosView';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function InicioView() {
  const [recentRecords, setRecentRecords] = useState([]);
  const [stats, setStats] = useState({ asistencias_hoy: 0, retardos_hoy: 0, faltas_hoy: 0, empleados_totales: 0 });
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp_checada', direction: 'desc' });

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
    return [...recentRecords].sort((a, b) => {
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
  }, [recentRecords, sortConfig]);

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
        <div className="p-6 border-b border-obsidian-800 bg-obsidian-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Activity className="text-gold-500" size={20} />
            <h3 className="text-lg font-bold text-obsidian-50 uppercase tracking-widest">Actividad Reciente</h3>
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
                  Hora {sortConfig.key === 'timestamp_checada' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 border-b border-obsidian-800">Tipo</th>
                <th className="px-6 py-4 border-b border-obsidian-800">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-obsidian-500 uppercase tracking-widest text-sm">Cargando actividad...</td>
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
                      {format(new Date(reg.timestamp_checada), 'HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        reg.tipo_registro === '0' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {reg.tipo_registro === '0' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-obsidian-400 text-xs font-mono">
                      {reg.dispositivo_sn || 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-obsidian-500 italic">
                    No hay actividad reciente registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
    
    // Función para validar acceso
    const canAccess = (module) => {
      if (user.rol === 'ROOT' || user.rol === 'ADMIN') return true;
      if (!permisos) return false;
      return permisos.includes(module);
    };

    switch (view) {
      case 'inicio': return <InicioView />;
      case 'empleados': 
        return canAccess('empleados') ? <DirectorioView /> : <Navigate to="/" />;
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
      
      <DashboardLayout currentView={view} setView={setView}>
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
