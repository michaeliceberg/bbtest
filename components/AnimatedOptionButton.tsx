// components/AnimatedOptionButton.tsx
"use client"

import { motion } from "framer-motion"
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

  const getButtonStyle = () => {
    if (isCorrect) return "bg-[#78C93C] text-white shadow-lg shadow-black/20 border-[#5FA12F]"
    if (isWrong) return "bg-[#FF4B4B] text-white shadow-lg shadow-black/20 border-[#C43333]"
    return "bg-[#232F34] border-2 border-[#37464F] hover:border-[#78C93C] hover:shadow-lg text-slate-100"
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 350, damping: 25 }}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center 
        w-full py-4 px-6
        text-base md:text-lg font-bold rounded-xl
        transition-all duration-300
        ${getButtonStyle()}
      `}
    >
      {/* Shimmer эффект при наведении */}
      {!disabled && !isCorrect && !isWrong && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/15 to-transparent"
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
          <Check className="w-4 h-4 text-green-500" />
        </motion.div>
      )}
      
      {isWrong && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-red-500" />
        </motion.div>
      )}
    </motion.button>
  )
}