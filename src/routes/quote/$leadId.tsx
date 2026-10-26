import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { site } from '#/config/site'
import { acceptQuote, getQuote, recordDeposit, type QuoteView } from '#/lib/api'
import { CheckoutProvider, useCheckout } from '#/components/CheckoutProvider'

export const Route = createFileRoute('/quote/$leadId')({
	validateSearch: (s: Record<string, unknown>) => ({ t: typeof s.t === 'string' ? s.t : '' }),
	loaderDeps: ({ search }) => ({ t: search.t }),
	loader: ({ params, deps }) => getQuote({ data: { leadId: params.leadId, token: deps.t } }),
	head: () => ({ meta: [{ title: `Your estimate | ${site.name}` }, { name: 'robots', content: 'noindex' }] }),
	component: () => (
		<CheckoutProvider>
			<QuotePage />
		</CheckoutProvider>
	),
})

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

function QuotePage() {
	const loaded = Route.useLoaderData()
	const { leadId } = Route.useParams()
	const { t } = Route.useSearch()
	const { openCheckout } = useCheckout()
	const [quote, setQuote] = useState<QuoteView | null>(loaded)
	const [agree, setAgree] = useState(false)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')
	const [note, setNote] = useState('')

	if (!quote) {
		return (
			<main className="mx-auto grid min-h-screen max-w-md place-items-center px-5 text-center">
				<div>
					<h1 className="font-display text-3xl font-extrabold">Estimate not found</h1>
					<p className="mt-3 text-muted">This link is invalid or has been replaced. Please contact {site.name} for a new link.</p>
					<a href="/" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-navy px-8 font-semibold text-white">Back to site</a>
				</div>
			</main>
		)
	}

	const payDeposit = () =>
		openCheckout('deposit', {
			metadata: { lead_id: leadId },
			onPaid: async (paymentId) => {
				try {
					const r = await recordDeposit({ data: { leadId, token: t, paymentId } })
					if (r.ok) setQuote((q) => (q ? { ...q, status: 'deposit_paid', depositPaymentId: paymentId } : q))
					else setNote(r.message ?? 'Your payment went through, but we could not link it to this estimate yet. We will match it manually.')
				} catch {
					setNote('Your payment went through, but we could not link it to this estimate yet. We will match it manually.')
				}
			},
		})

	async function accept() {
		if (busy || !agree) return
		setBusy(true)
		setError('')
		try {
			const r = await acceptQuote({ data: { leadId, token: t } })
			if (!r.ok) return setError(r.message)
			setQuote((q) => (q ? { ...q, status: 'accepted' } : q))
			payDeposit()
		} catch {
			setError('Something went wrong. Nothing was accepted. Please try again.')
		} finally {
			setBusy(false)
		}
	}

	const balance = quote.total - quote.deposit
	return (
		<main className="min-h-screen bg-card px-5 py-12">
			<div className="mx-auto max-w-2xl">
				<a href="/" className="text-sm font-semibold text-accent-deep underline underline-offset-4">← {site.name}</a>
				<div className="mt-6 rounded-card bg-paper p-6 shadow-sm sm:p-10">
					<p className="text-xs font-bold tracking-[0.2em] text-accent-deep uppercase">Written estimate</p>
					<h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{quote.service || 'Roofing project'}</h1>
					<p className="mt-1 text-muted">Prepared for {quote.customerName}{quote.address ? ` · ${quote.address}` : ''}</p>

					<h2 className="mt-8 font-display text-lg font-bold">Scope of work</h2>
					<p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{quote.scope}</p>

					<dl className="mt-8 divide-y divide-line rounded-card border border-line">
						<div className="flex justify-between p-4"><dt>Approved project total</dt><dd className="font-display text-xl font-extrabold">{money(quote.total)}</dd></div>
						<div className="flex justify-between p-4 text-sm"><dt>Deposit due now</dt><dd className="font-semibold">{money(quote.deposit)}</dd></div>
						<div className="flex justify-between p-4 text-sm"><dt>Remaining balance after deposit</dt><dd className="font-semibold">{money(balance)}</dd></div>
					</dl>
					<p className="mt-3 text-sm text-muted">The remaining balance is invoiced after the work is complete. Valid until {new Date(`${quote.validUntil}T12:00:00`).toLocaleDateString('en-US', { dateStyle: 'long' })}.</p>
					{quote.terms && <p className="mt-4 text-sm leading-relaxed text-muted"><span className="font-semibold text-ink">Terms: </span>{quote.terms}</p>}

					<div className="mt-8 border-t border-line pt-6">
						{quote.status === 'sent' && (
							<>
								<label className="flex cursor-pointer items-start gap-3 text-sm">
									<input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#F97316]" />
									<span>I have read this estimate and accept the scope, the {money(quote.total)} total and the deposit terms above.</span>
								</label>
								{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
								<button onClick={accept} disabled={!agree || busy} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-8 font-semibold text-navy transition hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-50">
									{busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Accept and pay {money(quote.deposit)} deposit
								</button>
							</>
						)}
						{quote.status === 'accepted' && (
							<div>
								<p className="font-semibold">Estimate accepted. Your deposit is the next step.</p>
								<button onClick={payDeposit} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-8 font-semibold text-navy hover:bg-[#fb8a3c]">Pay {money(quote.deposit)} deposit</button>
							</div>
						)}
						{quote.status === 'deposit_paid' && (
							<p role="status" className="flex items-start gap-3 text-emerald-700"><CheckCircle2 className="mt-0.5 size-6 shrink-0" aria-hidden /> Accepted and deposit received{quote.depositPaymentId ? ` (${quote.depositPaymentId})` : ''}. We will be in touch to schedule the work.</p>
						)}
						{quote.status === 'expired' && <p role="alert" className="text-red-700">This estimate has expired. Please contact us for an updated one.</p>}
						{note && <p role="status" className="mt-4 text-sm text-orange-800">{note}</p>}
					</div>
				</div>
				<p className="mt-6 text-center text-xs text-muted">{site.legal.disclosure}</p>
			</div>
		</main>
	)
}
