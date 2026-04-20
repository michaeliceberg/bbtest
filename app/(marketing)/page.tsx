'use client'
import { Button } from '@/components/ui/button';
// import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';


// /Users/mac/Downloads/LottieWaterMellonThumbsUp.json
// import LottieWaterMellonThumbsUp from '@/public/Lottie/LottieWaterMellonThumbsUp.json'
import LottieHelloBread from '@/public/LottieHelloBread.json'

import Lottie from 'lottie-react';


export default function Home() {
	return (
		// <div>
		// 	hello
		// </div>


		<div className='max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2'>
			<div className='relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0'>
				
				{/* <Lottie className="h-120 w-120 pr-5"
						animationData={ LottieHelloBread } 
				/> */}

				{/* <Lottie 
                    animationData={ LottieWaterMellonThumbsUp } 
                    className="h-20 w-20"
                /> */}

				
{/* <Image src='/hero.svg' fill alt='Hero' /> */}
			<Image src='/LottieHelloBreadImg.jpg' fill alt='Hero' />
			</div>

			<div className='flex flex-col items-center gap-y-8'>
				<h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>Учи и практикуй математику с нами!</h1>
				<div className='flex flex-col items-center gap-y-3 max-w-[330px] w-full'>
					{/* <ClerkLoading> */}
						<Loader className='h-5 w-5 text-muted-foreground animate-spin'></Loader>
					{/* </ClerkLoading> */}

					{/* <ClerkLoaded>
						<SignedOut>
							<SignUpButton 
								mode='modal' 
								signInForceRedirectUrl='/learn' 
								signInFallbackRedirectUrl='/learn'
							> */}

								<Button size='lg' variant='secondary' className='w-full'>
									<Link href='/learn'>Продолжаем учиться</Link>
								</Button>

								<Link href='/learn'>Продолжаем учиться</Link>


								
							{/* </SignUpButton>

							<SignInButton 
								mode='modal' 
								signUpForceRedirectUrl='/learn' 
								signUpFallbackRedirectUrl='/learn'
								// afterSignInUrl='/learn'
								// afterSignUpUrl='/learn'
							>
								<Button size='lg' variant='primaryOutline' className='w-full'>
									У меня уже есть Аккаунт
								</Button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<Button size='lg' variant='secondary' className='w-full' asChild>
								<Link href='/learn'>Продолжаем учиться</Link>
							</Button>
						</SignedIn>
					</ClerkLoaded> */}


					
				</div>
			</div>
		</div>
	);
}
