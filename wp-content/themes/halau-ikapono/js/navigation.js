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
        setView('grid');
        phone.addEventListener('change', function (e) { if (e.matches) setView('grid'); });
    }

    // ── Video lightbox — thumbnails open a full-width player ──────
    const lightbox = document.querySelector('.video-lightbox');
    if (lightbox) {
        const frame = lightbox.querySelector('.video-lightbox-frame');
        const title = lightbox.querySelector('.video-lightbox-title');
        const closeBtn = lightbox.querySelector('.video-lightbox-close');
        let opener = null;

        const openVideo = function (id, label, btn) {
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
            iframe.title = label || 'Video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.setAttribute('allowfullscreen', '');
            frame.replaceChildren(iframe);
            title.textContent = label || '';
            lightbox.hidden = false;
            document.body.classList.add('lightbox-open');
            opener = btn;
            closeBtn.focus();
        };

        const closeVideo = function () {
            lightbox.hidden = true;
            frame.replaceChildren();   // removing the iframe stops playback
            document.body.classList.remove('lightbox-open');
            if (opener) { opener.focus(); opener = null; }
        };

        document.querySelectorAll('.video-facade').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openVideo(btn.dataset.videoId, btn.dataset.videoTitle, btn);
            });
        });

        lightbox.querySelectorAll('[data-close]').forEach(function (el) {
            el.addEventListener('click', closeVideo);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !lightbox.hidden) closeVideo();
        });
    }

    // ── Registration flow — step navigation + live summary ──────
    const flow = document.querySelector('.register-flow');
    if (flow) {
        const steps = Array.from(flow.querySelectorAll('.register-step'));
        const marks = Array.from(flow.querySelectorAll('.register-steps li'));
        const sum = function (k) { return flow.querySelector('[data-sum="' + k + '"]'); };
        const qtySel = flow.querySelector('#reg_qty');
        let at = 0;

        const money = function (n) { return n > 0 ? '$' + n.toFixed(2).replace(/\.00$/, '') : 'Free'; };

        const refresh = function () {
            const chosen = flow.querySelector('input[name="item"]:checked');
            const qty = parseInt(qtySel.value, 10) || 1;
            sum('qty').textContent = qty;
            if (!chosen) { sum('title').textContent = '—'; sum('price').textContent = '—'; sum('total').textContent = '—'; return; }
            let price = parseFloat(chosen.dataset.price) || 0;
            // Tuition rates and scholarship requests ask which classes; tuition is per dancer.
            const forClasses = chosen.dataset.classes === '1';
            const isGift = chosen.value === 'donation';
            const hasTickets = chosen.dataset.tickets === '1';
            const perDancer = forClasses || isGift || hasTickets || !!chosen.dataset.recurring;
            const toggle = function (sel, show) { const el = flow.querySelector(sel); if (el) el.hidden = !show; };
            toggle('[data-classes-field]', forClasses);
            toggle('[data-qty-field]', !perDancer);
            toggle('[data-sum-row="qty"]', !perDancer);
            toggle('[data-dancer-fields]', !isGift);
            if (perDancer) qtySel.value = '1';

            // Ticketed event: one group of counts per event; only the chosen one is sent.
            let ticketTotal = 0; const ticketParts = [];
            flow.querySelectorAll('[data-tickets-for]').forEach(function (g) {
                const on = g.dataset.ticketsFor === chosen.value;
                g.hidden = !on;
                g.querySelectorAll('input').forEach(function (i) {
                    i.disabled = !on;
                    const n = Math.max(0, parseInt(i.value, 10) || 0);
                    if (on && n) { ticketTotal += n * (parseFloat(i.dataset.ticketPrice) || 0); ticketParts.push(n + ' × ' + i.dataset.ticketLabel); }
                });
            });

            // Gift: the giver sets the amount; nothing about dancing is asked.
            const amount = flow.querySelector('#reg_amount');
            toggle('[data-amount-field]', isGift);
            if (amount) amount.required = isGift;
            if (isGift) price = Math.max(0, parseFloat(amount && amount.value) || 0);
            const legend = flow.querySelector('[data-gift-legend]');
            if (legend) { legend.dataset.defaultLegend = legend.dataset.defaultLegend || legend.textContent; legend.textContent = isGift ? legend.dataset.giftLegend : legend.dataset.defaultLegend; }
            const agree = flow.querySelector('[data-agree]');
            if (agree) { agree.hidden = isGift; agree.querySelector('input').required = !isGift; }

            const schol = flow.querySelector('#reg_scholarship');
            const onlyScholarship = chosen.value === 'scholarship';
            if (schol && onlyScholarship) schol.checked = true;
            if (schol && isGift) schol.checked = false;
            toggle('.register-scholarship', !onlyScholarship && !isGift);
            const wantsScholarship = !!(schol && schol.checked);
            toggle('[data-sum-row="scholarship"]', wantsScholarship);
            toggle('.choice-list--pay', !wantsScholarship);
            toggle('.scholarship-note', wantsScholarship);
            flow.querySelectorAll('input[name="reg_method"]').forEach(function (i) { i.required = !wantsScholarship; });

            if (hasTickets) {
                sum('title').textContent = chosen.dataset.title + (ticketParts.length ? ' · ' + ticketParts.join(', ') : '');
                sum('price').textContent = ticketParts.length ? money(ticketTotal) : '—';
                sum('total').textContent = ticketParts.length ? money(ticketTotal) : '—';
                return;
            }
            sum('title').textContent = chosen.dataset.title;
            if (isGift) { sum('price').textContent = price > 0 ? money(price) : '—'; sum('total').textContent = price > 0 ? money(price) : '—'; return; }
            sum('price').textContent = price > 0 ? money(price) + ' ' + chosen.dataset.unit : chosen.dataset.unit;
            sum('total').textContent = price > 0 ? money(price * qty) + (chosen.dataset.unit.indexOf('per') === 0 ? ' ' + chosen.dataset.unit : '') : 'Free';
        };

        const show = function (i) {
            at = Math.max(0, Math.min(steps.length - 1, i));
            steps.forEach(function (st, n) { st.classList.toggle('is-active', n === at); });
            marks.forEach(function (m, n) {
                m.classList.toggle('is-current', n === at);
                m.classList.toggle('is-done', n < at);
            });
            flow.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        const valid = function (step) {
            const fields = Array.from(step.querySelectorAll('input, select, textarea'));
            const radios = fields.filter(function (f) { return f.type === 'radio' && f.required; });
            if (radios.length && !radios.some(function (r) { return r.checked; })) { radios[0].focus(); return false; }
            // Ticketed event: at least one ticket.
            const tg = step.querySelector('[data-tickets-for]:not([hidden])');
            if (tg) {
                const inputs = Array.from(tg.querySelectorAll('input'));
                const n = inputs.reduce(function (s, i) { return s + (parseInt(i.value, 10) || 0); }, 0);
                if (!n) { inputs[0].setCustomValidity('Choose at least one ticket.'); inputs[0].reportValidity(); inputs[0].setCustomValidity(''); return false; }
            }
            // Step 1: nothing chosen → say so instead of doing nothing.
            const need = step.querySelector('[data-need-choice]');
            if (need) {
                const picked = !!flow.querySelector('input[name="item"]:checked');
                need.hidden = picked;
                if (!picked) return false;
            }
            for (const f of fields) {
                if (f.type === 'radio') continue;
                if (!f.checkValidity()) { f.reportValidity(); return false; }
            }
            return true;
        };

        flow.querySelectorAll('[data-next]').forEach(function (b) {
            b.addEventListener('click', function () { if (valid(steps[at])) show(at + 1); });
        });
        flow.querySelectorAll('[data-prev]').forEach(function (b) {
            b.addEventListener('click', function () { show(at - 1); });
        });
        flow.addEventListener('change', refresh);
        flow.addEventListener('input', function (e) { if (e.target.matches('#reg_amount, [data-ticket-price]')) refresh(); });
        flow.querySelectorAll('[data-amount]').forEach(function (b) {
            b.addEventListener('click', function () {
                const amount = flow.querySelector('#reg_amount');
                amount.value = b.dataset.amount;
                flow.querySelectorAll('[data-amount]').forEach(function (x) { x.classList.toggle('is-picked', x === b); });
                refresh();
            });
        });
        // Submit button says where it leads: Stripe for card, done otherwise.
        const submit = flow.querySelector('[data-submit-label]');
        const relabel = function () {
            const m = flow.querySelector('input[name="reg_method"]:checked');
            const chosen = flow.querySelector('input[name="item"]:checked');
            const freeItem = chosen && !(parseFloat(chosen.dataset.price) > 0);
            const schol = flow.querySelector('#reg_scholarship');
            const wantsScholarship = !!(schol && schol.checked);
            const isGift = chosen && chosen.value === 'donation';
            const payable = (!freeItem || isGift || (chosen && chosen.dataset.tickets === '1')) && !wantsScholarship;
            if (submit) submit.textContent = (m && payable && m.value === 'card') ? submit.dataset.submitLabelCard : ((m && payable && m.value === 'paypal') ? submit.dataset.submitLabelPaypal : (isGift ? 'Complete gift' : submit.dataset.submitLabel));
        };
        flow.addEventListener('change', relabel);
        relabel();
        flow.addEventListener('submit', function (e) {
            if (!valid(steps[at])) e.preventDefault();
        });
        refresh();
        // Preselected item (from ?event= / ?class=) skips straight to details.
        if (flow.querySelector('input[name="item"]:checked')) show(1);
    }

    // ── No widows: tie each block's last two words together ──────
    // (a no-break space), so a paragraph never ends on one word alone.
    // Skipped when the pair is long enough to overflow a phone line.
    document.querySelectorAll('main p, main li, main dd, main figcaption, main blockquote, main h1, main h2, main h3, main h4, .site-footer p').forEach(function (el) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (let i = nodes.length - 1; i >= 0; i--) {
            const n = nodes[i];
            const m = n.textContent.match(/^([\s\S]*\S)\s+(\S+\s*)$/);
            if (!n.textContent.trim()) continue;
            if (!m) return; // last word sits alone in its node (e.g. after a link): leave it
            const tail = m[1].split(/\s/).pop() + ' ' + m[2].trim();
            if (tail.length <= 22) n.textContent = m[1] + ' ' + m[2];
            return;
        }
    });

    // ── Hanging punctuation ──────────────────────────────────────
    // A block that opens with a quote mark gets that mark wrapped in .hang
    // and pulled left by its own measured width, so the words align with
    // the text above and below. Centred blocks are left alone.
    const OPENERS = /^[“‘"'«„]/;
    document.querySelectorAll('main p, main blockquote, main h1, main h2, main h3, main h4, main li, main dd, main figcaption').forEach(function (el) {
        if (el.querySelector('.hang') || el.closest('.hang')) return;
        if (getComputedStyle(el).textAlign === 'center') return;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n = walker.nextNode();
        while (n && !n.textContent.trim()) n = walker.nextNode();
        if (!n) return;
        const lead = n.textContent.match(/^\s*/)[0].length;
        if (!OPENERS.test(n.textContent.slice(lead))) return;
        // Only the first text in the block: a quote mark further in (after a <strong>, say) is not at the margin.
        const range = document.createRange();
        range.setStart(el, 0); range.setEnd(n, lead);
        if (range.toString().trim()) return;
        const rest = n.splitText(lead);
        rest.splitText(1);
        const span = document.createElement('span');
        span.className = 'hang';
        rest.parentNode.insertBefore(span, rest);
        span.appendChild(rest);
        span.style.marginLeft = (-span.getBoundingClientRect().width) + 'px';
    });

    // ── Pronunciation (About: Lāʻau Lapaʻau terms) ────────────────
    let termAudio = null, termBtn = null;
    document.querySelectorAll('.bio-term-play').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (termAudio) { termAudio.pause(); termAudio = null; }
            if (termBtn) termBtn.classList.remove('is-playing');
            if (termBtn === btn) { termBtn = null; return; }
            termBtn = btn;
            termAudio = new Audio(btn.dataset.audio);
            btn.classList.add('is-playing');
            termAudio.addEventListener('ended', function () { btn.classList.remove('is-playing'); if (termBtn === btn) termBtn = null; });
            termAudio.play().then(function () {
                const word = btn.closest('.bio-term') && btn.closest('.bio-term').querySelector('.bio-term-word');
                if (window.halauPulse) window.halauPulse(termAudio, word);
            }).catch(function () { btn.classList.remove('is-playing'); });
        });
    });

    // ── PayPal / Venmo buttons (page-register.php, ?paypal=REF) ──
    const ppBox = document.getElementById('paypal-buttons');
    if (ppBox && window.paypal && window.paypal.Buttons) {
        const ppError = document.getElementById('paypal-error');
        const post = function (url, body) {
            return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                .then(function (r) { return r.json(); });
        };
        window.paypal.Buttons({
            style: { layout: 'vertical', shape: 'rect', label: 'pay' },
            createOrder: function () {
                return post(ppBox.dataset.order, { ref: ppBox.dataset.ref }).then(function (d) {
                    if (!d.id) throw new Error(d.error || 'order');
                    return d.id;
                });
            },
            onApprove: function (data, actions) {
                return post(ppBox.dataset.capture, { ref: ppBox.dataset.ref, orderID: data.orderID }).then(function (d) {
                    if (d.restart) return actions.restart();
                    if (d.redirect) { window.location.href = d.redirect; return; }
                    throw new Error(d.error || 'capture');
                });
            },
            onError: function () { if (ppError) ppError.hidden = false; }
        }).render(ppBox);
    }

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
    const flowerArt = document.querySelector('.home-about-flower .flower-art, .home-about-flower img');
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

/* Scholarship request: the button opens the form in place. */
document.querySelectorAll('.scholarship-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
        const form = document.getElementById(btn.getAttribute('aria-controls'));
        if (!form) return;
        form.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        const first = form.querySelector('input:not([type=hidden])');
        if (first) first.focus({ preventScroll: true });
    });
});

/* Programme cards: tell each card how tall its text block is, so the
   photo's fade ends exactly where the label begins. */
(function () {
    const cards = document.querySelectorAll('.program-panel');
    if (!cards.length) return;
    const fit = () => cards.forEach((card) => {
        const first = card.querySelector('.program-panel-tags');
        if (!first) return;
        const zone = card.offsetHeight - first.offsetTop + 16;
        card.style.setProperty('--text-zone', zone + 'px');
    });
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();

/* Programme photos share one eye line: each image is placed (and scaled up
   only as much as needed) so the lead dancer's eyes sit at the same height
   in every card. data-eye="x y" gives the eyes as fractions of the photo. */
(function () {
    const EYE_LINE = 0.22;
    const imgs = document.querySelectorAll('.program-panel-photo img[data-eye]');
    if (!imgs.length) return;
    let line = 0;
    const place = (img) => {
        const box = img.parentElement, w = box.clientWidth, h = box.clientHeight;
        const t = line / h;
        const iw = img.naturalWidth, ih = img.naturalHeight;
        if (!w || !h || !iw) return;
        const [ex, ey] = img.dataset.eye.split(' ').map(Number);
        const r = iw / ih;
        let H = Math.max(h, w / r, t * h / ey, h * (1 - t) / (1 - ey));
        const W = H * r;
        const left = Math.min(0, Math.max(w - W, w / 2 - ex * W));
        const top = Math.min(0, Math.max(h - H, t * h - ey * H));
        Object.assign(img.style, { inset: 'auto', left: Math.floor(left) + 'px', top: Math.floor(top) + 'px', width: Math.ceil(W) + 2 + 'px', height: Math.ceil(H) + 2 + 'px', maxWidth: 'none', objectFit: 'fill' });
    };
    // One line in pixels for the whole row: a share of the shortest photo area.
    const all = () => {
        line = EYE_LINE * Math.min(...[...imgs].map((i) => i.parentElement.clientHeight || Infinity));
        imgs.forEach((img) => img.complete ? place(img) : img.addEventListener('load', () => place(img), { once: true }));
    };
    all();
    window.addEventListener('resize', all);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
})();

/* Say it: a small play button after the first appearance of each recorded
   Hawaiian word (window.HALAU_SAY, from functions.php). The page is one
   scope; Kumu June's bio is its own, so her bio gets every word it uses. */
(function () {
    const words = window.HALAU_SAY;
    const main = document.getElementById('main');
    if (!words || !words.length || !main) return;
    const OK = "[\u02BB\u2018'\u2019]";
    const plain = { 'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u', 'Ā': 'A', 'Ē': 'E', 'Ī': 'I', 'Ō': 'O', 'Ū': 'U' };
    const toRe = (form) => {
        let s = '';
        for (const ch of form) {
            if (ch === '\u02BB') s += OK + '?';
            else if (plain[ch]) s += '[' + ch + plain[ch] + ']';
            else if (ch === ' ') s += '\\s+';
            else s += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        // Single words never match inside a longer recorded phrase.
        const guard = {
            'pono': '(?<!ka\\s)', 'kumu': '', 'hula': '(?<!kumu\\s)(?<!h[\u0101a]lau\\s)', 'h\u0101lau': '', 'na\u02BBau': '(?<!ka\\s)',
        }[form.toLowerCase()] || '';
        const ahead = {
            'kumu': '(?!\\s+hula)', 'hula': '(?!\\s+noho)', 'h\u0101lau': '(?!\\s+(i|hula)\\s)',
        }[form.toLowerCase()] || '';
        return new RegExp(guard + '(?<![\\p{L}\u02BB\u2018\u2019\'])' + s + '(?![\\p{L}])' + ahead, 'iu');
    };
    const list = words.map(([form, url]) => ({ form, url, re: toRe(form) }))
        .sort((a, b) => b.form.length - a.form.length);
    const SKIP = 'h1,h2,a,button,label,input,textarea,select,script,style,svg,nav,header,footer,.bio-terms,.haw,.hero,.site-logo,.say-btn';
    const audio = new Audio();
    let playing = null;
    let queue = [];
    const next = () => {
        const url = queue.shift();
        if (!url) { if (playing) playing.classList.remove('is-playing'); playing = null; return; }
        audio.src = url; audio.currentTime = 0;
        audio.play().then(() => { if (window.halauPulse && playing) window.halauPulse(audio, playing.closest('.haw')); }).catch(() => {});
    };
    const play = (btn) => {
        if (playing) playing.classList.remove('is-playing');
        queue = btn.dataset.urls.split(' ');
        btn.classList.add('is-playing'); playing = btn;
        next();
    };
    audio.addEventListener('ended', next);

    const wrapFirst = (scope, item, exclude) => {
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => {
                const p = n.parentElement;
                if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
                if (exclude && exclude.contains(n)) return NodeFilter.FILTER_REJECT;
                return item.re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            },
        });
        const node = walker.nextNode();
        if (!node) return;
        const m = node.nodeValue.match(item.re);
        const after = node.splitText(m.index);
        after.splitText(m[0].length);
        const span = document.createElement('span');
        span.className = 'haw';
        span.lang = 'haw';
        after.parentNode.replaceChild(span, after);
        span.appendChild(after);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'say-btn';
        btn.setAttribute('aria-label', 'Hear Kumu June say ' + m[0]);
        btn.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M2.5 0C3.3 0.35 9.4 4.1 10.1 4.8C10.3 5 10.3 5.1 10.1 5.25C9.4 5.9 3.3 9.65 2.5 10C1.95 7.1 1.95 2.9 2.5 0ZM4.35 2.15C5.4 2.8 8.3 4.55 8.95 5C8.3 5.45 5.4 7.2 4.35 7.85C4.15 6.4 4.15 3.6 4.35 2.15Z"/></svg>';
        btn.dataset.urls = item.url;
        btn.addEventListener('click', () => play(btn));
        span.appendChild(btn);
    };
    const bio = main.querySelector('.bio-section');
    list.forEach((item) => {
        wrapFirst(main, item, bio);
        if (bio) wrapFirst(bio, item, null);
    });
    // Words side by side ("Maiki Aiu Lake, Kumu Hula") share one button at
    // the end that plays them in order.
    main.querySelectorAll('.haw').forEach((a) => {
        const gap = a.nextSibling, b = gap && gap.nextSibling;
        if (!gap || gap.nodeType !== 3 || !/^[\s,]*$/.test(gap.nodeValue)) return;
        if (!b || !b.classList || !b.classList.contains('haw')) return;
        const btnA = a.querySelector('.say-btn'), btnB = b.querySelector('.say-btn');
        btnB.dataset.urls = btnA.dataset.urls + ' ' + btnB.dataset.urls;
        btnB.setAttribute('aria-label', 'Hear Kumu June say ' + a.textContent.trim() + gap.nodeValue + b.textContent.trim());
        btnA.remove();
        a.appendChild(gap);
        while (b.firstChild) a.appendChild(b.firstChild);
        b.remove();
    });
})();

/* Big type that dances: split .dance elements (hero titles, pull quotes)
   into letters, each with its own weight (--w), turn (--r), sway (--dw) and
   beat (--i). Words are wrapped whole so lines never break mid-word. */
(function () {
    const W = [600, 330, 720, 420, 280, 660, 690, 300, 560, 760, 380, 640];
    const R = [-2.5, 2, -1, 3, -2, 1.5, 2.5, -3, 1, -1.5, 3, -2];
    // Every display line on the site dances; running text stays still so it
    // can be read.
    const sel = [
        '.about-hero-text h1', '.page-hero h1', '.gallery-title h1', '.pull blockquote',
        '.section-heading', '.programming-heading', '.program-panel-title a', '.class-band-body h2 .serif',
        '.class-band-body h3', '.about-story-title h2 .serif', '.bio-title', '.bio-band-title',
        '.home-cta h2', '.footer-statement p', '.weekly-day-head'
    ].join(', ');
    document.querySelectorAll(sel).forEach((el) => {
        // Headings drawn as breathing outlines (js/senses.js) do not dance too.
        if (el.closest('.breathe')) return;
        el.classList.add('dance');
        el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
        let k = 0;
        const walk = (node) => {
            [...node.childNodes].forEach((n) => {
                if (n.nodeType === 1) { walk(n); return; }
                if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
                const frag = document.createDocumentFragment();
                n.nodeValue.split(/(\s+)/).forEach((part) => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                    const word = document.createElement('span');
                    word.className = 'dw'; word.setAttribute('aria-hidden', 'true');
                    for (const ch of part) {
                        const l = document.createElement('span');
                        l.className = 'dl'; l.textContent = ch;
                        l.style.setProperty('--w', W[k % W.length] * 0.35 + 480 * 0.65);   // subtle: pulled toward 480
                        l.style.setProperty('--r', (R[k % R.length] * 0.5) + 'deg');
                        l.style.setProperty('--dw', (k % 2 ? -1 : 1) * 70);
                        l.style.setProperty('--i', k % 8);
                        l.style.setProperty('--k', k);
                        word.appendChild(l); k++;
                    }
                    frag.appendChild(word);
                });
                n.replaceWith(frag);
            });
        };
        walk(el);
    });
})();

/* Sound you can see: while a recording plays, the word's letters rise and
   fill in a ripple that follows the loudness of Kumu June's voice. */
window.halauPulse = (function () {
    let ctx = null;
    return function (audio, el) {
        if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        // Split the word's own text (not the button) into letters once.
        if (!el.querySelector('.pulse-l')) {
            const tn = [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
            if (!tn) return;
            const frag = document.createDocumentFragment();
            for (const ch of tn.nodeValue) {
                if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
                const s = document.createElement('span'); s.className = 'pulse-l'; s.textContent = ch; frag.appendChild(s);
            }
            tn.replaceWith(frag);
        }
        const letters = [...el.querySelectorAll('.pulse-l')];
        if (window.halauFixSlots) window.halauFixSlots(letters);
        try {
            ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            if (!audio._src) { audio._src = ctx.createMediaElementSource(audio); audio._an = ctx.createAnalyser(); audio._an.fftSize = 512; audio._src.connect(audio._an); audio._an.connect(ctx.destination); }
        } catch (e) { return; }
        const an = audio._an, buf = new Uint8Array(an.fftSize);
        let level = 0;
        const frame = (t) => {
            an.getByteTimeDomainData(buf);
            let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
            level += (Math.min(1, Math.sqrt(sum / buf.length) * 4) - level) * 0.35;
            letters.forEach((l, i) => {
                const wave = 0.5 + 0.5 * Math.sin(t / 90 - i * 0.9);
                if (!l.dataset.w) l.dataset.w = parseFloat(getComputedStyle(l).fontWeight) || 400;
                l.style.fontWeight = Math.min(800, +l.dataset.w + level * wave * 320).toFixed(0);
            });
            if (!audio.paused && !audio.ended) requestAnimationFrame(frame);
            else letters.forEach((l) => { if (l.dataset.w) l.style.fontWeight = l.dataset.w; });
        };
        requestAnimationFrame(frame);
    };
})();

/* Words index: letters at the logo's weights and turns, and tap to play. */
(function () {
    const btns = document.querySelectorAll('.words-btn');
    if (!btns.length) return;
    const W = [600, 330, 720, 420, 280, 660, 690, 300, 560, 760, 380, 640];
    const R = [-2.5, 2, -1, 3, -2, 1.5, 2.5, -3, 1, -1.5, 3, -2];
    let k = 0;
    document.querySelectorAll('.haw-big').forEach((el) => {
        const text = el.textContent; el.textContent = '';
        for (const ch of text) {
            if (ch === ' ') { el.appendChild(document.createTextNode(' ')); continue; }
            const s = document.createElement('span');
            s.className = 'pulse-l'; s.textContent = ch;
            s.style.fontWeight = W[k % W.length]; s.style.rotate = R[k % R.length] * 0.6 + 'deg'; k++;
            el.appendChild(s);
        }
    });
    const audio = new Audio(); let on = null;
    btns.forEach((b) => b.addEventListener('click', () => {
        if (on) on.classList.remove('is-playing');
        audio.src = b.dataset.audio; audio.currentTime = 0;
        on = b; b.classList.add('is-playing');
        audio.play().then(() => { if (window.halauPulse) window.halauPulse(audio, b.querySelector('.words-word')); }).catch(() => {});
    }));
    audio.addEventListener('ended', () => { if (on) on.classList.remove('is-playing'); on = null; });
})();

/* The type answers your movement: scrolling adds to the sway (a dancer
   picking up the beat), then it settles. --move runs 0..1 on the root and
   scales every letter's swing. */
(function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    let last = scrollY, move = 0, raf = 0;
    const tick = () => {
        move *= 0.92;
        root.style.setProperty('--move', move.toFixed(3));
        raf = move > 0.01 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener('scroll', () => {
        const d = Math.abs(scrollY - last); last = scrollY;
        move = Math.min(1, move + d / 400);
        if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
})();

/* Letters breathe. Each letter's stroke slowly swells and thins on its own
   long, random breath (9-18 s), some deep, some barely. Every letter sits
   in a slot fixed at its resting width, so a heavier stroke spills softly
   into the space around it and never pushes its neighbours or re-wraps a
   line. No rotation in motion; the small resting turn stays still. */
window.halauFixSlots = function (els) {
    els.forEach((el) => {
        if (el.dataset.slot) return;
        el.style.width = el.getBoundingClientRect().width + 'px';
        el.style.textAlign = 'center';
        el.dataset.slot = '1';
    });
};
(function () {
    const letters = [...document.querySelectorAll('.dance .dl')];
    if (!letters.length) return;
    letters.forEach((el) => { el.style.animation = 'none'; el.style.fontWeight = parseFloat(el.style.getPropertyValue('--w')) || 480; });
    const fit = () => { letters.forEach((el) => { delete el.dataset.slot; el.style.width = ''; }); halauFixSlots(letters); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 150); });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const L = letters.map((el) => ({
        el,
        base: parseFloat(el.style.getPropertyValue('--w')) || 480,
        b: [rnd(9, 18), rnd(0, 6.3), Math.random() < 0.4 ? rnd(140, 210) : rnd(40, 90)],
    }));
    const visible = new Set();
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    document.querySelectorAll('.dance').forEach((d) => io.observe(d));
    const frame = (ms) => {
        const t = ms / 1000;
        const move = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--move')) || 0;
        L.forEach((l) => {
            if (!visible.has(l.el.closest('.dance'))) return;
            const s = Math.sin((t / l.b[0]) * 6.283 + l.b[1]);
            const w = l.base + l.b[2] * (s * Math.abs(s)) * (1 + move * 0.6);
            l.el.style.fontWeight = Math.max(200, Math.min(800, w)).toFixed(0);
        });
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
})();


/* Home quote: the five senses take turns after "we", one at a time, each
   pulsing in weight on its own irregular beat. The slot is measured at the
   heaviest weight so nothing around it ever moves. */
(function () {
    const cycle = document.querySelector('.quote-frame-text .q-cycle');
    if (!cycle) return;
    const words = [...cycle.querySelectorAll('.q-sans')];
    const tail = cycle.closest('.q-tail');
    if (tail) tail.setAttribute('aria-hidden', 'true');
    const measure = () => {
        let w = 0;
        words.forEach((el) => { const o = el.style.fontWeight; el.style.fontWeight = 720; w = Math.max(w, el.getBoundingClientRect().width); el.style.fontWeight = o; });
        cycle.style.setProperty('--q-slot', Math.ceil(w + 2) + 'px');
    };
    measure();
    if (document.fonts) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);

    // Split each word (and its closing mark) into letters.
    words.forEach((w) => {
        const wrap = (node) => [...node.childNodes].forEach((n) => {
            if (n.nodeType === 1) { wrap(n); return; }
            const f = document.createDocumentFragment();
            [...n.nodeValue].forEach((ch) => { const l = document.createElement('span'); l.className = 'ql'; l.textContent = ch; f.appendChild(l); });
            n.replaceWith(f);
        });
        wrap(w);
    });
    cycle.classList.add('is-split');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Uneven delays: letters leave and arrive out of order, never in a
    // tidy left-to-right sweep, and the pause between words varies.
    const scatter = (w, spread) => w.querySelectorAll('.ql').forEach((l) => {
        l.style.setProperty('--d', (Math.random() * spread).toFixed(2) + 's');
    });
    let i = 0;
    const next = () => {
        scatter(words[i], 0.7);
        words[i].classList.remove('is-on');
        i = (i + 1) % words.length;
        scatter(words[i], 0.9);
        setTimeout(() => words[i].classList.add('is-on'), 350 + Math.random() * 450);
        setTimeout(next, 3000 + Math.random() * 2200);
    };
    setTimeout(next, 3000 + Math.random() * 1500);

    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const beats = words.map((_, k) => ({ p: 1.5 + Math.random() * 0.9, o: Math.random() * 10, k }));
    let visible = true;
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(cycle);
    const frame = (now) => {
        if (visible) {
            const t = now / 1000;
            words.forEach((el, k) => {
                const b = beats[k], u = (t + b.o) / b.p, n = Math.floor(u), x = u - n;
                const amp = 0.3 + 0.7 * hash(n * 31 + k * 7);
                const g = (c, w) => Math.exp(-((x - c) / w) * ((x - c) / w));
                const beat = amp * (g(0.12, 0.11) + 0.55 * g(0.38, 0.13));
                el.style.fontWeight = Math.min(720, 340 + 380 * beat).toFixed(0);
            });
        }
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
})();


/* The menu bars take their colour from the section behind them: ink over a
   light ground, white over a dark one or a photograph. Open, the X sits on
   the light menu panel and stays ink. */
(function () {
    const btn = document.querySelector('.site-header .hamburger');
    if (!btn) return;
    const header = btn.closest('.site-header');
    const lum = (c) => {
        const m = c.match(/[\d.]+/g); if (!m) return null;
        const [r, g, b, a = 1] = m.map(Number); if (a < 0.5) return null;
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const groundAt = (x, y) => {
        const stack = document.elementsFromPoint(x, y).filter((el) => !header.contains(el));
        for (const el of stack) {
            if (/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(el.tagName)) return 0;      // photographs read as dark
            for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
                const cs = getComputedStyle(n);
                if (/url\(/.test(cs.backgroundImage)) return 0;               // a photograph set as a background
                const stops = cs.backgroundImage.match(/rgba?\([^)]+\)/g);     // a gradient: the mean of its stops
                if (stops) { const ls = stops.map(lum).filter((v) => v !== null); if (ls.length) return ls.reduce((a, b) => a + b, 0) / ls.length; }
                const L = lum(cs.backgroundColor);
                if (L !== null) return L;
            }
        }
        return 1;
    };
    let queued = false;
    const update = () => {
        queued = false;
        if (btn.classList.contains('is-active')) { btn.style.removeProperty('--bar'); return; }
        const r = btn.getBoundingClientRect();
        const L = groundAt(r.left + r.width / 2, r.top + r.height / 2);
        // Whichever of ink and white stands further from the ground.
        const onWhite = 1.05 / (L + 0.05), onInk = (L + 0.05) / 0.059;
        btn.style.setProperty('--bar', onInk > onWhite * 1.25 ? 'var(--gray-900)' : 'var(--white)');
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    btn.addEventListener('click', () => setTimeout(update, 50));
    update();
})();
