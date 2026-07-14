'use client'

import React, { useEffect, useState } from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ArrowRight } from 'lucide-react'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeConnect = ({ question, onAnswer }: Props) => {
    const [selectedOptionAId, setSelectedOptionAId] = useState<number>()
    const [selectedOptionQId, setSelectedOptionQId] = useState<number>()
    const [selectedOptionAPair, setSelectedOptionAPair] = useState<number>()
    const [selectedOptionQPair, setSelectedOptionQPair] = useState<number>()
    const [listOptionsIdDoneRight, setListOptionsIdDoneRight] = useState<number[]>([])
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)

    // Правильное количество пар - это длина optionsQ (или optionsA)
    const totalPairs = question.optionsQ.length
    const completedPairs = listOptionsIdDoneRight.length / 2

    useEffect(() => {
        // Проверяем, собрали ли все пары
        if (completedPairs === totalPairs && totalPairs > 0) {
            setShowSuccess(true)
            setTimeout(() => {
                setListOptionsIdDoneRight([])
                setShowSuccess(false)
                onAnswer("right")
            }, 500)
        }
    }, [completedPairs, totalPairs, onAnswer])

    useEffect(() => {
        if (selectedOptionAId && selectedOptionQId && selectedOptionAId > 0 && selectedOptionQId > 0) {
            if (selectedOptionAPair === selectedOptionQPair) {
                // Правильный ответ
                const newList = [...listOptionsIdDoneRight, selectedOptionAId, selectedOptionQId]
                setListOptionsIdDoneRight(newList)
                
                // Анимация успеха
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 300)
            } else {
                // Неправильный ответ
                setShowError(true)
                setTimeout(() => setShowError(false), 500)
                
                setListOptionsIdDoneRight([])
                onAnswer("wrong")
            }

            // Сброс выбранных опций
            setSelectedOptionAId(-1)
            setSelectedOptionQId(-2)
            setSelectedOptionAPair(-3)
            setSelectedOptionQPair(-4)
        }
    }, [selectedOptionAId, selectedOptionQId, selectedOptionAPair, selectedOptionQPair, listOptionsIdDoneRight, onAnswer])

    const handleOptionQClick = (id: number, pair: number) => {
        if (listOptionsIdDoneRight.includes(id)) return
        setSelectedOptionQId(id)
        setSelectedOptionQPair(pair)
    }

    const handleOptionAClick = (id: number, pair: number) => {
        if (listOptionsIdDoneRight.includes(id)) return
        setSelectedOptionAId(id)
        setSelectedOptionAPair(pair)
    }

    const isOptionMatched = (id: number) => listOptionsIdDoneRight.includes(id)

    return (
        <>
            {/* Эффекты успеха/ошибки */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-green-500 rounded-full p-4 shadow-2xl">
                            <Check className="w-16 h-16 text-white" />
                        </div>
                    </motion.div>
                )}

                {showError && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -50 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            x: [-10, 10, -10, 10, 0]
                        }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        transition={{ x: { duration: 0.2 } }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-red-500 rounded-full p-4 shadow-2xl">
                            <X className="w-16 h-16 text-white" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative w-full max-w-4xl mx-auto p-4">
                {/* Прогресс-бар в стиле Duolingo */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-500">ПРОГРЕСС</span>
                        <span className="text-sm font-bold text-green-500">
                            {completedPairs} / {totalPairs}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-green-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedPairs / totalPairs) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-6">
                    {/* Левая колонка - Вопросы */}
                    <motion.div 
                        className="col-span-3 space-y-3"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                            <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Термины</h3>
                            <div className="space-y-3">
                                {question.optionsQ.map((option, index) => (
                                    <motion.button
                                        key={option.id}
                                        onClick={() => handleOptionQClick(option.id, option.pairId)}
                                        disabled={isOptionMatched(option.id)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: isOptionMatched(option.id) ? 1 : 1.02, y: isOptionMatched(option.id) ? 0 : -2 }}
                                        whileTap={{ scale: isOptionMatched(option.id) ? 1 : 0.98 }}
                                        className={`
                                            relative overflow-hidden w-full text-left
                                            transition-all duration-200 rounded-xl
                                            font-bold
                                            ${selectedOptionQId === option.id
                                                ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-600'
                                                : isOptionMatched(option.id)
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white border-2 border-gray-300 hover:border-green-400 hover:shadow-md text-gray-700'
                                            }
                                            ${isOptionMatched(option.id) ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className="py-4 px-6 pr-12">
                                            <Latex>{option.optQ}</Latex>
                                        </div>
                                        {/* Галочка справа */}
                                        {isOptionMatched(option.id) && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                            >
                                                <div className="bg-white rounded-full p-1">
                                                    <Check className="w-5 h-5 text-green-500" strokeWidth={3} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Центральная стрелка */}
                    <motion.div 
                        className="col-span-1 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                    >
                        <div className="bg-orange-500 rounded-full p-3 shadow-lg">
                            <ArrowRight className="w-8 h-8 text-white md:w-10 md:h-10" strokeWidth={3} />
                        </div>
                    </motion.div>

                    {/* Правая колонка - Ответы */}
                    <motion.div 
                        className="col-span-3 space-y-3"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                            <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Определения</h3>
                            <div className="space-y-3">
                                {question.optionsA.map((option, index) => (
                                    <motion.button
                                        key={option.id}
                                        onClick={() => handleOptionAClick(option.id, option.pairId)}
                                        disabled={isOptionMatched(option.id)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 + 0.1 }}
                                        whileHover={{ scale: isOptionMatched(option.id) ? 1 : 1.02, y: isOptionMatched(option.id) ? 0 : -2 }}
                                        whileTap={{ scale: isOptionMatched(option.id) ? 1 : 0.98 }}
                                        className={`
                                            relative overflow-hidden w-full text-left
                                            transition-all duration-200 rounded-xl
                                            font-bold
                                            ${selectedOptionAId === option.id
                                                ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-600'
                                                : isOptionMatched(option.id)
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white border-2 border-gray-300 hover:border-green-400 hover:shadow-md text-gray-700'
                                            }
                                            ${isOptionMatched(option.id) ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className="py-4 px-6 pr-12">
                                            <Latex>{option.optA}</Latex>
                                        </div>
                                        {/* Галочка справа */}
                                        {isOptionMatched(option.id) && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                            >
                                                <div className="bg-white rounded-full p-1">
                                                    <Check className="w-5 h-5 text-green-500" strokeWidth={3} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Анимированная подсветка при успехе */}
                {completedPairs > 0 && completedPairs < totalPairs && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.05, 0] }}
                        transition={{ duration: 0.5 }}
                        style={{
                            background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0) 100%)"
                        }}
                    />
                )}
            </div>
        </>
    )
}







// 'use client'

// import React, { useEffect, useState } from 'react'
// import { QuestionType } from './page'
// import Latex from 'react-latex-next';
// import 'katex/dist/katex.min.css';
// import { motion, AnimatePresence } from 'framer-motion'
// import { Check, X, ArrowRight } from 'lucide-react'

// type Props = {
//     question: QuestionType
//     onAnswer: (answer: string) => void
// }

// export const TypeConnect = ({ question, onAnswer }: Props) => {
//     const [selectedOptionAId, setSelectedOptionAId] = useState<number>()
//     const [selectedOptionQId, setSelectedOptionQId] = useState<number>()
//     const [selectedOptionAPair, setSelectedOptionAPair] = useState<number>()
//     const [selectedOptionQPair, setSelectedOptionQPair] = useState<number>()
//     const [listOptionsIdDoneRight, setListOptionsIdDoneRight] = useState<number[]>([])
//     const [showSuccess, setShowSuccess] = useState(false)
//     const [showError, setShowError] = useState(false)

//     useEffect(() => {
//         if (listOptionsIdDoneRight.length === 6) {
//             setShowSuccess(true)
//             setTimeout(() => {
//                 setListOptionsIdDoneRight([])
//                 setShowSuccess(false)
//                 onAnswer("right")
//             }, 500)
//         }
//     }, [listOptionsIdDoneRight, onAnswer])

//     useEffect(() => {
//         if (selectedOptionAId && selectedOptionQId && selectedOptionAId > 0 && selectedOptionQId > 0) {
//             if (selectedOptionAPair === selectedOptionQPair) {
//                 // Правильный ответ
//                 const newList = [...listOptionsIdDoneRight, selectedOptionAId, selectedOptionQId]
//                 setListOptionsIdDoneRight(newList)
                
//                 // Анимация успеха
//                 setShowSuccess(true)
//                 setTimeout(() => setShowSuccess(false), 300)
//             } else {
//                 // Неправильный ответ
//                 setShowError(true)
//                 setTimeout(() => setShowError(false), 500)
                
//                 setListOptionsIdDoneRight([])
//                 onAnswer("wrong")
//             }

//             // Сброс выбранных опций
//             setSelectedOptionAId(-1)
//             setSelectedOptionQId(-2)
//             setSelectedOptionAPair(-3)
//             setSelectedOptionQPair(-4)
//         }
//     }, [selectedOptionAId, selectedOptionQId, selectedOptionAPair, selectedOptionQPair, listOptionsIdDoneRight, onAnswer])

//     const handleOptionQClick = (id: number, pair: number) => {
//         if (listOptionsIdDoneRight.includes(id)) return
//         setSelectedOptionQId(id)
//         setSelectedOptionQPair(pair)
//     }

//     const handleOptionAClick = (id: number, pair: number) => {
//         if (listOptionsIdDoneRight.includes(id)) return
//         setSelectedOptionAId(id)
//         setSelectedOptionAPair(pair)
//     }

//     const isOptionMatched = (id: number) => listOptionsIdDoneRight.includes(id)

//     return (
//         <>
//             {/* Эффекты успеха/ошибки */}
//             <AnimatePresence>
//                 {showSuccess && (
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.5, y: -50 }}
//                         animate={{ opacity: 1, scale: 1, y: 0 }}
//                         exit={{ opacity: 0, scale: 0.5, y: -50 }}
//                         className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
//                     >
//                         <div className="bg-green-500 rounded-full p-4 shadow-2xl">
//                             <Check className="w-16 h-16 text-white" />
//                         </div>
//                     </motion.div>
//                 )}

//                 {showError && (
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.5, y: -50 }}
//                         animate={{ 
//                             opacity: 1, 
//                             scale: 1, 
//                             y: 0,
//                             x: [-10, 10, -10, 10, 0]
//                         }}
//                         exit={{ opacity: 0, scale: 0.5, y: -50 }}
//                         transition={{ x: { duration: 0.2 } }}
//                         className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
//                     >
//                         <div className="bg-red-500 rounded-full p-4 shadow-2xl">
//                             <X className="w-16 h-16 text-white" />
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>

//             <div className="relative w-full max-w-4xl mx-auto p-4">
//                 {/* Прогресс-бар */}
//                 <div className="mb-8">
//                     <div className="flex justify-between items-center mb-2">
//                         <span className="text-sm font-medium text-gray-600">Прогресс соединения</span>
//                         <span className="text-sm font-bold text-green-600">
//                             {listOptionsIdDoneRight.length / 2} / 6
//                         </span>
//                     </div>
//                     <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                         <motion.div
//                             className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
//                             initial={{ width: 0 }}
//                             animate={{ width: `${(listOptionsIdDoneRight.length / 12) * 100}%` }}
//                             transition={{ duration: 0.3 }}
//                         />
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-6">
//                     {/* Левая колонка - Вопросы */}
//                     <motion.div 
//                         className="col-span-3 space-y-3"
//                         initial={{ opacity: 0, x: -30 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ duration: 0.3 }}
//                     >
//                         <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 shadow-lg">
//                             <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Термины</h3>
//                             <div className="space-y-3">
//                                 {question.optionsQ.map((option, index) => (
//                                     <motion.button
//                                         key={option.id}
//                                         onClick={() => handleOptionQClick(option.id, option.pairId)}
//                                         disabled={isOptionMatched(option.id)}
//                                         initial={{ opacity: 0, y: 20 }}
//                                         animate={{ opacity: 1, y: 0 }}
//                                         transition={{ delay: index * 0.05 }}
//                                         whileHover={{ scale: isOptionMatched(option.id) ? 1 : 1.02, y: isOptionMatched(option.id) ? 0 : -2 }}
//                                         whileTap={{ scale: isOptionMatched(option.id) ? 1 : 0.98 }}
//                                         className={`
//                                             relative overflow-hidden w-full text-left
//                                             transition-all duration-300 rounded-xl
//                                             ${selectedOptionQId === option.id
//                                                 ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-200 border-2 border-cyan-300'
//                                                 : isOptionMatched(option.id)
//                                                     ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg text-white'
//                                                     : 'bg-white border-2 border-gray-200 hover:border-green-300 hover:shadow-lg text-gray-700'
//                                             }
//                                             ${isOptionMatched(option.id) ? 'cursor-not-allowed' : 'cursor-pointer'}
//                                         `}
//                                     >
//                                         <div className="py-4 px-6 pr-12">
//                                             <Latex>{option.optQ}</Latex>
//                                         </div>
//                                         {/* Галочка справа */}
//                                         {isOptionMatched(option.id) && (
//                                             <motion.div
//                                                 initial={{ scale: 0, rotate: -180 }}
//                                                 animate={{ scale: 1, rotate: 0 }}
//                                                 transition={{ type: "spring", stiffness: 300, damping: 15 }}
//                                                 className="absolute right-3 top-1/2 transform -translate-y-1/2"
//                                             >
//                                                 <div className="bg-white rounded-full p-1">
//                                                     <Check className="w-5 h-5 text-green-500" />
//                                                 </div>
//                                             </motion.div>
//                                         )}
//                                         {/* Shimmer эффект при выборе */}
//                                         {selectedOptionQId === option.id && (
//                                             <motion.div
//                                                 className="absolute inset-0 bg-white/20"
//                                                 initial={{ x: "-100%" }}
//                                                 animate={{ x: "100%" }}
//                                                 transition={{ duration: 0.5, repeat: Infinity }}
//                                             />
//                                         )}
//                                     </motion.button>
//                                 ))}
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* Центральная стрелка */}
//                     <motion.div 
//                         className="col-span-1 flex items-center justify-center"
//                         initial={{ opacity: 0, scale: 0 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ delay: 0.2, type: "spring" }}
//                     >
//                         <div className="relative">
//                             <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
//                             <div className="relative bg-white rounded-full p-3 shadow-xl">
//                                 <ArrowRight className="w-8 h-8 text-blue-500 md:w-12 md:h-12" />
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* Правая колонка - Ответы */}
//                     <motion.div 
//                         className="col-span-3 space-y-3"
//                         initial={{ opacity: 0, x: 30 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ duration: 0.3 }}
//                     >
//                         <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-4 shadow-lg">
//                             <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Определения</h3>
//                             <div className="space-y-3">
//                                 {question.optionsA.map((option, index) => (
//                                     <motion.button
//                                         key={option.id}
//                                         onClick={() => handleOptionAClick(option.id, option.pairId)}
//                                         disabled={isOptionMatched(option.id)}
//                                         initial={{ opacity: 0, y: 20 }}
//                                         animate={{ opacity: 1, y: 0 }}
//                                         transition={{ delay: index * 0.05 + 0.1 }}
//                                         whileHover={{ scale: isOptionMatched(option.id) ? 1 : 1.02, y: isOptionMatched(option.id) ? 0 : -2 }}
//                                         whileTap={{ scale: isOptionMatched(option.id) ? 1 : 0.98 }}
//                                         className={`
//                                             relative overflow-hidden w-full text-left
//                                             transition-all duration-300 rounded-xl
//                                             ${selectedOptionAId === option.id
//                                                 ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-200 border-2 border-cyan-300'
//                                                 : isOptionMatched(option.id)
//                                                     ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg text-white'
//                                                     : 'bg-white border-2 border-gray-200 hover:border-green-300 hover:shadow-lg text-gray-700'
//                                             }
//                                             ${isOptionMatched(option.id) ? 'cursor-not-allowed' : 'cursor-pointer'}
//                                         `}
//                                     >
//                                         <div className="py-4 px-6 pr-12">
//                                             <Latex>{option.optA}</Latex>
//                                         </div>
//                                         {/* Галочка справа */}
//                                         {isOptionMatched(option.id) && (
//                                             <motion.div
//                                                 initial={{ scale: 0, rotate: -180 }}
//                                                 animate={{ scale: 1, rotate: 0 }}
//                                                 transition={{ type: "spring", stiffness: 300, damping: 15 }}
//                                                 className="absolute right-3 top-1/2 transform -translate-y-1/2"
//                                             >
//                                                 <div className="bg-white rounded-full p-1">
//                                                     <Check className="w-5 h-5 text-green-500" />
//                                                 </div>
//                                             </motion.div>
//                                         )}
//                                         {/* Shimmer эффект при выборе */}
//                                         {selectedOptionAId === option.id && (
//                                             <motion.div
//                                                 className="absolute inset-0 bg-white/20"
//                                                 initial={{ x: "-100%" }}
//                                                 animate={{ x: "100%" }}
//                                                 transition={{ duration: 0.5, repeat: Infinity }}
//                                             />
//                                         )}
//                                     </motion.button>
//                                 ))}
//                             </div>
//                         </div>
//                     </motion.div>
//                 </div>

//                 {/* Анимированная подсветка при успехе */}
//                 {listOptionsIdDoneRight.length > 0 && (
//                     <motion.div
//                         className="absolute inset-0 pointer-events-none rounded-2xl"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: [0, 0.1, 0] }}
//                         transition={{ duration: 0.5 }}
//                         style={{
//                             background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0) 100%)"
//                         }}
//                     />
//                 )}
//             </div>
//         </>
//     )
// }







// 'use client'

// import React, { useEffect, useState } from 'react'
// import { QuestionType } from './page'
// import Latex from 'react-latex-next';
// import 'katex/dist/katex.min.css';
// import Lottie from 'lottie-react';
// import LottieArrowRight from '@/public/Lottie/trainer/LottieArrowRight.json'
// import { motion, AnimatePresence } from 'framer-motion'
// import { Check, X, ArrowRight, Sparkles } from 'lucide-react'

// type Props = {
//     question: QuestionType
//     onAnswer: (answer: string) => void
// }

// export const TypeConnect = ({ question, onAnswer }: Props) => {
//     const [selectedOptionAId, setSelectedOptionAId] = useState<number>()
//     const [selectedOptionQId, setSelectedOptionQId] = useState<number>()
//     const [selectedOptionAPair, setSelectedOptionAPair] = useState<number>()
//     const [selectedOptionQPair, setSelectedOptionQPair] = useState<number>()
//     const [listOptionsIdDoneRight, setListOptionsIdDoneRight] = useState<number[]>([])
//     const [showSuccess, setShowSuccess] = useState(false)
//     const [showError, setShowError] = useState(false)

//     useEffect(() => {
//         if (listOptionsIdDoneRight.length === 6) {
//             setShowSuccess(true)
//             setTimeout(() => {
//                 setListOptionsIdDoneRight([])
//                 setShowSuccess(false)
//                 onAnswer("right")
//             }, 500)
//         }
//     }, [listOptionsIdDoneRight, onAnswer])

//     useEffect(() => {
//         if (selectedOptionAId && selectedOptionQId && selectedOptionAId > 0 && selectedOptionQId > 0) {
//             if (selectedOptionAPair === selectedOptionQPair) {
//                 // Правильный ответ
//                 const newList = [...listOptionsIdDoneRight, selectedOptionAId, selectedOptionQId]
//                 setListOptionsIdDoneRight(newList)
                
//                 // Анимация успеха
//                 setShowSuccess(true)
//                 setTimeout(() => setShowSuccess(false), 300)
//             } else {
//                 // Неправильный ответ
//                 setShowError(true)
//                 setTimeout(() => setShowError(false), 500)
                
//                 setListOptionsIdDoneRight([])
//                 onAnswer("wrong")
//             }

//             // Сброс выбранных опций
//             setSelectedOptionAId(-1)
//             setSelectedOptionQId(-2)
//             setSelectedOptionAPair(-3)
//             setSelectedOptionQPair(-4)
//         }
//     }, [selectedOptionAId, selectedOptionQId, selectedOptionAPair, selectedOptionQPair, listOptionsIdDoneRight, onAnswer])

//     const handleOptionQClick = (id: number, pair: number) => {
//         if (listOptionsIdDoneRight.includes(id)) return
//         setSelectedOptionQId(id)
//         setSelectedOptionQPair(pair)
//     }

//     const handleOptionAClick = (id: number, pair: number) => {
//         if (listOptionsIdDoneRight.includes(id)) return
//         setSelectedOptionAId(id)
//         setSelectedOptionAPair(pair)
//     }

//     const isOptionMatched = (id: number) => listOptionsIdDoneRight.includes(id)

//     return (
//         <>
//             {/* Эффекты успеха/ошибки */}
//             <AnimatePresence>
//                 {showSuccess && (
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.5, y: -50 }}
//                         animate={{ opacity: 1, scale: 1, y: 0 }}
//                         exit={{ opacity: 0, scale: 0.5, y: -50 }}
//                         className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
//                     >
//                         <div className="bg-green-500 rounded-full p-4 shadow-2xl">
//                             <Check className="w-16 h-16 text-white" />
//                         </div>
//                     </motion.div>
//                 )}

//                 {showError && (
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.5, y: -50 }}
//                         animate={{ 
//                             opacity: 1, 
//                             scale: 1, 
//                             y: 0,
//                             x: [-10, 10, -10, 10, 0]
//                         }}
//                         exit={{ opacity: 0, scale: 0.5, y: -50 }}
//                         transition={{ x: { duration: 0.2 } }}
//                         className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
//                     >
//                         <div className="bg-red-500 rounded-full p-4 shadow-2xl">
//                             <X className="w-16 h-16 text-white" />
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>

//             <div className="relative w-full max-w-4xl mx-auto p-4">
//                 {/* Прогресс-бар */}
//                 <div className="mb-8">
//                     <div className="flex justify-between items-center mb-2">
//                         <span className="text-sm font-medium text-gray-600">Прогресс соединения</span>
//                         <span className="text-sm font-bold text-green-600">
//                             {listOptionsIdDoneRight.length / 2} / 6
//                         </span>
//                     </div>
//                     <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                         <motion.div
//                             className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
//                             initial={{ width: 0 }}
//                             animate={{ width: `${(listOptionsIdDoneRight.length / 12) * 100}%` }}
//                             transition={{ duration: 0.3 }}
//                         />
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-6">
//                     {/* Левая колонка - Вопросы */}
//                     <motion.div 
//                         className="col-span-3 space-y-3"
//                         initial={{ opacity: 0, x: -30 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ duration: 0.3 }}
//                     >
//                         <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 shadow-lg">
//                             <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Термины</h3>
//                             <div className="space-y-3">
//                                 {question.optionsQ.map((option, index) => (
//                                     <motion.button
//                                         key={option.id}
//                                         onClick={() => handleOptionQClick(option.id, option.pairId)}
//                                         disabled={isOptionMatched(option.id)}
//                                         initial={{ opacity: 0, y: 20 }}
//                                         animate={{ opacity: 1, y: 0 }}
//                                         transition={{ delay: index * 0.05 }}
//                                         whileHover={{ scale: isOptionMatched(option.id) ? 1 : 1.02, y: isOptionMatched(option.id) ? 0 : -2 }}
//                                         whileTap={{ scale: isOptionMatched(option.id) ? 1 : 0.98 }}
//                                         className={`
//                                             relative overflow-hidden w-full text-left
//                                             transition-all duration-300 rounded-xl
//                                             ${selectedOptionQId === option.id
//                                                 ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-200 border-2 border-cyan-300'
//                                                 : isOptionMatched(option.id)
//                                                     ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg text-white'
//                                                     : 'bg-white border-2 border-gray-200 hover:border-green-300 hover:shadow-lg text-gray-700'
//                                             }
//                                             ${isOptionMatched(option.id) ? 'cursor-not-allowed' : 'cursor-pointer'}
//                                         `}
//                                     >
//                                         {isOptionMatched(option.id) && (
//                                             <motion.div
//                                                 initial={{ scale: 0 }}
//                                                 animate={{ scale: 1 }}
//                                                 className="absolute left-3 top-1/2 transform -translate-y-1/2"
//                                             >
//                                                 <Check className="w-5 h-5 text-white" />
//                                             </motion.div>
//                                         )}
//                                         <div className="py-4 px-6">
//                                             <Latex>{option.optQ}</Latex>
//                                         </div>
//                                         {selectedOptionQId === option.id && (
//                                             <motion.div
//                                                 className="absolute inset-0 bg-white/20"
//                                                 initial={{ x: "-100%" }}
//                                                 animate={{ x: "100%" }}
//                                                 transition={{ duration: 0.5, repeat: Infinity }}
//                                             />
//                                         )}
//                                     </motion.button>
//                                 ))}
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* Центральная стрелка */}
//                     <motion.div 
//                         className="col-span-1 flex items-center justify-center"
//                         initial={{ opacity: 0, scale: 0 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ delay: 0.2, type: "spring" }}
//                     >
//                         <div className="relative">
//                             <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
//                             <div className="relative bg-white rounded-full p-3 shadow-xl">
//                                 <ArrowRight className="w-8 h-8 text-blue-500 md:w-12 md:h-12" />
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* Правая колонка - Ответы */}
//                     <motion.div 
//                         className="col-span-3 space-y-3"
//                         initial={{ opacity: 0, x: 30 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ duration: 0.3 }}
//                     >
//                         <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-4 shadow-lg">
//                             <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Определения</h3>
//                             <div className="space-y-3">
//                                 {question.optionsA.map((option, index) => (
//                                     <motion.button
//                                         key={option.id}
//                                         onClick={() => handleOptionAClick(option.id, option.pairId)}
//                                         disabled={isOptionMatched(option.id)}
//                                         initial={{ opacity: 0, y: 20 }}
//                                         animate={{ opacity: 1, y: 0 }}
//                                         transition={{ delay: index * 0.05 + 0.1 }}
//                                         whileHover={{ scale: isOptionMatched(option.id) ? 1 : 1.02, y: isOptionMatched(option.id) ? 0 : -2 }}
//                                         whileTap={{ scale: isOptionMatched(option.id) ? 1 : 0.98 }}
//                                         className={`
//                                             relative overflow-hidden w-full text-left
//                                             transition-all duration-300 rounded-xl
//                                             ${selectedOptionAId === option.id
//                                                 ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-200 border-2 border-cyan-300'
//                                                 : isOptionMatched(option.id)
//                                                     ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg text-white'
//                                                     : 'bg-white border-2 border-gray-200 hover:border-green-300 hover:shadow-lg text-gray-700'
//                                             }
//                                             ${isOptionMatched(option.id) ? 'cursor-not-allowed' : 'cursor-pointer'}
//                                         `}
//                                     >
//                                         {isOptionMatched(option.id) && (
//                                             <motion.div
//                                                 initial={{ scale: 0 }}
//                                                 animate={{ scale: 1 }}
//                                                 className="absolute left-3 top-1/2 transform -translate-y-1/2"
//                                             >
//                                                 <Check className="w-5 h-5 text-white" />
//                                             </motion.div>
//                                         )}
//                                         <div className="py-4 px-6">
//                                             <Latex>{option.optA}</Latex>
//                                         </div>
//                                         {selectedOptionAId === option.id && (
//                                             <motion.div
//                                                 className="absolute inset-0 bg-white/20"
//                                                 initial={{ x: "-100%" }}
//                                                 animate={{ x: "100%" }}
//                                                 transition={{ duration: 0.5, repeat: Infinity }}
//                                             />
//                                         )}
//                                     </motion.button>
//                                 ))}
//                             </div>
//                         </div>
//                     </motion.div>
//                 </div>

//                 {/* Анимированная подсветка при успехе */}
//                 {listOptionsIdDoneRight.length > 0 && (
//                     <motion.div
//                         className="absolute inset-0 pointer-events-none rounded-2xl"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: [0, 0.1, 0] }}
//                         transition={{ duration: 0.5 }}
//                         style={{
//                             background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0) 100%)"
//                         }}
//                     />
//                 )}
//             </div>
//         </>
//     )
// }




// 'use client'

// import React, { useEffect, useState } from 'react'
// import { QuestionType } from './page'
// import Latex from 'react-latex-next';
// import 'katex/dist/katex.min.css';
// import Lottie from 'lottie-react';
// import LottieArrowRight from '@/public/Lottie/trainer/LottieArrowRight.json'
// import { useAudio } from 'react-use';


// type Props = {
//     question: QuestionType
//     onAnswer: (answer: string) => void
// }

// export const TypeConnect = ({
//     question,
//     onAnswer,
// }:Props) => {



//   const [audioCorrect, _, controlsCorrect] = useAudio({src: '/correct.wav'})
//   const [audioInCorrect, _c, controlsInCorrect] = useAudio({src: '/incorrect.wav'})




  
//   const [selectedOptionAId, setSelectedOptionAId] = useState<number>()
//   const [selectedOptionQId, setSelectedOptionQId] = useState<number>()

//   const [selectedOptionAPair, setSelectedOptionAPair] = useState<number>()
//   const [selectedOptionQPair, setSelectedOptionQPair] = useState<number>()

//   const [listOptionsIdDoneRight, setListOptionsIdDoneRight] = useState<number[]>([])


//   useEffect(()=>{
//     //
//     // ЕСЛИ СОБРАЛИ 6 ПРАВИЛЬНЫХ ОТВЕТОВ
//     //
//     if (listOptionsIdDoneRight.length == 6) {
//       setListOptionsIdDoneRight([])
//       onAnswer("right")
//     }
    
//   },[listOptionsIdDoneRight])
  
  

//   useEffect(() => {

//     if (selectedOptionAId && selectedOptionQId && selectedOptionAId > 0 && selectedOptionQId > 0)  {
//       //
//       // Если нажат ответ A и Q
//       //

//       if (selectedOptionAPair == selectedOptionQPair) {

//         // Если ответ правильный, Добавляем пару в Список, чтобы собрать 6 ответов
//         //
//         const newList = listOptionsIdDoneRight.concat(selectedOptionAId).concat(selectedOptionQId);
//         setListOptionsIdDoneRight(newList);

//         setSelectedOptionAId(-1)
//         setSelectedOptionQId(-2)
//         setSelectedOptionAPair(-3)
//         setSelectedOptionQPair(-4)

//         controlsCorrect.play()

//       }
//       else {

//         setSelectedOptionAId(-1)
//         setSelectedOptionQId(-2)
//         setSelectedOptionAPair(-3)
//         setSelectedOptionQPair(-4)

//         setListOptionsIdDoneRight([])

//         controlsInCorrect.play()
//         onAnswer("wrong")

//       }


//     } else {
//       //
//       // Если нажат только один ответ ИЛИ A или Q
//       //
//       // controlsAudioConstructAdd.play()

//       return
//     }

//   },[selectedOptionAId, selectedOptionQId])




//   const handleOptionQClick = (id: number, pair: number) => {

//     setSelectedOptionQId(id)
//     setSelectedOptionQPair(pair)
    
//   }


//   const handleOptionAClick = (id: number, pair: number) => {

//     setSelectedOptionAId(id)
//     setSelectedOptionAPair(pair)   

//   }


 



//   return (
    
//     <div className="grid grid-cols-7 gap-x-2 gap-y-2 mt-10">


//     <div className="grid col-span-3 gap-y-2     bg-slate-100 rounded-xl p-4  z-10">

//       {question.optionsQ.map((option, index) => (

//         <button
//           disabled={listOptionsIdDoneRight.includes(option.id)}
//           key={index*28748}
//           onClick={()=>handleOptionQClick(option.id, option.pairId)}
//           className= {selectedOptionQId == option.id 
//             ? "bg-cyan-200  border-cyan-300 border-2 border-b-4 active:border-b-2 hover:bg-cyan-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"

//             : listOptionsIdDoneRight.includes(option.id) ? "bg-green-200  border-green-300 border-2 border-b-4 active:border-b-2 hover:bg-green-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"

//             : "bg-white  border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"
          
            
//           }
//           >
//           <p className="m-4">

//             <Latex>
//               {option.optQ} 
//             </Latex>

//           </p>
//         </button>
        
//       ))}

//     </div>




    

//     <Lottie 
//         className="rotate-90 content-center align-middle z-0"
//         animationData={LottieArrowRight} 
//     />           




//     <div className="grid col-span-3 gap-y-2      bg-slate-100 rounded-xl p-4   z-10">

//       {question.optionsA.map((option, index) => (

//       <button
//         key={index*2874811}
//         disabled={listOptionsIdDoneRight.includes(option.id)}
//         onClick={()=>handleOptionAClick(option.id, option.pairId)}
//         className= {selectedOptionAId == option.id 
//           ? "bg-cyan-200  border-cyan-300 border-2 border-b-4 active:border-b-2 hover:bg-cyan-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide "
          
//           : listOptionsIdDoneRight.includes(option.id) ? "bg-green-200  border-green-300 border-2 border-b-4 active:border-b-2 hover:bg-green-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"

//           : "bg-white  border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"
//         }
//         >
//         <p className="m-4">
//           <Latex>
//             {option.optA} 
//           </Latex>
//         </p>
//       </button>
      
//       ))}

//     </div>


//   </div>
//   )
// }
