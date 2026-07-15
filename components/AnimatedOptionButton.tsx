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
    if (isCorrect) return "bg-[#678337] text-white shadow-lg shadow-black/20 border-[#53692C]"
    if (isWrong) return "bg-[#C8524E] text-white shadow-lg shadow-black/20 border-[#A3423E]"
    if (isSelected) return "bg-[#5183A4] text-white shadow-lg shadow-black/20 border-[#3E6883]"
    return "bg-[#161F23] border-2 border-[#3A464E] hover:border-[#5183A4] hover:shadow-lg text-[#F2F7FB]"
  }

  const handleClick = () => {
    if (disabled) return
    // Bounce: кнопка чуть увеличивается и возвращается к исходному размеру
    controls.start({ scale: [1, 1.1, 1], transition: { duration: 0.3, ease: "easeInOut" } })
    onClick()
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, y: 20 }}
      animate={controls}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
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
        transition-colors duration-300
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
          className="absolute right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-[#678337]" />
        </motion.div>
      )}

      {isWrong && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-[#C8524E]" />
        </motion.div>
      )}
    </motion.button>
  )
}
