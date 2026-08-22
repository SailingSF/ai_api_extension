/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const siteUrl = (process.env.SITE_URL || process.env.REACT_APP_SITE_URL || 'https://yourdomain.com').replace(/\/$/, '');

// Declare your public, crawlable routes here
const routes = [
  '/',
  '/arena',
  '/generate',
  '/premium',
  '/gallery',
  '/info',
  '/billing',
];

function generateSitemapXml() {
  const nowIso = new Date().toISOString();
  const urls = routes
    .map((route) => {
      const loc = `${siteUrl}${route}`;
      const isGallery = route === '/gallery';
      const changefreq = isGallery ? 'daily' : 'weekly';
      const priority = route === '/' ? '1.0' : isGallery ? '0.8' : '0.7';
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function generateRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeOutputs() {
  const buildDir = path.resolve(__dirname, '..', 'build');
  ensureDir(buildDir);

  const sitemapPath = path.join(buildDir, 'sitemap.xml');
  const robotsPath = path.join(buildDir, 'robots.txt');

  fs.writeFileSync(sitemapPath, generateSitemapXml(), 'utf8');
  fs.writeFileSync(robotsPath, generateRobotsTxt(), 'utf8');

  console.log(`Sitemap generated at: ${sitemapPath}`);
  console.log(`Robots.txt generated at: ${robotsPath}`);
}

writeOutputs();


