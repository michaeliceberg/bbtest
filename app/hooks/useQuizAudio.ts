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



// hooks/useQuizAudio.ts - упрощенная версия с динамическим созданием
import { useCallback, useRef } from "react"

export const useQuizAudio = (finishAudioSrc: string) => {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map())

  const getAudio = useCallback((type: string, src: string) => {
    if (!audioCache.current.has(type)) {
      audioCache.current.set(type, new Audio(src))
    }
    return audioCache.current.get(type)!
  }, [])

  const play = useCallback((type: 'correct' | 'incorrect' | 'finish') => {
    const src = type === 'correct' ? '/correct.wav' 
      : type === 'incorrect' ? '/incorrect.wav' 
      : finishAudioSrc
    
    const audio = getAudio(type, src)
    audio.currentTime = 0
    
    // Важно: не используем .catch, чтобы не засорять консоль
    audio.play().catch(() => {
      // Игнорируем ошибки автовоспроизведения
    })
  }, [getAudio, finishAudioSrc])

  return { play }
}