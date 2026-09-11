// app/test/[subject]/page.tsx
//
// Публичная, анонимная страница диагностического теста — без логина, без
// шапки основного приложения. Вопросы — "снимок" реальных заданий
// тренажёра, засеянный scripts/seedDiagnosticTest.ts в diagnostic_questions
// (db/schema.ts). Пока вопросы не засеяны — страница не падает, просто
// показывает заглушку "скоро".

import 'katex/dist/katex.min.css';
import { eq } from 'drizzle-orm';
import db from '@/db/drizzle';
import { diagnosticQuestions } from '@/db/schema';
import { DIAGNOSTIC_SUBJECT_LABEL, isDiagnosticSubject, type DiagnosticQuestion } from '@/lib/diagnostic';
import { DiagnosticClient } from './diagnostic-client';

type Props = {
	params: { subject: string };
	searchParams: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
};

export default async function DiagnosticTestPage({ params, searchParams }: Props) {
	if (!isDiagnosticSubject(params.subject)) {
		return (
			<div className="min-h-screen bg-[#0F171A] text-[#F2F7FB] flex items-center justify-center p-6">
				<p className="text-center text-[#9AA7B0]">Такого теста не существует.</p>
			</div>
		);
	}

	const subject = params.subject;

	const rows = await db.query.diagnosticQuestions.findMany({
		where: eq(diagnosticQuestions.subject, subject),
		orderBy: (q, { asc }) => [asc(q.order)],
	});

	if (rows.length === 0) {
		return (
			<div className="min-h-screen bg-[#0F171A] text-[#F2F7FB] flex items-center justify-center p-6">
				<div className="text-center max-w-sm">
					<p className="text-lg font-bold mb-2">Тест по предмету «{DIAGNOSTIC_SUBJECT_LABEL[subject]}» скоро появится</p>
					<p className="text-sm text-[#9AA7B0]">Загляните чуть позже.</p>
				</div>
			</div>
		);
	}

	const questions: DiagnosticQuestion[] = rows.map((r) => ({
		id: r.id,
		order: r.order,
		tUnitId: r.t_unitId,
		tUnitTitle: r.t_unitTitle,
		firstTLessonId: r.firstTLessonId,
		question: r.question,
		imageSrc: r.imageSrc,
		options: JSON.parse(r.optionsJson),
	}));

	return (
		<DiagnosticClient
			subject={subject}
			questions={questions}
			utm={{
				source: searchParams.utm_source ?? null,
				medium: searchParams.utm_medium ?? null,
				campaign: searchParams.utm_campaign ?? null,
			}}
		/>
	);
}
