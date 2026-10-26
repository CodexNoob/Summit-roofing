import { BadgeCheck } from 'lucide-react'
import { site } from '#/config/site'
import { container, DemoTag } from '#/components/ui'
import { Reveal } from '#/components/Reveal'

export function Trust() {
	return (
		<section aria-labelledby="trust-title" className="border-b border-line bg-paper">
			<div className={`${container} grid gap-8 py-12 lg:grid-cols-[0.8fr_2fr] lg:items-center`}>
				<Reveal>
					<h2 id="trust-title" className="font-display text-xl font-extrabold tracking-tight">
						Credentials, stated plainly
					</h2>
					<p className="mt-2 text-sm text-muted">
						Placeholders until the contractor supplies verified details. <DemoTag />
					</p>
				</Reveal>
				<ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
					{site.credentials.items.map((c, i) => (
						<Reveal as="li" key={c.label} delay={i * 70} className="bg-paper p-5">
							<BadgeCheck className="size-5 text-accent" aria-hidden />
							<p className="mt-3 text-xs font-bold tracking-wider text-muted uppercase">{c.label}</p>
							<p className="mt-1 text-sm font-medium">{c.value}</p>
						</Reveal>
					))}
				</ul>
			</div>
		</section>
	)
}
