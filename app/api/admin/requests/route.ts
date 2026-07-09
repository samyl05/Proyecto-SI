import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return false;
  try {
    const decoded = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
    return decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const pendingUsers = await prisma.user.findMany({
      where: { approved: false },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests: pendingUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { userId, action } = await request.json();

    if (!userId || !action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
    }

    if (action === 'approve') {
      await prisma.user.update({
        where: { id: userId },
        data: { approved: true },
      });
      return NextResponse.json({ success: true, message: 'Usuario aprobado con éxito' });
    } else {
      await prisma.user.delete({
        where: { id: userId },
      });
      return NextResponse.json({ success: true, message: 'Solicitud rechazada con éxito' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
