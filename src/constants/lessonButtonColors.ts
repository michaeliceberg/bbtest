// Палитра кнопок уроков на /learn — у каждого юнита свой цвет,
// юниты циклически повторяют палитру по кругу.

export const UNIT_BUTTON_COLORS = [
    { button: '#53ADEF', bottom: '#428BC0' }, // синий
    { button: '#BC418A', bottom: '#96346F' }, // малиновый
    { button: '#78C93C', bottom: '#60A12F' }, // зелёный
    { button: '#F09B38', bottom: '#C07C2B' }, // оранжевый
    { button: '#C385F7', bottom: '#9C6AC6' }, // фиолетовый
    { button: '#5CC99F', bottom: '#48A17F' }, // бирюзовый
]

export const getUnitButtonColor = (unitIndex: number) =>
    UNIT_BUTTON_COLORS[unitIndex % UNIT_BUTTON_COLORS.length]

// Именованные ссылки на конкретные цвета палитры — для мест вне карты
// юнитов, где нужен конкретный смысловой цвет (например "просрочено"
// или "челлендж дня"), но по-прежнему из общей палитры юнитов.
export const PALETTE_RED = UNIT_BUTTON_COLORS[1] // малиновый — используем как "красный"
export const PALETTE_MINT = UNIT_BUTTON_COLORS[5] // бирюзовый/мятный

export const LOCKED_BUTTON_COLOR = '#3A454E'
export const LOCKED_BUTTON_BOTTOM_COLOR = '#2E383E'
export const LOCKED_ICON_COLOR = '#72838D'
export const ACTIVE_ICON_COLOR = '#FEFEFE'
