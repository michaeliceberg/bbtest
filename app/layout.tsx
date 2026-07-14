// app/layout.tsx

import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { ExitModal } from '@/components/modals/exit-modal';
import { HeartsModal } from '@/components/modals/hearts-modal copy';
import { PracticeModal } from '@/components/modals/practice-modal';
import { WrongAnswerModal } from '@/components/modals/wronganswer-modal';
import { RightAnswerModal } from '@/components/modals/rightanswer-modal';

import { SessionProvider } from 'next-auth/react';
import { Providers } from '@/components/for-vk-auth/providers';

import React from 'react';

const font = Nunito({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'ggege',
	description: 'Физико-математическая школа',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={font.className}>
				<Providers>
					{children}
				</Providers>
				<Toaster />
				<ExitModal />
				<RightAnswerModal />  
				<WrongAnswerModal />  
				<HeartsModal />	
				<PracticeModal />
			</body>
		</html>
	);
}


