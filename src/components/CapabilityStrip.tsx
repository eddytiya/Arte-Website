import { Handshake, Settings, ShieldCheck, Wrench } from 'lucide-react'
import { hero } from '../content'

const icons = [Settings, ShieldCheck, Wrench, Handshake]
const items = hero.principles.map((label, i) => ({ icon: icons[i % icons.length], label }))

export function CapabilityStrip() {
  return (
    <section aria-label="Our principles" className="border-b border-line bg-mist">
      <ul className="container-x grid grid-cols-2 gap-y-6 py-8 md:grid-cols-4 md:py-7">
        {items.map(({ icon: Icon, label }, i) => (
          <li
            key={label}
            className={`flex flex-col items-center gap-2.5 px-3 text-center ${
              i > 0 ? 'md:border-l md:border-navy-900/15' : ''
            } ${i % 2 === 1 ? 'border-l border-navy-900/15 md:border-l' : ''}`}
          >
            <Icon className="size-8 text-navy-900" strokeWidth={1.4} aria-hidden="true" />
            <span className="text-[12px] leading-tight font-extrabold tracking-[0.06em] text-navy-900 uppercase">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
