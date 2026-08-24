// =====================================================================
// GToolix Content Client — 100% Standalone Self-Hosted Content Engine
// Pure Static JSON Architecture (Zero External Database / Zero Supabase)
// Provides instant offline caching, zero latency, and 100% uptime.
// =====================================================================
(function () {
    'use strict';

    if (window.GToolixContent) return;

    // Purge any legacy banner or dashboard artifacts from DOM/storage
    try {
        const oldBanner = document.getElementById('gt-announcement-banner');
        if (oldBanner) oldBanner.remove();
        sessionStorage.removeItem('gt_content_v9_site_settings');
        sessionStorage.removeItem('gt_content_v11_site_settings');
        localStorage.removeItem('gtoolix_site_settings');
        localStorage.removeItem('gtoolix_admin_bypass');
    } catch (e) {}

    const CACHE_PREFIX = 'gt_content_v12_';
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
            return await fetchStaticData('site-settings.json');
        }
    };

    window.GToolixContent = GToolixContent;
})();
