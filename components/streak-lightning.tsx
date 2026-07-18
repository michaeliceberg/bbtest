'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface StreakLightningProps {
  isVisible: boolean
  onComplete: () => void
  animationData: any
}

export const StreakLightning = ({ isVisible, onComplete, animationData }: StreakLightningProps) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* Молния - bounce появляется из точки, bounce исчезает в точку */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
        exit={{ scale: [1, 0.8, 0], opacity: [1, 1, 0] }}
        transition={{
          scale: {
            duration: 0.6,
            times: [0, 0.7, 1],
            ease: "easeOut",
          },
          opacity: {
            duration: 0.6,
            times: [0, 0.7, 1],
            ease: "easeOut",
          },
        }}
        onAnimationComplete={() => {
          setTimeout(() => {
            onComplete()
          }, 1200)
        }}
        className="relative w-96 h-96"
      >
        <Lottie
          animationData={animationData}
          loop={false}
          autoplay={true}
          className="w-full h-full"
        />
      </motion.div>

      {/* Текст "3 ПОДРЯД!" - bounce вместе с молнией */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
        exit={{ scale: [1, 0.8, 0], opacity: [1, 1, 0] }}
        transition={{
          scale: {
            duration: 0.6,
            times: [0, 0.7, 1],
            ease: "easeOut",
          },
          opacity: {
            duration: 0.6,
            times: [0, 0.7, 1],
            ease: "easeOut",
          },
        }}
        className="absolute flex items-center justify-center"
      >
        <span
          className="text-6xl font-black text-white"
          style={{
            WebkitTextStroke: '3px #FFD700',
            paintOrder: 'stroke fill',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))',
          }}
        >
          3 ПОДРЯД!
        </span>
      </motion.div>
    </div>
  )
}
