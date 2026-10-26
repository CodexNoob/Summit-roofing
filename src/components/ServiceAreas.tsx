import { MapPin } from 'lucide-react'
import { site } from '#/config/site'
import { container, DemoTag, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'

export function ServiceAreas() {
	return (
		<section id="areas" className="bg-card py-24 sm:py-32">
			<div className={`${container} grid gap-14 lg:grid-cols-[1fr_1.6fr]`}>
				<Reveal>
					<Eyebrow>Service areas</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">Where we work.</h2>
					<p className="mt-5 text-muted">
						<DemoTag>Sample locations</DemoTag>
						<span className="mt-3 block">These cities are sample service areas for the demonstration. A real contractor replaces them with confirmed coverage, and we never claim coverage we have not confirmed.</span>
					</p>
				</Reveal>
				<div className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
					{site.serviceAreas.regions.map((r, i) => (
						<Reveal key={r.state} delay={i * 80} className="bg-paper p-7">
							<h3 className="flex items-center gap-2 font-display text-lg font-extrabold">
								<MapPin className="size-5 text-accent" aria-hidden /> {r.state}
							</h3>
							<ul className="mt-4 grid grid-cols-2 gap-y-2 text-[15px] text-muted">
								{r.cities.map((c) => (
									<li key={c}>{c}</li>
								))}
							</ul>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	)
}
