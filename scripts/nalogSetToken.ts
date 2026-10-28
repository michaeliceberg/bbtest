// Перенести вход в «Мой налог» из браузера на сервер (когда нет пароля и не работает вход по СМС).
// Строку для запуска собирает консоль браузера на lknpd.nalog.ru (см. CLAUDE.md, «Чеки в Мой налог»):
// на вход (stdin) — JSON {inn, deviceId, refreshToken}. Ключ проверяется и сохраняется в nalog_auth, в консоль не печатается.
import 'dotenv/config'
import postgres from 'postgres'
import { refreshAuth } from '../lib/moyNalogApi'

const raw = await new Promise<string>((res) => { let s = ''; process.stdin.on('data', (d) => (s += d)); process.stdin.on('end', () => res(s)) })
const input = JSON.parse(raw) as { inn: string; deviceId: string; refreshToken: string }
let token = input.refreshToken
try { const p = JSON.parse(token); if (typeof p === 'string') token = p } catch { /* обычная строка */ }

const auth = await refreshAuth(token, input.deviceId)
if (!auth.token) throw new Error('«Мой налог» не принял ключ')
const sql = postgres(process.env.DATABASE_URL!)
await sql`INSERT INTO nalog_auth (id, inn, device_id, refresh_token, updated_at) VALUES (1, ${input.inn}, ${input.deviceId}, ${auth.refreshToken || token}, now())
    ON CONFLICT (id) DO UPDATE SET inn = EXCLUDED.inn, device_id = EXCLUDED.device_id, refresh_token = EXCLUDED.refresh_token, updated_at = now()`
await sql.end()
console.log(`ГОТОВО: вход в «Мой налог» сохранён (ИНН ${auth.profile?.inn ?? input.inn})`)
