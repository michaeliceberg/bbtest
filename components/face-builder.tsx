// components/face-builder.tsx
//
// Конструктор лица в модальном окне: сверху — выбор общего стиля лица,
// потом категории (причёска, глаза, рот и т.д.), под ними — сетка
// вариантов, у каждого варианта своё живое мини-превью итогового лица.

'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserAvatar } from '@/actions/user-profile'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Pencil } from 'lucide-react'
import {
    FACE_STYLES,
    findFaceStyle,
    buildFaceUrl,
    parseFaceUrl,
} from '@/lib/face-styles'

type Props = {
    currentAvatar: string;
};

export const FaceBuilder = ({ currentAvatar }: Props) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const parsed = useMemo(() => parseFaceUrl(currentAvatar), [currentAvatar]);
    const [styleId, setStyleId] = useState(parsed?.styleId ?? FACE_STYLES[0].id);
    const [selections, setSelections] = useState<Record<string, string | null>>(
        parsed?.selections ?? FACE_STYLES[0].defaults
    );
    const [activeCategoryKey, setActiveCategoryKey] = useState(findFaceStyle(styleId).categories[0].key);
    const [isSaved, setIsSaved] = useState(true);

    const style = findFaceStyle(styleId);
    const activeCategory = style.categories.find((c) => c.key === activeCategoryKey) ?? style.categories[0];
    const previewUrl = useMemo(() => buildFaceUrl(styleId, selections), [styleId, selections]);

    const handleStyleChange = (newStyleId: string) => {
        const newStyle = findFaceStyle(newStyleId);
        setStyleId(newStyleId);
        setSelections(newStyle.defaults);
        setActiveCategoryKey(newStyle.categories[0].key);
        setIsSaved(false);
    };

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
        <>
            <div className="flex items-center gap-4">
                <img
                    src={currentAvatar}
                    alt=""
                    className="w-20 h-20 rounded-full bg-[#232F34] flex-shrink-0"
                />
                <Button type="button" variant="primaryOutline" onClick={() => setOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Изменить лицо
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#151F23] border-[#3A464E] text-[#F2F7FB]">
                    <DialogHeader>
                        <DialogTitle>Конструктор лица</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-5">
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

                        <div>
                            <p className="text-xs text-[#9AA7B0] mb-1.5">Стиль</p>
                            <div className="flex gap-2 flex-wrap">
                                {FACE_STYLES.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleStyleChange(s.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                            styleId === s.id
                                                ? 'bg-sky-400 text-[#0B1114]'
                                                : 'bg-[#232F34] text-[#9AA7B0] hover:bg-[#2E3A40]'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-[#9AA7B0] mb-1.5">Часть</p>
                            <div className="flex gap-2 flex-wrap">
                                {style.categories.map((category) => (
                                    <button
                                        key={category.key}
                                        type="button"
                                        onClick={() => setActiveCategoryKey(category.key)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                            activeCategoryKey === category.key
                                                ? 'bg-[#3A464E] text-[#F2F7FB]'
                                                : 'bg-transparent text-[#9AA7B0] border border-[#3A464E] hover:bg-[#232F34]'
                                        }`}
                                    >
                                        {category.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 max-h-[280px] overflow-y-auto pr-1">
                            {activeCategory.optional && (
                                <button
                                    type="button"
                                    onClick={() => handlePick(null)}
                                    className={`aspect-square rounded-full border-2 flex items-center justify-center text-[10px] font-semibold text-[#9AA7B0] bg-[#232F34] transition-colors ${
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
                                        className={`aspect-square rounded-full overflow-hidden border-2 transition-colors ${
                                            isSelected ? 'border-sky-400' : 'border-transparent hover:border-[#3A464E]'
                                        }`}
                                    >
                                        {activeCategory.type === 'color' ? (
                                            <div className="w-full h-full" style={{ backgroundColor: `#${optionValue}` }} />
                                        ) : (
                                            <img
                                                src={buildFaceUrl(styleId, swatchSelections)}
                                                alt=""
                                                className="w-full h-full bg-[#232F34]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
