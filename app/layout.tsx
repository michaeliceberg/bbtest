// app/layout.tsx

import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import dynamic from 'next/dynamic';

import { SessionProvider } from 'next-auth/react';
import { Providers } from '@/components/for-vk-auth/providers';

import React from 'react';

// Динамические импорты для client-only компонентов
const ExitModal = dynamic(() => import('@/components/modals/exit-modal').then(mod => ({ default: mod.ExitModal })), { ssr: false });
const HeartsModal = dynamic(() => import('@/components/modals/hearts-modal copy').then(mod => ({ default: mod.HeartsModal })), { ssr: false });
const PracticeModal = dynamic(() => import('@/components/modals/practice-modal').then(mod => ({ default: mod.PracticeModal })), { ssr: false });
const WrongAnswerModal = dynamic(() => import('@/components/modals/wronganswer-modal').then(mod => ({ default: mod.WrongAnswerModal })), { ssr: false });
const RightAnswerModal = dynamic(() => import('@/components/modals/rightanswer-modal').then(mod => ({ default: mod.RightAnswerModal })), { ssr: false });

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


