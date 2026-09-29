// scripts/seed-dodo-codes.ts
//
// Разово засевает 100 ПЛЕЙСХОЛДЕР-промокодов Додо Пиццы в dodo_promo_codes
// (см. db/schema.ts) — по прямой просьбе пользователя ("давай как будто у
// нас есть список — сгенерируй 100 рандомных промокода, потом заменим на
// настоящие"). Формат DODO-XXXXXX (6 случайных алфавитно-цифровых символов,
// заглавные буквы). Замена на настоящие коды позже — просто UPDATE/новый
// прогон этого же скрипта с реальным списком, без правок кода выдачи
// (lib/caseApply.ts, applyResolvedReward).
//
// Идемпотентно — коды уникальны (case UNIQUE), повторный запуск просто
// добавит ЕЩЁ 100 новых кодов поверх старых (не трогает уже назначенные).

import 'dotenv/config';
import { randomBytes } from 'crypto';
import db from '../db/drizzle';
import { dodoPromoCodes } from '../db/schema';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих символов (0/O, 1/I)

function generateCode(): string {
	const bytes = randomBytes(6);
	let suffix = '';
	for (let i = 0; i < 6; i++) {
		suffix += ALPHABET[bytes[i] % ALPHABET.length];
	}
	return `DODO-${suffix}`;
}

async function main() {
	const codes = new Set<string>();
	while (codes.size < 100) {
		codes.add(generateCode());
	}

	await db.insert(dodoPromoCodes).values([...codes].map((code) => ({ code })));

	console.log(`OK: засеяно ${codes.size} плейсхолдер-кодов Додо Пиццы`);
}

main().then(() => process.exit(0)).catch((err) => {
	console.error(err);
	process.exit(1);
});
