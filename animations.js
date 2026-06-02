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

  /* ── FLOATING PARTICLES DI HEADER ── */
  const header = document.querySelector('.header');
  if (header) {
    // Kurangi jumlah partikel dari 18 → 10 biar lebih ringan
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size = Math.random() * 5 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 6;
      const dur = Math.random() * 5 + 4;
      const opacity = Math.random() * 0.5 + 0.2;
      p.style.cssText =
        `width:${size}px;height:${size}px;` +
        `left:${left}%;` +
        `bottom:${Math.random() * 40}%;` +
        `animation-delay:${delay}s;` +
        `animation-duration:${dur}s;` +
        `opacity:${opacity};`;
      header.appendChild(p);
    }
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
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  /* ── SCROLL-TRIGGERED REVEAL (IntersectionObserver) ──
     Satu observer global — tidak dibuat ulang setiap panggil initReveal.
     initReveal() hanya mendaftarkan elemen BARU yang belum terobservasi.
  ── */
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
      // Skip skeleton & elemen yang sudah diproses
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

  // Jalankan sekali saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(initReveal, 100); });
  } else {
    setTimeout(initReveal, 100);
  }

  // Ekspos ke global agar halaman bisa panggil setelah fetch selesai
  // (menggantikan fetch-override yang menyebabkan lag)
  window.vla_initReveal = initReveal;

  /* ── STATS COUNTER ANIMATION ── */
  const animatedStats = new WeakSet();

  function animateCounter(el, target, duration) {
    if (isNaN(target) || target <= 0) return;
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

  function isAngkaMurni(teks) { return /^\d+$/.test(teks.trim()); }

  function watchStatEl(el) {
    if (animatedStats.has(el)) return;
    const isiAwal = el.textContent.trim();
    if (isiAwal && !isAngkaMurni(isiAwal) && isiAwal !== '-') {
      animatedStats.add(el);
      return;
    }
    const mo = new MutationObserver(function () {
      const teks = el.textContent.trim();
      if (!teks || teks === '-') return;
      if (!isAngkaMurni(teks)) { mo.disconnect(); animatedStats.add(el); return; }
      const val = parseInt(teks, 10);
      if (!isNaN(val) && val > 0) { mo.disconnect(); animateCounter(el, val, 1100); }
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
    if (isiAwal && isAngkaMurni(isiAwal)) {
      const val = parseInt(isiAwal, 10);
      if (!isNaN(val) && val > 0) { mo.disconnect(); animateCounter(el, val, 1100); }
    }
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

  /* ── KARTU TILT EFFECT — throttled via rAF, desktop only ── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tiltRAF   = null;
    let lastKartu = null;

    document.addEventListener('mousemove', function (e) {
      if (tiltRAF) return; // sudah ada frame pending, skip
      tiltRAF = requestAnimationFrame(function () {
        tiltRAF = null;
        const kartu = e.target.closest('.kartu, .kartu-mgmt, .stat-box, .profil-box');

        // Reset kartu sebelumnya kalau mouse berpindah ke elemen lain
        if (lastKartu && lastKartu !== kartu) {
          lastKartu.style.transform = '';
          lastKartu = null;
        }

        if (!kartu) return;
        const rect = kartu.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        kartu.style.transform =
          `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.03)`;
        lastKartu = kartu;
      });
    });

    // Reset saat mouse keluar dari kartu
    document.addEventListener('mouseleave', function (e) {
      const kartu = e.target.closest('.kartu, .kartu-mgmt, .stat-box, .profil-box');
      if (kartu) kartu.style.transform = '';
    }, true);
  }

})();
