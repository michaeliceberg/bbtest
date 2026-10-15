// app/admin/build-topics/page.tsx — темы из «Билда на задачу» (lib/photoTask.ts), по частоте.
// Сверху — темы, под которые у нас НЕТ уроков (что делать следующим) с кнопкой «Урок сделан» → ученикам ачивка
// «Соавтор» и сообщение в Telegram. Ниже — все темы задач и самые востребованные уроки. Доступ — app/admin/layout.tsx.

import Link from 'next/link'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { markBuildTopicCovered } from '@/actions/photo-task'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>
const q = async (query: ReturnType<typeof sql>) => (await db.execute(query)) as unknown as Row[]
const n = (v: unknown) => Number(v ?? 0)
const day = (v: unknown) => new Date(String(v)).toLocaleDateString('ru-RU')

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="rounded-2xl border border-[#2A363C] bg-[#161F23] p-4">
		<h3 className="mb-3 text-lg font-bold">{title}</h3>
		{children}
	</section>
)

export default async function BuildTopicsPage() {
	const [tot] = await q(sql`SELECT count(*) FILTER (WHERE error IS NULL) AS scans, count(DISTINCT user_id) AS users FROM photo_task_requests`)
	const missing = await q(sql`
		SELECT t AS topic, count(*) AS cnt, count(DISTINCT p.user_id) AS users, max(p.created_at) AS last,
			(SELECT c.lesson_id FROM photo_topic_covered c WHERE c.topic = t ORDER BY c.id DESC LIMIT 1) AS covered_lesson
		FROM photo_task_requests p, jsonb_array_elements_text(coalesce(p.missing_topics, '[]'::jsonb)) AS t
		GROUP BY t ORDER BY (SELECT 1 FROM photo_topic_covered c WHERE c.topic = t LIMIT 1) NULLS FIRST, cnt DESC, last DESC`)
	const topics = await q(sql`
		SELECT t AS topic, count(*) AS cnt, count(DISTINCT p.user_id) AS users
		FROM photo_task_requests p, jsonb_array_elements_text(coalesce(p.topics, '[]'::jsonb)) AS t
		GROUP BY t ORDER BY cnt DESC LIMIT 100`)
	const lessons = await q(sql`
		SELECT l.id, l.title, u.title AS unit, count(*) AS cnt
		FROM photo_task_requests p, jsonb_array_elements_text(coalesce(p.lesson_ids, '[]'::jsonb)) AS lid
		JOIN t_lessons l ON l.id = lid::int JOIN t_units u ON u.id = l.t_unit_id
		GROUP BY l.id, l.title, u.title ORDER BY cnt DESC LIMIT 30`)

	return (
		<div className="max-w-4xl mx-auto text-[#F2F7FB] space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-2xl font-bold">⚔️ Билд на задачу: темы</h2>
				<Link href="/admin/funnel" className="text-sm text-[#9AA7B0] underline">← Воронка</Link>
			</div>
			<p className="text-sm text-[#9AA7B0]">Разобрано фото: {n(tot?.scans)} · учеников: {n(tot?.users)}. Тема «не хватает» — её назвала модель, когда под задачу не нашлось урока.</p>

			<Card title="🛠️ Не хватает уроков (что делать следующим)">
				{missing.length === 0 ? <p className="text-sm text-[#6B7A83]">Пока пусто.</p> : (
					<div className="space-y-2">
						{missing.map((m) => (
							<div key={String(m.topic)} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#2A363C] px-3 py-2">
								<span className="flex-1 min-w-[180px] font-bold">{String(m.topic)}</span>
								<span className="text-sm"><b>{n(m.cnt)}</b> раз · {n(m.users)} уч. · {day(m.last)}</span>
								{m.covered_lesson ? (
									<Link href={`/t-lesson/${n(m.covered_lesson)}`} className="text-sm font-bold text-[#A1D151]">✅ урок #{n(m.covered_lesson)}</Link>
								) : (
									<form action={markBuildTopicCovered} className="flex items-center gap-2">
										<input type="hidden" name="topic" value={String(m.topic)} />
										<input name="lessonId" type="number" required placeholder="id урока"
											className="w-24 rounded-lg border border-[#3A464E] bg-[#0F171B] px-2 py-1 text-sm" />
										<button className="rounded-lg bg-[#5CC99F] px-3 py-1 text-sm font-bold text-[#0B2018]">Урок сделан</button>
									</form>
								)}
							</div>
						))}
					</div>
				)}
				<p className="mt-3 text-xs text-[#6B7A83]">«Урок сделан» — всем ученикам с этой темой: ачивка «Соавтор» (+🍕) и сообщение в Telegram (если вход через Telegram).</p>
			</Card>

			<Card title="📊 Все темы задач (по частоте)">
				{topics.length === 0 ? <p className="text-sm text-[#6B7A83]">Пока пусто.</p> : (
					<ul className="space-y-1 text-sm">
						{topics.map((t) => (
							<li key={String(t.topic)} className="flex justify-between gap-3"><span className="truncate">{String(t.topic)}</span><span className="whitespace-nowrap"><b>{n(t.cnt)}</b> · {n(t.users)} уч.</span></li>
						))}
					</ul>
				)}
			</Card>

			<Card title="🎯 Какие наши уроки чаще всего попадают в билды">
				{lessons.length === 0 ? <p className="text-sm text-[#6B7A83]">Пока пусто.</p> : (
					<ul className="space-y-1 text-sm">
						{lessons.map((l) => (
							<li key={n(l.id)} className="flex justify-between gap-3"><span className="truncate">{String(l.title)} <span className="text-[#6B7A83]">· {String(l.unit)}</span></span><b>{n(l.cnt)}</b></li>
						))}
					</ul>
				)}
			</Card>
		</div>
	)
}
