const fs = require('fs');
const path = require('path');

console.log('=== GToolix Full Architectural, CMS, Isolation & SEO Health Verification ===\n');

let errorCount = 0;
function assert(condition, message) {
    if (!condition) {
        console.error(`[ERROR] FAIL: ${message}`);
        errorCount++;
    } else {
        console.log(`[SUCCESS] PASS: ${message}`);
    }
}

// 1. Verify Data Layer
console.log('--- 1. Data Layer Checks ---');
const dataDir = path.join(__dirname, '..', 'data');
const toolsJsonPath = path.join(dataDir, 'tools.json');
const catsJsonPath = path.join(dataDir, 'categories.json');
const blogJsonPath = path.join(dataDir, 'blog.json');
const programsJsonPath = path.join(dataDir, 'programs.json');

assert(fs.existsSync(toolsJsonPath), 'tools.json exists');
assert(fs.existsSync(catsJsonPath), 'categories.json exists');
assert(fs.existsSync(blogJsonPath), 'blog.json exists');
assert(fs.existsSync(programsJsonPath), 'programs.json exists');

try {
    const tools = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf8'));
    assert(Array.isArray(tools) && tools.length === 4, `tools.json contains exactly 4 active tools (found: ${tools.length})`);
    tools.forEach(t => {
        assert(t.id && t.url && t.name && t.nameAr && t.description && t.descriptionAr && t.category, `Tool ${t.id} has complete metadata`);
        assert(t.url.startsWith('/tools/'), `Tool ${t.id} has tools-first URL (${t.url})`);
    });

    const cats = JSON.parse(fs.readFileSync(catsJsonPath, 'utf8'));
    assert(Array.isArray(cats) && cats.length >= 3, `categories.json contains categories (found: ${cats.length})`);

    const blog = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));
    assert(Array.isArray(blog) && blog.length >= 1, `blog.json contains articles (found: ${blog.length})`);

    const programs = JSON.parse(fs.readFileSync(programsJsonPath, 'utf8'));
    assert(Array.isArray(programs), `programs.json is valid array (found: ${programs.length} entries)`);
} catch (e) {
    assert(false, `Data layer JSON parsing error: ${e.message}`);
}

// 2. Standalone Gemini Module Verification
console.log('\n--- 2. Standalone Gemini Module Checks ---');
const geminiModuleDir = fs.existsSync(path.join(__dirname, '..', 'gemini-watermark-remover'))
    ? path.join(__dirname, '..', 'gemini-watermark-remover')
    : path.join(__dirname, '..', 'archived_gemini_tool');
assert(fs.existsSync(geminiModuleDir), 'gemini-watermark-remover / archived_gemini_tool folder exists');

// 3. Section Index Pages & Dynamic Templates Verification
console.log('\n--- 3. Section Index Pages & Dynamic Templates Checks ---');
const toolsHtml = path.join(__dirname, '..', 'tools', 'index.html');
const blogHtml = path.join(__dirname, '..', 'blog', 'index.html');
const programsHtml = path.join(__dirname, '..', 'programs', 'index.html');
const articleDynamicHtml = path.join(__dirname, '..', 'blog', 'article.html');
const programDynamicHtml = path.join(__dirname, '..', 'programs', 'program.html');
const contentClientJs = path.join(__dirname, '..', 'static', 'js', 'content-client.js');

assert(fs.existsSync(toolsHtml), 'tools/index.html exists');
assert(fs.existsSync(blogHtml), 'blog/index.html exists');
assert(fs.existsSync(programsHtml), 'programs/index.html exists');
assert(fs.existsSync(articleDynamicHtml), 'blog/article.html dynamic template exists');
assert(fs.existsSync(programDynamicHtml), 'programs/program.html dynamic template exists');
assert(fs.existsSync(contentClientJs), 'static/js/content-client.js SDK exists');

// Verify tools/index.html
const toolsContent = fs.readFileSync(toolsHtml, 'utf8');
assert(!toolsContent.includes('gemini-engine.bundle.js'), 'tools/index.html does not load heavy Gemini engine');
assert(!toolsContent.includes('qrcode.min.js'), 'tools/index.html does not load qrcode engine');
assert(toolsContent.includes('application/ld+json'), 'tools/index.html includes Schema.org JSON-LD');
assert(toolsContent.includes('rel="canonical"') && toolsContent.includes('https://www.gtoolix.com/tools'), 'tools/index.html has self-canonical');

// Verify blog/index.html & article template
const blogContent = fs.readFileSync(blogHtml, 'utf8');
assert(blogContent.includes('application/ld+json'), 'blog/index.html includes Schema.org Blog markup');
assert(blogContent.includes('common.navTools') && blogContent.includes('common.navBlog'), 'blog/index.html includes full navbar i18n');
assert(blogContent.includes('rel="canonical"') && blogContent.includes('https://www.gtoolix.com/blog'), 'blog/index.html has self-canonical');

const articleContent = fs.readFileSync(articleDynamicHtml, 'utf8');
assert(articleContent.includes('GToolixContent.getArticleBySlug'), 'blog/article.html connects to GToolixContent');
assert(articleContent.includes('article-not-found'), 'blog/article.html includes 404 state');

const programContent = fs.readFileSync(programDynamicHtml, 'utf8');
assert(programContent.includes('GToolixContent.getProgramBySlug'), 'programs/program.html connects to GToolixContent');
assert(programContent.includes('prog-not-found'), 'programs/program.html includes 404 state');

// 4. Modular Tools Directory Checks
console.log('\n--- 4. Modular Tools Directory Checks ---');
const modularTools = [
    { dir: 'tools/qr-code-generator', html: 'index.html', js: 'qr-tool.js', engine: 'qrcode.min.js' },
    { dir: 'tools/youtube-thumbnail-downloader', html: 'index.html', js: 'downloader.js' },
    { dir: 'tools/screen-recorder-studio', html: 'index.html', js: 'recorder.js' },
    { dir: 'tools/image-compressor', html: 'index.html', js: 'compressor.js' }
];

modularTools.forEach(mt => {
    const dPath = path.join(__dirname, '..', mt.dir);
    assert(fs.existsSync(dPath), `${mt.dir} folder exists`);
    assert(fs.existsSync(path.join(dPath, mt.html)), `${mt.dir}/${mt.html} exists`);
    assert(fs.existsSync(path.join(dPath, mt.js)), `${mt.dir}/${mt.js} exists`);
    if (mt.engine) {
        assert(fs.existsSync(path.join(dPath, mt.engine)), `${mt.dir}/${mt.engine} exists`);
    }
});

// 5. Routing & Server Configurations
console.log('\n--- 5. Routing & Server Configuration Checks ---');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
const robots = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');

// Dynamic rewrites in vercel.json
assert(vercelConfig.rewrites.some(rw => rw.source === '/blog/:slug((?!index$).+)'), 'vercel.json has dynamic /blog/:slug rewrite');
assert(vercelConfig.rewrites.some(rw => rw.source === '/programs/:slug((?!index$).+)'), 'vercel.json has dynamic /programs/:slug rewrite');

const expectedPublicRoutes = [
    '/tools',
    '/blog',
    '/programs',
    '/tools/qr-code-generator',
    '/tools/youtube-thumbnail-downloader',
    '/tools/screen-recorder-studio',
    '/tools/image-compressor'
];
expectedPublicRoutes.forEach(r => {
    const hasVercel = vercelConfig.rewrites.some(rw => rw.source === r);
    assert(hasVercel, `vercel.json contains rewrite for ${r}`);
    assert(sitemap.includes(`https://www.gtoolix.com${r}`), `sitemap.xml includes ${r}`);
});

// CSP Headers
const headersStr = JSON.stringify(vercelConfig.headers);
assert(headersStr.includes('https://*.supabase.co'), 'vercel.json CSP includes Supabase endpoint in connect-src');

// Robots.txt verification
assert(robots.includes('User-agent: Mediapartners-Google'), 'robots.txt allows Mediapartners-Google (AdSense)');
assert(robots.includes('User-agent: *') && robots.includes('Allow: /'), 'robots.txt allows Googlebot and standard crawlers');
assert(robots.includes('Sitemap: https://www.gtoolix.com/sitemap.xml'), 'robots.txt includes sitemap URL');

// 6. CMS & Database Schema Verification
console.log('\n--- 6. CMS & Database Schema Verification ---');
const schemaPath = path.join(__dirname, '..', 'gtoolix-monitoring-site', 'schema.sql');
assert(fs.existsSync(schemaPath), 'schema.sql exists');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.categories'), 'schema.sql defines public.categories table');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.tools'), 'schema.sql defines public.tools table');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.articles'), 'schema.sql defines public.articles table');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.programs'), 'schema.sql defines public.programs table');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.site_settings'), 'schema.sql defines public.site_settings table');
assert(schemaSql.includes('public.handle_updated_at()'), 'schema.sql defines updated_at trigger function');
assert(schemaSql.includes('public.is_admin()'), 'schema.sql secures CMS with public.is_admin() RLS policies');

// 7. Monitoring Site CMS UI & Script Verification
console.log('\n--- 7. Monitoring Site CMS UI Checks ---');
const monitorHtmlPath = path.join(__dirname, '..', 'gtoolix-monitoring-site', 'index.html');
const monitorAppPath = path.join(__dirname, '..', 'gtoolix-monitoring-site', 'app.js');

const monitorHtml = fs.readFileSync(monitorHtmlPath, 'utf8');
assert(monitorHtml.includes('tab-cms-tools') && monitorHtml.includes('tab-cms-articles'), 'monitoring index.html contains CMS navigation tabs');
assert(monitorHtml.includes('cmsToolModal') && monitorHtml.includes('cmsArticleModal'), 'monitoring index.html contains CMS editor modals');

const monitorApp = fs.readFileSync(monitorAppPath, 'utf8');
assert(monitorApp.includes('loadCmsTools') && monitorApp.includes('loadCmsArticles'), 'monitoring app.js implements CMS load & edit methods');
assert(monitorApp.includes('validateSlug'), 'monitoring app.js includes real-time slug validator');

// 8. AdSense & Ads.txt Integrity
console.log('\n--- 8. AdSense & Ads.txt Integrity ---');
const adsTxt = path.join(__dirname, '..', 'ads.txt');
assert(fs.existsSync(adsTxt), 'ads.txt exists');
const adsContent = fs.readFileSync(adsTxt, 'utf8');
assert(adsContent.includes('pub-9332457707004456'), 'ads.txt has accurate publisher ID (pub-9332457707004456)');

const officialAdSenseSrc = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9332457707004456';
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes(officialAdSenseSrc), 'index.html contains official static AdSense script tag');

const enIndexHtml = fs.readFileSync(path.join(__dirname, '..', 'en', 'index.html'), 'utf8');
assert(enIndexHtml.includes(officialAdSenseSrc), 'en/index.html contains official static AdSense script tag');

const qrToolHtml = fs.readFileSync(path.join(__dirname, '..', 'tools', 'qr-code-generator', 'index.html'), 'utf8');
assert(qrToolHtml.includes(officialAdSenseSrc), 'tools/qr-code-generator/index.html contains official static AdSense script tag');

const blogIndexHtml = fs.readFileSync(path.join(__dirname, '..', 'blog', 'index.html'), 'utf8');
assert(blogIndexHtml.includes(officialAdSenseSrc), 'blog/index.html contains official static AdSense script tag');

const programsIndexHtml = fs.readFileSync(path.join(__dirname, '..', 'programs', 'index.html'), 'utf8');
assert(programsIndexHtml.includes(officialAdSenseSrc), 'programs/index.html contains official static AdSense script tag');

console.log('\n=============================================');
if (errorCount === 0) {
    console.log('ALL ARCHITECTURAL, CMS & SEO TESTS PASSED PERFECTLY (100% HEALTHY)!');
    process.exit(0);
} else {
    console.error(`${errorCount} TEST(S) FAILED.`);
    process.exit(1);
}
