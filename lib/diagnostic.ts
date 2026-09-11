// lib/diagnostic.ts
//
// Общие типы/хелперы для анонимного диагностического теста (математика/
// физика) — воронка без регистрации, см. db/schema.ts (diagnosticQuestions/
// diagnosticLeads) и scripts/seedDiagnosticTest.ts.

export type DiagnosticSubject = 'math' | 'physics';

export const DIAGNOSTIC_SUBJECTS: DiagnosticSubject[] = ['math', 'physics'];

export const DIAGNOSTIC_SUBJECT_LABEL: Record<DiagnosticSubject, string> = {
	math: 'Математика',
	physics: 'Физика',
};

export const isDiagnosticSubject = (value: string): value is DiagnosticSubject =>
	DIAGNOSTIC_SUBJECTS.includes(value as DiagnosticSubject);

export type DiagnosticOption = {
	text: string;
	correct: boolean;
};

export type DiagnosticQuestion = {
	id: number;
	order: number;
	tUnitId: number | null;
	tUnitTitle: string;
	firstTLessonId: number | null;
	question: string;
	imageSrc: string | null;
	options: DiagnosticOption[];
};

export const shuffle = <T,>(arr: T[]): T[] => {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};
