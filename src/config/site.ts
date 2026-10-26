/**
 * Central configuration for the roofing template.
 * To reuse this site for another contractor, edit this file (and public/images).
 * Everything marked `demo: true` is sample content that must be replaced
 * with verified business information before launch.
 */

export const site = {
	// ───────── Identity ─────────
	name: 'Summit Roofing Co.',
	shortName: 'Summit',
	tagline: 'Roofing done right',
	logoMark: 'S',
	// Whop business that owns leads, products, plans and invoices.
	whopAccountId: 'biz_Pl75WMFvIaUbE9',
	url: 'https://usroofing.app',
	demoNotice:
		'Demo website. Business details, reviews, service areas and statistics are sample content until replaced by the contractor.',

	// ───────── Brand (mirrored in src/styles.css @theme) ─────────
	colors: {
		navy: '#101B2B',
		slate: '#1D2A3A',
		orange: '#F97316',
		warm: '#FAFAF8',
		gray: '#F1F3F5',
		muted: '#64748B',
	},
	fonts: { display: 'Manrope', body: 'Inter' },

	// ───────── Contact (demo values) ─────────
	contact: {
		demo: true,
		phone: '(555) 010-0199',
		phoneHref: 'tel:+15550100199',
		email: 'hello@summitroofing.example',
		hours: [
			{ days: 'Monday to Friday', time: '7:00 AM to 6:00 PM' },
			{ days: 'Saturday', time: '8:00 AM to 2:00 PM' },
			{ days: 'Sunday', time: 'Closed' },
		],
		address: '100 Example Ridge Road, Sample City, ST 00000',
	},

	// ───────── Whop products and plans (real IDs) ─────────
	whop: {
		setupCheckoutConfigId: 'ch_aOwxU98WroQcxTy',
		leadProductId: 'prod_RhnWBUlnCkgjV',
		finalBalanceProductId: 'prod_01eh8DYYWlYyf',
	},
	plans: {
		inspection: {
			key: 'inspection',
			planId: 'plan_JU4Klq1cdMMfN',
			productId: 'prod_RhnWBUlnCkgjV',
			name: 'Roof Inspection',
			price: 149,
			priceLabel: '$149',
			cadence: 'one-time',
			cta: 'Book an Inspection',
			description:
				'A sample inspection with a defined scope: visible shingles, flashing, vents, gutters and signs of moisture, followed by a written summary of what we found.',
			includes: [
				'Walk-through of the full roof surface',
				'Check of flashing, vents and gutters',
				'Written summary of findings',
				'Repair or replacement guidance, no obligation',
			],
			note: 'Inspection findings are the basis for any repair or replacement estimate.',
		},
		deposit: {
			key: 'deposit',
			planId: 'plan_RQhqynggO2J8C',
			productId: 'prod_CWu0iw1Psmetz',
			name: 'Project Deposit',
			price: 500,
			priceLabel: '$500',
			cadence: 'one-time',
			cta: 'Pay Project Deposit',
			description:
				'A deposit for a roofing project you have already approved. The final project price is set by your approved estimate and contract, and the deposit is credited against it.',
			includes: [
				'Only for an approved estimate',
				'Credited toward your final balance',
				'Final balance invoiced after the work',
				'Optional: authorize a saved card for that final invoice',
			],
			note: 'Pay the deposit only after you have accepted your written estimate.',
		},
		repair: {
			key: 'repair',
			planId: 'plan_RYYGgkevPa7Ck',
			productId: 'prod_IOjO8EYP964wj',
			name: 'Minor Roof Repair',
			price: 299,
			priceLabel: '$299',
			cadence: 'one-time flat rate',
			cta: 'Book Minor Repair',
			description:
				'A limited sample repair package for a small area of damaged shingles or sealant, at a flat rate with a clearly defined scope.',
			includes: [
				'Small, localized shingle or sealant repair',
				'Materials for the defined scope',
				'Clean-up of the work area',
				'Photos of the completed repair',
			],
			note: 'Additional work requires a separate estimate and your approval before it starts.',
		},
	},

	// ───────── Navigation ─────────
	nav: [
		{ label: 'Home', href: '#top', id: 'top' },
		{ label: 'Services', href: '#services', id: 'services' },
		{ label: 'Our Process', href: '#process', id: 'process' },
		{ label: 'Pricing', href: '#pricing', id: 'pricing' },
		{ label: 'Financing', href: '#financing', id: 'financing' },
		{ label: 'Reviews', href: '#reviews', id: 'reviews' },
		{ label: 'Contact', href: '#contact', id: 'contact' },
	],
	cta: { estimate: 'Get a Free Estimate', services: 'Explore Our Services' },

	// ───────── Hero ─────────
	hero: {
		eyebrow: 'Roofing done right',
		headline: ['A Stronger Roof.', 'A Safer Home.'],
		body: 'From dependable repairs to complete roof replacements, we help protect your home with quality craftsmanship, transparent pricing, and a straightforward process.',
		image: '/images/hero.png',
		// Only verifiable facts. Sample statistics are labeled as demo.
		trust: [
			{ label: 'Free estimates', detail: 'No-obligation estimate request' },
			{ label: 'Transparent pricing', detail: 'Flat rates published below' },
			{ label: 'Online payments', detail: 'Deposit and invoice via Whop' },
		],
	},

	// ───────── Trust indicators (replace with verified credentials) ─────────
	credentials: {
		demo: true,
		items: [
			{ label: 'License number', value: '[confirm: state license #]' },
			{ label: 'Insurance', value: '[confirm: liability and workers comp]' },
			{ label: 'Workmanship warranty', value: '[confirm: warranty terms]' },
			{ label: 'Manufacturer certification', value: '[confirm: shingle manufacturer program]' },
		],
	},

	// ───────── Services ─────────
	services: [
		{
			id: 'roof-repair',
			name: 'Roof Repair',
			image: '/images/repair.png',
			alt: 'Roofer repairing asphalt shingles on a residential roof',
			summary:
				'Leaks, lifted or missing shingles, storm damage and worn flashing, diagnosed and fixed before small problems become expensive ones.',
			benefits: ['Leak and storm damage diagnosis', 'Shingle, flashing and sealant repair', 'Clear scope before work begins'],
			pricing:
				'Pricing guidance: repair cost depends on the scope of work. Our $299 flat-rate package covers a small, defined repair; larger repairs are quoted after inspection.',
			cta: 'Request a Repair Estimate',
			action: 'estimate',
			serviceValue: 'Roof repair',
		},
		{
			id: 'roof-replacement',
			name: 'Roof Replacement',
			image: '/images/replacement.png',
			alt: 'Aerial view of a home with a newly replaced slate-gray shingle roof',
			summary:
				'A complete tear-off and re-roof with material upgrades for homeowners who want a dependable, long-term roofing solution.',
			benefits: ['Full tear-off and decking check', 'Material and color options', 'Documented progress from start to finish'],
			pricing:
				'Pricing depends on the project: roof size, pitch, materials and decking condition. You receive a written estimate before you commit to anything.',
			cta: 'Request a Replacement Estimate',
			action: 'estimate',
			serviceValue: 'Roof replacement',
		},
		{
			id: 'roof-inspection',
			name: 'Roof Inspection',
			image: '/images/inspection.png',
			alt: 'Inspector checking flashing and shingles on a pitched roof',
			summary:
				'A sample inspection of your roof surface, flashing, vents and gutters with a written summary of the condition and recommended next steps.',
			benefits: ['$149 one-time, defined scope', 'Written summary of findings', 'Useful before buying, selling or after a storm'],
			pricing: '$149 one-time. Book it online and pay securely through Whop checkout.',
			cta: 'Book an Inspection',
			action: 'inspection',
			serviceValue: 'Roof inspection',
		},
	],

	// ───────── Process ─────────
	process: [
		{ title: 'Request an Estimate', body: 'Tell us about your roofing needs.' },
		{ title: 'Schedule an Inspection', body: 'Review the roof condition and project scope.' },
		{ title: 'Approve Your Project', body: 'Confirm the agreed scope, price, and deposit terms.' },
		{ title: 'Complete the Roofing Work', body: 'Perform the agreed work and document the project.' },
		{ title: 'Pay the Final Balance', body: 'Receive and pay the final invoice.' },
	],

	// ───────── Financing ─────────
	financing: {
		headline: 'A Better Roof. More Flexible Ways to Pay.',
		body: 'Explore available payment options during checkout. Eligible financing or installment options may be presented when supported and enabled for your merchant account.',
		image: '/images/financing.png',
		disclosures: [
			'Available options depend on merchant eligibility, configuration, customer eligibility and checkout availability.',
			'Financing approval is never guaranteed and is decided by the provider, not by Summit Roofing Co.',
			'No financing provider is confirmed for this demo site. Only options shown in the secure checkout are available.',
		],
		cta: 'See Options at Checkout',
	},

	// ───────── Why choose ─────────
	why: {
		headline: 'Craftsmanship you can see from the street',
		body: 'A roof is the part of the house you only think about when something goes wrong. We build ours to be forgotten, with careful prep, clean lines and documented work.',
		image: '/images/craftsmanship.png',
		points: [
			{ title: 'Written scope before work', body: 'You approve the scope, price and deposit terms in writing before anything starts.' },
			{ title: 'Documented progress', body: 'Photos of the work as it is completed, so you can see what is under the shingles.' },
			{ title: 'Straightforward payments', body: 'Pay the deposit online, then receive one clear final invoice.' },
			{ title: 'Clean job sites', body: 'Debris is handled daily and the property is left tidy.' },
		],
	},

	// ───────── Testimonials (SAMPLE ONLY) ─────────
	testimonials: {
		demo: true,
		items: [
			{ quote: 'The estimate was clear and the crew kept me updated at each step.', name: 'Sample Customer A', place: 'Sample City, ST' },
			{ quote: 'I liked knowing the price and the deposit terms before anything started.', name: 'Sample Customer B', place: 'Example Town, ST' },
			{ quote: 'Paying the final invoice online took a minute. Easy.', name: 'Sample Customer C', place: 'Demo Heights, ST' },
		],
	},

	// ───────── Service areas (SAMPLE ONLY) ─────────
	serviceAreas: {
		demo: true,
		regions: [
			{ state: 'Texas', cities: ['Austin', 'Round Rock', 'Cedar Park', 'San Marcos'] },
			{ state: 'Colorado', cities: ['Denver', 'Aurora', 'Lakewood', 'Boulder'] },
			{ state: 'North Carolina', cities: ['Charlotte', 'Raleigh', 'Durham', 'Cary'] },
			{ state: 'Ohio', cities: ['Columbus', 'Dublin', 'Westerville', 'Powell'] },
		],
	},

	// ───────── Estimate form ─────────
	estimate: {
		serviceOptions: ['Roof repair', 'Roof replacement', 'Roof inspection', 'Not sure yet'],
		contactMethods: ['Phone call', 'Text message', 'Email'],
	},

	// ───────── FAQ ─────────
	faq: [
		{ q: 'How do I request a roofing estimate?', a: 'Fill in the estimate form on this page. Submitting it creates a lead in our system and we follow up using your preferred contact method.' },
		{ q: 'How much does a roof inspection cost?', a: 'The sample inspection is $149 one-time. You can book and pay for it online through secure Whop checkout.' },
		{ q: 'What does the project deposit cover?', a: 'The $500 deposit is for a project you have already approved. It is credited against your final balance. The final project price comes from your approved estimate and contract.' },
		{ q: 'How is the final balance calculated?', a: 'Final balance = approved total project price, minus the deposit already paid, minus any other recorded payments. You receive one final invoice for that amount.' },
		{ q: 'What happens if additional repairs are needed?', a: 'Anything beyond the agreed scope needs a separate estimate and your approval before work starts. The $299 flat-rate repair covers only its defined scope.' },
		{ q: 'Can I pay my invoice online?', a: 'Yes. Final invoices are issued through Whop and can be paid online. If you authorized a saved card when paying your deposit, we may charge that card only for the final invoice you approved.' },
		{ q: 'Are financing options available?', a: 'Eligible financing or installment options may appear at checkout when they are enabled for the merchant and you are eligible. Approval is never guaranteed.' },
		{ q: 'Which locations do you serve?', a: 'The service areas on this demo site are sample locations. A real contractor replaces them with confirmed coverage.' },
	],

	// ───────── Footer / legal ─────────
	legal: {
		privacyHref: '/legal/privacy',
		termsHref: '/legal/terms',
		disclosure:
			'Summit Roofing Co. is a fictional demonstration business. Prices, reviews, credentials and locations are sample content. Payments are processed by Whop.',
	},
}

export type PlanKey = keyof typeof site.plans
export type Plan = (typeof site.plans)[PlanKey]
