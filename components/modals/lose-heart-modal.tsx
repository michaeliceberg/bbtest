'use client'

import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const MAX_HEARTS = 5

type Props = {
    open: boolean
    // сколько жизней осталось ПОСЛЕ потери
    hearts: number
    // что ввёл/выбрал ученик (для клавиатурных ответов) — просто пояснение
    wrongText?: string
    onRetry: () => void
    onSkip: () => void
}

// Модалка «минус жизнь» после неверного ответа в задачнике: потерянное сердце
// гаснет (transform/opacity), остальное остаётся, ученик сразу пробует снова.
export const LoseHeartModal = ({ open, hearts, wrongText, onRetry, onSkip }: Props) => {
    const noHearts = hearts <= 0
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) (noHearts ? onSkip : onRetry)() }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center gap-2 mb-4 mt-2">
                        {Array.from({ length: MAX_HEARTS }).map((_, i) => {
                            const alive = i < hearts
                            const justLost = i === hearts
                            return (
                                <div key={i} className="relative h-9 w-9">
                                    <Heart className="absolute inset-0 h-9 w-9 text-[#3A464E]" strokeWidth={2.5} />
                                    {(alive || justLost) && (
                                        <motion.div
                                            className="absolute inset-0"
                                            initial={{ opacity: 1, scale: 1 }}
                                            animate={justLost ? { opacity: 0, scale: [1, 1.35, 0.4] } : { opacity: 1, scale: 1 }}
                                            transition={justLost ? { duration: 0.7, delay: 0.35 } : undefined}
                                        >
                                            <Heart className="h-9 w-9 text-rose-500 fill-rose-500" strokeWidth={2.5} />
                                        </motion.div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <DialogTitle className="text-center font-bold text-2xl">
                        {noHearts ? 'Жизни закончились' : 'Минус одна жизнь'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        {noHearts
                            ? 'Попытки на этой задаче кончились. Вернись к ней позже.'
                            : `${wrongText ? `Ответ ${wrongText} не подошёл. ` : ''}Осталось жизней: ${hearts}. Попробуй ещё раз.`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mb-4">
                    <div className="flex flex-col gap-y-3 w-full">
                        {!noHearts && (
                            <Button variant="primary" className="w-full" size="lg" onClick={onRetry}>
                                Попробовать ещё
                            </Button>
                        )}
                        <Button variant="primaryOutline" className="w-full" size="lg" onClick={onSkip}>
                            К следующей задаче
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
