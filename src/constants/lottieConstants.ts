// Все Lottie анимации в одном месте
import LottieStreakFireCelebrating from '@/public/Lottie/streak/streakFireCelebrating.json'
import LottieStreakFireKiss from '@/public/Lottie/streak/streakFireKiss.json'
import LottieStreakFireRolling from '@/public/Lottie/streak/streakFireRolling.json'
import LottieStreakFireThanks from '@/public/Lottie/streak/streakFireThanks.json'
import LottieStreakFireRain from '@/public/Lottie/streak/streakFireRain.json'
import LottieStreakFireSad from '@/public/Lottie/streak/streakFireSad.json'
import LottieTrainerSharkFailDNO from '@/public/Lottie/trainer/LottieTrainerSharkFailDNO.json'
import LottieTrainerSharkStart from '@/public/Lottie/trainer/LottieTrainerSharkStart.json'
import LottieTrainerSharkStartUdachi from '@/public/Lottie/trainer/LottieTrainerSharkStartUdachi.json'
import LottieStartMorning from '@/public/Lottie/trainer/LottieStartMorning.json'
import LottieStartPrivet from '@/public/Lottie/trainer/LottieStartPrivet.json'
import LottieStartYesCapitan from '@/public/Lottie/trainer/LottieStartYesCapitan.json'
import LottieTrainerSharkFinalWin from '@/public/Lottie/trainer/LottieTrainerSharkFinalWin.json'
import LottieTrainerSharkThinkin from '@/public/Lottie/trainer/LottieTrainerSharkThinkin.json'
import LottieTrainerSharkFailCry from '@/public/Lottie/trainer/LottieTrainerSharkFailCry.json'
import LottieStartDots from '@/public/Lottie/trainer/LottieStartDots.json'
import LottieTrainerSharkFinalNoo from '@/public/Lottie/trainer/LottieTrainerSharkFinalNoo.json'
import LottieTrainerSharkFasterPistol from '@/public/Lottie/trainer/LottieTrainerSharkFasterPistol.json'
import LottieTrainerSharkFinalWinClap from '@/public/Lottie/trainer/LottieTrainerSharkFinalWinClap.json'
import LottieTegAsk1 from '@/public/Lottie/tegs/tegAsk1.json'
import LottieTegAsk2 from '@/public/Lottie/tegs/tegAsk2.json'
import LottieTegAsk3 from '@/public/Lottie/tegs/tegAsk3.json'
import LottieTegAsk4 from '@/public/Lottie/tegs/tegAsk4.json'
import LottieTegAsk5 from '@/public/Lottie/tegs/tegAsk5.json'
import LottieFlamyHwYes from '@/public/Lottie/hw/FlamyHwYes.json'
import LottieFlamyHwPanic from '@/public/Lottie/hw/FlamyHwPanic.json'
import LottiePaperFly from '@/public/Lottie/ggege/LottiePaperFly.json'
import LottiePaperStreak1 from '@/public/Lottie/streakCharacter/paperStreak1.json'
import LottiePaperStreak2 from '@/public/Lottie/streakCharacter/paperStreak2.json'
import LottiePaperStreak3 from '@/public/Lottie/streakCharacter/paperStreak3.json'
import LottiePaperStreak4 from '@/public/Lottie/streakCharacter/paperStreak4.json'
import LottiePaperStreak5 from '@/public/Lottie/streakCharacter/paperStreak5.json'
import LottieDeath1 from '@/public/Lottie/death/death1.json'
import LottieDeath2 from '@/public/Lottie/death/death2.json'
import LottieDeath3 from '@/public/Lottie/death/death3.json'
import LottieDeath4 from '@/public/Lottie/death/death4.json'
import LottieDeath5 from '@/public/Lottie/death/death5.json'
import LottieDeath6 from '@/public/Lottie/death/death6.json'
import LottieDeath7 from '@/public/Lottie/death/death7.json'
import LottieDeath8 from '@/public/Lottie/death/death8.json'
import LottieDeath9 from '@/public/Lottie/death/death9.json'
import LottieDeath10 from '@/public/Lottie/death/death10.json'
import LottieDeathLowHp from '@/public/Lottie/death/deathLowHp.json'
import LottieTestRandomDnevnik from '@/public/Lottie/test/random-dnevnik.json'
import LottieTestRandomFalltree from '@/public/Lottie/test/random-falltree.json'
import LottieTestRandomGrabli from '@/public/Lottie/test/random-grabli.json'
import LottieTestRandomNumed from '@/public/Lottie/test/random-numed.json'
import LottieTestRandomNuprivet from '@/public/Lottie/test/random-nuprivet.json'
import LottieTestRandomSleep from '@/public/Lottie/test/random-sleep.json'
import LottieTestRandomTrain from '@/public/Lottie/test/random-train.json'
import LottieTestRandomVtelefone from '@/public/Lottie/test/random-vtelefone.json'
import LottieTestFinalTheend from '@/public/Lottie/test/final-theend.json'
import LottieTestFinalSpasibo from '@/public/Lottie/test/final-spasibo.json'
import LottieTestFinalDojd from '@/public/Lottie/test/final-dojd.json'
import LottieTestPizza from '@/public/Lottie/test/pizza.json'

// Группировка по назначению
export const LOTTIE_START_LIST = [
  LottieTrainerSharkStart, 
  LottieTrainerSharkStartUdachi,
  LottieStartMorning,
  LottieStartPrivet,
  LottieStartYesCapitan,
] as const

export const LOTTIE_EMOTION_RIGHT_LIST = [
  LottieStartDots, 
  LottieTrainerSharkThinkin,
  LottieTrainerSharkFinalWinClap,
] as const

export const LOTTIE_EMOTION_WRONG_LIST = [
  LottieTrainerSharkFailCry, 
  LottieTrainerSharkFinalNoo,
  LottieTrainerSharkFasterPistol,
] as const

export const LOTTIE_RESULT = {
  SUCCESS: LottieTrainerSharkFinalWin,
  FAIL: LottieTrainerSharkFailDNO,
} as const

// Огонёк "ударного режима" (user_course_progress.streak, см. lib/streak.ts)
// — радуется, когда серию продлили сегодня; грустит/мокнет под дождём,
// когда серия под угрозой (время поджимает, а сегодня ещё не позанимался).
export const LOTTIE_STREAK_CELEBRATE_LIST = [
  LottieStreakFireCelebrating,
  LottieStreakFireKiss,
  LottieStreakFireRolling,
  LottieStreakFireThanks,
] as const

export const LOTTIE_STREAK_RISK_LIST = [
  LottieStreakFireRain,
  LottieStreakFireSad,
] as const

// Бейдж-приглашение "пройди тренажёр" на карточке задачи курса
// (app/lesson/question-bubble.tsx) — вместо скучной серой иконки
// GraduationCap для ещё не начатого скила.
export const LOTTIE_SKILL_ASK_LIST = [
  LottieTegAsk1,
  LottieTegAsk2,
  LottieTegAsk3,
  LottieTegAsk4,
  LottieTegAsk5,
] as const

// Маскот-огонёк карточки "Квест дня" (components/trainer-quest-card.tsx)
// пока квест ещё не выполнен — один из двух случайно, для разнообразия
// (панике/уверенности не соответствует конкретный прогресс, это просто
// эмоция-приглашение "давай, действуй").
export const LOTTIE_QUEST_MASCOT_LIST = [
  LottieFlamyHwYes,
  LottieFlamyHwPanic,
] as const

// Персонаж-праздник на экране "серия из 3/7 подряд" (StreakCelebrationScreen)
// и на новом экране завершения урока тренажёра (TrainerLessonCompleteScreen)
// — раньше был всегда один и тот же (LottiePaperFly), по прямой просьбе
// пользователя выбирается случайно из 6 (сам paperFly + 5 присланных).
export const LOTTIE_STREAK_CHARACTER_LIST = [
  LottiePaperFly,
  LottiePaperStreak1,
  LottiePaperStreak2,
  LottiePaperStreak3,
  LottiePaperStreak4,
  LottiePaperStreak5,
] as const

// Маскот на боевом ("корона"/"контрольная") этапе темы — по прямой
// просьбе пользователя (2026-09-10) заменяет обычного маскота (см.
// trainer-question.tsx, isBossStage) на одну из 10 анимаций "смерти
// босса", случайную на попытку урока; при HP < 30% (см. TrainerBossBar)
// переключается на deathLowHp независимо от того, какая из десяти
// выпала изначально — единый сигнал "босс почти повержен".
export const LOTTIE_BOSS_DEATH_LIST = [
  LottieDeath1,
  LottieDeath2,
  LottieDeath3,
  LottieDeath4,
  LottieDeath5,
  LottieDeath6,
  LottieDeath7,
  LottieDeath8,
  LottieDeath9,
  LottieDeath10,
] as const

export const LOTTIE_BOSS_DEATH_LOW_HP = LottieDeathLowHp

// Экран выбора предмета на /test (app/test/test-picker-client.tsx) — слева
// и справа по одному случайному ролику из этого пула (гарантированно
// разные, см. getTwoDistinctRandomLotties), пока предмет не выбран.
// random-vtelefone сюда не входит — он зарезервирован под интро-экран
// конкретного теста (LOTTIE_TEST_INTRO), см. ниже.
export const LOTTIE_TEST_PICKER_LIST = [
  LottieTestRandomDnevnik,
  LottieTestRandomFalltree,
  LottieTestRandomGrabli,
  LottieTestRandomNumed,
  LottieTestRandomNuprivet,
  LottieTestRandomSleep,
  LottieTestRandomTrain,
] as const

// Интро-экран конкретного теста (app/test/[subject]/diagnostic-client.tsx,
// phase='intro') — всегда один и тот же ролик, не случайный.
export const LOTTIE_TEST_INTRO = LottieTestRandomVtelefone

// Маленький значок "можно выиграть пиццу" на интро-экране теста.
export const LOTTIE_TEST_PIZZA = LottieTestPizza

// Экран результата диагностического теста (app/test/[subject]/diagnostic-client.tsx)
// — если есть хоть один верный ответ, один из двух случайно; если верных
// ответов нет вообще — LOTTIE_TEST_RESULT_ZERO (без выбора).
export const LOTTIE_TEST_RESULT_GOOD_LIST = [
  LottieTestFinalTheend,
  LottieTestFinalSpasibo,
] as const

export const LOTTIE_TEST_RESULT_ZERO = LottieTestFinalDojd

// Выбирает N попарно различных случайных элементов списка (без повторов) —
// нужен экрану /test, где слева и справа не должен выпасть один и тот же
// ролик.
export const getDistinctRandomLotties = <T,>(list: readonly T[], count: number): T[] => {
  const pool = [...list]
  const result: T[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}

// Helper функция для получения случайной анимации
export const getRandomLottie = (lottieList: readonly any[]) => {
  return lottieList[Math.floor(Math.random() * lottieList.length)]
}


