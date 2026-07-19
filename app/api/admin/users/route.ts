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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
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

    if (!userId || !action || (action !== 'enable' && action !== 'disable')) {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
    }

    const approvedValue = action === 'enable';

    const user = await prisma.user.update({
      where: { id: userId },
      data: { approved: approvedValue },
    });

    return NextResponse.json({
      success: true,
      message: `Cuenta ${approvedValue ? 'habilitada' : 'deshabilitada'} con éxito`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
