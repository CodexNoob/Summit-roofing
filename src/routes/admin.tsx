import { useEffect, useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowDownRight, ClipboardList, LayoutDashboard, LogOut, Sparkles, UsersRound } from 'lucide-react'
import { site } from '#/config/site'
import { adminListLeads, adminSaveQuote, adminStatus, type LeadRow } from '#/lib/api'
import { Logo } from '#/components/Navigation'

export const Route = createFileRoute('/admin')({
	head: () => ({ meta: [{ title: `Operator console | ${site.name}` }, { name: 'robots', content: 'noindex' }] }),
	loader: async () => {
		const s = await adminStatus()
		if (!s.ok) return { access: s.reason, name: '', leads: [] as LeadRow[], listError: '' }
		const [leads] = await Promise.allSettled([adminListLeads()])
		const err = [leads].flatMap((r) => (r.status === 'rejected' ? [r.reason instanceof Error ? r.reason.message : 'Request failed.'] : []))
		return {
			access: 'ok' as const,
			name: s.name,
			leads: leads.status === 'fulfilled' ? leads.value : ([] as LeadRow[]),
			listError: err.join(' '),
		}
	},
	component: Admin,
})

const field = 'mt-1.5 block min-h-12 w-full rounded-lg border border-line bg-paper px-4 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-accent/40 aria-[invalid=true]:border-red-500'

function Admin() {
	const data = Route.useLoaderData()
	const router = useRouter()
	const [activeTab, setActiveTab] = useState('overview')
	useEffect(() => {
		const validTabs = ['overview', 'leads']
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
	const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

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

	const acceptedQuotes = data.leads.filter((lead) => lead.quote.status === 'accepted' || lead.quote.status === 'deposit_paid').length

	return (
		<main className="admin-shell min-h-screen">
			<header className="admin-topbar">
				<Logo light={false} href="/" className="admin-site-logo" />
				<div className="admin-topbar-right"><span className="admin-avatar">{data.name.slice(0, 1).toUpperCase()}</span><span className="hidden sm:block">{data.name}</span><a href="/api/oauth/logout" className="admin-logout"><LogOut size={16} aria-hidden /> Sign out</a></div>
			</header>
			<div className="admin-content">
				<div className="admin-hero">
					<div><div className="admin-kicker"><Sparkles size={14} aria-hidden /> OPERATIONS OVERVIEW <span className="admin-live"><i /> LIVE</span></div><h1>Good work starts <span>here.</span></h1><p>Manage new opportunities, prepare quotes, and keep every project moving.</p></div>
				</div>
				<nav className="admin-tabs" aria-label="Dashboard sections">
					<button type="button" className={activeTab === 'overview' ? 'active' : ''} aria-current={activeTab === 'overview' ? 'page' : undefined} onClick={() => goToTab('overview')}><LayoutDashboard size={16} /> Overview</button>
					<button type="button" className={activeTab === 'leads' ? 'active' : ''} aria-current={activeTab === 'leads' ? 'page' : undefined} onClick={() => goToTab('leads')}><UsersRound size={16} /> Leads <b>{data.leads.length}</b></button>
				</nav>
				{activeTab === 'overview' && <section className="admin-page admin-overview-page" aria-label="Business overview">
				<div className="admin-metrics">
					<Metric icon={<UsersRound size={18} />} label="Incoming leads" value={data.leads.length} hint="Website estimate requests" tone="blue" />
					<Metric icon={<ClipboardList size={18} />} label="Active projects" value={acceptedQuotes} hint="Quote accepted or deposit received" tone="orange" />
					<Metric icon={<ClipboardList size={18} />} label="Quotes sent" value={data.leads.filter((lead) => lead.quote.status === 'sent').length} hint="Waiting for customer response" tone="purple" />
					<Metric icon={<ClipboardList size={18} />} label="Deposits received" value={data.leads.filter((lead) => lead.quote.status === 'deposit_paid').length} hint="Confirmed through Whop checkout" tone="green" />
				</div>
				<div className="admin-overview-bottom">
					<article className="admin-quick-card"><div className="admin-section-kicker">WORK QUEUE</div><h2>Keep projects moving</h2><p>{data.leads.length ? `${data.leads.length} estimate request${data.leads.length === 1 ? '' : 's'} in your pipeline.` : 'New estimate requests will appear in your pipeline.'} Review requests and prepare customer-ready quotes here.</p><button type="button" onClick={() => goToTab('leads')}>Open lead pipeline <ArrowDownRight size={15} /></button></article>
					<article className="admin-quick-card admin-quick-card-accent"><div className="admin-section-kicker">PAYMENTS</div><h2>Payment tracking lives in Whop</h2><p>Use the Whop Payments dashboard to review transactions and confirm who has paid. Deposit status also appears on each lead.</p><button type="button" onClick={() => goToTab('leads')}>Review deposits <ArrowDownRight size={15} /></button></article>
				</div>
				</section>}

			{msg && <p role={msg.kind === 'err' ? 'alert' : 'status'} className={`admin-notice mt-6 rounded-lg border p-4 text-sm ${msg.kind === 'err' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{msg.text}</p>}

			{activeTab === 'leads' && <section aria-labelledby="leads-h" className="admin-page admin-section">
				<div className="admin-section-head"><div><div className="admin-section-kicker">YOUR PIPELINE</div><h2 id="leads-h">Leads &amp; quotes</h2><p>Turn estimate requests into clear, customer-ready project quotes.</p></div><span className="admin-count">{data.leads.length} total</span></div>
				{data.listError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{data.listError}</p>}
				<div className="mt-4 grid gap-4 lg:grid-cols-2">
					{data.leads.length === 0 && <p className="text-sm text-muted">No estimate requests yet.</p>}
				{data.leads.map((l) => <LeadCard key={l.id} lead={l} onSaved={() => router.invalidate()} setMsg={setMsg} />)}
				</div>
			</section>}

			</div>
		</main>
	)
}

function Metric({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: number; hint: string; tone: 'blue' | 'orange' | 'purple' | 'green' }) {
	return <article className="admin-metric"><span className={`admin-metric-icon ${tone}`}>{icon}</span><span className="admin-metric-label">{label}</span><strong>{value.toString().padStart(2, '0')}</strong><span className="admin-metric-hint">{hint}</span><ArrowDownRight className="admin-metric-arrow" size={17} aria-hidden /></article>
}

function LeadCard({ lead, onSaved, setMsg }: { lead: LeadRow; onSaved: () => void; setMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
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
	const daysUntilExpiry = q.validUntil ? Math.ceil((new Date(`${q.validUntil}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null
	const dueSoon = q.status === 'sent' && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 3
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
			{dueSoon && <p role="status" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">Quote expires {daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`}.</p>}
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
				{locked && <p className="self-center text-sm font-medium text-muted">{q.status === 'deposit_paid' ? 'Deposit confirmed. Review the transaction in Whop Payments.' : 'Quote accepted. Manage payments in Whop.'}</p>}
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
