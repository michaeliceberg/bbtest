// Имя котика в ангаре (user_progress.cat_name): короткое, без грубых слов. Общая проверка для клиента и сервера.
export const CAT_NAME_MAX = 12

// Корни грубых слов (проверяем без пробелов и знаков, ё → е, латинские двойники букв → кириллица).
const BAD_ROOTS = ['хуй', 'хуе', 'хуя', 'пизд', 'бля', 'еба', 'ебл', 'ебу', 'ебн', 'уеб', 'сук', 'сучк', 'муда', 'пидор', 'пидар', 'залуп', 'гандон', 'шлюх', 'дроч', 'жоп', 'говн', 'срак', 'fuck', 'shit', 'dick', 'bitch']
const LAT_TO_CYR: Record<string, string> = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', b: 'в', h: 'н' }

export function checkCatName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
    const name = raw.replace(/\s+/g, ' ').trim()
    if (!name) return { ok: false, error: 'Придумай имя' }
    if (name.length > CAT_NAME_MAX) return { ok: false, error: `Не длиннее ${CAT_NAME_MAX} букв` }
    if (!/^[A-Za-zА-Яа-яЁё0-9 \-]+$/.test(name)) return { ok: false, error: 'Только буквы и цифры' }
    const flat = name.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я]/g, '')
    const cyr = flat.replace(/[a-z]/g, (ch) => LAT_TO_CYR[ch] ?? ch)
    if (BAD_ROOTS.some((r) => flat.includes(r) || cyr.includes(r))) return { ok: false, error: 'Котик такое не одобряет 🙀' }
    return { ok: true, name }
}
