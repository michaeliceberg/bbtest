// scripts/run-indexes.ts

import db from '@/db/drizzle';
import { indexes } from '@/db/schema';
import { sql } from 'drizzle-orm'; // 🔥 ДОБАВИТЬ ЭТОТ ИМПОРТ

async function createIndexes() {
    console.log('📚 Создание индексов...');
    console.log('====================================');
    
    for (const [table, indexQueries] of Object.entries(indexes)) {
        console.log(`\n📋 Таблица: ${table}`);
        for (const query of indexQueries) {
            try {
                // 🔥 ОБЕРНУТЬ В sql`
                await db.execute(sql.raw(query));
                // ИЛИ так:
                // await db.execute(sql(`${query}`));
                console.log(`  ✅ ${query.substring(0, 60)}...`);
            } catch (error) {
                console.error(`  ❌ Ошибка:`, error);
            }
        }
    }
    
    console.log('\n====================================');
    console.log('🎉 Все индексы созданы!');
}

// Запуск
createIndexes()
    .then(() => {
        console.log('Завершено');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });