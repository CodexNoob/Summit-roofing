import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CheckCircle2, Loader2, LogIn } from 'lucide-react'
import { site } from '#/config/site'
import { container, Eyebrow } from '#/components/ui'
import { Reveal } from '#/components/Reveal'
import { getVisitor, submitEstimate } from '#/lib/api'
import { US_STATES, validateEstimate, type EstimateInput, type FieldErrors } from '#/lib/validation'
import { track } from '#/lib/track'

const DRAFT_KEY = 'summit_estimate_draft'
const newId = () => crypto.randomUUID()

const empty = (): EstimateInput => ({
	name: '', email: '', phone: '', address: '', city: '', state: '', service: '', description: '',
	contactMethod: '', preferredDate: '', consent: false, website: '', submissionId: newId(),
})

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'auth'

const input =
	'mt-1.5 block min-h-12 w-full rounded-lg border border-line bg-paper px-4 text-base transition placeholder:text-muted/60 hover:border-navy/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-accent/40 aria-[invalid=true]:border-red-500'

export function EstimateForm() {
	const [v, setV] = useState<EstimateInput>(empty)
	const [errors, setErrors] = useState<FieldErrors>({})
	const [touched, setTouched] = useState<Partial<Record<keyof EstimateInput, boolean>>>({})
	const [status, setStatus] = useState<Status>('idle')
	const [message, setMessage] = useState('')
	const [leadId, setLeadId] = useState<string | null>(null)
	const [visitor, setVisitor] = useState<string | null>(null)
	const inFlight = useRef(false)
	const today = new Date().toISOString().slice(0, 10)

	// Restore a draft saved before a Whop sign-in redirect, and any service chosen from a service panel.
	useEffect(() => {
		try {
			const draft = sessionStorage.getItem(DRAFT_KEY)
			const service = sessionStorage.getItem('summit_service')
			setV((prev) => {
				const base = draft ? { ...prev, ...(JSON.parse(draft) as Partial<EstimateInput>), website: '' } : prev
				return service ? { ...base, service } : base
			})
		} catch {
			/* storage unavailable */
		}
		getVisitor().then((r) => setVisitor(r.signedIn ? r.name : null)).catch(() => undefined)
	}, [])

	useEffect(() => {
		const onHash = () => {
			const s = sessionStorage.getItem('summit_service')
			if (s) setV((p) => ({ ...p, service: s }))
		}
		window.addEventListener('hashchange', onHash)
		return () => window.removeEventListener('hashchange', onHash)
	}, [])

	const set = (k: keyof EstimateInput) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const value = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value
		const next = { ...v, [k]: value } as EstimateInput
		setV(next)
		if (touched[k]) setErrors(validateEstimate(next))
	}
	const blur = (k: keyof EstimateInput) => () => {
		setTouched((t) => ({ ...t, [k]: true }))
		setErrors(validateEstimate(v))
	}
	const err = (k: keyof EstimateInput) => (touched[k] ? errors[k] : undefined)

	async function onSubmit(e: FormEvent) {
		e.preventDefault()
		if (inFlight.current || status === 'submitting') return
		const found = validateEstimate(v)
		setErrors(found)
		setTouched(Object.fromEntries(Object.keys(v).map((k) => [k, true])))
		if (Object.keys(found).length) {
			setStatus('error')
			setMessage(`Please fix: ${Object.values(found).join(' ')}`)
			requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
			return
		}
		inFlight.current = true
		setStatus('submitting')
		setMessage('')
		try {
			const r = await submitEstimate({ data: v })
			if (r.ok) {
				sessionStorage.removeItem(DRAFT_KEY)
				sessionStorage.removeItem('summit_service')
				setLeadId(r.leadId)
				setStatus('success')
				// Only after Whop confirmed the Lead exists.
				track('estimate_requested', r.leadId, { lead_id: r.leadId, service: v.service })
			} else if (r.code === 'auth_required') {
				sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...v, website: '' }))
				setStatus('auth')
				setMessage(r.message)
			} else {
				if (r.fieldErrors) setErrors(r.fieldErrors as FieldErrors)
				setStatus('error')
				setMessage(r.message)
			}
		} catch {
			setStatus('error')
			setMessage('Something went wrong sending your request. Nothing was submitted. Please try again.')
		} finally {
			inFlight.current = false
		}
	}

	const submitting = status === 'submitting'

	return (
		<section id="estimate" className="bg-navy py-24 text-white sm:py-32">
			<div className={`${container} grid gap-14 lg:grid-cols-[1fr_1.35fr]`}>
				<Reveal>
					<Eyebrow dark>Free estimate</Eyebrow>
					<h2 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">Tell us about your roof.</h2>
					<p className="mt-5 text-lg text-white/70">Send the details and we will follow up by your preferred method. Requesting an estimate is free and carries no obligation.</p>
					<ul className="mt-8 space-y-3 text-white/70">
						<li>1. Your request is saved as a lead in our Whop account.</li>
						<li>2. We review it and reach out to schedule an inspection.</li>
						<li>3. You get a written scope and price before any work.</li>
					</ul>
				</Reveal>

				<Reveal delay={100} className="rounded-card bg-paper p-6 text-ink sm:p-10">
					{status === 'success' ? (
						<div role="status" className="py-8 text-center">
							<CheckCircle2 className="mx-auto size-14 text-emerald-600" aria-hidden />
							<h3 className="mt-5 font-display text-3xl font-extrabold">Request received</h3>
							<p className="mt-3 text-muted">Whop confirmed your lead{leadId ? ` (${leadId})` : ''}. We will contact you by {v.contactMethod.toLowerCase()} soon.</p>
							<button onClick={() => { setV(empty()); setTouched({}); setErrors({}); setStatus('idle'); setLeadId(null) }} className="mt-6 min-h-11 rounded-full border border-line px-6 font-semibold hover:border-ink">
								Send another request
							</button>
						</div>
					) : (
						<form onSubmit={onSubmit} noValidate aria-describedby="estimate-status">
							<div className="grid gap-5 sm:grid-cols-2">
								<Field label="Full name" id="name" error={err('name')}>
									<input id="name" className={input} autoComplete="name" value={v.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={!!err('name')} aria-describedby={err('name') ? 'name-e' : undefined} required />
								</Field>
								<Field label="Email address" id="email" error={err('email')}>
									<input id="email" type="email" inputMode="email" className={input} autoComplete="email" value={v.email} onChange={set('email')} onBlur={blur('email')} aria-invalid={!!err('email')} aria-describedby={err('email') ? 'email-e' : undefined} required />
								</Field>
								<Field label="Phone number" id="phone" error={err('phone')}>
									<input id="phone" type="tel" inputMode="tel" className={input} autoComplete="tel" value={v.phone} onChange={set('phone')} onBlur={blur('phone')} aria-invalid={!!err('phone')} aria-describedby={err('phone') ? 'phone-e' : undefined} required />
								</Field>
								<Field label="Roofing service required" id="service" error={err('service')}>
									<select id="service" className={input} value={v.service} onChange={set('service')} onBlur={blur('service')} aria-invalid={!!err('service')} aria-describedby={err('service') ? 'service-e' : undefined} required>
										<option value="">Select a service</option>
										{site.estimate.serviceOptions.map((o) => <option key={o}>{o}</option>)}
									</select>
								</Field>
								<div className="sm:col-span-2">
									<Field label="Property address" id="address" error={err('address')}>
										<input id="address" className={input} autoComplete="street-address" value={v.address} onChange={set('address')} onBlur={blur('address')} aria-invalid={!!err('address')} aria-describedby={err('address') ? 'address-e' : undefined} required />
									</Field>
								</div>
								<Field label="City" id="city" error={err('city')}>
									<input id="city" className={input} autoComplete="address-level2" value={v.city} onChange={set('city')} onBlur={blur('city')} aria-invalid={!!err('city')} aria-describedby={err('city') ? 'city-e' : undefined} required />
								</Field>
								<Field label="State" id="state" error={err('state')}>
									<select id="state" className={input} autoComplete="address-level1" value={v.state} onChange={set('state')} onBlur={blur('state')} aria-invalid={!!err('state')} aria-describedby={err('state') ? 'state-e' : undefined} required>
										<option value="">Select a state</option>
										{Object.entries(US_STATES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
									</select>
								</Field>
								<div className="sm:col-span-2">
									<Field label="Describe the project or roofing problem" id="description" error={err('description')}>
										<textarea id="description" rows={4} className={`${input} py-3`} value={v.description} onChange={set('description')} onBlur={blur('description')} aria-invalid={!!err('description')} aria-describedby={err('description') ? 'description-e' : undefined} required />
									</Field>
								</div>
								<Field label="Preferred contact method" id="contactMethod" error={err('contactMethod')}>
									<select id="contactMethod" className={input} value={v.contactMethod} onChange={set('contactMethod')} onBlur={blur('contactMethod')} aria-invalid={!!err('contactMethod')} aria-describedby={err('contactMethod') ? 'contactMethod-e' : undefined} required>
										<option value="">Select one</option>
										{site.estimate.contactMethods.map((o) => <option key={o}>{o}</option>)}
									</select>
								</Field>
								<Field label="Preferred appointment date (optional)" id="preferredDate" error={err('preferredDate')}>
									<input id="preferredDate" type="date" min={today} className={input} value={v.preferredDate} onChange={set('preferredDate')} onBlur={blur('preferredDate')} aria-invalid={!!err('preferredDate')} aria-describedby={err('preferredDate') ? 'preferredDate-e' : undefined} />
								</Field>
							</div>

							{/* Honeypot: hidden from people, tempting to bots. */}
							<div className="absolute -left-[9999px]" aria-hidden>
								<label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></label>
							</div>

							<div className="mt-6">
								<label className="flex cursor-pointer items-start gap-3 text-sm">
									<input type="checkbox" checked={v.consent} onChange={set('consent')} onBlur={blur('consent')} aria-invalid={!!err('consent')} aria-describedby={err('consent') ? 'consent-e' : undefined} className="mt-0.5 size-5 shrink-0 accent-[#F97316]" />
									<span>I agree that {site.name} may contact me about this request by the method I chose.</span>
								</label>
								{err('consent') && <p id="consent-e" className="mt-2 text-sm text-red-700">{err('consent')}</p>}
							</div>

							<div id="estimate-status" aria-live="polite" className="mt-5 empty:hidden">
								{status === 'error' && message && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</p>}
								{status === 'auth' && (
									<div role="alert" className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
										<p>{message} Your answers are saved and will be here when you come back. Your request has not been sent yet.</p>
										<a href={`/api/oauth/login?redirect_to=${encodeURIComponent('/#estimate')}`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 font-semibold text-white">
											<LogIn className="size-4" aria-hidden /> Sign in with Whop
										</a>
									</div>
								)}
							</div>

							<div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
								<button type="submit" disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-8 font-semibold text-navy shadow-[0_8px_24px_-8px_rgba(249,115,22,0.7)] transition hover:bg-[#fb8a3c] disabled:cursor-wait disabled:opacity-70 sm:w-auto">
									{submitting ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Sending…</>) : 'Request my free estimate'}
								</button>
								<p className="text-xs text-muted">{visitor ? `Signed in with Whop as ${visitor}.` : 'You will confirm your identity with a quick Whop sign-in when you send.'}</p>
							</div>
						</form>
					)}
				</Reveal>
			</div>
		</section>
	)
}

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: React.ReactNode }) {
	return (
		<div>
			<label htmlFor={id} className="block text-sm font-semibold">{label}</label>
			{children}
			{hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
			{error && <p id={`${id}-e`} className="mt-1.5 text-sm text-red-700">{error}</p>}
		</div>
	)
}
