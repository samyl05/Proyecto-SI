import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import bcrypt from 'bcryptjs';

const ALLOWED_ROLES = new Set(['PROFESOR', 'ESTUDIANTE']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const role = typeof body.role === 'string' ? body.role : '';
    const studentId = body.studentId;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos obligatorios deben completarse' },
        { status: 400 }
      );
    }

    if (name.length < 3 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'El nombre debe contener entre 3 y 100 caracteres' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Ingrese un correo electrónico válido, por ejemplo usuario@dominio.com' },
        { status: 400 }
      );
    }

    if (password.length < 6 || password.length > 100) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe contener entre 6 y 100 caracteres' },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol no válido' },
        { status: 400 }
      );
    }

    let parsedStudentId: number | null = null;
    if (role === 'ESTUDIANTE') {
      if (studentId === undefined || studentId === null || studentId === '') {
        return NextResponse.json(
          { success: false, error: 'El ID del estudiante es requerido para el rol Estudiante' },
          { status: 400 }
        );
      }

      parsedStudentId = Number(studentId);
      if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
        return NextResponse.json(
          { success: false, error: 'El ID del estudiante debe ser un número entero positivo' },
          { status: 400 }
        );
      }

      const studentExists = await prisma.student.findFirst({
        where: { studentId: parsedStudentId },
        select: { id: true },
      });

      if (!studentExists) {
        return NextResponse.json(
          { success: false, error: 'El ID del estudiante no existe en la base de datos de rendimiento académico' },
          { status: 400 }
        );
      }

      const studentIdTaken = await prisma.user.findFirst({
        where: { studentId: parsedStudentId },
        select: { id: true },
      });

      if (studentIdTaken) {
        return NextResponse.json(
          { success: false, error: 'Este ID de estudiante ya está registrado con otro usuario' },
          { status: 409 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El correo electrónico ya está registrado' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: role as 'PROFESOR' | 'ESTUDIANTE',
        studentId: parsedStudentId,
        approved: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registro exitoso. Su cuenta está pendiente de aprobación por el administrador.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approved: user.approved,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const prismaCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';

    if (prismaCode === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'El correo o el ID de estudiante ya están registrados' },
        { status: 409 }
      );
    }

    console.error('Error en el registro:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo completar el registro. Inténtelo nuevamente.' },
      { status: 500 }
    );
  }
}
