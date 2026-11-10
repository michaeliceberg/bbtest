// Общие кусочки логарифмических SCENEWALK-уроков (юнит «8 свойств логарифмов»), эталон — logSum.tsx.
import type { SceneTrial } from './types'
import { MathText } from '@/components/geometry/plain-math'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

export const BASE = GGEGE_PALETTE.blue.button      // основание — синее во всех логарифмических уроках
export const X = GGEGE_PALETTE.teal.button
export const Y = GGEGE_PALETTE.raspberry.button
export const Z = GGEGE_PALETTE.orange.button
export const col = (c: string, s: string) => `\\textcolor{${c}}{${s}}`

// Формула-«картинка» сцены: одна на сцену, меняется на месте (подсветка, не перерисовка)
export const Fig = ({ tex }: { tex: string }) => (
    <div className="w-full text-center text-3xl md:text-4xl font-black text-[#F2F7FB] py-1"><MathText>{`$${tex}$`}</MathText></div>
)

// Десерт в конце урока (правило 13b): любой вариант верный
export const dessert = (topic: string): SceneTrial => ({
    tag: 'Десерт', text: `Кто теперь шарит в ${topic}?`,
    options: ['Я', 'Конечно, я', 'Несомненно, я', 'Кто же ещё, как не я'], answer: 'Я', hint: '', allCorrect: true,
})
