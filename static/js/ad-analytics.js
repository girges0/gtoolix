// ===================================================================
// GToolix — Enterprise AdSense Lazy Loading & Impression Analytics
// Provides CLS-free lazy loading via IntersectionObserver and
// privacy-focused viewability tracking without blocking rendering.
// ===================================================================

(function () {
    'use strict';

    /**
     * Initialize lazy loading and observer for AdSense units
     */
    function initAdObserver() {
        const adUnits = document.querySelectorAll('.ad-slot-wrapper');
        if (!adUnits.length) return;

        // Use IntersectionObserver to lazy load ads when 200px from viewport
        const observerOptions = {
            root: null,
            rootMargin: '200px 0px',
            threshold: 0.05
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const wrapper = entry.target;
                    loadAdUnit(wrapper);
                    obs.unobserve(wrapper);
                }
            });
        }, observerOptions);

        adUnits.forEach(unit => observer.observe(unit));
    }

    /**
     * Trigger Google AdSense render for a slot unit
     */
    function loadAdUnit(wrapper) {
        if (wrapper.dataset.adLoaded === 'true') return;
        wrapper.dataset.adLoaded = 'true';

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            
            // Monitor when ad container fills content to hide skeleton loader
            const insEl = wrapper.querySelector('.adsbygoogle');
            if (insEl) {
                const checkStatus = setInterval(() => {
                    const status = insEl.getAttribute('data-ad-status');
                    if (status === 'filled' || insEl.children.length > 0 || insEl.clientHeight > 50) {
                        const skeleton = wrapper.querySelector('.ad-skeleton');
                        if (skeleton) skeleton.style.display = 'none';
                        clearInterval(checkStatus);
                        trackAdImpression(wrapper.dataset.adSlotId);
                    }
                }, 300);

                // Timeout safety fallback after 4 seconds
                setTimeout(() => {
                    clearInterval(checkStatus);
                    const skeleton = wrapper.querySelector('.ad-skeleton');
                    if (skeleton) skeleton.style.opacity = '0.3';
                }, 4000);
            }
        } catch (err) {
            console.warn('AdSense unit load warning:', err);
        }
    }

    /**
     * Non-blocking impression event logger
     */
    function trackAdImpression(slotId) {
        if (window.gtag) {
            window.gtag('event', 'ad_impression', {
                'event_category': 'AdSense',
                'event_label': slotId || 'default_slot',
                'non_interaction': true
            });
        }
    }

    // Initialize on main thread idle
    function scheduleInit() {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(initAdObserver, { timeout: 2500 });
        } else {
            setTimeout(initAdObserver, 1000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleInit);
    } else {
        scheduleInit();
    }
})();
