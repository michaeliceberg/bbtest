// components/AnimatedOptionButton.tsx
"use client"

import { motion, useAnimation } from "framer-motion"
import Latex from 'react-latex-next'
import { useState, useEffect } from "react"
import React from "react"
import 'katex/dist/katex.min.css';
import { Check, X } from 'lucide-react';


interface AnimatedOptionButtonProps {
  option: string
  onClick: () => void
  index: number
  isSelected?: boolean
  isCorrect?: boolean
  isWrong?: boolean
  disabled?: boolean
}

export const AnimatedOptionButton = ({
  option,
  onClick,
  index,
  isSelected,
  isCorrect,
  isWrong,
  disabled
}: AnimatedOptionButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const controls = useAnimation()

  // Стартовое появление кнопки (once), затем controls свободны для bounce-эффекта по клику
  useEffect(() => {
    controls.start({
      opacity: 1, x: 0, y: 0,
      transition: { delay: index * 0.08, type: "spring", stiffness: 350, damping: 25 }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getButtonStyle = () => {
    // При правильном ответе - оливковый border, текст и темный фон
    if (isCorrect) return "bg-[#232F35] text-[#678337] border-[#678337] shadow-lg shadow-black/20"
    // При неправильном ответе - только красный border и текст
    if (isWrong) return "bg-[#161F23] text-[#DC605B] border-[#DC605B] shadow-lg shadow-black/20"
    // При выборе - голубой border и текст
    if (isSelected) return "bg-[#161F23] text-[#4897D1] border-[#4897D1] shadow-lg shadow-black/20"
    // По умолчанию
    return "bg-[#161F23] border-[#3A464E] hover:border-[#5183A4] hover:shadow-lg text-[#F2F7FB]"
  }

  const handleClick = () => {
    if (disabled) return
    onClick()
  }

  // Bounce анимация: сжатие (пружина) → подпрыгивание → возврат
  useEffect(() => {
    if (isCorrect) {
      controls.start({
        scaleY: [1, 0.85, 1, 1.05, 1],  // сжатие вниз → выпрямление → подпрыгивание → возврат
        y: [0, 0, 0, -15, 0],             // подпрыгивание вверх
        transition: {
          duration: 0.6,
          times: [0, 0.2, 0.3, 0.6, 1],
          ease: "easeInOut"
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCorrect])

  return (
    <motion.button
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, y: 20 }}
      animate={controls}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center
        w-full py-3 px-3 md:py-4 md:px-6
        text-sm md:text-lg font-bold rounded-xl
        border-2 border-b-4 active:border-b-2
        transition-[border-width,background-color,color,border-color,box-shadow] duration-100
        ${getButtonStyle()}
      `}
    >
      {/* Shimmer эффект при наведении */}
      {!disabled && !isCorrect && !isWrong && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5183A4]/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.6 }}
        />
      )}

      <span className="relative z-10">
        <Latex>{option}</Latex>
      </span>

      {/* Иконка правильного/неправильного ответа */}
      {isCorrect && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-4 w-6 h-6 bg-[#678337] rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-[#151F24]" strokeWidth={3} />
        </motion.div>
      )}

      {isWrong && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-4 w-6 h-6 bg-[#DC605B] rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-[#151F24]" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  )
}
