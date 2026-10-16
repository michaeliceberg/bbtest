// cloudflare-worker/anthropic-proxy.js
//
// Прозрачный прокси в api.anthropic.com для «Сфоткай задачу» (lib/photoTask.ts). С хостинга ggege
// api.anthropic.com недоступен (проверено 2026-10-15: соединение уходит в таймаут), как и api.telegram.org
// (см. telegram-proxy.js). Пропускает только POST /v1/messages — остальное 403.
//
// Деплой: cloudflare.com → Workers & Pages → Create → вставить этот код → Deploy. Адрес вида
// https://<name>.<account>.workers.dev прописать в .env на сервере: ANTHROPIC_BASE_URL=<этот адрес>
// (SDK Anthropic читает эту переменную сам). Ключ API в Worker НЕ кладём — его шлёт наш сервер.

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (request.method !== "POST" || url.pathname !== "/v1/messages") {
            return new Response("Forbidden", { status: 403 });
        }
        // Тело может прийти сжатым gzip (заголовок x-gz): с хостинга в России соединение к Cloudflare
        // обрывается на запросах больше ~30 КБ, поэтому lib/photoTask.ts сжимает JSON, а мы распаковываем.
        const headers = new Headers(request.headers);
        let body;
        if (headers.get("x-gz") === "1") {
            headers.delete("x-gz");
            headers.delete("content-length");
            body = await new Response(request.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
        } else {
            body = await request.arrayBuffer();
        }
        const response = await fetch("https://api.anthropic.com" + url.pathname + url.search, {
            method: "POST",
            headers,
            body,
        });
        return new Response(response.body, { status: response.status, headers: response.headers });
    },
};
