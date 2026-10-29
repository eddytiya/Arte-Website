import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail, MapPin, Paperclip, Phone, X } from 'lucide-react'
import { contactSection, enquiryOptions, site, whatsappHref } from '../content'
import {
  emptyEnquiry,
  mailtoFallback,
  submitEnquiry,
  UPLOAD_RULES,
  validateEnquiry,
  validateFiles,
  type EnquiryErrors,
  type EnquiryValues,
  type SubmitResult,
} from '../lib/enquiry'
import { GearDrawing } from './Blueprint'
import { trackEvent } from '../lib/analytics'

export interface EnquiryPreset {
  option: string
  note?: string
  /** changes on every click so the same product can be re-selected */
  key: number
}

function ContactRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-cta text-navy-900" aria-hidden="true">
        {icon}
      </span>
      <div className="pt-0.5">
        <p className="text-[13px] text-white/65">{label}</p>
        <div className="text-[15px] font-bold text-white">{children}</div>
      </div>
    </li>
  )
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  className = '',
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required ? (
          <span className="text-cta" aria-hidden="true">
            {' '}
            *
          </span>
        ) : (
          <span className="font-normal text-muted"> (optional)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-[12px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 flex items-start gap-1 text-[12px] font-medium text-red-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

type Status = { state: 'idle' } | { state: 'sending' } | { state: 'sent' } | { state: 'error'; result: Extract<SubmitResult, { ok: false }> }

function EnquiryForm({ preset }: { preset: EnquiryPreset | null }) {
  const uid = useId()
  const id = (n: string) => `${uid}-${n}`
  const [values, setValues] = useState<EnquiryValues>(emptyEnquiry)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<EnquiryErrors>({})
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const [honeypot, setHoneypot] = useState('')
  const startedAt = useRef(Date.now())
  const fileInput = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const deliveryRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (!preset) return
    setValues((v) => ({
      ...v,
      product: preset.option,
      details: preset.note && v.details.startsWith('Enquiry regarding:')
        ? v.details.replace(/^Enquiry regarding:[^\n]*/, `Enquiry regarding: ${preset.note}`)
        : v.details || (preset.note ? `Enquiry regarding: ${preset.note}\n\n` : v.details),
    }))
    setErrors((e) => ({ ...e, product: undefined }))
  }, [preset])

  const set =
    (key: keyof EnquiryValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setValues((v) => ({ ...v, [key]: val }))
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
    }

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const next = [...files, ...Array.from(e.target.files ?? [])]
    e.target.value = ''
    const err = validateFiles(next)
    setErrors((er) => ({ ...er, files: err }))
    if (!err) setFiles(next)
  }

  const aria = (key: keyof EnquiryErrors, hint = false) => ({
    'aria-invalid': errors[key] ? (true as const) : undefined,
    'aria-describedby': errors[key] ? `${id(key)}-error` : hint ? `${id(key)}-hint` : undefined,
  })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status.state === 'sending') return
    const errs = validateEnquiry(values, files)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)
      if (first === 'deliveryLocation' || first === 'deliveryDate') { if (deliveryRef.current) deliveryRef.current.open = true }
      el?.focus()
      return
    }
    setStatus({ state: 'sending' })
    const result = await submitEnquiry(values, files, { honeypot, startedAt: startedAt.current })
    if (result.ok) {
      trackEvent('generate_lead', { product: values.product })
      setStatus({ state: 'sent' })
      setValues(emptyEnquiry)
      setFiles([])
    } else {
      setStatus({ state: 'error', result })
    }
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  if (status.state === 'sent') {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="flex flex-col items-center py-12 text-center outline-none">
        <CheckCircle2 className="size-14 text-emerald-500" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-extrabold text-navy-900">Enquiry received</h3>
        <p className="mt-2 max-w-sm text-[15px] text-muted">
          {contactSection.successMessage}
        </p>
        <button
          type="button"
          className="btn-outline mt-6"
          onClick={() => {
            startedAt.current = Date.now()
            setStatus({ state: 'idle' })
          }}
        >
          Send another enquiry
        </button>
      </div>
    )
  }

  const sending = status.state === 'sending'

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-describedby="enquiry-intro">
      {values.product && <div className="mb-6 rounded-lg bg-mist p-4" role="status"><span className="block text-xs font-semibold text-muted">Selected product / service</span><strong className="mt-1 block text-navy-900">{preset?.note && preset.option === values.product ? preset.note : values.product}</strong></div>}
      <fieldset className="min-w-0"><legend className="mb-4 text-lg font-bold text-navy-900">Your requirement</legend>
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field id={id('product')} label="Product / service required" required error={errors.product}>
          <select id={id('product')} name="product" className="field appearance-auto" value={values.product} onChange={set('product')} {...aria('product')}>
            <option value="">Select a product or service</option>
            {enquiryOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field id={id('quantity')} label="Approximate quantity" required error={errors.quantity}>
          <input id={id('quantity')} name="quantity" className="field" placeholder="e.g. 2 sets, 50 pcs, not sure" value={values.quantity} onChange={set('quantity')} {...aria('quantity')} />
        </Field>
        <Field
          id={id('details')}
          label="Requirement details"
          required
          error={errors.details}
          hint="Application, existing gearbox make/model if replacing a part, ratio or size if known. You don't need to share confidential dimensions here — attach a drawing or photo instead."
          className="sm:col-span-2"
        >
          <textarea id={id('details')} name="details" rows={5} className="field resize-y" value={values.details} onChange={set('details')} {...aria('details', true)} />
        </Field>


        <div>
          <span className="label">
            Drawing or photograph <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            ref={fileInput}
            id={id('files')}
            name="files"
            type="file"
            multiple
            accept={UPLOAD_RULES.accept}
            onChange={onFiles}
            className="sr-only"
            {...aria('files', true)}
          />
          <label
            htmlFor={id('files')}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-navy-900/25 bg-mist px-3.5 py-2.5 text-[14px] font-semibold text-navy-900 transition-colors hover:border-accent focus-within:border-accent"
          >
            <Paperclip className="size-4 text-muted" aria-hidden="true" /> Attach files
          </label>
          {!errors.files && (
            <p id={`${id('files')}-hint`} className="mt-1 text-[12px] text-muted">
              {UPLOAD_RULES.label}. Shared privately with our team only.
            </p>
          )}
          {errors.files && (
            <p id={`${id('files')}-error`} className="mt-1 flex items-start gap-1 text-[12px] font-medium text-red-600">
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" /> {errors.files}
            </p>
          )}
        </div>

        {files.length > 0 && (
          <ul className="space-y-1.5 sm:col-span-2" aria-label="Attached files">
            {files.map((f, i) => (
              <li key={f.name + i} className="flex items-center justify-between gap-3 rounded-md bg-mist px-3 py-2 text-[13px]">
                <span className="truncate">
                  {f.name} <span className="text-muted">· {(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </span>
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-white hover:text-navy-900"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>
      <details ref={deliveryRef} className="mt-5 rounded-lg border border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold text-navy-900">Delivery details (optional)</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id={id('deliveryLocation')} label="Delivery location" error={errors.deliveryLocation}>
          <input id={id('deliveryLocation')} name="deliveryLocation" className="field" placeholder="City / country" value={values.deliveryLocation} onChange={set('deliveryLocation')} {...aria('deliveryLocation')} />
        </Field>
        <Field id={id('deliveryDate')} label="Required delivery date" error={errors.deliveryDate}>
          <input id={id('deliveryDate')} name="deliveryDate" type="date" className="field" value={values.deliveryDate} onChange={set('deliveryDate')} {...aria('deliveryDate')} />
        </Field>
        </div>
      </details>
      </fieldset>
      <fieldset className="mt-8 min-w-0 border-t border-line pt-6"><legend className="pr-3 text-lg font-bold text-navy-900">Contact details</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field id={id('fullName')} label="Full name" required error={errors.fullName}>
          <input id={id('fullName')} name="fullName" className="field" autoComplete="name" value={values.fullName} onChange={set('fullName')} {...aria('fullName')} />
        </Field>
        <Field id={id('company')} label="Company name" required error={errors.company}>
          <input id={id('company')} name="company" className="field" autoComplete="organization" value={values.company} onChange={set('company')} {...aria('company')} />
        </Field>
        <Field id={id('email')} label="Business email" required error={errors.email}>
          <input id={id('email')} name="email" type="email" inputMode="email" className="field" autoComplete="email" value={values.email} onChange={set('email')} {...aria('email')} />
        </Field>
        <Field id={id('phone')} label="Phone / WhatsApp" required error={errors.phone}>
          <input id={id('phone')} name="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" placeholder="+91" value={values.phone} onChange={set('phone')} {...aria('phone')} />
        </Field>
        <Field id={id('country')} label="Country" required error={errors.country}>
          <input id={id('country')} name="country" className="field" autoComplete="country-name" value={values.country} onChange={set('country')} {...aria('country')} />
        </Field>

      </div></fieldset>
      <div className="mt-6">
        {/* Honeypot: hidden from people, often filled by bots */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor={id('website')}>Website</label>
          <input id={id('website')} name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-[13px] leading-relaxed text-ink">
            <input
              type="checkbox"
              name="consent"
              checked={values.consent}
              onChange={set('consent')}
              className="mt-0.5 size-4 shrink-0 accent-cta"
              {...aria('consent')}
            />
            <span>
              I agree that Arte Industries may use these details to respond to my enquiry, as described in the{' '}
              <a href="/privacy-policy.html" target="_blank" rel="noopener" className="font-semibold text-navy-800 underline underline-offset-2">
                Privacy Policy
              </a>
              .<span className="text-cta"> *</span>
            </span>
          </label>
          {errors.consent && (
            <p id={`${id('consent')}-error`} className="mt-1 flex items-start gap-1 text-[12px] font-medium text-red-600">
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" /> {errors.consent}
            </p>
          )}
        </div>
      </div>

      <div ref={statusRef} tabIndex={-1} className="outline-none" aria-live="polite">
        {status.state === 'error' && (
          <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-[14px] text-red-800">
            <p className="font-semibold">{status.result.message}</p>
            <p className="mt-2">
              <a href={mailtoFallback(site.contact.email, values)} className="font-bold text-red-900 underline underline-offset-2">
                Send this enquiry by email instead
              </a>{' '}
              (opens your email app with your details filled in — attach drawings there), or call{' '}
              <a href={site.contact.mobileHref} className="font-bold text-red-900 underline underline-offset-2">
                {site.contact.mobile}
              </a>
              .
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted">
          <span className="text-cta">*</span> Required
        </p>
        <button type="submit" className="btn-cta px-8 disabled:opacity-70" disabled={sending} aria-busy={sending}>
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            <>
              Submit Enquiry <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export function Contact({ preset }: { preset: EnquiryPreset | null }) {
  const wa = whatsappHref()
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate overflow-hidden bg-navy-900">
      <div className="blueprint-grid absolute inset-0 -z-10" aria-hidden="true" />
      <GearDrawing className="absolute -bottom-40 -left-40 -z-10 w-[640px] text-sky-200/[0.1]" />

      <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div className="text-white lg:pt-6">
          <p className="eyebrow">{contactSection.label}</p>
          <h2 id="contact-title" className="mt-3 max-w-md text-[30px] leading-[1.12] font-extrabold sm:text-[36px]">
            {contactSection.heading}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
            {contactSection.text}
          </p>
          <ul className="mt-9 space-y-6">
            {(site.contact.mobile || site.contact.landline) && (
            <ContactRow icon={<Phone className="size-5" />} label={wa ? 'Call / WhatsApp' : 'Call'}>
              {site.contact.mobile && (
                <a href={site.contact.mobileHref} className="block hover:text-cta">
                  {site.contact.mobile}
                </a>
              )}
              {site.contact.landline && (
                <a href={site.contact.landlineHref} className="block hover:text-cta">
                  {site.contact.landline}
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener" className="mt-1 block text-[13px] font-semibold text-accent-soft hover:text-white">
                  Message on WhatsApp →
                </a>
              )}
            </ContactRow>
            )}
            {site.contact.email && (
            <ContactRow icon={<Mail className="size-5" />} label="Email us">
              <a href={`mailto:${site.contact.email}`} className="break-all hover:text-cta">
                {site.contact.email}
              </a>
            </ContactRow>
            )}
            {site.contact.addressLines.length > 0 && (
            <ContactRow icon={<MapPin className="size-5" />} label="Our location">
              <a href={site.contact.mapsUrl || undefined} target="_blank" rel="noopener" className="hover:text-cta">
                {site.contact.addressLines.map((l) => (
                  <span key={l} className="block font-semibold">
                    {l}
                  </span>
                ))}
              </a>
            </ContactRow>
            )}
          </ul>
        </div>

        <div id="enquiry" className="relative scroll-mt-24 rounded-xl bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:p-8">
          <h3 className="text-[22px] font-extrabold text-navy-900">{contactSection.formHeading}</h3>
          <p id="enquiry-intro" className="mt-1 mb-6 text-[14px] text-muted">
            {contactSection.formText}
          </p>
          <EnquiryForm preset={preset} />
        </div>
      </div>
    </section>
  )
}
