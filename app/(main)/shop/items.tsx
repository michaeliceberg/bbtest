'use client'

import { refillHearts } from "@/actions/user-progress"
import { createStripeUrl } from "@/actions/user-subscription"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useTransition } from "react"
import { toast } from "sonner"
import Lottie from "lottie-react"
import LottiePick from '@/public/Lottie/LottiePick.json'
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import LottieGems from '@/public/Lottie/LottieGems.json'





const POINTS_TO_REFILL = 10

type Props = {
    hearts: number
    points: number
    gems: number
    hasActiveSubscription: boolean
}

export const Items = ({
    hearts,
    points,
    gems,
    hasActiveSubscription
}: Props) => {

    const [pending, startTransition] = useTransition()

    const onRefillHearts = () => {
        if (pending || hearts === 5 || points < POINTS_TO_REFILL) {
            return
        }

        startTransition(()=>{
            refillHearts()
            .catch(()=>toast.error('Что-то пошло не так'))
        })
    }

    const onUpgrade = () => {
        startTransition(()=>{
            createStripeUrl()
            .then((response)=> {
                if (response.data) {
                    window.location.href = response.data
                }
            })
            .catch(() => toast.error('Что-то пошло не так!')) 
        })
    }

    return (
        <ul className="w-full">
           
        
            <div className="flex items-center w-full p-4 pt-8 gap-x-4 border-t-2">
                <Image
                    src="/heart.svg"
                    alt='Heart'
                    height={60}
                    width={60}
                />
                <div className="flex-1">
                    <p className="text-neutral-700 text-base lg:text-xl font-bold">
                        Восстановить жизни
                    </p>
                </div>

                <Button
                    onClick={onUpgrade}
                    disabled={pending || hasActiveSubscription}
                >

                    <div className="flex justify-center w-[80px] content-center">
                        <Lottie 
                            className="h-16 w-16 pb-4 content-center" 
                            animationData={LottieCoins}
                            loop={false}
                        /> 

                        <p className="content-center">
                            {POINTS_TO_REFILL}
                        </p>
                    </div>

                </Button>
            </div>




            <div className="flex items-center w-full p-4 pt-8 gap-x-4 border-t-2">
                {/* <Image
                    src="/heart.svg"
                    alt='Heart'
                    height={60}
                    width={60}
                /> */}
                <Lottie 
                    className="h-16 w-16 pb-4" 
                    animationData={LottiePick}
                    // loop={false}
                /> 

                <div className="flex-1">
                    <p className="text-neutral-700 text-base lg:text-xl font-bold">
                        Построить шахту гемов
                    </p>
                    <br />
                    <p className="text-neutral-700 text-sm lg:text-sm">
                        Каждый день получаете +1 гем
                    </p>
                </div>

                <Button
                    onClick={onUpgrade}
                    disabled={pending || hasActiveSubscription || points < 1290}
                >

                    <div className="flex justify-center w-[80px] content-center">
                        <Lottie 
                            className="h-16 w-16 pb-4 content-center" 
                            animationData={LottieCoins}
                            loop={false}
                        /> 

                        <p className="content-center">
                            1290
                        </p>
                    </div>

                </Button>
            </div>












            






            <div className="flex items-center w-full p-4 pt-8 gap-x-4 border-t-2">
                <Image
                    src="/dodoPizza.png"
                    alt='Heart'
                    height={60}
                    width={60}
                /> 
                

                <div className="flex-1">
                    <p className="text-neutral-700 text-base lg:text-xl font-bold">
                        Додо пицца (35см) с доставкой
                    </p>
                    <br />
                    <p className="text-neutral-700 text-sm lg:text-sm">
                        Заказ может сделать лидер этой недели
                    </p>
                </div>

                <Button
                    onClick={onUpgrade}
                    disabled={pending || hasActiveSubscription || gems < 10}
                >

                    <div className="flex justify-center w-[80px] content-center">
                        <Lottie 
                            className="h-8 w-8 pb-1" 
                            animationData={LottieGems}
                            loop={false}
                        /> 

                        <p className="content-center pl-4">
                            {POINTS_TO_REFILL}
                        </p>
                    </div>

                </Button>
            </div>




        </ul>
    )
}