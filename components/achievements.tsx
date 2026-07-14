'use client'

import Image from "next/image"
import { Button } from "./ui/button"
import Link from "next/link"
import LottieAnimationFine from '@/public/LottieProgressFine.json'
import LottieAnimationLate from '@/public/LottieProgressLate.json'
import LottieKapiGood1 from '@/public/Lottie/LottieKapiGood1.json'
import LottieKapiCry from '@/public/Lottie/LottieKapiCry.json'
import LottieKapiAngry from '@/public/Lottie/LottieKapiAngry.json'
import LottieKapiSad1 from '@/public/Lottie/LottieKapiSad1.json'




import Lottie from "lottie-react"
import { Separator } from "./ui/separator"

type Props= {

}

export const Achievement = ({

}: Props) => {

  
    const AchievementList = [
        {
            got: false,
            imgSrcOn: "/AchievementPng/AchievementBulb.png", 
            imgSrcOff: "/AchievementPng/AchievementBulbBW.png", 
            title: "C почином!",
            description: "Решили первую задачу",
        },
        {
            got: false,
            imgSrcOn: "/AchievementPng/AchievementFrog.png", 
            imgSrcOff: "/AchievementPng/AchievementFrogBW.png", 
            title: "Лидер",
            description: "Лидер недели",
        },
        {
            got: false,
            imgSrcOn: "/AchievementPng/AchievementHW.png", 
            imgSrcOff: "/AchievementPng/AchievementHWBW.png", 
            title: "Домосед",
            description: "Выполнили 20 ДЗ подряд",
        },
        {
            got: false,
            imgSrcOn: "/AchievementPng/AchievementMoney.png", 
            imgSrcOff: "/AchievementPng/AchievementMoneyBW.png", 
            title: "Толстосум",
            description: "У вас больше всех монет",
        },
        {
            got: false,
            imgSrcOn: "/AchievementPng/AchievementPizza.png", 
            imgSrcOff: "/AchievementPng/AchievementPizzaBW.png", 
            title: "Обжора",
            description: "Заказали пиццу",
        },
        {
            got: true,
            imgSrcOn: "/AchievementPng/AchievementWatermelon.png", 
            imgSrcOff: "/AchievementPng/AchievementWatermelonBW.png", 
            title: "Арбуз",
            description: "Вы просто арбуз",
        },
        {
            got: false,
            imgSrcOn: "/AchievementPng/Achievement100.png", 
            imgSrcOff: "/AchievementPng/Achievement100BW.png", 
            title: "100%",
            description: "Решили весь задачник",
        },

    ]

    const AchievementsDone = AchievementList.filter(achievement => achievement.got)
    const AchievementsNotDone = AchievementList.filter(achievement => !achievement.got)

  return (
    <div className="border-2 rounded-xl p-4 space-y-4">
        <div className="space-y-2">
            <h3 className="font-bold text-lg text-center"> 
                Достижения ({AchievementList.filter(el=>el.got).length}/{AchievementList.length})
            </h3>
            {/* <div className="flex items-center gap-x-4"> */}
            {/* <div className="flex items-center"> */}

                {/* <div className='pt-2 grid grid-cols-2 gap-2 justify-between'> */}
                <div className='pt-5 grid grid-cols-2 gap-2 '>

                
                    {   
                        AchievementsDone.map((achievement, index)=> (                          
                            <div key={index*173}>
                                <Image
                                    className="m-auto pb-2"                               
                                    src={achievement.got ? achievement.imgSrcOn : achievement.imgSrcOff}
                                    alt={achievement.title}
                                    height={60}
                                    width={60}
                                />
                                <Button
                                    className="w-full"
                                    variant={achievement.got ? 'secondaryOutline' : 'ghost'}
                                    size='sm'
                                >
                                    {achievement.title}
                                </Button>
                            </div>
                        ))
                    }

                    </div>
                        <Separator className="mb-4 h-0.5 rounded-full w-full" />
                    <div className='pt-5 grid grid-cols-2 gap-2 '>

                    {   

                        AchievementsNotDone.map((achievement, index)=> (                          
                            <div key={index*173}>
                                <Image
                                    className="m-auto pb-2"                               
                                    src={achievement.got ? achievement.imgSrcOn : achievement.imgSrcOff}
                                    alt={achievement.title}
                                    height={60}
                                    width={60}
                                />
                                <Button
                                    className="w-full"
                                    variant={achievement.got ? 'secondaryOutline' : 'ghost'}
                                    size='sm'
                                >
                                    {achievement.title}
                                </Button>
                            </div>
                        ))
                    }

                

                </div>
                        {/* <div className="items-center">
                            <h3 className="font-bold text-lg text-center"> 
                                {sendMsg}
                            </h3>

                            <Button variant={isLate ? 'isLate' : 'isNotLate'} className="w-full">
                                {YourDaysLate}
                            </Button>

                            <h3 className="font-bold text-lg text-center"> 
                                {finalWord}                
                            </h3>
                        </div> */}

            {/* </div> */}
        {/* <p className="text-muted-foreground">
            Будете готовы к экзамену 
        </p> */}
        </div>
   
   
   


    </div>
  )
}
