/* ============================================================
   SHAHZOD ABDUJABBOROV — "POCKET THEATER"
   Hand-rolled vanilla JS. One rAF loop, shared observers.
   Press D — the widget inspector is real.
   ============================================================ */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const vibrate = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
  const announce = (msg) => { const el = document.getElementById("live-status"); if (el) { el.textContent = ""; setTimeout(() => (el.textContent = msg), 30); } };

  /* ---------- clocks ---------- */
  const fmtPhone = (d) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
  const tashkentFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" });

  function tickClocks() {
    const now = new Date();
    const phoneTime = fmtPhone(now);
    $$(".demo-time, .watch-time").forEach((el) => (el.textContent = phoneTime));
    const lockClock = $("#lock-clock");
    if (lockClock) lockClock.textContent = phoneTime;
    const lockDate = $("#lock-date");
    const L = document.documentElement.lang || "en";
    if (lockDate) {
      if (L === "uz") {
        const wd = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"][now.getDay()];
        const mo = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"][now.getMonth()];
        lockDate.textContent = `${wd}, ${now.getDate()}-${mo}`;
      } else {
        lockDate.textContent = now.toLocaleDateString(L === "ru" ? "ru-RU" : "en-US", { weekday: "long", month: "long", day: "numeric" });
      }
    }
    const tz = tashkentFmt.format(now);
    ["#tz-clock", "#tz-clock-2"].forEach((id) => { const el = $(id); if (el) el.textContent = tz; });
  }
  tickClocks();
  setInterval(tickClocks, 30_000);

  /* ---------- split-text engine (reusable for i18n) ---------- */
  const splitEl = (el, text) => {
    const words = text.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, i) => {
      const w = document.createElement("span");
      w.className = "w";
      const wi = document.createElement("span");
      wi.className = "wi";
      wi.textContent = word;
      wi.style.transitionDelay = `${i * 70}ms`;
      w.appendChild(wi);
      el.appendChild(w);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  };
  $$(".split").forEach((el) => {
    el.dataset.en = el.textContent.trim().replace(/\s+/g, " ");
    splitEl(el, el.dataset.en);
  });

  /* ---------- i18n: EN default, RU + UZ ---------- */
  (() => {
    const DICTS = (window.__I18N || { ru: {}, uz: {} });
    const norm = (s) => s.trim().replace(/\s+/g, " ");
    const HTMLSEL = [
      ".island-menu a", ".hero-copy .lead", ".cta-row .btn", ".hero-hint",
      ".ship-rows .row-title", ".section-sub", ".chapter-copy > p", ".chapter-meta li",
      ".rail-label", ".rel-card > p:last-child", ".group-label", ".s-text b", ".s-text small",
      ".stat-label", ".lab-text small", ".lib-text small", ".iap-text b", ".iap-text small",
      ".iap-get span", ".footer p", ".im-bubble", ".im-name small", ".chip",
      ".rel-card h3", ".notif-body", ".notif-time", ".unlock-hint", ".hs-greeting",
      ".im-status", ".kicker", ".lab-text > b", ".marquee-track span", ".store-stars",
    ].join(",");
    const htmlEls = $$(HTMLSEL).map((el) => {
      if (!el.dataset.en) el.dataset.en = norm(el.innerHTML);
      return el;
    });
    const splitEls = $$(".split");

    const apply = (lang) => {
      const dict = lang === "en" ? null : DICTS[lang] || {};
      htmlEls.forEach((el) => {
        const en = el.dataset.en;
        const t = dict ? dict[en] : null;
        el.innerHTML = t != null ? t : en;
      });
      splitEls.forEach((el) => {
        const en = el.dataset.en;
        const t = dict ? dict[en] : null;
        splitEl(el, t != null ? t : en);
      });
      document.documentElement.lang = lang;
      tickClocks();
      // re-apply platform-aware store labels after RU/UZ overwrite (Android → Google Play)
      if (typeof window.__syncStoreLabels === "function") window.__syncStoreLabels();
    };

    const btns = $$(".lang-btn");
    const setActive = (lang) => btns.forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const choose = (lang) => {
      try { localStorage.setItem("lang", lang); } catch (_) {}
      setActive(lang);
      apply(lang);
      announce(lang === "ru" ? "Язык: русский" : lang === "uz" ? "Til: o‘zbek" : "Language: English");
    };
    btns.forEach((b) => b.addEventListener("click", () => choose(b.dataset.lang)));

    let saved = "en";
    try { saved = localStorage.getItem("lang") || "en"; } catch (_) {}
    if (saved !== "en" && DICTS[saved]) { setActive(saved); apply(saved); }
  })();

  /* ---------- reveal observer (shared) ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealIO.unobserve(e.target);
    }),
    { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
  );
  const startReveals = () => $$(".split, .reveal, .stat-card, .rel-card").forEach((el) => revealIO.observe(el));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(startReveals, startReveals);
  } else startReveals();

  /* ---------- dynamic island nav ---------- */
  const island = $("#island");
  const islandPill = $("#island-pill");
  const islandLabel = $("#island-label");
  let currentLabel = islandLabel.textContent;
  let swapTimer;

  islandPill.addEventListener("click", () => {
    const open = island.classList.toggle("open");
    islandPill.setAttribute("aria-expanded", String(open));
    vibrate(8);
  });
  const closeIsland = () => {
    if (!island.classList.contains("open")) return;
    const hadFocus = island.contains(document.activeElement) && document.activeElement !== islandPill;
    island.classList.remove("open");
    islandPill.setAttribute("aria-expanded", "false");
    if (hadFocus) islandPill.focus();
  };
  document.addEventListener("click", (e) => { if (!island.contains(e.target)) closeIsland(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeIsland(); });
  $$(".island-menu a").forEach((a) =>
    a.addEventListener("click", () => { island.classList.remove("open"); islandPill.setAttribute("aria-expanded", "false"); })
  );

  function setIsland(label, accent) {
    if (label === currentLabel) return;
    currentLabel = label;
    island.classList.add("swapping");
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      const w0 = islandPill.offsetWidth;
      islandLabel.textContent = label;
      const w1 = islandPill.offsetWidth;
      if (!RM && Math.abs(w1 - w0) > 2) {
        islandPill.style.transition = "none";
        islandPill.style.width = `${w0}px`;
        void islandPill.offsetWidth;
        islandPill.style.transition = "border-color 0.3s, width 0.4s cubic-bezier(0.34, 1.3, 0.64, 1)";
        islandPill.style.width = `${w1}px`;
        setTimeout(() => { islandPill.style.width = ""; }, 450);
      }
      island.classList.remove("swapping");
    }, 150);
    island.style.setProperty("--island-accent", accent || "var(--lime)");
  }

  const sectionLabels = [
    [$("#hero"), "Shakhzod · online", null],
    [$("#ship"), "what I ship", null],
    ...$$(".chapter").map((ch) => [ch, ch.dataset.island, getComputedStyle(ch).getPropertyValue("--app").trim()]),
    [$("#library"), "app library", null],
    [$("#path"), "release notes", null],
    [$("#skills"), "settings", null],
    [$("#numbers"), "analytics", null],
    [$("#lab"), "testflight", null],
    [$("#services"), "app store", null],
    [$("#contact"), "messages", null],
  ].filter(([el]) => el);

  const islandIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const hit = sectionLabels.find(([el]) => el === e.target);
      if (hit) setIsland(hit[1], hit[2]);
    }),
    { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
  );
  sectionLabels.forEach(([el]) => islandIO.observe(el));

  /* ---------- hero: unlock scrub (scroll-driven) + tilt (pointer-driven) ---------- */
  const hero = $("#hero");
  const heroPhone = $("#hero-phone");
  const wide = () => innerWidth > 900;

  const homescreen = $("#homescreen");
  let heroHeights = { hero: hero.offsetHeight, vh: innerHeight };
  const applyScrub = () => {
    if (RM) return;
    if (!wide()) { heroPhone.style.setProperty("--unlock", "0"); return; }
    const p = clamp(scrollY / (heroHeights.hero - heroHeights.vh), 0, 1);
    heroPhone.style.setProperty("--unlock", p.toFixed(4));
    if (homescreen) homescreen.inert = p < 0.85;
  };

  if (FINE && !RM) {
    hero.addEventListener("pointermove", (e) => {
      if (!wide()) return;
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      heroPhone.style.setProperty("--ry", `${(-8 + nx * 10).toFixed(2)}deg`);
      heroPhone.style.setProperty("--rx", `${(2 - ny * 8).toFixed(2)}deg`);
    });
    hero.addEventListener("pointerleave", () => {
      heroPhone.style.setProperty("--ry", "-8deg");
      heroPhone.style.setProperty("--rx", "2deg");
    });
  }

  /* ---------- device theater: play once entered, pause offscreen (no restarts) ---------- */
  const chapterIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("playing");
        e.target.classList.remove("idle");
      } else if (e.target.classList.contains("playing")) {
        e.target.classList.add("idle");
      }
    }),
    { threshold: 0, rootMargin: "-18% 0px -18% 0px" }
  );
  $$(".chapter").forEach((ch) => chapterIO.observe(ch));

  /* marquee: run only while visible; global pause toggle */
  const marquee = $(".marquee");
  const marqueeToggle = $("#marquee-toggle");
  if (marquee) {
    const mIO = new IntersectionObserver((es) => es.forEach((e) => marquee.classList.toggle("live", e.isIntersecting)), { threshold: 0 });
    mIO.observe(marquee);
  }
  if (marqueeToggle) {
    marqueeToggle.addEventListener("click", () => {
      const paused = document.body.classList.toggle("paused");
      marqueeToggle.setAttribute("aria-pressed", String(paused));
      marqueeToggle.setAttribute("aria-label", paused ? "Resume animations" : "Pause animations");
      marqueeToggle.textContent = paused ? "▶" : "⏸";
      announce(paused ? "Animations paused" : "Animations resumed");
    });
  }

  /* ---------- dokon courier map (canvas) ---------- */
  const mapCanvas = $(".dokon-map");
  const dokonChapter = $("#ch-dokon");
  if (mapCanvas && dokonChapter) {
    const ctx = mapCanvas.getContext("2d");
    const ROUTE = [[0.12, 0.85], [0.12, 0.55], [0.38, 0.55], [0.38, 0.25], [0.62, 0.25], [0.62, 0.62], [0.86, 0.62], [0.86, 0.3]];
    let W = 0, H = 0, running = false, t0 = 0;

    function sizeMap() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = mapCanvas.getBoundingClientRect();
      if (!r.width) return;
      W = r.width; H = r.height;
      routeTotal = 0;
      mapCanvas.width = W * dpr;
      mapCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let routeTotal = 0;
    const seg = (i) => {
      const [ax, ay] = ROUTE[i], [bx, by] = ROUTE[i + 1];
      return Math.hypot((bx - ax) * W, (by - ay) * H);
    };
    function pointAt(p) {
      if (!routeTotal) routeTotal = ROUTE.slice(0, -1).reduce((s, _, i) => s + seg(i), 0);
      const total = routeTotal;
      let d = p * total;
      for (let i = 0; i < ROUTE.length - 1; i++) {
        const L = seg(i);
        if (d <= L) {
          const k = L ? d / L : 0;
          return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * k, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * k];
        }
        d -= L;
      }
      return ROUTE[ROUTE.length - 1];
    }

    function drawMap(now) {
      if (!W) sizeMap();
      // light map base (real Dokon design)
      ctx.fillStyle = "#F5F3EC";
      ctx.fillRect(0, 0, W, H);

      // city blocks
      ctx.fillStyle = "#E9E5D9";
      [[0.05, 0.08, 0.2, 0.18], [0.32, 0.05, 0.22, 0.14], [0.62, 0.1, 0.24, 0.16],
       [0.08, 0.38, 0.18, 0.2], [0.55, 0.42, 0.2, 0.16], [0.3, 0.62, 0.22, 0.18],
       [0.68, 0.68, 0.2, 0.16], [0.06, 0.72, 0.16, 0.14]].forEach(([x, y, w, h]) => {
        ctx.beginPath();
        ctx.roundRect(x * W, y * H, w * W, h * H, 4);
        ctx.fill();
      });

      // streets: casing + white fill
      const streets = () => {
        ctx.beginPath();
        for (let x = 0.12; x < 1; x += 0.247) { ctx.moveTo(x * W - 0.06 * W, 0); ctx.lineTo(x * W + 0.06 * W, H); }
        for (let y = 0.18; y < 1; y += 0.2) { ctx.moveTo(0, y * H); ctx.lineTo(W, y * H + 0.04 * H); }
        ctx.stroke();
      };
      ctx.strokeStyle = "#DDD8C9"; ctx.lineWidth = 5; streets();
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3.4; streets();

      // route
      ctx.strokeStyle = "#FF8200";
      ctx.lineWidth = 2.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ROUTE.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)));
      ctx.stroke();

      const pin = (x, y, emoji, pulse) => {
        if (pulse !== undefined) {
          ctx.beginPath();
          ctx.arc(x, y, 10 + pulse * 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,130,0,${0.18 - pulse * 0.12})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FF8200";
        ctx.stroke();
        ctx.font = "9px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji, x, y + 0.5);
      };

      // destination (house pin, pulsing)
      const [dx, dy] = ROUTE[ROUTE.length - 1];
      const pulse = RM ? 0.5 : (Math.sin(now / 400) + 1) / 2;
      pin(dx * W, dy * H, "🏠", pulse);

      // courier (scooter pin, moving)
      const p = RM ? 0.55 : ((now - t0) % 7000) / 7000;
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const [cx, cy] = pointAt(eased);
      pin(cx * W, cy * H, "🛵");
    }

    function mapLoop(now) {
      if (!running) return;
      if (!document.body.classList.contains("paused")) drawMap(now);
      if (RM) { running = false; return; }
      requestAnimationFrame(mapLoop);
    }

    let phase = 0;
    const mapIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !running) {
          running = true;
          t0 = performance.now() - phase;
          sizeMap();
          requestAnimationFrame(mapLoop);
        } else if (!e.isIntersecting && running) {
          phase = (performance.now() - t0) % 7000;
          running = false;
        }
      });
    }, { threshold: 0.2 });
    mapIO.observe(mapCanvas);
    addEventListener("resize", () => {
      W = 0;
      if (RM && !running) { sizeMap(); drawMap(performance.now()); }
    }, { passive: true });
  }

  /* ---------- settings toggles ---------- */
  const groupsIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      groupsIO.unobserve(e.target);
      $$(".s-row", e.target).forEach((row, i) =>
        setTimeout(() => { row.classList.add("on"); vibrate(8); }, RM ? 0 : 250 + i * 180)
      );
    });
  }, { threshold: 0.4 });
  $$(".settings-group").forEach((g) => groupsIO.observe(g));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const end = +el.dataset.count;
      const dec = Number.isInteger(end) ? 0 : 1;
      if (RM) { el.textContent = end.toFixed(dec); return; }
      const start = performance.now();
      const D = 1400;
      (function step(now) {
        const p = clamp((now - start) / D, 0, 1);
        el.textContent = ((1 - Math.pow(2, -10 * p)) * end).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = end.toFixed(dec);
      })(start);
    });
  }, { threshold: 0.6 });
  $$(".count").forEach((el) => countIO.observe(el));

  /* ---------- sparklines: draw on reveal ---------- */
  $$(".spark path").forEach((path) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = RM ? 0 : len;
    path.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s";
  });
  const sparkIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      sparkIO.unobserve(e.target);
      $$(".spark path", e.target).forEach((p) => (p.style.strokeDashoffset = 0));
    });
  }, { threshold: 0.5 });
  $$(".stat-card").forEach((c) => sparkIO.observe(c));

  /* ---------- one shared scroll handler: scrub + timeline spine ---------- */
  const timeline = $(".timeline");
  let scrollScheduled = false;
  const onScrollWork = () => {
    scrollScheduled = false;
    applyScrub();
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((innerHeight * 0.8 - r.top) / r.height, 0, 1);
      timeline.style.setProperty("--spine", p.toFixed(3));
    }
  };
  const onScroll = () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(onScrollWork);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => {
    heroHeights = { hero: hero.offsetHeight, vh: innerHeight };
    onScroll();
  }, { passive: true });
  onScrollWork();

  /* ---------- app store GET buttons ---------- */
  $$(".iap-get").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("open")) {
        $("#contact").scrollIntoView({ behavior: RM ? "auto" : "smooth" });
        return;
      }
      if (btn.classList.contains("loading")) return;
      btn.classList.add("loading");
      vibrate(8);
      setTimeout(() => {
        btn.classList.remove("loading");
        btn.classList.add("open");
        $("span", btn).textContent = "OPEN";
        vibrate(8);
        announce("Ready — taking you to contact");
        setTimeout(() => $("#contact").scrollIntoView({ behavior: RM ? "auto" : "smooth" }), RM ? 100 : 700);
      }, RM ? 50 : 950);
    });
  });

  /* ---------- greeting cycle ---------- */
  const greeting = $("#greeting");
  if (greeting && !RM) {
    const words = [["Hello", "en"], ["Salom", "uz"], ["Привет", "ru"], ["Assalomu alaykum", "uz"]];
    let gi = 0;
    setInterval(() => {
      greeting.classList.add("swap");
      setTimeout(() => {
        gi = (gi + 1) % words.length;
        greeting.textContent = words[gi][0];
        greeting.setAttribute("lang", words[gi][1]);
        greeting.classList.remove("swap");
      }, 320);
    }, 2800);
  }

  /* ---------- iMessage sequence ---------- */
  const imessage = $(".imessage");
  if (imessage) {
    const bubbles = $$(".im-bubble", imessage);
    const typing = $(".im-typing", imessage);
    const status = $(".im-status", imessage);
    const play = () => {
      if (RM) {
        bubbles.forEach((b) => b.classList.add("show"));
        status.classList.add("show");
        return;
      }
      setTimeout(() => bubbles[0].classList.add("show"), 300);
      setTimeout(() => typing.classList.add("show"), 1000);
      setTimeout(() => { typing.classList.remove("show"); bubbles[1].classList.add("show"); }, 2400);
      setTimeout(() => typing.classList.add("show"), 2900);
      setTimeout(() => { typing.classList.remove("show"); bubbles[2].classList.add("show"); }, 4000);
      setTimeout(() => status.classList.add("show"), 4600);
    };
    const imIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        imIO.unobserve(e.target);
        play();
      });
    }, { threshold: 0.35 });
    imIO.observe(imessage);
  }

  /* ---------- copy email chip ---------- */
  const copyChip = $(".chip-copy");
  if (copyChip) {
    const original = copyChip.textContent;
    copyChip.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyChip.dataset.email);
        copyChip.classList.add("copied");
        copyChip.textContent = "✓ Copied — talk soon";
        announce("Email address copied to clipboard");
        vibrate(8);
        setTimeout(() => { copyChip.classList.remove("copied"); copyChip.textContent = original; }, 1800);
      } catch (_) {
        location.href = `mailto:${copyChip.dataset.email}`;
      }
    });
  }

  /* ---------- widget inspector (press D / triple-tap island) ---------- */
  const badge = document.createElement("div");
  badge.className = "debug-badge mono";
  badge.textContent = "debugPaintSizeEnabled = true · press D / triple-tap to exit";
  document.body.appendChild(badge);

  const toggleDebug = () => { document.body.classList.toggle("debug"); vibrate(12); };
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "d" || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    toggleDebug();
  });
  let taps = [];
  islandPill.addEventListener("pointerdown", () => {
    const now = Date.now();
    taps = taps.filter((t) => now - t < 650);
    taps.push(now);
    if (taps.length >= 3) { taps = []; toggleDebug(); }
  });

  /* ---------- mobile thumb bar ---------- */
  let pastHero = false, contactVisible = false;
  const syncThumb = () => document.body.classList.toggle("show-thumb", pastHero && !contactVisible);
  const heroEndIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { pastHero = !e.isIntersecting; syncThumb(); });
  }, { threshold: 0 });
  heroEndIO.observe(hero);
  const contactIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { contactVisible = e.isIntersecting; syncThumb(); });
  }, { threshold: 0.15 });
  contactIO.observe($("#contact"));

  /* ---------- platform-aware store links: Android/Windows visitors get Google Play ---------- */
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
  const prefersPlay = !isApple && /Android|Windows|Linux/i.test(navigator.userAgent);
  if (prefersPlay) {
    $$("a[data-play]").forEach((a) => {
      if (!a.dataset.play) return;
      a.href = a.dataset.play;
      $$(".store-open, .lib-meta", a).concat(a.matches(".lib-meta") ? [a] : []).forEach((el) => {
        el.textContent = el.textContent
          .replace("VIEW ON THE APP STORE", "VIEW ON GOOGLE PLAY")
          .replace("APP STORE", "GOOGLE PLAY");
      });
    });
  }

  /* ---------- screenshot rails: drag to scroll ---------- */
  $$(".shot-rail").forEach((rail) => {
    $$("img", rail).forEach((img) => (img.draggable = false));
    let down = false, startX = 0, startLeft = 0;
    rail.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; startX = e.clientX; startLeft = rail.scrollLeft;
      rail.classList.add("dragging");
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener("pointermove", (e) => {
      if (!down) return;
      rail.scrollLeft = startLeft - (e.clientX - startX);
    });
    ["pointerup", "pointercancel"].forEach((ev) =>
      rail.addEventListener(ev, () => { down = false; rail.classList.remove("dragging"); })
    );
  });

  /* ---------- go ---------- */
  addEventListener("load", () => document.body.classList.add("loaded"));
  // in case load already fired (defer + fast cache)
  if (document.readyState === "complete") document.body.classList.add("loaded");
})();
