// ===================================================================
// QR Code Generator Tool Controller (QRTool)
// Client-side instant rendering using standard qrcode.min.js library
// Real-time live preview, custom colors & sizes, PNG/SVG exports
// ===================================================================

var QRTool = (function () {
    let currentTab = 'url';
    let debounceTimer = null;
    let renderFrame = null;
    let currentPayload = '';
    let currentSvgString = '';

    const DEFAULTS = {
        size: 300,
        fgColor: '#000000',
        bgColor: '#ffffff',
        ecl: 'M'
    };

    function init() {
        bindEvents();
        render();
    }

    function bindEvents() {
        // Tab switching
        const tabs = document.querySelectorAll('#qr-tabs [role="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = tab.getAttribute('data-tab');
                switchTab(targetTab);
            });

            tab.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    const tabArray = Array.from(tabs);
                    const currentIndex = tabArray.indexOf(document.activeElement);
                    let nextIndex = e.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
                    if (document.documentElement.dir === 'rtl') {
                        nextIndex = e.key === 'ArrowRight' ? currentIndex - 1 : currentIndex + 1;
                    }
                    if (nextIndex >= tabArray.length) nextIndex = 0;
                    if (nextIndex < 0) nextIndex = tabArray.length - 1;
                    tabArray[nextIndex].focus();
                    tabArray[nextIndex].click();
                }
            });
        });

        // Input change listeners (debounced live preview)
        const inputs = document.querySelectorAll('#page-qr input, #page-qr textarea, #page-qr select');
        inputs.forEach(input => {
            input.addEventListener('input', scheduleRender);
            input.addEventListener('change', scheduleRender);

            // Auto-clear pre-filled default link when clicked or focused
            if (input.id === 'qr-input-url' || input.type === 'url' || input.type === 'text') {
                const autoClear = () => {
                    if (input.value === 'https://example.com' || input.getAttribute('data-auto-cleared') !== 'true') {
                        if (input.value === 'https://example.com') {
                            input.value = '';
                            scheduleRender();
                        }
                        input.setAttribute('data-auto-cleared', 'true');
                    }
                };
                input.addEventListener('focus', autoClear);
                input.addEventListener('click', autoClear);
            }
        });

        // Color picker & hex text synchronization
        syncColorPicker('qr-fg-color', 'qr-fg-hex');
        syncColorPicker('qr-bg-color', 'qr-bg-hex');

        // Buttons
        const downloadPngBtn = document.getElementById('qr-btn-png');
        if (downloadPngBtn) downloadPngBtn.addEventListener('click', downloadPNG);

        const downloadSvgBtn = document.getElementById('qr-btn-svg');
        if (downloadSvgBtn) downloadSvgBtn.addEventListener('click', downloadSVG);

        const copyBtn = document.getElementById('qr-btn-copy');
        if (copyBtn) copyBtn.addEventListener('click', copyPayload);

        const resetBtn = document.getElementById('qr-btn-reset');
        if (resetBtn) resetBtn.addEventListener('click', resetForm);
    }

    function syncColorPicker(pickerId, hexId) {
        const picker = document.getElementById(pickerId);
        const hex = document.getElementById(hexId);
        if (!picker || !hex) return;

        picker.addEventListener('input', () => {
            hex.value = picker.value.toUpperCase();
            scheduleRender();
        });

        hex.addEventListener('input', () => {
            const val = hex.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                picker.value = val;
                scheduleRender();
            }
        });
    }

    function switchTab(tabName) {
        currentTab = tabName;
        const tabs = document.querySelectorAll('#qr-tabs [role="tab"]');
        tabs.forEach(tab => {
            const isSelected = tab.getAttribute('data-tab') === tabName;
            tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            tab.classList.toggle('active', isSelected);
            if (isSelected) {
                tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });

        const panels = document.querySelectorAll('#qr-panels .qr-panel');
        panels.forEach(panel => {
            const isPanelActive = panel.id === `qr-panel-${tabName}`;
            panel.classList.toggle('active', isPanelActive);
            panel.hidden = !isPanelActive;
        });

        scheduleRender();
    }

    function scheduleRender() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (renderFrame) cancelAnimationFrame(renderFrame);
            renderFrame = requestAnimationFrame(render);
        }, 120);
    }

    function buildPayload() {
        switch (currentTab) {
            case 'url': {
                const rawUrl = (document.getElementById('qr-input-url')?.value || '').trim();
                if (!rawUrl) return { payload: '', error: 'enter_url' };
                let formatted = rawUrl;
                if (!/^https?:\/\//i.test(formatted) && !/^mailto:/i.test(formatted) && !/^tel:/i.test(formatted)) {
                    formatted = 'https://' + formatted;
                }
                return { payload: formatted, error: null };
            }
            case 'text': {
                const text = (document.getElementById('qr-input-text')?.value || '').trim();
                if (!text) return { payload: '', error: 'enter_text' };
                return { payload: text, error: null };
            }
            case 'phone': {
                const phone = (document.getElementById('qr-input-phone')?.value || '').trim();
                if (!phone) return { payload: '', error: 'enter_phone' };
                return { payload: `tel:${phone}`, error: null };
            }
            case 'email': {
                const mailTo = (document.getElementById('qr-input-email-to')?.value || '').trim();
                if (!mailTo) return { payload: '', error: 'enter_email' };
                const subject = (document.getElementById('qr-input-email-sub')?.value || '').trim();
                const body = (document.getElementById('qr-input-email-body')?.value || '').trim();
                const params = [];
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);
                const query = params.length > 0 ? `?${params.join('&')}` : '';
                return { payload: `mailto:${mailTo}${query}`, error: null };
            }
            case 'wifi': {
                const ssid = (document.getElementById('qr-input-wifi-ssid')?.value || '').trim();
                if (!ssid) return { payload: '', error: 'enter_ssid' };
                const pass = (document.getElementById('qr-input-wifi-pass')?.value || '').trim();
                const type = (document.getElementById('qr-input-wifi-type')?.value || 'WPA').trim();
                const hidden = document.getElementById('qr-input-wifi-hidden')?.checked ? 'true' : 'false';
                // Escape special characters in WPA SSID/password according to Wi-Fi QR spec
                const escapeWifi = s => s.replace(/([\\;:,"])/g, '\\$1');
                return {
                    payload: `WIFI:S:${escapeWifi(ssid)};T:${type};P:${escapeWifi(pass)};H:${hidden};;`,
                    error: null
                };
            }
            case 'sms': {
                const phone = (document.getElementById('qr-input-sms-phone')?.value || '').trim();
                if (!phone) return { payload: '', error: 'enter_phone' };
                const msg = (document.getElementById('qr-input-sms-msg')?.value || '').trim();
                return { payload: `smsto:${phone}:${msg}`, error: null };
            }
            case 'vcard': {
                const name = (document.getElementById('qr-input-vcard-name')?.value || '').trim();
                if (!name) return { payload: '', error: 'enter_name' };
                const phone = (document.getElementById('qr-input-vcard-phone')?.value || '').trim();
                const email = (document.getElementById('qr-input-vcard-email')?.value || '').trim();
                const org = (document.getElementById('qr-input-vcard-org')?.value || '').trim();
                const url = (document.getElementById('qr-input-vcard-url')?.value || '').trim();
                
                let vcardStr = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nN:${name}`;
                if (org) vcardStr += `\nORG:${org}`;
                if (phone) vcardStr += `\nTEL;TYPE=CELL:${phone}`;
                if (email) vcardStr += `\nEMAIL:${email}`;
                if (url) vcardStr += `\nURL:${url}`;
                vcardStr += `\nEND:VCARD`;
                return { payload: vcardStr, error: null };
            }
            case 'geo': {
                const lat = (document.getElementById('qr-input-geo-lat')?.value || '').trim();
                const lng = (document.getElementById('qr-input-geo-lng')?.value || '').trim();
                if (!lat || !lng) return { payload: '', error: 'enter_geo' };
                return { payload: `https://maps.google.com/?q=${lat},${lng}`, error: null };
            }
            case 'social': {
                const url = (document.getElementById('qr-input-social-url')?.value || '').trim();
                if (!url) return { payload: '', error: 'enter_url' };
                let formatted = url;
                if (!/^https?:\/\//i.test(formatted)) formatted = 'https://' + formatted;
                return { payload: formatted, error: null };
            }
            default:
                return { payload: '', error: 'invalid' };
        }
    }

    function render() {
        const canvas = document.getElementById('qr-canvas');
        const container = document.getElementById('qr-canvas-wrapper');
        const errorEl = document.getElementById('qr-error-msg');
        if (!canvas || !container) return;

        const { payload, error } = buildPayload();
        currentPayload = payload;

        if (error || !payload) {
            canvas.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                const isAr = getLang() === 'ar';
                const errorMessages = {
                    enter_url: isAr ? 'يرجى أدخال رابط إلكتروني صحيح' : 'Please enter a valid URL',
                    enter_text: isAr ? 'يرجى أدخال نص لإنشاء كود QR' : 'Please enter text to generate a QR code',
                    enter_phone: isAr ? 'يرجى أدخال رقم الهاتف' : 'Please enter a phone number',
                    enter_email: isAr ? 'يرجى أدخال البريد الإلكتروني' : 'Please enter an email address',
                    enter_ssid: isAr ? 'يرجى أدخال اسم شبكة الواي فاي (SSID)' : 'Please enter the Wi-Fi network name (SSID)',
                    enter_name: isAr ? 'يرجى أدخال الاسم الكامل للبطاقة' : 'Please enter contact full name',
                    enter_geo: isAr ? 'يرجى أدخال خطوط الطول والعرض' : 'Please enter latitude and longitude',
                    invalid: isAr ? 'يرجى إكمال البيانات المطلوب إدخالها' : 'Please complete the required fields'
                };
                errorEl.textContent = errorMessages[error] || errorMessages.invalid;
            }
            toggleButtons(false);
            return;
        }

        if (errorEl) errorEl.style.display = 'none';
        canvas.style.display = 'block';

        const size = parseInt(document.getElementById('qr-size-select')?.value || DEFAULTS.size, 10);
        const fgColor = document.getElementById('qr-fg-color')?.value || DEFAULTS.fgColor;
        const bgColor = document.getElementById('qr-bg-color')?.value || DEFAULTS.bgColor;
        const ecl = document.getElementById('qr-ecl-select')?.value || DEFAULTS.ecl;

        // Check if QR generation library is loaded cleanly
        if (typeof qrcode === 'undefined') {
            canvas.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                const isAr = getLang() === 'ar';
                errorEl.textContent = isAr ? 'تعذر تحميل مكتبة توليد كود QR. يرجى تحديث الصفحة.' : 'Failed to load QR Code library. Please refresh the page.';
            }
            toggleButtons(false);
            return;
        }

        try {
            // Generate QR Code Matrix using standard qrcode.min.js library
            const qr = qrcode(0, ecl);
            qr.addData(payload);
            qr.make();

            const moduleCount = qr.getModuleCount();
            const margin = 2; // grid modules
            const totalModules = moduleCount + margin * 2;
            const cellSize = Math.floor(size / totalModules) || 4;
            const actualSize = cellSize * totalModules;

            // Set canvas dimensions
            const dpr = window.devicePixelRatio || 1;
            canvas.width = actualSize * dpr;
            canvas.height = actualSize * dpr;
            canvas.style.width = `${actualSize}px`;
            canvas.style.height = `${actualSize}px`;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            // Draw Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, actualSize, actualSize);

            // Draw Foreground Modules
            ctx.fillStyle = fgColor;
            for (let r = 0; r < moduleCount; r++) {
                for (let c = 0; c < moduleCount; c++) {
                    if (qr.isDark(r, c)) {
                        const x = (c + margin) * cellSize;
                        const y = (r + margin) * cellSize;
                        ctx.fillRect(x, y, cellSize, cellSize);
                    }
                }
            }

            // Also generate SVG string for SVG download option
            currentSvgString = qr.createSvgTag(cellSize, margin * cellSize, fgColor, bgColor);

            toggleButtons(true);
        } catch (err) {
            console.error('QR Generation Error:', err);
            canvas.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                const isAr = getLang() === 'ar';
                errorEl.textContent = isAr ? 'النص المُدخل طويل جدًا بالنسبة لمستوى تصحيح الخطأ الحالي' : 'Text is too long for selected error correction level';
            }
            toggleButtons(false);
        }
    }

    function toggleButtons(enabled) {
        ['qr-btn-png', 'qr-btn-svg', 'qr-btn-copy'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = !enabled;
        });
    }

    function downloadPNG() {
        const canvas = document.getElementById('qr-canvas');
        if (!canvas || !currentPayload) return;
        const link = document.createElement('a');
        link.download = `qrcode_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(getLang() === 'ar' ? 'تم تنزيل صورة PNG بنجاح!' : 'PNG downloaded successfully!');
    }

    function downloadSVG() {
        if (!currentSvgString) return;
        const blob = new Blob([currentSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `qrcode_${Date.now()}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(getLang() === 'ar' ? 'تم تنزيل ملف SVG بنجاح!' : 'SVG downloaded successfully!');
    }

    function copyPayload() {
        if (!currentPayload) return;
        navigator.clipboard.writeText(currentPayload).then(() => {
            showToast(getLang() === 'ar' ? 'تم نسخ المحتوى بنجاح!' : 'Content copied to clipboard!');
        }).catch(() => {
            showToast(getLang() === 'ar' ? 'تعذّر النسخ تلقائيًا' : 'Failed to copy');
        });
    }

    function resetForm() {
        // Clear all inputs
        document.querySelectorAll('#page-qr input[type="text"], #page-qr input[type="url"], #page-qr input[type="tel"], #page-qr input[type="email"], #page-qr textarea').forEach(el => {
            el.value = '';
        });

        const hidden = document.getElementById('qr-input-wifi-hidden');
        if (hidden) hidden.checked = false;

        const size = document.getElementById('qr-size-select');
        if (size) size.value = DEFAULTS.size;

        const fgPicker = document.getElementById('qr-fg-color');
        const fgHex = document.getElementById('qr-fg-hex');
        if (fgPicker && fgHex) { fgPicker.value = DEFAULTS.fgColor; fgHex.value = DEFAULTS.fgColor.toUpperCase(); }

        const bgPicker = document.getElementById('qr-bg-color');
        const bgHex = document.getElementById('qr-bg-hex');
        if (bgPicker && bgHex) { bgPicker.value = DEFAULTS.bgColor; bgHex.value = DEFAULTS.bgColor.toUpperCase(); }

        const ecl = document.getElementById('qr-ecl-select');
        if (ecl) ecl.value = DEFAULTS.ecl;

        switchTab('url');
        showToast(getLang() === 'ar' ? 'تم إعادة تعيين النموذج' : 'Form reset to default');
    }

    function getLang() {
        const docLang = document.documentElement.getAttribute('lang') || document.documentElement.lang;
        if (docLang === 'ar' || docLang === 'en') return docLang;
        return (typeof window.getGToolixLanguage === 'function') ? window.getGToolixLanguage() : (localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang') || 'ar');
    }

    function showToast(msg) {
        let toast = document.getElementById('qr-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'qr-toast';
            toast.className = 'qr-toast';
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function scrollTabs(amount) {
        const tabsContainer = document.getElementById('qr-tabs');
        if (!tabsContainer) return;
        const isRtl = document.documentElement.dir === 'rtl';
        tabsContainer.scrollBy({ left: isRtl ? -amount : amount, behavior: 'smooth' });
    }

    return {
        init,
        render: scheduleRender,
        switchTab,
        scrollTabs
    };
})();

function autoInitQR() {
    if (document.getElementById('page-qr') || document.getElementById('qr-tabs') || document.getElementById('qr-input')) {
        QRTool.init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitQR);
} else {
    autoInitQR();
}
