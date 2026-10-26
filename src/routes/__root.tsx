import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ name: 'color-scheme', content: 'light' },
			{ name: 'theme-color', content: '#101B2B' },
			{ title: 'Summit Roofing Co. | A Stronger Roof. A Safer Home.' },
			{ name: 'description', content: 'Roof repair, replacement and inspection with transparent pricing, online deposits and simple final invoices. Demo roofing website built on Whop.' },
			{ property: 'og:title', content: 'Summit Roofing Co. | A Stronger Roof. A Safer Home.' },
			{ property: 'og:description', content: 'Quality craftsmanship, transparent pricing, and a straightforward process.' },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:image', content: 'https://usroofing.app/images/hero.png' },
			{ name: 'twitter:card', content: 'summary_large_image' },
		],
		links: [
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
			{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@500;600;700;800&display=swap' },
			{ rel: 'stylesheet', href: appCss },
		],
	}),
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<a href="#services" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:font-semibold focus:text-navy">
					Skip to content
				</a>
				{children}
				<Scripts />
			</body>
		</html>
	)
}
