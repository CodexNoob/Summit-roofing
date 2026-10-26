import { site } from '#/config/site'
import { container, Eyebrow } from '#/components/ui'
import { Reveal, useInView } from '#/components/Reveal'

export function Process() {
	const { ref, inView } = useInView<HTMLOListElement>(0.25)
	return (
		<section id="process" className="texture relative bg-navy py-24 text-white sm:py-32">
			<div className={container}>
				<Reveal className="max-w-2xl">
					<Eyebrow dark>How it works</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">Five steps, no surprises.</h2>
					<p className="mt-5 text-lg text-white/70">Each step happens only when you and your contractor agree it is ready. Nothing is inspected, approved or completed until it actually is.</p>
				</Reveal>

				<ol ref={ref} className="relative mt-16 grid gap-10 lg:grid-cols-5 lg:gap-6">
					<span className={`timeline-line ${inView ? 'is-in' : ''} absolute top-6 right-[10%] left-[10%] hidden h-px bg-accent/60 lg:block`} aria-hidden />
					<span className={`timeline-line-v ${inView ? 'is-in' : ''} absolute top-6 bottom-6 left-6 w-px bg-accent/60 lg:hidden`} aria-hidden />
					{site.process.map((p, i) => (
						<li key={p.title} className="reveal relative flex gap-5 lg:flex-col lg:gap-6" style={{ ['--d' as string]: `${i * 120}ms` }} data-in={inView}>
							<span className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full border font-display text-lg font-extrabold transition-colors duration-700 ${inView ? 'border-accent bg-accent text-navy' : 'border-white/30 bg-navy text-white'}`} style={{ transitionDelay: `${i * 220}ms` }}>
								{i + 1}
							</span>
							<div>
								<h3 className="font-display text-xl font-bold">{p.title}</h3>
								<p className="mt-2 text-white/70">{p.body}</p>
							</div>
						</li>
					))}
				</ol>
			</div>
			<ProcessReveal ready={inView} />
		</section>
	)
}

/* Makes the timeline items visible together with the line, without an observer per item. */
function ProcessReveal({ ready }: { ready: boolean }) {
	return <style>{ready ? '#process .reveal{opacity:1;transform:none}' : ''}</style>
}
