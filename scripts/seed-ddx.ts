// Таблицы паззла «абонемент в спортзал» + 50 плейсхолдер-промокодов (заменить на настоящие точечным UPDATE).
import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const code = () => 'DDX-' + Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('')

async function main() {
    await sql`ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ddx_promo_code text`
    await sql`CREATE TABLE IF NOT EXISTS ddx_pieces (
        id serial PRIMARY KEY, user_id text NOT NULL, piece integer NOT NULL,
        qty integer NOT NULL DEFAULT 0, placed boolean NOT NULL DEFAULT false, updated_at timestamp DEFAULT now(),
        CONSTRAINT ddx_pieces_user_piece UNIQUE (user_id, piece))`
    await sql`CREATE TABLE IF NOT EXISTS ddx_promo_codes (
        id serial PRIMARY KEY, code text NOT NULL UNIQUE, assigned_to_user_id text, assigned_at timestamp, created_at timestamp DEFAULT now())`
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM ddx_promo_codes`
    if (n === 0) {
        for (let i = 0; i < 50; i++) await sql`INSERT INTO ddx_promo_codes (code) VALUES (${code()}) ON CONFLICT DO NOTHING`
    }
    const [{ m }] = await sql`SELECT count(*)::int AS m FROM ddx_promo_codes`
    console.log('ddx promo codes:', m)
    await sql.end()
}
main()
