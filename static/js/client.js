// =====================================================================
// GToolix Monitoring Module — Client SDK (Fail-Safe Tracking API)
// Hosted on main site static assets to report tracking telemetry.
// =====================================================================
(function () {
    'use strict';

    if (window.GToolixMonitor) return; // Prevent duplicate init

    const CONFIG = window.GTOOLIX_MONITORING_CONFIG || {
        SUPABASE_URL: window.GTOOLIX_SUPABASE_URL || 'YOUR_SUPABASE_URL',
        SUPABASE_ANON_KEY: window.GTOOLIX_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
        HEARTBEAT_INTERVAL_MS: 30000
    };

    let supabaseClient = null;
    let currentSessionId = null;
    let currentVisitorId = null;
    let heartbeatTimer = null;

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

    // Helper: Get or create Visitor ID (persistent across sessions)
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

    // Helper: Get or create Session ID (per tab/session)
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

    // Parse Device Info safely
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

        let os = 'Unknown';
        if (/windows/i.test(ua)) os = 'Windows';
        else if (/macintosh|mac os x/i.test(ua)) os = 'MacOS';
        else if (/android/i.test(ua)) os = 'Android';
        else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

        return { deviceType, browser, os, userAgent: ua.substring(0, 250) };
    }

    // Initialize Supabase client dynamically if available
    function initSupabase() {
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

    // REST fallback insert if supabase-js library is not loaded
    async function directRestInsert(table, data) {
        try {
            if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') return false;
            const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}`;
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

    // REST fallback update (for session heartbeats)
    async function directRestUpdate(table, filterCol, filterVal, data) {
        try {
            if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') return false;
            const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}?${filterCol}=eq.${filterVal}`;
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

    // Helper: Resolve real IP-based country with fallbacks and 24h localStorage caching
    async function resolveCountry() {
        if (cachedCountry) return cachedCountry;

        // 1. Check 24-hour localStorage cache to avoid repeated network calls
        try {
            const stored = localStorage.getItem('gtoolix_user_country');
            const storedTime = localStorage.getItem('gtoolix_user_country_time');
            if (stored && storedTime && (Date.now() - parseInt(storedTime, 10) < 86400000)) {
                cachedCountry = stored;
                return cachedCountry;
            }
        } catch (e) {}

        // 2. High-availability IP Geolocation APIs (Ordered by reliability & rate limits)
        const apis = [
            { url: 'https://get.geojs.io/v1/ip/country.json', parse: d => d.country },
            { url: 'https://api.country.is', parse: d => d.country },
            { url: 'https://ipapi.co/json/', parse: d => d.country_code || d.country_name },
            { url: 'https://ipwho.is/', parse: d => d.country_code || d.country }
        ];

        for (const api of apis) {
            try {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;
                const res = await fetch(api.url, { signal: controller ? controller.signal : undefined });
                if (timeoutId) clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    const code = api.parse(data);
                    if (code && typeof code === 'string') {
                        cachedCountry = code;
                        try {
                            localStorage.setItem('gtoolix_user_country', cachedCountry);
                            localStorage.setItem('gtoolix_user_country_time', Date.now().toString());
                        } catch (e) {}
                        return cachedCountry;
                    }
                }
            } catch (e) {
                // Silently fallback to next service without throwing console errors
            }
        }

        // 3. Fallback: Browser language
        cachedCountry = 'lang:' + (navigator.language || 'ar-EG');
        try {
            localStorage.setItem('gtoolix_user_country', cachedCountry);
            localStorage.setItem('gtoolix_user_country_time', Date.now().toString());
        } catch (e) {}
        return cachedCountry;
    }

    // Ensure current session exists in DB
    async function ensureSession() {
        currentVisitorId = getVisitorId();
        currentSessionId = getSessionId();

        const initialCountry = cachedCountry || ('lang:' + (navigator.language || 'ar-EG'));
        const devInfo = getDeviceInfo();
        const sessionPayload = {
            id: currentSessionId,
            visitor_id: currentVisitorId,
            user_agent: devInfo.userAgent,
            device_type: devInfo.deviceType,
            browser: devInfo.browser,
            os: devInfo.os,
            country: initialCountry,
            ip_masked: 'anonymized',
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
        };

        const sb = initSupabase();
        if (sb) {
            try {
                await sb.from('sessions').upsert(sessionPayload, { onConflict: 'id' });
            } catch (e) {
                await directRestInsert('sessions', sessionPayload);
            }
        } else {
            await directRestInsert('sessions', sessionPayload);
        }

        startHeartbeat();

        // Asynchronously resolve real IP-based country in background once per session
        if (!cachedCountry || cachedCountry.startsWith('lang:')) {
            resolveCountry().then(async (resolved) => {
                if (resolved && !resolved.startsWith('lang:')) {
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
    }

    // Heartbeat mechanism (runs every 30s when tab is visible)
    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(async () => {
            if (document.hidden) return; // Tab inactive, pause heartbeat
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
        }, CONFIG.HEARTBEAT_INTERVAL_MS || 30000);
    }

    // Public SDK API (Fail-Silent Guarantee)
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
                    await sb.from('page_views').insert(payload);
                } else {
                    await directRestInsert('page_views', payload);
                }
            } catch (err) {
                // Fail silently
            }
        },

        async trackToolUsage(toolName, meta) {
            try {
                if (!currentSessionId) await ensureSession();
                const payload = {
                    session_id: currentSessionId,
                    tool_name: toolName,
                    metadata: meta || {}
                };
                const sb = initSupabase();
                if (sb) {
                    await sb.from('tool_usage').insert(payload);
                } else {
                    await directRestInsert('tool_usage', payload);
                }
            } catch (err) {
                // Fail silently
            }
        },

        async trackError(errorObject, context) {
            try {
                if (!currentSessionId) await ensureSession();
                const message = typeof errorObject === 'string' ? errorObject : (errorObject?.message || 'Unknown Error');
                const stack = errorObject?.stack ? errorObject.stack.substring(0, 1000) : '';
                const payload = {
                    session_id: currentSessionId,
                    error_message: message,
                    stack: stack,
                    context: context || { page: window.location.pathname }
                };
                const sb = initSupabase();
                if (sb) {
                    await sb.from('errors').insert(payload);
                } else {
                    await directRestInsert('errors', payload);
                }
            } catch (err) {
                // Fail silently
            }
        },

        async trackPerformance(metricName, value) {
            try {
                return SDK.trackEvent('performance', { metric: metricName, value: value });
            } catch (err) {
                // Fail silently
            }
        },

        async trackEvent(eventName, payload) {
            try {
                return SDK.trackToolUsage(`event_${eventName}`, payload);
            } catch (err) {
                // Fail silently
            }
        }
    };

    // Global Error Handlers
    window.addEventListener('error', function (evt) {
        if (evt.error) {
            SDK.trackError(evt.error, { type: 'uncaught_error', filename: evt.filename, lineno: evt.lineno });
        }
    });

    window.addEventListener('unhandledrejection', function (evt) {
        SDK.trackError(evt.reason || 'Unhandled Promise Rejection', { type: 'unhandled_rejection' });
    });

    // Auto-init on idle after page load
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
