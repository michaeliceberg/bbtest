// Серверное чтение вида /trainer (см. lib/trainerView.ts).
// С 2026-10-07 по умолчанию (и для всех) — простой вид с дорожкой; переключатель убран.
// Полный вид остаётся в коде, вернуть его можно, прочитав cookie trainerView === 'full'.
import type { TrainerView } from '@/lib/trainerView'

export const getTrainerView = (): TrainerView => 'simple'
