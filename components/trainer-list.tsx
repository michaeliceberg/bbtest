'use client'


import { t_challenges, t_lessonProgress } from '@/db/schema'
import React from 'react'
import { Block } from './block'
import { motion, useAnimationControls } from 'framer-motion'
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { Button } from './ui/button'
import { ArrowUpRight, ToyBrick } from 'lucide-react'

type Props = {
    t_lesson: { 
        id: number; 
        title: string; 
        order: number; 
        t_unitId: number; 
        t_challenges: typeof t_challenges.$inferSelect[]
        
    },
    t_lessonProgress: typeof t_lessonProgress.$inferSelect[],
    
    TRatingUsers: {
        t_lesson_id: number;
        usersSortedStat: {
            DRP: number,
            DR_DRP: number;
            user_id: string | undefined;
            user_name: string | undefined;
        }[];
    }[],
    
    user_id: string,
    index: number,
    
}






export const TrainerLessonItem = ({
    t_lesson,
    t_lessonProgress,
    TRatingUsers,
    user_id,
    index,
} : Props) => {


    // console.log(TRatingUsers)
    const controls = useAnimationControls()
    const controls_small = useAnimationControls()

    // const {totalPercentDR, totalDR} = GetTLessonStat(t_lessonProgress, t_lesson.id)


    let ratingPosition_inThisLesson = -1
    let DR_thisL_thisU = 0
    //
    if (TRatingUsers.filter(el=>el.t_lesson_id == t_lesson.id)[0]) {
        let usersSortedStat_inThisLesson = TRatingUsers.filter(el=>el.t_lesson_id == t_lesson.id)[0].usersSortedStat.filter(el=>el.user_id == user_id)
        ratingPosition_inThisLesson = usersSortedStat_inThisLesson.findIndex(x => x.user_id === user_id) + 1;

        // DR_thisL_thisU = usersSortedStat_inThisLesson.filter(x => x.user_id === user_id)[0].DR;

        usersSortedStat_inThisLesson.filter(x => x.user_id === user_id) instanceof Array 
        ? DR_thisL_thisU = usersSortedStat_inThisLesson.filter(x => x.user_id === user_id)[0]?.DRP
        : DR_thisL_thisU = 0
    }


    const hoverHandleStart = () => {
        controls.start("flip")
        // controls.start("flip_small")
    }
    const hoverHandleEnd = () => {
        controls.start("initial")
        // controls.start("initial_small")
    }





    return (




        <div className=
                'flex justify-between mt-3 border-2 border-slate-100 rounded-xl '
        >


            <div className='flex'>

                <p className='m-2'>
                            #{index+1}
                </p>

                <p className=
                    {
                        DR_thisL_thisU > 90 
                        ? 'bg-green-400/90 text-white font-bold h-full m-auto align-middle pt-2 pl-2 pr-2 rounded-r-xl'
                    
                        : DR_thisL_thisU > 50
                        ? 'bg-amber-500/90 text-white font-bold h-full m-auto align-middle pt-2 pl-2 pr-2 rounded-r-xl'

                        : 'bg-pink-500/90 text-white font-bold h-full m-auto align-middle pt-2 pl-2 pr-2 rounded-r-xl'

                    
                    } 
                >
                    {DR_thisL_thisU}%
                </p>

            </div>



            <p className='mt-2'>
                        {t_lesson.title}
            </p>

            <Button
                variant=
                { DR_thisL_thisU > 90 
                    ? 'trainer_best'

                    : DR_thisL_thisU > 50
                    ? 'trainer_better'

                    : 'trainer_bad'
                }
                
                onClick={()=>window.location.href = `/t-lesson/${t_lesson.id}`}
                className=''   
            >
                {/* <p className='text-lg'>
                    <ToyBrick />
                </p> */}
                <div className='text-lg'>
                    <ToyBrick />
                </div>
            </Button>
        </div>


        // <motion.ul 

        //     onHoverStart={hoverHandleStart}
        //     onHoverEnd={hoverHandleEnd}
        //     whileTap={{ scale: 0.9 }}
        //     // whileInView={{ opacity: 1 }}

        //     className="grid grid-cols-9 justify-between gap-y-9 mb-4 cursor-pointer">

            

        //     <Block 
                
        //         variants={{
        //             initial: {
        //                 rotate: "0deg",
        //                 scale: 1,
        //                 boxShadow: "0px 0px #000",
        //             },
        //             flip: {
        //                 rotate: index % 2 == 0 ? "-1.5deg" : "1.5deg",
        //                 scale: 0.9,
        //                 boxShadow: "10px 10px #758277",
        //             },
        //         }}
        //         initial= "initial"
        //         animate= {controls}

        //         className='relative col-span-9  h-52'
        //     >

        //         <div className='ml-10 mr-10 mt-6 relative text-2xl flex justify-between z-0'>
        //             <p className='text-gray-500'>
        //                 #{index+1}
        //             </p>
        //             <p className='text-gray-500'>
        //                 {t_lesson.title}
        //             </p>                    
        //         </div>



        //         <p className='absolute text-center bottom-16 left-1/2 -translate-x-1/2'>
        //             <Latex>
        //                     {t_lesson.t_challenges[0]?.question}
        //             </Latex>
        //         </p>



        //         <Block
        //             // variants={{
        //             //     initial: {
        //             //         rotate: "0deg",
        //             //         scale: 1,
        //             //     },
        //             //     flip: {
        //             //         rotate: index % 2 == 0 ? "3deg" : "-3deg",
        //             //         scale: 0.9,
        //             //     },
        //             // }}
        //             // initial= "initial"
        //             // animate= {controls}

                    
        //             className=
        //             {
        //                 index % 3 == 0 
        //                 ? "bg-violet-400/90 absolute bottom-0 left-1/2 -translate-x-1/2 w-11/12 h-8  z-10"
                        
        //                 : index % 2 == 0 
        //                 ? "bg-green-400/90 absolute bottom-0 left-1/2 -translate-x-1/2 w-11/12 h-8  z-10"
                        
        //                 : "bg-amber-400/90 absolute bottom-0 left-1/2 -translate-x-1/2 w-11/12 h-8  z-10"
        //             }
                    
        //         >
        //             <p className='text-white font-bold text-center mt-1'>
        //                 100%
        //             </p>
                    

        //         </Block>
        //         {/* <motion.div 

        //             // variants={{
        //             //     initial_small: {
        //             //         rotate: "0deg",
        //             //         scale: 1,
        //             //     },
        //             //     flip_small: {
        //             //         rotate: index % 2 == 0 ? "1.5deg" : "-1.5deg",
        //             //         scale: 0.9,
        //             //     },
        //             // }}
        //             // initial= "initial_small"
        //             // animate= {controls_small}
                
        //             className='absolute bottom-0 left-1/2 -translate-x-1/2 bg-green-400/90 w-5/6 h-28 rounded-t-xl z-10 '
        //         >
                 
        //             <p className='text-white pt-5 font-bold text-center'>
        //                 20%
        //             </p>
                
        //         </motion.div> */}

        //     </Block>


        //     {/* <li key={1012} className="col-span-4 flex justify-center ">

        //         <p className=''>{t_lesson.title.split(/((?:\w+ ){5})/g).filter(Boolean).join("\n")}</p>

        //     </li> */}




        //     {/* <li key={1013} className="col-span-3 flex justify-center ">

        //         <Button 
        //             className='ml-4'
        //             size='sm' 
        //             variant='primary'
        //             onClick={()=>window.location.href = `/t-lesson/${t_lesson.id}`}
        //             >
        //                 <CornerRightUp />
        //         </Button>

        //     </li> */}
        // </motion.ul>

           




    )
}


