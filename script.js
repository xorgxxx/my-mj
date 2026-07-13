(() => {
  const slider        = document.getElementById('slider');
  const sliderFill     = document.getElementById('sliderFill');
  const sliderCard      = document.getElementById('sliderCard');
  const crackLine        = document.getElementById('crackLine');
  const percentLabel      = document.getElementById('percentLabel');
  const btnRow               = document.getElementById('btnRow');
  const sureBtn                = document.getElementById('sureBtn');
  const retryBtnEarly            = document.getElementById('retryBtnEarly');

  const screenQuestion  = document.getElementById('screen-question');
  const screenTransition = document.getElementById('screen-transition');
  const screenScene       = document.getElementById('screen-scene');
  const failOverlay         = document.getElementById('failOverlay');
  
  // العناصر المضافة حديثاً للتحكم السينمائي والمشهد الختامي
  const pineappleGratitudeText = document.getElementById('pineappleGratitudeText');
  const cinematicEndingScene  = document.getElementById('cinematicEndingScene');
  const plant                 = document.getElementById('plant');
  const finalMessage          = document.getElementById('finalMessage');

  const flowerAudio = document.getElementById('flowerAudio');
  const sadAudio     = document.getElementById('sadAudio');

  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

  // توقيت الانتقال السينمائي إلى مشهد الوردة
  const TRANSITION_DELAY_MS = 500;      
  const SCENE_START_DELAY_MS = 1200;    

  let successTriggered = false;
  let userInteractedWithAudio = false;

  // تسجيل أول تفاعل للمستخدم لضمان تشغيل الموسيقى في حال حظر المتصفح للتشغيل التلقائي
  const setupAudioAutoplayFallback = () => {
    if (userInteractedWithAudio) return;
    userInteractedWithAudio = true;
    if (successTriggered) {
      playAudioSafely(flowerAudio);
    }
    // إزالة المستمعين بعد التفاعل الأول
    window.removeEventListener('click', setupAudioAutoplayFallback);
    window.removeEventListener('touchstart', setupAudioAutoplayFallback);
  };
  window.addEventListener('click', setupAudioAutoplayFallback);
  window.addEventListener('touchstart', setupAudioAutoplayFallback, { passive: true });

  function toArabicNumber(num) {
    return String(num).split('').map(d => arabicDigits[d] ?? d).join('');
  }

  function updateVisual(value) {
    sliderFill.style.width = value + '%';
    percentLabel.textContent = toArabicNumber(value) + '٪';

    // تأثيرات ديناميكية فخمة تزداد كلما اقتربت النسبة من 100%
    const factor = value / 100;
    
    // زيادة توهج شريط السحب وقوة اللون الأحمر اللامع تدريجياً
    sliderFill.style.boxShadow = `0 0 ${10 + factor * 25}px rgba(255, 18, 43, ${0.4 + factor * 0.6})`;
    sliderCard.style.borderColor = `rgba(255, 45, 67, ${0.15 + factor * 0.55})`;
    sliderCard.style.boxShadow = `0 25px 50px rgba(0, 0, 0, 0.9), 0 0 ${20 + factor * 30}px rgba(255, 45, 67, ${factor * 0.35})`;
    
    // إضاءة حول المؤشر والنسبة المئوية تزداد بريقاً
    percentLabel.style.color = `rgb(255, ${77 + (1 - factor) * 100}, ${97 + (1 - factor) * 100})`;
    percentLabel.style.textShadow = `0 0 ${8 + factor * 16}px rgba(255, 45, 67, ${0.5 + factor * 0.5})`;
  }

  function onInput(e) {
    const value = Number(e.target.value);
    updateVisual(value);

    if (successTriggered) return;

    // بمجرد وصول المؤشر إلى 100% ينتقل مباشرة وبسلاسة تامة دون شروط تعجيزية
    if (value >= 100) {
      triggerSuccess();
    }
  }

  function endDrag() {
    if (successTriggered) return;
    // الأزرار تظهر فقط كخيار إضافي للمستخدم طالما لم يصل للـ 100%
    btnRow.classList.remove('hidden');
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
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) { /* تجاهل بصمت */ }
  }

  function playAudioSafely(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      const playPromise = audioEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => { /* حظر التشغيل التلقائي يتم معالجته عبر تفاعل المستخدم */ });
      }
    } catch (e) { /* تجاهل */ }
  }

  function triggerSuccess() {
    successTriggered = true;
    slider.disabled = true;
    btnRow.classList.add('hidden');
    
    // إخفاء النص السفلي بهدوء عند النجاح والانتقال
    if (pineappleGratitudeText) {
      pineappleGratitudeText.style.opacity = '0';
      pineappleGratitudeText.style.transform = 'translateY(15px)';
    }

    vibrateIfPossible([50, 40, 70]);
    playPopSound();

    sliderCard.classList.add('crack');

    // الانتقال السينمائي الناعم والتدريجي إلى الشاشة الانتقالية
    setTimeout(() => {
      screenQuestion.classList.remove('active');
      screenTransition.classList.add('active');
    }, TRANSITION_DELAY_MS);

    // الانتقال إلى مشهد الوردة السينمائي الأسود بالكامل
    setTimeout(() => {
      screenTransition.classList.remove('active');
      screenScene.classList.add('active');
      
      requestAnimationFrame(() => {
        screenScene.classList.add('play');
        // بدء تشغيل الموسيقى فوراً مع بدء تشكل الوردة ونمو الساق
        playAudioSafely(flowerAudio);
        
        // تفعيل تسلسل الأحداث السينمائية وحركات التفتح والهبوط الناعم
        initCinematicRoseSequence();
      });
    }, TRANSITION_DELAY_MS + SCENE_START_DELAY_MS);
  }

  // إدارة تسلسل مشهد الوردة السينمائي المطور
  function initCinematicRoseSequence() {
    // 1. إعادة تموضع الوردة في منتصف الشاشة تماماً أثناء التشكل والتفتح البطيء جداً
    plant.style.transform = 'translate(-50%, -50%) scale(1)';

    // 2. بعد اكتمال تفتح الوردة بالكامل (~ 11 ثانية من نمو البتلات بالـ CSS)، يبدأ هبوطها السينمائي الناعم جداً وكأنها تطفو
    setTimeout(() => {
      // هبوط انسيابي ناعم ومدروس للأعلى قليلاً ثم الاستقرار فوق النص بمسافة متوازنة تماماً وبحركة Ease In Out
      plant.style.transform = 'translate(-50%, -80%) scale(1)';
      
      // 3. بعد استقرار الوردة فوق مكانها المخصص، يظهر النص النهائي بـ Fade In بطيء جداً وناعم
      setTimeout(() => {
        finalMessage.style.opacity = '1';
        finalMessage.style.filter = 'blur(0px)';
      }, 3000); // وقت متناسق مع نعومة الهبوط

    }, 11000); 
  }

  // المشهد الختامي السينمائي (الكيان الغامض الممتص للضوء لمدة 10 ثوانٍ)
  function showFailMessage() {
    playAudioSafely(sadAudio);
    failOverlay.classList.remove('hidden');
    
    // بدء تأثير امتصاص الضوء والعتمة التدريجية طوال 10 ثوانٍ كاملة دون تقطيع
    setTimeout(() => {
      if (cinematicEndingScene) {
        cinematicEndingScene.classList.add('triggered');
        screenQuestion.classList.add('cinematic-light-fade');
        
        // إخفاء كارد السحب لتركيز الانتباه الكامل على الكيان الدخاني
        sliderCard.style.transition = 'opacity 2s ease';
        sliderCard.style.opacity = '0';
        btnRow.style.transition = 'opacity 1.5s ease';
        btnRow.style.opacity = '0';
      }
    }, 500);
  }

  // أحداث السحب واللمس فائقة الأداء والمطابقة للبنية السابقة 100%
  slider.addEventListener('pointerdown', () => { if (!successTriggered) released = false; });
  slider.addEventListener('touchstart', () => { if (!successTriggered) released = false; }, { passive: true });

  slider.addEventListener('input', onInput);

  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('touchend', endDrag);
  slider.addEventListener('change', endDrag);

  sureBtn.addEventListener('click', showFailMessage);
  
  // تصفير التجربة وإرجاعها للحالة الفخمة الأصلية
  retryBtnEarly.addEventListener('click', () => {
    successTriggered = false;
    slider.disabled = false;
    slider.value = 0;
    updateVisual(0);
    btnRow.classList.add('hidden');
    sliderCard.classList.remove('crack');
    sliderCard.style.opacity = '1';
    sliderCard.style.borderColor = 'rgba(255, 45, 67, 0.15)';
    btnRow.style.opacity = '1';
    
    if (pineappleGratitudeText) {
      pineappleGratitudeText.style.opacity = '1';
      pineappleGratitudeText.style.transform = 'translateY(0)';
    }
    if (cinematicEndingScene) {
      cinematicEndingScene.classList.remove('triggered');
      screenQuestion.classList.remove('cinematic-light-fade');
    }

    // إيقاف آمن لكافة المقاطع الصوتية الحالية
    if (flowerAudio) { flowerAudio.pause(); flowerAudio.currentTime = 0; }
    if (sadAudio) { sadAudio.pause(); sadAudio.currentTime = 0; }

    failOverlay.classList.add('hidden');
    screenScene.classList.remove('active', 'play');
    screenTransition.classList.remove('active');
    screenQuestion.classList.add('active');
    
    plant.style.transform = 'translate(-50%, -50%)';
    finalMessage.style.opacity = '0';
    finalMessage.style.filter = 'blur(8px)';
  });

  // تهيئة بصرية مبدئية عند التحميل
  updateVisual(0);
})();
