// app/(marketing)/page.tsx

import { getUserProgress } from '@/db/queries';
import { MarketingHero } from '@/components/marketing-hero';

export default async function Home() {
  const userProgressRow = await getUserProgress();

  return <MarketingHero dbUserName={userProgressRow?.userName} />;
}
