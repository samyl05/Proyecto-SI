import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'El correo y la contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Comparación directa en texto plano como se solicita
    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Verificar si la cuenta está aprobada
    if (!user.approved) {
      return NextResponse.json(
        { success: false, error: 'Su cuenta está pendiente de aprobación por el administrador.' },
        { status: 403 }
      );
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      approved: user.approved,
    };

    // Serializar a base64 para almacenar en la cookie de sesión de forma simple
    const sessionData = Buffer.from(JSON.stringify(userData)).toString('base64');

    const cookieStore = await cookies();
    cookieStore.set('session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error en el inicio de sesión: ' + error.message },
      { status: 500 }
    );
  }
}
