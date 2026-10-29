# Current hosted admin

Open /studio-7c9e4a2f6b18d035/ and sign in with the configured admin credentials.
See VERCEL-DEPLOYMENT.md for hosting and environment setup. Hosted saves commit to GitHub
and publish after Vercel deploys. The older GitHub-token CMS instructions below are optional.

# Arte Industries — Admin Panel Guide

**Website:** https://www.arteind.com
**Admin panel:** https://www.arteind.com/studio-7c9e4a2f6b18d035 (bookmark this — it is not linked from the website)

Anything you change in the admin panel goes live on the website about **1–2 minutes after you click Save**.

---

## Part A — One-time setup (done once, by whoever manages the website)

### A1. Point the admin panel at your GitHub repository
Open `public/studio-7c9e4a2f6b18d035/config.yml` and replace `YOUR-GITHUB-USERNAME` with the GitHub account that owns the `arte-website` repository. Example:
```yaml
repo: riteshdesai/arte-website
```
Commit the change (you can edit the file directly on github.com — click the pencil icon).

### A2. Give each admin access
Each person who will edit the website needs a **free GitHub account** (github.com → Sign up).

The repository owner then adds them:
GitHub → `arte-website` repository → **Settings** → **Collaborators** → **Add people** → enter their GitHub username → they accept the email invitation.

### A3. Each admin creates a login key (one time, about 3 minutes)
1. Log in to github.com.
2. Click your profile photo (top right) → **Settings** → scroll down → **Developer settings**.
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
4. Note: `Arte website admin`. Expiration: **1 year**. Tick the box **repo**. Click **Generate token**.
5. **Copy the token now** (it starts with `ghp_`) and keep it somewhere safe, like a password manager. GitHub only shows it once.

Treat this key like a password. Don't send it on WhatsApp or email. If it leaks, delete it on the same GitHub page and create a new one.

---

## Part B — Logging in

### Local development

At `http://127.0.0.1:5173/studio-7c9e4a2f6b18d035/`, sign in with username `admin` and password `admin`.
This login is available only through the local Vite development server on this computer.
Choose **Add product** or select an existing product, enter details and upload a photo,
then **Save product**. Changes are saved directly in `content/products` and
`public/images/uploads`. Use **Client website** above the editor to preview saved changes.
Use **Sign out** to end the session. Production continues to use the GitHub CMS below.

Search by name to find products in the local editor. Select a product to read or edit
its details, photo, display order and website visibility. Choose **Delete product**
and confirm to remove it from the website; **Undo delete** restores the latest
deletion during the current editor session. Deleted product JSON files are retained
in `.local-admin-trash` for recovery and excluded from Git. Shared images are retained.

### Published website

1. Go to **arteind.com/studio-7c9e4a2f6b18d035**.
2. Click **Sign In Using Access Token**.
3. Paste your token → **Sign In**.

On the left you'll see two sections:
- **Products**: every product on the website
- **Website text & details**: company details, contact information and the text of each section

Use the Admin panel / Client website buttons at the top to switch views. The editor stays open, preserving unfinished edits. Save before previewing changes. Locally, choose Work with Local Repository and select the 4-Website-Code folder in Chrome or Edge.

---

## Part C — Common tasks

### Add a product
1. **Products** → **New**.
2. Fill in:
   - **Product name**
   - **Display order**: lower numbers appear first (e.g. 10, 20, 30). Use 15 to slot a product between 10 and 20.
   - **Show in homepage grid**: switch on only if it should appear in the main grid. Six cards fit per desktop row; additional products wrap automatically using the same design.
   - **Show in full range list**: usually on.
   - **Product photo**: click it, then upload from your computer or phone. Large photos are resized and compressed automatically.
   - **Photo description**: a short plain description of the photo, e.g. "Bronze worm wheel".
   - **How is it supplied?**: be accurate. Only choose "Manufactured by Arte" if Arte actually makes it.
   - **Enquiry form category**: which option is pre-selected when a customer clicks "Enquire".
   - **Short description**: 1–3 sentences.
3. Click **Save**. The product appears on the website within about 2 minutes.

### Edit a product
**Products** → click the product → change it → **Save**.

### Delete a product
**Products** → click the product → **⋮** menu (top right) → **Delete**.
If you only want to hide it for now, switch off both "Show in homepage grid" and "Show in full range list" instead.

### Change the phone number, email or address
**Website text & details** → **Company details & contact** → edit → **Save**.
Leave a field empty to hide it from the website (e.g. no WhatsApp number = no WhatsApp buttons).

### Change headings or paragraphs
**Website text & details** → pick the section (Top banner, About, Services, Industries, Why Arte, Contact) → edit → **Save**.

### Add the workshop photo
**Website text & details** → **Company details & contact** → **Workshop / factory photo** → upload → **Save**.
Use a **real** photo of the Arte workshop. Never use a stock or AI-generated "factory" image.

---

## Part D — Photo tips
- Clean background (white or plain), good light, product filling most of the frame.
- Landscape or square works best.
- Don't upload photos that show customer names, other brands' logos, or confidential drawings.
- Only use photos Arte owns or has permission to use.

## Part E — Rules for what goes on the website
- No confidential dimensions, drawings, tolerances or prices.
- Don't claim certifications, awards or customers you can't prove.
- Replacement parts must not be described as original parts of another brand.

## Part F — If something goes wrong
- **Change not showing after 5 minutes:** refresh the website with Ctrl+F5 (or pull down to refresh on a phone).
- **Made a mistake:** edit it again and Save. Every change is recorded, so the website manager can restore any earlier version from GitHub (repository → History).
- **"Bad credentials" when logging in:** the token has expired or been deleted. Create a new one (Part A3).
- **Website looks broken after a change:** tell the website manager. They can undo the last change on GitHub in a minute.

## Where do quote requests go?
Not into the admin panel. Enquiries from the "Request a Quote" form are **emailed** to the company inbox, with any drawings or photos attached, once the email connection is set up (see README section 4).



