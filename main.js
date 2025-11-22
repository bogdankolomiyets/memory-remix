console.log("Script loaded");

//Lenis scroll and Scroll trigger integration
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  wrapper: document.querySelector(".main-content"),
  content: document.querySelector(".main-content > *"),
  duration: 0.9,
  anchors: true,
});

window.lenis = lenis;

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Scroll-To Anchor Lenis
function initScrollToAnchorLenis() {
  document.querySelectorAll("[data-anchor-target]").forEach((element) => {
    element.addEventListener("click", function () {
      const targetScrollToAnchorLenis = this.getAttribute("data-anchor-target");

      lenis.scrollTo(targetScrollToAnchorLenis, {
        easing: (x) =>
          x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2,
        duration: 1.2,
        offset: -100, // Option to create an offset when there is a fixed navigation for example
      });
    });
  });
}

// Initialize Scroll-To Anchor Lenis
document.addEventListener("DOMContentLoaded", () => {
  initScrollToAnchorLenis();
});

//--Logic for showing and hiding: Enter, Intro and Main
document.addEventListener("DOMContentLoaded", () => {
  const enterScreen = document.querySelector(".enter-website.layer");
  const introSection = document.querySelector(".intro.layer");
  const mainContent = document.querySelector(".main-content.layer");

  let lenisIntro = null;
  let lenisMain = null;

  window.scrollTo(0, 0);

  showLayer(enterScreen);
  hideLayer(introSection);
  hideLayer(mainContent);

  // --- LENIS for sections ---
  function enableIntroLenis() {
    if (lenisIntro) return;
    lenisIntro = new Lenis({
      wrapper: introSection,
      content: introSection.querySelector("*"),
      duration: 0.5,
      wheelMultiplier: 0.5,
    });
    function raf(time) {
      if (!lenisIntro) return;
      lenisIntro.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  function destroyIntroLenis() {
    if (lenisIntro) {
      lenisIntro.destroy();
      lenisIntro = null;
    }
  }

  function enableMainLenis() {
    if (lenisMain) return;
    lenisMain = new Lenis({
      wrapper: mainContent,
      content: mainContent.querySelector("*"),
      duration: 0.9,
    });
    function raf(time) {
      if (!lenisMain) return;
      lenisMain.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  function destroyMainLenis() {
    if (lenisMain) {
      lenisMain.destroy();
      lenisMain = null;
    }
  }

  // --- Processors ---
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

  // --- transitions ---
  function switchToIntro() {
    hideLayer(enterScreen);
    showLayer(introSection);
    enableScroll(introSection);
    setTopZ(introSection);
    enableIntroLenis();
    destroyMainLenis();
  }

  function endIntro() {
    if (typeof fadeOutMusicAndPlaySfx === "function") {
      fadeOutMusicAndPlaySfx(() => {
        finishIntroTransition();
      });
    } else {
      finishIntroTransition();
    }
  }

  // ...existing code...
  function finishIntroTransition() {
    // если GSAP доступен — сначала анимируем скрытие intro, затем показываем main и widget
    if (typeof gsap !== "undefined") {
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      // элемент фонового канваса (может иметь id или класс)
      const bgEl =
        document.querySelector(".intro-bg-image") ||
        document.getElementById("pixi-canvas-container");

      // гарантируем начальное видимое состояние перед анимацией
      gsap.set(introSection, { autoAlpha: 1, filter: "blur(0px)" });
      if (bgEl) gsap.set(bgEl, { autoAlpha: 1, filter: "blur(0px)" });

      // отключаем взаимодействие с intro во время анимации (на старте анимации)
      // и плавно фейдим + блюрим intro; по завершении — скрываем и активируем main
      tl.to(
        introSection,
        {
          autoAlpha: 0, // анимирует opacity и visibility
          filter: "blur(18px)",
          duration: 0.9,
          onStart: () => {
            introSection.style.pointerEvents = "none";
          },
          onComplete: () => {
            // выполняем скрытие/переключение только после завершения анимации
            disableScroll(introSection);
            hideLayer(introSection);
            showLayer(mainContent);
            enableScroll(mainContent);
            setTopZ(mainContent);
            enableMainLenis();
            destroyIntroLenis();
            sessionStorage.setItem("introDone", "true");
          },
        },
        0
      );

      // Параллельная и точно такая же анимация для фонового изображения/канваса
      if (bgEl) {
        tl.to(
          bgEl,
          {
            autoAlpha: 0,
            filter: "blur(18px)",
            duration: 0.9,
            onStart: () => {
              bgEl.style.pointerEvents = "none";
            },
          },
          0 // запуск в параллель с анимацией introSection
        );
      }

      // затем анимируем появление виджета (main-content элемент)
      tl.to(
        ".main-content",
        {
          autoAlpha: 1,
          filter: "blur(0px)",
          delay: 0.5,
          duration: 1,
          ease: "power2.out",
          overwrite: true,
        },
        ">"
      );
    } else {
      // fallback — без анимации
      const bgEl =
        document.querySelector(".intro-bg-image") ||
        document.getElementById("pixi-canvas-container");
      disableScroll(introSection);
      hideLayer(introSection);
      if (bgEl) {
        bgEl.style.visibility = "hidden";
        bgEl.style.opacity = "0";
        bgEl.style.pointerEvents = "none";
      }
      showLayer(mainContent);
      enableScroll(mainContent);
      setTopZ(mainContent);
      enableMainLenis();
      destroyIntroLenis();
      sessionStorage.setItem("introDone", "true");
    }
  }

  // --- Helpers ---
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
    [enterScreen, introSection, mainContent].forEach(
      (l) => (l.style.zIndex = "0")
    );
    layer.style.zIndex = "100";
  }
});

//--Howler for bg music and initial animation

$(function () {
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

  // Create bgSrc with cache-busting param
  let bgSrc =
    "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/music/background%20music.mp3?v=" +
    Date.now();

  // Howler background music
  let bg = new Howl({
    src: [bgSrc],
    volume: 0.5,
    loop: true,
  });

  // BG music reload function with cache busting
  function reloadBgMusic() {
    if (bg) {
      bg.unload(); // unload previous sound
    }
    bgSrc =
      "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/music/background%20music.mp3?v=" +
      Date.now();
    bg = new Howl({
      src: [bgSrc],
      volume: 0.5,
      loop: true,
    });
  }

  // Global function
  window.fadeOutMusicAndPlaySfx = function (done) {
    if (bg.playing()) {
      bg.fade(bg.volume(), 0, 1200);
      setTimeout(() => {
        bg.stop();
        if (typeof done === "function") done();
      }, 1250);
    } else {
      if (typeof done === "function") done();
    }
  };

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

    tl.to(overlay, { opacity: 0, filter: "blur(18px)", duration: 1.6 }, 0);

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
    reloadBgMusic(); // reload bg with fresh URL
    Howler.mute(false);
    bg.play();
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
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    const willMute = !$(this).hasClass("is-muted");
    Howler.mute(willMute);
    if (!willMute && started && !bg.playing()) {
      bg.play();
    }
    updateSoundButton();
  });

  // Init UI state
  updateSoundButton();
});

//------------
//=======bg animation (PIXI.js)===========
(async () => {
  // Инициализация PIXI
  const app = new PIXI.Application();

  await app.init({ resizeTo: window });

  // Получаем контейнер
  const containerElement = document.getElementById("pixi-canvas-container");

  // Добавляем canvas в контейнер и растягиваем его на всю ширину и высоту
  app.view.style.width = "100%";
  app.view.style.height = "100%";
  app.view.style.display = "block";

  containerElement.appendChild(app.view);

  // Загружаем изображения
  const bgImages = [
    "bg-img-1.webp",
    "bg-img-2.webp",
    "bg-img-3.webp",
    "bg-img-4.webp",
    "bg-img-5.webp",
  ].map(
    (img) =>
      `https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/images/${img}`
  );

  await PIXI.Assets.load([
    ...bgImages,
    "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/images/dmaps/2048x2048/fibers.jpg",
  ]);

  app.stage.eventMode = "static";
  const container = new PIXI.Container();
  app.stage.addChild(container);

  // Текущий и следующий спрайты для плавного переключения
  let currentBg = PIXI.Sprite.from(bgImages[0]);
  currentBg.alpha = 1;
  container.addChild(currentBg);

  // Resize function для спрайтов фона
  function resizeFlagSprite(sprite) {
    // масштабируем спрайт так, чтобы он покрывал экран без искажения (cover)
    const sw = app.screen.width;
    const sh = app.screen.height;
    const iw = sprite.texture.width || 1;
    const ih = sprite.texture.height || 1;
    const scale = Math.max(sw / iw, sh / ih);
    sprite.scale.set(scale, scale);
    // центрируем и позиционируем так, чтобы покрывать экран
    sprite.position.set((sw - iw * scale) / 2, (sh - ih * scale) / 2);
  }
  resizeFlagSprite(currentBg);

  // При ресайзе окна меняем размер фонового спрайта
  window.addEventListener("resize", () => {
    resizeFlagSprite(currentBg);
    if (nextBg) resizeFlagSprite(nextBg);
  });

  // Дисплейсмент-карта
  const displacementSprite = PIXI.Sprite.from(
    "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/images/dmaps/2048x2048/fibers.jpg"
  );
  displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  displacementSprite.position = currentBg.position;
  app.stage.addChild(displacementSprite);

  // Displacement filter
  const displacementFilter = new PIXI.DisplacementFilter({
    sprite: displacementSprite,
    scale: { x: 160, y: 200 },
  });
  currentBg.filters = [displacementFilter];

  // Анимация displacement
  let speed = 0.3;
  app.ticker.add(() => {
    displacementSprite.x += speed;
    if (displacementSprite.x > displacementSprite.width) {
      displacementSprite.x = 0;
    }
  });

  let nextBg = null;

  function changeBackground(index) {
    if (index < 0 || index >= bgImages.length) return;

    if (nextBg) {
      container.removeChild(nextBg);
      nextBg.destroy();
      nextBg = null;
    }

    nextBg = PIXI.Sprite.from(bgImages[index]);
    resizeFlagSprite(nextBg);
    nextBg.alpha = 0;
    container.addChild(nextBg);

    nextBg.filters = [displacementFilter];

    gsap.to(currentBg, {
      alpha: 0,
      duration: 1,
      onComplete: () => {
        container.removeChild(currentBg);
        currentBg.destroy();
        currentBg = nextBg;
        nextBg = null;
      },
    });

    gsap.to(nextBg, {
      alpha: 1,
      duration: 1,
    });
  }

  ScrollTrigger.defaults({ immediateRender: false, ease: "power1.inOut" });

  const scrollTriggers = [
    { trigger: ".intro-section-2", bgIndex: 1 },
    { trigger: ".intro-section-3", bgIndex: 2 },
    { trigger: ".intro-section-4", bgIndex: 3 },
    { trigger: ".intro-section-welcome", bgIndex: 4 },
  ];

  scrollTriggers.forEach(({ trigger, bgIndex }) => {
    ScrollTrigger.create({
      trigger: trigger,
      scroller: ".intro",
      start: "top center",
      end: "bottom center",
      onEnter: () => changeBackground(bgIndex),
      onEnterBack: () => changeBackground(bgIndex),
      onLeaveBack: () => changeBackground(bgIndex - 1 >= 0 ? bgIndex - 1 : 0),
    });
  });

  ScrollTrigger.refresh();
})();

//=======Nav===========
function initBoldFullScreenNavigation() {
  // Existing: Toggle Navigation
  document
    .querySelectorAll('[data-navigation-toggle="toggle"]')
    .forEach((toggleBtn) => {
      toggleBtn.addEventListener("click", () => {
        const navStatusEl = document.querySelector("[data-navigation-status]");
        if (!navStatusEl) return;
        if (
          navStatusEl.getAttribute("data-navigation-status") === "not-active"
        ) {
          navStatusEl.setAttribute("data-navigation-status", "active");
          //window.lenis.stop();
        } else {
          navStatusEl.setAttribute("data-navigation-status", "not-active");
          //window.lenis.start();
        }
      });
    });

  // Existing: Close Navigation
  document
    .querySelectorAll('[data-navigation-toggle="close"]')
    .forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        const navStatusEl = document.querySelector("[data-navigation-status]");
        if (!navStatusEl) return;
        navStatusEl.setAttribute("data-navigation-status", "not-active");
        //window.lenis.start();
      });
    });

  // Existing: Key ESC - Close Navigation
  document.addEventListener("keydown", (e) => {
    if (e.keyCode === 27) {
      const navStatusEl = document.querySelector("[data-navigation-status]");
      if (!navStatusEl) return;
      if (navStatusEl.getAttribute("data-navigation-status") === "active") {
        navStatusEl.setAttribute("data-navigation-status", "not-active");
        //window.lenis.start();
      }
    }
  });

  // NEW: Close nav when a menu item is clicked
  document.querySelectorAll(".bold-nav-full__li").forEach((menuItem) => {
    menuItem.addEventListener("click", () => {
      const navStatusEl = document.querySelector("[data-navigation-status]");
      if (!navStatusEl) return;
      navStatusEl.setAttribute("data-navigation-status", "not-active");
      //window.lenis.start();
    });
  });
}

// Initialize Bold Full Screen Navigation
document.addEventListener("DOMContentLoaded", function () {
  initBoldFullScreenNavigation();
});

//--On scroll text appear

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".sticky-trigger").forEach((trigger) => {
    const wrapper = trigger.querySelector(".text-appear-wrapper");
    if (!wrapper) return;

    const items = Array.from(wrapper.querySelectorAll("[data-dissolve-text]"));

    const appearTl = gsap.timeline({ paused: true });
    appearTl.to(items, {
      opacity: 1,
      filter: "blur(0px)",
      stagger: { amount: 0.6 },
      ease: "power2.out",
    });

    const disappearTl = gsap.timeline({ paused: true });
    disappearTl.to(items, {
      opacity: 0,
      filter: "blur(12px)",
      ease: "power2.in",
    });

    ScrollTrigger.create({
      trigger: trigger,
      scroller: ".intro",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: false,
      onUpdate: (self) => {
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
      },
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
});

//--Intro: Progress Circle

document.addEventListener("DOMContentLoaded", function () {
  gsap.registerPlugin(ScrollTrigger);

  const bar = document.querySelector(".ring .bar");
  if (!bar) {
    console.warn("Progress circle .ring .bar not found");
    return;
  }

  const R = 52;
  const C = 2 * Math.PI * R;

  bar.style.strokeDasharray = C;
  bar.style.strokeDashoffset = C;

  ScrollTrigger.create({
    trigger: ".intro-trigger-wrap",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    scroller: ".intro",
    onUpdate(self) {
      const p = gsap.utils.clamp(0, 1, self.progress);
      bar.style.strokeDashoffset = C * (1 - p);
    },
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
});

//--Main:Nav: Time

// РќР°СЃС‚СЂРѕР№РєРё
const selector = ".clock";
const use24h = false; // true = 24-h format
const showSeconds = false; // show seconds
const showTZShort = true; // show short TZ name (e.g. GMT+2 / EST*)

function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function makeFormatter(tz) {
  const opts = {
    hour: "numeric",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
    hour12: !use24h,
    ...(showTZShort ? { timeZoneName: "short" } : {}),
    timeZone: tz,
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

document.addEventListener("DOMContentLoaded", () => {
  tick();
  setInterval(tick, showSeconds ? 1000 : 10000);
});

//--About section

(function () {
  const cards = document.querySelectorAll(".slide-card");
  const wrap = document.querySelector(".slides-wrap");
  const avatars = document.querySelectorAll(".avatar-btn");

  if (!cards.length || !wrap) return;

  function setFixedMaxHeight() {
    cards.forEach((card) => (card.style.height = "auto"));

    const maxHeight = Math.max(
      ...Array.from(cards).map((card) => card.scrollHeight)
    );

    wrap.style.height = maxHeight + "px";
    cards.forEach((card) => (card.style.height = maxHeight + "px"));
  }

  function setActive(id) {
    avatars.forEach((a) =>
      a.classList.toggle("active", a.dataset.target === id)
    );
    cards.forEach((card) => card.classList.toggle("active", card.id === id));
  }

  avatars.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.dataset.target;
      if (!id) return;
      setActive(id);
    });
  });

  function onReady() {
    const imgs = wrap.querySelectorAll("img");
    if (!imgs.length) {
      setFixedMaxHeight();
      return;
    }
    let loaded = 0;
    imgs.forEach((img) => {
      if (img.complete) {
        loaded++;
        if (loaded === imgs.length) setFixedMaxHeight();
      } else {
        img.addEventListener("load", () => {
          loaded++;
          if (loaded === imgs.length) setFixedMaxHeight();
        });
        img.addEventListener("error", () => {
          loaded++;
          if (loaded === imgs.length) setFixedMaxHeight();
        });
      }
    });
  }

  window.addEventListener("DOMContentLoaded", onReady);

  const initial =
    document.querySelector(".avatar-btn.active")?.dataset.target ||
    cards[0]?.id;
  if (initial) setActive(initial);
})();

//--Import and randomize images
//=======GIT HUB SETTINGS========
const GH_USER = "bogdankolomiyets";
const GH_REPO = "memory-remix";
const GH_BRANCH = "main";
const GH_DIR = "assets/covers";
const STORAGE_KEY = "memoryCoversV1";

// FisherвЂ“Yates shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 1) Get images via GitHub Contents API
async function fetchCoverUrls() {
  const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${GH_DIR}?ref=${GH_BRANCH}`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error("GitHub API error");
  const items = await res.json();
  return items
    .filter(
      (it) => it.type === "file" && /\.(png|jpe?g|webp|gif|svg)$/i.test(it.name)
    )
    .map((it) => it.download_url);
}

// 2) Create images "sets"
function buildAssignmentBySets(images, cardsCount) {
  if (!images.length) return [];

  const m = images.length;
  const out = new Array(cardsCount);
  let lastPlaced = null;

  const fullSets = Math.floor(cardsCount / m);
  const remainder = cardsCount % m;

  const fillSet = (len) => {
    const base = images.slice(0, len);
    shuffle(base);
    if (lastPlaced !== null && base.length > 0 && base[0] === lastPlaced) {
      const j = base.findIndex((v) => v !== lastPlaced);
      if (j > 0) [base[0], base[j]] = [base[j], base[0]];
    }
    for (let i = 1; i < base.length; i++) {
      if (base[i] === base[i - 1]) {
        const j = base.findIndex((v, k) => k > i && v !== base[i - 1]);
        if (j !== -1) [base[i], base[j]] = [base[j], base[i]];
      }
    }
    lastPlaced = base.length ? base[base.length - 1] : lastPlaced;
    return base;
  };

  let cursor = 0;
  for (let s = 0; s < fullSets; s++) {
    const batch = fillSet(m);
    for (let i = 0; i < batch.length; i++) out[cursor++] = batch[i];
  }
  if (remainder > 0) {
    const batch = fillSet(remainder);
    for (let i = 0; i < batch.length; i++) out[cursor++] = batch[i];
  }
  return out;
}

// 3) Use sessionStorage
async function getAssignmentForTab(cardsCount) {
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= cardsCount) return parsed;
    } catch {}
  }

  const images = await fetchCoverUrls();
  if (!images.length) return [];

  const assignment = buildAssignmentBySets(images, cardsCount);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(assignment));
  return assignment;
}

// 4) Apply to DOM
async function assignCoversToCards() {
  const cards = Array.from(document.querySelectorAll(".memory-card"));
  if (!cards.length) return;

  const assignment = await getAssignmentForTab(cards.length);

  cards.forEach((card, i) => {
    const img = card.querySelector(".memory-card-front .image-memory");
    if (!img) return;
    img.src = assignment[i];
    img.loading = "lazy";
    img.decoding = "async";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  assignCoversToCards().catch(console.error);
});

//=======MEMORY LIBRARY========
const library = document.querySelector(".memory-library-section");
const background = document.querySelector(".memory-library-bg");
const cards = document.querySelectorAll(".memory-card");
const list = document.querySelector(".memory-cards-list-wrapper");

let isFlipped = false;

let isAnimating = false; // Флаг анимации

cards.forEach((card) => {
  card.addEventListener("click", () => {
    isFlipped = !isFlipped;
    isAnimating = true; // Начинается flip-анимация

    let state = Flip.getState(
      ".memory-library-section, .memory-library-bg, .memory-card, .memory-cards-list-wrapper"
    );

    library.classList.toggle("active");
    background.classList.toggle("active");
    list.classList.toggle("active");
    cards.forEach((card) => card.classList.toggle("active"));

    setTimeout(() => {
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, {
          duration: 1.5,
          easing: (t) => t * (2 - t),
        });
      }
    }, 100);

    Flip.from(state, {
      scale: true,
      duration: 2, // 3 секунды анимации
      rotate: 0,
      ease: "cubic",
      onComplete: () => {
        if (typeof scroller !== "undefined" && scroller.update) {
          scroller.update();
        }
        isAnimating = false; // Анимация закончена, можно снова включать hover
      },
    });

    document.body.classList.toggle("alt-mode");
  });
});

//------Card hover animation
cards.forEach((card) => {
  const inner = card.querySelector(".memory-card-inner");

  gsap.set(inner, { rotateY: 0, transformOrigin: "50% 50%" });
  gsap.set(card, { y: 0, xPercent: 0 });

  card.addEventListener("mouseenter", () => {
    if (isAnimating) return; // блокируем hover во время flip

    cards.forEach((otherCard) => {
      if (otherCard !== card) {
        otherCard.classList.add("grayscale");
      }
    });

    const isActive = library.classList.contains("active") || isFlipped;

    if (isActive) {
      gsap.to(inner, {
        rotateY: 180,
        duration: 0.6,
        ease: "power2.inOut",
        z: 20,
      });
      gsap.to(card, {
        xPercent: -90,
        y: 0,
        duration: 0.6,
        ease: "power2.inOut",
      });
      card.classList.add("is-flipped");
    } else {
      gsap.to(card, { y: -10, duration: 0.3, ease: "power2.out" });
    }
  });

  card.addEventListener("mouseleave", () => {
    if (isAnimating) return;

    cards.forEach((otherCard) => {
      otherCard.classList.remove("grayscale");
    });

    const isActive = library.classList.contains("active") || isFlipped;

    if (isActive) {
      gsap.to(inner, { rotateY: 0, duration: 0.6, ease: "power2.inOut", z: 0 });
      gsap.to(card, { xPercent: 0, y: 0, duration: 0.6, ease: "power2.inOut" });
      card.classList.remove("is-flipped");
    } else {
      gsap.to(card, { y: 0, duration: 0.3, ease: "power2.inOut" });
    }
  });
});

//-----Draggable library
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".memory-cards-list-wrapper");
  const handle = document.querySelector(".memory-slider-handle");
  const track = document.querySelector(".memory-slider-track");
  const searchInput = document.querySelector(".custom-search-input");
  const suggestions = document.querySelector(".search-suggestions");
  const cards = document.querySelectorAll(".memory-card");

  const wrapperWidth = wrapper.scrollWidth;
  const viewportWidth = wrapper.clientWidth;
  const maxScroll = wrapperWidth - viewportWidth;
  const handleMax = track.clientWidth - handle.clientWidth;

  const wrapperDraggable = Draggable.create(wrapper, {
    type: "x",
    bounds: { minX: -maxScroll, maxX: 0 },
    inertia: true,
    onDrag() {
      const progress = -this.x / maxScroll;
      gsap.to(handle, {
        x: progress * handleMax,
        duration: 0.25,
        ease: "power2.out",
      });
    },
    onThrowUpdate() {
      const progress = -this.x / maxScroll;
      gsap.to(handle, {
        x: progress * handleMax,
        duration: 0.25,
        ease: "power2.out",
      });
    },
  })[0];

  const handleDraggable = Draggable.create(handle, {
    type: "x",
    bounds: { minX: 0, maxX: handleMax },
    onDrag() {
      const progress = this.x / handleMax;
      gsap.to(wrapper, {
        x: -progress * maxScroll,
        duration: 0.35,
        ease: "power2.out",
      });
      wrapperDraggable.update();
    },
  })[0];

  gsap.set(wrapper, { display: "flex", gap: "1rem" });

  // Подсказки поиска
  if (searchInput && suggestions && cards.length) {
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value.trim().toLowerCase();

      // Очистить/спрятать подсказки, если меньше 3 символов
      if (value.length < 3) {
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        cards.forEach((card) => (card.style.display = ""));
        return;
      }

      // Собираем подходящие карточки
      const found = [];
      cards.forEach((card) => {
        const header = card.querySelector(".memory-card-header");
        const text = card.querySelector(".memory-card-text");
        const headerText = header ? header.textContent.toLowerCase() : "";
        const bodyText = text ? text.textContent.toLowerCase() : "";
        if (headerText.includes(value) || bodyText.includes(value)) {
          found.push({ card, headerText });
        }
      });

      // Показать список найденных
      suggestions.innerHTML = "";
      if (found.length > 0) {
        found.forEach(({ card, headerText }) => {
          const option = document.createElement("div");
          option.className = "search-suggestion-item";
          option.textContent = headerText || "Без названия";
          option.addEventListener("click", () => {
            // Исправлено: вместо scrollIntoView меняем позицию draggable
            const cardRect = card.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const offset = cardRect.left - wrapperRect.left;

            let newX = -offset;
            if (newX > 0) newX = 0;
            if (newX < -maxScroll) newX = -maxScroll;

            wrapperDraggable.x = newX;
            gsap.set(wrapper, { x: newX });

            const handleX = (-newX / maxScroll) * handleMax;
            gsap.to(handle, { x: handleX, duration: 0.25, ease: "power2.out" });

            wrapperDraggable.update();

            card.classList.add("highlight");
            setTimeout(() => card.classList.remove("highlight"), 1200);
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
          });
          suggestions.appendChild(option);
        });
        suggestions.style.display = "block";
      } else {
        suggestions.style.display = "none";
      }
    });
  }
});
