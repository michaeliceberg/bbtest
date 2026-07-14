import { CalendarIcon } from "lucide-react"
import LottieCoins from '@/public/Lottie/LottieCoins.json'


import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import Lottie from "lottie-react"
import Image from "next/image"

type Props = { 
    challengeId: number
}

export function HoverCardRating({ challengeId }: Props) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>

        <Image 
            src='/RatingSvg/rating-ant.svg'
            alt='Mascot'
            height={30}
            width={30}
            className=" hidden lg:block"
        />
      
        {/* <Button variant='primaryOutline'>Нет правильного ответа?</Button> */}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>

          {/* <Image 
                src='/mascot.svg'
                alt='Mascot'
                height={60}
                width={60}
                className="hidden lg:block"
            />
             */}
            {/* <AvatarImage src="https://github.com/vercel.png" /> */}

            <AvatarImage src="/mascot.svg" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>


          <div className="space-y-1">
            {/* <h4 className="text-sm font-semibold">@nextjs</h4> */}
            <h4 className="text-sm font-semibold">
              Ничего себе!
            </h4>

            <p className="text-sm">
              напишите ваш ответ
              <br />
              в telegram:
              <br />
              @michaeldeve              
              <br />
              <br />
              и укажите № задания:
              <br />
              {challengeId}
            </p>
            
                  <div className="flex items-center pt-2">

                    {/* <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />{" "} */}
                    {/* <span className="text-xs text-muted-foreground"> */}
                    <span className="text-xs">
                        Получите вознаграждение!
                      </span>
                      <Lottie 
                            className="h-14 w-14 pb-4 opacity-70" 
                            animationData={LottieCoins}
                            loop={false}
                        /> 
                  </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
