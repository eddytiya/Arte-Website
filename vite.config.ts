import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localAdmin } from './local-admin.js'

/** Fills SEO tags in index.html from content/settings.json (editable in the admin panel). */
function seoFromSettings(): Plugin {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return {
    name: 'arte-seo-from-settings',
    transformIndexHtml(html) {
      const s = JSON.parse(readFileSync(new URL('./content/settings.json', import.meta.url), 'utf8'))
      const name: string = s.companyName || 'Arte Industries'
      const title: string = s.seoTitle || name
      const description: string = s.seoDescription || s.shortDescription || ''
      const address: string[] = Array.isArray(s.addressLines) ? s.addressLines : []
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url: 'https://www.arteind.com/',
        logo: 'https://www.arteind.com/brand/logo-navy.svg',
        ...(s.email ? { email: s.email } : {}),
        ...(s.mobile ? { telephone: s.mobile } : {}),
        ...(address.length
          ? { address: { '@type': 'PostalAddress', streetAddress: address.join(', '), addressCountry: 'IN' } }
          : {}),
      }
      const contact = [s.email, s.mobile].filter(Boolean).join(' or ')
      return html
        .replaceAll('%SEO_TITLE%', esc(title))
        .replaceAll('%SEO_DESCRIPTION%', esc(description))
        .replaceAll('%COMPANY_NAME%', esc(name))
        .replace('%JSON_LD%', JSON.stringify(jsonLd).replace(/</g, '\\u003c'))
        .replace(
          '%NOSCRIPT%',
          esc(`${name} — industrial gears, gearboxes and component supply. Please enable JavaScript to use the enquiry form${contact ? `, or contact ${contact}` : ''}.`),
        )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoFromSettings(), localAdmin(), {
    name: 'admin-directory-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/admin' || req.url?.startsWith('/admin/')) { _res.statusCode = 404; _res.end('Not found'); return }
        if (req.url === '/studio-7c9e4a2f6b18d035' || req.url === '/studio-7c9e4a2f6b18d035/') req.url = '/studio-7c9e4a2f6b18d035/index.html'
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/admin' || req.url?.startsWith('/admin/')) { _res.statusCode = 404; _res.end('Not found'); return }
        if (req.url === '/studio-7c9e4a2f6b18d035' || req.url === '/studio-7c9e4a2f6b18d035/') req.url = '/studio-7c9e4a2f6b18d035/index.html'
        next()
      })
    },
  }],
})

