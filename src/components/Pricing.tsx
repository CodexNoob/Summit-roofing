import { Check } from 'lucide-react'
import { site, type PlanKey } from '#/config/site'
import { Button, container, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'
import { useCheckout } from '#/components/CheckoutProvider'

const order: PlanKey[] = ['inspection', 'repair', 'deposit']

export function Pricing() {
	const { openCheckout } = useCheckout()
	return (
		<section id="pricing" className="bg-card py-24 sm:py-32">
			<div className={container}>
				<Reveal className="max-w-2xl">
					<Eyebrow>Pricing and booking</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">Clear prices, secure checkout.</h2>
					<p className="mt-5 text-lg text-muted">Three fixed-price items you can book online today. Full repairs and replacements are priced from a written estimate.</p>
				</Reveal>

				<div className="mt-14 grid gap-6 lg:grid-cols-3">
					{order.map((key, i) => {
						const p = site.plans[key]
						const featured = key === 'inspection'
						return (
							<Reveal key={key} delay={i * 100} className={`flex flex-col rounded-card border p-8 ${featured ? 'border-navy bg-navy text-white' : 'border-line bg-paper'}`}>
								<div className="flex items-center justify-between">
									<h3 className="font-display text-xl font-extrabold">{p.name}</h3>
									{featured && <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-navy">Start here</span>}
								</div>
								<p className="mt-6 flex items-baseline gap-2">
									<span className="font-display text-6xl font-extrabold tracking-tight">{p.priceLabel}</span>
									<span className={`text-sm ${featured ? 'text-white/60' : 'text-muted'}`}>{p.cadence}</span>
								</p>
								<p className={`mt-5 leading-relaxed ${featured ? 'text-white/75' : 'text-muted'}`}>{p.description}</p>
								<ul className="mt-6 flex-1 space-y-3 text-[15px]">
									{p.includes.map((x) => (
										<li key={x} className="flex gap-3">
											<Check className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
											{x}
										</li>
									))}
								</ul>
								<p className={`mt-6 border-t pt-5 text-sm ${featured ? 'border-white/15 text-white/60' : 'border-line text-muted'}`}>{p.note}</p>
								<div className="mt-6 [&>button]:w-full">
									<Button onClick={() => openCheckout(key)} variant={featured ? 'primary' : 'dark'}>
										{p.cta}
									</Button>
								</div>
							</Reveal>
						)
					})}
				</div>
				<p className="mt-8 text-sm text-muted">Sample prices for this demonstration. Taxes may be added at checkout depending on your location. Payments are processed securely by Whop.</p>
			</div>
		</section>
	)
}
