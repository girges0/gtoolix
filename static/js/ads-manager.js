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
            '320x50_1': {
                id: '30679714',
                type: 'iframe',
                width: 320,
                height: 50,
                key: 'fb3e69189280b6743811b3cd6c62a26c'
            },
            '300x250_1': {
                id: '30679715',
                type: 'iframe',
                width: 300,
                height: 250,
                key: '508f5df95a46921027eaae65b738199d'
            },
            '728x90_1': {
                id: '30679717',
                type: 'iframe',
                width: 728,
                height: 90,
                key: '49f925f88072b4c395baa497ef3b34a9'
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
     * Render Adsterra iframe banner inside an isolated iframe document
     * Uses srcdoc for clean isolation and zero global variable collision
     */
    function renderIframeAdUnit(containerEl, unit) {
        if (!containerEl || !unit) return;
        
        // Hide skeleton if present
        const sk = containerEl.querySelector('.ad-skeleton');
        if (sk) {
            sk.style.display = 'none';
        }

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
<style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:transparent;overflow:hidden;}</style>
</head>
<body>
<script type="text/javascript">
  var atOptions = {
    'key' : '${unit.key}',
    'format' : 'iframe',
    'height' : ${unit.height},
    'width' : ${unit.width},
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highperformanceformat.com/${unit.key}/invoke.js"></script>
</body>
</html>`;

        if ('srcdoc' in iframe) {
            iframe.srcdoc = html;
        }
        containerEl.appendChild(iframe);

        try {
            const doc = iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument;
            if (doc && !('srcdoc' in iframe)) {
                doc.open();
                doc.write(html);
                doc.close();
            }
        } catch (e) {
            console.warn('AdManager iframe write error:', e);
        }
    }

    /**
     * Generic ad unit loader router — isolated via iframe
     */
    function renderAdUnit(containerEl, unitKey) {
        if (!AD_CONFIG.enabled || !containerEl) return;
        const unit = AD_CONFIG.adUnits[unitKey];
        if (!unit) return;

        const adBody = containerEl.querySelector('.ad-container-inner') || containerEl;
        adBody.innerHTML = '';
        renderIframeAdUnit(adBody, unit);
    }

    /**
     * Render Primary Ads scoped to active visible page view
     */
    function renderPrimaryAds(activePageId) {
        if (!AD_CONFIG.enabled || typeof document === 'undefined') return;

        let scopeEl = document;
        if (activePageId) {
            const pageIdStr = String(activePageId).replace(/^page-/, '');
            const targetEl = document.getElementById('page-' + pageIdStr);
            if (targetEl) scopeEl = targetEl;
        } else {
            const activePageEl = document.querySelector('.page-view.active');
            if (activePageEl) scopeEl = activePageEl;
        }

        const mobile = isMobile();
        const slot1Key = mobile ? '300x250_1' : '728x90_1';
        const slot2Key = '300x250_1';

        const primarySlots = scopeEl.querySelectorAll('.ad-slot--primary');
        primarySlots.forEach((slot, index) => {
            if (slot.getAttribute('data-ad-rendered') === 'true') return;

            slot.setAttribute('data-ad-rendered', 'true');
            if (index % 2 === 0) {
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
        if (!AD_CONFIG.enabled || typeof document === 'undefined') return;

        const activePageEl = document.querySelector('.page-view.active') || document;
        const conditionalSlots = activePageEl.querySelectorAll('.ad-slot--conditional');
        if (!conditionalSlots.length) return;

        const mobile = isMobile();
        const adUnitKey = mobile ? '320x50_1' : '300x250_1';

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
        if (!AD_CONFIG.enabled || typeof document === 'undefined') return;

        // Automatically render primary ads when DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => renderPrimaryAds());
        } else {
            renderPrimaryAds();
        }
    }

    // Auto initialize if in browser context
    if (typeof window !== 'undefined') {
        init();
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
