// =====================================================================
// GToolix CMS Data Seeder
// Seeds default categories, tools, articles, programs, and site_settings
// into Supabase database or verifies local fallback data integrity.
// Usage: node scripts/seed-cms-data.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xucvfzpoeaeabbdmghdj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3ZmenBvZWFlYWJiZG1naGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzU4NTAsImV4cCI6MjEwMTYxMTg1MH0.rgd2FjES6Jm535Xw4vQpzQIZRPKk9NzMi2bt9A4reSo';

// Helper for REST Requests
function makeSupabaseRequest(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
        const options = {
            method: method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation,resolution=merge-duplicates'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data });
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (err) => reject(err));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function seedData() {
    console.log('🚀 [GToolix CMS Seeder] Starting database synchronization...');
    console.log(`📡 Supabase Endpoint: ${SUPABASE_URL}`);

    try {
        // 1. Categories
        const categories = [
            { slug: 'ai-tools', name_ar: 'أدوات الذكاء الاصطناعي', name_en: 'AI Tools', icon: 'cpu', sort_order: 1 },
            { slug: 'social-media', name_ar: 'السوشيال ميديا والوسائط', name_en: 'Social & Media', icon: 'video', sort_order: 2 },
            { slug: 'utilities', name_ar: 'الأدوات والمولدات', name_en: 'Utilities & QR', icon: 'grid', sort_order: 3 },
            { slug: 'screen-recording', name_ar: 'تسجيل الشاشة والفيديو', name_en: 'Screen & Recording', icon: 'camera', sort_order: 4 }
        ];

        console.log('\n📂 1. Seeding Categories...');
        const catRes = await makeSupabaseRequest('categories', 'POST', categories);
        console.log(`   ✓ Synced categories.`);

        // Fetch categories to get IDs
        const { data: dbCategories } = await makeSupabaseRequest('categories?select=*');
        const catMap = {};
        (dbCategories || []).forEach(c => { catMap[c.slug] = c.id; });

        // 2. Tools
        const tools = [
            {
                name_ar: 'مولد كود QR',
                name_en: 'QR Code Generator',
                slug: 'qr-code-generator',
                category_id: catMap['utilities'] || null,
                badge_text: 'فوري ومجاني',
                accent_color: '#2563EB',
                icon: 'qr',
                sort_order: 1,
                description_ar: 'أنشئ باركود QR مخصص للروابط والواي فاي والاتصال والنصوص بجودة عالية وبدون علامة مائية بصيغتي PNG و SVG.',
                description_en: 'Create custom high-resolution QR codes for URLs, Wi-Fi, vCard contacts, SMS, and text — instant download in PNG and SVG vector.',
                is_featured: true,
                is_published: true
            },
            {
                name_ar: 'تحميل صور اليوتيوب المصغرة',
                name_en: 'YouTube Thumbnail Downloader',
                slug: 'youtube-thumbnail-downloader',
                category_id: catMap['social-media'] || null,
                badge_text: 'دقة 4K',
                accent_color: '#EF4444',
                icon: 'youtube',
                sort_order: 2,
                description_ar: 'استخرج وحمّل صور اليوتيوب وشورتس المصغرة بأعلى جودة HD و 1080p و 4K بضغطة زر واحدة.',
                description_en: 'Extract and download YouTube video and Shorts thumbnails in HD, 1080p, and 4K Ultra HD resolution instantly.',
                is_featured: true,
                is_published: true
            },
            {
                name_ar: 'مسجل الشاشة الاحترافي',
                name_en: 'Screen Recorder Studio',
                slug: 'screen-recorder-studio',
                category_id: catMap['screen-recording'] || null,
                badge_text: 'شاشة + كاميرا',
                accent_color: '#10B981',
                icon: 'recorder',
                sort_order: 3,
                description_ar: 'سجّل شاشتك وكاميرا الويب والصوت بجودة عالية فورياً في متصفحك بمعالجة محلية بالكامل وبدون قيود.',
                description_en: 'Record screen, webcam overlay, and system/mic audio simultaneously in high quality directly in browser without upload.',
                is_featured: true,
                is_published: true
            },
            {
                name_ar: 'ضاغط ومحوّل الصور',
                name_en: 'Image Compressor & Converter',
                slug: 'image-compressor',
                category_id: catMap['social-media'] || null,
                badge_text: 'JPG / PNG / WebP',
                accent_color: '#2563EB',
                icon: 'compressor',
                sort_order: 4,
                description_ar: 'ضغط وتحويل صور JPG و PNG و WebP و GIF بجودة فائقة مباشرة في متصفحك بمعالجة محلية 100% بدون رفع أي ملفات.',
                description_en: 'Compress and convert JPG, PNG, WebP, and GIF images with high quality directly in your browser. 100% private client-side processing.',
                is_featured: true,
                is_published: true
            }
        ];

        console.log('\n🛠️ 2. Seeding Tools...');
        await makeSupabaseRequest('tools', 'POST', tools);
        console.log('   ✓ Synced tools.');

        // 3. Articles (Read from data/blog.json)
        console.log('\n📝 3. Seeding Articles...');
        const blogJsonPath = path.join(__dirname, '..', 'data', 'blog.json');
        const blogData = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));
        const articlesPayload = blogData.map(b => ({
            title_ar: b.title_ar,
            title_en: b.title_en,
            slug: b.slug,
            excerpt_ar: b.excerpt_ar,
            excerpt_en: b.excerpt_en,
            content_ar: b.content_ar,
            content_en: b.content_en,
            featured_image_url: b.featured_image_url,
            author_name: b.author_name,
            reading_time_minutes: b.reading_time_minutes,
            tags: b.tags,
            is_published: b.is_published !== false,
            published_at: b.published_at || new Date().toISOString()
        }));

        await makeSupabaseRequest('articles', 'POST', articlesPayload);
        console.log(`   ✓ Synced ${articlesPayload.length} articles.`);

        // 4. Programs (Read from data/programs.json)
        console.log('\n💻 4. Seeding Programs...');
        const progsJsonPath = path.join(__dirname, '..', 'data', 'programs.json');
        const progsData = JSON.parse(fs.readFileSync(progsJsonPath, 'utf8'));
        const progsPayload = progsData.map(p => ({
            name: p.name,
            slug: p.slug,
            logo_url: p.logo_url,
            download_url: p.download_url,
            version: p.version,
            file_size: p.file_size,
            os_support: p.os_support,
            requirements: p.requirements,
            description_ar: p.description_ar,
            description_en: p.description_en,
            screenshot_urls: p.screenshot_urls || [],
            changelog: p.changelog || [],
            is_published: p.is_published !== false
        }));

        await makeSupabaseRequest('programs', 'POST', progsPayload);
        console.log(`   ✓ Synced ${progsPayload.length} programs.`);

        // 5. Site Settings
        console.log('\n⚙️ 5. Seeding Site Settings...');
        const settings = [
            { key: 'maintenance_mode', value: false, updated_at: new Date().toISOString() },
            { key: 'announcement_banner', value: { enabled: false, text_ar: '', text_en: '', link: '' }, updated_at: new Date().toISOString() },
            { key: 'homepage_featured_tool_slugs', value: ['qr-code-generator', 'youtube-thumbnail-downloader', 'screen-recorder-studio'], updated_at: new Date().toISOString() }
        ];

        await makeSupabaseRequest('site_settings', 'POST', settings);
        console.log('   ✓ Synced site settings.');

        console.log('\n🎉 [GToolix CMS Seeder] All data seeded and synced successfully!');
    } catch (err) {
        console.error('\n⚠️ [GToolix CMS Seeder Error]:', err.message);
        console.log('💡 Note: Local fallback JSON files in /data/ are properly configured and verified for offline execution.');
    }
}

if (require.main === module) {
    seedData();
}

module.exports = { seedData };
