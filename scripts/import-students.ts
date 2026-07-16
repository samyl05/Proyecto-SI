import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

type StudentRecord = {
  studentId: number;
  weeklySelfStudyHours: number;
  attendancePercentage: number;
  classParticipation: number;
  totalScore: number;
  grade: string;
};

async function main() {
  const filePath = path.join(process.cwd(), 'student_performance.csv');
  const records: StudentRecord[] = [];

  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({ columns: true, trim: true })) as AsyncIterable<Record<string, string>>;

  for await (const row of parser) {
    const record: StudentRecord = {
      studentId: Number.parseInt(row.student_id, 10),
      weeklySelfStudyHours: Number.parseFloat(row.weekly_self_study_hours),
      attendancePercentage: Number.parseFloat(row.attendance_percentage),
      classParticipation: Number.parseFloat(row.class_participation),
      totalScore: Number.parseFloat(row.total_score),
      grade: row.grade,
    };

    if (Object.values(record).some((value) => value === '' || (typeof value === 'number' && !Number.isFinite(value)))) {
      throw new Error(`Fila inválida encontrada para student_id=${row.student_id ?? 'desconocido'}`);
    }

    records.push(record);
  }

  console.log(`Total de filas leídas: ${records.length}`);

  const batchSize = 5000;
  let inserted = 0;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    await prisma.student.createMany({ data: batch });
    inserted += batch.length;
    console.log(`Insertados: ${inserted} / ${records.length}`);
  }

  console.log('¡Importación completa!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
