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

type Props = {
    randomRightAudio: string,
    randomRightImage: string,
    randomRightMessage: string,
}

export const RightAnswerModal = ({
    randomRightAudio,
    randomRightImage,
    randomRightMessage,
}: Props) => {
    const phoneRef = useRef<LottieRefCurrentProps>(null)
    const { isOpen, close } = useRightAnswerModal()
    const [isClient, setIsClient] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const audioEndHandlerRef = useRef<(() => void) | null>(null)

    const [isLottieComplete, setIsLottieComplete] = useState(false)
    const [isAudioComplete, setIsAudioComplete] = useState(false)

    // Закрываем только когда и Lottie, и аудио закончились
    useEffect(() => {
        if (isLottieComplete && isAudioComplete) {
            close()
            // Сбрасываем состояния после закрытия
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
        if (isOpen && randomRightAudio) {
            // Останавливаем предыдущее аудио, если есть
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
                if (audioEndHandlerRef.current) {
                    audioRef.current.removeEventListener('ended', audioEndHandlerRef.current)
                }
            }
            
            // Создаем новое аудио
            audioRef.current = new Audio(randomRightAudio)
            
            // Создаем обработчик окончания аудио
            const handleAudioEnd = () => {
                console.log('Аудио закончилось')
                setIsAudioComplete(true)
            }
            
            audioEndHandlerRef.current = handleAudioEnd
            audioRef.current.addEventListener('ended', handleAudioEnd)
            
            // Воспроизводим аудио
            audioRef.current.play().catch(error => {
                console.error('Ошибка воспроизведения аудио:', error)
                // Если аудио не воспроизвелось, считаем что оно "закончилось"
                setIsAudioComplete(true)
            })
        }
        
        // Очистка при закрытии или размонтировании
        return () => {
            if (audioRef.current && audioEndHandlerRef.current) {
                audioRef.current.removeEventListener('ended', audioEndHandlerRef.current)
                audioRef.current.pause()
                audioRef.current = null
                audioEndHandlerRef.current = null
            }
        }
    }, [isOpen, randomRightAudio])

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
                            animationData={LottieCoins} 
                            lottieRef={phoneRef}
                            loop={false}  
                            onComplete={() => {
                                phoneRef.current?.stop()
                                setIsLottieComplete(true)
                            }}
                        />

                        <Image 
                            src={randomRightImage}
                            alt='Mascot'
                            height={200}
                            width={200}
                            className="border-r-8 w-full mx-auto"
                        />
                    </div>
                    <DialogTitle className='text-center font-bold text-2xl'>
                        {randomRightMessage}
                    </DialogTitle>
                    <DialogDescription className='text-center text-base'>
                        {/* Описание, если нужно */}
                    </DialogDescription>   
                </DialogHeader>

                <DialogFooter className='mb-4'>
                    <div className='flex flex-col gap-y-4 w-full'>
                        <Button 
                            variant='dangerOutline' 
                            className='w-full' 
                            size='lg'
                            onClick={close}
                        >
                            +
                            <Lottie 
                                className="h-14 w-14 mr-2 pb-2"
                                animationData={LottieCoins} 
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
// import { useRef, useEffect, useState } from 'react'
// import LottieCoins from '@/public/Lottie/LottieCoins.json'

// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle
// } from '@/components/ui/dialog'

// import { Button } from '../ui/button'
// import { useRightAnswerModal } from '@/store/use-rightanswer-modal'

// type Props = {
//     randomRightAudio: string,
//     randomRightImage: string,
//     randomRightMessage: string,
// }

// export const RightAnswerModal = ({
//     randomRightAudio,
//     randomRightImage,
//     randomRightMessage,
// }: Props) => {
//     const phoneRef = useRef<LottieRefCurrentProps>(null)
//     const { isOpen, close } = useRightAnswerModal()
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


//     // Фикс для hydration ошибки
//     useEffect(() => {
//         setIsClient(true)
//     }, [])

//     // Воспроизведение аудио при открытии модалки и автоматическое закрытие
//     useEffect(() => {
//         if (isOpen && randomRightAudio) {
//             // Останавливаем предыдущее аудио, если есть
//             if (audioRef.current) {
//                 audioRef.current.pause()
//                 audioRef.current.currentTime = 0
//             }
            
//             audioRef.current = new Audio(randomRightAudio)
            
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
//     }, [isOpen, randomRightAudio, close])

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
//                             animationData={LottieCoins} 
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
//                             src={randomRightImage}
//                             alt='Mascot'
//                             height={200}
//                             width={200}
//                             className="border-r-8 w-full mx-auto"
//                         />
//                     </div>
//                     <DialogTitle className='text-center font-bold text-2xl'>
//                         {randomRightMessage}
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
//                             +
//                             <Lottie 
//                                 className="h-14 w-14 mr-2 pb-2"
//                                 animationData={LottieCoins} 
//                             />
//                         </Button>
//                     </div>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>    
//     )
// }



// // 'use client'

// // import Image from 'next/image'

// // import Lottie, {LottieRefCurrentProps} from 'lottie-react'
// // import {useRef} from 'react'
// // import LottieCoins from '@/public/Lottie/LottieCoins.json'

// // import {
// //     Dialog,
// //     DialogContent,
// //     DialogDescription,
// //     DialogFooter,
// //     DialogHeader,
// //     DialogTitle

// // } from '@/components/ui/dialog'

// // import { Button } from '../ui/button'
// // import { useEffect, useState } from 'react';
// // import { useAudio } from 'react-use'
// // import { useRightAnswerModal } from '@/store/use-rightanswer-modal'



// // type Props = {
// //     randomRightAudio: string,
// //     randomRightImage: string,
// //     randomRightMessage: string,
    
// // }

// // export const RightAnswerModal = ({
// //     randomRightAudio,
// //     randomRightImage,
// //     randomRightMessage,
// // }: Props) => {


// //     const phoneRef = useRef<LottieRefCurrentProps>(null)

// //     const {isOpen, close} = useRightAnswerModal()




// //     // let [
// //     //     correctAudio,
// //     //     _с,
// //     //     correctControls,
// //     // ] = useAudio({ src: randomRightAudio, 
// //     //     autoPlay: false 
// //     // })



// //     const [isClient, setIsClient] = useState(false)
    
    
// //     // useEffect(()=>{
// //     //     setIsClient(true)
// //     //     correctControls.play()
// //     // },[]) 
    
// //     // useEffect(() => {
// //     //     if (isOpen) {
// //     //       correctControls.play()
// //     //     }
// //     //   }, [isOpen])
    
    


// //     useEffect(() => {
// //         if (isOpen) {
// //           const audio = new Audio(randomRightAudio)
// //           audio.play()
// //         }
// //       }, [isOpen])




// //     // БЕЗ этого ПОЧЕМУ-то Hydration ERROR

// //     if (!isClient){
// //         return null
// //     }


     

// //     return (
// //         <>
// //         {/* {correctAudio} */}

// //         <Dialog open={isOpen} onOpenChange={close}>
// //             <DialogContent className='max-w-md'>
// //                 <DialogHeader>
// //                 {/* <div className='flex items-center w-full justify-center mb-5'> */}
// //                 <div className='items-center w-full justify-center mb-5'>




// //                         <Lottie className="h-50 w-50"
// //                             animationData={ LottieCoins } 
// //                             lottieRef={ phoneRef }
// //                             loop={false}  
// //                             //
// //                             // автоматичесски ЗАКРЫТЬ МОДАЛЬНОЕ ОКНО ПОСЛЕ stop Окончания Lottie
// //                             //
// //                             onComplete={()=>{
// //                                 phoneRef.current?.stop
// //                                 close()
// //                             }}
// //                         />

// //             <Image 
// //             src={randomRightImage}
// //             // src='/memes/mem-wrong-sharish.jpeg'
// //             alt='Mascot'
// //                 height={200}
// //                 width={200}
// //                 className="border-r-8 w-full mx-auto"
// //             />

// //                     </div>
// //                     <DialogTitle className='text-center font-bold text-2xl'>
// //                         {randomRightMessage}
// //                     </DialogTitle>
// //                     <DialogDescription className='text-center text-base'>
                  
// //                     </DialogDescription>   
// //                 </DialogHeader>

// //                 <DialogFooter className='mb-4'>
// //                     <div className='flex flex-col gap-y-4 w-full'>
// //                         <Button 
// //                             variant='dangerOutline' 
// //                             className='w-full' 
// //                             size='lg' 
// //                         >
// //                             +

// //                             <Lottie className="h-14 w-14 mr-2 pb-2"
// //                                 animationData={ LottieCoins } 
// //                             />


// //                         </Button>
                        
// //                     </div>
// //                 </DialogFooter>

// //             </DialogContent>
// //         </Dialog>    
// //         </>
// //     )
// // }



// 'use client'

// import Image from 'next/image'
// import Lottie, { LottieRefCurrentProps } from 'lottie-react'
// import { useRef, useEffect, useState } from 'react'
// import LottieCoins from '@/public/Lottie/LottieCoins.json'
// import { useAudio } from 'react-use'

// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle
// } from '@/components/ui/dialog'

// import { Button } from '../ui/button'
// import { useRightAnswerModal } from '@/store/use-rightanswer-modal'

// type Props = {
//     randomRightAudio: string,
//     randomRightImage: string,
//     randomRightMessage: string,
// }

// export const RightAnswerModal = ({
//     randomRightAudio,
//     randomRightImage,
//     randomRightMessage,
// }: Props) => {
//     const phoneRef = useRef<LottieRefCurrentProps>(null)
//     const { isOpen, close } = useRightAnswerModal()
//     const [isClient, setIsClient] = useState(false)

//     const [audio, state, controls] = useAudio({
//         src: randomRightAudio,
//         autoPlay: false
//     })

//     // Фикс для hydration ошибки
//     useEffect(() => {
//         setIsClient(true)
//     }, [])

//     // Управление аудио при открытии/закрытии
//     useEffect(() => {
//         if (isOpen) {
//             controls.play()
//         } else {
//             controls.pause()
//             controls.seek(0)
//         }
//     }, [isOpen, controls]) // ✅ Зависимости

//     if (!isClient) {
//         return null
//     }

//     return (
//         <>
//             {audio}
//             <Dialog open={isOpen} onOpenChange={close}>
//                 <DialogContent className='max-w-md'>
//                     <DialogHeader>
//                         <div className='items-center w-full justify-center mb-5'>
//                             <Lottie 
//                                 className="h-50 w-50"
//                                 animationData={LottieCoins} 
//                                 lottieRef={phoneRef}
//                                 loop={false}  
//                                 onComplete={() => {
//                                     phoneRef.current?.stop()
//                                     close()
//                                 }}
//                             />

//                             <Image 
//                                 src={randomRightImage}
//                                 alt='Mascot'
//                                 height={200}
//                                 width={200}
//                                 className="border-r-8 w-full mx-auto"
//                             />
//                         </div>
//                         <DialogTitle className='text-center font-bold text-2xl'>
//                             {randomRightMessage}
//                         </DialogTitle>
//                         <DialogDescription className='text-center text-base'>
//                             {/* Описание, если нужно */}
//                         </DialogDescription>   
//                     </DialogHeader>

//                     <DialogFooter className='mb-4'>
//                         <div className='flex flex-col gap-y-4 w-full'>
//                             <Button 
//                                 variant='dangerOutline' 
//                                 className='w-full' 
//                                 size='lg'
//                                 onClick={close}
//                             >
//                                 +
//                                 <Lottie 
//                                     className="h-14 w-14 mr-2 pb-2"
//                                     animationData={LottieCoins} 
//                                 />
//                             </Button>
//                         </div>
//                     <Button onClick={close} variant="ghost" className="absolute right-4 top-4">
//                         ✕
//                     </Button>

//                     </DialogFooter>
                    
//                 </DialogContent>
//             </Dialog>    
//         </>
//     )
// }