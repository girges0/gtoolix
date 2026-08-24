// =====================================================================
// GToolix Content Client — Resilient CMS Data Fetching & Fallback Layer
// Connects to Supabase Postgres with sessionStorage caching and static
// JSON fallbacks. Ensures 100% uptime, zero broken states, and fast LCP.
// =====================================================================
(function () {
    'use strict';

    if (window.GToolixContent) return;

    const SUPABASE_URL = window.GTOOLIX_SUPABASE_URL || 'https://xucvfzpoeaeabbdmghdj.supabase.co';
    const SUPABASE_ANON_KEY = window.GTOOLIX_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3ZmenBvZWFlYWJiZG1naGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzU4NTAsImV4cCI6MjEwMTYxMTg1MH0.rgd2FjES6Jm535Xw4vQpzQIZRPKk9NzMi2bt9A4reSo';
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

    let sbClient = null;

    function getSb() {
        if (sbClient) return sbClient;
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                return sbClient;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // Direct REST API Fallback if Supabase SDK is not loaded
    async function directRestFetch(endpoint, queryParams = '') {
        const url = `${SUPABASE_URL}/rest/v1/${endpoint}${queryParams ? '?' + queryParams : ''}`;
        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.json();
    }

    // Cache Helpers
    const CACHE_PREFIX = 'gt_cache_v8_';

    // Auto-clear legacy caches
    (function clearLegacyCache() {
        try {
            [sessionStorage, localStorage].forEach(store => {
                if (!store) return;
                for (let i = store.length - 1; i >= 0; i--) {
                    const k = store.key(i);
                    if (k && (k.startsWith('gt_cache_') || k.includes('articles') || k.includes('tools')) && !k.startsWith(CACHE_PREFIX)) {
                        store.removeItem(k);
                    }
                }
            });
        } catch (e) {}
    })();

    function getCache(key) {
        try {
            const raw = sessionStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
                sessionStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return parsed.data;
        } catch (e) {
            return null;
        }
    }

    function setCache(key, data) {
        try {
            sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) {}
    }

    // Static JSON Fallback Loader
    async function fetchStaticJson(filename) {
        try {
            const res = await fetch(`/data/${filename}?v=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (Array.isArray(json)) {
                return json.filter(Boolean);
            }
            return json;
        } catch (err) {
            console.warn(`[GToolixContent] Static fallback for /data/${filename} failed:`, err);
            return [];
        }
    }

    const GToolixContent = {
        // 1. Categories
        async getCategories() {
            const cached = getCache('categories');
            if (cached) return cached;

            try {
                const sb = getSb();
                let data;
                if (sb) {
                    const res = await sb.from('categories').select('*').order('sort_order', { ascending: true });
                    if (res.error) throw res.error;
                    data = res.data;
                } else {
                    data = await directRestFetch('categories', 'order=sort_order.asc');
                }

                if (Array.isArray(data) && data.length > 0) {
                    setCache('categories', data);
                    return data;
                }
                throw new Error('Empty categories response');
            } catch (err) {
                console.warn('[GToolixContent] Falling back to static categories.json:', err.message);
                const staticData = await fetchStaticJson('categories.json');
                const categories = Array.isArray(staticData) ? staticData : [];
                setCache('categories', categories);
                return categories;
            }
        },

        // 2. Tools (Published Only with Resilient Static Merge)
        async getTools() {
            const activeSlugs = new Set(['qr-code-generator', 'youtube-thumbnail-downloader', 'screen-recorder-studio', 'image-compressor']);
            const cached = getCache('tools');
            if (cached && Array.isArray(cached)) {
                const valid = cached.filter(t => t && t.slug && activeSlugs.has(t.slug) && !t.slug.includes('gemini'));
                if (valid.length === activeSlugs.size) return valid;
            }

            let dbTools = [];
            try {
                const sb = getSb();
                if (sb) {
                    const res = await sb.from('tools')
                        .select('*, categories(id, slug, name_ar, name_en, icon)')
                        .eq('is_published', true)
                        .order('sort_order', { ascending: true });
                    if (!res.error && Array.isArray(res.data)) dbTools = res.data;
                } else {
                    const data = await directRestFetch('tools', 'is_published=eq.true&select=*,categories(id,slug,name_ar,name_en,icon)&order=sort_order.asc');
                    if (Array.isArray(data)) dbTools = data;
                }
            } catch (err) {
                console.warn('[GToolixContent] Database fetch notice:', err.message);
            }

            const staticData = await fetchStaticJson('tools.json');
            const staticTools = Array.isArray(staticData) ? staticData : [];

            // Merge database tools with static tools fallback so newly added tools always show
            const toolMap = new Map();
            staticTools.forEach(t => {
                if (t && t.slug && activeSlugs.has(t.slug) && !t.slug.includes('gemini')) {
                    toolMap.set(t.slug, t);
                }
            });
            dbTools.forEach(t => {
                if (t && t.slug && activeSlugs.has(t.slug) && !t.slug.includes('gemini')) {
                    toolMap.set(t.slug, { ...toolMap.get(t.slug), ...t });
                }
            });

            const merged = Array.from(toolMap.values()).filter(t => t.is_published !== false && t.slug && activeSlugs.has(t.slug) && !t.slug.includes('gemini'));
            if (merged.length > 0) {
                setCache('tools', merged);
                return merged;
            }
            return staticTools.filter(t => t.slug && activeSlugs.has(t.slug) && !t.slug.includes('gemini'));
        },

        // 2b. Tool by Slug
        async getToolBySlug(slug) {
            if (!slug || slug.includes('gemini')) return null;
            const cacheKey = 'tool_' + slug;
            const cached = getCache(cacheKey);
            if (cached) return cached;

            try {
                const sb = getSb();
                let tool = null;
                if (sb) {
                    const res = await sb.from('tools')
                        .select('*, categories(id, slug, name_ar, name_en, icon)')
                        .eq('slug', slug)
                        .eq('is_published', true)
                        .maybeSingle();
                    if (!res.error && res.data) tool = res.data;
                } else {
                    const list = await directRestFetch('tools', `slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*,categories(id,slug,name_ar,name_en,icon)&limit=1`);
                    if (Array.isArray(list) && list.length > 0) tool = list[0];
                }

                if (tool) {
                    setCache(cacheKey, tool);
                    return tool;
                }
                throw new Error('Tool slug not found in Supabase');
            } catch (err) {
                console.warn(`[GToolixContent] Fallback search for tool "${slug}" in tools.json`);
                const allTools = await this.getTools();
                const found = (allTools || []).find(t => t.slug === slug || t.id === slug);
                if (found) setCache(cacheKey, found);
                return found || null;
            }
        },

        // 3. Articles (Published Only)
        async getArticles() {
            const cached = getCache('articles');
            if (cached) return cached;

            try {
                const sb = getSb();
                let data;
                if (sb) {
                    const res = await sb.from('articles')
                        .select('*')
                        .eq('is_published', true)
                        .order('published_at', { ascending: false });
                    if (res.error) throw res.error;
                    data = res.data;
                } else {
                    data = await directRestFetch('articles', 'is_published=eq.true&order=published_at.desc');
                }

                if (Array.isArray(data) && data.length > 0) {
                    const filtered = data.filter(a => a && a.slug && !a.slug.includes('gemini'));
                    setCache('articles', filtered);
                    return filtered;
                }
                throw new Error('Empty articles response');
            } catch (err) {
                console.warn('[GToolixContent] Falling back to static blog.json:', err.message);
                const staticData = await fetchStaticJson('blog.json');
                const articles = Array.isArray(staticData) ? staticData : [];
                setCache('articles', articles);
                return articles;
            }
        },

        // 3b. Article by Slug
        async getArticleBySlug(slug) {
            if (!slug) return null;
            const cacheKey = 'article_' + slug;
            const cached = getCache(cacheKey);
            if (cached) return cached;

            try {
                const sb = getSb();
                let article = null;
                if (sb) {
                    const res = await sb.from('articles')
                        .select('*')
                        .eq('slug', slug)
                        .eq('is_published', true)
                        .maybeSingle();
                    if (!res.error && res.data) article = res.data;
                } else {
                    const list = await directRestFetch('articles', `slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`);
                    if (Array.isArray(list) && list.length > 0) article = list[0];
                }

                if (article) {
                    setCache(cacheKey, article);
                    return article;
                }
                throw new Error('Article slug not found in Supabase');
            } catch (err) {
                console.warn(`[GToolixContent] Fallback search for article "${slug}" in blog.json`);
                const allArticles = await this.getArticles();
                const found = (allArticles || []).find(a => a.slug === slug || a.id === slug);
                if (found) setCache(cacheKey, found);
                return found || null;
            }
        },

        // 4. Programs (Published Only)
        async getPrograms() {
            const cached = getCache('programs');
            if (cached) return cached;

            try {
                const sb = getSb();
                let data;
                if (sb) {
                    const res = await sb.from('programs')
                        .select('*')
                        .eq('is_published', true)
                        .order('created_at', { ascending: false });
                    if (res.error) throw res.error;
                    data = res.data;
                } else {
                    data = await directRestFetch('programs', 'is_published=eq.true&order=created_at.desc');
                }

                if (Array.isArray(data) && data.length > 0) {
                    setCache('programs', data);
                    return data;
                }
                throw new Error('Empty programs response');
            } catch (err) {
                console.warn('[GToolixContent] Falling back to static programs.json:', err.message);
                const staticData = await fetchStaticJson('programs.json');
                setCache('programs', staticData);
                return staticData;
            }
        },

        // 4b. Program by Slug
        async getProgramBySlug(slug) {
            if (!slug) return null;
            const cacheKey = 'program_' + slug;
            const cached = getCache(cacheKey);
            if (cached) return cached;

            try {
                const sb = getSb();
                let program = null;
                if (sb) {
                    const res = await sb.from('programs')
                        .select('*')
                        .eq('slug', slug)
                        .eq('is_published', true)
                        .maybeSingle();
                    if (!res.error && res.data) program = res.data;
                } else {
                    const list = await directRestFetch('programs', `slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`);
                    if (Array.isArray(list) && list.length > 0) program = list[0];
                }

                if (program) {
                    setCache(cacheKey, program);
                    return program;
                }
                throw new Error('Program slug not found in Supabase');
            } catch (err) {
                console.warn(`[GToolixContent] Fallback search for program "${slug}" in programs.json`);
                const allPrograms = await this.getPrograms();
                const found = (allPrograms || []).find(p => p.slug === slug || p.id === slug);
                if (found) setCache(cacheKey, found);
                return found || null;
            }
        },

        // 5. Site Settings (Maintenance, Banner, Featured Tools, SEO)
        async getSiteSettings() {
            const cached = getCache('site_settings');
            if (cached) return cached;

            let map = null;

            // 1. Try Supabase
            try {
                const sb = getSb();
                let rows;
                if (sb) {
                    const res = await sb.from('site_settings').select('*');
                    if (!res.error && res.data && res.data.length > 0) rows = res.data;
                }
                if (!rows) {
                    rows = await directRestFetch('site_settings');
                }
                if (Array.isArray(rows) && rows.length > 0) {
                    map = {};
                    rows.forEach(r => { map[r.key] = r.value; });
                }
            } catch (err) {
                console.warn('[GToolixContent] Supabase site_settings fetch error:', err.message);
            }

            // 2. Try localStorage sync
            if (!map) {
                try {
                    const local = localStorage.getItem('gtoolix_site_settings');
                    if (local) {
                        map = JSON.parse(local);
                    }
                } catch (e) {}
            }

            // 3. Try /data/site-settings.json
            if (!map) {
                try {
                    const resp = await fetch('/data/site-settings.json');
                    if (resp.ok) {
                        map = await resp.json();
                    }
                } catch (e) {}
            }

            // 4. Default Fallback
            if (!map) {
                map = {
                    maintenance_mode: { enabled: false },
                    announcement_banner: { enabled: false },
                    homepage_featured_tool_slugs: ['qr-code-generator', 'youtube-thumbnail-downloader', 'screen-recorder-studio']
                };
            }

            setCache('site_settings', map);
            return map;
        },

        // 6. Global Site Settings Application
        async applyGlobalSettings() {
            try {
                const settings = await this.getSiteSettings();
                const isArabic = (document.documentElement.lang || 'ar').startsWith('ar');
                const path = window.location.pathname.toLowerCase();

                // Admin Bypass Detection (?bypass=... or stored session)
                const urlParams = new URLSearchParams(window.location.search);
                const maintObj = (typeof settings.maintenance_mode === 'object' && settings.maintenance_mode !== null)
                    ? settings.maintenance_mode
                    : { enabled: settings.maintenance_mode === true };

                const bypassKey = maintObj.admin_bypass_key || 'gtoolix_admin_bypass_2026';
                if (urlParams.get('bypass') === bypassKey) {
                    try { localStorage.setItem('gtoolix_admin_bypass', 'true'); } catch (e) {}
                }
                const isBypassed = localStorage.getItem('gtoolix_admin_bypass') === 'true' || path.includes('/gtoolix-monitoring-site');

                // 6.1 Maintenance Mode Handler
                if (maintObj.enabled === true && !isBypassed) {
                    this.renderMaintenanceScreen(maintObj, isArabic);
                    return;
                }

                // 6.2 Announcement Banner Handler
                const banner = settings.announcement_banner;
                if (banner && banner.enabled === true) {
                    // Check Target Pages Filtering
                    let shouldShow = true;
                    if (banner.target_pages === 'homepage_only') {
                        shouldShow = (path === '/' || path === '/index.html' || path === '');
                    } else if (banner.target_pages === 'tools_only') {
                        shouldShow = path.includes('/tools');
                    } else if (banner.target_pages === 'blog_only') {
                        shouldShow = path.includes('/blog');
                    }

                    if (shouldShow) {
                        this.renderAnnouncementBanner(banner, isArabic);
                    }
                }
            } catch (e) {
                console.warn('[GToolixContent] Failed applying global settings:', e);
            }
        },

        renderAnnouncementBanner(banner, isArabic) {
            if (document.getElementById('gt-announcement-banner')) return;

            const text = isArabic ? (banner.text_ar || banner.text_en) : (banner.text_en || banner.text_ar);
            if (!text) return;

            // Check if dismissed by user
            const dismissKey = 'gt_banner_dismissed_' + encodeURIComponent((banner.text_ar || '') + (banner.text_en || ''));
            if (banner.dismissible !== false) {
                try {
                    if (localStorage.getItem(dismissKey) === 'true') return;
                } catch (e) {}
            }

            const themeGradients = {
                feature: 'linear-gradient(90deg, #1E40AF 0%, #0284C7 100%)',
                alert: 'linear-gradient(90deg, #B45309 0%, #D97706 100%)',
                promo: 'linear-gradient(90deg, #7C3AED 0%, #DB2777 100%)',
                info: 'linear-gradient(90deg, #047857 0%, #0D9488 100%)'
            };
            const gradient = themeGradients[banner.theme] || themeGradients.feature;

            const bannerEl = document.createElement('aside');
            bannerEl.id = 'gt-announcement-banner';
            bannerEl.setAttribute('role', 'alert');
            bannerEl.style.cssText = `
                position: ${banner.sticky ? 'sticky; top: 0;' : 'relative;'};
                z-index: 10001;
                background: ${gradient};
                color: #FFFFFF;
                font-size: 0.88rem;
                font-weight: 600;
                padding: 0.55rem 1.25rem;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                gap: 0.65rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.18);
                transition: all 0.3s ease;
                direction: ${isArabic ? 'rtl' : 'ltr'};
            `;

            let linkHtml = '';
            if (banner.link) {
                const label = isArabic 
                    ? (banner.button_label_ar || 'استكشف الآن ↗') 
                    : (banner.button_label_en || 'Explore Now ↗');
                const target = banner.open_new_tab ? '_blank' : '_self';
                linkHtml = `<a href="${escapeHtml(banner.link)}" target="${target}" rel="noopener" style="color:#FFF;background:rgba(255,255,255,0.2);padding:0.2rem 0.65rem;border-radius:9999px;font-size:0.8rem;text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:0.25rem;border:1px solid rgba(255,255,255,0.35);">${escapeHtml(label)}</a>`;
            }

            let dismissBtnHtml = '';
            if (banner.dismissible !== false) {
                dismissBtnHtml = `
                    <button type="button" aria-label="Dismiss Banner" style="background:transparent;border:none;color:rgba(255,255,255,0.8);font-size:1.15rem;line-height:1;cursor:pointer;padding:0.2rem 0.4rem;border-radius:4px;margin-inline-start:auto;" onclick="
                        try { localStorage.setItem('${dismissKey}', 'true'); } catch(e){}
                        const b = document.getElementById('gt-announcement-banner');
                        if (b) { b.style.opacity='0'; b.style.transform='translateY(-100%)'; setTimeout(()=>b.remove(), 300); }
                    ">&times;</button>
                `;
            }

            bannerEl.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;flex-wrap:wrap;flex-grow:1;text-align:center;">
                    <span>${escapeHtml(text)}</span>
                    ${linkHtml}
                </div>
                ${dismissBtnHtml}
            `;

            document.body.insertBefore(bannerEl, document.body.firstChild);
        },

        renderMaintenanceScreen(maintObj, isArabic) {
            const title = isArabic 
                ? (maintObj.title_ar || 'الموقع قيد الصيانة والتحديث الدوري')
                : (maintObj.title_en || 'Under Scheduled Maintenance');
            const message = isArabic
                ? (maintObj.message_ar || 'نقوم حالياً بإجراء بعض التحسينات الهامة على منصة GToolix لتقديم تجربة أسرع وأكثر استقراراً. سنعود للعمل قريباً جداً!')
                : (maintObj.message_en || 'We are performing scheduled improvements to GToolix to deliver superior performance. We will be back online shortly!');
            const support = maintObj.support_contact || 'support@gtoolix.com';

            let countdownHtml = '';
            if (maintObj.estimated_reopen) {
                const targetTime = new Date(maintObj.estimated_reopen).getTime();
                if (!isNaN(targetTime) && targetTime > Date.now()) {
                    countdownHtml = `
                        <div style="margin:1.5rem 0;padding:1rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;">
                            <div style="font-size:0.8rem;color:#94A3B8;margin-bottom:0.5rem;">${isArabic ? 'موعد العودة المتوقع للعمل:' : 'Estimated Return:'}</div>
                            <div id="maint-countdown" style="font-size:1.4rem;font-weight:800;color:#38BDF8;font-family:monospace;">--:--:--</div>
                        </div>
                    `;
                }
            }

            document.body.innerHTML = `
                <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#020817;color:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:2rem;direction:${isArabic ? 'rtl' : 'ltr'};">
                    <div style="max-width:580px;background:#0F172A;border:1px solid rgba(255,255,255,0.1);padding:3rem 2.25rem;border-radius:1.5rem;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
                        <div style="font-size:3.75rem;margin-bottom:1rem;animation:pulse 2s infinite;">🚧</div>
                        <h1 style="font-size:1.85rem;font-weight:800;margin-bottom:0.85rem;color:#F8FAFC;line-height:1.3;">
                            ${escapeHtml(title)}
                        </h1>
                        <p style="color:#94A3B8;font-size:1rem;line-height:1.75;margin-bottom:1.25rem;">
                            ${escapeHtml(message)}
                        </p>
                        ${countdownHtml}
                        <div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;flex-wrap:wrap;margin-top:1.5rem;">
                            <a href="mailto:${escapeHtml(support)}" style="padding:0.5rem 1.2rem;background:#2563EB;color:#FFF;border-radius:9999px;font-size:0.88rem;font-weight:700;text-decoration:none;">
                                ✉️ ${isArabic ? 'تواصل مع الدعم الفني' : 'Contact Support'}
                            </a>
                            <button type="button" onclick="const k=prompt('${isArabic ? 'أدخل رمز مرور المسؤول لتجاوز الصيانة:' : 'Enter Admin Bypass Key: '}'); if(k){ window.location.href='/?bypass='+encodeURIComponent(k); }" style="padding:0.5rem 1.2rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#CBD5E1;border-radius:9999px;font-size:0.85rem;cursor:pointer;">
                                🛡️ ${isArabic ? 'دخول المسؤول' : 'Admin Login'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Start Countdown if applicable
            if (maintObj.estimated_reopen) {
                const targetTime = new Date(maintObj.estimated_reopen).getTime();
                const timer = setInterval(() => {
                    const diff = targetTime - Date.now();
                    const cdEl = document.getElementById('maint-countdown');
                    if (!cdEl || diff <= 0) {
                        if (cdEl) cdEl.textContent = isArabic ? 'قريباً جداً 🚀' : 'Very Soon 🚀';
                        clearInterval(timer);
                        return;
                    }
                    const hrs = Math.floor(diff / (1000 * 60 * 60));
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((diff % (1000 * 60)) / 1000);
                    cdEl.textContent = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }, 1000);
            }
        }
    };

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.GToolixContent = GToolixContent;

    // Auto-apply global settings on page boot
    document.addEventListener('DOMContentLoaded', () => {
        GToolixContent.applyGlobalSettings();
    });
})();
