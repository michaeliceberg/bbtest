// lib/avatar.ts
//
// Аватарки учеников — Multiavatar (@multiavatar/multiavatar): персонаж
// детерминированно строится из строки-«ключа». В БД (user_progress.
// user_image_src) лежит обычный путь `/api/avatar/<ключ>` — поэтому все
// места, где показывается `<img src={userImageSrc}>`, работают без правок, а
// сам SVG рисует route app/api/avatar/[seed]/route.ts (с вечным кэшем).
// Перегенерация = новый случайный ключ.

// Стоимость перегенерации в /account (в монетах = userProgress.points).
export const AVATAR_REROLL_COST = 5000

const SEED_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SEED_RE = /^[A-Za-z0-9_-]{1,64}$/

export const isValidAvatarSeed = (seed: string): boolean => SEED_RE.test(seed)

export const makeAvatarSeed = (): string => {
    let s = ''
    for (let i = 0; i < 12; i++) s += SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)]
    return s
}

export const avatarUrl = (seed: string): string => `/api/avatar/${seed}`

export const newAvatarUrl = (): string => avatarUrl(makeAvatarSeed())
