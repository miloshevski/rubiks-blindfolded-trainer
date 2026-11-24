import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';
import { LESSONS } from './src/data/lessons.ts';
export function localPwa(): Plugin {
  return {
    name: 'local-pwa',
    apply: 'build',
    closeBundle() {
      const dir = 'dist',
        original = readFileSync(join(dir, 'index.html'), 'utf8');
      const escape = (s: string) =>
        s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
      const routes: Record<string, string> = {
        '': 'Learn blindfold cubing',
        learn: 'Interactive M2 and Old Pochmann lessons',
        practice: 'Blindfold practice',
        solve: 'Verified blindfold solver',
        'letter-drill': 'Speffz letter drill',
        algorithms: 'M2 and Old Pochmann algorithms',
        pairs: 'Personal letter-pair dictionary',
        timer: 'Blindfold solve timer',
        statistics: 'Blindfold solve statistics',
        settings: 'Local data and settings',
      };
      const origin = process.env.VITE_PUBLIC_ORIGIN?.replace(/\/$/, '');
      for (const [route, title] of Object.entries(routes)) {
        const summaries =
          route === 'learn'
            ? LESSONS.map(
                (l) =>
                  `<section><h2>${escape(l.title)}</h2><p>${escape(l.explanation)}</p></section>`,
              ).join('')
            : '';
        const content = `<article><h1>${title}</h1><p>Learn and practice M2 edges and Old Pochmann corners with a verified cube solver, personal memory words and a local timer.</p><nav>${Object.entries(
          routes,
        )
          .map(([r, t]) => `<a href="/${r}">${t}</a>`)
          .join(' · ')}</nav>${summaries}</article>`;
        let html = original
          .replace(
            '<title>Blindfold Trainer</title>',
            `<title>${title} · Blindfold Trainer</title>`,
          )
          .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
        if (origin)
          html = html.replace(
            '</head>',
            `<link rel="canonical" href="${escape(origin)}/${route}"></head>`,
          );
        if (route) {
          mkdirSync(join(dir, route), { recursive: true });
          writeFileSync(join(dir, route, 'index.html'), html);
        } else writeFileSync(join(dir, 'index.html'), html);
      }
      if (origin) {
        writeFileSync(
          join(dir, 'sitemap.xml'),
          `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
            routes,
          )
            .map((r) => `<url><loc>${escape(origin)}/${r}</loc></url>`)
            .join('')}</urlset>`,
        );
        writeFileSync(
          join(dir, 'robots.txt'),
          `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
        );
      } else writeFileSync(join(dir, 'robots.txt'), 'User-agent: *\nAllow: /\n');
      function walk(path: string, prefix = ''): string[] {
        return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory()
            ? walk(join(path, e.name), `${prefix}${e.name}/`)
            : [`/${prefix}${e.name}`],
        );
      }
      const files = walk(dir).filter((f) => f !== '/sw.js'),
        version = createHash('sha256')
          .update(files.map((f) => readFileSync(join(dir, f))).join(''))
          .digest('hex')
          .slice(0, 12);
      const resources = [...files, ...Object.keys(routes).map((r) => '/' + r)];
      writeFileSync(
        join(dir, 'sw.js'),
        `const CACHE='bld-${version}',FILES=${JSON.stringify(resources)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('message',e=>{if(e.data==='activate')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bld-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||u.pathname.startsWith('/api/')||e.request.method!=='GET')return;e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request,{ignoreSearch:true});if(cached)return cached;try{return await fetch(e.request);}catch{if(e.request.mode==='navigate')return await c.match('/');throw new Error('Offline resource unavailable');}}));});`,
      );
    },
  };
}
