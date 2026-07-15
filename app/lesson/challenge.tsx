// app/lesson/challenge.tsx (упрощённая версия без нижних кнопок)

import { challengeOptions, challenges } from "@/db/schema"
import { cn } from "@/lib/utils"
import { Card } from "./card"
import { motion } from "framer-motion"
import { Lock, Calendar, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

type Props = {
    options: typeof challengeOptions.$inferSelect[]
    onSelect: (id: number) => void
    status: "correct" | "wrong" | "none"
    selectedOption?: number
    disabled?: boolean
    type: typeof challenges.$inferSelect["type"]
    isDoneWrongChallenge: boolean
    isDoneChallenge: boolean
    dateLastDone: Date
    challengeId: number
}

export const Challenge = ({
    options,
    onSelect,
    status,
    selectedOption,
    disabled,
    type,
    isDoneWrongChallenge,
    isDoneChallenge,
    dateLastDone,
    challengeId,
}: Props) => {
    const canSolve = !dateLastDone || (new Date().getTime() - new Date(dateLastDone).getTime()) > 24 * 60 * 60 * 1000
    
    const getStatusMessage = () => {
        if (!canSolve && isDoneWrongChallenge) {
            const nextAttemptDate = new Date(dateLastDone)
            nextAttemptDate.setDate(nextAttemptDate.getDate() + 1)
            const formattedDate = format(nextAttemptDate, "d MMMM", { locale: ru })
            return {
                icon: Lock,
                title: "Доступ ограничен",
                message: `Повторно можно решить ${formattedDate}`,
                color: "text-amber-600"
            }
        }
        if (isDoneChallenge && !isDoneWrongChallenge) {
            return {
                icon: CheckCircle,
                title: "Задача решена",
                message: "Правильный ответ уже получен",
                color: "text-green-600"
            }
        }
        return null
    }

    const statusInfo = getStatusMessage()

    return (
        <div className="w-full">
            {canSolve ? (
                <div className={cn(
                    "grid gap-3",
                    type === "ASSIST" && "grid-cols-1 md:grid-cols-2",
                    type === "SELECT" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}>
                    {options.map((option, i) => (
                        <Card 
                            key={option.id}
                            id={option.id}
                            text={option.text}
                            imageSrc={option.imageSrc}
                            shortcut={String.fromCharCode(65 + i)}
                            selected={selectedOption === option.id}
                            onClick={() => onSelect(option.id)}
                            status={status}
                            disabled={disabled}
                            type={type}
                            isDoneWrongChallenge={isDoneWrongChallenge}
                        />   
                    ))}
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 px-4 bg-[#1A252B] rounded-xl border border-[#3A464E]"
                >
                    {statusInfo && (
                        <>
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#232F34] mb-3 ${statusInfo.color}`}>
                                <statusInfo.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-base mb-1">{statusInfo.title}</h3>
                            <p className="text-[#9AA7B0] text-sm">{statusInfo.message}</p>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    )
}
