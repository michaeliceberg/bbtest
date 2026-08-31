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



// Правильный ответ иногда неоднозначен — одна и та же единица измерения
// бывает у нескольких величин (Дж = и работа, и энергия). В таких случаях
// correctAnswer хранится как несколько допустимых вариантов через "|"
// (см. CLAUDE.md, "Множественный правильный ответ"), и верным считается
// любой из них — не пропускаем такие вопросы, а принимаем любой данный
// правильный вариант. Для обычных (однозначных) ответов, где в
// correctAnswer нет "|", работает как раньше — просто ===.
export const isCorrectAnswer = (given: string | null | undefined, correctAnswer: string): boolean => {
    if (given == null) return false
    return correctAnswer.split('|').includes(given)
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

// То же самое, что GetTLessonStat, но агрегирует сразу НЕСКОЛЬКО уроков
// (этапов) одной темы (t_unit) в один процент — для бейджа скила на
// карточке задачи course, где градуировка "какой конкретно этап" не
// имеет смысла, важен прогресс по теме целиком.
export const GetTUnitStat = (
    t_lP: typeof t_lessonProgress.$inferSelect[],
    t_lessonIds: number[],
) => {

    const thisUnitProgress = t_lP.filter(lessonProgress => t_lessonIds.includes(lessonProgress.t_lessonId))

    const totalDR = thisUnitProgress.reduce((total, elem) => total + elem.doneRight, 0)
    const totalDW = thisUnitProgress.reduce((total, elem) => total + elem.doneWrong, 0)

    let totalPercentDR = 0
    const totalD = totalDR + totalDW
    if (totalDR > 0) {
        totalPercentDR = totalDR / totalD
    }

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


// Русское склонение по числу (1 день / 2 дня / 5 дней) — общий помощник,
// используется для тостов "серия продлена" (app/lesson/quiz.tsx,
// app/t-lesson/[t_lessonId]/TQUIZ.tsx). lib/notify-homework-assigned.ts
// уже содержит похожую функцию, но та не экспортирована и живёт в
// серверном (БД-импортирующем) модуле — сюда её тащить нельзя, эта
// функция вызывается из клиентских компонентов.
export const declensionRu = (n: number, one: string, few: string, many: string): string => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
};

export const daysWord = (n: number): string => declensionRu(n, 'день', 'дня', 'дней');

// Родительный падеж ("серию ИЗ N дней") — отдельно от daysWord(), т.к. это
// именительный/счётный ("1 день", "3 дня", "5 дней"). После предлога "из"
// вся фраза целиком в родительном: "из 1 дня" (не "из 1 день"), "из 3 дней"
// (не "из 3 дня" — сравните со счётным "3 дня" без предлога).
export const daysWordGenitive = (n: number): string => (n % 10 === 1 && n % 100 !== 11 ? 'дня' : 'дней');