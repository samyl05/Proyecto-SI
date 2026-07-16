import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = verifySessionToken(cookieStore.get('session')?.value);

    if (!user || user.role !== 'ESTUDIANTE' || !user.studentId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado o no es un estudiante válido' },
        { status: 401 }
      );
    }

    const studentInfo = await prisma.student.findFirst({
      where: { studentId: user.studentId },
    });

    if (!studentInfo) {
      return NextResponse.json(
        { success: false, error: 'Información del estudiante no encontrada en la base de datos' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, student: studentInfo });
  } catch (error) {
    console.error('Error al obtener información del estudiante:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo obtener la información del estudiante' },
      { status: 500 }
    );
  }
}
