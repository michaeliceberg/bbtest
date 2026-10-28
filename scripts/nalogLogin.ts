// Вход в «Мой налог» по СМС для автоматических чеков (если пароля от lknpd.nalog.ru нет).
// Запуск на сервере: cd /var/www/ggege && npx tsx scripts/nalogLogin.ts
// Спросит ИНН, телефон и код из СМС, сохранит долгий refreshToken в таблицу nalog_auth (в консоль не печатает).
import 'dotenv/config'
import readline from 'node:readline/promises'
import postgres from 'postgres'
import { newDeviceId, smsStart, smsVerify } from '../lib/moyNalogApi'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const inn = (await rl.question('ИНН: ')).trim()
const phone = (await rl.question('Телефон (79991234567): ')).replace(/\D/g, '')
const { challengeToken } = await smsStart(phone)
const code = (await rl.question('Код из СМС: ')).trim()
const deviceId = newDeviceId()
const auth = await smsVerify(phone, code, challengeToken, deviceId)
rl.close()
if (!auth.refreshToken) throw new Error('Мой налог не вернул refreshToken')
const sql = postgres(process.env.DATABASE_URL!)
await sql`INSERT INTO nalog_auth (id, inn, device_id, refresh_token, updated_at) VALUES (1, ${inn}, ${deviceId}, ${auth.refreshToken}, now())
    ON CONFLICT (id) DO UPDATE SET inn = EXCLUDED.inn, device_id = EXCLUDED.device_id, refresh_token = EXCLUDED.refresh_token, updated_at = now()`
await sql.end()
console.log(`ГОТОВО: вход в «Мой налог» сохранён (ИНН ${auth.profile?.inn ?? inn}). Добавь в .env строку NALOG_INN=${inn} и перезапусти ggege.`)
