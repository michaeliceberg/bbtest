// app/api/og/invite/route.tsx
//
// Картинка-превью приглашения (1200×630) — её мессенджер показывает над
// ссылкой ggege.ru/i/КОД. Позывной берём по коду из БД, урок/время/серию —
// из параметров ссылки. Эмодзи не рисуем: Satori без загрузчика их не умеет.

import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import path from 'path'
import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { t_lessons } from '@/db/schema'
import { resolveInviteCode } from '@/lib/invite'
import { formatSeconds } from '@/lib/inviteMessage'

export const runtime = 'nodejs'

export async function GET(req: Request) {
	const url = new URL(req.url)
	const code = url.searchParams.get('code') ?? ''
	const lessonId = Number(url.searchParams.get('l')) || null
	const seconds = Number(url.searchParams.get('t')) || 0
	const streak = Number(url.searchParams.get('s')) || 0
	// tg=1 — уменьшенная версия с ровным фоном для карточки бота: файл должен быть меньше ~30 КБ,
	// иначе исходящая отправка в Telegram с нашего сервера рвётся.
	const tg = url.searchParams.get('tg') === '1'
	const k = tg ? 0.5 : 1
	const px = (n: number) => Math.round(n * k)

	const [font, inviter, lesson] = await Promise.all([
		readFile(path.join(process.cwd(), 'assets/fonts/Nunito-Black.ttf')),
		resolveInviteCode(code).catch(() => null),
		lessonId ? db.query.t_lessons.findFirst({ where: eq(t_lessons.id, lessonId), columns: { title: true } }).catch(() => null) : null,
	])

	const nickname = inviter?.nickname ?? 'Тебя зовут в ggege'
	const stats = [
		seconds ? `за ${formatSeconds(seconds)}` : null,
		streak >= 3 ? `${streak} подряд без ошибок` : null,
	].filter(Boolean).join(' · ')

	return new ImageResponse(
		(
			<div
				style={{
					width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
					justifyContent: 'space-between', padding: `${px(56)}px ${px(64)}px`, color: '#F2F7FB',
					fontFamily: 'Nunito',
					backgroundColor: '#131D22',
					...(tg ? {} : { backgroundImage: 'linear-gradient(135deg, #3A1F52 0%, #131D22 50%, #123A1C 100%)' }),
				}}
			>
				<div style={{ display: 'flex', fontSize: px(34), color: '#9AA7B0', letterSpacing: px(4) }}>GGEGE.RU · ТРЕНАЖЁР ЕГЭ</div>
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<div style={{ display: 'flex', fontSize: px(nickname.length > 24 ? 68 : 84), lineHeight: 1.05 }}>{nickname}</div>
					{lesson?.title && <div style={{ display: 'flex', marginTop: px(18), fontSize: px(36), color: '#D5DEE5' }}>прошёл «{lesson.title}»</div>}
					{stats && <div style={{ display: 'flex', marginTop: px(8), fontSize: px(36), color: '#F2C35B' }}>{stats}</div>}
				</div>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<div
						style={{
							display: 'flex', padding: `${px(18)}px ${px(34)}px`, borderRadius: 999, fontSize: px(46),
							background: '#F2C35B', color: '#3A2400',
						}}
					>
						ГО ПОБАТЛИМСЯ!
					</div>
					<div style={{ display: 'flex', fontSize: px(38), color: '#78C93C' }}>Выиграем пиццу!</div>
				</div>
			</div>
		),
		{ width: px(1200), height: px(630), fonts: [{ name: 'Nunito', data: font, weight: 900, style: 'normal' }] },
	)
}
