import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { SITE } from './site.config';

function applySiteTokens(html: string): string {
  return html
    .replaceAll('__SITE_ORIGIN__', SITE.origin)
    .replaceAll('__SITE_TITLE__', SITE.title)
    .replaceAll('__SITE_DESCRIPTION__', SITE.description)
    .replaceAll('__SITE_NAME__', SITE.name)
    .replaceAll('__SITE_THEME_COLOR__', SITE.themeColor)
    .replaceAll('__SITE_GITHUB__', SITE.githubRepo);
}

function writeSeoFiles(outDir: string): void {
  writeFileSync(
    resolve(outDir, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE.origin}/sitemap.xml\n`,
  );

  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    resolve(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n` +
      `    <loc>${SITE.origin}/</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>weekly</changefreq>\n` +
      `    <priority>1.0</priority>\n` +
      `  </url>\n` +
      `</urlset>\n`,
  );

  writeFileSync(resolve(outDir, 'CNAME'), `${SITE.host}\n`);
}

export function siteSeoPlugin(): Plugin {
  return {
    name: 'site-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return applySiteTokens(html);
      },
    },
    closeBundle() {
      writeSeoFiles(resolve('dist'));
    },
  };
}
