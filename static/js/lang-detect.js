/**
 * GToolix Language Detection Module
 * Source of truth: URL Pathname (/en/* -> English, otherwise Arabic)
 * Zero localStorage overrides
 */
(function () {
    'use strict';

    function getLanguageFromPath() {
        var path = window.location.pathname || '';
        if (path === '/en' || path.indexOf('/en/') === 0) {
            return 'en';
        }
        return 'ar';
    }

    var currentLang = getLanguageFromPath();

    window.getGToolixLanguage = function () {
        return getLanguageFromPath();
    };

    // Immediately set HTML attributes based on URL
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

    var theme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
})();
