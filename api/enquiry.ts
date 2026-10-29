/**
 * Enquiry endpoint — Vercel Function (Web-standard Request/Response, Node runtime).
 *
 * What it does:
 *   1. Re-validates every field server-side (never trust the browser).
 *   2. Drops obvious bots (honeypot + too-fast submissions).
 *   3. Checks attachments by size, extension AND file signature (magic bytes).
 *   4. Emails the enquiry, with attachments, to ENQUIRY_TO_EMAIL via the Resend API.
 *
 * Attachments are never written to disk or object storage, so there is no public URL to leak.
 * They exist only in this request's memory and in the recipient's inbox.
 *
 * Required environment variables (set in the hosting dashboard, NOT in VITE_ variables):
 *   RESEND_API_KEY, ENQUIRY_TO_EMAIL, ENQUIRY_FROM_EMAIL
 *
 * STATUS: written and type-checked, but NOT tested against a live Resend account.
 * Send a real test enquiry with an attachment before launch.
 */

const OPTIONS = [
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
]
const MAX_FILES = 3
const MAX_TOTAL = 10 * 1024 * 1024
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function sniff(bytes: Uint8Array): string | null {
  const b = (i: number) => bytes[i]
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return 'application/pdf'
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg'
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return 'image/png'
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50)
    return 'image/webp'
  return null
}

const str = (fd: FormData, k: string, max = 200) => {
  const v = fd.get(k)
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function POST(request: Request): Promise<Response> {
  const { RESEND_API_KEY, ENQUIRY_TO_EMAIL, ENQUIRY_FROM_EMAIL } = process.env
  if (!RESEND_API_KEY || !ENQUIRY_TO_EMAIL || !ENQUIRY_FROM_EMAIL) {
    return json(503, { error: 'Online enquiries are temporarily unavailable. Please email or call us directly.' })
  }

  const len = Number(request.headers.get('content-length') ?? 0)
  if (len > MAX_TOTAL + 200_000) return json(413, { error: 'Attachments exceed 10 MB in total.' })

  let fd: FormData
  try {
    fd = await request.formData()
  } catch {
    return json(400, { error: 'Invalid submission.' })
  }

  // Bot checks: pretend success so bots learn nothing.
  if (str(fd, 'website') || Number(str(fd, 'elapsedMs')) < 2500) return json(200, { ok: true })

  const v = {
    fullName: str(fd, 'fullName', 100),
    company: str(fd, 'company', 150),
    email: str(fd, 'email', 200),
    phone: str(fd, 'phone', 30),
    country: str(fd, 'country', 80),
    product: str(fd, 'product', 80),
    quantity: str(fd, 'quantity', 100),
    details: str(fd, 'details', 4000),
    deliveryLocation: str(fd, 'deliveryLocation', 150),
    deliveryDate: str(fd, 'deliveryDate', 20),
    consent: str(fd, 'consent', 10),
    page: str(fd, 'page', 300),
  }

  const digits = v.phone.replace(/\D/g, '')
  const problems: string[] = []
  if (v.fullName.length < 2) problems.push('name')
  if (v.company.length < 2) problems.push('company')
  if (!EMAIL_RE.test(v.email)) problems.push('email')
  if (digits.length < 7 || digits.length > 15) problems.push('phone')
  if (v.country.length < 2) problems.push('country')
  if (!OPTIONS.includes(v.product)) problems.push('product/service')

  if (!v.quantity) problems.push('quantity')
  if (v.details.length < 15) problems.push('requirement details')
  if (v.deliveryDate && !/^\d{4}-\d{2}-\d{2}$/.test(v.deliveryDate)) problems.push('delivery date')
  if (v.consent !== 'true') problems.push('privacy consent')
  if (problems.length) return json(422, { error: `Please check: ${problems.join(', ')}.` })

  const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length > MAX_FILES) return json(422, { error: `Attach up to ${MAX_FILES} files.` })
  const total = files.reduce((n, f) => n + f.size, 0)
  if (total > MAX_TOTAL) return json(413, { error: 'Attachments exceed 10 MB in total.' })

  const attachments: { filename: string; content: string }[] = []
  for (const f of files) {
    const buf = new Uint8Array(await f.arrayBuffer())
    const type = sniff(buf)
    if (!type) return json(422, { error: `"${f.name}" is not a valid PDF, JPG, PNG or WebP file.` })
    const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type]
    const safeName = f.name.replace(/[^\w.\- ]+/g, '_').replace(/\.[^.]*$/, '').slice(0, 80) || 'attachment'
    attachments.push({ filename: `${safeName}.${ext}`, content: Buffer.from(buf).toString('base64') })
  }

  const rows: [string, string][] = [
    ['Name', v.fullName],
    ['Company', v.company],
    ['Email', v.email],
    ['Phone / WhatsApp', v.phone],
    ['Country', v.country],
    ['Product / service', v.product],
    ['Approx. quantity', v.quantity],
    ['Delivery location', v.deliveryLocation || '—'],
    ['Required by', v.deliveryDate || '—'],
    ['Attachments', attachments.length ? attachments.map((a) => a.filename).join(', ') : 'None'],
  ]
  const html = `
    <h2 style="font-family:Arial,sans-serif;color:#08264A">New website enquiry</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows.map(([k, val]) => `<tr><td style="padding:4px 12px 4px 0;color:#637386">${k}</td><td style="padding:4px 0"><b>${esc(val)}</b></td></tr>`).join('')}
    </table>
    <h3 style="font-family:Arial,sans-serif;color:#08264A">Requirement</h3>
    <p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${esc(v.details)}</p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#637386">Sent from ${esc(v.page)}</p>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: ENQUIRY_FROM_EMAIL,
      to: ENQUIRY_TO_EMAIL.split(',').map((s) => s.trim()),
      reply_to: v.email,
      subject: `Enquiry: ${v.product} — ${v.company}`,
      html,
      attachments,
    }),
  })

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text().catch(() => ''))
    return json(502, { error: 'Your enquiry could not be delivered. Please email or call us directly.' })
  }
  return json(200, { ok: true })
}
