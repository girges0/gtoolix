// =====================================================================
// GToolix Monitoring Module — Supabase Configuration
// =====================================================================
(function () {
    'use strict';

    window.GTOOLIX_MONITORING_CONFIG = {
        // Replace with your actual Supabase URL & Anon Key or set window.GTOOLIX_SUPABASE_URL before loading this script.
        SUPABASE_URL: window.GTOOLIX_SUPABASE_URL || 'https://xyzcompany.supabase.co',
        SUPABASE_ANON_KEY: window.GTOOLIX_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.example_anon_key',
        HEARTBEAT_INTERVAL_MS: 30000, // 30 seconds ping
        OFFLINE_THRESHOLD_MS: 60000,   // 60 seconds timeout
        RETENTION_DAYS: 30
    };
})();
