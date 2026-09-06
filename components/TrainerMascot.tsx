"use client"

import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useEffect, useState, useRef } from "react"
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

// Реплики маскота теперь не пропадают "в пустоту" по таймеру — они
// висят на экране, пока не придёт следующая (при смене эмоции), и тогда
// AnimatePresence плавно меняет старую фразу на новую.

interface TrainerMascotProps {
  emotion: "happy" | "sad" | "thinking" | "celebrating" | "waiting" | "angry" | "neutral"
  lottieAnimations: {
    right?: any
    wrong?: any
    default?: any
  }
  message?: string
  isRightPrevious?: boolean | null
  showMessage?: boolean
  // Текст самого задания ("Найди сторону:" и т.п.) — пока пользователь
  // ещё не ответил (emotion === thinking/waiting), показываем ЕГО в
  // облаке маскота вместо общей фразы-подбадривания ("думай...",
  // "давай смелее") — экономит отдельную строку-заголовок над картинкой
  // и делает облако полезным. На состояниях обратной связи после ответа
  // (celebrating/sad и т.п.) по-прежнему живые случайные фразы.
  taskMessage?: string
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
  showMessage = true,
  taskMessage,
}: TrainerMascotProps) => {
  const [currentMessage, setCurrentMessage] = useState("")
  const [isMessageVisible, setIsMessageVisible] = useState(false)
  const previousEmotionRef = useRef(emotion)

  // Показываем сообщение при изменении эмоции (и один раз при монтировании).
  // Больше нет таймера, который прятал фразу в никуда — она остаётся
  // на экране, пока её не сменит следующая.
  useEffect(() => {
    if (!showMessage) return

    // Пока ответ ещё не дан (thinking сразу после загрузки вопроса,
    // waiting пока пользователь выбирает) — облако показывает само
    // задание, если оно передано, а не случайную фразу.
    if ((emotion === "thinking" || emotion === "waiting") && taskMessage) {
      previousEmotionRef.current = emotion
      setCurrentMessage(taskMessage)
      setIsMessageVisible(true)
      return
    }

    const isFirstMessage = !currentMessage
    if (previousEmotionRef.current !== emotion || isFirstMessage) {
      previousEmotionRef.current = emotion

      const messages = emotionMessages[emotion] || emotionMessages.neutral
      const randomMessage = message || messages[Math.floor(Math.random() * messages.length)]

      setCurrentMessage(randomMessage)
      setIsMessageVisible(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, message, showMessage, taskMessage])

  const getLottieData = () => {
    if (isRightPrevious === true && lottieAnimations.right) return lottieAnimations.right
    if (isRightPrevious === false && lottieAnimations.wrong) return lottieAnimations.wrong
    return lottieAnimations.default
  }

  return (
    <div className="flex flex-row items-center gap-3">
      {/* Талисман — уменьшен по прямой просьбе пользователя: занимал
          слишком много места по вертикали, из-за чего остальной контент
          вопроса (особенно крупные картинки-диаграммы) уезжал вниз. */}
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
          className="w-10 h-10 md:w-12 md:h-12"
        />
      </motion.div>

      {/* Сообщение справа от талисмана — key только на текст (не на
          emotion+текст), чтобы переход thinking→waiting с ОДНИМ и тем же
          taskMessage не перезапускал анимацию появления зря */}
      <AnimatePresence mode="wait">
        {isMessageVisible && currentMessage && (
          <motion.div
            key={currentMessage}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative px-3 py-1.5 bg-[#151F23] rounded-2xl shadow-lg border-2 border-[#3A464E] max-w-[220px] sm:max-w-xs"
          >
            <span className="text-[#F2F7FB] font-bold text-xs whitespace-normal break-words">
              <Latex>{currentMessage}</Latex>
            </span>
            {/* Стрелка слева, указывающая влево < */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[#3A464E] text-xl font-bold">
              &lt;
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}