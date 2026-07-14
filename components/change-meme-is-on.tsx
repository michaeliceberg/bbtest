'use client'

import {useState, useTransition} from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { upsertIsOnMeme, upsertUserName } from '@/actions/user-progress';
import { toast } from 'sonner';
import { NewSelect } from './new-select'
import Image from 'next/image';
import { Headphones, Volume, Volume2, VolumeX } from 'lucide-react';


type Props= {
    isOnMeme: number
    // isOnMeme: boolean
}





export const ChangeMemeIsOn = ({
    isOnMeme
}: Props) => {


    const [pending, startTransition] = useTransition()

    const [isOnMemeState, setIsOnMemeState] = useState(isOnMeme);

    const onButtonPress = () => {

        setIsOnMemeState(isOnMemeState == 1 ? 0 : 1)

        startTransition(()=> {
            if (pending) return;
            
            upsertIsOnMeme(isOnMemeState == 1 ? 0 : 1)
            .catch(()=>toast.error('Что-то пошло не так! Попробуйте ещё раз'))
        })
        
    }

   

    return (
        <>

            <p>
                Звуки мемов:
            </p>



            <Button 
                onClick={onButtonPress}
                type="submit"
            >
                { isOnMemeState 
                ? <Volume2 className='h-6 w-6 text-muted-foreground' /> 
                : <VolumeX className='h-6 w-6 text-muted-foreground' />
                    
                }

            </Button> 


            <Image
                        // className='animate-spin'
                        src= {isOnMemeState ? "/MemesImage/Troll-happy-face.svg":"/MemesImage/Troll-sad-face.svg"}
                        alt='troll-face'
                        height={40}
                        width={40}
            />   

        </>
    )
}