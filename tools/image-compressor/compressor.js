/**
 * GToolix — Image Compressor & Converter Engine (Pro Max Live Studio Edition)
 * 100% Client-side image compression, conversion, resizing, and live interactive preview.
 * Zero server dependencies.
 */

(function () {
    'use strict';

    const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

    const state = {
        queue: [],
        activePreviewId: null,
        previewMode: 'split', // 'split' | 'side' | 'result'
        splitPosition: 50,    // 0 to 100%
        isDraggingSplit: false,
        previewDebounceTimer: null,
        batchDebounceTimer: null,
        options: {
            format: 'original',
            quality: 0.80,
            resizeEnabled: false,
            maxWidth: 1920,
            maxHeight: 1080,
            lockAspectRatio: true
        }
    };

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function getTargetExtension(mimeType) {
        switch (mimeType) {
            case 'image/jpeg': return 'jpg';
            case 'image/png': return 'png';
            case 'image/webp': return 'webp';
            case 'image/gif': return 'gif';
            default: return 'jpg';
        }
    }

    function getOutputFilename(originalName, targetMime) {
        const lastDot = originalName.lastIndexOf('.');
        const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
        const ext = getTargetExtension(targetMime);
        return `${baseName}-compressed.${ext}`;
    }

    function getCurrentLang() {
        if (window.currentLang) return window.currentLang;
        const p = window.location.pathname || '';
        if (p.indexOf('/en/') === 0 || p === '/en') return 'en';
        return document.documentElement.lang || 'ar';
    }

    function t(key, fallback) {
        const lang = getCurrentLang();
        if (window.translations && window.translations[lang]) {
            const keys = key.split('.');
            let val = window.translations[lang];
            for (let k of keys) {
                if (val && typeof val === 'object' && k in val) {
                    val = val[k];
                } else {
                    val = null;
                    break;
                }
            }
            if (val) return val;
        }
        return fallback || key;
    }

    const ImageCompressor = {
        init() {
            this.bindEvents();
            this.bindSplitEvents();
            this.updateControlsUI();
        },

        bindEvents() {
            const dropzone = document.getElementById('compressorDropzone');
            const fileInput = document.getElementById('compressorFileInput');
            const browseBtn = document.getElementById('compressorBrowseBtn');

            if (dropzone && fileInput) {
                dropzone.addEventListener('click', (e) => {
                    if (e.target !== fileInput && !e.target.closest('button')) {
                        fileInput.click();
                    }
                });

                if (browseBtn) {
                    browseBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        fileInput.click();
                    });
                }

                fileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        this.handleFiles(Array.from(e.target.files));
                        fileInput.value = '';
                    }
                });

                ['dragenter', 'dragover'].forEach(eventName => {
                    dropzone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dropzone.classList.add('is-dragover');
                    });
                });

                ['dragleave', 'drop'].forEach(eventName => {
                    dropzone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dropzone.classList.remove('is-dragover');
                    });
                });

                dropzone.addEventListener('drop', (e) => {
                    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        this.handleFiles(Array.from(e.dataTransfer.files));
                    }
                });
            }

            // Format Selector
            const formatSelect = document.getElementById('compressorFormat');
            if (formatSelect) {
                formatSelect.addEventListener('change', (e) => {
                    state.options.format = e.target.value;
                    this.updateControlsUI();
                    this.triggerLivePreviewUpdate();
                    this.debouncedRecompressAll();
                });
            }

            // Quality Slider
            const qualitySlider = document.getElementById('compressorQuality');
            const qualityVal = document.getElementById('compressorQualityVal');
            if (qualitySlider) {
                qualitySlider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value, 10);
                    state.options.quality = val / 100;
                    if (qualityVal) qualityVal.textContent = `${val}%`;
                    this.triggerLivePreviewUpdate();
                });
                qualitySlider.addEventListener('change', () => {
                    this.debouncedRecompressAll();
                });
            }

            // Resize toggle and inputs
            const resizeToggle = document.getElementById('compressorResizeToggle');
            const resizeInputs = document.getElementById('compressorResizeInputs');
            if (resizeToggle && resizeInputs) {
                resizeToggle.addEventListener('change', (e) => {
                    state.options.resizeEnabled = e.target.checked;
                    resizeInputs.style.display = e.target.checked ? 'flex' : 'none';
                    this.triggerLivePreviewUpdate();
                    this.debouncedRecompressAll();
                });
            }

            const maxWidthInput = document.getElementById('compressorMaxWidth');
            const maxHeightInput = document.getElementById('compressorMaxHeight');
            if (maxWidthInput && maxHeightInput) {
                ['input', 'change'].forEach(ev => {
                    maxWidthInput.addEventListener(ev, (e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val > 0) {
                            state.options.maxWidth = val;
                            this.triggerLivePreviewUpdate();
                            if (ev === 'change') this.debouncedRecompressAll();
                        }
                    });
                    maxHeightInput.addEventListener(ev, (e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val > 0) {
                            state.options.maxHeight = val;
                            this.triggerLivePreviewUpdate();
                            if (ev === 'change') this.debouncedRecompressAll();
                        }
                    });
                });
            }

            // Preview Mode Switch Buttons
            const modeButtons = document.querySelectorAll('.preview-mode-btn');
            modeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.getAttribute('data-mode');
                    this.setPreviewMode(mode);
                });
            });

            // Quick download active image
            const quickDownloadBtn = document.getElementById('previewQuickDownloadBtn');
            if (quickDownloadBtn) {
                quickDownloadBtn.addEventListener('click', () => {
                    if (state.activePreviewId) {
                        this.downloadSingle(state.activePreviewId);
                    }
                });
            }

            // Summary action buttons
            const downloadAllBtn = document.getElementById('compressorDownloadAllBtn');
            if (downloadAllBtn) {
                downloadAllBtn.addEventListener('click', () => this.downloadAllZip());
            }

            const clearAllBtn = document.getElementById('compressorClearAllBtn');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', () => this.clearAll());
            }
        },

        bindSplitEvents() {
            const splitStage = document.getElementById('previewSplitStage');
            const handle = document.getElementById('previewSplitHandle');

            if (!splitStage || !handle) return;

            const onPointerMove = (e) => {
                if (!state.isDraggingSplit) return;
                const rect = splitStage.getBoundingClientRect();
                if (rect.width === 0) return;

                const clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
                const isRtl = document.documentElement.dir === 'rtl';
                let pos = ((clientX - rect.left) / rect.width) * 100;
                pos = Math.max(2, Math.min(98, pos));

                state.splitPosition = pos;
                this.updateSplitViewVisuals();
            };

            const onPointerUp = () => {
                if (state.isDraggingSplit) {
                    state.isDraggingSplit = false;
                    document.removeEventListener('mousemove', onPointerMove);
                    document.removeEventListener('mouseup', onPointerUp);
                    document.removeEventListener('touchmove', onPointerMove);
                    document.removeEventListener('touchend', onPointerUp);
                }
            };

            const onPointerDown = (e) => {
                state.isDraggingSplit = true;
                onPointerMove(e);
                document.addEventListener('mousemove', onPointerMove);
                document.addEventListener('mouseup', onPointerUp);
                document.addEventListener('touchmove', onPointerMove, { passive: false });
                document.addEventListener('touchend', onPointerUp);
            };

            handle.addEventListener('mousedown', onPointerDown);
            handle.addEventListener('touchstart', onPointerDown, { passive: false });
            splitStage.addEventListener('mousedown', (e) => {
                if (e.target.closest('.preview-layer-label')) return;
                onPointerDown(e);
            });
            splitStage.addEventListener('touchstart', (e) => {
                if (e.target.closest('.preview-layer-label')) return;
                onPointerDown(e);
            }, { passive: false });
        },

        updateSplitViewVisuals() {
            const handle = document.getElementById('previewSplitHandle');
            const compressedLayer = document.getElementById('previewCompressedLayer');
            if (!handle || !compressedLayer) return;

            const pos = state.splitPosition;
            const isRtl = document.documentElement.dir === 'rtl';

            handle.style.left = `${pos}%`;
            if (isRtl) {
                compressedLayer.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
            } else {
                compressedLayer.style.clipPath = `inset(0 0 0 ${pos}%)`;
            }
        },

        setPreviewMode(mode) {
            state.previewMode = mode;
            document.querySelectorAll('.preview-mode-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
            });

            const splitStage = document.getElementById('previewSplitStage');
            const sideStage = document.getElementById('previewSideStage');
            const resultStage = document.getElementById('previewResultStage');

            if (splitStage) splitStage.style.display = mode === 'split' ? 'flex' : 'none';
            if (sideStage) sideStage.style.display = mode === 'side' ? 'grid' : 'none';
            if (resultStage) resultStage.style.display = mode === 'result' ? 'flex' : 'none';

            if (mode === 'split') {
                this.updateSplitViewVisuals();
            }
        },

        updateControlsUI() {
            const format = state.options.format;
            const pngNotice = document.getElementById('compressorPngNotice');
            if (pngNotice) {
                pngNotice.style.display = format === 'image/png' ? 'block' : 'none';
            }
        },

        handleFiles(files) {
            const validFiles = files.filter(file => {
                if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) {
                    this.addErrorItem(file.name, t('compressor.unsupportedFormat', 'صيغة غير مدعومة'));
                    return false;
                }
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    this.addErrorItem(file.name, t('compressor.fileTooLarge', 'الملف يتجاوز 25 ميجابايت'));
                    return false;
                }
                return true;
            });

            if (validFiles.length === 0) return;

            let firstNewId = null;

            validFiles.forEach(file => {
                const item = {
                    id: 'img_' + Math.random().toString(36).substring(2, 11),
                    file: file,
                    name: file.name,
                    originalSize: file.size,
                    originalType: file.type || 'image/jpeg',
                    originalUrl: URL.createObjectURL(file),
                    originalWidth: 0,
                    originalHeight: 0,
                    status: 'processing',
                    compressedBlob: null,
                    compressedSize: 0,
                    compressedUrl: null,
                    compressedWidth: 0,
                    compressedHeight: 0,
                    savingsPercent: 0,
                    error: null
                };

                if (!firstNewId) firstNewId = item.id;
                state.queue.push(item);
                this.renderCard(item);
                this.compressItem(item, () => {
                    if (state.activePreviewId === item.id) {
                        this.renderLivePreviewStage(item);
                    }
                });
            });

            // If no active preview or only 1 item, activate it
            if (!state.activePreviewId || state.queue.length === 1) {
                this.setActivePreview(firstNewId || state.queue[0].id);
            }

            this.updateSummaryUI();
            this.updateThumbnailStrip();
        },

        setActivePreview(id) {
            const item = state.queue.find(i => i.id === id);
            if (!item) return;

            state.activePreviewId = id;
            this.renderLivePreviewStage(item);
            this.updateThumbnailStrip();
            this.highlightActiveCard(id);
        },

        highlightActiveCard(id) {
            document.querySelectorAll('.compressor-card').forEach(card => {
                card.classList.toggle('is-preview-active', card.id === `card_${id}`);
            });
        },

        updateThumbnailStrip() {
            const strip = document.getElementById('previewThumbStrip');
            if (!strip) return;

            const validItems = state.queue.filter(i => i.status !== 'error' && i.originalUrl);
            if (validItems.length <= 1) {
                strip.style.display = 'none';
                strip.innerHTML = '';
                return;
            }

            strip.style.display = 'flex';
            strip.innerHTML = validItems.map(item => `
                <img src="${item.originalUrl}" 
                     class="preview-strip-item ${item.id === state.activePreviewId ? 'active' : ''}" 
                     alt="${this.escape(item.name)}" 
                     title="${this.escape(item.name)}"
                     onclick="ImageCompressor.setActivePreview('${item.id}')">
            `).join('');
        },

        triggerLivePreviewUpdate() {
            if (!state.activePreviewId) return;
            const item = state.queue.find(i => i.id === state.activePreviewId);
            if (!item || !item.file) return;

            if (state.previewDebounceTimer) clearTimeout(state.previewDebounceTimer);
            state.previewDebounceTimer = setTimeout(() => {
                this.compressItem(item, () => {
                    this.renderLivePreviewStage(item);
                    this.updateCard(item);
                    this.updateSummaryUI();
                });
            }, 30);
        },

        debouncedRecompressAll() {
            if (state.batchDebounceTimer) clearTimeout(state.batchDebounceTimer);
            state.batchDebounceTimer = setTimeout(() => {
                this.recompressAll();
            }, 250);
        },

        renderLivePreviewStage(item) {
            const previewStage = document.getElementById('compressorPreviewStage');
            if (!previewStage) return;

            if (!item || item.status === 'error') {
                previewStage.style.display = 'none';
                return;
            }

            previewStage.style.display = 'flex';

            // Filename
            const filenameEl = document.getElementById('previewActiveFilename');
            if (filenameEl) filenameEl.textContent = item.name;

            // Original Images
            const origSrc = item.originalUrl || '';
            const compSrc = item.compressedUrl || origSrc;

            const origImg = document.getElementById('previewOriginalImg');
            const compImg = document.getElementById('previewCompressedImg');
            const sideOrigImg = document.getElementById('previewSideOrigImg');
            const sideCompImg = document.getElementById('previewSideCompImg');
            const resultOnlyImg = document.getElementById('previewResultOnlyImg');

            if (origImg && origImg.src !== origSrc) origImg.src = origSrc;
            if (compImg) compImg.src = compSrc;
            if (sideOrigImg && sideOrigImg.src !== origSrc) sideOrigImg.src = origSrc;
            if (sideCompImg) sideCompImg.src = compSrc;
            if (resultOnlyImg) resultOnlyImg.src = compSrc;

            // Stats Cards
            const origSizeEl = document.getElementById('previewStatOrigSize');
            const origDimEl = document.getElementById('previewStatOrigDim');
            const compSizeEl = document.getElementById('previewStatCompSize');
            const compDimEl = document.getElementById('previewStatCompDim');
            const savingsEl = document.getElementById('previewStatSavings');
            const savedBytesEl = document.getElementById('previewStatSavedBytes');
            const sideOrigMeta = document.getElementById('previewSideOrigMeta');
            const sideCompMeta = document.getElementById('previewSideCompMeta');

            const origSizeFormatted = formatBytes(item.originalSize);
            const compSizeFormatted = formatBytes(item.compressedSize || item.originalSize);
            const origDimFormatted = item.originalWidth ? `${item.originalWidth} × ${item.originalHeight} px` : '-';
            const compDimFormatted = item.compressedWidth ? `${item.compressedWidth} × ${item.compressedHeight} px` : origDimFormatted;

            if (origSizeEl) origSizeEl.textContent = origSizeFormatted;
            if (origDimEl) origDimEl.textContent = origDimFormatted;
            if (compSizeEl) compSizeEl.textContent = compSizeFormatted;
            if (compDimEl) compDimEl.textContent = compDimFormatted;

            if (sideOrigMeta) sideOrigMeta.textContent = `${origSizeFormatted} (${origDimFormatted})`;
            if (sideCompMeta) sideCompMeta.textContent = `${compSizeFormatted} (${compDimFormatted})`;

            if (savingsEl && savedBytesEl) {
                const diff = item.originalSize - item.compressedSize;
                if (diff > 0 && item.savingsPercent > 0) {
                    savingsEl.textContent = `-${item.savingsPercent}% 🎉`;
                    savingsEl.className = 'stat-value text-emerald';
                    savedBytesEl.textContent = t('compressor.savedDiff', 'وفرت {size}').replace('{size}', formatBytes(diff));
                } else if (item.savingsPercent === 0) {
                    savingsEl.textContent = '0%';
                    savingsEl.className = 'stat-value';
                    savedBytesEl.textContent = t('compressor.sameSize', 'نفس الحجم');
                } else {
                    savingsEl.textContent = `+${Math.abs(item.savingsPercent)}%`;
                    savingsEl.className = 'stat-value text-blue';
                    savedBytesEl.textContent = t('compressor.largerSize', 'زاد الحجم قليلاً');
                }
            }

            this.updateSplitViewVisuals();
        },

        addErrorItem(fileName, errorMsg) {
            const item = {
                id: 'err_' + Math.random().toString(36).substring(2, 11),
                name: fileName,
                originalSize: 0,
                status: 'error',
                error: errorMsg
            };
            state.queue.push(item);
            this.renderCard(item);
            this.updateSummaryUI();
        },

        compressItem(item, callback) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        item.originalWidth = img.width;
                        item.originalHeight = img.height;

                        let targetW = img.width;
                        let targetH = img.height;

                        if (state.options.resizeEnabled) {
                            const maxW = state.options.maxWidth || 1920;
                            const maxH = state.options.maxHeight || 1080;
                            if (img.width > maxW || img.height > maxH) {
                                const scale = Math.min(maxW / img.width, maxH / img.height, 1);
                                targetW = Math.max(1, Math.round(img.width * scale));
                                targetH = Math.max(1, Math.round(img.height * scale));
                            }
                        }

                        item.compressedWidth = targetW;
                        item.compressedHeight = targetH;

                        const canvas = document.createElement('canvas');
                        canvas.width = targetW;
                        canvas.height = targetH;
                        const ctx = canvas.getContext('2d', { alpha: true });
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        // Target mime
                        let targetMime = state.options.format;
                        if (targetMime === 'original') {
                            targetMime = item.originalType;
                            if (!['image/jpeg', 'image/png', 'image/webp'].includes(targetMime)) {
                                targetMime = 'image/jpeg';
                            }
                        }

                        // Fill canvas white for transparent JPEG outputs
                        if (targetMime === 'image/jpeg') {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, targetW, targetH);
                        }

                        ctx.drawImage(img, 0, 0, targetW, targetH);

                        const quality = targetMime === 'image/png' ? 1.0 : state.options.quality;

                        canvas.toBlob((blob) => {
                            if (!blob) {
                                item.status = 'error';
                                item.error = t('compressor.canvasError', 'فشلت معالجة الصورة');
                                this.updateCard(item);
                                this.updateSummaryUI();
                                if (callback) callback(item);
                                return;
                            }

                            if (item.compressedUrl) {
                                URL.revokeObjectURL(item.compressedUrl);
                            }

                            item.compressedBlob = blob;
                            item.compressedSize = blob.size;
                            item.compressedUrl = URL.createObjectURL(blob);
                            item.targetMime = targetMime;
                            item.savingsPercent = Math.round(((item.originalSize - blob.size) / item.originalSize) * 100);
                            item.status = 'done';
                            item.error = null;

                            try {
                                if (window.GToolixMonitor && typeof window.GToolixMonitor.trackToolUsage === 'function') {
                                    window.GToolixMonitor.trackToolUsage('image-compressor', { action: 'compress', savings: item.savingsPercent, format: targetMime });
                                }
                            } catch (e) {}

                            this.updateCard(item);
                            this.updateSummaryUI();
                            if (callback) callback(item);
                        }, targetMime, quality);

                    } catch (err) {
                        console.error('[ImageCompressor] Error:', err);
                        item.status = 'error';
                        item.error = t('compressor.processingError', 'خطأ أثناء المعالجة');
                        this.updateCard(item);
                        this.updateSummaryUI();
                        if (callback) callback(item);
                    }
                };

                img.onerror = () => {
                    item.status = 'error';
                    item.error = t('compressor.invalidImage', 'صورة تالفة أو غير صالحة');
                    this.updateCard(item);
                    this.updateSummaryUI();
                    if (callback) callback(item);
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                item.status = 'error';
                item.error = t('compressor.readError', 'تعذر قراءة الملف');
                this.updateCard(item);
                this.updateSummaryUI();
                if (callback) callback(item);
            };

            reader.readAsDataURL(item.file);
        },

        recompressAll() {
            state.queue.forEach(item => {
                if (item.file && item.status !== 'error') {
                    item.status = 'processing';
                    this.updateCard(item);
                    this.compressItem(item, () => {
                        if (state.activePreviewId === item.id) {
                            this.renderLivePreviewStage(item);
                        }
                    });
                }
            });
        },

        renderCard(item) {
            const list = document.getElementById('compressorResultsList');
            const summaryBar = document.getElementById('compressorSummaryBar');
            if (!list) return;

            if (summaryBar) summaryBar.style.display = 'flex';

            const card = document.createElement('div');
            card.className = `compressor-card ${item.id === state.activePreviewId ? 'is-preview-active' : ''}`;
            card.id = `card_${item.id}`;
            card.innerHTML = this.getCardHTML(item);
            list.appendChild(card);
        },

        updateCard(item) {
            const card = document.getElementById(`card_${item.id}`);
            if (card) {
                card.className = `compressor-card ${item.id === state.activePreviewId ? 'is-preview-active' : ''}`;
                card.innerHTML = this.getCardHTML(item);
            }
        },

        getCardHTML(item) {
            if (item.status === 'error') {
                return `
                    <div class="compressor-card-left">
                        <div class="compressor-thumb" style="display:flex;align-items:center;justify-content:center;background:rgba(239,68,68,0.1);color:#EF4444;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                        <div class="compressor-info">
                            <span class="compressor-filename">${this.escape(item.name)}</span>
                            <span class="compressor-inline-error">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></line></svg>
                                ${this.escape(item.error)}
                            </span>
                        </div>
                    </div>
                    <div class="compressor-card-right">
                        <button type="button" class="compressor-btn-remove" onclick="ImageCompressor.removeItem('${item.id}')" aria-label="Remove item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            }

            if (item.status === 'processing') {
                return `
                    <div class="compressor-card-left" onclick="ImageCompressor.setActivePreview('${item.id}')" style="cursor:pointer;">
                        <div class="compressor-thumb" style="display:flex;align-items:center;justify-content:center;">
                            <div class="compressor-spinner"></div>
                        </div>
                        <div class="compressor-info">
                            <span class="compressor-filename">${this.escape(item.name)}</span>
                            <span class="compressor-metrics">${formatBytes(item.originalSize)} &bull; <em>${t('compressor.compressing', 'جاري الضغط...')}</em></span>
                        </div>
                    </div>
                    <div class="compressor-card-right">
                        <div class="compressor-spinner"></div>
                    </div>
                `;
            }

            const isSavings = item.savingsPercent > 0;
            const savingsBadge = isSavings
                ? `<span class="compressor-badge-savings">-${item.savingsPercent}%</span>`
                : (item.savingsPercent === 0 
                    ? `<span class="compressor-badge-savings">0%</span>` 
                    : `<span class="compressor-badge-increased">+${Math.abs(item.savingsPercent)}%</span>`);

            const thumbSrc = item.compressedUrl || item.originalUrl || '';

            return `
                <div class="compressor-card-left" onclick="ImageCompressor.setActivePreview('${item.id}')" style="cursor:pointer;">
                    <img src="${thumbSrc}" class="compressor-thumb" alt="${this.escape(item.name)}" loading="lazy">
                    <div class="compressor-info">
                        <span class="compressor-filename" title="${this.escape(item.name)}">${this.escape(item.name)}</span>
                        <div class="compressor-metrics">
                            <span class="compressor-size-old">${formatBytes(item.originalSize)}</span>
                            <span class="dir-arrow">&rarr;</span>
                            <span class="compressor-size-new">${formatBytes(item.compressedSize)}</span>
                            ${savingsBadge}
                        </div>
                    </div>
                </div>
                <div class="compressor-card-right">
                    <button type="button" class="compressor-btn-preview-tag" onclick="ImageCompressor.setActivePreview('${item.id}')" title="${t('compressor.previewLiveBadge', 'معاينة')}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"></circle><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path></svg>
                        <span>${t('compressor.previewBtn', 'معاينة')}</span>
                    </button>
                    <button type="button" class="compressor-btn-download-one" onclick="ImageCompressor.downloadSingle('${item.id}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>${t('compressor.downloadBtn', 'تنزيل')}</span>
                    </button>
                    <button type="button" class="compressor-btn-remove" onclick="ImageCompressor.removeItem('${item.id}')" aria-label="Remove item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;
        },

        updateSummaryUI() {
            const summaryBar = document.getElementById('compressorSummaryBar');
            const totalCountEl = document.getElementById('compressorTotalCount');
            const totalSavedEl = document.getElementById('compressorTotalSaved');
            const downloadAllBtn = document.getElementById('compressorDownloadAllBtn');

            if (!summaryBar) return;

            if (state.queue.length === 0) {
                summaryBar.style.display = 'none';
                const previewStage = document.getElementById('compressorPreviewStage');
                if (previewStage) previewStage.style.display = 'none';
                return;
            }

            summaryBar.style.display = 'flex';

            const doneItems = state.queue.filter(i => i.status === 'done');
            if (totalCountEl) totalCountEl.textContent = `${state.queue.length}`;

            let origTotal = 0;
            let compTotal = 0;
            doneItems.forEach(i => {
                origTotal += i.originalSize;
                compTotal += i.compressedSize;
            });

            if (totalSavedEl) {
                const diff = origTotal - compTotal;
                if (diff > 0) {
                    const pct = Math.round((diff / origTotal) * 100);
                    totalSavedEl.textContent = `${formatBytes(diff)} (${pct}%)`;
                    totalSavedEl.style.display = 'inline';
                } else {
                    totalSavedEl.style.display = 'none';
                }
            }

            if (downloadAllBtn) {
                downloadAllBtn.disabled = doneItems.length === 0;
                downloadAllBtn.style.opacity = doneItems.length === 0 ? '0.6' : '1';
            }
        },

        downloadSingle(id) {
            const item = state.queue.find(i => i.id === id);
            if (!item || !item.compressedBlob) return;

            try {
                if (window.GToolixMonitor && typeof window.GToolixMonitor.trackToolUsage === 'function') {
                    window.GToolixMonitor.trackToolUsage('image-compressor', { action: 'download_single' });
                }
            } catch (e) {}

            const filename = getOutputFilename(item.name, item.targetMime || 'image/jpeg');
            const a = document.createElement('a');
            a.href = item.compressedUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        async downloadAllZip() {
            const doneItems = state.queue.filter(i => i.status === 'done' && i.compressedBlob);
            if (doneItems.length === 0) return;

            try {
                if (window.GToolixMonitor && typeof window.GToolixMonitor.trackToolUsage === 'function') {
                    window.GToolixMonitor.trackToolUsage('image-compressor', { action: 'download_zip', count: doneItems.length });
                }
            } catch (e) {}

            if (doneItems.length === 1) {
                this.downloadSingle(doneItems[0].id);
                return;
            }

            if (typeof window.JSZip === 'undefined') {
                alert(t('compressor.zipLoading', 'جاري تحميل مكتبة الضغط، يرجى المحاولة بعد لحظات...'));
                return;
            }

            const downloadAllBtn = document.getElementById('compressorDownloadAllBtn');
            const originalText = downloadAllBtn ? downloadAllBtn.innerHTML : '';
            if (downloadAllBtn) {
                downloadAllBtn.disabled = true;
                downloadAllBtn.innerHTML = `
                    <div class="compressor-spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff;"></div>
                    <span>${t('compressor.generatingZip', 'جاري إنشاء الأرشيف...')}</span>
                `;
            }

            try {
                const zip = new window.JSZip();
                const nameCount = {};

                doneItems.forEach(item => {
                    let filename = getOutputFilename(item.name, item.targetMime || 'image/jpeg');
                    if (nameCount[filename]) {
                        nameCount[filename]++;
                        const dotIdx = filename.lastIndexOf('.');
                        const namePart = filename.substring(0, dotIdx);
                        const extPart = filename.substring(dotIdx);
                        filename = `${namePart}_${nameCount[filename]}${extPart}`;
                    } else {
                        nameCount[filename] = 1;
                    }
                    zip.file(filename, item.compressedBlob);
                });

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = zipUrl;
                a.download = 'gtoolix-compressed-images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setTimeout(() => URL.revokeObjectURL(zipUrl), 60000);
            } catch (err) {
                console.error('[ImageCompressor] Zip error:', err);
                alert(t('compressor.zipError', 'تعذر إنشاء ملف ZIP'));
            } finally {
                if (downloadAllBtn) {
                    downloadAllBtn.disabled = false;
                    downloadAllBtn.innerHTML = originalText;
                }
            }
        },

        removeItem(id) {
            const idx = state.queue.findIndex(i => i.id === id);
            if (idx !== -1) {
                const item = state.queue[idx];
                if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
                if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
                state.queue.splice(idx, 1);
                
                const card = document.getElementById(`card_${id}`);
                if (card) card.remove();

                if (state.activePreviewId === id) {
                    const nextItem = state.queue.find(i => i.status !== 'error') || state.queue[0];
                    if (nextItem) {
                        this.setActivePreview(nextItem.id);
                    } else {
                        state.activePreviewId = null;
                        const previewStage = document.getElementById('compressorPreviewStage');
                        if (previewStage) previewStage.style.display = 'none';
                    }
                }

                this.updateThumbnailStrip();
                this.updateSummaryUI();
            }
        },

        clearAll() {
            state.queue.forEach(item => {
                if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
                if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
            });
            state.queue = [];
            state.activePreviewId = null;

            const list = document.getElementById('compressorResultsList');
            if (list) list.innerHTML = '';

            const previewStage = document.getElementById('compressorPreviewStage');
            if (previewStage) previewStage.style.display = 'none';

            this.updateSummaryUI();
            this.updateThumbnailStrip();
        },

        escape(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }
    };

    window.ImageCompressor = ImageCompressor;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ImageCompressor.init());
    } else {
        ImageCompressor.init();
    }
})();
