// app/(marketing)/pricing/page.tsx — публичная страница тарифа (видна без входа): что бесплатно,
// что в PRO, цена, оферта и контакты. Нужна платёжному сервису (ЮKassa) при проверке сайта.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { FREE_AI_PHOTOS, PRO_FEATURES, PRO_PRICE_RUB } from '@/lib/pro'
import { REFUND_DAYS, SELLER } from '@/lib/legal'

export const metadata: Metadata = { title: 'Тарифы — ggege' }

const FREE = [
    'Первый урок каждой темы тренажёра (математика и физика ЕГЭ)',
    'Первая часть задачника ЕГЭ по математике (задания 1–13)',
    'Диагностика и «Мой путь к ЕГЭ» с прогнозом балла',
    `ИИ-помощник — ${FREE_AI_PHOTOS} фото, чтобы попробовать`,
]

export default function PricingPage() {
    return (
        <div className='w-full max-w-3xl px-4 py-10 text-[#F2F7FB]'>
            <h1 className='text-center text-3xl font-black'>Тарифы</h1>
            <p className='mt-2 text-center text-sm text-[#9AA7B0]'>Онлайн-тренажёр для подготовки к ЕГЭ по математике и физике</p>

            <div className='mt-8 grid gap-5 sm:grid-cols-2'>
                <div className='rounded-3xl border-2 border-[#3A464E] bg-[#151F23] p-6'>
                    <h2 className='text-xl font-black'>Бесплатно</h2>
                    <div className='mt-2 text-3xl font-black'>0 ₽</div>
                    <ul className='mt-5 space-y-2 text-sm text-[#C9D3D9]'>
                        {FREE.map((f) => <li key={f}>✓ {f}</li>)}
                    </ul>
                </div>

                <div className='rounded-3xl border-2 border-[#3FD3F2]/70 bg-[#151F23] p-6 shadow-[0_0_40px_-14px_rgba(63,211,242,0.6)]'>
                    <h2 className='flex items-center gap-2 text-xl font-black'>
                        <Crown className='h-5 w-5 text-[#3FD3F2]' /> PRO
                    </h2>
                    <div className='mt-2 flex items-end gap-1'>
                        <span className='text-3xl font-black'>{PRO_PRICE_RUB} ₽</span>
                        <span className='pb-1 text-sm font-bold text-[#9AA7B0]'>за 30 дней</span>
                    </div>
                    <p className='mt-1 text-xs text-[#9AA7B0]'>Всё бесплатное, плюс:</p>
                    <ul className='mt-4 space-y-3'>
                        {PRO_FEATURES.map((f) => (
                            <li key={f.title} className='text-sm'>
                                <span className='font-bold'>{f.icon} {f.title}</span>
                                <span className='block text-xs text-[#9AA7B0]'>{f.text}</span>
                            </li>
                        ))}
                    </ul>
                    <Link href='/pro?from=pricing' className='mt-6 block rounded-2xl bg-[#3FD3F2] py-3 text-center font-black text-[#06303D] transition-transform active:translate-y-[4px]' style={{ boxShadow: '0 4px 0 #1C7F99' }}>
                        Подключить PRO
                    </Link>
                </div>
            </div>

            <div className='mt-8 space-y-1 text-center text-xs text-[#7F8C93]'>
                <p>Как получить: оплатите PRO в своём аккаунте на ggege.ru — доступ откроется автоматически сразу после оплаты. Доставки нет, всё онлайн.</p>
                <p>Оплата через СБП. Подписка не продлевается автоматически. Полный возврат в течение {REFUND_DAYS} дней, если не пользовались PRO.</p>
                <p>
                    <Link href='/offer' className='underline hover:text-white'>Оферта</Link>
                    {' · '}
                    <Link href='/privacy' className='underline hover:text-white'>Политика персональных данных</Link>
                    {' · '}
                    Поддержка: <a href={SELLER.telegramUrl} target='_blank' rel='noreferrer' className='underline hover:text-white'>{SELLER.telegram}</a>
                    {SELLER.email && <>{' · '}<a href={`mailto:${SELLER.email}`} className='underline hover:text-white'>{SELLER.email}</a></>}
                </p>
                <p>{SELLER.name}, ИНН {SELLER.inn}, самозанятый</p>
            </div>
        </div>
    )
}
