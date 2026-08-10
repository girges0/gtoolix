// =====================================================================
// GToolix — Centralized Production Advertising System (Adsterra Integration)
// Enterprise Fail-Safe Ad Manager for Primary & 3-Use Conditional Ads
// =====================================================================

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AdManager = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Central Config & Feature Flag
    const AD_CONFIG = {
        enabled: true, // Feature flag: Set to false to instantly disable all ads
        storageKey: 'gtoolix_ad_usage',
        triggerThreshold: 3, // Display conditional ad every 3 successful uses

        adUnits: {
            'NativeBanner_1': {
                id: '30679713',
                type: 'native',
                scriptUrl: 'https://pl30780212.effectivecpmnetwork.com/cf72ae0eecb6564d752d90fbaf702aa9/invoke.js',
                containerId: 'container-cf72ae0eecb6564d752d90fbaf702aa9'
            },
            '320x50_1': {
                id: '30679714',
                type: 'iframe',
                width: 320,
                height: 50,
                key: 'fb3e69189280b6743811b3cd6c62a26c',
                scriptUrl: 'https://www.highperformanceformat.com/fb3e69189280b6743811b3cd6c62a26c/invoke.js'
            },
            '300x250_1': {
                id: '30679715',
                type: 'iframe',
                width: 300,
                height: 250,
                key: '508f5df95a46921027eaae65b738199d',
                scriptUrl: 'https://www.highperformanceformat.com/508f5df95a46921027eaae65b738199d/invoke.js'
            },
            '728x90_1': {
                id: '30679717',
                type: 'iframe',
                width: 728,
                height: 90,
                key: '49f925f88072b4c395baa497ef3b34a9',
                scriptUrl: 'https://www.highperformanceformat.com/49f925f88072b4c395baa497ef3b34a9/invoke.js'
            }
        }
    };

    // In-memory state storage fallback if localStorage unavailable
    let inMemoryStorage = {};
    const debounceLocks = {};

    /**
     * Safely read usage data from localStorage / fallback
     */
    function getUsageData() {
        try {
            if (typeof localStorage !== 'undefined') {
                const data = localStorage.getItem(AD_CONFIG.storageKey);
                if (data) return JSON.parse(data);
            }
        } catch (e) {
            console.warn('AdManager: localStorage read unavailable, using in-memory storage', e);
        }
        return inMemoryStorage;
    }

    /**
     * Safely write usage data to localStorage / fallback
     */
    function saveUsageData(data) {
        inMemoryStorage = data;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(AD_CONFIG.storageKey, JSON.stringify(data));
            }
        } catch (e) {
            console.warn('AdManager: localStorage write unavailable', e);
        }
    }

    /**
     * Get usage metrics for a given tool
     */
    function getUsageCount(toolId) {
        if (!toolId) return 0;
        const data = getUsageData();
        return (data[toolId] && typeof data[toolId].successfulUses === 'number') ? data[toolId].successfulUses : 0;
    }

    /**
     * Detect if current viewport is mobile (<= 768px)
     */
    function isMobile() {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }

    /**
     * Safe HTML injection into an iframe to cleanly render an Adsterra iframe banner
     */
    /**
     * Safe HTML injection into an iframe to cleanly render an Adsterra iframe banner
     */
    function renderIframeAdUnit(containerEl, unit) {
        if (!containerEl || !unit) return;
        containerEl.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = unit.height + 'px';
        iframe.style.maxWidth = unit.width + 'px';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.display = 'block';
        iframe.style.margin = '0 auto';
        iframe.setAttribute('title', 'Advertisement');
        iframe.setAttribute('loading', 'lazy');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  html, body { margin:0; padding:0; height:100%; width:100%; display:flex; justify-content:center; align-items:center; background:transparent; overflow:hidden; }
</style>
</head>
<body>
<script type="text/javascript">
  atOptions = {
    'key' : '${unit.key}',
    'format' : 'iframe',
    'height' : ${unit.height},
    'width' : ${unit.width},
    'params' : {}
  };
</script>
<script type="text/javascript" src="${unit.scriptUrl}"></script>
</body>
</html>`;

        containerEl.appendChild(iframe);

        try {
            if ('srcdoc' in iframe) {
                iframe.srcdoc = html;
            }
            const doc = iframe.contentWindow || iframe.contentDocument;
            if (doc) {
                const iframeDoc = doc.document || doc;
                iframeDoc.open();
                iframeDoc.write(html);
                iframeDoc.close();
            }
        } catch (err) {
            console.warn('AdManager: Error writing iframe ad content', err);
        }
    }

    /**
     * Render Native Banner unit safely inside a container
     */
    function renderNativeAdUnit(containerEl, unit) {
        if (!containerEl || !unit) return;
        containerEl.innerHTML = '';

        const nativeWrapper = document.createElement('div');
        nativeWrapper.id = unit.containerId;
        nativeWrapper.className = 'adsterra-native-inner';
        containerEl.appendChild(nativeWrapper);

        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = unit.scriptUrl;
        containerEl.appendChild(script);
    }

    /**
     * Generic ad unit loader router
     */
    function renderAdUnit(containerEl, unitKey) {
        if (!AD_CONFIG.enabled || !containerEl) return;
        const unit = AD_CONFIG.adUnits[unitKey];
        if (!unit) return;

        // Hide skeleton if container has skeleton loader
        const skeleton = containerEl.querySelector('.ad-skeleton');
        if (skeleton) {
            setTimeout(() => {
                skeleton.style.display = 'none';
            }, 500);
        }

        const adBody = containerEl.querySelector('.ad-container-inner') || containerEl;

        if (unit.type === 'iframe') {
            renderIframeAdUnit(adBody, unit);
        } else if (unit.type === 'native') {
            renderNativeAdUnit(adBody, unit);
        }
    }

    /**
     * Render Primary Ads scoped to active page view
     */
    function renderPrimaryAds(activePageId) {
        if (!AD_CONFIG.enabled) return;

        let scopeEl = document;
        if (activePageId) {
            const pageIdStr = String(activePageId).replace(/^page-/, '');
            const targetEl = document.getElementById('page-' + pageIdStr);
            if (targetEl) {
                scopeEl = targetEl;
            }
        } else {
            const activePageEl = document.querySelector('.page-view.active');
            if (activePageEl) scopeEl = activePageEl;
        }

        const mobile = isMobile();
        const slot1Key = mobile ? '320x50_1' : '728x90_1';
        const slot2Key = mobile ? 'NativeBanner_1' : '300x250_1';

        const primarySlots = scopeEl.querySelectorAll('.ad-slot--primary');
        primarySlots.forEach((slot, index) => {
            if (slot.getAttribute('data-ad-rendered') === 'true') return;
            slot.setAttribute('data-ad-rendered', 'true');
            if (index === 0) {
                renderAdUnit(slot, slot1Key);
            } else {
                renderAdUnit(slot, slot2Key);
            }
        });
    }

    /**
     * Render the conditional 3rd ad after 3 successful uses
     */
    function renderConditionalAd(toolId) {
        if (!AD_CONFIG.enabled) return;

        const activePageEl = document.querySelector('.page-view.active') || document;
        const conditionalSlots = activePageEl.querySelectorAll('.ad-slot--conditional');
        if (!conditionalSlots.length) return;

        const mobile = isMobile();
        const adUnitKey = mobile ? 'NativeBanner_1' : '300x250_1';

        conditionalSlots.forEach(slot => {
            slot.style.display = 'block';
            slot.classList.add('is-active');

            // Inject Close control if not present
            if (!slot.querySelector('.ad-close-btn')) {
                const headerBar = document.createElement('div');
                headerBar.className = 'ad-conditional-header';

                const labelSpan = document.createElement('span');
                labelSpan.className = 'ad-label';
                const isAr = (typeof localStorage !== 'undefined' && localStorage.getItem('siteLang') === 'ar') || document.documentElement.lang === 'ar';
                labelSpan.textContent = isAr ? 'إعلان • ADVERTISEMENT' : 'ADVERTISEMENT';

                const closeBtn = document.createElement('button');
                closeBtn.className = 'ad-close-btn';
                closeBtn.setAttribute('type', 'button');
                closeBtn.setAttribute('aria-label', isAr ? 'إغلاق الإعلان' : 'Close Advertisement');
                closeBtn.innerHTML = '&times; ' + (isAr ? 'إغلاق' : 'Close');

                closeBtn.addEventListener('click', () => {
                    slot.style.display = 'none';
                    slot.classList.remove('is-active');
                });

                headerBar.appendChild(labelSpan);
                headerBar.appendChild(closeBtn);
                slot.insertBefore(headerBar, slot.firstChild);
            }

            renderAdUnit(slot, adUnitKey);
        });
    }

    /**
     * Record a successful operation for a given tool
     * Protects against double-clicks & duplicate callbacks.
     */
    function recordSuccessfulUse(toolId) {
        if (!AD_CONFIG.enabled || !toolId) return;

        // Anti-double counting lock (2 seconds window per tool)
        const now = Date.now();
        if (debounceLocks[toolId] && (now - debounceLocks[toolId] < 2000)) {
            return;
        }
        debounceLocks[toolId] = now;

        const data = getUsageData();
        if (!data[toolId]) {
            data[toolId] = { successfulUses: 0, lastConditionalAdAt: 0 };
        }

        data[toolId].successfulUses += 1;
        saveUsageData(data);

        const currentCount = data[toolId].successfulUses;

        // Trigger conditional ad every 3 successful uses
        if (currentCount > 0 && currentCount % AD_CONFIG.triggerThreshold === 0) {
            data[toolId].lastConditionalAdAt = now;
            saveUsageData(data);

            // Defer non-intrusively to allow tool UI to render success state first
            setTimeout(() => {
                renderConditionalAd(toolId);
            }, 400);
        }
    }

    /**
     * Reset conditional counter for testing/admin purposes
     */
    function resetConditionalCounter(toolId) {
        const data = getUsageData();
        if (toolId) {
            if (data[toolId]) data[toolId].successfulUses = 0;
        } else {
            Object.keys(data).forEach(k => { data[k].successfulUses = 0; });
        }
        saveUsageData(data);
    }

    /**
     * Initialize AdManager
     */
    function init() {
        if (!AD_CONFIG.enabled) return;

        // Automatically render primary ads when DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => renderPrimaryAds());
        } else {
            renderPrimaryAds();
        }
    }

    // Return Public API
    return {
        init: init,
        renderPrimaryAds: renderPrimaryAds,
        renderConditionalAd: renderConditionalAd,
        recordSuccessfulUse: recordSuccessfulUse,
        getUsageCount: getUsageCount,
        resetConditionalCounter: resetConditionalCounter,
        isMobile: isMobile,
        config: AD_CONFIG
    };
}));
