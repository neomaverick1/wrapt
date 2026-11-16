// Adds the "Get the app" button to the built website and puts the APK next to it.
// Android phones download the APK; iPhones get the Add to Home Screen steps.
// Usage: node add-download.mjs <site dir> <apk path> <app name> [icon path] [site base, e.g. /savor/]
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const [dir, apk, name, icon, base = './'] = process.argv.slice(2);
const file = basename(apk);
const href = base + file;
const iconHref = base + 'apple-touch-icon.png';
copyFileSync(apk, join(dir, file));
if (icon && existsSync(icon)) copyFileSync(icon, join(dir, 'apple-touch-icon.png'));

const head = `
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${name}">
${icon ? `<link rel="apple-touch-icon" href="${iconHref}">` : ''}
<style>
#ga-btn{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:2147483646;display:flex;align-items:center;gap:8px;height:44px;padding:0 18px;border:0;border-radius:999px;background:#15171c;color:#fff;font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.28);cursor:pointer;text-decoration:none}
#ga-btn svg{width:18px;height:18px}
#ga-sheet{position:fixed;inset:0;z-index:2147483647;display:none;align-items:flex-end;justify-content:center;background:rgba(10,12,16,.5);backdrop-filter:blur(6px)}
#ga-sheet.open{display:flex}
#ga-card{width:min(440px,100%);margin:0 auto;background:#fff;color:#15171c;border-radius:22px 22px 0 0;padding:22px 22px calc(22px + env(safe-area-inset-bottom));font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
@media (min-width:600px){#ga-sheet{align-items:center}#ga-card{border-radius:22px}}
#ga-card h2{margin:0 0 12px;font-size:19px}#ga-card h3{margin:16px 0 6px;font-size:15px}#ga-card ol{margin:0;padding-left:20px}
#ga-card a.dl{display:inline-block;margin-top:4px;padding:10px 16px;border-radius:12px;background:#15171c;color:#fff;text-decoration:none;font-weight:600}
#ga-card p{margin:6px 0 0;color:#5d6270;font-size:13px}#ga-x{float:right;border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:#5d6270}
</style>`;

const body = `
<div id="ga-root"></div>
<script>
(function(){
  var ua=navigator.userAgent, ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1), android=/Android/.test(ua);
  var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
  if(standalone||window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())return;
  var phone='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>';
  var root=document.getElementById('ga-root');
  if(android){root.innerHTML='<a id="ga-btn" href="${href}" download="${file}">'+phone+'Android app</a>';return;}
  root.innerHTML='<button id="ga-btn" type="button">'+phone+(ios?'iPhone app':'Get the app')+'</button>'+
   '<div id="ga-sheet" role="dialog" aria-modal="true" aria-label="Get the app"><div id="ga-card"><button id="ga-x" aria-label="Close">&times;</button><h2>Get ${name}</h2>'+
   '<h3>iPhone and iPad</h3><ol><li>Open this page in Safari.</li><li>Tap Share.</li><li>Tap <b>Add to Home Screen</b>, then Add.</li></ol><p>${name} opens full screen from its own icon.</p>'+
   (ios?'':'<h3>Android</h3><a class="dl" href="${href}" download="${file}">Download ${file}</a><p>Open the file on your phone and allow the install when asked.</p>')+
   '</div></div>';
  var sheet=document.getElementById('ga-sheet');
  document.getElementById('ga-btn').onclick=function(){sheet.classList.add('open')};
  document.getElementById('ga-x').onclick=function(){sheet.classList.remove('open')};
  sheet.onclick=function(e){if(e.target===sheet)sheet.classList.remove('open')};
  addEventListener('keydown',function(e){if(e.key==='Escape')sheet.classList.remove('open')});
})();
</script>`;

for (const page of ['index.html', '404.html']) {
  const p = join(dir, page);
  if (!existsSync(p)) continue;
  let html = readFileSync(p, 'utf8');
  if (html.includes('id="ga-root"')) continue;
  html = html.replace('</head>', head + '\n</head>').replace(/<\/body>(?![\s\S]*<\/body>)/, body + '\n</body>');
  writeFileSync(p, html);
}
console.log(`Added ${file} and the Get the app button to ${dir}`);
