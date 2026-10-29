/**
 * Loads all editable content from /content (managed through the admin panel at /studio-7c9e4a2f6b18d035).
 * Every value has a safe fallback so a half-filled entry can never blank the page.
 */
import settingsRaw from '../content/settings.json'
import heroRaw from '../content/sections/hero.json'
import aboutRaw from '../content/sections/about.json'
import productsSectionRaw from '../content/sections/products.json'
import servicesRaw from '../content/sections/services.json'
import industriesRaw from '../content/sections/industries.json'
import whyRaw from '../content/sections/why.json'
import contactRaw from '../content/sections/contact.json'

/* ---------- helpers ---------- */
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v.trim() : fallback)
const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const strs = (v: unknown): string[] => arr(v).map((x) => str(x)).filter(Boolean)
type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {})

/** Dropdown options in the enquiry form. Must match the list in public/studio-7c9e4a2f6b18d035/config.yml. */
export const enquiryOptions = [
  'Worm Reduction Gearbox',
  'Worm Wheel',
  'Worm Shaft',
  'Helical / Bevel / Spur Gear',
  'Other Gear Component',
  'Replacement Component',
  'Gear Hobbing',
  'Gearbox Repair',
  'Industrial Product Sourcing',
  'Other / Not Sure',
] as const
export type EnquiryOption = string
const option = (v: unknown) => {
  const s = str(v)
  return (enquiryOptions as readonly string[]).includes(s) ? s : 'Other / Not Sure'
}

/* ---------- settings ---------- */
const s = obj(settingsRaw)
const telHref = (n: string) => {
  const digits = n.replace(/[^\d+]/g, '')
  if (!digits) return ''
  if (digits.startsWith('+')) return `tel:${digits}`
  if (digits.startsWith('0')) return `tel:+91${digits.slice(1)}`
  return `tel:+91${digits}`
}
const mobile = str(s.mobile)
const landline = str(s.landline)

export const site = {
  name: str(s.companyName, 'Arte Industries'),
  shortDescription: str(s.shortDescription),
  contact: {
    mobile,
    mobileHref: telHref(mobile),
    landline,
    landlineHref: telHref(landline),
    whatsapp: str(s.whatsapp).replace(/\D/g, ''),
    email: str(s.email),
    addressLines: strs(s.addressLines),
    mapsUrl: str(s.mapsUrl),
  },
  media: { workshopPhoto: str(s.workshopPhoto) },
  social: { linkedin: str(s.linkedin) },
}

export const whatsappHref = (message = 'Hello Arte Industries, I have an enquiry.') =>
  site.contact.whatsapp ? `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}` : ''

export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Products', href: '#products' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Industries', href: '#industries' },
  { label: 'Why Arte', href: '#why-arte' },
  { label: 'Contact', href: '#contact' },
] as const

/* ---------- products ---------- */
export type Supply = 'manufactured' | 'made-or-sourced' | 'sourced'
export const supplyLabel: Record<Supply, string> = {
  manufactured: 'Manufactured by Arte',
  'made-or-sourced': 'Manufactured or sourced',
  sourced: 'Sourced / supplied',
}
export interface Product {
  id: string
  title: string
  image: string
  alt: string
  summary: string
  supply: Supply
  enquiry: EnquiryOption
  includes: string[]
  featured: boolean
  fullRange: boolean
  order: number
}

const productFiles = import.meta.glob('../content/products/*.json', { eager: true, import: 'default' })
export const products: Product[] = Object.entries(productFiles)
  .map(([path, raw]) => {
    const p = obj(raw)
    const title = str(p.title)
    const supply = str(p.supply) as Supply
    return {
      id: path.split('/').pop()!.replace(/\.json$/, ''),
      title,
      image: str(p.image),
      alt: str(p.alt) || title,
      summary:
        str(p.summary) ||
        `${title} for industrial machinery and replacement requirements. Share your component details, photograph or drawing for a private review.`,
      supply: supply in supplyLabel ? supply : 'made-or-sourced',
      enquiry: option(p.enquiry),
      includes: strs(p.includes),
      featured: p.featured === true,
      fullRange: p.fullRange !== false,
      order: typeof p.order === 'number' ? p.order : 999,
    }
  })
  .filter((p) => p.title)
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

export const featuredProducts = products.filter((p) => p.featured)
export const fullRange = products.filter((p) => p.fullRange)

/* ---------- sections ---------- */
const h = obj(heroRaw)
export const hero = {
  eyebrow: str(h.eyebrow),
  headingLine1: str(h.headingLine1),
  headingLine2: str(h.headingLine2),
  text: str(h.text),
  primaryButton: str(h.primaryButton, 'Request a Quote'),
  secondaryButton: str(h.secondaryButton, 'Explore Products'),
  imageLeft: str(h.imageLeft),
  imageRight: str(h.imageRight),
  principles: strs(h.principles).slice(0, 4),
}

const a = obj(aboutRaw)
export const about = {
  label: str(a.label),
  heading: str(a.heading),
  body: str(a.body),
  highlights: strs(a.highlights).slice(0, 3),
}

const ps = obj(productsSectionRaw)
export const productsSection = {
  label: str(ps.label),
  heading: str(ps.heading),
  intro: str(ps.intro),
  fullRangeHeading: str(ps.fullRangeHeading, 'Full product range'),
  fullRangeNote: str(ps.fullRangeNote),
  detailNote: str(ps.detailNote),
}

const sv = obj(servicesRaw)
export interface Service {
  id: string
  title: string
  body: string
  image: string
  enquiry: EnquiryOption
}
export const servicesSection = {
  label: str(sv.label),
  heading: str(sv.heading),
  intro: str(sv.intro),
  items: arr(sv.items)
    .map((x, i): Service => {
      const o = obj(x)
      return { id: `service-${i}`, title: str(o.title), body: str(o.body), image: str(o.image), enquiry: option(o.enquiry) }
    })
    .filter((x) => x.title),
}

const ind = obj(industriesRaw)
export type IndustryIcon = 'rolling-mill' | 'conveyor' | 'crusher' | 'cement' | 'gears'
export const industriesSection = {
  label: str(ind.label),
  heading: str(ind.heading),
  intro: str(ind.intro),
  items: arr(ind.items)
    .map((x) => {
      const o = obj(x)
      return { title: str(o.title), icon: (str(o.icon) || 'gears') as IndustryIcon, photo: str(o.photo) }
    })
    .filter((x) => x.title),
}

const w = obj(whyRaw)
export type WhyIcon = 'gem' | 'users' | 'settings' | 'chart' | 'shield' | 'wrench' | 'factory' | 'handshake' | 'truck' | 'globe'
export const whySection = {
  label: str(w.label),
  heading: str(w.heading),
  items: arr(w.items)
    .map((x) => {
      const o = obj(x)
      return { title: str(o.title), body: str(o.body), icon: (str(o.icon) || 'settings') as WhyIcon }
    })
    .filter((x) => x.title),
}

const c = obj(contactRaw)
export const contactSection = {
  label: str(c.label),
  heading: str(c.heading),
  text: str(c.text),
  formHeading: str(c.formHeading, 'Request a Quote'),
  formText: str(c.formText),
  successMessage: str(
    c.successMessage,
    'Thank you. Our team will review your requirement and get back to you.',
  ),
}

