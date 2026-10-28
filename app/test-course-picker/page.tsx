// Тестовая страница: варианты выбора курса в сайдбаре (выбирает пользователь). Курсы — настоящие из БД,
// выбор здесь ничего не переключает (только показывает, как это будет выглядеть).
import { getCourses } from '@/db/queries'
import { CoursePickerDemo } from './demo'

export const dynamic = 'force-dynamic'

export default async function TestCoursePickerPage() {
    const all = await getCourses()
    const courses = all.map((c) => ({ id: c.id, title: c.title, imageSrc: c.imageSrc }))
    return <CoursePickerDemo courses={courses} />
}
