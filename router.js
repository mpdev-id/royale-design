/* ============================================================
 * Royale Gym & Cafe - Unified Demo Shell
 * Menggabungkan 6 mockup Stitch menjadi 1 aplikasi tunggal.
 * Semua markup view diambil apa adanya dari code.html aslinya
 * (tampilan tidak diubah), hanya shell-nya yang dibungkus.
 * ============================================================ */

(function () {
  "use strict";

  const VIEWS = {
    "login-gym":   { file: "views/login-gym.html",   scripts: "views/login-gym.scripts.html",   type: "login" },
    "login-cafe":  { file: "views/login-cafe.html",  scripts: "views/login-cafe.scripts.html",  type: "login" },
    "dashboard":   { file: "views/dashboard.html",   type: "app" },
    "member":      { file: "views/member.html",      type: "app" },
    "pos":         { file: "views/pos.html",         type: "app" },
    "laporan":     { file: "views/laporan.html",     type: "app" }
  };

  const ORDER = ["login-gym", "login-cafe", "dashboard", "member", "pos", "laporan"];
  const state = { current: null, loaded: {}, loading: {}, outlet: "gym" };

  /* ---------- toast demo (pengganti alert) + sinyal sukses login ---------- */
  window.royaleToast = function (msg) {
    const old = document.getElementById("royale-toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.id = "royale-toast";
    t.style.cssText =
      "position:fixed;left:50%;bottom:28px;transform:translate(-50%,0);z-index:9999;" +
      "background:#33302b;color:#f6f0e8;padding:12px 20px;border-radius:12px;" +
      "font:600 13px/1.45 'Plus Jakarta Sans',system-ui,sans-serif;" +
      "box-shadow:0 12px 32px rgba(30,27,23,0.28);max-width:min(90vw,520px);" +
      "opacity:0;transition:opacity .25s ease,transform .25s ease;pointer-events:none;";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.style.opacity = "1";
      t.style.transform = "translate(-50%,-6px)";
    });
    setTimeout(function () {
      t.style.opacity = "0";
      t.style.transform = "translate(-50%,0)";
      setTimeout(function () { if (t.parentNode) t.remove(); }, 300);
    }, 3200);
    // sinyal sukses login dari view -> pindah ke dashboard
    if (/Selamat Datang/i.test(String(msg || ""))) {
      setTimeout(function () { go("dashboard"); }, 900);
    }
  };

  /* ---------- util ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function stripScripts(root) {
    $$("script", root).forEach(function (n) { n.remove(); });
  }

  /* jalankan ulang <script> inline yang ada di dalam view (innerHTML tidak mengeksekusi script) */
  function runInlineScripts(root) {
    $$("script", root).forEach(function (old) {
      const s = document.createElement("script");
      if (old.src) { s.src = old.src; }
      else {
        // bungkus dalam IIFE + export deklarasi ke window:
        // mencegah "Identifier 'x' has already been declared" saat view dimuat ulang,
        // sekaligus menjaga inline onclick="pressDigit()" tetap berfungsi.
        const text = old.textContent;
        const re = /(?:^|[\s;{])(?:let|const|var|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
        const names = [];
        let m;
        while ((m = re.exec(text))) names.push(m[1]);
        const uniq = Array.from(new Set(names));
        const exports = uniq.map(function (n) {
          return "try{window['" + n + "']=" + n + ";}catch(e){}";
        }).join("");
        s.textContent = "(function(){\n" + text + "\n" + exports + "\n}).call(window);";
      }
      old.parentNode.replaceChild(s, old);
    });
  }

  function activateSplashHide() {
    const splash = $("#shell-splash");
    if (!splash) return;
    setTimeout(function () { splash.classList.add("fade-out"); }, 900);
    setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 1500);
  }

  /* ---------- kirim event ke view ---------- */
  function dispatchViewEvent(name) {
    const el = $("#view-" + name);
    if (!el) return;
    document.dispatchEvent(new CustomEvent("royale:view-ready", { detail: { name: name, el: el } }));
  }

  /* ---------- sidebar terpadu (dipasang ke view app) ---------- */
  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: '<rect height="7" rx="1" width="7" x="3" y="3"></rect><rect height="7" rx="1" width="7" x="14" y="3"></rect><rect height="7" rx="1" width="7" x="14" y="14"></rect><rect height="7" rx="1" width="7" x="3" y="14"></rect>' },
    { id: "member", label: "Data Member", icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
    { id: "pos", label: "POS Gym", icon: '<path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m2 6 4-4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path>' },
    { id: "laporan", label: "Laporan", icon: '<line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line>' }
  ];

  function svgIcon(inner, cls) {
    return '<svg class="' + (cls || "w-4 h-4 shrink-0") + '" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">' + inner + "</svg>";
  }

  function buildSidebar(active) {
    const links = NAV_ITEMS.map(function (it) {
      const on = it.id === active;
      const base = "flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl font-medium text-xs transition nav-link";
      const cls = on
        ? base + " bg-primary-container text-white font-semibold shadow-sm"
        : base + " text-on-surface-variant hover:bg-surface-container-high";
      return '<a data-nav="' + it.id + '" class="' + cls + '" href="#">' +
        '<div class="flex items-center gap-3">' + svgIcon(it.icon, "w-4 h-4 shrink-0 " + (on ? "text-white" : "text-on-surface-variant")) +
        "<span>" + it.label + "</span></div></a>";
    }).join("");

    return '<aside class="rg-sidebar w-[240px] min-h-screen bg-surface-container border-r border-outline-variant flex flex-col justify-between shrink-0 p-4">' +
      '<div><div class="flex items-center gap-3 px-2 py-2 mb-6">' +
      '<button type="button" class="rg-close w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center active:scale-95 transition" data-action="close-nav" aria-label="Tutup menu">' +
      '<span class="material-symbols-outlined text-[18px]">close</span></button>' +
      '<div class="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-sm font-black text-lg">' +
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24"><path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12"></path></svg>' +
      '</div><div><h1 class="text-sm font-bold tracking-tight text-on-surface uppercase leading-tight">Royale</h1>' +
      '<p class="text-[11px] font-medium text-on-surface-variant">Gym Management &amp; POS</p></div></div>' +
      '<nav class="space-y-1.5">' + links + "</nav></div>" +
      '<div class="p-3 bg-surface-container-high rounded-xl border border-outline-variant flex items-center justify-between">' +
      '<div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></div>' +
      '<span class="text-[11px] font-semibold text-on-surface-variant">Sync Cloud Active</span></div>' +
      '<span class="text-[10px] font-mono text-outline">v2.4-TAB</span></div></aside>';
  }

  /* ---------- topbar terpadu ---------- */
  function buildTopbar() {
    return '<header class="w-full bg-surface-container-low px-6 py-3 flex items-center justify-between shadow-sm shrink-0 border-b border-outline-variant/30">' +
      '<div class="flex items-center gap-3">' +
      '<button type="button" class="rg-burger w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center active:scale-95 transition" data-action="burger" aria-label="Menu">' +
      '<span class="material-symbols-outlined text-[20px]">menu</span></button>' +
      '<div class="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold flex items-center justify-center text-xs shadow-sm">AD</div>' +
      '<div><div class="flex items-center gap-2">' +
      '<span class="font-headline-md text-sm text-on-surface font-bold leading-none rg-hide-xs">Adimas Prasetya</span>' +
      '<span class="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-[9px] tracking-wide font-semibold rg-hide-sm">SHIFT PAGI 06:00 - 14:00</span></div>' +
      '<p class="font-body-sm text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5 leading-none rg-hide-md">' +
      '<span class="material-symbols-outlined text-[12px] text-primary">desktop_windows</span> Terminal Kasir #01 • Lobby Utama - Royale Gym</p></div></div>' +
      '<div class="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-lg shadow-inner rg-hide-md">' +
      '<div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span><div class="flex flex-col"><span class="font-label-sm text-[8px] text-on-surface-variant uppercase leading-none">Terminal Wajah</span><span class="font-label-md text-[9px] text-secondary font-bold leading-none mt-0.5">ONLINE (Standby)</span></div></div>' +
      '<div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span><div class="flex flex-col"><span class="font-label-sm text-[8px] text-on-surface-variant uppercase leading-none">Scanner Wajah</span><span class="font-label-md text-secondary font-bold leading-none mt-0.5 text-[9px]">ONLINE</span></div></div>' +
      '<div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span><div class="flex flex-col"><span class="font-label-sm text-[8px] text-on-surface-variant uppercase leading-none">Printer Kasir</span><span class="font-label-md text-secondary font-bold leading-none mt-0.5 text-[9px]">READY</span></div></div>' +
      '</div><div class="flex items-center gap-3"><div class="text-right leading-tight rg-hide-sm">' +
      '<div class="font-headline-md text-xs font-bold text-on-surface tracking-tight" id="shell-live-time">11:25:24 WIB</div>' +
      '<div class="font-label-sm text-[9px] text-on-surface-variant" id="shell-live-date">Minggu, 27 Sep 2026</div></div>' +
      '<button class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface-variant font-label-md text-xs active:scale-95 transition" type="button" data-action="logout">' +
      '<span class="material-symbols-outlined text-[15px]">logout</span><span class="text-[11px] font-semibold rg-hide-sm">Keluar</span></button></div></header>';
  }

  function buildFooter(active) {
    const map = { dashboard: "Dashboard Operasional", member: "Database Member", pos: "Point of Sale Gym", laporan: "Laporan & Laci Kasir" };
    return '<footer class="h-10 bg-surface-container-high px-6 flex items-center justify-between text-on-surface-variant font-label-sm text-[11px] shrink-0 border-t border-outline-variant/30">' +
      '<div class="flex items-center gap-5"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-secondary"></span>' +
      '<span>Cloud Sync: <strong>Online (12ms)</strong></span></div>' +
      '<div class="flex items-center gap-2 rg-hide-md"><span class="material-symbols-outlined text-[14px] text-primary">storage</span>' +
      '<span>DB Member: <strong>Up to date</strong></span></div>' +
      '<div class="flex items-center gap-2 rg-hide-sm"><span class="material-symbols-outlined text-[14px] text-secondary">verified_user</span>' +
      '<span>Modul: <strong>' + (map[active] || "Royale") + '</strong></span></div></div>' +
      '<div class="flex items-center gap-2 font-medium rg-hide-sm"><span class="material-symbols-outlined text-[14px] text-on-surface-variant">hourglass_top</span>' +
      '<span>Sisa Shift Adimas: <strong class="text-on-surface">4 Jam 18 Menit</strong></span></div></footer>';
  }

  /* ---------- normalisasi view app: bungkus konten asli ---------- */
  function normalizeAppView(name, html) {
    let inner = html;

    // 1) Buang sidebar/topbar/footer asli (akan diganti shell terpadu)
    inner = inner.replace(/<aside[\s\S]*?<\/aside>/, "");
    inner = inner.replace(/<header[\s\S]*?<\/header>/, "");
    inner = inner.replace(/<footer[\s\S]*?<\/footer>/, "");

    // 2) Fix kelas layout pada <main> (ada yang fixed, ada yang flex-1)
    inner = inner.replace(/<main[^>]*>/, '<main class="flex-1 min-w-0 w-full bg-surface-container-lowest flex flex-col overflow-hidden">');

    // 3) Hilangkan class body-layout yang dipakai mockup lama
    inner = inner.replace(/bg-surface font-body-md text-on-surface select-none antialiased/g, "flex flex-col flex-1 min-h-0");

    // 4) Buang offset padding-left & left-64 untuk sidebar fixed (sudah diganti sidebar shell)
    inner = inner.replace(/class="pl-64 flex flex-col h-screen overflow-hidden"/g, 'class="flex flex-col h-screen overflow-hidden"');
    inner = inner.replace(/class="pl-64[^"]*"/g, function (m) { return m.replace(/pl-64\s*/, ""); });
    inner = inner.replace(/left-64\s*/g, "");
    inner = inner.replace(/class="flex flex-col h-screen overflow-hidden"/g, 'class="flex flex-col h-full overflow-hidden"');

    return buildSidebar(name) + inner;
  }

  /* ---------- load & render view ---------- */
  function loadView(name) {
    const cfg = VIEWS[name];
    if (!cfg) return Promise.reject(new Error("unknown view " + name));
    if (state.loaded[name]) return Promise.resolve(state.loaded[name]);
    if (state.loading[name]) return state.loading[name];

    const p = fetch(cfg.file)
      .then(function (r) { if (!r.ok) throw new Error("fetch " + cfg.file + " -> " + r.status); return r.text(); })
      .then(function (html) {
        let body = html;
        const m = body.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        if (m) body = m[1];

        const host = $("#view-" + name);
        if (!host) throw new Error("no host #view-" + name);

        if (cfg.type === "login") {
          host.innerHTML = "<div class=\"flex flex-col w-full min-h-screen\">" + body + "</div>";
          document.body.classList.add("login-shell");
        } else {
          host.innerHTML = normalizeAppView(name, body);
          document.body.classList.remove("login-shell");
        }
        runInlineScripts(host);
        state.loaded[name] = host;
        delete state.loading[name];
        return host;
      })
      .catch(function (e) {
        delete state.loading[name];
        console.error("[royale-shell] loadView", name, e);
        throw e;
      });
    state.loading[name] = p;
    return p;
  }

  function show(name) {
    ORDER.forEach(function (n) {
      const el = $("#view-" + n);
      if (el) el.classList.toggle("active", n === name);
    });
    state.current = name;
    const cfg = VIEWS[name];
    document.body.classList.toggle("login-shell", !!(cfg && cfg.type === "login"));
    const host = $("#view-" + name);
    if (host) {
      host.classList.add("w-full", "min-h-screen");
    }
    tickClock(); // set ulang jam sesuai view yang aktif
    syncNavActive(name);
    dispatchViewEvent(name);
  }

  function syncNavActive(name) {
    $$(".nav-link").forEach(function (a) {
      const on = a.getAttribute("data-nav") === name;
      a.classList.toggle("bg-primary-container", on);
      a.classList.toggle("text-white", on);
      a.classList.toggle("font-semibold", on);
      a.classList.toggle("shadow-sm", on);
      a.classList.toggle("text-on-surface-variant", !on);
    });
  }

  function go(name) {
    if (state.current === name && state.loaded[name]) return;
    loadView(name).then(function () { show(name); }).catch(function () {});
  }

  /* ---------- pasang topbar/footer & wiring global ---------- */
  function htmlToNode(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.firstElementChild || tmp;
  }

  function wireView(name) {
    const host = $("#view-" + name);
    if (!host || host.dataset.wired) return;
    host.dataset.wired = "1";
    if (VIEWS[name].type !== "app") return;

    // Struktur: host > aside(sidebar) + wrapper(topbar, main, footer)
    const wrapper = document.createElement("div");
    wrapper.className = "flex-1 flex flex-col min-h-0 min-w-0";

    // pindahkan semua anak host kecuali aside ke dalam wrapper
    const aside = host.querySelector(":scope > aside");
    Array.from(host.children).forEach(function (ch) { if (ch !== aside) wrapper.appendChild(ch); });
    host.appendChild(wrapper);
    if (aside) host.insertBefore(aside, wrapper);

    wrapper.insertBefore(htmlToNode(buildTopbar()), wrapper.firstChild);
    wrapper.appendChild(htmlToNode(buildFooter(name)));

    // scrim penutup untuk drawer sidebar
    const scrim = document.createElement("div");
    scrim.className = "rg-scrim";
    wrapper.insertBefore(scrim, wrapper.firstChild);
    scrim.addEventListener("click", function () {
      if (aside) aside.classList.remove("open");
      scrim.classList.remove("show");
    });

    // tombol burger di topbar -> buka drawer
    const burger = wrapper.querySelector('[data-action="burger"]');
    function closeDrawer() { if (aside) aside.classList.remove("open"); scrim.classList.remove("show"); }
    function openDrawer() { if (aside) aside.classList.add("open"); scrim.classList.add("show"); }
    if (burger) burger.addEventListener("click", function () {
      if (aside && aside.classList.contains("open")) closeDrawer(); else openDrawer();
    });
    const closeNav = host.querySelector('[data-action="close-nav"]');
    if (closeNav) closeNav.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    $$(".nav-link", host).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (aside) aside.classList.remove("open");
        scrim.classList.remove("show");
        go(a.getAttribute("data-nav"));
      });
    });
    const out = wrapper.querySelector('[data-action="logout"]');
    if (out) out.addEventListener("click", function () { go(state.outlet === "cafe" ? "login-cafe" : "login-gym"); });
  }

  document.addEventListener("royale:view-ready", function (ev) {
    const name = ev.detail.name;
    if (VIEWS[name] && VIEWS[name].type === "app") wireView(name);
  });

  /* ---------- jam global ---------- */
  function tickClock() {
    const now = new Date();
    const pad = function (n) { return String(n).padStart(2, "0"); };
    const t = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + " WIB";
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const d = days[now.getDay()] + ", " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear();
    const elT = $("#shell-live-time");
    const elD = $("#shell-live-date");
    if (elT) elT.textContent = t;
    if (elD) elD.textContent = d;
    // jam pada view (id live-time di dashboard / currentTime di login)
    $$("[data-shell-clock]").forEach(function (el) { el.textContent = t; });
    $$("[data-shell-date]").forEach(function (el) { el.textContent = d; });
    const lt = $("#live-time");
    if (lt) lt.textContent = t;
    const ct = $("#currentTime");
    if (ct) ct.textContent = t.replace(/:/g, ".");
    const cd = $("#currentDate");
    if (cd) cd.textContent = d;
  }
  setInterval(tickClock, 1000);

  /* ---------- intersep login -> dashboard ---------- */
  // switchOutlet dipanggil oleh tab GYM/CAFE pada mockup login
  window.switchOutlet = function (outlet) {
    if (outlet !== "gym" && outlet !== "cafe") return;
    state.outlet = outlet;
    go(outlet === "cafe" ? "login-cafe" : "login-gym");
  };

  function patchLoginSubmit(host) {
    if (host.dataset.submitPatched) return;
    host.dataset.submitPatched = "1";
    // navigasi setelah login ditangani lewat sinyal toast di royaleToast();
    // tab outlet GYM / CAFE pindah antar login
    const tabs = $$("#tab-gym,#tab-cafe", host);
    tabs.forEach(function (tb) {
      tb.addEventListener("click", function (e) {
        const outlet = tb.id === "tab-gym" ? "gym" : "cafe";
        state.outlet = outlet;
        go(outlet === "cafe" ? "login-cafe" : "login-gym");
      });
    });
  }
  document.addEventListener("royale:view-ready", function (ev) {
    if (ev.detail.name.indexOf("login") === 0) patchLoginSubmit(ev.detail.el);
  });

  /* ---------- keyboard shortcut demo ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.altKey && e.key === "ArrowRight") {
      const i = ORDER.indexOf(state.current);
      go(ORDER[(i + 1 + ORDER.length) % ORDER.length]);
    }
    if (e.altKey && e.key === "ArrowLeft") {
      const i = ORDER.indexOf(state.current);
      go(ORDER[(i - 1 + ORDER.length) % ORDER.length]);
    }
  });

  /* ---------- deep-link hash ---------- */
  function fromHash() {
    const h = (location.hash || "").replace(/^#\/?/, "");
    return VIEWS[h] ? h : null;
  }
  window.addEventListener("hashchange", function () {
    const h = fromHash();
    if (h && h !== state.current) go(h);
  });

  /* ---------- boot ---------- */
  function boot() {
    tickClock();
    const start = fromHash() || "login-gym";
    go(start);
    activateSplashHide();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
