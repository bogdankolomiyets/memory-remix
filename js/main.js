console.log("THIS IS DEVELOPMENT main.js");

//Lenis scroll and Scroll trigger integration
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  wrapper: document.querySelector(".main-content"),
  content: document.querySelector(".main-content > *"),
  lerp: 0.12,
  smoothWheel: true,
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

// ======================= Microphone Permission Modal Logic =======================
let micModalShown = false;
let micPermissionGranted = false;

async function checkMicPermission() {
  try {
    if (!navigator.permissions || !navigator.permissions.query) return 'prompt';
    const result = await navigator.permissions.query({ name: 'microphone' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch (e) {
    console.warn("Permission query not supported", e);
    return 'prompt';
  }
}

function showMicModal() {
  const modal = document.getElementById('mic-permission-modal');
  const errorDiv = document.getElementById('mic-modal-error');

  if (!modal) return false;

  // Reset error state
  errorDiv.classList.remove('visible');

  // Show modal
  modal.classList.add('active');
  micModalShown = true;

  return true;
}

function hideMicModal() {
  const modal = document.getElementById('mic-permission-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function showMicModalError() {
  const errorDiv = document.getElementById('mic-modal-error');
  if (errorDiv) {
    errorDiv.classList.add('visible');
  }
}

// Setup modal button handler
document.addEventListener("DOMContentLoaded", () => {
  const modalBtn = document.getElementById('mic-modal-btn');
  if (modalBtn) {
    modalBtn.addEventListener('click', () => {
      hideMicModal();
    });
  }
});

// Expose modal control for use in React components
window.showMicPermissionModal = showMicModal;
window.hideMicPermissionModal = hideMicModal;
window.showMicPermissionModalError = showMicModalError;
window.checkMicPermission = checkMicPermission;
window.isMicPermissionGranted = () => micPermissionGranted;
window.setMicPermissionGranted = (granted) => { micPermissionGranted = granted; };


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
      lerp: 0.12,
      smoothWheel: true
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
      lerp: 0.12,
      smoothWheel: true,
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

  function finishIntroTransition() {
    // If GSAP is available, animate intro fade-out first, then show main content and navbar
    if (typeof gsap !== "undefined") {
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      // Background canvas element (identified by class or id)
      const bgEl =
        document.querySelector(".intro-bg-image") ||
        document.getElementById("pixi-canvas-container");

      // Ensure intro starts visible and unblurred before animation
      gsap.set(introSection, { autoAlpha: 1, filter: "blur(0px)" });
      if (bgEl) gsap.set(bgEl, { autoAlpha: 1, filter: "blur(0px)" });
      // Ensure main content and nav start hidden and blurred so they animate in together
      gsap.set([".main-content", ".bold-nav-full"], {
        autoAlpha: 0,
        filter: "blur(18px)",
      });

      // Disable interaction with intro during animation (at animation start)
      // then smoothly fade and blur intro; on completion hide it and activate main
      tl.to(
        introSection,
        {
          autoAlpha: 0, // animates opacity and visibility
          filter: "blur(18px)",
          duration: 0.9,
          onStart: () => {
            introSection.style.pointerEvents = "none";
          },
          onComplete: () => {
            // Execute hide/switch only after animation completes
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

      // Parallel and identical animation for background image/canvas
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
          0 /* start in parallel with intro animation */
        );
      }

      // Then animate the appearance of the main content widget
      tl.to(
        [".main-content", ".bold-nav-full"],
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
      // Fallback - no animation
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
    if (layer === mainContent) {
      layer.style.zIndex = "98";
    } else {
      layer.style.zIndex = "100";
    }
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
  // Initialize PIXI application
  const app = new PIXI.Application();

  await app.init({ resizeTo: window });

  // Get container element where canvas will be rendered
  const containerElement = document.getElementById("pixi-canvas-container");

  // Style canvas to fill its container completely
  app.view.style.width = "100%";
  app.view.style.height = "100%";
  app.view.style.display = "block";

  containerElement.appendChild(app.view);

  // Load all background images from CDN
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

  // Current and next background sprites for smooth transitions
  let currentBg = PIXI.Sprite.from(bgImages[0]);
  currentBg.alpha = 1;
  container.addChild(currentBg);

  // Fit background sprite to cover entire screen without distortion
  function resizeFlagSprite(sprite) {
    // Scale sprite to cover screen without distortion
    const sw = app.screen.width;
    const sh = app.screen.height;
    const iw = sprite.texture.width || 1;
    const ih = sprite.texture.height || 1;
    const scale = Math.max(sw / iw, sh / ih);
    sprite.scale.set(scale, scale);
    // Center the sprite to maintain proper coverage
    sprite.position.set((sw - iw * scale) / 2, (sh - ih * scale) / 2);
  }
  resizeFlagSprite(currentBg);

  // Handle window resize events
  window.addEventListener("resize", () => {
    resizeFlagSprite(currentBg);
    if (nextBg) resizeFlagSprite(nextBg);
  });

  // Create displacement map for visual effects
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

  // Animate displacement map scrolling continuously
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

  // NEW: Close nav when a menu item is clicked (attribute-driven)
  // Replace the existing .bold-nav-full__li handler with this
  document
    .querySelectorAll(".bold-nav-full__li, [data-closes-library]")
    .forEach((menuItem) => {
      menuItem.addEventListener("click", async (e) => {
        // if element carries the attribute data-closes-library="true" (or present), we will attempt collapse
        const shouldCloseLibrary =
          menuItem.dataset.closesLibrary === "true" ||
          menuItem.hasAttribute("data-closes-library");

        if (
          shouldCloseLibrary &&
          library &&
          library.classList.contains("active")
        ) {
          // prevent default navigation/anchor behaviour while we collapse
          if (e && typeof e.preventDefault === "function") e.preventDefault();

          try {
            const didCollapse = await collapseLibraryToCompact();
            console.debug(
              "menu click: collapseLibraryToCompact result:",
              didCollapse
            );
          } catch (err) {
            console.error("Error while collapsing library:", err);
          }
        }

        // Close the fullscreen nav UI as before (always try to close nav after click)
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

//Dynamic nav
const nav = document.querySelector(".navbar");
if (nav) {
  const showAnim = gsap
    .from(nav, {
      yPercent: -100,
      paused: true,
      duration: 0.2,
    })
    .progress(1);

  ScrollTrigger.create({
    scroller: ".main-content",
    start: "top top",
    end: 99999,
    onUpdate: (self) => {
      if (self.direction === -1) {
        if (self.scroll() > nav.offsetHeight) {
          showAnim.play();
        }
      } else {
        showAnim.reverse();
      }
    },
  });
}

//--Main:Nav: Time

// Configuration options
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

//======API Integration=======//
document.addEventListener("DOMContentLoaded", async function () {
  // Supabase REST API configuration
  const SUPABASE_URL = "https://coumlezydpfpsbsjlail.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Jl4vSwXaADYk-Irdsrf54g_KZJyk8w4";

  const wrapper = document.querySelector(".memory-cards-list-wrapper");

  if (!wrapper) {
    console.warn(
      "Memory Library: not found .memory-cards-list-wrapper"
    );
    return;
  }

  // Save the template card before removing it
  const templateCard = wrapper.querySelector(".memory-card");

  if (!templateCard) {
    console.warn("Memory Library: not found template .memory-card");
    return;
  }

  // Clone template for later use
  const cardTemplate = templateCard.cloneNode(true);

  // Render function for creating cards from data
  function renderCards(memories) {
    // Remove all existing cards first
    const allCards = wrapper.querySelectorAll(".memory-card");
    allCards.forEach((card) => card.remove());

    // Create new cards for each memory
    memories.forEach((memory) => {
      const card = cardTemplate.cloneNode(true);

      // Populate card with memory data (mapped from Supabase schema)
      const headerEls = Array.from(
        card.querySelectorAll(".memory-card-header")
      );
      const textEls = Array.from(card.querySelectorAll(".memory-card-text"));
      const playerEl = card.querySelector(".howler-player");

      if (headerEls.length) {
        // Map 'title' field from Supabase to card header
        headerEls.forEach((el) => (el.textContent = memory.title || ""));
      }
      if (textEls.length) {
        // Map 'name' field from Supabase to card text
        textEls.forEach((el) => (el.textContent = memory.name || ""));
      }

      // Display PROMPTS (hint_text) if available
      const promptEl = card.querySelector(".memory-card-prompt") || card.querySelector(".prompt-text");
      if (promptEl) {
        promptEl.textContent = memory.hint_text || "";
      } else if (memory.hint_text) {
        // If element doesn't exist, create it below the artist
        const backContent = card.querySelector(".card-back-content-wrap");
        if (backContent) {
          const promptDiv = document.createElement("div");
          promptDiv.className = "memory-card-prompt";
          promptDiv.style.fontSize = "14px";
          promptDiv.style.marginTop = "8px";
          promptDiv.style.opacity = "0.7";
          promptDiv.textContent = memory.hint_text;
          backContent.appendChild(promptDiv);
        }
      }
      if (playerEl) {
        playerEl.setAttribute("data-howler-src", memory.audio_url || "");
        // Ensure the element is discoverable by the Howler init (selector [data-howler])
        if (!playerEl.hasAttribute("data-howler"))
          playerEl.setAttribute("data-howler", "");
      }

      // Remove display:none if present
      card.style.display = "";

      // Add card to DOM
      wrapper.appendChild(card);
    });

    // Assign covers after all cards are created
    if (typeof assignCoversToCards === "function") {
      assignCoversToCards().catch(console.error);
    }

    // Initialize Howler audio players for newly created cards
    if (typeof initHowlerJSAudioPlayer === "function") {
      try {
        initHowlerJSAudioPlayer();
      } catch (err) {
        console.error("Error initializing Howler players:", err);
      }
    }
  }

  // Fetch memories from Supabase REST API
  async function loadMemories() {
    try {
      console.log("Fetching memories from Supabase...");

      const response = await fetch(`${SUPABASE_URL}/rest/v1/memories?status=eq.approved&select=id,name,title,audio_url,created_at,status`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      // --- MOCK DATA INJECTION ---
      if (!data || data.length === 0) {
        console.log("Database empty, using MOCK data for testing...");
        data = [
          {
            id: "mock-1",
            name: "Mock User",
            title: "Test Memory Card",
            audio_url: "https://cdn.jsdelivr.net/gh/bogdankolomiyets/memory-remix@main/assets/music/background%20music.mp3",
            hint_text: "This is a simulated memory entry to test the card layout.",
            created_at: new Date().toISOString(),
            status: "approved"
          },
          {
            id: "mock-2",
            name: "Another User",
            title: "Second Memory",
            audio_url: "",
            hint_text: "Another mock card to see the grid layout.",
            created_at: new Date().toISOString(),
            status: "approved"
          }
        ];
      }

      console.log("Loaded memories from Supabase:", data?.length || 0, data);
      renderCards(data || []);
      // Re-initialize Howler players for dynamically loaded cards
      setTimeout(() => {
        initHowlerJSAudioPlayer();
      }, 100);

    } catch (err) {
      console.error("Memory Library fetch error:", err);
      console.log("Rendering empty cards as fallback");
      // Show empty state or fallback UI
      renderCards([]);
    }
  }

  // Load memories on page load
  loadMemories();
});

//--Import and randomize images
//=======GIT HUB SETTINGS========
const GH_USER = "bogdankolomiyets";
const GH_REPO = "memory-remix";
const GH_BRANCH = "main";
const GH_DIR = "assets/covers";
const STORAGE_KEY = "memoryCoversV1";

// Fisher-Yates shuffle algorithm for randomizing array order
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
    } catch { }
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
const list = document.querySelector(".memory-cards-list-wrapper");

// Global draggable variables
let wrapper = null;
let handle = null;
let track = null;
let wrapperDraggable = null;
let handleDraggable = null;
let maxScroll = 0;
let handleMax = 0;

// helper: always work with the up-to-date set of memory cards
function getMemoryCards() {
  return Array.from(document.querySelectorAll(".memory-card"));
}

let isFlipped = false;
let isAnimating = false;
let selectedCard = null; // Track which card is selected

// NEW: remember card to auto-open after flip/active transition
let openCardAfterFlip = null;

/**
 * Recalculate bounds and sync draggable positions
 */
window.recalcLibraryDraggable = function recalcLibraryDraggable() {
  if (!wrapper || !handle || !track) return;

  const wrapperWidth = wrapper.scrollWidth;
  const viewportWidth = wrapper.clientWidth;
  maxScroll = Math.max(0, wrapperWidth - viewportWidth);
  handleMax = Math.max(0, track.clientWidth - handle.clientWidth);

  if (wrapperDraggable && typeof wrapperDraggable.applyBounds === "function") {
    wrapperDraggable.applyBounds({ minX: -maxScroll, maxX: 0 });
  }
  if (handleDraggable && typeof handleDraggable.applyBounds === "function") {
    handleDraggable.applyBounds({ minX: 0, maxX: handleMax });
  }

  let currentX = gsap.getProperty(wrapper, "x") || 0;
  if (currentX > 0) currentX = 0;
  if (currentX < -maxScroll) currentX = -maxScroll;
  gsap.to(wrapper, { x: currentX, duration: 0.3, ease: "power2.out" });

  const handleX = maxScroll === 0 ? 0 : (-currentX / maxScroll) * handleMax;
  gsap.to(handle, { x: handleX, duration: 0.3, ease: "power2.out" });

  if (wrapperDraggable && typeof wrapperDraggable.update === "function")
    wrapperDraggable.update();
};

/**
 * Exit selected state - return to --active (flipped) view
 */
window.exitSelectedState = function exitSelectedState() {
  if (!selectedCard || isAnimating) return;
  isAnimating = true;

  const clickedCard = selectedCard;
  const placeholder = clickedCard.__placeholder;
  const targetRect = placeholder
    ? placeholder.getBoundingClientRect()
    : {
      left: parseFloat(clickedCard.dataset.origLeft) || 0,
      top: parseFloat(clickedCard.dataset.origTop) || 0,
      width: Number(clickedCard.dataset.origWidth) || clickedCard.offsetWidth,
      height:
        Number(clickedCard.dataset.origHeight) || clickedCard.offsetHeight,
    };

  const overlay = document.querySelector(".memory-lightbox");
  const closeBtn = document.querySelector(".memory-lightbox-close");
  // Stop and reset any Howler player inside the selected card so it starts from beginning next time
  try {
    const howlerEl = clickedCard.querySelector(".howler-player,[data-howler]");
    if (howlerEl) {
      const hid = howlerEl.id;
      if (window.howlerSoundInstances && window.howlerSoundInstances[hid]) {
        try {
          // stop resets playback to start
          window.howlerSoundInstances[hid].stop();
        } catch (e) {
          console.warn("Failed to stop howler instance", e);
        }
      }

      // Reset UI pieces if present
      const progressText = howlerEl.querySelector(
        '[data-howler-info="progress"]'
      );
      const timelineBar = howlerEl.querySelector(
        '[data-howler-control="progress"]'
      );
      if (progressText) progressText.textContent = "0:00";
      if (timelineBar) timelineBar.style.width = "0%";
      howlerEl.setAttribute("data-howler-status", "not-playing");
    }
  } catch (e) {
    console.warn("Error while resetting howler on exitSelectedState", e);
  }
  // --- Unmount React Visualizer ---
  const vizContainer = clickedCard.querySelector(".audio-vizualizer");
  if (vizContainer && typeof window.unmountMemoryVisualizer === "function") {
    window.unmountMemoryVisualizer(vizContainer);
  }
  // --------------------------------

  const others = getMemoryCards().filter((c) => c !== clickedCard);
  const innerEl = clickedCard.querySelector(".memory-card-inner");
  const selectedContent = clickedCard.querySelector(
    ".memory-card-selected-content"
  );
  const controls = document.querySelector(".memory-library-controls");

  // Animate fade-out and remove lightbox and close button in parallel
  if (overlay) {
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.out",
      onComplete: () => {
        try {
          overlay.remove();
        } catch (e) { }
      },
    });
  }
  if (closeBtn) {
    gsap.to(closeBtn, {
      opacity: 0,
      duration: 0.12,
      ease: "power2.out",
      onComplete: () => {
        try {
          closeBtn.remove();
        } catch (e) { }
      },
    });
  }

  // Timeline:
  // 1) Hide selected content and reset card rotation
  // 2) Animate card back to original position
  // 3) Reset inline styles and return card to DOM flow
  // 4) Show controls and restore other cards
  // 5) Final cleanup (draggable re-enable, bounds recalc)
  const tl = gsap.timeline({
    onComplete: () => {
      // Clear inline filter from all cards
      document.querySelectorAll(".memory-card").forEach((c) => {
        c.style.filter = "";
      });

      // Remove grayscale effect from all cards
      document.querySelectorAll(".memory-card.grayscale").forEach((c) => {
        c.classList.remove("grayscale");
      });

      // Final: re-enable draggable/lenis and recalculate layout
      if (wrapperDraggable && typeof wrapperDraggable.enable === "function") {
        wrapperDraggable.enable();
      }
      if (
        typeof lenis !== "undefined" &&
        lenis &&
        typeof lenis.start === "function"
      ) {
        lenis.start();
      }

      isAnimating = false;
      selectedCard = null;

      if (typeof window.recalcLibraryDraggable === "function") {
        window.recalcLibraryDraggable();
      }
    },
  });

  // 1) Hide selected content and return card rotation
  // reverse card-specific front/back animation: backContent -> hide, hoverInfo -> show
  const hoverInfo = clickedCard.querySelector(".card-hover-info-wrapper");
  const backContent = clickedCard.querySelector(".card-back-content-wrap");
  if (backContent) {
    tl.to(
      backContent,
      { autoAlpha: 0, filter: "blur(12px)", duration: 0.28, ease: "power2.in" },
      0
    );
  }
  if (hoverInfo) {
    tl.to(
      hoverInfo,
      { autoAlpha: 1, filter: "blur(0px)", duration: 0.36, ease: "power2.out" },
      0.18
    );
  }
  if (selectedContent) {
    tl.to(
      selectedContent,
      { opacity: 0, filter: "blur(18px)", duration: 0.28 },
      0
    );
  }
  if (innerEl) {
    tl.to(innerEl, { rotateY: 0, duration: 0.28, ease: "power2.inOut" }, 0);
  }

  // 2) Animate card back to original position
  tl.to(
    clickedCard,
    {
      left: targetRect.left + "px",
      top: targetRect.top + "px",
      xPercent: 0,
      yPercent: 0,
      width: targetRect.width + "px",
      height: targetRect.height + "px",
      duration: 0.6,
      ease: "power3.inOut",
    },
    ">0"
  );

  // 3) After animation: reset all styles and return card to document flow
  tl.add(() => {
    // Reinsert card before placeholder or back into list
    try {
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(clickedCard, placeholder);
      } else {
        if (list && list.querySelector(".memory-card")) {
          list
            .querySelector(".memory-card")
            .parentNode.insertBefore(
              clickedCard,
              list.querySelector(".memory-card")
            );
        }
      }
    } catch (e) {
      console.warn(
        "Failed to insert selectedCard back to placeholder parent",
        e
      );
    }

    // Remove placeholder
    if (placeholder) {
      placeholder.remove();
      delete clickedCard.__placeholder;
    }

    // Reset all inline styles
    clickedCard.style.position = "";
    clickedCard.style.left = "";
    clickedCard.style.top = "";
    clickedCard.style.width = "";
    clickedCard.style.height = "";
    clickedCard.style.margin = "";
    clickedCard.style.zIndex = "";
    clickedCard.style.transform = "";
    clickedCard.style.willChange = "";
    clickedCard.style.perspective = "";
    clickedCard.style.webkitPerspective = "";

    if (innerEl) {
      innerEl.style.backfaceVisibility = "";
      innerEl.style.transformStyle = "";
      innerEl.style.transform = "";
    }

    // Remove state-related classes
    clickedCard.classList.remove("--selected", "is-expanded", "is-flipped");
    list.classList.remove("--selected");

    // Remove saved data attributes
    clickedCard.removeAttribute("data-orig-left");
    clickedCard.removeAttribute("data-orig-top");
    clickedCard.removeAttribute("data-orig-width");
    clickedCard.removeAttribute("data-orig-height");
    if (clickedCard.dataset.origZIndex)
      clickedCard.removeAttribute("data-orig-z-index");

    // Clear inline filter to let CSS grayscale work again
    // Clear inline filter from all cards
    document.querySelectorAll(".memory-card").forEach((c) => {
      c.style.filter = "";
    });

    // (overlay и closeBtn уже анимированы и удалены выше)
  }, ">");

  // 4) показываем контролы библиотеки (если были скрыты) и остальные карточки
  if (controls) {
    tl.to(
      controls,
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.36,
        ease: "power2.out",
        pointerEvents: "auto",
      },
      "<0.02"
    );
  }

  tl.to(
    others,
    {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.45,
      ease: "power2.out",
      stagger: 0.02,
    },
    "<0.05"
  );
};

/**
 * Enter selected state - expand single card (smooth, no jump) + lightbox + close button
 * height = 80vh, width kept at 3:4 ratio (width = calc(80vh * 3 / 4))
 */
window.enterSelectedState = async function enterSelectedState(clickedCard) {
  if (isAnimating || selectedCard) return;
  if (!clickedCard.classList.contains("active")) return;

  // Блокируем пользовательские действия на время анимаций
  isAnimating = true;

  // Если есть draggable — временно дизейблим (как и раньше)
  if (wrapperDraggable && typeof wrapperDraggable.disable === "function") {
    wrapperDraggable.disable();
  }
  if (
    typeof lenis !== "undefined" &&
    lenis &&
    typeof lenis.stop === "function"
  ) {
    lenis.stop();
  }

  // Убедимся что карточка перевёрнута. Если нет — сначала переворачиваем её (rotateY + сдвиг),
  // ждём окончания flip анимации, затем продолжаем стандартный expand flow.
  const innerForFlip = clickedCard.querySelector(".memory-card-inner");
  if (innerForFlip && !clickedCard.classList.contains("is-flipped")) {
    // Добавляем класс сразу, чтобы hover/leave не конфликтовали с анимацией
    clickedCard.classList.add("is-flipped");

    await new Promise((resolve) => {
      const flipTl = gsap.timeline({ onComplete: resolve });
      flipTl.to(
        innerForFlip,
        { rotateY: 180, duration: 0.6, ease: "power2.inOut", z: 20 },
        0
      );
      // визуальный сдвиг карточки при flip (как в hover)
      flipTl.to(
        clickedCard,
        { xPercent: -90, duration: 0.6, ease: "power2.inOut" },
        0
      );
    });
  }

  // Небольшая RAF пауза для стабильности layout перед снятием rect
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, 8));

  // Теперь снимаем rect уже после (возможно) flip-а — это гарантирует корректные координаты
  const rect = clickedCard.getBoundingClientRect();

  selectedCard = clickedCard;
  const controls = document.querySelector(".memory-library-controls");

  // Save original position/size and original z-index
  clickedCard.dataset.origLeft = rect.left;
  clickedCard.dataset.origTop = rect.top;
  clickedCard.dataset.origWidth = rect.width;
  clickedCard.dataset.origHeight = rect.height;
  const computedZ =
    clickedCard.style.zIndex || getComputedStyle(clickedCard).zIndex || "";
  clickedCard.dataset.origZIndex = computedZ;

  const comp = getComputedStyle(clickedCard);

  const placeholder = document.createElement("div");
  placeholder.className = "memory-card-placeholder";
  placeholder.style.flex = "0 0 " + rect.width + "px";
  placeholder.style.width = rect.width + "px";
  placeholder.style.minWidth = rect.width + "px";
  placeholder.style.height = rect.height + "px";
  placeholder.style.marginTop = comp.marginTop;
  placeholder.style.marginBottom = comp.marginBottom;
  placeholder.style.marginLeft = comp.marginLeft;
  placeholder.style.marginRight = comp.marginRight;
  placeholder.style.boxSizing = "border-box";
  placeholder.style.display = "block";
  placeholder.style.visibility = "hidden";
  placeholder.style.pointerEvents = "none";

  clickedCard.parentNode.insertBefore(placeholder, clickedCard);
  clickedCard.__placeholder = placeholder;

  document.body.appendChild(clickedCard);

  if (!document.querySelector(".memory-lightbox")) {
    const overlay = document.createElement("div");
    overlay.className = "memory-lightbox";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.6)",
      zIndex: "10000",
      opacity: "0",
      pointerEvents: "auto",
      backdropFilter: "blur(2px)",
    });
    document.body.appendChild(overlay);
    gsap.to(overlay, { opacity: 1, duration: 0.35, ease: "power2.out" });

    const closeBtn = document.createElement("button");
    closeBtn.className = "memory-lightbox-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "✕";
    Object.assign(closeBtn.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "10006",
      background: "transparent",
      color: "#fff",
      border: "none",
      fontSize: "28px",
      cursor: "pointer",
      padding: "8px",
      lineHeight: "1",
      opacity: "0",
    });
    document.body.appendChild(closeBtn);
    gsap.to(closeBtn, { opacity: 1, duration: 0.35, delay: 0.05 });

    closeBtn.addEventListener("click", () => {
      window.exitSelectedState();
    });
  }

  list.classList.add("--selected");
  clickedCard.classList.add("--selected");

  // Transition card to fixed position and prepare for expansion animation
  clickedCard.style.position = "fixed";
  clickedCard.style.left = rect.left + "px";
  clickedCard.style.top = rect.top + "px";
  clickedCard.style.width = rect.width + "px";
  clickedCard.style.height = rect.height + "px";
  clickedCard.style.margin = "0";
  clickedCard.style.zIndex = "10005";
  clickedCard.style;
  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating = false;
      clickedCard.classList.add("is-expanded");

      // --- Mount React Visualizer ---
      const vizContainer = clickedCard.querySelector(".audio-vizualizer");
      if (vizContainer && typeof window.mountMemoryVisualizer === "function") {
        const howlerEl = clickedCard.querySelector(".howler-player,[data-howler]");
        if (howlerEl) {
          const hid = howlerEl.id;
          const howlInstance = window.howlerSoundInstances ? window.howlerSoundInstances[hid] : null;
          if (howlInstance) {
            window.mountMemoryVisualizer(vizContainer, howlInstance);
          }
        }
      }
      // --------------------------------
    },
  });

  getMemoryCards().forEach((other) => {
    if (other !== clickedCard) {
      tl.to(
        other,
        {
          x: window.innerWidth * 1.05,
          opacity: 0,
          duration: 0.6,
          ease: "power2.in",
        },
        0
      );
    }
  });

  if (controls) {
    tl.to(
      controls,
      {
        opacity: 0,
        filter: "blur(18px)",
        duration: 0.45,
        pointerEvents: "none",
      },
      0
    );
  }

  const inner = clickedCard.querySelector(".memory-card-inner");
  if (inner) {
    gsap.set(inner, {
      rotateY: inner._gsap ? gsap.getProperty(inner, "rotateY") : 0,
    });
  }

  // card-specific front/back pieces for the selected animation
  const hoverInfo = clickedCard.querySelector(".card-hover-info-wrapper");
  const backContent = clickedCard.querySelector(".card-back-content-wrap");

  tl.to(
    clickedCard,
    {
      left: "50%",
      top: "50%",
      xPercent: -50,
      yPercent: -50,
      width: "calc(80vh * 3 / 4)",
      height: "80vh",
      duration: 0.85,
      ease: "power3.out",
    },
    0.02
  );

  const selectedContent = clickedCard.querySelector(
    ".memory-card-selected-content"
  );
  if (selectedContent) {
    tl.fromTo(
      selectedContent,
      { opacity: 0, filter: "blur(18px)" },
      { opacity: 1, filter: "blur(0px)", duration: 0.6 },
      0.6
    );
  }

  // Animate hover -> back content when entering selected state
  if (backContent) {
    // ensure back starts hidden
    gsap.set(backContent, { autoAlpha: 0, filter: "blur(12px)" });
    tl.to(
      backContent,
      { autoAlpha: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out" },
      0.3
    );
  }
  if (hoverInfo) {
    tl.to(
      hoverInfo,
      { autoAlpha: 0, filter: "blur(12px)", duration: 0.35, ease: "power2.in" },
      0
    );
  }
};

// ========== FLIP ANIMATION WITH FADE SEQUENCE ==========
// Use delegated click handler on the wrapper so newly rendered cards also work
(function setupCardClickDelegation() {
  const container =
    document.querySelector(".memory-cards-list-wrapper") || document;

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".memory-card");
    if (!card) return;

    // If card is selected, do nothing (close only via close button)
    if (selectedCard === card) return;

    // Prevent interactions while animations are running
    if (isAnimating) return;

    // If already flipped, click enters selected state — only if flip finished
    if (isFlipped && !selectedCard && !isAnimating) {
      window.enterSelectedState(card);
      return;
    }

    const startFlipFlow = () => {
      if (!library || !library.classList.contains("active")) {
        openCardAfterFlip = card;
      } else {
        openCardAfterFlip = null;
      }

      isFlipped = !isFlipped;
      isAnimating = true;

      const titleWrapper = document.querySelector(".section-title-wrapper");
      const aboutSection = document.querySelector(".about-section");
      const controls = document.querySelector(".memory-library-controls");

      const fadeOutTl = gsap.timeline();
      if (titleWrapper) {
        fadeOutTl.to(
          titleWrapper,
          {
            opacity: 0,
            filter: "blur(18px)",
            duration: 0.6,
            ease: "power2.inOut",
          },
          0
        );
      }
      if (aboutSection) {
        fadeOutTl.to(
          aboutSection,
          {
            opacity: 0,
            filter: "blur(18px)",
            duration: 0.6,
            ease: "power2.inOut",
          },
          0
        );
      }

      fadeOutTl.add(() => {
        let state = Flip.getState(
          ".memory-library-section, .memory-library-bg, .memory-card, .memory-cards-list-wrapper"
        );

        library.classList.toggle("active");
        background.classList.toggle("active");
        list.classList.toggle("active");
        getMemoryCards().forEach((c) => c.classList.toggle("active"));

        setTimeout(() => {
          if (lenis && typeof lenis.scrollTo === "function") {
            lenis.scrollTo(0, { duration: 1.5, easing: (t) => t * (2 - t) });
          }
        }, 100);

        Flip.from(state, {
          scale: true,
          duration: 2,
          rotate: 0,
          ease: "cubic",
          onComplete: () => {
            const fadeInTl = gsap.timeline();
            if (titleWrapper)
              fadeInTl.to(
                titleWrapper,
                {
                  opacity: 1,
                  filter: "blur(0px)",
                  duration: 0.6,
                  ease: "power2.out",
                },
                0
              );
            if (aboutSection)
              fadeInTl.to(
                aboutSection,
                {
                  opacity: 1,
                  filter: "blur(0px)",
                  duration: 0.6,
                  ease: "power2.out",
                },
                0
              );
            if (controls)
              fadeInTl.to(
                controls,
                {
                  opacity: 1,
                  duration: 0.6,
                  ease: "power2.out",
                  pointerEvents: "auto",
                },
                0
              );

            fadeInTl.add(() => {
              if (typeof scroller !== "undefined" && scroller.update)
                scroller.update();
              if (typeof window.recalcLibraryDraggable === "function")
                window.recalcLibraryDraggable();

              if (openCardAfterFlip) {
                const cardToOpen = openCardAfterFlip;
                openCardAfterFlip = null;
                setTimeout(() => {
                  if (!isAnimating && !selectedCard)
                    window.enterSelectedState(cardToOpen);
                }, 120);
              }

              isAnimating = false;
            });
          },
        });

        document.body.classList.toggle("alt-mode");
      });
    };

    const isCompact = !(library && library.classList.contains("active"));
    if (isCompact) {
      isAnimating = true;
      gsap.to(card, {
        y: 0,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => {
          setTimeout(() => {
            startFlipFlow();
          }, 20);
        },
      });
      return;
    }

    startFlipFlow();
  });
})();

// ========== CARD HOVER ANIMATION ==========
// Replace individual card hover listeners with delegated container approach
// This ensures hover works even after cards are moved or re-rendered
(function setupCardHoverDelegation() {
  const container =
    document.querySelector(".memory-cards-list-wrapper") || document;
  // Helper to always work with the current set of memory cards
  const getCards = () => Array.from(document.querySelectorAll(".memory-card"));

  function applyGrayscaleToOthers(card) {
    getCards().forEach((c) => {
      if (c !== card) c.classList.add("grayscale");
    });
  }
  function removeGrayscaleFromOthers() {
    getCards().forEach((c) => c.classList.remove("grayscale"));
  }

  // Helper animations - replicate the previous hover behavior
  function onCardPointerEnter(card) {
    if (isAnimating || selectedCard) return;

    applyGrayscaleToOthers(card);

    const inner = card.querySelector(".memory-card-inner");
    const isActive =
      library && (library.classList.contains("active") || isFlipped);
    if (isActive) {
      if (inner) {
        gsap.to(inner, {
          rotateY: 180,
          duration: 0.6,
          ease: "power2.inOut",
          z: 20,
        });
      }
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
  }

  function onCardPointerLeave(card) {
    if (isAnimating || selectedCard) return;

    removeGrayscaleFromOthers();

    const inner = card.querySelector(".memory-card-inner");
    const isActive =
      library && (library.classList.contains("active") || isFlipped);
    if (isActive) {
      if (inner) {
        gsap.to(inner, {
          rotateY: 0,
          duration: 0.6,
          ease: "power2.inOut",
          z: 0,
        });
      }
      gsap.to(card, { xPercent: 0, y: 0, duration: 0.6, ease: "power2.inOut" });
      card.classList.remove("is-flipped");
    } else {
      gsap.to(card, { y: 0, duration: 0.3, ease: "power2.inOut" });
    }
  }

  // Use mouseover/mouseout with relatedTarget check to ignore internal card events
  container.addEventListener("mouseover", (e) => {
    const card = e.target.closest(".memory-card");
    if (!card) return;
    // Ignore if coming from card's internal element
    const from = e.relatedTarget;
    if (from && card.contains(from)) return;
    onCardPointerEnter(card);
  });

  container.addEventListener("mouseout", (e) => {
    const card = e.target.closest(".memory-card");
    if (!card) return;
    // Ignore if going to card's internal element
    const to = e.relatedTarget;
    if (to && card.contains(to)) return;
    onCardPointerLeave(card);
  });
})();

// ========== DRAGGABLE & SEARCH SETUP ==========
document.addEventListener("DOMContentLoaded", () => {
  wrapper = document.querySelector(".memory-cards-list-wrapper");
  handle = document.querySelector(".memory-slider-handle");
  track = document.querySelector(".memory-slider-track");
  const searchInput = document.querySelector(".custom-search-input");
  const suggestions = document.querySelector(".search-suggestions");

  // Определяем язык по URL
  const lang = window.location.pathname.startsWith("/es") ? "es" : "en";

  // Тексты
  const messages = {
    en: {
      one: "1 record found",
      many: (n) => `${n} records found`,
      none: "No records found",
    },
    es: {
      one: "1 registro encontrado",
      many: (n) => `${n} registros encontrados`,
      none: "No se encontraron registros",
    },
  };

  // Disable Enter on search
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });
  }

  // Initial calculation
  const wrapperWidth = wrapper ? wrapper.scrollWidth : 0;
  const viewportWidth = wrapper ? wrapper.clientWidth : 0;
  maxScroll = Math.max(0, wrapperWidth - viewportWidth);
  handleMax = track
    ? Math.max(0, track.clientWidth - (handle ? handle.clientWidth : 0))
    : 0;

  // Draggable for wrapper
  if (wrapper) {
    wrapperDraggable = Draggable.create(wrapper, {
      type: "x",
      bounds: { minX: -maxScroll, maxX: 0 },
      inertia: true,
      onDrag() {
        const progress = maxScroll === 0 ? 0 : -this.x / maxScroll;
        gsap.to(handle, {
          x: progress * handleMax,
          duration: 0.25,
          ease: "power2.out",
        });
      },
      onThrowUpdate() {
        const progress = maxScroll === 0 ? 0 : -this.x / maxScroll;
        gsap.to(handle, {
          x: progress * handleMax,
          duration: 0.25,
          ease: "power2.out",
        });
      },
    })[0];
  }

  // Draggable for handle
  if (handle) {
    handleDraggable = Draggable.create(handle, {
      type: "x",
      bounds: { minX: 0, maxX: handleMax },
      onDrag() {
        const progress = handleMax === 0 ? 0 : this.x / handleMax;
        gsap.to(wrapper, {
          x: -progress * maxScroll,
          duration: 0.35,
          ease: "power2.out",
        });
        if (wrapperDraggable && typeof wrapperDraggable.update === "function") {
          wrapperDraggable.update();
        }
      },
    })[0];
  }

  gsap.set(wrapper, { display: "flex", gap: "1rem" });

  // Resize listener
  window.addEventListener(
    "resize",
    () => {
      if (typeof window.recalcLibraryDraggable === "function")
        window.recalcLibraryDraggable();
    },
    { passive: true }
  );

  // Initial recalc
  if (typeof window.recalcLibraryDraggable === "function")
    window.recalcLibraryDraggable();

  // Search functionality
  if (searchInput && suggestions) {
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value.trim().toLowerCase();
      const cardsNow = getMemoryCards();

      const resultsText = suggestions.querySelector(".search-results-text");

      if (value.length < 3) {
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        cardsNow.forEach((card) => (card.style.display = ""));
        if (resultsText) resultsText.textContent = "";
        return;
      }

      const found = [];
      cardsNow.forEach((card) => {
        const headerEls = Array.from(
          card.querySelectorAll(".memory-card-header")
        );
        const textEls = Array.from(card.querySelectorAll(".memory-card-text"));
        const headerText = headerEls
          .map((h) => h.textContent || "")
          .join(" ")
          .toLowerCase();
        const bodyText = textEls
          .map((t) => t.textContent || "")
          .join(" ")
          .toLowerCase();

        const headerDisplay =
          headerEls[0] && headerEls[0].textContent
            ? headerEls[0].textContent.trim()
            : "";
        const textDisplay =
          textEls[0] && textEls[0].textContent
            ? textEls[0].textContent.trim()
            : "";

        if (headerText.includes(value) || bodyText.includes(value)) {
          found.push({ card, headerText, headerDisplay, textDisplay });
        }
      });

      suggestions.innerHTML = "";

      // ---------- UPDATED TEXT OUTPUT ----------
      const info = document.createElement("div");
      info.className = "search-info";
      const infoText = document.createElement("div");
      infoText.className = "search-results-text";

      let text;
      if (found.length === 0) {
        text = messages[lang].none;
      } else if (found.length === 1) {
        text = messages[lang].one;
      } else {
        text = messages[lang].many(found.length);
      }

      infoText.textContent = text;
      info.appendChild(infoText);
      suggestions.appendChild(info);
      // ------------------------------------------

      if (found.length > 0) {
        found.forEach(({ card, headerText, headerDisplay, textDisplay }) => {
          const option = document.createElement("div");
          option.className = "search-suggestion-item";
          const hdr = headerDisplay || headerText || "Unknown Title";
          const txt = textDisplay ? ` by ${textDisplay}` : "";
          option.textContent = hdr + txt;

          option.addEventListener("click", () => {
            const cardRect = card.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
            const offsetCenter = cardCenter - wrapperCenter;

            let newX = -offsetCenter;
            if (newX > 0) newX = 0;
            if (newX < -maxScroll) newX = -maxScroll;

            if (wrapperDraggable) wrapperDraggable.x = newX;

            gsap.to(wrapper, {
              x: newX,
              duration: 0.35,
              ease: "power2.out",
              onComplete: () => {
                const handleX =
                  maxScroll === 0 ? 0 : (-newX / maxScroll) * handleMax;
                if (handle)
                  gsap.to(handle, {
                    x: handleX,
                    duration: 0.25,
                    ease: "power2.out",
                  });

                if (
                  wrapperDraggable &&
                  typeof wrapperDraggable.update === "function"
                ) {
                  wrapperDraggable.update();
                }

                if (!card.classList.contains("active")) {
                  if (library) library.classList.add("active");
                  if (background) background.classList.add("active");
                  if (list) list.classList.add("active");
                  getMemoryCards().forEach((c) => c.classList.add("active"));
                  isFlipped = true;
                }

                setTimeout(() => {
                  if (!isAnimating && !selectedCard) {
                    window.enterSelectedState(card);
                  }
                }, 140);
              },
            });

            suggestions.innerHTML = "";
            suggestions.style.display = "none";
          });

          suggestions.appendChild(option);
        });
        suggestions.style.display = "block";
      } else {
        suggestions.style.display = "block";
      }
    });
  }
});

// ------- Добавить эту функцию рядом с другими функциями memory library -------
function collapseLibraryToCompact() {
  return new Promise((resolve) => {
    // если уже анимируем или нет активной библиотеки — ничего не делаем
    if (typeof isAnimating !== "undefined" && isAnimating) {
      console.debug("collapseLibraryToCompact: already animating");
      return resolve(false);
    }
    if (!library || !library.classList.contains("active")) {
      console.debug("collapseLibraryToCompact: library not active");
      return resolve(false);
    }

    isAnimating = true;

    const titleWrapper = document.querySelector(".section-title-wrapper");
    const aboutSection = document.querySelector(".about-section");
    const controls = document.querySelector(".memory-library-controls");

    // снимем состояние перед изменением DOM/классов
    const state = Flip.getState(
      ".memory-library-section, .memory-library-bg, .memory-card, .memory-cards-list-wrapper"
    );

    // отключаем active классы — это противоположность перехода в active
    library.classList.remove("active");
    background.classList.remove("active");
    list.classList.remove("active");
    getMemoryCards().forEach((c) => c.classList.remove("active"));

    // логическое состояние flipped должно отражать компактный вид
    isFlipped = false;

    // плавный scroll-to-top (как в открытии)
    setTimeout(() => {
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, {
          duration: 1.0,
          easing: (t) => t * (2 - t),
        });
      }
    }, 80);

    // Сам Flip анимационный переход
    Flip.from(state, {
      scale: true,
      duration: 1.2,
      rotate: 0,
      ease: "cubic",
      onComplete: () => {
        // восстановим видимые секции (title/about), а controls — наоборот СКРОЕМ
        const tl = gsap.timeline();

        if (titleWrapper) {
          tl.to(
            titleWrapper,
            {
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.45,
              ease: "power2.out",
            },
            0
          );
        }
        if (aboutSection) {
          tl.to(
            aboutSection,
            {
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.45,
              ease: "power2.out",
            },
            0
          );
        }

        // Скрываем контролы: плавно уменьшаем opacity и добавляем blur,
        // по окончании — отключаем pointer events
        if (controls) {
          tl.to(
            controls,
            {
              opacity: 0,
              filter: "blur(12px)",
              duration: 0.45,
              ease: "power2.out",
              pointerEvents: "none",
            },
            0
          );
        }

        tl.add(() => {
          if (typeof window.recalcLibraryDraggable === "function") {
            window.recalcLibraryDraggable();
          }
          // завершили анимацию
          isAnimating = false;
          console.debug("collapseLibraryToCompact: animation complete");
          resolve(true);
        });
      },
      onInterrupt: () => {
        // в случае прерывания — убираем флаг и резолвим false
        isAnimating = false;
        console.debug("collapseLibraryToCompact: interrupted");
        resolve(false);
      },
    });

    // поддерживать совместимость с alt-mode toggle, как при открытии/flip
    document.body.classList.toggle("alt-mode");
  });
}
``;

// ==========================HOWLER PLAYER IN CARD=======================
function initHowlerJSAudioPlayer() {
  const howlerElements = document.querySelectorAll("[data-howler]");
  window.howlerSoundInstances = window.howlerSoundInstances || {};

  howlerElements.forEach((element, index) => {
    const uniqueId = element.id || `howler-${index}`;
    if (element.getAttribute("data-howler-initialized") === "true") return;

    element.id = uniqueId;
    element.setAttribute("data-howler-initialized", "true");
    element.setAttribute("data-howler-status", "not-playing");

    const audioSrc = element.getAttribute("data-howler-src");

    // Чистим старый инстанс
    if (window.howlerSoundInstances[uniqueId]) {
      try {
        window.howlerSoundInstances[uniqueId].unload();
      } catch (e) { }
      delete window.howlerSoundInstances[uniqueId];
    }

    // UI
    const durationElement = element.querySelector(
      '[data-howler-info="duration"]'
    );
    const progressTextElement = element.querySelector(
      '[data-howler-info="progress"]'
    );
    const timelineContainer = element.querySelector(
      '[data-howler-control="timeline"]'
    );
    const timelineBar = element.querySelector(
      '[data-howler-control="progress"]'
    );
    const toggleButton = element.querySelector(
      '[data-howler-control="toggle-play"]'
    );

    const icon = element.querySelector(".howler-player-icon");

    const sound = new Howl({
      src: [audioSrc],
      html5: false, // Use Web Audio API for analyzer compatibility
      preload: false,

      onload: () => {
        if (durationElement)
          durationElement.textContent = formatTime(sound.duration());

        toggleButton?.classList.remove("howler-loading");
        icon?.classList.remove("howler-icon-hidden");

        const audioNode = sound._sounds?.[0]?._node;
        if (audioNode) {
          audioNode.addEventListener("pause", () => {
            if (sound.playing()) sound.pause();
          });
          audioNode.addEventListener("play", () => {
            if (!sound.playing()) sound.play();
          });
        }
      },

      onplay: () => {
        toggleButton?.classList.remove("howler-loading");
        icon?.classList.remove("howler-icon-hidden");

        pauseAllExcept(uniqueId);
        element.setAttribute("data-howler-status", "playing");
        requestAnimationFrame(updateProgress);
      },

      onpause: () => element.setAttribute("data-howler-status", "not-playing"),
      onstop: () => element.setAttribute("data-howler-status", "not-playing"),
      onend: resetUI,
    });

    window.howlerSoundInstances[uniqueId] = sound;

    // -----------------------------
    // FUNCTIONS
    // -----------------------------

    function updateProgress() {
      if (!sound.playing()) return;
      updateUI();
      requestAnimationFrame(updateProgress);
    }

    function updateUI() {
      const currentTime = sound.seek() || 0;
      const duration = sound.duration() || 1;

      if (progressTextElement)
        progressTextElement.textContent = formatTime(currentTime);

      if (timelineBar)
        timelineBar.style.width = `${(currentTime / duration) * 100}%`;

      timelineContainer?.setAttribute(
        "aria-valuenow",
        Math.round((currentTime / duration) * 100)
      );
    }

    function resetUI() {
      if (timelineBar) timelineBar.style.width = "100%";
      element.setAttribute("data-howler-status", "not-playing");
    }

    function seekToPosition(event) {
      const rect = timelineContainer.getBoundingClientRect();
      const percentage = (event.clientX - rect.left) / rect.width;
      sound.seek(sound.duration() * percentage);

      if (!sound.playing()) {
        pauseAllExcept(uniqueId);
        sound.play();
        element.setAttribute("data-howler-status", "playing");
      }

      updateUI();
    }

    function togglePlay() {
      const isPlaying = sound.playing();

      // Если звук не загружен — включаем спиннер и прячем иконку
      if (!isPlaying && sound.state() !== "loaded") {
        toggleButton?.classList.add("howler-loading");
        icon?.classList.add("howler-icon-hidden");
        sound.load();
      }

      isPlaying ? sound.pause() : (pauseAllExcept(uniqueId), sound.play());
      toggleButton?.setAttribute("aria-pressed", !isPlaying);
    }

    function pauseAllExcept(id) {
      Object.keys(window.howlerSoundInstances).forEach((otherId) => {
        const other = window.howlerSoundInstances[otherId];
        try {
          if (otherId !== id && other.playing()) {
            other.pause();
            document
              .getElementById(otherId)
              ?.setAttribute("data-howler-status", "not-playing");
          }
        } catch (e) {
          console.warn("pauseAllExcept error:", otherId, e);
        }
      });
    }

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }

    // -----------------------------
    // EVENT LISTENERS
    // -----------------------------
    toggleButton?.addEventListener("click", togglePlay);
    timelineContainer?.addEventListener("click", seekToPosition);
    sound.on("seek", updateUI);
    sound.on("play", updateUI);
  });

  return window.howlerSoundInstances;
}

// Initialize Audio Player
document.addEventListener("DOMContentLoaded", initHowlerJSAudioPlayer);
