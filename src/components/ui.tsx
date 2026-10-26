import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
	return (
		<p className={`flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase ${dark ? 'text-accent' : 'text-accent-deep'}`}>
			<span className="h-px w-8 bg-current" aria-hidden />
			{children}
		</p>
	)
}

const base =
	'arrow-nudge group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition duration-200 active:scale-[0.98]'

export function ButtonLink({ href, children, variant = 'primary', onClick }: { href: string; children: ReactNode; variant?: 'primary' | 'ghost' | 'dark'; onClick?: () => void }) {
	const styles = {
		primary: 'bg-accent text-navy shadow-[0_8px_24px_-8px_rgba(249,115,22,0.7)] hover:bg-[#fb8a3c]',
		ghost: 'border border-white/35 text-white hover:border-white hover:bg-white/10',
		dark: 'bg-navy text-white hover:bg-slate',
	}[variant]
	return (
		<a href={href} onClick={onClick} className={`${base} ${styles}`}>
			{children}
			<ArrowRight className="size-4" aria-hidden />
		</a>
	)
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, className = '' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'dark' | 'outline'; type?: 'button' | 'submit'; disabled?: boolean; className?: string }) {
	const styles = {
		primary: 'bg-accent text-navy shadow-[0_8px_24px_-8px_rgba(249,115,22,0.7)] hover:bg-[#fb8a3c]',
		dark: 'bg-navy text-white hover:bg-slate',
		outline: 'border border-navy/20 text-navy hover:border-navy',
	}[variant]
	return (
		<button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
			{children}
			<ArrowRight className="size-4" aria-hidden />
		</button>
	)
}

export function DemoTag({ children = 'Demo content' }: { children?: ReactNode }) {
	return <span className="inline-flex rounded-full border border-current/25 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase opacity-80">{children}</span>
}

export const container = 'mx-auto w-full max-w-7xl px-5 sm:px-8'
