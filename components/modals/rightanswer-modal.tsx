'use client'

import Image from 'next/image'

import Lottie, {LottieRefCurrentProps} from 'lottie-react'
import {useRef} from 'react'
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
import { useEffect, useState } from 'react';
import { useAudio } from 'react-use'
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

    const {isOpen, close} = useRightAnswerModal()




    // let [
    //     correctAudio,
    //     _с,
    //     correctControls,
    // ] = useAudio({ src: randomRightAudio, 
    //     autoPlay: false 
    // })



    const [isClient, setIsClient] = useState(false)
    
    
    // useEffect(()=>{
    //     setIsClient(true)
    //     correctControls.play()
    // },[]) 
    
    // useEffect(() => {
    //     if (isOpen) {
    //       correctControls.play()
    //     }
    //   }, [isOpen])
    
    


    useEffect(() => {
        if (isOpen) {
          const audio = new Audio(randomRightAudio)
          audio.play()
        }
      }, [isOpen])




    // БЕЗ этого ПОЧЕМУ-то Hydration ERROR

    if (!isClient){
        return null
    }


     

    return (
        <>
        {/* {correctAudio} */}

        <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                {/* <div className='flex items-center w-full justify-center mb-5'> */}
                <div className='items-center w-full justify-center mb-5'>




                        <Lottie className="h-50 w-50"
                            animationData={ LottieCoins } 
                            lottieRef={ phoneRef }
                            loop={false}  
                            //
                            // автоматичесски ЗАКРЫТЬ МОДАЛЬНОЕ ОКНО ПОСЛЕ stop Окончания Lottie
                            //
                            onComplete={()=>{
                                phoneRef.current?.stop
                                close()
                            }}
                        />

            <Image 
            src={randomRightImage}
            // src='/memes/mem-wrong-sharish.jpeg'
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
                  
                    </DialogDescription>   
                </DialogHeader>

                <DialogFooter className='mb-4'>
                    <div className='flex flex-col gap-y-4 w-full'>
                        <Button 
                            variant='dangerOutline' 
                            className='w-full' 
                            size='lg' 
                        >
                            +

                            <Lottie className="h-14 w-14 mr-2 pb-2"
                                animationData={ LottieCoins } 
                            />


                        </Button>
                        
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>    
        </>
    )
}