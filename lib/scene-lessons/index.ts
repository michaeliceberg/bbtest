import type { SceneLesson } from './types'
import { LOG_NEGATIVE } from './logNegative'
import { LOG_INEQUALITY } from './logInequality'
import { PROB_CLASSIC, PROB_COINS, PROB_AND_OR } from './probability'
import { DERIV_BASIC } from './derivative'
import { PERCENT_BANK } from './percent'
import { PROJECTILE_BASIC } from './projectile'
import { LOG_SUM } from './logSum'
import { LOG_DEF } from './logDef'
import { LOG_SUB } from './logSub'
import { LOG_POW } from './logPow'
import { LOG_SWAP } from './logSwap'
import { LOG_DIV } from './logDiv'
import { LOG_COMBO } from './logCombo'
import { LOG_FLIP } from './logFlip'

// Реестр уроков SCENEWALK: ключ — t_challenges.question.
export const SCENE_LESSONS: SceneLesson[] = [LOG_NEGATIVE, LOG_INEQUALITY, PROB_CLASSIC, PROB_COINS, PROB_AND_OR, DERIV_BASIC, PERCENT_BANK, PROJECTILE_BASIC, LOG_SUM, LOG_DEF, LOG_SUB, LOG_POW, LOG_SWAP, LOG_DIV, LOG_COMBO, LOG_FLIP]
export const findSceneLesson = (question: string): SceneLesson =>
    SCENE_LESSONS.find((l) => l.question === question) ?? SCENE_LESSONS[0]
