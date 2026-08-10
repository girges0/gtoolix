/**
 * GToolix - Premium YouTube Thumbnail Downloader Engine
 * SaaS-grade UI/UX, 3 Resolutions (4K, HD, SD), Mobile-first & Fully Responsive
 * 100% Client-Side Engine (No Backend Server Required)
 */
var ThumbTool = (function () {
    let currentVideoId = null;

    function extractVideoId(url) {
        if (!url) return null;
        url = url.trim();

        // 1. Raw 11-character video ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

        // 2. Standard watch, shorts, live, embed, youtu.be links
        const patterns = [
            /(?:v=|\/v\/|\/embed\/|\/shorts\/|\/live\/|youtu\.be\/|\/e\/)([^"&?\/\s]{11})/,
            /youtube\.com\/watch\?.*v=([^"&?\/\s]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }

        return null;
    }

    function getStr(key) {
        if (typeof t === 'function') {
            return t(`thumb.${key}`);
        }
        return key;
    }

    function showToast(msg) {
        let toast = document.getElementById('qr-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'qr-toast';
            toast.className = 'qr-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
    }

    function clearInput() {
        const input = document.getElementById('thumb-url-input');
        const clearBtn = document.getElementById('thumb-clear-btn');
        const statusDiv = document.getElementById('thumb-status');
        const infoCard = document.getElementById('thumb-info-card');
        const grid = document.getElementById('thumb-grid');

        if (input) {
            input.value = '';
            input.focus();
        }
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        if (statusDiv) statusDiv.innerHTML = '';
        if (infoCard) infoCard.style.display = 'none';
        if (grid) {
            grid.style.display = 'none';
            grid.innerHTML = '';
        }
        currentVideoId = null;
    }

    function updateClearButtonVisibility() {
        const input = document.getElementById('thumb-url-input');
        const clearBtn = document.getElementById('thumb-clear-btn');
        if (clearBtn && input) {
            clearBtn.style.display = input.value.trim().length > 0 ? 'inline-flex' : 'none';
        }
    }

    function processInput() {
        const input = document.getElementById('thumb-url-input');
        const statusDiv = document.getElementById('thumb-status');
        const infoCard = document.getElementById('thumb-info-card');
        const grid = document.getElementById('thumb-grid');

        if (!input) return;
        const val = input.value.trim();

        if (!val) {
            clearInput();
            return;
        }

        const videoId = extractVideoId(val);
        if (!videoId) {
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="thumb-status-msg error">
                        <span class="status-icon">⚠️</span>
                        <span>${getStr('invalidUrlMsg') || 'Please enter a valid YouTube video URL or ID'}</span>
                    </div>`;
            }
            if (infoCard) infoCard.style.display = 'none';
            if (grid) grid.style.display = 'none';
            return;
        }

        currentVideoId = videoId;
        if (statusDiv) statusDiv.innerHTML = '';

        const thumbnails = [
            { id: 'maxresdefault', name_key: 'resMax', dim: '1280 × 720 px', badge: getStr('resMaxBadge') || '4K (Max Resolution)', badge_cls: 'badge-4k', url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
            { id: 'sddefault', name_key: 'resSd', dim: '640 × 480 px', badge: getStr('resSdBadge') || 'HD (High Quality)', badge_cls: 'badge-hd', url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg` },
            { id: 'hqdefault', name_key: 'resHq', dim: '480 × 360 px', badge: getStr('resHqBadge') || 'SD (Standard Quality)', badge_cls: 'badge-sd', url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }
        ];

        renderVideoInfo({
            video_id: videoId,
            short_url: `https://youtu.be/${videoId}`,
            canonical_url: `https://www.youtube.com/watch?v=${videoId}`
        });
        renderThumbnails(thumbnails, videoId);
    }

    function renderVideoInfo(data) {
        const infoCard = document.getElementById('thumb-info-card');
        if (!infoCard) return;

        infoCard.style.display = 'grid';
        
        const idEl = document.getElementById('thumb-info-id');
        if (idEl) idEl.textContent = data.video_id;

        const linkEl = document.getElementById('thumb-info-url');
        if (linkEl) {
            const displayUrl = data.short_url || `https://youtu.be/${data.video_id}`;
            const targetUrl = data.canonical_url || `https://www.youtube.com/watch?v=${data.video_id}`;
            linkEl.href = targetUrl;
            linkEl.textContent = displayUrl;
        }

        const countEl = document.getElementById('thumb-info-count');
        if (countEl) {
            countEl.textContent = getStr('infoCountText') || '3 Resolutions';
        }

        const statusEl = document.getElementById('thumb-info-status');
        if (statusEl) {
            statusEl.textContent = getStr('infoStatusText') || 'Active • Ready';
        }
    }

    function renderThumbnails(thumbnails, videoId) {
        const grid = document.getElementById('thumb-grid');
        if (!grid) return;

        const allowedIds = ['maxresdefault', 'sddefault', 'hqdefault'];
        const filtered = thumbnails.filter(t => allowedIds.includes(t.id));

        grid.style.display = 'grid';
        grid.innerHTML = '';

        filtered.forEach(res => {
            const imgUrl = res.url;
            const card = document.createElement('div');
            card.className = 'thumb-card glass-card';
            card.dataset.resId = res.id;

            const name = getStr(res.name_key) || res.id;
            let badgeText = res.badge;
            let badgeCls = res.badge_cls || 'badge-sd';

            if (res.id === 'maxresdefault') {
                badgeText = getStr('resMaxBadge') || '4K (Max Resolution)';
                badgeCls = 'badge-4k';
            } else if (res.id === 'sddefault') {
                badgeText = getStr('resSdBadge') || 'HD (High Quality)';
                badgeCls = 'badge-hd';
            } else if (res.id === 'hqdefault') {
                badgeText = getStr('resHqBadge') || 'SD (Standard Quality)';
                badgeCls = 'badge-sd';
            }

            card.innerHTML = `
                <div class="thumb-card__header">
                    <span class="thumb-badge ${badgeCls}">${badgeText}</span>
                    <span class="thumb-dim">${res.dim}</span>
                </div>
                <div class="thumb-card__img-wrapper">
                    <div class="img-skeleton"></div>
                    <img class="thumb-img" src="${imgUrl}" alt="${name}" loading="lazy" 
                         onload="ThumbTool.onImgLoad(this, '${res.id}')" 
                         onerror="ThumbTool.onImgError(this)">
                </div>
                <div class="thumb-card__content">
                    <h3 class="thumb-card__title">${name}</h3>
                </div>
                <div class="thumb-card__actions">
                    <button type="button" class="btn btn-primary thumb-card__btn-main" onclick="ThumbTool.downloadThumbnail('${imgUrl}', '${videoId}', '${res.id}')">
                        <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <span>${getStr('btnDownload') || 'Download'}</span>
                    </button>
                    <div class="thumb-card__sub-actions">
                        <a class="btn btn-ghost thumb-card__btn-sub" href="${imgUrl}" target="_blank" rel="noopener" aria-label="${getStr('btnOpen') || 'Open Image'}" title="${getStr('btnOpen') || 'Open Image'}">
                            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            <span>${getStr('btnOpen') || 'Open Image'}</span>
                        </a>
                        <button type="button" class="btn btn-ghost thumb-card__btn-sub" onclick="ThumbTool.copyUrl('${imgUrl}')" aria-label="${getStr('btnCopy') || 'Copy Link'}" title="${getStr('btnCopy') || 'Copy Link'}">
                            <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span>${getStr('btnCopy') || 'Copy Link'}</span>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        updateAvailableCount();
        if (window.AdManager) {
            window.AdManager.recordSuccessfulUse('youtube-thumbnail-downloader');
        }
    }

    async function downloadThumbnail(imgUrl, videoId, resId) {
        try {
            showToast(getStr('toastPreparing') || 'Downloading thumbnail...');
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `youtube_thumbnail_${videoId}_${resId}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (err) {
            const a = document.createElement('a');
            a.href = imgUrl;
            a.target = '_blank';
            a.download = `youtube_thumbnail_${videoId}_${resId}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    function updateAvailableCount() {
        const grid = document.getElementById('thumb-grid');
        const countEl = document.getElementById('thumb-info-count');
        if (grid && countEl) {
            const visibleCards = grid.querySelectorAll('.thumb-card:not([style*="display: none"])').length;
            countEl.textContent = `${visibleCards} ${getStr('infoCountSuffix') || 'Available'}`;
        }
    }

    function onImgLoad(imgEl, resId) {
        const wrapper = imgEl.closest('.thumb-card__img-wrapper');
        if (wrapper) {
            const skeleton = wrapper.querySelector('.img-skeleton');
            if (skeleton) skeleton.style.display = 'none';
        }
        imgEl.style.opacity = '1';

        if (imgEl.naturalWidth <= 120 && imgEl.naturalHeight <= 90 && (resId === 'maxresdefault' || resId === 'sddefault')) {
            const card = imgEl.closest('.thumb-card');
            if (card) {
                card.style.display = 'none';
                updateAvailableCount();
            }
        }
    }

    function onImgError(imgEl) {
        const card = imgEl.closest('.thumb-card');
        if (card) {
            card.style.display = 'none';
            updateAvailableCount();
        }
    }

    function copyUrl(url) {
        if (!url) return;
        navigator.clipboard.writeText(url).then(() => {
            showToast(getStr('toastCopied') || '📋 Image URL copied!');
        }).catch(() => {
            showToast(url);
        });
    }

    function init() {
        const input = document.getElementById('thumb-url-input');
        const clearBtn = document.getElementById('thumb-clear-btn');
        const pasteBtn = document.getElementById('thumb-paste-btn');

        if (input) {
            input.addEventListener('input', () => {
                updateClearButtonVisibility();
                clearTimeout(input._timer);
                input._timer = setTimeout(processInput, 400);
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(input._timer);
                    processInput();
                }
            });

            const autoClear = () => {
                if (input.getAttribute('data-auto-cleared') !== 'true') {
                    if (input.value && (input.value.includes('dQw4w9WgXcQ') || input.value.includes('e.g.'))) {
                        input.value = '';
                        updateClearButtonVisibility();
                    }
                    input.setAttribute('data-auto-cleared', 'true');
                }
            };
            input.addEventListener('focus', autoClear);
            input.addEventListener('click', autoClear);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', clearInput);
        }

        if (pasteBtn && input) {
            let lastHandled = 0;
            const handlePaste = async (e) => {
                if (e) {
                    if (e.cancelable) e.preventDefault();
                    e.stopPropagation();
                }
                const now = Date.now();
                if (now - lastHandled < 300) return;
                lastHandled = now;

                let pastedText = '';
                let success = false;

                // 1. Try Clipboard Web API
                if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
                    try {
                        const clipText = await navigator.clipboard.readText();
                        if (clipText && clipText.trim().length > 0) {
                            pastedText = clipText.trim();
                            success = true;
                        }
                    } catch (err) {
                        console.warn('navigator.clipboard.readText blocked or denied:', err);
                    }
                }

                // 2. Try execCommand fallback if clipboard API was denied
                if (!success) {
                    try {
                        input.focus();
                        input.select();
                        if (document.execCommand && document.execCommand('paste')) {
                            if (input.value && input.value.trim().length > 0) {
                                pastedText = input.value.trim();
                                success = true;
                            }
                        }
                    } catch (err) {
                        console.warn('execCommand paste failed:', err);
                    }
                }

                if (success && pastedText) {
                    input.value = pastedText;
                    updateClearButtonVisibility();
                    processInput();
                    showToast(getStr('toastPasted') || (document.documentElement.dir === 'rtl' ? '📋 تم لصق الرابط بنجاح!' : '📋 Link pasted successfully!'));
                } else {
                    // Mobile Fallback: Focus input field and select all text to trigger phone clipboard bar
                    input.focus();
                    try {
                        input.setSelectionRange(0, input.value.length);
                    } catch (err) {}
                    showToast(getStr('toastPasteHint') || (document.documentElement.dir === 'rtl' ? '💡 اضغط ضغطة مطولة داخل الحقل ثم اختر "لصق"' : '💡 Tap & hold inside field to paste'));
                }
            };

            pasteBtn.addEventListener('click', handlePaste);
            pasteBtn.addEventListener('touchend', (e) => {
                handlePaste(e);
            }, { passive: false });
        }
    }

    return {
        init,
        processInput,
        clearInput,
        extractVideoId,
        onImgLoad,
        onImgError,
        copyUrl,
        downloadThumbnail
    };
})();

function autoInitThumb() {
    if (document.getElementById('page-thumb') || document.getElementById('thumb-url-input')) {
        ThumbTool.init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitThumb);
} else {
    autoInitThumb();
}
