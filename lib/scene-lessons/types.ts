import type { Scene } from '@/components/geometry/scene-engine'

// Задание тренировки: варианты — строки (можно с $...$ для KaTeX), answer — точно одна из них.
export type SceneTrial = { tag: string; text: string; options: string[]; answer: string; hint: string }
export type SceneLesson = {
    question: string        // t_challenges.question (по нему выбирается урок)
    mascot: string          // текст в облачке маскота
    scenes: Scene[]
    trials: SceneTrial[]
    last: string            // подпись кнопки после последнего задания
}
