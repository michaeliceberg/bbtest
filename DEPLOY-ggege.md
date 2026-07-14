# Деплой ggege.ru на существующий VPS (168.222.192.167)

Сервер уже занят проектом asphalt (асфальтобетонный завод). Ниже — как безопасно
подселить второй сайт (ggege / бывший 5x5) рядом, не сломав первый.

---

## 0. Важно: смени root-пароль

Пароль от root засветился в переписке — после того как всё настроишь, смени его:

```bash
passwd
```

Лучше вообще перейти на вход по SSH-ключу и отключить вход по паролю
(`PasswordAuthentication no` в `/etc/ssh/sshd_config`, затем `systemctl restart sshd`).
Не отключай, пока не проверишь, что ключ точно работает — иначе рискуешь
потерять доступ к серверу.

---

## 1. Диагностика — сначала запусти это и пришли мне вывод

Зайди на сервер и выполни (ничего не меняет, только читает):

```bash
echo "=== CPU ==="; nproc
echo "=== RAM ==="; free -h
echo "=== DISK ==="; df -h /
echo "=== ЧТО СЛУШАЕТ ПОРТЫ ==="; ss -tlnp | grep -E ':80|:443|:3000|:3001'
echo "=== PM2 (если используется) ==="; pm2 list 2>/dev/null
echo "=== NODE ПРОЦЕССЫ ==="; ps aux | grep -i node | grep -v grep
echo "=== NGINX САЙТЫ ==="; ls -la /etc/nginx/sites-enabled/
echo "=== NGINX SERVER_NAME ==="; nginx -T 2>/dev/null | grep -E "server_name|listen|proxy_pass|root "
```

Ориентир по цифрам (для двух Next.js-приложений среднего трафика — школьный проект + завод):

- **RAM** — главный лимит, не CPU. Каждый `next start` в проде обычно ест
  150–400 МБ в состоянии покоя, плюс всплески на сборке (`next build` может
  съедать 1–2 ГБ на пару минут). Для двух сайтов комфортно иметь от **4 ГБ RAM**,
  от 2 ГБ — впритык, но может работать, если оба сайта не под нагрузкой одновременно.
- **CPU** — 4 ядра на два таких сайта достаточно с запасом. Узкое место обычно не тут.
- Если во время `npm run build` на сервере зависает/падает — верный признак нехватки RAM,
  тогда лучше собирать локально и заливать `.next` уже готовым, либо добавить swap.

Пришли вывод — скажу точно, помещаемся мы или нужно расширять VPS / добавлять своп.

---

## 2. Схема: два сайта на одном nginx

- asphalt — как сейчас, слушает свой порт (скорее всего `localhost:3000`), свой server_name.
- ggege — новый процесс на **другом порту**, например `localhost:3001`.
- nginx — единая точка входа на 80/443, роутит по `server_name` (домену) на нужный порт.

---

## 3. Разворачиваем проект на сервере

```bash
cd /var/www
git clone <URL_ТВОЕГО_РЕПО> ggege
cd ggege
npm ci
```

Создать `.env` прямо командой (выполнить из папки проекта на сервере, например `/var/www/ggege`).
Секрет `NEXTAUTH_SECRET` генерируется заново на месте — не переиспользуем dev-секрет.

⚠️ **Реальные значения (пароль БД, VK/Stripe/Telegram ключи) в этот файл специально не вписаны** —
он лежит в git, а секретам в git не место (GitHub уже один раз заблокировал пуш из-за этого).
Бери актуальные значения из локального `.env` в корне проекта (не закоммичен) или из истории чата,
где мы их уже применяли на сервере:

```bash
cd /var/www/ggege

NEXTAUTH_SECRET_VAL=$(openssl rand -base64 32)

cat > .env <<EOF
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_APP_URL=https://ggege.ru
NEXTAUTH_URL=https://ggege.ru
VK_REDIRECT_URI=https://ggege.ru/api/auth/callback/vk

DATABASE_URL="postgresql://ggege_user:<ПАРОЛЬ_БД>@localhost:5432/ggege_db?sslmode=disable"

NEXTAUTH_SECRET=${NEXTAUTH_SECRET_VAL}

VK_CLIENT_ID=<VK_CLIENT_ID>
VK_CLIENT_SECRET=<VK_CLIENT_SECRET>
VK_SERVICE_KEY_ACCESS=<VK_SERVICE_KEY_ACCESS>

STRIPE_API_KEY=<STRIPE_API_KEY>
STRIPE_WEBHOOK_SECRET=<STRIPE_WEBHOOK_SECRET>

TELEGRAM_BOT_TOKEN=<TELEGRAM_BOT_TOKEN>
CHAT_ID=<CHAT_ID>
EOF

chmod 600 .env
cat .env   # проверить, что записалось верно
```

⚠️ `STRIPE_API_KEY`, если используешь тестовый ключ (`sk_test_...`) — реальные платежи по нему
проходить не будут. Когда будете готовы принимать настоящие деньги — заменить на `sk_live_...`
из Stripe Dashboard и обновить `STRIPE_WEBHOOK_SECRET` под live-режим.

⚠️ Обновление: база данных теперь **локальная на этом же VPS** (`ggege_db` на `localhost`),
не на удалённом `194.67.101.77` — так что проверка доступности сети больше не нужна, просто:

```bash
psql "postgresql://ggege_user:<ПАРОЛЬ_БД>@localhost:5432/ggege_db?sslmode=disable" -c "select 1;"
```

Сборка и запуск через pm2 (чтобы жил после отключения SSH и рестарта сервера):

```bash
npm run build
pm2 start npm --name "ggege" -- start -- -p 3001
pm2 save
pm2 startup   # один раз, чтобы pm2 поднимался при перезагрузке сервера
```

---

## 4. nginx-конфиг

Файл `/etc/nginx/sites-available/ggege.ru`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ggege.ru www.ggege.ru;

    location /_next/static {
        alias /var/www/ggege/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /static {
        alias /var/www/ggege/public;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Включить и проверить, что не сломало asphalt:

```bash
ln -s /etc/nginx/sites-available/ggege.ru /etc/nginx/sites-enabled/
nginx -t          # обязательно проверить синтаксис ДО reload
systemctl reload nginx
curl -I http://<IP_asphalt_домена>   # убедиться что старый сайт всё ещё жив
```

---

## 5. DNS на reg.ru

В панели reg.ru → управление DNS для ggege.ru:

| Тип | Имя | Значение         |
|-----|-----|-------------------|
| A   | @   | 168.222.192.167   |
| A   | www | 168.222.192.167   |

Применяется обычно от 15 минут до нескольких часов.
Проверить: `dig ggege.ru +short` или https://dnschecker.org.

---

## 6. SSL (бесплатный, Let's Encrypt)

```bash
certbot --nginx -d ggege.ru -d www.ggege.ru
```

Certbot сам допишет SSL-блок в конфиг и настроит редирект http → https.
Автопродление обычно уже стоит в cron/systemd timer — проверить:

```bash
systemctl status certbot.timer
```

---

## 7. После переезда домена — обязательно обновить

- **VK ID приложение** (dev.vk.com) → Redirect URI → `https://ggege.ru/api/auth/callback/vk`
  (без этого вход через VK не будет работать).
- **Stripe** (если используется) → webhook endpoint → `https://ggege.ru/api/webhooks/stripe`.
- Проверить вход, прохождение урока, оплату/магазин на новом домене перед тем как
  выключать доступ по старому 5x5x.ru.

---

## 8. Порядок действий (чтобы не уронить asphalt)

1. Прислать мне вывод диагностики из шага 1.
2. Склонировать репо, поставить зависимости, собрать — **не трогая существующий nginx**.
3. Добавить новый server block (шаг 4), `nginx -t`, `reload` — проверить, что asphalt жив.
4. Настроить DNS (шаг 5), подождать пропагации.
5. Выпустить SSL (шаг 6).
6. Обновить VK/Stripe (шаг 7).
7. Сменить root-пароль (шаг 0).
