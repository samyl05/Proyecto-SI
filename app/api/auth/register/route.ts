import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, email, password, role, studentId } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos obligatorios deben completarse' },
        { status: 400 }
      );
    }

    // Validar el formato y dominio del correo electrónico
    const emailRegex = /^[^@]+@(gmail\.com|hotmail\.com|outlook\.com)$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'El correo debe tener un formato válido y usar uno de los dominios permitidos: @gmail.com, @hotmail.com o @outlook.com' },
        { status: 400 }
      );
    }

    if (role !== 'PROFESOR' && role !== 'ESTUDIANTE') {
      return NextResponse.json(
        { success: false, error: 'Rol no válido' },
        { status: 400 }
      );
    }

    let parsedStudentId: number | null = null;
    if (role === 'ESTUDIANTE') {
      if (!studentId) {
        return NextResponse.json(
          { success: false, error: 'El ID del estudiante es requerido para el rol Estudiante' },
          { status: 400 }
        );
      }
      parsedStudentId = parseInt(studentId, 10);
      if (isNaN(parsedStudentId)) {
        return NextResponse.json(
          { success: false, error: 'El ID del estudiante debe ser un número válido' },
          { status: 400 }
        );
      }

      // Validar si el ID de estudiante es mayor que el ID máximo registrado en la base de datos
      const maxStudentIdAggregate = await prisma.student.aggregate({
        _max: {
          studentId: true,
        },
      });
      const maxStudentId = maxStudentIdAggregate._max.studentId || 1000000;

      if (parsedStudentId > maxStudentId) {
        return NextResponse.json(
          { success: false, error: `El ID del estudiante (${parsedStudentId}) no puede ser mayor que el ID máximo en la base de datos (${maxStudentId})` },
          { status: 400 }
        );
      }

      // Validar si el ID de estudiante existe en la base de datos de rendimiento académico
      const studentExists = await prisma.student.findFirst({
        where: { studentId: parsedStudentId },
      });

      if (!studentExists) {
        return NextResponse.json(
          { success: false, error: 'El ID del estudiante no existe en la base de datos de rendimiento académico' },
          { status: 400 }
        );
      }

      // Validar si el ID de estudiante ya está asociado a otro usuario
      const studentIdTaken = await prisma.user.findFirst({
        where: { studentId: parsedStudentId },
      });

      if (studentIdTaken) {
        return NextResponse.json(
          { success: false, error: 'Este ID de estudiante ya está registrado con otro usuario' },
          { status: 400 }
        );
      }
    }

    // Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Crear el usuario (inactivo por defecto: approved = false)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Texto plano por requerimiento del proyecto
        role,
        studentId: parsedStudentId,
        approved: false, // Requiere aprobación del admin
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registro exitoso. Su cuenta está pendiente de aprobación por el administrador.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error en el registro: ' + error.message },
      { status: 500 }
    );
  }
}
