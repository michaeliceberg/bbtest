"use client"

import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import { QuestionType } from "./page"
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';

type Props = {
    onAnswer: (answer: string) => void
    question: QuestionType
    setLrAnswer: (lrAnswer: number) => void
}

export default function SwipeCard({ onAnswer, question, setLrAnswer }: Props) {
    const x = useMotionValue(0)
    const [isAnswered, setIsAnswered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragProgress, setDragProgress] = useState(0)
    const constraintsRef = useRef<HTMLDivElement>(null)

    // Определяем варианты ответов
    const leftOption = question.options[1] || question.options[0]
    const rightOption = question.options[0]

    // Следим за прогрессом свайпа
    useMotionValueEvent(x, "change", (latest) => {
        const normalized = Math.max(-1, Math.min(1, latest / 100))
        setDragProgress(normalized)
    })

    // Анимации карточки
    const rotate = useTransform(x, [-150, 0, 150], [-8, 0, 8])
    const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95])
    
    // Тень карточки
    const boxShadow = useTransform(
        x,
        [-150, 0, 150],
        ['0 20px 25px -12px rgba(0,0,0,0.2)', '0 10px 15px -3px rgba(0,0,0,0.1)', '0 20px 25px -12px rgba(0,0,0,0.2)']
    )

    useEffect(() => {
        setIsAnswered(false)
        setLrAnswer(0)
        x.set(0)
        setDragProgress(0)
    }, [question, setLrAnswer, x])

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isAnswered) return
        
        const swipe = info.offset.x
        const velocity = info.velocity.x
        
        if (Math.abs(swipe) > 70 || Math.abs(velocity) > 500) {
            const isRightSwipe = swipe > 0 || velocity > 0
            
            const selectedOption = isRightSwipe ? rightOption : leftOption
            const isCorrect = selectedOption === question.correctAnswer
            
            const targetX = isRightSwipe ? 500 : -500
            x.set(targetX)
            
            setIsAnswered(true)
            
            setTimeout(() => {
                onAnswer(isCorrect ? 'right' : 'wrong')
                x.set(0)
            }, 300)
        } else {
            x.set(0)
        }
        
        setIsDragging(false)
    }

    const handleDragStart = () => {
        if (!isAnswered) {
            setIsDragging(true)
        }
    }

    // Определяем, в какую сторону свайпают
    const isSwipingLeft = dragProgress < -0.2
    const isSwipingRight = dragProgress > 0.2

    return (
        <div className="relative w-full max-w-xl mx-auto" ref={constraintsRef}>
            {/* Drag карточка */}
            <motion.div
                style={{
                    x,
                    rotate,
                    scale,
                    boxShadow,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                drag="x"
                dragConstraints={constraintsRef}
                dragElastic={0.4}
                dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`
                    relative z-10
                    bg-[#151F23]
                    rounded-2xl
                    min-h-[320px] w-full
                    cursor-grab active:cursor-grabbing
                    border-2 border-[#3A464E]
                `}
            >
                {/* Индикатор "потяни" сверху */}
                <motion.div 
                    className="absolute top-3 left-0 right-0 flex justify-center"
                    animate={{ opacity: isDragging ? 0 : 0.4 }}
                >
                    <GripVertical className="w-4 h-4 text-gray-300" />
                </motion.div>

                <div className="flex flex-col items-center justify-center min-h-[320px] p-8">
                    {/* Задумчивое лицо - всегда 🤔 */}
                    <motion.div 
                        className="mb-4 text-5xl"
                        animate={{ 
                            scale: isDragging ? 0.8 : 1,
                            rotate: isDragging ? [0, -10, 10, 0] : 0
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        🤔
                    </motion.div>
                    
                    <div className="text-center mb-8">
                        <div className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wide">
                            {isDragging ? 'Отпусти, чтобы выбрать!' : 'Свайпни влево или вправо'}
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-[#F2F7FB]">
                            <Latex>{question.question}</Latex>
                        </div>
                    </div>

                    {/* Индикаторы вариантов */}
                    <div className="flex items-center justify-center gap-12">
                        {/* Левый вариант */}
                        <motion.div 
                            className="flex flex-col items-center gap-3"
                            animate={{ 
                                scale: isSwipingLeft ? 1.4 : 1,
                                opacity: isSwipingLeft ? 1 : 0.7
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                            <motion.div 
                                className="bg-[#232F34] rounded-full p-4"
                                animate={{
                                    backgroundColor: isSwipingLeft ? "#58cc71" : "#f3f4f6",
                                    scale: isSwipingLeft ? 1.2 : 1
                                }}
                            >
                                <ChevronLeft 
                                    className="w-6 h-6" 
                                    strokeWidth={2.5}
                                    style={{ color: isSwipingLeft ? "white" : "#374151" }}
                                />
                            </motion.div>
                            <motion.span 
                                className="text-base font-bold text-[#F2F7FB]"
                                animate={{
                                    color: isSwipingLeft ? "#58cc71" : "#374151",
                                    scale: isSwipingLeft ? 1.1 : 1
                                }}
                            >
                                <Latex>{leftOption}</Latex>
                            </motion.span>
                        </motion.div>
                        
                        {/* Разделитель */}
                        <motion.div 
                            className="w-2 h-2 bg-gray-300 rounded-full"
                            animate={{ 
                                scale: isDragging ? [1, 1.5, 1] : 1,
                                opacity: isDragging ? 0.5 : 0.3
                            }}
                            transition={{ repeat: isDragging ? Infinity : 0, duration: 1 }}
                        />
                        
                        {/* Правый вариант */}
                        <motion.div 
                            className="flex flex-col items-center gap-3"
                            animate={{ 
                                scale: isSwipingRight ? 1.4 : 1,
                                opacity: isSwipingRight ? 1 : 0.7
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                            <motion.div 
                                className="bg-[#232F34] rounded-full p-4"
                                animate={{
                                    backgroundColor: isSwipingRight ? "#58cc71" : "#f3f4f6",
                                    scale: isSwipingRight ? 1.2 : 1
                                }}
                            >
                                <ChevronRight 
                                    className="w-6 h-6" 
                                    strokeWidth={2.5}
                                    style={{ color: isSwipingRight ? "white" : "#374151" }}
                                />
                            </motion.div>
                            <motion.span 
                                className="text-base font-bold text-[#F2F7FB]"
                                animate={{
                                    color: isSwipingRight ? "#58cc71" : "#374151",
                                    scale: isSwipingRight ? 1.1 : 1
                                }}
                            >
                                <Latex>{rightOption}</Latex>
                            </motion.span>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}








// "use client"

// import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent } from "framer-motion"
// import { useEffect, useState, useRef } from "react"
// import { Check, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
// import { QuestionType } from "./page"
// import Latex from 'react-latex-next'
// import 'katex/dist/katex.min.css';

// type Props = {
//     onAnswer: (answer: string) => void
//     question: QuestionType
//     setLrAnswer: (lrAnswer: number) => void
// }

// export default function SwipeCard({ onAnswer, question, setLrAnswer }: Props) {
//     const x = useMotionValue(0)
//     const [isAnswered, setIsAnswered] = useState(false)
//     const [isDragging, setIsDragging] = useState(false)
//     const [dragProgress, setDragProgress] = useState(0)
//     const constraintsRef = useRef<HTMLDivElement>(null)

//     // Определяем варианты ответов
//     const leftOption = question.options[1] || question.options[0]
//     const rightOption = question.options[0]

//     // Следим за прогрессом свайпа
//     useMotionValueEvent(x, "change", (latest) => {
//         const normalized = Math.max(-1, Math.min(1, latest / 100))
//         setDragProgress(normalized)
//     })

//     // Анимации карточки
//     const rotate = useTransform(x, [-150, 0, 150], [-8, 0, 8])
//     const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95])
    
//     // Цвет фона при свайпе
//     const backgroundColor = useTransform(
//         x,
//         [-150, -50, 0, 50, 150],
//         ['#ff4b4b', '#fff5f5', '#ffffff', '#f0fdf4', '#58cc71']
//     )

//     // Позиция и прозрачность индикаторов
//     const leftIconX = useTransform(x, [-150, -30], [0, -60])
//     const rightIconX = useTransform(x, [30, 150], [0, 60])
//     const leftIconOpacity = useTransform(x, [-150, -30], [1, 0])
//     const rightIconOpacity = useTransform(x, [30, 150], [1, 0])
//     const leftIconScale = useTransform(x, [-150, -30], [1, 0.5])
//     const rightIconScale = useTransform(x, [30, 150], [1, 0.5])

//     useEffect(() => {
//         setIsAnswered(false)
//         setLrAnswer(0)
//         x.set(0)
//         setDragProgress(0)
//     }, [question, setLrAnswer, x])

//     const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
//         if (isAnswered) return
        
//         const swipe = info.offset.x
//         const velocity = info.velocity.x
        
//         if (Math.abs(swipe) > 70 || Math.abs(velocity) > 500) {
//             const isRightSwipe = swipe > 0 || velocity > 0
            
//             // Выбранный вариант
//             const selectedOption = isRightSwipe ? rightOption : leftOption
            
//             // Проверяем правильность
//             const isCorrect = selectedOption === question.correctAnswer
            
//             const targetX = isRightSwipe ? 500 : -500
//             x.set(targetX)
            
//             setIsAnswered(true)
            
//             setTimeout(() => {
//                 // Передаём 'right' или 'wrong'
//                 onAnswer(isCorrect ? 'right' : 'wrong')
//                 x.set(0)
//             }, 300)
//         } else {
//             x.set(0)
//         }
        
//         setIsDragging(false)
//     }

//     const handleDragStart = () => {
//         if (!isAnswered) {
//             setIsDragging(true)
//         }
//     }

//     return (
//         <div className="relative w-full max-w-xl mx-auto" ref={constraintsRef}>
//             {/* Фоновые индикаторы направления */}
//             <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4 z-0">
//                 <motion.div 
//                     style={{ 
//                         opacity: leftIconOpacity, 
//                         x: leftIconX,
//                         scale: leftIconScale
//                     }}
//                     className="flex flex-col items-center gap-3 bg-red-500 rounded-2xl py-4 px-6 shadow-lg"
//                 >
//                     <div className="bg-[#151F23] rounded-full p-2">
//                         <X className="w-8 h-8 text-red-500" strokeWidth={3} />
//                     </div>
//                     <span className="text-sm font-bold text-white">
//                         <Latex>{leftOption}</Latex>
//                     </span>
//                 </motion.div>
                
//                 <motion.div 
//                     style={{ 
//                         opacity: rightIconOpacity, 
//                         x: rightIconX,
//                         scale: rightIconScale
//                     }}
//                     className="flex flex-col items-center gap-3 bg-green-500 rounded-2xl py-4 px-6 shadow-lg"
//                 >
//                     <div className="bg-[#151F23] rounded-full p-2">
//                         <Check className="w-8 h-8 text-green-500" strokeWidth={3} />
//                     </div>
//                     <span className="text-sm font-bold text-white">
//                         <Latex>{rightOption}</Latex>
//                     </span>
//                 </motion.div>
//             </div>

//             {/* Drag карточка */}
//             <motion.div
//                 style={{
//                     x,
//                     rotate,
//                     scale,
//                     backgroundColor,
//                     cursor: isDragging ? 'grabbing' : 'grab'
//                 }}
//                 drag="x"
//                 dragConstraints={constraintsRef}
//                 dragElastic={0.4}
//                 dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
//                 onDragStart={handleDragStart}
//                 onDragEnd={handleDragEnd}
//                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
//                 className={`
//                     relative z-10
//                     rounded-2xl shadow-xl
//                     min-h-[320px] w-full
//                     cursor-grab active:cursor-grabbing
//                     border-2 border-[#3A464E]
//                 `}
//             >
//                 <div className="flex flex-col items-center justify-center min-h-[320px] p-8">
//                     <div className="mb-4 text-5xl">
//                         👆
//                     </div>
                    
//                     <div className="text-center mb-8">
//                         <div className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wide">
//                             Свайпни влево или вправо
//                         </div>
//                         <div className="text-xl md:text-2xl font-bold text-[#F2F7FB]">
//                             <Latex>{question.question}</Latex>
//                         </div>
//                     </div>

//                     <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
//                         <div className="flex items-center gap-2 bg-[#232F34] rounded-full px-4 py-2">
//                             <ChevronLeft className="w-4 h-4 text-red-500" strokeWidth={3} />
//                             <span className="font-medium text-[#9AA7B0]">
//                                 <Latex>{leftOption}</Latex>
//                             </span>
//                         </div>
//                         <div className="w-2 h-2 bg-gray-300 rounded-full" />
//                         <div className="flex items-center gap-2 bg-[#232F34] rounded-full px-4 py-2">
//                             <span className="font-medium text-[#9AA7B0]">
//                                 <Latex>{rightOption}</Latex>
//                             </span>
//                             <ChevronRight className="w-4 h-4 text-green-500" strokeWidth={3} />
//                         </div>
//                     </div>

//                     <motion.div 
//                         className="absolute inset-0 flex items-center justify-between pointer-events-none px-8"
//                         style={{ opacity: useTransform(x, [0, 40], [0, 1]) }}
//                     >
//                         <motion.div 
//                             style={{ opacity: useTransform(x, [0, 40], [0, 1]) }}
//                             className="bg-green-500 rounded-full p-3 shadow-lg"
//                         >
//                             <Check className="w-10 h-10 text-white" strokeWidth={3} />
//                         </motion.div>
                        
//                         <motion.div 
//                             style={{ opacity: useTransform(x, [-40, 0], [1, 0]) }}
//                             className="bg-red-500 rounded-full p-3 shadow-lg"
//                         >
//                             <X className="w-10 h-10 text-white" strokeWidth={3} />
//                         </motion.div>
//                     </motion.div>

//                     <motion.div 
//                         className="absolute bottom-4 left-0 right-0 text-center"
//                         animate={{ opacity: isDragging ? 0 : 0.5 }}
//                         transition={{ duration: 0.2 }}
//                     >
//                         <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
//                             <ArrowRight className="w-3 h-3" />
//                             <span>потяни в сторону</span>
//                             <ArrowRight className="w-3 h-3" />
//                         </div>
//                     </motion.div>
//                 </div>
//             </motion.div>

//             <motion.div 
//                 className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2 z-10"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: isDragging ? 1 : 0, y: isDragging ? 0 : 10 }}
//                 transition={{ duration: 0.2 }}
//             >
//                 {[...Array(5)].map((_, i) => {
//                     const pointPosition = (i / 4) * 2 - 1
//                     const isActive = Math.abs(dragProgress - pointPosition) < 0.2
                    
//                     return (
//                         <motion.div
//                             key={i}
//                             className="rounded-full"
//                             animate={{
//                                 scale: isActive ? 1.3 : 0.7,
//                                 width: isActive ? 10 : 6,
//                                 height: isActive ? 10 : 6,
//                                 backgroundColor: isActive 
//                                     ? dragProgress > 0 ? "#58cc71" : "#ff4b4b"
//                                     : "#e5e7eb"
//                             }}
//                             transition={{
//                                 type: "spring",
//                                 stiffness: 500,
//                                 damping: 30
//                             }}
//                         />
//                     )
//                 })}
//             </motion.div>

//             <motion.div 
//                 className="absolute inset-0 pointer-events-none rounded-2xl"
//                 style={{
//                     opacity: useTransform(x, [80, 100], [0, 0.15]),
//                     background: useTransform(
//                         x,
//                         [80, 100],
//                         ['radial-gradient(circle, rgba(88,204,113,0) 0%, rgba(88,204,113,0) 100%)',
//                          'radial-gradient(circle, rgba(88,204,113,0.3) 0%, rgba(88,204,113,0) 100%)']
//                     )
//                 }}
//             />
//             <motion.div 
//                 className="absolute inset-0 pointer-events-none rounded-2xl"
//                 style={{
//                     opacity: useTransform(x, [-100, -80], [0.15, 0]),
//                     background: useTransform(
//                         x,
//                         [-100, -80],
//                         ['radial-gradient(circle, rgba(255,75,75,0.3) 0%, rgba(255,75,75,0) 100%)',
//                          'radial-gradient(circle, rgba(255,75,75,0) 0%, rgba(255,75,75,0) 100%)']
//                     )
//                 }}
//             />
//         </div>
//     )
// }










// "use client"

// import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent } from "framer-motion"
// import { useEffect, useState, useRef } from "react"
// import { Check, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
// import { QuestionType } from "./page"
// import Latex from 'react-latex-next'
// import 'katex/dist/katex.min.css';

// type Props = {
//     onAnswer: (answer: string) => void
//     question: QuestionType
//     setLrAnswer: (lrAnswer: number) => void
// }

// export default function SwipeCard({ onAnswer, question, setLrAnswer }: Props) {
//     const x = useMotionValue(0)
//     const [isAnswered, setIsAnswered] = useState(false)
//     const [isDragging, setIsDragging] = useState(false)
//     const [dragProgress, setDragProgress] = useState(0)
//     const constraintsRef = useRef<HTMLDivElement>(null)

//     // Следим за прогрессом свайпа
//     useMotionValueEvent(x, "change", (latest) => {
//         const normalized = Math.max(-1, Math.min(1, latest / 100))
//         setDragProgress(normalized)
//     })

//     // Анимации карточки
//     const rotate = useTransform(x, [-150, 0, 150], [-8, 0, 8])
//     const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95])
    
//     // Цвет фона при свайпе (Duolingo цвета)
//     const backgroundColor = useTransform(
//         x,
//         [-150, -50, 0, 50, 150],
//         ['#ff4b4b', '#fff5f5', '#ffffff', '#f0fdf4', '#58cc71']
//     )

//     // Позиция и прозрачность индикаторов
//     const leftIconX = useTransform(x, [-150, -30], [0, -60])
//     const rightIconX = useTransform(x, [30, 150], [0, 60])
//     const leftIconOpacity = useTransform(x, [-150, -30], [1, 0])
//     const rightIconOpacity = useTransform(x, [30, 150], [1, 0])
//     const leftIconScale = useTransform(x, [-150, -30], [1, 0.5])
//     const rightIconScale = useTransform(x, [30, 150], [1, 0.5])

//     useEffect(() => {
//         setIsAnswered(false)
//         setLrAnswer(0)
//         x.set(0)
//         setDragProgress(0)
//     }, [question, setLrAnswer, x])

//     const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
//         if (isAnswered) return
        
//         const swipe = info.offset.x
//         const velocity = info.velocity.x
        
//         if (Math.abs(swipe) > 70 || Math.abs(velocity) > 500) {
//             const isRightSwipe = swipe > 0 || velocity > 0
//             const targetX = isRightSwipe ? 500 : -500
//             x.set(targetX)
            
//             const isCorrect = isRightSwipe 
//                 ? question.correctAnswer === question.options[0]
//                 : question.correctAnswer !== question.options[0]
            
//             setIsAnswered(true)
            
//             setTimeout(() => {
//                 onAnswer(isCorrect ? 'right' : 'wrong')
//                 x.set(0)
//             }, 300)
//         } else {
//             x.set(0)
//         }
        
//         setIsDragging(false)
//     }

//     const handleDragStart = () => {
//         if (!isAnswered) {
//             setIsDragging(true)
//         }
//     }

//     const leftOption = question.options[1] || question.options[0]
//     const rightOption = question.options[0]

//     return (
//         <div className="relative w-full max-w-xl mx-auto" ref={constraintsRef}>
//             {/* Фоновые индикаторы направления в стиле Duolingo */}
//             <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4 z-0">
//                 <motion.div 
//                     style={{ 
//                         opacity: leftIconOpacity, 
//                         x: leftIconX,
//                         scale: leftIconScale
//                     }}
//                     className="flex flex-col items-center gap-3 bg-red-500 rounded-2xl py-4 px-6 shadow-lg"
//                 >
//                     <div className="bg-[#151F23] rounded-full p-2">
//                         <X className="w-8 h-8 text-red-500" strokeWidth={3} />
//                     </div>
//                     <span className="text-sm font-bold text-white">{leftOption}</span>
//                 </motion.div>
                
//                 <motion.div 
//                     style={{ 
//                         opacity: rightIconOpacity, 
//                         x: rightIconX,
//                         scale: rightIconScale
//                     }}
//                     className="flex flex-col items-center gap-3 bg-green-500 rounded-2xl py-4 px-6 shadow-lg"
//                 >
//                     <div className="bg-[#151F23] rounded-full p-2">
//                         <Check className="w-8 h-8 text-green-500" strokeWidth={3} />
//                     </div>
//                     <span className="text-sm font-bold text-white">{rightOption}</span>
//                 </motion.div>
//             </div>

//             {/* Drag карточка в стиле Duolingo */}
//             <motion.div
//                 style={{
//                     x,
//                     rotate,
//                     scale,
//                     backgroundColor,
//                     cursor: isDragging ? 'grabbing' : 'grab'
//                 }}
//                 drag="x"
//                 dragConstraints={constraintsRef}
//                 dragElastic={0.4}
//                 dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
//                 onDragStart={handleDragStart}
//                 onDragEnd={handleDragEnd}
//                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
//                 className={`
//                     relative z-10
//                     rounded-2xl shadow-xl
//                     min-h-[320px] w-full
//                     cursor-grab active:cursor-grabbing
//                     border-2 border-[#3A464E]
//                 `}
//             >
//                 {/* Контент карточки */}
//                 <div className="flex flex-col items-center justify-center min-h-[320px] p-8">
//                     {/* Эмодзи или иконка сверху */}
//                     <div className="mb-4 text-5xl">
//                         🤔
//                     </div>
                    
//                     <div className="text-center mb-6">
//                         <div className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wide">
//                             Свайпни влево или вправо
//                         </div>
//                         <div className="text-xl md:text-2xl font-bold text-[#F2F7FB]">
//                             <Latex>{question.question}</Latex>
//                         </div>
//                     </div>

//                     {/* Индикаторы направления */}
//                     <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
//                         <div className="flex items-center gap-2 bg-[#232F34] rounded-full px-4 py-2">
//                             <ChevronLeft className="w-4 h-4 text-red-500" strokeWidth={3} />
//                             <span className="font-medium text-[#9AA7B0]">
//                                 <Latex>{leftOption}</Latex>
//                             </span>
//                         </div>
//                         <div className="w-2 h-2 bg-gray-300 rounded-full" />
//                         <div className="flex items-center gap-2 bg-[#232F34] rounded-full px-4 py-2">
//                             <span className="font-medium text-[#9AA7B0]">
//                                 <Latex>{rightOption}</Latex>
//                             </span>
//                             <ChevronRight className="w-4 h-4 text-green-500" strokeWidth={3} />
//                         </div>
//                     </div>

//                     {/* Анимированные иконки на карточке при свайпе */}
//                     <motion.div 
//                         className="absolute inset-0 flex items-center justify-between pointer-events-none px-8"
//                         style={{ opacity: useTransform(x, [0, 40], [0, 1]) }}
//                     >
//                         <motion.div 
//                             style={{ opacity: useTransform(x, [0, 40], [0, 1]) }}
//                             className="bg-green-500 rounded-full p-3 shadow-lg"
//                         >
//                             <Check className="w-10 h-10 text-white" strokeWidth={3} />
//                         </motion.div>
                        
//                         <motion.div 
//                             style={{ opacity: useTransform(x, [-40, 0], [1, 0]) }}
//                             className="bg-red-500 rounded-full p-3 shadow-lg"
//                         >
//                             <X className="w-10 h-10 text-white" strokeWidth={3} />
//                         </motion.div>
//                     </motion.div>

//                     {/* Подсказка для свайпа */}
//                     <motion.div 
//                         className="absolute bottom-4 left-0 right-0 text-center"
//                         animate={{ opacity: isDragging ? 0 : 0.5 }}
//                         transition={{ duration: 0.2 }}
//                     >
//                         <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
//                             <ArrowRight className="w-3 h-3" />
//                             <span>потяни в сторону</span>
//                             <ArrowRight className="w-3 h-3" />
//                         </div>
//                     </motion.div>
//                 </div>
//             </motion.div>

//             {/* Индикатор прогресса свайпа в стиле Duolingo */}
//             <motion.div 
//                 className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2 z-10"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: isDragging ? 1 : 0, y: isDragging ? 0 : 10 }}
//                 transition={{ duration: 0.2 }}
//             >
//                 {[...Array(5)].map((_, i) => {
//                     // Вычисляем положение точки на шкале от -1 до 1
//                     const pointPosition = (i / 4) * 2 - 1
//                     const isActive = Math.abs(dragProgress - pointPosition) < 0.2
                    
//                     return (
//                         <motion.div
//                             key={i}
//                             className="rounded-full"
//                             animate={{
//                                 scale: isActive ? 1.3 : 0.7,
//                                 width: isActive ? 10 : 6,
//                                 height: isActive ? 10 : 6,
//                                 backgroundColor: isActive 
//                                     ? dragProgress > 0 ? "#58cc71" : "#ff4b4b"
//                                     : "#e5e7eb"
//                             }}
//                             transition={{
//                                 type: "spring",
//                                 stiffness: 500,
//                                 damping: 30
//                             }}
//                         />
//                     )
//                 })}
//             </motion.div>

//             {/* Эффект "свечения" при полном свайпе */}
//             <motion.div 
//                 className="absolute inset-0 pointer-events-none rounded-2xl"
//                 style={{
//                     opacity: useTransform(x, [80, 100], [0, 0.15]),
//                     background: useTransform(
//                         x,
//                         [80, 100],
//                         ['radial-gradient(circle, rgba(88,204,113,0) 0%, rgba(88,204,113,0) 100%)',
//                          'radial-gradient(circle, rgba(88,204,113,0.3) 0%, rgba(88,204,113,0) 100%)']
//                     )
//                 }}
//             />
//             <motion.div 
//                 className="absolute inset-0 pointer-events-none rounded-2xl"
//                 style={{
//                     opacity: useTransform(x, [-100, -80], [0.15, 0]),
//                     background: useTransform(
//                         x,
//                         [-100, -80],
//                         ['radial-gradient(circle, rgba(255,75,75,0.3) 0%, rgba(255,75,75,0) 100%)',
//                          'radial-gradient(circle, rgba(255,75,75,0) 0%, rgba(255,75,75,0) 100%)']
//                     )
//                 }}
//             />
//         </div>
//     )
// }









// "use client"

// import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent } from "framer-motion"
// import { useEffect, useState, useRef } from "react"
// import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
// import { QuestionType } from "./page"
// import Latex from 'react-latex-next'
// import 'katex/dist/katex.min.css';

// type Props = {
//     onAnswer: (answer: string) => void
//     question: QuestionType
//     setLrAnswer: (lrAnswer: number) => void
// }

// export default function SwipeCard({ onAnswer, question, setLrAnswer }: Props) {
//     const x = useMotionValue(0)
//     const [isAnswered, setIsAnswered] = useState(false)
//     const [isDragging, setIsDragging] = useState(false)
//     const [dragProgress, setDragProgress] = useState(0)
//     const constraintsRef = useRef<HTMLDivElement>(null)

//     // Следим за прогрессом свайпа
//     useMotionValueEvent(x, "change", (latest) => {
//         const normalized = Math.max(-1, Math.min(1, latest / 100))
//         setDragProgress(normalized)
//     })

//     // Прозрачность и фон
//     const opacity = useTransform(x, [-150, -50, 0, 50, 150], [0.95, 0.5, 1, 0.5, 0.95])
//     const rotate = useTransform(x, [-150, 0, 150], [-10, 0, 10])
//     const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95])
    
//     // Цвет фона при свайпе
//     const backgroundColor = useTransform(
//         x,
//         [-150, -50, 0, 50, 150],
//         ['#ef4444', '#fef2f2', '#ffffff', '#f0fdf4', '#22c55e']
//     )

//     // Цвета для индикаторов
//     const leftColor = useTransform(x, [-150, -30], ['#ef4444', '#fcd34d'])
//     const rightColor = useTransform(x, [30, 150], ['#fcd34d', '#22c55e'])

//     // Позиция иконок
//     const leftIconX = useTransform(x, [-150, -30], [0, -50])
//     const rightIconX = useTransform(x, [30, 150], [0, 50])
//     const leftIconOpacity = useTransform(x, [-150, -30], [1, 0])
//     const rightIconOpacity = useTransform(x, [30, 150], [1, 0])

//     useEffect(() => {
//         setIsAnswered(false)
//         setLrAnswer(0)
//         x.set(0)
//         setDragProgress(0)
//     }, [question, setLrAnswer, x])

//     const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
//         if (isAnswered) return
        
//         const swipe = info.offset.x
//         const velocity = info.velocity.x
        
//         if (Math.abs(swipe) > 80 || Math.abs(velocity) > 500) {
//             const isRightSwipe = swipe > 0 || velocity > 0
//             const targetX = isRightSwipe ? 500 : -500
//             x.set(targetX)
            
//             const isCorrect = isRightSwipe 
//                 ? question.correctAnswer === question.options[0]
//                 : question.correctAnswer !== question.options[0]
            
//             setIsAnswered(true)
            
//             setTimeout(() => {
//                 onAnswer(isCorrect ? 'right' : 'wrong')
//                 x.set(0)
//             }, 300)
//         } else {
//             x.set(0)
//         }
        
//         setIsDragging(false)
//     }

//     const handleDragStart = () => {
//         if (!isAnswered) {
//             setIsDragging(true)
//         }
//     }

//     const leftOption = question.options[1] || question.options[0]
//     const rightOption = question.options[0]

//     return (
//         <div className="relative w-full max-w-xl mx-auto" ref={constraintsRef}>
//             {/* Фоновые индикаторы направления */}
//             <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4 z-0">
//                 <motion.div 
//                     style={{ opacity: leftIconOpacity, x: leftIconX, color: leftColor }}
//                     className="flex flex-col items-center gap-2 bg-red-500/10 backdrop-blur-sm rounded-2xl py-3 px-6"
//                 >
//                     <X className="w-12 h-12" strokeWidth={2.5} />
//                     <span className="text-sm font-bold text-red-500">{leftOption}</span>
//                 </motion.div>
                
//                 <motion.div 
//                     style={{ opacity: rightIconOpacity, x: rightIconX, color: rightColor }}
//                     className="flex flex-col items-center gap-2 bg-green-500/10 backdrop-blur-sm rounded-2xl py-3 px-6"
//                 >
//                     <Check className="w-12 h-12" strokeWidth={2.5} />
//                     <span className="text-sm font-bold text-green-500">{rightOption}</span>
//                 </motion.div>
//             </div>

//             {/* Drag карточка */}
//             <motion.div
//                 style={{
//                     x,
//                     opacity,
//                     rotate,
//                     scale,
//                     backgroundColor,
//                     cursor: isDragging ? 'grabbing' : 'grab'
//                 }}
//                 drag="x"
//                 dragConstraints={constraintsRef}
//                 dragElastic={0.3}
//                 dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
//                 onDragStart={handleDragStart}
//                 onDragEnd={handleDragEnd}
//                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
//                 className={`
//                     relative z-10
//                     rounded-2xl shadow-2xl
//                     min-h-[280px] w-full
//                     cursor-grab active:cursor-grabbing
//                     transition-shadow duration-300
//                     hover:shadow-3xl
//                 `}
//             >
//                 {/* Контент карточки */}
//                 <div className="flex flex-col items-center justify-center min-h-[280px] p-8">
//                     <div className="text-center mb-6">
//                         <div className="text-sm text-gray-400 mb-2 font-medium">
//                             Свайпните влево или вправо
//                         </div>
//                         <div className="text-xl md:text-2xl font-bold text-[#F2F7FB]">
//                             <Latex>{question.question}</Latex>
//                         </div>
//                     </div>

//                     <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
//                         <div className="flex items-center gap-1">
//                             <ChevronLeft className="w-4 h-4" />
//                             <span>
//                                 <Latex>
//                                     {leftOption}
//                                 </Latex>                                
//                             </span>
//                         </div>
//                         <div className="w-1 h-1 bg-gray-300 rounded-full" />
//                         <div className="flex items-center gap-1">
//                             <span>
//                                 <Latex>
//                                     {rightOption}
//                                 </Latex>                                
//                             </span>
//                             <ChevronRight className="w-4 h-4" />
//                         </div>
//                     </div>

//                     {/* Анимированные иконки на карточке */}
//                     <motion.div 
//                         className="absolute inset-0 flex items-center justify-between pointer-events-none px-6"
//                         style={{ opacity: useTransform(x, [0, 50], [0, 1]) }}
//                     >
//                         <motion.div style={{ opacity: useTransform(x, [0, 50], [0, 1]) }}>
//                             <div className="bg-green-500 rounded-full p-3">
//                                 <Check className="w-8 h-8 text-white" />
//                             </div>
//                         </motion.div>
                        
//                         <motion.div style={{ opacity: useTransform(x, [-50, 0], [1, 0]) }}>
//                             <div className="bg-red-500 rounded-full p-3">
//                                 <X className="w-8 h-8 text-white" />
//                             </div>
//                         </motion.div>
//                     </motion.div>
//                 </div>
//             </motion.div>

//             {/* Индикатор прогресса свайпа - исправленная версия */}
//             <motion.div 
//                 className="absolute -bottom-8 left-0 right-0 flex justify-center gap-1.5 z-10"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: isDragging ? 1 : 0 }}
//                 transition={{ duration: 0.2 }}
//             >
//                 {[...Array(8)].map((_, i) => {
//                     // Вычисляем положение точки на шкале от -1 до 1
//                     const pointPosition = (i / 7) * 2 - 1
//                     // Проверяем, находится ли прогресс рядом с точкой
//                     const isActive = Math.abs(dragProgress - pointPosition) < 0.15
                    
//                     return (
//                         <motion.div
//                             key={i}
//                             className="rounded-full"
//                             animate={{
//                                 scale: isActive ? 1.2 : 0.6,
//                                 width: isActive ? 12 : 6,
//                                 height: isActive ? 12 : 6,
//                                 backgroundColor: isActive ? "#22c55e" : "#9ca3af"
//                             }}
//                             transition={{
//                                 type: "spring",
//                                 stiffness: 500,
//                                 damping: 30
//                             }}
//                         />
//                     )
//                 })}
//             </motion.div>
//         </div>
//     )
// }





// "use client"
// // import { motion } from "framer-motion";
// import { motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
// import { useEffect, useRef, useState } from "react";
// import { QuestionType } from "./page";
// // import {react} from react


// type Props = {
//     onAnswer: (answer: string) => void
//     question: QuestionType
//     setLrAnswer: (lrAnswer: number) => void
// }

// // export default function UseTransform() {
// export default function UseTransform(
//     {
//      onAnswer,
//      question,
//      setLrAnswer,
//     } : Props
// ) {
//     const x = useMotionValue(0)
//     const xInput = [-100, 0, 100]



// const background = useTransform(x, xInput, [
//     "linear-gradient(180deg, #f97316 0%, #ef4444 100%)", // bg-rose-500
//     "linear-gradient(180deg, #0ea5e9 0%, #3b82f6 100%)", // bg-sky-300
//     "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)", // bg-green-500
// ])

// const color = useTransform(x, xInput, [
//     "#ef4444", // rose-500
//     "#0ea5e9", // sky-300
//     "#22c55e", // green-500
// ])


//     const tickPath = useTransform(x, [10, 100], [0, 1])
//     const crossPathA = useTransform(x, [-10, -55], [0, 1])
//     const crossPathB = useTransform(x, [-50, -100], [0, 1])

//     // const answeredRef = useRef(false)

//     const [isAnswered, setIsAnswered] = useState(false)

//     useEffect(() => {
//         setIsAnswered(false)
//         setLrAnswer(0)
//     }, [question, setLrAnswer]) // или другой триггер

//     useMotionValueEvent(x, "change", (latest) => 
//     {
//         // console.log('.... ' && isAnswered)

//         if (isAnswered) return 

//         if (latest >= 100) {
//             console.log('Right')
//             // answeredRef.current = true
//             setIsAnswered(true)
//             if (question.correctAnswer == question.options[0]) {
//                 onAnswer('right')
//             } else {
//                 onAnswer('wrong')
//             }
//         } else if (latest <= -100) {
//             console.log('Left')
//             // answeredRef.current = true
//             setIsAnswered(true)
//             if (question.correctAnswer != question.options[0]) {
//                 onAnswer('right')
//             } else {
//                 onAnswer('wrong')
//             }
//         }
//     })


//     return (
//         <div>
//             <motion.div style={{ ...container, background }}>
//                 <motion.div
//                     className="icon-container"
//                     style={{ ...box, x }}
//                     drag="x"
//                     dragConstraints={{ left: 0, right: 0 }}
//                     dragElastic={0.5}
//                 >
//                     <svg className="progress-icon" viewBox="0 0 50 50">
//                         <motion.path
//                             fill="none"
//                             strokeWidth="2"
//                             stroke={color}
//                             d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
//                             style={{
//                                 x: 5,
//                                 y: 5,
//                             }}
//                         />
//                         <motion.path
//                             id="tick"
//                             fill="none"
//                             strokeWidth="2"
//                             stroke={color}
//                             d="M14,26 L 22,33 L 35,16"
//                             strokeDasharray="0 1"
//                             style={{ pathLength: tickPath }}
//                         />
//                         <motion.path
//                             fill="none"
//                             strokeWidth="2"
//                             stroke={color}
//                             d="M17,17 L33,33"
//                             strokeDasharray="0 1"
//                             style={{ pathLength: crossPathA }}
//                         />
//                         <motion.path
//                             id="cross"
//                             fill="none"
//                             strokeWidth="2"
//                             stroke={color}
//                             d="M33,17 L17,33"
//                             strokeDasharray="0 1"
//                             style={{ pathLength: crossPathB }}
//                         />
//                     </svg>
//                 </motion.div>
//             </motion.div>
//         </div>
//     )
// }

// /**
//  * ==============   Styles   ================
//  */

// const box = {
//     //140x140
//     width: 100,
//     height: 100,
//     backgroundColor: "#f5f5f5",
//     borderRadius: 20,
//     padding: 20,
// }

// const container: React.CSSProperties = {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     flex: 1,
//     width: 500,
//     //500x300
//     height: 200,
//     maxWidth: "100%",
//     borderRadius: 20,
// }
