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
    groups.forEach((g) => {
        g.opts.sort((a, b) => {
            const ia = CATEGORY_ORDER.indexOf(a.text.split("::")[1] ?? "")
            const ib = CATEGORY_ORDER.indexOf(b.text.split("::")[1] ?? "")
            return ia - ib
        })
    })

    const revealed = status !== "none"

    return (
        <div className="space-y-5">
            {groups.map(({ name, opts }) => {
                const selectedId = selected[name]
                return (
                    <div key={name}>
                        <p className="text-[#F2F7FB] text-sm lg:text-base font-semibold mb-2">
                            <Latex>{name}</Latex>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {opts.map((o) => {
                                const label = o.text.split("::")[1] ?? o.text
                                const isSelected = selectedId === o.id
                                const revealCorrect = revealed && o.correct
                                const revealWrong = revealed && isSelected && !o.correct
                                const borderColor = revealCorrect
                                    ? "#53692C"
                                    : revealWrong
                                        ? "#A3423E"
                                        : isSelected
                                            ? (unitColor?.button ?? "#3E6883")
                                            : "#3A464E"
                                const bgColor = revealCorrect
                                    ? "#678337"
                                    : revealWrong
                                        ? "#C8524E"
                                        : isSelected
                                            ? (unitColor?.button ?? "#5183A4")
                                            : "#161F23"
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => { vibrate('light'); onSelect(name, o.id); }}
                                        disabled={disabled}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1 border-2 rounded-xl py-3 px-2 text-center transition-colors hover:bg-[#1A252B]",
                                            disabled && "pointer-events-none",
                                        )}
                                        style={{ borderColor, backgroundColor: bgColor }}
                                    >
                                        <span className="h-4">
                                            {revealCorrect && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                            {revealWrong && <X className="w-4 h-4 text-white" strokeWidth={3} />}
                                        </span>
                                        <span className={cn(
                                            "text-xs lg:text-sm leading-tight",
                                            (isSelected || revealCorrect) ? "text-white" : "text-[#F2F7FB]",
                                        )}>
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
