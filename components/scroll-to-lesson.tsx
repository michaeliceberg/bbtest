'use client'

// components/scroll-to-lesson.tsx
//
// После переключения курса (?switched=1 от actions/switch-course.ts) один
// раз плавно скроллит к уроку, в котором пользователь последний раз решал
// задачи в этом курсе — чтобы не искать место вручную. Затем убирает
// параметр из URL, чтобы обновление страницы не повторяло скролл.

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Props = {
    lessonId: number | null
}

export const ScrollToLesson = ({ lessonId }: Props) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const shouldScroll = searchParams.get('switched') === '1'

    useEffect(() => {
        if (!shouldScroll) return

        router.replace('/learn', { scroll: false })

        if (!lessonId) return

        const timer = setTimeout(() => {
            document.getElementById(`lesson-${lessonId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }, 300)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldScroll, lessonId])

    return null
}
