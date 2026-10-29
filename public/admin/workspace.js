const adminButton = document.getElementById('admin-view');
const clientButton = document.getElementById('client-view');
const adminFrame = document.getElementById('admin-frame');
const clientFrame = document.getElementById('client-frame');
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  adminFrame.src = '/admin/local.html';
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
  document.getElementById('editing-help').textContent = 'Publishing: Sign in to the editor with your GitHub access. Saving updates the repository; the website updates after deployment. Select Client website to preview the published result, and switch back to continue editing.';
}
