import { useState, useEffect } from 'react';
import { Mail, Edit2, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://164.92.110.179:8100';

export default function AreasView() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/areas?tenant_id=${user.tenant_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAreas(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las áreas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (areaId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/areas/${areaId}`, 
        { correo_responsable: editEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAreas(areas.map(a => a.id === areaId ? { ...a, correo_responsable: editEmail } : a));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el correo.');
    }
  };

  const startEditing = (area) => {
    setEditingId(area.id);
    setEditEmail(area.correo_responsable || '');
  };

  if (user?.rol !== 'ROOT' && user?.rol !== 'ADMIN') {
    return <div className="text-red-400 p-8 text-center bg-obsidian-900 rounded-xl">No tienes permisos para ver esta sección.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-obsidian-50 tracking-wide uppercase">Gestión de <span className="font-bold text-gold-500">Áreas</span></h1>
          <p className="text-obsidian-400 mt-1">Asigna a los encargados que recibirán los correos automáticos.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/30 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <svg className="animate-spin h-8 w-8 text-gold-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-obsidian-800 bg-obsidian-950/50">
                  <th className="px-6 py-4 text-xs font-bold text-obsidian-400 uppercase tracking-wider">Nombre del Área</th>
                  <th className="px-6 py-4 text-xs font-bold text-obsidian-400 uppercase tracking-wider">Correo del Encargado</th>
                  <th className="px-6 py-4 text-xs font-bold text-obsidian-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-800">
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-obsidian-500">
                      No hay áreas registradas. Importa empleados para que se creen automáticamente.
                    </td>
                  </tr>
                ) : (
                  areas.map((area) => (
                    <tr key={area.id} className="hover:bg-obsidian-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-obsidian-100 uppercase">{area.nombre_area}</div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === area.id ? (
                          <div className="flex items-center gap-2">
                            <Mail className="text-obsidian-500 w-4 h-4" />
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="correo@ejemplo.com"
                              className="bg-obsidian-950 border border-gold-500/50 text-gold-50 text-sm rounded px-3 py-1 w-full focus:outline-none focus:border-gold-500 transition-colors"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-obsidian-300">
                            {area.correo_responsable ? (
                              <>
                                <Mail className="text-gold-500 w-4 h-4" />
                                <span className="text-gold-100">{area.correo_responsable}</span>
                              </>
                            ) : (
                              <span className="text-obsidian-600 italic">No asignado</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {editingId === area.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSave(area.id)}
                              className="p-2 text-green-400 hover:bg-green-400/10 rounded transition-colors"
                              title="Guardar"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                              title="Cancelar"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(area)}
                            className="p-2 text-obsidian-500 hover:text-gold-500 hover:bg-gold-500/10 rounded transition-colors"
                            title="Editar Correo"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
