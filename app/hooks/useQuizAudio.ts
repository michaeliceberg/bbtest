// import { useCallback, useEffect, useState } from "react"

// // hooks/useQuizAudio.ts
// export const useQuizAudio = (finishAudioSrc: string) => {
//     const [audioElements] = useState(() => ({
//       correct: new Audio('/correct.wav'),
//       incorrect: new Audio('/incorrect.wav'),
//       finish: new Audio(finishAudioSrc)
//     }))
  
//     const play = useCallback((type: 'correct' | 'incorrect' | 'finish') => {
//       const audio = audioElements[type]
//       audio.currentTime = 0
//       audio.play().catch(console.error)
//     }, [audioElements])
  
//     useEffect(() => {
//       return () => {
//         Object.values(audioElements).forEach(audio => {
//           audio.pause()
//           audio.src = ''
//         })
//       }
//     }, [audioElements])
  
//     return { play }
//   }



// // hooks/useQuizAudio.ts
// import { useCallback, useEffect, useState } from "react"

// export const useQuizAudio = (finishAudioSrc: string) => {
//   const [audioElements] = useState(() => ({
//     correct: new Audio('/correct.wav'),
//     incorrect: new Audio('/incorrect.wav'),
//     finish: new Audio(finishAudioSrc)
//   }))

//   const play = useCallback((type: 'correct' | 'incorrect' | 'finish') => {
//     const audio = audioElements[type]
//     audio.currentTime = 0
//     audio.play().catch(console.error)
//   }, [audioElements])

//   useEffect(() => {
//     return () => {
//       Object.values(audioElements).forEach(audio => {
//         audio.pause()
//         audio.src = ''
//       })
//     }
//   }, [audioElements])

//   return { play }
// }



// hooks/useQuizAudio.ts — звуки «верно/неверно/финиш» тренажёра.
// Через lib/sound.ts (Web Audio, предзагрузка и раскодирование заранее):
// через HTMLAudioElement на iPhone звук заметно запаздывал после нажатия.
import { useCallback, useEffect } from "react"
import { playSound, preloadSound } from "@/lib/sound"

export const useQuizAudio = (finishAudioSrc: string) => {
  useEffect(() => {
    preloadSound('/correct.wav')
    preloadSound('/incorrect.wav')
    preloadSound(finishAudioSrc)
  }, [finishAudioSrc])

  const play = useCallback((type: 'correct' | 'incorrect' | 'finish') => {
    const src = type === 'correct' ? '/correct.wav'
      : type === 'incorrect' ? '/incorrect.wav'
      : finishAudioSrc
    playSound(src)
  }, [finishAudioSrc])

  return { play }
}
