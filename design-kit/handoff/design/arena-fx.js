/* Obsidian Arena — shared motion + atmosphere layer.
   <oa-grain> film grain · <oa-fog> fog + dust · <oa-crown variant="crown|tower"> particle crown
   Attributes: data-decode (number scramble), data-reveal (mask rise), data-draw (hairline draw-in),
   data-spot (cursor light via --mx/--my), data-tilt (3D tilt ≤8°), data-magnet (magnetic pull). */
(function () {
  if (window.OA) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches || document.documentElement.dataset.motion === 'off';
  const OA = (window.OA = {
    reduced,
    setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('oa-theme', t); } catch (e) {} },
    toggleTheme() { OA.setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'); return document.documentElement.dataset.theme; },
    theme() { return document.documentElement.dataset.theme || 'dark'; }
  });
  try { const t = localStorage.getItem('oa-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}

  /* ---------- film grain ---------- */
  class Grain extends HTMLElement {
    connectedCallback() {
      if (document.getElementById('oa-grain-layer')) return;
      const c = document.createElement('canvas'); c.width = c.height = 160; c.id = 'oa-grain-layer';
      c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;opacity:.015;mix-blend-mode:screen;image-rendering:pixelated';
      document.body.appendChild(c); this._c = c;
      const x = c.getContext('2d'); const img = x.createImageData(160, 160);
      const draw = () => {
        for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
        x.putImageData(img, 0, 0);
      };
      draw();
      let last = 0;
      const loop = (t) => { this._r = requestAnimationFrame(loop); if (reduced() || t - last < 80) return; last = t; draw(); };
      this._r = requestAnimationFrame(loop);
    }
    disconnectedCallback() { cancelAnimationFrame(this._r); this._c && this._c.remove(); }
  }

  /* ---------- fog + dust ---------- */
  class Fog extends HTMLElement {
    connectedCallback() {
      const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
      this.appendChild(c); const x = c.getContext('2d');
      const dens = +(this.getAttribute('density') || 1);
      let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
      const size = () => { const r = c.getBoundingClientRect(); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
      size(); this._ro = new ResizeObserver(size); this._ro.observe(c);
      const puffs = Array.from({ length: Math.round(14 * dens) }, () => ({ x: Math.random(), y: .45 + Math.random() * .6, r: .18 + Math.random() * .3, v: (Math.random() * .5 + .2) * (Math.random() < .5 ? -1 : 1) * 0.00012, b: Math.random() < .35 }));
      const motes = Array.from({ length: Math.round(60 * dens) }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.4 + .3, v: Math.random() * .00025 + .00005, p: Math.random() * 6.28 }));
      const frame = (t) => {
        x.clearRect(0, 0, W, H);
        x.globalCompositeOperation = 'lighter';
        for (const p of puffs) {
          if (!reduced()) { p.x += p.v * 16; if (p.x > 1.4) p.x = -.4; if (p.x < -.4) p.x = 1.4; }
          const R = p.r * Math.max(W, H);
          const g = x.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, R);
          g.addColorStop(0, p.b ? 'rgba(58,160,255,0.07)' : 'rgba(200,210,225,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          x.fillStyle = g; x.fillRect(p.x * W - R, p.y * H - R, R * 2, R * 2);
        }
        for (const m of motes) {
          if (!reduced()) { m.y -= m.v * 16; m.p += .02; if (m.y < -.02) { m.y = 1.02; m.x = Math.random(); } }
          const a = .25 + .35 * Math.sin(m.p + t * .001);
          x.fillStyle = `rgba(160,205,255,${a.toFixed(3)})`;
          x.beginPath(); x.arc(m.x * W + Math.sin(m.p) * 6, m.y * H, m.s, 0, 6.283); x.fill();
        }
        x.globalCompositeOperation = 'source-over';
        this._r = requestAnimationFrame(frame);
      };
      this._r = requestAnimationFrame(frame);
    }
    disconnectedCallback() { cancelAnimationFrame(this._r); this._ro && this._ro.disconnect(); }
  }

  /* ---------- particle crown / king tower ---------- */
  function crownPoints(n) {
    const P = [];
    const R = 1;
    for (let i = 0; i < n; i++) {
      const u = Math.random();
      if (u < .22) { const a = Math.random() * 6.283, y = .55 + (Math.random() - .5) * .08; P.push([Math.cos(a) * R * 1.02, y, Math.sin(a) * R * 1.02]); }
      else if (u < .5) { const a = Math.random() * 6.283, y = .55 - Math.random() * .5; P.push([Math.cos(a) * R, y, Math.sin(a) * R]); }
      else if (u < .86) {
        const k = Math.floor(Math.random() * 5), a0 = k / 5 * 6.283, h = Math.random();
        const w = (1 - h) * .55, a = a0 + (Math.random() - .5) * w;
        P.push([Math.cos(a) * R, .05 - h * .95, Math.sin(a) * R]);
      } else if (u < .96) {
        const k = Math.floor(Math.random() * 5), a0 = k / 5 * 6.283; const th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1), r = .09;
        P.push([Math.cos(a0) * R + r * Math.sin(ph) * Math.cos(th), -.98 + r * Math.cos(ph), Math.sin(a0) * R + r * Math.sin(ph) * Math.sin(th)]);
      } else { const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * .9; P.push([Math.cos(a) * rr, .6, Math.sin(a) * rr]); }
    }
    return P;
  }
  function towerPoints(n) {
    const P = [];
    for (let i = 0; i < n; i++) {
      const u = Math.random(); const a = Math.random() * 6.283;
      if (u < .55) { const y = 1.1 - Math.random() * 1.5, r = .62 + (y > .7 ? .08 : 0); P.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
      else if (u < .75) { const k = Math.floor(Math.random() * 8), aa = k / 8 * 6.283 + (Math.random() - .5) * .3; const y = -.4 - Math.random() * .22; P.push([Math.cos(aa) * .74, y, Math.sin(aa) * .74]); }
      else if (u < .85) { const r = Math.sqrt(Math.random()) * .74; P.push([Math.cos(a) * r, -.4, Math.sin(a) * r]); }
      else { const h = Math.random(), k = Math.floor(Math.random() * 5), a0 = k / 5 * 6.283, w = (1 - h) * .5, aa = a0 + (Math.random() - .5) * w; P.push([Math.cos(aa) * .34, -.62 - h * .5, Math.sin(aa) * .34]); }
    }
    return P;
  }
  class Crown extends HTMLElement {
    connectedCallback() {
      const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      this.appendChild(c); const x = c.getContext('2d');
      const n = +(this.getAttribute('count') || 2600);
      const sizeEl = c;
      const base = (this.getAttribute('variant') === 'tower' ? towerPoints : crownPoints)(n);
      const scat = base.map(() => { const th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1), r = 1.5 + Math.random() * 2.5; return [r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)]; });
      let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
      const size = () => { const r = sizeEl.getBoundingClientRect(); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
      size(); this._ro = new ResizeObserver(size); this._ro.observe(sizeEl);
      let mx = 0, my = 0, tmx = 0, tmy = 0, rot = 0, burst = 0;
      this._mm = (e) => { const r = sizeEl.getBoundingClientRect(); tmx = ((e.clientX - r.left) / r.width - .5) * 2; tmy = ((e.clientY - r.top) / r.height - .5) * 2; };
      addEventListener('pointermove', this._mm);
      const frame = () => {
        const r = sizeEl.getBoundingClientRect();
        const sp = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * .9)));
        burst += ((reduced() ? 0 : sp) - burst) * .08;
        mx += (tmx - mx) * .05; my += (tmy - my) * .05;
        if (!reduced()) rot += .0035;
        x.clearRect(0, 0, W, H);
        const S = Math.min(W, H) * .32, cx = W / 2, cy = H / 2;
        const ry = rot + mx * .5, rx = -.32 + my * .25;
        const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
        x.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const b = base[i], s = scat[i];
          let px = b[0] + (s[0] - b[0]) * burst, py = b[1] + (s[1] - b[1]) * burst, pz = b[2] + (s[2] - b[2]) * burst;
          let X = px * cyr - pz * syr, Z = px * syr + pz * cyr;
          let Y = py * cxr - Z * sxr; Z = py * sxr + Z * cxr;
          const f = 3.2 / (3.2 + Z);
          const sx = cx + X * S * f, sy = cy + Y * S * f;
          const d = (1 - Z) * .5; const a = Math.max(.08, Math.min(1, .25 + d * .75)) * (1 - burst * .5);
          const hi = i % 9 === 0;
          x.fillStyle = hi ? `rgba(140,203,255,${a})` : `rgba(${200 + d * 40 | 0},${215 + d * 30 | 0},255,${a * .8})`;
          const sz = (hi ? 1.6 : 1.05) * f;
          x.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
        x.globalCompositeOperation = 'source-over';
        this._r = requestAnimationFrame(frame);
      };
      this._r = requestAnimationFrame(frame);
    }
    disconnectedCallback() { cancelAnimationFrame(this._r); removeEventListener('pointermove', this._mm); this._ro && this._ro.disconnect(); }
  }

  /* ---------- portal ring loader ---------- */
  class Portal extends HTMLElement {
    connectedCallback() {
      const s = +(this.getAttribute('size') || 64);
      this.style.cssText += `;display:inline-block;width:${s}px;height:${s}px`;
      this.innerHTML = `<svg viewBox="0 0 100 100" width="${s}" height="${s}" style="overflow:visible;filter:drop-shadow(0 0 6px rgba(58,160,255,.8))"><circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2"/><circle cx="50" cy="50" r="42" fill="none" stroke="#8CCBFF" stroke-width="2" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 50 50)"><animate attributeName="stroke-dashoffset" values="100;0;-100" dur="1.8s" repeatCount="indefinite"/></circle></svg>`;
    }
  }

  customElements.get('oa-grain') || customElements.define('oa-grain', Grain);
  customElements.get('oa-fog') || customElements.define('oa-fog', Fog);
  customElements.get('oa-crown') || customElements.define('oa-crown', Crown);
  customElements.get('oa-portal') || customElements.define('oa-portal', Portal);

  /* ---------- attribute-driven motion ---------- */
  const DIG = '0123456789';
  function decode(el) {
    if (el._dec) return; el._dec = 1;
    const tn = [...el.childNodes].find((n) => n.nodeType === 3); if (!tn) return;
    const final = tn.nodeValue; if (reduced()) return;
    const t0 = performance.now();
    const step = (t) => {
      const k = (t - t0) / 420;
      if (k >= 1) { tn.nodeValue = final; return; }
      tn.nodeValue = final.replace(/\d/g, (d, i) => (i / final.length < k ? d : DIG[Math.random() * 10 | 0]));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (!e.isIntersecting) continue; const el = e.target; io.unobserve(el);
      if (el.hasAttribute('data-decode')) decode(el);
      if (el.hasAttribute('data-reveal')) { el.style.transition = 'opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1), clip-path .9s cubic-bezier(.16,1,.3,1)'; el.style.opacity = 1; el.style.transform = 'none'; el.style.clipPath = 'inset(0 0 -10% 0)'; }
      if (el.hasAttribute('data-draw')) { el.style.transition = 'transform 1.1s cubic-bezier(.65,0,.35,1)'; el.style.transform = 'scaleX(1)'; }
    }
  }, { threshold: .15 });
  function scan(root) {
    (root.querySelectorAll ? root : document).querySelectorAll('[data-decode],[data-reveal],[data-draw]').forEach((el) => {
      if (el._oa) return; el._oa = 1;
      if (!reduced()) {
        if (el.hasAttribute('data-reveal')) { el.style.opacity = 0; el.style.transform = 'translateY(28px)'; el.style.clipPath = 'inset(0 0 100% 0)'; }
        if (el.hasAttribute('data-draw')) { el.style.transformOrigin = 'left'; el.style.transform = 'scaleX(0)'; }
      }
      io.observe(el);
    });
  }
  let pend = 0;
  new MutationObserver(() => { if (pend) return; pend = 1; requestAnimationFrame(() => { pend = 0; scan(document); }); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => scan(document)); scan(document);

  /* ---------- page transition: fog wipe + portal for slow loads ---------- */
  function veil() {
    let v = document.getElementById('oa-veil');
    if (!v) {
      v = document.createElement('div'); v.id = 'oa-veil';
      v.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;opacity:1;transition:opacity .5s cubic-bezier(.65,0,.35,1);background:radial-gradient(ellipse at 50% 60%,rgba(58,160,255,.10),rgba(7,8,10,0) 60%),#07080A;display:flex;align-items:center;justify-content:center';
      v.innerHTML = '<oa-portal size="72" style="opacity:0;transition:opacity .3s"></oa-portal>';
      (document.body || document.documentElement).appendChild(v);
    }
    return v;
  }
  function veilOut() { const v = veil(); requestAnimationFrame(() => requestAnimationFrame(() => { v.style.opacity = 0; })); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', veilOut); else veilOut();
  addEventListener('pageshow', (e) => { if (e.persisted) veilOut(); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href'); if (!href || href[0] === '#' || /^(https?:|mailto:)/.test(href)) return;
    e.preventDefault(); const v = veil(); v.style.pointerEvents = 'auto';
    if (reduced()) { location.href = href; return; }
    v.style.transitionDuration = '.35s'; v.style.opacity = 1;
    const slow = setTimeout(() => { const p = v.querySelector('oa-portal'); if (p) p.style.opacity = 1; }, 800);
    setTimeout(() => { location.href = href; }, 360); void slow;
  });

  addEventListener('pointermove', (e) => {
    const t = e.target.closest && e.target;
    if (!t) return;
    const spot = t.closest('[data-spot]');
    if (spot) { const r = spot.getBoundingClientRect(); spot.style.setProperty('--mx', (e.clientX - r.left) + 'px'); spot.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    if (reduced()) return;
    const tilt = t.closest('[data-tilt]');
    if (tilt) {
      const r = tilt.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      tilt.style.transition = 'transform .08s linear';
      tilt.style.transform = `perspective(600px) rotateX(${(-py * 16).toFixed(2)}deg) rotateY(${(px * 16).toFixed(2)}deg) translateZ(4px)`;
      tilt.style.setProperty('--ga', 1); tilt.style.setProperty('--gx', (px + .5) * 100 + '%'); tilt.style.setProperty('--gy', (py + .5) * 100 + '%');
      if (OA._lastTilt && OA._lastTilt !== tilt) OA._lastTilt.dispatchEvent(new Event('oa-untilt'));
      if (!tilt._ul) { tilt._ul = 1; const off = () => { tilt.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'; tilt.style.transform = ''; tilt.style.setProperty('--ga', 0); }; tilt.addEventListener('pointerleave', off); tilt.addEventListener('oa-untilt', off); }
      OA._lastTilt = tilt;
    }
    const mag = t.closest('[data-magnet]');
    if (mag) {
      const r = mag.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      mag.style.transition = 'transform .2s cubic-bezier(.16,1,.3,1)'; mag.style.transform = `translate(${dx * .18}px,${dy * .28}px)`;
      if (!mag._ul) { mag._ul = 1; mag.addEventListener('pointerleave', () => { mag.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'; mag.style.transform = ''; }); }
    }
  }, { passive: true });
})();
