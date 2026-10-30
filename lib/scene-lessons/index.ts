import type { SceneLesson } from './types'
import { LOG_NEGATIVE } from './logNegative'
import { LOG_INEQUALITY } from './logInequality'
import { PROB_CLASSIC, PROB_COINS, PROB_AND_OR } from './probability'
import { DERIV_BASIC } from './derivative'

// Реестр уроков SCENEWALK: ключ — t_challenges.question.
export const SCENE_LESSONS: SceneLesson[] = [LOG_NEGATIVE, LOG_INEQUALITY, PROB_CLASSIC, PROB_COINS, PROB_AND_OR, DERIV_BASIC]
export const findSceneLesson = (question: string): SceneLesson =>
    SCENE_LESSONS.find((l) => l.question === question) ?? SCENE_LESSONS[0]
