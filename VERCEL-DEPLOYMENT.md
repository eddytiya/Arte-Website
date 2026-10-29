# Deploy the website and admin to Vercel

The client website is served at `/`. The admin workspace is served at
`/studio-7c9e4a2f6b18d035/`. `/admin` and its old subpaths return 404.
The URL is not a secret or a substitute for login. All content reads/writes in the
hosted editor require a signed, HttpOnly, Secure session cookie.

## 1. Push this update (Windows CMD)

```cmd
cd /d "C:\Users\biswajit.das\Desktop\Arte-Website\4-Website-Code"
git add .
git commit -m "Add Vercel hosted admin and private workspace route"
git push
```

## 2. Create the GitHub storage credential

In GitHub, open Settings → Developer settings → Personal access tokens →
Fine-grained tokens → Generate new token. Select resource owner `eddytiya`,
choose **Only select repositories**, and select **Arte-Website**. Give it
**Contents: Read and write**, choose an expiry, and generate it.

Put this token directly in Vercel as `CONTENT_GITHUB_TOKEN`. Never put it in
the source code, a `VITE_` variable, chat, screenshots, or a committed file.
Rotate the Vercel variable before the token expires.

This token allows the server to commit website content to this repository.
Products and images remain in Git, including recoverable deleted product records.
Uploaded images will be public website assets; confidential enquiry drawings use
the separate email endpoint and must not be uploaded as product photographs.

## 3. Import into Vercel

Use https://vercel.com/new, connect GitHub and import `eddytiya/Arte-Website`.
The repository root is already the application root.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Production branch | main |
| Root directory | leave at repository root |
| Install command | npm install |
| Build command | npm run build |
| Output directory | dist |
| Node.js | 24.x |

Vercel Hobby is restricted to personal/non-commercial use. Use a suitable Vercel
plan for the Arte business website. Verify current pricing before subscribing.

## 4. Add server environment variables before deployment

In the Vercel project, Settings → Environment Variables:

| Name | Value |
| --- | --- |
| ADMIN_USERNAME | admin |
| ADMIN_PASSWORD | admin |
| ADMIN_SESSION_SECRET | random 64-character hex value generated below |
| CONTENT_GITHUB_REPO | eddytiya/Arte-Website |
| CONTENT_GITHUB_BRANCH | main |
| CONTENT_GITHUB_TOKEN | fine-grained token from step 2 |

Generate the session secret in CMD:

```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value only to Vercel. Use the Production environment for the
live admin. Avoid giving untrusted Preview deployments a repository write token.
The requested temporary credentials are admin/admin; change ADMIN_PASSWORD before
sharing the public deployment. Changing credentials invalidates existing sessions.
Environment changes require redeploying before they take effect.

The product admin does not require a separate database or a disk volume.

## 5. Deploy and verify

Deploy, then use the actual project URL shown by Vercel:

- Client: `https://YOUR-PROJECT.vercel.app/`
- Admin: `https://YOUR-PROJECT.vercel.app/studio-7c9e4a2f6b18d035/`
- Old route: `https://YOUR-PROJECT.vercel.app/admin` must return 404.

Sign in with admin/admin. Add a product with a JPG, PNG or WebP photo under 3 MB.
Verify it appears in the admin, edit it, delete it, and undo the deletion. A save
creates one Git commit, including any uploaded image, so GitHub and Vercel retain
the change across deployments. Updates to an already changed product return a
conflict rather than overwriting another editor's work.

The admin reads the current GitHub content, while the client site reads the latest
successful build. After saving, wait for the Vercel deployment to finish, then refresh
the client view. This is a publishing workflow, not immediate database-driven updates.
If the build fails, the previous successful client site stays live; check the build
log and fix the failing content before publishing again.

Set a Vercel Firewall rate limit for POST `/api/manage?action=login` before public
launch. The application keeps credentials server-side and checks request origins;
it does not provide a distributed brute-force counter. Do not rely on the obscure
workspace route for protection.

## 6. Connect enquiries to email

Set these additional variables when Resend/domain verification is ready:

| Name | Value |
| --- | --- |
| VITE_ENQUIRY_ENDPOINT | /api/enquiry |
| RESEND_API_KEY | your Resend API key |
| ENQUIRY_TO_EMAIL | the client's receiving inbox |
| ENQUIRY_FROM_EMAIL | sender on a domain verified in Resend |

Redeploy, submit a real enquiry and confirm the email arrives. Until configured,
the form offers the email/phone fallback. The enquiry form and server enforce a
3 MB total attachment limit to fit within Vercel's request limits. Larger files
need a direct-upload service.

## 7. Connect arteind.com

In Vercel Settings → Domains, add `arteind.com` and `www.arteind.com`. Use the exact
DNS records Vercel provides at the client's existing DNS provider. Domain ownership
stays with the client; transfer is unnecessary. Preserve email MX, SPF, DKIM and
DMARC records. Set `www.arteind.com` as primary to match the site's canonical URLs.
Wait until Vercel confirms valid domain configuration and HTTPS, then retest the
admin login and an enquiry on the custom domain.

## Local development

`npm run dev` uses the local filesystem editor at the same new workspace URL.
Local saves affect this computer; hosted saves affect GitHub. After using the online
editor, run `git pull --ff-only` before making more local edits. If it reports local
changes or conflicts, commit/stash your local work and resolve the differences.

## Automated checks

```cmd
npm run build
node --experimental-strip-types --test tests/hosted-admin.test.mjs
```

The hosted test uses a simulated GitHub API and never writes to a real repository.
Live GitHub/Vercel/domain/email verification must be performed after credentials
and the deployment are configured.

