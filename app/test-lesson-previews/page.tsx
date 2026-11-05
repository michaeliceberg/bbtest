'use client'

// Служебная страница: финальные картинки разборов на тёмном фоне — с неё делаются снимки
// для превью урока в панели сета (public/lesson-previews/*.png → t_lessons.preview_src)
import { TheoremFigure } from '@/app/t-lesson/[t_lessonId]/type-ttpwalk'

export default function TestLessonPreviewsPage() {
    return (
        <div className="min-h-screen bg-[#1B1810] p-6">
            <div id="pv-ttp" className="mx-auto w-[448px] bg-[#1B1810] p-4">
                <TheoremFigure stage={5} />
            </div>
        </div>
    )
}
