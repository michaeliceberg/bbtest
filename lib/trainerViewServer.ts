// Серверное чтение вида /trainer (см. lib/trainerView.ts).
import { cookies } from 'next/headers'
import type { TrainerView } from '@/lib/trainerView'

export const getTrainerView = (): TrainerView => (cookies().get('trainerView')?.value === 'simple' ? 'simple' : 'full')
