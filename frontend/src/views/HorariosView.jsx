import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Trash2, Edit, Users, AlertCircle } from 'lucide-react';
import api from '../api';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const INITIAL_FORM = {
  nombre: '',
  hora_entrada: '08:00:00',
  hora_salida: '16:00:00',
  tolerancia_entrada: 10,
  inicio_comida: '13:00:00',
  fin_comida: '14:00:00',
  tenant_id: MOCK_TENANT_ID
};

export default function HorariosView() {
  const [horarios, setHorarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const fetchData = useCallback(async () => {
    try {
      const [horRes, empRes] = await Promise.all([
        api.get(`/horarios?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/empleados?tenant_id=${MOCK_TENANT_ID}`)
      ]);
      setHorarios(horRes.data);
      setEmpleados(empRes.data);
    } catch (err) {
      console.error("Error al cargar horarios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenNew = () => {
    setEditingHorario(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const handleEditClick = (h) => {
    setEditingHorario(h);
    setFormData({
      nombre: h.nombre || h.nombre_horario || '',
      hora_entrada: h.hora_entrada || '08:00:00',
      hora_salida: h.hora_salida || '16:00:00',
      tolerancia_entrada: h.tolerancia_entrada ?? h.tolerancia_minutos ?? 10,
      inicio_comida: h.inicio_comida || '13:00:00',
      fin_comida: h.fin_comida || '14:00:00',
      tenant_id: MOCK_TENANT_ID
    });
    setShowModal(true);
  };

  const handleDelete = async (h) => {
    const nombreDisplay = h.nombre || h.nombre_horario;
    if (window.confirm(`¿Seguro que deseas eliminar el horario "${nombreDisplay}"? Los empleados asignados quedarán sin turno vinculado.`)) {
      try {
        await api.delete(`/horarios/${h.id}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || "Error al eliminar horario");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: formData.nombre,
        hora_entrada: formData.hora_entrada,
        hora_salida: formData.hora_salida,
        tolerancia_entrada: Number(formData.tolerancia_entrada) || 0,
        inicio_comida: formData.inicio_comida || null,
        fin_comida: formData.fin_comida || null,
        tenant_id: MOCK_TENANT_ID
      };

      if (editingHorario) {
        await api.put(`/horarios/${editingHorario.id}`, payload);
      } else {
        await api.post('/horarios', payload);
      }
      setShowModal(false);
      setEditingHorario(null);
      setFormData(INITIAL_FORM);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al guardar horario");
    }
  };

  const activeEmpleados = empleados.filter(e => e.activo);
  const assignedEmployeesCount = activeEmpleados.filter(e => e.horario_id).length;
  const avgTolerance = horarios.length > 0
    ? Math.round(horarios.reduce((acc, h) => acc + (h.tolerancia_entrada ?? h.tolerancia_minutos ?? 0), 0) / horarios.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-obsidian-50 tracking-tight">
            Catálogo de Turnos y Horarios
          </h1>
          <p className="text-obsidian-400 text-sm font-medium mt-1">
            Configura las jornadas laborales, minutos de tolerancia e intervalos de comida.
          </p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="w-full md:w-auto bg-gold-500 text-white dark:text-obsidian-950 px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 hover:bg-gold-600 dark:hover:bg-gold-400 transition-all shadow-md shadow-gold-500/20 font-bold text-sm"
        >
          <Plus size={18} />
          <span>Nuevo Turno</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Turnos Configurados</span>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-500 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50 mt-3">
            {horarios.length}
          </p>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Personal con Turno</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5 mt-3">
            <p className="font-mono tabular-nums text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {assignedEmployeesCount}
            </p>
            <span className="text-xs font-medium text-obsidian-400">
              de {activeEmpleados.length} activos
            </span>
          </div>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Tolerancia Promedio</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-3">
            <p className="font-mono tabular-nums text-3xl font-bold text-amber-600 dark:text-amber-400">
              {avgTolerance}
            </p>
            <span className="text-xs font-medium text-obsidian-400">minutos</span>
          </div>
        </div>
      </div>

      {/* Turnos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full bg-obsidian-900 border border-obsidian-800 rounded-2xl p-12 text-center text-obsidian-400 text-sm">
            Cargando catálogo de turnos...
          </div>
        ) : horarios.length === 0 ? (
          <div className="col-span-full bg-obsidian-900 border border-obsidian-800 rounded-2xl p-12 text-center text-obsidian-400 text-sm">
            No hay turnos configurados en el sistema.
          </div>
        ) : horarios.map(h => {
          const nombreDisplay = h.nombre || h.nombre_horario;
          const toleranciaDisplay = h.tolerancia_entrada ?? h.tolerancia_minutos ?? 0;
          const countAssigned = activeEmpleados.filter(e => e.horario_id === h.id).length;

          return (
            <div 
              key={h.id} 
              className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all hover:border-gold-500/40"
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-5 pb-4 border-b border-obsidian-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center text-gold-500 shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-obsidian-50">
                        {nombreDisplay}
                      </h3>
                      <span className="text-xs font-medium text-obsidian-400">
                        {countAssigned} {countAssigned === 1 ? 'colaborador asignado' : 'colaboradores asignados'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button 
                      onClick={() => handleEditClick(h)}
                      className="p-2 bg-obsidian-950 border border-obsidian-800 text-obsidian-300 rounded-xl hover:bg-gold-500 hover:text-white dark:hover:text-obsidian-950 hover:border-gold-500 transition-all"
                      title="Editar Horario"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(h)}
                      className="p-2 bg-obsidian-950 border border-obsidian-800 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                      title="Eliminar Horario"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-2 px-3.5 bg-obsidian-950 rounded-xl border border-obsidian-800/80">
                    <span className="text-obsidian-400 font-semibold text-xs">Jornada</span>
                    <div className="flex items-center space-x-1.5 font-mono tabular-nums text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        {h.hora_entrada ? h.hora_entrada.slice(0, 5) : '--:--'}
                      </span>
                      <span className="text-obsidian-400">→</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-obsidian-900 text-obsidian-100 border border-obsidian-700 font-bold">
                        {h.hora_salida ? h.hora_salida.slice(0, 5) : '--:--'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 px-3.5 bg-obsidian-950 rounded-xl border border-obsidian-800/80">
                    <span className="text-obsidian-400 font-semibold text-xs">Hora de Comida</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20 font-mono tabular-nums text-xs font-bold">
                      {h.inicio_comida && h.fin_comida 
                        ? `${h.inicio_comida.slice(0, 5)} - ${h.fin_comida.slice(0, 5)}` 
                        : 'Sin Comida'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 px-3.5 bg-obsidian-950 rounded-xl border border-obsidian-800/80">
                    <span className="text-obsidian-400 font-semibold text-xs">Tolerancia Entrada</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono tabular-nums text-xs font-bold">
                      +{toleranciaDisplay} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo / Editar Horario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-lg p-7">
            <h3 className="text-xl font-bold text-obsidian-50 mb-1">
              {editingHorario ? 'Editar Turno' : 'Crear Nuevo Turno'}
            </h3>
            <p className="text-xs text-obsidian-400 mb-6">Define las horas de entrada, salida y margen de tolerancia.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                  Nombre del Turno
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm uppercase outline-none focus:ring-2 focus:ring-gold-500 transition-all placeholder-obsidian-500" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej. TURNO MATUTINO" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                    Hora Entrada
                  </label>
                  <input 
                    required 
                    type="time" 
                    step="1"
                    className="w-full px-3 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all" 
                    value={formData.hora_entrada} 
                    onChange={e => setFormData({...formData, hora_entrada: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                    Hora Salida
                  </label>
                  <input 
                    required 
                    type="time" 
                    step="1"
                    className="w-full px-3 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all" 
                    value={formData.hora_salida} 
                    onChange={e => setFormData({...formData, hora_salida: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                    Tolerancia (Min)
                  </label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    max="120"
                    className="w-full px-3 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all" 
                    value={formData.tolerancia_entrada} 
                    onChange={e => setFormData({...formData, tolerancia_entrada: parseInt(e.target.value, 10) || 0})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                    Inicio Comida
                  </label>
                  <input 
                    type="time" 
                    step="1"
                    className="w-full px-3 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all" 
                    value={formData.inicio_comida} 
                    onChange={e => setFormData({...formData, inicio_comida: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                    Fin Comida
                  </label>
                  <input 
                    type="time" 
                    step="1"
                    className="w-full px-3 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono tabular-nums text-sm outline-none focus:ring-2 focus:ring-gold-500 transition-all" 
                    value={formData.fin_comida} 
                    onChange={e => setFormData({...formData, fin_comida: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingHorario(null); }} 
                  className="flex-1 py-3 border border-obsidian-700 text-obsidian-300 rounded-xl font-semibold text-sm hover:bg-obsidian-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gold-500 text-white dark:text-obsidian-950 rounded-xl font-bold text-sm hover:bg-gold-600 dark:hover:bg-gold-400 transition-colors shadow-md shadow-gold-500/20"
                >
                  {editingHorario ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
