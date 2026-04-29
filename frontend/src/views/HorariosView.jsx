import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import api from '../api';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function HorariosView() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_horario: '',
    hora_entrada: '08:00',
    hora_salida: '16:00',
    tolerancia_minutos: 10,
    inicio_comida: '13:00',
    fin_comida: '14:00',
    tenant_id: MOCK_TENANT_ID
  });

  useEffect(() => {
    fetchHorarios();
  }, []);

  const fetchHorarios = async () => {
    try {
      const res = await api.get(`/horarios?tenant_id=${MOCK_TENANT_ID}`);
      setHorarios(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/horarios', formData);
      setShowModal(false);
      setFormData({
        nombre_horario: '',
        hora_entrada: '08:00',
        hora_salida: '16:00',
        tolerancia_minutos: 10,
        inicio_comida: '13:00',
        fin_comida: '14:00',
        tenant_id: MOCK_TENANT_ID
      });
      fetchHorarios();
    } catch (err) {
      alert("Error al guardar horario");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-obsidian-50 tracking-wide uppercase">Gestión de <span className="font-bold text-gold-500">Horarios</span></h1>
          <p className="text-obsidian-400 mt-1">Configura turnos, tolerancias y tiempos de comida.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-gold-500 text-obsidian-950 px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-900/20 font-bold uppercase tracking-widest text-sm"
        >
          <Plus size={20} />
          <span>Nuevo Horario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center p-12 text-obsidian-500 italic">Cargando horarios...</div>
        ) : horarios.length === 0 ? (
          <div className="col-span-full text-center p-12 text-obsidian-500 italic">No hay horarios configurados.</div>
        ) : horarios.map(h => (
          <div key={h.id} className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-6 shadow-xl hover:border-gold-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gold-500/10 rounded-xl text-gold-500">
                <Clock size={24} />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-obsidian-400 hover:text-gold-500"><Edit2 size={16} /></button>
                <button className="p-2 text-obsidian-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-obsidian-50 uppercase mb-4 tracking-wider">{h.nombre_horario}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-obsidian-400 font-bold uppercase tracking-widest text-[10px]">Entrada</span>
                <span className="text-gold-400 font-bold">{h.hora_entrada.slice(0,5)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-obsidian-400 font-bold uppercase tracking-widest text-[10px]">Tolerancia</span>
                <span className="text-obsidian-200">{h.tolerancia_minutos} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-obsidian-400 font-bold uppercase tracking-widest text-[10px]">Comida</span>
                <span className="text-obsidian-200">{h.inicio_comida.slice(0,5)} - {h.fin_comida.slice(0,5)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-obsidian-400 font-bold uppercase tracking-widest text-[10px]">Salida</span>
                <span className="text-gold-400 font-bold">{h.hora_salida.slice(0,5)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Horario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-obsidian-900 rounded-2xl shadow-2xl border border-obsidian-800 w-full max-w-lg p-8">
            <h3 className="text-2xl font-light text-obsidian-50 tracking-wide uppercase mb-6">Nuevo <span className="font-bold text-gold-500">Horario</span></h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Nombre del Horario</label>
                <input required type="text" className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500" value={formData.nombre_horario} onChange={e => setFormData({...formData, nombre_horario: e.target.value})} placeholder="Ej. Turno Matutino" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Hora Entrada</label>
                  <input required type="time" className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500" value={formData.hora_entrada} onChange={e => setFormData({...formData, hora_entrada: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Tolerancia (Min)</label>
                  <input required type="number" className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500" value={formData.tolerancia_minutos} onChange={e => setFormData({...formData, tolerancia_minutos: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Inicio Comida</label>
                  <input required type="time" className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500" value={formData.inicio_comida} onChange={e => setFormData({...formData, inicio_comida: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Fin Comida</label>
                  <input required type="time" className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500" value={formData.fin_comida} onChange={e => setFormData({...formData, fin_comida: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-obsidian-400 mb-1 uppercase tracking-widest">Hora Salida</label>
                <input required type="time" className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-700 rounded-lg text-gold-50 outline-none focus:ring-2 focus:ring-gold-500" value={formData.hora_salida} onChange={e => setFormData({...formData, hora_salida: e.target.value})} />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-obsidian-700 text-obsidian-400 rounded-lg font-bold uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-gold-500 text-obsidian-950 rounded-lg font-bold uppercase text-xs tracking-widest">Guardar Horario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
