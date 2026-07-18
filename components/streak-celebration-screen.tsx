'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface StreakCelebrationScreenProps {
  animationData: any
  onNext: () => void
}

export const StreakCelebrationScreen = ({
  animationData,
  onNext,
}: StreakCelebrationScreenProps) => {
  return (
    <div className="min-h-screen bg-[#151F24] text-[#F2F7FB] flex flex-col">
      {/* Пустой header для выравнивания */}
      <div className="px-4 py-4 h-16" />

      {/* Основной контент */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Lottie анимация */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            times: [0, 0.7, 1],
            ease: 'easeOut',
          }}
          className="w-48 h-48 mb-6"
        >
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            className="w-full h-full"
          />
        </motion.div>

        {/* Текст */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
          }}
          className="text-center"
        >
          <h2 className="text-3xl font-black text-[#C386F8] mb-4">
            Молодец!
          </h2>
          <p className="text-xl font-semibold text-[#F2F7FB]">
            Три ответа подряд!
          </p>
        </motion.div>
      </div>

      {/* Кнопка внизу */}
      <div className="px-4 pb-4 pt-2 bg-[#151F24]">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.5,
          }}
          onClick={onNext}
          className={`
            w-full py-3 rounded-lg font-bold text-lg
            bg-[#A1D051] text-[#151F24]
            cursor-pointer
            shadow-lg relative
            transform active:translate-y-1
            hover:opacity-90 transition-opacity
          `}
          style={{
            boxShadow: '0 4px 0 #876E4A',
          }}
        >
          Далее
        </motion.button>
      </div>
    </div>
  )
}
