'use client'

import { useState } from 'react'

// Готовые промпты для Leonardo: основа + поза уже склеены, остаётся нажать «Копировать» и вставить.
// Как делать: Leonardo → Image Guidance → docs/miguel/miguel-base-leonardo.jpg, сила 0.5, 1:1, 4 варианта.
const BASE = 'Charismatic cartoon goose commander mascot character, same character as the reference image: long S-curved white neck, long orange goose beak, thick black angry eyebrows, tough squinting eyes, black military cap with a red star, red bandana scarf with a small golden "GG" emblem and a tiny golden star on the front knot (exactly like the reference image), olive green field jacket with rolled sleeves and a red star patch on the shoulder, exactly two arms: white feathered cartoon arms ending in white gloved hands like in the reference image (no wings), orange webbed feet, a short yellow pencil with a pink eraser held in the back corner of the beak, thick clean black outline, flat cel shading, cartoon character illustration, full body, isolated on a flat solid pure magenta background #FF00FF, no white border, no outline around the whole image, no text, kid-friendly'
const NEGATIVE = 'spread wings, feathered wings, extra wings, four arms, wings and arms at the same time, sticker, die-cut, white border, white outline around the character, white frame, border, frame, badge, smoke, steam, cigarette, cigar, ash, duck, eyelashes, blush, makeup, girly, extra text, random letters, words, writing on the jacket, realistic, photo, 3d render, gore, blood, real weapon, extra limbs, multiple characters, watermark, logo, cropped'

const POSES = [
    { file: 'miguel-confetti', title: 'Конфетти-хлопушка', pose: 'popping a party confetti cannon with one hand, colorful confetti and streamers flying all around, eyes squeezed shut with joy, huge proud grin' },
    { file: 'miguel-lounger', title: 'На шезлонге', pose: 'relaxing on a striped beach lounge chair under a small palm tree, wearing round sunglasses, holding a tall glass of orange juice with a tiny umbrella, other hand giving a thumbs up' },
    { file: 'miguel-business-class', title: 'Бизнес-классом', pose: 'sitting in a wide business class airplane seat by the window with clouds outside, travel neck pillow, sleep mask pushed up on the cap, holding a glass of juice, other hand giving a thumbs up, smug relaxed grin' },
    { file: 'miguel-gamer', title: 'Геймер', pose: 'wearing big gaming headphones over the cap, holding a game controller in both hands, shouting excitedly, small sparkles around, gamer energy' },
    { file: 'miguel-cat-mouse', title: 'С котиком и мышкой', pose: 'standing next to a cute orange tabby cat that proudly holds a tiny gray mouse by the tail, saluting the cat with one hand, funny approving look' },
    { file: 'miguel-judge', title: 'Судья «изи»', pose: 'holding a wooden judge gavel in one hand and slamming it down, a small blank wooden plaque in front of him, confident smirk, victory sparkles' },
    { file: 'miguel-mvp', title: 'Кубок MVP', pose: 'holding a big golden trophy cup above the head with both hands, golden sparkles and stars around, triumphant roaring shout' },
    { file: 'miguel-maracas', title: 'Танец с маракасами', pose: 'dancing with a pair of maracas in both hands, one leg lifted, joyful party mood, small music notes floating around' },
    { file: 'miguel-megaphone-balloons', title: 'Мегафон и шарики', pose: 'holding a megaphone to the beak with one hand and a bunch of colorful balloons in the other hand, loud cheering shout, festive mood' },
    { file: 'miguel-pullup', title: 'Турник', pose: 'doing a pull-up on a horizontal bar, strong determined face, a small dumbbell on the ground below, sweat drops, sporty energy' },
    { file: 'miguel-fireworks', title: 'Салют', pose: 'watching colorful fireworks exploding in the sky behind him, one hand raised in a salute, the other holding a small star-shaped sparkler, amazed happy face' },
    { file: 'miguel-high-five', title: 'Дай пять', pose: 'stretching one arm toward the viewer for a high five, the other hand on the hip, wide friendly grin, sparkle near the open hand' },
]

const Copy = ({ text, label }: { text: string; label: string }) => {
    const [done, setDone] = useState(false)
    return (
        <button type="button"
            onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) }).catch(() => {}) }}
            className={`rounded-xl border-2 border-b-4 active:border-b-0 px-4 py-2 font-bold ${done ? 'bg-[#2A3A22] border-[#60A12F]' : 'bg-[#1E2A30] border-[#3A464E]'}`}>
            {done ? 'Скопировано' : label}
        </button>
    )
}

export default function TestMiguelPrompts() {
    return (
        <div className="min-h-screen bg-[#131D22] text-white p-4 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-extrabold mt-4 text-center">Промпты Мигеля для Leonardo</h1>
            <p className="text-white/60 text-sm text-center max-w-xl">
                Leonardo → Image Guidance → исходник <b>docs/miguel/miguel-base-leonardo.jpg</b>, сила 0.5, формат 1:1, 4 варианта.
                Для каждой позы: «Копировать промпт» (основа + поза готовы), вставить в Prompt; «Копировать негатив» — в Negative prompt.
            </p>
            <div className="w-full max-w-xl flex items-center gap-3 rounded-xl border-2 border-[#3A464E] bg-[#1E2A30] p-3">
                <div className="flex-1 font-bold">Негативный промпт (один на все позы)</div>
                <Copy text={NEGATIVE} label="Копировать негатив" />
            </div>
            <div className="w-full max-w-xl flex flex-col gap-3">
                {POSES.map((p) => {
                    const full = `${BASE}, ${p.pose}`
                    return (
                        <div key={p.file} className="rounded-xl border-2 border-[#3A464E] bg-[#1E2A30] p-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <div className="font-extrabold">{p.title} <span className="text-white/40 font-normal text-xs">{p.file}.webp</span></div>
                                <Copy text={full} label="Копировать промпт" />
                            </div>
                            <p className="text-xs text-white/60 break-words">{p.pose}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
