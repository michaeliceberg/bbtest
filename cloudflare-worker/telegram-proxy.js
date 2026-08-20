// cloudflare-worker/telegram-proxy.js
//
// Прозрачный прокси в api.telegram.org. Нужен потому, что с хостинга ggege
// исходящие HTTPS-запросы к api.telegram.org блокируются (проверено:
// ICMP-пинг проходит, TCP/443 — нет), а у Cloudflare такой блокировки нет.
//
// Ничего не меняет на VPS: сервер просто стучится сюда вместо
// api.telegram.org (см. TELEGRAM_API_BASE в .env), а этот Worker
// один-в-один пересылает запрос дальше и возвращает ответ как есть.
// Не трогает никакие другие приложения на хостинге.
//
// Деплой: cloudflare.com → Workers & Pages → Create → вставить этот код →
// Deploy. Скопировать выданный адрес (https://<name>.<account>.workers.dev)
// и прописать в .env на сервере: TELEGRAM_API_BASE=<этот адрес>

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const target = "https://api.telegram.org" + url.pathname + url.search;

        const init = {
            method: request.method,
            headers: request.headers,
            body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
        };

        const response = await fetch(target, init);

        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        });
    },
};
