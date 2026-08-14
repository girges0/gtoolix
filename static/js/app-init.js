// ===================================================================
// GToolix — Core Application & Single-Page Router Script
// Minified via build pipeline for fast paint & zero main-thread block.
// ===================================================================
(function () {
    'use strict';

    const PAGE_IDS = { home: 'page-home', qr: 'page-qr', thumb: 'page-thumb', gemini: 'page-gemini', recorder: 'page-recorder' };
    const PAGE_TITLES = {
        home: 'GToolix – Free Online Tools: QR Code Generator, YouTube Thumbnail Grabber, Gemini Watermark Remover, Screen Studio Recorder',
        qr: 'Free QR Code Generator Online – No Signup, Instant Download | GToolix',
        thumb: 'YouTube Thumbnail Downloader – Download HD & 4K Thumbnails Free | GToolix',
        gemini: 'Gemini Watermark Remover – Clean AI-Generated Images Free | GToolix',
        recorder: 'Screen Studio Recorder | Free Online Screen & Camera Recorder - GToolix'
    };
    const HASH_TO_PAGE = { '': 'home', '#': 'home', '#home': 'home', '#qr-code': 'qr', '#youtube-thumbnail': 'thumb', '#gemini-watermark': 'gemini', '#screen-recorder': 'recorder' };
    const PAGE_TO_HASH = { home: '', qr: '#qr-code', thumb: '#youtube-thumbnail', gemini: '#gemini-watermark', recorder: '#screen-recorder' };
    const PAGE_TO_PATH = { home: '/', qr: '#qr-code', thumb: '#youtube-thumbnail', gemini: '#gemini-watermark', recorder: '#screen-recorder' };
    const PATH_TO_PAGE = { '/': 'home', '/gemini-watermark-remover': 'gemini', '/qr-code-generator': 'qr', '/youtube-thumbnail-downloader': 'thumb', '/screen-recorder-studio': 'recorder', '/tools/qr/': 'qr', '/tools/thumbnail/': 'thumb', '/tools/gemini/': 'gemini', '/tools/screen-recorder/': 'recorder' };

    const loadedToolScripts = {};
    function loadToolScript(src) {
        if (loadedToolScripts[src]) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => { loadedToolScripts[src] = true; resolve(); };
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }

    function ensureToolScripts(page) {
        if (page === 'qr') {
            if (window.QRTool) return Promise.resolve();
            return loadToolScript('/static/js/qrcode.min.js').then(() => loadToolScript('/static/js/qr-tool.min.js'));
        } else if (page === 'thumb') {
            if (window.ThumbTool) return Promise.resolve();
            return loadToolScript('/static/js/thumb-tool.min.js');
        } else if (page === 'gemini') {
            if (window.GeminiWatermarkTool && window.GeminiEngine) return Promise.resolve();
            return loadToolScript('/static/js/gemini-engine.bundle.js').then(() => loadToolScript('/static/js/gemini-watermark-remover.min.js'));
        } else if (page === 'recorder') {
            if (window.ScreenRecorderTool) {
                window.ScreenRecorderTool.onPageActivated();
                return Promise.resolve();
            }
            return loadToolScript('/static/js/screen-recorder-tool.min.js').then(() => {
                if (window.ScreenRecorderTool) window.ScreenRecorderTool.onPageActivated();
            });
        }
        return Promise.resolve();
    }

    function showPage(page, options) {
        options = options || {};
        if (!PAGE_IDS[page]) page = 'home';
        document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
        const targetEl = document.getElementById(PAGE_IDS[page]);
        if (targetEl) {
            targetEl.classList.add('active');
            targetEl.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
            if (page === 'home' && typeof window.resetHeroVisibility === 'function') {
                window.resetHeroVisibility();
            }
        }
        document.querySelectorAll('.site-nav__links a[data-page]').forEach(a => {
            a.classList.toggle('active', a.getAttribute('data-page') === page);
        });
        document.title = PAGE_TITLES[page] || PAGE_TITLES.home;

        if (options.updateUrl !== false) {
            const targetHash = PAGE_TO_HASH[page] !== undefined ? PAGE_TO_HASH[page] : '';
            const targetUrl = targetHash ? '/' + targetHash : '/';
            if (location.hash !== targetHash || (location.pathname !== '/' && location.pathname !== '')) {
                history.pushState({ page }, '', targetUrl);
            }
        }
        if (!options.skipScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

        ensureToolScripts(page).then(() => {
            if (window.ScreenRecorderTool) {
                if (page === 'recorder') {
                    window.ScreenRecorderTool.onPageActivated();
                } else {
                    window.ScreenRecorderTool.onPageDeactivated();
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-page]');
        if (!el) return;
        e.preventDefault();
        const targetPage = el.getAttribute('data-page');
        showPage(targetPage);
        if (typeof window.toggleNav === 'function') window.toggleNav(true);
    });

    window.addEventListener('popstate', (e) => {
        const p = (e.state && e.state.page) ? e.state.page : (HASH_TO_PAGE[location.hash] || PATH_TO_PAGE[location.pathname] || 'home');
        showPage(p, { skipScroll: true, updateUrl: false });
    });

    window.addEventListener('hashchange', () => {
        const p = HASH_TO_PAGE[location.hash] || 'home';
        showPage(p, { skipScroll: true });
    });

    // Motion & 3D Parallax system (Desktop only)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function lerp(a, b, n) { return a + (b - a) * n; }

    (function scene() {
        if (reduceMotion) return;
        const hero = document.getElementById('hero');
        const layers = {
            glow: document.getElementById('layer-glow'),
            grid: document.getElementById('layer-grid'),
            orbit: document.getElementById('layer-orbit'),
            content: document.getElementById('hero-content')
        };

        let targetProgress = 0, progress = 0;
        let tx = 0, ty = 0, px = 0, py = 0;
        let animId = null;
        let cachedHeroTotal = 1;

        function updateHeroDimensions() {
            const heroEl = document.getElementById('hero');
            if (!heroEl) return;
            cachedHeroTotal = heroEl.offsetHeight || 1;
        }

        function measureScroll() {
            if (window.innerWidth <= 1023 || !canHover) return;
            const heroEl = document.getElementById('hero');
            if (!heroEl) return;
            const rect = heroEl.getBoundingClientRect();
            if (rect.height) cachedHeroTotal = rect.height;
            targetProgress = Math.min(Math.max(-rect.top / (cachedHeroTotal * 0.9), 0), 1);
            scheduleApply();
        }

        if (canHover && hero) {
            hero.addEventListener('mouseenter', updateHeroDimensions, { passive: true });
            hero.addEventListener('mousemove', (e) => {
                if (window.innerWidth <= 1023) return;
                const heroEl = document.getElementById('hero');
                if (!heroEl) return;
                const rect = heroEl.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
                scheduleApply();
            }, { passive: true });
            hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; scheduleApply(); });
        }

        function apply() {
            const isDesktop = window.innerWidth > 1023 && canHover;
            const dp = Math.abs(targetProgress - progress);
            const dpx = Math.abs(tx - px);
            const dpy = Math.abs(ty - py);

            progress = lerp(progress, targetProgress, 0.08);
            px = lerp(px, tx, 0.06);
            py = lerp(py, ty, 0.06);
            const p = progress;

            if (layers.glow) {
                if (isDesktop) {
                    layers.glow.style.transform = `translate3d(0, ${p * 40}px, 0) scale(${1 + p * 0.08})`;
                } else {
                    layers.glow.style.transform = '';
                }
            }
            if (layers.grid) {
                if (isDesktop) {
                    layers.grid.style.transform = `translate3d(0, ${p * 90}px, 0) rotateX(${72 + p * 6}deg) translateZ(-260px)`;
                } else {
                    layers.grid.style.transform = '';
                }
            }
            if (layers.orbit) {
                if (isDesktop) {
                    layers.orbit.style.transform = `translate3d(${px * 16}px, ${p * -40 + py * 12}px, 0) rotateX(${p * -4}deg) translateZ(${p * 30}px)`;
                } else {
                    layers.orbit.style.transform = '';
                }
            }
            if (layers.content) {
                if (isDesktop) {
                    layers.content.style.transform = `translate3d(0, ${p * 50}px, 0) scale(${1 - p * 0.05}) rotateX(${py * -2.5}deg) rotateY(${px * 2.5}deg)`;
                    layers.content.style.opacity = String(Math.max(0, 1 - p * 1.15));
                } else {
                    layers.content.style.transform = '';
                    layers.content.style.opacity = '1';
                }
            }

            if (dp > 0.0001 || dpx > 0.0001 || dpy > 0.0001) {
                animId = requestAnimationFrame(apply);
            } else {
                animId = null;
            }
        }

        function scheduleApply() {
            if (!animId) animId = requestAnimationFrame(apply);
        }

        window.addEventListener('scroll', measureScroll, { passive: true });
        window.addEventListener('resize', () => { updateHeroDimensions(); measureScroll(); }, { passive: true });
        measureScroll();
        scheduleApply();

        window.resetHeroVisibility = function () {
            targetProgress = 0;
            progress = 0;
            if (layers.content) {
                layers.content.style.opacity = '1';
                layers.content.style.transform = '';
            }
            scheduleApply();
        };
    })();

    // 3D Card Interactive Light Tilt (Desktop hover only)
    (function cardTilt() {
        if (reduceMotion || !canHover) return;
        document.querySelectorAll('.tool-card, .tiktok-showcase-card, .tool-chip-card').forEach(card => {
            let rect = null;
            let ticking = false;
            card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
            card.addEventListener('mousemove', (e) => {
                if (!rect) rect = card.getBoundingClientRect();
                if (!ticking) {
                    ticking = true;
                    requestAnimationFrame(() => {
                        const px = (e.clientX - rect.left) / rect.width;
                        const py = (e.clientY - rect.top) / rect.height;
                        const rx = (0.5 - py) * 8;
                        const ry = (px - 0.5) * 10;
                        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
                        card.style.setProperty('--mx', (px * 100) + '%');
                        card.style.setProperty('--my', (py * 100) + '%');
                        ticking = false;
                    });
                }
            }, { passive: true });
            card.addEventListener('mouseleave', () => {
                rect = null;
                card.style.transform = '';
            });
        });
    })();

    // Scroll Entrance & Counter Animate
    (function revealOnScroll() {
        const items = document.querySelectorAll('.reveal');
        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach(el => el.classList.add('in-view'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('in-view'), Math.min(i * 30, 150));
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.01, rootMargin: '200px 0px 100px 0px' });
        items.forEach(el => io.observe(el));
    })();

    // Boot
    document.addEventListener('DOMContentLoaded', () => {
        const pc = document.getElementById('particles');
        if (pc && !reduceMotion && window.innerWidth > 1023) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < 35; i++) {
                const p = document.createElement('div'); p.className = 'particle';
                p.style.left = Math.random() * 100 + '%'; p.style.animationDelay = Math.random() * 8 + 's'; p.style.animationDuration = (Math.random() * 8 + 8) + 's';
                fragment.appendChild(p);
            }
            pc.appendChild(fragment);
        }
        if (typeof window.applyTranslations === 'function') window.applyTranslations();
        const pageFromPath = PATH_TO_PAGE[location.pathname];
        const pageFromHash = HASH_TO_PAGE[location.hash];
        const initPage = (location.hash && HASH_TO_PAGE[location.hash] && HASH_TO_PAGE[location.hash] !== 'home')
            ? HASH_TO_PAGE[location.hash]
            : (pageFromPath || 'home');
        showPage(initPage, { skipScroll: true, updateUrl: false });
    });
})();
