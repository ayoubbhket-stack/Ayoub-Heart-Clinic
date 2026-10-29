/* =====================================================================
   Ayoub Heart — main.js
   ✏️ عدّل بيانات العيادة في CONFIG فقط
   النصوص بالعربي والإنجليزي موجودة في assets/js/i18n.js
   ===================================================================== */

var CONFIG = {
  // رقم واتساب بالصيغة الدولية بدون + وبدون الصفر الأول: 01012345678 → 201012345678
  whatsappNumber: "201000000000",
  // الرقم كما يظهر للزوار
  phoneDisplay: "01000000000",
  phoneDial: "+201000000000",
  email: "info@ayoubheart.com",
  // رابط مكان العيادة على Google Maps (زر "افتح الموقع على الخريطة")
  mapLink: "https://maps.google.com/?q=Abbas+El+Akkad+Street+Nasr+City+Cairo",
  // ما يُكتب في البحث داخل الخريطة المدمجة
  mapQuery: "Abbas El Akkad Street, Nasr City, Cairo",
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/"
  },
  defaultLang: "ar",
  storageKey: "ayoub-heart-lang"
};

(function () {
  "use strict";

  var DICT = window.I18N || {};
  var SUPPORTED = ["ar", "en"];
  var root = document.documentElement;
  var currentLang = CONFIG.defaultLang;

  /* ---------- أدوات مساعدة ---------- */
  function t(key, vars) {
    var table = DICT[currentLang] || {};
    var str = table[key];
    if (str == null) str = (DICT[CONFIG.defaultLang] || {})[key];
    if (str == null) return key;
    if (vars) {
      Object.keys(vars).forEach(function (k) { str = str.split("{" + k + "}").join(vars[k]); });
    }
    return str;
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function store(lang) { try { localStorage.setItem(CONFIG.storageKey, lang); } catch (e) {} }
  function readStore() { try { return localStorage.getItem(CONFIG.storageKey); } catch (e) { return null; } }
  function setMeta(selector, value) { var el = $(selector); if (el) el.setAttribute("content", value); }
  var YEAR = String(new Date().getFullYear());

  /* ---------- روابط التواصل ---------- */
  function waLink(text) {
    return "https://wa.me/" + CONFIG.whatsappNumber + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function applyContactLinks() {
    $$("[data-whatsapp]").forEach(function (a) { a.href = waLink(t("wa.general")); });
    $$("[data-phone-link]").forEach(function (a) { a.href = "tel:" + CONFIG.phoneDial; });
    $$("[data-phone]").forEach(function (s) { s.textContent = CONFIG.phoneDisplay; });
    $$("[data-whatsapp-display]").forEach(function (s) { s.textContent = "+" + CONFIG.whatsappNumber; });
    $$("[data-email-link]").forEach(function (a) { a.href = "mailto:" + CONFIG.email; });
    $$("[data-email]").forEach(function (s) { s.textContent = CONFIG.email; });
    $$("[data-map-link]").forEach(function (a) { a.href = CONFIG.mapLink; });
    $$("[data-social]").forEach(function (a) { var u = CONFIG.social[a.getAttribute("data-social")]; if (u) a.href = u; });
  }
  function updateMap() {
    var frame = $("#map-frame");
    if (!frame) return;
    var src = "https://maps.google.com/maps?q=" + encodeURIComponent(CONFIG.mapQuery) + "&hl=" + currentLang + "&z=15&output=embed";
    if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
  }

  /* ---------- تطبيق اللغة ---------- */
  function applyLanguage(lang, opts) {
    opts = opts || {};
    if (SUPPORTED.indexOf(lang) === -1) lang = CONFIG.defaultLang;
    currentLang = lang;

    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    // كل النصوص
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = t(key, { year: YEAR, name: el.getAttribute("data-name") || "" });
    });
    // الخصائص (placeholder / aria-label / alt / title)
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split(":");
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });

    // عنوان الصفحة و SEO
    document.title = t("meta.title");
    setMeta('meta[name="description"]', t("meta.description"));
    setMeta('meta[property="og:title"]', t("meta.title"));
    setMeta('meta[property="og:description"]', t("meta.description"));
    setMeta('meta[property="og:locale"]', t("meta.ogLocale"));
    setMeta('meta[property="og:locale:alternate"]', lang === "ar" ? "en_US" : "ar_EG");

    // أزرار المبدّل
    $$("[data-lang-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang-btn") === lang ? "true" : "false");
    });

    // زر القائمة
    var toggle = $("#nav-toggle");
    if (toggle) toggle.setAttribute("aria-label", t(toggle.getAttribute("aria-expanded") === "true" ? "a11y.menuClose" : "a11y.menuOpen"));

    // رسائل الأخطاء الظاهرة حاليًا تتترجم كمان
    $$(".field-error[data-err-key]").forEach(function (el) { el.textContent = t(el.getAttribute("data-err-key")); });

    // رسالة النجاح لو ظاهرة
    var successText = $("#success-text");
    if (successText && lastSubmission) {
      successText.textContent = t("success.text", { name: lastSubmission.name });
      var sw = $("#success-wa"); if (sw) sw.href = waLink(buildMessage(lastSubmission));
    }

    applyContactLinks();
    updateMap();
    updateUrl(lang);
    if (opts.save !== false) store(lang);
    root.classList.remove("i18n-pending");
  }

  function updateUrl(lang) {
    if (!window.history || !history.replaceState || location.protocol === "file:") return;
    try {
      var url = new URL(location.href);
      if (lang === CONFIG.defaultLang) url.searchParams.delete("lang");
      else url.searchParams.set("lang", lang);
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function absolutizeHreflang() {
    if (location.protocol === "file:") return;
    var base = location.origin + location.pathname;
    $$("link[data-hreflang]").forEach(function (l) {
      var h = l.getAttribute("data-hreflang");
      l.href = h === "en" ? base + "?lang=en" : base;
    });
  }

  function initLanguage() {
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    var lang = SUPPORTED.indexOf(fromUrl) > -1 ? fromUrl : (SUPPORTED.indexOf(readStore()) > -1 ? readStore() : CONFIG.defaultLang);
    applyLanguage(lang, { save: SUPPORTED.indexOf(fromUrl) > -1 });

    $$("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.getAttribute("data-lang-btn");
        if (lang === currentLang) return;
        document.body.classList.add("lang-switching");
        // نحافظ على مكان الزائر في الصفحة
        var y = window.scrollY;
        requestAnimationFrame(function () {
          applyLanguage(lang);
          window.scrollTo(0, y);
          setTimeout(function () { document.body.classList.remove("lang-switching"); }, 120);
        });
      });
    });
  }

  /* ---------- القائمة على الموبايل ---------- */
  function initNav() {
    var toggle = $("#nav-toggle");
    var nav = $("#site-nav");
    var header = $("#site-header");
    if (!toggle || !nav) return;

    function setOpen(open) {
      if (open) nav.style.setProperty("--nav-top", header.getBoundingClientRect().bottom + "px");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", t(open ? "a11y.menuClose" : "a11y.menuOpen"));
    }
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); } });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) setOpen(false); });
  }

  /* ---------- الهيدر + زر الرجوع لأعلى + القسم النشط ---------- */
  function initScroll() {
    var header = $("#site-header");
    var back = $("#back-top");
    function onScroll() {
      var y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (back) back.classList.toggle("is-visible", y > 700);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!("IntersectionObserver" in window)) return;
    var links = $$('.site-nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- نموذج الحجز ---------- */
  var lastSubmission = null;

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function normalizeDigits(s) {
    // يحوّل الأرقام العربية/الفارسية إلى إنجليزية
    return String(s || "").replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 0x0660; })
      .replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 0x06F0; });
  }
  function serviceLabel(value) {
    return value ? t("svc." + value + ".t") : "";
  }

  function buildMessage(d) {
    var lines = [
      "*" + t("wa.title") + "*",
      t("wa.name") + ": " + d.name,
      t("wa.phone") + ": " + d.phone
    ];
    if (d.age) lines.push(t("wa.age") + ": " + d.age);
    lines.push(t("wa.service") + ": " + serviceLabel(d.service));
    lines.push(t("wa.date") + ": " + d.date);
    lines.push(t("wa.period") + ": " + t(d.period === "morning" ? "form.morning" : "form.evening"));
    if (d.notes) lines.push(t("wa.notes") + ": " + d.notes);
    return lines.join("\n");
  }

  function initForm() {
    var form = $("#booking-form");
    if (!form) return;
    var success = $("#form-success");
    var alertBox = $("#form-alert");
    var dateInput = $("#f-date");
    if (dateInput) dateInput.min = todayISO();

    function setError(input, key) {
      var field = input.closest(".field");
      var err = document.getElementById(input.id + "-err");
      if (key) {
        field.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
        if (err) { err.setAttribute("data-err-key", key); err.textContent = t(key); }
      } else {
        field.classList.remove("is-invalid");
        input.removeAttribute("aria-invalid");
        if (err) { err.removeAttribute("data-err-key"); err.textContent = ""; }
      }
    }

    var validators = {
      "f-name": function (v) { v = v.trim(); if (!v) return "err.nameRequired"; if (v.length < 3) return "err.nameShort"; return null; },
      "f-phone": function (v) {
        v = normalizeDigits(v).replace(/[\s\-().]/g, "");
        if (!v) return "err.phoneRequired";
        if (/^01[0125]\d{8}$/.test(v)) return null;
        if (/^(\+|00)\d{8,15}$/.test(v)) return null;
        return "err.phoneInvalid";
      },
      "f-age": function (v) {
        v = normalizeDigits(v).trim(); if (!v) return null;
        var n = Number(v); return (!isFinite(n) || n < 1 || n > 120 || Math.floor(n) !== n) ? "err.ageInvalid" : null;
      },
      "f-service": function (v) { return v ? null : "err.serviceRequired"; },
      "f-date": function (v) { if (!v) return "err.dateRequired"; return v < todayISO() ? "err.datePast" : null; },
      "f-consent": function (_, el) { return el.checked ? null : "err.consent"; }
    };

    function validateField(el) {
      var fn = validators[el.id];
      if (!fn) return true;
      var key = fn(el.value || "", el);
      setError(el, key);
      return !key;
    }

    Object.keys(validators).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var evt = (el.type === "checkbox" || el.tagName === "SELECT" || el.type === "date") ? "change" : "blur";
      el.addEventListener(evt, function () { validateField(el); });
      el.addEventListener("input", function () { if (el.closest(".field").classList.contains("is-invalid")) validateField(el); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(validators).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !validateField(el) && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) {
        alertBox.hidden = false;
        firstInvalid.focus();
        return;
      }
      alertBox.hidden = true;

      var data = {
        name: form.name.value.trim(),
        phone: normalizeDigits(form.phone.value).trim(),
        age: normalizeDigits(form.age.value).trim(),
        service: form.service.value,
        date: form.date.value,
        period: (form.querySelector('input[name="period"]:checked') || {}).value || "evening",
        notes: form.notes.value.trim()
      };
      lastSubmission = data;

      var link = waLink(buildMessage(data));
      var waBtn = $("#success-wa");
      if (waBtn) waBtn.href = link;
      var st = $("#success-text");
      if (st) st.textContent = t("success.text", { name: data.name });

      window.open(link, "_blank", "noopener");

      form.hidden = true;
      success.hidden = false;
      success.focus();

      // للتتبع (Google Tag Manager / Meta Pixel) لو موجودين
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "booking_submit", service: data.service, language: currentLang });
        if (typeof window.fbq === "function") window.fbq("track", "Lead");
      } catch (err) {}
    });

    $("#book-again").addEventListener("click", function () {
      form.reset();
      lastSubmission = null;
      if (dateInput) dateInput.min = todayISO();
      $$(".field", form).forEach(function (f) { f.classList.remove("is-invalid"); });
      $$(".field-error", form).forEach(function (er) { er.textContent = ""; er.removeAttribute("data-err-key"); });
      success.hidden = true;
      form.hidden = false;
      $("#f-name").focus();
    });

    // أزرار "احجز هذه الخدمة" تختار الخدمة تلقائيًا
    $$("[data-service]").forEach(function (a) {
      a.addEventListener("click", function () {
        var sel = $("#f-service");
        if (sel && !form.hidden) { sel.value = a.getAttribute("data-service"); validateField(sel); }
      });
    });
  }

  /* ---------- تشغيل ---------- */
  function boot() {
    initLanguage();
    absolutizeHreflang();
    initNav();
    initScroll();
    initReveal();
    initForm();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
