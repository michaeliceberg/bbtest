// components/AnimatedHeart.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Heart } from "lucide-react"

interface AnimatedHeartProps {
  isActive: boolean
  index: number
}

export const AnimatedHeart = ({ isActive, index }: AnimatedHeartProps) => {
  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div
          key={`heart-${index}-active`}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ 
            scale: [1, 1.5, 0],
            opacity: [1, 0.5, 0],
            rotate: [0, 0, 90],
            transition: { duration: 0.5, ease: "easeInOut" }
          }}
        >
          <Heart className="fill-red-500 text-red-500 w-8 h-8" />
        </motion.div>
      ) : (
        <motion.div
          key={`heart-${index}-lost`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.3 }}
        >
          <Heart className="text-gray-300 w-8 h-8" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}