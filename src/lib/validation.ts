import { site } from '#/config/site'

export type EstimateInput = {
	name: string
	email: string
	phone: string
	address: string
	city: string
	state: string
	service: string
	description: string
	contactMethod: string
	preferredDate: string
	consent: boolean
	website: string // honeypot, must stay empty
	submissionId: string
}

export type FieldErrors = Partial<Record<keyof EstimateInput, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const US_STATES: Record<string, string> = {
	AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

/** Accepts "TX", "tx" or "Texas" and returns the two-letter code, or null. */
export function normalizeState(input: string): string | null {
	const v = (input ?? '').trim()
	if (US_STATES[v.toUpperCase()]) return v.toUpperCase()
	const hit = Object.entries(US_STATES).find(([, name]) => name.toLowerCase() === v.toLowerCase())
	return hit ? hit[0] : null
}

export function validateEstimate(v: EstimateInput): FieldErrors {
	const e: FieldErrors = {}
	const t = (s: string) => (s ?? '').trim()
	if (t(v.name).length < 2) e.name = 'Enter your full name.'
	if (!EMAIL.test(t(v.email))) e.email = 'Enter a valid email address, like name@example.com.'
	if (t(v.phone).replace(/\D/g, '').length < 10) e.phone = 'Enter a phone number with area code.'
	if (t(v.address).length < 5) e.address = 'Enter the property street address.'
	if (t(v.city).length < 2) e.city = 'Enter the city.'
	if (!normalizeState(v.state)) e.state = 'Choose your state.'
	if (!site.estimate.serviceOptions.includes(v.service)) e.service = 'Choose the service you need.'
	if (t(v.description).length < 10) e.description = 'Describe the project or problem in at least a sentence.'
	if (t(v.description).length > 2000) e.description = 'Keep the description under 2,000 characters.'
	if (!site.estimate.contactMethods.includes(v.contactMethod)) e.contactMethod = 'Choose how we should contact you.'
	if (t(v.preferredDate)) {
		const d = new Date(`${v.preferredDate}T00:00:00`)
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		if (Number.isNaN(d.getTime()) || d < today) e.preferredDate = 'Choose a date that is today or later.'
	}
	if (!v.consent) e.consent = 'Please confirm that we may contact you about this request.'
	return e
}

/** Money helpers work in integer cents to avoid floating point drift. */
export const toCents = (n: number) => Math.round(n * 100)
export const fromCents = (c: number) => c / 100

export type BalanceInput = {
	approvedTotal: number
	depositPaid: number
	otherPayments: number
}

export function computeBalance({ approvedTotal, depositPaid, otherPayments }: BalanceInput) {
	return fromCents(toCents(approvedTotal) - toCents(depositPaid) - toCents(otherPayments))
}

export type InvoiceInput = {
	projectRef: string
	customerName: string
	customerEmail: string
	approvedTotal: number
	depositPaid: number
	otherPayments: number
	finalAmount: number
	dueDate: string
	description: string
	depositPaymentId: string
	memberId: string
	paymentMethodId: string
	chargeSavedMethod: boolean
}

export type InvoiceErrors = Partial<Record<keyof InvoiceInput | 'form', string>>

export function validateInvoice(v: InvoiceInput): InvoiceErrors {
	const e: InvoiceErrors = {}
	const money = (n: number) => Number.isFinite(n) && n >= 0 && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6
	if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,39}$/.test(v.projectRef.trim()))
		e.projectRef = 'Use 3 to 40 letters, numbers, dashes or underscores.'
	if (v.customerName.trim().length < 2) e.customerName = 'Enter the customer name.'
	if (!EMAIL.test(v.customerEmail.trim())) e.customerEmail = 'Enter a valid customer email.'
	if (!money(v.approvedTotal) || v.approvedTotal <= 0) e.approvedTotal = 'Enter the approved total in dollars, with at most two decimals.'
	if (!money(v.depositPaid)) e.depositPaid = 'Enter a valid deposit amount (0 or more).'
	if (!money(v.otherPayments)) e.otherPayments = 'Enter a valid amount (0 or more).'
	if (!money(v.finalAmount) || v.finalAmount <= 0) e.finalAmount = 'Enter a final amount greater than zero.'
	if (!e.approvedTotal && !e.depositPaid && !e.otherPayments) {
		const balance = computeBalance(v)
		if (balance <= 0) e.form = 'The deposit and other payments already cover the approved total. There is no balance to invoice.'
		else if (!e.finalAmount && toCents(v.finalAmount) !== toCents(balance))
			e.finalAmount = `The final invoice must equal the remaining balance of $${balance.toFixed(2)}.`
	}
	if (v.dueDate) {
		const d = new Date(`${v.dueDate}T23:59:59`)
		if (Number.isNaN(d.getTime()) || d < new Date()) e.dueDate = 'Choose a due date in the future.'
	} else e.dueDate = 'Choose a due date.'
	if (v.description.trim().length < 5) e.description = 'Add a short invoice description.'
	if (v.chargeSavedMethod && (!v.memberId.trim() || !v.paymentMethodId.trim()))
		e.paymentMethodId = 'Charging a saved method needs both the member ID (mber_) and payment method ID (payt_).'
	return e
}
