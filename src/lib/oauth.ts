import { site } from '#/config/site'

/** Keep OAuth on the same host that started login so its state cookies are available. */
export function oauthRedirectUri(requestUrl: URL, appId: string): string | null {
	const whopAppHost = `app--${appId.replace(/^app_/, '').toLowerCase()}.whop.site`
	const allowedHosts = new Set([new URL(site.url).hostname, whopAppHost])
	if (!allowedHosts.has(requestUrl.hostname)) return null
	return new URL('/api/oauth/callback', requestUrl.origin).toString()
}
