// actions/open-case.ts
//
// Замена старой сундук/мегасундук механики (award-chest-reward.ts,
// мгновенное начисление гемов без взаимодействия) — CS:GO-style кейс:
// пользователь видит крутящийся барабан (components/CaseReel.tsx) и
// САМ жмёт кнопку "крутить", но что именно выпадет решает СЕРВЕР, ДО
// начала анимации — клиент только анимирует ленту так, чтобы она
// визуально остановилась на уже решённой награде (тот же принцип, что
// и в award-hot-question-reward.ts/award-chest-reward.ts: сервер решает
// сумму, клиент показывает то, что вернулось, не может подделать результат).

'use server';

import { getCasePool, getLessonCasePool, type LessonCaseTier } from '@/lib/caseRewards';
import { applyCaseReward, type OpenCaseResult } from '@/lib/caseApply';

export type { OpenCaseResult };

export async function openCase(isMega: boolean = false): Promise<OpenCaseResult> {
	return applyCaseReward(getCasePool(isMega));
}

// Кейс за любой завершённый урок тренажёра (см. actions/roll-lesson-
// case.ts — решает ДО этого вызова, выпадает ли кейс вообще и какой
// редкости; здесь только применяется уже решённая редкость).
export async function openLessonCase(tier: LessonCaseTier): Promise<OpenCaseResult> {
	return applyCaseReward(getLessonCasePool(tier));
}
