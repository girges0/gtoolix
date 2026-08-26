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

    // 2. Language Detection — URL is the Absolute Source of Truth (SEO First)
    function getLanguageFromPath() {
        var path = window.location.pathname || '';
        if (path === '/en' || path.indexOf('/en/') === 0) {
            return 'en';
        }
        return 'ar';
    }

    var currentLang = getLanguageFromPath();

    window.getGToolixLanguage = function () {
        return currentLang;
    };

    // Synchronously enforce HTML attributes based exclusively on the active URL
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
})();
