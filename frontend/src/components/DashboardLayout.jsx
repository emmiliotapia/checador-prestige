import React from 'react';
import { Home, Users, Map, BarChart2, LogOut, Settings } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-gold-600 text-obsidian-950 font-bold shadow-lg shadow-gold-900/20' 
        : 'text-obsidian-300 hover:bg-obsidian-800 hover:text-gold-400'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium tracking-wider uppercase text-sm">{label}</span>
  </button>
);

const BottomNavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 ${
      active 
        ? 'text-gold-500 font-bold' 
        : 'text-obsidian-400 hover:text-gold-400'
    }`}
  >
    <Icon size={20} className={active ? 'mb-1' : 'mb-1 opacity-70'} />
    <span className="text-[10px] tracking-wider uppercase">{label}</span>
  </button>
);

export default function DashboardLayout({ children, currentView, setView }) {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'empleados', label: 'Empleados', icon: Users },
    { id: 'areas', label: 'Áreas', icon: Map },
    { id: 'reportes', label: 'Reportes', icon: BarChart2 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-obsidian-950 relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-obsidian-900 border-r border-obsidian-800 flex-col p-4 shadow-2xl">
        <nav className="flex-1 space-y-2 mt-4">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-obsidian-950 pb-20 md:pb-0">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-obsidian-900 border-t border-obsidian-800 flex justify-around items-center px-2 py-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
        {menuItems.map((item) => (
          <BottomNavItem
            key={item.id}
            icon={item.icon}
            label={item.id === 'configuracion' ? 'Config' : item.label}
            active={currentView === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}
