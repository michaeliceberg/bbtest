// lib/catFood.ts
//
// Еда котика в холодильнике (components/cat-fridge-modal.tsx). Покупается за монеты (user_progress.points),
// сколько куплено — user_progress.cat_milk / cat_sausage. Цены общие для клиента и сервера (actions/cat.ts).

export type CatFood = 'milk' | 'sausage'
export const CAT_FOOD: Record<CatFood, { title: string; price: number; src: string }> = {
    milk: { title: 'Молоко', price: 129, src: '/hangar/life/cat-milk.webp' },
    sausage: { title: 'Колбаска', price: 249, src: '/hangar/life/cat-sausage.webp' },
}
export type CatFoodStock = Record<CatFood, number>
