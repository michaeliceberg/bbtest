// scripts/telegram-poller.ts
//
// Хостинг не может принимать входящие запросы от Telegram (webhook не
// доходит — проверено, блокировка на уровне сети), зато исходящие через
// Cloudflare-прокси работают. Поэтому вместо webhook держим постоянный
// long-polling: спрашиваем у Telegram "что нового?" с timeout=25 — он
// отвечает МГНОВЕННО, как только приходит сообщение, а не ждёт таймаут.
// Задержка ответа бота — доли секунды, как у обычного webhook.
//
// Каждое полученное обновление просто пересылаем на уже существующий
// /api/telegram/webhook (localhost, сеть тут ни при чём) — вся логика
// команд (/bind, /report и т.д.) остаётся в одном месте.
//
// Запускается отдельным pm2-процессом (не частью Next.js):
//   pm2 start "npx tsx scripts/telegram-poller.ts" --name ggege-telegram-poller

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const TELEGRAM_BOT_TOKEN = '7675525540:AAGy9BBsi54zeaFFs2Jt9k_PR2ofrRnGUQ8';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
const WEBHOOK_URL = 'http://localhost:3001/api/telegram/webhook';
const OFFSET_FILE = path.join(process.cwd(), 'scripts', '.telegram-offset.json');
const LONG_POLL_TIMEOUT_SEC = 25;

function readOffset(): number {
    try {
        const raw = fs.readFileSync(OFFSET_FILE, 'utf-8');
        return JSON.parse(raw).offset ?? 0;
    } catch {
        return 0;
    }
}

function writeOffset(offset: number) {
    fs.writeFileSync(OFFSET_FILE, JSON.stringify({ offset }));
}

async function deleteWebhookIfSet() {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    const data = await res.json();
    console.log('🔌 deleteWebhook:', data);
}

async function pollOnce(offset: number): Promise<number> {
    const url = `${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=${LONG_POLL_TIMEOUT_SEC}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
        console.error('❌ getUpdates ошибка:', data);
        return offset;
    }

    let nextOffset = offset;
    for (const update of data.result) {
        console.log('📨 Обновление от Telegram:', update.update_id);
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update),
            });
        } catch (err) {
            console.error('❌ Не удалось переслать на webhook:', err);
        }
        nextOffset = update.update_id + 1;
    }

    if (nextOffset !== offset) {
        writeOffset(nextOffset);
    }

    return nextOffset;
}

async function main() {
    console.log('🚀 Telegram long-poller запущен');
    await deleteWebhookIfSet();

    let offset = readOffset();

    while (true) {
        try {
            offset = await pollOnce(offset);
        } catch (err) {
            console.error('❌ Ошибка опроса, пауза 3с:', err);
            await new Promise((r) => setTimeout(r, 3000));
        }
    }
}

main();
