import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, FileText, Building2, FileJson } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function ReportesView() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedArea, setSelectedArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('csv'); // 'csv' o 'pdf'

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get('/areas', { params: { tenant_id: MOCK_TENANT_ID } });
        setAreas(res.data);
      } catch (err) {
        console.error("Error al cargar áreas para filtros:", err);
      }
    };
    fetchAreas();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/reportes/exportar`, {
        params: {
          tenant_id: MOCK_TENANT_ID,
          fecha_inicio: `${dateRange.start}T00:00:00`,
          fecha_fin: `${dateRange.end}T23:59:59`,
          area_id: selectedArea || undefined
        }
      });
      
      const data = response.data;
      if (data.length === 0) {
        alert("No hay registros para este rango de fechas y filtros.");
        return;
      }

      if (exportType === 'csv') {
        exportCSV(data);
      } else {
        exportPDF(data);
      }

    } catch (error) {
      console.error("Export error:", error);
      alert("Error al exportar reporte.");
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = (data) => {
    const headers = ['Empleado', 'ID Reloj', 'Fecha', 'Hora', 'Tipo', 'Area', 'Puesto', 'Dispositivo'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.empleado}"`,
        row.id_reloj,
        row.fecha,
        row.hora,
        row.tipo,
        `"${row.area}"`,
        `"${row.puesto}"`,
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
  };

  const exportPDF = (data) => {
    const doc = jsPDF();
    
    // Configuración estética del PDF
    doc.setFontSize(18);
    doc.setTextColor(184, 134, 11); // Color oro
    doc.text('REPORTE DE ASISTENCIA PRESTIGE', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rango: ${dateRange.start} al ${dateRange.end}`, 14, 30);
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

    const tableColumn = ["Empleado", "ID", "Fecha", "Hora", "Tipo", "Area", "Puesto"];
    const tableRows = data.map(row => [
      row.empleado,
      row.id_reloj,
      row.fecha,
      row.hora,
      row.tipo,
      row.area,
      row.puesto
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], textColor: [184, 134, 11] }, // Obsidian & Gold
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8 }
    });

    doc.save(`reporte_asistencia_${dateRange.start}_a_${dateRange.end}.pdf`);
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
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-obsidian-300 mb-2 uppercase tracking-wider">Filtrar por Área (Opcional)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500" size={18} />
              <select 
                className="w-full pl-10 pr-4 py-3 border border-obsidian-700 bg-obsidian-950 text-gold-50 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent focus:outline-none transition-all"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="">Todas las Áreas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.nombre_area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-obsidian-800">
           <label className="block text-xs font-bold text-obsidian-400 mb-4 uppercase tracking-widest text-center">Formato de Salida</label>
           <div className="flex justify-center space-x-4 mb-8">
              <button 
                onClick={() => setExportType('csv')}
                className={`flex-1 flex flex-col items-center p-4 rounded-xl border transition-all ${exportType === 'csv' ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-obsidian-950 border-obsidian-800 text-obsidian-400'}`}
              >
                <FileText size={24} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Excel / CSV</span>
              </button>
              <button 
                onClick={() => setExportType('pdf')}
                className={`flex-1 flex flex-col items-center p-4 rounded-xl border transition-all ${exportType === 'pdf' ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-obsidian-950 border-obsidian-800 text-obsidian-400'}`}
              >
                <FileJson size={24} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Documento PDF</span>
              </button>
           </div>

          <button 
            onClick={handleExport}
            disabled={exporting}
            className={`w-full flex justify-center items-center space-x-2 px-8 py-4 rounded-lg font-bold transition-all uppercase tracking-widest ${
              exporting 
                ? 'bg-obsidian-800 text-obsidian-500 cursor-not-allowed' 
                : 'bg-gold-500 text-obsidian-950 hover:bg-gold-400 shadow-xl shadow-gold-900/30'
            }`}
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin"></div>
            ) : (
              <Download size={20} />
            )}
            <span>{exporting ? 'Generando...' : `Exportar en ${exportType.toUpperCase()}`}</span>
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
            El reporte PDF es ideal para firmas físicas, mientras que el CSV es mejor para fórmulas en Excel o integraciones automáticas (n8n).
          </p>
        </div>
      </div>
    </div>
  );
}
