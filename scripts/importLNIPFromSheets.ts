/**
 * Импорт задач из Google Sheets в БД
 *
 * Usage: tsx scripts/importLNIPFromSheets.ts --sheet p7-lnip-SUPER --courseId 1 --courseTitle "ЛНИП Физика 7"
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

function getAuth() {
  let creds: any;

  if (process.env.GOOGLE_SHEETS_CREDS) {
    creds = JSON.parse(process.env.GOOGLE_SHEETS_CREDS);
  } else if (process.env.GOOGLE_SHEETS_CREDS_FILE) {
    const filePath = path.resolve(process.env.GOOGLE_SHEETS_CREDS_FILE);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Credentials file not found: ${filePath}`);
    }
    creds = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } else {
    const defaultPath = path.resolve(__dirname, '.google-creds.json');
    if (fs.existsSync(defaultPath)) {
      creds = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
    } else {
      throw new Error('Google Sheets credentials not found');
    }
  }

  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function importSheet(
  sheetId: string,
  sheetName: string,
  courseId: number,
  courseTitle: string
) {
  const queryClient = postgres(process.env.DATABASE_URL!);
  const db = drizzle(queryClient, { schema });

  console.log(`📥 Импортирую ${sheetName} в курс ${courseTitle} (ID: ${courseId})...\n`);

  const auth = getAuth();
  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    const available = Object.keys(doc.sheetsByTitle).join(', ');
    throw new Error(`Sheet "${sheetName}" not found. Available: ${available}`);
  }

  const rows = await sheet.getRows();
  console.log(`📊 Получено ${rows.length} строк из "${sheetName}"\n`);

  const units: typeof schema.units.$inferInsert[] = [];
  const lessons: typeof schema.lessons.$inferInsert[] = [];
  const challenges: typeof schema.challenges.$inferInsert[] = [];
  const options: typeof schema.challengeOptions.$inferInsert[] = [];

  // Парсим три секции данных
  for (const row of rows) {
    try {
      // Проверяем есть ли данные в секции units (столбцы course_id, unit_id, unit_title)
      const unitId = row.get('unit_id');
      const unitTitle = row.get('unit_title');

      if (unitId && unitTitle && !unitTitle.includes('unit_title')) {
        // Это строка из секции units
        units.push({
          id: parseInt(String(unitId)),
          courseId,
          title: String(unitTitle),
          description: String(row.get('unit_description') || ''),
          order: parseInt(String(row.get('order') || '0')) || 0,
          imageSrc: String(row.get('imageSrc') || ''),
        });
        continue;
      }

      // Проверяем есть ли данные в секции lessons (столбцы lesson_id, title для lesson)
      const lessonId = row.get('lesson_id');
      const lessonTitle = row.get('title');
      const lessonUnitId = row.get('unit_id');

      if (lessonId && lessonTitle && lessonUnitId && !lessonTitle.includes('title') && !String(lessonId).includes('lesson_id')) {
        // Это строка из секции lessons
        lessons.push({
          id: parseInt(String(lessonId)),
          unitId: parseInt(String(lessonUnitId)),
          title: String(lessonTitle),
          order: parseInt(String(row.get('order') || '0')) || 0,
        });
        continue;
      }

      // Проверяем есть ли данные в секции challenges
      const chalId = row.get('lesson ROW');
      const chalText = row.get('chal_text');
      const chalLessonId = row.get('lesson_id');

      if (chalId && chalText && !chalText.includes('chal_text') && /^\d+$/.test(String(chalId))) {
        // Это строка из секции challenges
        const type = (String(row.get('chal_type') || 'ASSIST').toUpperCase()) as any;

        challenges.push({
          id: parseInt(String(chalId)),
          lessonId: parseInt(String(chalLessonId || '0')),
          type,
          order: parseInt(String(chalId)),
          question: String(chalText),
          points: parseInt(String(row.get('chal_pts') || '10')) || 10,
          author: String(row.get('chal_author') || ''),
          imageSrc: '',
          difficulty: String(row.get('dif') || ''),
        });

        // Добавляем варианты ответов
        const answers = [
          { text: row.get('chal_opt TRUE'), correct: true },
          { text: row.get('chal_opt FALSE'), correct: false },
        ];

        // Ищем дополнительные FALSE варианты по индексам
        for (let i = 2; i <= 6; i++) {
          const val = row.get(`chal_opt FALSE`);
          if (val) answers.push({ text: val, correct: false });
        }

        for (const ans of answers) {
          const ansText = String(ans.text || '').trim();
          if (ansText && ansText.length > 0) {
            options.push({
              challengeId: parseInt(String(chalId)),
              text: ansText,
              correct: ans.correct,
              imageSrc: '',
            });
          }
        }
      }
    } catch (e) {
      // Пропускаем ошибки парсинга
    }
  }

  // Вставляем в БД
  try {
    console.log(`\n🗑️  Очищаю старые данные для курса ${courseId}...`);

    const existingLessons = await db
      .select({ id: schema.lessons.id })
      .from(schema.lessons)
      .innerJoin(schema.units, eq(schema.lessons.unitId, schema.units.id))
      .where(eq(schema.units.courseId, courseId));

    const lessonIds = existingLessons.map(l => l.id);

    if (lessonIds.length > 0) {
      await db.delete(schema.challengeOptions)
        .where(inArray(schema.challengeOptions.challengeId,
          db.select({ id: schema.challenges.id })
            .from(schema.challenges)
            .where(inArray(schema.challenges.lessonId, lessonIds))
        ));
      await db.delete(schema.challenges)
        .where(inArray(schema.challenges.lessonId, lessonIds));
    }

    await db.delete(schema.lessons)
      .where(inArray(schema.lessons.unitId,
        db.select({ id: schema.units.id })
          .from(schema.units)
          .where(eq(schema.units.courseId, courseId))
      ));

    await db.delete(schema.units)
      .where(eq(schema.units.courseId, courseId));

    console.log(`\n✅ Вставляю Units (${units.length})...`);
    if (units.length > 0) await db.insert(schema.units).values(units);

    console.log(`✅ Вставляю Lessons (${lessons.length})...`);
    if (lessons.length > 0) await db.insert(schema.lessons).values(lessons);

    console.log(`✅ Вставляю Challenges (${challenges.length})...`);
    if (challenges.length > 0) await db.insert(schema.challenges).values(challenges);

    console.log(`✅ Вставляю Options (${options.length})...`);
    if (options.length > 0) await db.insert(schema.challengeOptions).values(options);

    console.log(`\n🎉 Импорт завершён!`);
    console.log(`  Units: ${units.length}`);
    console.log(`  Lessons: ${lessons.length}`);
    console.log(`  Challenges: ${challenges.length}`);
    console.log(`  Options: ${options.length}`);
  } finally {
    await queryClient.end();
  }
}

const args = process.argv.slice(2);
const sheetNameArg = args[args.indexOf('--sheet') + 1];
const courseIdArg = args[args.indexOf('--courseId') + 1];
const courseTitleArg = args[args.indexOf('--courseTitle') + 1];

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1xSc-_CD2u5FhFv5UU2vHT_UZXQsJcHJFHdh2IyMXNFw';

if (!sheetNameArg || !courseIdArg || !courseTitleArg) {
  console.log(`
Usage: tsx scripts/importLNIPFromSheets.ts \\
  --sheet <SHEET_NAME> \\
  --courseId <ID> \\
  --courseTitle "<TITLE>"
  `);
  process.exit(1);
}

importSheet(SHEET_ID, sheetNameArg, parseInt(courseIdArg), courseTitleArg).catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
