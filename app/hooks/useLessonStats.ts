// // hooks/useLessonStats.ts
// export const useLessonStats = (t_lessonProgress: any[], t_lessonId: number) => {
//     return useMemo(() => {
//       const progress = t_lessonProgress.filter(p => p.t_lessonId === t_lessonId)
//       // ... вся логика с месяцами и статистикой
//       return { TrainingProgressMonth, totalPercentDR, totalDR, totalDW }
//     }, [t_lessonProgress, t_lessonId])
//   }