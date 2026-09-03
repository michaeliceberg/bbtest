// components/geometry/SolveModeChoice.tsx
//
// Экран выбора режима перед "флагманской" задачей с интерактивным
// разбором (см. TrapezoidWalkthrough.tsx): "Решу сам" — обычный флоу
// задачника без подсказок, "Разберём по шагам" — пошаговый разбор с
// анимированной диаграммой. Пользователь явно попросил именно такую
// пару кнопок — идея в том, что ученик сначала разбирает тип задачи по
// шагам, а дальше, освоившись, решает такие сам.

import { motion } from 'framer-motion'
import { BookOpen, Sparkles } from 'lucide-react'

type Props = {
    onChoose: (mode: 'self' | 'guided') => void
}

export const SolveModeChoice = ({ onChoose }: Props) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl mx-auto flex flex-col items-center gap-4 py-6"
        >
            <h2 className="text-lg md:text-xl font-bold text-[#F2F7FB] text-center">
                Как решаем эту задачу?
            </h2>
            <p className="text-sm text-[#9AA7B0] text-center max-w-sm">
                Это новый тип задачи — можно сначала разобрать метод решения по шагам, а можно сразу попробовать самостоятельно.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-2">
                <button
                    type="button"
                    onClick={() => onChoose('guided')}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-b-4 active:border-b-2 py-5 px-4 transition-colors"
                    style={{ backgroundColor: '#7dd3fc1F', borderColor: '#7dd3fc66', color: '#7dd3fc' }}
                >
                    <Sparkles className="w-7 h-7" />
                    <span className="font-bold text-base">Разберём по шагам</span>
                    <span className="text-xs opacity-80 font-normal">Пошагово, с подсказками и диаграммой</span>
                </button>

                <button
                    type="button"
                    onClick={() => onChoose('self')}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-b-4 active:border-b-2 py-5 px-4 transition-colors bg-[#161F23] border-[#3A464E] text-[#F2F7FB]"
                >
                    <BookOpen className="w-7 h-7" />
                    <span className="font-bold text-base">Решу сам</span>
                    <span className="text-xs opacity-70 font-normal">Обычный вид задачи, без подсказок</span>
                </button>
            </div>
        </motion.div>
    )
}
