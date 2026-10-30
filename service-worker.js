const CACHE='abu-adzka-production-v85';
const FILES=['./','index.html','styles.css','workspace.css','app.js','workspace.js','config.js','google-transport.js','password-ui.js','executive.js','executive-model.js','executive.css','rupiah-input.js','record-ui.js?v=8','manifest.webmanifest','logo-2026.svg','assets/login-background.jpeg'].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('abu-adzka-production-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!FILES.includes(e.request.url))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));});
