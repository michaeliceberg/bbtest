'use client'

import Image from 'next/image'

import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle

} from '@/components/ui/dialog'


import { Button } from '../ui/button'
import { useExitModal } from '@/store/use-exit-modal'
import { useEffect, useState } from 'react';
import Lottie from 'lottie-react'
import LottieKapiThink from '@/public/Lottie/LottieKapiThink.json'


export const ExitModal = () => {
    const router = useRouter()
    const [isClient, setIsClient] = useState(false)
    const {isOpen, close} = useExitModal()
    useEffect(()=>setIsClient(true),[]) 
    if (!isClient){
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <div className='flex items-center w-full justify-center mb-5'>
                            {/* <Image
                            src='/mascot_sad.svg'
                            alt='Mascot'
                            height={80}
                            width={80}
                            /> */}
                    
                    <Lottie className="h-40 w-40"
                    animationData={ LottieKapiThink } 
            />

                    {/* <Lottie 
                    animationData={ LottieKapiThink } 
                    width={5}
                    height={5}
                    size={5}
                    
                /> */}
                    </div>
                    <DialogTitle className='text-center font-bold text-2xl'>
                        Не уходи!
                    </DialogTitle>
                    <DialogDescription className='text-center text-base'>
                        Вы собираетесь закончить урок, вы уверены?    
                    </DialogDescription>   
                </DialogHeader>

                <DialogFooter className='mb-4'>
                    <div className='flex flex-col gap-y-4 w-full'>
                        <Button 
                            variant='primary' 
                            className='w-full' 
                            size='lg' 
                            onClick={close}
                        >
                            Продолжить урок
                        </Button>
                        <Button 
                            variant='dangerOutline' 
                            className='w-full' 
                            size='lg' 
                            onClick={()=>{
                                close()
                                router.push('/learn')
                            }}
                        >
                            Закончить
                        </Button>
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>    
    )
}