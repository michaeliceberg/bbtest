// scripts/scrape-sdamgia.ts
//
// Скрейпер задач с math-ege.sdamgia.ru по списку id страницы /problem?id=.
// Для каждой задачи вытаскивает: подтему (для группировки по lessons),
// тело вопроса (текст + <img class="tex" alt="..."> placeholders вместо
// формул) и готовый ответ. Дальше это парсится вручную/через LLM в LaTeX
// и превращается в seed-скрипт для challenges/t_challenges.
//
// Запуск: npx tsx scripts/scrape-sdamgia.ts <файл-с-id-по-одному-в-строке> <выходной.json>

import { writeFileSync, readFileSync } from 'fs'

const BASE = 'https://math-ege.sdamgia.ru'
const DELAY_MS = 400

type ScrapedProblem = {
    id: string
    subtopic: string | null
    questionHtml: string | null
    answer: string | null
    error?: string
}

function extractSubtopic(html: string): string | null {
    // Число закрывающих </div> перед этим блоком зависит от того, есть ли
    // у задачи блок "Источники:" — поэтому не жёстко фиксируем префикс.
    const m = html.match(/<div> ([^<]+)<\/div><\/div><div class="nocopy"/)
    return m ? m[1].trim() : null
}

function extractQuestionHtml(html: string): string | null {
    const m = html.match(/<div align="justify"[^>]*class="pbody">([\s\S]*?)<\/div><\/div><!--np-->/)
    return m ? m[1].trim() : null
}

function extractAnswer(html: string): string | null {
    // Скрытый <div class="answer"> — формат стабильнее видимого "Ответ:" в теле решения
    const m = html.match(/class="answer"[^>]*>\s*<span[^>]*>Ответ:\s*([^<]+)<\/span>/)
    return m ? m[1].trim().replace(/\.$/, '') : null
}

async function scrapeOne(id: string): Promise<ScrapedProblem> {
    try {
        const res = await fetch(`${BASE}/problem?id=${id}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ggege-content-pipeline/1.0)' },
        })
        if (!res.ok) return { id, subtopic: null, questionHtml: null, answer: null, error: `HTTP ${res.status}` }
        const html = await res.text()
        return {
            id,
            subtopic: extractSubtopic(html),
            questionHtml: extractQuestionHtml(html),
            answer: extractAnswer(html),
        }
    } catch (err: any) {
        return { id, subtopic: null, questionHtml: null, answer: null, error: String(err?.message || err) }
    }
}

async function main() {
    const [idsFile, outFile] = process.argv.slice(2)
    if (!idsFile || !outFile) {
        console.error('Использование: npx tsx scripts/scrape-sdamgia.ts <ids.txt> <out.json>')
        process.exit(1)
    }

    const ids = readFileSync(idsFile, 'utf-8').split('\n').map((s) => s.trim()).filter(Boolean)
    console.log(`Скрейпим ${ids.length} задач...`)

    const results: ScrapedProblem[] = []
    for (let i = 0; i < ids.length; i++) {
        const result = await scrapeOne(ids[i])
        results.push(result)
        console.log(`[${i + 1}/${ids.length}] id=${result.id} subtopic="${result.subtopic}" answer="${result.answer}"${result.error ? ` ERROR: ${result.error}` : ''}`)
        if (i < ids.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS))
    }

    writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8')
    const failed = results.filter((r) => r.error || !r.questionHtml || !r.answer)
    console.log(`\nГотово: ${results.length} задач сохранено в ${outFile}`)
    console.log(`Без ошибок: ${results.length - failed.length}, с проблемами: ${failed.length}`)
}

main()
