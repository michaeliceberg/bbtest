// components/AnimatedHearts.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AnimatedHeart } from "./AnimatedHeart"

interface AnimatedHeartsProps {
  hearts: number
  maxHearts?: number
}

export const AnimatedHearts = ({ hearts, maxHearts = 3 }: AnimatedHeartsProps) => {
  // Анимация при изменении количества сердечек
  const shakeAnimation = {
    scale: [1, 1.2, 1],
    transition: { duration: 0.3 }
  }

  return (
    <motion.div 
      className="flex gap-2 justify-center"
      animate={hearts < 3 ? shakeAnimation : {}}
    >
      {[...Array(maxHearts)].map((_, index) => (
        <motion.div
          key={index}
          initial={false}
          animate={index < hearts ? { scale: 1 } : { scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatedHeart isActive={index < hearts} index={index} />
        </motion.div>
      ))}
    </motion.div>
  )
}


// "use client"

// import React from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import Image from "next/image"

// interface AnimatedHeartsProps {
//   hearts: number
// }

// export const AnimatedHearts = ({ hearts }: AnimatedHeartsProps) => {
//   return (
//     <div className="flex justify-center gap-2">
//       {[1, 2, 3].map((_, i) => (
//         <motion.div
//           key={i}
//           initial={i < hearts ? { scale: 1 } : { scale: 0.8 }}
//           animate={i < hearts 
//             ? { 
//                 scale: [1, 1.2, 1],
//                 transition: { delay: i * 0.1, duration: 0.3 }
//               }
//             : { scale: 0.8, opacity: 0.4 }
//           }
//         >
//           <Image 
//             src={i < hearts ? '/heartYes.svg' : '/heartNo.svg'} 
//             height={28} 
//             width={28} 
//             alt='Heart' 
//           />
//         </motion.div>
//       ))}
//     </div>
//   )
// }