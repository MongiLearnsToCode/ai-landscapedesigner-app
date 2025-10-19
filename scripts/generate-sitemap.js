import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input validation and error handling functions
function validateDomain(domain) {
  try {
    const url = new URL(domain);
    if (!url.protocol.startsWith('http')) {
      throw new Error('Domain must use HTTP or HTTPS protocol');
    }
    return url.origin;
  } catch (error) {
    console.error(`❌ Invalid domain "${domain}": ${error.message}`);
    console.log('📍 Using default domain instead');
    return 'https://ai-landscapedesigner.com';
  }
}

function validateBuildDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(dateString)) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return dateString;
    }
  }
  console.error(`❌ Invalid build date "${dateString}", using current date`);
  return new Date().toISOString().split('T')[0];
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&#39;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function getFileModificationDate(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  } catch (error) {
    console.warn(`⚠️ Could not get modification date for ${filePath}: ${error.message}`);
    return process.env.SITEMAP_LASTMOD || new Date().toISOString().split('T')[0];
  }
}

// Get and validate inputs
const SITE_DOMAIN = process.env.VITE_SITE_DOMAIN || 'https://ai-landscapedesigner.com';
const BUILD_DATE = process.env.VITE_BUILD_DATE || new Date().toISOString().split('T')[0];

const baseUrl = validateDomain(SITE_DOMAIN);
const buildDate = validateBuildDate(BUILD_DATE);

const pages = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    lastmod: buildDate
  },
  {
    path: '/designer',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: buildDate
  },
  {
    path: '/history',
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: buildDate
  },
  {
    path: '/pricing',
    changefreq: 'monthly',
    priority: '0.6',
    lastmod: buildDate
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: '0.5',
    lastmod: buildDate
  },
  {
    path: '/terms',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: getFileModificationDate(path.join(__dirname, '..', 'pages', 'TermsPage.tsx'))
  },
  {
    path: '/privacy',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: getFileModificationDate(path.join(__dirname, '..', 'pages', 'PrivacyPage.tsx'))
  }
];

try {
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${escapeXml(baseUrl + page.path)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Write to public directory
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  try {
    fs.mkdirSync(outputDir, { recursive: true });
  } catch (dirError) {
    console.error(`❌ Failed to create output directory ${outputDir}: ${dirError.message}`);
    process.exit(1);
  }

  // Write the sitemap file
  try {
    fs.writeFileSync(outputPath, sitemapXml, 'utf8');
    console.log(`✅ Sitemap generated at ${outputPath}`);
    console.log(`📍 Domain: ${baseUrl}`);
    console.log(`📅 Build date: ${buildDate}`);
  } catch (writeError) {
    console.error(`❌ Failed to write sitemap to ${outputPath}: ${writeError.message}`);
    process.exit(1);
  }

} catch (error) {
  console.error(`❌ Fatal error during sitemap generation: ${error.message}`);
  process.exit(1);
}