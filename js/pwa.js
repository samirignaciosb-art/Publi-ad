// js/pwa.js — Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ UbiPet SW registrado:', reg.scope))
      .catch(err => console.log('❌ SW error:', err))
  })
}
