// types/homework.ts

export type HomeworkInfo = {
    id: number;
    challengeIds: number[];
    status: 'pending' | 'expired' | 'completed';
    dueDate: Date;
    completedCount: number;
    totalCount: number;
};