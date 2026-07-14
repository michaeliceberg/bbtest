// scripts/seed-achievements.ts

import 'dotenv/config';  // ← добавить в самом начале
import db from '@/db/drizzle';
import { achievements } from '@/db/schema';

async function seedAchievements() {
    console.log('🌱 Начинаем заполнение достижений...');
    
    const achievementsList = [
        { name: 'Домашняя крыса 🐭', description: 'Выполни первое домашнее задание', category: 'homework', requirement: 1, rewardPoints: 10, rewardGems: 5, sortOrder: 1 },
        { name: 'Домашний зверь 🐹', description: 'Выполни 10 домашних заданий', category: 'homework', requirement: 10, rewardPoints: 50, rewardGems: 20, sortOrder: 2 },
        { name: 'Домашний тиран 🦖', description: 'Выполни 50 домашних заданий', category: 'homework', requirement: 50, rewardPoints: 200, rewardGems: 50, sortOrder: 3 },
        
        { name: 'Первые шаги 👣', description: 'Сделай стрик 3 дня подряд', category: 'streak', requirement: 3, rewardPoints: 15, rewardGems: 5, sortOrder: 4 },
        { name: 'Неделя без зазора 🔥', description: 'Сделай стрик 7 дней подряд', category: 'streak', requirement: 7, rewardPoints: 50, rewardGems: 15, sortOrder: 5 },
        { name: 'Месяц марафона 🏃', description: 'Сделай стрик 30 дней подряд', category: 'streak', requirement: 30, rewardPoints: 200, rewardGems: 50, sortOrder: 6 },
        
        { name: 'Первая тренировка 💪', description: 'Пройди первый урок в тренажере', category: 'trainer', requirement: 1, rewardPoints: 10, rewardGems: 5, sortOrder: 7 },
        { name: 'Мастер тренажера 🎯', description: 'Пройди 50 уроков в тренажере', category: 'trainer', requirement: 50, rewardPoints: 100, rewardGems: 30, sortOrder: 8 },
        
        { name: 'Настоящий король 👑', description: 'Получи все достижения', category: 'special', requirement: 8, rewardPoints: 500, rewardGems: 100, sortOrder: 9 },
    ];
    
    for (const ach of achievementsList) {
        const existing = await db.query.achievements.findFirst({
            where: (achievements, { eq }) => eq(achievements.name, ach.name),
        });
        
        if (!existing) {
            await db.insert(achievements).values(ach);
            console.log(`✅ Добавлено: ${ach.name}`);
        } else {
            console.log(`⏩ Пропущено (уже есть): ${ach.name}`);
        }
    }
    
    console.log('✅ Заполнение достижений завершено!');
    process.exit(0);
}

seedAchievements().catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
});