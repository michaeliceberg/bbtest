// app/trainer-chain/page.tsx
//
// "Бесконечная цепочка" — отдельный, вне обычного дашборд-лейаута
// (как /t-lesson), полноэкранный аркадный режим на таблицу умножения.
// Не требует данных из БД — вся логика клиентская, см. components/trainer-chain.tsx.

import { TrainerChain } from '@/components/trainer-chain'

const TrainerChainPage = () => {
    return <TrainerChain />
}

export default TrainerChainPage
