// =====================================================================
// GToolix Monitoring Module — Client SDK (Fail-Safe Telemetry API)
// Hosted on main site static assets to report tracking telemetry.
// =====================================================================
(function () {
    'use strict';

    if (window.GToolixMonitor) return; // Prevent duplicate init

    const CONFIG = window.GTOOLIX_MONITORING_CONFIG || {
        SUPABASE_URL: window.GTOOLIX_SUPABASE_URL || 'https://xucvfzpoeaeabbdmghdj.supabase.co',
        SUPABASE_ANON_KEY: window.GTOOLIX_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3ZmenBvZWFlYWJiZG1naGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzU4NTAsImV4cCI6MjEwMTYxMTg1MH0.rgd2FjES6Jm535Xw4vQpzQIZRPKk9NzMi2bt9A4reSo',
        HEARTBEAT_INTERVAL_MS: 25000
    };

    let supabaseClient = null;
    let currentSessionId = null;
    let currentVisitorId = null;
    let heartbeatTimer = null;
    let sessionInitialized = false;

    // Timezone to Country Code Map for Zero-Latency Local Fallback
    const TIMEZONE_COUNTRY_MAP = {
        'Africa/Cairo': 'EG',
        'Asia/Riyadh': 'SA',
        'Asia/Dubai': 'AE',
        'Asia/Kuwait': 'KW',
        'Asia/Qatar': 'QA',
        'Asia/Muscat': 'OM',
        'Asia/Bahrain': 'BH',
        'Asia/Amman': 'JO',
        'Asia/Baghdad': 'IQ',
        'Asia/Beirut': 'LB',
        'Asia/Damascus': 'SY',
        'Asia/Gaza': 'PS',
        'Asia/Hebron': 'PS',
        'Africa/Casablanca': 'MA',
        'Africa/Algiers': 'DZ',
        'Africa/Tunis': 'TN',
        'Africa/Tripoli': 'LY',
        'Africa/Khartoum': 'SD',
        'Asia/Aden': 'YE',
        'Europe/Istanbul': 'TR',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Rome': 'IT',
        'Europe/Madrid': 'ES',
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Los_Angeles': 'US',
        'America/Toronto': 'CA',
        'America/Vancouver': 'CA'
    };

    // Helper: Generate UUID v4
    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Helper: Get or create Visitor ID
    function getVisitorId() {
        try {
            let vid = localStorage.getItem('gtoolix_vid');
            if (!vid) {
                vid = 'v_' + generateUUID();
                localStorage.setItem('gtoolix_vid', vid);
            }
            return vid;
        } catch (e) {
            return 'v_anon_' + Math.random().toString(36).substring(2, 9);
        }
    }

    // Helper: Get or create Session ID
    function getSessionId() {
        try {
            let sid = sessionStorage.getItem('gtoolix_sid');
            if (!sid) {
                sid = generateUUID();
                sessionStorage.setItem('gtoolix_sid', sid);
            }
            return sid;
        } catch (e) {
            return generateUUID();
        }
    }

    // Determine Traffic Source from referrer
    function getTrafficSource() {
        const ref = document.referrer ? document.referrer.toLowerCase() : '';
        if (!ref) return 'direct';
        
        try {
            const currentHost = window.location.hostname.toLowerCase();
            const refUrl = new URL(ref);
            if (refUrl.hostname.toLowerCase() === currentHost) return 'direct';
            
            if (refUrl.hostname.includes('google.')) return 'google';
            if (refUrl.hostname.includes('youtube.') || refUrl.hostname.includes('youtu.be')) return 'youtube';
            if (refUrl.hostname.includes('facebook.') || refUrl.hostname.includes('fb.')) return 'facebook';
            if (refUrl.hostname.includes('tiktok.')) return 'tiktok';
            if (refUrl.hostname.includes('instagram.')) return 'instagram';
            if (refUrl.hostname.includes('twitter.') || refUrl.hostname.includes('x.com')) return 'twitter';
            return 'other';
        } catch (e) {
            return 'other';
        }
    }

    // Parse Device Info
    function getDeviceInfo() {
        const ua = navigator.userAgent || '';
        let deviceType = 'desktop';
        if (/mobile/i.test(ua)) deviceType = 'mobile';
        else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

        let browser = 'Unknown';
        if (/chrome|crios/i.test(ua)) browser = 'Chrome';
        else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
        else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
        else if (/edg/i.test(ua)) browser = 'Edge';
        else if (/samsung/i.test(ua)) browser = 'Samsung Internet';

        let os = 'Unknown';
        if (/windows/i.test(ua)) os = 'Windows';
        else if (/macintosh|mac os x/i.test(ua)) os = 'MacOS';
        else if (/android/i.test(ua)) os = 'Android';
        else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
        else if (/linux/i.test(ua)) os = 'Linux';

        return { deviceType, browser, os, userAgent: ua.substring(0, 250) };
    }

    // Helper: Check if running on local development environment
    function isLocalDev() {
        try {
            if (window.GTOOLIX_ENABLE_LOCAL_MONITORING === true) return false;
            const h = window.location.hostname;
            return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local') || window.location.protocol === 'file:';
        } catch (e) {
            return false;
        }
    }

    // Initialize Supabase client
    function initSupabase() {
        if (isLocalDev()) return null;
        if (supabaseClient) return supabaseClient;
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
                return supabaseClient;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // REST fallback insert
    async function directRestInsert(table, data) {
        try {
            if (isLocalDev()) return true;
            if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL' || !CONFIG.SUPABASE_URL.startsWith('http')) return false;
            const cleanTable = encodeURIComponent(String(table).trim().replace(/\s+/g, '_'));
            const url = `${CONFIG.SUPABASE_URL}/rest/v1/${cleanTable}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (err) {
            return false;
        }
    }

    // REST fallback update
    async function directRestUpdate(table, filterCol, filterVal, data) {
        try {
            if (isLocalDev()) return true;
            if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL' || !CONFIG.SUPABASE_URL.startsWith('http')) return false;
            const cleanTable = encodeURIComponent(String(table).trim().replace(/\s+/g, '_'));
            const url = `${CONFIG.SUPABASE_URL}/rest/v1/${cleanTable}?${filterCol}=eq.${encodeURIComponent(filterVal)}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (err) {
            return false;
        }
    }

    let cachedCountry = null;

    // Modern IP Geolocation Resolver with 24h Cache & Timezone Fallback
    async function resolveCountry() {
        if (cachedCountry) return cachedCountry;

        // 1. Check 24-hour localStorage Cache
        try {
            const stored = localStorage.getItem('gtoolix_user_country');
            const storedTime = localStorage.getItem('gtoolix_user_country_time');
            if (stored && storedTime && (Date.now() - parseInt(storedTime, 10) < 86400000)) {
                cachedCountry = stored;
                return cachedCountry;
            }
        } catch (e) {}

        // 2. High-Availability Multi-Provider IP Geolocation APIs
        const apis = [
            { url: 'https://get.geojs.io/v1/ip/country.json', parse: d => d.country },
            { url: 'https://api.country.is', parse: d => d.country },
            { url: 'https://ipapi.co/json/', parse: d => d.country_code || d.country_name },
            { url: 'https://ipwho.is/', parse: d => d.country_code || d.country }
        ];

        for (const api of apis) {
            try {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutId = controller ? setTimeout(() => controller.abort(), 2200) : null;
                const res = await fetch(api.url, { signal: controller ? controller.signal : undefined });
                if (timeoutId) clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    const code = api.parse(data);
                    if (code && typeof code === 'string' && code.length >= 2) {
                        cachedCountry = code.toUpperCase();
                        try {
                            localStorage.setItem('gtoolix_user_country', cachedCountry);
                            localStorage.setItem('gtoolix_user_country_time', Date.now().toString());
                        } catch (e) {}
                        return cachedCountry;
                    }
                }
            } catch (e) {
                // Silently fallback to next API
            }
        }

        // 3. Fallback: Browser Timezone Mapping
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz && TIMEZONE_COUNTRY_MAP[tz]) {
                cachedCountry = TIMEZONE_COUNTRY_MAP[tz];
                try {
                    localStorage.setItem('gtoolix_user_country', cachedCountry);
                    localStorage.setItem('gtoolix_user_country_time', Date.now().toString());
                } catch (e) {}
                return cachedCountry;
            }
        } catch (e) {}

        // 4. Final Fallback: Browser Language Prefix
        cachedCountry = 'lang:' + (navigator.language || 'ar-EG');
        try {
            localStorage.setItem('gtoolix_user_country', cachedCountry);
            localStorage.setItem('gtoolix_user_country_time', Date.now().toString());
        } catch (e) {}
        return cachedCountry;
    }

    // Initial country estimate from timezone or language
    function getInstantCountryEstimate() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz && TIMEZONE_COUNTRY_MAP[tz]) {
                return TIMEZONE_COUNTRY_MAP[tz];
            }
        } catch (e) {}
        return 'lang:' + (navigator.language || 'ar-EG');
    }

    // Ensure session in DB with silent fail-over
    async function ensureSession() {
        if (sessionInitialized) return;
        sessionInitialized = true;

        currentVisitorId = getVisitorId();
        currentSessionId = getSessionId();

        const initialCountry = cachedCountry || getInstantCountryEstimate();
        const devInfo = getDeviceInfo();
        const trafficSource = getTrafficSource();

        const sessionPayload = {
            id: currentSessionId,
            visitor_id: currentVisitorId,
            user_agent: devInfo.userAgent,
            device_type: devInfo.deviceType,
            browser: devInfo.browser,
            os: devInfo.os,
            country: initialCountry,
            traffic_source: trafficSource,
            referrer: document.referrer ? document.referrer.substring(0, 300) : '',
            ip_masked: 'anonymized',
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
        };

        try {
            const sb = initSupabase();
            if (sb) {
                const { error } = await sb.from('sessions').upsert(sessionPayload, { onConflict: 'id' });
                if (error) {
                    await directRestInsert('sessions', sessionPayload);
                }
            } else {
                await directRestInsert('sessions', sessionPayload);
            }
        } catch (e) {}

        startHeartbeat();
        autoTrackPageView();
        initWebVitalsObserver();

        // Asynchronously resolve precise IP country in background
        resolveCountry().then(async (resolved) => {
            if (resolved && resolved !== initialCountry) {
                try {
                    const sbClient = initSupabase();
                    if (sbClient) {
                        await sbClient.from('sessions').update({ country: resolved }).eq('id', currentSessionId);
                    } else {
                        await directRestUpdate('sessions', 'id', currentSessionId, { country: resolved });
                    }
                } catch (e) {
                    // Fail silently
                }
            }
        });
    }

    // Heartbeat mechanism (runs every 25s when tab is visible)
    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(async () => {
            if (document.hidden) return;
            try {
                const nowStr = new Date().toISOString();
                const sb = initSupabase();
                if (sb) {
                    await sb.from('sessions').update({ last_seen_at: nowStr }).eq('id', currentSessionId);
                } else {
                    await directRestUpdate('sessions', 'id', currentSessionId, { last_seen_at: nowStr });
                }
            } catch (e) {
                // Fail silently
            }
        }, CONFIG.HEARTBEAT_INTERVAL_MS || 25000);
    }

    function sendUnloadBeacon() {
        try {
            if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL' || !CONFIG.SUPABASE_URL.startsWith('http') || !currentSessionId) return;
            const url = `${CONFIG.SUPABASE_URL}/rest/v1/sessions?id=eq.${encodeURIComponent(currentSessionId)}`;
            const data = JSON.stringify({ last_seen_at: new Date().toISOString() });
            if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon(url, blob);
            }
        } catch (e) {}
    }

    window.addEventListener('beforeunload', sendUnloadBeacon);
    window.addEventListener('pagehide', sendUnloadBeacon);

    let lastTrackedPath = null;
    function autoTrackPageView() {
        const currentPath = window.location.pathname + window.location.hash;
        if (lastTrackedPath !== currentPath) {
            lastTrackedPath = currentPath;
            SDK.trackPageView(currentPath);
        }
    }

    // Web Vitals & Performance Observer
    function initWebVitalsObserver() {
        const devInfo = getDeviceInfo();

        window.addEventListener('load', () => {
            setTimeout(() => {
                try {
                    const navEntries = performance.getEntriesByType('navigation');
                    if (navEntries && navEntries.length > 0) {
                        const pageLoadTime = Math.round(navEntries[0].loadEventEnd || navEntries[0].duration);
                        if (pageLoadTime > 0) {
                            SDK.trackPerformance('page_load_time', pageLoadTime, devInfo.deviceType);
                        }
                    }

                    const paintEntries = performance.getEntriesByType('paint');
                    paintEntries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            SDK.trackPerformance('FCP', Math.round(entry.startTime), devInfo.deviceType);
                        }
                    });
                } catch (e) {}
            }, 1000);
        });

        if (typeof PerformanceObserver !== 'undefined') {
            try {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        SDK.trackPerformance('LCP', Math.round(lastEntry.startTime), devInfo.deviceType);
                    }
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

                let clsScore = 0;
                const clsObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsScore += entry.value;
                        }
                    }
                    SDK.trackPerformance('CLS', parseFloat(clsScore.toFixed(3)), devInfo.deviceType);
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
            } catch (e) {}
        }
    }

    // Public SDK API (Graceful Table Fallback)
    const SDK = {
        async trackPageView(path) {
            try {
                if (!currentSessionId) await ensureSession();
                const pagePath = path || window.location.pathname + window.location.hash;
                const payload = {
                    session_id: currentSessionId,
                    visitor_id: currentVisitorId,
                    path: pagePath,
                    referrer: document.referrer ? document.referrer.substring(0, 300) : ''
                };
                const sb = initSupabase();
                if (sb) {
                    const { error } = await sb.from('page_views').insert(payload);
                    if (error) await directRestInsert('page_views', payload);
                } else {
                    await directRestInsert('page_views', payload);
                }
            } catch (err) {}
        },

        async trackToolUsage(toolName, meta) {
            try {
                if (!currentSessionId) await ensureSession();
                const payload = {
                    session_id: currentSessionId,
                    visitor_id: currentVisitorId,
                    tool_name: toolName,
                    metadata: meta || {}
                };
                const sb = initSupabase();
                if (sb) {
                    const { error } = await sb.from('tool_usage').insert(payload);
                    if (error) await directRestInsert('tool_usage', payload);
                } else {
                    await directRestInsert('tool_usage', payload);
                }
            } catch (err) {}
        },

        async trackError(errorObject, context, severity = 'warning') {
            try {
                if (!currentSessionId) await ensureSession();
                const message = typeof errorObject === 'string' ? errorObject : (errorObject?.message || 'Unknown Error');
                const stack = errorObject?.stack ? errorObject.stack.substring(0, 1000) : '';
                const payload = {
                    session_id: currentSessionId,
                    error_message: message,
                    stack: stack,
                    context: context || { page: window.location.pathname },
                    severity: severity
                };
                const sb = initSupabase();
                if (sb) {
                    const { error } = await sb.from('errors').insert(payload);
                    if (error) await directRestInsert('errors', payload);
                } else {
                    await directRestInsert('errors', payload);
                }
            } catch (err) {}
        },

        async trackPerformance(metricName, value, deviceType) {
            try {
                if (!currentSessionId) await ensureSession();
                const dev = deviceType || getDeviceInfo().deviceType;
                const payload = {
                    session_id: currentSessionId,
                    metric_name: metricName,
                    metric_value: value,
                    device_type: dev
                };
                const sb = initSupabase();
                if (sb) {
                    await sb.from('performance_metrics').insert(payload);
                } else {
                    await directRestInsert('performance_metrics', payload);
                }
            } catch (err) {}
        },

        async trackEvent(eventName, payload) {
            try {
                return SDK.trackToolUsage(`event_${eventName}`, payload);
            } catch (err) {}
        }
    };

    // Global Error Handlers
    window.addEventListener('error', function (evt) {
        if (evt.error) {
            SDK.trackError(evt.error, { type: 'uncaught_error', filename: evt.filename, lineno: evt.lineno }, 'critical');
        }
    });

    window.addEventListener('unhandledrejection', function (evt) {
        SDK.trackError(evt.reason || 'Unhandled Promise Rejection', { type: 'unhandled_rejection' }, 'warning');
    });

    // Auto-init on page load
    const runSessionInit = function () {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(ensureSession, { timeout: 3000 });
        } else {
            setTimeout(ensureSession, 1500);
        }
    };

    if (document.readyState === 'complete') {
        runSessionInit();
    } else {
        window.addEventListener('load', runSessionInit);
    }

    // Expose Global SDK
    window.GToolixMonitor = SDK;
})();
