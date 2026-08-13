// ===================================================================
// Gemini Watermark Remover Tool Controller (GeminiWatermarkTool)
// Completely Self-Contained Client-Side Engine for GToolix
// Zero Runtime External Dependencies - 100% Private Local Processing
// ===================================================================

var GeminiWatermarkTool = (function () {
    // -----------------------------------------------------------------
    // Embedded Alpha Maps (Base64 Encoded Float32 Arrays)
    // Embedded locally to guarantee 0% dependency on external files
    // -----------------------------------------------------------------
    const EMBEDDED_ALPHA_MAPS = {
        '48': 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAODgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYaGgYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwgIAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBMnJxMEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACxktLRkLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGEiE1NSESBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQOGig8PCgaDgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgwWIjBERDAiFgwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCxQfKzlNTTkrHxQLAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQMFB4oNEJWVkI0KB4UDAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABg4WHygzP01ZWU0/MygfFg4GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQLEhoiKzQ/SllZWVlKPzQrIhoSCwQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDBMZISgwOUJNWVlZWVlZTUI5MCghGRMMBgAAAAAAAAAAAAAAAAAAAAAAAAIIDhMaICctNTxETVZZWVlZWVlZWVZNRDw1LScgGhMOCAIAAAAAAAAAAAAAAAAAAAIIDhMaICctNTxETVZZWVlZWVlZWVZNRDw1LScgGhMOCAIAAAAAAAAAAAAAAAAAAAAAAAAGDBMZISgwOUJNWVlZWVlZTUI5MCghGRMMBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQLEhoiKzQ/SllZWVlKPzQrIhoSCwQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABg4WHygzP01ZWU0/MygfFg4GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQMFB4oNEJWVkI0KB4UDAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCxQfKzlNTTkrHxQLAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgwWIjBERDAiFgwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQOGig8PCgaDgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGEiE1NSESBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACxktLRkLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBMnJxMEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwgIAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYaGgYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAODgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        '96': 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAODgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMREQMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYUFAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkXFwkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgwaGgwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQ8dHQ8FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACBIgIBIIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCxUjIxULAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDxgmJhgPBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMKEhwpKRwSCgMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYNFR8sLB8VDQYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwkQGCIwMCIYEAkDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEChAXHyk3NykfFxAKBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABg0UHCYzMyYcFA0GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwkQGCIwMCIYEAkDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYNFR8sLB8VDQYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMKEhwpKRwSCgMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDxgmJhgPBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCxUjIxULAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACBIgIBIIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQ8dHQ8FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgwaGgwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkXFwkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYUFAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMREQMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAODgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    };

    const ALPHA_MAP_LENGTHS = {
        '48': 48 * 48,
        '96': 96 * 96
    };

    // Cached decoded Float32Arrays
    const decodedMaps = {};

    // -----------------------------------------------------------------
    // Helper: Base64 to Float32Array Decoder
    // -----------------------------------------------------------------
    function getAlphaMap(sizeKey) {
        const key = String(sizeKey);
        if (decodedMaps[key]) return decodedMaps[key];
        const base64 = EMBEDDED_ALPHA_MAPS[key];
        if (!base64) return null;

        const binary = atob(base64);
        const targetLen = ALPHA_MAP_LENGTHS[key] || binary.length;
        const floatMap = new Float32Array(targetLen);
        const limit = Math.min(binary.length, targetLen);
        for (let i = 0; i < limit; i++) {
            floatMap[i] = binary.charCodeAt(i) / 255.0;
        }
        decodedMaps[key] = floatMap;
        return floatMap;
    }

    // -----------------------------------------------------------------
    // Bilinear Interpolation for arbitrary watermark sizes
    // -----------------------------------------------------------------
    function interpolateAlphaMap(srcMap, srcSize, targetSize) {
        if (srcSize === targetSize) return srcMap;
        const result = new Float32Array(targetSize * targetSize);
        const scale = (srcSize - 1) / Math.max(1, targetSize - 1);

        for (let r = 0; r < targetSize; r++) {
            const srcR = r * scale;
            const r0 = Math.floor(srcR);
            const r1 = Math.min(srcSize - 1, r0 + 1);
            const rf = srcR - r0;

            for (let c = 0; c < targetSize; c++) {
                const srcC = c * scale;
                const c0 = Math.floor(srcC);
                const c1 = Math.min(srcSize - 1, c0 + 1);
                const cf = srcC - c0;

                const v00 = srcMap[r0 * srcSize + c0];
                const v01 = srcMap[r0 * srcSize + c1];
                const v10 = srcMap[r1 * srcSize + c0];
                const v11 = srcMap[r1 * srcSize + c1];

                const top = v00 * (1 - cf) + v01 * cf;
                const bottom = v10 * (1 - cf) + v11 * cf;
                result[r * targetSize + c] = top * (1 - rf) + bottom * rf;
            }
        }
        return result;
    }

    // -----------------------------------------------------------------
    // State Management
    // -----------------------------------------------------------------
    let originalImage = null;       // Loaded Image object
    let originalCanvas = null;      // Canvas holding exact unscaled original RGBA
    let processedCanvas = null;     // Canvas holding processed result
    let isWatermarkDetected = false;
    let detectedConfig = {
        logoSize: 96,
        marginRight: 64,
        marginBottom: 64,
        detected: false,
        confidence: 0
    };

    // Fine-tuning state
    let userControls = {
        strength: 1.0,
        offsetX: 0,
        offsetY: 0,
        scale: 1.0
    };

    // Zoom & Pan & Comparison state
    let zoomLevel = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let initialPanX = 0;
    let initialPanY = 0;
    let pinchStartDist = 0;
    let initialPinchZoom = 1.0;
    let isSideBySide = false;
    let sliderPos = 50; // percentage
    let isDraggingSlider = false;

    // -----------------------------------------------------------------
    // Detection Algorithm
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // Detection Algorithm
    // -----------------------------------------------------------------
    function detectWatermark(imageData) {
        const { width, height } = imageData;
        const scale = Math.max(1.0, Math.min(width, height) / 1024.0);

        let defaultSize = Math.round(96 * scale);
        let defaultMargin = Math.round(64 * scale);

        let bestConfig = {
            logoSize: defaultSize,
            marginRight: defaultMargin,
            marginBottom: defaultMargin,
            detected: true,
            confidence: 85
        };

        const baseSizes = [48, 64, 96, 128, 160, 192];
        const baseMargins = [24, 32, 48, 64, 96, 128];

        const candidates = [];
        for (const s of baseSizes) {
            for (const m of baseMargins) {
                const logoSize = Math.round(s * scale);
                const margin = Math.round(m * scale);
                if (width - margin - logoSize >= 0 && height - margin - logoSize >= 0) {
                    candidates.push({ logoSize, marginRight: margin, marginBottom: margin });
                }
            }
        }

        let maxScore = -1;

        for (const cand of candidates) {
            const posX = width - cand.marginRight - cand.logoSize;
            const posY = height - cand.marginBottom - cand.logoSize;

            if (posX < 0 || posY < 0 || posX + cand.logoSize > width || posY + cand.logoSize > height) {
                continue;
            }

            const alphaMapSrc = getAlphaMap(cand.logoSize >= 96 ? '96' : '48');
            if (!alphaMapSrc) continue;

            const alphaMap = cand.logoSize === 96 ? alphaMapSrc : interpolateAlphaMap(getAlphaMap('96'), 96, cand.logoSize);

            // Compute luminance correlation
            let sumPixel = 0, sumAlpha = 0, count = 0;

            for (let r = 0; r < cand.logoSize; r += 2) {
                for (let c = 0; c < cand.logoSize; c += 2) {
                    const imgIdx = ((posY + r) * width + (posX + c)) * 4;
                    const rVal = imageData.data[imgIdx];
                    const gVal = imageData.data[imgIdx + 1];
                    const bVal = imageData.data[imgIdx + 2];
                    const lum = 0.299 * rVal + 0.587 * gVal + 0.114 * bVal;
                    const alphaVal = alphaMap[r * cand.logoSize + c];

                    sumPixel += lum;
                    sumAlpha += alphaVal;
                    count++;
                }
            }

            const meanPixel = sumPixel / Math.max(1, count);
            const meanAlpha = sumAlpha / Math.max(1, count);

            let num = 0, denPixel = 0, denAlpha = 0;

            for (let r = 0; r < cand.logoSize; r += 2) {
                for (let c = 0; c < cand.logoSize; c += 2) {
                    const imgIdx = ((posY + r) * width + (posX + c)) * 4;
                    const rVal = imageData.data[imgIdx];
                    const gVal = imageData.data[imgIdx + 1];
                    const bVal = imageData.data[imgIdx + 2];
                    const lum = 0.299 * rVal + 0.587 * gVal + 0.114 * bVal;
                    const alphaVal = alphaMap[r * cand.logoSize + c];

                    const dP = lum - meanPixel;
                    const dA = alphaVal - meanAlpha;

                    num += dP * dA;
                    denPixel += dP * dP;
                    denAlpha += dA * dA;
                }
            }

            const score = (denPixel > 0 && denAlpha > 0) ? (Math.abs(num) / (Math.sqrt(denPixel) * Math.sqrt(denAlpha))) : 0;

            if (score > maxScore) {
                maxScore = score;
                bestConfig = {
                    ...cand,
                    detected: score > 0.15,
                    confidence: Math.min(100, Math.round(score * 100))
                };
            }
        }

        return bestConfig;
    }

    // -----------------------------------------------------------------
    // Core Reverse Alpha Blending Processor (Direct Fallback)
    // -----------------------------------------------------------------
    function executeRemovalDirect(sourceCtx, width, height, config, controls) {
        const destCanvas = document.createElement('canvas');
        destCanvas.width = width;
        destCanvas.height = height;
        const destCtx = destCanvas.getContext('2d', { willReadFrequently: true });

        // Copy source
        destCtx.drawImage(sourceCtx.canvas, 0, 0);
        const imageData = destCtx.getImageData(0, 0, width, height);

        const effSize = Math.max(12, Math.round(config.logoSize * controls.scale));
        const posX = Math.max(0, width - config.marginRight - effSize + controls.offsetX);
        const posY = Math.max(0, height - config.marginBottom - effSize + controls.offsetY);

        const baseAlphaMap = getAlphaMap(effSize >= 96 ? '96' : '48') || getAlphaMap('96');
        const alphaMap = effSize === 96 ? baseAlphaMap : interpolateAlphaMap(getAlphaMap('96'), 96, effSize);

        // Determine background luminance in watermark region
        let bgLumSum = 0;
        let bgLumCount = 0;

        for (let row = 0; row < effSize; row += 4) {
            const currentY = posY + row;
            if (currentY < 0 || currentY >= height) continue;
            for (let col = 0; col < effSize; col += 4) {
                const currentX = posX + col;
                if (currentX < 0 || currentX >= width) continue;
                const imgIdx = (currentY * width + currentX) * 4;
                const rVal = imageData.data[imgIdx];
                const gVal = imageData.data[imgIdx + 1];
                const bVal = imageData.data[imgIdx + 2];
                bgLumSum += (0.299 * rVal + 0.587 * gVal + 0.114 * bVal);
                bgLumCount++;
            }
        }
        const avgLum = bgLumSum / Math.max(1, bgLumCount);
        const isDarkBackground = avgLum < 140;
        const logoVal = isDarkBackground ? 255 : 0;

        const alphaGain = controls.strength;

        for (let row = 0; row < effSize; row++) {
            const currentY = posY + row;
            if (currentY < 0 || currentY >= height) continue;

            for (let col = 0; col < effSize; col++) {
                const currentX = posX + col;
                if (currentX < 0 || currentX >= width) continue;

                const imgIdx = (currentY * width + currentX) * 4;
                const alphaIdx = row * effSize + col;

                const rawAlpha = alphaMap[alphaIdx];
                if (rawAlpha < 0.003) continue;

                const alpha = Math.min(rawAlpha * alphaGain, 0.98);
                const oneMinusAlpha = 1.0 - alpha;

                for (let c = 0; c < 3; c++) {
                    const wmPixel = imageData.data[imgIdx + c];
                    const origPixel = (wmPixel - logoVal * alpha) / oneMinusAlpha;
                    imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(origPixel)));
                }
            }
        }

        destCtx.putImageData(imageData, 0, 0);
        return destCanvas;
    }

    // -----------------------------------------------------------------
    // Controller Lifecycle & Events
    // -----------------------------------------------------------------
    let initialized = false;
    function init() {
        if (initialized) return;
        initialized = true;
        bindEvents();
    }

    function bindEvents() {
        // Upload Inputs
        const dropZone = document.getElementById('gemini-drop-zone');
        const fileInput = document.getElementById('gemini-file-input');

        if (dropZone && fileInput) {
            fileInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            dropZone.addEventListener('click', (e) => {
                if (e.target !== fileInput) {
                    fileInput.click();
                }
            });
            dropZone.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInput.click();
                }
            });
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                }
            });
        }

        // Global Paste Listener (Ctrl+V)
        window.addEventListener('paste', (e) => {
            const pageView = document.getElementById('page-gemini');
            if (!pageView || !pageView.classList.contains('active')) return;
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    handleFileSelect(blob);
                    break;
                }
            }
        });

        // Controls: Fine-Tune Sliders
        const strengthSlider = document.getElementById('gemini-strength');
        const strengthVal = document.getElementById('gemini-strength-val');
        if (strengthSlider) {
            strengthSlider.addEventListener('input', () => {
                userControls.strength = parseFloat(strengthSlider.value);
                if (strengthVal) strengthVal.textContent = userControls.strength.toFixed(2) + 'x';
                scheduleRender();
            });
        }

        const offsetXSlider = document.getElementById('gemini-offset-x');
        const offsetXVal = document.getElementById('gemini-offset-x-val');
        if (offsetXSlider) {
            offsetXSlider.addEventListener('input', () => {
                userControls.offsetX = parseInt(offsetXSlider.value, 10);
                if (offsetXVal) offsetXVal.textContent = userControls.offsetX + 'px';
                scheduleRender();
            });
        }

        const offsetYSlider = document.getElementById('gemini-offset-y');
        const offsetYVal = document.getElementById('gemini-offset-y-val');
        if (offsetYSlider) {
            offsetYSlider.addEventListener('input', () => {
                userControls.offsetY = parseInt(offsetYSlider.value, 10);
                if (offsetYVal) offsetYVal.textContent = userControls.offsetY + 'px';
                scheduleRender();
            });
        }

        const scaleSlider = document.getElementById('gemini-scale');
        const scaleVal = document.getElementById('gemini-scale-val');
        if (scaleSlider) {
            scaleSlider.addEventListener('input', () => {
                userControls.scale = parseFloat(scaleSlider.value);
                if (scaleVal) scaleVal.textContent = userControls.scale.toFixed(2) + 'x';
                scheduleRender();
            });
        }

        // Action Buttons
        const resetBtn = document.getElementById('gemini-btn-reset');
        if (resetBtn) resetBtn.addEventListener('click', resetControls);

        const newImageBtn = document.getElementById('gemini-btn-new');
        if (newImageBtn) newImageBtn.addEventListener('click', clearImage);

        const closeFloatingBtn = document.getElementById('gemini-btn-close-floating');
        if (closeFloatingBtn) closeFloatingBtn.addEventListener('click', clearImage);

        // Download Buttons
        const btnPng = document.getElementById('gemini-btn-png');
        if (btnPng) btnPng.addEventListener('click', () => downloadResult('image/png', 'png'));

        const btnWebp = document.getElementById('gemini-btn-webp');
        if (btnWebp) btnWebp.addEventListener('click', () => downloadResult('image/webp', 'webp'));

        const btnJpeg = document.getElementById('gemini-btn-jpeg');
        if (btnJpeg) btnJpeg.addEventListener('click', () => downloadResult('image/jpeg', 'jpg'));

        // Workspace Tools (Slider / Side-by-side / Zoom / Fullscreen)
        setupWorkspaceInteractions();
    }

    function showLoadingUI(file) {
        const uploadBox = document.getElementById('gemini-upload-box');
        const workspaceBox = document.getElementById('gemini-workspace-box');
        const loadingBox = document.getElementById('gemini-loading-box');
        const fileNameEl = document.getElementById('gemini-loader-filename');
        const progressFill = document.getElementById('gemini-loader-progress-fill');
        const loaderTitle = document.getElementById('gemini-loader-title');
        const loaderDesc = document.getElementById('gemini-loader-desc');

        if (uploadBox) uploadBox.style.display = 'none';
        if (workspaceBox) workspaceBox.style.display = 'none';
        if (loadingBox) loadingBox.style.display = 'flex';

        if (fileNameEl && file) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            fileNameEl.textContent = `${file.name} (${sizeMb} MB)`;
        }

        if (progressFill) progressFill.style.width = '15%';
        const siteLang = (typeof window.getGToolixLanguage === 'function') ? window.getGToolixLanguage() : (localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang') || document.documentElement.lang || 'ar');
        const isRtl = document.documentElement.dir === 'rtl' || siteLang === 'ar';

        if (loaderTitle) loaderTitle.textContent = isRtl ? 'جاري قراءة وتحليل الصورة...' : 'Reading & Analyzing Image...';
        if (loaderDesc) loaderDesc.textContent = isRtl ? 'محرك الذكاء الاصطناعي المحلي يزيل علامة جيميناي بدقة فائقة' : 'Local AI engine is scanning and removing Gemini watermark';
    }

    function updateLoadingProgress(percent, text) {
        const progressFill = document.getElementById('gemini-loader-progress-fill');
        const loaderTitle = document.getElementById('gemini-loader-title');
        if (progressFill) progressFill.style.width = percent + '%';
        if (loaderTitle && text) loaderTitle.textContent = text;
    }

    function hideLoadingUI() {
        const uploadBox = document.getElementById('gemini-upload-box');
        const workspaceBox = document.getElementById('gemini-workspace-box');
        const loadingBox = document.getElementById('gemini-loading-box');
        const progressFill = document.getElementById('gemini-loader-progress-fill');

        if (progressFill) progressFill.style.width = '100%';

        setTimeout(() => {
            if (loadingBox) loadingBox.style.display = 'none';
            if (uploadBox) uploadBox.style.display = 'none';
            if (workspaceBox) workspaceBox.style.display = 'grid';
            if (window.AdManager) {
                window.AdManager.recordSuccessfulUse('gemini-watermark-remover');
            }
        }, 250);
    }

    function handleFileSelect(file) {
        if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
            alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
            return;
        }

        showLoadingUI(file);

        const siteLang = (typeof window.getGToolixLanguage === 'function') ? window.getGToolixLanguage() : (localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang') || document.documentElement.lang || 'ar');
        const isRtl = document.documentElement.dir === 'rtl' || siteLang === 'ar';

        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = function (e) {
                updateLoadingProgress(45, isRtl ? 'جاري الكشف عن علامات جيميناي...' : 'Scanning for Gemini Watermarks...');

                const img = new Image();
                img.onload = function () {
                    setTimeout(() => {
                        updateLoadingProgress(75, isRtl ? 'جاري إزالة العلامة وترميم الصورة...' : 'Removing Watermark & Restoring Pixels...');
                        setTimeout(async () => {
                            await loadImage(img);
                        }, 50);
                    }, 50);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }, 50);
    }

    async function loadImage(img) {
        originalImage = img;

        // Construct master offscreen canvas for exact 100% resolution
        originalCanvas = document.createElement('canvas');
        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        const ctx = originalCanvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        detectedConfig = detectWatermark(imageData);
        isWatermarkDetected = detectedConfig.detected;

        // Reset controls and slider
        userControls = { strength: 1.0, offsetX: 0, offsetY: 0, scale: 1.0 };
        sliderPos = 0;
        syncControlUI();

        // Update detection status UI
        updateDetectionUI();

        // Render result asynchronously
        await render();

        // Hide loading and reveal workspace
        hideLoadingUI();
        if (window.AdManager) {
            window.AdManager.recordSuccessfulUse('gemini-watermark-remover');
        }
    }

    let isUpdatingDetection = false;
    function updateDetectionUI() {
        if (isUpdatingDetection) return;
        isUpdatingDetection = true;
        try {
            const badge = document.getElementById('gemini-detection-badge');
            const statusText = document.getElementById('gemini-status-text');
            const posText = document.getElementById('gemini-pos-text');
            const resText = document.getElementById('gemini-res-text');
            const sizeText = document.getElementById('gemini-size-text');

            if (badge) {
                badge.className = 'detection-badge ' + (isWatermarkDetected ? 'badge-detected' : 'badge-clean');
                badge.innerHTML = isWatermarkDetected
                    ? '<span>✔</span> <span data-i18n="gemini.detectedText">Gemini Watermark Detected</span>'
                    : '<span>ℹ</span> <span data-i18n="gemini.notFoundText">No Gemini Watermark Found</span>';
            }

            const siteLang = (typeof window.getGToolixLanguage === 'function') ? window.getGToolixLanguage() : (localStorage.getItem('gtoolix_language') || localStorage.getItem('siteLang') || document.documentElement.lang || 'ar');
            const isRtl = document.documentElement.dir === 'rtl' || siteLang === 'ar';
            if (statusText) statusText.textContent = isWatermarkDetected ? (isRtl ? 'تم الاكتشاف' : 'Detected') : (isRtl ? 'نظيف' : 'Clean');
            if (posText) posText.textContent = isRtl ? 'أسفل اليمين' : 'Bottom-Right';
            if (resText && originalImage) resText.textContent = `${originalImage.width} × ${originalImage.height} px`;
            if (sizeText) sizeText.textContent = isRtl ? 'معالجة تلقائية بالكامل' : 'Automatic Processing';
        } finally {
            isUpdatingDetection = false;
        }
    }

    function syncControlUI() {
        const sSlider = document.getElementById('gemini-strength');
        const sVal = document.getElementById('gemini-strength-val');
        if (sSlider) sSlider.value = userControls.strength;
        if (sVal) sVal.textContent = userControls.strength.toFixed(2) + 'x';

        const oxSlider = document.getElementById('gemini-offset-x');
        const oxVal = document.getElementById('gemini-offset-x-val');
        if (oxSlider) oxSlider.value = userControls.offsetX;
        if (oxVal) oxVal.textContent = userControls.offsetX + 'px';

        const oySlider = document.getElementById('gemini-offset-y');
        const oyVal = document.getElementById('gemini-offset-y-val');
        if (oySlider) oySlider.value = userControls.offsetY;
        if (oyVal) oyVal.textContent = userControls.offsetY + 'px';

        const scSlider = document.getElementById('gemini-scale');
        const scVal = document.getElementById('gemini-scale-val');
        if (scSlider) scSlider.value = userControls.scale;
        if (scVal) scVal.textContent = userControls.scale.toFixed(2) + 'x';
    }

    let renderDebounce = null;
    function scheduleRender() {
        if (renderDebounce) cancelAnimationFrame(renderDebounce);
        renderDebounce = requestAnimationFrame(render);
    }

    let enginePromise = null;
    function getEngine() {
        if (!enginePromise && typeof GeminiEngine !== 'undefined' && GeminiEngine.WatermarkEngine) {
            enginePromise = GeminiEngine.WatermarkEngine.create();
        }
        return enginePromise;
    }

    function ensureHTMLCanvas(sourceCanvas) {
        if (!sourceCanvas) return null;
        if (typeof sourceCanvas.toDataURL === 'function' && typeof sourceCanvas.toBlob === 'function') {
            return sourceCanvas;
        }
        try {
            const htmlCanvas = document.createElement('canvas');
            htmlCanvas.width = sourceCanvas.width;
            htmlCanvas.height = sourceCanvas.height;
            const ctx = htmlCanvas.getContext('2d');
            ctx.drawImage(sourceCanvas, 0, 0);
            return htmlCanvas;
        } catch (e) {
            return sourceCanvas;
        }
    }

    let isProcessing = false;
    async function render() {
        if (!originalCanvas || isProcessing) return;
        isProcessing = true;

        const ctx = originalCanvas.getContext('2d', { willReadFrequently: true });

        try {
            const engine = await getEngine();
            let rawCanvas = null;
            if (engine) {
                rawCanvas = await engine.removeWatermarkFromImage(originalCanvas, {
                    adaptiveMode: 'accurate'
                });
            } else {
                rawCanvas = executeRemovalDirect(ctx, originalCanvas.width, originalCanvas.height, detectedConfig, userControls);
            }
            processedCanvas = ensureHTMLCanvas(rawCanvas);
        } catch (err) {
            console.warn('Engine pipeline fallback:', err);
            processedCanvas = ensureHTMLCanvas(executeRemovalDirect(ctx, originalCanvas.width, originalCanvas.height, detectedConfig, userControls));
        } finally {
            isProcessing = false;
        }

        drawWorkspaceCanvas();
    }

    function drawWorkspaceCanvas() {
        const container = document.getElementById('gemini-comparison-wrapper');
        if (!container || !originalCanvas || !processedCanvas) return;

        let canvasBefore = document.getElementById('gemini-canvas-before');
        let canvasAfter = document.getElementById('gemini-canvas-after');

        if (!canvasBefore) {
            canvasBefore = document.createElement('canvas');
            canvasBefore.id = 'gemini-canvas-before';
            canvasBefore.className = 'comp-canvas comp-canvas--before';
            container.appendChild(canvasBefore);
        }

        if (!canvasAfter) {
            canvasAfter = document.createElement('canvas');
            canvasAfter.id = 'gemini-canvas-after';
            canvasAfter.className = 'comp-canvas comp-canvas--after';
            container.appendChild(canvasAfter);
        }

        canvasBefore.width = originalCanvas.width;
        canvasBefore.height = originalCanvas.height;
        canvasAfter.width = processedCanvas.width;
        canvasAfter.height = processedCanvas.height;

        const ctxB = canvasBefore.getContext('2d');
        ctxB.drawImage(originalCanvas, 0, 0);

        const ctxA = canvasAfter.getContext('2d');
        ctxA.drawImage(processedCanvas, 0, 0);

        updateSliderClip();
    }

    function updateSliderClip() {
        const container = document.getElementById('gemini-comparison-wrapper');
        const canvasAfter = document.getElementById('gemini-canvas-after');
        const handle = document.getElementById('gemini-slider-handle');

        if (!container || !canvasAfter) return;

        if (isSideBySide) {
            container.classList.add('side-by-side');
            canvasAfter.style.clipPath = 'none';
            if (handle) handle.style.display = 'none';
        } else {
            container.classList.remove('side-by-side');
            if (handle) handle.style.display = 'flex';
            const percent = sliderPos;
            const dir = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';

            if (dir === 'rtl') {
                canvasAfter.style.clipPath = `polygon(0 0, ${100 - percent}% 0, ${100 - percent}% 100%, 0 100%)`;
                if (handle) handle.style.left = (100 - percent) + '%';
            } else {
                canvasAfter.style.clipPath = `polygon(${percent}% 0, 100% 0, 100% 100%, ${percent}% 100%)`;
                if (handle) handle.style.left = percent + '%';
            }
        }
    }

    function setupWorkspaceInteractions() {
        const viewport = document.getElementById('gemini-viewport');
        const container = document.getElementById('gemini-comparison-wrapper');
        const handle = document.getElementById('gemini-slider-handle');

        if (container) {
            let cachedRect = null;
            const updateRect = () => { cachedRect = container.getBoundingClientRect(); };

            const onMove = (clientX) => {
                if (!isDraggingSlider || isSideBySide) return;
                if (!cachedRect) updateRect();
                let x = clientX - cachedRect.left;
                x = Math.max(0, Math.min(cachedRect.width, x));
                let pct = (x / cachedRect.width) * 100;
                if (document.documentElement.dir === 'rtl') {
                    pct = 100 - pct;
                }
                sliderPos = pct;
                updateSliderClip();
            };

            const startDrag = (e) => {
                isDraggingSlider = true;
                updateRect();
                onMove(e.clientX || (e.touches && e.touches[0].clientX));
            };

            const stopDrag = () => { isDraggingSlider = false; cachedRect = null; };

            if (handle) handle.addEventListener('mousedown', startDrag);
            if (handle) handle.addEventListener('touchstart', startDrag, { passive: true });

            window.addEventListener('resize', updateRect, { passive: true });
            window.addEventListener('mousemove', (e) => { if (isDraggingSlider) onMove(e.clientX); });
            window.addEventListener('touchmove', (e) => { if (isDraggingSlider && e.touches && e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });
            window.addEventListener('mouseup', stopDrag);
            window.addEventListener('touchend', stopDrag);
        }

        // Panning & Pinch-to-Zoom handling on viewport for Desktop & Mobile
        if (viewport) {
            const startPan = (clientX, clientY) => {
                isPanning = true;
                panStartX = clientX;
                panStartY = clientY;
                initialPanX = panX;
                initialPanY = panY;
                applyZoomAndPan();
            };

            const movePan = (clientX, clientY) => {
                if (!isPanning) return;
                const dx = clientX - panStartX;
                const dy = clientY - panStartY;
                panX = initialPanX + dx;
                panY = initialPanY + dy;
                applyZoomAndPan();
            };

            const stopPan = () => {
                if (isPanning) {
                    isPanning = false;
                    applyZoomAndPan();
                }
            };

            // Mouse Panning (Desktop)
            viewport.addEventListener('mousedown', (e) => {
                if (e.target.closest('#gemini-btn-close-floating') || e.target.closest('#gemini-slider-handle')) {
                    return;
                }
                if (zoomLevel > 1.0 || e.button === 0) {
                    startPan(e.clientX, e.clientY);
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (isPanning) {
                    movePan(e.clientX, e.clientY);
                }
            });

            window.addEventListener('mouseup', () => stopPan());

            // Touch Panning & Pinch Zooming (Mobile)
            viewport.addEventListener('touchstart', (e) => {
                if (e.target.closest('#gemini-btn-close-floating') || e.target.closest('#gemini-slider-handle')) {
                    return;
                }

                if (e.touches.length === 1) {
                    startPan(e.touches[0].clientX, e.touches[0].clientY);
                } else if (e.touches.length === 2) {
                    isPanning = false;
                    pinchStartDist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    initialPinchZoom = zoomLevel;
                }
            }, { passive: true });

            viewport.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1 && isPanning) {
                    movePan(e.touches[0].clientX, e.touches[0].clientY);
                } else if (e.touches.length === 2 && pinchStartDist > 0) {
                    const dist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    const factor = dist / pinchStartDist;
                    setZoom(initialPinchZoom * factor);
                }
            }, { passive: true });

            viewport.addEventListener('touchend', (e) => {
                if (e.touches.length < 2) {
                    pinchStartDist = 0;
                }
                if (e.touches.length === 0) {
                    stopPan();
                }
            }, { passive: true });

            // Mouse Wheel Zooming over Viewport
            viewport.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey || zoomLevel > 1.0) {
                    e.preventDefault();
                    const delta = e.deltaY < 0 ? 0.2 : -0.2;
                    setZoom(zoomLevel + delta);
                }
            }, { passive: false });
        }

        // Side by side toggle button
        const btnToggleMode = document.getElementById('gemini-btn-mode');
        if (btnToggleMode) {
            btnToggleMode.addEventListener('click', () => {
                isSideBySide = !isSideBySide;
                btnToggleMode.classList.toggle('active', isSideBySide);
                updateSliderClip();
            });
        }

        // Zoom Buttons
        const btnZoomIn = document.getElementById('gemini-btn-zoomin');
        const btnZoomOut = document.getElementById('gemini-btn-zoomout');
        const btnZoomReset = document.getElementById('gemini-btn-zoomreset');

        if (btnZoomIn) btnZoomIn.addEventListener('click', () => setZoom(zoomLevel + 0.25));
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => setZoom(zoomLevel - 0.25));
        if (btnZoomReset) btnZoomReset.addEventListener('click', () => {
            panX = 0;
            panY = 0;
            setZoom(1.0);
        });

        // Fullscreen Toggle
        const btnFullscreen = document.getElementById('gemini-btn-fullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', toggleFullscreen);
        }
    }

    function setZoom(level) {
        zoomLevel = Math.max(0.5, Math.min(4.0, Math.round(level * 100) / 100));
        if (zoomLevel <= 1.0 && !isPanning) {
            panX = 0;
            panY = 0;
        }
        applyZoomAndPan();
    }

    function applyZoomAndPan() {
        const wrapper = document.getElementById('gemini-comparison-wrapper');
        const viewport = document.getElementById('gemini-viewport');
        const zoomText = document.getElementById('gemini-zoom-text');

        if (zoomText) {
            zoomText.textContent = Math.round(zoomLevel * 100) + '%';
        }

        if (!wrapper) return;

        if (zoomLevel > 1.0 && viewport) {
            const vpRect = viewport.getBoundingClientRect();
            const maxPanX = (vpRect.width * (zoomLevel - 0.7)) / 2;
            const maxPanY = (vpRect.height * (zoomLevel - 0.7)) / 2;
            panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
            panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
        } else if (zoomLevel <= 1.0 && !isPanning) {
            panX = 0;
            panY = 0;
        }

        wrapper.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoomLevel})`;
        wrapper.style.transformOrigin = 'center center';

        if (viewport) {
            if (zoomLevel > 1.0) {
                viewport.style.cursor = isPanning ? 'grabbing' : 'grab';
            } else {
                viewport.style.cursor = '';
            }
        }
    }

    function toggleFullscreen() {
        const stage = document.getElementById('gemini-workspace-stage');
        if (!stage) return;
        if (!document.fullscreenElement) {
            if (stage.requestFullscreen) stage.requestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }

    function resetControls() {
        userControls = { strength: 1.0, offsetX: 0, offsetY: 0, scale: 1.0 };
        syncControlUI();
        scheduleRender();
    }

    function clearImage() {
        originalImage = null;
        originalCanvas = null;
        processedCanvas = null;
        const uploadBox = document.getElementById('gemini-upload-box');
        const workspaceBox = document.getElementById('gemini-workspace-box');
        const loadingBox = document.getElementById('gemini-loading-box');
        if (uploadBox) uploadBox.style.display = 'block';
        if (workspaceBox) workspaceBox.style.display = 'none';
        if (loadingBox) loadingBox.style.display = 'none';

        const fileInput = document.getElementById('gemini-file-input');
        if (fileInput) fileInput.value = '';
    }

    let isDownloading = false;
    function downloadResult(mimeType, ext) {
        if (isDownloading) return;
        isDownloading = true;

        const rawCanvas = processedCanvas || originalCanvas;
        if (!rawCanvas) {
            isDownloading = false;
            alert(document.documentElement.dir === 'rtl' ? 'يرجى اختيار صورة أولاً معالجتها.' : 'Please upload an image first.');
            return;
        }

        const canvas = ensureHTMLCanvas(rawCanvas);
        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `gemini_cleaned_${dateStr}.${ext || 'png'}`;
        const targetMime = mimeType || 'image/png';

        const unlock = () => { setTimeout(() => { isDownloading = false; }, 1500); };

        try {
            if (canvas && typeof canvas.toBlob === 'function') {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        fallbackDataURLDownload(canvas, targetMime, fileName);
                        unlock();
                        return;
                    }
                    try {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = fileName;
                        link.href = url;
                        link.click();
                        setTimeout(() => URL.revokeObjectURL(url), 10000);
                        unlock();
                    } catch (e) {
                        fallbackDataURLDownload(canvas, targetMime, fileName);
                        unlock();
                    }
                }, targetMime, 1.0);
            } else {
                fallbackDataURLDownload(canvas, targetMime, fileName);
                unlock();
            }
        } catch (err) {
            console.error('Download error:', err);
            fallbackDataURLDownload(canvas, targetMime, fileName);
            unlock();
        }
    }

    function fallbackDataURLDownload(canvas, mimeType, fileName) {
        try {
            const dataUrl = canvas.toDataURL(mimeType, 1.0);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            alert(document.documentElement.dir === 'rtl' ? 'حدث خطأ أثناء تنزيل الصورة.' : 'Failed to download image.');
        }
    }

    return {
        init,
        render: scheduleRender,
        clearImage,
        download: downloadResult,
        updateDetectionUI
    };
})();

function autoInitGemini() {
    if (document.getElementById('page-gemini') || document.getElementById('gemini-upload-box') || document.getElementById('gemini-file-input')) {
        GeminiWatermarkTool.init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitGemini);
} else {
    autoInitGemini();
}
