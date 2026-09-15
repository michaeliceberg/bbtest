// «Палитра ggege» — фирменная цветовая палитра всего проекта, впервые
// собранная тут для кнопок уроков на /learn (у каждого юнита свой цвет,
// юниты циклически повторяют палитру по кругу). По прямой просьбе
// пользователя (2026-09-15) — единственный источник правды для ЭТИХ
// шести цветов, и с этого момента используется не только на /learn, но
// и в анимациях/текстовыделениях интерактивных разборов по шагам (см.
// CLAUDE.md, раздел «Палитра ggege» — что входит и что НЕ входит в эту
// палитру, и раздел «Стандарт анимации walkthrough» — как её применять).
export const GGEGE_PALETTE = {
    blue: { button: '#53ADEF', bottom: '#428BC0' },       // синий
    raspberry: { button: '#BC418A', bottom: '#96346F' },  // малиновый
    green: { button: '#78C93C', bottom: '#60A12F' },      // зелёный
    orange: { button: '#F09B38', bottom: '#C07C2B' },     // оранжевый
    purple: { button: '#C385F7', bottom: '#9C6AC6' },     // фиолетовый
    teal: { button: '#5CC99F', bottom: '#48A17F' },       // бирюзовый
} as const

export const UNIT_BUTTON_COLORS = Object.values(GGEGE_PALETTE)

export const getUnitButtonColor = (unitIndex: number) =>
    UNIT_BUTTON_COLORS[unitIndex % UNIT_BUTTON_COLORS.length]

// hex → rgba(...) с нужной прозрачностью — для маркеров-текстовыделителей
// и полупрозрачных плашек/бейджей поверх тёмного фона, которым нужен цвет
// из палитры ggege не сплошным, а с альфа-каналом.
export const hexToRgba = (hex: string, alpha: number): string => {
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

// Именованные ссылки на конкретные цвета палитры — для мест вне карты
// юнитов, где нужен конкретный смысловой цвет (например "просрочено"
// или "челлендж дня"), но по-прежнему из общей палитры юнитов.
export const PALETTE_RED = UNIT_BUTTON_COLORS[1] // малиновый — используем как "красный"
export const PALETTE_MINT = UNIT_BUTTON_COLORS[5] // бирюзовый/мятный

export const LOCKED_BUTTON_COLOR = '#3A454E'
export const LOCKED_BUTTON_BOTTOM_COLOR = '#2E383E'
export const LOCKED_ICON_COLOR = '#72838D'
export const ACTIVE_ICON_COLOR = '#FEFEFE'
