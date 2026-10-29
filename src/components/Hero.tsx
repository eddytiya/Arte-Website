import { ArrowRight } from 'lucide-react'
import { GearDrawing, WormDrawing } from './Blueprint'
import { hero } from '../content'

export function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-navy-900 pt-[72px] text-white"
    >
      {/* background art */}
      <div className="blueprint-grid absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_72%_45%,rgba(7,139,229,0.28),transparent_60%)]"
        aria-hidden="true"
      />
      <GearDrawing className="absolute top-[-120px] right-[-180px] -z-10 w-[760px] text-sky-200/[0.13]" />
      <GearDrawing className="absolute bottom-[-260px] left-[-220px] -z-10 w-[520px] text-sky-200/[0.07]" teeth={28} />
      <WormDrawing className="absolute right-[8%] bottom-6 -z-10 hidden w-[420px] text-sky-200/[0.1] lg:block" />

      <div className="container-x grid items-center gap-10 py-14 sm:py-16 lg:min-h-[560px] lg:grid-cols-[1.12fr_1fr] lg:gap-4 lg:py-10">
        <div className="relative z-10 max-w-[640px]">
          {hero.eyebrow && (
            <p className="mb-5 text-[11px] font-bold tracking-[0.18em] text-cta uppercase sm:text-xs">
              {hero.eyebrow.split('|').map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-2 text-white/40">|</span>}
                  {part.trim()}
                </span>
              ))}
            </p>
          )}
          <h1
            id="hero-title"
            className="text-[34px] leading-[1.06] font-extrabold tracking-[-0.015em] uppercase sm:text-[46px] lg:text-[46px] xl:text-[50px]"
          >
            <span className="block lg:whitespace-nowrap">{hero.headingLine1}</span>{' '}
            <span className="block text-accent-soft">{hero.headingLine2}</span>
          </h1>
          <p className="mt-6 max-w-[440px] text-[15px] leading-relaxed text-white/80 sm:text-base">
            {hero.text}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#enquiry" className="btn-cta">
              {hero.primaryButton} <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a href="#products" className="btn-ghost-light">
              {hero.secondaryButton}
            </a>
          </div>
        </div>

        <div className="relative mx-auto aspect-[1.25/1] w-full max-w-[600px] lg:max-w-none">
          <div
            className="absolute inset-x-[6%] bottom-[4%] h-[18%] rounded-[50%] bg-black/40 blur-2xl"
            aria-hidden="true"
          />
          {hero.imageRight && (<img
            src={hero.imageRight}
            alt="Industrial worm reduction gearbox"
            fetchPriority="high"
            className="absolute right-0 bottom-[2%] max-h-[96%] w-[58%] object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]"
          />)}
          {hero.imageLeft && (<img
            src={hero.imageLeft}
            alt="Hardened worm shaft meshed with a bronze worm wheel"
            fetchPriority="high"
            className="absolute top-[0%] left-[2%] max-h-[100%] w-[45%] -rotate-[4deg] object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]"
          />)}
        </div>
      </div>
    </section>
  )
}
