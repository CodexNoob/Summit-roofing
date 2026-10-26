import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

/** Scroll-triggered entrance. Content is visible without JS thanks to SSR + reduced-motion CSS. */
export function useInView<T extends Element>(threshold = 0.2) {
	const ref = useRef<T | null>(null)
	const [inView, setInView] = useState(false)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		document.documentElement.classList.add('reveal-ready')
		// Automated browsers (screenshots, audits) and ?static previews never scroll, so show everything.
		const automated = navigator.webdriver || /[?&]static\b/.test(location.search)
		if (automated || typeof IntersectionObserver === 'undefined') {
			setInView(true)
			return
		}
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					setInView(true)
					io.disconnect()
				}
			},
			{ threshold },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [threshold])
	return { ref, inView }
}

export function Reveal({
	children,
	delay = 0,
	as: Tag = 'div',
	className = '',
}: {
	children: ReactNode
	delay?: number
	as?: ElementType
	className?: string
}) {
	const { ref, inView } = useInView<HTMLElement>(0.12)
	return (
		<Tag ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`} style={{ ['--d' as string]: `${delay}ms` }}>
			{children}
		</Tag>
	)
}
