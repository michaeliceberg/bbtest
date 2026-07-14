// hooks/useLessonStatistics.ts
import { t_lessonProgress } from '@/db/schema'
import { useMemo } from 'react'


type LessonProgress = typeof t_lessonProgress.$inferSelect

interface MonthStat {
  month: string
  doneRight: number
  doneWrong: number
}

interface LessonStatistics {
  totalDoneRight: number
  totalDoneWrong: number
  totalPercentDR: number
  monthlyStats: MonthStat[]
}

export function useLessonStatistics(
  t_lessonProgress: LessonProgress[],
  t_lessonId: number
): LessonStatistics {
  return useMemo(() => {
    // Фильтруем прогресс по текущему уроку
    const lessonProgressThisLesson = t_lessonProgress.filter(
      progress => progress.t_lessonId === t_lessonId
    )
    
    // Группируем по месяцам
    const progressByMonth = lessonProgressThisLesson.map(el => ({
      doneRight: el.doneRight,
      doneWrong: el.doneWrong,
      month: el.dateDone.getMonth(),
      trainingPts: el.trainingPts,
      doneRightPercent: el.doneRightPercent,
    }))
    
    // Получаем уникальные месяцы
    const uniqueMonths = progressByMonth
      .map(item => item.month)
      .filter((value, index, self) => self.indexOf(value) === index)
    
    // Суммируем по месяцам
    const doneRightSumList = uniqueMonths.map(month => 
      progressByMonth
        .filter(el => el.month === month)
        .reduce((total, elem) => total + elem.doneRight, 0)
    )
    
    const doneWrongSumList = uniqueMonths.map(month => 
      progressByMonth
        .filter(el => el.month === month)
        .reduce((total, elem) => total + elem.doneWrong, 0)
    )
    
    // Формируем месячную статистику
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    
    const monthlyStats = uniqueMonths.map((m, index) => ({
      month: monthNames[m],
      doneRight: doneRightSumList[index],
      doneWrong: doneWrongSumList[index],
    }))
    
    // Общая статистика
    const totalDoneRight = monthlyStats.reduce((total, elem) => total + elem.doneRight, 0)
    const totalDoneWrong = monthlyStats.reduce((total, elem) => total + elem.doneWrong, 0)
    const totalDone = totalDoneRight + totalDoneWrong
    const totalPercentDR = totalDoneRight > 0 ? totalDoneRight / totalDone : 0
    
    return {
      totalDoneRight,
      totalDoneWrong,
      totalPercentDR,
      monthlyStats,
    }
  }, [t_lessonProgress, t_lessonId])
}