// app/lesson/character-change.tsx
//
// Тип задания CONSTRUCT (переиспользует неиспользуемое значение enum —
// не CONNECT, тот занят другой механикой в t_challenges/тренажёре) —
// "Определите характер изменения" каждой из нескольких физических
// величин: увеличится / уменьшится / не изменится. Данные хранятся в
// обычных challengeOptions без изменения схемы: text кодируется как
// "<название величины>::<вариант>", correct отмечает правильный вариант
// для каждой величины.

import { challengeOptions } from "@/db/schema"
import Latex from "react-latex-next"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { vibrate } from "@/lib/haptics"

type Props = {
    options: typeof challengeOptions.$inferSelect[]
    selected: Record<string, number>
    onSelect: (quantity: string, optionId: number) => void
    status: "correct" | "wrong" | "none"
    disabled?: boolean
    unitColor?: { button: string; bottom: string }
}

// Порядок вариантов внутри группы всегда фиксирован (независимо от
// глобального перемешивания options всего задания) — иначе пункты
// "увеличится/уменьшится/не изменится" прыгали бы местами при пересдаче.
const CATEGORY_ORDER = ["Увеличится", "Уменьшится", "Не изменится"]

export const CharacterChangeChallenge = ({ options, selected, onSelect, status, disabled, unitColor }: Props) => {
    const groups: { name: string; opts: typeof options }[] = []
    options.forEach((o) => {
        const [name] = o.text.split("::")
        let g = groups.find((x) => x.name === name)
        if (!g) { g = { name, opts: [] }; groups.push(g) }
        g.opts.push(o)
    })
    // Порядок групп не должен зависеть от того, как они перемешались при
    // сидинге challengeOptions — иначе, например, "График Б" мог случайно
    // оказаться выше "График А". Сортируем по названию детерминированно.
    groups.sort((a, b) => a.name.localeCompare(b.name, "ru"))
    groups.forEach((g) => {
        g.opts.sort((a, b) => {
            const ia = CATEGORY_ORDER.indexOf(a.text.split("::")[1] ?? "")
            const ib = CATEGORY_ORDER.indexOf(b.text.split("::")[1] ?? "")
            return ia - ib
        })
    })

    const revealed = status !== "none"

    // Компонент изначально проектировался под короткие категориальные
    // ответы ("увеличится"/"уменьшится"/"не изменится"), но переиспользован
    // и для matching-задач, где вариант — целое предложение. Длинный текст
    // не помещался в фиксированную h-[53px]/2-3-колоночную сетку — тот же
    // класс проблемы, что уже решён в ASSIST через isOddCount/grid-cols-1
    // (см. type-assist.tsx), здесь порог по длине текста, а не по чётности.
    const isLongText = options.some((o) => (o.text.split("::")[1] ?? o.text).length > 24)

    return (
        <div className="space-y-3">
            {groups.map(({ name, opts }) => {
                const selectedId = selected[name]
                return (
                    <div
                        key={name}
                        className="rounded-2xl border-2 border-[#2A343A] bg-[#1A252B] p-3"
                    >
                        <p className="text-[#F2F7FB] text-sm lg:text-base font-semibold mb-2.5">
                            <Latex>{name}</Latex>
                        </p>
                        <div className={cn(
                            "grid gap-2 items-start",
                            isLongText ? "grid-cols-1" : opts.length === 4 ? "grid-cols-2" : "grid-cols-3",
                        )}>
                            {opts.map((o) => {
                                const label = o.text.split("::")[1] ?? o.text
                                const isSelected = selectedId === o.id
                                const revealCorrect = revealed && o.correct
                                const revealWrong = revealed && isSelected && !o.correct
                                const isChosen = isSelected || revealCorrect
                                // Ровно та же механика, что у кнопки "Ответить"
                                // (components/ui/button.tsx: border-b-4 active:border-b-0) —
                                // никакого JS-состояния для самого нажатия: :active — нативный
                                // браузерный псевдокласс, срабатывает мгновенно по pointerdown
                                // и снимается по pointerup/leave сам, без риска рассинхрона с
                                // React-рендером (который и вызывал "дрожание" в предыдущей
                                // версии на ручных onPointerDown/Up). isChosen лишь ЗАКРЕПЛЯЕТ
                                // тот же вдавленный вид (border-b-0) после клика — постоянно,
                                // не только пока зажато. Фиксированная высота (h-[53px],
                                // border-box) — то же самое, что даёт эффект "текст опускается"
                                // у "Ответить": контент-область растёт вниз при усыхании нижней
                                // границы, items-center сам сдвигает центр текста вниз.
                                const bg = revealCorrect
                                    ? "#678337"
                                    : revealWrong
                                        ? "#C8524E"
                                        : isSelected
                                            ? (unitColor?.button ?? "#4ade80")
                                            : "#232F34"
                                const borderColor = revealCorrect
                                    ? "#3E5220"
                                    : revealWrong
                                        ? "#8C332F"
                                        : isSelected
                                            ? (unitColor?.bottom ?? "#22a35d")
                                            : "#11171A"
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => { vibrate('light'); onSelect(name, o.id); }}
                                        disabled={disabled}
                                        className={cn(
                                            "group relative flex items-center justify-center rounded-xl px-3 py-2.5 text-center",
                                            isLongText ? "min-h-[44px]" : "h-[53px]",
                                            "border-2 border-solid border-b-4 active:border-b-0 transition-colors duration-150",
                                            isChosen && "border-b-0",
                                            disabled && "pointer-events-none",
                                        )}
                                        style={{
                                            borderColor,
                                            backgroundColor: bg,
                                        }}
                                    >
                                        <span className={cn(
                                            "leading-tight font-bold inline-flex items-center gap-1.5",
                                            isLongText ? "text-[11px] lg:text-xs font-semibold text-left" : "text-xs lg:text-sm",
                                            revealCorrect || revealWrong
                                                ? "text-white"
                                                : isSelected
                                                    ? "text-[#123018]"
                                                    : "text-[#9AA7B0] group-active:text-[#123018]",
                                        )}>
                                            {revealCorrect && <Check className="w-4 h-4 flex-shrink-0" strokeWidth={3} />}
                                            {revealWrong && <X className="w-4 h-4 flex-shrink-0" strokeWidth={3} />}
                                            <Latex>{label}</Latex>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
