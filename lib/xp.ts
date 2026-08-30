// lib/xp.ts
//
// Система уровней тренажёра/курсов. Опыт (userProgress.xp, см.
// db/schema.ts) начисляется 1:1 с уже существующими "очковыми"
// наградами — challenge.points за верный ответ в курсе, trainingPts за
// завершение урока тренажёра, achievement.rewardPoints за получение
// награды достижения (см. actions/challenge-progress.ts,
// actions/user-progress.ts, actions/claim-achievement.ts) — через один
// общий множитель здесь, чтобы позже подкрутить баланс разом, не
// переписывая три места начисления по отдельности.
//
// Уровень — простая линейная кривая (постоянное количество опыта на
// уровень, не прогрессивно растущий порог): минимальный, предсказуемый
// старт, который легко заменить на нелинейную кривую позже, если
// понадобится — level/progress выводятся из xp на лету, нигде не
// хранятся отдельно.

export const XP_MULTIPLIER = 1;
export const XP_PER_LEVEL = 100;

// Реальная награда за повышение уровня (не только тост) — гемы, тот же
// прецедент, что уже используют HOT-вопрос/достижения (наградная плашка
// с эмодзи, без отдельной анимации). За множественное пересечение границы
// в одном начислении (например тренажёр даёт плоские 200 XP — этого
// достаточно, чтобы перепрыгнуть сразу два уровня, если пользователь был
// близко к границе) награда умножается на levelsGained, а не выдаётся
// один раз — иначе повышение сразу на 2 уровня давало бы столько же гемов,
// сколько и на 1.
export const LEVEL_UP_GEM_REWARD = 5;

export const xpForAmount = (baseAmount: number): number => Math.round(baseAmount * XP_MULTIPLIER);

export type LevelInfo = {
    level: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
};

export const getLevelInfo = (totalXp: number): LevelInfo => {
    const safeXp = Math.max(0, totalXp || 0);
    const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
    const xpIntoLevel = safeXp % XP_PER_LEVEL;
    return {
        level,
        xpIntoLevel,
        xpForNextLevel: XP_PER_LEVEL,
        progressPercent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
    };
};

export type LevelUpInfo = {
    leveledUp: boolean;
    newLevel: number;
    levelsGained: number;
    gemsAwarded: number;
};

// Сравнивает XP до/после начисления — используется в actions, которые
// начисляют XP, чтобы вернуть клиенту "пересёк ли пользователь границу
// уровня" (для тоста "уровень повышен") и реальную награду (гемы) за
// это, не заставляя каждый call site самостоятельно дважды считать
// getLevelInfo.
export const getLevelUpInfo = (xpBefore: number, xpAfter: number): LevelUpInfo => {
    const levelBefore = getLevelInfo(xpBefore).level;
    const levelAfter = getLevelInfo(xpAfter).level;
    const levelsGained = Math.max(0, levelAfter - levelBefore);
    return {
        leveledUp: levelsGained > 0,
        newLevel: levelAfter,
        levelsGained,
        gemsAwarded: levelsGained * LEVEL_UP_GEM_REWARD,
    };
};
