// app/lesson/character-change.tsx
//
// Тип задания CONSTRUCT (переиспользует неиспользуемое значение enum —
// не CONNECT, тот занят другой механикой в t_challenges/тренажёре).
// Изначально — "определите характер изменения" (увеличится/уменьшится/
// не изменится для каждой величины), позже переиспользован и для
// matching-задач ("Установите соответствие", Unit 10 курса физики) —
// там у всех групп ОДИН И ТОТ ЖЕ набор вариантов ответа, из-за чего
// прежний UI (полный список вариантов под каждой группой отдельно)
// буквально дублировал одни и те же 4-6 кнопок несколько раз подряд.
//
// Новый UI: слева карточки-группы (источники — "График А"/"График Б"
// и т.п.), справа ОДИН общий пул уникальных вариантов ответа. Клик по
// группе делает её активной, клик по варианту связывает его с активной
// группой (тот же принцип "клик-клик", что уже используется в
// тренажёре для CONNECT, но, в отличие от него, здесь НЕ сбрасываем
// пару при ошибке — пользователь достраивает все связи как хочет и сам
// решает, когда нажать "Ответить"; проверка — только в момент общего
// ответа, как у всех остальных типов курса).
//
// Данные хранятся в обычных challengeOptions без изменения схемы: text
// кодируется как "<название группы>::<вариант>", correct отмечает
// правильный вариант для каждой группы — у каждой группы СВОЙ набор
// строк в БД (с одинаковым текстом варианта, но разным id/correct),
// поэтому дедупликация вариантов для правого столбца — только для
// отображения, назначение по-прежнему идёт через id строки конкретной
// группы.

import { challengeOptions } from "@/db/schema"
import Latex from "react-latex-next"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { vibrate } from "@/lib/haptics"
import { useState } from "react"

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

// Цвет-идентификатор группы (бейдж на связанном варианте справа) —
// намеренно не зелёный/красный (те заняты индикацией правильности) и не
// unitColor (тот уже значит "выбрано/активно"). Достаточно 4 цветов —
// среди 73 matching-задач курса ни у одной нет больше 3 групп.
const GROUP_COLORS = ["#7dd3fc", "#c084fc", "#fbbf24", "#fb7185"]

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

    // Все группы matching-задачи используют один и тот же набор вариантов
    // (просто отдельная строка challengeOptions на каждую пару группа×
    // вариант, с разным correct) — поэтому уникальный список для правого
    // столбца строится объединением по ТЕКСТУ варианта, не по одной группе,
    // на случай если для какой-то будущей задачи наборы всё же разойдутся.
    const rightTexts: string[] = []
    groups.forEach((g) => g.opts.forEach((o) => {
        const label = o.text.split("::")[1] ?? o.text
        if (!rightTexts.includes(label)) rightTexts.push(label)
    }))

    const revealed = status !== "none"
    const isLongText = rightTexts.some((t) => t.length > 24)

    const [activeGroup, setActiveGroup] = useState<string | null>(null)
    // Явный клик по группе слева всегда побеждает. Без него — по умолчанию
    // подсвечиваем первую ЕЩЁ НЕ заполненную группу (естественный порядок
    // заполнения); если заполнены все — не выбираем никого сами (иначе
    // случайный клик по варианту справа молча переписал бы ПЕРВУЮ группу,
    // а не ту, которую пользователь хотел изменить), правая колонка
    // временно неактивна, пока не кликнут по конкретной группе слева.
    const allAssigned = groups.every((g) => selected[g.name] !== undefined)
    const firstUnassigned = groups.find((g) => selected[g.name] === undefined)?.name ?? null
    const effectiveActive = activeGroup ?? (allAssigned ? null : firstUnassigned)

    const groupColor = (name: string) => GROUP_COLORS[groups.findIndex((g) => g.name === name) % GROUP_COLORS.length]

    const handleGroupClick = (name: string) => {
        if (disabled || revealed) return
        vibrate('light')
        setActiveGroup(name)
    }

    const handleOptionClick = (label: string) => {
        if (disabled || revealed || !effectiveActive) return
        const group = groups.find((g) => g.name === effectiveActive)
        const opt = group?.opts.find((o) => (o.text.split("::")[1] ?? o.text) === label)
        if (!group || !opt) return
        vibrate('light')
        onSelect(group.name, opt.id)
        const remaining = groups.filter((g) => g.name !== group.name && selected[g.name] === undefined)
        setActiveGroup(remaining[0]?.name ?? null)
    }

    return (
        <div className="rounded-2xl border-2 border-[#2A343A] bg-[#1A252B] p-3">
            <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3 items-start">
                {/* Левая колонка — группы (источники) */}
                <div className="flex flex-col gap-2">
                    {groups.map((g) => {
                        const selId = selected[g.name]
                        const selOpt = g.opts.find((o) => o.id === selId)
                        const isActive = effectiveActive === g.name && !revealed
                        const isCorrect = revealed && selOpt?.correct === true
                        const isWrong = revealed && selId !== undefined && selOpt?.correct === false
                        const color = groupColor(g.name)
                        return (
                            <button
                                key={g.name}
                                type="button"
                                onClick={() => handleGroupClick(g.name)}
                                disabled={disabled || revealed}
                                className={cn(
                                    "relative text-left rounded-xl border-2 px-3 py-2.5 transition-colors duration-150",
                                    disabled && "pointer-events-none",
                                )}
                                style={{
                                    borderColor: isCorrect ? "#3E5220" : isWrong ? "#8C332F" : isActive ? color : "#11171A",
                                    backgroundColor: isCorrect ? "#678337" : isWrong ? "#C8524E" : isActive ? "rgba(255,255,255,0.06)" : "#232F34",
                                }}
                            >
                                <div className="flex items-center gap-1.5">
                                    {!revealed && (
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: selId !== undefined ? color : "transparent", border: `1.5px solid ${color}` }}
                                        />
                                    )}
                                    {isCorrect && <Check className="w-3.5 h-3.5 flex-shrink-0 text-white" strokeWidth={3} />}
                                    {isWrong && <X className="w-3.5 h-3.5 flex-shrink-0 text-white" strokeWidth={3} />}
                                    <span className={cn(
                                        "text-xs lg:text-sm font-bold",
                                        isCorrect || isWrong ? "text-white" : "text-[#F2F7FB]",
                                    )}>
                                        <Latex>{g.name}</Latex>
                                    </span>
                                </div>
                                {selOpt && (
                                    <p className={cn(
                                        "mt-1 text-[10px] lg:text-xs leading-snug line-clamp-2",
                                        isCorrect || isWrong ? "text-white/85" : "text-[#9AA7B0]",
                                    )}>
                                        <Latex>{selOpt.text.split("::")[1] ?? ""}</Latex>
                                    </p>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Правая колонка — общий пул вариантов ответа */}
                <div className="flex flex-col gap-2">
                    {rightTexts.map((label) => {
                        // На какие группы сейчас указывает этот вариант (после
                        // проверки — только реально выбранные пары; активная
                        // группа до проверки подсвечивается отдельно, кольцом).
                        const linkedGroups = revealed
                            ? groups.filter((g) => {
                                const so = g.opts.find((o) => o.id === selected[g.name])
                                return so && (so.text.split("::")[1] ?? "") === label
                            })
                            : []
                        const isActiveTarget = !revealed && effectiveActive
                            ? (() => {
                                const g = groups.find((x) => x.name === effectiveActive)
                                const so = g?.opts.find((o) => o.id === selected[g.name])
                                return so ? (so.text.split("::")[1] ?? "") === label : false
                            })()
                            : false
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => handleOptionClick(label)}
                                disabled={disabled || revealed || !effectiveActive}
                                className={cn(
                                    "group relative flex items-center rounded-xl px-3 py-2.5 text-left",
                                    isLongText ? "min-h-[44px]" : "min-h-[44px]",
                                    "border-2 border-solid transition-colors duration-150",
                                    disabled && "pointer-events-none",
                                )}
                                style={{
                                    borderColor: isActiveTarget ? (unitColor?.bottom ?? "#22a35d") : "#11171A",
                                    backgroundColor: isActiveTarget ? (unitColor?.button ?? "#4ade80") : "#232F34",
                                }}
                            >
                                <span className={cn(
                                    "leading-tight font-semibold",
                                    isLongText ? "text-[11px] lg:text-xs" : "text-xs lg:text-sm",
                                    isActiveTarget ? "text-[#123018]" : "text-[#9AA7B0]",
                                )}>
                                    <Latex>{label}</Latex>
                                </span>
                                {linkedGroups.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex gap-0.5">
                                        {linkedGroups.map((g) => {
                                            const so = g.opts.find((o) => o.id === selected[g.name])
                                            const ok = so?.correct === true
                                            return (
                                                <span
                                                    key={g.name}
                                                    className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white border border-[#151F23]"
                                                    style={{ backgroundColor: ok ? "#678337" : "#C8524E" }}
                                                >
                                                    {ok ? "✓" : "✕"}
                                                </span>
                                            )
                                        })}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
            {!revealed && (
                <p className="mt-3 text-[11px] text-[#9AA7B0]">
                    {effectiveActive
                        ? <>Выберите вариант для «<Latex>{effectiveActive}</Latex>»</>
                        : "Все группы заполнены — нажмите «Ответить»"}
                </p>
            )}
        </div>
    )
}
