/** @type {import('next-sitemap').IConfig} */
function resolveEnvironmentMode() {
  const explicit = (process.env.ENV || "").trim().toUpperCase();
  if (explicit === "LOCAL" || explicit === "DEV" || explicit === "DEVELOPMENT") {
    return "LOCAL";
  }
  return "PROD";
}

function resolveSiteUrl() {
  if (resolveEnvironmentMode() === "PROD") {
    return "https://rollerstat.com";
  }

  const localBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return localBase.replace(/\/$/, "");
}

module.exports = {
  siteUrl: resolveSiteUrl(),
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/api/*'],
  additionalPaths: async () => {
    const locales = ['en', 'es', 'fr', 'it', 'pt'];
    const paths = [];
    
    locales.forEach(locale => {
      paths.push({
        loc: `/${locale}`,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      });
      paths.push({
        loc: `/${locale}/news`,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
      paths.push({
        loc: `/${locale}/blogs`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });
    
    return paths;
  },
};
