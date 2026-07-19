import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { hours, attendance, participation } = await request.json();

    const hoursVal = Number(hours);
    const attendanceVal = Number(attendance);
    const participationVal = Number(participation);

    if (isNaN(hoursVal) || hoursVal < 0 || hoursVal > 40) {
      return NextResponse.json(
        { success: false, error: 'Las horas de estudio semanales deben ser un número entre 0 y 40' },
        { status: 400 }
      );
    }

    if (isNaN(attendanceVal) || attendanceVal < 0 || attendanceVal > 100) {
      return NextResponse.json(
        { success: false, error: 'El porcentaje de asistencia debe ser un número entre 0 y 100' },
        { status: 400 }
      );
    }

    if (isNaN(participationVal) || participationVal < 1 || participationVal > 10) {
      return NextResponse.json(
        { success: false, error: 'La participación debe ser un número entre 1 y 10' },
        { status: 400 }
      );
    }

    // Lógica matemática analítica basada en tu dataset
    const baseScore = 38.5;
    const hoursImpact = hoursVal * 1.45;
    const attendanceImpact = (attendanceVal / 100) * 35; 
    const participationImpact = participationVal * 1.8;

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