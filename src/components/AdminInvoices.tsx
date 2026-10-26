import { useState, type FormEvent } from 'react'
import { FilePlus2, Loader2, ReceiptText } from 'lucide-react'
import { adminCreateInvoice, adminIssueInvoice, type InvoiceResult, type InvoiceView } from '#/lib/api'
import { computeBalance, validateInvoice, type InvoiceErrors, type InvoiceInput } from '#/lib/validation'
import { InvoiceCard } from '#/components/InvoiceCard'

const blank: Record<keyof InvoiceInput, string> = {
	projectRef: '', customerName: '', customerEmail: '', approvedTotal: '', depositPaid: '500', otherPayments: '0', finalAmount: '',
	dueDate: '', description: '', depositPaymentId: '', memberId: '', paymentMethodId: '', chargeSavedMethod: '',
}

const field = 'mt-1.5 block min-h-12 w-full rounded-lg border border-line bg-paper px-4 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-accent/40 aria-[invalid=true]:border-red-500'

export function AdminInvoices({ invoices, onChanged, onMessage }: {
	invoices: InvoiceView[]
	onChanged: () => void
	onMessage: (message: { kind: 'ok' | 'err'; text: string }) => void
}) {
	const [values, setValues] = useState(blank)
	const [errors, setErrors] = useState<InvoiceErrors>({})
	const [created, setCreated] = useState<InvoiceView | null>(null)
	const [busy, setBusy] = useState<string | null>(null)
	const n = (s: string) => (s.trim() ? Number(s) : NaN)
	const input: InvoiceInput = {
		projectRef: values.projectRef, customerName: values.customerName, customerEmail: values.customerEmail,
		approvedTotal: n(values.approvedTotal), depositPaid: n(values.depositPaid), otherPayments: n(values.otherPayments), finalAmount: n(values.finalAmount),
		dueDate: values.dueDate, description: values.description, depositPaymentId: values.depositPaymentId, memberId: values.memberId,
		paymentMethodId: values.paymentMethodId, chargeSavedMethod: false,
	}
	const balance = [input.approvedTotal, input.depositPaid, input.otherPayments].every(Number.isFinite) ? computeBalance(input) : null
	const update = (key: keyof InvoiceInput, value: string) => setValues((old) => ({ ...old, [key]: value }))
	const error = (key: keyof InvoiceErrors) => errors[key] && <p className="mt-1 text-sm text-red-700">{errors[key]}</p>

	async function create(e: FormEvent) {
		e.preventDefault()
		const found = validateInvoice(input)
		setErrors(found)
		if (Object.keys(found).length) {
			onMessage({ kind: 'err', text: found.form ?? 'Please fix the highlighted fields.' })
			return
		}
		setBusy('create')
		try {
			const result = await adminCreateInvoice({ data: input })
			if (result.ok) {
				setCreated(result.invoice)
				onMessage({ kind: 'ok', text: `Draft invoice ${result.invoice.id} created through Whop.` })
				onChanged()
			} else {
				setErrors((result.errors ?? {}) as InvoiceErrors)
				onMessage({ kind: 'err', text: result.message })
			}
		} catch (e) {
			onMessage({ kind: 'err', text: e instanceof Error ? e.message : 'Could not create invoice.' })
		} finally {
			setBusy(null)
		}
	}

	async function issue(id: string) {
		if (busy) return
		setBusy(id)
		try {
			const result: InvoiceResult = await adminIssueInvoice({ data: { id } })
			onMessage(result.ok ? { kind: 'ok', text: `Invoice ${id} is now ${result.invoice.status}.` } : { kind: 'err', text: result.message })
			if (result.ok) setCreated(null)
			onChanged()
		} catch (e) {
			onMessage({ kind: 'err', text: e instanceof Error ? e.message : 'Could not issue invoice.' })
		} finally {
			setBusy(null)
		}
	}

	return <section className="admin-page admin-section grid gap-6 lg:grid-cols-[1fr_1fr]" aria-label="Final invoices">
		<form onSubmit={create} noValidate className="space-y-4 rounded-card border border-line bg-paper p-5">
			<div className="admin-section-head"><div><div className="admin-section-kicker">WHOP PAYMENTS</div><h2><FilePlus2 size={19} /> Create final invoice</h2><p>Invoice the remaining balance after the project is complete.</p></div></div>
			<div className="grid gap-3 sm:grid-cols-2">
				<label className="text-sm font-semibold">Project reference<input className={field} value={values.projectRef} onChange={(e) => update('projectRef', e.target.value)} placeholder="PRJ-1042" />{error('projectRef')}</label>
				<label className="text-sm font-semibold">Customer name<input className={field} value={values.customerName} onChange={(e) => update('customerName', e.target.value)} />{error('customerName')}</label>
				<label className="text-sm font-semibold sm:col-span-2">Customer email<input type="email" className={field} value={values.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} />{error('customerEmail')}</label>
				<label className="text-sm font-semibold">Approved project total ($)<input inputMode="decimal" className={field} value={values.approvedTotal} onChange={(e) => update('approvedTotal', e.target.value)} />{error('approvedTotal')}</label>
				<label className="text-sm font-semibold">Deposit paid ($)<input inputMode="decimal" className={field} value={values.depositPaid} onChange={(e) => update('depositPaid', e.target.value)} />{error('depositPaid')}</label>
				<label className="text-sm font-semibold">Other payments ($)<input inputMode="decimal" className={field} value={values.otherPayments} onChange={(e) => update('otherPayments', e.target.value)} />{error('otherPayments')}</label>
				<div className="text-sm font-semibold">Remaining balance<p className="mt-1.5 flex min-h-12 items-center rounded-lg bg-navy px-4 font-display text-xl text-white">{balance == null ? '—' : balance <= 0 ? 'Nothing owed' : `$${balance.toFixed(2)}`}</p></div>
				<label className="text-sm font-semibold">Final invoice amount ($)<input inputMode="decimal" className={field} value={values.finalAmount} onChange={(e) => update('finalAmount', e.target.value)} />{error('finalAmount')}</label>
				<label className="text-sm font-semibold">Due date<input type="date" className={field} value={values.dueDate} onChange={(e) => update('dueDate', e.target.value)} />{error('dueDate')}</label>
				<label className="text-sm font-semibold sm:col-span-2">Invoice description<input className={field} value={values.description} onChange={(e) => update('description', e.target.value)} placeholder="Final balance for roof repair" />{error('description')}</label>
				<label className="text-sm font-semibold sm:col-span-2">Deposit payment ID (optional)<input className={field} value={values.depositPaymentId} onChange={(e) => update('depositPaymentId', e.target.value)} placeholder="pay_…" />{error('depositPaymentId')}</label>
			</div>
			<p className="text-xs text-muted">Creates a manual payment invoice. Saved-card charging is not enabled in this form.</p>
			<button disabled={busy === 'create'} className="admin-submit inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-6 font-semibold text-white disabled:opacity-60">{busy === 'create' && <Loader2 className="size-4 animate-spin" aria-hidden />}Create draft invoice</button>
		</form>
		<section className="rounded-card border border-line bg-paper p-5" aria-labelledby="invoice-list-title">
			<div className="admin-section-head"><div><div className="admin-section-kicker">RECEIVABLES</div><h2 id="invoice-list-title"><ReceiptText size={19} /> Invoices</h2><p>Issue a draft to send it for payment.</p></div><span className="admin-count">{invoices.length} total</span></div>
			<div className="space-y-4">
				{created && !invoices.some((invoice) => invoice.id === created.id) && <InvoiceCard inv={created} onIssue={issue} busy={busy === created.id} />}
				{!invoices.length && !created && <p className="text-sm text-muted">No invoices yet.</p>}
				{invoices.map((invoice) => <InvoiceCard key={invoice.id} inv={invoice} onIssue={issue} busy={busy === invoice.id} />)}
			</div>
		</section>
	</section>
}
