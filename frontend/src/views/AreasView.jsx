import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Edit, Plus, UserCheck, Trash2, Building2, Users } from 'lucide-react';
import api from '../api';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const INITIAL_FORM = {
  nombre_area: '',
  correo_responsable: '',
  encargado_id: '',
  tenant_id: MOCK_TENANT_ID
};

export default function AreasView() {
  const [areas, setAreas] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [areasRes, empRes] = await Promise.all([
        api.get(`/areas?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/empleados?tenant_id=${MOCK_TENANT_ID}`)
      ]);
      setAreas(areasRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el catálogo de departamentos.');
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
      const payload = {
        nombre_area: formData.nombre_area,
        correo_responsable: formData.correo_responsable.trim() || null,
        encargado_id: formData.encargado_id || null,
        tenant_id: MOCK_TENANT_ID
      };

      if (editingArea) {
        await api.put(`/areas/${editingArea.id}`, payload);
      } else {
        await api.post('/areas', payload);
      }
      setShowModal(false);
      setEditingArea(null);
      setFormData(INITIAL_FORM);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar el departamento');
    }
  };

  const startEdit = (area) => {
    setEditingArea(area);
    setFormData({
      nombre_area: area.nombre_area,
      correo_responsable: area.correo_responsable || '',
      encargado_id: area.encargado_id || '',
      tenant_id: MOCK_TENANT_ID
    });
    setShowModal(true);
  };

  const handleDelete = async (area) => {
    if (window.confirm(`¿Estás seguro de eliminar el departamento "${area.nombre_area}"? No se podrá eliminar si tiene empleados vinculados.`)) {
      try {
        await api.delete(`/areas/${area.id}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || 'Error al eliminar el departamento');
      }
    }
  };

  const activeEmployees = employees.filter(e => e.activo);
  const areasWithManagerCount = areas.filter(a => a.encargado_id).length;
  const activeEmployeesCount = activeEmployees.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-obsidian-50 tracking-tight">
            Departamentos y Áreas
          </h1>
          <p className="text-obsidian-400 text-sm font-medium mt-1">
            Administra las áreas operativas del casino, su plantilla y responsables de reportes.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingArea(null);
            setFormData(INITIAL_FORM);
            setShowModal(true);
          }}
          className="w-full md:w-auto bg-gold-500 text-white dark:text-obsidian-950 px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 hover:bg-gold-600 dark:hover:bg-gold-400 transition-all shadow-md shadow-gold-500/20 font-bold text-sm"
        >
          <Plus size={18} />
          <span>Nuevo Departamento</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Total Departamentos</span>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-500 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50 mt-3">
            {areas.length}
          </p>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Personal Distribuido</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5 mt-3">
            <p className="font-mono tabular-nums text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeEmployeesCount}
            </p>
            <span className="text-xs font-medium text-obsidian-400">
              colaboradores activos
            </span>
          </div>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Con Responsable Asignado</span>
            <div className="w-10 h-10 rounded-xl bg-obsidian-950 border border-obsidian-800 text-obsidian-300 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5 mt-3">
            <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50">
              {areasWithManagerCount}
            </p>
            <span className="text-xs font-medium text-obsidian-400">
              de {areas.length} áreas
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Areas Table */}
      <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-obsidian-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-obsidian-50">Listado de Departamentos</h3>
            <p className="text-xs text-obsidian-400 mt-0.5">Estructura organizacional activa en el casino</p>
          </div>
          <span className="text-xs font-semibold text-obsidian-400 bg-obsidian-950 border border-obsidian-800 px-3 py-1 rounded-full">
            {areas.length} áreas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-obsidian-800 bg-obsidian-950/60 text-obsidian-400 text-xs font-semibold">
                <th className="px-6 py-3.5">Departamento</th>
                <th className="px-6 py-3.5">Colaboradores</th>
                <th className="px-6 py-3.5">Encargado / Responsable</th>
                <th className="px-6 py-3.5">Correo de Notificación</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800/70">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    Cargando departamentos...
                  </td>
                </tr>
              ) : areas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    No hay departamentos registrados.
                  </td>
                </tr>
              ) : areas.map((area) => {
                const countInArea = activeEmployees.filter(e => e.area_id === area.id).length;
                const managerObj = employees.find(e => e.id === area.encargado_id);

                return (
                  <tr key={area.id} className="hover:bg-obsidian-950/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center text-gold-500 font-bold text-sm uppercase">
                          {area.nombre_area.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-obsidian-50">{area.nombre_area}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${countInArea > 0
                          ? 'bg-gold-500/10 text-gold-600 dark:text-gold-400 border-gold-500/20'
                          : 'bg-obsidian-950 text-obsidian-400 border-obsidian-800'
                        }`}>
                        {countInArea} {countInArea === 1 ? 'colaborador' : 'colaboradores'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {managerObj ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-obsidian-100">
                          <UserCheck size={15} className="text-emerald-500 shrink-0" />
                          <span>{managerObj.nombre_completo}</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-obsidian-950 text-obsidian-400 border border-obsidian-800">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {area.correo_responsable ? (
                        <div className="flex items-center gap-2 text-xs font-mono text-obsidian-200">
                          <Mail size={14} className="text-gold-500 shrink-0" />
                          <span>{area.correo_responsable}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-obsidian-400 italic">No configurado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEdit(area)}
                          className="p-2 bg-obsidian-950 border border-obsidian-800 text-obsidian-300 rounded-xl hover:bg-gold-500 hover:text-white dark:hover:text-obsidian-950 hover:border-gold-500 transition-all"
                          title="Editar Departamento"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(area)}
                          className="p-2 bg-obsidian-950 border border-obsidian-800 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                          title="Eliminar Departamento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación/Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-7">
            <h3 className="text-xl font-bold text-obsidian-50 mb-1">
              {editingArea ? 'Editar Departamento' : 'Nuevo Departamento'}
            </h3>
            <p className="text-xs text-obsidian-400 mb-6">Configura el nombre del área y su responsable directo.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                  Nombre del Departamento
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej. CAJAS, SEGURIDAD, MESAS..."
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 text-sm uppercase focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all placeholder-obsidian-500"
                  value={formData.nombre_area}
                  onChange={(e) => setFormData({ ...formData, nombre_area: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                  Responsable / Encargado (Opcional)
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all text-sm"
                  value={formData.encargado_id}
                  onChange={(e) => setFormData({ ...formData, encargado_id: e.target.value })}
                >
                  <option value="">Sin encargado asignado</option>
                  {activeEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre_completo} (#{e.id_reloj})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">
                  Correo para Reportes (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="responsable@casinoprestige.com"
                  className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-700 rounded-xl text-obsidian-50 font-mono text-sm focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all placeholder-obsidian-500"
                  value={formData.correo_responsable}
                  onChange={(e) => setFormData({ ...formData, correo_responsable: e.target.value })}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingArea(null);
                  }}
                  className="flex-1 py-3 border border-obsidian-700 rounded-xl text-obsidian-300 hover:bg-obsidian-800 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gold-500 text-white dark:text-obsidian-950 rounded-xl hover:bg-gold-600 dark:hover:bg-gold-400 transition-colors text-sm font-bold shadow-md shadow-gold-500/20"
                >
                  {editingArea ? 'Guardar Cambios' : 'Crear Departamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
