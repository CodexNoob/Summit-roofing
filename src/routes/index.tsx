import { createFileRoute } from '@tanstack/react-router'
import { CheckoutProvider } from '#/components/CheckoutProvider'
import { Navigation } from '#/components/Navigation'
import { Hero } from '#/components/Hero'
import { Trust } from '#/components/Trust'
import { Services } from '#/components/Services'
import { Process } from '#/components/Process'
import { Pricing } from '#/components/Pricing'
import { Financing } from '#/components/Financing'
import { WhyChoose } from '#/components/WhyChoose'
import { Testimonials } from '#/components/Testimonials'
import { ServiceAreas } from '#/components/ServiceAreas'
import { Faq } from '#/components/Faq'
import { EstimateForm } from '#/components/EstimateForm'
import { Contact } from '#/components/Contact'
import { Footer } from '#/components/Footer'

export const Route = createFileRoute('/')({
	head: () => ({
		meta: [
			{ title: 'Summit Roofing Co. | A Stronger Roof. A Safer Home.' },
			{ name: 'description', content: 'Roof repair, replacement and inspection with transparent pricing, online deposits and simple final invoices.' },
		],
	}),
	component: Home,
})

function Home() {
	return (
		<CheckoutProvider>
			<Navigation />
			<main>
				<Hero />
				<Trust />
				<Services />
				<Process />
				<Pricing />
				<Financing />
				<WhyChoose />
				<Testimonials />
				<ServiceAreas />
				<Faq />
				<EstimateForm />
				<Contact />
			</main>
			<Footer />
		</CheckoutProvider>
	)
}
