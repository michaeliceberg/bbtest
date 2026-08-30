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
