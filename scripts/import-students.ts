import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

async function main() {
  const filePath = path.join(process.cwd(), 'student_performance.csv');
  const records: any[] = [];

  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({ columns: true, trim: true }));

  for await (const row of parser) {
    records.push({
      studentId: parseInt(row.student_id),
      weeklySelfStudyHours: parseFloat(row.weekly_self_study_hours),
      attendancePercentage: parseFloat(row.attendance_percentage),
      classParticipation: parseFloat(row.class_participation),
      totalScore: parseFloat(row.total_score),
      grade: row.grade,
    });
  }

  console.log(`Total de filas leídas: ${records.length}`);

  const batchSize = 5000;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await prisma.student.createMany({ data: batch });
    inserted += batch.length;
    console.log(`Insertados: ${inserted} / ${records.length}`);
  }

  console.log('¡Importación completa!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit());
