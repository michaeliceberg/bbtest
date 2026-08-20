// lib/avataaars-options.ts
//
// Схема стиля "avataaars" от DiceBear (dicebear.com, бесплатно) — точный
// список параметров и допустимых значений взят из их JSON-схемы
// (api.dicebear.com/9.x/avataaars/schema.json). Картинки генерируются на
// лету через их публичный HTTP API, свои файлы не нужны.

export type AvatarCategory = {
    key: string;
    label: string;
    type: 'style' | 'color';
    optional?: boolean;
    options: string[];
};

export const AVATAAARS_CATEGORIES: AvatarCategory[] = [
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
];

export const DEFAULT_SELECTIONS: Record<string, string | null> = {
    top: 'shortFlat',
    hairColor: '4a312c',
    skinColor: 'edb98a',
    eyebrows: 'default',
    eyes: 'default',
    mouth: 'smile',
    facialHair: null,
    accessories: null,
    clothing: 'hoodie',
    clothesColor: '65c9ff',
};

const AVATAAARS_BASE = 'https://api.dicebear.com/9.x/avataaars/svg';

export function buildAvataaarsUrl(selections: Record<string, string | null>): string {
    const params = new URLSearchParams();
    params.set('seed', 'custom');

    for (const category of AVATAAARS_CATEGORIES) {
        const value = selections[category.key];
        if (value) params.set(category.key, value);
    }

    if (selections.facialHair) {
        params.set('facialHairColor', selections.hairColor ?? '2c1b18');
    }

    return `${AVATAAARS_BASE}?${params.toString()}`;
}

export function parseAvataaarsUrl(url: string): Record<string, string | null> | null {
    try {
        const parsed = new URL(url);
        if (!parsed.href.includes('/avataaars/')) return null;

        const result: Record<string, string | null> = { ...DEFAULT_SELECTIONS };
        for (const category of AVATAAARS_CATEGORIES) {
            const value = parsed.searchParams.get(category.key);
            result[category.key] = value ?? (category.optional ? null : result[category.key]);
        }
        return result;
    } catch {
        return null;
    }
}
