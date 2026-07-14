// 'use client'

import { FeedWrapper } from "@/components/feed-wrapper"
import { StickyWrapper } from "@/components/sticky-wrapper"
import { ChangeNameInput } from "@/components/change-name"
import { Separator } from "@/components/ui/separator"
import { UserProgress } from "@/components/user-progress"
// import { getAllProgresses, getTopTenUsers, getUserProgress, getUserSubscription } from "@/db/queries"
import { getUserPointsHearts } from "@/usefulFunctions"
import Image from "next/image"
import { redirect } from "next/navigation"
import { TableLeader } from "@/components/leader-table"
import { ChangeMemeIsOn } from "@/components/change-meme-is-on"

const LeaderboardPage = async () => {

    // const userProgressData = getUserProgress()
    // const userSubscriptionData = getUserSubscription()
    // const leaderboardData = getTopTenUsers()

    // const gotAllProgresses = getAllProgresses()

    // const [
    //     userProgress,
    //     userSubscription,
    //     leaderboard,
    //     allProgresses
    // ] = await Promise.all([
    //     userProgressData,
    //     userSubscriptionData,
    //     leaderboardData,
    //     gotAllProgresses,
    // ])

 
    // //TODO: added
    // if (!userProgress || !userProgress.activeCourse) {
	// 	redirect('/courses');
	// }
    // //



    // const isPro = !!userSubscription?.isActive

    
    // const [Points, Hearts, Gems] = getUserPointsHearts(userProgress)









    // let BigTableLeader = allProgresses.map(cur_user_progress => {
  
    //     let progressForCourse = cur_user_progress.courseProgress

    //     if (progressForCourse instanceof Array) {
    //         let filteredCourseProgress = progressForCourse.filter(el => {
                
    //             // Фильтруем КНИГУ
    //             //
    //             if (el.course === userProgress.activeCourse?.title)
    //             {
    //                 return el
    //             }
    //         })

    //         // if (filteredCourseProgress[0]) {

    //             return (
    //                 {
    //                     userName: cur_user_progress.userName,
    //                     progressForCourse: filteredCourseProgress[0]?.progress,
    //                     userImageSrc: cur_user_progress.userImageSrc
    //                 })
    //             // }   

    //         }
                
            
            

    //     }
    // )


    // BigTableLeader = BigTableLeader.filter(el => el?.progressForCourse != undefined)





    // interface progressDaysType {
    //         date: Date;
    //         pts: number;
    //         ptsGotToday: number;
    //         hwInARow: number;
    //         selfDoneRight: number;
            
    //     }[]


	// let progressDays: Array<progressDaysType> = [];

   

    // var today = new Date();
    // var dd:number = today.getDate();
    // var mm:number = today.getMonth()+1; 
    // var yyyy:number = today.getFullYear();
    // var day1 = dd + "."  + mm + "." + yyyy
    // var day2 = dd - 1 + "."  + mm + "." + yyyy
    // var day3 = dd - 2 + "."  + mm + "." + yyyy
    // // var day4 = dd - 3 + "."  + mm + "." + yyyy


    // let ResultLeaderTable = BigTableLeader.map(nameAndProgress => {
    //     let progressThisBookDays = nameAndProgress?.progressForCourse
        
    //     if (progressThisBookDays instanceof Array) {
    //         progressDays = progressThisBookDays.map(day => {
    //            return {
    //                date: day.date,
    //                pts: day.pts,
    //                ptsGotToday: 0,
    //                hwInARow: day.hw[2] || 0,
    //                selfDoneRight: day.selfDoneRight,
    //            }
    //        } )
    //    }

    //    progressDays.sort((a,b) => (a.date < b.date) ? 1 : ((b.date < a.date) ? -1 : 0))
       
    //    for (let i = 0; i < progressDays.length - 1; i++) {
    //     progressDays[i].ptsGotToday = progressDays[i].pts -  progressDays[i+1].pts
    // }

    //    let [progDay_1] = progressDays.filter(el => el.date.toString() === day1)
    //    let [progDay_2] = progressDays.filter(el => el.date.toString() === day2)
    //    let [progDay_3] = progressDays.filter(el => el.date.toString() === day3)
    // //    let [progDay_4] = progressDays.filter(el => el.date.toString() === day4)
    
    //    let progDayTotable_1 = { day: day1, ptsGotToday: 0, hwInARow: 0, selfDoneRight: 0 }
    //    let progDayTotable_2 = { day: day2, ptsGotToday: 0, hwInARow: 0, selfDoneRight: 0 }
    //    let progDayTotable_3 = { day: day3, ptsGotToday: 0, hwInARow: 0, selfDoneRight: 0 }
    // //    let progDayTotable_4 = { day: day4, ptsGotToday: 0, hwInARow: 0, selfDoneRight: 0 }

    //    if (progDay_1 != undefined) {
    //     progDayTotable_1 = { day: day1, ptsGotToday: progDay_1.ptsGotToday, hwInARow: progDay_1.hwInARow, selfDoneRight: progDay_1.selfDoneRight }
    //    }   

    //    if (progDay_2 != undefined) {
    //     progDayTotable_2 = { day: day2, ptsGotToday: progDay_2.ptsGotToday, hwInARow: progDay_2.hwInARow, selfDoneRight: progDay_2.selfDoneRight }
    //    }   

    //    if (progDay_3 != undefined) {
    //     progDayTotable_3 = { day: day3, ptsGotToday: progDay_3.ptsGotToday, hwInARow: progDay_3.hwInARow, selfDoneRight: progDay_3.selfDoneRight }
    //    }   

    // //    if (progDay_4 != undefined) {
    // //     progDayTotable_4 = { day: day4, ptsGotToday: progDay_4.ptsGotToday, hwInARow: progDay_4.hwInARow, selfDoneRight: progDay_4.selfDoneRight }
    // //    }   


    // // let lastFourDaysProgress = [progDayTotable_1, progDayTotable_2, progDayTotable_3, progDayTotable_4]
    // let lastFourDaysProgress = [progDayTotable_1, progDayTotable_2, progDayTotable_3]


    //    return ({
    //         userName: nameAndProgress?.userName,
    //         progressDays: progressDays,
    //         userImageSrc: nameAndProgress?.userImageSrc,
    //         lastFourDaysProgress: lastFourDaysProgress,
    //    })
    // })



    return (
        <div className="flex flex-row-reverse gap-[48px] px-6">
            hello leaders
            {/* <StickyWrapper>
                <UserProgress 
                    activeCourse={userProgress.activeCourse}
                    hearts={Hearts}
                    points={Points}
                    gems={Gems}

                    hasActiveSubscription={isPro}
                />
            </StickyWrapper>
            <FeedWrapper>
                <div className="w-full flex flex-col items-center">
                    
                    <Image
                        src='/leaderboard.svg'
                        alt='Leaderboard'
                        height={90}
                        width={90}
                    />   
                    <h1 className="text-center font-bold text-neural-800 text-2xl my-6">
                        Таблица лидеров
                    </h1>
                    <p className="text-muted-foreground text-center text-lg mb-6">
                        Выполняй задания и зарабатывай очки
                    </p>

                    <Separator className="mb-4 h-0.5 rounded-full" />




                    <div className="flex w-full justify-center items-center space-x-2 pt-10">
                        <ChangeMemeIsOn 
                            isOnMeme = {userProgress.isOnMeme}
                        />
					</div>





                    <div className="flex w-full items-center space-x-2 pt-10 pb-10">
                        <ChangeNameInput 
                            placeholder = {userProgress.userName}
                            imageSrc = {userProgress.userImageSrc}
                            />
					</div>



                    <div className="pt-10 w-full">
                        <TableLeader ResultLeaderTable={ResultLeaderTable}/>
                    </div>


                </div>
            </FeedWrapper> */}
            
        </div>
    )
}

export default LeaderboardPage