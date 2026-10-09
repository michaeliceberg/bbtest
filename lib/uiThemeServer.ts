// Серверное чтение выбранного стиля (см. lib/uiTheme.ts).
import { cookies } from 'next/headers'
import type { UiTheme } from '@/lib/cozyTheme'

// Временно (2026-10-10) у всех только игровой стиль, см. parseUiTheme в lib/uiTheme.ts.
export const getUiTheme = (): UiTheme => (cookies().get('uiTheme')?.value === 'cozy' ? 'metal' : 'metal')
