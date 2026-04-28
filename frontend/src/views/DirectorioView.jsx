import React, { useState, useEffect } from 'react';
import { Plus, Search, User, CreditCard, Building2 } from 'lucide-react';
import api from '../api';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function DirectorioView() {
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState({
    nombre_completo: '',
    id_reloj: '',
    area_id: '',
    tenant_id: MOCK_TENANT_ID
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, areaRes] = await Promise.all([
        api.get(`/empleados?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/areas?tenant_id=${MOCK_TENANT_ID}`)
      ]);
      setEmployees(empRes.data);
      setAreas(areaRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/empleados`, newEmployee);
      setShowModal(false);
      setNewEmployee({ nombre_completo: '', id_reloj: '', area_id: '', tenant_id: MOCK_TENANT_ID });
      fetchData();
    } catch (error) {
      alert("Error al guardar empleado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-obsidian-50 tracking-wide uppercase">Directorio de <span className="font-bold text-gold-500">Empleados</span></h1>
          <p className="text-obsidian-400 mt-1">Gestiona el personal y sus IDs de reloj checador.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-gold-500 text-obsidian-950 px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/20 font-bold uppercase tracking-widest text-sm"
        >
          <Plus size={20} />
          <span>Agregar Empleado</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-xl">
          <p className="text-obsidian-400 text-sm font-medium uppercase tracking-wider">Total Empleados</p>
          <p className="text-4xl font-light text-gold-500 mt-2">{employees.length}</p>
        </div>
        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-xl">
          <p className="text-obsidian-400 text-sm font-medium uppercase tracking-wider">Áreas Activas</p>
          <p className="text-4xl font-light text-gold-500 mt-2">{areas.length}</p>
        </div>
        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-xl">
          <p className="text-obsidian-400 text-sm font-medium uppercase tracking-wider">Última Sincronización</p>
          <p className="text-xl font-bold text-obsidian-100 mt-2">En vivo</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-obsidian-900 rounded-2xl border border-obsidian-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-obsidian-800 bg-obsidian-950/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o ID..." 
              className="w-full pl-10 pr-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 placeholder-obsidian-600 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950/50 text-obsidian-400 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-obsidian-800">Empleado</th>
                <th className="px-6 py-4 border-b border-obsidian-800">ID Reloj</th>
                <th className="px-6 py-4 border-b border-obsidian-800">Área</th>
                <th className="px-6 py-4 border-b border-obsidian-800">Puesto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800">
              {employees.length > 0 ? employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-obsidian-800/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gold-500/10 text-gold-500 rounded-full flex items-center justify-center font-bold text-sm border border-gold-500/20">
                        {emp.nombre_completo.charAt(0)}
                      </div>
                      <span className="font-bold text-obsidian-100 uppercase">{emp.nombre_completo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gold-400 font-mono text-sm bg-gold-500/10 px-2 py-1 rounded border border-gold-500/20">{emp.id_reloj}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-obsidian-800 text-obsidian-300 rounded text-xs font-bold uppercase tracking-wider border border-obsidian-700">
                      {areas.find(a => a.id === emp.area_id)?.nombre_area || 'Sin Área'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-obsidian-400 text-sm uppercase">
                      {emp.puesto || 'N/A'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-obsidian-500 italic">
                    No hay empleados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-light text-obsidian-50 tracking-wide uppercase mb-6">Nuevo <span className="font-bold text-gold-500">Empleado</span></h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
                  <input 
                    required
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                    value={newEmployee.nombre_completo}
                    onChange={(e) => setNewEmployee({...newEmployee, nombre_completo: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">ID Reloj Físico</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="Ej: 1001"
                    className="w-full pl-10 pr-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                    value={newEmployee.id_reloj}
                    onChange={(e) => setNewEmployee({...newEmployee, id_reloj: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Área</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
                  <select 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all appearance-none"
                    value={newEmployee.area_id}
                    onChange={(e) => setNewEmployee({...newEmployee, area_id: e.target.value})}
                  >
                    <option value="" className="text-obsidian-500">Seleccionar área...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre_area}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-obsidian-700 rounded-lg text-obsidian-300 hover:bg-obsidian-800 transition-colors uppercase tracking-widest text-sm font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gold-500 text-obsidian-950 rounded-lg hover:bg-gold-400 transition-colors uppercase tracking-widest text-sm font-bold shadow-lg shadow-gold-900/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
