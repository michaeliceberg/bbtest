// components/create-gang-form.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { createGang } from '@/actions/gang';

const EMOJI_CHOICES = ['🔥', '🐉', '⚔️', '👑', '🦈', '🐺', '💀', '⚡', '🥷', '🎯'];

export const CreateGangForm = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
    const [pending, startTransition] = useTransition();

    const handleCreate = () => {
        if (!name.trim()) {
            toast.error('Придумай название банде');
            return;
        }
        startTransition(async () => {
            try {
                await createGang(name, emoji);
                router.refresh();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Что-то пошло не так');
            }
        });
    };

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-[#F2F7FB]">Создай свою банду</h3>
            <p className="text-sm text-[#9AA7B0]">
                Придумай название и эмблему — станешь главой, сможешь приглашать друзей и назначать капо.
            </p>

            <div className="flex flex-wrap gap-2">
                {EMOJI_CHOICES.map((e) => (
                    <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`text-2xl w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${e === emoji ? 'border-violet-400 bg-violet-400/10' : 'border-[#3A464E]'}`}
                    >
                        {e}
                    </button>
                ))}
            </div>

            <Input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder="Название банды"
                maxLength={30}
            />

            <Button type="button" variant="primary" className="w-full" disabled={pending} onClick={handleCreate}>
                Создать банду
            </Button>
        </div>
    );
};
