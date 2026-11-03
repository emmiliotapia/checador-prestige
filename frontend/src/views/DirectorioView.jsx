import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, User, CreditCard, Building2, Trash2, Edit, Activity, ChevronLeft, ChevronRight, ArrowUpDown, UserCheck, UserX, RotateCcw } from 'lucide-react';
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
  const [statusTab, setStatusTab] = useState('active'); // 'active' | 'inactive'
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

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || "Error al guardar empleado");
    }
  };

  const toggleStatus = async (emp) => {
    const actionLabel = emp.activo
      ? `¿Deseas mover a "${emp.nombre_completo}" al archivo de Bajas? Ya no aparecerá en las listas operativas ni sus checadas se contabilizarán.`
      : `¿Deseas procesar el Reingreso de "${emp.nombre_completo}" a la plantilla activa?`;

    if (!window.confirm(actionLabel)) return;

    try {
      await api.put(`/empleados/${emp.id}`, { activo: !emp.activo });
      await fetchData();
    } catch (error) {
      alert("Error al cambiar estatus del colaborador");
    }
  };

  const handleDelete = async (emp) => {
    if (window.confirm(`¿Estás SEGURO de borrar permanentemente a ${emp.nombre_completo}? Esto también eliminará todas sus checadas históricas. Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`/empleados/${emp.id}`);
        await fetchData();
      } catch (error) {
        alert("Error al eliminar empleado");
      }
    }
  };

  const activeCount = employees.filter(e => e.activo).length;
  const inactiveCount = employees.filter(e => !e.activo).length;

  const filteredEmployees = employees.filter(emp => {
    const matchesStatus = statusTab === 'active' ? emp.activo === true : emp.activo === false;
    const matchesSearch = emp.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.id_reloj.includes(searchTerm);
    const matchesArea = selectedArea === 'all' || emp.area_id === selectedArea;
    return matchesStatus && matchesSearch && matchesArea;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortConfig.key === 'id_reloj') {
      const numA = parseInt(a.id_reloj, 10);
      const numB = parseInt(b.id_reloj, 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }
    }

    let aValue = a[sortConfig.key] || '';
    let bValue = b[sortConfig.key] || '';

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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-obsidian-50 tracking-tight">Directorio de Colaboradores</h1>
          <p className="text-obsidian-400 text-sm font-medium mt-1">Administra la plantilla operativa activa, turnos asignados y el expediente de bajas.</p>
        </div>
        <button 
          onClick={() => {
            setEditingEmployee(null);
            setShowModal(true);
          }}
          className="w-full md:w-auto bg-gold-500 text-white dark:text-obsidian-950 px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 hover:bg-gold-600 dark:hover:bg-gold-400 transition-all shadow-md shadow-gold-500/20 font-bold text-sm"
        >
          <Plus size={18} />
          <span>Nuevo Colaborador</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div 
          onClick={() => { setStatusTab('active'); setCurrentPage(1); }}
          className={`bg-obsidian-900 p-6 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            statusTab === 'active' ? 'border-gold-500 ring-1 ring-gold-500/30' : 'border-obsidian-800 hover:border-obsidian-700'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Plantilla Activa</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-3 mt-3">
            <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50">{activeCount}</p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              En operación
            </span>
          </div>
        </div>

        <div 
          onClick={() => { setStatusTab('inactive'); setCurrentPage(1); }}
          className={`bg-obsidian-900 p-6 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            statusTab === 'inactive' ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-obsidian-800 hover:border-obsidian-700'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Archivo de Bajas</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <UserX size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-3 mt-3">
            <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50">{inactiveCount}</p>
            <span className="text-xs font-medium text-obsidian-400">
              {statusTab === 'inactive' ? 'Viendo archivo' : 'Clic para consultar'}
            </span>
          </div>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Departamentos y Turnos</span>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-500 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2.5">
            <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50">{areas.length}</p>
            <span className="text-xs text-obsidian-400 font-medium">
              áreas · <strong className="font-mono tabular-nums text-obsidian-200">{horarios.length}</strong> turnos
            </span>
          </div>
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="bg-obsidian-900 rounded-2xl border border-obsidian-800 overflow-hidden shadow-sm">
        {/* Segmented Tabs Header */}
        <div className="px-5 pt-5 pb-4 border-b border-obsidian-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-obsidian-950/30">
          <div className="inline-flex p-1 bg-obsidian-950 border border-obsidian-800 rounded-xl self-start">
            <button
              type="button"
              onClick={() => { setStatusTab('active'); setCurrentPage(1); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                statusTab === 'active'
                  ? 'bg-gold-500 text-white dark:text-obsidian-950 shadow-sm'
                  : 'text-obsidian-400 hover:text-obsidian-100'
              }`}
            >
              <UserCheck size={15} />
              <span>Personal Activo</span>
              <span className={`px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] ${
                statusTab === 'active'
                  ? 'bg-black/15 text-white dark:text-obsidian-950'
                  : 'bg-obsidian-900 text-obsidian-300'
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusTab('inactive'); setCurrentPage(1); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                statusTab === 'inactive'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-obsidian-400 hover:text-obsidian-100'
              }`}
            >
              <UserX size={15} />
              <span>Archivo de Bajas</span>
              <span className={`px-2 py-0.5 rounded-full font-mono tabular-nums text-[11px] ${
                statusTab === 'inactive'
                  ? 'bg-black/20 text-white'
                  : 'bg-obsidian-900 text-obsidian-300'
              }`}>
                {inactiveCount}
              </span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
              <input 
                type="text" 
                placeholder={statusTab === 'active' ? "Buscar colaborador activo..." : "Buscar en archivo de bajas..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-obsidian-950 border border-obsidian-800 rounded-xl text-obsidian-50 text-xs font-medium placeholder-obsidian-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="relative flex-1 sm:flex-none">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={14} />
                <select 
                  className="w-full pl-9 pr-4 py-2 bg-obsidian-950 border border-obsidian-800 rounded-xl text-obsidian-100 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all text-xs font-semibold"
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Todos los Departamentos</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre_area}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 text-obsidian-400 text-xs font-semibold shrink-0">
                <span className="font-mono tabular-nums">{currentPage} / {totalPages || 1}</span>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-obsidian-950 border border-obsidian-800 rounded-xl text-obsidian-200 disabled:opacity-30 hover:border-gold-500/40 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 bg-obsidian-950 border border-obsidian-800 rounded-xl text-obsidian-200 disabled:opacity-30 hover:border-gold-500/40 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*Contextual Banner for Bajas */}
        {statusTab === 'inactive' && (
          <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center space-x-2 font-semibold">
              <UserX size={15} />
              <span>Estás visualizando el Archivo Histórico de Bajas. Estos colaboradores están ocultos de la operación diaria y del conteo de faltas.</span>
            </div>
            <span className="font-mono tabular-nums font-bold hidden sm:inline">Puedes procesarlos como Reingreso en cualquier momento</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950/60 text-obsidian-400 text-xs font-semibold border-b border-obsidian-800">
              <tr>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => requestSort('nombre_completo')}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Colaborador</span>
                    <ArrowUpDown size={13} className="opacity-60" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => requestSort('id_reloj')}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>PIN Reloj</span>
                    <ArrowUpDown size={13} className="opacity-60" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:text-gold-500 transition-colors"
                  onClick={() => requestSort('area')}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Departamento</span>
                    <ArrowUpDown size={13} className="opacity-60" />
                  </div>
                </th>
                <th className="px-6 py-3.5">Turno Asignado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800/70">
              {paginatedEmployees.length > 0 ? paginatedEmployees.map((emp) => {
                const horarioObj = horarios.find(h => h.id === emp.horario_id);
                return (
                  <tr key={emp.id} className="hover:bg-obsidian-950/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                          emp.activo 
                            ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {emp.nombre_completo.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-sm block text-obsidian-50">
                            {emp.nombre_completo}
                          </span>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {emp.puesto ? (
                              <span className="text-xs text-obsidian-400">{emp.puesto}</span>
                            ) : (
                              <span className="text-xs text-obsidian-400 italic">Sin cargo especificado</span>
                            )}
                            {!emp.activo && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold">
                                Baja Inactiva
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gold-600 dark:text-gold-400 font-mono tabular-nums text-xs font-bold bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20">
                        #{emp.id_reloj}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-obsidian-950 text-obsidian-200 rounded-lg text-xs font-semibold border border-obsidian-800">
                        {areas.find(a => a.id === emp.area_id)?.nombre_area || 'Sin Área'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {horarioObj ? (
                        <div className="flex flex-col">
                          <span className="text-obsidian-100 text-xs font-bold">{horarioObj.nombre}</span>
                          {horarioObj.hora_entrada && horarioObj.hora_salida && (
                            <span className="text-xs text-obsidian-400 font-mono tabular-nums">
                              {horarioObj.hora_entrada.slice(0, 5)} - {horarioObj.hora_salida.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-obsidian-400 text-xs italic">Sin turno asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => {
                            setEditingEmployee(emp);
                            setShowModal(true);
                          }}
                          className="px-3 py-1.5 bg-obsidian-950 border border-obsidian-800 text-obsidian-200 rounded-xl hover:bg-gold-500 hover:text-white dark:hover:text-obsidian-950 hover:border-gold-500 transition-all text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <Edit size={13} />
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => toggleStatus(emp)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                            emp.activo 
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white' 
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {emp.activo ? (
                            <>
                              <UserX size={13} />
                              <span>Dar de Baja</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw size={13} />
                              <span>Reingreso</span>
                            </>
                          )}
                        </button>
                        {user?.rol === 'ROOT' && (
                          <button 
                            onClick={() => handleDelete(emp)}
                            className="p-2 bg-obsidian-950 border border-obsidian-800 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                            title="Eliminar permanentemente (Solo ROOT)"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    {loading 
                      ? 'Cargando directorio de colaboradores...' 
                      : statusTab === 'active'
                      ? 'No se encontraron colaboradores activos con los filtros actuales.'
                      : 'No hay colaboradores registrados en el archivo de bajas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-7">
            <h3 className="text-xl font-bold text-obsidian-50 mb-1">
              {editingEmployee ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
            </h3>
            <p className="text-xs text-obsidian-400 mb-6">Los cambios se sincronizarán automáticamente con el reloj checador.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
                  <input 
                    required
                    type="text" 
                    placeholder="Ej. JUAN PEREZ LOPEZ"
                    className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm uppercase focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                    value={editingEmployee ? editingEmployee.nombre_completo : newEmployee.nombre_completo}
                    onChange={(e) => editingEmployee 
                      ? setEditingEmployee({...editingEmployee, nombre_completo: e.target.value})
                      : setNewEmployee({...newEmployee, nombre_completo: e.target.value})
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">PIN en Reloj Biométrico</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
                  <input 
                    required
                    type="text" 
                    placeholder="Ej. 1001"
                    className="w-full pl-10 pr-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums text-sm focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                    value={editingEmployee ? editingEmployee.id_reloj : newEmployee.id_reloj}
                    onChange={(e) => editingEmployee
                      ? setEditingEmployee({...editingEmployee, id_reloj: e.target.value})
                      : setNewEmployee({...newEmployee, id_reloj: e.target.value})
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Departamento</label>
                  <select 
                    required
                    className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all text-sm"
                    value={editingEmployee ? editingEmployee.area_id : newEmployee.area_id}
                    onChange={(e) => editingEmployee
                      ? setEditingEmployee({...editingEmployee, area_id: e.target.value})
                      : setNewEmployee({...newEmployee, area_id: e.target.value})
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre_area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Turno / Horario</label>
                  <select 
                    className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all text-sm"
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
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Puesto / Cargo</label>
                <input 
                  type="text" 
                  placeholder="Ej. CAJERO, SUPERVISOR..."
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm uppercase focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                  value={editingEmployee ? (editingEmployee.puesto || '') : newEmployee.puesto}
                  onChange={(e) => editingEmployee
                    ? setEditingEmployee({...editingEmployee, puesto: e.target.value})
                    : setNewEmployee({...newEmployee, puesto: e.target.value})
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmployee(null);
                  }}
                  className="flex-1 px-4 py-3 border border-obsidian-700 rounded-xl text-obsidian-300 hover:bg-obsidian-800 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gold-500 text-white dark:text-obsidian-950 rounded-xl hover:bg-gold-600 dark:hover:bg-gold-400 transition-colors text-sm font-bold shadow-md shadow-gold-500/20"
                >
                  {editingEmployee ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
