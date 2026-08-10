// ===================================================================
// GToolix — Enterprise Ad Analytics & Fail-Safe Auto-Collapser
// Provides CLS-free lazy loading via IntersectionObserver, auto-collapse
// of empty/failed ad containers (403 Forbidden / AdBlock), and impression tracking.
// ===================================================================

(function () {
    'use strict';

    /**
     * Check all ad slot wrappers and hide any that failed to render or are empty.
     */
    function collapseFailedAdSlots() {
        const adUnits = document.querySelectorAll('.ad-slot-wrapper');
        adUnits.forEach(wrapper => {
            // Check if ads are explicitly disabled globally
            if (window.GTOOLIX_ADS_ENABLED === false) {
                wrapper.style.display = 'none';
                wrapper.classList.add('ad-failed');
                return;
            }

            const inner = wrapper.querySelector('.ad-container-inner') || wrapper;
            const iframes = inner.querySelectorAll('iframe');
            const insTags = inner.querySelectorAll('.adsbygoogle');

            let hasContent = false;

            // Check iframe dimensions
            iframes.forEach(iframe => {
                try {
                    const h = iframe.offsetHeight || iframe.clientHeight;
                    const w = iframe.offsetWidth || iframe.clientWidth;
                    if (h > 15 && w > 15) {
                        hasContent = true;
                    }
                } catch (e) { }
            });

            // Check Google AdSense status
            insTags.forEach(ins => {
                const status = ins.getAttribute('data-ad-status');
                if (status === 'filled' || ins.clientHeight > 20 || ins.children.length > 0) {
                    hasContent = true;
                }
            });

            // If ad container has no rendered content, hide it completely to preserve UI
            if (!hasContent) {
                wrapper.style.display = 'none';
                wrapper.classList.add('ad-failed');
                wrapper.setAttribute('data-ad-collapsed', 'true');
            } else {
                wrapper.style.display = '';
                wrapper.classList.remove('ad-failed');
            }
        });
    }

    /**
     * Listen for network/script errors on ad delivery CDNs (403, 404, blocked)
     */
    function attachAdErrorListeners() {
        window.addEventListener('error', function (e) {
            const target = e.target;
            if (target && (target.tagName === 'SCRIPT' || target.tagName === 'IFRAME')) {
                const src = target.src || '';
                if (src.includes('highperformanceformat.com') ||
                    src.includes('spendsdetachment.com') ||
                    src.includes('zoologyfibre.com') ||
                    src.includes('googlesyndication.com')) {
                    const wrapper = target.closest('.ad-slot-wrapper');
                    if (wrapper) {
                        wrapper.style.display = 'none';
                        wrapper.classList.add('ad-failed');
                        wrapper.setAttribute('data-ad-collapsed', 'true');
                    }
                }
            }
        }, true);
    }

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

                // Timeout safety fallback after 3 seconds
                setTimeout(() => {
                    clearInterval(checkStatus);
                    const skeleton = wrapper.querySelector('.ad-skeleton');
                    if (skeleton) skeleton.style.opacity = '0.3';
                }, 3000);
            }
        } catch (err) {
            console.warn('Ad unit load warning:', err);
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

    // Schedule fail-safe checks at multiple stages to guarantee zero empty boxes
    function scheduleInit() {
        attachAdErrorListeners();

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(initAdObserver, { timeout: 2500 });
        } else {
            setTimeout(initAdObserver, 1000);
        }

        // Run auto-collapse check after initial load and after render attempts
        setTimeout(collapseFailedAdSlots, 1200);
        setTimeout(collapseFailedAdSlots, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleInit);
    } else {
        scheduleInit();
    }

    // Expose utility globally
    window.GToolixAdUtils = {
        collapseFailedAdSlots: collapseFailedAdSlots
    };
})();

