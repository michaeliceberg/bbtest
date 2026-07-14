// import { lessons, units } from "@/db/schema";
// // import { TUnitBanner } from "./t-unit-banner";
// import { LessonButton } from "./lesson-button";


// interface lessonDone {
//     lesson: number;
//     done: number[];
// }

// type Props = {

//     id: number;
//     order: number;
//     title: string;
//     description: string;
//     lessons: (typeof lessons.$inferSelect & {
//         completed: boolean;
//     })[];
//     activeLesson: typeof lessons.$inferSelect & {
//         unit: typeof units.$inferSelect;
//     } | undefined;
//     // activeLessonPercentage: number;
//     lessonStat: Array<lessonDone>;
//     imgSrc: string;
//     percentageDone: number;
//     RecomNumChallengesToday: number;
// }

// export const Unit = ({
//     id,
//     order,
//     title,
//     description,
//     lessons,
//     activeLesson,
//     // activeLessonPercentage,
//     lessonStat,
//     imgSrc,
//     percentageDone,
//     RecomNumChallengesToday,
// }: Props) => {
//     return (
//         <>
//             <UnitBanner title={title} description={description} imgSrc={imgSrc} id={id} percentageDone={percentageDone}/>
//             <div className="flex items-center flex-col relative">
//                 {lessons.map((lesson, index)=>{
//                     const isCurrent = lesson.id === activeLesson?.id
//                     const isLocked = !lesson.completed && !isCurrent
//                     return (
//                     <LessonButton 
//                         key={lesson.id} 
//                         id={lesson.id}
//                         index={index}
//                         totalCount={lessons.length - 1}
//                         current={isCurrent} 
//                         // locked={isLocked}
//                         locked={false}
//                         // percentage={activeLessonPercentage}
//                         title={lesson.title}

//                         lessonStat={lessonStat}
//                         />)
//                     })
//                 }
//             </div>
//         </>
//     )
// }