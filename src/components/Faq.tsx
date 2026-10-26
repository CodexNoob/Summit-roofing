import { useId, useState } from 'react'
import { Plus } from 'lucide-react'
import { site } from '#/config/site'
import { Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'

export function Faq() {
	const [open, setOpen] = useState<number | null>(0)
	const uid = useId()
	return (
		<section id="faq" className="bg-paper py-24 sm:py-32">
			<div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.7fr]">
				<Reveal>
					<Eyebrow>FAQ</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">Questions, answered.</h2>
				</Reveal>
				<div className="divide-y divide-line border-y border-line">
					{site.faq.map((item, i) => {
						const isOpen = open === i
						return (
							<div key={item.q}>
								<h3>
									<button
										id={`${uid}-b${i}`}
										aria-expanded={isOpen}
										aria-controls={`${uid}-p${i}`}
										onClick={() => setOpen(isOpen ? null : i)}
										className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left font-display text-lg font-bold"
									>
										{item.q}
										<Plus className={`size-5 shrink-0 text-accent transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} aria-hidden />
									</button>
								</h3>
								<div id={`${uid}-p${i}`} role="region" aria-labelledby={`${uid}-b${i}`} data-open={isOpen} className="faq-panel">
									<div>
										<p className="max-w-2xl pb-6 leading-relaxed text-muted">{item.a}</p>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
