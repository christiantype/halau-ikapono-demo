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
            termAudio.play().catch(function () { btn.classList.remove('is-playing'); });
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
        audio.play().catch(() => {});
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
        btn.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.9 0.5V9.5L9.5 5.45Q9.9 5 9.5 4.55Z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg>';
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
