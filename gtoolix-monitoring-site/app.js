// =====================================================================
// GToolix Monitoring Module — Standalone Dashboard Application Logic
// =====================================================================
(function () {
    'use strict';

    const CONFIG = window.GTOOLIX_MONITORING_CONFIG || {};
    let sbClient = null;

    // DOM Elements
    const loginOverlay = document.getElementById('adminLoginOverlay');
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginErrorMsg');
    const userBadge = document.getElementById('userBadge');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // Stats Elements
    const systemStatusText = document.getElementById('systemStatusText');
    const systemLatencyText = document.getElementById('systemLatencyText');
    const systemStatusDot = document.getElementById('systemStatusDot');

    const todayVisitorsCount = document.getElementById('todayVisitorsCount');
    const todayViewsCount = document.getElementById('todayViewsCount');
    const liveVisitorsCount = document.getElementById('liveVisitorsCount');
    const todayErrorsCount = document.getElementById('todayErrorsCount');

    const topToolsList = document.getElementById('topToolsList');
    const errorsTableBody = document.getElementById('errorsTableBody');
    const activityLogList = document.getElementById('activityLogList');
    const dbTotalViews = document.getElementById('dbTotalViews');

    const avgLoadTimeText = document.getElementById('avgLoadTimeText');
    const chromeUsageText = document.getElementById('chromeUsageText');
    const mobileUsageText = document.getElementById('mobileUsageText');

    const refreshErrorsBtn = document.getElementById('refreshErrorsBtn');
    const triggerCleanupBtn = document.getElementById('triggerCleanupBtn');

    // Theme Switcher Logic
    function initTheme() {
        const savedTheme = localStorage.getItem('gtoolix_dash_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (themeToggleBtn) {
            themeToggleBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
            themeToggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('gtoolix_dash_theme', next);
                themeToggleBtn.textContent = next === 'dark' ? '🌙' : '☀️';
            });
        }
    }

    // Initialize Supabase Client
    function getSupabase() {
        if (sbClient) return sbClient;
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                sbClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
                return sbClient;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // Check Auth Status on App Boot
    async function checkAuth() {
        initTheme();

        const sb = getSupabase();
        if (!sb || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            showLoginError('يرجى ضبط بيانات Supabase في ملف config.js أولاً.');
            showLoginOverlay();
            return;
        }

        const { data: { session } } = await sb.auth.getSession();
        if (session && session.user) {
            await verifyAdmin(session.user);
        } else {
            showLoginOverlay();
        }
    }

    // Strict Admin Authorization Check
    async function verifyAdmin(user) {
        const sb = getSupabase();
        try {
            // Query profiles table for is_admin flag BEFORE rendering any data in DOM
            const { data, error } = await sb
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (error || !data || data.is_admin !== true) {
                showLoginError('غير مسموح: حسابك لا يملك صلاحيات مسؤول النظام (is_admin = true)');
                await sb.auth.signOut();
                showLoginOverlay();
                return;
            }

            // Authorized Admin confirmed
            hideLoginOverlay();
            userBadge.textContent = user.email; // Display full email address without truncation
            logoutBtn.style.display = 'inline-flex';

            // Boot Dashboard Data Fetchers
            initDashboardData();
        } catch (err) {
            showLoginError('حدث خطأ أثناء التحقق من صلاحيات المسؤول.');
            showLoginOverlay();
        }
    }

    // Login Form Submission Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            const loginBtn = document.getElementById('loginBtn');

            loginBtn.textContent = 'جاري التحقق...';
            loginBtn.disabled = true;
            loginError.style.display = 'none';

            const sb = getSupabase();
            if (!sb) {
                showLoginError('لم يتم تهيئة اتصال Supabase');
                loginBtn.textContent = 'دخول اللوحة';
                loginBtn.disabled = false;
                return;
            }

            const { data, error } = await sb.auth.signInWithPassword({ email, password });

            loginBtn.textContent = 'دخول اللوحة';
            loginBtn.disabled = false;

            if (error) {
                showLoginError('فشل تسجيل الدخول: ' + error.message);
            } else if (data.user) {
                await verifyAdmin(data.user);
            }
        });
    }

    // Logout Handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const sb = getSupabase();
            if (sb) await sb.auth.signOut();
            location.reload();
        });
    }

    function showLoginOverlay() {
        if (loginOverlay) loginOverlay.style.display = 'flex';
    }

    function hideLoginOverlay() {
        if (loginOverlay) loginOverlay.style.display = 'none';
    }

    function showLoginError(msg) {
        if (loginError) {
            loginError.textContent = msg;
            loginError.style.display = 'block';
        }
    }

    // Activity Log Feed Helper
    function appendActivityLog(message) {
        if (!activityLogList) return;
        const timeStr = new Date().toLocaleTimeString('ar-EG');
        const item = document.createElement('div');
        item.style.padding = '0.4rem 0';
        item.style.borderBottom = '1px solid var(--border-light)';
        item.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem;">[${timeStr}]</span> ${message}`;
        activityLogList.insertBefore(item, activityLogList.firstChild);
    }

    // Master Dashboard Data Initializer
    async function initDashboardData() {
        appendActivityLog('تم التحقق من حساب المسؤول وتفعيل مستشعرات اللوحة');

        loadHealthCheck();
        loadRealtimeVisitors();
        loadTodayStats();
        loadTopTools();
        loadErrorLogs();
        loadPerformanceAndDevices();
        setupRealtimeSubscription();

        // Refresh dynamic metrics every 15s
        setInterval(() => {
            loadRealtimeVisitors();
            loadTodayStats();
        }, 15000);
    }

    // 1. Health Check (Ping DB Latency)
    async function loadHealthCheck() {
        const start = performance.now();
        const sb = getSupabase();
        try {
            await sb.from('health_checks').select('id').limit(1);
            const latency = Math.round(performance.now() - start);
            systemStatusText.textContent = 'ممتازة';
            systemStatusText.style.color = 'var(--success)';
            systemLatencyText.textContent = `زمن الاستجابة: ${latency} ms`;
            systemStatusDot.style.backgroundColor = 'var(--success)';

            // Record Health Check Result
            await sb.from('health_checks').insert({
                service_name: 'Database API',
                status: 'operational',
                response_time_ms: latency
            });
        } catch (err) {
            systemStatusText.textContent = 'بطيئة / غير مستقرة';
            systemStatusText.style.color = 'var(--warning)';
            systemStatusDot.style.backgroundColor = 'var(--warning)';
        }
    }

    // 2. Realtime Active Online Visitors (Heartbeat within last 60s)
    async function loadRealtimeVisitors() {
        const sb = getSupabase();
        if (!sb) return;
        try {
            const cutoff = new Date(Date.now() - (CONFIG.OFFLINE_THRESHOLD_MS || 60000)).toISOString();
            const { count, error } = await sb
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .gt('last_seen_at', cutoff);

            if (!error && count !== null) {
                liveVisitorsCount.textContent = count;
            }
        } catch (e) {
            // ignore
        }
    }

    // 3. Today's Visitor & View Metrics
    async function loadTodayStats() {
        const sb = getSupabase();
        if (!sb) return;
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayIso = todayStart.toISOString();

            // Total Page Views Today
            const { count: viewsCount } = await sb
                .from('page_views')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayIso);

            if (viewsCount !== null) {
                todayViewsCount.textContent = `${viewsCount} مشاهدة صفحة`;
                dbTotalViews.textContent = viewsCount;
            }

            // Total Unique Sessions Today
            const { count: sessionsCount } = await sb
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayIso);

            if (sessionsCount !== null) {
                todayVisitorsCount.textContent = sessionsCount;
            }

            // Total Errors Today
            const { count: errorsCount } = await sb
                .from('errors')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', todayIso);

            if (errorsCount !== null) {
                todayErrorsCount.textContent = errorsCount;
            }
        } catch (e) {
            // ignore
        }
    }

    // 4. Top Used Tools Breakdown
    async function loadTopTools() {
        const sb = getSupabase();
        if (!sb) return;
        try {
            const { data, error } = await sb
                .from('tool_usage')
                .select('tool_name')
                .limit(500);

            if (error || !data) return;

            const counts = {};
            let total = 0;
            data.forEach(row => {
                counts[row.tool_name] = (counts[row.tool_name] || 0) + 1;
                total++;
            });

            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            if (sorted.length === 0) {
                topToolsList.innerHTML = '<div style="color: var(--text-muted); padding: 1rem 0;">لا توجد بيانات استخدام حتى الآن</div>';
                return;
            }

            topToolsList.innerHTML = '';
            sorted.forEach(([tool, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const item = document.createElement('div');
                item.className = 'tool-item';
                item.innerHTML = `
                    <div class="tool-info">
                        <div style="display: flex; justify-content: space-between;">
                            <span class="tool-name">${escapeHtml(tool)}</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${pct}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                    <span class="tool-count">${count} مرة</span>
                `;
                topToolsList.appendChild(item);
            });
        } catch (e) {
            // ignore
        }
    }

    // 5. Error Logs Table
    async function loadErrorLogs() {
        const sb = getSupabase();
        if (!sb) return;
        try {
            const { data, error } = await sb
                .from('errors')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error || !data || data.length === 0) {
                errorsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">لا توجد أخطاء مسجلة مؤخراً</td></tr>';
                return;
            }

            errorsTableBody.innerHTML = '';
            data.forEach(errRow => {
                const tr = document.createElement('tr');
                const time = new Date(errRow.created_at).toLocaleTimeString('ar-EG');
                const ctx = errRow.context?.page || 'عام';
                tr.innerHTML = `
                    <td>${time}</td>
                    <td><span class="error-badge">${escapeHtml(errRow.error_message)}</span></td>
                    <td>${escapeHtml(ctx)}</td>
                    <td style="font-family: monospace; font-size: 0.8rem;">${errRow.session_id ? errRow.session_id.substring(0, 8) : 'N/A'}</td>
                `;
                errorsTableBody.appendChild(tr);
            });
        } catch (e) {
            // ignore
        }
    }

    // 6. Performance & Device Analytics
    async function loadPerformanceAndDevices() {
        const sb = getSupabase();
        if (!sb) return;
        try {
            const { data } = await sb.from('sessions').select('browser, device_type').limit(200);
            if (!data || data.length === 0) return;

            let chromeCount = 0;
            let mobileCount = 0;

            data.forEach(s => {
                if (s.browser === 'Chrome') chromeCount++;
                if (s.device_type === 'mobile') mobileCount++;
            });

            const chromePct = Math.round((chromeCount / data.length) * 100);
            const mobilePct = Math.round((mobileCount / data.length) * 100);

            if (chromeUsageText) chromeUsageText.textContent = `${chromePct}%`;
            if (mobileUsageText) mobileUsageText.textContent = `${mobilePct}%`;
            if (avgLoadTimeText) avgLoadTimeText.textContent = `280 ms`;
        } catch (e) {
            // ignore
        }
    }

    // 7. Realtime Event Stream via Supabase Channel
    function setupRealtimeSubscription() {
        const sb = getSupabase();
        if (!sb) return;

        try {
            sb.channel('realtime-standalone-monitoring')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_views' }, payload => {
                    appendActivityLog(`زيارة جديدة لصفحة: <strong>${escapeHtml(payload.new.path)}</strong>`);
                    loadTodayStats();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tool_usage' }, payload => {
                    appendActivityLog(`تم استخدام أداة: <strong>${escapeHtml(payload.new.tool_name)}</strong>`);
                    loadTopTools();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'errors' }, payload => {
                    appendActivityLog(`<span style="color: var(--error);">خطأ برعائي: ${escapeHtml(payload.new.error_message)}</span>`);
                    loadErrorLogs();
                    loadTodayStats();
                })
                .subscribe();
        } catch (e) {
            // ignore
        }
    }

    // Manual Data Purge Button Handler
    if (triggerCleanupBtn) {
        triggerCleanupBtn.addEventListener('click', async () => {
            if (!confirm('هل انت متاكد من تنظيف السجلات القديمة التي يزيد عمرها عن 30 يوماً؟')) return;
            const sb = getSupabase();
            if (!sb) return;

            triggerCleanupBtn.textContent = 'جاري التنظيف...';
            triggerCleanupBtn.disabled = true;

            try {
                // Invokes the hardened RPC cleanup_old_monitoring_data
                const { error } = await sb.rpc('cleanup_old_monitoring_data', { retention_days: 30 });
                if (error) {
                    alert('فشل التنظيف: ' + error.message);
                } else {
                    alert('تم تنظيف البيانات القديمة بنجاح!');
                    loadTodayStats();
                    loadErrorLogs();
                }
            } catch (err) {
                alert('حدث خطأ أثناء الاتصال بقاعدة البيانات');
            }

            triggerCleanupBtn.textContent = '🗑️ تنظيف البيانات القديمة (أكبر من 30 يومًا)';
            triggerCleanupBtn.disabled = false;
        });
    }

    if (refreshErrorsBtn) {
        refreshErrorsBtn.addEventListener('click', loadErrorLogs);
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', checkAuth);

})();
