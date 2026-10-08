// app/(marketing)/page.tsx

import { getUserProgress } from '@/db/queries';
import { MarketingHero } from '@/components/marketing-hero';
import { redirect } from 'next/navigation';
import { getGangInvite } from '@/lib/gangInvite';

export default async function Home({ searchParams }: { searchParams?: { ref?: string } }) {
  const userProgressRow = await getUserProgress();

  // Старые ссылки приглашения в банду (?ref=КОД главы/капо): у кого аккаунт уже есть —
  // ведём на страницу вступления, иначе ссылка просто открывала главную.
  if (userProgressRow && searchParams?.ref && await getGangInvite(searchParams.ref)) {
    redirect(`/g/${searchParams.ref.toUpperCase()}`);
  }

  return <MarketingHero dbUserName={userProgressRow?.userName} />;
}
