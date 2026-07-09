import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      grades,
      studyHoursMin,
      studyHoursMax,
      attendanceMin,
      attendanceMax,
      participationMin,
      participationMax,
    } = body;

    const where: any = {};

    // Filtro por calificacion (Grade)
    if (grades && Array.isArray(grades) && grades.length > 0) {
      where.grade = { in: grades };
    }

    // Filtro por horas de estudio semanales
    if (studyHoursMin !== undefined || studyHoursMax !== undefined) {
      where.weeklySelfStudyHours = {
        gte: studyHoursMin !== undefined ? Number(studyHoursMin) : 0,
        lte: studyHoursMax !== undefined ? Number(studyHoursMax) : 100,
      };
    }

    // Filtro por porcentaje de asistencia
    if (attendanceMin !== undefined || attendanceMax !== undefined) {
      where.attendancePercentage = {
        gte: attendanceMin !== undefined ? Number(attendanceMin) : 0,
        lte: attendanceMax !== undefined ? Number(attendanceMax) : 100,
      };
    }

    // Filtro por participación en clase
    if (participationMin !== undefined || participationMax !== undefined) {
      where.classParticipation = {
        gte: participationMin !== undefined ? Number(participationMin) : 0,
        lte: participationMax !== undefined ? Number(participationMax) : 10,
      };
    }

    // 1. Estadísticas agregadas generales (KPIs)
    const [stats, passingCount] = await Promise.all([
      prisma.student.aggregate({
        where,
        _count: {
          id: true,
        },
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
          totalScore: { gte: 70 }, // Se asume aprobado si score >= 70
        },
      }),
    ]);

    const totalCount = stats._count.id;
    const passRate = totalCount > 0 ? (passingCount / totalCount) * 100 : 0;

    // 2. Distribución de calificaciones (Grade Distribution)
    const gradeDistributionRaw = await prisma.student.groupBy({
      by: ['grade'],
      where,
      _count: {
        id: true,
      },
    });

    const gradeOrder = ['A', 'B', 'C', 'D', 'F'];
    const gradeDistribution = gradeOrder.map((g) => {
      const match = gradeDistributionRaw.find((item) => item.grade === g);
      const count = match ? match._count.id : 0;
      const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
      return {
        grade: g,
        count,
        percentage: Number(percentage.toFixed(1)),
      };
    });

    // 3. Promedio de asistencias y participación agrupados por nota
    const averageMetricsByGradeRaw = await prisma.student.groupBy({
      by: ['grade'],
      where,
      _avg: {
        attendancePercentage: true,
        classParticipation: true,
        totalScore: true,
      },
    });

    const averageMetricsByGrade = gradeOrder.map((g) => {
      const match = averageMetricsByGradeRaw.find((item) => item.grade === g);
      return {
        grade: g,
        avgAttendance: match?._avg.attendancePercentage
          ? Number(match._avg.attendancePercentage.toFixed(1))
          : 0,
        avgParticipation: match?._avg.classParticipation
          ? Number(match._avg.classParticipation.toFixed(1))
          : 0,
        avgScore: match?._avg.totalScore ? Number(match._avg.totalScore.toFixed(1)) : 0,
      };
    });

    // 4. Agrupación por Rangos de Horas de Estudio para correlación con puntaje total
    const studyRanges = [
      { min: 0, max: 5, label: '0-5 hrs' },
      { min: 5, max: 10, label: '5-10 hrs' },
      { min: 10, max: 15, label: '10-15 hrs' },
      { min: 15, max: 20, label: '15-20 hrs' },
      { min: 20, max: 25, label: '20-25 hrs' },
      { min: 25, max: 30, label: '25-30 hrs' },
      { min: 30, max: 35, label: '30-35 hrs' },
      { min: 35, max: 100, label: '35+ hrs' },
    ];

    const studyHoursData = await Promise.all(
      studyRanges.map(async (r) => {
        const agg = await prisma.student.aggregate({
          where: {
            ...where,
            weeklySelfStudyHours: { gte: r.min, lt: r.max },
          },
          _count: { id: true },
          _avg: { totalScore: true },
        });
        return {
          range: r.label,
          count: agg._count.id,
          avgScore: agg._avg.totalScore ? Number(agg._avg.totalScore.toFixed(1)) : 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalStudents: totalCount,
          avgStudyHours: stats._avg.weeklySelfStudyHours
            ? Number(stats._avg.weeklySelfStudyHours.toFixed(1))
            : 0,
          avgAttendance: stats._avg.attendancePercentage
            ? Number(stats._avg.attendancePercentage.toFixed(1))
            : 0,
          avgParticipation: stats._avg.classParticipation
            ? Number(stats._avg.classParticipation.toFixed(1))
            : 0,
          avgScore: stats._avg.totalScore ? Number(stats._avg.totalScore.toFixed(1)) : 0,
          passRate: Number(passRate.toFixed(1)),
        },
        gradeDistribution,
        averageMetricsByGrade,
        studyHoursData,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos del dashboard: ' + error.message },
      { status: 500 }
    );
  }
}
