'use client'

// import Image from "next/image"
import { Button } from "./ui/button"
import Link from "next/link"
// import LottieAnimationFine from '@/public/LottieProgressFine.json'
// import LottieAnimationLate from '@/public/LottieProgressLate.json'
import LottieKapiGood1 from '@/public/Lottie/LottieKapiGood1.json'
// import LottieKapiCry from '@/public/Lottie/LottieKapiCry.json'
// import LottieKapiAngry from '@/public/Lottie/LottieKapiAngry.json'
import LottieKapiSad1 from '@/public/Lottie/LottieKapiSad1.json'
// import LottieTriangle3 from '@/public/Lottie/hints/Triangle3.json'
// import LottieCroco from '@/public/Lottie/characters/LottieCroco.json'

// import LegoDetail from '@/public/Lego/LegoDetail.json'
// import AETriangle from '@/public/Lottie/hints/AETriangle.json'


import Lottie from "lottie-react"

type Props= {
    YourDaysLate: number
    formattedDate: string
}

export const Promo = ({
    YourDaysLate,
    formattedDate,
}: Props) => {

    let sendMsg:string = ''

    const lastNumber:number = Math.abs(YourDaysLate) % 10
    let finalWord:string = ''
    if (lastNumber == 1) {
        finalWord = 'день'
    } else if ([2, 3, 4].includes(lastNumber)){
        finalWord = 'дня'
    } else if ([5, 6, 7, 8, 9, 0].includes(lastNumber)){ 
        finalWord = 'дней'
    }

    let isLate = false
    if (YourDaysLate > 0) {
	    sendMsg = "Опаздываете на"
        isLate = true
	} else {
		sendMsg = "Опережаете на" 
        YourDaysLate = - YourDaysLate
	}

  return (
    <div className="border-2 rounded-xl p-4 space-y-4">
        <div className="space-y-2">
            <div className="flex items-center gap-x-4">
                
            


                <Lottie 
                
                    // animationData={ isLate ? LottieTriangle3 : LottieTriangle3 } 
                    animationData={ isLate ? LottieKapiSad1 : LottieKapiGood1 } 
                className="h-20 w-20"
                />



                <div className="items-center">
                    <h3 className="font-bold text-lg text-center"> 
                        {sendMsg}
                    </h3>

                    <Button variant={isLate ? 'isLate' : 'isNotLate'} className="w-full">
                        {YourDaysLate}
                    </Button>

                    <h3 className="font-bold text-lg text-center"> 
                        {finalWord}                
                    </h3>
                </div>

            </div>
            <p className="text-muted-foreground">
                 Будете готовы к экзамену {formattedDate}
            </p>
        </div>
        <Button
            asChild
            className="w-full"
            variant='super'
            size='lg'
        >
            <Link href="/progress">
                Прогресс
            </Link>
        </Button>





    </div>
  )
}
