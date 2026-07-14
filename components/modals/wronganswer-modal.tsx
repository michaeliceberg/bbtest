// components/modals/wronganswer-modal.tsx

'use client'

import Image from 'next/image'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { useRef, useEffect, useState, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Button } from '../ui/button'
import { useWrongAnswerModal } from '@/store/use-wronganswer-modal'
import LottieDeathHeart from '@/public/Lottie/wrongAnswer/LottieDeathHeart.json'
import LottieDeathWrongCoffin from '@/public/Lottie/wrongAnswer/LottieDeathWrongCoffin.json'
import LottieDeathWrongCry from '@/public/Lottie/wrongAnswer/LottieDeathWrongCry.json'
import LottieDeathWrongDoor from '@/public/Lottie/wrongAnswer/LottieDeathWrongDoor.json'
import LottieDeathWrongHeartsSteel from '@/public/Lottie/wrongAnswer/LottieDeathWrongHeartsSteel.json'
import LottieDeathWrongShakeHead from '@/public/Lottie/wrongAnswer/LottieDeathWrongShakeHead.json'

const wrongLottieList = [
    LottieDeathHeart,
    LottieDeathWrongCoffin,
    LottieDeathWrongCry,
    LottieDeathWrongDoor,
    LottieDeathWrongHeartsSteel,
    LottieDeathWrongShakeHead
]

const wrongAudioList = [
    '/MemesAudio/meme-wrong-kid.WAV', 
    '/MemesAudio/meme-wrong-sharish.WAV',
    '/MemesAudio/meme-wrong-polnomochia.WAV',
    '/MemesAudio/meme-wrong-ponovoy.WAV', 
    '/MemesAudio/meme-wrong-shirokuiu.WAV', 
    '/MemesAudio/meme-wrong-tivtiraesh.WAV', 
    '/MemesAudio/meme-wrong-tipereputal.WAV',
    '/MemesAudio/meme-wrong-pacankuspehy.WAV',
    '/MemesAudio/meme-wrong-shokoladnevinovat.WAV',
    '/MemesAudio/meme-wrong-etofiaskobratan.WAV',
    '/MemesAudio/meme-wrong-skolko.WAV',
]

const wrongImageList = [
    '/MemesImage/meme-wrong-kid.jpg', 
    '/MemesImage/meme-wrong-sharish.jpeg',
    '/MemesImage/meme-wrong-polnomochia.jpeg',
    '/MemesImage/meme-wrong-ponovoy.jpeg',
    '/MemesImage/meme-wrong-shirokuiu.jpeg',
    '/MemesImage/meme-wrong-tivtiraesh.jpeg',
    '/MemesImage/meme-wrong-tipereputal.jpg',
    '/MemesImage/meme-wrong-pacankuspehy.jpeg',
    '/MemesImage/meme-wrong-pacankuspehy.jpeg',
    '/MemesImage/meme-wrong-etofiaskobratan.jpeg',
    '/MemesImage/meme-wrong-etofiaskobratan.jpeg',
    '/MemesImage/meme-wrong-skolko.jpg',
]

const wrongMessageList = [
    'О нет!', 
    'Вжик!', 
    'АхХахахАх!', 
    'Почти угадал!',
    'Ладушки-ладушки!',
    'В следующий раз повезёт!',
    'Это какой-то позор',
    'Ноуп',
    'Не фартануло!',
]

const getRandomItem = <T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)]
}

const getRandomLottie = () => {
    return wrongLottieList[Math.floor(Math.random() * wrongLottieList.length)]
}

export const WrongAnswerModal = () => {
    const lottieRef = useRef<LottieRefCurrentProps>(null)
    const { isOpen, close } = useWrongAnswerModal()
    const [isClient, setIsClient] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [shouldClose, setShouldClose] = useState(false)
    
    const [randomWrongAudio, setRandomWrongAudio] = useState<string>('')
    const [randomWrongImage, setRandomWrongImage] = useState<string>('')
    const [randomWrongMessage, setRandomWrongMessage] = useState<string>('')
    const [randomWrongLottie, setRandomWrongLottie] = useState<any>(null)
    
    const [isLottieComplete, setIsLottieComplete] = useState(false)
    const [isAudioComplete, setIsAudioComplete] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setRandomWrongAudio(getRandomItem(wrongAudioList))
            setRandomWrongImage(getRandomItem(wrongImageList))
            setRandomWrongMessage(getRandomItem(wrongMessageList))
            setRandomWrongLottie(getRandomLottie())
            setIsLottieComplete(false)
            setIsAudioComplete(false)
            setShouldClose(false)
        }
    }, [isOpen])

    useEffect(() => {
        if (isLottieComplete && isAudioComplete && !shouldClose) {
            setShouldClose(true)
            setTimeout(() => {
                close()
                setIsLottieComplete(false)
                setIsAudioComplete(false)
            }, 300)
        }
    }, [isLottieComplete, isAudioComplete, shouldClose, close])

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (isOpen && randomWrongAudio) {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
                audioRef.current.onended = null
            }
            
            audioRef.current = new Audio(randomWrongAudio)
            audioRef.current.onended = () => {
                setIsAudioComplete(true)
            }
            
            audioRef.current.play().catch(error => {
                console.error('Ошибка воспроизведения аудио:', error)
                setIsAudioComplete(true)
            })
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.onended = null
                audioRef.current = null
            }
        }
    }, [isOpen, randomWrongAudio])

    if (!isClient) {
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) close()
        }}>
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
                    <div className='flex flex-col items-center w-full justify-center mb-2 md:mb-4'>
                        {/* Lottie - меньшего размера */}
                        <div className="w-32 h-32 md:w-40 md:h-40">
                            {randomWrongLottie && (
                                <Lottie 
                                    animationData={randomWrongLottie} 
                                    lottieRef={lottieRef}
                                    loop={false}  
                                    onComplete={() => {
                                        lottieRef.current?.stop()
                                        setIsLottieComplete(true)
                                    }}
                                />
                            )}
                        </div>
                        
                        {/* Картинка - поменьше */}
                        {randomWrongImage && (
                            <div className="w-40 h-40 md:w-48 md:h-48 relative mt-2">
                                <Image 
                                    src={randomWrongImage}
                                    alt='Mascot'
                                    fill
                                    className="rounded-lg object-cover"
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>
                    
                    <DialogTitle className='text-center font-bold text-xl md:text-2xl text-red-500 mt-2'>
                        {randomWrongMessage}
                    </DialogTitle>
                    
                    <DialogDescription className='text-center text-sm md:text-base text-gray-600'>
                        Попробуй ещё раз! ❤️ -1
                    </DialogDescription>   
                </DialogHeader>

                <DialogFooter className='mt-4 md:mt-6'>
                    <Button 
                        variant='dangerOutline' 
                        className='w-full py-2 md:py-3 text-base md:text-lg'
                        size='lg'
                        onClick={() => {
                            setIsAudioComplete(true)
                            setIsLottieComplete(true)
                        }}
                    >
                        Продолжить 
                        <Image
                            src="/heart.svg"
                            alt='Heart'
                            height={18}
                            width={18}
                            className="ml-2"
                        />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>    
    )
}


