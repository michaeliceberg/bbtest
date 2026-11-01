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

/** «Холодильник Мурзика»: имя в родительном падеже (для мужских/кошачьих кличек; несклоняемые — как есть). Нет имени — «котика». */
export function catNameGenitive(name: string | null | undefined): string {
    const n = (name ?? '').trim()
    if (!n) return 'котика'
    if (!/[а-яё]$/i.test(n)) return n // латиница и цифры — не склоняем
    const head = n.slice(0, -1)
    const last = n.slice(-1).toLowerCase()
    const up = (s: string) => (n.slice(-1) === n.slice(-1).toUpperCase() ? s.toUpperCase() : s)
    if (last === 'й' || last === 'ь') return head + up('я')
    if (last === 'а') return head + up(/[гкхжшчщ]$/i.test(head) ? 'и' : 'ы')
    if (last === 'я') return head + up('и')
    if ('оиуеэюыё'.includes(last)) return n
    // беглая гласная: Дымок → Дымка, Уголёк → Уголька, Огурец → Огурца
    if (/[^аеёиоуыэюя]ок$/i.test(n) && n.length > 3) return n.slice(0, -2) + up('ка')
    if (/ёк$/i.test(n)) return n.slice(0, -2) + up('ька')
    if (/[^аеёиоуыэюя]ец$/i.test(n) && n.length > 3) return n.slice(0, -2) + up('ца')
    return n + up('а')
}
