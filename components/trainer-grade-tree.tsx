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

import React from 'react';
import Link from 'next/link';
import { Egg, Shield, Sword, Crown, Gift } from 'lucide-react';

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

export const TrainerGradeTree = ({ topics }: Props) => {
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
                                                    const unlocked = trueIdx === 0 || topic.stages[trueIdx - 1].percentage >= UNLOCK_THRESHOLD;
                                                    const done = s.percentage >= UNLOCK_THRESHOLD;
                                                    const isLastOverall = trueIdx === topic.stages.length - 1;
                                                    // Финальный этап темы — всегда босс; промежуточный
                                                    // "контрольная"-урок (по названию, см. isReviewStage
                                                    // выше) — тоже, мини-босс с миксом уже пройденных формул.
                                                    const isBoss = isLastOverall || isReviewStage(s.title);
                                                    const Icon = STAGE_ICONS[trueIdx % STAGE_ICONS.length];
                                                    const col = boxColumn(j);

                                                    return (
                                                        <React.Fragment key={s.id}>
                                                            <div style={{ gridColumn: col, gridRow: 1 }} className="flex justify-center">
                                                                {unlocked ? (
                                                                    <Link
                                                                        href={`/t-lesson/${s.id}${isBoss ? '?boss=1' : ''}`}
                                                                        className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                        style={{
                                                                            backgroundColor: done ? '#5FA12F' : '#232F35',
                                                                            border: `2px solid ${done ? '#78C93C' : '#4897D1'}`,
                                                                        }}
                                                                    >
                                                                        <Icon className="w-4 h-4" style={{ color: done ? '#16240C' : '#4897D1' }} />
                                                                        {isBoss && done && (
                                                                            <span
                                                                                className="absolute -top-2 -right-2 w-4 h-4 rounded flex items-center justify-center"
                                                                                style={{ backgroundColor: '#EF9F27' }}
                                                                            >
                                                                                <Gift className="w-2.5 h-2.5" style={{ color: '#412402' }} />
                                                                            </span>
                                                                        )}
                                                                    </Link>
                                                                ) : (
                                                                    <div
                                                                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                                                        style={{ border: '2px solid #3A464E' }}
                                                                    >
                                                                        <Icon className="w-4 h-4" style={{ color: '#56646C' }} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {j < row.length - 1 && (
                                                                <div
                                                                    style={{
                                                                        gridColumn: Math.min(col, boxColumn(j + 1)) + 1,
                                                                        gridRow: 1,
                                                                        backgroundColor: done ? '#78C93C' : '#3A464E',
                                                                    }}
                                                                    className="h-0.5"
                                                                />
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                            {!isLastRow && (
                                                <div className={`flex ${isReversed ? 'justify-start' : 'justify-end'}`}>
                                                    <div className="w-9 flex justify-center">
                                                        <div
                                                            className="w-0.5 h-6"
                                                            style={{ backgroundColor: (row[row.length - 1].percentage >= UNLOCK_THRESHOLD) ? '#78C93C' : '#3A464E' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
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
