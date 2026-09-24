'use client';

import { upsertUserProgress } from '@/actions/user-progress';
import { courses, userProgress } from '@/db/schema';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Card } from './card';

type Props = {
	courses: (typeof courses.$inferSelect)[];
	activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
};


const SECTIONS = [
	{ prefix: 'ЕГЭ', label: 'ЕГЭ' },
	{ prefix: 'ОГЭ', label: 'ОГЭ' },
	{ prefix: 'ЛНИП', label: 'ЛНИП · 7 класс' },
];

// Порядок внутри блока: ЕГЭ — Математика, затем Физика; ЛНИП — Физика, затем Математика.
const ORDER_IN_SECTION: Record<string, string[]> = {
	'ЕГЭ': ['Математика', 'Физика'],
	'ЛНИП': ['Физика', 'Математика'],
};
const rank = (prefix: string, title: string) => {
	const order = ORDER_IN_SECTION[prefix] ?? [];
	const i = order.findIndex(word => title.includes(word));
	return i === -1 ? order.length : i;
};

export const List = ({ courses, activeCourseId }: Props) => {
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	const onClick = (id: number) => {
		if (pending) return;
		if (id === activeCourseId) {
			return router.push('/learn');
		}
		startTransition(() => {
			upsertUserProgress(id).catch(() => toast.error('Что-то пошло не так'));
		});
	};

	// Блоки курсов: ЕГЭ сверху, ниже ОГЭ, ниже ЛНИП (по префиксу названия).
	const sections = SECTIONS.map(sec => ({
		...sec,
		items: courses
			.filter(c => c.title.startsWith(sec.prefix))
			.sort((a, b) => rank(sec.prefix, a.title) - rank(sec.prefix, b.title)),
	})).filter(sec => sec.items.length > 0);
	const rest = courses.filter(c => !SECTIONS.some(sec => c.title.startsWith(sec.prefix)));
	if (rest.length > 0) sections.push({ prefix: '', label: 'Другие курсы', items: rest });

	return (
		<div className='flex flex-col gap-8 pt-6 pb-10'>
			{sections.map(sec => (
				<section key={sec.label}>
					<div className='mb-3 flex items-center gap-3'>
						<h2 className='text-sm font-extrabold uppercase tracking-[0.15em] text-[#9AA7B0]'>{sec.label}</h2>
						<div className='h-px flex-1 bg-gradient-to-r from-[#3A464E] to-transparent' />
					</div>
					<div className='grid grid-cols-2 gap-4 sm:gap-5'>
						{sec.items.map(course => (
							<Card key={course.id} id={course.id} title={course.title} imageSrc={course.imageSrc} onClick={onClick} disabled={pending} active={course.id === activeCourseId} />
						))}
					</div>
				</section>
			))}
		</div>
	);
};
