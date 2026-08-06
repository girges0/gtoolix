// =====================================================================
// GToolix Monitoring Module — Supabase Configuration
// =====================================================================
(function () {
    'use strict';

    window.GTOOLIX_MONITORING_CONFIG = {
        SUPABASE_URL: window.GTOOLIX_SUPABASE_URL || 'https://xucvfzpoeaeabbdmghdj.supabase.co',
        SUPABASE_ANON_KEY: window.GTOOLIX_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3ZmenBvZWFlYWJiZG1naGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzU4NTAsImV4cCI6MjEwMTYxMTg1MH0.rgd2FjES6Jm535Xw4vQpzQIZRPKk9NzMi2bt9A4reSo',
        HEARTBEAT_INTERVAL_MS: 30000, // 30 seconds ping
        OFFLINE_THRESHOLD_MS: 60000,   // 60 seconds timeout
        RETENTION_DAYS: 30
    };
})();