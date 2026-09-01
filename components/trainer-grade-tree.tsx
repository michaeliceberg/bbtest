// components/trainer-grade-tree.tsx
//
// Карта скиллов тренажёра: темы (t_unit) — вертикальный список карточек,
// все сразу доступны (темы друг от друга не зависят). Внутри темы —
// этапы (t_lesson, обычно 4), открывающиеся последовательно по мере
// тренировки именно этой темы.
//
// Раньше здесь ещё был переключатель класса (9/10/11) поверх тем — с
// переходом на модель "класс = отдельный t_course, а не t_unit внутри
// одного трейнера" переключатель класса больше не нужен НА ЭТОМ уровне:
// выбор класса происходит выше, на уровне выбора самого t_course.

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Egg, Shield, Sword, Crown, Gift } from 'lucide-react';
import { TrainerStageLink } from './trainer-stage-link';

const STAGE_ICONS = [Egg, Shield, Sword, Crown];
// 90%, как у последовательной разблокировки уроков в юните, для одного
// короткого круга (3-6 вопросов) на этап оказалось слишком жёстко —
// один неверный ответ уже не даёт пройти дальше. Порог ниже.
const UNLOCK_THRESHOLD = 50;

// Этапов на тему может стать больше 4 (обсуждалось — вплоть до 8) — в
// один горизонтальный ряд столько не влезает, особенно на телефоне.
// Поэтому ряды по COLUMNS_PER_ROW штук, "змейкой" — чётный ряд (0, 2, ...)
// слева направо, нечётный — справа налево, с коротким вертикальным
// соединителем на том краю, где заканчивается предыдущий ряд.
const COLUMNS_PER_ROW = 4;

// Цвета "премиального done" — те же значения, что заданы в inline-style
// ниже, вынесены в константы, т.к. теперь используются в двух местах
// (обычный статичный рендер + анимированный crossfade при reveal).
const DONE_GRADIENT = 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)';
const DONE_BORDER = '#C4B5FD';
const DONE_GLOW = '0 0 12px -2px rgba(167, 139, 250, 0.55)';
const DONE_ICON_COLOR = '#F5F0FF';
const UNLOCKED_BORDER = '#4897D1';
const UNLOCKED_BG = '#232F35';
const LOCKED_BORDER = '#3A464E';
const LOCKED_ICON_COLOR = '#56646C';

export type SkillStage = {
    id: number;
    percentage: number;
    title: string;
};

// Мини-босс на промежуточном этапе ("контрольная" с миксом уже пройденных
// формул, между обычными этапами) — тот же HP-бар-босс, что раньше был
// только на последнем ("корона") этапе темы, просто навешивается ещё и
// здесь. Определяется по названию урока — без миграции схемы под
// отдельный флаг; конвенция: урок с "контрольная" в названии.
const isReviewStage = (title: string): boolean => /контрольн/i.test(title);

export type SkillTopic = {
    id: number;
    title: string;
    percentage: number;
    stages: SkillStage[];
};

interface Props {
    topics: SkillTopic[];
}

const chunkStages = (stages: SkillStage[], size: number): SkillStage[][] => {
    const rows: SkillStage[][] = [];
    for (let i = 0; i < stages.length; i += size) {
        rows.push(stages.slice(i, i + size));
    }
    return rows;
};

// Сама иконка этапа (яйцо/щит/меч/корона или 👹 для босса) — вынесена в
// функцию, чтобы не дублировать JSX в трёх разных визуальных состояниях
// одного и того же квадратика (locked / unlocked-not-done / done).
const StageIcon = ({
    isBoss,
    Icon,
    color,
    dim = false,
}: {
    isBoss: boolean;
    Icon: typeof Egg;
    color: string;
    dim?: boolean;
}) => (
    isBoss
        ? <span className={`text-base leading-none transition-[filter,opacity] duration-300 ${dim ? 'grayscale opacity-50' : ''}`}>👹</span>
        : <Icon className="w-4 h-4 transition-colors duration-300" style={{ color }} />
);

const BossGiftBadge = () => (
    <span
        className="absolute -top-2 -right-2 w-4 h-4 rounded flex items-center justify-center"
        style={{ backgroundColor: '#EF9F27' }}
    >
        <Gift className="w-2.5 h-2.5" style={{ color: '#412402' }} />
    </span>
);

export const TrainerGradeTree = ({ topics }: Props) => {
    // Reveal-анимация "только что прошёл этот этап" — сигнал приходит из
    // app/t-lesson/[t_lessonId]/TQUIZ.tsx (handleFinishLesson) через
    // sessionStorage, читается ровно один раз при монтировании и сразу
    // стирается (обновление страницы после этого не повторяет анимацию).
    // Три фазы с нарастающей задержкой — цепная реакция "квадратик
    // засветился → фитиль добежал → следующий квадратик разблокировался",
    // а не всё одновременно.
    const [pendingRevealId, setPendingRevealId] = useState<number | null>(null);
    const [stageRevealed, setStageRevealed] = useState(false);
    const [connectorRevealed, setConnectorRevealed] = useState(false);
    const [nextRevealed, setNextRevealed] = useState(false);
    // React 18 Strict Mode в dev нарочно вызывает setup→cleanup→setup ещё
    // раз при монтировании (проверка чистоты эффектов) — с обычным
    // return-cleanup, отменяющим setTimeout, ПЕРВЫЙ набор таймеров
    // отменялся до срабатывания, а ВТОРОЙ setup уже не находил флаг в
    // sessionStorage (он был потреблён первым же вызовом) и просто ничего
    // не планировал заново — итог: pendingRevealId выставлялся, а сама
    // цепочка reveal-фаз никогда не срабатывала (проверено живьём — все
    // квадратики застревали в "исходном" состоянии). Ref-гвард не даёт
    // повторному setup что-либо перезапускать; без cleanup-отмены таймеры
    // спокойно доживают до срабатывания.
    const startedRef = React.useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        let raw: string | null = null;
        try {
            raw = sessionStorage.getItem('justCompletedTLesson');
        } catch {
            return;
        }
        if (!raw) return;
        sessionStorage.removeItem('justCompletedTLesson');
        const id = Number(raw);
        // Анимируем, только если этап РЕАЛЬНО сейчас числится решённым —
        // иначе (например, урок пройден без 90%+ или id устарел) молча
        // ничего не делаем, а не показываем анимацию "в никуда".
        const isActuallyDone = topics.some((t) => t.stages.some((s) => s.id === id && s.percentage >= UNLOCK_THRESHOLD));
        if (!isActuallyDone) return;

        startedRef.current = true;
        setPendingRevealId(id);
        setTimeout(() => setStageRevealed(true), 150);
        setTimeout(() => setConnectorRevealed(true), 600);
        setTimeout(() => setNextRevealed(true), 1100);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="flex flex-col gap-2.5">
                {topics.map((topic) => (
                    <div key={topic.id} className="bg-[#1A252B] rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-sm font-medium text-[#F2F7FB]">{topic.title}</span>
                            <span className="text-xs text-[#9AA7B0]">{topic.percentage}%</span>
                        </div>

                        {topic.stages.length > 0 && (
                            <div className="flex flex-col">
                                {chunkStages(topic.stages, COLUMNS_PER_ROW).map((row, rowIdx, allRows) => {
                                    const rowStartIdx = rowIdx * COLUMNS_PER_ROW;
                                    const isReversed = rowIdx % 2 === 1;
                                    const isLastRow = rowIdx === allRows.length - 1;

                                    // Фиксированная сетка на COLUMNS_PER_ROW колонок
                                    // боксов, между ними — колонки-"щели" под линию
                                    // соединителя (бокс,щель,бокс,щель,...,бокс).
                                    // Раньше ряд был обычным flex — при НЕПОЛНОМ
                                    // ряду (последняя тема, этапов не кратно 4) он
                                    // просто сжимался до фактического числа боксов
                                    // и растягивался на всю ширину карточки, из-за
                                    // чего элементы уезжали не в свои колонки. Сетка
                                    // с явными колонками, где недостающие боксы —
                                    // просто пустая ячейка, решает это: у каждого
                                    // этапа всегда его "настоящая" колонка, даже
                                    // если ряд не заполнен целиком.
                                    const gridTemplate = Array.from({ length: COLUMNS_PER_ROW }, () => '36px').join(' 1fr ');

                                    // Колонка бокса под порядковым номером внутри
                                    // ряда j (0-индекс) — при развороте ряда змейкой
                                    // считаем от конца, независимо от того, сколько
                                    // боксов реально есть в ряду (иначе неполный
                                    // развёрнутый ряд не дотягивался бы до правого
                                    // края, где должен продолжать предыдущий ряд).
                                    const boxColumn = (j: number) => (isReversed ? COLUMNS_PER_ROW - 1 - j : j) * 2 + 1;

                                    return (
                                        <div key={rowIdx}>
                                            <div className="grid items-center" style={{ gridTemplateColumns: gridTemplate }}>
                                                {row.map((s, j) => {
                                                    const trueIdx = rowStartIdx + j;
                                                    const prevStage = trueIdx > 0 ? topic.stages[trueIdx - 1] : null;
                                                    const unlockedReal = trueIdx === 0 || (prevStage !== null && prevStage.percentage >= UNLOCK_THRESHOLD);
                                                    const doneReal = s.percentage >= UNLOCK_THRESHOLD;
                                                    const isLastOverall = trueIdx === topic.stages.length - 1;
                                                    // Финальный этап темы — всегда босс; промежуточный
                                                    // "контрольная"-урок (по названию, см. isReviewStage
                                                    // выше) — тоже, мини-босс с миксом уже пройденных формул.
                                                    const isBoss = isLastOverall || isReviewStage(s.title);
                                                    const Icon = STAGE_ICONS[trueIdx % STAGE_ICONS.length];
                                                    const col = boxColumn(j);

                                                    // Этот квадратик — тот самый, что пользователь только
                                                    // что прошёл (reveal "locked-visual → done-visual"), или
                                                    // следующий за ним (reveal "locked → unlocked"). Оба флага
                                                    // взаимоисключающие для одного и того же трюка id.
                                                    const isRevealTarget = pendingRevealId !== null && s.id === pendingRevealId;
                                                    const isRevealNext = pendingRevealId !== null && prevStage !== null && prevStage.id === pendingRevealId;

                                                    // "Видимое" (возможно, ещё задержанное анимацией)
                                                    // состояние — используется для всего остального в этой
                                                    // итерации (цвет соединителя дальше по коду).
                                                    const done = isRevealTarget ? (stageRevealed && doneReal) : doneReal;
                                                    const unlocked = isRevealNext ? (nextRevealed && unlockedReal) : unlockedReal;

                                                    let stageBox: React.ReactNode;

                                                    if (isRevealTarget) {
                                                        // Кроссфейд между "было" (обычный незавершённый вид)
                                                        // и "стало" (премиальный градиент) — CSS/framer-motion
                                                        // не умеют плавно интерполировать МЕЖДУ двумя разными
                                                        // background-градиентами напрямую, поэтому оба слоя
                                                        // рендерятся одновременно друг над другом и один гаснет,
                                                        // пока другой проявляется.
                                                        stageBox = (
                                                            <div className="relative w-9 h-9">
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    animate={{ opacity: stageRevealed ? 0 : 1 }}
                                                                    transition={{ duration: 0.35 }}
                                                                >
                                                                    <TrainerStageLink
                                                                        href={`/t-lesson/${s.id}${isBoss ? '?boss=1' : ''}`}
                                                                        className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                        style={{ background: UNLOCKED_BG, border: `2px solid ${UNLOCKED_BORDER}` }}
                                                                        icon={<StageIcon isBoss={isBoss} Icon={Icon} color={UNLOCKED_BORDER} />}
                                                                    />
                                                                </motion.div>
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    initial={{ opacity: 0, scale: 1 }}
                                                                    animate={stageRevealed ? { opacity: 1, scale: [1, 1.2, 1] } : { opacity: 0 }}
                                                                    transition={{ duration: 0.55, ease: 'easeOut' }}
                                                                >
                                                                    <TrainerStageLink
                                                                        href={`/t-lesson/${s.id}${isBoss ? '?boss=1' : ''}`}
                                                                        className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                        style={{ background: DONE_GRADIENT, border: `2px solid ${DONE_BORDER}`, boxShadow: DONE_GLOW }}
                                                                        icon={<StageIcon isBoss={isBoss} Icon={Icon} color={DONE_ICON_COLOR} />}
                                                                        extra={isBoss ? <BossGiftBadge /> : null}
                                                                    />
                                                                </motion.div>
                                                            </div>
                                                        );
                                                    } else if (isRevealNext) {
                                                        // Locked-заглушка (даже не ссылка) гаснет, под ней
                                                        // проявляется настоящая рабочая TrainerStageLink —
                                                        // ровно момент "теперь сюда можно зайти".
                                                        stageBox = (
                                                            <div className="relative w-9 h-9">
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    animate={{ opacity: nextRevealed ? 0 : 1 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    <div
                                                                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                                                        style={{ border: `2px solid ${LOCKED_BORDER}` }}
                                                                    >
                                                                        <StageIcon isBoss={isBoss} Icon={Icon} color={LOCKED_ICON_COLOR} dim />
                                                                    </div>
                                                                </motion.div>
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={nextRevealed ? { opacity: 1, scale: [0.8, 1.12, 1] } : { opacity: 0 }}
                                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                >
                                                                    <TrainerStageLink
                                                                        href={`/t-lesson/${s.id}${isBoss ? '?boss=1' : ''}`}
                                                                        className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                        style={{ background: UNLOCKED_BG, border: `2px solid ${UNLOCKED_BORDER}` }}
                                                                        icon={<StageIcon isBoss={isBoss} Icon={Icon} color={UNLOCKED_BORDER} />}
                                                                    />
                                                                </motion.div>
                                                            </div>
                                                        );
                                                    } else if (unlocked) {
                                                        stageBox = (
                                                            <TrainerStageLink
                                                                href={`/t-lesson/${s.id}${isBoss ? '?boss=1' : ''}`}
                                                                className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                style={{
                                                                    background: done ? DONE_GRADIENT : UNLOCKED_BG,
                                                                    border: `2px solid ${done ? DONE_BORDER : UNLOCKED_BORDER}`,
                                                                    boxShadow: done ? DONE_GLOW : undefined,
                                                                }}
                                                                icon={<StageIcon isBoss={isBoss} Icon={Icon} color={done ? DONE_ICON_COLOR : UNLOCKED_BORDER} />}
                                                                extra={isBoss && done ? <BossGiftBadge /> : null}
                                                            />
                                                        );
                                                    } else {
                                                        stageBox = (
                                                            <div
                                                                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                                                style={{ border: `2px solid ${LOCKED_BORDER}` }}
                                                            >
                                                                <StageIcon isBoss={isBoss} Icon={Icon} color={LOCKED_ICON_COLOR} dim />
                                                            </div>
                                                        );
                                                    }

                                                    // "Фитиль" — соединитель ДО следующего бокса в этом же
                                                    // ряду. Реальный прогрессивный залив (scaleX от 0 до 1)
                                                    // только для конкретно того соединителя, что идёт СРАЗУ
                                                    // после только что пройденного этапа — остальные просто
                                                    // статично в своём цвете, без анимации на каждый рендер.
                                                    const isFuseHere = isRevealTarget && j < row.length - 1;

                                                    return (
                                                        <React.Fragment key={s.id}>
                                                            <div style={{ gridColumn: col, gridRow: 1 }} className="flex justify-center">
                                                                {stageBox}
                                                            </div>

                                                            {j < row.length - 1 && (
                                                                <div
                                                                    style={{
                                                                        gridColumn: Math.min(col, boxColumn(j + 1)) + 1,
                                                                        gridRow: 1,
                                                                        backgroundColor: LOCKED_BORDER,
                                                                    }}
                                                                    className="h-0.5 relative overflow-hidden rounded-full"
                                                                >
                                                                    {(done || isFuseHere) && (
                                                                        <motion.div
                                                                            className="absolute inset-0 rounded-full"
                                                                            style={{ backgroundColor: '#A78BFA', transformOrigin: isReversed ? 'right' : 'left' }}
                                                                            initial={isFuseHere ? { scaleX: 0 } : false}
                                                                            animate={{ scaleX: isFuseHere ? (connectorRevealed ? 1 : 0) : 1 }}
                                                                            transition={isFuseHere ? { duration: 0.45, ease: 'easeInOut' } : { duration: 0 }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                            {!isLastRow && (() => {
                                                // Тот же "фитиль" для вертикального соединителя между
                                                // рядами — срабатывает, только когда только что пройденный
                                                // этап оказался ПОСЛЕДНИМ в своём ряду (следующий этап уже
                                                // на новой строке змейки).
                                                const lastInRow = row[row.length - 1];
                                                const isFuseHereVertical = pendingRevealId !== null && lastInRow.id === pendingRevealId;
                                                const doneHere = lastInRow.percentage >= UNLOCK_THRESHOLD;
                                                return (
                                                    <div className={`flex ${isReversed ? 'justify-start' : 'justify-end'}`}>
                                                        <div className="w-9 flex justify-center">
                                                            <div
                                                                className="w-0.5 h-6 relative overflow-hidden rounded-full"
                                                                style={{ backgroundColor: LOCKED_BORDER }}
                                                            >
                                                                {(doneHere || isFuseHereVertical) && (
                                                                    <motion.div
                                                                        className="absolute inset-0 rounded-full"
                                                                        style={{ backgroundColor: '#A78BFA', transformOrigin: 'top' }}
                                                                        initial={isFuseHereVertical ? { scaleY: 0 } : false}
                                                                        animate={{ scaleY: isFuseHereVertical ? (connectorRevealed ? 1 : 0) : 1 }}
                                                                        transition={isFuseHereVertical ? { duration: 0.45, ease: 'easeInOut' } : { duration: 0 }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
