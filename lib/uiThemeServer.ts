// Серверное чтение выбранного стиля (см. lib/uiTheme.ts).
import { cookies } from 'next/headers'
import type { UiTheme } from '@/lib/cozyTheme'

export const getUiTheme = (): UiTheme => (cookies().get('uiTheme')?.value === 'cozy' ? 'cozy' : 'metal')
