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
// UI: слева карточки-группы (источники), справа ОДИН общий пул
// уникальных вариантов ответа. Клик по группе делает её активной, клик
// по варианту связывает его с активной группой (тот же принцип
// "клик-клик", что уже используется в тренажёре для CONNECT, но, в
// отличие от него, здесь НЕ сбрасываем пару при ошибке — пользователь
// достраивает все связи как хочет и сам решает, когда нажать
// "Ответить"; проверка — только в момент общего ответа, как у всех
// остальных типов курса).
//
// Составленная пара (группа слева + выбранный для неё вариант справа)
// сразу подсвечивается ОБЩИМ цветом ещё до "Ответить" — по одному
// цвету на пару, чтобы было видно соответствие, не дожидаясь проверки.
// "Активная" (выбранная, но ещё без варианта) группа красится ТЕМ ЖЕ
// цветом, каким станет пара — не отдельным нейтральным акцентом, чтобы
// не создавать впечатление "третьего", ничего не значащего цвета.
//
// Данные хранятся в обычных challengeOptions без изменения схемы: text
// кодируется как "<название группы>::<вариант>", correct отмечает
// правильный вариант для каждой группы — у каждой группы СВОЙ набор
// строк в БД (с одинаковым текстом варианта, но разным id/correct),
// поэтому дедупликация вариантов для правого столбца — только для
// отображения, назначение по-прежнему идёт через id строки конкретной
// группы.
//
// Мини-графики групп (Unit 10 "Установите соответствие"): когда группы
// — это буквально панели ОДНОЙ общей картинки (challenge.imageSrc —
// композитное изображение из N графиков рядом или друг под другом,
// каждая панель 280×210, см. scripts/seedEGEPhysics-unit10-lesson1.ts),
// левая карточка показывает ТОЛЬКО вырезанную панель картинки (без
// текстовой подписи рядом — "чисто графики", цвет рамки/фона уже
// однозначно говорит, какая это группа и с чем она связана). CSS-спрайт:
// <img> в N раз шире/выше контейнера со сдвигом на свою позицию — сама
// картинка уже содержит подпись "А"/"Б", отдельно её не дублируем.
// Определяется НЕ по названию группы (у matching-задач бывают группы
// вида "Процесс А"/"Процесс Б", чей текст выглядит так же, но картинка
// при этом — ОДИН график на двоих, а не N панелей — такое ложное
// срабатывание уже ловилось при разборе реальных данных урока), а по
// РЕАЛЬНЫМ пропорциям загруженной картинки: если её natural-размер
// совпадает (с запасом на технологический зазор между панелями) с N
// панелями 280×210 подряд по горизонтали или вертикали — это композит;
// иначе (в т.ч. пока картинка ещё не загрузилась) — обычный текст.

import { challengeOptions } from "@/db/schema"
import Latex from "react-latex-next"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { vibrate } from "@/lib/haptics"
import { useState } from "react"
import { PanelOrientation } from "@/lib/graphPanel"

type Props = {
    options: typeof challengeOptions.$inferSelect[]
    selected: Record<string, number>
    onSelect: (quantity: string, optionId: number) => void
    status: "correct" | "wrong" | "none"
    disabled?: boolean
    unitColor?: { button: string; bottom: string }
    imageSrc?: string | null
    // Считается один раз наверху (app/lesson/quiz.tsx), не тут — та же
    // картинка нужна ЕЩЁ И для решения "показывать ли её отдельно над
    // условием" (см. лид-коммент), два независимых распознавания в двух
    // местах рисковали бы разъехаться.
    panelOrientation: PanelOrientation | null
}

// Порядок вариантов внутри группы всегда фиксирован (независимо от
// глобального перемешивания options всего задания) — иначе пункты
// "увеличится/уменьшится/не изменится" прыгали бы местами при пересдаче.
const CATEGORY_ORDER = ["Увеличится", "Уменьшится", "Не изменится"]

// Цвет-идентификатор группы (фон/рамка её собственной карточки слева И
// связанного с ней варианта справа — и пока она просто активна, и как
// только пара составлена) — намеренно не зелёный/красный (те заняты
// индикацией правильности после "Ответить"). Контрастные, хорошо
// различимые между собой цвета (синий/розовый — первая пара
// сравнивается чаще всего, взяты подальше друг от друга по оттенку, не
// два похожих оттенка синего/сиреневого). Достаточно 4 цветов — среди
// matching-задач курса ни у одной нет больше 3 групп.
const GROUP_COLORS = ["#3B82F6", "#EC4899", "#FBBF24", "#22D3EE"]

// Вырезка одной панели композитной картинки — тот же приём, что CSS
// спрайты: сама картинка рисуется в N раз шире/выше контейнера и
// сдвигается на свою позицию, контейнер обрезает всё лишнее.
const GraphPanelThumb = ({ src, index, total, orientation }: {
    src: string
    index: number
    total: number
    orientation: PanelOrientation
}) => {
    const style: React.CSSProperties = orientation === "h"
        ? { width: `${total * 100}%`, height: "100%", left: `-${index * 100}%`, top: 0 }
        : { width: "100%", height: `${total * 100}%`, left: 0, top: `-${index * 100}%` }
    return (
        <div className="relative w-full overflow-hidden rounded-lg bg-[#0F171B]" style={{ aspectRatio: "4 / 3" }}>
            <img
                src={src}
                alt=""
                draggable={false}
                className="absolute max-w-none pointer-events-none select-none"
                style={style}
            />
        </div>
    )
}

export const CharacterChangeChallenge = ({ options, selected, onSelect, status, disabled, imageSrc, panelOrientation }: Props) => {
    const groups: { name: string; opts: typeof options }[] = []
    options.forEach((o) => {
        const [name] = o.text.split("::")
        let g = groups.find((x) => x.name === name)
        if (!g) { g = { name, opts: [] }; groups.push(g) }
        g.opts.push(o)
    })
    // Порядок групп не должен зависеть от того, как они перемешались при
    // сидинге challengeOptions — иначе, например, "График Б" мог случайно
    // оказаться выше "График А". Сортируем по названию детерминированно —
    // это заодно гарантирует, что индекс группы в этом массиве совпадает
    // с порядком панелей в композитной картинке (А слева/сверху, Б
    // справа/снизу — ровно алфавитный порядок).
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

    const isGraphPanelMode = panelOrientation !== null

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
                    {groups.map((g, idx) => {
                        const selId = selected[g.name]
                        const selOpt = g.opts.find((o) => o.id === selId)
                        const isActive = effectiveActive === g.name && !revealed
                        const isCorrect = revealed && selOpt?.correct === true
                        const isWrong = revealed && selId !== undefined && selOpt?.correct === false
                        const color = groupColor(g.name)
                        // И "активна, ещё без варианта", и "пара уже составлена" —
                        // красим ЕЁ СОБСТВЕННЫМ цветом (тем же, что получит связанный
                        // вариант справа) — это ОДИН и тот же цвет всё время, просто
                        // фон заливается только когда пара реально составлена, чтобы
                        // визуально отличать "выбираю" от "уже связано".
                        const isPaired = !revealed && selId !== undefined
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
                                    borderColor: isCorrect ? "#3E5220" : isWrong ? "#8C332F"
                                        : isPaired || isActive ? color
                                        : "#11171A",
                                    backgroundColor: isCorrect ? "#678337" : isWrong ? "#C8524E"
                                        : isPaired ? `${color}26`
                                        : isActive ? `${color}14`
                                        : "#232F34",
                                }}
                            >
                                {isGraphPanelMode ? (
                                    <div className="relative">
                                        <GraphPanelThumb src={imageSrc!} index={idx} total={groups.length} orientation={panelOrientation!} />
                                        {(isCorrect || isWrong) && (
                                            <span
                                                className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full border border-[#151F23]"
                                                style={{ backgroundColor: isCorrect ? "#678337" : "#C8524E" }}
                                            >
                                                {isCorrect
                                                    ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                    : <X className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </span>
                                        )}
                                    </div>
                                ) : (
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
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Правая колонка — общий пул вариантов ответа */}
                <div className="flex flex-col gap-2">
                    {rightTexts.map((label) => {
                        // На какие группы сейчас указывает этот вариант — считаем
                        // всегда (не только после проверки), чтобы подсвечивать пары
                        // цветом их группы сразу по мере составления.
                        const linkedGroups = groups.filter((g) => {
                            const so = g.opts.find((o) => o.id === selected[g.name])
                            return so && (so.text.split("::")[1] ?? "") === label
                        })
                        const pairColor = linkedGroups.length === 1 ? groupColor(linkedGroups[0].name) : null
                        // Формулы (LaTeX, "$...$") — отдельная сущность, не просто
                        // "короткий текст": длина ИСХОДНОЙ строки (`\sqrt{\frac{3kT}
                        // {m_0}}`) плохо коррелирует с шириной ОТРИСОВАННОЙ формулы —
                        // из-за неё формула могла ложно попасть в "длинный текст"
                        // мельче + попадала под text-left, из-за чего короткая формула
                        // болталась у левого края кнопки. Формулы всегда крупнее и по
                        // центру, независимо от isLongText.
                        const isFormula = label.includes("$")
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => handleOptionClick(label)}
                                disabled={disabled || revealed || !effectiveActive}
                                className={cn(
                                    "group relative flex items-center rounded-xl px-3 border-2 border-solid transition-colors duration-150",
                                    isFormula ? "justify-center text-center py-3 min-h-[52px]" : "text-left min-h-[44px]",
                                    disabled && "pointer-events-none",
                                )}
                                style={{
                                    borderColor: !revealed && pairColor ? pairColor : "#11171A",
                                    backgroundColor: !revealed && pairColor ? `${pairColor}26` : "#232F34",
                                }}
                            >
                                <span className={cn(
                                    "leading-tight font-semibold",
                                    isFormula ? "text-base lg:text-lg" : (isLongText ? "text-[11px] lg:text-xs" : "text-xs lg:text-sm"),
                                    !revealed && pairColor ? "text-[#F2F7FB]" : "text-[#9AA7B0]",
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
                                                    style={{ backgroundColor: revealed ? (ok ? "#678337" : "#C8524E") : groupColor(g.name) }}
                                                >
                                                    {revealed ? (ok ? "✓" : "✕") : ""}
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
