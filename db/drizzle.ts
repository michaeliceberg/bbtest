// import { neon } from '@/node_modules/@neondatabase/serverless/index'

// db/drizzle.ts
import 'dotenv/config';

// Импортируйте новый драйвер
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as schema from './schema';

// Используйте новый драйвер
const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

export default db;




// TODO: ТАКОЕ РАБОТАЛО ДЛЯ NEON
// // db/drizzle.ts

// import 'dotenv/config';  // ← добавить в самом начале

// import { neon } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-http';

// import * as schema from './schema';

// const sql = neon(process.env.DATABASE_URL!);

// // @ts-ignore
// const db = drizzle(sql, { schema });

// export default db;

