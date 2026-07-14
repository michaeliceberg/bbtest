// components/progress-heatmap.tsx

'use client';

import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from './ui/button';
import { Eye, EyeOff, Home, Target, AlertTriangle, CheckCircle } from 'lucide-react';

type ChallengeData = {
    id: number;
    lessonId: number;
    lessonTitle: string;
    unitId: number;
    unitTitle: string;
    courseId: number;
    courseTitle: string;
    isCompleted: boolean;
    isDoneRight: boolean;
    isFromHomework: boolean;
    homeworkMissedCount?: number; // сколько раз задавали это задание в ДЗ
    correctCount?: number; // сколько раз правильно решено
    wrongCount?: number; // сколько раз неправильно
};

type Props = {
    challengesData: ChallengeData[];
    userId?: string; // если указан, показываем персональный прогресс
    isAdminView?: boolean; // если true, показываем статистику по всем ученикам
};

export const ProgressHeatmap = ({ challengesData, userId, isAdminView = false }: Props) => {
    const [showOnlyHomework, setShowOnlyHomework] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
    
    // Группируем по курсам и юнитам
    const coursesMap = new Map<number, { title: string; units: Map<number, { title: string; challenges: ChallengeData[] }> }>();
    
    challengesData.forEach(challenge => {
        if (!coursesMap.has(challenge.courseId)) {
            coursesMap.set(challenge.courseId, {
                title: challenge.courseTitle,
                units: new Map(),
            });
        }
        
        const course = coursesMap.get(challenge.courseId)!;
        
        if (!course.units.has(challenge.unitId)) {
            course.units.set(challenge.unitId, {
                title: challenge.unitTitle,
                challenges: [],
            });
        }
        
        course.units.get(challenge.unitId)!.challenges.push(challenge);
    });
    
    // Фильтруем
    const filteredData = Array.from(coursesMap.entries()).map(([courseId, course]) => ({
        courseId,
        courseTitle: course.title,
        units: Array.from(course.units.entries())
            .map(([unitId, unit]) => ({
                unitId,
                unitTitle: unit.title,
                challenges: showOnlyHomework 
                    ? unit.challenges.filter(c => c.isFromHomework)
                    : unit.challenges,
            }))
            .filter(unit => unit.challenges.length > 0),
    })).filter(course => course.units.length > 0);
    
    const getChallengeColor = (challenge: ChallengeData) => {
        // Приоритет: если было в ДЗ
        if (challenge.isFromHomework && !challenge.isCompleted) {
            return 'border-2 border-orange-400 bg-orange-100';
        }
        
        // Статус выполнения
        if (challenge.isCompleted) {
            if (challenge.isDoneRight) {
                return 'bg-green-500 hover:bg-green-600';
            }
            return 'bg-red-500 hover:bg-red-600';
        }
        
        // Не решено, но было в ДЗ
        if (challenge.isFromHomework) {
            return 'bg-orange-200 border border-orange-400';
        }
        
        return 'bg-gray-200 hover:bg-gray-300';
    };
    
    const getChallengeTooltip = (challenge: ChallengeData) => {
        return (
            <div className="space-y-1 text-sm">
                <p className="font-bold">{challenge.lessonTitle}</p>
                <p className="text-xs text-gray-600">Задание #{challenge.id % 1000}</p>
                {challenge.isCompleted ? (
                    <p className="text-green-600">
                        {challenge.isDoneRight ? '✅ Решено правильно' : '❌ Решено неправильно'}
                    </p>
                ) : (
                    <p className="text-gray-500">⏳ Не решено</p>
                )}
                {challenge.isFromHomework && (
                    <p className="text-orange-600">
                        📚 Было в ДЗ {challenge.homeworkMissedCount ? `(${challenge.homeworkMissedCount} раз)` : ''}
                    </p>
                )}
                {challenge.correctCount !== undefined && challenge.correctCount > 0 && (
                    <p className="text-xs text-gray-500">
                        📊 Статистика: ✅ {challenge.correctCount} | ❌ {challenge.wrongCount || 0}
                    </p>
                )}
            </div>
        );
    };
    
    const getUnitStats = (challenges: ChallengeData[]) => {
        const total = challenges.length;
        const completed = challenges.filter(c => c.isCompleted).length;
        const correct = challenges.filter(c => c.isCompleted && c.isDoneRight).length;
        const homework = challenges.filter(c => c.isFromHomework).length;
        const homeworkCompleted = challenges.filter(c => c.isFromHomework && c.isCompleted).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { total, completed, correct, homework, homeworkCompleted, percent };
    };
    
    return (
        <div className="space-y-6">
            {/* Управление */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant={showOnlyHomework ? 'default' : 'superOutline'}
                        onClick={() => setShowOnlyHomework(!showOnlyHomework)}
                        className="gap-2"
                    >
                        {showOnlyHomework ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {showOnlyHomework ? 'Все задания' : 'Только ДЗ'}
                    </Button>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-sm" />
                        <span>Решено верно</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-sm" />
                        <span>Решено неверно</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded-sm" />
                        <span>Было в ДЗ (не решено)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 rounded-sm" />
                        <span>Не решено</span>
                    </div>
                </div>
            </div>
            
            {/* Гистограмма по курсам и юнитам */}
            <div className="space-y-8">
                {filteredData.map(course => (
                    <div key={course.courseId} className="border rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                            <h2 className="text-xl font-bold">{course.courseTitle}</h2>
                        </div>
                        
                        <div className="p-4 space-y-6">
                            {course.units.map(unit => {
                                const stats = getUnitStats(unit.challenges);
                                
                                return (
                                    <div key={unit.unitId} className="border rounded-lg overflow-hidden">
                                        <div 
                                            className="bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                                            onClick={() => setSelectedUnit(selectedUnit === unit.unitId ? null : unit.unitId)}
                                        >
                                            <div className="flex justify-between items-center flex-wrap gap-2">
                                                <div>
                                                    <h3 className="font-bold text-lg">{unit.unitTitle}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {stats.total} заданий
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium">Прогресс</div>
                                                        <div className="text-xl font-bold">{stats.percent}%</div>
                                                    </div>
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-green-500 h-2 rounded-full transition-all"
                                                            style={{ width: `${stats.percent}%` }}
                                                        />
                                                    </div>
                                                    {stats.homework > 0 && (
                                                        <div className="flex items-center gap-1 text-orange-600">
                                                            <Home className="h-4 w-4" />
                                                            <span className="text-xs font-medium">{stats.homework}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {selectedUnit === unit.unitId && (
                                            <div className="p-4 bg-white">
                                                <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1">
                                                    {unit.challenges.map((challenge, idx) => (
                                                        <TooltipProvider key={challenge.id}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`
                                                                            w-8 h-8 rounded-md cursor-pointer transition-transform hover:scale-110
                                                                            ${getChallengeColor(challenge)}
                                                                        `}
                                                                        style={{
                                                                            gridColumn: `span 1`,
                                                                        }}
                                                                    >
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-white">
                                                                            {challenge.id % 100}
                                                                        </div>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs">
                                                                    {getChallengeTooltip(challenge)}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Общая статистика */}
            {isAdminView && challengesData.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border">
                    <h3 className="font-bold text-lg mb-3">📊 Общая статистика</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{challengesData.length}</div>
                            <div className="text-xs text-gray-500">Всего заданий</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {challengesData.filter(c => c.isCompleted && c.isDoneRight).length}
                            </div>
                            <div className="text-xs text-gray-500">Правильно решено</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {challengesData.filter(c => c.isFromHomework && !c.isCompleted).length}
                            </div>
                            <div className="text-xs text-gray-500">ДЗ не выполнено</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {Math.round((challengesData.filter(c => c.isCompleted).length / challengesData.length) * 100)}%
                            </div>
                            <div className="text-xs text-gray-500">Общий прогресс</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};