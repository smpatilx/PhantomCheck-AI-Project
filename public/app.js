/**
 * PhantomCheck AI — Client-Side Application
 * Safe DOM rendering, multi-mode investigation, and local Gemma AI integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // App State
  // ==========================================================================
  const state = {
    activeTab: 'message',
    selectedFile: null,
    lastReport: null,
    lastAnalysisType: 'message',
    lastContextText: '',
    loadingTimerInterval: null,
    loadingSeconds: 0,
    aiStatus: {
      online: false,
      modelFound: false,
      configuredModel: 'gemma4:e2b',
      availableModels: []
    }
  };

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const elements = {
    // Nav & AI Status
    aiStatusPill: document.getElementById('aiStatusPill'),
    statusDot: document.getElementById('statusDot'),
    statusLabel: document.getElementById('statusLabel'),
    testAiBtn: document.getElementById('testAiBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    soundLabel: document.getElementById('soundLabel'),
    statusAlertBar: document.getElementById('statusAlertBar'),
    alertMessage: document.getElementById('alertMessage'),
    alertActionBtn: document.getElementById('alertActionBtn'),
    alertCloseBtn: document.getElementById('alertCloseBtn'),

    // Tabs
    tabMessage: document.getElementById('tabMessage'),
    tabImage: document.getElementById('tabImage'),
    tabUrl: document.getElementById('tabUrl'),
    panelMessage: document.getElementById('panelMessage'),
    panelImage: document.getElementById('panelImage'),
    panelUrl: document.getElementById('panelUrl'),

    // Mode 1: Message
    messageInput: document.getElementById('messageInput'),
    charCounter: document.getElementById('charCounter'),
    clearMessageBtn: document.getElementById('clearMessageBtn'),
    analyzeMessageBtn: document.getElementById('analyzeMessageBtn'),
    sampleButtons: document.querySelectorAll('.btn-sample[data-sample]'),

    // Mode 2: Screenshot OCR
    dropZone: document.getElementById('dropZone'),
    dropZonePrompt: document.getElementById('dropZonePrompt'),
    fileInput: document.getElementById('fileInput'),
    filePreviewCard: document.getElementById('filePreviewCard'),
    imagePreview: document.getElementById('imagePreview'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    clearImageBtn: document.getElementById('clearImageBtn'),
    analyzeImageBtn: document.getElementById('analyzeImageBtn'),
    ocrEditContainer: document.getElementById('ocrEditContainer'),
    ocrConfidenceBadge: document.getElementById('ocrConfidenceBadge'),
    ocrTextEdit: document.getElementById('ocrTextEdit'),

    // Mode 3: Website URL
    urlInput: document.getElementById('urlInput'),
    clearUrlBtn: document.getElementById('clearUrlBtn'),
    analyzeUrlBtn: document.getElementById('analyzeUrlBtn'),
    urlSampleButtons: document.querySelectorAll('.btn-sample[data-url]'),

    // Loading State
    loadingState: document.getElementById('loadingState'),
    loadingTitle: document.getElementById('loadingTitle'),
    loadingSubtitle: document.getElementById('loadingSubtitle'),
    loadingTimer: document.getElementById('loadingTimer'),
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),

    // Error Card
    errorCard: document.getElementById('errorCard'),
    errorTitle: document.getElementById('errorTitle'),
    errorMessage: document.getElementById('errorMessage'),
    dismissErrorBtn: document.getElementById('dismissErrorBtn'),
    retryErrorBtn: document.getElementById('retryErrorBtn'),

    // Results Dashboard
    resultsDashboard: document.getElementById('resultsDashboard'),
    reportSourceType: document.getElementById('reportSourceType'),
    reportLatency: document.getElementById('reportLatency'),
    reportModel: document.getElementById('reportModel'),
    assessmentHero: document.getElementById('assessmentHero'),
    assessmentIcon: document.getElementById('assessmentIcon'),
    assessmentText: document.getElementById('assessmentText'),
    criticalWarningBanner: document.getElementById('criticalWarningBanner'),
    riskValue: document.getElementById('riskValue'),
    assessmentSummary: document.getElementById('assessmentSummary'),
    contextCard: document.getElementById('contextCard'),
    contextHeaderLabel: document.getElementById('contextHeaderLabel'),
    contextContent: document.getElementById('contextContent'),
    copyContextBtn: document.getElementById('copyContextBtn'),
    warningSignsList: document.getElementById('warningSignsList'),
    evidenceAvailableList: document.getElementById('evidenceAvailableList'),
    evidenceGapsList: document.getElementById('evidenceGapsList'),
    verificationStepsList: document.getElementById('verificationStepsList'),
    safeActionsList: document.getElementById('safeActionsList'),
    limitationsList: document.getElementById('limitationsList'),
    copyReportBtn: document.getElementById('copyReportBtn'),
    downloadReportBtn: document.getElementById('downloadReportBtn'),
    analyzeAnotherBtn: document.getElementById('analyzeAnotherBtn'),

    // AI Diagnostics Modal
    aiTestModal: document.getElementById('aiTestModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    dismissModalBtn: document.getElementById('dismissModalBtn'),
    runDiagTestBtn: document.getElementById('runDiagTestBtn'),
    diagHost: document.getElementById('diagHost'),
    diagModel: document.getElementById('diagModel'),
    diagStatus: document.getElementById('diagStatus'),
    diagAvailableModels: document.getElementById('diagAvailableModels'),
    diagOutput: document.getElementById('diagOutput')
  };

  // Sample Scenarios for Testing / Demonstration
  const SAMPLE_TEXTS = {
    bankScam: `URGENT NOTICE from State Bank Security Division: Your primary checking account ending in 4102 has been temporarily suspended due to pending KYC regulation 84B. Failure to verify within 24 hours will result in permanent account freeze and a $150 compliance penalty fee. Verify your identity immediately via official portal: http://sbi-kyc-verify-portal.top/login or share your 6-digit OTP with our verified fraud prevention executive.`,
    lotteryScam: `CONGRATULATIONS! You have been selected as the grand prize winner of 5.5 BTC ($350,000 USD) in the Global Blockchain Foundation Annual Lucky Draw! To claim your payout today, send a one-time refundable gas fee of 0.02 BTC to wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa. ACT FAST - Unclaimed prizes will be forfeited in 3 hours!`,
    miracleCure: `SHOCKING TRUTH BIG PHARMA IS HIDING: Boiling soursop leaves mixed with crushed ginger and baking soda cures Stage 4 cancer in just 48 hours without any chemotherapy! Medical doctors are banned from talking about this miracle home remedy. Forward this to 10 friends immediately to save lives before this post is deleted by Facebook!`,
    authenticNews: `The National Weather Service has issued a high wind advisory for coastal regions effective Tuesday from 6:00 AM to 8:00 PM EST. Sustained wind speeds of 25 to 35 mph with localized gusts up to 50 mph are expected. Residents are advised to secure loose outdoor objects and exercise caution while driving high-profile vehicles on bridges.`
  };

  // ==========================================================================
  // Sound Effects Engine (Web Audio API)
  // Synthesizes pleasant, low-latency audio without external asset dependencies
  // ==========================================================================
  const soundEngine = {
    audioCtx: null,
    enabled: localStorage.getItem('phantomcheck_sound_enabled') !== 'false',
    lastClickTime: 0,
    pendingResultTimeout: null,

    init() {
      if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    },

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('phantomcheck_sound_enabled', this.enabled ? 'true' : 'false');
      this.updateUI();
      if (this.enabled) {
        this.playClick();
      }
    },

    updateUI() {
      if (elements.soundIcon) elements.soundIcon.textContent = this.enabled ? '🔊' : '🔇';
      if (elements.soundLabel) elements.soundLabel.textContent = this.enabled ? 'Sound On' : 'Muted';
      if (elements.soundToggleBtn) {
        elements.soundToggleBtn.title = this.enabled ? 'Audio feedback enabled — Click to mute' : 'Audio feedback muted — Click to enable';
        elements.soundToggleBtn.classList.toggle('muted', !this.enabled);
      }
    },

    // 1. Button click sound: quiet, crisp mechanical tick (debounced)
    playClick() {
      if (!this.enabled) return;
      const now = Date.now();
      if (now - this.lastClickTime < 90) return; // Prevent multiple overlapping clicks
      this.lastClickTime = now;

      try {
        this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.025);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.03);
      } catch {}
    },

    cancelPendingResultSound() {
      if (this.pendingResultTimeout) {
        clearTimeout(this.pendingResultTimeout);
        this.pendingResultTimeout = null;
      }
    },

    // 2. Verdict Result Sound: waits exactly 2 seconds after result is ready and rendered
    scheduleVerdictSound(verdict) {
      this.cancelPendingResultSound();
      if (!this.enabled) return;

      this.pendingResultTimeout = setTimeout(() => {
        this.pendingResultTimeout = null;
        const v = String(verdict || '').toUpperCase();
        if (v === 'SAFE') {
          this.playSafe();
        } else if (v === 'HIGH_RISK') {
          this.playHighRisk();
        } else if (v === 'SUSPICIOUS') {
          this.playSuspicious();
        } else {
          this.playUnverified();
        }
      }, 2000); // 2-second delay after result is rendered
    },

    // Safe result: pleasant, positive ascending chime
    playSafe() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const notes = [
          { f: 523.25, t: 0, d: 0.35, v: 0.07 },    // C5
          { f: 659.25, t: 0.12, d: 0.45, v: 0.08 }, // E5
          { f: 783.99, t: 0.24, d: 0.7, v: 0.09 }   // G5
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);

          gain.gain.setValueAtTime(0.0001, ctx.currentTime + n.t);
          gain.gain.exponentialRampToValueAtTime(n.v, ctx.currentTime + n.t + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + n.d);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + n.t);
          osc.stop(ctx.currentTime + n.t + n.d);
        });
      } catch {}
    },

    // Suspicious result: descending caution warning chime
    playSuspicious() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const notes = [
          { f: 493.88, t: 0, d: 0.35, v: 0.08 },   // B4
          { f: 392.00, t: 0.16, d: 0.55, v: 0.09 }  // G4
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);

          gain.gain.setValueAtTime(0.0001, ctx.currentTime + n.t);
          gain.gain.exponentialRampToValueAtTime(n.v, ctx.currentTime + n.t + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + n.d);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + n.t);
          osc.stop(ctx.currentTime + n.t + n.d);
        });
      } catch {}
    },

    // High risk result: urgent double-pulse alert tone
    playHighRisk() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const pulses = [0, 0.2];

        pulses.forEach(tOffset => {
          [440, 660].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = idx === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + tOffset);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, ctx.currentTime + tOffset);

            gain.gain.setValueAtTime(0.0001, ctx.currentTime + tOffset);
            gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + tOffset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + tOffset + 0.18);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + tOffset);
            osc.stop(ctx.currentTime + tOffset + 0.2);
          });
        });
      } catch {}
    },

    // Unverified result: neutral gentle informational chime
    playUnverified() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
    }
  };

  // Initialize sound UI state
  soundEngine.updateUI();
  if (elements.soundToggleBtn) {
    elements.soundToggleBtn.addEventListener('click', () => soundEngine.toggle());
  }

  // ==========================================================================
  // Health Check & AI Connectivity
  // ==========================================================================
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`Health check returned status ${res.status}`);
      const data = await res.json();
      updateHealthUI(data);
    } catch (err) {
      updateHealthUI({
        status: 'error',
        ollama: {
          online: false,
          modelFound: false,
          configuredModel: state.aiStatus.configuredModel,
          availableModels: [],
          error: err.message
        }
      });
    }
  }

  function updateHealthUI(healthData) {
    const ollama = healthData.ollama || {};
    state.aiStatus = {
      online: !!ollama.online,
      modelFound: !!ollama.modelFound,
      configuredModel: ollama.configuredModel || 'gemma4:e2b',
      availableModels: ollama.availableModels || []
    };

    // Update Pill Status
    elements.statusDot.className = 'status-indicator-dot';
    if (ollama.online && ollama.modelFound) {
      elements.statusDot.classList.add('connected');
      elements.statusLabel.textContent = `Connected: ${ollama.configuredModel}`;
      elements.statusAlertBar.classList.add('hidden');
    } else if (ollama.online && !ollama.modelFound) {
      elements.statusDot.classList.add('warning');
      elements.statusLabel.textContent = `Model Missing: ${ollama.configuredModel}`;
      elements.alertMessage.textContent = `Ollama is active, but model '${ollama.configuredModel}' was not found. Available models: ${ollama.availableModels.join(', ') || 'none'}. Run 'ollama pull ${ollama.configuredModel}' in terminal.`;
      elements.statusAlertBar.classList.remove('hidden');
    } else {
      elements.statusDot.classList.add('offline');
      elements.statusLabel.textContent = 'Ollama Offline';
      elements.alertMessage.textContent = `Ollama is not running. Please start Ollama ('ollama serve' or open Ollama app) to enable local Gemma analysis.`;
      elements.statusAlertBar.classList.remove('hidden');
    }

    // Update Diagnostics Modal Fields
    if (elements.diagHost) elements.diagHost.textContent = ollama.baseUrl || 'http://127.0.0.1:11434';
    if (elements.diagModel) elements.diagModel.textContent = ollama.configuredModel || 'gemma4:e2b';
    if (elements.diagStatus) {
      elements.diagStatus.textContent = ollama.online 
        ? (ollama.modelFound ? 'Online & Model Ready' : 'Online (Model Missing)') 
        : 'Offline / Unreachable';
    }
    if (elements.diagAvailableModels) {
      elements.diagAvailableModels.textContent = ollama.availableModels && ollama.availableModels.length > 0 
        ? ollama.availableModels.join(', ') 
        : 'None detected';
    }
  }

  // Periodic health polling every 30 seconds
  setInterval(checkHealth, 30000);
  checkHealth();

  // Test AI Connection Button & Modal
  elements.testAiBtn.addEventListener('click', () => {
    elements.aiTestModal.classList.remove('hidden');
  });

  elements.alertActionBtn.addEventListener('click', () => {
    elements.aiTestModal.classList.remove('hidden');
  });

  elements.alertCloseBtn.addEventListener('click', () => {
    elements.statusAlertBar.classList.add('hidden');
  });

  const closeModal = () => elements.aiTestModal.classList.add('hidden');
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.dismissModalBtn.addEventListener('click', closeModal);

  elements.runDiagTestBtn.addEventListener('click', async () => {
    elements.diagOutput.textContent = 'Pinging configured Gemma model through Ollama...';
    elements.runDiagTestBtn.disabled = true;

    try {
      const res = await fetch('/api/test-ai', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        elements.diagOutput.textContent = `SUCCESS: Gemma responded in ${data.latencyMs}ms!\nModel: ${data.model}\nResponse: "${data.response}"\nReady for investigation.`;
        checkHealth();
      } else {
        elements.diagOutput.textContent = `ERROR: ${data.error || 'Test request failed.'}\n\nTroubleshooting tips:\n1. Check if Ollama is running: 'ollama list'\n2. Ensure model is installed: 'ollama pull ${state.aiStatus.configuredModel}'\n3. Check OLLAMA_MODEL in .env matches your installed model.`;
      }
    } catch (err) {
      elements.diagOutput.textContent = `CONNECTION FAILED: ${err.message}\nEnsure Ollama is started locally at http://127.0.0.1:11434.`;
    } finally {
      elements.runDiagTestBtn.disabled = false;
    }
  });

  // ==========================================================================
  // Mode Switching (Tabs)
  // ==========================================================================
  function switchTab(mode) {
    if (state.activeTab !== mode) {
      soundEngine.playClick();
    }
    state.activeTab = mode;
    elements.tabMessage.classList.toggle('active', mode === 'message');
    elements.tabImage.classList.toggle('active', mode === 'image');
    elements.tabUrl.classList.toggle('active', mode === 'url');

    elements.tabMessage.setAttribute('aria-selected', mode === 'message');
    elements.tabImage.setAttribute('aria-selected', mode === 'image');
    elements.tabUrl.setAttribute('aria-selected', mode === 'url');

    elements.panelMessage.classList.toggle('active', mode === 'message');
    elements.panelImage.classList.toggle('active', mode === 'image');
    elements.panelUrl.classList.toggle('active', mode === 'url');

    elements.errorCard.classList.add('hidden');
  }

  elements.tabMessage.addEventListener('click', () => switchTab('message'));
  elements.tabImage.addEventListener('click', () => switchTab('image'));
  elements.tabUrl.addEventListener('click', () => switchTab('url'));

  // ==========================================================================
  // Mode 1: Message / Text Analysis
  // ==========================================================================
  elements.messageInput.addEventListener('input', () => {
    const len = elements.messageInput.value.length;
    elements.charCounter.textContent = `${len.toLocaleString()} / 10,000`;
    elements.charCounter.style.color = len > 9800 ? 'var(--status-danger)' : 'var(--text-muted)';
  });

  elements.clearMessageBtn.addEventListener('click', () => {
    elements.messageInput.value = '';
    elements.charCounter.textContent = '0 / 10,000';
    elements.messageInput.focus();
  });

  elements.sampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sampleKey = btn.getAttribute('data-sample');
      if (SAMPLE_TEXTS[sampleKey]) {
        soundEngine.playClick();
        elements.messageInput.value = SAMPLE_TEXTS[sampleKey];
        elements.messageInput.dispatchEvent(new Event('input'));
        elements.messageInput.focus();
      }
    });
  });

  elements.analyzeMessageBtn.addEventListener('click', async () => {
    soundEngine.playClick();
    const text = elements.messageInput.value.trim();
    if (!text) {
      showError('Empty Input', 'Please paste or type a suspicious message or claim to analyze.');
      return;
    }
    if (text.length < 5) {
      showError('Message Too Short', 'Please enter at least 5 characters for a meaningful assessment.');
      return;
    }

    await runAnalysis('/api/analyze/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    }, 'message', text);
  });

  // ==========================================================================
  // Mode 2: Screenshot OCR Analysis
  // ==========================================================================
  // File drag & drop
  ['dragenter', 'dragover'].forEach(evt => {
    elements.dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      elements.dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    elements.dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('dragover');
    });
  });

  elements.dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  elements.dropZone.addEventListener('click', (e) => {
    // Prevent triggering file picker when clicking remove button
    if (e.target.closest('#removeImageBtn')) return;
    elements.fileInput.click();
  });

  elements.fileInput.addEventListener('change', () => {
    if (elements.fileInput.files && elements.fileInput.files.length > 0) {
      handleFileSelected(elements.fileInput.files[0]);
    }
  });

  function handleFileSelected(file) {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      showError('Unsupported File Format', `Selected file type '${file.type}' is not supported. Please upload a JPG, PNG, or WebP screenshot.`);
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      showError('File Too Large', `Screenshot size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 5 MB.`);
      return;
    }

    state.selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      elements.imagePreview.src = e.target.result;
      elements.fileName.textContent = file.name;
      elements.fileSize.textContent = `${(file.size / 1024).toFixed(0)} KB`;
      elements.dropZonePrompt.classList.add('hidden');
      elements.filePreviewCard.classList.remove('hidden');
      elements.analyzeImageBtn.disabled = false;
      elements.errorCard.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  function resetImageUpload() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.imagePreview.src = '';
    elements.dropZonePrompt.classList.remove('hidden');
    elements.filePreviewCard.classList.add('hidden');
    elements.analyzeImageBtn.disabled = true;
    elements.ocrEditContainer.classList.add('hidden');
    elements.ocrTextEdit.value = '';
  }

  elements.removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetImageUpload();
  });

  elements.clearImageBtn.addEventListener('click', resetImageUpload);

  elements.analyzeImageBtn.addEventListener('click', async () => {
    soundEngine.playClick();
    // If OCR text was already extracted and edited, allow re-analyzing edited text directly!
    const editedOcr = elements.ocrTextEdit.value.trim();
    if (!elements.ocrEditContainer.classList.contains('hidden') && editedOcr.length >= 5) {
      await runAnalysis('/api/analyze/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editedOcr })
      }, 'screenshot', editedOcr);
      return;
    }

    if (!state.selectedFile) {
      showError('No Image Selected', 'Please select or drag a screenshot image first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', state.selectedFile);

    await runAnalysis('/api/analyze/image', {
      method: 'POST',
      body: formData
    }, 'screenshot');
  });

  // ==========================================================================
  // Mode 3: Website URL Analysis
  // ==========================================================================
  elements.clearUrlBtn.addEventListener('click', () => {
    elements.urlInput.value = '';
    elements.urlInput.focus();
  });

  elements.urlSampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        soundEngine.playClick();
        elements.urlInput.value = url;
        elements.urlInput.focus();
      }
    });
  });

  elements.analyzeUrlBtn.addEventListener('click', async () => {
    soundEngine.playClick();
    const url = elements.urlInput.value.trim();
    if (!url) {
      showError('Empty URL', 'Please enter a website or article URL to inspect.');
      return;
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        showError('Invalid Protocol', `Only http:// and https:// URLs are supported. '${parsed.protocol}' is forbidden.`);
        return;
      }
    } catch {
      showError('Malformed URL', 'Please enter a valid website address starting with https:// or http://');
      return;
    }

    await runAnalysis('/api/analyze/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    }, 'url', url);
  });

  // Shortcut: Ctrl+Enter or Cmd+Enter to submit
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (state.activeTab === 'message') elements.analyzeMessageBtn.click();
      else if (state.activeTab === 'image' && !elements.analyzeImageBtn.disabled) elements.analyzeImageBtn.click();
      else if (state.activeTab === 'url') elements.analyzeUrlBtn.click();
    }
  });

  // ==========================================================================
  // Loading State & Step Management
  // ==========================================================================
  function startLoading(sourceType) {
    soundEngine.cancelPendingResultSound();
    elements.loadingState.classList.remove('hidden');
    elements.resultsDashboard.classList.add('hidden');
    elements.errorCard.classList.add('hidden');

    // Pulse dot to analyzing
    elements.statusDot.className = 'status-indicator-dot analyzing';
    elements.statusLabel.textContent = 'Analyzing...';

    // Disable action buttons
    elements.analyzeMessageBtn.disabled = true;
    elements.analyzeImageBtn.disabled = true;
    elements.analyzeUrlBtn.disabled = true;

    state.loadingSeconds = 0;
    elements.loadingTimer.textContent = 'Elapsed time: 0s';
    clearInterval(state.loadingTimerInterval);
    state.loadingTimerInterval = setInterval(() => {
      state.loadingSeconds++;
      elements.loadingTimer.textContent = `Elapsed time: ${state.loadingSeconds}s`;

      if (state.loadingSeconds >= 3) {
        elements.step1.classList.remove('active');
        elements.step1.classList.add('completed');
        elements.step2.classList.add('active');
      }
      if (state.loadingSeconds >= 8) {
        elements.step2.classList.remove('active');
        elements.step2.classList.add('completed');
        elements.step3.classList.add('active');
      }
    }, 1000);

    // Dynamic titles based on mode
    if (sourceType === 'screenshot') {
      elements.loadingTitle.textContent = 'Scanning Screenshot with Tesseract OCR & Gemma...';
      elements.loadingSubtitle.textContent = 'Extracting optical text, verifying redactions, and querying local Gemma model.';
    } else if (sourceType === 'url') {
      elements.loadingTitle.textContent = 'Safely Fetching Webpage & Analyzing Content...';
      elements.loadingSubtitle.textContent = 'Enforcing SSRF defense, filtering HTML clutter, and querying local Gemma model.';
    } else {
      elements.loadingTitle.textContent = 'Investigating Content with Local Gemma AI...';
      elements.loadingSubtitle.textContent = 'Scanning for deceptive phrasing, pressure tactics, and missing evidence.';
    }

    elements.step1.className = 'step-item active';
    elements.step2.className = 'step-item';
    elements.step3.className = 'step-item';

    elements.loadingState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function stopLoading() {
    clearInterval(state.loadingTimerInterval);
    elements.loadingState.classList.add('hidden');

    elements.analyzeMessageBtn.disabled = false;
    elements.analyzeImageBtn.disabled = !state.selectedFile;
    elements.analyzeUrlBtn.disabled = false;

    // Reset status pill
    checkHealth();
  }

  // ==========================================================================
  // Analysis Controller
  // ==========================================================================
  async function runAnalysis(endpoint, fetchOptions, sourceType, originalInput = '') {
    startLoading(sourceType);

    try {
      const response = await fetch(endpoint, fetchOptions);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server responded with status code ${response.status}`);
      }

      state.lastReport = data.report;
      state.lastAnalysisType = sourceType;

      // Handle OCR specific data
      if (sourceType === 'screenshot' && data.ocr) {
        state.lastContextText = data.ocr.extractedText || '';
        elements.ocrTextEdit.value = data.ocr.extractedText || '';
        elements.ocrConfidenceBadge.textContent = `Confidence: ${data.ocr.confidence || 0}%`;
        elements.ocrEditContainer.classList.remove('hidden');
      } else if (sourceType === 'url' && data.pageInfo) {
        const info = data.pageInfo;
        let context = `Requested URL: ${info.requestedUrl || info.url || ''}\n`;
        if (info.finalUrl && info.requestedUrl && info.finalUrl !== info.requestedUrl) {
          context += `Final URL (Redirected): ${info.finalUrl} (${info.redirectCount || 1} redirect${(info.redirectCount || 1) > 1 ? 's' : ''})\n`;
        }
        context += `Page Title: ${info.title || 'Untitled'}\n`;
        if (info.description) {
          context += `Meta Description: ${info.description}\n`;
        }
        context += `\nExtracted Content Snippet:\n${info.extractedSnippet || ''}`;
        state.lastContextText = context;
      } else {
        state.lastContextText = originalInput;
      }

      renderReport(data.report, sourceType, data);
    } catch (err) {
      showError('Analysis Failed', err.message);
    } finally {
      stopLoading();
    }
  }

  // ==========================================================================
  // Report Dashboard Rendering (Strict Safe DOM Generation — Zero XSS)
  // ==========================================================================
  function renderReport(report, sourceType, rawResponse) {
    elements.resultsDashboard.classList.remove('hidden');

    // Source Type Badge
    const sourceLabels = {
      message: 'Source: Text Message / Forward',
      screenshot: 'Source: Screenshot OCR',
      url: 'Source: Website URL'
    };
    elements.reportSourceType.textContent = sourceLabels[sourceType] || 'Source: Submitted Content';

    // Latency & Model Pills
    const latency = report.meta && report.meta.durationMs 
      ? `⚡ ${(report.meta.durationMs / 1000).toFixed(1)}s` 
      : '⚡ Local';
    elements.reportLatency.textContent = latency;
    elements.reportModel.textContent = `Model: ${report.meta?.model || state.aiStatus.configuredModel}`;

    // Determine Canonical Verdict (SAFE, SUSPICIOUS, HIGH_RISK, UNVERIFIED)
    const rawVerdict = String(report.verdict || report.assessment || '').toUpperCase().trim();
    let verdict = 'UNVERIFIED';
    let verdictLabel = report.verdictLabel || report.assessment || 'Needs Verification';

    if (rawVerdict.includes('HIGH') || rawVerdict.includes('CRITICAL') || rawVerdict.includes('SEVERE')) {
      verdict = 'HIGH_RISK';
      verdictLabel = report.verdictLabel || 'High Risk Threat Detected';
    } else if (rawVerdict.includes('SUSPICIOUS') || rawVerdict.includes('SCAM') || rawVerdict.includes('PHISH') || rawVerdict.includes('WARNING')) {
      verdict = 'SUSPICIOUS';
      verdictLabel = report.verdictLabel || 'Suspicious Indicators Found';
    } else if (rawVerdict.includes('SAFE') || rawVerdict.includes('LEGITIMATE') || rawVerdict.includes('NO MAJOR') || rawVerdict.includes('NO SIGNIFICANT')) {
      verdict = 'SAFE';
      verdictLabel = report.verdictLabel || 'No Significant Threats Detected';
    } else {
      verdict = 'UNVERIFIED';
      verdictLabel = report.verdictLabel || 'Needs Verification';
    }

    // Apply Verdict Visual Category to Banner
    elements.assessmentHero.className = 'assessment-hero';

    if (verdict === 'SAFE') {
      elements.assessmentHero.classList.add('safe');
      elements.assessmentIcon.textContent = '🛡️';
      elements.assessmentText.textContent = verdictLabel;
      if (elements.criticalWarningBanner) elements.criticalWarningBanner.classList.add('hidden');
    } else if (verdict === 'HIGH_RISK') {
      elements.assessmentHero.classList.add('high-risk');
      elements.assessmentIcon.textContent = '🚨';
      elements.assessmentText.textContent = verdictLabel;
      if (elements.criticalWarningBanner) elements.criticalWarningBanner.classList.remove('hidden');
    } else if (verdict === 'SUSPICIOUS') {
      elements.assessmentHero.classList.add('suspicious');
      elements.assessmentIcon.textContent = '⚠️';
      elements.assessmentText.textContent = verdictLabel;
      if (elements.criticalWarningBanner) elements.criticalWarningBanner.classList.add('hidden');
    } else {
      elements.assessmentHero.classList.add('unverified');
      elements.assessmentIcon.textContent = '🔍';
      elements.assessmentText.textContent = verdictLabel;
      if (elements.criticalWarningBanner) elements.criticalWarningBanner.classList.add('hidden');
    }

    // Risk Level Badge
    const rawRisk = String(report.riskLevel || 'UNKNOWN').toUpperCase().trim();
    let displayRisk = 'UNKNOWN';
    if (rawRisk.includes('HIGH')) displayRisk = 'HIGH';
    else if (rawRisk.includes('MED')) displayRisk = 'MEDIUM';
    else if (rawRisk.includes('LOW')) displayRisk = 'LOW';
    else if (verdict === 'HIGH_RISK') displayRisk = 'HIGH';
    else if (verdict === 'SUSPICIOUS') displayRisk = 'MEDIUM';
    else if (verdict === 'SAFE') displayRisk = 'LOW';
    else displayRisk = 'UNKNOWN';

    elements.riskValue.textContent = displayRisk;
    elements.riskValue.className = 'risk-val';
    if (displayRisk === 'HIGH') elements.riskValue.classList.add('risk-high');
    else if (displayRisk === 'MEDIUM') elements.riskValue.classList.add('risk-medium');
    else if (displayRisk === 'LOW') elements.riskValue.classList.add('risk-low');
    else elements.riskValue.classList.add('risk-unknown');

    // Summary (Safe textContent)
    elements.assessmentSummary.textContent = report.summary || 'No summary provided by the model.';

    // Source Context Card
    if (state.lastContextText) {
      elements.contextCard.classList.remove('hidden');
      elements.contextHeaderLabel.textContent = sourceType === 'screenshot' 
        ? 'Extracted OCR Text' 
        : (sourceType === 'url' ? 'Extracted Website Context' : 'Submitted Content');
      elements.contextContent.textContent = state.lastContextText;
    } else {
      elements.contextCard.classList.add('hidden');
    }

    // Warning Signs List
    elements.warningSignsList.innerHTML = '';
    const warningSigns = Array.isArray(report.warningSigns) ? report.warningSigns : [];
    if (warningSigns.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'warning-sign-item';
      emptyItem.style.borderLeftColor = 'var(--status-success)';
      emptyItem.textContent = 'No explicit manipulative phrases or overt scam indicators were detected in this content.';
      elements.warningSignsList.appendChild(emptyItem);
    } else {
      warningSigns.forEach(ws => {
        const item = document.createElement('div');
        item.className = 'warning-sign-item';

        const evidenceText = String(ws.evidence || ws.phrase || '').trim();
        if (evidenceText) {
          const phrasePill = document.createElement('div');
          phrasePill.className = 'warning-phrase-pill';
          phrasePill.textContent = `"${evidenceText}"`;
          item.appendChild(phrasePill);
        }

        const reason = document.createElement('div');
        reason.className = 'warning-reason';
        reason.textContent = ws.reason || 'Identified pattern of concern.';
        item.appendChild(reason);

        elements.warningSignsList.appendChild(item);
      });
    }

    // Supporting Evidence
    const supportingItems = report.supportingEvidence || report.evidenceAvailable;
    populateList(
      elements.evidenceAvailableList,
      supportingItems,
      verdict === 'SAFE' ? 'Consistent rhetoric and absence of phishing tactics.' : 'No concrete evidence establishing legitimacy present in content.'
    );

    // Evidence Gaps & Uncertainty
    populateList(elements.evidenceGapsList, report.evidenceGaps, 'No critical information gaps identified.');

    // Verification Steps
    populateList(elements.verificationStepsList, report.verificationSteps, 'Search independent news organizations for corroboration.');

    // Safe Actions
    populateList(elements.safeActionsList, report.safeActions, 'Do not share unverified claims with others.');

    // Limitations
    populateList(elements.limitationsList, report.limitations, 'Analysis based strictly on textual patterns and observed URL characteristics.');

    // Scroll smoothly to results
    elements.resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Schedule verdict sound effect with exact 2-second delay after result is rendered
    soundEngine.scheduleVerdictSound(verdict);
  }

  function populateList(container, items, fallbackText) {
    container.innerHTML = '';
    const array = Array.isArray(items) && items.length > 0 ? items : [fallbackText];
    array.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      container.appendChild(li);
    });
  }

  // Copy raw context
  elements.copyContextBtn.addEventListener('click', () => {
    if (state.lastContextText) {
      navigator.clipboard.writeText(state.lastContextText).then(() => {
        elements.copyContextBtn.textContent = '✓ Copied!';
        setTimeout(() => { elements.copyContextBtn.textContent = 'Copy Raw Content'; }, 2000);
      });
    }
  });

  // Copy Full Investigation Report
  elements.copyReportBtn.addEventListener('click', () => {
    if (!state.lastReport) return;
    const textReport = formatReportAsText(state.lastReport, state.lastAnalysisType);
    navigator.clipboard.writeText(textReport).then(() => {
      elements.copyReportBtn.querySelector('span').textContent = '✓ Copied!';
      setTimeout(() => {
        elements.copyReportBtn.querySelector('span').textContent = 'Copy Full Report';
      }, 2000);
    });
  });

  // Download Report as .txt
  elements.downloadReportBtn.addEventListener('click', () => {
    if (!state.lastReport) return;
    const textReport = formatReportAsText(state.lastReport, state.lastAnalysisType);
    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PhantomCheck-Report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  elements.analyzeAnotherBtn.addEventListener('click', () => {
    document.querySelector('.investigation-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function formatReportAsText(rep, type) {
    const divider = '='.repeat(60);
    const subDivider = '-'.repeat(60);

    let text = `${divider}\nPHANTOMCHECK AI — INVESTIGATION REPORT\n${divider}\n\n`;
    text += `Source Type:     ${type.toUpperCase()}\n`;
    text += `Verdict:         ${rep.verdict || 'UNVERIFIED'} (${rep.verdictLabel || rep.assessment || 'Needs Verification'})\n`;
    text += `Risk Level:      ${rep.riskLevel || 'UNKNOWN'}\n`;
    text += `Generated At:    ${new Date().toLocaleString()}\n`;
    text += `Local AI Model:  ${rep.meta?.model || 'Gemma AI'}\n\n`;

    text += `EXECUTIVE SUMMARY:\n${subDivider}\n${rep.summary}\n\n`;

    if (rep.warningSigns && rep.warningSigns.length > 0) {
      text += `DETECTED WARNING SIGNS & TACTICS:\n${subDivider}\n`;
      rep.warningSigns.forEach((ws, i) => {
        const evidenceStr = ws.evidence || ws.phrase || 'Observed indicator';
        text += `[${i + 1}] Evidence: "${evidenceStr}"\n    Reason:   ${ws.reason}\n\n`;
      });
    }

    const supportingItems = rep.supportingEvidence || rep.evidenceAvailable;
    if (supportingItems && supportingItems.length > 0) {
      text += `SUPPORTING EVIDENCE IN CONTENT:\n${subDivider}\n`;
      supportingItems.forEach(item => { text += `• ${item}\n`; });
      text += '\n';
    }

    if (rep.evidenceGaps && rep.evidenceGaps.length > 0) {
      text += `EVIDENCE GAPS & UNCERTAINTIES:\n${subDivider}\n`;
      rep.evidenceGaps.forEach(item => { text += `• ${item}\n`; });
      text += '\n';
    }

    if (rep.verificationSteps && rep.verificationSteps.length > 0) {
      text += `RECOMMENDED VERIFICATION STEPS:\n${subDivider}\n`;
      rep.verificationSteps.forEach((step, i) => { text += `${i + 1}. ${step}\n`; });
      text += '\n';
    }

    if (rep.safeActions && rep.safeActions.length > 0) {
      text += `SAFE IMMEDIATE ACTIONS:\n${subDivider}\n`;
      rep.safeActions.forEach(act => { text += `[✓] ${act}\n`; });
      text += '\n';
    }

    if (rep.limitations && rep.limitations.length > 0) {
      text += `ANALYSIS LIMITATIONS:\n${subDivider}\n`;
      rep.limitations.forEach(lim => { text += `- ${lim}\n`; });
      text += '\n';
    }

    text += `${divider}\nSafety Note: Automated analysis by PhantomCheck AI.\nAlways verify critical information through official channels.\n${divider}\n`;
    return text;
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  function showError(title, message) {
    elements.errorTitle.textContent = title;
    elements.errorMessage.textContent = message;
    elements.errorCard.classList.remove('hidden');
    elements.errorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  elements.dismissErrorBtn.addEventListener('click', () => {
    elements.errorCard.classList.add('hidden');
  });

  elements.retryErrorBtn.addEventListener('click', () => {
    elements.errorCard.classList.add('hidden');
    if (state.activeTab === 'message') elements.analyzeMessageBtn.click();
    else if (state.activeTab === 'image') elements.analyzeImageBtn.click();
    else if (state.activeTab === 'url') elements.analyzeUrlBtn.click();
  });
});
