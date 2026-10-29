import { ArrowRight } from 'lucide-react'
import { servicesSection, type EnquiryOption } from '../content'
import { GearDrawing } from './Blueprint'

export function Services({ onEnquire }: { onEnquire: (o: EnquiryOption, note?: string) => void }) {
  return (
    <section id="capabilities" aria-labelledby="services-title" className="bg-white py-16 sm:py-20">
      <div className="container-x">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">{servicesSection.label}</p>
            <h2 id="services-title" className="h2 mt-3 max-w-[520px]">
              {servicesSection.heading}
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-muted">
            {servicesSection.intro}
          </p>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {servicesSection.items.map((s) => (
            <li
              key={s.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-[0_18px_40px_-22px_rgba(8,38,74,0.5)]"
            >
              <div className="relative isolate h-44 overflow-hidden bg-gradient-to-br from-navy-800 to-navy-950">
                <div className="blueprint-grid absolute inset-0 -z-10" aria-hidden="true" />
                <GearDrawing className="absolute -top-16 -right-20 -z-10 w-80 text-sky-200/[0.14]" teeth={30} />
                {s.image && <img
                  src={s.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 m-auto h-[78%] w-auto object-contain drop-shadow-[0_16px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.04] max-w-[90%]"
                />}
              </div>
              <div className="flex flex-1 items-start gap-4 p-5">
                <div className="flex-1">
                  <h3 className="text-[17px] font-extrabold text-navy-900">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onEnquire(s.enquiry, s.title)}
                  aria-label={`Enquire about ${s.title}`}
                  className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-navy-900/30 text-navy-900 transition-colors hover:border-cta hover:bg-cta hover:text-navy-900"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
