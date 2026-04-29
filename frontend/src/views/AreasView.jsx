import { useState, useEffect } from 'react';
import { Mail, Edit2, CheckCircle2, X, Plus, UserCheck, Trash2 } from 'lucide-react';
import api from '../api';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function AreasView() {
  const [areas, setAreas] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre_area: '',
    correo_responsable: '',
    encargado_id: '',
    tenant_id: MOCK_TENANT_ID
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [areasRes, empRes] = await Promise.all([
        api.get(`/areas?tenant_id=${MOCK_TENANT_ID}`),
        api.get(`/empleados?tenant_id=${MOCK_TENANT_ID}`)
      ]);
      setAreas(areasRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await api.put(`/areas/${editingArea.id}`, formData);
      } else {
        await api.post('/areas', formData);
      }
      setShowModal(false);
      setEditingArea(null);
      setFormData({ nombre_area: '', correo_responsable: '', encargado_id: '', tenant_id: MOCK_TENANT_ID });
      fetchData();
    } catch (err) {
      alert('Error al guardar el área');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-obsidian-50 tracking-wide uppercase">Gestión de <span className="font-bold text-gold-500">Áreas</span></h1>
          <p className="text-obsidian-400 mt-1">Configura las áreas y asigna encargados para reportes.</p>
        </div>
        <button 
          onClick={() => {
            setEditingArea(null);
            setFormData({ nombre_area: '', correo_responsable: '', encargado_id: '', tenant_id: MOCK_TENANT_ID });
            setShowModal(true);
          }}
          className="w-full md:w-auto bg-gold-500 text-obsidian-950 px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/20 font-bold uppercase tracking-widest text-sm"
        >
          <Plus size={20} />
          <span>Nueva Área</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/30 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-obsidian-800 bg-obsidian-950/50">
                <th className="px-6 py-4 text-xs font-bold text-obsidian-400 uppercase tracking-wider">Nombre del Área</th>
                <th className="px-6 py-4 text-xs font-bold text-obsidian-400 uppercase tracking-wider">Encargado</th>
                <th className="px-6 py-4 text-xs font-bold text-obsidian-400 uppercase tracking-wider">Correo Reportes</th>
                <th className="px-6 py-4 text-xs font-bold text-obsidian-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-obsidian-500">Cargando áreas...</td></tr>
              ) : areas.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-obsidian-500">No hay áreas registradas.</td></tr>
              ) : areas.map((area) => (
                <tr key={area.id} className="hover:bg-obsidian-800/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-obsidian-100 uppercase">{area.nombre_area}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-obsidian-300">
                      <UserCheck size={16} className="text-gold-500" />
                      {employees.find(e => e.id === area.encargado_id)?.nombre_completo || 'Sin asignar'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gold-100">
                      <Mail size={16} className="text-gold-500" />
                      {area.correo_responsable || 'Sin correo'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => startEdit(area)}
                      className="p-2 text-obsidian-500 hover:text-gold-500 hover:bg-gold-500/10 rounded transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación/Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-light text-obsidian-50 tracking-wide uppercase mb-6">
              {editingArea ? 'Editar' : 'Nueva'} <span className="font-bold text-gold-500">Área</span>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Nombre del Área</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                  value={formData.nombre_area}
                  onChange={(e) => setFormData({...formData, nombre_area: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Encargado</label>
                <select 
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                  value={formData.encargado_id}
                  onChange={(e) => setFormData({...formData, encargado_id: e.target.value})}
                >
                  <option value="">Seleccionar encargado...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre_completo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Correo para Reportes</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                  value={formData.correo_responsable}
                  onChange={(e) => setFormData({...formData, correo_responsable: e.target.value})}
                />
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
                  className="flex-1 px-4 py-3 bg-gold-500 text-obsidian-950 rounded-lg hover:bg-gold-400 transition-colors uppercase tracking-widest text-sm font-bold"
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
