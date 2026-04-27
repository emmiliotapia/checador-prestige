import React from 'react';
import { Home, Users, Map, BarChart2, LogOut } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' 
        : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export default function DashboardLayout({ children, currentView, setView }) {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'empleados', label: 'Empleados', icon: Users },
    { id: 'areas', label: 'Áreas', icon: Map },
    { id: 'reportes', label: 'Reportes', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
        <div className="flex items-center space-x-3 px-2 py-6 mb-4">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
            <BarChart2 size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">SmartOps</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              onClick={() => setView(item.id)}
            />
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-100">
          <SidebarItem icon={LogOut} label="Cerrar Sesión" onClick={() => {}} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">{currentView}</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">Tenant: Casino Prestige</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
