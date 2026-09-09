// app/t-lesson/[t_lessonId]/type-unitcircle.tsx
//
// Тип UNITCIRCLE — тригонометрический круг с точками-"радиокнопками" (см.
// UnitCircleData в page.tsx). Три режима:
// - 'locate' — выбрать ОДНУ точку, соответствующую названному в вопросе
//   углу ("Где находится 3π?", угол может быть отрицательным или
//   больше 2π — нужно привести по модулю 2π).
// - 'select' — отметить ВСЕ точки, подходящие под уравнение ("отметь
//   все x, где sin x = 1/2") — те же радиокнопки, просто без взаимного
//   исключения (можно отметить несколько сразу).
// - 'label' — пунктирная направляющая (горизонтальная для sin x=a,
//   вертикальная для cos x=a) пересекает окружность в 1-2 точках —
//   ТОЛЬКО они кликабельны (реальный radiobutton прямо на точке),
//   остальные 14 приглушены/неактивны. Клик по точке делает её активной,
//   снизу — список вариантов подписи угла именно ДЛЯ НЕЁ (у каждой
//   отмеченной точки свой корректный ответ, не общий набор).
//
// По прямой просьбе пользователя обычные точки НЕ подписаны (иначе ответ
// просто вычитывается взглядом, а не вспоминается) — только маленькие
// кружки точно НА линии окружности; подписаны лишь оси (cos α вправо,
// sin α вверх, со стрелками) как единственные визуальные ориентиры. В
// 'label'-режиме ЕДИНСТВЕННОЕ исключение — подпись, которую сам
// пользователь выбрал для отмеченной точки, показывается рядом с ней
// (это его собственный ответ, не подсказка).
//
// Тот же select-then-submit контракт, что у TRIGTABLE/ASSIST/INSERT —
// компонент только СООБЩАЕТ наверх собранный ответ, реальная проверка —
// по клику на общую кнопку "Ответить" внизу экрана. Формат ответа:
// - 'locate'/'select' — отсортированные по возрастанию индексы точек,
//   склеенные через "|||" (порядок клика не важен).
// - 'label' — "pointIndex:label" по КАЖДОЙ отмеченной точке,
//   отсортированные по возрастанию pointIndex, склеенные через "|||"
//   (см. TQUIZ.tsx — сравнивается точным совпадением строки, как и
//   TRIGTABLE/INSERT).

'use client'

import { useEffect, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onOptionSelected: (answer: string | null) => void
    isAnswerChecked: boolean
    isAnswerCorrect: boolean
}

// Радиус окружности и точек в единицах viewBox 0..100 (проценты
// контейнера) — намеренно меньше половины (50), чтобы оставить запас по
// краям под подписи осей (cos α / sin α), не вылезающие за пределы
// контейнера (см. риск горизонтального переполнения на мобильном,
// многократно чинившийся в этом проекте — см. CLAUDE.md) — весь запас
// решается внутри тех же 0-100%, без overflow-трюков. R увеличен (было
// 26, до этого — 34) по прямой просьбе пользователя ("покрупнее сам
// круг... точки будут не так близко друг к другу"): подпись "cos α"
// больше не стоит СБОКУ от правой стрелки (см. RIGHT_LABEL_X/Y ниже —
// теперь она НАД стрелкой, тем же приёмом, что и "sin α" над верхней),
// поэтому освободившееся справа место можно отдать самому кругу без
// риска обрезания подписи, как было при R=34 раньше.
const CX = 50
const CY = 50
const R = 32

// toFixed(4) — не про визуальную точность (0.0001% контейнера ничтожна),
// а про гидратацию: Math.cos/Math.sin теоретически могут дать чуть разный
// float на последнем разряде между серверным (Node/V8) и клиентским
// (Chromium/V8) рантаймом на одном и том же угле — без округления это
// приводило к предупреждению "Prop style did not match" в консоли
// (несовпадение inline style между SSR и гидратацией). Фиксированная
// строка одинаковой длины гарантированно совпадает на обеих сторонах.
const pointPos = (angle: number) => ({
    left: (CX + R * Math.cos(angle)).toFixed(4),
    top: (CY - R * Math.sin(angle)).toFixed(4), // экранный Y растёт вниз — инвертируем
})

export const TypeUnitCircle = ({ question, onOptionSelected, isAnswerChecked }: Props) => {
    const data = question.unitCircle

    const [selected, setSelected] = useState<Set<number>>(new Set())
    // 'label'-режим — своё, отдельное состояние (не пересекается с
    // selected выше, у него другая форма ответа).
    const [assigned, setAssigned] = useState<Record<number, string | null>>({})
    const [activePointIdx, setActivePointIdx] = useState<number | null>(null)

    useEffect(() => {
        setSelected(new Set())
        if (data?.mode === 'label' && data.labelTargets) {
            const init: Record<number, string | null> = {}
            data.labelTargets.forEach((t) => { init[t.pointIndex] = null })
            setAssigned(init)
            setActivePointIdx(data.labelTargets[0]?.pointIndex ?? null)
        } else {
            setAssigned({})
            setActivePointIdx(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question])

    useEffect(() => {
        if (data?.mode === 'label') return // отдельный эффект ниже
        if (selected.size === 0) {
            onOptionSelected(null)
            return
        }
        onOptionSelected([...selected].sort((a, b) => a - b).join('|||'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected])

    useEffect(() => {
        if (data?.mode !== 'label') return
        const entries = Object.entries(assigned)
        if (entries.length === 0 || entries.some(([, v]) => v === null)) {
            onOptionSelected(null)
            return
        }
        const answer = entries
            .map(([idx, label]) => [Number(idx), label as string] as const)
            .sort((a, b) => a[0] - b[0])
            .map(([idx, label]) => `${idx}:${label}`)
            .join('|||')
        onOptionSelected(answer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assigned])

    if (!data) return null

    const isSelect = data.mode === 'select'
    const isLabel = data.mode === 'label'
    const correctSet = new Set(data.correctIndices)
    const targetIndices = new Set((data.labelTargets ?? []).map((t) => t.pointIndex))

    const handleClick = (idx: number) => {
        if (isAnswerChecked) return
        if (isLabel) {
            if (!targetIndices.has(idx)) return // остальные 14 точек неактивны
            setActivePointIdx(idx)
            return
        }
        setSelected((prev) => {
            const next = new Set(prev)
            if (isSelect) {
                // Несколько радиокнопок сразу — просто переключаем эту точку.
                next.has(idx) ? next.delete(idx) : next.add(idx)
            } else {
                // Одна точка за раз — повторный клик по уже выбранной снимает
                // выбор (даёт исправить промах), клик по другой заменяет.
                if (next.has(idx)) {
                    next.clear()
                } else {
                    next.clear()
                    next.add(idx)
                }
            }
            return next
        })
    }

    const handlePickLabel = (label: string) => {
        if (isAnswerChecked || activePointIdx === null) return
        setAssigned((prev) => {
            const next = { ...prev, [activePointIdx]: label }
            return next
        })
        // Автопереход на следующую ещё не подписанную отмеченную точку —
        // тот же round-robin приём, что у INSERT/TRIGTABLE/VIETA.
        const remaining = (data.labelTargets ?? []).find(
            (t) => t.pointIndex !== activePointIdx && assigned[t.pointIndex] === null,
        )
        if (remaining) setActivePointIdx(remaining.pointIndex)
    }

    // Конец стрелки-оси (за пределом окружности, но внутри 0-100%).
    // AXIS_GAP — явный зазор между краем круга и ОСНОВАНИЕМ наконечника
    // (не просто "AXIS_END = R + число", как было раньше) — при
    // укрупнении R с 26 до 32 предыдущая формула (R+6) незаметно
    // УМЕНЬШИЛА фактический зазор (был ~4 при R=26, стал ~2.5 при R=32),
    // из-за чего стрелка стала визуально сливаться с линией окружности
    // (поймано пользователем живьём). Теперь зазор задаётся отдельной
    // константой и не плавает при следующих правках R.
    const ARROW = 3
    const AXIS_GAP = 7 // % — от края круга до основания наконечника
    const AXIS_END = R + AXIS_GAP + ARROW // 42 — конец линии/центр наконечника
    // Обе подписи осей теперь стоят НАД своей стрелкой (по прямой
    // просьбе пользователя для "cos α" — раньше стояла СБОКУ от правой
    // стрелки и на широком круге не помещалась по ширине контейнера;
    // теперь она отзеркаливает уже работавший приём "sin α"). Горизонталь
    // подписи — x наконечника правой стрелки (CX+AXIS_END); вертикаль —
    // чуть выше центральной линии (CY минус зазор), сам див переносится
    // так, что его НИЖНИЙ край садится ровно на эту отметку
    // (-translate-y-full в разметке ниже) — гарантированный зазор от оси
    // независимо от размера шрифта.
    const RIGHT_LABEL_X = CX + AXIS_END // 88
    const RIGHT_LABEL_Y = CY - 6 // 44 — нижний край подписи "cos α"
    // Отрицательный отступ (выше самого контейнера круга) — по прямой
    // просьбе пользователя поднять "sin α" подальше от наконечника
    // верхней стрелки; родительские контейнеры не обрезают overflow, так
    // что уход за верхнюю границу 0-100% безопасен.
    const LABEL_TOP = -6 // % — верхний край подписи "sin α"

    // Пунктирная направляющая (sin/cos) — хорда окружности на уровне
    // guideValue: для sin — горизонтальная (y фиксирован, x — по обе
    // стороны от центра на половину хорды), для cos — вертикальная
    // (зеркально). При guideValue=±1 хорда вырождается в точку (касание
    // сверху/снизу или справа/слева) — half всегда получается 0, отрезок
    // просто не виден, отдельно этот случай не обрабатываем. Раньше было
    // условие isLabel && ... — теперь просто по guideAxis (sin/cos): у
    // tg своя, отдельная направляющая ниже, а не эта хорда (для тангенса
    // хорда через круг не имеет того же геометрического смысла).
    let guideLine: { x1: number; y1: number; x2: number; y2: number } | null = null
    if ((data.guideAxis === 'sin' || data.guideAxis === 'cos') && data.guideValue !== undefined) {
        const half = R * Math.sqrt(Math.max(0, 1 - data.guideValue * data.guideValue))
        if (data.guideAxis === 'sin') {
            const y = CY - R * data.guideValue
            guideLine = { x1: CX - half, y1: y, x2: CX + half, y2: y }
        } else {
            const x = CX + R * data.guideValue
            guideLine = { x1: x, y1: CY - half, x2: x, y2: CY + half }
        }
    }

    // Ось тангенса — вертикальная касательная СПРАВА от круга (по прямой
    // просьбе пользователя: "параллельно оси синусов... как бы
    // касательная к окружности"). Не строго впритык к дуге (TAN_LINE_X
    // чуть правее реальной точки касания CX+R) — нужен запас, чтобы
    // подпись значения слева от риски не наезжала на саму дугу, которая
    // рядом с точкой касания (angle=0) шире всего.
    //
    // Масштаб по вертикали НЕ 1:1 с радиусом — честная геометрическая
    // касательная для tg=√3≈1.73 (макс. значение в данных) ушла бы на
    // ~55 условных единиц от центра, далеко за пределы видимой области.
    // TAN_SCALE подобран так, чтобы весь диапазон значений (0..±√3)
    // укладывался в высоту линии с запасом — компромисс, не физически
    // точный масштаб, но сохраняет все качественные свойства (знак —
    // сторона, величина — расстояние от точки касания).
    // TAN_LINE_X — было CX+R+3, увеличено до +6: измерено живьём, +3 не
    // хватало зазора даже с TAN_MIN_OFFSET ниже (см. следующий коммент).
    const TAN_LINE_X = CX + R + 6
    const TAN_HALF_HEIGHT = 28
    const TAN_MAX_ABS = Math.sqrt(3)
    const TAN_SCALE = (TAN_HALF_HEIGHT - 2) / TAN_MAX_ABS
    // Измерено живьём: у маленьких |tg| (например √3/3≈0.577) чисто
    // линейный масштаб держал риску слишком близко к центру — там, где
    // дуга круга (у самой точки касания) шире всего, подпись слева от
    // риски заезжала на дугу (зазор уходил в минус, проверено дважды —
    // первая попытка TAN_MIN_OFFSET=14 всё ещё давала минус ~2%).
    // TAN_MIN_OFFSET — нижняя граница смещения от центра: даже самое
    // маленькое ненулевое |tg| в данных отодвигает риску настолько же
    // далеко, насколько среднее значение — жертвуем пропорциональностью
    // шкалы ради гарантированного зазора для подписи. tg=0 — законное
    // исключение (риска ровно в центре, как и было бы геометрически
    // честно).
    const TAN_MIN_OFFSET = 18
    let tanTickY: number | null = null
    if (data.guideAxis === 'tan' && data.guideValue !== undefined) {
        const v = data.guideValue
        const offset = v === 0 ? 0 : Math.sign(v) * Math.max(TAN_MIN_OFFSET, Math.abs(v) * TAN_SCALE)
        tanTickY = CY - offset
    }

    const activeTarget = isLabel ? (data.labelTargets ?? []).find((t) => t.pointIndex === activePointIdx) : undefined
    const usedForActive = new Set<string>() // варианты уже назначены ДРУГИМ точкам — не блокируем повтор специально, у каждой точки свой список

    return (
        <div className="w-full h-full max-w-[440px] mx-auto flex flex-col items-center gap-4 mt-2">
            <div className="relative w-full aspect-square select-none shrink-0">
                {/* Декоративный фон — сама окружность + оси со стрелками
                    (+ пунктирная направляющая в 'label'-режиме). Линии
                    потолще (было strokeWidth 1 везде) — по прямой просьбе
                    пользователя, вместе с укрупнением самого круга (R)
                    тонкие линии на большом радиусе выглядели непропорц-
                    ионально хрупкими. */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3A464E" strokeWidth="1.8" />

                    {/* Ось X — стрелка вправо (cos α) */}
                    <line x1={CX - AXIS_END} y1={CY} x2={CX + AXIS_END} y2={CY} stroke="#2A363D" strokeWidth="1.6" />
                    <polygon
                        points={`${CX + AXIS_END + ARROW},${CY} ${CX + AXIS_END - ARROW},${CY - ARROW * 0.7} ${CX + AXIS_END - ARROW},${CY + ARROW * 0.7}`}
                        fill="#4A5560"
                    />

                    {/* Ось Y — стрелка вверх (sin α) */}
                    <line x1={CX} y1={CY + AXIS_END} x2={CX} y2={CY - AXIS_END} stroke="#2A363D" strokeWidth="1.6" />
                    <polygon
                        points={`${CX},${CY - AXIS_END - ARROW} ${CX - ARROW * 0.7},${CY - AXIS_END + ARROW} ${CX + ARROW * 0.7},${CY - AXIS_END + ARROW}`}
                        fill="#4A5560"
                    />

                    <circle cx={CX} cy={CY} r="1.2" fill="#3A464E" />

                    {guideLine && (
                        <line
                            x1={guideLine.x1} y1={guideLine.y1} x2={guideLine.x2} y2={guideLine.y2}
                            stroke="#4A90D9" strokeWidth="1.4" strokeDasharray="2.6,1.8"
                        />
                    )}

                    {/* Риска-засечка ПРЯМО НА оси в точке guideValue — по
                        прямой просьбе пользователя, чтобы было видно на самой
                        оси (не только по пунктирной линии), какому значению
                        она соответствует. Короткий сплошной штрих поперёк
                        оси, толще самой оси — читается как деление шкалы. */}
                    {guideLine && data.guideAxis === 'sin' && (
                        <line x1={CX - 2.4} y1={guideLine.y1} x2={CX + 2.4} y2={guideLine.y1} stroke="#4A90D9" strokeWidth="1.8" />
                    )}
                    {guideLine && data.guideAxis === 'cos' && (
                        <line x1={guideLine.x1} y1={CY - 2.4} x2={guideLine.x1} y2={CY + 2.4} stroke="#4A90D9" strokeWidth="1.8" />
                    )}

                    {/* Ось тангенса — своя вертикальная линия (см. TAN_LINE_X
                        выше), не хорда через круг: рисуется только в
                        tg-заданиях (guideAxis==='tan'), нейтральным серым —
                        читается как "ещё одна ось", а не как акцентная
                        подсказка (акцент — только у самой риски, ниже). */}
                    {tanTickY !== null && (
                        <>
                            <line
                                x1={TAN_LINE_X} y1={CY - TAN_HALF_HEIGHT} x2={TAN_LINE_X} y2={CY + TAN_HALF_HEIGHT}
                                stroke="#2A363D" strokeWidth="1.4"
                            />
                            <line x1={TAN_LINE_X - 2.4} y1={tanTickY} x2={TAN_LINE_X + 2.4} y2={tanTickY} stroke="#4A90D9" strokeWidth="1.8" />
                        </>
                    )}
                </svg>

                {/* Подпись значения риски (guideValueLabel) — рядом с самой
                    риской, но СМЕЩЕНА от неё (по прямой просьбе пользователя
                    2026-09-09 — раньше стояла вертикально/горизонтально ПО
                    ЦЕНТРУ риски и сливалась с самой пунктирной линией):
                    - sin (горизонтальная риска/линия) — подпись НИЖЕ риски
                      (top без -translate-y — верхний край текста стартует
                      сразу под линией, не по центру на ней), слева от оси Y
                      (без изменений, там зазор уже был верный);
                    - cos (вертикальная риска/линия) — подпись СБОКУ от
                      риски (не по центру на ней): вправо, если guideValue
                      неотрицательный (риска и так справа от центра — сдвиг
                      вправо ведёт ДАЛЬШЕ от оси Y, не ближе), влево иначе —
                      так подпись никогда не двигается К оси Y, только от неё. */}
                {guideLine && data.guideAxis === 'sin' && data.guideValueLabel && (
                    <div
                        className="absolute -translate-x-full whitespace-nowrap text-[#4A90D9] font-bold text-xs sm:text-sm pr-1"
                        style={{ left: `${CX - 3}%`, top: `${guideLine.y1 + 4}%` }}
                    >
                        <Latex>{`$${data.guideValueLabel}$`}</Latex>
                    </div>
                )}
                {guideLine && data.guideAxis === 'cos' && data.guideValueLabel && (
                    <div
                        className="absolute whitespace-nowrap text-[#4A90D9] font-bold text-xs sm:text-sm pt-0.5"
                        style={{
                            left: `${guideLine.x1}%`,
                            top: `${CY + 3}%`,
                            transform: (data.guideValue ?? 0) >= 0 ? 'translateX(6px)' : 'translateX(calc(-100% - 6px))',
                        }}
                    >
                        <Latex>{`$${data.guideValueLabel}$`}</Latex>
                    </div>
                )}

                {/* Подпись значения на оси тангенса — СЛЕВА от риски (по
                    прямой просьбе пользователя). Шрифт мельче, чем у
                    sin/cos-рисок (text-[10px] sm:text-xs) — эта подпись
                    ближе к дуге круга (риска у самой точки касания).
                    Вертикально — НЕ центрирована на высоте риски (как
                    было раньше): измерено живьём — при центрировании
                    нижняя половина многострочной дроби (например √3/3)
                    у маленьких |tg| заезжала на дугу, которая около
                    точки касания шире всего. Вместо этого — растёт ТОЛЬКО
                    от риски В СТОРОНУ ОТ ЦЕНТРА (вверх для tg>0, вниз для
                    tg<0), тем же принципом, что уже применён для подписи
                    выбранного угла у точки. */}
                {tanTickY !== null && data.guideValueLabel && (
                    <div
                        className={cn(
                            'absolute -translate-x-full whitespace-nowrap text-[#4A90D9] font-bold text-[10px] sm:text-xs pr-1',
                            (data.guideValue ?? 0) >= 0 ? '-translate-y-full' : '',
                        )}
                        style={{ left: `${TAN_LINE_X - 1}%`, top: `${tanTickY}%` }}
                    >
                        <Latex>{`$${data.guideValueLabel}$`}</Latex>
                    </div>
                )}

                {/* Подписи осей — обычный HTML (не SVG-text), чтобы размер
                    шрифта был предсказуем в rem/px и не зависел от масштаба
                    viewBox. Обе подписи стоят НАД своей стрелкой (по прямой
                    просьбе пользователя для "cos α" — раньше стояла сбоку от
                    правой стрелки и на широком круге упиралась в край
                    контейнера) — div переносится своим НИЖНИМ краем на
                    заранее вычисленную отметку (-translate-y-full), с
                    гарантированным зазором от самой линии оси. */}
                <div
                    className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-[#8CA0AB] font-black text-base sm:text-xl"
                    style={{ left: `${RIGHT_LABEL_X}%`, top: `${RIGHT_LABEL_Y}%` }}
                >
                    <Latex>{'$\\cos\\alpha$'}</Latex>
                </div>
                <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[#8CA0AB] font-black text-base sm:text-xl"
                    style={{ top: `${LABEL_TOP}%` }}
                >
                    <Latex>{'$\\sin\\alpha$'}</Latex>
                </div>

                {data.points.map((point, idx) => {
                    const { left, top } = pointPos(point.angle)
                    const isSelected = selected.has(idx)
                    const isCorrectPoint = correctSet.has(idx)
                    const isTarget = isLabel && targetIndices.has(idx)
                    const isActiveTargetPoint = isLabel && activePointIdx === idx
                    const assignedLabel = isLabel ? assigned[idx] : undefined
                    const isThisPointCorrect = isLabel && assignedLabel === point.label

                    // Радиокнопка — маленький кружок ТОЧНО на линии окружности:
                    // невидимая (прозрачная) внешняя кнопка даёт удобную зону
                    // клика (особенно на телефоне), а видимый кружок внутри —
                    // фиксированного маленького размера, не растущего с зоной
                    // клика, чтобы визуально не съезжать с линии.
                    //
                    // Правильная точка ПОСЛЕ проверки — не просто зелёный
                    // цвет (при 12-14px размере это легко не заметить среди
                    // 16 точек, пользователь пожаловался, что "не видно, где
                    // правильный ответ") — дополнительно крупнее (scale) и со
                    // свечением (glow), чтобы бросалось в глаза даже беглым
                    // взглядом, независимо от того, выбрал её пользователь или
                    // нет.
                    let dotClass = 'border-2 border-[#4A5560] bg-[#151F24]'
                    let glowClass = ''
                    let correctScale = 1

                    if (isLabel) {
                        // В 'label'-режиме НЕ-целевые точки — просто приглушены
                        // и некликабельны (только направляющая+2 точки имеют
                        // смысл); целевые — своя цветовая логика ниже.
                        if (!isTarget) {
                            dotClass = 'border-2 border-[#26313A] bg-[#181F24] opacity-40'
                        } else if (isAnswerChecked) {
                            dotClass = isThisPointCorrect
                                ? 'border-2 border-[#A1D151] bg-[#A1D151]'
                                : 'border-2 border-[#DC605B] bg-[#DC605B]'
                            glowClass = isThisPointCorrect ? 'shadow-[0_0_0_5px_rgba(161,209,81,0.35)]' : ''
                            correctScale = isThisPointCorrect ? 1.5 : 1.2
                        } else if (isActiveTargetPoint) {
                            dotClass = 'border-2 border-[#4A90D9] bg-[#4A90D9]'
                            correctScale = 1.3
                        } else {
                            dotClass = assignedLabel
                                ? 'border-2 border-[#4A90D9] bg-[#1B2C3D]'
                                : 'border-2 border-[#4A90D9] bg-[#151F24]'
                        }
                    } else if (!isAnswerChecked && isSelected) {
                        dotClass = 'border-2 border-[#4A90D9] bg-[#4A90D9]'
                    } else if (isAnswerChecked && isCorrectPoint) {
                        dotClass = 'border-2 border-[#A1D151] bg-[#A1D151]'
                        glowClass = 'shadow-[0_0_0_5px_rgba(161,209,81,0.35)]'
                        correctScale = 1.5
                    } else if (isAnswerChecked && isSelected && !isCorrectPoint) {
                        dotClass = 'border-2 border-[#DC605B] bg-[#DC605B]'
                    } else if (isAnswerChecked) {
                        dotClass = 'border-2 border-[#333F47] bg-[#181F24] opacity-60'
                    }

                    const clickable = isLabel ? isTarget && !isAnswerChecked : !isAnswerChecked

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleClick(idx)}
                            disabled={!clickable}
                            aria-label={point.label}
                            className={cn(
                                'absolute flex items-center justify-center rounded-full',
                                'w-9 h-9 sm:w-10 sm:h-10', // зона клика — увеличена по просьбе пользователя
                                clickable && 'cursor-pointer',
                            )}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <motion.span
                                className={cn('block rounded-full w-4 h-4 sm:w-[18px] sm:h-[18px]', dotClass, glowClass)}
                                animate={{
                                    scale: isLabel
                                        ? correctScale
                                        : !isAnswerChecked && isSelected ? 1.25 : correctScale,
                                }}
                                whileTap={clickable ? { scale: 0.85 } : undefined}
                                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                            />

                            {/* Подпись, которую пользователь САМ выбрал для этой
                                точки — единственное исключение из "точки без
                                подписей", это его собственный ответ, а не
                                подсказка. */}
                            {isTarget && assignedLabel && (
                                <motion.span
                                    // key={assignedLabel} — при КАЖДОЙ смене выбранного
                                    // варианта (не только первом появлении) React
                                    // пересоздаёт узел и заново играет entrance-bounce —
                                    // по прямой просьбе пользователя, чтобы смена угла у
                                    // радиокнопки была явно заметна, не только текстом.
                                    key={assignedLabel}
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                                    className={cn(
                                        // Крупнее и жирнее (было text-[10px] sm:text-xs) — по
                                        // прямой просьбе пользователя: это собственный ответ
                                        // ученика, дублируемый прямо на окружности, должен
                                        // читаться с первого взгляда, не мельче самих точек.
                                        //
                                        // Сторона роста подписи зависит от того, в какой
                                        // половине круга точка (parseFloat(left) относительно
                                        // CX) — единый сдвиг "всегда влево" (первая версия,
                                        // 2026-09-09) убирал наложение на дугу СПРАВА, но
                                        // создавал его же СЛЕВА (там дуга загибается обратно к
                                        // центру ближе к горизонтали, и подпись, растущая ещё
                                        // левее и ниже, попадала на неё). Теперь: у точек справа
                                        // от центра — растёт влево (right-1/2, как раньше), у
                                        // точек слева — вправо (left-1/2, зеркально) — то есть
                                        // всегда К ЦЕНТРУ круга по горизонтали, где дуга дальше.
                                        parseFloat(left) >= CX ? 'absolute right-1/2 top-full mt-1' : 'absolute left-1/2 top-full mt-1',
                                        'whitespace-nowrap text-sm sm:text-base font-black px-1 rounded',
                                        isAnswerChecked
                                            ? isThisPointCorrect ? 'text-[#A1D151]' : 'text-[#DC605B]'
                                            : 'text-[#4A90D9]',
                                    )}
                                >
                                    <Latex>{`$${assignedLabel}$`}</Latex>
                                </motion.span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* 'label'-режим — варианты подписи для АКТИВНОЙ отмеченной
                точки (не общий пул, у каждой точки свой список вариантов,
                см. UnitCircleData.labelTargets в page.tsx). */}
            {isLabel && activeTarget && (
                <div className="flex flex-col items-center gap-2 w-full">
                    <div className="text-xs text-[#8CA0AB]">Выбери значение для выделенной точки</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {activeTarget.options.map((label) => (
                            <motion.button
                                key={label}
                                type="button"
                                whileTap={!isAnswerChecked ? { scale: 0.9 } : undefined}
                                onClick={() => handlePickLabel(label)}
                                disabled={isAnswerChecked}
                                className={cn(
                                    'min-w-[64px] py-2 px-3 rounded-lg border-2 text-sm font-bold transition-colors',
                                    assigned[activePointIdx!] === label
                                        ? 'border-[#4A90D9] bg-[#1B2C3D] text-[#4A90D9]'
                                        : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                )}
                            >
                                <Latex>{`$${label}$`}</Latex>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
