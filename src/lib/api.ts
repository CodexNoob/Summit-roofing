import { createServerFn } from '@tanstack/react-start'
import { site } from '#/config/site'
import { currentUser, requireAdmin } from '#/lib/session'
import {
	type EstimateInput,
	type InvoiceInput,
	computeBalance,
	normalizeState,
	validateEstimate,
	validateInvoice,
} from '#/lib/validation'

const INVOICE_API_VERSION = '2026-10-24'

/* The app's company API key is attached to these requests at the network edge,
   so no secret exists in this source or the browser bundle. */
async function whopFetch(path: string, init: RequestInit & { idempotencyKey?: string; apiVersionDate?: string } = {}) {
	const { idempotencyKey, apiVersionDate, ...requestInit } = init
	const headers: Record<string, string> = { 'content-type': 'application/json' }
	if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
	if (apiVersionDate) headers['Api-Version-Date'] = apiVersionDate
	const res = await fetch(`${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/api/v1${path}`, {
		...requestInit,
		headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
	})
	const text = await res.text()
	let body: any = null
	try {
		body = text ? JSON.parse(text) : null
	} catch {
		body = { raw: text }
	}
	return { ok: res.ok, status: res.status, body }
}

const apiMessage = (body: any) =>
	(typeof body?.error?.message === 'string' && body.error.message) ||
	(typeof body?.message === 'string' && body.message) ||
	'Whop could not complete the request.'

/* ───────── Visitor ───────── */
export const getVisitor = createServerFn({ method: 'GET' }).handler(async () => {
	const user = await currentUser()
	return user ? { signedIn: true as const, name: user.name ?? user.preferred_username ?? 'Whop user' } : { signedIn: false as const }
})

/* ───────── Estimate → real Whop Lead ───────── */
export type EstimateResult =
	| { ok: true; leadId: string }
	| { ok: false; code: 'auth_required' | 'invalid' | 'api_error' | 'spam'; message: string; fieldErrors?: Record<string, string> }

export const submitEstimate = createServerFn({ method: 'POST' })
	.validator((d: EstimateInput) => d)
	.handler(async ({ data }): Promise<EstimateResult> => {
		if (data.website) return { ok: false, code: 'spam', message: 'Submission rejected.' }
		const fieldErrors = validateEstimate(data)
		if (Object.keys(fieldErrors).length)
			return { ok: false, code: 'invalid', message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors as Record<string, string> }

		// A Whop lead is a Whop user's interest in the business, so the visitor signs in first.
		const user = await currentUser()
		if (!user) return { ok: false, code: 'auth_required', message: 'Sign in with Whop to send your estimate request.' }

		const t = (s: string) => s.trim()
		const res = await whopFetch('/leads', {
			method: 'POST',
			idempotencyKey: `estimate-${user.sub}-${data.submissionId}`.slice(0, 120),
			body: JSON.stringify({
				account_id: site.whopAccountId,
				user_id: user.sub,
				product_id: site.whop.leadProductId,
				referrer: site.url,
				metadata: {
					source: 'estimate_form',
					name: t(data.name),
					email: t(data.email).toLowerCase(),
					phone: t(data.phone),
					property_address: t(data.address),
					city: t(data.city),
					state: normalizeState(data.state) ?? t(data.state).toUpperCase(),
					service: data.service,
					description: t(data.description),
					preferred_contact_method: data.contactMethod,
					preferred_appointment_date: data.preferredDate || '',
					consent_to_contact: 'true',
					consent_at: new Date().toISOString(),
				},
			}),
		})
		if (!res.ok || !res.body?.id) {
			console.error('[estimate] lead creation failed', res.status)
			return { ok: false, code: 'api_error', message: `We could not save your request. ${apiMessage(res.body)} Please try again.` }
		}
		return { ok: true, leadId: String(res.body.id) }
	})

/* ───────── Admin: final invoices ───────── */
const guard = async () => {
	const g = await requireAdmin()
	if (!g.ok) throw new Error(g.reason === 'signed_out' ? 'Sign in required.' : 'Admin access required.')
	return g.user
}

export const adminStatus = createServerFn({ method: 'GET' }).handler(async () => {
	const g = await requireAdmin()
	return g.ok ? ({ ok: true as const, name: g.user.name ?? 'Admin' }) : ({ ok: false as const, reason: g.reason })
})

export type InvoiceView = {
	id: string
	status: string
	amount: string | null
	currency: string | null
	dueAt: string | null
	customer: string | null
	reference: string | null
	description: string | null
	payUrl: string | null
	paid: boolean
}

function toView(inv: any): InvoiceView {
	const due = inv?.amount_due?.amount
	const link = typeof inv?.checkout_link === 'string' && /^https?:\/\//.test(inv.checkout_link) ? inv.checkout_link : null
	return {
		id: String(inv?.id ?? ''),
		status: String(inv?.status ?? 'unknown'),
		amount: due != null ? Number(due).toFixed(2) : null,
		currency: inv?.amount_due?.currency ?? 'usd',
		dueAt: inv?.due_at ?? null,
		customer: inv?.customer_name ?? inv?.email_address ?? null,
		reference: inv?.metadata?.project_ref ?? inv?.number ?? null,
		description: inv?.metadata?.description ?? inv?.line_items?.[0]?.label ?? null,
		payUrl: link,
		paid: String(inv?.status) === 'paid',
	}
}

export const adminListInvoices = createServerFn({ method: 'GET' }).handler(async () => {
	await guard()
	const res = await whopFetch(`/invoices?account_id=${site.whopAccountId}&first=25`, { apiVersionDate: INVOICE_API_VERSION })
	if (!res.ok) throw new Error(apiMessage(res.body))
	return ((res.body?.data ?? []) as any[]).map(toView)
})

export type InvoiceResult =
	| { ok: true; invoice: InvoiceView }
	| { ok: false; message: string; errors?: Record<string, string> }

export const adminCreateInvoice = createServerFn({ method: 'POST' })
	.validator((d: InvoiceInput) => d)
	.handler(async ({ data }): Promise<InvoiceResult> => {
		await guard()
		const errors = validateInvoice(data)
		if (Object.keys(errors).length) return { ok: false, message: errors.form ?? 'Please fix the highlighted fields.', errors: errors as Record<string, string> }

		const ref = data.projectRef.trim()

		// Optional: confirm the deposit payment really is paid before relying on it.
		if (data.depositPaymentId.trim()) {
			const p = await whopFetch(`/payments/${encodeURIComponent(data.depositPaymentId.trim())}`)
			if (!p.ok) return { ok: false, message: 'The deposit payment ID could not be found.', errors: { depositPaymentId: 'Payment not found.' } }
			if (p.body?.status && p.body.status !== 'paid')
				return { ok: false, message: `The deposit payment is "${p.body.status}", not paid.`, errors: { depositPaymentId: 'Payment is not paid.' } }
		}

		// Duplicate protection: one final invoice per project reference.
		const existing = await whopFetch(`/invoices?account_id=${site.whopAccountId}&first=100`, { apiVersionDate: INVOICE_API_VERSION })
		if (existing.ok) {
			const dup = ((existing.body?.data ?? []) as any[]).find(
				(i) => i?.metadata?.project_ref === ref && !['void'].includes(String(i?.status)),
			)
			if (dup) return { ok: false, message: `A final invoice already exists for project ${ref} (${dup.id}, ${dup.status}).` }
		}

		const balance = computeBalance(data)
		const body: Record<string, unknown> = {
			account_id: site.whopAccountId,
			items: [
				{
					plan: {
						currency: 'usd',
						plan_type: 'one_time',
						initial_price: balance,
						title: `Final balance ${ref}`.slice(0, 30),
						description: data.description.trim().slice(0, 900),
						product_id: site.whop.finalBalanceProductId,
						visibility: 'hidden',
						force_create_new_plan: true,
					},
					quantity: 1,
				},
			],
			due_at: new Date(`${data.dueDate}T23:59:59Z`).toISOString(),
			customer_name: data.customerName.trim(),
			recipient_emails: [data.customerEmail.trim().toLowerCase()],
			metadata: {
				project_ref: ref,
				description: data.description.trim().slice(0, 450),
				approved_total: data.approvedTotal.toFixed(2),
				deposit_paid: data.depositPaid.toFixed(2),
				other_payments: data.otherPayments.toFixed(2),
				deposit_payment_id: data.depositPaymentId.trim(),
				demo: 'true',
			},
		}
		if (data.chargeSavedMethod) {
			body.member_id = data.memberId.trim()
			body.payment_method_id = data.paymentMethodId.trim()
		} else if (data.memberId.trim()) body.member_id = data.memberId.trim()
		else body.email_address = data.customerEmail.trim().toLowerCase()

		const res = await whopFetch('/invoices', { method: 'POST', body: JSON.stringify(body), idempotencyKey: `final-invoice-${ref}`, apiVersionDate: INVOICE_API_VERSION })
		if (!res.ok) {
			console.error('[invoice] create failed', res.status)
			return { ok: false, message: apiMessage(res.body) }
		}
		return { ok: true, invoice: toView(res.body) }
	})

/** Issue a draft: opens it for manual payment, or charges the saved method if one was attached. */
export const adminIssueInvoice = createServerFn({ method: 'POST' })
	.validator((d: { id: string }) => d)
	.handler(async ({ data }): Promise<InvoiceResult> => {
		await guard()
		if (!/^pay_[A-Za-z0-9]+$/.test(data.id)) return { ok: false, message: 'Invalid invoice ID.' }
		const current = await whopFetch(`/invoices/${data.id}`, { apiVersionDate: INVOICE_API_VERSION })
		if (current.ok && current.body?.status === 'paid') return { ok: false, message: 'This invoice is already paid.' }
		const res = await whopFetch(`/invoices/${data.id}/issue`, { method: 'POST', body: '{}', apiVersionDate: INVOICE_API_VERSION })
		if (!res.ok) return { ok: false, message: apiMessage(res.body) }
		return { ok: true, invoice: toView(res.body) }
	})

/* ───────── Quotes (stored on the Whop lead's metadata) ───────── */
export type QuoteView = {
	leadId: string
	customerName: string
	service: string
	address: string
	scope: string
	total: number
	deposit: number
	terms: string
	validUntil: string
	status: 'sent' | 'accepted' | 'deposit_paid' | 'expired' | 'none'
	acceptedAt: string | null
	depositPaymentId: string | null
}

const LEAD_ID = /^lead_[A-Za-z0-9]+$/
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('')

function safeEqual(a: string, b: string) {
	if (a.length !== b.length || !a) return false
	let r = 0
	for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
	return r === 0
}

async function getLead(id: string) {
	if (!LEAD_ID.test(id)) return null
	const res = await whopFetch(`/leads/${id}`)
	if (!res.ok || res.body?.id !== id) return null
	return res.body as { id: string; metadata: Record<string, string> | null; user?: { email?: string | null; name?: string | null } | null }
}

async function patchLead(id: string, metadata: Record<string, string>) {
	return whopFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ metadata }) })
}

function quoteFrom(lead: { id: string; metadata: Record<string, string> | null }): QuoteView {
	const m = lead.metadata ?? {}
	let status = (m.quote_status as QuoteView['status']) || 'none'
	if (status === 'sent' && m.quote_valid_until && new Date(`${m.quote_valid_until}T23:59:59`) < new Date()) status = 'expired'
	return {
		leadId: lead.id,
		customerName: m.name ?? '',
		service: m.service ?? '',
		address: [m.property_address, m.city, m.state].filter(Boolean).join(', '),
		scope: m.quote_scope ?? '',
		total: Number(m.quote_total ?? 0),
		deposit: Number(m.quote_deposit ?? site.plans.deposit.price),
		terms: m.quote_terms ?? '',
		validUntil: m.quote_valid_until ?? '',
		status,
		acceptedAt: m.quote_accepted_at ?? null,
		depositPaymentId: m.deposit_payment_id ?? null,
	}
}

export type LeadRow = {
	id: string
	createdAt: string
	name: string
	email: string
	phone: string
	service: string
	location: string
	description: string
	quote: QuoteView
	quotePath: string | null
}

export const adminListLeads = createServerFn({ method: 'GET' }).handler(async (): Promise<LeadRow[]> => {
	await guard()
	const res = await whopFetch(`/leads?account_id=${site.whopAccountId}&first=50`)
	if (!res.ok) throw new Error(apiMessage(res.body))
	return ((res.body?.data ?? []) as any[])
		.filter((l) => l?.metadata?.source === 'estimate_form' && !l?.metadata?.pipeline_deleted_at)
		.map((l) => {
			const m = l.metadata ?? {}
			return {
				id: l.id,
				createdAt: l.created_at,
				name: m.name ?? l.user?.name ?? 'Unknown',
				email: m.email ?? l.user?.email ?? '',
				phone: m.phone ?? '',
				service: m.service ?? '',
				location: [m.city, m.state].filter(Boolean).join(', '),
				description: m.description ?? '',
				quote: quoteFrom(l),
				quotePath: m.quote_token ? `/quote/${l.id}?t=${m.quote_token}` : null,
			}
		})
})

/** Hide a lead from this app's pipeline while retaining its Whop history. */
export const adminDeleteLead = createServerFn({ method: 'POST' })
	.validator((d: { leadId: string }) => d)
	.handler(async ({ data }): Promise<{ ok: true } | { ok: false; message: string }> => {
		await guard()
		if (!LEAD_ID.test(data.leadId)) return { ok: false, message: 'Invalid lead ID.' }
		const lead = await getLead(data.leadId)
		if (!lead || lead.metadata?.source !== 'estimate_form') return { ok: false, message: 'Lead not found.' }
		const res = await patchLead(lead.id, {
			...lead.metadata,
			quote_token: '',
			pipeline_deleted_at: new Date().toISOString(),
		})
		if (!res.ok) return { ok: false, message: apiMessage(res.body) }
		return { ok: true }
	})

export type QuoteInput = { leadId: string; scope: string; total: number; terms: string; validUntil: string }

export const adminSaveQuote = createServerFn({ method: 'POST' })
	.validator((d: QuoteInput) => d)
	.handler(async ({ data }): Promise<{ ok: true; path: string } | { ok: false; message: string }> => {
		await guard()
		const scope = data.scope.trim()
		const terms = data.terms.trim()
		const cents = Math.round(data.total * 100)
		if (scope.length < 20 || scope.length > 450) return { ok: false, message: 'Describe the scope in 20 to 450 characters.' }
		if (!Number.isFinite(data.total) || cents <= site.plans.deposit.price * 100) return { ok: false, message: `The total must be greater than the $${site.plans.deposit.price} deposit.` }
		if (Math.abs(data.total * 100 - cents) > 1e-6) return { ok: false, message: 'Use at most two decimals for the total.' }
		if (terms.length > 450) return { ok: false, message: 'Keep the terms under 450 characters.' }
		if (!data.validUntil || new Date(`${data.validUntil}T23:59:59`) < new Date()) return { ok: false, message: 'Choose a valid-until date in the future.' }
		const lead = await getLead(data.leadId)
		if (!lead || lead.metadata?.source !== 'estimate_form' || lead.metadata?.pipeline_deleted_at) return { ok: false, message: 'Lead not found.' }
		const m = lead.metadata ?? {}
		if (m.quote_status === 'accepted' || m.quote_status === 'deposit_paid')
			return { ok: false, message: 'This quote was already accepted and can no longer be edited.' }
		const token = m.quote_token || randomToken()
		const res = await patchLead(lead.id, {
			...m,
			quote_scope: scope,
			quote_total: (cents / 100).toFixed(2),
			quote_deposit: site.plans.deposit.price.toFixed(2),
			quote_terms: terms,
			quote_valid_until: data.validUntil,
			quote_token: token,
			quote_status: 'sent',
			quote_updated_at: new Date().toISOString(),
		})
		if (!res.ok) return { ok: false, message: apiMessage(res.body) }
		return { ok: true, path: `/quote/${lead.id}?t=${token}` }
	})

export const getQuote = createServerFn({ method: 'GET' })
	.validator((d: { leadId: string; token: string }) => d)
	.handler(async ({ data }): Promise<QuoteView | null> => {
		const lead = await getLead(data.leadId)
		if (!lead || !safeEqual(lead.metadata?.quote_token ?? '', data.token ?? '')) return null
		const q = quoteFrom(lead)
		return q.status === 'none' ? null : q
	})

export const acceptQuote = createServerFn({ method: 'POST' })
	.validator((d: { leadId: string; token: string }) => d)
	.handler(async ({ data }): Promise<{ ok: true } | { ok: false; message: string }> => {
		const lead = await getLead(data.leadId)
		if (!lead || !safeEqual(lead.metadata?.quote_token ?? '', data.token ?? '')) return { ok: false, message: 'This quote link is not valid.' }
		const q = quoteFrom(lead)
		if (q.status === 'accepted' || q.status === 'deposit_paid') return { ok: true }
		if (q.status === 'expired') return { ok: false, message: 'This quote has expired. Please contact us for an updated one.' }
		if (q.status !== 'sent') return { ok: false, message: 'This quote is not open for acceptance.' }
		const res = await patchLead(lead.id, { ...lead.metadata, quote_status: 'accepted', quote_accepted_at: new Date().toISOString(), quote_accepted_total: lead.metadata?.quote_total ?? '' })
		return res.ok ? { ok: true } : { ok: false, message: apiMessage(res.body) }
	})

/** Called after the deposit checkout completes. Whop is asked whether the payment is really paid. */
export const recordDeposit = createServerFn({ method: 'POST' })
	.validator((d: { leadId: string; token: string; paymentId: string }) => d)
	.handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
		const lead = await getLead(data.leadId)
		if (!lead || !safeEqual(lead.metadata?.quote_token ?? '', data.token ?? '')) return { ok: false, message: 'Invalid quote link.' }
		if (!/^pay_[A-Za-z0-9]+$/.test(data.paymentId)) return { ok: false, message: 'Invalid payment.' }
		if (lead.metadata?.quote_status !== 'accepted') return { ok: lead.metadata?.quote_status === 'deposit_paid' }
		const p = await whopFetch(`/payments/${data.paymentId}`)
		if (!p.ok) return { ok: false, message: 'Could not confirm the payment with Whop yet.' }
		if (p.body?.status !== 'paid') return { ok: false, message: `Payment is ${p.body?.status ?? 'not paid'}.` }
		if (p.body?.metadata?.lead_id !== lead.id) return { ok: false, message: 'Payment does not belong to this quote.' }
		const res = await patchLead(lead.id, { ...lead.metadata, quote_status: 'deposit_paid', deposit_payment_id: data.paymentId, deposit_paid_at: new Date().toISOString() })
		return res.ok ? { ok: true } : { ok: false, message: apiMessage(res.body) }
	})
