"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef } from "react"
import { StreakEffect } from "@/lib/streakEffects"

type Props = {
  effect: StreakEffect | null
  onClose: () => void
}

export default function WinStreakModal({ effect, onClose }: Props) {

  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {

    if (!effect) return

    const audio = audioRef.current
    if (!audio) return

    audio.play()

    const handleEnd = () => {
      setTimeout(() => {
        onClose()
      }, 1000)
    }

    audio.addEventListener("ended", handleEnd)

    return () => {
      audio.removeEventListener("ended", handleEnd)
    }

  }, [effect, onClose])

  return (

    <AnimatePresence>

      {effect && (

        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >

          <motion.div
            className="bg-[#151F23] p-6 rounded-xl shadow-xl text-center"
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300 }}
          >

            <motion.img
              src={effect.image}
              className="w-48 mx-auto"
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2 }}
            />

            <h2 className="text-2xl font-bold mt-4">
              {effect.title}
            </h2>

            <audio
              ref={audioRef}
              src={effect.audio}
            />

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>

  )
}