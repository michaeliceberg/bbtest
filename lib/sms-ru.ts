// lib/sms-ru.ts
//
// Клиент для callcheck-API SMS.ru: пользователь сам звонит на выданный
// номер, звонок не тарифицируется и не принимается — система лишь
// фиксирует сам факт звонка с нужного номера.
// https://sms.ru/api/call

type CallCheckStartResult = {
    checkId: string
    callPhone: string
    callPhonePretty: string
}

type CallCheckStatus = "waiting" | "confirmed" | "not_confirmed" | "invalid_phone" | "expired" | "error"

const SMS_RU_BASE = "https://sms.ru"

function getApiId(): string {
    const apiId = process.env.SMS_RU_API_ID
    if (!apiId) {
        throw new Error(
            "SMS_RU_API_ID не задан в .env — зарегистрируйтесь на sms.ru и добавьте ключ из личного кабинета"
        )
    }
    return apiId
}

export async function startCallCheck(phone: string): Promise<CallCheckStartResult> {
    const url = new URL(`${SMS_RU_BASE}/callcheck/add`)
    url.searchParams.set("api_id", getApiId())
    url.searchParams.set("phone", phone)
    url.searchParams.set("json", "1")

    const res = await fetch(url.toString(), { cache: "no-store" })
    const data = await res.json()

    if (data.status !== "OK") {
        throw new Error(`SMS.ru: ${data.status_text || data.status_code || "неизвестная ошибка"}`)
    }

    return {
        checkId: String(data.check_id),
        callPhone: String(data.call_phone),
        callPhonePretty: String(data.call_phone_pretty || data.call_phone),
    }
}

export async function getCallCheckStatus(checkId: string): Promise<CallCheckStatus> {
    const url = new URL(`${SMS_RU_BASE}/callcheck/status`)
    url.searchParams.set("api_id", getApiId())
    url.searchParams.set("check_id", checkId)
    url.searchParams.set("json", "1")

    const res = await fetch(url.toString(), { cache: "no-store" })
    const data = await res.json()

    switch (Number(data.status_code)) {
        case 100:
            return "waiting"
        case 401:
            return "confirmed"
        case 400:
            return "not_confirmed"
        case 202:
            return "invalid_phone"
        case 402:
            return "expired"
        default:
            return "error"
    }
}
