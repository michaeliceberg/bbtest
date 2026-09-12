"use client"

import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { useEffect, useState, useRef } from "react"
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

// Реплики маскота теперь не пропадают "в пустоту" по таймеру — они
// висят на экране, пока не придёт следующая (при смене эмоции или
// задания), и тогда key-ремонт (см. ниже) меняет старую фразу на новую.

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
  // На боссовском этапе (см. TrainerBossBar, тот же цвет #DC605B, что у
  // подписи "Босс") облако получает пульсирующую тень того же цвета,
  // расходящуюся во все стороны — по прямой просьбе пользователя.
  isBossStage?: boolean
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
  isBossStage = false,
}: TrainerMascotProps) => {
  const [currentMessage, setCurrentMessage] = useState("")
  const [isMessageVisible, setIsMessageVisible] = useState(false)
  const previousEmotionRef = useRef(emotion)

  // "Удар по боссу" — каждый верный ответ на боссовском этапе резко
  // дёргает аватарку в СЛУЧАЙНУЮ сторону (то по X, то по Y) с затуханием,
  // по прямой просьбе пользователя. key меняется на каждый хит — тот же
  // приём key-ремонта, что уже используется в TrainerBossBar (lootKey) и
  // по всему проекту вместо AnimatePresence/повторного триггера одной и
  // той же animate-цели: framer-motion не всегда переигрывает keyframe-
  // массив заново, если сам объект animate не поменял "форму", а смена
  // key гарантированно пересоздаёт узел. hitKey=0 — исходное состояние
  // (до первого хита), тряски ещё не было.
  const [hitShake, setHitShake] = useState<{ key: number; axis: 'x' | 'y' }>({ key: 0, axis: 'x' })
  useEffect(() => {
    if (!isBossStage || isRightPrevious !== true) return
    setHitShake((prev) => ({ key: prev.key + 1, axis: Math.random() < 0.5 ? 'x' : 'y' }))
  }, [isRightPrevious, isBossStage])

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
    <div className="flex flex-row items-center gap-4">
      {/* Талисман — крупнее по просьбе пользователя (было w-10/w-12).
          Внешняя обёртка — ТОЛЬКО для "удара по боссу" (см. hitShake
          выше), отдельно от эмоциональной анимации на внутреннем
          motion.div, чтобы не конфликтовать с ней за transform. */}
      <motion.div
        key={isBossStage ? `hit-${hitShake.key}` : 'no-hit'}
        animate={
          isBossStage && hitShake.key > 0
            ? hitShake.axis === 'x'
              ? { x: [0, 18, -13, 8, -4, 0] }
              : { y: [0, -18, 13, -8, 4, 0] }
            : {}
        }
        transition={{ duration: 0.4, ease: [0.36, 0.07, 0.19, 0.97] }}
        className="shrink-0"
      >
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
        className="cursor-pointer"
      >
        <Lottie
          animationData={getLottieData()}
          loop={emotion === "thinking" || emotion === "waiting"}
          className="w-16 h-16 md:w-20 md:h-20"
        />
      </motion.div>
      </motion.div>

      {/* Облако сообщения — занимает всё оставшееся место в строке
          (flex-1) и текст крупнее, вместо узкой фиксированной пилюли,
          чтобы было удобнее читать текст задания. key только на текст
          (не на emotion+текст), чтобы переход thinking→waiting с ОДНИМ и
          тем же taskMessage не перезапускал анимацию появления зря.
          Раньше это было обёрнуто в AnimatePresence mode="wait" — тот же
          класс бага, что уже чинили в TypeAssist/trainer-question.tsx
          (framer-motion не всегда вызывает колбэк завершения exit-
          анимации): при быстрой смене вопросов новое сообщение иногда
          НИКОГДА не появлялось, облако застревало на тексте предыдущего
          задания навсегда. Обычный key-ремонт без exit гарантированно и
          синхронно подменяет узел, не полагаясь на чужую анимацию. */}
      {isMessageVisible && currentMessage && (
        <motion.div
          key={currentMessage}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            // Пульсирующая тень в цвет подписи "Босс" (#DC605B),
            // расходящаяся во все стороны — только на боссовском этапе.
            ...(isBossStage
              ? {
                  boxShadow: [
                    "0 0 0px 0px rgba(220,96,91,0)",
                    "0 0 26px 10px rgba(220,96,91,0.55)",
                    "0 0 0px 0px rgba(220,96,91,0)",
                  ],
                }
              : {}),
          }}
          transition={{
            default: { type: "spring", stiffness: 400, damping: 25 },
            ...(isBossStage
              ? { boxShadow: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }
              : {}),
          }}
          className="relative flex-1 min-w-0 px-4 py-3 bg-[#151F23] rounded-2xl shadow-lg border-2 border-[#3A464E]"
        >
          <span className="text-[#F2F7FB] font-bold text-base md:text-lg whitespace-normal break-words">
            <Latex>{currentMessage}</Latex>
          </span>
          {/* Стрелка слева, указывающая влево < */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[#3A464E] text-xl font-bold">
            &lt;
          </div>
        </motion.div>
      )}
    </div>
  )
}