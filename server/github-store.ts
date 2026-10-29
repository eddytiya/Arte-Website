export class AdminError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
type Entry = { path: string; sha: string; type: string }
type Change = { path: string; content: string | null; base64?: boolean }

/** One Git commit per save, including any uploaded image. No serverless disk writes. */
export class GithubStore {
  repo: string
  branch: string
  token: string
  constructor() {
    this.repo = process.env.CONTENT_GITHUB_REPO || ''
    this.branch = process.env.CONTENT_GITHUB_BRANCH || 'main'
    this.token = process.env.CONTENT_GITHUB_TOKEN || ''
    if (!/^[\w.-]+\/[\w.-]+$/.test(this.repo) || !this.token) throw new AdminError(503, 'Online content storage is not configured. Set the GitHub environment variables in Vercel.')
  }
  async request(path: string, method = 'GET', body?: unknown) {
    const response = await fetch(`https://api.github.com/repos/${this.repo}/${path}`, {
      method, headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000), cache: 'no-store',
    })
    if (!response.ok) {
      if ([409, 422].includes(response.status)) throw new AdminError(409, 'Content changed during this save. Refresh the product list and try again.')
      if (response.status === 404) throw new AdminError(503, 'GitHub repository or branch could not be accessed. Check the repository and token settings.')
      throw new AdminError(502, 'GitHub could not complete the request. Check token permissions or try again shortly.')
    }
    return response.json()
  }
  async snapshot() {
    const ref = await this.request(`git/ref/heads/${encodeURIComponent(this.branch)}`)
    const commit = await this.request(`git/commits/${ref.object.sha}`)
    const tree = await this.request(`git/trees/${commit.tree.sha}?recursive=1`)
    if (tree.truncated) throw new AdminError(503, 'The content repository is too large for this editor.')
    return { head: ref.object.sha as string, tree: commit.tree.sha as string, entries: tree.tree as Entry[] }
  }
  async read(entry: Entry) {
    const blob = await this.request(`git/blobs/${entry.sha}`)
    return JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8'))
  }
  async commit(snapshot: Awaited<ReturnType<GithubStore['snapshot']>>, changes: Change[], message: string) {
    const tree = await Promise.all(changes.map(async change => ({
      path: change.path, mode: '100644', type: 'blob',
      sha: change.content === null ? null : (await this.request('git/blobs', 'POST', { content: change.content, encoding: change.base64 ? 'base64' : 'utf-8' })).sha,
    })))
    const next = await this.request('git/trees', 'POST', { base_tree: snapshot.tree, tree })
    const commit = await this.request('git/commits', 'POST', { message, tree: next.sha, parents: [snapshot.head] })
    await this.request(`git/refs/heads/${encodeURIComponent(this.branch)}`, 'PATCH', { sha: commit.sha, force: false })
    return commit.sha as string
  }
}
