document.addEventListener('DOMContentLoaded', function () {
    // ── Mobile menu ──────────────────────────────────────────
    const hamburger = document.querySelector('.hamburger');
    const navPrimary = document.querySelector('.nav-primary');

    // Menu colours: one contrast-checked palette pair on load, and a fresh
    // one every time the menu opens.
    const menuPairs = [
        ['#f8f8f8', '#a44728'], ['#f8f8f8', '#2e4475'], ['#f8f8f8', '#455d3c'], ['#f8f8f8', '#171713'],
        ['#171713', '#f8f8f8'], ['#2e4475', '#f8f8f8'], ['#455d3c', '#f8f8f8'], ['#a44728', '#f8f8f8'],
        ['#edcbc0', '#6e3421'], ['#dadfec', '#1e2e52'], ['#dee6db', '#2e3e28'], ['#d76741', '#171713']
    ];
    function menuLum(hex) {
        const c = hex.replace('#', ''); const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(parseInt(c.substr(0, 2), 16)) + 0.7152 * f(parseInt(c.substr(2, 2), 16)) + 0.0722 * f(parseInt(c.substr(4, 2), 16));
    }
    const menuOk = menuPairs.filter(function (p) { const a = menuLum(p[0]), b = menuLum(p[1]); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5; });
    let lastMenu = -1;
    function recolorMenu() {
        if (!navPrimary || !menuOk.length) return;
        let i; do { i = Math.floor(Math.random() * menuOk.length); } while (menuOk.length > 1 && i === lastMenu);
        lastMenu = i;
        navPrimary.style.setProperty('--menu-bg', menuOk[i][0]);
        navPrimary.style.setProperty('--menu-fg', menuOk[i][1]);
    }
    recolorMenu();

    if (hamburger && navPrimary) {
        hamburger.addEventListener('click', function () {
            if (!navPrimary.classList.contains('is-open')) recolorMenu();
            const open = navPrimary.classList.toggle('is-open');
            hamburger.classList.toggle('is-active', open);
            hamburger.setAttribute('aria-expanded', open);
            document.body.classList.toggle('menu-open', open);
        });

        function closeMenu() {
            navPrimary.classList.remove('is-open');
            hamburger.classList.remove('is-active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        }

        document.addEventListener('click', function (e) {
            if (!hamburger.contains(e.target) && !navPrimary.contains(e.target)) {
                closeMenu();
            }
        });

        // The panel covers the page, so Escape should always get you out.
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navPrimary.classList.contains('is-open')) {
                closeMenu();
                hamburger.focus();
            }
        });

        // Close on nav link click
        navPrimary.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navPrimary.classList.remove('is-open');
                hamburger.classList.remove('is-active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // ── Sticky header ─────────────────────────────────────────
    const header = document.querySelector('.site-header');
    if (header) {
        function onScroll() {
            header.classList.toggle('is-scrolled', window.scrollY > 60);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ── Active nav link ───────────────────────────────────────
    const path = window.location.pathname.replace(/\/$/, '');
    document.querySelectorAll('.nav-primary a').forEach(function (link) {
        const href = (link.getAttribute('href') || '').replace(/\/$/, '');
        if (href && href !== '' && path === href) {
            link.classList.add('current-menu-item');
        }
    });

    // ── Contact form — show success message ───────────────────
    if (window.location.search.includes('sent=1') || window.location.hash === '#contact') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('sent') === '1') {
            const msg = document.querySelector('.form-success-msg');
            if (msg) {
                msg.classList.add('show');
                msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // ── Testimonials carousel — one quote at a time, dots to navigate ──
    const carousel = document.querySelector('.testimonials-section');
    if (carousel) {
        const slides = Array.from(carousel.querySelectorAll('.testimonial-slide'));
        const dots = Array.from(carousel.querySelectorAll('.testimonials-dot'));
        let current = 0;

        const show = function (index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                const on = i === current;
                slide.classList.toggle('is-active', on);
                slide.setAttribute('aria-hidden', on ? 'false' : 'true');
            });
            dots.forEach(function (dot, i) {
                const on = i === current;
                dot.classList.toggle('is-active', on);
                dot.setAttribute('aria-selected', on ? 'true' : 'false');
            });
        };

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(parseInt(dot.dataset.index, 10));
            });
        });

        // Arrow keys while the carousel has focus, swipe on touch.
        carousel.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { show(current + 1); }
            if (e.key === 'ArrowLeft')  { show(current - 1); }
        });

        let touchX = null;
        carousel.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
        carousel.addEventListener('touchend', function (e) {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 40) { show(dx < 0 ? current + 1 : current - 1); }
            touchX = null;
        });
    }

    // ── Gallery — slideshow with a grid option ────────────────────
    const gallery = document.querySelector('.photo-gallery');
    if (gallery) {
        const slideshow = gallery.querySelector('.gallery-slideshow');
        const gSlides = Array.from(gallery.querySelectorAll('.gallery-slide'));
        const counter = gallery.querySelector('.gallery-counter-current');
        const grid = gallery.querySelector('.gallery-full-grid');
        const viewButtons = Array.from(gallery.querySelectorAll('.gallery-view-btn'));
        let index = 0;

        const goTo = function (i) {
            index = (i + gSlides.length) % gSlides.length;
            gSlides.forEach(function (slide, n) {
                const on = n === index;
                slide.classList.toggle('is-active', on);
                slide.setAttribute('aria-hidden', on ? 'false' : 'true');
                // Warm up the neighbours so the next step doesn't flash empty.
                if (Math.abs(n - index) <= 1) {
                    const img = slide.querySelector('img[loading="lazy"]');
                    if (img) img.removeAttribute('loading');
                }
            });
            if (counter) counter.textContent = index + 1;
        };

        const siteHeader = document.querySelector('.site-header');
        const setView = function (view) {
            gallery.dataset.view = view;
            if (grid) grid.hidden = view !== 'grid';
            // The slideshow is a dark full-viewport stage under the header,
            // so the hamburger flips to white while it is showing.
            if (siteHeader) siteHeader.classList.toggle('site-header--over-dark', view === 'slideshow');
            viewButtons.forEach(function (btn) {
                const on = btn.dataset.view === view;
                btn.classList.toggle('is-active', on);
                btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            try { localStorage.setItem('halau-gallery-view', view); } catch (e) {}
        };

        viewButtons.forEach(function (btn) {
            btn.addEventListener('click', function () { setView(btn.dataset.view); });
        });

        gallery.querySelector('.gallery-prev').addEventListener('click', function () { goTo(index - 1); });
        gallery.querySelector('.gallery-next').addEventListener('click', function () { goTo(index + 1); });

        // A grid photo opens the slideshow on that photo.
        gallery.querySelectorAll('.gallery-cell').forEach(function (cell) {
            cell.addEventListener('click', function () {
                goTo(parseInt(cell.dataset.index, 10));
                setView('slideshow');
                slideshow.focus({ preventScroll: true });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        slideshow.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
        });

        let gTouchX = null;
        slideshow.addEventListener('touchstart', function (e) { gTouchX = e.touches[0].clientX; }, { passive: true });
        slideshow.addEventListener('touchend', function (e) {
            if (gTouchX === null) return;
            const dx = e.changedTouches[0].clientX - gTouchX;
            if (Math.abs(dx) > 40) { goTo(dx < 0 ? index + 1 : index - 1); }
            gTouchX = null;
        });

        // Phones get the grid only (the slideshow is desktop/tablet).
        const phone = window.matchMedia('(max-width: 768px)');
        let saved = null;
        try { saved = localStorage.getItem('halau-gallery-view'); } catch (e) {}
        setView(phone.matches ? 'grid' : (saved === 'grid' ? 'grid' : 'slideshow'));
        phone.addEventListener('change', function (e) { if (e.matches) setView('grid'); });
    }

    // ── Video facades — swap the thumbnail for the player on tap ──
    document.querySelectorAll('.video-facade').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = btn.dataset.videoId;
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
            iframe.title = btn.dataset.videoTitle || 'Video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.setAttribute('allowfullscreen', '');
            btn.replaceWith(iframe);
        }, { once: true });
    });

    // ── Dev grid overlay — press "G" to toggle ─────────────────
    const gridOverlay = document.querySelector('.grid-overlay');
    if (gridOverlay) {
        document.addEventListener('keydown', function (e) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const tag = (e.target.tagName || '').toLowerCase();
            const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
            if (isTyping) return;

            if (e.key === 'g' || e.key === 'G') {
                gridOverlay.classList.toggle('is-visible');
            }
        });
    }
    // ── About-band flower: subtle rotation driven by scroll position ──
    // Maps the band's travel through the viewport onto a small rotation
    // sweep, so the flower turns a few degrees as you scroll past it.
    const flowerArt = document.querySelector('.home-about-flower img');
    const flowerBand = flowerArt && flowerArt.closest('.home-about');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (flowerArt && flowerBand && !reduceMotion.matches) {
        const MAX_DEG = 8;   // total sweep is 2x this, -8deg -> +8deg
        let queued = false;

        const paint = function () {
            queued = false;
            const rect = flowerBand.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            // 0 when the band is just below the fold, 1 once it has fully passed
            let progress = (vh - rect.top) / (vh + rect.height);
            progress = Math.min(1, Math.max(0, progress));
            const deg = (progress - 0.5) * 2 * MAX_DEG;
            flowerArt.style.transform = 'rotate(' + deg.toFixed(2) + 'deg)';
        };

        const request = function () {
            if (!queued) {
                queued = true;
                window.requestAnimationFrame(paint);
            }
        };

        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', request);
        paint();
    }
});
