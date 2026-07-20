// components/ui/button.tsx

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide',
	{
		variants: {
			variant: {
				locked: 'bg-neutral-700 text-primary-foreground hover:bg-neutral-700/90 border-neutral-600 border-b-4 active:border-b-0',
				default: 'bg-[#161F23] text-[#F2F7FB] border-[#3A464E] border-2 border-b-4 active:border-b-2 hover:bg-[#232F34]',
				primary: 'bg-sky-400 text-primary-foreground hover:bg-sky-400/90 border-sky-500 border-b-4 active:border-b-0',
				primaryOutline: 'bg-[#161F23] text-sky-400 hover:bg-[#232F34]',
				secondary: 'bg-green-500 text-primary-foreground hover:bg-green-500/90 border-green-600 border-b-4 active:border-b-0',
				secondaryOutline: 'bg-[#161F23] text-green-400 hover:bg-[#232F34]',
				danger: 'bg-rose-500 text-primary-foreground hover:bg-rose-500/90 border-rose-600 border-b-4 active:border-b-0',
				dangerOutline: 'bg-[#161F23] text-rose-400 hover:bg-[#232F34]',
				super: 'bg-indigo-500 text-primary-foreground hover:bg-indigo-500/90 border-indigo-600 border-b-4 active:border-b-0',
				superOutline: 'bg-[#161F23] text-indigo-400 hover:bg-[#232F34]',
				ghost: 'bg-transparent text-[#9AA7B0] border-transparent border-0 hover:bg-[#232F34]',
				sidebar: 'bg-transparent text-[#9AA7B0] border-2 border-transparent hover:bg-[#232F34] transition-none',

				sidebarOutline: 'bg-sky-500/15 text-sky-400 border-sky-500/40 border-2 hover:bg-sky-500/20 transition-none',
				isLate: 'bg-rose-500/10 text-rose-400 border-rose-500/40 border-2 hover:bg-sky-500/20 transition-none',
				isNotLate: 'bg-green-500/10 text-green-400 border-green-500/40 border-2 transition-none',
				statDefault: 'bg-[#161F23] text-[#F2F7FB] border-[#3A464E] border-2 hover:bg-[#232F34]',
				author: 'bg-[#161F23] text-[#F2F7FB] border-[#3A464E] border-2',
				buy: 'bg-[#161F23] text-[#F2F7FB] border-[#3A464E] border-2 border-b-4 active:border-b-2 hover:bg-[#232F34]',
				leader: 'bg-transparent text-[#9AA7B0] border-transparent border-0 hover:bg-[#232F34]',
				today: 'bg-green-500/10 text-green-400 border-green-500/40 hover:border-green-500/40 hover:border-2 transition-none',


				construct: 'bg-transparent text-[#9AA7B0] border-[#3A464E] border-dashed border-2 hover:bg-[#232F34]',

				trainer_bad: 'bg-red-400 text-primary-foreground hover:bg-red-400/90 border-red-500 border-b-4 active:border-b-0',
				trainer_better: 'bg-green-400 text-primary-foreground hover:bg-green-400/90 border-green-500 border-b-4 active:border-b-0',
				trainer_best: 'bg-yellow-300 text-primary-foreground hover:bg-yellow-300/90 border-yellow-500 border-b-4 active:border-b-0',
				skillLesson: 'bg-[#3A4E58] text-[#6A7E8A] border-0 transition-none',

			},
			size: {
				default: 'h-11 px-4 py-2',
				xs: 'h-7 px-2',
				sm: 'h-9 px-3',
				lg: 'h-12 px-8',
				construct: 'h-16 px-8',
				icon: 'h-10 w-10',
				rounded: 'rounded-full',
				lesson: 'active:border-b-2',
				buy: 'px-12 h-12',
				leader: 'px-2 h-14'
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
