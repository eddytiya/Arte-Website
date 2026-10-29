import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { nav, site, whatsappHref } from '../content'
import { Logo } from './Header'

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.25H3V9.75Zm6.5 0h3.83v1.54h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13V21h-4v-4.93c0-1.18-.02-2.69-1.64-2.69-1.64 0-1.89 1.28-1.89 2.6V21h-4V9.75Z" />
    </svg>
  )
}

export function Footer() {
  const wa = whatsappHref()
  const year = new Date().getFullYear()
  return (
    <footer className="bg-navy-950 text-white/75">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1.2fr]">
        <div>
          <Logo className="h-12 w-auto" />
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed">{site.shortDescription}</p>
          {(site.social.linkedin || wa) && (
            <div className="mt-6 flex gap-3">
              {site.social.linkedin && (
                <a
                  href={site.social.linkedin}
                  target="_blank"
                  rel="noopener"
                  aria-label="Arte Industries on LinkedIn"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-accent"
                >
                  <LinkedinIcon className="size-4" />
                </a>
              )}
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener"
                  aria-label="Message Arte Industries on WhatsApp"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-emerald-600"
                >
                  <MessageCircle className="size-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <nav aria-label="Footer">
          <h2 className="text-[13px] font-bold tracking-[0.12em] text-white uppercase">Quick Links</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[14px]">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#enquiry" className="font-semibold text-cta hover:text-white">
                Request a Quote
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-[13px] font-bold tracking-[0.12em] text-white uppercase">Contact</h2>
          <ul className="mt-4 space-y-3 text-[14px]">
            {(site.contact.mobile || site.contact.landline) && <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-cta" aria-hidden="true" />
              <span>
                <a href={site.contact.mobileHref} className="hover:text-white">
                  {site.contact.mobile}
                </a>
                {site.contact.landline && (
                  <>
                    {site.contact.mobile && ' · '}
                    <a href={site.contact.landlineHref} className="hover:text-white">
                      {site.contact.landline}
                    </a>
                  </>
                )}
              </span>
            </li>}
            {site.contact.email && <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-cta" aria-hidden="true" />
              <a href={`mailto:${site.contact.email}`} className="break-all hover:text-white">
                {site.contact.email}
              </a>
            </li>}
            {site.contact.addressLines.length > 0 && <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-cta" aria-hidden="true" />
              <address className="not-italic">{site.contact.addressLines.join(', ')}</address>
            </li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-5 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {site.name}. All rights reserved.</p>
          <p className="flex gap-4">
            <a href="/privacy-policy.html" className="hover:text-white">
              Privacy Policy
            </a>
            <span aria-hidden="true" className="text-white/30">
              |
            </span>
            <a href="/terms.html" className="hover:text-white">
              Terms of Use
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
