'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, Star, Zap, Trophy, Gift, Flame } from 'lucide-react';

export interface SkillLesson {
    id: number;
    title: string;
    percentage: number;
    isDisabled: boolean;
    isInQuest?: boolean;
    hasHw?: boolean;
}

export interface SkillUnit {
    id: number;
    title: string;
    percentage: number;
    lessons: SkillLesson[];
}

interface Props {
    units: SkillUnit[];
}

// Иконки для уроков (в порядке чередования для разнообразия)
const LESSON_ICONS = [
    { icon: Star, label: 'Star' },
    { icon: Zap, label: 'Lightning' },
    { icon: Trophy, label: 'Trophy' },
    { icon: Gift, label: 'Gift' },
    { icon: Flame, label: 'Flame' },
];

const getLessonIcon = (index: number) => {
    return LESSON_ICONS[index % LESSON_ICONS.length];
};

export const TrainerSkillTree = ({ units }: Props) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 12,
            },
        },
    };

    const lessonVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 150,
                damping: 10,
            },
        },
        hover: {
            scale: 1.08,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 10,
            },
        },
    };

    return (
        <motion.div
            className="w-full max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {units.map((unit) => (
                <motion.div
                    key={unit.id}
                    className="mb-12"
                    variants={itemVariants}
                >
                    {/* Unit Title */}
                    <div className="mb-6 pl-4">
                        <h3 className="text-xl font-bold text-[#F2F7FB] mb-2">
                            {unit.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#232F34] rounded-full overflow-hidden max-w-xs">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#A1D051] to-[#678337]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${unit.percentage}%` }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                />
                            </div>
                            <span className="text-sm text-[#9AA7B0]">
                                {unit.percentage}%
                            </span>
                        </div>
                    </div>

                    {/* Lessons Grid */}
                    <div className="pl-8 space-y-6">
                        {unit.lessons.map((lesson, lessonIndex) => {
                            const lessonIconData = getLessonIcon(lessonIndex);
                            const LessonIcon = lessonIconData.icon;
                            const isCompleted = lesson.percentage === 100;
                            const isStarted = lesson.percentage > 0 && lesson.percentage < 100;

                            return (
                                <motion.div
                                    key={lesson.id}
                                    className="flex items-center gap-6 group"
                                    variants={lessonVariants}
                                    whileHover={{ x: 8 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                >
                                    {/* Lesson Circle Icon */}
                                    <Link href={lesson.isDisabled ? '#' : `/t-lesson/${lesson.id}`}>
                                        <motion.div
                                            className={`relative w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                                                lesson.isDisabled
                                                    ? 'bg-[#1A252B] opacity-50'
                                                    : isCompleted
                                                      ? 'bg-gradient-to-br from-[#A1D051] to-[#678337]'
                                                      : isStarted
                                                        ? 'bg-gradient-to-br from-[#4897D1] to-[#2E5F8F]'
                                                        : 'bg-[#232F34] border-2 border-[#3A4F5C]'
                                            }`}
                                            variants={lessonVariants}
                                            whileHover={!lesson.isDisabled ? 'hover' : {}}
                                        >
                                            {lesson.isDisabled ? (
                                                <Lock className="w-8 h-8 text-[#5A6F7A]" />
                                            ) : (
                                                <>
                                                    <LessonIcon
                                                        className={`w-8 h-8 ${
                                                            isCompleted
                                                                ? 'text-[#151F24]'
                                                                : 'text-[#F2F7FB]'
                                                        }`}
                                                    />
                                                    {isCompleted && (
                                                        <motion.div
                                                            className="absolute top-0 right-0 w-6 h-6 bg-[#A1D051] rounded-full flex items-center justify-center"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 200,
                                                                delay: 0.2,
                                                            }}
                                                        >
                                                            <span className="text-[#151F24] font-bold text-sm">
                                                                ✓
                                                            </span>
                                                        </motion.div>
                                                    )}
                                                </>
                                            )}
                                        </motion.div>
                                    </Link>

                                    {/* Lesson Info */}
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-[#F2F7FB] mb-1">
                                            {lesson.title}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            {/* Progress */}
                                            <div className="w-32 h-1.5 bg-[#232F34] rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${
                                                        isCompleted
                                                            ? 'bg-[#A1D051]'
                                                            : 'bg-[#4897D1]'
                                                    }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${lesson.percentage}%` }}
                                                    transition={{ duration: 0.6, delay: 0.15 }}
                                                />
                                            </div>
                                            <span
                                                className={`text-xs font-medium ${
                                                    isCompleted
                                                        ? 'text-[#A1D051]'
                                                        : 'text-[#9AA7B0]'
                                                }`}
                                            >
                                                {lesson.percentage}%
                                            </span>

                                            {/* Status Badges */}
                                            {lesson.hasHw && (
                                                <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded-full">
                                                    HW
                                                </span>
                                            )}
                                            {lesson.isInQuest && (
                                                <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-full">
                                                    Quest
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow Indicator */}
                                    {!lesson.isDisabled && (
                                        <motion.div
                                            className="text-[#4897D1]"
                                            initial={{ x: 0 }}
                                            whileHover={{ x: 4 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                        >
                                            <svg
                                                className="w-6 h-6"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};
