import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { nav } from '../content'

export function Logo({ variant = 'white', className = '' }: { variant?: 'white' | 'navy'; className?: string }) {
  return (
    <img
      src={`/brand/logo-${variant}.svg`}
      alt="Arte Industries"
      width={203}
      height={90}
      className={className}
    />
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState<string>('#home')
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })
  const pending = useRef<string | null>(null)
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      if (pending.current) return
      let current: string = nav[0].href
      for (const item of nav) {
        const section = document.getElementById(item.href.slice(1))
        if (section && section.getBoundingClientRect().top <= 125) current = item.href
      }
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = '#contact'
      setActive(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const interrupt = () => { pending.current = null; clearTimeout(releaseTimer.current); onScroll() }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('wheel', interrupt, { passive: true })
    window.addEventListener('touchstart', interrupt, { passive: true })
    window.addEventListener('keydown', interrupt)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(releaseTimer.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('wheel', interrupt)
      window.removeEventListener('touchstart', interrupt)
      window.removeEventListener('keydown', interrupt)
    }
  }, [])

  useEffect(() => {
    const list = navRef.current
    if (!list) return
    const measure = () => {
      const link = list.querySelector<HTMLAnchorElement>('a[aria-current="location"]')
      if (!link || !list.offsetWidth) return
      const parent = list.getBoundingClientRect(), rect = link.getBoundingClientRect()
      setIndicator({ x: rect.left - parent.left + 14, width: Math.max(0, rect.width - 28) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    let disposed = false
    document.fonts.ready.then(() => { if (!disposed) measure() })
    return () => { disposed = true; observer.disconnect() }
  }, [active])

  const navigate = (href: string) => {
    setActive(href)
    setOpen(false)
    pending.current = href
    clearTimeout(releaseTimer.current)
    releaseTimer.current = setTimeout(() => {
      pending.current = null
      window.dispatchEvent(new Event('scroll'))
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 1200)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector('a')?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-navy-900/95 shadow-[0_6px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur' : 'bg-navy-900'
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-navy-900"
      >
        Skip to content
      </a>
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <a href="#home" className="shrink-0" aria-label="Arte Industries — back to top">
          <Logo className="h-10 w-auto sm:h-11" />
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul ref={navRef} className="nav-track relative flex items-center">
            <li aria-hidden="true" className="nav-indicator" style={{ opacity: indicator.width ? 1 : 0, transform: `translateX(${indicator.x}px) scaleX(${indicator.width})` }} />
            {nav.map((item, i) => (
              <li key={item.href} className="flex items-center">
                {i > 0 && <span className="h-3 w-px bg-white/25" aria-hidden="true" />}
                <a
                  href={item.href}
                  aria-current={active === item.href ? 'location' : undefined}
                  onClick={() => navigate(item.href)}
                  className="nav-link relative rounded-md px-3.5 py-2 text-[13px] font-semibold text-white/85 transition-colors hover:text-white xl:px-4"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a href="#enquiry" className="btn-cta hidden px-5 py-2.5 text-[13px] sm:inline-flex">
            Enquire Now <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-white hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="h-[calc(100dvh-72px)] overflow-y-auto border-t border-white/10 bg-navy-900 lg:hidden"
      >
        <nav aria-label="Mobile" className="container-x py-4">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => navigate(item.href)}
                  aria-current={active === item.href ? 'location' : undefined}
                  className="mobile-nav-link flex items-center justify-between border-b border-white/10 px-3 py-4 text-lg font-semibold text-white"
                >
                  {item.label}
                  <ArrowRight className="size-5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <a href="#enquiry" onClick={() => setOpen(false)} className="btn-cta mt-6 w-full">
            Enquire Now <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  )
}
