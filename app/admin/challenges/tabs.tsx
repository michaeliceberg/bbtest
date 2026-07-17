"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseSelect } from "./course-select"
import { UnitSelect } from "./unit-select"
import { LessonSelect } from "./lesson-select"
import { ChallengeForm, type FormData } from "./challenge-form"
import { ChallengePreview } from "./challenge-preview"
import { ChallengeList } from "./challenge-list"

// Контейнер для формы с управлением состоянием
function ChallengeFormContainer({
  lessonId,
  onDataChange,
}: {
  lessonId: number
  onDataChange: (data: FormData) => void
}) {
  return (
    <ChallengeForm
      lessonId={lessonId}
      onDataChange={onDataChange}
    />
  )
}

// Компонент который объединяет форму и preview
function ChallengeFormWithPreview({ lessonId }: { lessonId: number }) {
  const [formData, setFormData] = useState<FormData>({
    question: "",
    type: "ASSIST",
    author: "",
    difficulty: "",
    points: 10,
    options: [
      { text: "", correct: true },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
    ],
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Левая сторона: форма */}
      <div>
        <ChallengeFormContainer lessonId={lessonId} onDataChange={setFormData} />
      </div>

      {/* Правая сторона: preview */}
      <div className="sticky top-6 h-fit">
        <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6">
          <h3 className="text-white font-bold mb-4">📱 Preview в продакшене</h3>
          <div className="bg-[#0F1419] rounded-lg p-4">
            <ChallengePreview data={formData} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface Course {
  id: number
  title: string
}

interface Unit {
  id: number
  title: string
  courseId: number
}

interface Lesson {
  id: number
  title: string
  unitId: number
}

export function ChallengeTabs({
  selectedCourse,
  selectedUnit,
  selectedLesson,
  onSelectCourse,
  onSelectUnit,
  onSelectLesson,
}: {
  selectedCourse: number | null
  selectedUnit: number | null
  selectedLesson: number | null
  onSelectCourse: (id: number | null) => void
  onSelectUnit: (id: number | null) => void
  onSelectLesson: (id: number | null) => void
}) {
  const [courses, setCourses] = useState<Course[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  // Загружаем курсы
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/admin/courses")
        const data = await res.json()
        setCourses(data)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  // Загружаем юниты при выборе курса
  useEffect(() => {
    if (!selectedCourse) {
      setUnits([])
      setLessons([])
      onSelectUnit(null)
      onSelectLesson(null)
      return
    }

    const loadUnits = async () => {
      try {
        const res = await fetch(`/api/admin/units?courseId=${selectedCourse}`)
        const data = await res.json()
        setUnits(data)
      } catch (err) {
        console.error(err)
      }
    }
    loadUnits()
  }, [selectedCourse, onSelectUnit, onSelectLesson])

  // Загружаем уроки при выборе юнита
  useEffect(() => {
    if (!selectedUnit) {
      setLessons([])
      onSelectLesson(null)
      return
    }

    const loadLessons = async () => {
      try {
        const res = await fetch(`/api/admin/lessons?unitId=${selectedUnit}`)
        const data = await res.json()
        setLessons(data)
      } catch (err) {
        console.error(err)
      }
    }
    loadLessons()
  }, [selectedUnit, onSelectLesson])

  if (loading) {
    return <div className="text-white">Загрузка...</div>
  }

  return (
    <Tabs defaultValue="structure" className="w-full">
      <TabsList className="bg-[#161F23] border-b border-[#3A464E]">
        <TabsTrigger value="structure" className="text-white">
          📚 Структура
        </TabsTrigger>
        <TabsTrigger value="form" className="text-white" disabled={!selectedLesson}>
          ✏️ Новая задача
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Структура (выбор курс/юнит/урок) */}
      <TabsContent value="structure" className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CourseSelect
            courses={courses}
            selected={selectedCourse}
            onSelect={onSelectCourse}
          />
          <UnitSelect
            units={units}
            selected={selectedUnit}
            onSelect={onSelectUnit}
            disabled={!selectedCourse}
          />
          <LessonSelect
            lessons={lessons}
            selected={selectedLesson}
            onSelect={onSelectLesson}
            disabled={!selectedUnit}
          />
        </div>

        {selectedLesson && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">📝 Задачи в этом уроке</h2>
            <ChallengeList lessonId={selectedLesson} />
          </div>
        )}
      </TabsContent>

      {/* Tab 2: Форма добавления задачи с preview */}
      {selectedLesson && (
        <TabsContent value="form" className="mt-6">
          <ChallengeFormWithPreview lessonId={selectedLesson} />
        </TabsContent>
      )}
    </Tabs>
  )
}
