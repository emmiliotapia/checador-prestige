import React, { useState, useEffect } from 'react';
import { Plus, Search, User, CreditCard, Building2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://164.92.110.179:8100/api';
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001'; // Just for MVP demo

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
        axios.get(`${API_BASE}/empleados?tenant_id=${MOCK_TENANT_ID}`),
        axios.get(`${API_BASE}/areas?tenant_id=${MOCK_TENANT_ID}`)
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
      await axios.post(`${API_BASE}/empleados`, newEmployee);
      setShowModal(false);
      setNewEmployee({ nombre_completo: '', id_reloj: '', area_id: '', tenant_id: MOCK_TENANT_ID });
      fetchData();
    } catch (error) {
      alert("Error al guardar empleado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Directorio de Empleados</h1>
          <p className="text-slate-500">Gestiona el personal y sus IDs de reloj checador.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
        >
          <Plus size={20} />
          <span>Agregar Empleado</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Empleados</p>
          <p className="text-3xl font-bold text-slate-900">{employees.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Áreas Activas</p>
          <p className="text-3xl font-bold text-slate-900">{areas.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Última Sincronización</p>
          <p className="text-lg font-bold text-slate-900">Hoy, 08:45 AM</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o ID..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-sm uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">ID Reloj</th>
                <th className="px-6 py-4">Área</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length > 0 ? employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-xs">
                        {emp.nombre_completo.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{emp.nombre_completo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono">{emp.id_reloj}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium uppercase">
                      {areas.find(a => a.id === emp.area_id)?.nombre_area || 'Sin Área'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-brand-600 hover:text-brand-800 font-medium">Editar</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Nuevo Empleado</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={newEmployee.nombre_completo}
                    onChange={(e) => setNewEmployee({...newEmployee, nombre_completo: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID en Reloj Físico</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="Ej: 1001"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={newEmployee.id_reloj}
                    onChange={(e) => setNewEmployee({...newEmployee, id_reloj: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Área</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none"
                    value={newEmployee.area_id}
                    onChange={(e) => setNewEmployee({...newEmployee, area_id: e.target.value})}
                  >
                    <option value="">Seleccionar área...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre_area}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold"
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
