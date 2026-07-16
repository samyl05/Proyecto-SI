import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import { createSessionToken, type SessionUser } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'El correo y la contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Ingrese un correo electrónico válido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    let passwordMatches = false;
    const passwordIsHashed = Boolean(user?.password?.startsWith('$2'));

    if (user) {
      passwordMatches = passwordIsHashed
        ? await bcrypt.compare(password, user.password)
        : user.password === password;
    }

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    if (!user.approved) {
      return NextResponse.json(
        { success: false, error: 'Su cuenta está pendiente de aprobación por el administrador.' },
        { status: 403 }
      );
    }

    // Migra automáticamente las contraseñas antiguas en texto plano al iniciar sesión.
    if (!passwordIsHashed) {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      });
    }

    const userData: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      approved: user.approved,
    };

    const sessionData = createSessionToken(userData);
    const cookieStore = await cookies();
    cookieStore.set('session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo iniciar sesión. Inténtelo nuevamente.' },
      { status: 500 }
    );
  }
}
