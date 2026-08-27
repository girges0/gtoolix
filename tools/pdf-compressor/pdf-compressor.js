/**
 * GToolix — PDF Compressor Engine (100% Client-Side Private Edition)
 * In-browser PDF compression, image re-encoding, and metadata stripping.
 * Zero server uploads.
 */

(function () {
    'use strict';

    // App state
    var state = {
        file: null,
        filename: '',
        fileSize: 0,
        pageCount: 0,
        pdfBytes: null,
        resultBytes: null,
        resultFilename: '',
        selectedLevel: 'balanced', // 'balanced' | 'maximum' | 'high-quality'
        isCompressing: false
    };

    // DOM references helper
    var $ = function (id) { return document.getElementById(id); };

    function getLang() {
        var p = window.location.pathname || '';
        if (p.indexOf('/en/') === 0 || p === '/en') return 'en';
        return document.documentElement.lang || 'ar';
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        var val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
        var lang = getLang();
        var unit = sizes[i];
        if (lang === 'ar') {
            if (unit === 'KB') unit = 'كيلوبايت';
            else if (unit === 'MB') unit = 'ميجابايت';
            else if (unit === 'GB') unit = 'جيجابايت';
            else if (unit === 'B') unit = 'بايت';
        }
        return val + ' ' + unit;
    }

    function formatPages(count) {
        var lang = getLang();
        if (lang === 'ar') {
            if (count === 1) return 'صفحة واحدة';
            if (count === 2) return 'صفحتان';
            if (count >= 3 && count <= 10) return count + ' صفحات';
            return count + ' صفحة';
        }
        return count === 1 ? '1 page' : count + ' pages';
    }

    function yieldToUI() {
        return new Promise(function (resolve) { setTimeout(resolve, 0); });
    }

    // Stream decompression helper using browser native streams
    async function inflateBytes(input) {
        if (typeof DecompressionStream === 'undefined') return null;
        async function pipe(stream) {
            var writer = stream.writable.getWriter();
            writer.write(input).catch(function () { });
            writer.close().catch(function () { });
            var reader = stream.readable.getReader();
            var chunks = [];
            try {
                while (true) {
                    var res = await reader.read();
                    if (res.done) break;
                    chunks.push(res.value);
                }
            } catch (e) {
                if (chunks.length === 0) throw e;
            }
            var len = 0;
            for (var i = 0; i < chunks.length; i++) len += chunks[i].length;
            var out = new Uint8Array(len);
            var offset = 0;
            for (var j = 0; j < chunks.length; j++) {
                out.set(chunks[j], offset);
                offset += chunks[j].length;
            }
            return out;
        }

        try {
            var res1 = await pipe(new DecompressionStream('deflate'));
            if (res1 && res1.length > 0) return res1;
        } catch (e) { }

        if (input.length > 6) {
            var cmf = input[0];
            var flg = input[1];
            if ((cmf & 0x0F) === 8 && ((cmf * 256 + flg) % 31 === 0)) {
                var header = (flg & 0x20) ? 6 : 2;
                var raw = input.subarray(header, input.length - 4);
                try {
                    var res2 = await pipe(new DecompressionStream('deflate-raw'));
                    if (res2 && res2.length > 0) return res2;
                } catch (e) { }
            }
        }

        try {
            var res3 = await pipe(new DecompressionStream('deflate-raw'));
            if (res3 && res3.length > 0) return res3;
        } catch (e) { }

        return null;
    }

    async function deflateBytes(input) {
        if (typeof CompressionStream === 'undefined') return null;
        var stream = new CompressionStream('deflate');
        var writer = stream.writable.getWriter();
        writer.write(input).catch(function () { });
        writer.close().catch(function () { });
        var reader = stream.readable.getReader();
        var chunks = [];
        while (true) {
            var res = await reader.read();
            if (res.done) break;
            chunks.push(res.value);
        }
        var len = 0;
        for (var i = 0; i < chunks.length; i++) len += chunks[i].length;
        var out = new Uint8Array(len);
        var offset = 0;
        for (var j = 0; j < chunks.length; j++) {
            out.set(chunks[j], offset);
            offset += chunks[j].length;
        }
        return out;
    }

    function canvasToJpegBytes(canvas, quality) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
                if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
                blob.arrayBuffer().then(function (buf) {
                    resolve(new Uint8Array(buf));
                });
            }, 'image/jpeg', quality);
        });
    }

    // Initialize Tool
    function init() {
        var dropzone = $('pdfDropzone');
        var fileInput = $('pdfFileInput');
        var browseBtn = $('pdfBrowseBtn');
        var compressBtn = $('pdfCompressBtn');
        var downloadBtn = $('pdfDownloadBtn');
        var resetBtn = $('pdfResetBtn');
        var replaceBtn = $('pdfReplaceBtn');
        var removeBtn = $('pdfRemoveBtn');
        var levelCards = document.querySelectorAll('.compression-level-card');

        if (!dropzone || !fileInput) return;

        // Browse click
        if (browseBtn) {
            browseBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                fileInput.click();
            });
        }
        dropzone.addEventListener('click', function () {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', function () {
            if (fileInput.files && fileInput.files.length > 0) {
                handleFileSelected(fileInput.files[0]);
                fileInput.value = '';
            }
        });

        // Drag & Drop
        dropzone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('is-dragover');
        });
        dropzone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('is-dragover');
        });
        dropzone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('is-dragover');
            var files = e.dataTransfer.files;
            if (files && files.length > 0) {
                handleFileSelected(files[0]);
            }
        });

        // Level selection
        levelCards.forEach(function (card) {
            card.addEventListener('click', function () {
                levelCards.forEach(function (c) { c.classList.remove('is-selected'); });
                card.classList.add('is-selected');
                var radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
                state.selectedLevel = card.getAttribute('data-level') || 'balanced';
            });
        });

        // Compress button
        if (compressBtn) {
            compressBtn.addEventListener('click', function () {
                if (state.pdfBytes && !state.isCompressing) {
                    startCompression();
                }
            });
        }

        // Replace button
        if (replaceBtn) {
            replaceBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                fileInput.click();
            });
        }

        // Remove button
        if (removeBtn) {
            removeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                resetToUpload();
            });
        }

        // Download button
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function () {
                if (state.resultBytes) {
                    downloadFile(state.resultBytes, state.resultFilename);
                }
            });
        }

        // Reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                resetToUpload();
            });
        }
    }

    async function handleFileSelected(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
            var msg = getLang() === 'ar'
                ? 'يرجى اختيار ملف بصيغة PDF فقط.'
                : 'Please select a valid PDF file.';
            alert(msg);
            return;
        }

        // Max file size recommendation: 100MB
        if (file.size > 100 * 1024 * 1024) {
            var largeMsg = getLang() === 'ar'
                ? 'حجم الملف كبير جداً (أكثر من 100 ميجابايت). قد تستغرق المعالجة وقتاً طويلاً على جهازك. هل تود المتابعة؟'
                : 'The file is very large (> 100 MB). Processing may take some time. Would you like to continue?';
            if (!confirm(largeMsg)) return;
        }

        state.file = file;
        state.filename = file.name;
        state.fileSize = file.size;

        var baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        state.resultFilename = baseName + '-compressed.pdf';

        // Update UI to loading state
        updateFileInfoUI(file.name, file.size, '...');
        showStage('info');

        // Read file
        try {
            var reader = new FileReader();
            reader.onload = async function () {
                state.pdfBytes = new Uint8Array(reader.result);
                // Inspect page count via PDFLib
                if (typeof window.PDFLib !== 'undefined') {
                    try {
                        var doc = await window.PDFLib.PDFDocument.load(state.pdfBytes, {
                            updateMetadata: false,
                            throwOnInvalidObject: false
                        });
                        state.pageCount = doc.getPageCount();
                        updateFileInfoUI(state.filename, state.fileSize, formatPages(state.pageCount));
                    } catch (err) {
                        console.warn('[PDFCompressor] Could not parse page count:', err);
                        updateFileInfoUI(state.filename, state.fileSize, '');
                    }
                } else {
                    updateFileInfoUI(state.filename, state.fileSize, '');
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (e) {
            console.error('[PDFCompressor] Read error:', e);
            alert(getLang() === 'ar' ? 'فشلت قراءة الملف.' : 'Failed to read file.');
            resetToUpload();
        }
    }

    function updateFileInfoUI(name, size, pages) {
        var nameEl = $('pdfFileInfoName');
        var sizeEl = $('pdfFileInfoSize');
        var pagesEl = $('pdfFileInfoPages');

        if (nameEl) nameEl.textContent = name;
        if (sizeEl) sizeEl.textContent = formatBytes(size);
        if (pagesEl) {
            if (pages) {
                pagesEl.textContent = pages;
                pagesEl.style.display = 'inline-flex';
            } else {
                pagesEl.style.display = 'none';
            }
        }
    }

    function showStage(stage) {
        // stages: 'drop' | 'info' | 'progress' | 'result'
        var dropzone = $('pdfDropzone');
        var infoCard = $('pdfFileInfoCard');
        var optionsCard = $('pdfOptionsCard');
        var progressCard = $('pdfProgressCard');
        var resultCard = $('pdfResultCard');

        if (dropzone) dropzone.style.display = stage === 'drop' ? 'flex' : 'none';
        if (infoCard) infoCard.style.display = (stage === 'info' || stage === 'progress' || stage === 'result') ? 'block' : 'none';
        if (optionsCard) optionsCard.style.display = stage === 'info' ? 'block' : 'none';
        if (progressCard) progressCard.style.display = stage === 'progress' ? 'block' : 'none';
        if (resultCard) resultCard.style.display = stage === 'result' ? 'block' : 'none';

        // Hide replace/remove buttons during active progress
        var actionsEl = $('pdfFileInfoActions');
        if (actionsEl) {
            actionsEl.style.visibility = stage === 'progress' ? 'hidden' : 'visible';
        }
    }

    function updateProgressUI(fraction, text) {
        var bar = $('pdfProgressBarFill');
        var pctEl = $('pdfProgressPct');
        var textEl = $('pdfProgressStatus');

        var pct = Math.round(fraction * 100);
        if (bar) bar.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
        if (textEl) textEl.textContent = text;
    }

    async function startCompression() {
        if (!state.pdfBytes || state.isCompressing) return;
        state.isCompressing = true;
        showStage('progress');

        var lang = getLang();
        var statusLoading = lang === 'ar' ? 'جاري تحميل وتحليل بنية المستند...' : 'Loading and analyzing PDF structure...';
        var statusOptimizing = lang === 'ar' ? 'جاري ضغط ومعالجة الصور المضمنة...' : 'Optimizing and compressing embedded images...';
        var statusMetadata = lang === 'ar' ? 'تنظيف البيانات الوصفية والزوائد...' : 'Stripping metadata and unneeded streams...';
        var statusSaving = lang === 'ar' ? 'جاري حفظ الملف النهائي...' : 'Rebuilding and saving optimized PDF...';
        var statusComplete = lang === 'ar' ? 'اكتملت المعالجة بنجاح!' : 'Compression complete!';

        updateProgressUI(0.1, statusLoading);

        try {
            if (typeof window.PDFLib === 'undefined') {
                throw new Error('PDF library is not loaded');
            }

            var PDFDocument = window.PDFLib.PDFDocument;
            var PDFName = window.PDFLib.PDFName;
            var PDFRawStream = window.PDFLib.PDFRawStream;

            await yieldToUI();

            // Load document
            var pdfDoc = await PDFDocument.load(state.pdfBytes, {
                updateMetadata: false,
                throwOnInvalidObject: false
            });

            updateProgressUI(0.25, statusOptimizing);
            await yieldToUI();

            // Configure parameters according to selected level
            var jpegQuality = 0.70;
            var targetDPI = 150;
            if (state.selectedLevel === 'maximum') {
                jpegQuality = 0.45;
                targetDPI = 120;
            } else if (state.selectedLevel === 'high-quality') {
                jpegQuality = 0.85;
                targetDPI = 220;
            }

            // Enumerate objects to find image XObjects
            var context = pdfDoc.context;
            var imageRefs = [];

            try {
                var indirectObjects = context.enumerateIndirectObjects();
                for (var i = 0; i < indirectObjects.length; i++) {
                    var entry = indirectObjects[i];
                    var ref = entry[0];
                    var obj = entry[1];
                    if (obj && obj.dict && obj.contents) {
                        var subtype = obj.dict.get(PDFName.of('Subtype'));
                        if (subtype && (subtype.encodedName === '/Image' || subtype.toString() === '/Image')) {
                            var wObj = obj.dict.get(PDFName.of('Width'));
                            var hObj = obj.dict.get(PDFName.of('Height'));
                            var width = wObj ? (typeof wObj.value === 'function' ? wObj.value() : wObj.value || 0) : 0;
                            var height = hObj ? (typeof hObj.value === 'function' ? hObj.value() : hObj.value || 0) : 0;
                            var filterObj = obj.dict.get(PDFName.of('Filter'));
                            var filter = filterObj ? filterObj.toString().replace('/', '') : '';

                            // Exclude tiny icons or masks
                            var isMask = !!obj.dict.get(PDFName.of('ImageMask'));
                            var hasSMask = !!obj.dict.get(PDFName.of('SMask'));

                            if (width >= 16 && height >= 16 && !isMask && !hasSMask) {
                                imageRefs.push({
                                    ref: ref,
                                    width: width,
                                    height: height,
                                    filter: filter,
                                    obj: obj
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('[PDFCompressor] Enumeration fallback:', e);
            }

            // Process image candidates
            var totalImgs = imageRefs.length;
            for (var idx = 0; idx < totalImgs; idx++) {
                var imgCandidate = imageRefs[idx];
                var progressFraction = 0.25 + 0.55 * (idx / totalImgs);
                var imgStatusText = (lang === 'ar'
                    ? 'جاري ضغط الصورة ' + (idx + 1) + ' من ' + totalImgs + '...'
                    : 'Compressing image ' + (idx + 1) + ' of ' + totalImgs + '...');
                updateProgressUI(progressFraction, imgStatusText);

                try {
                    await processImageCandidate(pdfDoc, imgCandidate, jpegQuality, targetDPI);
                } catch (imgErr) {
                    console.warn('[PDFCompressor] Skipped image ' + (idx + 1) + ':', imgErr);
                }

                if (idx % 2 === 0) await yieldToUI();
            }

            updateProgressUI(0.85, statusMetadata);
            await yieldToUI();

            // Mode 1 cleanup: Clear Info dict and remove Metadata catalog
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');

            var catalog = pdfDoc.catalog;
            if (catalog && catalog.has(PDFName.of('Metadata'))) {
                catalog.delete(PDFName.of('Metadata'));
            }

            // Remove page-level metadata
            var pageCount = pdfDoc.getPageCount();
            for (var p = 0; p < pageCount; p++) {
                try {
                    var page = pdfDoc.getPage(p);
                    if (page && page.node && page.node.has(PDFName.of('Metadata'))) {
                        page.node.delete(PDFName.of('Metadata'));
                    }
                } catch (pe) { }
            }

            updateProgressUI(0.95, statusSaving);
            await yieldToUI();

            // Save document
            var compressedBytes = await pdfDoc.save({ useObjectStreams: true });
            state.resultBytes = compressedBytes;

            updateProgressUI(1.0, statusComplete);
            await yieldToUI();

            displayResults();
        } catch (error) {
            console.error('[PDFCompressor] Compression error:', error);
            var errMsg = lang === 'ar'
                ? 'حدث خطأ أثناء ضغط ملف PDF. تأكد أن الملف غير تالف أو محمي بكلمة مرور.'
                : 'An error occurred while compressing the PDF. Make sure the file is not corrupted or password-protected.';
            alert(errMsg);
            showStage('info');
        } finally {
            state.isCompressing = false;
        }
    }

    async function processImageCandidate(pdfDoc, imgInfo, quality, targetDPI) {
        var PDFName = window.PDFLib.PDFName;
        var PDFRawStream = window.PDFLib.PDFRawStream;
        var obj = imgInfo.obj;
        if (!obj || !obj.contents) return false;

        var origBytesLen = obj.contents.length || obj.contents.byteLength;
        var width = imgInfo.width;
        var height = imgInfo.height;

        var canvas = document.createElement('canvas');
        var ctx;

        if (imgInfo.filter === 'DCTDecode') {
            // JPEG: decode via Image
            var jpegCopy = new Uint8Array(obj.contents.length);
            jpegCopy.set(obj.contents);
            var blob = new Blob([jpegCopy], { type: 'image/jpeg' });
            var url = URL.createObjectURL(blob);
            try {
                var img = document.createElement('img');
                await new Promise(function (resolve, reject) {
                    img.onload = resolve;
                    img.onerror = function () { reject(new Error('img decode failed')); };
                    img.src = url;
                });
                width = img.naturalWidth;
                height = img.naturalHeight;
                canvas.width = width;
                canvas.height = height;
                ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
            } finally {
                URL.revokeObjectURL(url);
            }
        } else {
            // Decompress Flate stream
            var rawBytes = await inflateBytes(obj.contents);
            if (!rawBytes) {
                try {
                    var dec = window.PDFLib.decodePDFRawStream(obj);
                    rawBytes = dec.decode();
                } catch (e) {
                    return false;
                }
            }
            if (!rawBytes) return false;

            var pixelCount = width * height;
            var channels = 3;
            if (rawBytes.length >= pixelCount * 4 * 0.9) channels = 4;
            else if (rawBytes.length >= pixelCount * 0.9 && rawBytes.length <= pixelCount * 1.1) channels = 1;

            var imgData = new ImageData(width, height);
            var data = imgData.data;

            for (var i = 0; i < pixelCount; i++) {
                if (channels === 1) {
                    var g = rawBytes[i] || 0;
                    data[i * 4] = g;
                    data[i * 4 + 1] = g;
                    data[i * 4 + 2] = g;
                } else if (channels === 4) {
                    data[i * 4] = rawBytes[i * 4] || 0;
                    data[i * 4 + 1] = rawBytes[i * 4 + 1] || 0;
                    data[i * 4 + 2] = rawBytes[i * 4 + 2] || 0;
                } else {
                    data[i * 4] = rawBytes[i * 3] || 0;
                    data[i * 4 + 1] = rawBytes[i * 3 + 1] || 0;
                    data[i * 4 + 2] = rawBytes[i * 3 + 2] || 0;
                }
                data[i * 4 + 3] = 255;
            }

            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext('2d');
            ctx.putImageData(imgData, 0, 0);
        }

        // DPI Downsampling
        var outWidth = width;
        var outHeight = height;
        if (targetDPI > 0 && (width > 800 || height > 800)) {
            var assumedDPI = 300;
            var scale = Math.min(1.0, targetDPI / assumedDPI);
            outWidth = Math.max(1, Math.round(width * scale));
            outHeight = Math.max(1, Math.round(height * scale));
        }

        var outputCanvas = canvas;
        if (outWidth !== width || outHeight !== height) {
            outputCanvas = document.createElement('canvas');
            outputCanvas.width = outWidth;
            outputCanvas.height = outHeight;
            var outCtx = outputCanvas.getContext('2d');
            outCtx.drawImage(canvas, 0, 0, outWidth, outHeight);
        }

        // Re-encode to JPEG
        var newBytes = await canvasToJpegBytes(outputCanvas, quality);

        // Cleanup memory
        canvas.width = 1;
        canvas.height = 1;
        if (outputCanvas !== canvas) {
            outputCanvas.width = 1;
            outputCanvas.height = 1;
        }

        // Only replace if new bytes are smaller than original!
        if (newBytes && newBytes.length < origBytesLen) {
            var newDict = pdfDoc.context.obj({});
            newDict.set(PDFName.of('Type'), PDFName.of('XObject'));
            newDict.set(PDFName.of('Subtype'), PDFName.of('Image'));
            newDict.set(PDFName.of('Width'), pdfDoc.context.obj(outWidth));
            newDict.set(PDFName.of('Height'), pdfDoc.context.obj(outHeight));
            newDict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
            newDict.set(PDFName.of('BitsPerComponent'), pdfDoc.context.obj(8));
            newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
            newDict.set(PDFName.of('Length'), pdfDoc.context.obj(newBytes.length));

            var newStream = new PDFRawStream(newDict, newBytes);
            pdfDoc.context.assign(imgInfo.ref, newStream);
            return true;
        }

        return false;
    }

    function displayResults() {
        var origBytes = state.fileSize;
        var newBytes = state.resultBytes ? state.resultBytes.length : origBytes;
        var lang = getLang();

        var origEl = $('pdfResOrigSize');
        var compEl = $('pdfResCompSize');
        var savedEl = $('pdfResSavedPct');
        var noticeEl = $('pdfResNotice');

        if (origEl) origEl.textContent = formatBytes(origBytes);
        if (compEl) compEl.textContent = formatBytes(newBytes);

        if (newBytes < origBytes) {
            var savedPercent = ((1 - newBytes / origBytes) * 100).toFixed(1);
            if (savedEl) savedEl.textContent = savedPercent + '%';
            if (noticeEl) noticeEl.style.display = 'none';
        } else {
            // Already compressed
            if (savedEl) savedEl.textContent = '0%';
            if (noticeEl) {
                noticeEl.style.display = 'block';
                noticeEl.textContent = lang === 'ar'
                    ? 'هذا الملف محسّن بالفعل ولا يحتوي على صور أو بيانات غير ضرورية يمكن ضغطها أكثر.'
                    : 'This document is already highly optimized with no compressible images or excess metadata.';
            }
        }

        showStage('result');
    }

    function downloadFile(bytes, filename) {
        var blob = new Blob([bytes], { type: 'application/pdf' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }

    function resetToUpload() {
        state.file = null;
        state.filename = '';
        state.fileSize = 0;
        state.pageCount = 0;
        state.pdfBytes = null;
        state.resultBytes = null;
        state.isCompressing = false;

        var fileInput = $('pdfFileInput');
        if (fileInput) fileInput.value = '';

        showStage('drop');
    }

    // Expose on window
    window.GToolixPDFCompressor = {
        init: init,
        reset: resetToUpload
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
