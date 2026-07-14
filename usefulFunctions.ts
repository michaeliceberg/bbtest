import { SuperType, progressType, t_lessonProgress } from './db/schema';

type Props = {
    hearts: number;
    userId: string;
    userName: string;
    userImageSrc: string;
    activeCourseId: number | null;
    points: number;
    courseProgress: SuperType;
    activeCourse: {
        id: number;
        title: string;
        imageSrc: string;
    } | null;}


export const getUserPointsHearts = (userProgress: Props) => {

  
	var today = new Date();
    var dd:number = today.getDate();
    var mm:number = today.getMonth()+1; 
    var yyyy:number = today.getFullYear();
    var TodayStr = dd + "."  + mm + "." + yyyy
    let Points = 0
    let Hearts = 0
    let Gems = 0
    let oldCourseProgress = userProgress.courseProgress
	if (oldCourseProgress instanceof Array) {
        let indexCourse = oldCourseProgress.findIndex( el => el.course === userProgress.activeCourse?.title );
        //
        if (indexCourse > -1){
            //
            // Эта книга УЖЕ есть в прогрессе,
            // ищем индекс Сегодняшней ДАТЫ
            //
            let currentProgress:progressType = oldCourseProgress[indexCourse].progress
            if (currentProgress instanceof Array) {
                let indexDate = currentProgress.findIndex( el => el.date === TodayStr );
                if (indexDate > -1){
					//
					Points = oldCourseProgress[indexCourse].progress[indexDate].pts
					Hearts = oldCourseProgress[indexCourse].progress[indexDate].hearts
					Gems = oldCourseProgress[indexCourse].progress[indexDate].gems
                }
            }
        }
    }
  
  
    return [Points, Hearts, Gems]
}



export const Shuffle2 = (array: string[]) => { 
    for (let i = array.length - 1; i > 0; i--) { 
      const j = Math.floor(Math.random() * (i + 1)); 
      [array[i], array[j]] = [array[j], array[i]]; 
    } 
    return array; 
  }; 





export const GetTLessonStat = (

    t_lP:  typeof t_lessonProgress.$inferSelect[],
    t_lessonId: number,

) => {


    const t_lessonProgressThisLesson =  t_lP.filter(lessonProgress => lessonProgress.t_lessonId == t_lessonId)
    
    const totalDR = t_lessonProgressThisLesson.reduce((total, elem) => {
    return (
        total + elem.doneRight
    )}, 0)
    const totalDW = t_lessonProgressThisLesson.reduce((total, elem) => {
        return (
        total + elem.doneWrong
        )}, 0)
    
    let totalPercentDR = 0
    const totalD = totalDR+totalDW
    if (totalDR > 0) {
        totalPercentDR = totalDR/(totalD)
    }

    // console.log(totalDR)
    // console.log(totalPercentDR)


    return ({
        totalPercentDR: totalPercentDR,
        totalDR: totalDR,
    })

}


export const NearestRound = (x: number) => {
    // const netTable = [ 0.2, 0.5, 0.7, 0.8, 1 ]

    if (x <= 0.2) {
        return "20"
    }
    if (x <=0.5 && x > 0.2) {
        return "50"
    }
    if (x <=0.7 && x > 0.5) {
        return "70"
    }
    if (x <=0.8 && x > 0.7) {
        return "80"
    }
    if (x <=1 && x > 0.8) {
        return "100"
    }
  }



  export function ShuffleTS<T>(array: T[]): T[] {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
};


export const getRandomNumberBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };