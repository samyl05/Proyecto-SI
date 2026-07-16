import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export const runtime = 'nodejs';

const ALLOWED_GRADES = new Set(['A', 'B', 'C', 'D', 'F']);

type StudentWhereInput = {
  grade: { in: string[] };
  weeklySelfStudyHours: { gte: number; lte: number };
  attendancePercentage: { gte: number; lte: number };
  classParticipation: { gte: number; lte: number };
};

type GradeStatsRow = {
  grade: string;
  _count: { id: number };
  _avg: {
    attendancePercentage: number | null;
    classParticipation: number | null;
    totalScore: number | null;
  };
};

function readNumber(value: unknown, fieldName: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} debe estar entre ${min} y ${max}`);
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUser = verifySessionToken(cookieStore.get('session')?.value);

    if (!sessionUser || !['ADMIN', 'PROFESOR'].includes(sessionUser.role)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para consultar la analítica' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Los filtros enviados no son válidos' },
        { status: 400 }
      );
    }

    const rawGrades = Array.isArray((body as { grades?: unknown }).grades)
      ? (body as { grades: unknown[] }).grades
      : [];
    const grades = [...new Set<string>(
      rawGrades.filter((grade): grade is string => typeof grade === 'string')
    )];

    if (grades.length === 0 || grades.some((grade) => !ALLOWED_GRADES.has(grade))) {
      return NextResponse.json(
        { success: false, error: 'Seleccione al menos una calificación válida' },
        { status: 400 }
      );
    }

    let studyHoursMin: number;
    let studyHoursMax: number;
    let attendanceMin: number;
    let attendanceMax: number;
    let participationMin: number;
    let participationMax: number;

    try {
      studyHoursMin = readNumber(body.studyHoursMin, 'Las horas mínimas', 0, 50);
      studyHoursMax = readNumber(body.studyHoursMax, 'Las horas máximas', 0, 50);
      attendanceMin = readNumber(body.attendanceMin, 'La asistencia mínima', 0, 100);
      attendanceMax = readNumber(body.attendanceMax, 'La asistencia máxima', 0, 100);
      participationMin = readNumber(body.participationMin, 'La participación mínima', 1, 10);
      participationMax = readNumber(body.participationMax, 'La participación máxima', 1, 10);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Rangos de filtros no válidos' },
        { status: 400 }
      );
    }

    if (
      studyHoursMin > studyHoursMax ||
      attendanceMin > attendanceMax ||
      participationMin > participationMax
    ) {
      return NextResponse.json(
        { success: false, error: 'El valor mínimo de un filtro no puede superar al máximo' },
        { status: 400 }
      );
    }

    const where: StudentWhereInput = {
      grade: { in: grades },
      weeklySelfStudyHours: { gte: studyHoursMin, lte: studyHoursMax },
      attendancePercentage: { gte: attendanceMin, lte: attendanceMax },
      classParticipation: { gte: participationMin, lte: participationMax },
    };

    // Se ejecutan las consultas solo cuando el usuario pulsa "Aplicar filtros".
    const [stats, passingCount, gradeStatsRaw] = await Promise.all([
      prisma.student.aggregate({
        where,
        _count: { id: true },
        _avg: {
          weeklySelfStudyHours: true,
          attendancePercentage: true,
          classParticipation: true,
          totalScore: true,
        },
      }),
      prisma.student.count({
        where: {
          ...where,
          totalScore: { gte: 70 },
        },
      }),
      prisma.student.groupBy({
        by: ['grade'],
        where,
        _count: { id: true },
        _avg: {
          attendancePercentage: true,
          classParticipation: true,
          totalScore: true,
        },
      }),
    ]);

    const gradeStats = gradeStatsRaw as GradeStatsRow[];

    const totalCount = stats._count.id;
    const passRate = totalCount > 0 ? (passingCount / totalCount) * 100 : 0;
    const gradeOrder = ['A', 'B', 'C', 'D', 'F'];

    const gradeDistribution = gradeOrder.map((grade) => {
      const match = gradeStats.find((item) => item.grade === grade);
      const count = match?._count.id ?? 0;
      return {
        grade,
        count,
        percentage: totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0,
      };
    });

    const averageMetricsByGrade = gradeOrder.map((grade) => {
      const match = gradeStats.find((item) => item.grade === grade);
      return {
        grade,
        avgAttendance: Number((match?._avg.attendancePercentage ?? 0).toFixed(1)),
        avgParticipation: Number((match?._avg.classParticipation ?? 0).toFixed(1)),
        avgScore: Number((match?._avg.totalScore ?? 0).toFixed(1)),
      };
    });

    const studyRanges = [
      { min: 0, max: 5, label: '0-5 hrs' },
      { min: 5, max: 10, label: '5-10 hrs' },
      { min: 10, max: 15, label: '10-15 hrs' },
      { min: 15, max: 20, label: '15-20 hrs' },
      { min: 20, max: 25, label: '20-25 hrs' },
      { min: 25, max: 30, label: '25-30 hrs' },
      { min: 30, max: 35, label: '30-35 hrs' },
      { min: 35, max: 50, label: '35-50 hrs' },
    ];

    const studyHoursData = await Promise.all(
      studyRanges.map(async (range) => {
        const lower = Math.max(range.min, studyHoursMin);
        const upper = Math.min(range.max, studyHoursMax);

        const singlePointBelongsToRange =
          lower === upper && (lower === range.min || (upper === 50 && range.max === 50));

        if (lower > upper || (lower === upper && !singlePointBelongsToRange)) {
          return { range: range.label, count: 0, avgScore: 0 };
        }

        const includeUpperBound = upper === studyHoursMax || upper === 50;
        const studyRange = includeUpperBound
          ? { gte: lower, lte: upper }
          : { gte: lower, lt: upper };

        const aggregate = await prisma.student.aggregate({
          where: {
            grade: where.grade,
            attendancePercentage: where.attendancePercentage,
            classParticipation: where.classParticipation,
            weeklySelfStudyHours: studyRange,
          },
          _count: { id: true },
          _avg: { totalScore: true },
        });

        return {
          range: range.label,
          count: aggregate._count.id,
          avgScore: Number((aggregate._avg.totalScore ?? 0).toFixed(1)),
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          kpis: {
            totalStudents: totalCount,
            avgStudyHours: Number((stats._avg.weeklySelfStudyHours ?? 0).toFixed(1)),
            avgAttendance: Number((stats._avg.attendancePercentage ?? 0).toFixed(1)),
            avgParticipation: Number((stats._avg.classParticipation ?? 0).toFixed(1)),
            avgScore: Number((stats._avg.totalScore ?? 0).toFixed(1)),
            passRate: Number(passRate.toFixed(1)),
          },
          gradeDistribution,
          averageMetricsByGrade,
          studyHoursData,
          analyzedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo completar el análisis de la muestra' },
      { status: 500 }
    );
  }
}
