import React, { useState, useEffect } from 'react';
import { Plus, Search, User, CreditCard, Building2, Trash2 } from 'lucide-react';
import api from '../api';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function DirectorioView({ user }) {
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'nombre_completo', direction: 'asc' });
  const itemsPerPage = 25;

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [selectedArea, setSelectedArea] = useState('all');

  const [newEmployee, setNewEmployee] = useState({
    nombre_completo: '',
    id_reloj: '',
    area_id: '',
    horario_id: '',
    puesto: '',
    tenant_id: MOCK_TENANT_ID
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, areaRes, horarioRes] = await Promise.all([
        api.get(`/empleados?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/areas?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/horarios?tenant_id=${MOCK_TENANT_ID}`)
      ]);
      setEmployees(empRes.data);
      setAreas(areaRes.data);
      setHorarios(horarioRes.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/empleados/${editingEmployee.id}`, editingEmployee);
        setEditingEmployee(null);
      } else {
        await api.post(`/empleados`, newEmployee);
      }
      setShowModal(false);
      setNewEmployee({ nombre_completo: '', id_reloj: '', area_id: '', horario_id: '', puesto: '', tenant_id: MOCK_TENANT_ID });
      fetchData();
    } catch (error) {
      alert("Error al guardar empleado");
    }
  };

  const toggleStatus = async (emp) => {
    try {
      await api.put(`/empleados/${emp.id}`, { activo: !emp.activo });
      fetchData();
    } catch (error) {
      alert("Error al cambiar estatus");
    }
  };

  const handleDelete = async (emp) => {
    if (window.confirm(`¿Estás SEGURO de borrar a ${emp.nombre_completo}? Esto también eliminará todas sus checadas. Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`/empleados/${emp.id}`);
        fetchData();
      } catch (error) {
        alert("Error al eliminar empleado");
      }
    }
  };

  // --- LÓGICA DE BÚSQUEDA, FILTRADO Y ORDENAMIENTO ---
  
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.id_reloj.includes(searchTerm);
    const matchesArea = selectedArea === 'all' || emp.area_id === selectedArea;
    return matchesSearch && matchesArea;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Manejo especial para el nombre del área
    if (sortConfig.key === 'area') {
      aValue = areas.find(area => area.id === a.area_id)?.nombre_area || '';
      bValue = areas.find(area => area.id === b.area_id)?.nombre_area || '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset a primera página al buscar
              }}
              className="w-full pl-10 pr-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 placeholder-obsidian-600 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Building2 className="text-obsidian-500" size={18} />
            <select 
              className="bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all text-sm uppercase tracking-wider font-bold"
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">TODAS LAS ÁREAS</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre_area}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 text-obsidian-400 text-sm font-bold uppercase">
            <span>Página {currentPage} de {totalPages || 1}</span>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-obsidian-950 border border-obsidian-800 rounded disabled:opacity-30 hover:bg-obsidian-800 transition-colors"
              >
                &lt;
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 bg-obsidian-950 border border-obsidian-800 rounded disabled:opacity-30 hover:bg-obsidian-800 transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950/50 text-obsidian-400 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th 
                  className="px-6 py-4 border-b border-obsidian-800 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => requestSort('nombre_completo')}
                >
                  Empleado {sortConfig.key === 'nombre_completo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 border-b border-obsidian-800 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => requestSort('id_reloj')}
                >
                  ID Reloj {sortConfig.key === 'id_reloj' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 border-b border-obsidian-800 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => requestSort('area')}
                >
                  Área {sortConfig.key === 'area' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 border-b border-obsidian-800">Horario</th>
                <th className="px-6 py-4 border-b border-obsidian-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800">
              {paginatedEmployees.length > 0 ? paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-obsidian-800/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${emp.activo ? 'bg-gold-500/10 text-gold-500' : 'bg-red-500/10 text-red-500'} rounded-full flex items-center justify-center font-bold text-sm border ${emp.activo ? 'border-gold-500/20' : 'border-red-500/20'}`}>
                        {emp.nombre_completo.charAt(0)}
                      </div>
                      <div>
                        <span className={`font-bold uppercase ${emp.activo ? 'text-obsidian-100' : 'text-red-400 line-through'}`}>{emp.nombre_completo}</span>
                        {!emp.activo && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Inactivo (Baja)</p>}
                      </div>
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
                      {horarios.find(h => h.id === emp.horario_id)?.nombre || 'Sin Horario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setEditingEmployee(emp);
                          setShowModal(true);
                        }}
                        className="text-gold-500 hover:text-gold-400 text-xs font-bold uppercase tracking-wider"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => toggleStatus(emp)}
                        className={`${emp.activo ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'} text-xs font-bold uppercase tracking-wider`}
                      >
                        {emp.activo ? 'Baja' : 'Reingreso'}
                      </button>
                      {user?.rol === 'ROOT' && (
                        <button 
                          onClick={() => handleDelete(emp)}
                          className="text-red-600 hover:text-red-400 p-1"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-obsidian-500 italic">
                    {loading ? 'Cargando empleados...' : 'No se encontraron resultados.'}
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
            <h3 className="text-2xl font-light text-obsidian-50 tracking-wide uppercase mb-6">{editingEmployee ? 'Editar' : 'Nuevo'} <span className="font-bold text-gold-500">Empleado</span></h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
                  <input 
                    required
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                    value={editingEmployee ? editingEmployee.nombre_completo : newEmployee.nombre_completo}
                    onChange={(e) => editingEmployee 
                      ? setEditingEmployee({...editingEmployee, nombre_completo: e.target.value})
                      : setNewEmployee({...newEmployee, nombre_completo: e.target.value})
                    }
                  />
                </div>
              </div>

              {!editingEmployee && (
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
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider text-xs">Área</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all text-sm"
                    value={editingEmployee ? editingEmployee.area_id : newEmployee.area_id}
                    onChange={(e) => editingEmployee
                      ? setEditingEmployee({...editingEmployee, area_id: e.target.value})
                      : setNewEmployee({...newEmployee, area_id: e.target.value})
                    }
                  >
                    <option value="">Área...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre_area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider text-xs">Horario</label>
                  <select 
                    className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all text-sm"
                    value={editingEmployee ? (editingEmployee.horario_id || '') : newEmployee.horario_id}
                    onChange={(e) => editingEmployee
                      ? setEditingEmployee({...editingEmployee, horario_id: e.target.value || null})
                      : setNewEmployee({...newEmployee, horario_id: e.target.value})
                    }
                  >
                    <option value="">Opcional...</option>
                    {horarios.map(h => (
                      <option key={h.id} value={h.id}>{h.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider text-xs">Puesto</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                  value={editingEmployee ? (editingEmployee.puesto || '') : newEmployee.puesto}
                  onChange={(e) => editingEmployee
                    ? setEditingEmployee({...editingEmployee, puesto: e.target.value})
                    : setNewEmployee({...newEmployee, puesto: e.target.value})
                  }
                />
              </div>
              <div className="flex space-x-3 pt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmployee(null);
                  }}
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
