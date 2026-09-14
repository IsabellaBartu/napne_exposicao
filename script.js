(function () {
  'use strict';

  const STORAGE_KEY = 'napne-a11y-settings-v1';
  const defaults = {
    fontSize: 100,
    lineHeight: 1.6,
    letterSpacing: 0,
    contrast: 'normal',
    underlineLinks: false,
    reduceMotion: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const panel = $('#accessibility-panel');
  const toggle = $('#accessibility-toggle');
  const close = $('#accessibility-close');

  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...defaults, ...(stored || {}) };
    } catch (error) {
      return { ...defaults };
    }
  }

  function saveSettings(settings) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (error) { /* storage unavailable */ }
  }

  function applySettings(settings) {
    const root = document.documentElement;
    document.body.classList.toggle('contrast-high', settings.contrast === 'high');
    document.body.classList.toggle('contrast-invert', settings.contrast === 'invert');
    document.body.classList.toggle('underline-links', settings.underlineLinks);
    document.body.classList.toggle('reduce-motion', settings.reduceMotion);
    root.style.setProperty('--font-scale', String(settings.fontSize / 100));
    root.style.setProperty('--line-height', String(settings.lineHeight));
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);

    const fontRange = $('#font-size-range');
    const lineRange = $('#line-height-range');
    const letterRange = $('#letter-spacing-range');
    if (fontRange) fontRange.value = settings.fontSize;
    if (lineRange) lineRange.value = settings.lineHeight;
    if (letterRange) letterRange.value = settings.letterSpacing;

    const fontValue = $('#font-size-value');
    const lineValue = $('#line-height-value');
    const letterValue = $('#letter-spacing-value');
    if (fontValue) fontValue.textContent = `${settings.fontSize}%`;
    if (lineValue) lineValue.textContent = Number(settings.lineHeight).toFixed(1);
    if (letterValue) letterValue.textContent = `${Number(settings.letterSpacing).toFixed(2)}em`;

    const underline = $('#underline-links');
    const motion = $('#reduce-motion');
    if (underline) underline.checked = settings.underlineLinks;
    if (motion) motion.checked = settings.reduceMotion;

    $$('[data-contrast]').forEach(button => {
      const active = button.dataset.contrast === settings.contrast;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  let settings = loadSettings();
  applySettings(settings);

  function updateSettings(changes) {
    settings = { ...settings, ...changes };
    applySettings(settings);
    saveSettings(settings);
  }

  function openAccessibility() {
    if (!panel || !toggle) return;
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    const firstControl = $('input, button', panel);
    if (firstControl) firstControl.focus();
  }

  function closeAccessibility() {
    if (!panel || !toggle) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }

  if (toggle) toggle.addEventListener('click', () => panel.hidden ? openAccessibility() : closeAccessibility());
  if (close) close.addEventListener('click', closeAccessibility);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel && !panel.hidden) closeAccessibility();
  });

  const fontRange = $('#font-size-range');
  const lineRange = $('#line-height-range');
  const letterRange = $('#letter-spacing-range');
  if (fontRange) fontRange.addEventListener('input', e => updateSettings({ fontSize: Number(e.target.value) }));
  if (lineRange) lineRange.addEventListener('input', e => updateSettings({ lineHeight: Number(e.target.value) }));
  if (letterRange) letterRange.addEventListener('input', e => updateSettings({ letterSpacing: Number(e.target.value) }));

  $$('[data-contrast]').forEach(button => button.addEventListener('click', () => updateSettings({ contrast: button.dataset.contrast })));

  const underline = $('#underline-links');
  const motion = $('#reduce-motion');
  if (underline) underline.addEventListener('change', e => updateSettings({ underlineLinks: e.target.checked }));
  if (motion) motion.addEventListener('change', e => updateSettings({ reduceMotion: e.target.checked }));

  const reset = $('#reset-accessibility');
  if (reset) reset.addEventListener('click', () => {
    settings = { ...defaults };
    applySettings(settings);
    saveSettings(settings);
  });

  // SpeechSynthesis controls on exhibition pages.
  const speakButton = $('#speak-description');
  const stopButton = $('#stop-description');
  const speechStatus = $('#speech-status');
  const description = $('#audio-description-text');

  function speakDescription() {
    if (!('speechSynthesis' in window) || !description) {
      if (speechStatus) speechStatus.textContent = 'A audiodescrição por voz não está disponível neste navegador.';
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(description.textContent.trim());
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.onstart = () => { if (speechStatus) speechStatus.textContent = 'Audiodescrição em reprodução.'; };
    utterance.onend = () => { if (speechStatus) speechStatus.textContent = 'Audiodescrição finalizada.'; };
    utterance.onerror = () => { if (speechStatus) speechStatus.textContent = 'Não foi possível reproduzir a audiodescrição.'; };
    window.speechSynthesis.speak(utterance);
  }

  function stopDescription() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (speechStatus) speechStatus.textContent = 'Audiodescrição interrompida.';
  }

  if (speakButton) speakButton.addEventListener('click', speakDescription);
  if (stopButton) stopButton.addEventListener('click', stopDescription);
  window.addEventListener('beforeunload', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });
})();
