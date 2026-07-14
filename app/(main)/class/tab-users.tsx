'use client'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import { allTypesCT, challengeProgress, courses, t_challengeOptions } from "@/db/schema";
import { CheckListUsers } from "./check-list-users";


type Props = {    
    allUsers: {
        userId: string;
        userName: string;
        userImageSrc: string;
        points: number;
        classId: number | null;
    }[],

    allClasses: {
        id: number;
        title: string;
        imageSrc: string;
    }[],


    t_courses: {
        id: number;
        title: string;
        imageSrc: string;
    }[],

    t_units:
    {
        id: number;
        title: string;
        description: string;
        imageSrc: string;
        t_courseId: number;
        order: number;
        t_lessons: {
            id: number;
            title: string;
            order: number;
            t_unitId: number;
            t_challenges: {
                imageSrc: string;
                numRans: string;
                difficulty: string;
                id: number;
                points: number;
                order: number;
                type: allTypesCT;

                question: string;
                author: string;
                t_lessonId: number;
                t_challengeOptions: typeof t_challengeOptions.$inferSelect[],
            }[];}[]
    }[],
    



    // для HW компонента TabTCoursesHW

    all_t_lessonProgress: {
        id: number;
        userId: string;
        doneRight: number;
        dateDone: Date;
        t_lessonId: number;
        doneRightPercent: number;
        doneWrong: number;
        trainingPts: number;
    }[],

    allClassHW: {
        id: number;
        classId: number;
        task: string | null;
        taskTrainer: string | null;
        dateHw: Date;
    }[] | null,

   
    challengeProgress: {
        id: number;
        userId: string;
        challengeId: number;
        completed: boolean;
        doneRight: boolean;
        dateDone: Date;
    }[],

    courses: typeof courses.$inferSelect[],   
    

    units:
    {
        id: number;
        title: string;
        description: string;
        imageSrc: string;
        courseId: number;
        order: number;
        lessons: {
            id: number;
            title: string;
            order: number;
            unitId: number;
            challenges: {
                imageSrc: string;
                // numRans: string;
                difficulty: string;
                id: number;
                points: number;
                order: number;
                type: allTypesCT;
                question: string;
                author: string;
                lessonId: number;

                challengeProgress: typeof challengeProgress.$inferSelect[],
            }[];}[]
    }[],

    }

  

    export const    TabUsers = ({
        allUsers,
        allClasses,
        

        t_courses,
        t_units,

        all_t_lessonProgress,
        allClassHW,

        challengeProgress, 
        
        courses,
        units,


    }: Props) => {


return(

    <div className="flex pt-10">
        

        <Tabs defaultValue={allClasses[0].title} className="pt-5      flex items-center flex-col relative ">
    

            {/*  Табуляция наверху (выбор класса)   */}
            <TabsList>
            {
                allClasses.map((cur_class, index) => (
                    <TabsTrigger key={index*4142} value={cur_class.title}>
                         {cur_class.title}
                    </TabsTrigger>
                )) 
            }
            </TabsList>
        



            {/*  Отображаем ВЫБРАННЫЙ класс */}
            
            {allClasses.map((cur_class, indexCourse) => {

                const usersThisClass = allUsers.filter(user=>user.classId == cur_class.id)
                
                return (

                <TabsContent key={indexCourse*123} value={cur_class.title} className="pt-10">                    
                    
                    <CheckListUsers 
                    key={indexCourse * 98633}
                    //
                    // И ТАМ ВНУТРИ КОМПОНЕНТ TabTCoursesHW ДЛЯ HW
                    //
                        usersThisClass={usersThisClass}
                        
                        // для отправки ДЗ конкретному классу
                        cur_class_id={cur_class.id}

                        // для статистики в таблице Учеников
                        all_t_lessonProgress={all_t_lessonProgress}
                        allClassHW={allClassHW}

                        challengeProgress={challengeProgress}

                        // для HW компонента TabTCoursesHW trainer
                        t_courses={t_courses} 
                        t_units={t_units} 

                        // для HW компонента TabTCoursesHW
                        courses={courses} 
                        units={units} 
                    />



                </TabsContent>

            )}
            
            
            
            )}










            

        </Tabs>

    </div>

)
}

// export default TabTCoursesHW



