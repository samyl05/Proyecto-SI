import { useEffect, useState } from 'react';

// Simulamos los datos por ahora ya que en Vite el backend se maneja por separado 
// o mediante una API externa, asegurando que tu interfaz cargue DE INMEDIATO.
export default function App() {
  const [data, setData] = useState({
    metricas: { total_estudiantes: 1000000, promedio_general: 85.4, asistencia_promedio: 92.1, horas_estudio_promedio: 15.3 },
    distribucionGrados: [
      { grade: 'A', cantidad: 350000 },
      { grade: 'B', cantidad: 400000 },
      { grade: 'C', cantidad: 150000 },
      { grade: 'D', cantidad: 70000 },
      { grade: 'F', cantidad: 30000 }
    ]
  });
  const [filtroGrade, setFiltroGrade] = useState('Todos');

  const { metricas, distribucionGrados } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8" style={{ fontFamily: 'sans-serif' }}>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Panel de Inteligencia de Negocios (BI)</h1>
          <p className="text-slate-400" style={{ color: '#94a3b8', marginTop: '0.25rem', margin: 0 }}>Análisis masivo de rendimiento y permanencia académica</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => alert('Exportando Reporte Ejecutivo...')} style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
            Exportar PDF
          </button>
          <button onClick={() => alert('Cerrando Sesión...')} style={{ padding: '0.5rem 1rem', backgroundColor: '#1e293b', color: '#cbd5e1', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Grid de KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#0f172a', p: '1.5rem', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', margin: 0, fontWeight: '500' }}>Estudiantes Analizados</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem', margin: 0 }}>{metricas.total_estudiantes.toLocaleString()}</p>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', margin: 0, fontWeight: '500' }}>Calificación Promedio</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#34d399', marginTop: '0.5rem', margin: 0 }}>{metricas.promedio_general}%</p>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', margin: 0, fontWeight: '500' }}>Asistencia Promedio</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#60a5fa', marginTop: '0.5rem', margin: 0 }}>{metricas.asistencia_promedio}%</p>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', margin: 0, fontWeight: '500' }}>Horas Auto-Estudio / Sem</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fbbf24', marginTop: '0.5rem', margin: 0 }}>{metricas.horas_estudio_promedio} hrs</p>
        </div>
      </div>

      {/* Contenedor de Gráficos de BI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Distribución */}
        <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fff', marginBottom: '1rem', marginTop: 0 }}>Distribución de Calificaciones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {distribucionGrados.map((item) => (
              <div key={item.grade}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Calificación {item.grade}</span>
                  <span style={{ color: '#94a3b8' }}>{item.cantidad.toLocaleString()} alumnos</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#1e293b', height: '0.5rem', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div 
                    style={{ backgroundColor: '#6366f1', height: '100%', borderRadius: '9999px', width: `${(item.cantidad / metricas.total_estudiantes) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verificaciones */}
        <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fff', margin: 0 }}>Filtro de Verificación Académica Masiva</h2>
            <select 
              value={filtroGrade} 
              onChange={(e) => setFiltroGrade(e.target.value)}
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.875rem' }}
            >
              <option value="Todos">Todos los Grados</option>
              <option value="A">Grado A</option>
              <option value="B">Grado B</option>
              <option value="C">Grado C</option>
            </select>
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#fde047', marginBottom: '1rem' }}>
            <strong>Verificación del Sistema:</strong> Se detectan patrones donde una asistencia menor al 75% correlaciona directamente con calificaciones inferiores a 'C'.
          </div>

          <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px dashed #334155', borderRadius: '0.5rem', color: '#64748b' }}>
            Filtrando vista analítica para: <span style={{ color: '#818cf8', fontWeight: '600' }}>{filtroGrade}</span>.
          </div>
        </div>
      </div>
    </div>
  );
}