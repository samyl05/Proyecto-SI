import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySessionToken, type SessionUser } from '@/lib/session';

export const runtime = 'nodejs';

async function getAdminSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get('session')?.value);
  return user?.role === 'ADMIN' ? user : null;
}

export async function GET() {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const accounts = await prisma.user.findMany({
      where: {
        role: { in: ['PROFESOR', 'ESTUDIANTE'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        studentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudieron obtener las cuentas registradas' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Debe indicar la cuenta que desea eliminar' },
        { status: 400 }
      );
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { success: false, error: 'No puede eliminar su propia cuenta administrativa' },
        { status: 400 }
      );
    }

    const account = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'La cuenta seleccionada ya no existe' },
        { status: 404 }
      );
    }

    if (account.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Las cuentas administrativas no pueden eliminarse desde este módulo' },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo eliminar la cuenta seleccionada' },
      { status: 500 }
    );
  }
}
