"use client"

import { useEffect, useState } from "react"
import { ChallengeList } from "./challenge-list"
import { AddCourseModal } from "./modals/add-course-modal"
import { AddUnitModal } from "./modals/add-unit-modal"
import { AddLessonModal } from "./modals/add-lesson-modal"
import { AddChallengeModal } from "./modals/add-challenge-modal"

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

export function StructureBrowser() {
  const [courses, setCourses] = useState<Course[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null)

  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(false)

  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [showAddChallenge, setShowAddChallenge] = useState(false)

  // Загружаем курсы при монтировании
  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true)
      try {
        const res = await fetch("/api/admin/courses")
        const data = await res.json()
        setCourses(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCourses(false)
      }
    }
    loadCourses()
  }, [])

  // Загружаем юниты при выборе курса
  useEffect(() => {
    if (!selectedCourse) {
      setUnits([])
      setLessons([])
      setSelectedUnit(null)
      setSelectedLesson(null)
      return
    }

    const loadUnits = async () => {
      setLoadingUnits(true)
      try {
        const res = await fetch(`/api/admin/units?courseId=${selectedCourse}`)
        const data = await res.json()
        setUnits(data)
        setLessons([])
        setSelectedUnit(null)
        setSelectedLesson(null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingUnits(false)
      }
    }
    loadUnits()
  }, [selectedCourse])

  // Загружаем уроки при выборе юнита
  useEffect(() => {
    if (!selectedUnit) {
      setLessons([])
      setSelectedLesson(null)
      return
    }

    const loadLessons = async () => {
      setLoadingLessons(true)
      try {
        const res = await fetch(`/api/admin/lessons?unitId=${selectedUnit}`)
        const data = await res.json()
        setLessons(data)
        setSelectedLesson(null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingLessons(false)
      }
    }
    loadLessons()
  }, [selectedUnit])

  const reloadCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses")
      const data = await res.json()
      setCourses(data)
    } catch (err) {
      console.error(err)
    }
  }

  const reloadUnits = async () => {
    if (selectedCourse) {
      try {
        const res = await fetch(`/api/admin/units?courseId=${selectedCourse}`)
        const data = await res.json()
        setUnits(data)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const reloadLessons = async () => {
    if (selectedUnit) {
      try {
        const res = await fetch(`/api/admin/lessons?unitId=${selectedUnit}`)
        const data = await res.json()
        setLessons(data)
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <>
      <div className="flex gap-3 h-full">
        {/* Панель 1: Курсы */}
        <div className="w-48 bg-[#161F23] border border-[#3A464E] rounded-lg p-3 overflow-y-auto flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#161F23] py-1 z-10">
            <h3 className="text-white font-bold text-sm">📚 Курсы</h3>
            <button
              onClick={() => setShowAddCourse(true)}
              className="px-2 py-0.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded text-xs"
              title="Добавить курс"
            >
              ➕
            </button>
          </div>

          {loadingCourses ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#5183A4] border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-1 flex-1">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition truncate ${
                    selectedCourse === course.id
                      ? "bg-[#5183A4] text-white"
                      : "bg-[#232F34] text-[#9AA7B0] hover:bg-[#2A3A42]"
                  }`}
                  title={course.title}
                >
                  {course.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Панель 2: Юниты */}
        <div className="w-48 bg-[#161F23] border border-[#3A464E] rounded-lg p-3 overflow-y-auto flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#161F23] py-1 z-10">
            <h3 className="text-white font-bold text-sm">📖 Юниты</h3>
            {selectedCourse && (
              <button
                onClick={() => setShowAddUnit(true)}
                className="px-2 py-0.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded text-xs"
                title="Добавить юнит"
              >
                ➕
              </button>
            )}
          </div>

          {loadingUnits ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#5183A4] border-t-transparent"></div>
            </div>
          ) : selectedCourse ? (
            <div className="space-y-1 flex-1">
              {units.length > 0 ? (
                units.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition truncate ${
                      selectedUnit === unit.id
                        ? "bg-[#5183A4] text-white"
                        : "bg-[#232F34] text-[#9AA7B0] hover:bg-[#2A3A42]"
                    }`}
                    title={unit.title}
                  >
                    {unit.title}
                  </button>
                ))
              ) : (
                <p className="text-[#5A6A72] text-xs">Нет юнитов</p>
              )}
            </div>
          ) : (
            <p className="text-[#5A6A72] text-xs">Выберите курс</p>
          )}
        </div>

        {/* Панель 3: Уроки */}
        <div className="w-48 bg-[#161F23] border border-[#3A464E] rounded-lg p-3 overflow-y-auto flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#161F23] py-1 z-10">
            <h3 className="text-white font-bold text-sm">📝 Уроки</h3>
            {selectedUnit && (
              <button
                onClick={() => setShowAddLesson(true)}
                className="px-2 py-0.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded text-xs"
                title="Добавить урок"
              >
                ➕
              </button>
            )}
          </div>

          {loadingLessons ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#5183A4] border-t-transparent"></div>
            </div>
          ) : selectedUnit ? (
            <div className="space-y-1 flex-1">
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition truncate ${
                      selectedLesson === lesson.id
                        ? "bg-[#5183A4] text-white"
                        : "bg-[#232F34] text-[#9AA7B0] hover:bg-[#2A3A42]"
                    }`}
                    title={lesson.title}
                  >
                    {lesson.title}
                  </button>
                ))
              ) : (
                <p className="text-[#5A6A72] text-xs">Нет уроков</p>
              )}
            </div>
          ) : (
            <p className="text-[#5A6A72] text-xs">Выберите юнит</p>
          )}
        </div>

        {/* Панель 4: Список задач */}
        <div className="flex-1 bg-[#161F23] border border-[#3A464E] rounded-lg p-4 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#161F23] py-2 z-10">
            <h3 className="text-white font-bold">✏️ Задачи</h3>
            {selectedLesson && (
              <button
                onClick={() => setShowAddChallenge(true)}
                className="px-2 py-0.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded text-xs"
                title="Добавить задачу"
              >
                ➕
              </button>
            )}
          </div>

          {selectedLesson ? (
            <div className="flex-1 min-h-0">
              <ChallengeList lessonId={selectedLesson} />
            </div>
          ) : (
            <p className="text-[#5A6A72] text-sm">Выберите урок</p>
          )}
        </div>
      </div>

      {/* Модали */}
      {showAddCourse && (
        <AddCourseModal
          isOpen={showAddCourse}
          onClose={() => setShowAddCourse(false)}
          onSave={() => {
            setShowAddCourse(false)
            reloadCourses()
          }}
        />
      )}

      {showAddUnit && selectedCourse && (
        <AddUnitModal
          courseId={selectedCourse}
          isOpen={showAddUnit}
          onClose={() => setShowAddUnit(false)}
          onSave={() => {
            setShowAddUnit(false)
            reloadUnits()
          }}
        />
      )}

      {showAddLesson && selectedUnit && (
        <AddLessonModal
          unitId={selectedUnit}
          isOpen={showAddLesson}
          onClose={() => setShowAddLesson(false)}
          onSave={() => {
            setShowAddLesson(false)
            reloadLessons()
          }}
        />
      )}

      {showAddChallenge && selectedLesson && (
        <AddChallengeModal
          lessonId={selectedLesson}
          isOpen={showAddChallenge}
          onClose={() => setShowAddChallenge(false)}
          onSave={() => {
            // Перезагружаем задачи
            // это будет сделано через callback в ChallengeList
          }}
        />
      )}
    </>
  )
}
