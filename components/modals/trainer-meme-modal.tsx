// components/modals/trainer-meme-modal.tsx
//
// Тот же принцип, что у RightAnswerModal/WrongAnswerModal в задачнике —
// картинка+аудио, закрывается сама по завершении звука — но без очков/
// Lottie-монет/сердечка: тренажёр награждает по-своему (стрики/кейсы),
// здесь только эмоция. Открывается с вероятностью MEME_MODAL_CHANCE на
// правильный/неправильный ответ (см. TQUIZ.tsx), не на каждый ответ.

'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { Button } from '../ui/button'
import { useTrainerMemeModal } from '@/store/use-trainer-meme-modal'

const RIGHT_MEME_NAMES = [
    'da-yauveren',
    'daaaam',
    'genialno',
    'kruto',
    'missionpassed',
    'somnitelno',
    'ti-nedoocenivaeshmoiumosh',
    'umeete-mogete',
    'vot-setogomomenta',
]

const WRONG_MEME_NAMES = [
    'chto-titakoe',
    'eto-kakoytopozor',
    'eto-konechnonepravda',
    'eto-pechalno',
    'haha',
    'karlson-tisumasoshel',
    'loh',
    'ne-nutiindeec',
    'nenua',
    'oi-durak',
    'pochemy-net',
    'sho-opyat',
    'slojnaaa',
    'ti-seriozno',
    'ti-vtiraesh',
    'vi-ponomaeteochemgovoryat',
    'ya-etoneponimaiu',
    'ya-oshibsa',
    'wasted',
]

type MemePair = { image: string; audio: string }

const buildPairs = (folder: 'right' | 'wrong', names: string[]): MemePair[] =>
    names.map((name) => ({
        image: `/MemesImage/${folder}/${name}.jpg`,
        audio: `/MemesAudio/${folder}/${name}.wav`,
    }))

const rightPairs = buildPairs('right', RIGHT_MEME_NAMES)
const wrongPairs = buildPairs('wrong', WRONG_MEME_NAMES)

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export const TrainerMemeModal = () => {
    const { isOpen, variant, close } = useTrainerMemeModal()
    const [isClient, setIsClient] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [shouldClose, setShouldClose] = useState(false)
    const [pair, setPair] = useState<MemePair | null>(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            setPair(getRandomItem(variant === 'right' ? rightPairs : wrongPairs))
            setShouldClose(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, variant])

    useEffect(() => {
        if (isOpen && pair) {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
                audioRef.current.onended = null
            }

            const onDone = () => {
                if (shouldClose) return
                setShouldClose(true)
                setTimeout(() => close(), 300)
            }

            audioRef.current = new Audio(pair.audio)
            audioRef.current.onended = onDone
            audioRef.current.play().catch(() => onDone())
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.onended = null
                audioRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, pair])

    if (!isClient) return null

    const isRight = variant === 'right'

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) close()
            }}
        >
            <DialogContent
                className="
                    max-w-[90vw]
                    md:max-w-md
                    w-full
                    rounded-2xl
                    p-4
                    md:p-6
                    max-h-[90vh]
                    overflow-y-auto
                "
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    {pair && (
                        <div className="flex flex-col items-center w-full justify-center mb-2 md:mb-4">
                            <div className="w-48 h-48 md:w-56 md:h-56 relative">
                                <Image
                                    src={pair.image}
                                    alt="Мем"
                                    fill
                                    className="rounded-lg object-cover"
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}

                    <DialogTitle
                        className={`text-center font-bold text-xl md:text-2xl mt-2 ${
                            isRight ? 'text-green-600' : 'text-red-500'
                        }`}
                    >
                        {isRight ? 'Ты просто мегамозг!' : 'Ой-ой...'}
                    </DialogTitle>
                </DialogHeader>

                <DialogFooter className="mt-4 md:mt-6">
                    <Button
                        variant={isRight ? 'primary' : 'dangerOutline'}
                        className="w-full py-2 md:py-3 text-base md:text-lg"
                        size="lg"
                        onClick={() => close()}
                    >
                        Продолжить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
