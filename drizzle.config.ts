import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',  // 👈 важно: 'postgresql' а не 'pg'
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: false,  // отключаем SSL для разработки
  },
});


// TODO: ТАКОЕ РАБОТАЛО ДЛЯ NEON
// import 'dotenv/config'
// import type { Config } from 'drizzle-kit'

// export default {
// 	dialect: 'postgresql',
// 	schema: './db/schema.ts',
// 	out: './drizzle',
// 	dbCredentials: {
// 		// connectionString: process.env.DATABASE_URL!,
// 		url: process.env.DATABASE_URL!,
// 	},
// } satisfies Config
