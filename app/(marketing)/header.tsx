import { Button } from '@/components/ui/button'
// import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Loader } from 'lucide-react'
import Image from 'next/image'


import AuthButton from "@/components/vk-auth-btn" 


export const Header = () => {
	return (
		<header className='h-20 w-full border-b-2 border-slate-200 px-4'>
			<div className='lg:max-w-screen-lg mx-auto flex items-center justify-between h-full'>
				<div className='pt-8 pl-4 pb-7 flex items-center gap-x-3'>
					<Image src='/mascot.svg' height={40} width={40} alt='Mascot' />
					{/* <h1 className='text-2xl font-extrabold text-green-500 tracking-wide'>5x5</h1> */}

					{/* <p className='rounded-lg border-2 border-b-4 border-r-4 border-black px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block'>
						5x5
					</p> */}

					<p className='rounded-lg text-green-500 tracking-wide border-2 border-b-4 border-r-4 border-green-700 px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block'>
						5x5
					</p>

					{/* <h1 className='text-2xl font-extrabold text-green-500 tracking-wide'>5x5</h1> */}




				</div>








				<AuthButton />

				{/* <ClerkLoading> */}
					<Loader className='h-5 w-5 text-muted-foreground animate-spin' />
				{/* </ClerkLoading> */}
				
				{/* <ClerkLoaded>
					<SignedIn>
						<UserButton afterSignOutUrl='/' />
					</SignedIn>

					<SignedOut>
						<SignInButton 
							mode='modal' 
							// signInForceRedirectUrl='/learn'
							// signUpForceRedirectUrl='/learn'>		
							// CLERK_SIGN_IN_FORCE_REDIRECT_URL	


							signUpForceRedirectUrl='/learn'				
							
							
							// afterSignInUrl='/learn'
							// afterSignUpUrl='/learn'
							>
							<Button size='lg' variant='ghost'>
								Войти
							</Button>
						</SignInButton>
					</SignedOut>
				</ClerkLoaded> */}
				
			</div>
		</header>
	)
}
