declare global {
	interface Window {
		whop?: { track: (event: string, props?: Record<string, unknown>) => void }
	}
}

/** Event IDs already sent in this page load. Whop also dedupes on (name, event_id). */
const sent = new Set<string>()

/**
 * Fires a custom Whop pixel event at most once per (event, eventId) pair.
 * Properties must be non-sensitive. Never pass personal or payment data.
 */
export function track(event: string, eventId: string, props: Record<string, string | number> = {}) {
	if (typeof window === 'undefined') return false
	const key = `${event}:${eventId}`
	if (sent.has(key)) return false
	sent.add(key)
	if (!window.whop?.track) {
		// The pixel is injected by Whop hosting; it can be absent in the sandbox preview.
		if (import.meta.env.DEV) console.info('[track] pixel not present, skipped', event, props)
		return false
	}
	window.whop.track(event, { ...props, event_id: eventId })
	if (import.meta.env.DEV) console.info('[track] fired', event, { ...props, event_id: eventId })
	return true
}
