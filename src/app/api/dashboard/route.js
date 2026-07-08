import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Consultas de Business Intelligence (Agregaciones masivas optimizadas)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_estudiantes,
        ROUND(AVG(total_score), 2) as promedio_general,
        ROUND(AVG(attendance_percentage), 2) as asistencia_promedio,
        ROUND(AVG(weekly_self_study_hours), 2) as horas_estudio_promedio
      FROM estudiantes;
    `;
    
    const gradesDistributionQuery = `
      SELECT grade, COUNT(*) as cantidad 
      FROM estudiantes 
      GROUP BY grade 
      ORDER BY grade;
    `;

    const stats = await query(statsQuery);
    const distribution = await query(gradesDistributionQuery);

    return NextResponse.json({
      metricas: stats.rows[0],
      distribucionGrados: distribution.rows
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}