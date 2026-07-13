(() => {
  const slider        = document.getElementById('slider');
  const sliderFill     = document.getElementById('sliderFill');
  const sliderCard      = document.getElementById('sliderCard');
  const crackLine        = document.getElementById('crackLine');
  const percentLabel      = document.getElementById('percentLabel');
  const confirmBtn          = document.getElementById('confirmBtn');
  const retryBtn             = document.getElementById('retryBtn');

  const screenQuestion  = document.getElementById('screen-question');
  const screenTransition = document.getElementById('screen-transition');
  const screenScene       = document.getElementById('screen-scene');
  const failOverlay         = document.getElementById('failOverlay');

  const FAST_THRESHOLD_MS = 550; // الوصول لـ 100% خلال هذه المدة يُعتبر سحبًا سريعًا
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

  let dragStartTime = null;
  let successTriggered = false;
  let released = false;

  function toArabicNumber(num) {
    return String(num).split('').map(d => arabicDigits[d] ?? d).join('');
  }

  function updateVisual(value) {
    sliderFill.style.width = value + '%';
    percentLabel.textContent = toArabicNumber(value) + '٪';
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
    // إذا لم يتحقق الشرط السريع، اعرض زر التأكيد
    confirmBtn.classList.remove('hidden');
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

  function triggerSuccess() {
    successTriggered = true;
    slider.disabled = true;
    confirmBtn.classList.add('hidden');

    vibrateIfPossible([40, 30, 60]);
    playPopSound();

    sliderCard.classList.add('crack');

    // بعد تأثير الانكسار، ننتقل للشاشة الانتقالية
    setTimeout(() => {
      screenQuestion.classList.remove('active');
      screenTransition.classList.add('active');
    }, 520);

    // بعد الشاشة الانتقالية القصيرة، تبدأ رسوم نمو الوردة
    setTimeout(() => {
      screenTransition.classList.remove('active');
      screenScene.classList.add('active');
      // إضافة الكلاس يشغّل كل تسلسل الحركات المعرّف في CSS
      requestAnimationFrame(() => screenScene.classList.add('play'));
    }, 520 + 1100);
  }

  function showFailMessage() {
    failOverlay.classList.remove('hidden');
  }

  function resetExperience() {
    successTriggered = false;
    released = false;
    dragStartTime = null;
    slider.disabled = false;
    slider.value = 0;
    updateVisual(0);

    confirmBtn.classList.add('hidden');
    sliderCard.classList.remove('crack');

    failOverlay.classList.add('hidden');
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

  confirmBtn.addEventListener('click', showFailMessage);
  retryBtn.addEventListener('click', resetExperience);

  updateVisual(0);
})();
