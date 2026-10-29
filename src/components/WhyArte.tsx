import { BarChart3, Factory, Gem, Globe, Handshake, Settings2, ShieldCheck, Truck, Users, Wrench, type LucideIcon } from 'lucide-react'
import { whySection, type WhyIcon } from '../content'

const icons: Record<WhyIcon, LucideIcon> = {
  gem: Gem,
  users: Users,
  settings: Settings2,
  chart: BarChart3,
  shield: ShieldCheck,
  wrench: Wrench,
  factory: Factory,
  handshake: Handshake,
  truck: Truck,
  globe: Globe,
}
const reasons = whySection.items.map((r) => ({ ...r, icon: icons[r.icon] ?? Settings2 }))

export function WhyArte() {
  return (
    <section id="why-arte" aria-labelledby="why-title" className="bg-mist py-16 sm:py-20">
      <div className="container-x">
        <p className="eyebrow">{whySection.label}</p>
        <h2 id="why-title" className="h2 mt-3">
          {whySection.heading}
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-lg border border-line bg-white px-6 py-8 text-center transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(8,38,74,0.45)]"
            >
              <Icon className="mx-auto size-10 text-navy-900" strokeWidth={1.3} aria-hidden="true" />
              <h3 className="mt-5 text-[15px] font-extrabold text-navy-900">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
