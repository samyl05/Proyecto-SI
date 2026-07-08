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
    if (finalScore >= 90) predictedGrade = 'A';
    else if (finalScore >= 80) predictedGrade = 'B';
    else if (finalScore >= 70) predictedGrade = 'C';
    else if (finalScore >= 60) predictedGrade = 'D';

    return NextResponse.json({
      success: true,
      predictedScore: finalScore.toFixed(1),
      predictedGrade,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al procesar la predicción' }, { status: 500 });
  }
}