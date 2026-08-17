// components/AnimatedOptionButton.tsx
"use client"

import { motion, useAnimation } from "framer-motion"
import Latex from 'react-latex-next'
import { useEffect } from "react"
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
  const [isPressed, setIsPressed] = React.useState(false)
  // Натуральный bounce при isCorrect используя Framer Motion
  const getAnimateState = () => {
    if (isCorrect) {
      return {
        scale: [1, 0.8, 1.15, 0.95, 1],
        opacity: 1,
        x: 0
      }
    }
    return {
      opacity: 1,
      x: 0,
      y: isPressed || isSelected ? 2 : 0,
      boxShadow: isPressed || isSelected
        ? '0 2px 0 rgba(58,70,78,1)'
        : '0 4px 0 rgba(58,70,78,1)'
    }
  }

  const getTransition = () => {
    if (isCorrect) {
      return {
        scale: {
          duration: 0.6,
          times: [0, 0.2, 0.4, 0.6, 1],
          ease: [0.34, 1.56, 0.64, 1]
        }
      }
    }
    return {
      delay: index * 0.08,
      type: "spring",
      stiffness: 350,
      damping: 25,
      boxShadow: { duration: 0.05 },
      y: { duration: 0.05 }
    }
  }

  const getButtonStyle = () => {
    // При правильном ответе - оливковый border, текст и темный фон
    if (isCorrect) return "bg-[#232F35] text-[#A1D151] border-[#A1D151] shadow-lg shadow-black/20"
    // При неправильном ответе - только красный border и текст
    if (isWrong) return "bg-[#161F23] text-[#DC605B] border-[#DC605B] shadow-lg shadow-black/20"
    // При выборе - голубой border и текст
    if (isSelected) return "bg-[#161F23] text-[#4897D1] border-[#4897D1] shadow-lg shadow-black/20"
    // По умолчанию
    return "bg-[#161F23] border-[#3A464E] text-[#F2F7FB]"
  }

  const handleClick = () => {
    if (disabled) return
    onClick()
  }

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={getAnimateState()}
      transition={getTransition()}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center
        w-full py-3 px-3 md:py-4 md:px-6
        text-sm md:text-lg font-bold rounded-xl
        border-2
        ${getButtonStyle()}
      `}
    >

      <span className="relative z-10">
        <Latex>{option}</Latex>
      </span>

      {/* Иконка правильного/неправильного ответа */}
      {isCorrect && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute right-4 w-6 h-6 bg-[#A1D151] rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-[#151F24]" strokeWidth={3} />
        </motion.div>
      )}

      {isWrong && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute right-4 w-6 h-6 bg-[#DC605B] rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-[#151F24]" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  )
}
