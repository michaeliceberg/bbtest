// components/modals/rightanswer-modal.tsx

'use client'

import Image from 'next/image'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { useRef, useEffect, useState } from 'react'
import LottieCoins from '@/public/Lottie/LottieCoins.json'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'

import { Button } from '../ui/button'
import { useRightAnswerModal } from '@/store/use-rightanswer-modal'

const rightAudioList = [
    '/MemesAudio/meme-right-papichlegkaya.WAV',
    '/MemesAudio/meme-right-chinazes.WAV',
    '/MemesAudio/meme-right-clapping.WAV', 
    '/MemesAudio/meme-right-estestvenno.WAV',
    '/MemesAudio/meme-right-gtapassed.WAV',
    '/MemesAudio/meme-right-nice.WAV', 
    '/MemesAudio/meme-right-umeetemogete.WAV', 
    '/MemesAudio/meme-right-chetko.WAV',
]

const rightImageList = [
    '/MemesImage/meme-right-papich.jpg', 
    '/MemesImage/meme-right-chinazes.jpg',
    '/MemesImage/meme-right-clapping.jpeg',
    '/MemesImage/meme-right-estestvenno.jpg',
    '/MemesImage/meme-right-gtapassed.jpeg',
    '/MemesImage/meme-right-nice.jpeg',
    '/MemesImage/meme-right-umeetemogete.jpeg',
    '/MemesImage/meme-right-umeetemogete.jpeg',
]

const rightMessageList = [
    'Молодец!', 
    'Красавчик!', 
    'Еееее!', 
    'Угадал!', 
    'Лучший!', 
    'Ты просто Монстр!',
    'Не останавливайся!',
    'Чиназес! СЮДА!',
    'Умеете могёте!',
]

const getRandomItem = <T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)]
}

export const RightAnswerModal = () => {
    const coinsRef = useRef<LottieRefCurrentProps>(null)
    const { isOpen, close } = useRightAnswerModal()
    const [isClient, setIsClient] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [shouldClose, setShouldClose] = useState(false)
    
    // 🔥 Состояния для замороженных значений
    const [randomRightAudio, setRandomRightAudio] = useState<string>('')
    const [randomRightImage, setRandomRightImage] = useState<string>('')
    const [randomRightMessage, setRandomRightMessage] = useState<string>('')
    const [pointsEarned, setPointsEarned] = useState<number>(0)
    const [gemsEarned, setGemsEarned] = useState<number>(0)
    
    const [isLottieComplete, setIsLottieComplete] = useState(false)
    const [isAudioComplete, setIsAudioComplete] = useState(false)

    // 🔥 Подписываемся на события из стора, чтобы получать актуальные очки
    useEffect(() => {
        // Слушаем событие открытия модалки с данными
        const handleOpenWithData = (event: CustomEvent) => {
            const { points, gems } = event.detail;
            setPointsEarned(points);
            setGemsEarned(gems);
            setRandomRightAudio(getRandomItem(rightAudioList));
            setRandomRightImage(getRandomItem(rightImageList));
            setRandomRightMessage(getRandomItem(rightMessageList));
            setIsLottieComplete(false);
            setIsAudioComplete(false);
            setShouldClose(false);
        };
        
        window.addEventListener('rightAnswerModalOpen', handleOpenWithData as EventListener);
        return () => {
            window.removeEventListener('rightAnswerModalOpen', handleOpenWithData as EventListener);
        };
    }, []);

    // Генерируем новые значения при открытии модалки (без данных)
    useEffect(() => {
        if (isOpen && pointsEarned === 0) {
            setPointsEarned(10); // значение по умолчанию
            setGemsEarned(1);
            setRandomRightAudio(getRandomItem(rightAudioList));
            setRandomRightImage(getRandomItem(rightImageList));
            setRandomRightMessage(getRandomItem(rightMessageList));
            setIsLottieComplete(false);
            setIsAudioComplete(false);
            setShouldClose(false);
        }
    }, [isOpen, pointsEarned]);

    useEffect(() => {
        if (isLottieComplete && isAudioComplete && !shouldClose) {
            setShouldClose(true);
            setTimeout(() => {
                close();
                setIsLottieComplete(false);
                setIsAudioComplete(false);
            }, 300);
        }
    }, [isLottieComplete, isAudioComplete, shouldClose, close]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isOpen && randomRightAudio) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.onended = null;
            }
            
            audioRef.current = new Audio(randomRightAudio);
            audioRef.current.onended = () => {
                setIsAudioComplete(true);
            };
            
            audioRef.current.play().catch(error => {
                console.error('Ошибка воспроизведения аудио:', error);
                setIsAudioComplete(true);
            });
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.onended = null;
                audioRef.current = null;
            }
        };
    }, [isOpen, randomRightAudio]);

    if (!isClient) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) close();
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
                        <div className="w-24 h-24 md:w-32 md:h-32">
                            <Lottie 
                                animationData={LottieCoins} 
                                lottieRef={coinsRef}
                                loop={false}  
                                onComplete={() => {
                                    coinsRef.current?.stop();
                                    setIsLottieComplete(true);
                                }}
                            />
                        </div>
                        
                        {randomRightImage && (
                            <div className="w-40 h-40 md:w-48 md:h-48 relative mt-2">
                                <Image 
                                    src={randomRightImage}
                                    alt='Mascot'
                                    fill
                                    className="rounded-lg object-cover"
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>
                    
                    <DialogTitle className='text-center font-bold text-xl md:text-2xl text-green-600 mt-2'>
                        {randomRightMessage}
                    </DialogTitle>
                    
                    <DialogDescription className='text-center text-sm md:text-base text-[#9AA7B0]'>
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-amber-500">
                                <Lottie className="w-6 h-6" animationData={LottieCoins} />
                                <span className="font-bold text-lg">+{pointsEarned}</span>
                            </div>
                            <div className="w-px h-5 bg-[#2E3A40]" />
                            <div className="flex items-center gap-1 text-purple-500">
                                <span className="text-lg">💎</span>
                                <span className="font-bold text-lg">+{gemsEarned}</span>
                            </div>
                        </div>
                    </DialogDescription>   
                </DialogHeader>

                <DialogFooter className='mt-4 md:mt-6'>
                    <Button 
                        variant='primary' 
                        className='w-full py-2 md:py-3 text-base md:text-lg'
                        size='lg'
                        onClick={() => {
                            setIsAudioComplete(true);
                            setIsLottieComplete(true);
                        }}
                    >
                        Продолжить 
                        <span className="ml-2">🎯</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>    
    )
}

