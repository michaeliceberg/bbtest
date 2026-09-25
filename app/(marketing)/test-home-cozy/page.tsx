// Главная (первая страница с входом) в пробном тёплом стиле «cozy» —
// сравнить с текущей игровой ggege.ru. Шапка/подвал общие.
import { getUserProgress } from '@/db/queries';
import { MarketingHero } from '@/components/marketing-hero';

export default async function TestHomeCozy() {
  const userProgressRow = await getUserProgress();
  return <MarketingHero dbUserName={userProgressRow?.userName} theme='cozy' />;
}
