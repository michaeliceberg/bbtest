// app/admin/funnel/page.tsx
//
// Статистика воронки роста (пробный урок → кейс → регистрация, приглашения,
// диагностический тест, банды, Додо-коды, активность). Доступ — только
// админам (app/admin/layout.tsx). Всё считается прямыми SQL-запросами на
// каждый заход, без кэша. Период — ?days=7|30|all.

import Link from 'next/link'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { VIBES } from '@/lib/vibes'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>
const q = async (query: ReturnType<typeof sql>) => (await db.execute(query)) as unknown as Row[]
const n = (v: unknown) => Number(v ?? 0)
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')

const PERIODS = [
	{ key: '7', label: '7 дней' },
	{ key: '30', label: '30 дней' },
	{ key: 'all', label: 'Всё время' },
]

export default async function FunnelPage({ searchParams }: { searchParams: { days?: string } }) {
	const periodKey = PERIODS.some((p) => p.key === searchParams.days) ? searchParams.days! : '7'
	// Строкой, не Date: postgres-js в raw sql`` не сериализует объект Date.
	const since = (periodKey === 'all' ? new Date(0) : new Date(Date.now() - Number(periodKey) * 86400_000)).toISOString()

	const [guest] = await q(sql`
		SELECT count(*) AS leads,
			count(*) FILTER (WHERE case_opened) AS opened,
			count(*) FILTER (WHERE claimed_by_user_id IS NOT NULL) AS claimed,
			count(*) FILTER (WHERE vibes IS NOT NULL) AS with_vibes
		FROM guest_lesson_leads WHERE created_at >= ${since}`)

	const vibeRows = await q(sql`
		SELECT v AS id, count(*) AS cnt
		FROM guest_lesson_leads, unnest(string_to_array(vibes, ',')) AS v
		WHERE created_at >= ${since} AND vibes IS NOT NULL
		GROUP BY v ORDER BY cnt DESC LIMIT 12`)

	const [reg] = await q(sql`
		SELECT count(*) FILTER (WHERE created_at >= ${since}) AS new_users,
			count(*) FILTER (WHERE created_at >= ${since} AND invited_by_user_id IS NOT NULL) AS invited,
			count(*) AS total_users
		FROM user_progress`)

	const inviters = await q(sql`
		SELECT inv.invited_by_user_id AS uid, max(ref.user_name) AS name, count(*) AS cnt
		FROM user_progress inv LEFT JOIN user_progress ref ON ref.user_id = inv.invited_by_user_id
		WHERE inv.invited_by_user_id IS NOT NULL AND (inv.created_at IS NULL OR inv.created_at >= ${since})
		GROUP BY inv.invited_by_user_id ORDER BY cnt DESC LIMIT 10`)

	const [diag] = await q(sql`
		SELECT count(*) AS leads,
			count(*) FILTER (WHERE telegram_verified_at IS NOT NULL) AS tg,
			count(*) FILTER (WHERE case_opened) AS opened
		FROM diagnostic_leads WHERE created_at >= ${since}`)

	const [activity] = await q(sql`
		SELECT count(DISTINCT user_id) FILTER (WHERE date_done >= now() - interval '1 day') AS dau,
			count(DISTINCT user_id) FILTER (WHERE date_done >= now() - interval '7 days') AS wau,
			count(*) FILTER (WHERE date_done >= ${since} AND training_pts > 0) AS lessons
		FROM t_lesson_progress`)

	const gangs = await q(sql`
		SELECT g.id, g.emoji, g.name, count(m.id) AS members
		FROM gangs g LEFT JOIN gang_members m ON m.gang_id = g.id
		GROUP BY g.id ORDER BY members DESC, g.id LIMIT 10`)

	const [dodo] = await q(sql`
		SELECT count(*) FILTER (WHERE assigned_to_user_id IS NOT NULL) AS assigned,
			count(*) FILTER (WHERE assigned_to_user_id IS NULL) AS free
		FROM dodo_promo_codes`)

	const dodoList = await q(sql`
		SELECT d.code, d.assigned_at, u.user_name FROM dodo_promo_codes d
		LEFT JOIN user_progress u ON u.user_id = d.assigned_to_user_id
		WHERE d.assigned_to_user_id IS NOT NULL ORDER BY d.assigned_at DESC LIMIT 10`)

	const [pizza] = await q(sql`
		SELECT count(*) FILTER (WHERE pizza_slices >= 6) AS close_to_full FROM user_progress`)

	// Оценки уроков (components/lesson-rating-screen.tsx) — за всё время,
	// худшие сверху: их и надо переделывать.
	const ratings = await q(sql`
		SELECT r.t_lesson_id AS id, max(l.title) AS title, count(*) AS cnt,
			round(avg(r.score)::numeric, 2) AS avg,
			count(*) FILTER (WHERE r.score <= 2) AS bad
		FROM lesson_ratings r LEFT JOIN t_lessons l ON l.id = r.t_lesson_id
		GROUP BY r.t_lesson_id ORDER BY avg ASC, cnt DESC`)

	const ratingComments = await q(sql`
		SELECT r.score, r.comment, r.created_at, l.title FROM lesson_ratings r
		LEFT JOIN t_lessons l ON l.id = r.t_lesson_id
		WHERE r.comment IS NOT NULL ORDER BY r.created_at DESC LIMIT 15`)

	const vibeLabel = (id: string) => {
		const v = VIBES.find((x) => x.id === id)
		return v ? `${v.emoji} ${v.label}` : id
	}

	const funnel = [
		{ label: 'Прошли пробный урок', value: n(guest.leads), base: n(guest.leads) },
		{ label: 'Открыли кейс', value: n(guest.opened), base: n(guest.leads) },
		{ label: 'Зарегистрировались и забрали приз', value: n(guest.claimed), base: n(guest.leads) },
	]

	return (
		<div className="max-w-5xl mx-auto text-[#F2F7FB] space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-2xl font-bold">📈 Воронка роста</h2>
				<div className="flex gap-2">
					{PERIODS.map((p) => (
						<Link
							key={p.key}
							href={`/admin/funnel?days=${p.key}`}
							className={`px-3 py-1.5 rounded-lg text-sm border ${p.key === periodKey ? 'bg-[#5183A4] border-[#5183A4] text-white' : 'border-[#3A464E] text-[#9AA7B0] hover:bg-[#232F34]'}`}
						>
							{p.label}
						</Link>
					))}
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<Stat label="Активны сегодня" value={n(activity.dau)} />
				<Stat label="Активны за 7 дней" value={n(activity.wau)} />
				<Stat label="Уроков тренажёра за период" value={n(activity.lessons)} />
				<Stat label="Всего учеников" value={n(reg.total_users)} />
			</div>

			<Card title="🎁 Пробный урок (гости, урок 485)">
				<div className="space-y-2">
					{funnel.map((f, i) => (
						<div key={f.label}>
							<div className="flex justify-between text-sm mb-1">
								<span>{f.label}</span>
								<span className="font-bold">{f.value} {i > 0 && <span className="text-[#9AA7B0] font-normal">({pct(f.value, f.base)})</span>}</span>
							</div>
							<div className="h-2.5 rounded-full bg-[#232F34] overflow-hidden">
								<div className="h-full bg-violet-500" style={{ width: f.base > 0 ? `${(f.value / f.base) * 100}%` : '0%' }} />
							</div>
						</div>
					))}
				</div>
				<p className="text-xs text-[#6B7A83] mt-3">«Прошли урок» считается по экрану приза — кто бросил урок на середине, сюда не попадает.</p>
			</Card>

			<div className="grid md:grid-cols-2 gap-6">
				<Card title="😎 Что нравится гостям">
					{vibeRows.length === 0 ? <Empty /> : (
						<ul className="space-y-1.5 text-sm">
							{vibeRows.map((v) => (
								<li key={String(v.id)} className="flex justify-between">
									<span>{vibeLabel(String(v.id))}</span>
									<span className="font-bold">{n(v.cnt)}</span>
								</li>
							))}
						</ul>
					)}
					<p className="text-xs text-[#6B7A83] mt-3">Из {n(guest.with_vibes)} гостей, прошедших экран «Что тебе заходит?».</p>
				</Card>

				<Card title="🤝 Приглашения">
					<div className="grid grid-cols-2 gap-3 mb-4">
						<Stat label="Новых учеников" value={n(reg.new_users)} small />
						<Stat label="Из них по приглашению" value={n(reg.invited)} small />
					</div>
					<p className="text-sm text-[#9AA7B0] mb-2">Кто больше всех пригласил:</p>
					{inviters.length === 0 ? <Empty /> : (
						<ul className="space-y-1.5 text-sm">
							{inviters.map((r) => (
								<li key={String(r.uid)} className="flex justify-between">
									<span>{String(r.name ?? r.uid)}</span>
									<span className="font-bold">{n(r.cnt)}</span>
								</li>
							))}
						</ul>
					)}
					<p className="text-xs text-[#6B7A83] mt-3">Дата регистрации записывается с 30.09.2026 — у более ранних учеников её нет.</p>
				</Card>

				<Card title="🧪 Диагностический тест (/test)">
					<div className="grid grid-cols-3 gap-3">
						<Stat label="Прошли" value={n(diag.leads)} small />
						<Stat label="В Telegram-боте" value={`${n(diag.tg)} (${pct(n(diag.tg), n(diag.leads))})`} small />
						<Stat label="Открыли кейс" value={n(diag.opened)} small />
					</div>
				</Card>

				<Card title="🍕 Пицца и Додо">
					<div className="grid grid-cols-3 gap-3 mb-4">
						<Stat label="Выдано кодов" value={n(dodo.assigned)} small />
						<Stat label="Свободно кодов" value={n(dodo.free)} small />
						<Stat label="Скоро 8/8 (6+)" value={n(pizza.close_to_full)} small />
					</div>
					{dodoList.length > 0 && (
						<ul className="space-y-1.5 text-sm">
							{dodoList.map((d) => (
								<li key={String(d.code)} className="flex justify-between gap-2">
									<span>{String(d.user_name ?? '—')}</span>
									<code className="text-[#9AA7B0]">{String(d.code)}</code>
								</li>
							))}
						</ul>
					)}
				</Card>

				<Card title="⭐ Оценки уроков (понятность 1–4)">
					{ratings.length === 0 ? <Empty /> : (
						<ul className="space-y-1.5 text-sm">
							{ratings.map((r) => (
								<li key={String(r.id)} className="flex justify-between gap-2">
									<span className="truncate">{String(r.title ?? r.id)}</span>
									<span className="whitespace-nowrap">
										<b style={{ color: n(r.avg) < 2.5 ? '#DC605B' : n(r.avg) < 3.3 ? '#F09B38' : '#78C93C' }}>{String(r.avg)}</b>
										<span className="text-[#9AA7B0]"> · {n(r.cnt)} оц.{n(r.bad) > 0 ? ` · 👎 ${n(r.bad)}` : ''}</span>
									</span>
								</li>
							))}
						</ul>
					)}
					{ratingComments.length > 0 && (
						<div className="mt-4 space-y-2">
							<p className="text-xs text-[#9AA7B0] font-bold">Что непонятно:</p>
							{ratingComments.map((c, i) => (
								<div key={i} className="rounded-lg bg-[#0E1519] p-2 text-sm">
									<p className="text-xs text-[#9AA7B0]">{String(c.title ?? '')} · оценка {n(c.score)}</p>
									<p>{String(c.comment)}</p>
								</div>
							))}
						</div>
					)}
				</Card>

				<Card title="🐺 Банды">
					{gangs.length === 0 ? <Empty /> : (
						<ul className="space-y-1.5 text-sm">
							{gangs.map((g) => (
								<li key={String(g.id)} className="flex justify-between">
									<span>{String(g.emoji)} {String(g.name)}</span>
									<span className="font-bold">{n(g.members)} чел.</span>
								</li>
							))}
						</ul>
					)}
				</Card>
			</div>
		</div>
	)
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<div className="rounded-xl border border-[#3A464E] bg-[#161F23] p-4">
		<h3 className="font-bold mb-3">{title}</h3>
		{children}
	</div>
)

const Stat = ({ label, value, small }: { label: string; value: number | string; small?: boolean }) => (
	<div className={`rounded-xl border border-[#3A464E] bg-[#161F23] ${small ? 'p-2.5' : 'p-4'}`}>
		<p className={`${small ? 'text-xl' : 'text-3xl'} font-extrabold`}>{value}</p>
		<p className="text-xs text-[#9AA7B0] mt-0.5">{label}</p>
	</div>
)

const Empty = () => <p className="text-sm text-[#6B7A83]">Пока пусто</p>
