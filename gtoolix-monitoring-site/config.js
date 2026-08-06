// =====================================================================
// GToolix Monitoring Module — Configuration
// Reads from window.GTOOLIX_SUPABASE_URL / window.GTOOLIX_SUPABASE_ANON_KEY if set,
// or falls back to explicit placeholder strings.
// =====================================================================
(function () {
    'use strict';

    window.GTOOLIX_MONITORING_CONFIG = {
        SUPABASE_URL: window.GTOOLIX_SUPABASE_URL || 'YOUR_SUPABASE_URL',
        SUPABASE_ANON_KEY: window.GTOOLIX_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
        HEARTBEAT_INTERVAL_MS: 30000, // 30 seconds ping
        OFFLINE_THRESHOLD_MS: 60000,   // 60 seconds timeout
        RETENTION_DAYS: 30
    };
})();
