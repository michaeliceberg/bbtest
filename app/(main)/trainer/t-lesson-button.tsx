// "use client"

// import Link from "next/link";
// import { AlignJustify, Cake, Check, CircleCheck, CircleCheckBig, CircleX, Crown, Layers, Skull, Star, StickyNote } from "lucide-react";
// import { CircularProgressbarWithChildren } from "react-circular-progressbar";

// import 'react-circular-progressbar/dist/styles.css'

// import { cn } from "@/lib/utils";
// import { Button

//  } from "@/components/ui/button";

//  interface lessonDone {
//     lesson: number;
//     done: number[];
// }

// type Props = {
//     id: number;
//     index: number;
//     totalCount: number;
//     locked?: boolean;
//     // current?: boolean;
//     // percentage: number;
//     title: string;
//     lessonStat?: Array<lessonDone>;

//     TRatingUsers: {
//         t_lesson_id: number;
//         usersSortedStat: {
//             DRP: number,
//             DR_DRP: number;
//             user_id: string | undefined;
//             user_name: string | undefined;
//         }[];
//     }[],

// }

// export const TLessonButton = ({
//     id,
//     index,
//     totalCount,
//     locked,
//     // current,
//     // percentage,
//     title,
//     lessonStat,
//     TRatingUsers,
// }: Props)=>{






// const cycleLength = 8
// const cycleIndex = index % cycleLength

// let indentationLevel

// if (cycleIndex <= 2){
//     indentationLevel = cycleIndex
// } else if (cycleIndex <= 4){
//     indentationLevel = 4 - cycleIndex
// } else if (cycleIndex <= 6) {
//     indentationLevel = 4 - cycleIndex
// } else {
//     indentationLevel = cycleIndex - 8
// }
//     const rightPosition = indentationLevel * 40

//     const isFirst = index === 0
//     const isLast = index === totalCount
//     const isCompleted = !locked
//     // const isCompleted = !current && !locked && false
//     // const Icon = isCompleted ? Check 
//     //             : isLast ? Crown 
//     //             : Star

//     const Icon = title.slice(-1) === '3' ? Skull 
//         : title.slice(-1) === '4' ? Cake 
//         : isLast ? Crown 
//         : Star

//     const href = isCompleted ? `/lesson/${id}` : "/lesson"
//     // const href = `/lesson/${id}`
    









//     // // const currentLSTAT = TRatingUsers
//     // let DR_thisL_thisU = 0
//     // //
//     // if (TRatingUsers.filter(el=>el.t_lesson_id == t_lesson.id)[0]) {
//     //     let usersSortedStat_inThisLesson = TRatingUsers.filter(el=>el.t_lesson_id == t_lesson.id)[0].usersSortedStat.filter(el=>el.user_id == user_id)
//     //     ratingPosition_inThisLesson = usersSortedStat_inThisLesson.findIndex(x => x.user_id === user_id) + 1;

//     //     // DR_thisL_thisU = usersSortedStat_inThisLesson.filter(x => x.user_id === user_id)[0].DR;

//     //     usersSortedStat_inThisLesson.filter(x => x.user_id === user_id) instanceof Array 
//     //     ? DR_thisL_thisU = usersSortedStat_inThisLesson.filter(x => x.user_id === user_id)[0]?.DRP
//     //     : DR_thisL_thisU = 0
//     // }




//     const currentLessonStat = lessonStat.filter((el) => el.lesson === id)
//     const percentage = (currentLessonStat[0].done[1]
//                         + currentLessonStat[0].done[2])
//                         / currentLessonStat[0].done[0]
//                         * 100

//     return( 
//     <Link 
//         href={href} 
//         aria-disabled={locked} 
//         style={{pointerEvents: locked?"none":"auto"}}
//         >
//             <div className="relative flex flex-1" style={{
//                 right: `${-20 + rightPosition}px`,
//                 marginTop: isFirst && !isCompleted ? 60 : 24,
//                 }}
//             >
//                 { 1 ? (
//                     <div className="h-[102px] w-[102px] relative">
     
//                         <CircularProgressbarWithChildren
//                             value={Number.isNaN(percentage) ? 0:percentage}
//                             styles={{
//                                 path:{
//                                     stroke: "#4ade80",
//                                     },
//                                 trail:{
//                                     stroke: "#e5e7eb",
//                                     },
                                
//                             }}
//                         >
//                             <Button
//                                 size='rounded'
//                                 variant={locked ? "locked" : "secondary"}
//                                 className="h-[70px] w-[70px] border-b-8"
//                             >
//                                 <Icon
//                                     className={cn(
//                                         "h-10 w-10",
//                                         locked
//                                         ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
//                                         : "fill-primary-foreground text-primary-foreground",
//                                         // isCompleted && "fill-none stroke-[4]"
//                                         isCompleted && "fill-none stroke-[2]"
//                                     )}
//                                 />
//                             </Button>
//                         </CircularProgressbarWithChildren>
//                     </div>
//                 ): (
//                     <Button
//                         size='rounded'
//                         variant={locked?"locked" : "secondary"}
//                         className="h-[70px] w-[70px] border-b-8"
//                     >
//                         <Icon
//                             className={cn(
//                                 "h-10 w-10",
//                                 locked
//                                 ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
//                                 : "fill-primary-foreground text-primary-foreground",
//                                 // isCompleted && "fill-none stroke-[4]"
//                                 isCompleted && "fill-none stroke-[2]"
//                             )}
//                         />
//                     </Button>
//                 )}   

//             <div className="pt-8 hover:translate-x-4 transition-transform duration-500 ease-in-out">
//                 <div>
//                     <h1 className="px-3 py-0.5 border-2 font-bold text-green-500 bg-white rounded-xl tracking-white z-10">
//                     {title}                
//                     </h1>
//                 </div>    
//             <div>
//                 <h1 className="px-3 py-0.5 font-bold text-green-500 bg-white rounded-xl tracking-white z-10">
               
//                     <div className="flex flex-1">
//                         {currentLessonStat[0].done[1] > 0 && 
//                             <div className="flex mr-1">
//                                 <CircleCheckBig className='h-5 w-5 stroke-2 text-green-500 mr-1' />
//                                 <p className='mr-2 text-green-500 text-center font-bold '>{currentLessonStat[0].done[1]}</p>
//                         </div>
//                         }

//                         {currentLessonStat[0].done[2] > 0 && 
//                             <div className="flex mr-1">
//                                 <CircleX className='h-5 w-5 stroke-2 text-rose-500 mr-1' />
//                                 <p className='mr-2 text-rose-500 text-center font-bold '>{currentLessonStat[0].done[2]}</p>
//                         </div>
//                         }

//                         {currentLessonStat[0].done[0] > 0 && 
//                             <div className="flex mr-1">
//                                 <Layers className='h-5 w-5 stroke-2 text-neutral-400 mr-1' />
//                                 <p className='text-neutral-400 mr-2 text-center font-bold '>{currentLessonStat[0].done[0]}</p>
//                         </div>
//                         }

//                     </div>
                
//                 </h1>
//             </div>    
//             </div>

//             </div>
          
//     </Link>)
// }