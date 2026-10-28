'use client'

// Выбор курса в шторке «Юниты» тренажёра (второе место, где можно переключить курс, кроме бокового меню).
// Тот же вид, что в сайдбаре (components/course-picker-sheet.tsx): кнопка в стиле меню юнитов, по нажатию —
// шторка с баннерами курсов поверх шторки юнитов. Выбор — тот же switchCourse.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { switchCourse } from '@/actions/switch-course'
import { CoursePickerButton, CoursePickerSheet } from '@/components/course-picker-sheet'

export type PickerCourse = { id: number; title: string; imageSrc?: string; streak?: number }

export const UnitSheetCoursePicker = ({ courses, activeCourseId }: { courses: PickerCourse[]; activeCourseId: number }) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [activeId, setActiveId] = useState(activeCourseId)
    const [, startTransition] = useTransition()

    const pick = (id: number) => {
        setOpen(false)
        if (id === activeId) return
        setActiveId(id)
        startTransition(async () => {
            await switchCourse(id, '/trainer')
            router.refresh()
        })
    }

    return (
        <div className="px-4 pt-6 pb-2">
            <CoursePickerButton course={courses.find((c) => c.id === activeId)} onClick={() => setOpen(true)} />
            <CoursePickerSheet open={open} onOpenChange={setOpen} courses={courses} activeId={activeId} onPick={pick} />
        </div>
    )
}
