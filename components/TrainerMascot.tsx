"use client"

import { motion, AnimatePresence } from "framer-motion"
import Lottie from "lottie-react"
import { useEffect, useState, useRef } from "react"

interface TrainerMascotProps {
  emotion: "happy" | "sad" | "thinking" | "celebrating" | "waiting" | "angry" | "neutral"
  lottieAnimations: {
    right?: any
    wrong?: any
    default?: any
  }
  message?: string
  isRightPrevious?: boolean
  showMessage?: boolean
}

const emotionMessages = {
  happy: ["Отлично! 🔥", "Так держать! 💪", "Ты гений! 🎯", "Продолжай в том же духе! ⭐"],
  sad: ["Ничего страшного! 💙", "В следующий раз получится! 🌟", "Не сдавайся! 🚀", "Ошибка - это опыт! 📚"],
  thinking: ["Думай... 🤔", "Какой ответ? 💭", "Ты сможешь! ✨", "Вспоминай... 🧠"],
  celebrating: ["Ура! 🎉", "Победа! 🏆", "Ты лучший! 👑", "Вау! 🌟"],
  waiting: ["Жду ответа... ⏳", "Выбирай! 🎯", "Давай смелее! 💪", "Время идет... ⏰"],
  angry: ["Быстрее! ⚡", "Время на исходе! ⏰", "Торопись! 🏃", "Осталось секунды! 🔥"],
  neutral: ["Думай головой 🧠", "Верь в себя! 🌟", "Ты справишься! 💪"]
}

export const TrainerMascot = ({ 
  emotion, 
  lottieAnimations,
  message,
  isRightPrevious,
  showMessage = true
}: TrainerMascotProps) => {
  const [currentMessage, setCurrentMessage] = useState("")
  const [isMessageVisible, setIsMessageVisible] = useState(false)
  const previousEmotionRef = useRef(emotion)
  const messageTimeoutRef = useRef<NodeJS.Timeout>()

  // Очистка таймера
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  // Показываем сообщение при изменении эмоции
  useEffect(() => {
    if (!showMessage) return
    
    if (previousEmotionRef.current !== emotion) {
      previousEmotionRef.current = emotion
      
      const messages = emotionMessages[emotion] || emotionMessages.neutral
      const randomMessage = message || messages[Math.floor(Math.random() * messages.length)]
      
      setCurrentMessage(randomMessage)
      setIsMessageVisible(true)
      
      messageTimeoutRef.current = setTimeout(() => {
        setIsMessageVisible(false)
      }, 2500)
    }
  }, [emotion, message, showMessage])

  // При первом монтировании
  useEffect(() => {
    if (showMessage && !currentMessage) {
      const messages = emotionMessages[emotion] || emotionMessages.neutral
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      setCurrentMessage(randomMessage)
      setIsMessageVisible(true)
      
      messageTimeoutRef.current = setTimeout(() => {
        setIsMessageVisible(false)
      }, 2500)
    }
  }, [])

  const getLottieData = () => {
    if (isRightPrevious === true && lottieAnimations.right) return lottieAnimations.right
    if (isRightPrevious === false && lottieAnimations.wrong) return lottieAnimations.wrong
    return lottieAnimations.default
  }

  return (
    <div className="flex flex-row items-center gap-4">
      {/* Талисман */}
      <motion.div
        animate={{
          scale: emotion === "celebrating" ? [1, 1.15, 1] : 1,
          y: emotion === "happy" ? [0, -8, 0] : 0,
          rotate: emotion === "thinking" ? [0, -10, 10, 0] : 0,
        }}
        transition={{
          duration: 0.5,
          repeat: emotion === "celebrating" ? Infinity : emotion === "happy" ? 2 : 0,
          repeatType: "reverse",
        }}
        className="cursor-pointer shrink-0"
      >
        <Lottie 
          animationData={getLottieData()}
          loop={emotion === "thinking" || emotion === "waiting"}
          className="w-16 h-16 md:w-20 md:h-20"
        />
      </motion.div>

      {/* Сообщение справа от талисмана */}
      <AnimatePresence mode="wait">
        {isMessageVisible && currentMessage && (
          <motion.div
            key={currentMessage + emotion}
            initial={{ scale: 0, x: -20, opacity: 0 }}
            animate={{ scale: 1, x: 0, opacity: 1 }}
            exit={{ scale: 0, x: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative px-4 py-2 bg-white rounded-2xl shadow-lg border-2 border-slate-200"
          >
            <span className="text-slate-700 font-bold text-sm whitespace-nowrap">
              {currentMessage}
            </span>
            {/* Стрелка слева, указывающая на талисман */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-t-2 border-l-2 border-slate-200 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}