import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { hours, attendance, participation } = await request.json();

    // Lógica matemática analítica basada en tu dataset
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
    } else {
      predictedGrade = 'F';
      comment = 'Insuficiente / Perdido totalmente';
    }

    return NextResponse.json({
      success: true,
      predictedScore: finalScore.toFixed(1),
      predictedGrade,
      comment,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al procesar la predicción' }, { status: 500 });
  }
}