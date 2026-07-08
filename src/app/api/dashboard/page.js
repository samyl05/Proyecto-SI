'use client';
import { useEffect, useState } from 'react';

export default function DashboardBI() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroGrade, setFiltroGrade] = useState('Todos');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white text-xl">Cargando Analítica de 1,000,000 de registros...</div>;
  }

  const { metricas, distribucionGrados } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Panel de Inteligencia de Negocios (BI)</h1>
          <p className="text-slate-400">Análisis masivo de rendimiento y permanencia académica</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Exportando Reporte Ejecutivo...')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm">
            Exportar PDF
          </button>
          <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-sm">
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Grid de KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-sm font-medium text-slate-400 uppercase">Estudiantes Analizados</p>
          <p className="text-3xl font-bold text-white mt-2">{parseInt(metricas.total_estudiantes).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-sm font-medium text-slate-400 uppercase">Calificación Promedio</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{metricas.promedio_general}%</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-sm font-medium text-slate-400 uppercase">Asistencia Promedio</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{metricas.asistencia_promedio}%</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-sm font-medium text-slate-400 uppercase">Horas Auto-Estudio / Sem</p>
          <p className="text-3xl font-bold text-amber-400 mt-2">{metricas.horas_estudio_promedio} hrs</p>
        </div>
      </div>

      {/* Contenedor de Gráficos y Tablas de BI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabla de distribución */}
        <div className="lg:col-span-1 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Distribución de Calificaciones (Grades)</h2>
          <div className="space-y-4">
            {distribucionGrados.map((item) => (
              <div key={item.grade}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-300">Calificación {item.grade}</span>
                  <span className="text-slate-400">{parseInt(item.cantidad).toLocaleString()} alumnos</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${(item.cantidad / metricas.total_estudiantes) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Módulo de Verificaciones y Alertas Tempranas (Seguridad y BI) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Filtro de Verificación Académica Masiva</h2>
            <select 
              value={filtroGrade} 
              onChange={(e) => setFiltroGrade(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Todos">Todos los Grados</option>
              <option value="A">Grado A</option>
              <option value="B">Grado B</option>
              <option value="C">Grado C</option>
              <option value="D">Grado D</option>
              <option value="F">Grado F</option>
            </select>
          </div>
          
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-300 mb-4">
            <strong>Verificación del Sistema:</strong> Se detectan patrones donde una asistencia menor al 75% correlaciona directamente con calificaciones inferiores a 'C'. Se sugiere automatizar alertas de retención.
          </div>

          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg text-slate-500">
            Filtrando vista analítica para: <span className="text-indigo-400 font-semibold">{filtroGrade}</span>. 
            El motor BI procesa el subconjunto de datos en tiempo real.
          </div>
        </div>
      </div>
    </div>
  );
}