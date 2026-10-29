import { Factory, PackageSearch, Cog, ArrowRight, FileText, ClipboardCheck, MessageSquare } from 'lucide-react'
import { about, site } from '../content'

const highlightIcons = [Factory, Cog, PackageSearch]
const highlights = about.highlights.map((title, i) => ({ icon: highlightIcons[i % 3], title }))
const steps = [
  { icon: MessageSquare, title: 'Share your requirement', text: 'Tell us about the product, application or replacement component. Add a photograph or drawing if helpful.' },
  { icon: ClipboardCheck, title: 'Technical review', text: 'Our team reviews the details and discusses manufacturing, sourcing or repair feasibility with you.' },
  { icon: FileText, title: 'Discuss a quotation', text: 'Confirm the scope and commercial requirements with the team before proceeding.' },
]

function AboutVisual() {
  if (site.media.workshopPhoto) {
    return (
      <img
        src={site.media.workshopPhoto}
        alt="Arte Industries workshop in Mumbai"
        loading="lazy"
        className="h-full min-h-[440px] w-full object-cover"
      />
    )
  }
  return <RequirementProcess />
}

function RequirementProcess() {
  return (
    <div className="flex h-full flex-col justify-center bg-navy-900 px-6 py-12 text-white sm:px-12 lg:px-16">
      <h3 className="text-2xl font-extrabold">From requirement to quotation</h3>
      <ol className="mt-8 space-y-7">
        {steps.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/10"><Icon className="size-5 text-cta" aria-hidden="true" /></span><div><h4 className="font-bold">{title}</h4><p className="mt-1 max-w-md text-sm leading-relaxed text-white/80">{text}</p></div></li>)}
      </ol>
      <a href="#enquiry" className="mt-8 inline-flex items-center gap-2 self-start font-bold text-white underline decoration-cta underline-offset-8">Discuss your requirement <ArrowRight className="size-4" aria-hidden="true" /></a>
    </div>
  )
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="bg-white">
      <div className="grid lg:grid-cols-2">
        <div className="order-2 lg:order-1 lg:min-h-[440px]">
          <AboutVisual />
        </div>
        <div className="container-x order-1 py-14 lg:order-2 lg:mx-0 lg:max-w-[640px] lg:py-16 lg:pl-14">
          <h2 id="about-title" className="h2 max-w-[480px]">
            {about.heading}
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            {about.body}
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0">
            {highlights.map(({ icon: Icon, title }, i) => (
              <li
                key={title}
                className={`flex items-center gap-3 sm:flex-col sm:items-start sm:px-5 ${
                  i === 0 ? 'sm:pl-0' : 'sm:border-l sm:border-line'
                }`}
              >
                <Icon className="size-8 shrink-0 text-navy-900" strokeWidth={1.4} aria-hidden="true" />
                <span className="text-[13px] leading-snug font-bold text-navy-900">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {site.media.workshopPhoto && <div className="container-x py-10"><RequirementProcess /></div>}
    </section>
  )
}
