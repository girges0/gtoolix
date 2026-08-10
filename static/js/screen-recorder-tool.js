/**
 * GToolix — Screen Recorder Studio Engine
 * 100% Client-Side Web API Recording (Canvas Compositing + AudioContext + MediaRecorder)
 * Zero AI API, Zero Third-Party Servers, Pure Privacy.
 */

(function () {
    'use strict';

    // State management
    const state = {
        screenStream: null,
        webcamStream: null,
        micStream: null,
        combinedStream: null,
        mediaRecorder: null,
        recordedChunks: [],
        recordedBlob: null,
        recordedUrl: null,
        audioContext: null,
        audioAnalyser: null,
        audioDestination: null,
        animFrameId: null,
        meterAnimId: null,
        timerInterval: null,
        secondsRecorded: 0,
        isRecording: false,
        isPaused: false,
        isCompositing: false,
        countdownActive: false,

        // Settings
        recordingMode: 'screen-cam', // 'screen-cam', 'screen-only', 'camera-only'
        webcamEnabled: true,
        micEnabled: true,
        systemAudioEnabled: true,
        countdownEnabled: true,
        selectedCameraId: '',
        selectedMicId: '',
        selectedQuality: 'high', // high (1080p/4K), medium (720p), low (480p)
        selectedFps: 30, // 24, 30, 60
        webcamPosition: 'bottom-right', // top-left, top-right, bottom-left, bottom-right, custom
        webcamX: 100, // 0% to 100%
        webcamY: 100, // 0% to 100%
        webcamShape: 'rounded', // rounded, circle, rect
        webcamSizePct: 22, // 10% to 40%
        webcamMarginPx: 24,
        webcamBorder: true,

        // Compositing Canvas
        canvas: null,
        ctx: null,
        screenVideo: null,
        webcamVideo: null
    };

    const DEFAULT_SETTINGS = {
        recordingMode: 'screen-cam',
        webcamEnabled: true,
        micEnabled: true,
        systemAudioEnabled: true,
        countdownEnabled: true,
        selectedCameraId: '',
        selectedMicId: '',
        selectedQuality: 'high',
        selectedFps: 30,
        webcamPosition: 'bottom-right',
        webcamX: 100,
        webcamY: 100,
        webcamShape: 'rounded',
        webcamSizePct: 22,
        webcamMarginPx: 24,
        webcamBorder: true
    };

    const STORAGE_KEY = 'gtoolix_screen_recorder_settings_v1';

    function saveSettings() {
        try {
            const toSave = {
                recordingMode: state.recordingMode,
                webcamEnabled: state.webcamEnabled,
                micEnabled: state.micEnabled,
                systemAudioEnabled: state.systemAudioEnabled,
                countdownEnabled: state.countdownEnabled,
                selectedCameraId: state.selectedCameraId,
                selectedMicId: state.selectedMicId,
                selectedQuality: state.selectedQuality,
                selectedFps: state.selectedFps,
                webcamPosition: state.webcamPosition,
                webcamX: state.webcamX,
                webcamY: state.webcamY,
                webcamShape: state.webcamShape,
                webcamSizePct: state.webcamSizePct,
                webcamMarginPx: state.webcamMarginPx,
                webcamBorder: state.webcamBorder
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save recorder settings:', e);
        }
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.keys(DEFAULT_SETTINGS).forEach(key => {
                    if (parsed[key] !== undefined) {
                        state[key] = parsed[key];
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to load recorder settings:', e);
        }
        applyStateToUI();
    }

    function applyStateToUI() {
        if (elements.selectMode) elements.selectMode.value = state.recordingMode;
        if (elements.toggleWebcam) elements.toggleWebcam.checked = state.webcamEnabled;
        if (elements.toggleMic) elements.toggleMic.checked = state.micEnabled;
        if (elements.toggleSystemAudio) elements.toggleSystemAudio.checked = state.systemAudioEnabled;
        if (elements.toggleCountdown) elements.toggleCountdown.checked = state.countdownEnabled;
        if (elements.toggleBorder) elements.toggleBorder.checked = state.webcamBorder;

        if (elements.selectQuality) elements.selectQuality.value = state.selectedQuality;
        if (elements.selectFps) elements.selectFps.value = state.selectedFps;
        if (elements.selectShape) elements.selectShape.value = state.webcamShape;

        // Visual adjustment for selected mode
        if (state.recordingMode === 'camera-only') {
            if (elements.btnSelectScreen) elements.btnSelectScreen.style.display = 'none';
            if (elements.rowWebcam) elements.rowWebcam.style.opacity = '0.5';
        } else if (state.recordingMode === 'screen-only') {
            if (elements.btnSelectScreen) elements.btnSelectScreen.style.display = 'inline-flex';
            if (elements.rowWebcam) elements.rowWebcam.style.opacity = '0.5';
        } else {
            if (elements.btnSelectScreen) elements.btnSelectScreen.style.display = 'inline-flex';
            if (elements.rowWebcam) elements.rowWebcam.style.opacity = '1';
        }

        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (elements.mobileScreenNotice) {
            elements.mobileScreenNotice.style.display = isMobileDevice ? 'block' : 'none';
        }

        if (elements.sliderSize) {
            elements.sliderSize.value = state.webcamSizePct;
            if (elements.sizeValueDisplay) elements.sizeValueDisplay.textContent = state.webcamSizePct + '%';
        }

        if (elements.sliderMargin) {
            elements.sliderMargin.value = state.webcamMarginPx;
            if (elements.marginValueDisplay) elements.marginValueDisplay.textContent = state.webcamMarginPx + 'px';
        }

        if (elements.positionBtns) {
            elements.positionBtns.forEach(btn => {
                const isMatch = btn.getAttribute('data-pos') === state.webcamPosition;
                btn.classList.toggle('active', isMatch);
            });
        }

        updateWebcamOverlayStyles();
    }

    // DOM Elements
    let elements = {};

    function initElements() {
        elements = {
            selectMode: document.getElementById('rec-select-mode'),
            btnSelectScreen: document.getElementById('rec-btn-select-screen'),
            mobileScreenNotice: document.getElementById('rec-mobile-screen-notice'),
            rowWebcam: document.getElementById('rec-row-webcam'),

            toggleWebcam: document.getElementById('rec-opt-webcam'),
            toggleMic: document.getElementById('rec-opt-mic'),
            toggleSystemAudio: document.getElementById('rec-opt-sys-audio'),
            toggleCountdown: document.getElementById('rec-opt-countdown'),
            toggleBorder: document.getElementById('rec-opt-border'),

            selectCamera: document.getElementById('rec-select-camera'),
            selectMic: document.getElementById('rec-select-mic'),
            selectQuality: document.getElementById('rec-select-quality'),
            selectFps: document.getElementById('rec-select-fps'),
            selectShape: document.getElementById('rec-select-shape'),

            sliderSize: document.getElementById('rec-slider-size'),
            sizeValueDisplay: document.getElementById('rec-size-value'),
            sliderMargin: document.getElementById('rec-slider-margin'),
            marginValueDisplay: document.getElementById('rec-margin-value'),

            positionBtns: document.querySelectorAll('.pos-btn'),

            btnStart: document.getElementById('rec-btn-start'),
            btnPause: document.getElementById('rec-btn-pause'),
            btnResume: document.getElementById('rec-btn-resume'),
            btnStop: document.getElementById('rec-btn-stop'),
            btnReset: document.getElementById('rec-btn-reset'),
            btnDownload: document.getElementById('rec-btn-download'),
            btnRecordAgain: document.getElementById('rec-btn-record-again'),
            btnCloseFinal: document.getElementById('rec-btn-close-final'),
            btnExpandLive: document.getElementById('rec-btn-expand-live'),
            btnExpandFinal: document.getElementById('rec-btn-expand-final'),
            btnExitFullscreen: document.getElementById('rec-btn-exit-fullscreen'),

            timerDisplay: document.getElementById('rec-timer-display'),
            statusChip: document.getElementById('rec-status-chip'),
            statusText: document.getElementById('rec-status-text'),
            audioMeterBar: document.getElementById('rec-audio-meter-bar'),

            livePreviewWrapper: document.getElementById('rec-live-preview-wrapper'),
            previewCanvas: document.getElementById('rec-canvas-preview'),
            webcamPreviewOverlay: document.getElementById('rec-webcam-preview-overlay'),
            webcamVideoEl: document.getElementById('rec-webcam-video-el'),
            countdownOverlay: document.getElementById('rec-countdown-overlay'),
            countdownNumber: document.getElementById('rec-countdown-number'),
            emptyState: document.getElementById('rec-empty-state'),

            finalSection: document.getElementById('rec-final-section'),
            finalVideoPlayer: document.getElementById('rec-final-video-player'),
            metaDuration: document.getElementById('rec-meta-duration'),
            metaFormat: document.getElementById('rec-meta-format'),
            metaSize: document.getElementById('rec-meta-size'),
            metaRes: document.getElementById('rec-meta-res'),

            noticeBrowser: document.getElementById('rec-notice-browser'),
            noticeMobile: document.getElementById('rec-notice-mobile'),
            noticePermission: document.getElementById('rec-notice-permission'),
            noticePermissionText: document.getElementById('rec-notice-permission-text')
        };
    }

    // -----------------------------------------------------------------
    // MIME & Feature Detection
    // -----------------------------------------------------------------
    function getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4'
        ];
        for (const type of types) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm';
    }

    function checkBrowserSupport() {
        const hasDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
        const hasUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasRecorder = typeof window.MediaRecorder !== 'undefined';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (!hasDisplayMedia && hasUserMedia);

        // Recording is supported if MediaRecorder is available and either screen capture or camera capture works
        const isSupported = (hasDisplayMedia || hasUserMedia) && hasRecorder;

        if (elements.noticeBrowser) {
            elements.noticeBrowser.style.display = (!isSupported) ? 'block' : 'none';
        }
        if (elements.noticeMobile) {
            elements.noticeMobile.style.display = (isSupported && isMobile) ? 'block' : 'none';
        }
        if (elements.btnStart) {
            elements.btnStart.disabled = !isSupported;
        }
        return isSupported;
    }

    // -----------------------------------------------------------------
    // Device Enumeration
    // -----------------------------------------------------------------
    async function populateDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            // Cameras
            if (elements.selectCamera) {
                const currentCam = elements.selectCamera.value;
                elements.selectCamera.innerHTML = '';
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                if (videoInputs.length === 0) {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = getI18nString('rec.noCamFound', 'No Camera Detected');
                    elements.selectCamera.appendChild(opt);
                } else {
                    videoInputs.forEach((d, i) => {
                        const opt = document.createElement('option');
                        opt.value = d.deviceId;
                        opt.textContent = d.label || `${getI18nString('rec.camera', 'Camera')} ${i + 1}`;
                        elements.selectCamera.appendChild(opt);
                    });
                    if (currentCam && videoInputs.some(d => d.deviceId === currentCam)) {
                        elements.selectCamera.value = currentCam;
                    }
                }
            }

            // Microphones
            if (elements.selectMic) {
                const currentMic = elements.selectMic.value;
                elements.selectMic.innerHTML = '';
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                if (audioInputs.length === 0) {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = getI18nString('rec.noMicFound', 'No Microphone Detected');
                    elements.selectMic.appendChild(opt);
                } else {
                    audioInputs.forEach((d, i) => {
                        const opt = document.createElement('option');
                        opt.value = d.deviceId;
                        opt.textContent = d.label || `${getI18nString('rec.microphone', 'Microphone')} ${i + 1}`;
                        elements.selectMic.appendChild(opt);
                    });
                    if (currentMic && audioInputs.some(d => d.deviceId === currentMic)) {
                        elements.selectMic.value = currentMic;
                    }
                }
            }
        } catch (err) {
            console.warn('Error enumerating devices:', err);
        }
    }

    // Helper for string translations
    function getI18nString(key, fallback) {
        if (typeof window.t === 'function') {
            const translated = window.t(key);
            if (translated && translated !== key) return translated;
        }
        return fallback;
    }

    // -----------------------------------------------------------------
    // Resilient Media Stream Helpers (Ideal deviceId + Auto-Fallback)
    // -----------------------------------------------------------------
    async function getWebcamStream(preferredDeviceId) {
        if (preferredDeviceId) {
            try {
                return await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { ideal: preferredDeviceId } },
                    audio: false
                });
            } catch (e1) {
                console.warn('Preferred camera device unavailable, falling back to default camera:', e1);
            }
        }
        return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });
    }

    async function getMicStream(preferredDeviceId) {
        const audioSettings = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
        if (preferredDeviceId) {
            try {
                return await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { ideal: preferredDeviceId }, ...audioSettings },
                    video: false
                });
            } catch (e1) {
                console.warn('Preferred mic device unavailable, falling back to default mic:', e1);
            }
        }
        return await navigator.mediaDevices.getUserMedia({
            audio: audioSettings,
            video: false
        });
    }

    // -----------------------------------------------------------------
    // Webcam Live Preview (Before Recording)
    // -----------------------------------------------------------------
    async function startWebcamPreview() {
        if (!state.webcamEnabled) {
            stopWebcamPreview();
            return;
        }

        try {
            if (state.webcamStream) {
                state.webcamStream.getTracks().forEach(t => t.stop());
            }

            state.webcamStream = await getWebcamStream(state.selectedCameraId);

            if (!state.webcamVideo) {
                state.webcamVideo = document.createElement('video');
                state.webcamVideo.autoplay = true;
                state.webcamVideo.muted = true;
                state.webcamVideo.playsInline = true;
            }
            state.webcamVideo.srcObject = state.webcamStream;
            await state.webcamVideo.play().catch(() => { });

            if (elements.webcamVideoEl) {
                elements.webcamVideoEl.srcObject = state.webcamStream;
                await elements.webcamVideoEl.play().catch(() => { });
            }

            if (elements.webcamPreviewOverlay) {
                elements.webcamPreviewOverlay.style.display = 'block';
                updateWebcamOverlayStyles();
            }

            // Sync active device ID back to state/select if fallback was triggered
            const activeVideoTrack = state.webcamStream.getVideoTracks()[0];
            if (activeVideoTrack) {
                const trackSettings = activeVideoTrack.getSettings();
                if (trackSettings.deviceId && elements.selectCamera) {
                    elements.selectCamera.value = trackSettings.deviceId;
                    state.selectedCameraId = trackSettings.deviceId;
                }
            }

            // Refresh device labels if empty labels were returned before permission
            populateDevices();
            showPermissionNotice('', false);
        } catch (err) {
            console.warn('Webcam preview access denied/error:', err);
            showPermissionNotice('rec.camPermissionDenied', true);
            state.webcamEnabled = false;
            if (elements.toggleWebcam) elements.toggleWebcam.checked = false;
            if (elements.webcamPreviewOverlay) elements.webcamPreviewOverlay.style.display = 'none';
        }
    }

    function stopWebcamPreview() {
        if (state.webcamStream && !state.isRecording) {
            state.webcamStream.getTracks().forEach(t => t.stop());
            state.webcamStream = null;
        }
        if (elements.webcamPreviewOverlay) {
            elements.webcamPreviewOverlay.style.display = 'none';
        }
    }

    function updateWebcamOverlayStyles() {
        if (!elements.webcamPreviewOverlay) return;

        const size = state.webcamSizePct + '%';
        const margin = state.webcamMarginPx + 'px';

        elements.webcamPreviewOverlay.style.width = size;
        elements.webcamPreviewOverlay.style.height = 'auto';

        if (state.webcamPosition === 'custom' && state.webcamX !== undefined && state.webcamY !== undefined) {
            elements.webcamPreviewOverlay.style.right = 'auto';
            elements.webcamPreviewOverlay.style.bottom = 'auto';
            elements.webcamPreviewOverlay.style.left = `calc(${state.webcamX}% * (1 - ${state.webcamSizePct / 100}))`;
            elements.webcamPreviewOverlay.style.top = `calc(${state.webcamY}% * (1 - ${state.webcamSizePct / 100}))`;
        } else {
            // Reset positions
            elements.webcamPreviewOverlay.style.top = 'auto';
            elements.webcamPreviewOverlay.style.bottom = 'auto';
            elements.webcamPreviewOverlay.style.left = 'auto';
            elements.webcamPreviewOverlay.style.right = 'auto';

            switch (state.webcamPosition) {
                case 'top-left':
                    elements.webcamPreviewOverlay.style.top = margin;
                    elements.webcamPreviewOverlay.style.left = margin;
                    break;
                case 'top-right':
                    elements.webcamPreviewOverlay.style.top = margin;
                    elements.webcamPreviewOverlay.style.right = margin;
                    break;
                case 'bottom-left':
                    elements.webcamPreviewOverlay.style.bottom = margin;
                    elements.webcamPreviewOverlay.style.left = margin;
                    break;
                case 'bottom-right':
                default:
                    elements.webcamPreviewOverlay.style.bottom = margin;
                    elements.webcamPreviewOverlay.style.right = margin;
                    break;
            }
        }

        // Shape
        elements.webcamPreviewOverlay.classList.remove('shape-rounded', 'shape-circle', 'shape-rect');
        elements.webcamPreviewOverlay.classList.add(`shape-${state.webcamShape}`);

        // Border / Shadow
        elements.webcamPreviewOverlay.classList.toggle('has-border', state.webcamBorder);
    }

    function showPermissionNotice(i18nKey, show) {
        if (!elements.noticePermission) return;
        if (show) {
            if (i18nKey) {
                elements.noticePermissionText.setAttribute('data-i18n', i18nKey);
                elements.noticePermissionText.textContent = getI18nString(i18nKey, 'Permission denied.');
            }
            elements.noticePermission.style.display = 'block';
        } else {
            elements.noticePermission.style.display = 'none';
        }
    }

    // -----------------------------------------------------------------
    // Audio Activity Meter
    // -----------------------------------------------------------------
    function setupAudioMeter(stream) {
        if (!stream || stream.getAudioTracks().length === 0) return;
        try {
            if (!state.audioContext) {
                state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const src = state.audioContext.createMediaStreamSource(stream);
            state.audioAnalyser = state.audioContext.createAnalyser();
            state.audioAnalyser.fftSize = 64;
            src.connect(state.audioAnalyser);

            const dataArray = new Uint8Array(state.audioAnalyser.frequencyBinCount);

            function updateMeter() {
                if (!state.audioAnalyser) return;
                state.audioAnalyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const percentage = Math.min(100, Math.round((average / 128) * 100));

                if (elements.audioMeterBar) {
                    elements.audioMeterBar.style.width = percentage + '%';
                }
                state.meterAnimId = requestAnimationFrame(updateMeter);
            }
            updateMeter();
        } catch (e) {
            console.warn('Audio meter init warning:', e);
        }
    }

    function stopAudioMeter() {
        if (state.meterAnimId) {
            cancelAnimationFrame(state.meterAnimId);
            state.meterAnimId = null;
        }
        if (elements.audioMeterBar) {
            elements.audioMeterBar.style.width = '0%';
        }
    }

    // -----------------------------------------------------------------
    // Canvas Compositing Engine
    // -----------------------------------------------------------------
    function startCanvasCompositing(width, height) {
        if (!state.canvas) {
            state.canvas = document.createElement('canvas');
        }
        state.canvas.width = width;
        state.canvas.height = height;
        state.ctx = state.canvas.getContext('2d', { alpha: false });

        if (elements.previewCanvas) {
            elements.previewCanvas.width = width;
            elements.previewCanvas.height = height;
            elements.previewCanvas.style.display = 'block';
        }

        // Hide the "Ready to Record" placeholder now that the live canvas is active
        if (elements.emptyState) {
            elements.emptyState.style.display = 'none';
        }

        state.isCompositing = true;

        const targetFps = state.selectedFps;

        function renderFrame() {
            if (!state.isCompositing) return;

            const ctx = state.ctx;
            const w = state.canvas.width;
            const h = state.canvas.height;

            // Draw Screen base layer
            if (state.screenVideo && state.screenVideo.readyState >= 2) {
                ctx.drawImage(state.screenVideo, 0, 0, w, h);
            } else {
                ctx.fillStyle = '#020817';
                ctx.fillRect(0, 0, w, h);
            }

            // Draw Webcam Overlay layer if enabled
            if (state.webcamEnabled && state.webcamVideo && state.webcamVideo.readyState >= 2) {
                const camW = Math.round(w * (state.webcamSizePct / 100));
                const camAspect = (state.webcamVideo.videoWidth && state.webcamVideo.videoHeight)
                    ? (state.webcamVideo.videoHeight / state.webcamVideo.videoWidth)
                    : 0.75;
                const camH = Math.round(camW * (state.webcamShape === 'circle' ? 1 : camAspect));

                const margin = state.webcamMarginPx * (w / 1280); // Scaled margin

                let x = 0, y = 0;
                if (state.webcamPosition === 'custom' && state.webcamX !== undefined && state.webcamY !== undefined) {
                    x = Math.round((w - camW) * (state.webcamX / 100));
                    y = Math.round((h - camH) * (state.webcamY / 100));
                } else {
                    const margin = state.webcamMarginPx * (w / 1280); // Scaled margin
                    switch (state.webcamPosition) {
                        case 'top-left':
                            x = margin; y = margin; break;
                        case 'top-right':
                            x = w - camW - margin; y = margin; break;
                        case 'bottom-left':
                            x = margin; y = h - camH - margin; break;
                        case 'bottom-right':
                        default:
                            x = w - camW - margin; y = h - camH - margin; break;
                    }
                }

                ctx.save();

                // Shape clip path
                ctx.beginPath();
                if (state.webcamShape === 'circle') {
                    const radius = camW / 2;
                    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
                } else if (state.webcamShape === 'rounded') {
                    const radius = 16 * (w / 1280);
                    ctx.roundRect(x, y, camW, camH, radius);
                } else {
                    ctx.rect(x, y, camW, camH);
                }
                ctx.clip();

                // Mirror camera horizontally for natural view
                ctx.translate(x + camW, y);
                ctx.scale(-1, 1);
                ctx.drawImage(state.webcamVideo, 0, 0, camW, camH);

                ctx.restore();

                // Draw Border / Shadow stroke if enabled
                if (state.webcamBorder) {
                    ctx.save();
                    ctx.beginPath();
                    if (state.webcamShape === 'circle') {
                        const radius = camW / 2;
                        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
                    } else if (state.webcamShape === 'rounded') {
                        const radius = 16 * (w / 1280);
                        ctx.roundRect(x, y, camW, camH, radius);
                    } else {
                        ctx.rect(x, y, camW, camH);
                    }
                    ctx.lineWidth = 3 * (w / 1280);
                    ctx.strokeStyle = '#2563EB';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowBlur = 12;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Mirror to visible preview canvas
            if (elements.previewCanvas) {
                const pctx = elements.previewCanvas.getContext('2d');
                pctx.drawImage(state.canvas, 0, 0);
            }

            state.animFrameId = requestAnimationFrame(renderFrame);
        }

        renderFrame();
    }

    function stopCanvasCompositing() {
        state.isCompositing = false;
        if (state.animFrameId) {
            cancelAnimationFrame(state.animFrameId);
            state.animFrameId = null;
        }
        if (elements.previewCanvas) {
            elements.previewCanvas.style.display = 'none';
        }
        if (elements.emptyState) {
            elements.emptyState.style.display = '';
        }
    }

    // -----------------------------------------------------------------
    // Interactive Screen Picker
    // -----------------------------------------------------------------
    async function selectScreenInteractive() {
        if (state.isRecording || state.countdownActive) return;

        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
            alert(getI18nString('rec.noDisplayMediaMobile', 'Your mobile browser lacks direct screen capture API (getDisplayMedia). Camera mode will be used, or use Chrome on PC for full screen recording.'));
            return;
        }

        try {
            if (state.screenStream) {
                state.screenStream.getTracks().forEach(t => t.stop());
                state.screenStream = null;
            }

            const displayConstraints = {
                video: {
                    displaySurface: 'monitor',
                    frameRate: { ideal: state.selectedFps, max: 60 }
                },
                audio: state.systemAudioEnabled ? { echoCancellation: true, noiseSuppression: true } : false
            };

            state.screenStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);

            const screenTrack = state.screenStream.getVideoTracks()[0];
            if (screenTrack) {
                screenTrack.onended = () => {
                    if (state.isRecording) {
                        stopRecording();
                    }
                };
            }

            state.screenVideo = document.createElement('video');
            state.screenVideo.srcObject = state.screenStream;
            state.screenVideo.autoplay = true;
            state.screenVideo.muted = true;
            state.screenVideo.playsInline = true;
            await state.screenVideo.play().catch(() => { });

            const settings = screenTrack && screenTrack.getSettings ? screenTrack.getSettings() : {};
            const screenW = settings.width || (state.screenVideo ? state.screenVideo.videoWidth : 0) || 1280;
            const screenH = settings.height || (state.screenVideo ? state.screenVideo.videoHeight : 0) || 720;

            startCanvasCompositing(screenW, screenH);
            showPermissionNotice('rec.screenSelectedSuccess', true);
        } catch (e) {
            if (e.name !== 'NotAllowedError' && e.name !== 'PermissionDeniedError') {
                console.warn('Interactive screen selection error:', e);
            }
        }
    }

    // -----------------------------------------------------------------
    // Core Recording Workflow
    // -----------------------------------------------------------------
    async function startRecordingWorkflow() {
        if (state.isRecording || state.countdownActive) return;

        // Reset previous recording
        if (state.recordedUrl) {
            URL.revokeObjectURL(state.recordedUrl);
            state.recordedUrl = null;
        }
        state.recordedChunks = [];
        state.secondsRecorded = 0;
        updateTimerDisplay();

        if (elements.finalSection) elements.finalSection.style.display = 'none';

        // Check browser support
        if (!checkBrowserSupport()) {
            alert(getI18nString('rec.browserNotSupported', 'Screen recording is not supported in this browser. Please use Chrome, Edge, or Brave.'));
            return;
        }

        try {
            let isScreenCapture = false;

            // Mode 1: Camera Only
            if (state.recordingMode === 'camera-only') {
                state.webcamEnabled = false;
                try {
                    state.screenStream = await getWebcamStream(state.selectedCameraId);
                } catch (camErr) {
                    showPermissionNotice('rec.camPermissionDenied', true);
                    alert(getI18nString('rec.camPermissionDenied', 'Camera access was denied or device is busy.'));
                    return;
                }
                isScreenCapture = false;
            }
            // Mode 2 & 3: Screen Only or Screen + Camera
            else {
                if (state.recordingMode === 'screen-only') {
                    state.webcamEnabled = false;
                }

                // If screen stream not acquired yet
                if (!state.screenStream || state.screenStream.getVideoTracks().length === 0 || !state.screenStream.getVideoTracks()[0].enabled) {
                    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
                        try {
                            const displayConstraints = {
                                video: {
                                    displaySurface: 'monitor',
                                    frameRate: { ideal: state.selectedFps, max: 60 }
                                },
                                audio: state.systemAudioEnabled ? { echoCancellation: true, noiseSuppression: true } : false
                            };
                            state.screenStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
                            isScreenCapture = true;
                        } catch (e) {
                            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                                console.warn('User cancelled displayMedia selection:', e);
                                return;
                            }
                            console.warn('getDisplayMedia failed or unsupported on this device, falling back to camera stream:', e);
                        }
                    }
                } else {
                    isScreenCapture = true;
                }

                // Fallback for mobile / devices where getDisplayMedia is missing or failed:
                if (!state.screenStream) {
                    showPermissionNotice('rec.camNotice', true);
                    try {
                        state.screenStream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: 'user' },
                            audio: state.micEnabled ? { echoCancellation: true, noiseSuppression: true } : false
                        });
                    } catch (camErr) {
                        try {
                            state.screenStream = await getWebcamStream(state.selectedCameraId);
                        } catch (e2) {
                            console.error('Camera fallback failed:', e2);
                            showPermissionNotice('rec.camPermissionDenied', true);
                            alert(getI18nString('rec.camPermissionDenied', 'Camera access was denied or device is busy.'));
                            return;
                        }
                    }
                }
            }

            // Listen for stream track ending
            const screenTrack = state.screenStream.getVideoTracks()[0];
            if (screenTrack) {
                screenTrack.onended = () => {
                    if (state.isRecording) {
                        stopRecording();
                    }
                };
            }

            // 2. Request Webcam Capture if enabled AND primary stream is Screen Capture
            if (isScreenCapture && state.webcamEnabled && state.recordingMode === 'screen-cam') {
                try {
                    state.webcamStream = await getWebcamStream(state.selectedCameraId);
                } catch (e) {
                    console.warn('Webcam permission denied or error:', e);
                    showPermissionNotice('rec.camNotice', true);
                    state.webcamEnabled = false;
                }
            } else if (!isScreenCapture || state.recordingMode !== 'screen-cam') {
                state.webcamStream = null;
            }

            // 3. Request Microphone Capture if enabled AND not already captured in primary stream
            if (state.micEnabled && (!state.screenStream || state.screenStream.getAudioTracks().length === 0)) {
                try {
                    state.micStream = await getMicStream(state.selectedMicId);
                    setupAudioMeter(state.micStream);
                } catch (e) {
                    console.warn('Microphone permission denied or error:', e);
                    showPermissionNotice('rec.micNotice', true);
                    state.micEnabled = false;
                }
            } else if (state.screenStream && state.screenStream.getAudioTracks().length > 0) {
                setupAudioMeter(state.screenStream);
            }

            // Countdown Option (Studio Animating Ring & Number Pop)
            if (state.countdownEnabled && elements.countdownOverlay) {
                state.countdownActive = true;
                elements.countdownOverlay.style.display = 'flex';
                const ringFill = document.getElementById('rec-countdown-ring-fill');
                const totalDash = 276;

                for (let i = 3; i > 0; i--) {
                    if (elements.countdownNumber) {
                        elements.countdownNumber.textContent = i;
                        elements.countdownNumber.classList.remove('pop-anim');
                        void elements.countdownNumber.offsetWidth; // trigger reflow
                        elements.countdownNumber.classList.add('pop-anim');
                    }
                    if (ringFill) {
                        const offset = Math.round(((3 - i) / 3) * totalDash);
                        ringFill.style.strokeDashoffset = offset;
                    }
                    await new Promise(res => setTimeout(res, 1000));
                }
                elements.countdownOverlay.style.display = 'none';
                state.countdownActive = false;
            }

            // Setup Video Stream Sources
            state.screenVideo = document.createElement('video');
            state.screenVideo.srcObject = state.screenStream;
            state.screenVideo.autoplay = true;
            state.screenVideo.muted = true;
            state.screenVideo.playsInline = true;
            await state.screenVideo.play().catch(() => { });

            if (state.webcamStream) {
                state.webcamVideo = document.createElement('video');
                state.webcamVideo.srcObject = state.webcamStream;
                state.webcamVideo.autoplay = true;
                state.webcamVideo.muted = true;
                state.webcamVideo.playsInline = true;
                await state.webcamVideo.play().catch(() => { });
            }

            // Get Captured Screen Resolution
            const settings = screenTrack && screenTrack.getSettings ? screenTrack.getSettings() : {};
            const screenW = settings.width || (state.screenVideo ? state.screenVideo.videoWidth : 0) || 1280;
            const screenH = settings.height || (state.screenVideo ? state.screenVideo.videoHeight : 0) || 720;

            // Prepare Record Video Stream (Canvas compositing for continuous live stage preview)
            startCanvasCompositing(screenW, screenH);
            let recordVideoStream;
            try {
                recordVideoStream = state.canvas.captureStream(state.selectedFps);
            } catch (e) {
                console.warn('Canvas captureStream failed, using direct screenStream fallback:', e);
                recordVideoStream = state.screenStream;
            }

            // 4. Mix Audio Tracks via AudioContext
            try {
                state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                state.audioDestination = state.audioContext.createMediaStreamDestination();

                // Add Screen/System/Camera Audio track if available
                const systemAudioTracks = state.screenStream.getAudioTracks();
                if (systemAudioTracks.length > 0) {
                    const sysSource = state.audioContext.createMediaStreamSource(new MediaStream([systemAudioTracks[0]]));
                    sysSource.connect(state.audioDestination);
                }

                // Add Microphone Audio track if available and separate
                if (state.micStream && state.micStream.getAudioTracks().length > 0) {
                    const micSource = state.audioContext.createMediaStreamSource(state.micStream);
                    micSource.connect(state.audioDestination);
                }
            } catch (audioErr) {
                console.warn('Web Audio Context initialization warning:', audioErr);
            }

            // Build Final Combined Stream for MediaRecorder
            const combinedVideoTrack = recordVideoStream ? recordVideoStream.getVideoTracks()[0] : (state.screenStream ? state.screenStream.getVideoTracks()[0] : null);
            const combinedAudioTrack = (state.audioDestination && state.audioDestination.stream.getAudioTracks().length > 0) ? state.audioDestination.stream.getAudioTracks()[0] : (state.screenStream ? state.screenStream.getAudioTracks()[0] : null);

            const tracks = [];
            if (combinedVideoTrack) tracks.push(combinedVideoTrack);
            if (combinedAudioTrack) tracks.push(combinedAudioTrack);

            state.combinedStream = new MediaStream(tracks);

            // Determine Bitrate Quality
            let videoBits = 5000000; // 5 Mbps default (1080p)
            if (state.selectedQuality === 'high') videoBits = screenW >= 2560 ? 12000000 : 8000000; // 8-12 Mbps
            else if (state.selectedQuality === 'low') videoBits = 2000000; // 2 Mbps

            const mimeType = getSupportedMimeType();
            const recorderOptions = {
                mimeType: mimeType,
                videoBitsPerSecond: videoBits,
                audioBitsPerSecond: 128000
            };

            try {
                state.mediaRecorder = new MediaRecorder(state.combinedStream, recorderOptions);
            } catch (eBitrate) {
                console.warn('MediaRecorder with bitrates failed, trying with mimeType only:', eBitrate);
                try {
                    state.mediaRecorder = new MediaRecorder(state.combinedStream, { mimeType: mimeType });
                } catch (eMime) {
                    console.warn('MediaRecorder with mimeType failed, trying default MediaRecorder:', eMime);
                    state.mediaRecorder = new MediaRecorder(state.combinedStream);
                }
            }

            state.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    state.recordedChunks.push(event.data);
                }
            };

            state.mediaRecorder.onstop = onRecordingStopped;

            // Start Recorder
            state.mediaRecorder.start(1000); // chunk every 1s
            state.isRecording = true;
            state.isPaused = false;
            updateUIState();
            startTimer();

            // Hide webcam preview overlay during active recording
            if (elements.webcamPreviewOverlay) {
                elements.webcamPreviewOverlay.style.display = 'none';
            }

        } catch (err) {
            console.error('Failed to start recording workflow:', err);
            cleanUpStreams();
            state.isRecording = false;
            state.countdownActive = false;
            if (elements.countdownOverlay) elements.countdownOverlay.style.display = 'none';
            updateUIState();

            if (err.name !== 'NotAllowedError') {
                alert(getI18nString('rec.startError', 'Could not start recording: ') + err.message);
            }
        }
    }

    function pauseRecording() {
        if (state.mediaRecorder && state.isRecording && !state.isPaused) {
            state.mediaRecorder.pause();
            state.isPaused = true;
            stopTimer();
            updateUIState();
        }
    }

    function resumeRecording() {
        if (state.mediaRecorder && state.isRecording && state.isPaused) {
            state.mediaRecorder.resume();
            state.isPaused = false;
            startTimer();
            updateUIState();
        }
    }

    function stopRecording() {
        if (state.mediaRecorder && (state.isRecording || state.isPaused)) {
            state.mediaRecorder.stop();
            state.isRecording = false;
            state.isPaused = false;
            stopTimer();
            stopCanvasCompositing();
            stopAudioMeter();
            updateUIState();
        }
    }

    function onRecordingStopped() {
        const mimeType = state.mediaRecorder ? state.mediaRecorder.mimeType : getSupportedMimeType();
        state.recordedBlob = new Blob(state.recordedChunks, { type: mimeType });
        state.recordedUrl = URL.createObjectURL(state.recordedBlob);

        // Display Final Recording Section
        if (elements.finalVideoPlayer) {
            elements.finalVideoPlayer.src = state.recordedUrl;
        }

        if (elements.metaDuration) {
            elements.metaDuration.textContent = formatDuration(state.secondsRecorded);
        }
        if (elements.metaFormat) {
            elements.metaFormat.textContent = mimeType.split(';')[0];
        }
        if (elements.metaSize) {
            elements.metaSize.textContent = formatBytes(state.recordedBlob.size);
        }
        if (elements.metaRes && state.screenVideo) {
            const w = state.screenVideo.videoWidth || 1920;
            const h = state.screenVideo.videoHeight || 1080;
            elements.metaRes.textContent = `${w} × ${h}`;
        }

        if (elements.finalSection) {
            elements.finalSection.style.display = 'block';
            elements.finalSection.scrollIntoView({ behavior: 'smooth' });
        }

        if (window.AdManager && state.recordedBlob && state.recordedBlob.size > 0) {
            window.AdManager.recordSuccessfulUse('screen-recorder-studio');
        }

        cleanUpStreams();
    }

    function downloadRecording() {
        if (!state.recordedBlob || !state.recordedUrl) return;
        const mime = state.recordedBlob.type || '';
        const ext = mime.includes('mp4') ? 'mp4' : 'webm';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `GToolix-ScreenRecorder-${timestamp}.${ext}`;

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = state.recordedUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
    }

    function cleanUpStreams() {
        if (state.screenStream) {
            state.screenStream.getTracks().forEach(t => t.stop());
            state.screenStream = null;
        }
        if (state.webcamStream) {
            state.webcamStream.getTracks().forEach(t => t.stop());
            state.webcamStream = null;
        }
        if (state.micStream) {
            state.micStream.getTracks().forEach(t => t.stop());
            state.micStream = null;
        }
        if (state.audioContext && state.audioContext.state !== 'closed') {
            state.audioContext.close().catch(() => { });
            state.audioContext = null;
        }
        stopAudioMeter();
        stopCanvasCompositing();
    }

    function resetWorkflow() {
        // Stop & reset video player playback immediately if active
        if (elements.finalVideoPlayer) {
            try {
                elements.finalVideoPlayer.pause();
                elements.finalVideoPlayer.currentTime = 0;
                elements.finalVideoPlayer.removeAttribute('src');
                elements.finalVideoPlayer.load();
            } catch (e) { }
        }

        stopRecording();
        cleanUpStreams();
        stopWebcamPreview();

        // Completely discard recorded video data (no download saved)
        if (state.recordedUrl) {
            URL.revokeObjectURL(state.recordedUrl);
            state.recordedUrl = null;
        }
        state.recordedBlob = null;
        state.recordedChunks = [];
        state.secondsRecorded = 0;
        updateTimerDisplay();

        // 1. Clear saved settings from localStorage
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { }

        // 2. Restore state to default settings 100%
        Object.assign(state, DEFAULT_SETTINGS);

        // 3. Apply defaults to all UI controls
        applyStateToUI();

        // 4. Reset select dropdowns to first available option
        if (elements.selectCamera && elements.selectCamera.options.length > 0) {
            state.selectedCameraId = elements.selectCamera.options[0].value || '';
            elements.selectCamera.value = state.selectedCameraId;
        }
        if (elements.selectMic && elements.selectMic.options.length > 0) {
            state.selectedMicId = elements.selectMic.options[0].value || '';
            elements.selectMic.value = state.selectedMicId;
        }

        if (elements.finalSection) elements.finalSection.style.display = 'none';
        if (elements.noticePermission) elements.noticePermission.style.display = 'none';

        // 5. Restart webcam preview with clean default settings if webcam is enabled
        if (state.webcamEnabled) {
            startWebcamPreview();
        }
        updateUIState();
    }

    // -----------------------------------------------------------------
    // Timer & UI Utilities
    // -----------------------------------------------------------------
    function startTimer() {
        stopTimer();
        state.timerInterval = setInterval(() => {
            state.secondsRecorded++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        if (elements.timerDisplay) {
            elements.timerDisplay.textContent = formatDuration(state.secondsRecorded);
        }
    }

    function formatDuration(sec) {
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = sec % 60;
        const pM = String(mins).padStart(2, '0');
        const pS = String(secs).padStart(2, '0');
        return hrs > 0 ? `${String(hrs).padStart(2, '0')}:${pM}:${pS}` : `${pM}:${pS}`;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateUIState() {
        const rec = state.isRecording;
        const paused = state.isPaused;

        if (elements.btnStart) elements.btnStart.style.display = (!rec && !paused) ? 'inline-flex' : 'none';
        if (elements.btnPause) elements.btnPause.style.display = (rec && !paused) ? 'inline-flex' : 'none';
        if (elements.btnResume) elements.btnResume.style.display = (rec && paused) ? 'inline-flex' : 'none';
        if (elements.btnStop) elements.btnStop.style.display = (rec || paused) ? 'inline-flex' : 'none';

        if (elements.statusChip) {
            elements.statusChip.style.display = (rec || paused) ? 'inline-flex' : 'none';
            elements.statusChip.classList.toggle('status-recording', rec && !paused);
            elements.statusChip.classList.toggle('status-paused', paused);
        }

        if (elements.statusText) {
            if (paused) {
                elements.statusText.textContent = getI18nString('rec.paused', 'Paused');
            } else if (rec) {
                elements.statusText.textContent = getI18nString('rec.recording', 'Recording...');
            }
        }
    }

    // -----------------------------------------------------------------
    // Free Drag-and-Drop Webcam Overlay Positioning
    // -----------------------------------------------------------------
    function setupWebcamDrag() {
        const overlay = elements.webcamPreviewOverlay;
        const wrapper = elements.livePreviewWrapper;
        if (!overlay || !wrapper) return;

        let isDragging = false;
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;
        let maxLeft = 0, maxTop = 0;

        function onStart(e) {
            if (e.target.closest('#rec-btn-exit-fullscreen')) return;
            isDragging = true;
            overlay.classList.add('is-dragging');

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;

            const overlayRect = overlay.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();

            startLeft = overlayRect.left - wrapperRect.left;
            startTop = overlayRect.top - wrapperRect.top;
            maxLeft = wrapperRect.width - overlayRect.width;
            maxTop = wrapperRect.height - overlayRect.height;

            document.addEventListener('mousemove', onMove, { passive: false });
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
        }

        function onMove(e) {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            overlay.style.right = 'auto';
            overlay.style.bottom = 'auto';
            overlay.style.left = newLeft + 'px';
            overlay.style.top = newTop + 'px';

            const pctX = maxLeft > 0 ? (newLeft / maxLeft) * 100 : 0;
            const pctY = maxTop > 0 ? (newTop / maxTop) * 100 : 0;

            state.webcamPosition = 'custom';
            state.webcamX = Math.round(pctX);
            state.webcamY = Math.round(pctY);

            if (elements.positionBtns) {
                elements.positionBtns.forEach(btn => btn.classList.remove('active'));
            }
        }

        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            overlay.classList.remove('is-dragging');

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchend', onEnd);

            saveSettings();
        }

        overlay.addEventListener('mousedown', onStart);
        overlay.addEventListener('touchstart', onStart, { passive: false });
    }

    // -----------------------------------------------------------------
    // Event Listeners & Binding
    // -----------------------------------------------------------------
    function bindEvents() {
        if (elements.selectMode) {
            elements.selectMode.addEventListener('change', (e) => {
                state.recordingMode = e.target.value;
                if (state.recordingMode === 'camera-only' || state.recordingMode === 'screen-only') {
                    state.webcamEnabled = (state.recordingMode !== 'screen-only');
                } else if (state.recordingMode === 'screen-cam') {
                    state.webcamEnabled = true;
                }
                saveSettings();
                applyStateToUI();
                if (state.webcamEnabled) startWebcamPreview();
                else stopWebcamPreview();
            });
        }

        if (elements.btnSelectScreen) {
            elements.btnSelectScreen.addEventListener('click', () => {
                selectScreenInteractive();
            });
        }

        const tabBtns = document.querySelectorAll('.rec-tab-btn');
        if (tabBtns.length > 0) {
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.getAttribute('data-tab');
                    const targetId = 'rec-tab-' + tabName;
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.querySelectorAll('.rec-tab-content').forEach(content => {
                        content.style.display = (content.id === targetId) ? 'block' : 'none';
                        if (content.id === targetId) content.classList.add('active');
                        else content.classList.remove('active');
                    });
                });
            });
        }

        if (elements.toggleWebcam) {
            elements.toggleWebcam.addEventListener('change', (e) => {
                state.webcamEnabled = e.target.checked;
                saveSettings();
                if (state.webcamEnabled) startWebcamPreview();
                else stopWebcamPreview();
            });
        }

        if (elements.toggleMic) {
            elements.toggleMic.addEventListener('change', (e) => {
                state.micEnabled = e.target.checked;
                saveSettings();
            });
        }

        if (elements.toggleSystemAudio) {
            elements.toggleSystemAudio.addEventListener('change', (e) => {
                state.systemAudioEnabled = e.target.checked;
                saveSettings();
            });
        }

        if (elements.toggleCountdown) {
            elements.toggleCountdown.addEventListener('change', (e) => {
                state.countdownEnabled = e.target.checked;
                saveSettings();
            });
        }

        if (elements.toggleBorder) {
            elements.toggleBorder.addEventListener('change', (e) => {
                state.webcamBorder = e.target.checked;
                saveSettings();
                updateWebcamOverlayStyles();
            });
        }

        if (elements.selectCamera) {
            elements.selectCamera.addEventListener('change', (e) => {
                state.selectedCameraId = e.target.value;
                saveSettings();
                if (state.webcamEnabled) startWebcamPreview();
            });
        }

        if (elements.selectMic) {
            elements.selectMic.addEventListener('change', (e) => {
                state.selectedMicId = e.target.value;
                saveSettings();
            });
        }

        if (elements.selectQuality) {
            elements.selectQuality.addEventListener('change', (e) => {
                state.selectedQuality = e.target.value;
                saveSettings();
            });
        }

        if (elements.selectFps) {
            elements.selectFps.addEventListener('change', (e) => {
                state.selectedFps = parseInt(e.target.value, 10) || 30;
                saveSettings();
            });
        }

        if (elements.selectShape) {
            elements.selectShape.addEventListener('change', (e) => {
                state.webcamShape = e.target.value;
                saveSettings();
                updateWebcamOverlayStyles();
            });
        }

        if (elements.sliderSize) {
            elements.sliderSize.addEventListener('input', (e) => {
                state.webcamSizePct = parseInt(e.target.value, 10);
                if (elements.sizeValueDisplay) elements.sizeValueDisplay.textContent = state.webcamSizePct + '%';
                saveSettings();
                updateWebcamOverlayStyles();
            });
        }

        if (elements.sliderMargin) {
            elements.sliderMargin.addEventListener('input', (e) => {
                state.webcamMarginPx = parseInt(e.target.value, 10);
                if (elements.marginValueDisplay) elements.marginValueDisplay.textContent = state.webcamMarginPx + 'px';
                saveSettings();
                updateWebcamOverlayStyles();
            });
        }

        if (elements.positionBtns) {
            elements.positionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    elements.positionBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    state.webcamPosition = btn.getAttribute('data-pos');
                    if (state.webcamPosition === 'top-left') { state.webcamX = 0; state.webcamY = 0; }
                    else if (state.webcamPosition === 'top-right') { state.webcamX = 100; state.webcamY = 0; }
                    else if (state.webcamPosition === 'bottom-left') { state.webcamX = 0; state.webcamY = 100; }
                    else if (state.webcamPosition === 'bottom-right') { state.webcamX = 100; state.webcamY = 100; }
                    saveSettings();
                    updateWebcamOverlayStyles();
                });
            });
        }

        setupWebcamDrag();

        if (elements.btnStart) elements.btnStart.addEventListener('click', startRecordingWorkflow);
        if (elements.btnPause) elements.btnPause.addEventListener('click', pauseRecording);
        if (elements.btnResume) elements.btnResume.addEventListener('click', resumeRecording);
        if (elements.btnStop) elements.btnStop.addEventListener('click', stopRecording);
        if (elements.btnReset) elements.btnReset.addEventListener('click', resetWorkflow);
        if (elements.btnDownload) elements.btnDownload.addEventListener('click', downloadRecording);
        if (elements.btnRecordAgain) elements.btnRecordAgain.addEventListener('click', resetWorkflow);
        if (elements.btnCloseFinal) elements.btnCloseFinal.addEventListener('click', resetWorkflow);

        // Fullscreen Expand Event Listeners
        function toggleFullscreen(element) {
            if (!element) return;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (element.requestFullscreen) element.requestFullscreen();
                else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        }

        if (elements.btnExpandLive) {
            elements.btnExpandLive.addEventListener('click', () => {
                toggleFullscreen(elements.livePreviewWrapper);
            });
        }

        if (elements.btnExpandFinal) {
            elements.btnExpandFinal.addEventListener('click', () => {
                toggleFullscreen(elements.finalVideoPlayer);
            });
        }

        if (elements.btnExitFullscreen) {
            elements.btnExitFullscreen.addEventListener('click', () => {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            });
        }

        document.addEventListener('fullscreenchange', () => {
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (elements.btnExitFullscreen) {
                elements.btnExitFullscreen.style.display = isFS ? 'inline-flex' : 'none';
            }
        });

        // Listen for device changes (plug/unplug mic or camera)
        if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
            navigator.mediaDevices.ondevicechange = populateDevices;
        }
    }

    // Initialize module (elements + events only; preview starts on page activation)
    let _initialized = false;
    function init() {
        if (_initialized) return;
        _initialized = true;
        initElements();
        loadSettings();
        checkBrowserSupport();
        populateDevices();
        bindEvents();
    }

    // Called by SPA router when the recorder page becomes visible
    function onPageActivated() {
        if (!_initialized) init();
        // Re-query elements in case DOM changed
        initElements();
        loadSettings();
        checkBrowserSupport();
        populateDevices();
        // Start camera preview if webcam is enabled
        if (state.webcamEnabled) {
            startWebcamPreview();
        }
    }

    // Called by SPA router when navigating away from the recorder page
    function onPageDeactivated() {
        if (elements.finalVideoPlayer) {
            try {
                elements.finalVideoPlayer.pause();
            } catch (e) { }
        }
        stopWebcamPreview();
        stopAudioMeter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public module
    window.ScreenRecorderTool = {
        init,
        onPageActivated,
        onPageDeactivated,
        startRecordingWorkflow,
        stopRecording,
        resetWorkflow,
        state
    };
})();