//--Logic for showing and hiding: Enter, Intro and Main
document.addEventListener("DOMContentLoaded", () => {
  const enterScreen = document.querySelector(".enter-website.layer");
  const introSection = document.querySelector(".intro.layer");
  const mainContent = document.querySelector(".main-content.layer");

  if (!enterScreen || !introSection || !mainContent) {
    console.warn("One or more layers not found:", { enterScreen, introSection, mainContent });
    return;
  }

  window.scrollTo(0, 0);

  showLayer(enterScreen);
  hideLayer(introSection);
  hideLayer(mainContent);

  // --- Обработчики ---
  enterScreen.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='enter']");
    if (btn) {
      switchToIntro();
    }
  });
  
  enterScreen.addEventListener("click", (e) => {
    if (e.target && e.target.matches("[data-action='skip-intro']")) {
      endIntro();
    }
  });

  introSection.addEventListener("click", (e) => {
    if (e.target && e.target.matches("[data-action='skip-intro']")) {
      endIntro();
    }
  });

  introSection.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = introSection;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      endIntro();
    }
  });

  // --- Переходы ---
  function switchToIntro() {
    hideLayer(enterScreen);
    showLayer(introSection);
    enableScroll(introSection);
    setTopZ(introSection);
  }

  // Изменённая функция endIntro с плавным затуханием и проигрыванием звука
  function endIntro() {
    if (typeof fadeOutMusicAndPlaySfx === "function") {
      fadeOutMusicAndPlaySfx(() => {
        finishIntroTransition();
      });
    } else {
      finishIntroTransition();
    }
  }

  function finishIntroTransition() {
    disableScroll(introSection);
    hideLayer(introSection);
    showLayer(mainContent);
    enableScroll(mainContent);
    setTopZ(mainContent);
    sessionStorage.setItem("introDone", "true");
  }

  // --- Хелперы ---
  function showLayer(layer) {
    layer.classList.add("layer-active");
    layer.style.visibility = "visible";
    layer.style.opacity = "1";
    layer.style.pointerEvents = "auto";
    layer.style.zIndex = "100";
  }

  function hideLayer(layer) {
    layer.classList.remove("layer-active");
    layer.style.visibility = "hidden";
    layer.style.opacity = "0";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "0";
    if (typeof layer.scrollTo === "function") layer.scrollTo(0, 0);
    layer.classList.remove("scrollable");
  }

  function enableScroll(layer) {
    layer.classList.add("scrollable");
    layer.style.overflowY = "auto";
    layer.style.height = "100vh";
  }

  function disableScroll(layer) {
    layer.classList.remove("scrollable");
    layer.style.overflowY = "hidden";
    if (typeof layer.scrollTo === "function") layer.scrollTo(0, 0);
  }

  function setTopZ(layer) {
    [enterScreen, introSection, mainContent].forEach((l) => (l.style.zIndex = "0"));
    layer.style.zIndex = "100";
  }
});


//--Howler for bg music and initial animation

  $(function () {
    // Gate: SFX allowed only after user chooses entry option
    let started = false;
    let introPlayed = false; // prevent double intro

    // Unlock Web Audio on first user gesture (iOS/Chrome policy)
    const unlockOnce = () => {
      if (Howler.ctx && Howler.ctx.state === "suspended") {
        Howler.ctx.resume();
      }
      document.removeEventListener("click", unlockOnce);
      document.removeEventListener("touchstart", unlockOnce);
    };
    document.addEventListener("click", unlockOnce);
    document.addEventListener("touchstart", unlockOnce);

    // Howler sounds
    const bg = new Howl({
      src: [
        "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/music/background%20music.mp3",
      ],
      volume: 0.5,
      loop: true,
    });

    const clickSound = new Howl({
      src: [
        "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/sfx/click.mp3",
      ],
      volume: 0.3,
    });

    const hoverSound = new Howl({
      src: [
        "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/sfx/hover-pop.mp3",
      ],
      volume: 0.1,
    });

    // Плейсхолдер для звука по окончании интро
    const endIntroSfx = new Howl({
      src: ['https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/sfx/click.mp3'], // можно заменить на свой звук
      volume: 0.5,
    });

    // Функция плавного затухания bg музыки и проигрывания SFX
    function fadeOutMusicAndPlaySfx(done) {
      if (bg.playing()) {
        bg.fade(bg.volume(), 0, 1200);
        setTimeout(() => {
          bg.stop();
          endIntroSfx.play();
          if (typeof done === 'function') done();
        }, 1250);
      } else {
        endIntroSfx.play();
        if (typeof done === 'function') done();
      }
    }

    // Чтобы функция была видна глобально
    window.fadeOutMusicAndPlaySfx = fadeOutMusicAndPlaySfx;

    // Sound toggle UI sync (.sound-toggle uses .is-muted + aria)
    function updateSoundButton() {
      const muted = Howler._muted === true;
      const $btn = $(".sound-toggle");
      $btn.toggleClass("is-muted", muted);
      $btn.attr("aria-pressed", muted ? "true" : "false");
      $btn.attr("aria-label", muted ? "Unmute sound" : "Mute sound");
    }

    // GSAP intro timeline
    function buildIntroTimeline() {
      const overlay = document.querySelector(".enter-website");
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.add(() => {
        if (overlay) overlay.style.pointerEvents = "none";
      }, 0);

      tl.to(
        overlay,
        { opacity: 0, filter: "blur(18px)", duration: 1.6 },
        0
      );

      tl.add(() => {
        document.body.classList.remove("no-scroll");
        if (overlay) overlay.style.display = "none";
      });

      tl.fromTo(
        ".intro-controls-wrapper",
        { opacity: 0, filter: "blur(8px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power2.out",
        }
      );

      tl.fromTo(
        ".intro-progress-wrapper",
        { opacity: 0, filter: "blur(12px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power2.out",
        },
        ">-0.3"
      );

      return tl;
    }

    // Entry handlers
    function runIntroOnce() {
      if (introPlayed) return;
      introPlayed = true;
      buildIntroTimeline().play(0);
    }

    function handleEnterWithMusic() {
      started = true;
      Howler.mute(false);
      if (!bg.playing()) bg.play();
      updateSoundButton();
      runIntroOnce();
    }

    function handleEnterWithoutMusic() {
      started = true;
      Howler.mute(true);
      if (bg.playing()) bg.stop();
      updateSoundButton();
      runIntroOnce();
    }

    // Bind entry buttons
    $("#start").on("click", handleEnterWithMusic);
    $("#start-no-music").on("click", handleEnterWithoutMusic);

    // Sound toggle component
    $(".sound-toggle").on("click keydown", function (e) {
      if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ")
        return;
      const willMute = !$(this).hasClass("is-muted");
      Howler.mute(willMute);
      if (!willMute && started && !bg.playing()) {
        bg.play();
      }
      updateSoundButton();
    });

    // SFX gating
    $("[sound-click]").on("click", function () {
      if (!started) return;
      clickSound.play();
    });

    $("[sound-hover]").on("mouseenter", function () {
      if (!started) return;
      hoverSound.play();
    });

    // Init UI state
    updateSoundButton();
  });


//--On scroll text appear

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.sticky-trigger').forEach(trigger => {
    const wrapper = trigger.querySelector('.text-appear-wrapper');
    if (!wrapper) return;

    const items = Array.from(wrapper.querySelectorAll('[data-dissolve-text]'));

    const appearTl = gsap.timeline({ paused: true });
    appearTl.to(items, {
      opacity: 1,
      filter: 'blur(0px)',
      stagger: { amount: 0.6 },
      ease: 'power2.out'
    });

    const disappearTl = gsap.timeline({ paused: true });
    disappearTl.to(items, {
      opacity: 0,
      filter: 'blur(12px)',
      ease: 'power2.in'
    });

    ScrollTrigger.create({
      trigger: trigger,
      scroller: '.intro',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      markers: false,
      onUpdate: self => {
        const progress = self.progress;
        if (progress < 0.5) {
          appearTl.progress(progress / 0.5);
          disappearTl.progress(0);
        } else if (progress < 0.7) {
          appearTl.progress(1);
          disappearTl.progress(0);
        } else if (progress < 0.9) {
          disappearTl.progress((progress - 0.7) / 0.2);
        } else {
          disappearTl.progress(1);
        }
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
});


//--Intro: Progress Circle

document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(ScrollTrigger);

  const bar = document.querySelector('.ring .bar');
  if (!bar) {
    console.warn('Progress circle .ring .bar not found');
    return;
  }

  const R = 52;
  const C = 2 * Math.PI * R;

  bar.style.strokeDasharray = C;
  bar.style.strokeDashoffset = C;

  ScrollTrigger.create({
    trigger: '.intro-trigger-wrap', // важная обёртка для всего длинного контента
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    scroller: '.intro', // скроллируем именно этот контейнер
    onUpdate(self) {
      const p = gsap.utils.clamp(0, 1, self.progress);
      bar.style.strokeDashoffset = C * (1 - p);
    }
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
});


//--Main:Nav: Time

  // Настройки
  const selector = '.clock';          
  const use24h = false;                // true = 24-h format
  const showSeconds = false;           // show seconds
  const showTZShort = true;            // show short TZ name (e.g. GMT+2 / EST*)

  function getUserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  function makeFormatter(tz) {
    const opts = {
      hour: 'numeric',
      minute: '2-digit',
      ...(showSeconds ? { second: '2-digit' } : {}),
      hour12: !use24h,
      ...(showTZShort ? { timeZoneName: 'short' } : {}),
      timeZone: tz
    };
    return new Intl.DateTimeFormat(undefined, opts);
  }

  function tick() {
    const el = document.querySelector(selector);
    if (!el) return;
    const tz = getUserTimeZone();
    const fmt = makeFormatter(tz);
    el.textContent = fmt.format(new Date());
  }

  document.addEventListener('DOMContentLoaded', () => {
    tick();
    setInterval(tick, showSeconds ? 1000 : 10000);
  });


//--About section WIP

(function() {
  // Все карточки: если utility-класс, выбираем по .slide-card
  const cards = document.querySelectorAll('.slide-card');
  const wrap = document.querySelector('.slides-wrap');
  const avatars = document.querySelectorAll('.avatar-btn');

  if (!cards.length || !wrap) return;

  function measureMaxHeight() {
    wrap.style.height = 'auto';
    cards.forEach(card => card.style.height = 'auto');

    // Берём scrollHeight каждого .slide-card (учитывает grid, float, flex, etc)
    const maxHeight = Math.max(...Array.from(cards).map(card => card.scrollHeight));

    wrap.style.height = maxHeight + 'px';
    cards.forEach(card => card.style.height = maxHeight + 'px');
  }

  // Активатор табов
  function setActive(id) {
    avatars.forEach(a => a.classList.toggle('active', a.dataset.target === id));
    cards.forEach(card => card.classList.toggle('active', card.id === id));
    // Пересчёт после переключения
    measureMaxHeight();
  }

  avatars.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.dataset.target;
      if (!id) return;
      setActive(id);
    });
  });

  // При загрузке изображений внутри grid-карточек — пересчитать
  function onReady() {
    const imgs = wrap.querySelectorAll('img');
    if (!imgs.length) { measureMaxHeight(); return; }
    let loaded = 0;
    imgs.forEach(img => {
      if (img.complete) { loaded++; if (loaded === imgs.length) measureMaxHeight(); }
      else img.addEventListener('load', () => { loaded++; if (loaded === imgs.length) measureMaxHeight(); });
      img.addEventListener('error', () => { loaded++; if (loaded === imgs.length) measureMaxHeight(); });
    });
  }

  // Если внутри есть видео/фото — пересчитываем по ResizeObserver
  const ro = new ResizeObserver(() => measureMaxHeight());
  cards.forEach(card => ro.observe(card));

  window.addEventListener('DOMContentLoaded', onReady);
  window.addEventListener('resize', measureMaxHeight);

  // Инициализация
  const initial = document.querySelector('.avatar-btn.active')?.dataset.target || cards[0]?.id;
  if (initial) setActive(initial);
})();