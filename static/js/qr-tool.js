// ===================================================================
// QR Code Generator Tool Controller (QRTool)
// Client-side instant rendering using standard qrcode.min.js library
// Real-time live preview, custom colors & sizes, PNG/SVG exports
// Center Logo / Image support (Presets & Custom Upload)
// ===================================================================

var QRTool = (function () {
    let currentTab = 'url';
    let debounceTimer = null;
    let renderFrame = null;
    let currentPayload = '';
    let currentSvgString = '';
    let activeLogo = null; // { dataUrl, imgObj, name, isCustom }

    const DEFAULTS = {
        size: 300,
        fgColor: '#000000',
        bgColor: '#ffffff',
        ecl: 'M'
    };

    const PRESET_LOGOS = {
        gtoolix: {
            name: 'GToolix Logo',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="22" fill="#0B132B"/><path d="M50 22C34.54 22 22 34.54 22 50s12.54 28 28 28c14.2 0 25.88-10.56 27.69-24.22H50V43.78h38.22C88.75 45.81 89 47.88 89 50c0 21.54-17.46 39-39 39C28.46 89 11 71.54 11 50S28.46 11 50 11c10.77 0 20.52 4.37 27.58 11.42l-7.78 7.78C64.93 25.33 57.88 22 50 22z" fill="#2563EB"/><circle cx="78" cy="22" r="8" fill="#38BDF8"/></svg>'
        },
        globe: {
            name: 'Website Icon',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
        },
        whatsapp: {
            name: 'WhatsApp',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.04 0C5.46 0 .11 5.35.11 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.88 11.88 0 0 0 5.74 1.47h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.18-3.46-8.41zm-8.48 18.33h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.65-.23-.37a9.86 9.86 0 0 1-1.52-5.25c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.9a9.84 9.84 0 0 1 2.91 7c0 5.46-4.45 9.91-9.93 9.91zm5.44-7.43c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"/></svg>'
        },
        instagram: {
            name: 'Instagram',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'
        },
        telegram: {
            name: 'Telegram',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0088cc"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.39c-.16.16-.3.3-.61.3l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.95-.92c-.64-.2-.65-.64.13-.95l11.55-4.45c.53-.2 1 .13.86.93z"/></svg>'
        },
        wifi: {
            name: 'Wi-Fi',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>'
        },
        user: {
            name: 'Contact vCard',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        },
        phone: {
            name: 'Phone Call',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
        },
        mail: {
            name: 'Email',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
        }
    };

    function init() {
        bindEvents();
        bindLogoEvents();
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

    function bindLogoEvents() {
        const dropzone = document.getElementById('qr-logo-dropzone');
        const fileInput = document.getElementById('qr-logo-input');
        const removeBtn = document.getElementById('qr-logo-remove');
        const logoSizeSelect = document.getElementById('qr-logo-size-select');
        const logoShapeSelect = document.getElementById('qr-logo-shape-select');

        // Preset buttons
        document.querySelectorAll('.qr-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.getAttribute('data-preset');
                document.querySelectorAll('.qr-preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (preset === 'none') {
                    setLogo(null);
                } else if (PRESET_LOGOS[preset]) {
                    const p = PRESET_LOGOS[preset];
                    const url = p.url || ('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(p.svg));
                    setLogo(url, p.name, false);
                }
            });
        });

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', (e) => {
                if (e.target.closest('#qr-logo-remove')) return;
                fileInput.click();
            });

            dropzone.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    if (e.target.closest('#qr-logo-remove')) return;
                    e.preventDefault();
                    fileInput.click();
                }
            });

            fileInput.addEventListener('change', () => {
                if (fileInput.files && fileInput.files[0]) {
                    handleLogoFile(fileInput.files[0]);
                }
            });

            // Drag & Drop support
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleLogoFile(e.dataTransfer.files[0]);
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                setLogo(null);
                if (fileInput) fileInput.value = '';
                document.querySelectorAll('.qr-preset-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.qr-preset-btn[data-preset="none"]')?.classList.add('active');
                showToast(getLang() === 'ar' ? 'تمت إزالة الصورة بنجاح' : 'Image removed');
            });
        }

        if (logoSizeSelect) logoSizeSelect.addEventListener('change', scheduleRender);
        if (logoShapeSelect) logoShapeSelect.addEventListener('change', scheduleRender);
    }

    function handleLogoFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showToast(getLang() === 'ar' ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WebP, SVG)' : 'Please select a valid image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast(getLang() === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image size is too large (max 5MB)');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setLogo(ev.target.result, file.name, true);
            document.querySelectorAll('.qr-preset-btn').forEach(b => b.classList.remove('active'));
        };
        reader.readAsDataURL(file);
    }

    function setLogo(dataUrl, name, isCustom = false) {
        if (!dataUrl) {
            activeLogo = null;
            updateLogoUI(null);
            scheduleRender();
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            activeLogo = {
                dataUrl: dataUrl,
                imgObj: img,
                name: name || 'logo.png',
                isCustom: isCustom
            };
            updateLogoUI(activeLogo);

            // Auto-upgrade Error Correction to High (30%) or Quartile (25%) when logo is active
            const eclSelect = document.getElementById('qr-ecl-select');
            if (eclSelect && (eclSelect.value === 'L' || eclSelect.value === 'M')) {
                eclSelect.value = 'H';
            }

            scheduleRender();
        };
        img.onerror = () => {
            showToast(getLang() === 'ar' ? 'تعذر قراءة ملف الصورة' : 'Failed to load logo image');
        };
        img.src = dataUrl;
    }

    function updateLogoUI(logo) {
        const badge = document.getElementById('qr-logo-badge');
        const emptyState = document.getElementById('qr-logo-empty-state');
        const activeState = document.getElementById('qr-logo-active-state');
        const previewImg = document.getElementById('qr-logo-preview-img');
        const nameEl = document.getElementById('qr-logo-name');
        const sizeEl = document.getElementById('qr-logo-size');
        const settings = document.getElementById('qr-logo-settings');

        if (logo) {
            if (badge) badge.style.display = 'inline-flex';
            if (emptyState) emptyState.style.display = 'none';
            if (activeState) activeState.style.display = 'flex';
            if (previewImg) previewImg.src = logo.dataUrl;
            if (nameEl) nameEl.textContent = logo.name;
            if (sizeEl) sizeEl.textContent = getLang() === 'ar' ? 'نشط في منتصف الكود' : 'Active in QR center';
            if (settings) settings.style.display = 'block';
        } else {
            if (badge) badge.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            if (activeState) activeState.style.display = 'none';
            if (settings) settings.style.display = 'none';
        }
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
        }, 80);
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
        let ecl = document.getElementById('qr-ecl-select')?.value || DEFAULTS.ecl;

        // If logo is active, enforce at least Q (25%) or H (30%)
        if (activeLogo && (ecl === 'L' || ecl === 'M')) {
            ecl = 'H';
        }

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

            const logoRatio = parseFloat(document.getElementById('qr-logo-size-select')?.value || '0.23');
            const logoShape = document.getElementById('qr-logo-shape-select')?.value || 'rounded';

            // Draw Logo in center if active
            if (activeLogo && activeLogo.imgObj) {
                const logoBoxSize = actualSize * logoRatio;
                const pad = Math.max(3, Math.round(logoBoxSize * 0.12));
                const innerLogoSize = logoBoxSize - pad * 2;
                const centerX = (actualSize - logoBoxSize) / 2;
                const centerY = (actualSize - logoBoxSize) / 2;

                // 1. Draw Background Pad with subtle shadow
                ctx.save();
                ctx.fillStyle = bgColor;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;

                if (logoShape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(actualSize / 2, actualSize / 2, logoBoxSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (logoShape === 'rounded') {
                    const radius = Math.round(logoBoxSize * 0.22);
                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(centerX, centerY, logoBoxSize, logoBoxSize, radius);
                    } else {
                        // Fallback round rect
                        ctx.rect(centerX, centerY, logoBoxSize, logoBoxSize);
                    }
                    ctx.fill();
                } else {
                    ctx.fillRect(centerX, centerY, logoBoxSize, logoBoxSize);
                }
                ctx.restore();

                // 2. Draw border stroke around pad
                ctx.save();
                ctx.strokeStyle = fgColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 1;
                if (logoShape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(actualSize / 2, actualSize / 2, logoBoxSize / 2, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (logoShape === 'rounded') {
                    const radius = Math.round(logoBoxSize * 0.22);
                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(centerX, centerY, logoBoxSize, logoBoxSize, radius);
                    } else {
                        ctx.rect(centerX, centerY, logoBoxSize, logoBoxSize);
                    }
                    ctx.stroke();
                } else {
                    ctx.strokeRect(centerX, centerY, logoBoxSize, logoBoxSize);
                }
                ctx.restore();

                // 3. Draw Logo Image inside
                ctx.save();
                if (logoShape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(actualSize / 2, actualSize / 2, innerLogoSize / 2, 0, Math.PI * 2);
                    ctx.clip();
                } else if (logoShape === 'rounded') {
                    const innerRadius = Math.round(innerLogoSize * 0.18);
                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(centerX + pad, centerY + pad, innerLogoSize, innerLogoSize, innerRadius);
                    } else {
                        ctx.rect(centerX + pad, centerY + pad, innerLogoSize, innerLogoSize);
                    }
                    ctx.clip();
                }
                ctx.drawImage(activeLogo.imgObj, centerX + pad, centerY + pad, innerLogoSize, innerLogoSize);
                ctx.restore();
            }

            // Generate clean SVG string for vector download
            currentSvgString = generateSvgString(qr, actualSize, cellSize, margin, fgColor, bgColor, activeLogo, logoRatio, logoShape);

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

    function generateSvgString(qr, actualSize, cellSize, margin, fgColor, bgColor, logo, logoRatio, logoShape) {
        const moduleCount = qr.getModuleCount();
        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${actualSize} ${actualSize}" width="${actualSize}" height="${actualSize}">\n`;
        svg += `  <rect width="100%" height="100%" fill="${bgColor}"/>\n`;

        let pathData = '';
        for (let r = 0; r < moduleCount; r++) {
            for (let c = 0; c < moduleCount; c++) {
                if (qr.isDark(r, c)) {
                    const x = (c + margin) * cellSize;
                    const y = (r + margin) * cellSize;
                    pathData += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
                }
            }
        }
        svg += `  <path fill="${fgColor}" d="${pathData}"/>\n`;

        if (logo && logo.dataUrl) {
            const logoBoxSize = actualSize * logoRatio;
            const pad = Math.max(3, Math.round(logoBoxSize * 0.12));
            const innerLogoSize = logoBoxSize - pad * 2;
            const centerX = (actualSize - logoBoxSize) / 2;
            const centerY = (actualSize - logoBoxSize) / 2;

            if (logoShape === 'circle') {
                svg += `  <circle cx="${actualSize / 2}" cy="${actualSize / 2}" r="${logoBoxSize / 2}" fill="${bgColor}" stroke="${fgColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}" stroke-width="1"/>\n`;
                svg += `  <clipPath id="qr-logo-clip"><circle cx="${actualSize / 2}" cy="${actualSize / 2}" r="${innerLogoSize / 2}"/></clipPath>\n`;
                svg += `  <image href="${logo.dataUrl}" x="${centerX + pad}" y="${centerY + pad}" width="${innerLogoSize}" height="${innerLogoSize}" clip-path="url(#qr-logo-clip)" preserveAspectRatio="xMidYMid meet"/>\n`;
            } else if (logoShape === 'rounded') {
                const rad = Math.round(logoBoxSize * 0.22);
                svg += `  <rect x="${centerX}" y="${centerY}" width="${logoBoxSize}" height="${logoBoxSize}" rx="${rad}" fill="${bgColor}" stroke="${fgColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}" stroke-width="1"/>\n`;
                svg += `  <clipPath id="qr-logo-clip"><rect x="${centerX + pad}" y="${centerY + pad}" width="${innerLogoSize}" height="${innerLogoSize}" rx="${Math.round(innerLogoSize * 0.18)}"/></clipPath>\n`;
                svg += `  <image href="${logo.dataUrl}" x="${centerX + pad}" y="${centerY + pad}" width="${innerLogoSize}" height="${innerLogoSize}" clip-path="url(#qr-logo-clip)" preserveAspectRatio="xMidYMid meet"/>\n`;
            } else {
                svg += `  <rect x="${centerX}" y="${centerY}" width="${logoBoxSize}" height="${logoBoxSize}" fill="${bgColor}" stroke="${fgColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}" stroke-width="1"/>\n`;
                svg += `  <image href="${logo.dataUrl}" x="${centerX + pad}" y="${centerY + pad}" width="${innerLogoSize}" height="${innerLogoSize}" preserveAspectRatio="xMidYMid meet"/>\n`;
            }
        }

        svg += `</svg>`;
        return svg;
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
        try {
            if (window.GToolixMonitor && typeof window.GToolixMonitor.trackToolUsage === 'function') {
                window.GToolixMonitor.trackToolUsage('qr-code-generator', { action: 'download_png', tab: currentTab });
            }
        } catch (e) {}
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
        try {
            if (window.GToolixMonitor && typeof window.GToolixMonitor.trackToolUsage === 'function') {
                window.GToolixMonitor.trackToolUsage('qr-code-generator', { action: 'download_svg', tab: currentTab });
            }
        } catch (e) {}
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

        // Reset Logo
        setLogo(null);
        const fileInput = document.getElementById('qr-logo-input');
        if (fileInput) fileInput.value = '';

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
        scrollTabs,
        setLogo
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
