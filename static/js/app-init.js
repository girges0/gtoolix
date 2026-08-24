// ===================================================================
// GToolix — Core Application & Single-Page Router Script
// Minified via build pipeline for fast paint & zero main-thread block.
// ===================================================================
(function () {
    'use strict';

    // ===================================================================
    // Legacy Hash Detection — displays 404 UI for deprecated hash URLs
    // ===================================================================
    const LEGACY_TOOL_HASHES = ['#qr-code', '#youtube-thumbnail', '#screen-recorder', '#qr', '#thumb', '#recorder'];
    function handleLegacyHash() {
        const hash = (window.location.hash || '').toLowerCase();
        const isLegacy = LEGACY_TOOL_HASHES.includes(hash);
        const homeEl = document.getElementById('page-home');
        const notFoundEl = document.getElementById('page-404');
        if (isLegacy) {
            if (homeEl) homeEl.style.display = 'none';
            if (notFoundEl) {
                notFoundEl.style.display = 'block';
                notFoundEl.classList.add('active');
            }
            const currentLang = document.documentElement.lang || 'ar';
            document.title = (currentLang === 'en') ? "404 - Page Not Found | GToolix" : "404 - الصفحة غير موجودة | GToolix";
        } else {
            if (homeEl) homeEl.style.display = 'block';
            if (notFoundEl) {
                notFoundEl.style.display = 'none';
                notFoundEl.classList.remove('active');
            }
        }
    }
    window.addEventListener('hashchange', handleLegacyHash);

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
        document.querySelectorAll('.tool-card, .hero-tool-card').forEach(card => {
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

    // High-Performance Zero-Jank Count-Up Animation
    function initStatsCounter() {
        const statsBar = document.getElementById('stats-bar');
        if (!statsBar) return;

        const counters = statsBar.querySelectorAll('.counter-val');
        if (!counters.length) return;

        let hasAnimated = false;

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function runCountUp() {
            if (hasAnimated) return;
            hasAnimated = true;

            const duration = 1800;
            const startTime = performance.now();

            const items = Array.from(counters).map(el => {
                const target = parseFloat(el.getAttribute('data-target')) || 0;
                const prefix = el.getAttribute('data-prefix') || '';
                const suffix = el.getAttribute('data-suffix') || '';
                const format = el.getAttribute('data-format') || '';
                const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
                return { el, target, prefix, suffix, format, decimals };
            });

            function tick(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutCubic(progress);

                items.forEach(item => {
                    const current = item.target * eased;
                    let displayVal = '';
                    if (item.decimals > 0) {
                        displayVal = current.toFixed(item.decimals);
                    } else if (item.format === 'comma') {
                        displayVal = Math.round(current).toLocaleString('en-US');
                    } else {
                        displayVal = String(Math.round(current));
                    }
                    item.el.textContent = `${item.prefix}${displayVal}${item.suffix}`;
                });

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    items.forEach(item => {
                        let finalVal = '';
                        if (item.decimals > 0) {
                            finalVal = item.target.toFixed(item.decimals);
                        } else if (item.format === 'comma') {
                            finalVal = Math.round(item.target).toLocaleString('en-US');
                        } else {
                            finalVal = String(Math.round(item.target));
                        }
                        item.el.textContent = `${item.prefix}${finalVal}${item.suffix}`;
                    });
                }
            }

            requestAnimationFrame(tick);
        }

        if (reduceMotion || !('IntersectionObserver' in window)) {
            counters.forEach(el => {
                const target = parseFloat(el.getAttribute('data-target')) || 0;
                const prefix = el.getAttribute('data-prefix') || '';
                const suffix = el.getAttribute('data-suffix') || '';
                const format = el.getAttribute('data-format') || '';
                const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
                let finalVal = (decimals > 0) ? target.toFixed(decimals) : (format === 'comma' ? Math.round(target).toLocaleString('en-US') : String(Math.round(target)));
                el.textContent = `${prefix}${finalVal}${suffix}`;
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    runCountUp();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '50px 0px' });

        observer.observe(statsBar);
    }

    // Scroll Entrance & Reveal Animate
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
        initStatsCounter();
        if (typeof window.applyTranslations === 'function') window.applyTranslations();
        handleLegacyHash();
    });
})();
