import type { ReactNode } from 'react'
import { industriesSection, type IndustryIcon } from '../content'

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const art: Record<IndustryIcon, ReactNode> = {
  'rolling-mill': (
      <svg viewBox="0 0 200 140" {...s}>
        <circle cx="70" cy="44" r="26" />
        <circle cx="70" cy="44" r="6" />
        <circle cx="70" cy="104" r="26" />
        <circle cx="70" cy="104" r="6" />
        <path d="M0 74 H44 M96 72 H200 M96 76 H200" />
        <path d="M120 66 h50 M130 82 h50" strokeDasharray="4 6" />
        <path d="M30 10 v124 M110 10 v124" strokeWidth="1" />
      </svg>
  ),
  'conveyor': (
      <svg viewBox="0 0 200 140" {...s}>
        <path d="M20 70 L180 40 M20 92 L180 62" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={30 + i * 28} cy={83 - i * 5.3} r="7" />
        ))}
        <rect x="58" y="42" width="22" height="16" transform="rotate(-10 69 50)" />
        <rect x="118" y="30" width="22" height="16" transform="rotate(-10 129 38)" />
        <path d="M40 100 v30 M150 80 v50 M30 130 h140" strokeWidth="1" />
      </svg>
  ),
  'crusher': (
      <svg viewBox="0 0 200 140" {...s}>
        <circle cx="100" cy="46" r="24" />
        <circle cx="72" cy="96" r="24" />
        <circle cx="128" cy="96" r="24" />
        {[100, 72, 128].map((x, i) => (
          <circle key={i} cx={x} cy={i === 0 ? 46 : 96} r="5" />
        ))}
        <path d="M6 40 L60 60 M10 56 L58 70 M4 72 L52 82" />
        <path d="M150 120 l40 10 M148 130 l40 6" strokeDasharray="5 5" />
      </svg>
  ),
  'cement': (
      <svg viewBox="0 0 200 140" {...s}>
        <rect x="20" y="40" width="26" height="90" rx="3" />
        <rect x="52" y="24" width="26" height="106" rx="3" />
        <path d="M86 98 L186 74 L190 92 L90 116 Z" />
        <circle cx="112" cy="116" r="6" />
        <circle cx="162" cy="104" r="6" />
        <path d="M150 74 v-40 h16 v36" />
        <path d="M0 130 H200" strokeWidth="1" />
      </svg>
  ),
  'gears': (
      <svg viewBox="0 0 200 140" {...s}>
        <circle cx="80" cy="70" r="34" strokeDasharray="7 4" />
        <circle cx="80" cy="70" r="24" />
        <circle cx="80" cy="70" r="7" />
        <circle cx="138" cy="48" r="20" strokeDasharray="6 4" />
        <circle cx="138" cy="48" r="12" />
        <circle cx="140" cy="104" r="16" strokeDasharray="5 4" />
        <circle cx="140" cy="104" r="5" />
      </svg>
  ),
}

const lgCols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' }

export function Industries() {
  const industries = industriesSection.items
  const n = industries.length
  if (!n) return null
  const oddLast = (i: number) => n % 2 === 1 && i === n - 1
  return (
    <section
      id="industries"
      aria-labelledby="industries-title"
      className="relative isolate overflow-hidden bg-navy-900 py-16 text-white sm:py-20"
    >
      <div className="blueprint-grid absolute inset-0 -z-10" aria-hidden="true" />
      <div className="container-x">
        <p className="eyebrow">{industriesSection.label}</p>
        <h2 id="industries-title" className="mt-3 text-[28px] leading-tight font-extrabold sm:text-[34px]">
          {industriesSection.heading}
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] text-white/70">
          {industriesSection.intro}
        </p>
      </div>

      <ul className={`container-x mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 ${lgCols[Math.min(n, 6)]}`}>
        {industries.map((ind, i) => (
          <li
            key={ind.title}
            className={`group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-navy-800 to-navy-950 p-4 ${
              oddLast(i) ? 'col-span-2 aspect-[8/5] sm:col-span-1 sm:aspect-[4/5]' : ''
            }`}
          >
            {ind.photo ? (
              <>
                <img src={ind.photo} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />
              </>
            ) : (
              <div
                className={`absolute top-6 -z-10 text-sky-200/45 transition-colors duration-300 group-hover:text-accent-soft ${
                  oddLast(i) ? 'right-4 w-1/2 sm:inset-x-4 sm:w-auto' : 'inset-x-4'
                }`}
                aria-hidden="true"
              >
                {art[ind.icon] ?? art.gears}
              </div>
            )}
            <span className="mb-3 h-0.5 w-8 bg-cta" aria-hidden="true" />
            <h3 className="text-[15px] leading-snug font-bold">{ind.title}</h3>
          </li>
        ))}
      </ul>
    </section>
  )
}
