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

const HEATMAP_WEEKS = 26

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

	// Активность — только ученики: прохождения админов (ты и тестовые
	// аккаунты) считаем отдельно, иначе они забивают всю статистику.
	// Каждая строка t_lesson_progress — одно прохождение (повторы тоже).
	const [activity] = await q(sql`
		SELECT count(DISTINCT p.user_id) FILTER (WHERE coalesce(u.is_admin, 0) = 0 AND date_done >= now() - interval '1 day') AS dau,
			count(DISTINCT p.user_id) FILTER (WHERE coalesce(u.is_admin, 0) = 0 AND date_done >= now() - interval '7 days') AS wau,
			count(*) FILTER (WHERE coalesce(u.is_admin, 0) = 0 AND date_done >= ${since} AND training_pts > 0) AS lessons,
			count(*) FILTER (WHERE coalesce(u.is_admin, 0) <> 0 AND date_done >= ${since} AND training_pts > 0) AS admin_lessons
		FROM t_lesson_progress p LEFT JOIN user_progress u ON u.user_id = p.user_id`)

	// Топ-10 учеников по числу РАЗНЫХ пройденных уроков тренажёра за период
	// (повторы одного урока не считаются; админы и тестовые не участвуют).
	const topLearners = await q(sql`
		SELECT p.user_id AS uid, max(u.user_name) AS name,
			count(DISTINCT p.t_lesson_id) AS distinct_lessons, count(*) AS passes,
			to_char(max((p.date_done AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow'), 'DD.MM') AS last_day
		FROM t_lesson_progress p LEFT JOIN user_progress u ON u.user_id = p.user_id
		WHERE p.training_pts > 0 AND coalesce(u.is_admin, 0) = 0 AND p.date_done >= ${since}
		GROUP BY p.user_id ORDER BY distinct_lessons DESC, passes DESC LIMIT 10`)

	// Календарь активности (как у GitHub): последние HEATMAP_WEEKS недель,
	// день по Москве. date_done/created_at — timestamp без зоны, пишутся в UTC.
	const heatRows = await q(sql`
		WITH lessons AS (
			SELECT ((p.date_done AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow')::date AS d,
				count(*) AS lessons, count(DISTINCT p.user_id) AS users
			FROM t_lesson_progress p LEFT JOIN user_progress u ON u.user_id = p.user_id
			WHERE p.training_pts > 0 AND coalesce(u.is_admin, 0) = 0
				AND p.date_done >= now() - interval '${sql.raw(String(HEATMAP_WEEKS * 7 + 7))} days'
			GROUP BY 1),
		guests AS (
			SELECT ((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow')::date AS d, count(*) AS guests
			FROM guest_lesson_leads
			WHERE created_at >= now() - interval '${sql.raw(String(HEATMAP_WEEKS * 7 + 7))} days'
			GROUP BY 1),
		-- Новый ученик = день его первого появления: регистрация
		-- (created_at есть только с 30.09.2026) или первый урок тренажёра.
		firsts AS (
			SELECT ((least(u.created_at, min(p.date_done)) AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow')::date AS d
			FROM user_progress u LEFT JOIN t_lesson_progress p ON p.user_id = u.user_id
			WHERE coalesce(u.is_admin, 0) = 0
			GROUP BY u.user_id, u.created_at),
		news AS (SELECT d, count(*) AS new_users FROM firsts WHERE d IS NOT NULL GROUP BY d)
		SELECT to_char(coalesce(l.d, g.d, n.d), 'YYYY-MM-DD') AS day,
			coalesce(l.lessons, 0) AS lessons, coalesce(l.users, 0) AS users,
			coalesce(g.guests, 0) AS guests, coalesce(n.new_users, 0) AS new_users
		FROM lessons l FULL JOIN guests g ON g.d = l.d FULL JOIN news n ON n.d = coalesce(l.d, g.d)`)

	const gangs = await q(sql`
		SELECT g.id, g.emoji, g.name, count(m.id) AS members
		FROM gangs g LEFT JOIN gang_members m ON m.gang_id = g.id
		GROUP BY g.id ORDER BY members DESC, g.id LIMIT 10`)

	const [dodo] = await q(sql`
		SELECT count(*) FILTER (WHERE assigned_to_user_id IS NOT NULL) AS assigned,
			count(*) FILTER (WHERE assigned_to_user_id IS NULL) AS free
		FROM dodo_promo_codes`)

	// Дерево приглашений (за всё время) — кто кого привёл, ветки раскрываются.
	const treeUsers = await q(sql`
		SELECT user_id, user_name, nickname, invited_by_user_id, referral_rewarded_at IS NOT NULL AS done
		FROM user_progress
		WHERE invited_by_user_id IS NOT NULL
			OR user_id IN (SELECT invited_by_user_id FROM user_progress WHERE invited_by_user_id IS NOT NULL)`)
	const earnedRows = await q(sql`
		SELECT beneficiary_user_id AS uid, sum(eighths) AS e FROM referral_rewards WHERE level >= 1 GROUP BY 1`)
	const earned = new Map(earnedRows.map((r) => [String(r.uid), n(r.e)]))
	const nodes = new Map<string, TreeNode>()
	for (const r of treeUsers) {
		nodes.set(String(r.user_id), {
			id: String(r.user_id),
			name: String(r.nickname ?? r.user_name ?? r.user_id),
			realName: r.nickname && r.user_name ? String(r.user_name) : null,
			done: !!r.done,
			eighths: earned.get(String(r.user_id)) ?? 0,
			children: [],
		})
	}
	const roots: TreeNode[] = []
	for (const r of treeUsers) {
		const node = nodes.get(String(r.user_id))!
		const parent = r.invited_by_user_id ? nodes.get(String(r.invited_by_user_id)) : undefined
		if (parent && parent !== node) parent.children.push(node)
		else roots.push(node)
	}
	const sizeOf = (t: TreeNode, seen = new Set<string>()): number => {
		if (seen.has(t.id)) return 0
		seen.add(t.id)
		return t.children.reduce((a, c) => a + 1 + sizeOf(c, seen), 0)
	}
	roots.sort((a, b) => sizeOf(b) - sizeOf(a))
	const treeRoots = roots.filter((r) => r.children.length > 0)

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
			round(avg(r.score + 1)::numeric, 2) AS avg,
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
				<Stat label={`Уроков тренажёра за период (учениками; ещё ${n(activity.admin_lessons)} — твои/тестовые)`} value={n(activity.lessons)} />
				<Stat label="Всего учеников" value={n(reg.total_users)} />
			</div>

			<ActivityHeatmap rows={heatRows} />

			<Card title="🏆 Топ-10 учеников по разным урокам тренажёра">
				{topLearners.length === 0 ? (
					<Empty />
				) : (
					<div className="space-y-1.5">
						{topLearners.map((r, i) => (
							<div key={String(r.uid)} className="flex items-center gap-3 text-sm">
								<span className="w-6 text-right font-bold text-[#9AA7B0]">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
								<span className="flex-1 truncate">{String(r.name ?? r.uid)}</span>
								<span className="font-extrabold">{n(r.distinct_lessons)}</span>
								<span className="w-28 text-xs text-[#6B7A83]">
									{n(r.passes)} прохожд. · {String(r.last_day ?? '')}
								</span>
							</div>
						))}
						<p className="text-xs text-[#6B7A83] pt-1">
							Число — разные уроки (повторы не в счёт), справа — все прохождения и последний день. Твои и тестовые не считаются.
						</p>
					</div>
				)}
			</Card>

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

				<Card title="🌳 Дерево приглашений (всё время)">
					{treeRoots.length === 0 ? <Empty /> : (
						<div className="space-y-1 text-sm">
							{treeRoots.map((t) => <TreeBranch key={t.id} node={t} depth={0} sizeOf={sizeOf} />)}
						</div>
					)}
					<p className="text-xs text-[#6B7A83] mt-3">
						В скобках: привёл сам / всего в ветке. ✅ — прошёл 3 урока (физика или тригонометрия) (пицца по ветке раздана). 🍕 — сколько заработал на приглашениях.
					</p>
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

				<Card title="⭐ Оценки уроков (понятность 2–5)">
					{ratings.length === 0 ? <Empty /> : (
						<ul className="space-y-1.5 text-sm">
							{ratings.map((r) => (
								<li key={String(r.id)} className="flex justify-between gap-2">
									<span className="truncate">{String(r.title ?? r.id)}</span>
									<span className="whitespace-nowrap">
										<b style={{ color: n(r.avg) < 3.5 ? '#DC605B' : n(r.avg) < 4.3 ? '#F09B38' : '#78C93C' }}>{String(r.avg)}</b>
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
									<p className="text-xs text-[#9AA7B0]">{String(c.title ?? '')} · оценка {n(c.score) + 1}</p>
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

type TreeNode = { id: string; name: string; realName: string | null; done: boolean; eighths: number; children: TreeNode[] }

const pizzaLabel = (e: number) => {
	const whole = Math.floor(e / 8)
	const frac = e % 8
	const f = frac === 4 ? '½' : frac === 2 ? '¼' : frac === 6 ? '¾' : frac ? `${frac}/8` : ''
	return `${whole || ''}${f}` || '0'
}

const TreeBranch = ({ node, depth, sizeOf }: { node: TreeNode; depth: number; sizeOf: (t: TreeNode) => number }) => {
	const label = (
		<span className="inline-flex flex-wrap items-center gap-x-2">
			<span className="font-bold">{node.done ? '✅ ' : ''}{node.name}</span>
			{node.realName && <span className="text-xs text-[#6B7A83]">{node.realName}</span>}
			{node.children.length > 0 && <span className="text-xs text-[#9AA7B0]">({node.children.length} / {sizeOf(node)})</span>}
			{node.eighths > 0 && <span className="text-xs text-yellow-300">🍕 {pizzaLabel(node.eighths)}</span>}
		</span>
	)
	if (node.children.length === 0 || depth > 8) return <div className="pl-5 py-0.5">{label}</div>
	return (
		<details className="py-0.5" >
			<summary className="cursor-pointer select-none">{label}</summary>
			<div className="ml-3 border-l border-[#3A464E] pl-2">
				{node.children.map((c) => <TreeBranch key={c.id} node={c} depth={depth + 1} sizeOf={sizeOf} />)}
			</div>
		</details>
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

// ── Календарь активности ─────────────────────────────────────────────────

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const HEAT = ['#232F34', '#2B4A63', '#3B6D96', '#4D8FC4', '#6FB3EA']

const moscowToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' })
const addDays = (iso: string, k: number) => {
	const d = new Date(`${iso}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + k)
	return d.toISOString().slice(0, 10)
}
const fmtDay = (iso: string) => {
	const d = new Date(`${iso}T00:00:00Z`)
	return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

const ActivityHeatmap = ({ rows }: { rows: Row[] }) => {
	const byDay = new Map(rows.map((r) => [String(r.day), r]))
	const today = moscowToday()
	// Сетка начинается с понедельника, HEATMAP_WEEKS недель назад.
	const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7 // 0 = пн
	const start = addDays(today, -weekday - (HEATMAP_WEEKS - 1) * 7)

	const cells: { day: string; act: number; lessons: number; users: number; guests: number; news: number; future: boolean }[] = []
	for (let i = 0; i < HEATMAP_WEEKS * 7; i++) {
		const day = addDays(start, i)
		const r = byDay.get(day)
		const lessons = n(r?.lessons), guests = n(r?.guests)
		cells.push({ day, lessons, guests, act: lessons + guests, users: n(r?.users), news: n(r?.new_users), future: day > today })
	}
	const real = cells.filter((c) => !c.future)
	const max = Math.max(1, ...real.map((c) => c.act))
	const level = (a: number) => (a === 0 ? 0 : Math.min(4, Math.ceil((a / max) * 4)))
	const activeDays = real.filter((c) => c.act > 0).length
	const newDays = real.filter((c) => c.news > 0).length
	const totalNew = real.reduce((s, c) => s + c.news, 0)
	const peak = real.reduce((b, c) => (c.act > b.act ? c : b), real[0])

	return (
		<Card title="🗓️ Активность по дням">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
				<Stat label="Активных дней" value={activeDays} small />
				<Stat label="Дней с новыми учениками" value={newDays} small />
				<Stat label="Новых учеников" value={totalNew} small />
				<Stat label="Пиковый день" value={peak && peak.act > 0 ? `${fmtDay(peak.day)} · ${peak.act}` : '—'} small />
			</div>
			<div className="overflow-x-auto">
				<div
					className="grid grid-flow-col gap-[3px] min-w-[420px]"
					style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, minmax(0, 1fr))` }}
				>
					{cells.map((c) => (
						<div
							key={c.day}
							title={
								c.future
									? ''
									: `${fmtDay(c.day)}: уроков ${c.lessons}, учеников ${c.users}, гостей на пробном ${c.guests}` +
										(c.news ? `, новых учеников ${c.news}` : '')
							}
							className="relative aspect-square rounded-[3px]"
							style={{
								backgroundColor: c.future ? 'transparent' : HEAT[level(c.act)],
								boxShadow: c.news ? 'inset 0 0 0 2px #78C93C' : undefined,
							}}
						>
							{c.news > 0 && <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-[#78C93C]" />}
						</div>
					))}
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs text-[#9AA7B0]">
				<span className="flex items-center gap-1.5">
					<span className="h-3 w-3 rounded-[3px] bg-[#232F34]" style={{ boxShadow: 'inset 0 0 0 2px #78C93C' }} />
					зелёная рамка — в этот день пришли новые ученики
				</span>
				<span className="flex items-center gap-1">
					меньше {HEAT.map((h) => <span key={h} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: h }} />)} больше
				</span>
			</div>
			<p className="text-xs text-[#6B7A83] mt-2">
				Цвет — уроки тренажёра учеников + гости на пробном уроке. Твои и тестовые прохождения не считаются. Наведи на день — подробности.
			</p>
		</Card>
	)
}
