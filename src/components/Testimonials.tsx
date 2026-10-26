import { site } from '#/config/site'
import { container, DemoTag, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'

export function Testimonials() {
	return (
		<section id="reviews" className="bg-paper py-24 sm:py-32">
			<div className={container}>
				<Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
					<div className="max-w-2xl">
						<Eyebrow>Reviews</Eyebrow>
						<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">What homeowners say.</h2>
					</div>
					<p className="max-w-xs text-sm text-muted">
						<DemoTag>Sample testimonials</DemoTag>
						<span className="mt-2 block">These are demonstration quotes, not real customer reviews. Replace them in the site configuration.</span>
					</p>
				</Reveal>
				<div className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-3">
					{site.testimonials.items.map((t, i) => (
						<Reveal as="figure" key={t.name} delay={i * 100} className="flex flex-col justify-between bg-paper p-8 sm:p-10">
							<span className="font-display text-6xl leading-none font-extrabold text-accent" aria-hidden>“</span>
							<blockquote className="mt-2 font-display text-xl leading-snug font-semibold text-balance">{t.quote}</blockquote>
							<figcaption className="mt-8 text-sm">
								<span className="font-semibold">{t.name}</span>
								<span className="block text-muted">{t.place}</span>
							</figcaption>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}
