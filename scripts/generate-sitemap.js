import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get domain from environment variable or use default
const SITE_DOMAIN = process.env.VITE_SITE_DOMAIN || 'https://mongilearnstocode.github.io/ai-landscapedesigner-app';
const BUILD_DATE = process.env.VITE_BUILD_DATE || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

// Ensure domain doesn't end with slash for consistent URL building
const baseUrl = SITE_DOMAIN.replace(/\/$/, '');

const pages = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    lastmod: BUILD_DATE
  },
  {
    path: '/designer',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: BUILD_DATE
  },
  {
    path: '/history',
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: BUILD_DATE
  },
  {
    path: '/pricing',
    changefreq: 'monthly',
    priority: '0.6',
    lastmod: BUILD_DATE
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: '0.5',
    lastmod: BUILD_DATE
  },
  {
    path: '/terms',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: '2025-01-15' // Legal pages might have different modification dates
  },
  {
    path: '/privacy',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: '2025-01-15' // Legal pages might have different modification dates
  }
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// Write to public directory
const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, sitemapXml, 'utf8');

console.log(`✅ Sitemap generated at ${outputPath}`);
console.log(`📍 Domain: ${baseUrl}`);
console.log(`📅 Build date: ${BUILD_DATE}`);