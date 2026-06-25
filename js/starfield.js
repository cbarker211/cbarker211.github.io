(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const STAR_COUNT = 160;
    const MAX_DEPTH  = 1000;
    const SPEED      = 0.65; // units per frame — gentle orbital drift

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let W, H, cx, cy;

    const stars = Array.from({ length: STAR_COUNT }, () => ({
        x: 0, y: 0, z: 0, pz: 0
    }));

    function resetStar(s, scatter) {
        s.x  = (Math.random() - 0.5) * 3200;
        s.y  = (Math.random() - 0.5) * 3200;
        s.z  = scatter ? Math.random() * MAX_DEPTH : MAX_DEPTH;
        s.pz = s.z;
    }

    function resize() {
        W  = canvas.width  = window.innerWidth;
        H  = canvas.height = window.innerHeight;
        cx = W / 2;
        cy = H / 2;
    }

    function frame() {
        ctx.clearRect(0, 0, W, H);

        for (const s of stars) {
            s.pz  = s.z;
            s.z  -= SPEED;

            if (s.z <= 0) { resetStar(s, false); continue; }

            // Perspective projection
            const scale  = MAX_DEPTH / s.z;
            const sx     = cx + s.x * scale;
            const sy     = cy + s.y * scale;

            if (sx < -2 || sx > W + 2 || sy < -2 || sy > H + 2) {
                resetStar(s, false);
                continue;
            }

            // Previous projected position (for streak)
            const pscale = MAX_DEPTH / s.pz;
            const psx    = cx + s.x * pscale;
            const psy    = cy + s.y * pscale;

            const r       = Math.min(2.2, scale * 0.45);
            const opacity = Math.min(0.92, ((MAX_DEPTH - s.z) / MAX_DEPTH) * 2.5);

            // Streak trail — only visible once star is close enough
            if (r > 0.75) {
                ctx.beginPath();
                ctx.moveTo(psx, psy);
                ctx.lineTo(sx, sy);
                ctx.strokeStyle = `rgba(200,220,255,${(opacity * 0.38).toFixed(2)})`;
                ctx.lineWidth   = r * 0.55;
                ctx.stroke();
            }

            // Star dot
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.3, r), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(225,238,255,${opacity.toFixed(2)})`;
            ctx.fill();
        }

        requestAnimationFrame(frame);
    }

    stars.forEach(s => resetStar(s, true));
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
}());
