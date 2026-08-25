'use client'

// components/scroll-to-lesson.tsx
//
// После переключения курса (?switched=1 от actions/switch-course.ts) один
// раз плавно скроллит к уроку, в котором пользователь последний раз решал
// задачи в этом курсе — чтобы не искать место вручную. Затем убирает
// параметр из URL напрямую через history.replaceState (НЕ через router.replace —
// это меняет searchParams реактивно и сбрасывает эффект/таймер до того,
// как скролл успевает произойти).

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type Props = {
    lessonId: number | null
}

export const ScrollToLesson = ({ lessonId }: Props) => {
    const searchParams = useSearchParams()
    const shouldScroll = searchParams.get('switched') === '1'

    useEffect(() => {
        if (!shouldScroll) return

        const timer = setTimeout(() => {
            if (lessonId) {
                document.getElementById(`lesson-${lessonId}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                })
            }
            window.history.replaceState(null, '', '/learn')
        }, 300)

        return () => clearTimeout(timer)
    }, [shouldScroll, lessonId])

    return null
}
