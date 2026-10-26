import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { site } from '#/config/site'

export const Route = createFileRoute('/checkout/return')({
	validateSearch: (s: Record<string, unknown>) => ({
		status: typeof s.status === 'string' ? s.status : undefined,
		payment: typeof s.payment === 'string' ? s.payment : undefined,
		setup: typeof s.setup === 'string' ? s.setup : undefined,
		plan: typeof s.plan === 'string' ? s.plan : undefined,
	}),
	head: () => ({ meta: [{ title: `Checkout result | ${site.name}` }] }),
	component: Return,
})

/* Display only. The URL is not proof of payment; Whop's receipt email and the dashboard are. */
function Return() {
	const { status, payment, setup } = Route.useSearch()
	const ref = payment ?? setup
	const face =
		status === 'succeeded'
			? { Icon: CheckCircle2, color: 'text-emerald-600', title: setup ? 'Card saved' : 'Thank you', text: `Whop reports the ${setup ? 'saved card' : 'payment'} succeeded${ref ? ` (${ref})` : ''}. Your receipt arrives by email.` }
			: status === 'failed' || status === 'canceled'
				? { Icon: XCircle, color: 'text-red-600', title: 'Not completed', text: 'You were not charged. You can go back and try again with another payment method.' }
				: { Icon: Clock, color: 'text-accent', title: 'Confirming…', text: 'Your payment is still processing. We will confirm by email as soon as Whop does.' }
	return (
		<main className="mx-auto grid min-h-screen max-w-xl place-items-center px-5 text-center">
			<div role="status">
				<face.Icon className={`mx-auto size-14 ${face.color}`} aria-hidden />
				<h1 className="mt-5 font-display text-4xl font-extrabold">{face.title}</h1>
				<p className="mt-3 text-muted">{face.text}</p>
				<Link to="/" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-navy px-8 font-semibold text-white">Back to {site.shortName}</Link>
			</div>
		</main>
	)
}
