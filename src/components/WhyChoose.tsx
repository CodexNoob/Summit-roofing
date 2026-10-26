import { site } from '#/config/site'
import { container, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'

export function WhyChoose() {
	const w = site.why
	return (
		<section id="why" className="relative isolate overflow-hidden bg-navy py-24 text-white sm:py-32">
			<img src={w.image} alt="Close-up of neatly installed shingles and flashing around a chimney" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover" />
			<div className="absolute inset-0 -z-10 bg-navy/80" />
			<div className={container}>
				<Reveal className="max-w-2xl">
					<Eyebrow dark>Why choose {site.shortName}</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">{w.headline}</h2>
					<p className="mt-5 text-lg text-white/75">{w.body}</p>
				</Reveal>
				<dl className="mt-14 grid gap-px overflow-hidden rounded-card bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
					{w.points.map((p, i) => (
						<Reveal key={p.title} delay={i * 90} className="bg-navy/90 p-7">
							<dt className="font-display text-lg font-bold">
								<span className="mb-4 block font-display text-sm text-accent tabular-nums">0{i + 1}</span>
								{p.title}
							</dt>
							<dd className="mt-2 text-[15px] leading-relaxed text-white/70">{p.body}</dd>
						</Reveal>
					))}
				</dl>
			</div>
		</section>
	)
}
