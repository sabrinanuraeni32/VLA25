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
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size = Math.random() * 5 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 6;
      const dur = Math.random() * 5 + 4;
      const opacity = Math.random() * 0.5 + 0.2;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${left}%;
        bottom: ${Math.random() * 40}%;
        animation-delay:${delay}s;
        animation-duration:${dur}s;
        opacity:${opacity};
      `;
      header.appendChild(p);
    }
  }

  /* ── HAMBURGER TOGGLE (dengan animasi X) ── */
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    // Hapus onclick inline kalau ada, ganti pakai event listener
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
    ripple.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
    `;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  /* ── SCROLL-TRIGGERED REVEAL (IntersectionObserver) ── */
  function initReveal() {
    // Tambahkan class reveal ke semua elemen yang perlu animasi
    const targets = document.querySelectorAll(
      '.stat-box, .kartu-pengumuman, .kartu-spotlight, ' +
      '.polaroid, .kartu-mgmt, .kartu, ' +
      '.founder-card, .info-item, .section, ' +
      '.kartu-pengumuman'
    );
    targets.forEach(el => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        // Cari parent group
        const parent = el.parentElement;
        if (parent && !parent.classList.contains('reveal-group')) {
          parent.classList.add('reveal-group');
        }
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // Jalankan setelah DOM selesai ter-render (termasuk konten yang di-inject JS)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initReveal, 100));
  } else {
    setTimeout(initReveal, 100);
  }

  // Re-run reveal setelah fetch selesai (untuk konten dinamis dari Google Sheets)
  const origFetch = window.fetch;
  window.fetch = function (...args) {
    return origFetch.apply(this, args).then(res => {
      setTimeout(initReveal, 300);
      return res;
    });
  };

  /* ── STATS COUNTER ANIMATION ── */
  const animatedStats = new WeakSet(); // track elemen yang sudah dianimasikan

  function animateCounter(el, target, duration) {
    if (isNaN(target) || target <= 0) return;
    if (animatedStats.has(el)) return; // jangan ulang
    animatedStats.add(el);
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target; // pastikan angka akhir tepat
    }
    requestAnimationFrame(update);
  }

  // MutationObserver: pantau perubahan teks pada stat-num
  // Ini lebih reliable daripada setTimeout karena trigger tepat saat angka diisi
  function watchStatEl(el) {
    if (animatedStats.has(el)) return;
    const mo = new MutationObserver(() => {
      const val = parseInt(el.textContent, 10);
      if (!isNaN(val) && val > 0) {
        mo.disconnect();
        animateCounter(el, val, 1100);
      }
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
    // Kalau sudah ada isinya saat kita attach
    const val = parseInt(el.textContent, 10);
    if (!isNaN(val) && val > 0) {
      mo.disconnect();
      animateCounter(el, val, 1100);
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

  /* ── KARTU TILT EFFECT (subtle, desktop only) ── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mousemove', function (e) {
      const kartu = e.target.closest('.kartu, .kartu-mgmt, .stat-box, .profil-box');
      if (!kartu) return;
      const rect = kartu.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      kartu.style.transform = `
        perspective(600px)
        rotateY(${x * 6}deg)
        rotateX(${-y * 6}deg)
        scale(1.03)
      `;
    });
    document.addEventListener('mouseleave', function (e) {
      const kartu = e.target.closest('.kartu, .kartu-mgmt, .stat-box, .profil-box');
      if (!kartu) return;
      kartu.style.transform = '';
    }, true);
    document.addEventListener('mouseover', function(e) {
      // Reset transform saat mouse leave setiap kartu
    });
  }

})();