// app/actions/order-pizza.ts

'use server';

import db from '@/db/drizzle';
import { pizzaOrders, userProgress, userHomework } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

type OrderPizzaParams = {
    address: string;
    phone: string;
    deliveryTime: Date;
};

export async function orderPizza(params: OrderPizzaParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }
    
    const userId = session.user.id;
    
    // Получаем пользователя
    const user = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
    });
    
    if (!user) {
        return { success: false, error: 'Пользователь не найден' };
    }
    
    const price = 100;
    
    if (user.gems < price) {
        return { success: false, error: `Недостаточно гемов. Нужно ${price}💎` };
    }
    
    // Получаем текущий стрик (можно из userStreaks, но пока заглушка)
    const currentStreak = 7; // TODO: взять из реальных данных
    
    // Списываем гемы (исправлено: sql вместо $raw)
    await db.update(userProgress)
        .set({ gems: sql`${userProgress.gems} - ${price}` })
        .where(eq(userProgress.userId, userId));
    
    // Сохраняем заказ
    const [order] = await db.insert(pizzaOrders).values({
        userId,
        deliveryAddress: params.address,
        phoneNumber: params.phone,
        deliveryTime: params.deliveryTime,
        gemsSpent: price,
        streakAtOrder: currentStreak,
        status: 'pending',
    }).returning();
    
    // Можно отправить уведомление админу или в Telegram
    console.log(`🍕 Новый заказ на пиццу!`, {
        user: user.userName,
        address: params.address,
        phone: params.phone,
        deliveryTime: params.deliveryTime,
    });
    
    revalidatePath('/shop');
    
    return { success: true, orderId: order.id };
}