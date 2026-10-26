import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { site } from '#/config/site'
import { ButtonLink, container, DemoTag, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'

export function Contact() {
	const c = site.contact
	return (
		<section id="contact" className="bg-paper py-24 sm:py-32">
			<div className={container}>
				<Reveal className="max-w-2xl">
					<Eyebrow>Contact</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">Talk to a roofer.</h2>
					<p className="mt-5 text-muted">
						<DemoTag>Demo contact details</DemoTag>
						<span className="mt-2 block">These details are placeholders until replaced with the real business information.</span>
					</p>
				</Reveal>
				<div className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
					<Reveal className="bg-paper p-7">
						<Phone className="size-6 text-accent" aria-hidden />
						<h3 className="mt-4 font-display font-bold">Phone</h3>
						<a href={c.phoneHref} className="mt-1 block text-lg text-muted hover:text-ink">{c.phone}</a>
					</Reveal>
					<Reveal delay={80} className="bg-paper p-7">
						<Mail className="size-6 text-accent" aria-hidden />
						<h3 className="mt-4 font-display font-bold">Email</h3>
						<a href={`mailto:${c.email}`} className="mt-1 block break-all text-muted hover:text-ink">{c.email}</a>
					</Reveal>
					<Reveal delay={160} className="bg-paper p-7">
						<Clock className="size-6 text-accent" aria-hidden />
						<h3 className="mt-4 font-display font-bold">Business hours</h3>
						<dl className="mt-1 space-y-1 text-sm text-muted">
							{c.hours.map((h) => (
								<div key={h.days} className="flex justify-between gap-4"><dt>{h.days}</dt><dd>{h.time}</dd></div>
							))}
						</dl>
					</Reveal>
					<Reveal delay={240} className="bg-paper p-7">
						<MapPin className="size-6 text-accent" aria-hidden />
						<h3 className="mt-4 font-display font-bold">Service area</h3>
						<p className="mt-1 text-sm text-muted">{site.serviceAreas.regions.map((r) => r.state).join(', ')} (sample areas)</p>
					</Reveal>
				</div>
				<Reveal className="mt-10">
					<ButtonLink href="#estimate" variant="dark">{site.cta.estimate}</ButtonLink>
				</Reveal>
			</div>
		</section>
	)
}
