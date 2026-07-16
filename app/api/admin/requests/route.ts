import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export const runtime = 'nodejs';

async function isAdmin() {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get('session')?.value);
  return user?.role === 'ADMIN';
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const pendingUsers = await prisma.user.findMany({
      where: { approved: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, requests: pendingUsers });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudieron obtener las solicitudes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const action = body.action;

    if (!userId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
    }

    if (action === 'approve') {
      await prisma.user.update({
        where: { id: userId },
        data: { approved: true },
      });
      return NextResponse.json({ success: true, message: 'Usuario aprobado con éxito' });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true, message: 'Solicitud rechazada con éxito' });
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo procesar la solicitud' },
      { status: 500 }
    );
  }
}
