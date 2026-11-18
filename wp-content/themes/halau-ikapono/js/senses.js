/* Home, the senses: words fill their piece of the section as true vector
   outlines (js/senses-glyphs.js), so they stay sharp at any zoom. Each word
   is stretched to the four corners of its piece; the pieces are justified
   to the full width and cut by slanted seams. Every word breathes on its
   own slow, uneven breath: as it fills it pushes its seams out and its
   neighbours give way. */
(function () {
    const G = window.SENSES_GLYPHS;
    if (!G) return;
    const NS = 'http://www.w3.org/2000/svg';
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const drift = (k, t, sp) => Math.sin(t * sp + k * 2.39) * 0.6 + Math.sin(t * sp * 0.53 + k * 5.1) * 0.4;

    // Lines, intersections and insets for the pieces.
    const lineX = (s, y) => s.x0 + (s.x1 - s.x0) * (y - s.y0) / (s.y1 - s.y0);
    const lineY = (s, x) => s.y0 + (s.y1 - s.y0) * (x - s.x0) / (s.x1 - s.x0);
    const meet = (row, col) => { let x = col.x0, y = 0; for (let i = 0; i < 4; i++) { y = lineY(row, x); x = lineX(col, y); } return [x, lineY(row, x)]; };
    const isect = (p1, p2, p3, p4) => {
        const d = (p1[0]-p2[0])*(p3[1]-p4[1]) - (p1[1]-p2[1])*(p3[0]-p4[0]);
        const a = p1[0]*p2[1]-p1[1]*p2[0], b = p3[0]*p4[1]-p3[1]*p4[0];
        return [(a*(p3[0]-p4[0]) - (p1[0]-p2[0])*b)/d, (a*(p3[1]-p4[1]) - (p1[1]-p2[1])*b)/d];
    };
    // k per edge [top, right, bottom, left]: the section's own edges get 0,
    // so the words sit exactly on the grid; only inner seams open a gap.
    const inset = (q, ks) => {
        const e = [];
        for (let i = 0; i < 4; i++) {
            const k = ks[i];
            const a = q[i], b = q[(i + 1) % 4], dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx, dy);
            e.push([[a[0] - dy / l * k, a[1] + dx / l * k], [b[0] - dy / l * k, b[1] + dx / l * k]]);
        }
        return [0, 1, 2, 3].map((i) => isect(...e[(i + 3) % 4], ...e[i]));
    };
    // Bilinear: (u, v) in the word's box to a point in its piece.
    const warp = (q, u, v) => [
        (1 - v) * ((1 - u) * q[0][0] + u * q[1][0]) + v * ((1 - u) * q[3][0] + u * q[2][0]),
        (1 - v) * ((1 - u) * q[0][1] + u * q[1][1]) + v * ((1 - u) * q[3][1] + u * q[2][1])
    ];
    const f = (n) => n.toFixed(1);
    // Outline to SVG path through the warp; straight edges are split so
    // they bend with the piece instead of cutting across it.
    const pathFor = (word, q) => {
        let d = '', cu = 0, cv = 0, su = 0, sv = 0;
        const P = (u, v) => { const p = warp(q, u, v); return f(p[0]) + ' ' + f(p[1]); };
        for (const c of G[word].c) {
            if (c === 'Z') {
                for (let i = 1; i <= 4; i++) d += 'L' + P(cu + (su - cu) * i / 4, cv + (sv - cv) * i / 4);
                d += 'Z'; cu = su; cv = sv; continue;
            }
            if (c[0] === 'M') { d += 'M' + P(c[1], c[2]); cu = su = c[1]; cv = sv = c[2]; }
            else if (c[0] === 'L') { for (let i = 1; i <= 4; i++) d += 'L' + P(cu + (c[1] - cu) * i / 4, cv + (c[2] - cv) * i / 4); cu = c[1]; cv = c[2]; }
            else if (c[0] === 'Q') { d += 'Q' + P(c[1], c[2]) + ' ' + P(c[3], c[4]); cu = c[3]; cv = c[4]; }
            else if (c[0] === 'C') { d += 'C' + P(c[1], c[2]) + ' ' + P(c[3], c[4]) + ' ' + P(c[5], c[6]); cu = c[5]; cv = c[6]; }
        }
        return d;
    };

    document.querySelectorAll('svg.senses-svg').forEach((svg) => {
        const D = svg.dataset;
        const rows = (s) => s.split('|').map((r) => r.trim().split(/\s+/));
        const LAY = { wide: rows(D.wide), narrow: rows(D.narrow || D.wide) };
        const colors = {};
        (D.colors || '').split(',').filter(Boolean).forEach((p) => { const [w, c] = p.split(':'); colors[w] = c; });
        const GAP = +D.gap || 16, SWELL = +D.swell || 0.55, SLANT = D.slant !== undefined ? +D.slant : 1;
        const breaths = new Map();
        const breath = (key, t) => {
            if (!breaths.has(key)) breaths.set(key, { p: 5 + Math.random() * 4, o: Math.random() * 20, k: Math.random() * 100 });
            const b = breaths.get(key), u = (t + b.o) / b.p, n = Math.floor(u), x = u - n;
            const amp = 0.35 + 0.65 * hash(n * 13 + b.k);
            return amp * (x < 0.4 ? Math.sin((x / 0.4) * Math.PI / 2) ** 2 : Math.cos(((x - 0.4) / 0.6) * Math.PI / 2) ** 2);
        };
        let W = 0, H = 0, layout = LAY.wide, paths = [];
        const build = () => {
            W = svg.clientWidth; H = svg.clientHeight;
            svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
            const next = window.innerWidth <= 768 ? LAY.narrow : LAY.wide;
            if (next !== layout || !paths.length) {
                layout = next;
                svg.replaceChildren();
                // data-image: the words become windows onto one photograph,
                // which runs continuously behind all of them.
                let into = svg;
                if (D.image) {
                    const id = 'senses-clip-' + Math.random().toString(36).slice(2, 8);
                    const defs = document.createElementNS(NS, 'defs');
                    into = document.createElementNS(NS, 'clipPath');
                    into.setAttribute('id', id); defs.appendChild(into); svg.appendChild(defs);
                    const img = document.createElementNS(NS, 'image');
                    img.setAttribute('href', D.image); img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                    img.setAttribute('width', '100%'); img.setAttribute('height', '100%');
                    img.setAttribute('clip-path', 'url(#' + id + ')'); svg.appendChild(img);
                }
                paths = layout.flat().map((w) => {
                    const p = document.createElementNS(NS, 'path');
                    p.setAttribute('fill', colors[w] || D.color || '#f3e3dd');
                    into.appendChild(p); return p;
                });
            }
        };
        const draw = (t) => {
            const pr = layout.map((r, ri) => r.map((w, ci) => 1 + SWELL * breath(ri + '-' + ci, t)));
            const rowW = pr.map((r) => r.reduce((s, v) => s + v, 0) / r.length / Math.pow(r.length, 0.55));
            const sum = rowW.reduce((a, b) => a + b, 0);
            const seams = [{ x0: 0, y0: 0, x1: W, y1: 0 }];
            let acc = 0;
            layout.forEach((r, ri) => {
                acc += rowW[ri] / sum * H;
                if (ri === layout.length - 1) { seams.push({ x0: 0, y0: H, x1: W, y1: H }); return; }
                const sl = (0.035 + 0.02 * drift(ri + 10, t, 0.11)) * H * (ri % 2 ? 1 : -1) * SLANT;
                seams.push({ x0: 0, y0: acc + sl, x1: W, y1: acc - sl });
            });
            let k = 0;
            layout.forEach((r, ri) => {
                const top = seams[ri], bot = seams[ri + 1];
                const yT = (top.y0 + top.y1) / 2, yB = (bot.y0 + bot.y1) / 2, rh = yB - yT;
                const total = r.reduce((s, w, ci) => s + G[w].adv * Math.pow(pr[ri][ci], 1.4), 0);
                const cuts = [{ x0: 0, y0: yT, x1: 0, y1: yB }];
                let x = 0;
                r.forEach((w, ci) => {
                    x += G[w].adv * Math.pow(pr[ri][ci], 1.4) / total * W;
                    if (ci === r.length - 1) { cuts.push({ x0: W, y0: yT, x1: W, y1: yB }); return; }
                    const sl = (0.16 * drift(ri * 7 + ci, t, 0.09) + (hash(ri * 31 + ci) - 0.5) * 0.3) * rh * SLANT;
                    cuts.push({ x0: x + sl, y0: yT, x1: x - sl, y1: yB });
                });
                r.forEach((w, ci) => {
                    const g = GAP / 2 * Math.min(1, W / 1240);   // the gap is set for a 1240 grid; narrower, it narrows
                    const q = inset([meet(top, cuts[ci]), meet(top, cuts[ci + 1]), meet(bot, cuts[ci + 1]), meet(bot, cuts[ci])],
                        [ri ? g : 0, ci < r.length - 1 ? g : 0, ri < layout.length - 1 ? g : 0, ci ? g : 0]);
                    paths[k++].setAttribute('d', pathFor(w, q));
                });
            });
        };
        build();
        window.addEventListener('resize', () => { build(); draw(performance.now() / 1000); });
        if (still) { draw(0); return; }
        let visible = true;
        new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(svg);
        const frame = (now) => { if (visible) draw(now / 1000); requestAnimationFrame(frame); };
        requestAnimationFrame(frame);
    });
})();
