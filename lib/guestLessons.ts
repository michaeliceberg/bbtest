// lib/guestLessons.ts
//
// Какие уроки тренажёра гость может пройти без регистрации (2026-10-23):
// пробные уроки треков (PUBLIC_TRIAL_T_LESSON_IDS) и ЛЮБОЙ пошаговый разбор
// (*WALK, STEP_BY_STEP_CHALLENGE_TYPES) видимых курсов тренажёра — на каждый
// такой урок есть ссылка-приглашение с карты /trainer (кнопка «поделиться»).
// Обычные тренировочные уроки гостю закрыты.
import { PUBLIC_TRIAL_T_LESSON_IDS } from '@/lib/trialTracks'
import { isStepByStepLesson } from '@/lib/trainerStageFlags'
import { HIDDEN_T_COURSE_IDS } from '@/lib/trainer-topic'

type LessonShape = { id: number; t_challenges: { type: string }[]; t_unit: { t_courseId: number } }

export const isGuestOpenLesson = (lesson: LessonShape | null | undefined): boolean => {
	if (!lesson) return false
	if (PUBLIC_TRIAL_T_LESSON_IDS.includes(lesson.id)) return true
	return isStepByStepLesson(lesson.t_challenges.map((c) => c.type)) && !HIDDEN_T_COURSE_IDS.includes(lesson.t_unit.t_courseId)
}
