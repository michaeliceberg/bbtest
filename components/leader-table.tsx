'use client'

import { Button } from "./ui/button";
import LottieNumber0 from '@/public/Lottie/fireNumbers/LottieNumber0.json'
import LottieNumber1 from '@/public/Lottie/fireNumbers/LottieNumber1.json'
import LottieNumber2 from '@/public/Lottie/fireNumbers/LottieNumber2.json'
import LottieNumber3 from '@/public/Lottie/fireNumbers/LottieNumber3.json'
import LottieNumber4 from '@/public/Lottie/fireNumbers/LottieNumber4.json'
import LottieNumber5 from '@/public/Lottie/fireNumbers/LottieNumber5.json'
import LottieNumber6 from '@/public/Lottie/fireNumbers/LottieNumber6.json'
import LottieNumber7 from '@/public/Lottie/fireNumbers/LottieNumber7.json'
import LottieNumber8 from '@/public/Lottie/fireNumbers/LottieNumber8.json'
import LottieNumber9 from '@/public/Lottie/fireNumbers/LottieNumber9.json'
import Lottie from "lottie-react";
import { Avatar, AvatarImage } from "./ui/avatar";
import LottieCoins from '@/public/Lottie/LottieCoins.json'
// import { sendMessageToTelegram } from "@/utils/telegram";
// import { useEffect } from "react";


interface progressDaysType {

    date: Date;
    pts: number;
    ptsGotToday: number;
    hwInARow: number;
    selfDoneRight: number;

}[]

type Props= {
    ResultLeaderTable:  {
        userName: string | undefined;
        progressDays: progressDaysType[];
        userImageSrc: string | undefined;
        lastFourDaysProgress: 
        {
            ptsGotToday: number;
            hwInARow: number;
            selfDoneRight: number;
        }[]
    }[]
}


export function TableLeader({ResultLeaderTable}: Props) {
    








    
    // // Фильтруем ТОЛЬКО ТЕХ пользователей, у кого ЕСТЬ прогресс в ЭТОМ учебнике
    // //
    // ResultLeaderTable = ResultLeaderTable.filter(el => el.progressDays.length > 0)



    const numbersLottieList = 
    [
        LottieNumber0,
        LottieNumber1,
        LottieNumber2,
        LottieNumber3,
        LottieNumber4,
        LottieNumber5,
        LottieNumber6,
        LottieNumber7,
        LottieNumber8,
        LottieNumber9,
    ]

    var today = new Date();
    // var dd:number = today.getDate();
    // var mm:number = today.getMonth()+1; 
    // var yyyy:number = today.getFullYear();

    let dateList : string[];
    dateList = []
    //  
    for (let i = 0; i <= 2; i++) {
        let dd:number = today.getDate()-i;
        let mm:number = today.getMonth()+1; 
        // let yyyy:number = today.getFullYear();
        let TodayStr = dd + "."  + mm
        dateList.push(TodayStr);
    }
   
    
    return (

        <div>
           

            <ul className="grid grid-cols-8 gap-y-4 ">


                <li className="col-span-3 flex justify-center ">

                </li>

                

                <li className="flex justify-center">
                    <p className="text-sm content-center">
                        
                    </p>    
                </li>


                
                <li className="flex justify-center">
                       
                    <Lottie 
                        className="h-16 w-16 pb-4 content-center" 
                        animationData={LottieCoins}
                        loop={false}
                    /> 

                </li>


                <li className="flex justify-center">
                    <p className="text-sm content-center">
                        сегодня
                    </p>    
                </li>
                <li className="flex justify-center">
                    <p className="text-sm content-center">
                        {dateList[1]}
                    </p>    
                </li>
                <li className="flex justify-center">
                    <p className="text-sm content-center">
                        {dateList[2]}
                    </p>    
                </li>


                {/* рендерим АВАТАРКИ ПОЛЬЗОВАТЕЛЕЙ */}

                {ResultLeaderTable.map((cur_user_stat, index) => (
                    <>
                        <li key={index}>
                            <Button className="w-full" variant='ghost' size='leader'>
                                <div className="flex flex-1 justify-between items-center">
                                    <div>
                                        <h1>{index + 1}</h1> 
                                    </div>
                                    <div>
                                        <Avatar
                                            >
                                            <AvatarImage 
                                                className="object-cover"
                                                src={cur_user_stat.userImageSrc}
                                            />
                                        </Avatar>  
                                    </div>
                                </div>
                            </Button>

                        </li>

                        <li className="col-span-2 flex justify-center" key={index*1019}>
                            <p className="text-lg font-bold content-center">
                                {cur_user_stat.userName}
                            </p>
                        </li>



                        {/* STREAK */}
                           
                        <li className="hover:-translate-y-2 transition-transform duration-500 ease-in-out" key={index*107}>
                            
                            
                            {cur_user_stat.lastFourDaysProgress[0].hwInARow > 0 && 
                                <Lottie 
                                    className="h-16 w-16 pb-4" 
                                    animationData={numbersLottieList[ cur_user_stat.lastFourDaysProgress[0].hwInARow ]}
                                    // loop={false}
                                /> 
                            }
                            {/* <Button className="w-full" variant={'ghost' } size='leader'>

                                               
                                                                        
                                    <Avatar>
                                        <AvatarImage 
                                            className="object-cover"
                                            src={numbersLottieList[ cur_user_stat.lastFourDaysProgress[0].hwInARow ]}
                                        />
                                    </Avatar>  
                                    
                            </Button> */}
                        </li>



                        {/* СКОЛЬКО ВСЕГО МОНЕТ */}

                        <li className="hover:-translate-y-2 transition-transform duration-500 ease-in-out" key={index*9148}>
                            <Button className="w-full" variant={'ghost' } size='leader'>
                                    <div>
                                        {cur_user_stat.progressDays[0].pts}                                        
                                    </div>                              
                            </Button>
                        </li>


                        
                            {/* <Lottie 
                                className="h-16 w-16 pb-4" 
                                animationData={LottieNumber1}
                                // loop={false}
                            />  */}
                        {/* </li> */}



                    
                        {/* рендерим СТАТИСТИКУ ПОЛЬЗОВАТЕЛЕЙ */}

                        {
                            cur_user_stat.lastFourDaysProgress.map( (el, index) =>
                                <li className="hover:-translate-y-2 transition-transform duration-500 ease-in-out" key={index*9141}>
                                    <Button className="w-full" variant={index == 0 ? 'today' : 'ghost' } size='leader'>
                                        +{el.ptsGotToday}
                                    </Button>
                                </li>
                            )
                        }

                    </>
                ))}


            </ul>

      </div>
    )
  }
  