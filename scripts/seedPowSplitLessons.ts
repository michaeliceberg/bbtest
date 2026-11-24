// Урок 519 «Минус и дробь в степенях» разбит на три: перед ним — «Минус в степени» и «Дробь в степени».
// Идемпотентно: существующие уроки не удаляются (прогресс сохраняется), только порядок в юните 16.
import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)
const UNIT = 16
const MIX = 'Минус и дробь в степенях'
const NEW = [
    { title: 'Минус в степени', hint: 'отрицательные степени: a⁻ⁿ = 1/aⁿ, 1/a⁻ⁿ = aⁿ, минус в степени меняет этаж дроби, многоэтажные дроби, a⁰ = 1, log₂(1/8) = −3' },
    { title: 'Дробь в степени', hint: 'дробные степени и корни: корень степени n из a — это a^(1/n), корень степени n из aᵐ — это a^(m/n), log₂∛2 = 1/3' },
]
const MIX_HINT = 'минус и дробь в степени вместе: 1/ⁿ√aᵐ = a^(−m/n), 8^(−1/3) = 1/2, log₃(1/√3) = −1/2, log₈(1/2) = −1/3, log_{1/2} 16 = −4, приведение к одному основанию'

async function main() {
    await sql.begin(async (tx) => {
        const ids: number[] = []
        for (const L of NEW) {
            let [row] = await tx`select id from t_lessons where t_unit_id = ${UNIT} and title = ${L.title}`
            if (!row) {
                [row] = await tx`insert into t_lessons (title, t_unit_id, "order") values (${L.title}, ${UNIT}, 999) returning id`
                await tx`insert into t_challenges (lesson_id, type, question, "order", points, author, num_r_ans, difficulty, image_src)
                    values (${row.id}, 'SCENEWALK', ${L.title}, 1, 10, 'ЕГЭ Математика', '1', '', '')`
            }
            await tx`update t_lessons set badge = null, ai_hint = ${L.hint}, ege_part = 1 where id = ${row.id}`
            ids.push(row.id)
        }
        await tx`update t_lessons set badge = null, ai_hint = ${MIX_HINT} where t_unit_id = ${UNIT} and title = ${MIX}`
        const all = await tx`select id, title from t_lessons where t_unit_id = ${UNIT} order by "order", id`
        const rest = all.filter((l) => !ids.includes(l.id))
        const i = rest.findIndex((l) => l.title === MIX)
        if (i < 0) throw new Error('нет урока-смеси')
        const order = [...rest.slice(0, i).map((l) => l.id), ...ids, ...rest.slice(i).map((l) => l.id)]
        for (let k = 0; k < order.length; k++) await tx`update t_lessons set "order" = ${k + 1} where id = ${order[k]}`
    })
    console.log((await sql`select id, "order", title from t_lessons where t_unit_id = ${UNIT} order by "order"`).map((l) => `${l.id} ${l.order} ${l.title}`))
    await sql.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
