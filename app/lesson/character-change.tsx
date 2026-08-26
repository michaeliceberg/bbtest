// app/lesson/character-change.tsx
//
// Тип задания CONSTRUCT (переиспользует неиспользуемое значение enum —
// не CONNECT, тот занят другой механикой в t_challenges/тренажёре) —
// "Определите характер изменения" каждой из нескольких физических
// величин: увеличится / уменьшится / не изменится. Данные хранятся в
// обычных challengeOptions без изменения схемы: text кодируется как
// "<название величины>::<вариант>", correct отмечает правильный вариант
// для каждой величины.

import { useState } from "react"
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
    // Физическое "нажатие" (палец/мышь ещё удерживаются) отслеживается
    // отдельно от закреплённого выбора — кнопка должна проседать сразу по
    // pointerdown, а не только после полного клика (pointerdown+up).
    const [downId, setDownId] = useState<number | null>(null)

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
                        <div className="grid grid-cols-3 gap-2 items-start">
                            {opts.map((o) => {
                                const label = o.text.split("::")[1] ?? o.text
                                const isSelected = selectedId === o.id
                                const revealCorrect = revealed && o.correct
                                const revealWrong = revealed && isSelected && !o.correct
                                // "Нажатое" состояние — пропадает нижняя 3D-тень (граница),
                                // ровно как в кнопке "Ответить" (border-b-4 active:border-b-0).
                                // Ключевое условие эффекта "текст опускается" — ФИКСИРОВАННАЯ
                                // высота кнопки (h-[53px]) с border-box: когда нижняя граница
                                // тает с 7 до 2px, внутренняя область кнопки растёт вниз (сама
                                // кнопка при этом не меняет размер), и центрированный
                                // items-center текст сам смещается вниз вместе с новым
                                // центром — без ручного translate на тексте. items-start на
                                // родителе не даёт grid растянуть все 3 кнопки по высоте
                                // самой высокой (align-items: stretch по умолчанию).
                                // Физическое нажатие держится, только пока курсор/палец над
                                // ЭТОЙ кнопкой — увести и отпустить в сторону не должно её
                                // "выбрать" (закрепляет клик, как обычно у кнопок).
                                const isPhysicallyDown = !disabled && downId === o.id
                                const isActive = isSelected || revealCorrect || isPhysicallyDown
                                const bg = revealCorrect
                                    ? "#678337"
                                    : revealWrong
                                        ? "#C8524E"
                                        : isActive
                                            ? "#4ade80"
                                            : "#232F34"
                                const border = revealCorrect
                                    ? "#3E5220"
                                    : revealWrong
                                        ? "#8C332F"
                                        : isActive
                                            ? "#22a35d"
                                            : "#11171A"
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => { vibrate('light'); onSelect(name, o.id); }}
                                        onPointerDown={() => !disabled && setDownId(o.id)}
                                        onPointerUp={() => setDownId(null)}
                                        onPointerLeave={() => setDownId(null)}
                                        onPointerCancel={() => setDownId(null)}
                                        disabled={disabled}
                                        className={cn(
                                            "relative flex items-center justify-center rounded-xl h-[53px] px-2 text-center border-2 border-solid",
                                            "transition-[background-color,border-color,border-bottom-width] duration-150 ease-out",
                                            disabled && "pointer-events-none",
                                        )}
                                        style={{
                                            borderColor: border,
                                            backgroundColor: bg,
                                            borderBottomWidth: isActive ? 2 : 7,
                                        }}
                                    >
                                        <span className={cn(
                                            "text-xs lg:text-sm leading-tight font-bold inline-flex items-center gap-1",
                                            revealCorrect || revealWrong
                                                ? "text-white"
                                                : isActive
                                                    ? "text-[#123018]"
                                                    : "text-[#9AA7B0]",
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
