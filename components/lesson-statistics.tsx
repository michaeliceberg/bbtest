// components/lesson-statistics.tsx
import React from 'react'
import { Separator } from "./ui/separator"

import { useLessonStatistics } from '@/app/hooks/useLessonStatistics'
import { t_lessonProgress } from "@/db/schema"

interface LessonStatisticsProps {
  t_lessonProgress: typeof t_lessonProgress.$inferSelect[]
  t_lessonId: number
  className?: string
}

export function LessonStatistics({ 
  t_lessonProgress, 
  t_lessonId, 
  className = "" 
}: LessonStatisticsProps) {
  const statistics = useLessonStatistics(t_lessonProgress, t_lessonId)
  
  if (statistics.monthlyStats.length === 0) {
    return null
  }
  
  return (
    <div className={className}>
      <div className="pt-8">
        <Separator />
      </div>
      
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Статистика по месяцам</h3>
        
        <div className="space-y-4">
          {statistics.monthlyStats.map((stat, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="font-medium text-lg">{stat.month}</h4>
              <div className="flex gap-4 mt-2">
                <span className="text-green-600">
                  ✓ Правильно: {stat.doneRight}
                </span>
                <span className="text-red-600">
                  ✗ Неправильно: {stat.doneWrong}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg">Общая статистика</h4>
          <div className="flex gap-4 mt-2">
            <span className="text-green-600">
              Всего правильно: {statistics.totalDoneRight}
            </span>
            <span className="text-red-600">
              Всего неправильно: {statistics.totalDoneWrong}
            </span>
          </div>
          <div className="mt-2">
            <span className="font-medium">
              Процент правильных ответов: {(statistics.totalPercentDR * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}