import React, { useState } from 'react';
import { Calendar, Download, Filter, FileText } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function ReportesView() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/reportes/exportar`, {
        params: {
          tenant_id: MOCK_TENANT_ID,
          fecha_inicio: `${dateRange.start}T00:00:00`,
          fecha_fin: `${dateRange.end}T23:59:59`
        }
      });
      
      const data = response.data;
      if (data.length === 0) {
        alert("No hay registros para este rango de fechas.");
        return;
      }

      // Generate CSV
      const headers = ['Empleado', 'ID Reloj', 'Timestamp', 'Tipo', 'Dispositivo'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => [
          `"${row.empleado}"`,
          row.id_reloj,
          row.timestamp,
          row.tipo === '0' ? 'Entrada' : 'Salida',
          row.dispositivo
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_asistencia_${dateRange.start}_a_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      alert("Error al exportar reporte.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-obsidian-50 tracking-wide uppercase">Generación de <span className="font-bold text-gold-500">Reportes</span></h1>
          <p className="text-obsidian-400 mt-1">Exporta la asistencia para nómina y control.</p>
        </div>
      </div>

      <div className="bg-obsidian-900 p-6 md:p-8 rounded-2xl border border-obsidian-800 shadow-xl max-w-2xl">
        <div className="flex items-center space-x-2 text-gold-500 font-semibold mb-6">
          <Filter size={20} />
          <span className="uppercase tracking-widest text-sm">Filtros de Exportación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Fecha Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-3 border border-obsidian-700 bg-obsidian-950 text-gold-50 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent focus:outline-none transition-all"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Fecha Fin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-3 border border-obsidian-700 bg-obsidian-950 text-gold-50 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent focus:outline-none transition-all"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-obsidian-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-obsidian-400 text-sm">
            <FileText size={18} />
            <span>Formato: CSV (Compatible con Excel)</span>
          </div>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className={`w-full md:w-auto flex justify-center items-center space-x-2 px-8 py-3 rounded-lg font-bold transition-all uppercase tracking-widest ${
              exporting 
                ? 'bg-obsidian-800 text-obsidian-500 cursor-not-allowed' 
                : 'bg-gold-500 text-obsidian-950 hover:bg-gold-400 shadow-lg shadow-gold-900/20'
            }`}
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin"></div>
            ) : (
              <Download size={20} />
            )}
            <span>{exporting ? 'Generando...' : 'Exportar CSV'}</span>
          </button>
        </div>
      </div>

      <div className="bg-obsidian-800/50 border border-gold-500/30 p-6 rounded-2xl max-w-2xl flex gap-4 items-start">
        <div className="p-2 bg-gold-500/20 text-gold-500 rounded-full shrink-0">
          <FileText size={20} />
        </div>
        <div>
          <h4 className="text-gold-400 font-bold mb-1 uppercase tracking-wider text-sm">Tip de Sistema</h4>
          <p className="text-obsidian-300 text-sm leading-relaxed">
            Puedes usar el reporte generado para importar los datos directamente en tu software de nómina. 
            Asegúrate de que las fechas correspondan a la catorcena o quincena deseada.
          </p>
        </div>
      </div>
    </div>
  );
}
