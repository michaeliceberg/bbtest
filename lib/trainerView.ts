// lib/trainerView.ts
//
// Вид страницы /trainer: 'full' — как раньше (много карточек), 'simple' —
// «игровой»: сверху полоска из иконок и цифр, питомец с одной репликой, сразу
// карта. Хранится в cookie `trainerView` на устройстве (как uiTheme);
// переключатель — components/theme-switch.tsx.

'use client'

export type TrainerView = 'full' | 'simple'

export const TRAINER_VIEW_COOKIE = 'trainerView'

export const parseTrainerView = (v: string | undefined | null): TrainerView => (v === 'simple' ? 'simple' : 'full')

export const readTrainerViewCookie = (): TrainerView => {
    if (typeof document === 'undefined') return 'full'
    const m = document.cookie.match(/(?:^|;\s*)trainerView=([^;]+)/)
    return parseTrainerView(m?.[1])
}

export const writeTrainerViewCookie = (v: TrainerView) => {
    document.cookie = `${TRAINER_VIEW_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`
}
