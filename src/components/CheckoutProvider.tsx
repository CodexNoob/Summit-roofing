import { createContext, lazy, Suspense, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { site, type PlanKey } from '#/config/site'
import { track } from '#/lib/track'

const CheckoutModal = lazy(() => import('#/components/CheckoutModal').then((m) => ({ default: m.CheckoutModal })))

export type CheckoutExtra = { metadata?: Record<string, string>; onPaid?: (paymentId: string) => void }

const Ctx = createContext<{ openCheckout: (key: PlanKey, extra?: CheckoutExtra) => void }>({ openCheckout: () => undefined })
export const useCheckout = () => useContext(Ctx)

export function CheckoutProvider({ children }: { children: ReactNode }) {
	const [active, setActive] = useState<PlanKey | null>(null)
	const [extra, setExtra] = useState<CheckoutExtra | undefined>()
	const clickSeq = useRef(0)

	const openCheckout = useCallback((key: PlanKey, ex?: CheckoutExtra) => {
		// One event per intentional click on the deposit button, never from renders.
		if (key === 'deposit') {
			clickSeq.current += 1
			const id = `deposit_${Date.now().toString(36)}_${clickSeq.current}`
			track('deposit_started', id, { plan_id: site.plans.deposit.planId, value: site.plans.deposit.price, currency: 'USD' })
		}
		setExtra(ex)
		setActive(key)
	}, [])

	return (
		<Ctx.Provider value={{ openCheckout }}>
			{children}
			{active && (
				<Suspense fallback={null}>
					<CheckoutModal key={active} plan={site.plans[active]} extra={extra} onClose={() => setActive(null)} />
				</Suspense>
			)}
		</Ctx.Provider>
	)
}
