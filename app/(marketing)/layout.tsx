//layout.tsx

import { Footer } from './footer'
import { Header } from './header'
import { getUserProgress } from '@/db/queries'

type Props = {
	children: React.ReactNode
}
const MarketingLayout = async ({ children }: Props) => {
	const userProgressRow = await getUserProgress()

	return (
		<div className='min-h-screen flex flex-col'>
			<Header dbUserName={userProgressRow?.userName} />
			<main className='flex-1 flex flex-col items-center justify-center'>{children}</main>
			<Footer />
		</div>
	)
}

export default MarketingLayout
