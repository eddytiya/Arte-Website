import { randomBytes } from 'node:crypto'
import { readdir, readFile, writeFile, mkdir, rename, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/** Local development only. Never registered in the production preview or deployed site. */
export function localAdmin(): Plugin {
  const sessions = new Map<string, number>()
  return { name: 'local-product-admin', configureServer(server) {
    server.middlewares.use('/__local-admin', async (req, res) => {
      const reply = (status: number, data: unknown) => {
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(data))
      }
      const host = req.headers.host || ''
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress || '')) return reply(403, { error: 'Local access only.' })
      if (req.method !== 'GET' && req.headers.origin !== `http://${host}`) return reply(403, { error: 'Invalid request origin.' })
      const route = req.url?.split('?')[0]
      const token = req.headers.cookie?.match(/(?:^|; )arte_admin=([a-f0-9]+)/)?.[1] || ''
      const authenticated = (sessions.get(token) || 0) > Date.now()
      try {
        let body: Record<string, unknown> = {}
        if (req.method === 'POST') {
          const chunks: Buffer[] = []; let size = 0
          for await (const chunk of req) { size += chunk.length; if (size > 8_000_000) return reply(413, { error: 'Image too large. Maximum 5 MB.' }); chunks.push(chunk) }
          body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        }
        if (route === '/login' && req.method === 'POST') {
          if (body.username !== 'admin' || body.password !== 'admin') return reply(401, { error: 'Incorrect username or password.' })
          for (const [key, expiry] of sessions) if (expiry < Date.now()) sessions.delete(key)
          const key = randomBytes(32).toString('hex'); sessions.set(key, Date.now() + 8 * 60 * 60 * 1000)
          res.setHeader('Set-Cookie', `arte_admin=${key}; HttpOnly; SameSite=Strict; Path=/__local-admin; Max-Age=28800`)
          return reply(200, { ok: true })
        }
        if (!authenticated) return reply(401, { error: 'Please sign in.' })
        if (route === '/logout' && req.method === 'POST') {
          sessions.delete(token); res.setHeader('Set-Cookie', 'arte_admin=; HttpOnly; SameSite=Strict; Path=/__local-admin; Max-Age=0'); return reply(200, { ok: true })
        }
        const folder = resolve(server.config.root, 'content/products')
        const settingsPath = resolve(server.config.root, 'content/settings.json')
        if (route === '/workshop-photo' && req.method === 'GET') {
          const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
          return reply(200, { image: settings.workshopPhoto || '' })
        }
        if (route === '/workshop-photo' && req.method === 'POST') {
          const match = typeof body.upload === 'string' ? body.upload.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/) : null
          if (!match) return reply(422, { error: 'Choose a PNG, JPG or WebP workshop photograph.' })
          const data = Buffer.from(match[2], 'base64')
          const valid = match[1] === 'png' ? data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : match[1] === 'jpeg' ? data[0] === 255 && data[1] === 216 && data[2] === 255 : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'
          if (!valid || data.length > 5_000_000) return reply(422, { error: 'Choose a valid photograph smaller than 5 MB.' })
          const image = `/images/uploads/workshop-${randomBytes(8).toString('hex')}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`
          await mkdir(resolve(server.config.root, 'public/images/uploads'), { recursive: true })
          await writeFile(resolve(server.config.root, `public${image}`), data)
          const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
          settings.workshopPhoto = image
          await writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n')
          return reply(200, { ok: true, image })
        }
        const trash = resolve(server.config.root, '.local-admin-trash')
        if ((route === '/products/delete' || route === '/products/restore') && req.method === 'POST') {
          const id = typeof body.id === 'string' ? body.id : ''
          if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(id)) return reply(422, { error: 'Choose a valid product.' })
          await mkdir(trash, { recursive: true })
          if (route === '/products/delete') {
            // Keep each deletion separately so it can be restored without losing earlier versions.
            const recovery = `${id}--${randomBytes(12).toString('hex')}`
            try { await rename(resolve(folder, `${id}.json`), resolve(trash, `${recovery}.json`)) }
            catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return reply(404, { error: 'This product no longer exists. Refresh the list.' }); throw error }
            return reply(200, { ok: true, id, recovery })
          }
          const recovery = typeof body.recovery === 'string' ? body.recovery : ''
          if (!new RegExp(`^${id}--[a-f0-9]{24}$`).test(recovery)) return reply(422, { error: 'Invalid recovery reference.' })
          try { await access(resolve(folder, `${id}.json`)); return reply(409, { error: 'A product with this name already exists. Rename it before restoring.' }) }
          catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
          try { await rename(resolve(trash, `${recovery}.json`), resolve(folder, `${id}.json`)) }
          catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return reply(404, { error: 'This product has already been restored or its backup is missing.' }); throw error }
          return reply(200, { ok: true, id })
        }
        if (route === '/products' && req.method === 'GET') {
          const files = (await readdir(folder)).filter(f => f.endsWith('.json'))
          return reply(200, await Promise.all(files.map(async f => ({ ...JSON.parse(await readFile(resolve(folder, f), 'utf8')), id: f.slice(0, -5) }))))
        }
        if (route === '/products' && req.method === 'POST') {
          const str = (v: unknown) => typeof v === 'string' ? v.trim() : ''
          const title = str(body.title), summary = str(body.summary)
          const id = str(body.id) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          if (!title || !summary || !/^[a-z0-9][a-z0-9-]{0,100}$/.test(id)) return reply(422, { error: 'Enter a product name and description. Use an English name for new products.' })
          if (!['manufactured', 'made-or-sourced', 'sourced'].includes(str(body.supply))) return reply(422, { error: 'Choose a supply type.' })
          if (str(body.id)) {
            try { await access(resolve(folder, `${id}.json`)) }
            catch { return reply(404, { error: 'This product no longer exists. Refresh the list before editing.' }) }
          }
          let image = str(body.image)
          if (body.upload) {
            const match = str(body.upload).match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/)
            if (!match) return reply(422, { error: 'Choose a PNG, JPG or WebP image.' })
            const data = Buffer.from(match[2], 'base64')
            const valid = match[1] === 'png' ? data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : match[1] === 'jpeg' ? data[0] === 255 && data[1] === 216 && data[2] === 255 : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'
            if (!valid || data.length > 5_000_000) return reply(422, { error: 'Choose a valid image smaller than 5 MB.' })
            const uploads = resolve(server.config.root, 'public/images/uploads'); await mkdir(uploads, { recursive: true })
            image = `/images/uploads/${id}-${randomBytes(6).toString('hex')}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`
            await writeFile(resolve(server.config.root, `public${image}`), data)
          }
          if (!/^\/images\/[a-zA-Z0-9/_ .-]+\.(webp|png|jpe?g)$/i.test(image) || image.includes('..')) return reply(422, { error: 'Upload a product photo.' })
          const product = { title, summary, image, alt: str(body.alt) || title, supply: body.supply, enquiry: str(body.enquiry), includes: Array.isArray(body.includes) ? body.includes.map(str).filter(Boolean) : [], featured: body.featured === true, fullRange: body.fullRange === true, order: Number.isFinite(Number(body.order)) ? Number(body.order) : 100 }
          if (!str(body.id)) {
            try { await writeFile(resolve(folder, `${id}.json`), JSON.stringify(product, null, 2) + '\n', { flag: 'wx' }) }
            catch (error) { if ((error as NodeJS.ErrnoException).code === 'EEXIST') return reply(409, { error: 'A product with this name already exists. Edit it or choose another name.' }); throw error }
          } else await writeFile(resolve(folder, `${id}.json`), JSON.stringify(product, null, 2) + '\n')
          return reply(200, { ok: true, id })
        }
        reply(404, { error: 'Unknown action.' })
      } catch (error) { console.error('Local admin:', error); reply(500, { error: 'Could not complete the action. Check the server and try again.' }) }
    })
  } }
}
