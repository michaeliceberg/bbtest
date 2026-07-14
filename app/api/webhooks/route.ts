import db from "@/db/drizzle"
import { userSubscription } from "@/db/schema"
import { stripe } from "@/lib/stripe"
import { error } from "console"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(req: Request) {
    const body = await req.text()
    const signature = headers().get("Stripe-Signature") as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        )
    } catch(error: any) {
        return new NextResponse(`Webhook error: ${error.message}`, {
            status: 400,
        })
    }
    
    return new NextResponse(null, {status: 200})
}