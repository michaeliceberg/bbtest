'use client'

import Image from "next/image"
import { Button } from "./ui/button"
import LottiePick from '@/public/Lottie/LottiePick.json'
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import Lottie from "lottie-react"

type Props= {

}

export const BuyMine = ({

}: Props) => {

  
    

  return (
   <div className="w-full flex">
             <Lottie 
                    className="h-20 w-20 pb-4" 
                    animationData={LottiePick}
                    // loop={false}
                /> 
				

                <div className="flex-1">
                    <p className="text-neutral-700 text-base lg:text-xl font-bold">
                        Построить рудник гемов 
                    </p>
                    <p className="text-neutral-700 text-sm lg:text-sm">
                        Каждый день будете получать +1 гем
                    </p>
                </div>
                <Button
                    
                    disabled={ 1===1
                    //     pending
                        
                    //     || points < 1290
                    }
                >
            
					<div className="flex items-center">

                    <Lottie 
                        className="h-16 w-16 pb-4" 
                        animationData={LottieCoins}
                        loop={false}
                    /> 

						<p>
							1990
						</p>
					</div>
              
                </Button>

                </div>
    )
  
}
