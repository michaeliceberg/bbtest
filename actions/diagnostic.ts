'use server'

// actions/diagnostic.ts
//
// Серверные экшены анонимного диагностического теста (математика/физика).
// Никакой авторизации не требуется — это специально для холодного трафика
// без порога входа, см. db/schema.ts (diagnosticQuestions/diagnosticLeads).

import db from "@/db/drizzle";
import { diagnosticLeads } from "@/db/schema";
import { sendMessageToTelegram } from "@/utils/telegram";
import { DIAGNOSTIC_SUBJECT_LABEL, type DiagnosticSubject } from "@/lib/diagnostic";

type SubmitLeadInput = {
	subject: DiagnosticSubject;
	phone: string;
	score: number;
	totalQuestions: number;
	weakUnitTitle: string | null;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
};

export const submitDiagnosticLead = async (input: SubmitLeadInput) => {
	const digitsOnly = input.phone.replace(/\D/g, "");
	if (digitsOnly.length < 10) {
		throw new Error("Некорректный номер телефона");
	}

	const [row] = await db.insert(diagnosticLeads).values({
		subject: input.subject,
		phone: digitsOnly,
		score: input.score,
		totalQuestions: input.totalQuestions,
		weakUnitTitle: input.weakUnitTitle,
		utmSource: input.utmSource ?? null,
		utmMedium: input.utmMedium ?? null,
		utmCampaign: input.utmCampaign ?? null,
	}).returning({ id: diagnosticLeads.id });

	// Уведомление админу в Telegram — без chatId уходит в дефолтный чат
	// (см. sendMessageToTelegram в utils/telegram.ts).
	const utmLine = [input.utmSource, input.utmMedium, input.utmCampaign].filter(Boolean).join(" / ");
	await sendMessageToTelegram(
		`🎯 *Новый лид с диагностического теста*\n\n` +
		`Предмет: ${DIAGNOSTIC_SUBJECT_LABEL[input.subject]}\n` +
		`Телефон: \`${digitsOnly}\`\n` +
		`Результат: ${input.score}/${input.totalQuestions}\n` +
		(input.weakUnitTitle ? `Слабая тема: ${input.weakUnitTitle}\n` : "") +
		(utmLine ? `Источник: ${utmLine}\n` : "")
	);

	return { leadId: row.id };
};
