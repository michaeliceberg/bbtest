// components/modals/trainer-exit-modal.tsx
//
// Модалка выхода из урока тренажёра — раньше был обычный статичный div
// ("Вы уверены? / Продолжить / Выход"), появлялся резко, без анимации/
// эмоции. По просьбе пользователя ("у нас более интересно это
// реализовано в Задачнике") — тот же визуальный язык, что уже
// проверен в components/modals/exit-modal.tsx (Dialog + Lottie-маскот
// "Не уходи!"), просто адаптирован под тренажёр: локальный
// open/onOpenChange вместо глобального store/use-exit-modal (тренажёр
// уже управляет своим showExitModal локально в trainer-question.tsx,
// заводить для него ещё и глобальный стор незачем) и редирект на
// /trainer вместо /learn.

'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import LottieKapiThink from '@/public/Lottie/LottieKapiThink.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const TrainerExitModal = ({ open, onOpenChange }: Props) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center w-full justify-center mb-5">
                        <Lottie className="h-40 w-40" animationData={LottieKapiThink} />
                    </div>
                    <DialogTitle className="text-center font-bold text-2xl">
                        Не уходи!
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        Вы собираетесь закончить урок, вы уверены?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mb-4">
                    <div className="flex flex-col gap-y-4 w-full">
                        <Button
                            variant="primary"
                            className="w-full"
                            size="lg"
                            onClick={() => onOpenChange(false)}
                        >
                            Продолжить урок
                        </Button>
                        <Button
                            variant="dangerOutline"
                            className="w-full"
                            size="lg"
                            onClick={() => { window.location.href = '/trainer' }}
                        >
                            Закончить
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
