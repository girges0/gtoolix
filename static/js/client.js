// =====================================================================
// GToolix Client SDK — Zero-Overhead Local Telemetry Handler
// Standalone Mode (Zero External Network Calls / Zero Supabase)
// =====================================================================
(function () {
    'use strict';

    if (window.GToolixMonitor) return;

    const GToolixMonitor = {
        async trackPageView(path) {
            // Local no-op for maximum performance and zero external calls
        },
        async trackToolUsage(toolName, metadata) {
            // Local no-op
        },
        async trackError(error, context, severity = 'warning') {
            if (window.GTOOLIX_DEBUG === true) {
                console.warn('[GToolix Local Monitor Error]:', error, context);
            }
        },
        async trackPerformance(metricName, metricValue, deviceType) {
            // Local no-op
        },
        async trackEvent(eventName, metadata) {
            // Local no-op
        }
    };

    window.GToolixMonitor = GToolixMonitor;
})();
