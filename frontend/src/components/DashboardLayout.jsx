import React from 'react';
import { Home, Users, Map, BarChart2, LogOut, Settings, Clock, Sun, Moon, Sparkles } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-gold-500 text-white dark:text-obsidian-950 font-bold shadow-md shadow-gold-500/20' 
        : 'text-obsidian-400 hover:bg-obsidian-800/60 hover:text-obsidian-50 font-medium'
    }`}
  >
    <Icon size={19} className={active ? 'stroke-[2.4]' : 'text-obsidian-400 group-hover:text-gold-500 transition-colors'} />
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

const BottomNavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${
      active 
        ? 'text-gold-500 font-bold' 
        : 'text-obsidian-400 hover:text-obsidian-100'
    }`}
  >
    <Icon size={20} className="mb-1" />
    <span className="text-[11px]">{label}</span>
  </button>
);

export default function DashboardLayout({ children, currentView, setView, user, theme, toggleTheme, onLogout }) {
  const canAccess = (moduleId) => {
    if (user?.rol === 'ROOT') return true;
    if (moduleId === 'inicio') return true;

    const permisosArr = user?.permisos ? JSON.parse(user.permisos) : [];
    if (Array.isArray(permisosArr) && permisosArr.length > 0) {
      return permisosArr.includes(moduleId);
    }

    return user?.rol === 'ADMIN' || user?.rol === 'RRHH';
  };

  const menuItems = [
    { id: 'inicio', label: 'Panel en Vivo', icon: Home },
    { id: 'empleados', label: 'Directorio', icon: Users },
    { id: 'horarios', label: 'Turnos y Horarios', icon: Clock },
    { id: 'areas', label: 'Departamentos', icon: Map },
    { id: 'reportes', label: 'Reportes y Nómina', icon: BarChart2 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ].filter(item => canAccess(item.id));

  const currentItem = menuItems.find(m => m.id === currentView) || menuItems[0];

  return (
    <div className="flex h-screen bg-obsidian-950 text-obsidian-100 overflow-hidden transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-68 bg-obsidian-900 border-r border-obsidian-800 flex-col justify-between p-5 shrink-0 z-20">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center space-x-3.5 px-2 py-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-obsidian-950 border border-obsidian-800 flex items-center justify-center p-1.5 shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-obsidian-50 leading-none">
                Casino <span className="text-gold-500">Prestige</span>
              </h1>
              <p className="text-[11px] font-medium text-obsidian-400 mt-1 flex items-center gap-1">
                <Sparkles size={11} className="text-gold-500" />
                <span>SmartOps Attendance</span>
              </p>
            </div>
          </div>

          <div className="px-3 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-obsidian-400">
              Navegación Principal
            </p>
          </div>

          <nav className="space-y-1.5">
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
        </div>

        {/* User Profile & Theme Footer */}
        <div className="pt-4 border-t border-obsidian-800 space-y-3">
          <div className="flex items-center justify-between bg-obsidian-950 border border-obsidian-800 rounded-xl p-2.5">
            <span className="text-xs font-semibold text-obsidian-300 pl-1">Apariencia</span>
            <div className="flex items-center bg-obsidian-900 p-1 rounded-lg border border-obsidian-800">
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-gold-500 text-white shadow-sm'
                    : 'text-obsidian-400 hover:text-obsidian-100'
                }`}
                title="Modo Claro"
              >
                <Sun size={13} />
                <span>Claro</span>
              </button>
              <button
                onClick={() => theme === 'light' && toggleTheme()}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                    : 'text-obsidian-400 hover:text-obsidian-100'
                }`}
                title="Modo Oscuro"
              >
                <Moon size={13} />
                <span>Oscuro</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-500 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                {user?.email?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-obsidian-50 truncate">
                  {user?.email?.split('@')[0] || 'Usuario'}
                </p>
                <p className="text-[11px] font-semibold text-gold-500 uppercase tracking-wider">
                  {user?.rol || 'ADMIN'}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-obsidian-950 border border-obsidian-800 text-obsidian-400 hover:text-red-500 hover:border-red-500/30 transition-all"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-obsidian-900/80 backdrop-blur-md border-b border-obsidian-800 px-4 md:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-7 w-auto md:hidden" />
            <div>
              <h2 className="text-sm md:text-base font-bold text-obsidian-50">
                {currentItem?.label || 'Panel de Control'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-obsidian-300 hover:text-gold-500 hover:border-gold-500/40 transition-all flex items-center space-x-2 text-xs font-semibold"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={16} className="text-gold-400" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="text-gold-500" />
                  <span className="hidden sm:inline">Modo Oscuro</span>
                </>
              )}
            </button>

            <button
              onClick={onLogout}
              className="md:hidden p-2.5 rounded-xl bg-obsidian-950 border border-obsidian-800 text-obsidian-400 hover:text-red-500"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-obsidian-950 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-obsidian-900/95 backdrop-blur-lg border-t border-obsidian-800 flex justify-around items-center px-2 py-1.5 z-50">
        {menuItems.map((item) => (
          <BottomNavItem
            key={item.id}
            icon={item.icon}
            label={item.id === 'configuracion' ? 'Ajustes' : item.label.split(' ')[0]}
            active={currentView === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}
