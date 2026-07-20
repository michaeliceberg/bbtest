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

const LessonButton = ({ lesson, lessonIndex, isCompleted, isStarted, LessonIcon }: any) => {
    let topColor = '';
    let bottomColor = '';

    if (lesson.isDisabled) {
        // Locked: 0.227,0.272,0.305 top | 0.182,0.218,0.244 bottom
        topColor = '#3A454E';
        bottomColor = '#2E383E';
    } else if (isCompleted) {
        // Enabled: 0.469,0.788,0.237 top | 0.373,0.630,0.183 bottom
        topColor = '#78C93C';
        bottomColor = '#5FA12F';
    } else if (isStarted) {
        // Enabled (in progress - same colors)
        topColor = '#78C93C';
        bottomColor = '#5FA12F';
    } else {
        // Not started (enabled - same colors)
        topColor = '#78C93C';
        bottomColor = '#5FA12F';
    }

    return (
        <div className="relative w-fit h-fit">
            {/* Пульсирующее кольцо для активного урока */}
            {isStarted && !isCompleted && (
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    viewBox="0 0 297 280"
                    width="140px"
                    height="132px"
                    className="absolute pointer-events-none"
                    style={{
                        left: (110 - 140) / 2,
                        top: (102 - 132) / 2,
                    }}
                    animate={{
                        scale: [0.95, 1.1, 0.95],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <path fill="#78C93C" stroke="none" d="M 263.85 213.3 Q 260.05 209.4 254.5 209.4 250.25 209.4 246.95 211.8 244.95 214 242.9 216.25 240.25 219 237.35 221.7 210.05 247.35 174.35 253.7 170.3 254.4 166.2 254.85 164.35 255.8 162.7 257.4 158.85 261.3 158.85 266.75 158.85 272.3 162.7 276.15 166.1 279.45 170.55 279.95 174.1 279.45 177.6 278.9 221.2 271.3 254.3 239.9 256.8 237.55 259.2 235.1 263.5 230.65 267.35 226.05 267.75 224.4 267.75 222.65 267.75 217.2 263.85 213.3 M 132.4 254.7 Q 130.7 254.5 129.1 254.25 91.05 248.6 62.35 221.7 59.65 219.15 57.15 216.55 56.35 215.3 55.2 214.15 54.5 213.45 53.75 212.85 50.35 210.25 45.85 210.25 40.4 210.25 36.45 214.15 32.6 218.05 32.6 223.5 32.6 227.7 34.8 230.9 36.15 232.4 37.55 233.9 40.45 236.95 43.6 239.9 77.6 272.1 122.55 279.25 127.15 279.95 131.9 280.45 135.45 279.65 138.15 276.9 142.05 273.05 142.05 267.5 142.05 262.05 138.15 258.15 135.65 255.6 132.4 254.7 M 10.35 87.4 Q 9.8 88.75 9.25 90.15 0 113.4 0 140.25 0 168 9.85 191.9 10.3 193 10.8 194.15 11.7 195.75 13.1 197.15 17.05 201 22.5 201 28.05 201 31.9 197.15 35.75 193.35 35.75 187.75 35.75 186.2 35.45 184.75 34.5 182.65 33.65 180.55 26.15 161.6 26.15 139.7 26.15 118.45 33.2 100 33.75 98.55 34.35 97.15 34.75 95.5 34.75 93.7 34.75 88.35 30.95 84.5 27.2 80.7 21.75 80.7 16.4 80.7 12.55 84.5 11.2 85.85 10.35 87.4 M 137.75 21.65 Q 141.55 17.85 141.55 12.45 141.55 7.05 137.75 3.2 135.4 0.85 132.4 0 131.35 0.05 130.35 0.2 126.45 0.6 122.6 1.2 122.15 1.25 121.7 1.35 77.25 8.65 43.6 40.5 40.55 43.4 37.7 46.45 37.45 46.7 37.2 46.95 35.4 48.8 33.75 50.7 33.6 50.9 33.45 51.05 31.9 53.85 31.9 57.25 31.9 62.65 35.7 66.45 39.55 70.25 44.9 70.25 49.3 70.25 52.6 67.8 54.35 65.7 56.25 63.75 59.15 60.6 62.35 57.6 89.4 32.25 124.8 25.8 126 25.6 127.2 25.4 130.35 24.85 133.55 24.5 135.85 23.55 137.75 21.65 M 264.6 92.7 Q 264.6 94.75 265.2 96.55 265.55 97.5 265.95 98.45 273.6 117.55 273.6 139.7 273.6 161.65 266.05 180.65 265.1 182.95 264.1 185.25 263.85 186.45 263.85 187.75 263.85 192.95 267.5 196.6 271.2 200.25 276.35 200.25 281.6 200.25 285.2 196.6 286.3 195.5 287.1 194.25 287.8 192.6 288.45 191 297.95 167.5 297.95 140.25 297.95 114.65 289.6 92.4 288 88.15 286.15 84.05 286.05 83.95 285.95 83.85 282.35 80.2 277.1 80.2 271.95 80.2 268.25 83.85 264.6 87.55 264.6 92.7 Z"/>
                    <path fill="#5FA12F" stroke="none" d="M 260.15 46.3 Q 257.35 43.35 254.3 40.5 220.95 8.9 177 1.5 173.15 0.85 169.25 0.4 165.4 1 162.5 3.85 158.85 7.55 158.85 12.7 158.85 17.9 162.5 21.55 164.8 23.8 167.7 24.7 169.55 24.9 171.45 25.2 208.95 31 237.35 57.6 240.55 60.6 243.5 63.75 245.25 65.6 246.95 67.55 250.15 69.95 254.35 69.95 259.6 69.95 263.2 66.3 266.85 62.65 266.85 57.45 266.85 54.9 266 52.75 263.2 49.45 260.15 46.3 Z"/>
                </motion.svg>
            )}

        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 110 102" width="110px" height="102px" className="relative z-10">
            <path fill={topColor} stroke="none" d="M 108.5 37 Q 104.75 24.7 94.3 15 78.15 0 55.25 0 32.35 0 16.15 15 4.85 25.5 1.45 39.1 0.15 49.15 4.5 60.15 8.5 68.65 16.15 75.75 32.35 90.75 55.25 90.75 78.15 90.75 94.3 75.75 103.3 67.4 107.3 57.15 111.2 47.1 108.5 37 Z"/>
            <path fill={bottomColor} stroke="none" d="M 110.2 45.4 Q 109.7 41.05 108.5 37 111.2 47.1 107.3 57.15 103.3 67.4 94.3 75.75 78.15 90.75 55.25 90.75 32.35 90.75 16.15 75.75 8.5 68.65 4.5 60.15 0.15 49.15 1.45 39.1 0.7 42.15 0.35 45.4 0 48.25 0 51.25 0 72.5 16.15 87.5 32.35 102.5 55.25 102.5 78.15 102.5 94.3 87.5 110.5 72.5 110.5 51.25 110.5 48.25 110.2 45.4 Z"/>
            <g transform="matrix( 1, 0, 0, 1, 0,0)">
                <use xlinkHref="#Layer0_0_FILL"/>
            </g>
            <foreignObject x="0" y="-8" width="110" height="102">
                <div className="w-full h-full flex items-center justify-center">
                    {lesson.isDisabled ? (
                        <Lock className="w-10 h-10" style={{ color: '#56646C' }} />
                    ) : (
                        <LessonIcon className="w-12 h-12" style={{ color: '#FEFEFE' }} />
                    )}
                </div>
            </foreignObject>
            {isCompleted && (
                <>
                    <circle cx="85" cy="15" r="10" fill="white" stroke="#5FA12F" strokeWidth="2"/>
                    <text x="85" y="20" textAnchor="middle" fill="#5FA12F" fontSize="14" fontWeight="bold">✓</text>
                </>
            )}
        </svg>
        </div>
    );
};

export const TrainerSkillTree = ({ units }: Props) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            },
        },
    };

    const lessonVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 15,
            },
        },
    };

    return (
        <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {units.map((unit) => (
                <motion.div key={unit.id} className="mb-16">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl font-bold text-[#F2F7FB] mb-2">
                            {unit.title}
                        </h3>
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-32 h-2 bg-[#232F34] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#A1D051] to-[#678337]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${unit.percentage}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                />
                            </div>
                            <span className="text-sm font-bold text-[#A1D051]">
                                {unit.percentage}%
                            </span>
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <div className="flex flex-col gap-12">
                            {unit.lessons.map((lesson, lessonIndex) => {
                                const lessonIconData = LESSON_ICONS[lessonIndex % LESSON_ICONS.length];
                                const LessonIcon = lessonIconData.icon;
                                const isCompleted = lesson.percentage === 100;
                                const isStarted = lesson.percentage > 0 && lesson.percentage < 100;
                                
                                const isLeft = lessonIndex % 2 === 0;
                                const alignment = isLeft ? 'justify-start' : 'justify-end';

                                return (
                                    <motion.div
                                        key={lesson.id}
                                        className={`flex ${alignment} px-4`}
                                        variants={lessonVariants}
                                    >
                                        <Link href={lesson.isDisabled ? '#' : `/t-lesson/${lesson.id}`}>
                                            <motion.div
                                                whileHover={!lesson.isDisabled ? { y: -8, scale: 1.08 } : {}}
                                                whileTap={!lesson.isDisabled ? { scale: 0.95 } : {}}
                                                transition={{ type: 'spring', stiffness: 250, damping: 12 }}
                                            >
                                                <LessonButton 
                                                    lesson={lesson}
                                                    lessonIndex={lessonIndex}
                                                    isCompleted={isCompleted}
                                                    isStarted={isStarted}
                                                    LessonIcon={LESSON_ICONS[lessonIndex % LESSON_ICONS.length].icon}
                                                />
                                            </motion.div>
                                        </Link>

                                        {!lesson.isDisabled && (
                                            <motion.div
                                                className="absolute ml-40 flex flex-col gap-1 pointer-events-none"
                                                initial={{ opacity: 0, x: -10 }}
                                                whileHover={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="bg-[#151F24] text-[#F2F7FB] px-3 py-2 rounded-lg shadow-lg border border-[#3A4F5C] text-sm font-medium whitespace-nowrap">
                                                    {lesson.title}
                                                </div>
                                                <div className="text-xs text-[#9AA7B0] px-3">
                                                    {lesson.percentage}% complete
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};
