// Таблица сохранённой расстановки ангара (редактор /test-hangar-layout → «Сохранить»). Одна строка id=1.
import 'dotenv/config'
import postgres from 'postgres'
const sql = postgres(process.env.DATABASE_URL!)
async function main() {
    await sql`CREATE TABLE IF NOT EXISTS hangar_layout (id integer PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), updated_by text)`
    console.log('ok')
    await sql.end()
}
main()
