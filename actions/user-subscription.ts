'use server'

import { getUserSubscription } from "@/db/queries"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { absoluteUrl } from "@/lib/utils"
// import { auth, currentUser } from "@clerk/nextjs/server"

const returnUrl = absoluteUrl('/shop')

export const createStripeUrl = async () => {
    // const {userId} = await auth()
    // const user = await currentUser()

    const session = await auth();  
	// Проверяем авторизацию
	if (!session?.user?.id) {
	  throw new Error('Вы не авторизованы!');
	}	
	const userId = session.user.id;



    const userSubscription = await getUserSubscription()
    
    if (userSubscription && userSubscription.stripeCustomerId) {
        const stripeSession = await stripe.billingPortal.sessions.create({
            customer: userSubscription.stripeCustomerId,
            return_url: returnUrl
        })

        return { data: stripeSession.url }
    }

    const stripeSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: session.user.id,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: "USD",
                    product_data: {
                        name: "Lingo PRO",
                        description: "Unlimited Hearts"
                    },
                    unit_amount: 2000,
                    recurring: {
                        interval: 'month'
                    }
                },
            },
        ],
        metadata: {
            userId,
        },
        success_url: returnUrl,
        cancel_url: returnUrl,
    })

    return { data: stripeSession.url }
}