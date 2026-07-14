// app/api/telegram/set-webhook/route.ts

import { NextResponse } from 'next/server';

// ЭТА СТРОКА РЕШАЕТ ПРОБЛЕМУ!
// Указывает Next.js НЕ пытаться статически генерировать этот роут
export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = "7675525540:AAGy9BBsi54zeaFFs2Jt9k_PR2ofrRnGUQ8";

export async function GET() {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    
    const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`
    );
    const data = await response.json();
    
    console.log('Webhook установлен:', data);
    
    return NextResponse.json(data);
}









// // app/api/telegram/set-webhook/route.ts

// import { NextResponse } from 'next/server';

// const TELEGRAM_BOT_TOKEN = "7675525540:AAGy9BBsi54zeaFFs2Jt9k_PR2ofrRnGUQ8";

// export async function GET() {
//     const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    
//     const response = await fetch(
//         `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`
//     );
//     const data = await response.json();
    
//     console.log('Webhook установлен:', data);
    
//     return NextResponse.json(data);
// }













// // app/api/telegram/set-webhook/route.ts

// import { NextResponse } from 'next/server';

// export async function GET() {
//     const botToken = "7675525540:AAGy9BBsi54zeaFFs2Jt9k_PR2ofrRnGUQ8";
//     const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    
//     const response = await fetch(
//         `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`
//     );
//     const data = await response.json();
    
//     return NextResponse.json(data);
// }
