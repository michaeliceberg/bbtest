// components/face-builder.tsx
//
// Конструктор лица: отдельные категории (причёска, глаза, рот и т.д.),
// в каждой — свои варианты. Каждый вариант показан как мини-превью
// итогового лица с этим значением (не просто цветной кружок или текст).

'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserAvatar } from '@/actions/user-profile'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
    AVATAAARS_CATEGORIES,
    DEFAULT_SELECTIONS,
    buildAvataaarsUrl,
    parseAvataaarsUrl,
} from '@/lib/avataaars-options'

type Props = {
    currentAvatar: string;
};

export const FaceBuilder = ({ currentAvatar }: Props) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selections, setSelections] = useState<Record<string, string | null>>(
        () => parseAvataaarsUrl(currentAvatar) ?? DEFAULT_SELECTIONS
    );
    const [activeCategoryKey, setActiveCategoryKey] = useState(AVATAAARS_CATEGORIES[0].key);
    const [isSaved, setIsSaved] = useState(true);

    const previewUrl = useMemo(() => buildAvataaarsUrl(selections), [selections]);
    const activeCategory = AVATAAARS_CATEGORIES.find((c) => c.key === activeCategoryKey)!;

    const handlePick = (value: string | null) => {
        setSelections((prev) => ({ ...prev, [activeCategoryKey]: value }));
        setIsSaved(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            await updateUserAvatar(previewUrl);
            setIsSaved(true);
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <img
                    src={previewUrl}
                    alt=""
                    className="w-24 h-24 rounded-full bg-[#232F34] flex-shrink-0"
                />
                <Button onClick={handleSave} disabled={isPending || isSaved} variant="primaryOutline">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isSaved ? 'Сохранено' : 'Сохранить'}
                </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATAAARS_CATEGORIES.map((category) => (
                    <button
                        key={category.key}
                        type="button"
                        onClick={() => setActiveCategoryKey(category.key)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                            activeCategoryKey === category.key
                                ? 'bg-sky-400 text-[#0B1114]'
                                : 'bg-[#232F34] text-[#9AA7B0] hover:bg-[#2E3A40]'
                        }`}
                    >
                        {category.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {activeCategory.optional && (
                    <button
                        type="button"
                        onClick={() => handlePick(null)}
                        className={`flex-shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold text-[#9AA7B0] bg-[#232F34] transition-colors ${
                            !selections[activeCategory.key] ? 'border-sky-400' : 'border-transparent hover:border-[#3A464E]'
                        }`}
                    >
                        Нет
                    </button>
                )}

                {activeCategory.options.map((optionValue) => {
                    const isSelected = selections[activeCategory.key] === optionValue;
                    const swatchSelections = { ...selections, [activeCategory.key]: optionValue };

                    return (
                        <button
                            key={optionValue}
                            type="button"
                            title={optionValue}
                            onClick={() => handlePick(optionValue)}
                            className={`flex-shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 transition-colors ${
                                isSelected ? 'border-sky-400' : 'border-transparent hover:border-[#3A464E]'
                            }`}
                        >
                            {activeCategory.type === 'color' ? (
                                <div className="w-full h-full" style={{ backgroundColor: `#${optionValue}` }} />
                            ) : (
                                <img
                                    src={buildAvataaarsUrl(swatchSelections)}
                                    alt=""
                                    className="w-full h-full bg-[#232F34]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
