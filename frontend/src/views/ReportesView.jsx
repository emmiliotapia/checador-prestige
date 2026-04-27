import React, { useState } from 'react';
import { Calendar, Download, Filter, FileText } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE = 'http://164.92.110.179:8100/api';
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
      const response = await axios.get(`${API_BASE}/reportes/exportar`, {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes de Asistencia</h1>
          <p className="text-slate-500">Genera reportes detallados para nómina y control.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
        <div className="flex items-center space-x-2 text-brand-700 font-semibold mb-6">
          <Filter size={20} />
          <span>Filtros de Exportación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-slate-500 text-sm">
            <FileText size={18} />
            <span>Formato: CSV (Excel Compatible)</span>
          </div>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
              exporting 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-100'
            }`}
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Download size={20} />
            )}
            <span>{exporting ? 'Generando...' : 'Exportar Reporte'}</span>
          </button>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-100 p-6 rounded-2xl max-w-2xl">
        <h4 className="text-brand-900 font-bold mb-2">Tip Pro</h4>
        <p className="text-brand-700 text-sm">
          Puedes usar el reporte generado para importar los datos directamente en tu software de nómina. 
          Los registros se filtran automáticamente por el tenant actual.
        </p>
      </div>
    </div>
  );
}
