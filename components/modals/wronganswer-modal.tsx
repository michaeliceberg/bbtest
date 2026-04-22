'use client'

import Image from 'next/image'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { useRef, useEffect, useState } from 'react'
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

type Props = {
    randomWrongAudio: string,
    randomWrongImage: string,
    randomWrongMessage: string,
    randomLottieNumber: number,
}

export const WrongAnswerModal = ({
    randomWrongAudio,
    randomWrongImage,
    randomWrongMessage,
    randomLottieNumber,
}: Props) => {
    const randomWrongLottie = wrongLottieList[randomLottieNumber]
    const phoneRef = useRef<LottieRefCurrentProps>(null)
    const { isOpen, close } = useWrongAnswerModal()
    const [isClient, setIsClient] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const audioEndHandlerRef = useRef<(() => void) | null>(null)

    const [isLottieComplete, setIsLottieComplete] = useState(false)
    const [isAudioComplete, setIsAudioComplete] = useState(false)

    // Закрываем только когда и Lottie, и аудио закончились
    useEffect(() => {
        if (isLottieComplete && isAudioComplete) {
            close()
            setIsLottieComplete(false)
            setIsAudioComplete(false)
        }
    }, [isLottieComplete, isAudioComplete, close])

    // Фикс для hydration ошибки
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Воспроизведение аудио при открытии модалки
    useEffect(() => {
        if (isOpen && randomWrongAudio) {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
                if (audioEndHandlerRef.current) {
                    audioRef.current.removeEventListener('ended', audioEndHandlerRef.current)
                }
            }
            
            audioRef.current = new Audio(randomWrongAudio)
            
            const handleAudioEnd = () => {
                console.log('Аудио закончилось')
                setIsAudioComplete(true)
            }
            
            audioEndHandlerRef.current = handleAudioEnd
            audioRef.current.addEventListener('ended', handleAudioEnd)
            
            audioRef.current.play().catch(error => {
                console.error('Ошибка воспроизведения аудио:', error)
                setIsAudioComplete(true)
            })
        }
        
        return () => {
            if (audioRef.current && audioEndHandlerRef.current) {
                audioRef.current.removeEventListener('ended', audioEndHandlerRef.current)
                audioRef.current.pause()
                audioRef.current = null
                audioEndHandlerRef.current = null
            }
        }
    }, [isOpen, randomWrongAudio])

    // Сброс состояний при открытии модалки
    useEffect(() => {
        if (isOpen) {
            setIsLottieComplete(false)
            setIsAudioComplete(false)
        }
    }, [isOpen])

    if (!isClient) {
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <div className='items-center w-full justify-center mb-5'>
                        <Lottie 
                            className="h-50 w-50"
                            animationData={randomWrongLottie} 
                            lottieRef={phoneRef}
                            loop={false}  
                            onComplete={() => {
                                phoneRef.current?.stop()
                                setIsLottieComplete(true)
                            }}
                        />
                        <Image 
                            src={randomWrongImage}
                            alt='Mascot'
                            height={200}
                            width={200}
                            className="border-r-8 w-full mx-auto"
                        />
                    </div>
                    <DialogTitle className='text-center font-bold text-2xl'>
                        {randomWrongMessage}
                    </DialogTitle>
                    <DialogDescription className='text-center text-base' />
                </DialogHeader>

                <DialogFooter className='mb-4'>
                    <div className='flex flex-col gap-y-4 w-full'>
                        <Button 
                            variant='dangerOutline' 
                            className='w-full' 
                            size='lg'
                            onClick={close}
                        >
                            - 1 
                            <Image
                                src="/heart.svg"
                                alt='Heart'
                                height={20}
                                width={20}
                            />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>    
    )
}






// 'use client'

// import Image from 'next/image'
// import Lottie, { LottieRefCurrentProps } from 'lottie-react'
// import { useEffect, useRef, useState } from 'react'
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle
// } from '@/components/ui/dialog'
// import { Button } from '../ui/button'
// import { useWrongAnswerModal } from '@/store/use-wronganswer-modal'
// import LottieDeathHeart from '@/public/Lottie/wrongAnswer/LottieDeathHeart.json'
// import LottieDeathWrongCoffin from '@/public/Lottie/wrongAnswer/LottieDeathWrongCoffin.json'
// import LottieDeathWrongCry from '@/public/Lottie/wrongAnswer/LottieDeathWrongCry.json'
// import LottieDeathWrongDoor from '@/public/Lottie/wrongAnswer/LottieDeathWrongDoor.json'
// import LottieDeathWrongHeartsSteel from '@/public/Lottie/wrongAnswer/LottieDeathWrongHeartsSteel.json'
// import LottieDeathWrongShakeHead from '@/public/Lottie/wrongAnswer/LottieDeathWrongShakeHead.json'

// const wrongLottieList = [
//     LottieDeathHeart,
//     LottieDeathWrongCoffin,
//     LottieDeathWrongCry,
//     LottieDeathWrongDoor,
//     LottieDeathWrongHeartsSteel,
//     LottieDeathWrongShakeHead
// ]

// type Props = {
//     randomWrongAudio: string,
//     randomWrongImage: string,
//     randomWrongMessage: string,
//     randomLottieNumber: number,
// }

// export const WrongAnswerModal = ({
//     randomWrongAudio,
//     randomWrongImage,
//     randomWrongMessage,
//     randomLottieNumber,
// }: Props) => {
//     const randomWrongLottie = wrongLottieList[randomLottieNumber]
//     const phoneRef = useRef<LottieRefCurrentProps>(null)
//     const { isOpen, close } = useWrongAnswerModal()
//     const [isClient, setIsClient] = useState(false)
//     const audioRef = useRef<HTMLAudioElement | null>(null)



//     const [isLottieComplete, setIsLottieComplete] = useState(false)
//     const [isAudioComplete, setIsAudioComplete] = useState(false)

//     useEffect(() => {
//         // Закрываем только когда и Lottie, и аудио закончились
//         if (isLottieComplete && isAudioComplete) {
//             close()
//         }
//     }, [isLottieComplete, isAudioComplete, close])

// // // В Lottie onComplete:
// // onComplete={() => {
// //     phoneRef.current?.stop()
// //     setIsLottieComplete(true)
// // }}

// // // В аудио:
// // const handleAudioEnd = () => {
// //     setIsAudioComplete(true)
// // }




//     // Фикс для hydration ошибки
//     useEffect(() => {
//         setIsClient(true)
//     }, [])

//     // Воспроизведение аудио при открытии модалки и автоматическое закрытие
//     useEffect(() => {
//         if (isOpen && randomWrongAudio) {
//             // Останавливаем предыдущее аудио, если есть
//             if (audioRef.current) {
//                 audioRef.current.pause()
//                 audioRef.current.currentTime = 0
//             }
            
//             audioRef.current = new Audio(randomWrongAudio)
            
//             // Слушаем событие окончания аудио
//             // const handleAudioEnd = () => {
//             //     console.log('Аудио закончилось, закрываем модалку')
//             //     close()
//             // }

//             const handleAudioEnd = () => {
//                 setIsAudioComplete(true)
//             }

            
            
//             audioRef.current.addEventListener('ended', handleAudioEnd)
//             audioRef.current.play().catch(error => {
//                 console.error('Ошибка воспроизведения аудио:', error)
//                 // Если аудио не воспроизвелось, закрываем модалку через 3 секунды
//                 setTimeout(() => close(), 3000)
//             })

//             // Очистка при закрытии или размонтировании
//             return () => {
//                 if (audioRef.current) {
//                     audioRef.current.removeEventListener('ended', handleAudioEnd)
//                     audioRef.current.pause()
//                     audioRef.current = null
//                 }
//             }
//         }
//     }, [isOpen, randomWrongAudio, close])

//     if (!isClient) {
//         return null
//     }

//     return (
//         <Dialog open={isOpen} onOpenChange={close}>
//             <DialogContent className='max-w-md'>
//                 <DialogHeader>
//                     <div className='items-center w-full justify-center mb-5'>
//                         <Lottie 
//                             className="h-50 w-50"
//                             animationData={randomWrongLottie} 
//                             lottieRef={phoneRef}
//                             loop={false}  
//                             // onComplete={() => {
//                             //     phoneRef.current?.stop()
//                             //     // Не закрываем здесь, ждем окончания аудио
//                             // }}
//                             onComplete={() => {
//                                 phoneRef.current?.stop()
//                                 setIsLottieComplete(true)
//                             }}
//                         />
//                         <Image 
//                             src={randomWrongImage}
//                             alt='Mascot'
//                             height={200}
//                             width={200}
//                             className="border-r-8 w-full mx-auto"
//                         />
//                     </div>
//                     <DialogTitle className='text-center font-bold text-2xl'>
//                         {randomWrongMessage}
//                     </DialogTitle>
//                     <DialogDescription className='text-center text-base'>
//                         {/* Описание, если нужно */}
//                     </DialogDescription>   
//                 </DialogHeader>

//                 <DialogFooter className='mb-4'>
//                     <div className='flex flex-col gap-y-4 w-full'>
//                         <Button 
//                             variant='dangerOutline' 
//                             className='w-full' 
//                             size='lg'
//                             onClick={close}
//                         >
//                             - 1 
//                             <Image
//                                 src="/heart.svg"
//                                 alt='Heart'
//                                 height={20}
//                                 width={20}
//                             />
//                         </Button>
//                     </div>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>    
//     )
// }



// // // 'use client'

// // // import Image from 'next/image'

// // // import Lottie, {LottieRefCurrentProps} from 'lottie-react'
// // // import {useEffect, useRef, useState} from 'react'

// // // import {
// // //     Dialog,
// // //     DialogContent,
// // //     DialogDescription,
// // //     DialogFooter,
// // //     DialogHeader,
// // //     DialogTitle

// // // } from '@/components/ui/dialog'


// // // import { Button } from '../ui/button'
// // // import { useWrongAnswerModal } from '@/store/use-wronganswer-modal'
// // // import LottieDeathHeart from '@/public/Lottie/wrongAnswer/LottieDeathHeart.json'
// // // import LottieDeathWrongCoffin from '@/public/Lottie/wrongAnswer/LottieDeathWrongCoffin.json'
// // // import LottieDeathWrongCry from '@/public/Lottie/wrongAnswer/LottieDeathWrongCry.json'
// // // import LottieDeathWrongDoor from '@/public/Lottie/wrongAnswer/LottieDeathWrongDoor.json'
// // // import LottieDeathWrongHeartsSteel from '@/public/Lottie/wrongAnswer/LottieDeathWrongHeartsSteel.json'
// // // import LottieDeathWrongShakeHead from '@/public/Lottie/wrongAnswer/LottieDeathWrongShakeHead.json'
// // // import { useAudio } from 'react-use'


// // // const wrongLottieList = 
// // //     [
// // //         LottieDeathHeart, 
// // //         LottieDeathWrongCoffin, 
// // //         LottieDeathWrongCry, 
// // //         LottieDeathWrongDoor, 
// // //         LottieDeathWrongHeartsSteel, 
// // //         LottieDeathWrongShakeHead
// // //     ]

                
// // // type Props = {
// // //     randomWrongAudio: string,
// // //     randomWrongImage: string,
// // //     randomWrongMessage: string,
    
// // //     randomLottieNumber: number,

// // // }

// // // export const WrongAnswerModal = ({
// // //     randomWrongAudio,
// // //     randomWrongImage,
// // //     randomWrongMessage,

// // //     randomLottieNumber,

// // // }: Props) => {

// // //     // const randomWrongLottie = wrongLottieList[randomLottieNumber]
// // //     // const phoneRef = useRef<LottieRefCurrentProps>(null)

// // //     // const {isOpen, close} = useWrongAnswerModal()

// // //     const randomWrongLottie = wrongLottieList[randomLottieNumber]
// // //     const phoneRef = useRef<LottieRefCurrentProps>(null)
// // //     const { isOpen, close } = useWrongAnswerModal()
// // //     const [isClient, setIsClient] = useState(false)
// // //     const audioRef = useRef<HTMLAudioElement | null>(null)

// // //     // const [
// // //     //     incorrectAudio,
// // //     //     _i,
// // //     //     incorrectControls,
// // //     // ] = useAudio({ src: randomWrongAudio })


    
// // //     // useEffect(()=>setIsClient(true),[]) 
// // //     // // БЕЗ этого ПОЧЕМУ-то Hydration ERROR
// // //     // if (!isClient){
// // //     //     return null
// // //     // }
    
    
// // //     // Фикс для hydration ошибки
// // //     useEffect(() => {
// // //         setIsClient(true)
// // //     }, [])

    
    
    
// // //     // useEffect(() => {
// // //     //     if (isOpen) {
// // //     //       const audio = new Audio(randomWrongAudio)
// // //     //       audio.play()
// // //     //     }
// // //     //   }, [isOpen, randomWrongAudio])

    

// // //       useEffect(() => {
// // //         if (isOpen && randomWrongAudio) {
// // //             // Останавливаем предыдущее аудио, если есть
// // //             if (audioRef.current) {
// // //                 audioRef.current.pause()
// // //                 audioRef.current.currentTime = 0
// // //             }
            
// // //             audioRef.current = new Audio(randomWrongAudio)
// // //             audioRef.current.play().catch(error => {
// // //                 console.error('Ошибка воспроизведения аудио:', error)
// // //             })
// // //         }

// // //         // Очистка при закрытии или размонтировании
// // //         return () => {
// // //             if (audioRef.current) {
// // //                 audioRef.current.pause()
// // //                 audioRef.current = null
// // //             }
// // //         }
// // //     }, [isOpen, randomWrongAudio]) // ✅ Добавили зависимости



// // //     if (!isClient) {
// // //         return null
// // //     }



// // //     return (
// // //         <>
// // //         {/* {incorrectAudio} */}

// // //         <Dialog open={isOpen} onOpenChange={close}>
// // //             <DialogContent className='max-w-md'>
// // //                 <DialogHeader>
// // //                 {/* <div className='flex items-center w-full justify-center mb-5'> */}
// // //                 <div className='items-center w-full justify-center mb-5'>




// // //                         <Lottie className="h-50 w-50"
// // //                             animationData={ randomWrongLottie } 
// // //                             lottieRef={phoneRef }
// // //                             loop={false}  
// // //                             // onComplete={()=>{
// // //                             //     phoneRef.current?.stop
// // //                             //     close()
// // //                             // }}
// // //                             onComplete={() => {
// // //                                 phoneRef.current?.stop() // Добавлены скобки
// // //                                 close()
// // //                             }}
// // //                         />

// // //             <Image 
// // //             src={randomWrongImage}
// // //             alt='Mascot'
// // //                 height={200}
// // //                 width={200}
// // //                 className="border-r-8 w-full mx-auto"
// // //             />

// // //                     </div>
// // //                     <DialogTitle className='text-center font-bold text-2xl'>
// // //                         {randomWrongMessage}
// // //                     </DialogTitle>
// // //                     <DialogDescription className='text-center text-base'>
                  
// // //                     </DialogDescription>   
// // //                 </DialogHeader>

// // //                 <DialogFooter className='mb-4'>
// // //                     <div className='flex flex-col gap-y-4 w-full'>
// // //                         <Button 
// // //                             variant='dangerOutline' 
// // //                             className='w-full' 
// // //                             size='lg' 
// // //                         >
// // //                             - 1 
// // //                             <Image
// // //                                 src="/heart.svg"
// // //                                 alt='Heart'
// // //                                 height={20}
// // //                                 width={20}
// // //                             />
// // //                         </Button>
                        
// // //                     </div>
// // //                 </DialogFooter>

// // //                                 {/* TODO:  добавлена кнопка закрытия */}
// // //                 <Button onClick={close} variant="ghost" className="absolute right-4 top-4">
// // //                 ✕
// // //                 </Button>

// // //             </DialogContent>
// // //         </Dialog>    
// // //         </>
// // //     )
// // // }




// // 'use client'

// // import Image from 'next/image'
// // import Lottie, { LottieRefCurrentProps } from 'lottie-react'
// // import { useEffect, useRef, useState } from 'react'
// // import {
// //     Dialog,
// //     DialogContent,
// //     DialogDescription,
// //     DialogFooter,
// //     DialogHeader,
// //     DialogTitle
// // } from '@/components/ui/dialog'
// // import { Button } from '../ui/button'
// // import { useWrongAnswerModal } from '@/store/use-wronganswer-modal'
// // import LottieDeathHeart from '@/public/Lottie/wrongAnswer/LottieDeathHeart.json'
// // import LottieDeathWrongCoffin from '@/public/Lottie/wrongAnswer/LottieDeathWrongCoffin.json'
// // import LottieDeathWrongCry from '@/public/Lottie/wrongAnswer/LottieDeathWrongCry.json'
// // import LottieDeathWrongDoor from '@/public/Lottie/wrongAnswer/LottieDeathWrongDoor.json'
// // import LottieDeathWrongHeartsSteel from '@/public/Lottie/wrongAnswer/LottieDeathWrongHeartsSteel.json'
// // import LottieDeathWrongShakeHead from '@/public/Lottie/wrongAnswer/LottieDeathWrongShakeHead.json'

// // const wrongLottieList = [
// //     LottieDeathHeart,
// //     LottieDeathWrongCoffin,
// //     LottieDeathWrongCry,
// //     LottieDeathWrongDoor,
// //     LottieDeathWrongHeartsSteel,
// //     LottieDeathWrongShakeHead
// // ]

// // type Props = {
// //     randomWrongAudio: string,
// //     randomWrongImage: string,
// //     randomWrongMessage: string,
// //     randomLottieNumber: number,
// // }

// // export const WrongAnswerModal = ({
// //     randomWrongAudio,
// //     randomWrongImage,
// //     randomWrongMessage,
// //     randomLottieNumber,
// // }: Props) => {
// //     const randomWrongLottie = wrongLottieList[randomLottieNumber]
// //     const phoneRef = useRef<LottieRefCurrentProps>(null)
// //     const { isOpen, close } = useWrongAnswerModal()
// //     const [isClient, setIsClient] = useState(false)
// //     const audioRef = useRef<HTMLAudioElement | null>(null)

// //     // Фикс для hydration ошибки
// //     useEffect(() => {
// //         setIsClient(true)
// //     }, [])

// //     // Воспроизведение аудио при открытии модалки
// //     useEffect(() => {
// //         if (isOpen && randomWrongAudio) {
// //             // Останавливаем предыдущее аудио, если есть
// //             if (audioRef.current) {
// //                 audioRef.current.pause()
// //                 audioRef.current.currentTime = 0
// //             }
            
// //             audioRef.current = new Audio(randomWrongAudio)
// //             audioRef.current.play().catch(error => {
// //                 console.error('Ошибка воспроизведения аудио:', error)
// //             })
// //         }

// //         // Очистка при закрытии или размонтировании
// //         return () => {
// //             if (audioRef.current) {
// //                 audioRef.current.pause()
// //                 audioRef.current = null
// //             }
// //         }
// //     }, [isOpen, randomWrongAudio]) // ✅ Добавили зависимости

// //     if (!isClient) {
// //         return null
// //     }

// //     return (
// //         <Dialog open={isOpen} onOpenChange={close}>
// //             <DialogContent className='max-w-md'>
// //                 <DialogHeader>
// //                     <div className='items-center w-full justify-center mb-5'>
// //                         <Lottie 
// //                             className="h-50 w-50"
// //                             animationData={randomWrongLottie} 
// //                             lottieRef={phoneRef}
// //                             loop={false}  
// //                             onComplete={() => {
// //                                 phoneRef.current?.stop()
// //                                 close()
// //                             }}
// //                         />
// //                         <Image 
// //                             src={randomWrongImage}
// //                             alt='Mascot'
// //                             height={200}
// //                             width={200}
// //                             className="border-r-8 w-full mx-auto"
// //                         />
// //                     </div>
// //                     <DialogTitle className='text-center font-bold text-2xl'>
// //                         {randomWrongMessage}
// //                     </DialogTitle>
// //                     <DialogDescription className='text-center text-base'>
// //                         {/* Описание, если нужно */}
// //                     </DialogDescription>   
// //                 </DialogHeader>

// //                 <DialogFooter className='mb-4'>
// //                     <div className='flex flex-col gap-y-4 w-full'>
// //                         <Button 
// //                             variant='dangerOutline' 
// //                             className='w-full' 
// //                             size='lg'
// //                             onClick={close}
// //                         >
// //                             - 1 
// //                             <Image
// //                                 src="/heart.svg"
// //                                 alt='Heart'
// //                                 height={20}
// //                                 width={20}
// //                             />
// //                         </Button>
// //                     </div>
// //                     <Button onClick={close} variant="ghost" className="absolute right-4 top-4">
// //                         ✕
// //                     </Button>
// //                 </DialogFooter>
// //             </DialogContent>
// //         </Dialog>    
// //     )
// // }