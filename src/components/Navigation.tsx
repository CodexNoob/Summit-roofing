import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { site } from '#/config/site'
import { container } from '#/components/ui'

export function Logo({ light = true, href = '#top', className = '' }: { light?: boolean; href?: string; className?: string }) {
	return (
		<a href={href} className={`flex items-center gap-3 ${className}`} aria-label={`${site.name} home`}>
			<span className="grid size-10 place-items-center rounded-[10px] bg-accent font-display text-xl font-extrabold text-navy">
				<svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
					<path d="M3 13 12 4l9 9" />
					<path d="M6 11v9h12v-9" />
				</svg>
			</span>
			<span className={`font-display text-lg leading-none font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
				{site.name.replace(' Co.', '')}
				<span className="block pt-1 text-[10px] font-semibold tracking-[0.28em] uppercase opacity-70">Roofing Co.</span>
			</span>
		</a>
	)
}

export function Navigation() {
	const [scrolled, setScrolled] = useState(false)
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState('top')

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 40)
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	useEffect(() => {
		const ids = site.nav.map((n) => n.id)
		const io = new IntersectionObserver(
			(entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
			{ rootMargin: '-45% 0px -50% 0px' },
		)
		ids.forEach((id) => {
			const el = document.getElementById(id)
			if (el) io.observe(el)
		})
		return () => io.disconnect()
	}, [])

	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
		document.addEventListener('keydown', onKey)
		const prev = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.removeEventListener('keydown', onKey)
			document.body.style.overflow = prev
		}
	}, [open])

	const solid = scrolled || open
	return (
		<>
		<header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${solid ? 'bg-navy/95 shadow-[0_1px_0_rgba(255,255,255,0.08)] backdrop-blur' : 'bg-transparent'}`}>
			<div className={`${container} flex items-center justify-between transition-all duration-300 ${solid ? 'h-16' : 'h-20'}`}>
				<Logo />
				<nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
					{site.nav.map((n) => (
						<a
							key={n.id}
							href={n.href}
							aria-current={active === n.id ? 'true' : undefined}
							className={`group relative px-3 py-2 text-sm font-medium transition-colors ${active === n.id ? 'text-white' : 'text-white/70 hover:text-white'}`}
						>
							{n.label}
							<span className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left bg-accent transition-transform duration-300 ${active === n.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} aria-hidden />
						</a>
					))}
				</nav>
				<div className="flex items-center gap-3">
					<a href={site.contact.phoneHref} className="hidden items-center gap-2 text-sm font-medium text-white/80 hover:text-white lg:flex 2xl:hidden xl:hidden">
						<Phone className="size-4" aria-hidden /> {site.contact.phone}
					</a>
					<a href="#estimate" className="hidden min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-navy transition hover:bg-[#fb8a3c] sm:inline-flex">
						Get an Estimate
					</a>
					<button
						className="grid size-11 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10 xl:hidden"
						aria-expanded={open}
						aria-controls="mobile-menu"
						aria-label={open ? 'Close menu' : 'Open menu'}
						onClick={() => setOpen((o) => !o)}
					>
						{open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
					</button>
				</div>
			</div>

		</header>
			<div
				id="mobile-menu"
				className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-navy transition-all duration-300 xl:hidden ${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-3 opacity-0'}`}
			>
				<nav aria-label="Mobile" className={`${container} flex flex-col py-6`}>
					{site.nav.map((n) => (
						<a key={n.id} href={n.href} onClick={() => setOpen(false)} className="flex min-h-14 items-center border-b border-white/10 font-display text-2xl font-bold text-white">
							{n.label}
						</a>
					))}
					<a href="#estimate" onClick={() => setOpen(false)} className="mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-accent text-lg font-semibold text-navy">
						{site.cta.estimate}
					</a>
					<a href={site.contact.phoneHref} className="mt-4 flex min-h-12 items-center justify-center gap-2 text-white/80">
						<Phone className="size-4" aria-hidden /> {site.contact.phone} <span className="text-xs opacity-60">(demo)</span>
					</a>
				</nav>
			</div>
		</>
	)
}
