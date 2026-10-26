import { ChevronDown } from 'lucide-react'
import { site } from '#/config/site'
import { ButtonLink, container, Eyebrow } from '#/components/ui'

export function Hero() {
	return (
		<section id="top" className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-navy text-white">
			<img src={site.hero.image} alt="A two-story suburban home with a new charcoal shingle roof at golden hour" className="hero-img absolute inset-0 -z-20 size-full object-cover object-[70%_50%] sm:object-center" fetchPriority="high" />
			<div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/55 to-navy/30" />
			<div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/85 via-navy/35 to-transparent" />

			<div className={`${container} pt-36 pb-28 sm:pb-32`}>
				<div className="rise" style={{ ['--d' as string]: '150ms' }}>
					<Eyebrow dark>{site.hero.eyebrow}</Eyebrow>
				</div>
				<h1 className="mt-6 max-w-4xl font-display text-[2.9rem] leading-[1.02] font-extrabold tracking-tight text-balance sm:text-7xl lg:text-[5.5rem]">
					{site.hero.headline.map((line, i) => (
						<span key={line} className="rise block" style={{ ['--d' as string]: `${300 + i * 140}ms` }}>
							{i === 1 ? <span className="text-accent">{line}</span> : line}
						</span>
					))}
				</h1>
				<p className="rise mt-7 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl" style={{ ['--d' as string]: '650ms' }}>
					{site.hero.body}
				</p>
				<div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ ['--d' as string]: '800ms' }}>
					<ButtonLink href="#estimate">{site.cta.estimate}</ButtonLink>
					<ButtonLink href="#services" variant="ghost">{site.cta.services}</ButtonLink>
				</div>
				<ul className="rise mt-14 grid max-w-3xl gap-x-10 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-3" style={{ ['--d' as string]: '950ms' }}>
					{site.hero.trust.map((t) => (
						<li key={t.label}>
							<p className="font-display text-base font-bold">{t.label}</p>
							<p className="mt-0.5 text-sm text-white/60">{t.detail}</p>
						</li>
					))}
				</ul>
			</div>

			<a href="#services" aria-label="Scroll to services" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-white/60 uppercase sm:flex">
				Scroll
				<span className="scroll-cue relative block h-10 w-px overflow-hidden bg-white/20" aria-hidden />
				<ChevronDown className="sr-only" />
			</a>
		</section>
	)
}
