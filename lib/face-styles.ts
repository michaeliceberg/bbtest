// lib/face-styles.ts
//
// Несколько стилей лица от DiceBear (dicebear.com, бесплатно) — точные
// параметры и допустимые значения взяты из их официальных JSON-схем
// (api.dicebear.com/10.x/{style}/schema.json). Картинки генерируются на
// лету через публичный HTTP API, свои файлы не нужны.

export type AvatarCategory = {
    key: string;
    label: string;
    type: 'style' | 'color';
    optional?: boolean;
    options: string[];
};

export type FaceStyle = {
    id: string; // slug стиля DiceBear
    label: string;
    categories: AvatarCategory[];
    defaults: Record<string, string | null>;
    // Доп. параметры, которые всегда идут в URL этого стиля (цвет фона и т.п.)
    extraParams?: Record<string, string>;
};

// variant01, variant02, ... — так пронумерованы варианты в схемах notionists/micah
function numberedVariants(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `variant${String(i + 1).padStart(2, '0')}`);
}

const AVATAAARS: FaceStyle = {
    id: 'avataaars',
    label: 'Классический',
    categories: [
        {
            key: 'top', label: 'Причёска', type: 'style',
            options: [
                'shortFlat', 'shortRound', 'shortWaved', 'shortCurly', 'sides', 'theCaesar', 'theCaesarAndSidePart',
                'bob', 'bun', 'curly', 'curvy', 'dreads', 'dreads01', 'dreads02', 'frida', 'fro', 'froBand',
                'longButNotTooLong', 'miaWallace', 'shavedSides', 'straight01', 'straight02', 'straightAndStrand',
                'frizzle', 'shaggy', 'shaggyMullet', 'bigHair',
                'hat', 'hijab', 'turban', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04',
            ],
        },
        {
            key: 'hairColor', label: 'Цвет волос', type: 'color',
            options: ['a55728', '2c1b18', 'b58143', 'd6b370', '724133', '4a312c', 'f59797', 'ecdcbf', 'c93305', 'e8e1e1'],
        },
        {
            key: 'skinColor', label: 'Цвет кожи', type: 'color',
            options: ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c'],
        },
        {
            key: 'eyebrows', label: 'Брови', type: 'style',
            options: [
                'default', 'defaultNatural', 'angry', 'angryNatural', 'flatNatural', 'frownNatural',
                'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural',
            ],
        },
        {
            key: 'eyes', label: 'Глаза', type: 'style',
            options: ['default', 'happy', 'side', 'squint', 'surprised', 'wink', 'winkWacky', 'closed', 'cry', 'eyeRoll', 'hearts', 'xDizzy'],
        },
        {
            key: 'mouth', label: 'Рот', type: 'style',
            options: ['smile', 'default', 'twinkle', 'serious', 'concerned', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'tongue', 'vomit'],
        },
        {
            key: 'facialHair', label: 'Борода', type: 'style', optional: true,
            options: ['beardLight', 'beardMedium', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum'],
        },
        {
            key: 'accessories', label: 'Очки', type: 'style', optional: true,
            options: ['round', 'prescription01', 'prescription02', 'sunglasses', 'wayfarers', 'kurt', 'eyepatch'],
        },
        {
            key: 'clothing', label: 'Одежда', type: 'style',
            options: ['hoodie', 'graphicShirt', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck', 'collarAndSweater', 'blazerAndShirt', 'blazerAndSweater', 'overall'],
        },
        {
            key: 'clothesColor', label: 'Цвет одежды', type: 'color',
            options: ['65c9ff', '5199e4', '25557c', '262e33', 'e6e6e6', '929598', '3c4f5c', 'b1e2ff', 'a7ffc4', 'ffafb9', 'ffffb1', 'ff488e', 'ff5c5c', 'ffffff'],
        },
    ],
    defaults: {
        top: 'shortFlat', hairColor: '4a312c', skinColor: 'edb98a', eyebrows: 'default', eyes: 'default',
        mouth: 'smile', facialHair: null, accessories: null, clothing: 'hoodie', clothesColor: '65c9ff',
    },
};

const NOTIONISTS: FaceStyle = {
    id: 'notionists',
    label: 'Иллюстрация',
    categories: [
        { key: 'hair', label: 'Причёска', type: 'style', options: [...numberedVariants(63), 'hat'] },
        { key: 'beard', label: 'Борода', type: 'style', optional: true, options: numberedVariants(12) },
        { key: 'brows', label: 'Брови', type: 'style', options: numberedVariants(13) },
        { key: 'eyes', label: 'Глаза', type: 'style', options: numberedVariants(5) },
        { key: 'nose', label: 'Нос', type: 'style', options: numberedVariants(20) },
        { key: 'lips', label: 'Губы', type: 'style', options: numberedVariants(30) },
        { key: 'glasses', label: 'Очки', type: 'style', optional: true, options: numberedVariants(11) },
        {
            key: 'gesture', label: 'Жест', type: 'style',
            options: ['hand', 'point', 'ok', 'handPhone', 'pointLongArm', 'okLongArm', 'waveLongArm', 'waveLongArms', 'waveOkLongArms', 'wavePointLongArms'],
        },
    ],
    defaults: {
        hair: 'variant01', beard: null, brows: 'variant01', eyes: 'variant01',
        nose: 'variant01', lips: 'variant01', glasses: null, gesture: 'hand',
    },
};

const MICAH: FaceStyle = {
    id: 'micah',
    label: 'Дружелюбный',
    categories: [
        { key: 'hair', label: 'Причёска', type: 'style', options: ['fonze', 'mrT', 'dougFunny', 'mrClean', 'dannyPhantom', 'full', 'turban', 'pixie'] },
        { key: 'hairColor', label: 'Цвет волос', type: 'color', options: ['000000', '77311d', 'ac6651', 'f4d150', '9287ff', '6bd9e9', 'e0ddff'] },
        { key: 'baseColor', label: 'Цвет кожи', type: 'color', options: ['f9c9b6', 'ac6651', '77311d'] },
        { key: 'eyebrows', label: 'Брови', type: 'style', options: ['up', 'down', 'eyelashesUp', 'eyelashesDown'] },
        { key: 'eyes', label: 'Глаза', type: 'style', options: ['eyes', 'round', 'eyesShadow', 'smiling', 'smilingShadow'] },
        { key: 'mouth', label: 'Рот', type: 'style', options: ['smile', 'laughing', 'surprised', 'nervous', 'sad', 'pucker', 'frown', 'smirk'] },
        { key: 'nose', label: 'Нос', type: 'style', options: ['curve', 'pointed', 'tound'] },
        { key: 'facialHair', label: 'Борода', type: 'style', optional: true, options: ['beard', 'scruff'] },
        { key: 'glasses', label: 'Очки', type: 'style', optional: true, options: ['round', 'square'] },
        { key: 'shirt', label: 'Одежда', type: 'style', options: ['open', 'crew', 'collared'] },
        { key: 'shirtColor', label: 'Цвет одежды', type: 'color', options: ['65c9ff', '9287ff', 'f4d150', '6bd9e9', 'fc909f', '000000', 'ffffff'] },
    ],
    defaults: {
        hair: 'full', hairColor: '77311d', baseColor: 'f9c9b6', eyebrows: 'up', eyes: 'eyes',
        mouth: 'smile', nose: 'curve', facialHair: null, glasses: null, shirt: 'crew', shirtColor: '65c9ff',
    },
};

const BOTTTS: FaceStyle = {
    id: 'bottts-neutral',
    label: 'Робот',
    categories: [
        {
            key: 'eyes', label: 'Глаза', type: 'style',
            options: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'hearts', 'robocop', 'round', 'roundFrame01', 'roundFrame02', 'sensor', 'shade01'],
        },
        {
            key: 'mouth', label: 'Рот', type: 'style',
            options: ['bite', 'diagram', 'grill01', 'grill02', 'grill03', 'smile01', 'smile02', 'square01', 'square02'],
        },
    ],
    defaults: { eyes: 'happy', mouth: 'smile01' },
};

const ADVENTURER: FaceStyle = {
    id: 'adventurer-neutral',
    label: 'Герой',
    categories: [
        { key: 'eyebrows', label: 'Брови', type: 'style', options: numberedVariants(15) },
        { key: 'eyes', label: 'Глаза', type: 'style', options: numberedVariants(26) },
        { key: 'mouth', label: 'Рот', type: 'style', options: numberedVariants(30) },
        { key: 'glasses', label: 'Очки', type: 'style', optional: true, options: numberedVariants(5) },
    ],
    defaults: { eyebrows: 'variant01', eyes: 'variant01', mouth: 'variant01', glasses: null },
};

const FUN_EMOJI: FaceStyle = {
    id: 'fun-emoji',
    label: 'Эмодзи',
    categories: [
        {
            key: 'eyes', label: 'Глаза', type: 'style',
            options: ['sad', 'tearDrop', 'pissed', 'cute', 'wink', 'wink2', 'plain', 'glasses', 'closed', 'love', 'stars', 'shades', 'closed2', 'crying', 'sleepClose'],
        },
        {
            key: 'mouth', label: 'Рот', type: 'style',
            options: ['plain', 'lilSmile', 'sad', 'shy', 'cute', 'wideSmile', 'shout', 'smileTeeth', 'smileLol', 'pissed', 'drip', 'tongueOut', 'kissHeart', 'sick', 'faceMask'],
        },
    ],
    defaults: { eyes: 'cute', mouth: 'wideSmile' },
};

const CRITTERS: FaceStyle = {
    id: 'critters',
    label: 'Зверёк',
    categories: [
        {
            key: 'top', label: 'Голова', type: 'style',
            options: ['horns', 'hornsIn', 'hornsSmall', 'spike', 'antenna', 'antennae', 'earsRound', 'earsPointy', 'earsDroop', 'spikes', 'fin', 'crown', 'sprout', 'nub', 'bobble'],
        },
        {
            key: 'body', label: 'Тело', type: 'style',
            options: ['dome', 'block', 'tower', 'chimney', 'squat', 'blob', 'round', 'tilt', 'lean', 'peak', 'bell', 'wedge', 'wedgeInv', 'steps'],
        },
        { key: 'eyes', label: 'Глаза', type: 'style', options: numberedVariants(19) },
        { key: 'mouth', label: 'Рот', type: 'style', options: numberedVariants(19) },
        { key: 'pattern', label: 'Узор', type: 'style', optional: true, options: ['belly', 'dots', 'speckles', 'bar', 'bars', 'spot', 'stripes', 'dotRow', 'chevron', 'ring'] },
        { key: 'cheeks', label: 'Щёчки', type: 'style', optional: true, options: ['blush', 'blushBig', 'freckles'] },
        {
            key: 'bodyColor', label: 'Цвет тела', type: 'color',
            options: ['7dd3fc', 'a5b4fc', 'c4b5fd', 'f0abfc', 'fda4af', 'fca5a5', 'fdba74', 'fcd34d', 'bef264', '6ee7b9', '5eead4', 'e2e8f0'],
        },
        {
            key: 'accentColor', label: 'Цвет узора', type: 'color',
            options: ['7dd3fc', 'a5b4fc', 'c4b5fd', 'f0abfc', 'fda4af', 'fca5a5', 'fdba74', 'fcd34d', 'bef264', '6ee7b9', '5eead4', 'e2e8f0'],
        },
        {
            key: 'backgroundColor', label: 'Фон', type: 'color',
            options: ['0369a1', '1d4ed8', '4338ca', '6d28d9', 'a21caf', 'be185d', 'be123c', 'c2410c', 'b45309', '047857', '0f766e', '1e293b'],
        },
    ],
    defaults: {
        top: 'earsRound', body: 'round', eyes: 'variant01', mouth: 'variant01',
        pattern: null, cheeks: 'blush', bodyColor: '7dd3fc', accentColor: 'fcd34d', backgroundColor: '0369a1',
    },
};

export const FACE_STYLES: FaceStyle[] = [AVATAAARS, NOTIONISTS, MICAH, BOTTTS, ADVENTURER, FUN_EMOJI, CRITTERS];

export function findFaceStyle(id: string): FaceStyle {
    return FACE_STYLES.find((s) => s.id === id) ?? FACE_STYLES[0];
}

// В DiceBear v10 "component"-параметры (причёска, глаза, рот и т.д.)
// задаются не голым именем, а с суффиксом Variant (topVariant=bigHair,
// а не top=bigHair) — иначе значение тихо игнорируется. Плюс для
// опциональных частей (борода, очки) нужно явно поднять вероятность
// показа до 100%, иначе DiceBear может её просто не нарисовать.
export function buildFaceUrl(styleId: string, selections: Record<string, string | null>): string {
    const style = findFaceStyle(styleId);
    const params = new URLSearchParams();
    params.set('seed', 'custom');

    for (const category of style.categories) {
        const value = selections[category.key];
        if (!value) continue;

        if (category.type === 'color') {
            params.set(category.key, value);
        } else {
            params.set(`${category.key}Variant`, value);
            params.set(`${category.key}Probability`, '100');
        }
    }

    if (style.id === 'avataaars' && selections.facialHair) {
        params.set('facialHairColor', selections.hairColor ?? '2c1b18');
    }
    if (style.id === 'micah' && selections.facialHair) {
        params.set('facialHairColor', selections.hairColor ?? '000000');
    }

    return `https://api.dicebear.com/10.x/${style.id}/svg?${params.toString()}`;
}

export function parseFaceUrl(url: string): { styleId: string; selections: Record<string, string | null> } | null {
    try {
        const parsed = new URL(url);
        const style = FACE_STYLES.find((s) => parsed.href.includes(`/${s.id}/`));
        if (!style) return null;

        const selections: Record<string, string | null> = { ...style.defaults };
        for (const category of style.categories) {
            const paramName = category.type === 'color' ? category.key : `${category.key}Variant`;
            const value = parsed.searchParams.get(paramName);
            selections[category.key] = value ?? (category.optional ? null : selections[category.key]);
        }
        return { styleId: style.id, selections };
    } catch {
        return null;
    }
}
