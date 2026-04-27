import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import DirectorioView from './views/DirectorioView';
import ReportesView from './views/ReportesView';

const API_BASE = 'http://164.92.110.179:8100/api';
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function InicioView() {
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await axios.get(`${API_BASE}/registros/recientes`, {
          params: { tenant_id: MOCK_TENANT_ID, limit: 5 }
        });
        setRecentRecords(response.data);
      } catch (error) {
        console.error("Error fetching recent records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchRecent, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-6 rounded-2xl text-white shadow-xl shadow-brand-100">
          <p className="text-brand-100 text-sm font-medium">Asistencias Hoy</p>
          <p className="text-4xl font-bold mt-1">{recentRecords.length > 0 ? '24' : '0'}</p>
          <p className="text-xs text-brand-200 mt-4">+12% vs ayer</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Retardos</p>
          <p className="text-4xl font-bold mt-1 text-orange-500">3</p>
          <p className="text-xs text-slate-400 mt-4">Dentro del rango</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Faltas</p>
          <p className="text-4xl font-bold mt-1 text-red-500">1</p>
          <p className="text-xs text-slate-400 mt-4">Justificada</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Dispositivos</p>
          <p className="text-4xl font-bold mt-1 text-green-500">2</p>
          <p className="text-xs text-slate-400 mt-4">En línea</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="text-brand-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Actividad Reciente</h3>
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Actualización en vivo</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">Cargando actividad...</td>
                </tr>
              ) : recentRecords.length > 0 ? (
                recentRecords.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-xs">
                          {reg.nombre_empleado.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{reg.nombre_empleado}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {reg.id_reloj}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {format(new Date(reg.timestamp_checada), 'HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        reg.tipo_registro === '0' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {reg.tipo_registro === '0' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                      {reg.dispositivo_sn || 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                    No hay actividad reciente registrada hoy.
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

function App() {
  const [view, setView] = useState('inicio');

  const renderView = () => {
    switch (view) {
      case 'inicio': return <InicioView />;
      case 'empleados': return <DirectorioView />;
      case 'reportes': return <ReportesView />;
      case 'areas': return <div className="p-8 text-center text-slate-400">Vista de Áreas en desarrollo...</div>;
      default: return <InicioView />;
    }
  };

  return (
    <DashboardLayout currentView={view} setView={setView}>
      {renderView()}
    </DashboardLayout>
  );
}

export default App;
