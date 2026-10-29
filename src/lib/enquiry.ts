import { enquiryOptions } from '../content'

export const UPLOAD_RULES = {
  maxFiles: 3,
  maxTotalBytes: 10 * 1024 * 1024,
  extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
  accept: '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp',
  label: 'PDF, JPG, PNG or WebP · up to 3 files · 10 MB total',
} as const

export interface EnquiryValues {
  fullName: string
  company: string
  email: string
  phone: string
  country: string
  product: string
  quantity: string
  details: string
  deliveryLocation: string
  deliveryDate: string
  consent: boolean
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues | 'files', string>>

export const emptyEnquiry: EnquiryValues = {
  fullName: '',
  company: '',
  email: '',
  phone: '',
  country: 'India',
  product: '',
  quantity: '',
  details: '',
  deliveryLocation: '',
  deliveryDate: '',
  consent: false,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEnquiry(v: EnquiryValues, files: File[]): EnquiryErrors {
  const e: EnquiryErrors = {}
  const len = (s: string) => s.trim().length

  if (len(v.fullName) < 2) e.fullName = 'Please enter your full name.'
  else if (len(v.fullName) > 100) e.fullName = 'Name is too long.'
  if (len(v.company) < 2) e.company = 'Please enter your company name.'
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  const digits = v.phone.replace(/\D/g, '')
  if (!/^[+\d][\d\s()-]*$/.test(v.phone.trim()) || digits.length < 7 || digits.length > 15)
    e.phone = 'Please enter a valid phone or WhatsApp number, with country code if outside India.'
  if (len(v.country) < 2) e.country = 'Please enter your country.'
  if (!(enquiryOptions as readonly string[]).includes(v.product)) e.product = 'Please choose a product or service.'
  if (len(v.quantity) < 1) e.quantity = 'Please give an approximate quantity (e.g. "2 sets" or "not sure").'
  if (len(v.details) < 15) e.details = 'Please describe your requirement in a little more detail (15+ characters).'
  else if (len(v.details) > 4000) e.details = 'Please keep the description under 4,000 characters.'
  if (v.deliveryDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(v.deliveryDate) < today) e.deliveryDate = 'Delivery date cannot be in the past.'
  }
  if (!v.consent) e.consent = 'Please confirm you agree to the Privacy Policy.'

  const fileError = validateFiles(files)
  if (fileError) e.files = fileError
  return e
}

export function validateFiles(files: File[]): string | undefined {
  if (files.length > UPLOAD_RULES.maxFiles) return `You can attach up to ${UPLOAD_RULES.maxFiles} files.`
  let total = 0
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!(UPLOAD_RULES.extensions as readonly string[]).includes(ext))
      return `"${f.name}" is not an allowed file type. Use PDF, JPG, PNG or WebP.`
    if (f.size === 0) return `"${f.name}" is empty.`
    total += f.size
  }
  if (total > UPLOAD_RULES.maxTotalBytes) return 'Attachments exceed 10 MB in total. Please compress or remove a file.'
  return undefined
}

export type SubmitResult = { ok: true } | { ok: false; reason: 'not-configured' | 'rejected' | 'network'; message: string }

/**
 * Sends the enquiry as multipart/form-data to VITE_ENQUIRY_ENDPOINT.
 * Success is only reported when the endpoint answers with a 2xx status.
 */
export async function submitEnquiry(
  v: EnquiryValues,
  files: File[],
  meta: { honeypot: string; startedAt: number },
): Promise<SubmitResult> {
  const endpoint = import.meta.env.VITE_ENQUIRY_ENDPOINT as string | undefined
  if (!endpoint) {
    return {
      ok: false,
      reason: 'not-configured',
      message: 'Online enquiries are not connected yet. Please email or call us using the details on this page.',
    }
  }

  const body = new FormData()
  for (const [k, val] of Object.entries(v)) body.append(k, String(val))
  for (const f of files) body.append('files', f, f.name)
  body.append('website', meta.honeypot) // honeypot — must stay empty
  body.append('elapsedMs', String(Date.now() - meta.startedAt))
  body.append('page', window.location.href)

  try {
    const res = await fetch(endpoint, { method: 'POST', body, headers: { Accept: 'application/json' } })
    if (res.ok) return { ok: true }
    let message = 'Your enquiry could not be sent. Please try again, or email/call us directly.'
    try {
      const data = await res.json()
      if (data && typeof data.error === 'string') message = data.error
    } catch {
      /* non-JSON error body */
    }
    return { ok: false, reason: 'rejected', message }
  } catch {
    return {
      ok: false,
      reason: 'network',
      message: 'We could not reach the server. Check your connection and try again, or email/call us directly.',
    }
  }
}

/** Builds a mailto: link containing the typed enquiry, used as a fallback (attachments cannot be included). */
export function mailtoFallback(to: string, v: EnquiryValues) {
  const subject = `Website enquiry: ${v.product || 'General'} — ${v.company || v.fullName}`
  const lines = [
    `Name: ${v.fullName}`,
    `Company: ${v.company}`,
    `Email: ${v.email}`,
    `Phone / WhatsApp: ${v.phone}`,
    `Country: ${v.country}`,
    `Product / service: ${v.product}`,
    `Approx. quantity: ${v.quantity}`,
    v.deliveryLocation ? `Delivery location: ${v.deliveryLocation}` : null,
    v.deliveryDate ? `Required by: ${v.deliveryDate}` : null,
    '',
    'Requirement:',
    v.details,
    '',
    '(Drawings/photos: please attach to this email.)',
  ].filter((l): l is string => l !== null)
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
}
