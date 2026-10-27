import { NextResponse } from 'next/server'
import { syncProPayment } from '@/lib/proPayments'

// Уведомления ЮKassa (payment.succeeded / payment.canceled). URL прописать в кабинете ЮKassa:
// https://ggege.ru/api/yookassa/webhook. Телу не доверяем — syncProPayment перечитывает платёж по API.
// Отвечаем 200, иначе ЮKassa будет повторять уведомление; при сбое API — 500, чтобы повторила.
export async function POST(req: Request) {
    let id: string | undefined
    try {
        const body = await req.json()
        id = body?.object?.id
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 })
    }
    if (!id || typeof id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
    try {
        await syncProPayment(id)
        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error('yookassa webhook', id, e)
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}
