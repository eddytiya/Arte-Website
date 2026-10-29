import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { AdminError, GithubStore } from '../server/github-store.ts'

const cookieName = '__Host-arte_session'
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } })
const equal = (a: string, b: string) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
const serialize = (value: unknown) => JSON.stringify(value, null, 2) + '\n'
const validId = (id: string) => /^[a-z0-9][a-z0-9-]{0,100}$/.test(id)
const options = ['Worm Reduction Gearbox', 'Worm Wheel', 'Worm Shaft', 'Helical / Bevel / Spur Gear', 'Other Gear Component', 'Replacement Component', 'Gear Hobbing', 'Gearbox Repair', 'Industrial Product Sourcing', 'Other / Not Sure']
function authConfig() {
  const username = process.env.ADMIN_USERNAME || '', password = process.env.ADMIN_PASSWORD || '', secret = process.env.ADMIN_SESSION_SECRET || ''
  if (!username || !password || secret.length < 32) throw new AdminError(503, 'Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET in Vercel.')
  return { username, password, secret: `${secret}:${username}:${password}` }
}
function sign(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('base64url') }
function authenticated(request: Request, secret: string) {
  const token = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || ''
  const [payload, signature] = token.split('.')
  if (!payload || !signature || !equal(signature, sign(payload, secret))) return false
  try { const session = JSON.parse(Buffer.from(payload, 'base64url').toString()); return typeof session.exp === 'number' && session.exp > Date.now() } catch { return false }
}
function imageUpload(raw: unknown, prefix: string) {
  const match = text(raw).match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) throw new AdminError(422, 'Choose a PNG, JPG or WebP image.')
  const bytes = Buffer.from(match[2], 'base64')
  const valid = match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (!valid || bytes.length > 3_000_000) throw new AdminError(422, 'Choose a valid image smaller than 3 MB.')
  const image = `/images/uploads/${prefix}-${randomBytes(8).toString('hex')}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`
  return { image, change: { path: `public${image}`, content: match[2], base64: true } }
}
async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    if (!['GET', 'POST'].includes(request.method)) return json(405, { error: 'Method not allowed.' }, { Allow: 'GET, POST' })
    if (request.method === 'POST' && request.headers.get('origin') !== url.origin) return json(403, { error: 'Invalid request origin.' })
    const auth = authConfig()
    let body: Record<string, unknown> = {}
    if (request.method === 'POST') {
      const raw = await request.text()
      if (Buffer.byteLength(raw) > 4_100_000) return json(413, { error: 'Image too large. Use a photo smaller than 3 MB.' })
      try { body = JSON.parse(raw) } catch { return json(400, { error: 'Invalid JSON request.' }) }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, { error: 'Invalid request.' })
    }
    const action = url.searchParams.get('action') || ''
    if (action === 'login' && request.method === 'POST') {
      if (!equal(text(body.username), auth.username) || !equal(typeof body.password === 'string' ? body.password : '', auth.password)) return json(401, { error: 'Incorrect username or password.' })
      const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url')
      return json(200, { ok: true }, { 'Set-Cookie': `${cookieName}=${payload}.${sign(payload, auth.secret)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800` })
    }
    if (!authenticated(request, auth.secret)) return json(401, { error: 'Please sign in.' })
    if (action === 'logout' && request.method === 'POST') return json(200, { ok: true }, { 'Set-Cookie': `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` })
    if (!['products', 'products/delete', 'products/restore', 'workshop-photo', 'image'].includes(action)) return json(404, { error: 'Unknown action.' })
    const store = new GithubStore()
    if (action === 'image' && request.method === 'GET') {
      const path = url.searchParams.get('path') || ''
      if (!/^\/images\/[a-zA-Z0-9/_ .-]+\.(png|webp|jpe?g)$/i.test(path) || path.includes('..')) throw new AdminError(422, 'Invalid image path.')
      let file = await store.request(`contents/public${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(store.branch)}`)
      if (!file.content && file.sha) file = await store.request(`git/blobs/${file.sha}`)
      if (!file.content || file.encoding !== 'base64') throw new AdminError(404, 'Image could not be loaded.')
      const bytes = new Uint8Array(Buffer.from(file.content, 'base64'))
      return new Response(bytes, { headers: { 'Content-Type': /\.png$/i.test(path) ? 'image/png' : /\.webp$/i.test(path) ? 'image/webp' : 'image/jpeg', 'Cache-Control': 'private, max-age=60', 'X-Content-Type-Options': 'nosniff' } })
    }
    const snapshot = await store.snapshot()
    const entry = (path: string) => snapshot.entries.find(e => e.path === path && e.type === 'blob')
    if (action === 'products' && request.method === 'GET') {
      const files = snapshot.entries.filter(e => /^content\/products\/[a-z0-9-]+\.json$/.test(e.path) && e.type === 'blob')
      return json(200, await Promise.all(files.map(async e => ({ ...await store.read(e), id: e.path.split('/').pop()!.slice(0, -5), _version: e.sha }))))
    }
    const settingsFile = entry('content/settings.json')
    if (action === 'workshop-photo') {
      if (!settingsFile) throw new AdminError(404, 'Company settings could not be found.')
      const settings = await store.read(settingsFile)
      if (request.method === 'GET') return json(200, { image: settings.workshopPhoto || '' })
      const upload = imageUpload(body.upload, 'workshop')
      settings.workshopPhoto = upload.image
      const commit = await store.commit(snapshot, [upload.change, { path: settingsFile.path, content: serialize(settings) }], 'Admin: update workshop photo')
      return json(200, { ok: true, image: upload.image, commit, publishing: true })
    }
    if (request.method !== 'POST') return json(405, { error: 'Use POST for this action.' })
    const title = text(body.title)
    const id = text(body.id) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!validId(id)) throw new AdminError(422, 'Enter a valid product name.')
    const path = `content/products/${id}.json`, existing = entry(path)
    if (action === 'products/restore') {
      const recovery = text(body.recovery)
      if (!new RegExp(`^${id}--[a-f0-9]{24}$`).test(recovery)) throw new AdminError(422, 'Invalid recovery reference.')
      if (existing) throw new AdminError(409, 'A product with this name already exists.')
      const backup = entry(`content/deleted-products/${recovery}.json`)
      if (!backup) throw new AdminError(404, 'The deleted product was not found or has already been restored.')
      const commit = await store.commit(snapshot, [{ path, content: serialize(await store.read(backup)) }, { path: backup.path, content: null }], `Admin: restore ${id}`)
      return json(200, { ok: true, id, commit, publishing: true })
    }
    if (text(body.id) && (!existing || text(body.version) !== existing.sha)) throw new AdminError(existing ? 409 : 404, existing ? 'This product changed since you opened it. Refresh the list before saving.' : 'This product no longer exists.')
    if (action === 'products/delete') {
      if (!existing) throw new AdminError(404, 'Product not found.')
      const recovery = `${id}--${randomBytes(12).toString('hex')}`
      const commit = await store.commit(snapshot, [{ path, content: null }, { path: `content/deleted-products/${recovery}.json`, content: serialize(await store.read(existing)) }], `Admin: delete ${id}`)
      return json(200, { ok: true, id, recovery, commit, publishing: true })
    }
    if (!text(body.id) && existing) throw new AdminError(409, 'A product with this name already exists.')
    if (!title || title.length > 150 || !text(body.summary)) throw new AdminError(422, 'Enter a product name and description.')
    if (!['manufactured', 'made-or-sourced', 'sourced'].includes(text(body.supply)) || !options.includes(text(body.enquiry))) throw new AdminError(422, 'Choose a supply type and enquiry category.')
    const upload = body.upload ? imageUpload(body.upload, id) : null
    const image = upload?.image || text(body.image)
    if (!upload && (!/^\/images\/[a-zA-Z0-9/_ .-]+\.(webp|png|jpe?g)$/i.test(image) || image.includes('..') || !entry(`public${image}`))) throw new AdminError(422, 'Upload a product photo.')
    const product = { title, summary: text(body.summary), image, alt: text(body.alt) || title, supply: text(body.supply), enquiry: text(body.enquiry), includes: Array.isArray(body.includes) ? body.includes.map(text).filter(Boolean) : [], featured: body.featured === true, fullRange: body.fullRange === true, order: Number.isFinite(Number(body.order)) ? Number(body.order) : 100 }
    const changes = [{ path, content: serialize(product) }, ...(upload ? [upload.change] : [])]
    const commit = await store.commit(snapshot, changes, `Admin: ${existing ? 'update' : 'add'} ${title}`)
    return json(200, { ok: true, id, commit, publishing: true })
  } catch (error) {
    if (error instanceof AdminError) return json(error.status, { error: error.message })
    console.error('Hosted admin request failed', error instanceof Error ? error.message : 'Unknown error')
    return json(500, { error: 'The request could not be completed. Try again shortly.' })
  }
}
export default { fetch: handle }
