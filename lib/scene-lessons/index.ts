import type { SceneLesson } from './types'
import { LOG_NEGATIVE } from './logNegative'
import { LOG_INEQUALITY } from './logInequality'

// Реестр уроков SCENEWALK: ключ — t_challenges.question.
export const SCENE_LESSONS: SceneLesson[] = [LOG_NEGATIVE, LOG_INEQUALITY]
export const findSceneLesson = (question: string): SceneLesson =>
    SCENE_LESSONS.find((l) => l.question === question) ?? SCENE_LESSONS[0]
