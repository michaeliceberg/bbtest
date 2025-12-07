// import { challengeOptions, challenges } from "@/db/schema"
// import { cn } from "@/lib/utils"
// import { Card } from "./card"
// import { NoRightAnswer } from "@/components/hover-card"
// import { Lightbulb } from "lucide-react"
// import { Button } from "@/components/ui/button"



// type Props={
//     options: typeof challengeOptions.$inferSelect[]
//     onSelect: (id: number) => void
//     status: "correct" | "wrong" | "none"
//     selectedOption?: number
//     disabled?: boolean
//     type: typeof challenges.$inferSelect["type"]
//     isDoneWrongChallenge: boolean
//     isDoneChallenge: boolean
//     dateLastDone: Date
//     challengeId: number

// }

// export const Challenge = ({
//     options,
//     onSelect,
//     status,
//     selectedOption,
//     disabled,
//     type,
//     isDoneWrongChallenge,
//     isDoneChallenge,
//     dateLastDone,
//     challengeId,
// }: Props) => {



    
//     var dateNow = new Date()
// 	var diff = Math.abs(dateLastDone?.getTime() - dateNow.getTime());
// 	var daysHowLongAgo = Math.ceil(diff / (1000 * 3600 * 24)); 


//     return (

//         <div>

//         <div className={cn(
//             "grid gap-2",
//             // type === "ASSIST" && 'grid-cols-1',
//             // type === "ASSIST" && 'grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]',
//             type === "ASSIST" && 'grid-cols-2',
//             type === "SELECT" && 'grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]'
//         )}>
            
//             {/* {!isDoneChallenge &&  */}

            
//             {/* {(isNaN(daysHowLongAgo) || daysHowLongAgo > 1) && 
//                 (options.map((option, i)=>(
//                     <Card 
//                         key={option.id}
//                         id={option.id}
//                         text={option.text}
//                         imageSrc={option.imageSrc}
//                         shortcut={`${i + 1}`}
//                         selected={selectedOption === option.id}
//                         onClick={()=>onSelect(option.id)}
//                         status={status}
//                         audioSrc={option.audioSrc}
//                         disabled={disabled}
//                         type={type}
//                         isDoneWrongChallenge={isDoneWrongChallenge}
//                     />   
//                 )))
//             } */}


//             {/* РИСОВАТЬ ВАРИАНТЫ ОТВЕТОВ      ЕСЛИ ЗАДАЧА НЕ РЕШЕНА ИЛИ РЕШЕНА ДАВНО > 1 ДНЯ 
//             // 
//             //
//             */}
//             {(isNaN(daysHowLongAgo) || daysHowLongAgo > 1) ? 

            
//                 (
//                     options.map((option, i)=>(
//                     <Card 
//                         key={option.id}
//                         id={option.id}
//                         text={option.text}
//                         imageSrc={option.imageSrc}
//                         shortcut={`${i + 1}`}
//                         selected={selectedOption === option.id}
//                         onClick={()=>onSelect(option.id)}
//                         status={status}
//                         // audioSrc={option.audioSrc}
//                         disabled={disabled}
//                         type={type}
//                         isDoneWrongChallenge={isDoneWrongChallenge}
//                     />   
                    
//                 )))

                





//                 : (


//                     isDoneWrongChallenge 
//                         ? (    
//                                 <div className="text-sm lg:text-lg text-start font-bold text-rose-500 pt-10">
//                                     <h1>
//                                         Задача решена неверно!
//                                     </h1>
    
//                                     <h1>
//                                         Повторно можно решить завтра..
//                                     </h1>
//                                 </div>                         
//                         ) 
//                         :
//                     isDoneChallenge  
//                         && !isDoneWrongChallenge && (
//                                 <h1 className="text-sm lg:text-lg text-start font-bold text-green-500 pt-10">
//                                     Задача решена верно.
//                                 </h1>
//                         )
//                 )
//             }

// {/* <div className="w-full flex flex-1 justify-between"> */}
            
            
//         </div>





//         <div className="mx-auto flex items-center justify-between h-full">

//             <div>
//                 <NoRightAnswer challengeId = {challengeId}/>
//             </div>

//             <div>

//                 <Button 
//                     variant={!isDoneWrongChallenge ? "ghost" : "ghost"}
//                     className="h-[50px] w-[50px] mt-2">
//                     {/* className="h-[45px] w-[45px] border-b-8"> */}

//                     <Lightbulb
//                         className={cn(
//                             "h-14 w-14",
//                             (!isDoneWrongChallenge)
//                             ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
//                             : "fill-primary-foreground text-primary-foreground",
//                             // isCompleted && "fill-none stroke-[4]"
//                             (!isDoneWrongChallenge) && "fill-none stroke-[3]"
//                         )}
//                     />

//                 </Button>


//         </div>

// </div>




//         </div>

//     )
// }