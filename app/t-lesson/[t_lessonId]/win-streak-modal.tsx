// "use client"

// import React from 'react';
// import { useEffect, useRef } from "react"

// export default function WinStreakModal({ onClose }) {

//   const audioRef = useRef<HTMLAudioElement>(null)

//   useEffect(() => {

//     const audio = audioRef.current
//     if (!audio) return

//     audio.play()

//     const handleEnd = () => {
//       setTimeout(() => {
//         onClose()
//       }, 1000)
//     }

//     audio.addEventListener("ended", handleEnd)

//     return () => {
//       audio.removeEventListener("ended", handleEnd)
//     }

//   }, [])

//   return (
    
//     <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

//       <div className="bg-white p-6 rounded-xl shadow-xl text-center">

//         <img
//           src="/images/winner.png"
//           className="w-48 mx-auto"
//         />

//         <p className="text-xl font-bold mt-4">
//           3 подряд! 🔥
//         </p>

//         <audio
//           ref={audioRef}
//           src="/audio/winner.mp3"
//         />

//       </div>

//     </div>

//   )
// }