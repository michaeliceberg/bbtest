// app/lesson/header.tsx

import { Progress } from "@/components/ui/progress"
import { useExitModal } from "@/store/use-exit-modal"
import { InfinityIcon, X, Heart } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

type Props = {
    hearts: number
    percentage: number
    hasActiveSubscription: boolean
}

export const Header = ({
    hearts,
    percentage,
    hasActiveSubscription,
}: Props) => {
    const { open } = useExitModal()
    
    return (
        <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100"
        >
            <div className="container mx-auto px-4 py-3 md:py-4">
                <div className="flex items-center gap-4 md:gap-6">
                    {/* Кнопка выхода */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={open}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="text-gray-500 hover:text-gray-700 h-5 w-5 md:h-6 md:w-6" />
                    </motion.button>

                    {/* Прогресс бар */}
                    <div className="flex-1">
                        <Progress value={percentage} className="h-2 md:h-3" />
                    </div>

                    {/* Сердца */}
                    <motion.div 
                        className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full"
                        whileHover={{ scale: 1.02 }}
                    >
                        <Heart className="h-4 w-4 md:h-5 md:w-5 text-rose-500 fill-rose-500" />
                        <span className="font-bold text-rose-500 text-sm md:text-base">
                            {hasActiveSubscription ? (
                                <InfinityIcon className="h-4 w-4 md:h-5 md:w-5 stroke-[3]" />
                            ) : (
                                hearts
                            )}
                        </span>
                    </motion.div>
                </div>
            </div>
        </motion.header>
    )
}
