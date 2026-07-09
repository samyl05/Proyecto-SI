import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    return JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
