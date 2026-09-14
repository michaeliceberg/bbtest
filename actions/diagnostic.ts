'use server'

// actions/diagnostic.ts
//
// Серверные экшены анонимного диагностического теста (математика/физика).
// Никакой авторизации не требуется — это специально для холодного трафика
// без порога входа, см. db/schema.ts (diagnosticQuestions/diagnosticLeads).

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import db from "@/db/drizzle";
import { diagnosticLeads } from "@/db/schema";
import { sendMessageToTelegram, getDiagnosticBotLink } from "@/utils/telegram";
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

// Оставлена нетронутой — старый путь сбора номера телефона, сейчас нигде
// в клиенте не вызывается (заменён на startDiagnosticTelegramLead ниже),
// но не удалена на случай возврата к телефону как fallback.
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

type StartTelegramLeadInput = {
	subject: DiagnosticSubject;
	score: number;
	totalQuestions: number;
	weakUnitTitle: string | null;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
};

// Создаёт лид СРАЗУ при заходе на экран результата (не по клику) — чтобы
// диплинк-кнопка была настоящей <a href> без ожидания сервера (важно для
// мобильных браузеров: async-переход по клику часто ловит popup-блокер).
// Лид пока не "настоящий" — admin-уведомление уходит только после
// реальной верификации через бота, см. performDiagnosticBind в
// app/api/telegram/webhook/route.ts.
export const startDiagnosticTelegramLead = async (input: StartTelegramLeadInput) => {
	const token = randomBytes(6).toString("hex");

	const [row] = await db.insert(diagnosticLeads).values({
		subject: input.subject,
		score: input.score,
		totalQuestions: input.totalQuestions,
		weakUnitTitle: input.weakUnitTitle,
		utmSource: input.utmSource ?? null,
		utmMedium: input.utmMedium ?? null,
		utmCampaign: input.utmCampaign ?? null,
		telegramStartToken: token,
	}).returning({ id: diagnosticLeads.id });

	return { leadId: row.id, botLink: getDiagnosticBotLink(token) };
};

// Поллинг с клиента (см. diagnostic-client.tsx) — узнать, подтвердил ли
// пользователь подписку через /start diag_<token> в боте.
export const getDiagnosticLeadStatus = async (leadId: number) => {
	const lead = await db.query.diagnosticLeads.findFirst({ where: eq(diagnosticLeads.id, leadId) });
	return { verified: !!lead?.telegramVerifiedAt };
};
