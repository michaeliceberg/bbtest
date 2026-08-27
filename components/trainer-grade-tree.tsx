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

import Link from 'next/link';
import { Egg, Shield, Sword, Crown, Gift } from 'lucide-react';

const STAGE_ICONS = [Egg, Shield, Sword, Crown];
// 90%, как у последовательной разблокировки уроков в юните, для одного
// короткого круга (3-6 вопросов) на этап оказалось слишком жёстко —
// один неверный ответ уже не даёт пройти дальше. Порог ниже.
const UNLOCK_THRESHOLD = 50;

export type SkillStage = {
    id: number;
    percentage: number;
};

export type SkillTopic = {
    id: number;
    title: string;
    percentage: number;
    stages: SkillStage[];
};

interface Props {
    topics: SkillTopic[];
}

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
                            <div className="flex items-center">
                                {topic.stages.map((s, idx) => {
                                    const unlocked = idx === 0 || topic.stages[idx - 1].percentage >= UNLOCK_THRESHOLD;
                                    const done = s.percentage >= UNLOCK_THRESHOLD;
                                    const isLast = idx === topic.stages.length - 1;
                                    const Icon = STAGE_ICONS[idx % STAGE_ICONS.length];

                                    return (
                                        <div key={s.id} className="flex items-center flex-1 last:flex-initial">
                                            {unlocked ? (
                                                <Link
                                                    href={`/t-lesson/${s.id}`}
                                                    className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                    style={{
                                                        backgroundColor: done ? '#5FA12F' : '#232F35',
                                                        border: `2px solid ${done ? '#78C93C' : '#4897D1'}`,
                                                    }}
                                                >
                                                    <Icon className="w-4 h-4" style={{ color: done ? '#16240C' : '#4897D1' }} />
                                                    {isLast && done && (
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

                                            {idx < topic.stages.length - 1 && (
                                                <div
                                                    className="flex-1 h-0.5 mx-0.5"
                                                    style={{ backgroundColor: done ? '#78C93C' : '#3A464E' }}
                                                />
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
