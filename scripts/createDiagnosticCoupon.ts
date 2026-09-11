// scripts/createDiagnosticCoupon.ts
//
// Разовый скрипт — создаёт Stripe-купон на 20% (once) и промокод DIAG20,
// показываемый на экране результата диагностического теста. Запускать
// один раз (идемпотентно — если промокод уже существует, просто выводит
// его). Код можно ввести на странице Stripe Checkout, т.к. actions/
// user-subscription.ts теперь создаёт сессию с allow_promotion_codes: true.

import "dotenv/config";
import { stripe } from "@/lib/stripe";

const PROMO_CODE = "DIAG20";

async function main() {
  const existing = await stripe.promotionCodes.list({ code: PROMO_CODE, limit: 1 });
  if (existing.data.length > 0) {
    console.log(`Промокод уже существует: ${existing.data[0].code} (id=${existing.data[0].id})`);
    process.exit(0);
  }

  const coupon = await stripe.coupons.create({
    percent_off: 20,
    duration: "once",
    name: "Диагностика -20%",
  });

  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: PROMO_CODE,
  });

  console.log(`✅ Создан промокод: ${promotionCode.code} (coupon=${coupon.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
