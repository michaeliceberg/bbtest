// components/gang-leave-button.tsx

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { leaveGang } from '@/actions/gang';

export const GangLeaveButton = () => {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const handleLeave = () => {
        if (!confirm('Точно выйти из банды?')) return;
        startTransition(async () => {
            try {
                await leaveGang();
                router.refresh();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Что-то пошло не так');
            }
        });
    };

    return (
        <Button type="button" variant="dangerOutline" className="w-full" disabled={pending} onClick={handleLeave}>
            Выйти из банды
        </Button>
    );
};
