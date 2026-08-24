// =====================================================================
// GToolix Content Client — 100% Standalone Self-Hosted Content Engine
// Pure Static JSON Architecture (Zero External Database / Zero Supabase)
// Provides instant offline caching, zero latency, and 100% uptime.
// =====================================================================
(function () {
    'use strict';

    if (window.GToolixContent) return;

    const CACHE_PREFIX = 'gt_content_v9_';
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory/session cache

    // In-memory runtime cache
    const memoryCache = new Map();

    function getCache(key) {
        if (memoryCache.has(key)) {
            const entry = memoryCache.get(key);
            if (Date.now() - entry.time < CACHE_TTL_MS) {
                return entry.data;
            }
            memoryCache.delete(key);
        }
        try {
            const raw = sessionStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.time > CACHE_TTL_MS) {
                sessionStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            memoryCache.set(key, { time: parsed.time, data: parsed.data });
            return parsed.data;
        } catch (e) {
            return null;
        }
    }

    function setCache(key, data) {
        const time = Date.now();
        memoryCache.set(key, { time, data });
        try {
            sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ time, data }));
        } catch (e) {}
    }

    // Static JSON Loader
    async function fetchStaticData(filename) {
        const cached = getCache(filename);
        if (cached) return cached;

        try {
            const res = await fetch(`/data/${filename}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const data = Array.isArray(json) ? json.filter(Boolean) : json;
            setCache(filename, data);
            return data;
        } catch (err) {
            console.warn(`[GToolixContent] Failed to fetch /data/${filename}:`, err);
            return [];
        }
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    const GToolixContent = {
        // 1. Categories
        async getCategories() {
            return await fetchStaticData('categories.json');
        },

        // 2. Tools
        async getTools() {
            const activeSlugs = new Set(['qr-code-generator', 'youtube-thumbnail-downloader', 'screen-recorder-studio', 'image-compressor']);
            const list = await fetchStaticData('tools.json');
            return list.filter(t => t && t.slug && activeSlugs.has(t.slug) && t.is_published !== false);
        },

        // 2b. Tool by Slug
        async getToolBySlug(slug) {
            if (!slug) return null;
            const tools = await this.getTools();
            return tools.find(t => t.slug === slug) || null;
        },

        // 3. Articles (Blog)
        async getArticles() {
            const list = await fetchStaticData('blog.json');
            return list.filter(a => a && a.is_published !== false);
        },

        // 3b. Article by Slug
        async getArticleBySlug(slug) {
            if (!slug) return null;
            const articles = await this.getArticles();
            return articles.find(a => a.slug === slug) || null;
        },

        // 4. Programs
        async getPrograms() {
            const list = await fetchStaticData('programs.json');
            return Array.isArray(list) ? list.filter(p => p && p.is_published !== false) : [];
        },

        // 4b. Program by Slug
        async getProgramBySlug(slug) {
            if (!slug) return null;
            const programs = await this.getPrograms();
            return programs.find(p => p.slug === slug) || null;
        },

        // 5. Site Settings
        async getSiteSettings() {
            const cached = getCache('site_settings');
            if (cached) return cached;

            let settings = {
                maintenance_mode: { enabled: false },
                announcement_banner: { enabled: false },
                homepage_featured_tool_slugs: ['qr-code-generator', 'youtube-thumbnail-downloader', 'screen-recorder-studio', 'image-compressor']
            };

            try {
                const local = localStorage.getItem('gtoolix_site_settings');
                if (local) settings = Object.assign(settings, JSON.parse(local));
            } catch (e) {}

            setCache('site_settings', settings);
            return settings;
        },

        // 6. Global Site Settings Application
        async applyGlobalSettings() {
            try {
                const settings = await this.getSiteSettings();
                const isArabic = (document.documentElement.lang || 'ar').startsWith('ar');
                const path = window.location.pathname.toLowerCase();

                // Admin Bypass Detection
                const urlParams = new URLSearchParams(window.location.search);
                const maintObj = (typeof settings.maintenance_mode === 'object' && settings.maintenance_mode !== null)
                    ? settings.maintenance_mode
                    : { enabled: settings.maintenance_mode === true };

                const bypassKey = maintObj.admin_bypass_key || 'gtoolix_admin_bypass_2026';
                if (urlParams.get('bypass') === bypassKey) {
                    try { localStorage.setItem('gtoolix_admin_bypass', 'true'); } catch (e) {}
                }
                const isBypassed = localStorage.getItem('gtoolix_admin_bypass') === 'true';

                // Maintenance Mode Handler
                if (maintObj.enabled === true && !isBypassed) {
                    this.renderMaintenanceScreen(maintObj, isArabic);
                    return;
                }

                // Announcement Banner Handler
                const banner = settings.announcement_banner;
                if (banner && banner.enabled === true) {
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
                console.warn('[GToolixContent] Global settings application note:', e);
            }
        },

        renderAnnouncementBanner(banner, isArabic) {
            if (document.getElementById('gt-announcement-banner')) return;

            const text = isArabic ? (banner.text_ar || banner.text_en) : (banner.text_en || banner.text_ar);
            if (!text) return;

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

            document.body.innerHTML = `
                <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#020817;color:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:2rem;direction:${isArabic ? 'rtl' : 'ltr'};">
                    <div style="max-width:580px;background:#0F172A;border:1px solid rgba(255,255,255,0.1);padding:3rem 2.25rem;border-radius:1.5rem;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
                        <div style="font-size:3.75rem;margin-bottom:1rem;">🚧</div>
                        <h1 style="font-size:1.85rem;font-weight:800;margin-bottom:0.85rem;color:#F8FAFC;line-height:1.3;">
                            ${escapeHtml(title)}
                        </h1>
                        <p style="color:#94A3B8;font-size:1rem;line-height:1.75;margin-bottom:1.25rem;">
                            ${escapeHtml(message)}
                        </p>
                        <div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;flex-wrap:wrap;margin-top:1.5rem;">
                            <a href="mailto:${escapeHtml(support)}" style="padding:0.5rem 1.2rem;background:#2563EB;color:#FFF;border-radius:9999px;font-size:0.88rem;font-weight:700;text-decoration:none;">
                                ✉️ ${isArabic ? 'تواصل مع الدعم الفني' : 'Contact Support'}
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    };

    window.GToolixContent = GToolixContent;

    // Auto-apply global settings on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            GToolixContent.applyGlobalSettings();
        });
    } else {
        GToolixContent.applyGlobalSettings();
    }
})();
