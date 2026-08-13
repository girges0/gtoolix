const assert = require('assert');

// Simulate getGToolixLanguage algorithm
function getGToolixLanguage(localStorageMock, navigatorMock) {
    try {
        const saved = localStorageMock.getItem('gtoolix_language') || localStorageMock.getItem('siteLang');
        if (saved === 'ar' || saved === 'en') return saved;
        const userLangs = (navigatorMock.languages && navigatorMock.languages.length) ? navigatorMock.languages : (navigatorMock.language ? [navigatorMock.language] : []);
        for (let i = 0; i < userLangs.length; i++) {
            const code = (userLangs[i] || '').toLowerCase();
            if (code.indexOf('ar') === 0) return 'ar';
            if (code.indexOf('en') === 0) return 'en';
        }
    } catch (e) { }
    return 'en';
}

console.log('Testing GToolix Language Detection Logic...');

// Test 1: gtoolix_language = 'ar'
assert.strictEqual(getGToolixLanguage({ getItem: k => k === 'gtoolix_language' ? 'ar' : null }, { languages: ['en-US'] }), 'ar');

// Test 2: gtoolix_language = 'en'
assert.strictEqual(getGToolixLanguage({ getItem: k => k === 'gtoolix_language' ? 'en' : null }, { languages: ['ar-EG'] }), 'en');

// Test 3: siteLang fallback = 'ar'
assert.strictEqual(getGToolixLanguage({ getItem: k => k === 'siteLang' ? 'ar' : null }, { languages: ['en-US'] }), 'ar');

// Test 4: siteLang fallback = 'en'
assert.strictEqual(getGToolixLanguage({ getItem: k => k === 'siteLang' ? 'en' : null }, { languages: ['ar-EG'] }), 'en');

// Test 5: Browser ar-EG
assert.strictEqual(getGToolixLanguage({ getItem: () => null }, { languages: ['ar-EG', 'en-US'] }), 'ar');

// Test 6: Browser en-US
assert.strictEqual(getGToolixLanguage({ getItem: () => null }, { languages: ['en-US', 'ar-EG'] }), 'en');

// Test 7: Browser fr-FR (unsupported locale) -> fallback to English
assert.strictEqual(getGToolixLanguage({ getItem: () => null }, { languages: ['fr-FR', 'de-DE'] }), 'en');

// Test 8: Browser es-ES with secondary ar-SA -> matches ar
assert.strictEqual(getGToolixLanguage({ getItem: () => null }, { languages: ['es-ES', 'ar-SA'] }), 'ar');

console.log('✅ ALL 8 LOCALIZATION TEST CASES PASSED SUCCESSFULLY!');
