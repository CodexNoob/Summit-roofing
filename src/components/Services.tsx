import { useEffect, useRef } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { site } from '#/config/site'
import { container, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'
import { useCheckout } from '#/components/CheckoutProvider'
import { track } from '#/lib/track'

function ServicePanel({ s, index }: { s: (typeof site.services)[number]; index: number }) {
	const ref = useRef<HTMLElement>(null)
	const { openCheckout } = useCheckout()

	// service_viewed: once per service, when at least 60% of the panel is on screen.
	useEffect(() => {
		const el = ref.current
		if (!el || typeof IntersectionObserver === 'undefined') return
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					track('service_viewed', `service_${s.id}`, { service_id: s.id, service_name: s.name })
					io.disconnect()
				}
			},
			{ threshold: 0.6 },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [s.id, s.name])

	const flip = index % 2 === 1
	const cta =
		s.action === 'inspection' ? (
			<button onClick={() => openCheckout('inspection')} className="arrow-nudge inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-7 font-semibold text-navy transition hover:bg-[#fb8a3c]">
				{s.cta} <ArrowRight className="size-4" aria-hidden />
			</button>
		) : (
			<a href="#estimate" onClick={() => sessionStorage.setItem('summit_service', s.serviceValue)} className="arrow-nudge inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-7 font-semibold text-white transition hover:bg-slate">
				{s.cta} <ArrowRight className="size-4" aria-hidden />
			</a>
		)

	return (
		<article ref={ref} className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-0">
			<Reveal className={`img-zoom relative overflow-hidden rounded-card lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
				<img src={s.image} alt={s.alt} loading="lazy" className="aspect-[4/3] size-full object-cover lg:aspect-auto lg:min-h-[30rem]" />
				<div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-transparent to-transparent" />
				<span className="absolute bottom-5 left-5 font-display text-6xl font-extrabold text-white/90 tabular-nums">0{index + 1}</span>
			</Reveal>
			<Reveal delay={120} className={`flex flex-col justify-center lg:col-span-5 ${flip ? 'lg:pr-14' : 'lg:pl-14'}`}>
				<h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{s.name}</h3>
				<p className="mt-4 text-lg leading-relaxed text-muted">{s.summary}</p>
				<ul className="mt-6 space-y-3">
					{s.benefits.map((b) => (
						<li key={b} className="flex gap-3">
							<Check className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
							{b}
						</li>
					))}
				</ul>
				<p className="mt-6 border-l-2 border-accent pl-4 text-sm leading-relaxed text-muted">{s.pricing}</p>
				<div className="mt-8">{cta}</div>
			</Reveal>
		</article>
	)
}

export function Services() {
	return (
		<section id="services" className="bg-paper py-24 sm:py-32">
			<div className={container}>
				<Reveal className="max-w-2xl">
					<Eyebrow>Roofing services</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">Three ways we protect your home.</h2>
				</Reveal>
				<div className="mt-16 space-y-20 sm:space-y-28">
					{site.services.map((s, i) => (
						<ServicePanel key={s.id} s={s} index={i} />
					))}
				</div>
			</div>
		</section>
	)
}
