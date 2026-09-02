// app/trainer-speed/page.tsx
//
// "Таблица умножения на скорость" — отдельный, вне обычного дашборд-
// лейаута (как /t-lesson, /trainer-chain) полноэкранный аркадный режим.
// Не требует данных из БД — вся логика клиентская, см.
// components/trainer-speed-drill.tsx.

import { TrainerSpeedDrill } from '@/components/trainer-speed-drill'

const TrainerSpeedPage = () => {
    return <TrainerSpeedDrill />
}

export default TrainerSpeedPage
