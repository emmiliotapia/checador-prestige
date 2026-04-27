import React, { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import DirectorioView from './views/DirectorioView';
import ReportesView from './views/ReportesView';

function InicioView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-6 rounded-2xl text-white shadow-xl shadow-brand-100">
        <p className="text-brand-100 text-sm font-medium">Asistencias Hoy</p>
        <p className="text-4xl font-bold mt-1">24</p>
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
