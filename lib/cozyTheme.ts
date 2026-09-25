// lib/cozyTheme.ts
//
// Тёплый мультяшный стиль «cozy» (в духе Minecraft, 2026-09-25) — общая
// палитра для экрана «Квесты дня» и барабана кейса. Плоские «блоки» с толстой
// нижней гранью (boxShadow 0 Npx 0 edge), тёплые тёмные тона камня/дерева,
// спокойные пастельные цвета редкости. Фон страницы остаётся тёмным.

import type { LessonCaseTier } from '@/lib/caseRewards'

export type UiTheme = 'metal' | 'cozy'

export const COZY_ACCENT: Record<LessonCaseTier, { fill: string; edge: string }> = {
    common: { fill: '#CFC6B8', edge: '#8E867A' }, // камень
    rare: { fill: '#9CCBDE', edge: '#5E93A8' }, // небо
    mythic: { fill: '#C3B3E6', edge: '#8A79B8' }, // лаванда
    mega: { fill: '#E2B38E', edge: '#A77A57' }, // персик
}

// Спокойная палитра (2026-09-25, вторая версия — первая была слишком
// жёлто-золотой): нейтральный тёмный «камень», кремовый текст, акцент —
// приглушённый шалфейно-зелёный. Имена полей исторические (honey — основной
// акцент/«получено», wood — второстепенные плашки, grass — главная кнопка).
export const COZY = {
    bg: '#1D1E1C',
    card: '#2A2A27',
    cardEdge: '#1A1A18',
    cardBorder: '#403F3A',
    title: '#F1ECE3',
    textSoft: '#C8C1B5',
    track: '#1A1A18',
    honey: '#A9C8A0',
    honeyCard: '#2F3A2D',
    honeyEdge: '#1E271D',
    honeyBorder: '#86A97D',
    wood: '#35332F',
    woodEdge: '#22211F',
    woodBorder: '#524E47',
    grass: '#8DBE84',
    grassEdge: '#5E8A57',
    headline: '#EDE3D2',
    headlineShadow: '#4A3F33',
    darkText: '#23261F',
}

// Приглушённые тёплые фоны страницы кейса по редкости (вместо ярких
// #00C5FF / #A868FC / #FF8A00 игрового стиля).
export const COZY_PAGE_BG: Record<LessonCaseTier, string> = {
    common: '#1D1E1C',
    rare: '#27434E',
    mythic: '#3B3552',
    mega: '#4E3A2B',
}
