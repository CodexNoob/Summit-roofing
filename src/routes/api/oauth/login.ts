import { createFileRoute } from '@tanstack/react-router'
import { setCookie } from '@tanstack/react-start/server'
import { oauthRedirectUri } from '#/lib/oauth'

const SCOPES = 'openid profile email'

function base64url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function randomString(): string {
	return base64url(crypto.getRandomValues(new Uint8Array(32)))
}
async function challenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
	return base64url(new Uint8Array(digest))
}

export const Route = createFileRoute('/api/oauth/login')({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url)
			const clientId = process.env.APP_ID
			if (!clientId) {
				console.error('[oauth] APP_ID is not configured')
				return Response.json({ error: 'OAuth is not configured on this deployment.' }, { status: 500 })
			}
			const redirectUri = oauthRedirectUri(url, clientId)
			if (!redirectUri) return Response.json({ error: 'OAuth is unavailable on this domain.' }, { status: 400 })
				const verifier = randomString()
				const state = randomString()
				const nonce = randomString()
				const short = { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 } as const

				const wanted = url.searchParams.get('redirect_to') ?? '/'
				setCookie('oauth_return', /^\/(?![/\\])/.test(wanted) ? wanted : '/', short)
				setCookie('oauth_verifier', verifier, short)
				setCookie('oauth_state', state, short)
				setCookie('oauth_nonce', nonce, short)

				const params = new URLSearchParams({
					response_type: 'code',
					client_id: clientId,
					redirect_uri: redirectUri,
					scope: SCOPES,
					state,
					nonce,
					code_challenge: await challenge(verifier),
					code_challenge_method: 'S256',
				})
				return new Response(null, {
					status: 302,
					headers: { Location: `https://api.whop.com/oauth/authorize?${params}` },
				})
			},
		},
	},
})
