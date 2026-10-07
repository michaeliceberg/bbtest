// components/create-gang-form.tsx
//
// Создание банды: сверху живое превью (как будет выглядеть страница банды),
// ниже — название, цвет и большой выбор эмблем.

'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shuffle } from 'lucide-react';
import { createGang } from '@/actions/gang';
import { GangEmblem } from '@/components/gang-emblem';
import { DEFAULT_GANG_COLOR, EMBLEM_PREFIX, GANG_COLORS, GANG_EMBLEMS } from '@/lib/gangEmblems';

const NAME_MAX = 30;

export const CreateGangForm = () => {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [name, setName] = useState('');
    const [emblemId, setEmblemId] = useState('wolf');
    const [color, setColor] = useState<string>(DEFAULT_GANG_COLOR);
    const [query, setQuery] = useState('');

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? GANG_EMBLEMS.filter((e) => e.title.toLowerCase().includes(q)) : GANG_EMBLEMS;
    }, [query]);

    const random = () => {
        setEmblemId(GANG_EMBLEMS[Math.floor(Math.random() * GANG_EMBLEMS.length)].id);
        setColor(GANG_COLORS[Math.floor(Math.random() * GANG_COLORS.length)]);
    };

    const submit = () => {
        startTransition(async () => {
            try {
                await createGang(name, EMBLEM_PREFIX + emblemId, color);
                router.refresh();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Не получилось создать банду');
            }
        });
    };

    return (
        <div className="flex flex-col gap-5">
            <div
                className="relative overflow-hidden rounded-3xl border-2 border-[#3A464E] bg-[#151F23] px-5 py-7 text-center"
                style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${color}40, transparent 65%)` }}
            >
                <div className="flex justify-center mb-3">
                    <GangEmblem value={EMBLEM_PREFIX + emblemId} color={color} size={120} />
                </div>
                <p className="text-2xl font-extrabold text-[#F2F7FB] break-words">{name.trim() || 'Название банды'}</p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] mt-1" style={{ color }}>Так будет выглядеть твоя банда</p>
            </div>

            <div>
                <label className="text-sm font-bold text-[#F2F7FB]">Название</label>
                <input
                    value={name}
                    maxLength={NAME_MAX}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например, Токсичные Рейдеры"
                    className="mt-1 w-full rounded-xl border-2 border-[#3A464E] bg-[#0F171B] px-3 py-3 text-[#F2F7FB] outline-none focus:border-violet-400"
                />
            </div>

            <div>
                <p className="text-sm font-bold text-[#F2F7FB] mb-2">Цвет</p>
                <div className="flex flex-wrap gap-2">
                    {GANG_COLORS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            aria-label={c}
                            className="h-9 w-9 rounded-full border-2 transition-transform"
                            style={{ background: c, borderColor: c === color ? '#fff' : 'transparent', transform: c === color ? 'scale(1.12)' : 'none' }}
                        />
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-[#F2F7FB]">Эмблема</p>
                    <button type="button" onClick={random} className="flex items-center gap-1 text-xs font-bold text-violet-300">
                        <Shuffle className="h-4 w-4" /> Случайная
                    </button>
                </div>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск: волки, пицца, череп…"
                    className="mb-2 w-full rounded-xl border-2 border-[#3A464E] bg-[#0F171B] px-3 py-2 text-sm text-[#F2F7FB] outline-none focus:border-violet-400"
                />
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {shown.map((e) => (
                        <button
                            key={e.id}
                            type="button"
                            title={e.title}
                            onClick={() => setEmblemId(e.id)}
                            className="flex items-center justify-center rounded-xl p-1 transition-transform"
                            style={{
                                border: `2px solid ${e.id === emblemId ? color : '#2B373D'}`,
                                background: e.id === emblemId ? `${color}22` : '#0F171B',
                                transform: e.id === emblemId ? 'scale(1.06)' : 'none',
                            }}
                        >
                            <GangEmblem value={EMBLEM_PREFIX + e.id} color={e.id === emblemId ? color : '#56646C'} size={46} />
                        </button>
                    ))}
                    {shown.length === 0 && <p className="col-span-full text-sm text-[#9AA7B0]">Ничего не нашлось</p>}
                </div>
                <p className="mt-2 text-[10px] text-[#56646C]">Иконки: game-icons.net (Lorc, Delapouite и др.), CC BY 3.0</p>
            </div>

            <button
                type="button"
                disabled={pending || !name.trim()}
                onClick={submit}
                className="rounded-2xl border-2 border-b-4 border-violet-700 bg-violet-500 px-4 py-3 font-extrabold uppercase tracking-wide text-white transition active:border-b-2 disabled:opacity-50"
            >
                {pending ? 'Создаём…' : 'Создать банду'}
            </button>
        </div>
    );
};
