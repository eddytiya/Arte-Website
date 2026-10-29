const adminButton = document.getElementById('admin-view');
const clientButton = document.getElementById('client-view');
const adminFrame = document.getElementById('admin-frame');
const clientFrame = document.getElementById('client-frame');
adminFrame.src = '/studio-7c9e4a2f6b18d035/local.html';
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  adminFrame.src = '/studio-7c9e4a2f6b18d035/local.html';
  document.getElementById('editing-help').textContent = 'Local editing: Sign in with your local admin username and password. Open Add product, enter the details and upload a photo, then Save product. Select Client website to see saved changes. The editor stays open when switching views.';
}
function setView(client) {
  adminButton.setAttribute('aria-pressed', String(!client));
  clientButton.setAttribute('aria-pressed', String(client));
  adminFrame.hidden = client;
  clientFrame.hidden = !client;
  // Refresh the preview after each save without reloading the editor or losing drafts.
  if (client) clientFrame.src = '/';
}
adminButton.addEventListener('click', () => setView(false));
clientButton.addEventListener('click', () => setView(true));
if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
  document.getElementById('editing-help').textContent = 'Online editing: Sign in with your admin username and password. Saving commits changes to GitHub and starts a Vercel deployment. The client website updates when deployment completes. Your editor stays open when switching views.';
}

