/* =============================================
   VLA25 — ANIMATIONS.JS
   Semua logic animasi terpusat di sini
   ============================================= */

(function () {

  /* ── PAGE TRANSITION (exit) ── */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || link.target === '_blank') return;
    e.preventDefault();
    document.body.classList.add('page-exit');
    setTimeout(() => { window.location.href = href; }, 230);
  });

  /* ── FLOATING PARTICLES DI HEADER ──
     Dikurangi jadi 6 partikel (dari 10).
     Partikel di-pool sekali — tidak dibuat ulang.
  ── */
  const header = document.querySelector('.header');
  if (header) {
    const PARTICLE_COUNT = 6;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size  = Math.random() * 5 + 2;
      p.style.cssText =
        `width:${size}px;height:${size}px;` +
        `left:${Math.random() * 100}%;` +
        `bottom:${Math.random() * 40}%;` +
        `animation-delay:${Math.random() * 6}s;` +
        `animation-duration:${Math.random() * 5 + 4}s;`;
      frag.appendChild(p);
    }
    header.appendChild(frag);
  }

  /* ── HAMBURGER TOGGLE ── */
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.removeAttribute('onclick');
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('aktif');
      hamburger.classList.toggle('terbuka');
    });
  }

  /* ── ACTIVE NAVBAR ── */
  (function () {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      if (a.getAttribute('href') === path) a.classList.add('aktif');
    });
  })();

  /* ── RIPPLE EFFECT ── */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.tombol, .tombol-more, .filter-btn, .kartu-mgmt');
    if (!btn) return;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText =
      `width:${size}px;height:${size}px;` +
      `left:${e.clientX - rect.left - size / 2}px;` +
      `top:${e.clientY - rect.top - size / 2}px;`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });

  /* ── SCROLL-TRIGGERED REVEAL (IntersectionObserver) ── */
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  function initReveal() {
    const selector =
      '.stat-box, .kartu-pengumuman, .kartu-spotlight, ' +
      '.polaroid, .kartu-mgmt, .kartu, ' +
      '.founder-card, .info-item, .section';

    document.querySelectorAll(selector).forEach(function (el) {
      if (el.classList.contains('skeleton')) return;
      if (el.dataset.revealDone) return;
      el.dataset.revealDone = '1';
      el.classList.add('reveal');
      const parent = el.parentElement;
      if (parent && !parent.classList.contains('reveal-group')) {
        parent.classList.add('reveal-group');
      }
      revealObserver.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(initReveal, 100); });
  } else {
    setTimeout(initReveal, 100);
  }

  window.vla_initReveal = initReveal;

  /* ── STATS COUNTER ANIMATION ──
     MutationObserver hanya dibuat kalau elemen masih kosong/dash.
     Kalau sudah ada angka langsung animate — tidak perlu observer.
  ── */
  const animatedStats = new WeakSet();

  function animateCounter(el, target, duration) {
    if (animatedStats.has(el)) return;
    animatedStats.add(el);
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }
    requestAnimationFrame(update);
  }

  function watchStatEl(el) {
    if (animatedStats.has(el)) return;
    const teks = el.textContent.trim();

    // Langsung animate kalau sudah ada angka
    if (/^\d+$/.test(teks)) {
      const val = parseInt(teks, 10);
      if (val > 0) animateCounter(el, val, 1100);
      return;
    }

    // Kalau isinya bukan angka dan bukan dash, skip
    if (teks && teks !== '-') {
      animatedStats.add(el);
      return;
    }

    // Kosong / dash: tunggu konten diisi (misal setelah fetch)
    const mo = new MutationObserver(function () {
      const t = el.textContent.trim();
      if (!t || t === '-') return;
      mo.disconnect();
      if (!/^\d+$/.test(t)) { animatedStats.add(el); return; }
      const val = parseInt(t, 10);
      if (val > 0) animateCounter(el, val, 1100);
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
  }

  function observeStats() {
    document.querySelectorAll('.stat-num').forEach(watchStatEl);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeStats);
  } else {
    observeStats();
  }

  /* ── HEADER LOGO CLASS ── */
  const logo = document.querySelector('.header img');
  if (logo) logo.classList.add('header-logo');

  /* ── KARTU TILT EFFECT — desktop only ──
     FIX: mouseleave sebelumnya pakai capture (true) → fire di semua elemen.
     Sekarang pakai delegasi yang benar:
     - mousemove: throttled via rAF, sama seperti sebelumnya
     - mouseleave: hanya listen di kartu yang sedang aktif (bukan global capture)
  ── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tiltRAF   = null;
    let lastKartu = null;

    function resetTilt(kartu) {
      if (!kartu) return;
      kartu.style.transform = '';
      kartu.removeEventListener('mouseleave', onKartuLeave);
      lastKartu = null;
    }

    function onKartuLeave() {
      resetTilt(lastKartu);
    }

    document.addEventListener('mousemove', function (e) {
      if (tiltRAF) return;
      tiltRAF = requestAnimationFrame(function () {
        tiltRAF = null;
        const kartu = e.target.closest('.kartu, .kartu-mgmt, .stat-box, .profil-box');

        if (lastKartu && lastKartu !== kartu) {
          resetTilt(lastKartu);
        }

        if (!kartu) return;

        // Pasang listener mouseleave langsung di kartu (bukan global capture)
        if (lastKartu !== kartu) {
          kartu.addEventListener('mouseleave', onKartuLeave);
          lastKartu = kartu;
        }

        const rect = kartu.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        kartu.style.transform =
          `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.03)`;
      });
    });
  }

})();