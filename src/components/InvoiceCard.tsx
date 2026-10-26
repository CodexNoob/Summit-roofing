import { CheckCircle2, ExternalLink } from 'lucide-react'
import type { InvoiceView } from '#/lib/api'

const statusStyle: Record<string, string> = {
	draft: 'bg-slate-100 text-slate-700',
	open: 'bg-orange-100 text-orange-800',
	paid: 'bg-emerald-100 text-emerald-800',
	void: 'bg-slate-200 text-slate-600',
	uncollectible: 'bg-red-100 text-red-800',
}

export function InvoiceCard({ inv, onIssue, busy }: { inv: InvoiceView; onIssue?: (id: string) => void; busy?: boolean }) {
	const money = inv.amount && /^\d/.test(inv.amount) ? `$${inv.amount}` : inv.amount
	return (
		<article className="rounded-card border border-line bg-paper p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-display text-lg font-extrabold">{inv.reference ?? inv.id}</p>
					<p className="text-xs text-muted">Invoice {inv.id}</p>
				</div>
				<span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyle[inv.status] ?? 'bg-slate-100 text-slate-700'}`}>{inv.status}</span>
			</div>
			<dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
				<div><dt className="text-muted">Amount due</dt><dd className="font-semibold">{inv.paid ? 'Paid in full' : (money ?? '—')}</dd></div>
				<div><dt className="text-muted">Due date</dt><dd className="font-semibold">{inv.dueAt ? new Date(inv.dueAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}</dd></div>
				<div className="col-span-2"><dt className="text-muted">Customer</dt><dd className="font-semibold">{inv.customer ?? '—'}</dd></div>
			</dl>
			<div className="mt-4 text-sm text-muted">
				{inv.paid ? (
					<p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="size-4" aria-hidden /> Already paid. No further action.</p>
				) : inv.status === 'draft' ? (
					<p>Draft. Issue it to open the invoice for payment. If a saved payment method was attached, issuing charges it.</p>
				) : inv.payUrl ? (
					<p>Payment instructions: the customer pays online using the Whop payment link below.</p>
				) : (
					<p>Payment instructions: the invoice is open for payment. Share the invoice from your Whop dashboard or confirm delivery to the recipient email there.</p>
				)}
			</div>
			<div className="mt-4 flex flex-wrap gap-3">
				{inv.status === 'draft' && onIssue && (
					<button disabled={busy} onClick={() => onIssue(inv.id)} className="min-h-11 rounded-full bg-accent px-6 text-sm font-semibold text-navy disabled:opacity-60">
						{busy ? 'Issuing…' : 'Issue invoice'}
					</button>
				)}
				{inv.payUrl && !inv.paid && (
					<a href={inv.payUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-navy/20 px-5 text-sm font-semibold hover:border-navy">
						Pay invoice online <ExternalLink className="size-4" aria-hidden />
					</a>
				)}
			</div>
		</article>
	)
}
