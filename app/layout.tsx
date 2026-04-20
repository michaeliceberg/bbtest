// import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { ExitModal } from '@/components/modals/exit-modal';
import { HeartsModal } from '@/components/modals/hearts-modal copy';
import { PracticeModal } from '@/components/modals/practice-modal';
import { WrongAnswerModal } from '@/components/modals/wronganswer-modal';
import { RightAnswerModal } from '@/components/modals/rightanswer-modal';
import { getRandomNumberBetween } from '@/usefulFunctions';


import { SessionProvider } from 'next-auth/react';
import { Providers } from '@/components/for-vk-auth/providers';



import React from 'react';
import { ProtectedRoute } from '@/components/protected-route';


const font = Nunito({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: '5x5',
	description: 'Физико-математическая школа',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {



	const rightAudioList = 
		[
			'/MemesAudio/meme-right-papichlegkaya.WAV',
			'/MemesAudio/meme-right-chinazes.WAV',
			'/MemesAudio/meme-right-clapping.WAV', 
			'/MemesAudio/meme-right-estestvenno.WAV',
			'/MemesAudio/meme-right-gtapassed.WAV',
			'/MemesAudio/meme-right-nice.WAV', 
			'/MemesAudio/meme-right-umeetemogete.WAV', 
			'/MemesAudio/meme-right-chetko.WAV',
		]
	const rightImageList = 

		[
			'/MemesImage/meme-right-papich.jpg', 
			'/MemesImage/meme-right-chinazes.jpg',
			'/MemesImage/meme-right-clapping.jpeg',
			'/MemesImage/meme-right-estestvenno.jpg',
			'/MemesImage/meme-right-gtapassed.jpeg',
			'/MemesImage/meme-right-nice.jpeg',
			'/MemesImage/meme-right-umeetemogete.jpeg',
			'/MemesImage/meme-right-umeetemogete.jpeg',
		]



		
	const wrongAudioList = 
		[
			'/MemesAudio/meme-wrong-kid.WAV', 
			'/MemesAudio/meme-wrong-sharish.WAV',
			'/MemesAudio/meme-wrong-polnomochia.WAV',
			'/MemesAudio/meme-wrong-ponovoy.WAV', 
			'/MemesAudio/meme-wrong-shirokuiu.WAV', 
			'/MemesAudio/meme-wrong-tivtiraesh.WAV', 
			'/MemesAudio/meme-wrong-tipereputal.WAV',
			'/MemesAudio/meme-wrong-pacankuspehy.WAV',
			'/MemesAudio/meme-wrong-shokoladnevinovat.WAV',
			'/MemesAudio/meme-wrong-etofiaskobratan.WAV',
			'/MemesAudio/meme-wrong-skolko.WAV',

		]
	const wrongImageList = 
		[
			'/MemesImage/meme-wrong-kid.jpg', 
			'/MemesImage/meme-wrong-sharish.jpeg',
			'/MemesImage/meme-wrong-polnomochia.jpeg',
			'/MemesImage/meme-wrong-ponovoy.jpeg',
			'/MemesImage/meme-wrong-shirokuiu.jpeg',
			'/MemesImage/meme-wrong-tivtiraesh.jpeg',
			'/MemesImage/meme-wrong-tipereputal.jpg',
			'/MemesImage/meme-wrong-pacankuspehy.jpeg',
			'/MemesImage/meme-wrong-pacankuspehy.jpeg',
			'/MemesImage/meme-wrong-etofiaskobratan.jpeg',
			'/MemesImage/meme-wrong-etofiaskobratan.jpeg',
			'/MemesImage/meme-wrong-skolko.jpg',
			
		]




	const rightMessageList =
		[
			'Молодец!', 
			'Красавчик!', 
			'Еееее!', 
			'Угадал!', 
			'Лучший!', 
			'Ты просто Монстр!',
			'Не останавливайся!',
			'Чиназес! СЮДА!',
			'Умеете могёте!',
		]

	const wrongMessageList = 
		[
			'О нет!', 
			'Вжик!', 
			'АхХахахАх!', 
			'Почти угадал!',
			'Ладушки-ладушки!',
			'В следущий раз повезёт!',
			'Это какой-то позор',
			'Ноуп',
			'Не фартануло!',
		]



	// const wrongLottieList = 
	// 	[
	// 		LottieDeathHeart, 
	// 		LottieDeathWrongCoffin, 
	// 		LottieDeathWrongCry, 
	// 		LottieDeathWrongDoor, 
	// 		LottieDeathWrongHeartsSteel, 
	// 		LottieDeathWrongShakeHead
	// 	]



	
	const randomNumber1 = getRandomNumberBetween(0, rightAudioList.length)
	const randomRightAudio = rightAudioList[randomNumber1]
	const randomRightImage= rightImageList[randomNumber1]

	const randomNumber2 = getRandomNumberBetween(0, wrongAudioList.length)
	const randomWrongAudio = wrongAudioList[randomNumber2]
	const randomWrongImage = wrongImageList[randomNumber2]
	
	const randomRightMessage = wrongMessageList[getRandomNumberBetween(0, rightMessageList.length)]
	const randomWrongMessage = wrongMessageList[getRandomNumberBetween(0, wrongMessageList.length)]
	


	// const randomWrongLottie: LottieRefCurrentProps = wrongLottieList[getRandomNumberBetween(0, wrongLottieList.length)]
	// let randomWrongLottie = React.useRef<LottieRefCurrentProps>(null)
	const randomLottieNumber= getRandomNumberBetween(0, 6)

	// const randomWrongLottie = useRef<LottieView>(null);


	

	return (
		// <ClerkProvider>
		// <SessionProvider>
		
			<html lang='en'>
				<body className={font.className}>
					<Providers>
						{children}
					</Providers>
				</body>
				<Toaster />
				<ExitModal />
				
				 <RightAnswerModal 
					randomRightAudio={randomRightAudio}
					randomRightImage={randomRightImage}
					randomRightMessage={randomRightMessage}

				/>

				<WrongAnswerModal 
					randomWrongAudio={randomWrongAudio}
					randomWrongImage={randomWrongImage}
					randomWrongMessage={randomWrongMessage}
					randomLottieNumber={randomLottieNumber}

				/> 

				<HeartsModal />	
				<PracticeModal />
			</html>
			
		// {/* // </ClerkProvider> */}
	// </SessionProvider>

	);
}















// return (
// 	// <ClerkProvider>
// 	<SessionProvider>
// 		<html lang='en'>
// 			{/* //123 */}
// 			{/* <script src="https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js"></script> */}
// 			<body className={font.className}>
// 				{/* {children} */}
// 				{/* <ProtectedRoute> */}
// 					{children}
// 				{/* </ProtectedRoute> */}
// 			</body>
// 			<Toaster />
// 			<ExitModal />
			
// 			 <RightAnswerModal 
// 				randomRightAudio={randomRightAudio}
// 				randomRightImage={randomRightImage}
// 				randomRightMessage={randomRightMessage}

// 			/>

// 			<WrongAnswerModal 
// 				randomWrongAudio={randomWrongAudio}
// 				randomWrongImage={randomWrongImage}
// 				randomWrongMessage={randomWrongMessage}
// 				randomLottieNumber={randomLottieNumber}

// 			/> 

// 			<HeartsModal />	
// 			<PracticeModal />
// 		</html>
// 	{/* // </ClerkProvider> */}
// </SessionProvider>

// );