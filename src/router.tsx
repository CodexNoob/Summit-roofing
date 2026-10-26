import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', fontFamily: 'Inter, sans-serif', padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800 }}>Page not found</h1>
          <p style={{ color: '#64748B', margin: '12px 0 24px' }}>That page does not exist on Summit Roofing Co.</p>
          <a href="/" style={{ background: '#F97316', color: '#101B2B', padding: '14px 28px', borderRadius: 999, fontWeight: 600, textDecoration: 'none' }}>Back to home</a>
        </div>
      </main>
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
