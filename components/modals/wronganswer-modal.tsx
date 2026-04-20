'use client'

import Image from 'next/image'

import Lottie, {LottieRefCurrentProps} from 'lottie-react'
import {useEffect, useRef, useState} from 'react'

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
import { useAudio } from 'react-use'


const wrongLottieList = 
    [
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

    const {isOpen, close} = useWrongAnswerModal()



    // const [
    //     incorrectAudio,
    //     _i,
    //     incorrectControls,
    // ] = useAudio({ src: randomWrongAudio })



    const [isClient, setIsClient] = useState(false)
    
    // useEffect(()=>setIsClient(true),[]) 
    // // БЕЗ этого ПОЧЕМУ-то Hydration ERROR
    // if (!isClient){
    //     return null
    // }
    
    useEffect(() => {
        if (isOpen) {
          const audio = new Audio(randomWrongAudio)
          audio.play()
        }
      }, [isOpen])

    

    return (
        <>
        {/* {incorrectAudio} */}

        <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                {/* <div className='flex items-center w-full justify-center mb-5'> */}
                <div className='items-center w-full justify-center mb-5'>




                        <Lottie className="h-50 w-50"
                            animationData={ randomWrongLottie } 
                            lottieRef={phoneRef }
                            loop={false}  
                            onComplete={()=>{
                                phoneRef.current?.stop
                                close()
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
                    <DialogDescription className='text-center text-base'>
                  
                    </DialogDescription>   
                </DialogHeader>

                <DialogFooter className='mb-4'>
                    <div className='flex flex-col gap-y-4 w-full'>
                        <Button 
                            variant='dangerOutline' 
                            className='w-full' 
                            size='lg' 
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
        </>
    )
}