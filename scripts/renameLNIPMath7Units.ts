import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const renames: { id: number; title: string }[] = [
	{ id: 114, title: '1. Числовые выражения' },
	{ id: 115, title: '2. Алгебраические дроби' },
	{ id: 116, title: '3. Сокращение дробей' },
	{ id: 117, title: '4. Разложение на множители' },
	{ id: 118, title: '5. НОД и НОК' },
	{ id: 119, title: '6. Совместная работа' },
	{ id: 120, title: '7. Треугольники: углы' },
	{ id: 121, title: '8. Треугольники: перпендикуляр' },
	{ id: 122, title: '9. Числовые выражения 2' },
	{ id: 123, title: '10. Алгебраические дроби 2' },
	{ id: 124, title: '11. Сокращение дробей 2' },
];

const main = async () => {
	try {
		for (const r of renames) {
			await db.update(schema.units).set({ title: r.title }).where(eq(schema.units.id, r.id));
			console.log(`Unit ${r.id} -> "${r.title}"`);
		}
	} finally {
		await queryClient.end();
	}
};

main();
