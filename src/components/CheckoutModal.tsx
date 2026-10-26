import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Checkout, CheckoutElement, ExpressCheckoutElement, WhopElements } from '@whop/elements-react'
import { loadWhop } from '@whop/elements'
import { CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react'
import { site, type Plan } from '#/config/site'
import type { CheckoutExtra } from '#/components/CheckoutProvider'

type Phase = 'pay' | 'paid' | 'authorize' | 'saved'

export function CheckoutModal({ plan, extra, onClose }: { plan: Plan; extra?: CheckoutExtra; onClose: () => void }) {
	const elements = useMemo(() => loadWhop(), [])
	const [phase, setPhase] = useState<Phase>('pay')
	const [paymentId, setPaymentId] = useState<string | null>(null)
	const [setupId, setSetupId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [attempt, setAttempt] = useState(0)
	const [consent, setConsent] = useState(false)
	const dialogRef = useRef<HTMLDivElement>(null)
	const completed = useRef(false)

	// Focus management, Escape to close, and body scroll lock while open.
	useEffect(() => {
		const prev = document.activeElement as HTMLElement | null
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
			if (e.key === 'Tab' && dialogRef.current) {
				const f = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
				if (!f.length) return
				const first = f[0]
				const last = f[f.length - 1]
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault()
					last.focus()
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault()
					first.focus()
				}
			}
		}
		document.addEventListener('keydown', onKey)
		const overflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		dialogRef.current?.focus()
		return () => {
			document.removeEventListener('keydown', onKey)
			document.body.style.overflow = overflow
			prev?.focus?.()
		}
	}, [onClose])

	const returnUrl = `${window.location.origin}/checkout/return?plan=${plan.key}`
	const onPaid = useCallback((id: string) => {
		if (completed.current) return
		completed.current = true
		setPaymentId(id)
		setPhase('paid')
		extra?.onPaid?.(id)
	}, [extra])

	const shareRepairDetails = () => {
		sessionStorage.setItem('summit_service', 'Roof repair')
		window.location.assign('/#estimate')
	}

	return (
		<div className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="checkout-title"
				tabIndex={-1}
				className="relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-paper shadow-2xl outline-none sm:rounded-card"
			>
				<div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
					<div>
						<p className="text-xs font-semibold tracking-[0.16em] text-accent-deep uppercase">Secure checkout</p>
						<h2 id="checkout-title" className="mt-1 font-display text-xl font-extrabold tracking-tight">
							{plan.name} · {plan.priceLabel}
						</h2>
						<p className="mt-1 text-sm text-muted">{plan.note}</p>
					</div>
					<button onClick={onClose} aria-label="Close checkout" className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-ink hover:text-ink">
						<X className="size-5" aria-hidden />
					</button>
				</div>

				<div className="overflow-y-auto px-6 py-6">
					{phase === 'pay' && (
						<WhopElements elements={elements}>
							{error && (
								<div role="alert" className="mb-4 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">
									<p className="font-semibold">Checkout could not load.</p>
									<p className="mt-1">{error} You have not been charged.</p>
									<button
										onClick={() => {
											setError(null)
											setLoading(true)
											setAttempt((n) => n + 1)
										}}
										className="mt-3 min-h-11 rounded-full bg-navy px-5 text-sm font-semibold text-white"
									>
										Try again
									</button>
								</div>
							)}
							{!error && loading && (
								<p className="mb-3 flex items-center gap-2 text-sm text-muted" role="status">
									<Loader2 className="size-4 animate-spin" aria-hidden /> Loading secure checkout…
								</p>
							)}
							{!error && (
								<div className="space-y-5" key={attempt}>
									{/* Wallets (Apple Pay, Google Pay, PayPal) render only where the device, merchant and verified domain allow. */}
									<Checkout
										plan={plan.planId}
										metadata={{ source: 'summit_roofing_site', plan_key: plan.key, ...(extra?.metadata ?? {}) }}
										returnUrl={returnUrl}
										onComplete={(c) => c.result === 'payment' && onPaid(c.paymentId)}
									>
										<ExpressCheckoutElement onError={() => undefined} />
									</Checkout>
									<Checkout
										plan={plan.planId}
										metadata={{ source: 'summit_roofing_site', plan_key: plan.key, ...(extra?.metadata ?? {}) }}
										returnUrl={returnUrl}
										onLoadingChange={setLoading}
										onComplete={(c) => c.result === 'payment' && onPaid(c.paymentId)}
									>
										<CheckoutElement onError={(e) => setError(e.message || 'Something went wrong.')} />
									</Checkout>
								</div>
							)}
						</WhopElements>
					)}

					{phase === 'paid' && (
						<div role="status" className="py-4 text-center">
							<CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
							<h3 className="mt-4 font-display text-2xl font-extrabold">Payment received</h3>
							<p className="mt-2 text-muted">
								Whop confirmed your {plan.name.toLowerCase()} payment{paymentId ? ` (${paymentId})` : ''}. A receipt is on its way to your email.
							</p>
							{plan.key === 'deposit' ? (
								<div className="mt-6 space-y-3">
									<button onClick={() => setPhase('authorize')} className="min-h-12 w-full rounded-full bg-accent px-6 font-semibold text-navy transition hover:brightness-110">
										Optional: save a card for my final invoice
									</button>
									<button onClick={onClose} className="min-h-11 w-full rounded-full border border-line font-semibold transition hover:border-ink">
										No thanks, I will pay the invoice myself
									</button>
								</div>
							) : plan.key === 'repair' ? (
								<div className="mt-6 space-y-3">
									<button onClick={shareRepairDetails} className="min-h-12 w-full rounded-full bg-accent px-6 font-semibold text-navy transition hover:brightness-110">
										Share repair details and arrange a visit
									</button>
									<p className="text-sm text-muted">Tell us where the roof is and what needs attention. We will follow up to coordinate the repair.</p>
								</div>
							) : (
								<button onClick={onClose} className="mt-6 min-h-12 rounded-full bg-navy px-8 font-semibold text-white">
									Done
								</button>
							)}
						</div>
					)}

					{phase === 'authorize' && (
						<div>
							<h3 className="font-display text-xl font-extrabold">Authorize a saved card (optional)</h3>
							<p className="mt-2 text-sm text-muted">
								This saves a payment method without charging it now. It is separate from your deposit and you can skip it.
							</p>
							<label className="mt-5 flex cursor-pointer items-start gap-3 rounded-card border border-line bg-card p-4 text-sm">
								<input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#F97316]" />
								<span>
									I authorize {site.name} to charge the card I save only for the final balance invoice of my approved roofing project, for the amount
									shown on that invoice. I understand I receive the invoice first and can ask to remove the saved card at any time.
								</span>
							</label>
							{consent && (
								<div className="mt-5">
									<WhopElements elements={elements}>
										<Checkout
											checkoutConfiguration={site.whop.setupCheckoutConfigId}
											returnUrl={`${window.location.origin}/checkout/return?plan=${plan.key}&setup=1`}
											onComplete={(c) => {
												if (c.result === 'setup') {
													setSetupId(c.setupIntentId)
													setPhase('saved')
												}
											}}
										>
											<CheckoutElement onError={(e) => setError(e.message)} />
										</Checkout>
									</WhopElements>
									{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
								</div>
							)}
						</div>
					)}

					{phase === 'saved' && (
						<div role="status" className="py-4 text-center">
							<ShieldCheck className="mx-auto size-12 text-emerald-600" aria-hidden />
							<h3 className="mt-4 font-display text-2xl font-extrabold">Card saved for your final invoice</h3>
							<p className="mt-2 text-muted">Whop confirmed the saved payment method{setupId ? ` (${setupId})` : ''}. Nothing was charged.</p>
							<button onClick={onClose} className="mt-6 min-h-12 rounded-full bg-navy px-8 font-semibold text-white">
								Done
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
