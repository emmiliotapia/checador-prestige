import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Download, Filter, FileText, Building2, FileSpreadsheet, User, Clock, Search, CheckCircle } from 'lucide-react';
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
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [areaRes, empRes] = await Promise.all([
          api.get('/areas', { params: { tenant_id: MOCK_TENANT_ID } }),
          api.get('/empleados', { params: { tenant_id: MOCK_TENANT_ID } })
        ]);
        setAreas(areaRes.data);
        setEmpleados(empRes.data);
      } catch (err) {
        console.error("Error al cargar catálogos para filtros:", err);
      }
    };
    fetchCatalogs();
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoadingReport(true);
    try {
      const response = await api.get(`/reportes/exportar`, {
        params: {
          tenant_id: MOCK_TENANT_ID,
          fecha_inicio: `${dateRange.start}T00:00:00`,
          fecha_fin: `${dateRange.end}T23:59:59`,
          area_id: selectedArea || undefined,
          empleado_id: selectedEmpleado || undefined
        }
      });
      setReportData(response.data);
      return response.data;
    } catch (error) {
      console.error("Error al consultar reporte:", error);
      return [];
    } finally {
      setLoadingReport(false);
    }
  }, [dateRange.start, dateRange.end, selectedArea, selectedEmpleado]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const filteredReport = useMemo(() => {
    if (!searchTerm) return reportData;
    const lower = searchTerm.toLowerCase();
    return reportData.filter(row =>
      row.empleado?.toLowerCase().includes(lower) ||
      row.id_reloj?.toString().includes(lower) ||
      row.area?.toLowerCase().includes(lower)
    );
  }, [reportData, searchTerm]);

  const summaryStats = useMemo(() => {
    const totalDays = filteredReport.length;
    const uniqueEmployees = new Set(filteredReport.map(r => r.id_reloj)).size;
    let totalMinutes = 0;

    filteredReport.forEach(r => {
      if (r.horas_trabajadas && r.horas_trabajadas.includes(':')) {
        const [h, m] = r.horas_trabajadas.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          totalMinutes += h * 60 + m;
        }
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remMinutes = totalMinutes % 60;

    return {
      totalDays,
      uniqueEmployees,
      formattedHours: `${String(totalHours).padStart(2, '0')}:${String(remMinutes).padStart(2, '0')} hrs`
    };
  }, [filteredReport]);

  const handleExport = async (type) => {
    setExporting(true);
    try {
      const data = filteredReport.length > 0 ? filteredReport : await fetchReportData();
      if (!data || data.length === 0) {
        alert("No hay registros para este rango de fechas y filtros.");
        return;
      }

      if (type === 'csv') {
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
    const headers = ['Empleado', 'ID Reloj', 'Área', 'Fecha', 'Entrada', 'Salida a Comer', 'Regreso de Comer', 'Salida', 'Horas Totales'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.empleado}"`,
        row.id_reloj,
        `"${row.area}"`,
        row.fecha,
        row.entrada,
        row.salida_comer,
        row.regreso_comer,
        row.salida,
        row.horas_trabajadas
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
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(184, 134, 11);
    doc.text('REPORTE DE ASISTENCIA PRESTIGE', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rango de Fechas: ${dateRange.start} al ${dateRange.end}`, 14, 30);
    
    const areaName = selectedArea ? areas.find(a => a.id === selectedArea)?.nombre_area || "Desconocida" : "Todas las Áreas";
    doc.text(`Área: ${areaName}`, 14, 35);
    
    const empName = selectedEmpleado ? empleados.find(e => e.id === selectedEmpleado)?.nombre_completo || "Desconocido" : "Todos los Empleados";
    doc.text(`Empleado: ${empName}`, 14, 40);
    
    doc.text(`Total de Días Trabajados: ${data.length}`, 14, 45);
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 50);

    const tableColumn = ["Empleado", "ID", "Área", "Fecha", "Entrada", "Sal. Comida", "Reg. Comida", "Salida", "Horas Totales"];
    const tableRows = data.map(row => [
      row.empleado || '',
      row.id_reloj ? String(row.id_reloj) : '',
      row.area || '',
      row.fecha || '',
      row.entrada || '--:--',
      row.salida_comer || '--:--',
      row.regreso_comer || '--:--',
      row.salida || '--:--',
      row.horas_trabajadas || '--:--'
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [18, 20, 25], textColor: [212, 165, 38] },
      alternateRowStyles: { fillColor: [248, 247, 244] },
      styles: { fontSize: 7 },
      didDrawPage: function (dataInfo) {
        let str = "Página " + doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        let pageSize = doc.internal.pageSize;
        let pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, dataInfo.settings.margin.left, pageHeight - 10);
      }
    });

    doc.save(`reporte_asistencia_${dateRange.start}_a_${dateRange.end}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-obsidian-900 border border-obsidian-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-obsidian-50 tracking-tight">
            Reportes de Asistencia y Nómina
          </h1>
          <p className="text-obsidian-400 text-sm font-medium mt-1">
            Consulta y exporta asistencias consolidadas por día operativo (corte 06:00 AM).
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button 
            onClick={() => handleExport('csv')}
            disabled={exporting || filteredReport.length === 0}
            className="flex-1 md:flex-none px-4 py-2.5 bg-obsidian-950 border border-obsidian-800 text-obsidian-100 hover:border-gold-500/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" />
            <span>Exportar Excel (CSV)</span>
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            disabled={exporting || filteredReport.length === 0}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gold-500 text-white dark:text-obsidian-950 hover:bg-gold-600 dark:hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-gold-500/20"
          >
            <Download size={16} />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Jornadas Consolidadas</span>
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-500 flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-obsidian-50 mt-3">
            {summaryStats.totalDays}
          </p>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Colaboradores en Periodo</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <User size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
            {summaryStats.uniqueEmployees}
          </p>
        </div>

        <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-obsidian-400 text-xs font-semibold uppercase tracking-wider">Horas Totales Acumuladas</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3">
            {summaryStats.formattedHours}
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-obsidian-900 p-6 rounded-2xl border border-obsidian-800 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-obsidian-800">
          <div className="flex items-center space-x-2">
            <Filter size={17} className="text-gold-500" />
            <span className="text-sm font-bold text-obsidian-50">Filtros de Consulta</span>
          </div>
          <span className="text-xs font-mono tabular-nums text-obsidian-400 bg-obsidian-950 px-3 py-1 rounded-lg border border-obsidian-800">
            {dateRange.start} → {dateRange.end}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Fecha Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2.5 border border-obsidian-800 bg-obsidian-950 text-obsidian-50 font-mono tabular-nums text-sm rounded-xl focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Fecha Fin</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2.5 border border-obsidian-800 bg-obsidian-950 text-obsidian-50 font-mono tabular-nums text-sm rounded-xl focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Departamento</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
              <select 
                className="w-full pl-10 pr-4 py-2.5 border border-obsidian-800 bg-obsidian-950 text-obsidian-50 text-sm font-medium rounded-xl focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setSelectedEmpleado('');
                }}
              >
                <option value="">Todos los Departamentos</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.nombre_area}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-obsidian-300 mb-1.5">Colaborador</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
              <select 
                className="w-full pl-10 pr-4 py-2.5 border border-obsidian-800 bg-obsidian-950 text-obsidian-50 text-sm font-medium rounded-xl focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
                value={selectedEmpleado}
                onChange={(e) => setSelectedEmpleado(e.target.value)}
              >
                <option value="">Todos los Colaboradores (Activos)</option>
                {(selectedArea ? empleados.filter(emp => emp.activo && emp.area_id === selectedArea) : empleados.filter(emp => emp.activo)).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-obsidian-900 rounded-2xl border border-obsidian-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-obsidian-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <FileText className="text-gold-500" size={19} />
            <div>
              <h3 className="text-base font-bold text-obsidian-50">Vista Previa de Nómina</h3>
              <p className="text-xs text-obsidian-400">Detalle de entradas, comidas y salidas por jornada</p>
            </div>
          </div>
          <div className="w-full md:w-72 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar por nombre o PIN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-obsidian-950 border border-obsidian-800 rounded-xl text-obsidian-50 text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder-obsidian-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-obsidian-950/60 text-obsidian-400 text-xs font-semibold border-b border-obsidian-800">
              <tr>
                <th className="px-6 py-3.5">Colaborador</th>
                <th className="px-6 py-3.5">Departamento</th>
                <th className="px-6 py-3.5">Fecha Operativa</th>
                <th className="px-6 py-3.5">Entrada</th>
                <th className="px-6 py-3.5">Intervalo Comida</th>
                <th className="px-6 py-3.5">Salida</th>
                <th className="px-6 py-3.5 text-right">Horas Trabajadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800/70">
              {loadingReport ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    Calculando jornadas operativas...
                  </td>
                </tr>
              ) : filteredReport.length > 0 ? (
                filteredReport.map((row, idx) => (
                  <tr key={`${row.id_reloj}-${row.fecha}-${idx}`} className="hover:bg-obsidian-950/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-bold text-sm text-obsidian-50">{row.empleado}</p>
                        <p className="text-xs text-obsidian-400 font-mono tabular-nums">PIN #{row.id_reloj}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-obsidian-950 text-obsidian-200 rounded-lg text-xs font-semibold border border-obsidian-800">
                        {row.area}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums text-xs font-semibold text-obsidian-200">
                      {row.fecha}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {row.entrada || '--:--:--'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums text-xs">
                      {row.salida_comer || row.regreso_comer ? (
                        <span className="px-2.5 py-1 rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20 font-bold">
                          {row.salida_comer || '--:--'} → {row.regreso_comer || '--:--'}
                        </span>
                      ) : (
                        <span className="text-obsidian-400 italic">Sin registro</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.salida ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-bold bg-obsidian-950 text-obsidian-100 border border-obsidian-700">
                          {row.salida}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          En Turno
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono tabular-nums">
                      {row.horas_trabajadas ? (
                        <span className="text-sm font-bold text-gold-600 dark:text-gold-400">{row.horas_trabajadas} hrs</span>
                      ) : (
                        <span className="text-xs text-obsidian-400">--:--</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-obsidian-400 text-sm">
                    No se encontraron registros de asistencia para el periodo seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
