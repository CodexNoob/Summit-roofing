import { useEffect, useState, type FormEvent } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight, ClipboardList, FilePlus2, LayoutDashboard, Loader2, LogOut, Plus, ReceiptText, Sparkles, UsersRound } from 'lucide-react'
import { site } from '#/config/site'
import { adminCreateInvoice, adminIssueInvoice, adminListInvoices, adminListLeads, adminSaveQuote, adminStatus, type InvoiceView, type LeadRow } from '#/lib/api'
import { computeBalance, validateInvoice, type InvoiceErrors, type InvoiceInput } from '#/lib/validation'
import { InvoiceCard } from '#/components/InvoiceCard'
import { Logo } from '#/components/Navigation'

export const Route = createFileRoute('/admin')({
	head: () => ({ meta: [{ title: `Operator console | ${site.name}` }, { name: 'robots', content: 'noindex' }] }),
	loader: async () => {
		const s = await adminStatus()
		if (!s.ok) return { access: s.reason, name: '', invoices: [] as InvoiceView[], leads: [] as LeadRow[], listError: '' }
		const [inv, leads] = await Promise.allSettled([adminListInvoices(), adminListLeads()])
		const err = [inv, leads].flatMap((r) => (r.status === 'rejected' ? [r.reason instanceof Error ? r.reason.message : 'Request failed.'] : []))
		return {
			access: 'ok' as const,
			name: s.name,
			invoices: inv.status === 'fulfilled' ? inv.value : ([] as InvoiceView[]),
			leads: leads.status === 'fulfilled' ? leads.value : ([] as LeadRow[]),
			listError: err.join(' '),
		}
	},
	component: Admin,
})

const field = 'mt-1.5 block min-h-12 w-full rounded-lg border border-line bg-paper px-4 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-accent/40 aria-[invalid=true]:border-red-500'

const blank: Record<keyof InvoiceInput, string> = {
	projectRef: '', customerName: '', customerEmail: '', approvedTotal: '', depositPaid: '500', otherPayments: '0', finalAmount: '',
	dueDate: '', description: '', depositPaymentId: '', memberId: '', paymentMethodId: '', chargeSavedMethod: '',
}

function Admin() {
	const data = Route.useLoaderData()
	const router = useRouter()
	const [activeTab, setActiveTab] = useState('overview')
	useEffect(() => {
		const validTabs = ['overview', 'leads', 'invoice-form', 'invoices']
		const syncTab = () => {
			const tab = window.location.hash.slice(1)
			setActiveTab(validTabs.includes(tab) ? tab : 'overview')
		}
		syncTab()
		window.addEventListener('hashchange', syncTab)
		window.addEventListener('popstate', syncTab)
		return () => {
			window.removeEventListener('hashchange', syncTab)
			window.removeEventListener('popstate', syncTab)
		}
	}, [])
	const goToTab = (tab: string) => {
		setActiveTab(tab)
		window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#${tab}`)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}
	const [f, setF] = useState(blank)
	const [errors, setErrors] = useState<InvoiceErrors>({})
	const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
	const [busy, setBusy] = useState<string | null>(null)
	const [created, setCreated] = useState<InvoiceView | null>(null)

	if (data.access !== 'ok') {
		return (
			<main className="mx-auto grid min-h-screen max-w-md place-items-center px-5 text-center">
				<div>
					<h1 className="font-display text-3xl font-extrabold">Operator console</h1>
					{data.access === 'signed_out' ? (
						<>
							<p className="mt-3 text-muted">Sign in with the Whop account that manages {site.name}.</p>
							<a href={`/api/oauth/login?redirect_to=${encodeURIComponent('/admin')}`} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-accent px-8 font-semibold text-navy">Sign in with Whop</a>
						</>
					) : (
						<>
							<p className="mt-3 text-muted">This account is not an admin of the business behind this site.</p>
							<a href="/api/oauth/logout" className="mt-6 inline-flex min-h-12 items-center rounded-full border border-line px-8 font-semibold">Sign out</a>
						</>
					)}
					<p className="mt-8"><Link to="/" className="text-sm underline">Back to site</Link></p>
				</div>
			</main>
		)
	}

	const useQuote = (l: LeadRow) => {
		setF((p) => ({
			...p,
			projectRef: l.id.replace('lead_', 'PRJ-'),
			customerName: l.name,
			customerEmail: l.email,
			approvedTotal: l.quote.total.toFixed(2),
			depositPaid: l.quote.status === 'deposit_paid' ? l.quote.deposit.toFixed(2) : '0',
			otherPayments: '0',
			finalAmount: (l.quote.total - (l.quote.status === 'deposit_paid' ? l.quote.deposit : 0)).toFixed(2),
			description: `Final balance for ${l.quote.service || 'roofing project'} at ${l.quote.address}`.slice(0, 200),
			depositPaymentId: l.quote.depositPaymentId ?? '',
		}))
		setMsg({ kind: 'ok', text: `Invoice form filled from the accepted quote for ${l.name}. Set a due date, then create the draft.` })
		goToTab('invoice-form')
	}

	const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
	const asInput = (): InvoiceInput => ({
		projectRef: f.projectRef, customerName: f.customerName, customerEmail: f.customerEmail,
		approvedTotal: num(f.approvedTotal), depositPaid: num(f.depositPaid), otherPayments: num(f.otherPayments), finalAmount: num(f.finalAmount),
		dueDate: f.dueDate, description: f.description, depositPaymentId: f.depositPaymentId, memberId: f.memberId,
		paymentMethodId: f.paymentMethodId, chargeSavedMethod: f.chargeSavedMethod === 'true',
	})
	const inp = asInput()
	const balance = [inp.approvedTotal, inp.depositPaid, inp.otherPayments].every(Number.isFinite) ? computeBalance(inp) : null
	const acceptedQuotes = data.leads.filter((lead) => lead.quote.status === 'accepted' || lead.quote.status === 'deposit_paid').length
	const openInvoices = data.invoices.filter((invoice) => ['draft', 'open'].includes(invoice.status)).length
	const collectedInvoices = data.invoices.filter((invoice) => invoice.paid).length
	const set = (k: keyof InvoiceInput) => (e: { target: { value: string; type?: string; checked?: boolean } }) =>
		setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? String(!!e.target.checked) : e.target.value }))

	async function create(e: FormEvent) {
		e.preventDefault()
		if (busy) return
		const found = validateInvoice(asInput())
		setErrors(found)
		if (Object.keys(found).length) return setMsg({ kind: 'err', text: found.form ?? 'Please fix the highlighted fields.' })
		setBusy('create')
		setMsg(null)
		try {
			const r = await adminCreateInvoice({ data: asInput() })
			if (r.ok) {
				setCreated(r.invoice)
				setMsg({ kind: 'ok', text: `Draft invoice ${r.invoice.id} created through the Whop Invoices API.` })
				router.invalidate()
			} else {
				setErrors((r.errors ?? {}) as InvoiceErrors)
				setMsg({ kind: 'err', text: r.message })
			}
		} catch (err) {
			setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Request failed.' })
		} finally {
			setBusy(null)
		}
	}

	async function issue(id: string) {
		if (busy) return
		setBusy(id)
		setMsg(null)
		try {
			const r = await adminIssueInvoice({ data: { id } })
			setMsg(r.ok ? { kind: 'ok', text: `Invoice ${id} is now ${r.invoice.status}.` } : { kind: 'err', text: r.message })
			if (r.ok) setCreated(null)
			router.invalidate()
		} catch (err) {
			setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Request failed.' })
		} finally {
			setBusy(null)
		}
	}

	const E = ({ k }: { k: keyof InvoiceErrors }) => (errors[k] ? <p className="mt-1 text-sm text-red-700">{errors[k]}</p> : null)

	return (
		<main className="admin-shell min-h-screen">
			<header className="admin-topbar">
				<Logo light={false} href="/" className="admin-site-logo" />
				<div className="admin-topbar-right"><span className="admin-avatar">{data.name.slice(0, 1).toUpperCase()}</span><span className="hidden sm:block">{data.name}</span><a href="/api/oauth/logout" className="admin-logout"><LogOut size={16} aria-hidden /> Sign out</a></div>
			</header>
			<div className="admin-content">
				<div className="admin-hero">
					<div><div className="admin-kicker"><Sparkles size={14} aria-hidden /> OPERATIONS OVERVIEW <span className="admin-live"><i /> LIVE</span></div><h1>Good work starts <span>here.</span></h1><p>Manage new opportunities, prepare quotes, and keep every project moving.</p></div>
					<button type="button" className="admin-cta" onClick={() => goToTab('invoice-form')}><Plus size={17} aria-hidden /> Create invoice</button>
				</div>
				<nav className="admin-tabs" aria-label="Dashboard sections">
					<button type="button" className={activeTab === 'overview' ? 'active' : ''} aria-current={activeTab === 'overview' ? 'page' : undefined} onClick={() => goToTab('overview')}><LayoutDashboard size={16} /> Overview</button>
					<button type="button" className={activeTab === 'leads' ? 'active' : ''} aria-current={activeTab === 'leads' ? 'page' : undefined} onClick={() => goToTab('leads')}><UsersRound size={16} /> Leads <b>{data.leads.length}</b></button>
					<button type="button" className={activeTab === 'invoice-form' ? 'active' : ''} aria-current={activeTab === 'invoice-form' ? 'page' : undefined} onClick={() => goToTab('invoice-form')}><FilePlus2 size={16} /> New invoice</button>
					<button type="button" className={activeTab === 'invoices' ? 'active' : ''} aria-current={activeTab === 'invoices' ? 'page' : undefined} onClick={() => goToTab('invoices')}><ReceiptText size={16} /> Invoices <b>{data.invoices.length}</b></button>
				</nav>
				{activeTab === 'overview' && <section className="admin-page admin-overview-page" aria-label="Business overview">
				<div className="admin-metrics">
					<Metric icon={<UsersRound size={18} />} label="Incoming leads" value={data.leads.length} hint="Website estimate requests" tone="blue" />
					<Metric icon={<ClipboardList size={18} />} label="Quotes in progress" value={acceptedQuotes} hint="Accepted or deposit received" tone="orange" />
					<Metric icon={<ReceiptText size={18} />} label="Invoices to action" value={openInvoices} hint="Draft or awaiting payment" tone="purple" />
					<Metric icon={<ArrowUpRight size={18} />} label="Invoices collected" value={collectedInvoices} hint="Paid in full" tone="green" />
				</div>
				<div className="admin-overview-bottom">
					<article className="admin-quick-card"><div className="admin-section-kicker">WORK QUEUE</div><h2>Keep projects moving</h2><p>{data.leads.length ? `${data.leads.length} estimate request${data.leads.length === 1 ? '' : 's'} in your pipeline.` : 'New estimate requests will appear in your pipeline.'} {openInvoices ? `${openInvoices} invoice${openInvoices === 1 ? ' needs' : 's need'} attention.` : 'No invoices need attention right now.'}</p><button type="button" onClick={() => goToTab('leads')}>Open lead pipeline <ArrowDownRight size={15} /></button></article>
					<article className="admin-quick-card admin-quick-card-accent"><div className="admin-section-kicker">QUICK ACTION</div><h2>Ready to bill a project?</h2><p>Create a clear final invoice from the approved project total and payments already received.</p><button type="button" onClick={() => goToTab('invoice-form')}>Create an invoice <Plus size={15} /></button></article>
				</div>
				</section>}

			{msg && <p role={msg.kind === 'err' ? 'alert' : 'status'} className={`admin-notice mt-6 rounded-lg border p-4 text-sm ${msg.kind === 'err' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{msg.text}</p>}

			{activeTab === 'leads' && <section aria-labelledby="leads-h" className="admin-page admin-section">
				<div className="admin-section-head"><div><div className="admin-section-kicker">YOUR PIPELINE</div><h2 id="leads-h">Leads &amp; quotes</h2><p>Turn estimate requests into clear, customer-ready project quotes.</p></div><span className="admin-count">{data.leads.length} total</span></div>
				<div className="mt-4 grid gap-4 lg:grid-cols-2">
					{data.leads.length === 0 && <p className="text-sm text-muted">No estimate requests yet.</p>}
					{data.leads.map((l) => <LeadCard key={l.id} lead={l} onUse={() => useQuote(l)} onSaved={() => router.invalidate()} setMsg={setMsg} />)}
				</div>
			</section>}

			{(activeTab === 'invoice-form' || activeTab === 'invoices') && <div className="admin-workspace admin-page admin-workspace-single">
				{activeTab === 'invoice-form' && <form id="invoice-form" onSubmit={create} noValidate className="admin-panel space-y-5">
					<div className="admin-section-head"><div><div className="admin-section-kicker">PAYMENTS</div><h2><FilePlus2 size={20} /> Create final invoice</h2><p>Prepare the remaining balance for a completed project.</p></div></div>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="text-sm font-semibold">Project reference<input className={field} value={f.projectRef} onChange={set('projectRef')} aria-invalid={!!errors.projectRef} placeholder="DEMO-1042" /><E k="projectRef" /></label>
						<label className="text-sm font-semibold">Customer name<input className={field} value={f.customerName} onChange={set('customerName')} aria-invalid={!!errors.customerName} /><E k="customerName" /></label>
						<label className="text-sm font-semibold sm:col-span-2">Customer email<input type="email" className={field} value={f.customerEmail} onChange={set('customerEmail')} aria-invalid={!!errors.customerEmail} /><E k="customerEmail" /></label>
						<label className="text-sm font-semibold">Approved total project price ($)<input inputMode="decimal" className={field} value={f.approvedTotal} onChange={set('approvedTotal')} aria-invalid={!!errors.approvedTotal} /><E k="approvedTotal" /></label>
						<label className="text-sm font-semibold">Deposit already paid ($)<input inputMode="decimal" className={field} value={f.depositPaid} onChange={set('depositPaid')} aria-invalid={!!errors.depositPaid} /><E k="depositPaid" /></label>
						<label className="text-sm font-semibold">Other recorded payments ($)<input inputMode="decimal" className={field} value={f.otherPayments} onChange={set('otherPayments')} aria-invalid={!!errors.otherPayments} /><E k="otherPayments" /></label>
						<div className="text-sm font-semibold">Remaining balance
							<p className="mt-1.5 flex min-h-12 items-center rounded-lg bg-navy px-4 font-display text-xl text-white">{balance == null ? '—' : balance <= 0 ? 'Nothing owed' : `$${balance.toFixed(2)}`}</p>
							{balance != null && balance > 0 && <button type="button" onClick={() => setF((p) => ({ ...p, finalAmount: balance.toFixed(2) }))} className="mt-1 text-xs underline">Use as final amount</button>}
						</div>
						<label className="text-sm font-semibold">Final invoice amount ($)<input inputMode="decimal" className={field} value={f.finalAmount} onChange={set('finalAmount')} aria-invalid={!!errors.finalAmount} /><E k="finalAmount" /></label>
						<label className="text-sm font-semibold">Due date<input type="date" className={field} value={f.dueDate} onChange={set('dueDate')} aria-invalid={!!errors.dueDate} /><E k="dueDate" /></label>
						<label className="text-sm font-semibold sm:col-span-2">Invoice description<input className={field} value={f.description} onChange={set('description')} aria-invalid={!!errors.description} placeholder="Final balance for roof replacement" /><E k="description" /></label>
						<label className="text-sm font-semibold sm:col-span-2">Deposit payment ID (optional, verified as paid)<input className={field} value={f.depositPaymentId} onChange={set('depositPaymentId')} aria-invalid={!!errors.depositPaymentId} placeholder="pay_…" /><E k="depositPaymentId" /></label>
					</div>
					<fieldset className="rounded-lg border border-line bg-paper p-4">
						<legend className="px-2 text-sm font-semibold">Saved payment method (optional)</legend>
						<p className="text-xs text-muted">Only if the customer authorized a saved card for this final invoice. Issuing then charges that method.</p>
						<div className="mt-3 grid gap-4 sm:grid-cols-2">
							<label className="text-sm font-semibold">Member ID<input className={field} value={f.memberId} onChange={set('memberId')} placeholder="mber_…" /></label>
							<label className="text-sm font-semibold">Payment method ID<input className={field} value={f.paymentMethodId} onChange={set('paymentMethodId')} aria-invalid={!!errors.paymentMethodId} placeholder="payt_…" /><E k="paymentMethodId" /></label>
						</div>
						<label className="mt-3 flex items-start gap-3 text-sm"><input type="checkbox" checked={f.chargeSavedMethod === 'true'} onChange={set('chargeSavedMethod')} className="mt-0.5 size-5 accent-[#F97316]" />The customer authorized charging this saved method for this invoice.</label>
					</fieldset>
					<button disabled={busy === 'create'} className="admin-submit inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 font-semibold text-white disabled:opacity-60">
						{busy === 'create' && <Loader2 className="size-4 animate-spin" aria-hidden />} Create draft invoice
					</button>
				</form>}

				{activeTab === 'invoices' && <section aria-labelledby="inv-h" className="admin-invoice-column">
					<div className="admin-section-head"><div><div className="admin-section-kicker">RECEIVABLES</div><h2 id="inv-h"><ReceiptText size={20} /> Invoices</h2><p>Recent payment requests and their status.</p></div><span className="admin-count">{data.invoices.length} total</span></div>
					<div className="mt-4 space-y-4">
						{created && !data.invoices.some((i) => i.id === created.id) && <InvoiceCard inv={created} onIssue={issue} busy={busy === created.id} />}
						{data.listError && <p className="text-sm text-red-700">{data.listError}</p>}
						{data.invoices.length === 0 && !data.listError && !created && <p className="text-sm text-muted">No invoices yet.</p>}
						{data.invoices.map((i) => <InvoiceCard key={i.id} inv={i} onIssue={issue} busy={busy === i.id} />)}
					</div>
				</section>}
			</div>}
			</div>
		</main>
	)
}

function Metric({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: number; hint: string; tone: 'blue' | 'orange' | 'purple' | 'green' }) {
	return <article className="admin-metric"><span className={`admin-metric-icon ${tone}`}>{icon}</span><span className="admin-metric-label">{label}</span><strong>{value.toString().padStart(2, '0')}</strong><span className="admin-metric-hint">{hint}</span><ArrowDownRight className="admin-metric-arrow" size={17} aria-hidden /></article>
}

function LeadCard({ lead, onUse, onSaved, setMsg }: { lead: LeadRow; onUse: () => void; onSaved: () => void; setMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
	const q = lead.quote
	const locked = q.status === 'accepted' || q.status === 'deposit_paid'
	const [open, setOpen] = useState(false)
	const [scope, setScope] = useState(q.scope)
	const [total, setTotal] = useState(q.total ? String(q.total) : '')
	const [valid, setValid] = useState(q.validUntil)
	const [terms, setTerms] = useState(q.terms || 'The $500 deposit is credited toward the total. The remaining balance is invoiced after the work is complete. Work outside this scope needs a separate written estimate.')
	const [busy, setBusy] = useState(false)
	const [path, setPath] = useState(lead.quotePath)
	const link = path ? `${typeof window === 'undefined' ? '' : window.location.origin}${path}` : ''

	async function save() {
		if (busy) return
		setBusy(true)
		try {
			const r = await adminSaveQuote({ data: { leadId: lead.id, scope, total: Number(total), terms, validUntil: valid } })
			if (r.ok) {
				setPath(r.path)
				setMsg({ kind: 'ok', text: `Quote saved for ${lead.name}. Copy the private link below and send it to the customer.` })
				setOpen(false)
				onSaved()
			} else setMsg({ kind: 'err', text: r.message })
		} catch (e) {
			setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Request failed.' })
		} finally {
			setBusy(false)
		}
	}

	const badge: Record<string, string> = { none: 'No quote', sent: 'Quote sent', accepted: 'Accepted', deposit_paid: 'Deposit paid', expired: 'Expired' }
	return (
		<article className="rounded-card border border-line bg-paper p-5">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div>
					<p className="font-display text-lg font-extrabold">{lead.name}</p>
					<p className="text-xs text-muted">{lead.service} · {lead.location} · {lead.id}</p>
				</div>
				<span className="rounded-full bg-card px-3 py-1 text-xs font-bold uppercase">{badge[q.status]}</span>
			</div>
			<p className="mt-3 text-sm text-muted">{lead.email} · {lead.phone}</p>
			{lead.description && <p className="mt-2 line-clamp-3 text-sm">{lead.description}</p>}
			{q.status !== 'none' && <p className="mt-3 text-sm font-semibold">Quote total ${q.total.toFixed(2)} · valid until {q.validUntil}</p>}
			{link && (
				<div className="mt-3">
					<label className="text-xs font-semibold text-muted" htmlFor={`l-${lead.id}`}>Private customer link</label>
					<div className="mt-1 flex gap-2">
						<input id={`l-${lead.id}`} readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-card px-3 text-xs" />
						<button type="button" onClick={() => navigator.clipboard?.writeText(link).then(() => setMsg({ kind: 'ok', text: 'Link copied.' }))} className="min-h-11 rounded-full border border-navy/20 px-4 text-sm font-semibold">Copy</button>
					</div>
				</div>
			)}
			<div className="mt-4 flex flex-wrap gap-3">
				{!locked && <button type="button" onClick={() => setOpen((o) => !o)} className="min-h-11 rounded-full bg-navy px-5 text-sm font-semibold text-white">{q.status === 'none' ? 'Write quote' : 'Edit quote'}</button>}
				{locked && <button type="button" onClick={onUse} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-navy">Use for final invoice</button>}
			</div>
			{open && (
				<div className="mt-4 space-y-3 border-t border-line pt-4">
					<label className="block text-sm font-semibold">Scope of work<textarea rows={4} maxLength={450} value={scope} onChange={(e) => setScope(e.target.value)} className={`${field} py-3`} /></label>
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="block text-sm font-semibold">Approved total ($)<input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} className={field} /></label>
						<label className="block text-sm font-semibold">Valid until<input type="date" value={valid} onChange={(e) => setValid(e.target.value)} className={field} /></label>
					</div>
					<label className="block text-sm font-semibold">Deposit and payment terms<textarea rows={3} maxLength={450} value={terms} onChange={(e) => setTerms(e.target.value)} className={`${field} py-3`} /></label>
					<button type="button" disabled={busy} onClick={save} className="min-h-11 rounded-full bg-accent px-6 text-sm font-semibold text-navy disabled:opacity-60">{busy ? 'Saving…' : 'Save and generate link'}</button>
				</div>
			)}
		</article>
	)
}
