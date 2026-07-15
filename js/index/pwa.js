if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/sw.js')
      .then(()=>console.log('SW registered'))
      .catch(e=>console.log('SW error:', e));
  });
}

// Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  deferredPrompt = e;
  // Show install banner after 3 seconds
  setTimeout(()=>{
    if(deferredPrompt && !localStorage.getItem('pwa-dismissed')){
      showInstallBanner();
    }
  }, 3000);
});

function showInstallBanner(){
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = 'position:fixed;bottom:70px;left:.75rem;right:.75rem;z-index:300;' +
    'background:var(--card);border:1px solid rgba(212,240,0,.3);border-radius:12px;' +
    'padding:.85rem 1rem;display:flex;align-items:center;gap:.75rem;' +
    'box-shadow:0 4px 20px rgba(0,0,0,.5);animation:fi .3s ease';
  banner.innerHTML =
    '<img src="favicon.png" style="width:40px;height:40px;border-radius:8px">' +
    '<div style="flex:1">' +
      '<div style="font-weight:700;font-size:.85rem">Urban Padel Life</div>' +
      '<div style="font-size:.72rem;color:var(--muted2)">Instala la app en tu cel</div>' +
    '</div>' +
    '<button onclick="installPWA()" style="padding:.4rem .85rem;border-radius:7px;' +
      'background:var(--accent);border:none;color:var(--black);font-weight:700;' +
      'font-size:.78rem;cursor:pointer;font-family:inherit">Instalar</button>' +
    '<button onclick="dismissInstall()" style="background:transparent;border:none;' +
      'color:var(--muted2);cursor:pointer;font-size:1.1rem;padding:.2rem">✕</button>';
  document.body.appendChild(banner);
}

export function installPWA(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(()=>{
      deferredPrompt = null;
      dismissInstall();
    });
  }
}

export function dismissInstall(){
  localStorage.setItem('pwa-dismissed','1');
  const b = document.getElementById('install-banner');
  if(b) b.remove();
}
