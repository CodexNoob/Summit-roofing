import { site } from '#/config/site'
import { container } from '#/components/ui'
import { Logo } from '#/components/Navigation'

export function Footer() {
	return (
		<footer className="bg-navy text-white">
			<div className={`${container} grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]`}>
				<div>
					<Logo />
					<p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">{site.legal.disclosure}</p>
				</div>
				<nav aria-label="Footer">
					<h2 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Explore</h2>
					<ul className="mt-4 space-y-1">
						{site.nav.map((n) => (
							<li key={n.id}><a href={n.href} className="inline-flex min-h-9 items-center text-white/80 hover:text-white">{n.label}</a></li>
						))}
					</ul>
				</nav>
				<div>
					<h2 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Contact (demo)</h2>
					<ul className="mt-4 space-y-2 text-white/80">
						<li><a href={site.contact.phoneHref} className="hover:text-white">{site.contact.phone}</a></li>
						<li><a href={`mailto:${site.contact.email}`} className="break-all hover:text-white">{site.contact.email}</a></li>
						<li className="text-sm text-white/60">{site.contact.address}</li>
					</ul>
				</div>
			</div>
			<div className="border-t border-white/10">
				<div className={`${container} flex flex-col gap-3 py-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between`}>
					<p>© {new Date().getFullYear()} {site.name} Demonstration site.</p>
					<ul className="flex gap-6">
						<li><a href={site.legal.privacyHref} className="hover:text-white">Privacy policy</a></li>
						<li><a href={site.legal.termsHref} className="hover:text-white">Terms</a></li>
						<li><a href="/admin" className="hover:text-white">Operator console</a></li>
					</ul>
				</div>
			</div>
		</footer>
	)
}
