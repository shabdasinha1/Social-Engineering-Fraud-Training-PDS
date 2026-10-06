// Runs from <head> before first paint. index.html's default title is the learner title, so
// a full page load of an admin address would otherwise show "SATARK" until React sets
// "SATARK Admin". Kept as a same-origin file because the production CSP (script-src 'self')
// blocks inline scripts. Mirrors ADMIN_DOCUMENT_TITLE and isAdminPath in src/.
if (location.pathname === '/admin' || location.pathname.indexOf('/admin/') === 0) {
  document.title = 'SATARK Admin'
}
