# Импорт задач из Google Sheets

## Быстрый старт

```bash
# Один раз: настройка credentials (см. ниже)

# Потом просто запускайте:
npm run import:sheets -- --sheet "p7-lnip-SUPER" --courseId 1 --courseTitle "ЛНИП Физика 7"
```

**Что происходит:**
1. Скрипт читает ваш Google Sheets → парсит данные
2. Вставляет Units, Lessons, Challenges, Options в БД
3. Вы пишете в Sheets, скрипт сам всё импортирует — никаких CSV экспортов!

---

## Настройка Google Sheets API (5 минут)

### 1. Создайте Google Cloud проект

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API:
   - Поиск по "Google Sheets API"
   - Нажмите "Enable"

### 2. Создайте сервис-аккаунт

1. Слева: **Service Accounts** (Учётные записи)
2. **Create Service Account**
3. Имя: `lingo-sheets-import` (или любое)
4. Дальше → Дальше → Готово

### 3. Скачайте JSON ключ

1. Нажмите на созданный сервис-аккаунт
2. Вкладка **Keys**
3. **Add Key** → **Create new key**
4. Type: **JSON**
5. Скачается файл типа `lingo-sheets-import-xxx.json`

### 4. Сохраните в проект

**Вариант A** (рекомендую): в `.env.local`
```bash
GOOGLE_SHEETS_CREDS_FILE=./scripts/.google-creds.json
GOOGLE_SHEETS_ID=1xSc-_CD2u5FhFv5UU2vHT_UZXQsJcHJFHdh2IyMXNFw
```

Затем:
```bash
# Скопируйте файл
cp ~/Downloads/lingo-sheets-import-xxx.json scripts/.google-creds.json
```

**Вариант B**: как env переменная (для CI/CD)
```bash
# Конвертируйте JSON в одну строку
cat scripts/.google-creds.json | jq -c . | pbcopy
# Вставьте в .env.local:
GOOGLE_SHEETS_CREDS='{"type":"service_account",...}'
```

### 5. Поделитесь Google Sheets с сервис-аккаунтом

1. Откройте ваш Google Sheets: **ЛНИП МАТ+ФИЗ**
2. **Share** (Поделиться)
3. Email сервис-аккаунта (найдёте в JSON файле как `client_email`):
   ```
   lingo-sheets-import@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```
4. **Can view** → Share

---

## Использование

### Импортировать один лист

```bash
npm run import:sheets -- \
  --sheet "p7-lnip-SUPER" \
  --courseId 1 \
  --courseTitle "ЛНИП Физика 7"
```

### Создать несколько команд в package.json

```json
{
  "scripts": {
    "import:sheets": "tsx ./scripts/importLNIPFromSheets.ts",
    "import:p7": "npm run import:sheets -- --sheet 'p7-lnip-SUPER' --courseId 1 --courseTitle 'ЛНИП Физика 7'",
    "import:m9": "npm run import:sheets -- --sheet 'm9-T' --courseId 9 --courseTitle 'ЛНИП Математика 9'",
    "import:all": "npm run import:p7 && npm run import:m9"
  }
}
```

Потом просто:
```bash
npm run import:p7
npm run import:all
```

---

## Структура данных в Sheets

Скрипт ожидает эту структуру (совпадает с вашей текущей):

| Секция | Обязательные столбцы |
|--------|---|
| **Units** | `unit_id`, `unit_title`, `unit_description`, `order`, `imageSrc` |
| **Lessons** | `lesson_id`, `unit_id`, `title`, `order` |
| **Challenges** | `chal_id`, `lesson_id`, `chal_type`, `chal_text`, `chal_pts`, `chal_author` |
| **Options** | `chal_opt_TRUE`, `chal_opt_FALSE1`, `chal_opt_FALSE2`, ... |

### Пример: как структурировать лист

```
[Row 1]  course,1,,ЛНИП Физика 7
[Row 2]  p7 export
[Row 3]  
[Row 4]  units
[Row 5]  unit_id | unit_title              | unit_description | order | imageSrc
[Row 6]  101     | Средняя скорость        | Описание 1        | 101   | LottieUnit1
[Row 7]  102     | Масса                   | Описание 2        | 102   | LottieUnit2
...
[RowN]   lessons
[RowN+1] lesson_id | unit_id | title                | order
[RowN+2] 101       | 101     | Средняя скорость 1   | 101
...
[RowM]   chal
[RowM+1] chal_id | lesson_id | chal_type | chal_text | chal_pts | chal_opt_TRUE | chal_opt_FALSE1 | ...
[RowM+2] 1011    | 101       | ASSIST    | На гора... | 10       | 48 км/ч       | 44 км/ч         | ...
```

---

## Troubleshooting

### ❌ "Credentials file not found"
```bash
# Проверьте путь в .env.local
cat .env.local | grep GOOGLE_SHEETS_CREDS_FILE

# Убедитесь файл существует
ls -la scripts/.google-creds.json
```

### ❌ "Sheet not found"
- Проверьте точное имя листа (case-sensitive)
- `npm run import:sheets` без аргументов покажет доступные листы

### ❌ "Permission denied"
- Убедитесь, что поделились Sheets с email сервис-аккаунта
- Файл JSON скачан и содержит верный `client_email`

### ❌ "DATABASE_URL is required"
```bash
# Проверьте .env.local
echo $DATABASE_URL
```

---

## Тестирование перед импортом

Скрипт показывает сколько найдено:
```
📥 Импортирую p7-lnip-SUPER в курс ЛНИП Физика 7 (ID: 1)...
📊 Получено 2345 строк из "p7-lnip-SUPER"

✅ Вставляю Units (9)...
✅ Вставляю Lessons (128)...
✅ Вставляю Challenges (542)...
✅ Вставляю Options (3254)...

🎉 Импорт завершён!
  Units: 9
  Lessons: 128
  Challenges: 542
  Options: 3254
```

Если цифры неправильные — исправьте Sheets и повторите.

---

## Автоматизация (опционально)

Можете запускать импорт по расписанию (GitHub Actions, cron, etc):

```bash
# Каждый вторник в 10:00
npm run import:all
```

Или интегрировать в CI/CD:
```yaml
# .github/workflows/sync-sheets.yml
- name: Import from Google Sheets
  run: npm run import:all
  env:
    GOOGLE_SHEETS_CREDS_FILE: ./scripts/.google-creds.json
```

---

## Заметки

- **Первый импорт** может быть медленным (много данных)
- **Обновления** работают быстро (скрипт очищает старые → вставляет новые)
- **Backup**: перед критичными импортами сделайте дамп БД
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```
