import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { site } from '#/config/site'

const docs = {
	privacy: {
		title: 'Privacy policy',
		body: [
			`This is a sample privacy policy for the ${site.name} demonstration site. Replace it with the contractor's own policy before launch.`,
			'Estimate requests: the details you submit (name, email, phone, property address, project description and contact preference) are saved as a lead in the business account on Whop so the contractor can respond.',
			'Payments: card and wallet details are entered into Whop secure checkout and never touch this website. Payments are processed by Whop under its buyer terms and privacy policy.',
			'Analytics: this site uses the Whop pixel for page views, checkout views and a few custom events. Events never include payment details.',
		],
	},
	terms: {
		title: 'Terms',
		body: [
			`These are sample terms for the ${site.name} demonstration site. Replace them with the contractor's real terms and contract language.`,
			'Prices shown are sample prices. A roof inspection, minor repair and project deposit are sold as fixed-price items. Repairs or replacements beyond the defined scope require a written estimate and your approval.',
			'The project deposit is credited toward the final balance. The final balance equals the approved project total minus the deposit and any other recorded payments.',
			'Saving a card for a final invoice is optional and requires your explicit authorization. A saved card is charged only for the final invoice you were issued.',
		],
	},
} as const

export const Route = createFileRoute('/legal/$doc')({
	loader: ({ params }) => {
		const d = docs[params.doc as keyof typeof docs]
		if (!d) throw notFound()
		return d
	},
	head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? 'Legal'} | ${site.name}` }] }),
	component: Legal,
})

function Legal() {
	const d = Route.useLoaderData()
	return (
		<main className="mx-auto max-w-2xl px-5 py-20">
			<Link to="/" className="text-sm font-semibold text-accent-deep underline underline-offset-4">← Back to {site.name}</Link>
			<h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">{d.title}</h1>
			<div className="mt-6 space-y-4 leading-relaxed text-muted">
				{d.body.map((p) => <p key={p}>{p}</p>)}
			</div>
		</main>
	)
}
