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

const VOXEL_ART: FaceStyle = {
    id: 'voxel-art',
    label: 'Воксель',
    categories: [
        {
            key: 'top', label: 'Причёска', type: 'style',
            options: [
                'short', 'spiky', 'bowl', 'sideSwept', 'curly', 'mohawk', 'buns', 'ponytail', 'bob',
                'shoulderLength', 'longStraight', 'longWavy', 'partedLong', 'braids', 'twinTails',
                'cap', 'beanie', 'animalEars', 'bunnyEars', 'afro', 'halfShaved',
            ],
        },
        { key: 'hairColor', label: 'Цвет волос', type: 'color', options: ['2c222b', '3b2f2f', '5a3825', '7b4a2d', 'a56b46', 'c98850', 'd9b380', 'e8d4a8', 'b55239', 'd6455d', '6d5acf', '3fb27f'] },
        { key: 'skinColor', label: 'Цвет кожи', type: 'color', options: ['f5d0b0', 'eab890', 'dda878', 'c99062', 'b07347', '95562f', '7d4a26', '6a3d1f'] },
        { key: 'eyebrows', label: 'Брови', type: 'style', options: ['flat', 'raised', 'angry', 'soft'] },
        { key: 'eyes', label: 'Глаза', type: 'style', options: ['open', 'soft', 'happy', 'sleepy', 'side', 'closed', 'wide', 'star'] },
        { key: 'nose', label: 'Нос', type: 'style', options: ['block', 'wide', 'small', 'tall'] },
        { key: 'mouth', label: 'Рот', type: 'style', options: ['smile', 'bigSmile', 'flat', 'ooh', 'tongue', 'smirk', 'laugh', 'wideSmile', 'frown', 'grin'] },
        { key: 'cheeks', label: 'Щёки', type: 'style', optional: true, options: ['blush', 'pixel', 'freckles'] },
        { key: 'beard', label: 'Борода', type: 'style', optional: true, options: ['full', 'mustache', 'goatee', 'stubble'] },
        { key: 'glasses', label: 'Очки', type: 'style', optional: true, options: ['round', 'square', 'shades', 'cat', 'visor'] },
        { key: 'outfit', label: 'Одежда', type: 'style', options: ['plain', 'stripes', 'jacket', 'checker', 'overalls', 'hoodie', 'tie', 'coat', 'dress', 'suit'] },
        { key: 'shirtColor', label: 'Цвет одежды', type: 'color', options: ['e64980', 'f76707', 'fab005', '40c057', '12b886', '228be6', '4c6ef5', '7950f2', 'e8590c', '495057'] },
    ],
    defaults: {
        top: 'short', hairColor: '3b2f2f', skinColor: 'eab890', eyebrows: 'flat', eyes: 'happy', nose: 'block',
        mouth: 'smile', cheeks: null, beard: null, glasses: null, outfit: 'hoodie', shirtColor: '228be6',
    },
};

const CLAY: FaceStyle = {
    id: 'clay',
    label: 'Пластилин',
    categories: [
        {
            key: 'top', label: 'Голова', type: 'style',
            options: ['horns', 'hornsSmall', 'nub', 'curl', 'spikes', 'antenna', 'loop', 'peak', 'ears', 'crest', 'swirl', 'pellet', 'tuft'],
        },
        {
            key: 'body', label: 'Тело', type: 'style',
            options: ['pear', 'boulder', 'loaf', 'column', 'stack', 'gumdrop', 'dollop', 'slug', 'egg', 'blob', 'bell', 'cube', 'squat', 'lean'],
        },
        { key: 'eyes', label: 'Глаза', type: 'style', options: ['googly', 'even', 'big', 'tiny', 'mono', 'trio', 'side', 'outward', 'inward', 'dots', 'happy', 'wink', 'down', 'up', 'pinprick'] },
        {
            key: 'mouth', label: 'Рот', type: 'style',
            options: ['teeth', 'smile', 'o', 'frown', 'line', 'wavy', 'open', 'toothy', 'tongue', 'pout', 'grin', 'smirk', 'zigzag', 'dot', 'laugh', 'cat', 'smileBig', 'uu', 'openSmall', 'smileTongue'],
        },
        { key: 'pattern', label: 'Узор', type: 'style', optional: true, options: ['spiral', 'prints', 'pellets', 'buttons', 'stitches', 'patch', 'coil', 'freckles', 'checker', 'zig'] },
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
        top: 'nub', body: 'blob', eyes: 'happy', mouth: 'smile',
        pattern: null, bodyColor: '7dd3fc', accentColor: 'fcd34d', backgroundColor: '0369a1',
    },
};

export const FACE_STYLES: FaceStyle[] = [BOTTTS, ADVENTURER, VOXEL_ART, CLAY];

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
