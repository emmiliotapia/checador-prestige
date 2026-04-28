import React, { useState, useEffect } from 'react';
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

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function InicioView() {
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.get(`/registros/recientes`, {
          params: { tenant_id: MOCK_TENANT_ID, limit: 10 }
        });
        setRecentRecords(response.data);
      } catch (error) {
        console.error("Error fetching recent records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gold-600 to-gold-700 p-6 rounded-2xl text-white shadow-xl shadow-gold-100">
          <p className="text-gold-100 text-sm font-medium uppercase tracking-wider">Asistencias Hoy</p>
          <p className="text-4xl font-light mt-1">{recentRecords.length}</p>
        </div>
      </div>

      <div className="bg-obsidian-900 rounded-2xl border border-obsidian-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-obsidian-800 bg-obsidian-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Activity className="text-gold-500" size={20} />
            <h3 className="text-lg font-bold text-obsidian-50 uppercase tracking-widest">Actividad Reciente</h3>
          </div>
          <span className="text-xs font-bold text-gold-600 uppercase tracking-wider bg-gold-500/10 px-2 py-1 rounded">Actualización en vivo</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950/50 text-obsidian-400 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-obsidian-800">Empleado</th>
                <th className="px-6 py-4 border-b border-obsidian-800">Hora</th>
                <th className="px-6 py-4 border-b border-obsidian-800">Tipo</th>
                <th className="px-6 py-4 border-b border-obsidian-800">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-obsidian-500 uppercase tracking-widest text-sm">Cargando actividad...</td>
                </tr>
              ) : recentRecords.length > 0 ? (
                recentRecords.map((reg) => (
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
    switch (view) {
      case 'inicio': return <InicioView />;
      case 'empleados': return <DirectorioView />;
      case 'reportes': return <ReportesView />;
      case 'areas': return <AreasView />;
      case 'configuracion': return <ConfiguracionView />;
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
