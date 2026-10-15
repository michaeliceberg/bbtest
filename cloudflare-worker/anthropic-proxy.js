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
        const response = await fetch("https://api.anthropic.com" + url.pathname + url.search, {
            method: "POST",
            headers: request.headers,
            body: await request.arrayBuffer(),
        });
        return new Response(response.body, { status: response.status, headers: response.headers });
    },
};
