(() => {
  const slider        = document.getElementById('slider');
  const sliderFill     = document.getElementById('sliderFill');
  const sliderCard      = document.getElementById('sliderCard');
  const crackLine        = document.getElementById('crackLine');
  const percentLabel      = document.getElementById('percentLabel');
  const btnRow               = document.getElementById('btnRow');
  const sureBtn                = document.getElementById('sureBtn');
  const retryBtnEarly            = document.getElementById('retryBtnEarly');
  const sliderGlow                = document.getElementById('sliderGlow');
  const thumbHalo                   = document.getElementById('thumbHalo');

  const screenQuestion  = document.getElementById('screen-question');
  const screenTransition = document.getElementById('screen-transition');
  const screenScene       = document.getElementById('screen-scene');
  const screenFail          = document.getElementById('screen-fail');

  const noticeOverlay = document.getElementById('noticeOverlay');
  const noticeOkBtn     = document.getElementById('noticeOkBtn');

  const flowerAudio = document.getElementById('flowerAudio');
  const sadAudio     = document.getElementById('sadAudio');

  const FAST_THRESHOLD_MS = 550; // الوصول لـ 100% خلال هذه المدة يُعتبر سحبًا سريعًا
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

  // توقيت الانتقال إلى مشهد الوردة (شاشة الانتقال القصيرة)
  const TRANSITION_DELAY_MS = 520;      // بعد تأثير الانكسار
  const SCENE_START_DELAY_MS = 1100;    // مدة عرض شاشة الانتقال

  let dragStartTime = null;
  let successTriggered = false;
  let released = false;

  function toArabicNumber(num) {
    return String(num).split('').map(d => arabicDigits[d] ?? d).join('');
  }

  function updateVisual(value) {
    sliderFill.style.width = value + '%';
    percentLabel.textContent = toArabicNumber(value) + '٪';

    // كلما اقترب المؤشر من ١٠٠٪: يزداد التوهج والهالة الضوئية حوله دون تغيير أي منطق موجود
    const intensity = Math.min(1, value / 100);
    if (sliderGlow) {
      sliderGlow.style.setProperty('--glow-i', (intensity * 0.9).toFixed(3));
      sliderGlow.style.setProperty('--glow-x', value + '%');
    }
    if (thumbHalo) {
      const wrapWidth = slider.offsetWidth || 0;
      const thumbX = wrapWidth * (value / 100);
      thumbHalo.style.setProperty('--halo-x', thumbX + 'px');
      thumbHalo.style.setProperty('--halo-i', (intensity * 0.75).toFixed(3));
    }
    if (sliderFill) {
      sliderFill.style.boxShadow = `0 0 ${8 + intensity * 22}px rgba(255,45,67,${0.3 + intensity * 0.45})`;
    }
  }

  function startDrag() {
    if (successTriggered) return;
    dragStartTime = performance.now();
    released = false;
  }

  function onInput(e) {
    const value = Number(e.target.value);
    updateVisual(value);

    if (successTriggered) return;

    if (value >= 100) {
      const elapsed = dragStartTime ? performance.now() - dragStartTime : Infinity;
      if (elapsed <= FAST_THRESHOLD_MS) {
        triggerSuccess();
      }
    }
  }

  function endDrag() {
    if (successTriggered) return;
    released = true;
    // إذا لم يتحقق الشرط السريع، اعرض الزرين
    btnRow.classList.remove('hidden');
    dragStartTime = null;
  }

  function vibrateIfPossible(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* تجاهل */ }
    }
  }

  function playPopSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) { /* الصوت اختياري، تجاهل أي خطأ */ }
  }

  function playAudioSafely(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      const playPromise = audioEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => { /* قد يمنع المتصفح التشغيل التلقائي، تجاهل بصمت */ });
      }
    } catch (e) { /* تجاهل */ }
  }

  function stopAudioSafely(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (e) { /* تجاهل */ }
  }

  function triggerSuccess() {
    successTriggered = true;
    slider.disabled = true;
    btnRow.classList.add('hidden');

    vibrateIfPossible([40, 30, 60]);
    playPopSound();

    sliderCard.classList.add('crack');

    // بعد تأثير الانكسار، ننتقل للشاشة الانتقالية
    setTimeout(() => {
      screenQuestion.classList.remove('active');
      screenTransition.classList.add('active');
    }, TRANSITION_DELAY_MS);

    // بعد الشاشة الانتقالية القصيرة، تبدأ رسوم نمو الوردة
    setTimeout(() => {
      screenTransition.classList.remove('active');
      screenScene.classList.add('active');
      // إضافة الكلاس يشغّل كل تسلسل الحركات المعرّف في CSS
      requestAnimationFrame(() => {
        screenScene.classList.add('play');
        // تشغيل الموسيقى بمجرد بدء تشكّل الوردة (بداية نمو الساق) وليس بعد اكتمالها
        playAudioSafely(flowerAudio);
      });
    }, TRANSITION_DELAY_MS + SCENE_START_DELAY_MS);
  }

  function showFailMessage() {
    playAudioSafely(sadAudio);
    screenQuestion.classList.remove('active');
    screenFail.classList.add('active');
  }

  function resetExperience() {
    successTriggered = false;
    released = false;
    dragStartTime = null;
    slider.disabled = false;
    slider.value = 0;
    updateVisual(0);

    btnRow.classList.add('hidden');
    sliderCard.classList.remove('crack');

    stopAudioSafely(flowerAudio);
    stopAudioSafely(sadAudio);

    screenFail.classList.remove('active');
    screenScene.classList.remove('active', 'play');
    screenTransition.classList.remove('active');
    screenQuestion.classList.add('active');
  }

  // أحداث السحب — تدعم الفأرة واللمس
  slider.addEventListener('pointerdown', startDrag);
  slider.addEventListener('touchstart', startDrag, { passive: true });

  slider.addEventListener('input', onInput);

  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('touchend', endDrag);
  slider.addEventListener('change', endDrag);

  sureBtn.addEventListener('click', showFailMessage);
  retryBtnEarly.addEventListener('click', resetExperience);

  // التنويه: يظهر مرة واحدة فقط عند دخول الموقع، قبل استخدام الشريط، ولا يظهر مرة أخرى أثناء نفس الزيارة
  function initNotice() {
    if (!noticeOverlay || !noticeOkBtn) return;

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem('pineappleNoticeSeen') === '1';
    } catch (e) { /* تجاهل، بعض المتصفحات قد تمنع sessionStorage */ }

    if (alreadySeen) {
      noticeOverlay.classList.add('notice-hidden');
      slider.disabled = false;
      return;
    }

    slider.disabled = true;
    requestAnimationFrame(() => {
      noticeOverlay.classList.add('active');
    });

    noticeOkBtn.addEventListener('click', () => {
      noticeOverlay.classList.remove('active');
      slider.disabled = successTriggered ? true : false;
      try {
        sessionStorage.setItem('pineappleNoticeSeen', '1');
      } catch (e) { /* تجاهل */ }
      setTimeout(() => {
        noticeOverlay.classList.add('notice-hidden');
      }, 520);
    });
  }

  initNotice();

  updateVisual(0);
})();
