'use client'

import Example from "@/components/hover-me";
import HTMLContent from "@/components/motion-number";
import { FlipLink } from "@/components/reveal-links";
import { TypeTextEffect } from "@/components/type-text-effect";
import { t_lessonProgress, t_units } from "@/db/schema";
import UsePresenceDataComp from "./slider-com";
import UsePresenceDataComponent from "./slider-component";




type Props = {
    t_course_title: string;
    description: string;
    imgSrc: string;
    id: number;
    percentageDone: number;

    t_course_id: number,
    t_units: typeof t_units.$inferSelect[]
    
    t_lessonProgress: typeof t_lessonProgress.$inferSelect[]
    CourseStat: {
        listOfMini: number[],
        courseTitle: string,
    }[],


}






export const TCourseBanner = ({
    t_course_title,
    description,
    imgSrc,
    id,
    percentageDone,

    t_course_id,
    t_units,
    t_lessonProgress,
    CourseStat,
    
}: Props)=>{

    
    const thisCourseStat = CourseStat.filter(el => el.courseTitle == t_course_title)[0]





    const averageDonePercent = thisCourseStat.listOfMini.reduce((a, b) => a + b) / thisCourseStat.listOfMini.length;

    return(

        <div className="mb-4  mx-auto text-center align-middle justify-center content-center">
         
            


            <div className="flex justify-between content-center mx-auto">

                <div className="text-2xl font-bold">
                    <FlipLink href="#">
                        {t_course_title.split(' ')[1]}
                    </FlipLink>
                </div>


                {/* <p className="text-sm pt-2 flex gap-x-1">
                    пройдено
                    <HTMLContent percent={Math.round(averageDonePercent*100)} />
                    %
                </p>                                   */}


                <div className="text-sm pt-2 flex gap-x-1">
                    <span>пройдено</span>
                    <HTMLContent percent={Math.round(averageDonePercent*100)} />
                    <span>%</span>
                </div>


            </div>


            <div className="justify-center text-center align-middle mx-auto content-center">
                <UsePresenceDataComp />
            </div>

            
    
               

            

        </div> 
    )
}