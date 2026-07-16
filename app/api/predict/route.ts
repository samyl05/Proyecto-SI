import { NextResponse } from 'next/server';

function readMetric(value: unknown, label: string, min: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} debe estar entre ${min} y ${max}`);
  }

  return parsed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Los datos enviados no son válidos' },
        { status: 400 }
      );
    }

    let hours: number;
    let attendance: number;
    let participation: number;

    try {
      hours = readMetric((body as { hours?: unknown }).hours, 'Las horas de estudio', 0, 50);
      attendance = readMetric(
        (body as { attendance?: unknown }).attendance,
        'La asistencia',
        0,
        100
      );
      participation = readMetric(
        (body as { participation?: unknown }).participation,
        'La participación',
        1,
        10
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Las métricas no son válidas',
        },
        { status: 400 }
      );
    }

    // Proyección analítica basada en ponderaciones obtenidas del conjunto de datos.
    const baseScore = 38.5;
    const hoursImpact = hours * 1.45;
    const attendanceImpact = (attendance / 100) * 35;
    const participationImpact = participation * 1.8;

    let finalScore = baseScore + hoursImpact + attendanceImpact + participationImpact;
    finalScore = Math.min(100, Math.max(0, finalScore));

    let predictedGrade = 'F';
    let comment = 'Insuficiente / Perdido totalmente';

    if (finalScore >= 90) {
      predictedGrade = 'A';
      comment = 'Excelente (Máxima nota)';
    } else if (finalScore >= 80) {
      predictedGrade = 'B';
      comment = 'Muy Bueno';
    } else if (finalScore >= 70) {
      predictedGrade = 'C';
      comment = 'Aprobado (Mínimo para pasar)';
    } else if (finalScore >= 60) {
      predictedGrade = 'D';
      comment = 'A punto de perder / Reprobado por poco';
    } else if (finalScore >= 50) {
      predictedGrade = 'F';
      comment = 'Deficiente / Reprobado';
    }

    return NextResponse.json({
      success: true,
      predictedScore: finalScore.toFixed(1),
      predictedGrade,
      comment,
    });
  } catch (error) {
    console.error('Error al procesar la proyección:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la predicción' },
      { status: 500 }
    );
  }
}
