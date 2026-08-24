/**
 * GToolix Device Language & Theme Detection Module
 * Auto-detects device language and system theme (Dark/Light)
 * Respects explicit user overrides from manual switchers
 * Runs synchronously in <head> to prevent FOUC & layout shifts
 */
(function () {
    'use strict';

    // 1. Device System Theme (Dark / Light) Auto-Detection
    try {
        var manualTheme = localStorage.getItem('theme_manual') === 'true';
        var savedTheme = localStorage.getItem('theme');
        var sysTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        var finalTheme = (manualTheme && (savedTheme === 'dark' || savedTheme === 'light')) ? savedTheme : sysTheme;
        document.documentElement.setAttribute('data-theme', finalTheme);
    } catch (e) { }

    // 2. Language Detection
    function getLanguageFromPath() {
        var path = window.location.pathname || '';
        if (path === '/en' || path.indexOf('/en/') === 0) {
            return 'en';
        }
        return 'ar';
    }

    function getDeviceLanguage() {
        try {
            var nav = window.navigator;
            var lang = (nav.languages && nav.languages.length) ? nav.languages[0] : (nav.language || nav.userLanguage || '');
            lang = (lang || '').toLowerCase();
            if (lang.startsWith('ar')) return 'ar';
            return 'en'; // Any non-Arabic device defaults to English
        } catch (e) {
            return 'ar';
        }
    }

    var pathLang = getLanguageFromPath();

    // Check if user has an explicit manual preference from language switcher
    var manualLang = false;
    var userPref = null;
    try {
        manualLang = localStorage.getItem('gtoolix_manual_lang') === 'true';
        userPref = localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang');
    } catch (e) { }

    var targetLang = (manualLang && (userPref === 'en' || userPref === 'ar'))
        ? userPref
        : getDeviceLanguage();

    var pathname = window.location.pathname || '/';
    var is404 = (pathname === '/404' || pathname === '/en/404' || pathname === '/404.html' || pathname === '/en/404.html');

    // Auto-redirect if mismatch between current path language and target device/preferred language
    if (!is404) {
        if (targetLang === 'en' && pathLang === 'ar') {
            var newPath = (pathname === '/' || pathname === '')
                ? '/en/'
                : ('/en' + (pathname.startsWith('/') ? pathname : '/' + pathname));
            window.location.replace(newPath + window.location.search + window.location.hash);
            return;
        } else if (targetLang === 'ar' && pathLang === 'en') {
            var newPath = pathname.replace(/^\/en(\/|$)/, '/');
            if (!newPath.startsWith('/')) newPath = '/' + newPath;
            window.location.replace(newPath + window.location.search + window.location.hash);
            return;
        }
    }

    window.getGToolixLanguage = function () {
        return getLanguageFromPath();
    };

    // Set HTML attributes based on active URL
    var currentLang = getLanguageFromPath();
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
})();
