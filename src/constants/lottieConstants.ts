// Все Lottie анимации в одном месте
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

// Helper функция для получения случайной анимации
export const getRandomLottie = (lottieList: readonly any[]) => {
  return lottieList[Math.floor(Math.random() * lottieList.length)]
}


