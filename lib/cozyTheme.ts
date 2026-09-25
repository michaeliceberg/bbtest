// lib/cozyTheme.ts
//
// Тёплый мультяшный стиль «cozy» (в духе Minecraft, 2026-09-25) — общая
// палитра для экрана «Квесты дня» и барабана кейса. Плоские «блоки» с толстой
// нижней гранью (boxShadow 0 Npx 0 edge), тёплые тёмные тона камня/дерева,
// спокойные пастельные цвета редкости. Фон страницы остаётся тёмным.

import type { LessonCaseTier } from '@/lib/caseRewards'

export type UiTheme = 'metal' | 'cozy'

export const COZY_ACCENT: Record<LessonCaseTier, { fill: string; edge: string }> = {
    common: { fill: '#D9C4A3', edge: '#9C8468' }, // песок
    rare: { fill: '#8FD3F0', edge: '#4F97B8' }, // небо
    mythic: { fill: '#C9AEF5', edge: '#8E6FC7' }, // лаванда
    mega: { fill: '#FFB67A', edge: '#C77A3E' }, // персик
}

export const COZY = {
    bg: '#221E1A',
    textSoft: '#D9C4A3',
    card: '#2D2A27',
    cardEdge: '#1C1A18',
    cardBorder: '#4A433B',
    title: '#FFF1DC',
    track: '#1B1916',
    honey: '#F2C35B',
    honeyCard: '#4A3719',
    honeyEdge: '#2E2210',
    honeyBorder: '#E0A83E',
    wood: '#4A3626',
    woodEdge: '#2C2016',
    woodBorder: '#6B4F37',
    grass: '#7CC456',
    grassEdge: '#4E8A33',
    headline: '#FFE08A',
    headlineShadow: '#8A4B14',
    darkText: '#3A2412',
}

// Плитки этапов на карте тренажёра и активные пункты меню — в тон дерева,
// спокойнее медового акцента (пользователю кнопки уроков казались слишком золотыми).
export const COZY_WOOD_TILE = { button: '#B08A64', bottom: '#6B4F37' }

// Приглушённые тёплые фоны страницы кейса по редкости (вместо ярких
// #00C5FF / #A868FC / #FF8A00 игрового стиля).
export const COZY_PAGE_BG: Record<LessonCaseTier, string> = {
    common: '#221E1A',
    rare: '#2C5566',
    mythic: '#4A3C6B',
    mega: '#6E4525',
}
