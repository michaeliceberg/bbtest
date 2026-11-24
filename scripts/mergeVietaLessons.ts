// Теорема Виета: 10 мелких тренировок слиты в 3 (455, 459, 464). Задачи и прогресс переносятся, ничего не теряется.
// Идемпотентно. Урок-разбор 502 не трогаем. Внимание: seedVietaTrainer.ts после этого запускать нельзя (сносит юнит).
import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)
const UNIT = 31
const PLAN = [
    { keep: 455, from: [455, 456, 457, 458], title: 'Подбираем корни — тренировка', hint: 'подбор двух чисел по сумме и произведению: сначала одно равенство, потом оба сразу, корни целые положительные' },
    { keep: 459, from: [459, 460, 461], title: 'Корни с минусом — тренировка', hint: 'подбор корней по сумме и произведению, когда один или оба корня отрицательные' },
    { keep: 464, from: [462, 463, 464], title: 'Контрольная — теорема Виета', hint: 'приведённое квадратное уравнение x² + bx + c = 0: x₁ + x₂ = −b, x₁ · x₂ = c, подбираем корни' },
]

async function main() {
    await sql.begin(async (tx) => {
        const [{ n: before }] = await tx`select count(*)::int n from t_challenges c join t_lessons l on l.id = c.lesson_id where l.t_unit_id = ${UNIT}`
        const [{ n: prog }] = await tx`select count(*)::int n from t_lesson_progress p join t_lessons l on l.id = p.t_lesson_id where l.t_unit_id = ${UNIT}`
        for (let i = 0; i < PLAN.length; i++) {
            const P = PLAN[i]
            const gone = P.from.filter((x) => x !== P.keep)
            const ch = await tx`select id from t_challenges where lesson_id in ${tx(P.from)} order by id`
            for (let k = 0; k < ch.length; k++) await tx`update t_challenges set lesson_id = ${P.keep}, "order" = ${k + 1} where id = ${ch[k].id}`
            await tx`update t_lesson_progress set t_lesson_id = ${P.keep} where t_lesson_id in ${tx(gone)}`
            await tx`update ege_moves set t_lesson_id = ${P.keep} where t_lesson_id in ${tx(gone)}`
            await tx`update ege_moves set t_lesson_id2 = ${P.keep} where t_lesson_id2 in ${tx(gone)}`
            await tx`update t_lessons set title = ${P.title}, ai_hint = ${P.hint}, "order" = ${i + 2} where id = ${P.keep}`
            await tx`delete from t_lessons where id in ${tx(gone)} and t_unit_id = ${UNIT}`
        }
        const [{ n: after }] = await tx`select count(*)::int n from t_challenges c join t_lessons l on l.id = c.lesson_id where l.t_unit_id = ${UNIT}`
        const [{ n: prog2 }] = await tx`select count(*)::int n from t_lesson_progress p join t_lessons l on l.id = p.t_lesson_id where l.t_unit_id = ${UNIT}`
        if (before !== after || prog !== prog2) throw new Error(`потеря: задачи ${before}→${after}, прогресс ${prog}→${prog2}`)
        console.log({ before, after, prog, prog2 })
    })
    console.log((await sql`select l.id, l."order", l.title, count(c.id)::int n from t_lessons l left join t_challenges c on c.lesson_id = l.id where l.t_unit_id = ${UNIT} group by l.id order by l."order"`).map((l) => `${l.id} ${l.order} ${l.title}: ${l.n}`))
    await sql.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
