import { Info } from 'lucide-react'
import { site } from '#/config/site'
import { Button, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'
import { useCheckout } from '#/components/CheckoutProvider'

export function Financing() {
	const { openCheckout } = useCheckout()
	const f = site.financing
	return (
		<section id="financing" className="bg-paper">
			<div className="grid lg:grid-cols-2">
				<div className="img-zoom relative min-h-[22rem] overflow-hidden lg:min-h-[40rem]">
					<img src={f.image} alt="A craftsman-style home with a new roof in soft morning light" loading="lazy" className="absolute inset-0 size-full object-cover" />
				</div>
				<div className="flex items-center px-5 py-20 sm:px-12 lg:px-16 xl:px-24">
					<Reveal className="max-w-xl">
						<Eyebrow>Financing information</Eyebrow>
						<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">{f.headline}</h2>
						<p className="mt-6 text-lg leading-relaxed text-muted">{f.body}</p>
						<ul className="mt-8 space-y-3 rounded-card border border-line bg-card p-5 text-sm text-muted">
							{f.disclosures.map((d) => (
								<li key={d} className="flex gap-3">
									<Info className="mt-0.5 size-4 shrink-0 text-accent-deep" aria-hidden />
									{d}
								</li>
							))}
						</ul>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button onClick={() => openCheckout('inspection')}>{f.cta}</Button>
							<a href="#estimate" className="inline-flex min-h-12 items-center justify-center rounded-full px-5 font-semibold underline decoration-line underline-offset-4 hover:decoration-ink">
								Or request an estimate first
							</a>
						</div>
					</Reveal>
				</div>
			</div>
		</section>
	)
}
