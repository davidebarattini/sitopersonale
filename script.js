/* ==========================================================================
   SLOT TEXT (Visual Designer//) — effetto “slot machine” in loop
   ========================================================================== */
(() => {
  const el = document.querySelector(".slot");
  if (!el) return;

  const finalText = el.dataset.text || el.textContent;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/._-";
  const frameMs = 45;         // velocità “slot”
  const holdMs = 2000;        // quanto resta fermo il testo finale
  const settleFrames = 18;    // quante “tacche” per stabilizzarsi

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    el.textContent = finalText;
    return;
  }

  function randomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function shuffleOnce() {
    el.classList.add("is-shuffling");

    let frame = 0;
    const len = finalText.length;

    const timer = setInterval(() => {
      const t = frame / settleFrames;
      const settled = Math.floor(t * len);

      let out = "";
      for (let i = 0; i < len; i++) {
        if (i < settled) out += finalText[i];
        else out += finalText[i] === " " ? " " : randomChar();
      }

      el.textContent = out;

      frame++;
      if (frame > settleFrames) {
        clearInterval(timer);
        el.textContent = finalText;
        el.classList.remove("is-shuffling");
        setTimeout(shuffleOnce, holdMs);
      }
    }, frameMs);
  }

  setTimeout(shuffleOnce, 500);
})();

/* ==========================================================================
   RING BACKGROUND + 5 HOTSPOTS (puntini) con preview circolare e link
   - Richiede in HTML:
       <canvas id="ring-bg"></canvas>
       <div id="hotspots"></div>
   - Richiede in CSS:
       #hotspots { position: fixed; inset:0; pointer-events:none; z-index:0; }
       .hotspot { position:absolute; transform:translate(-50%,-50%); pointer-events:auto; }
       ... (ti avevo dato il CSS completo)
   ========================================================================== */
(() => {
  const canvas = document.getElementById("ring-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // ---- Look & feel ----
  const cfg = {
    bg: "#252525",

    radius: () => Math.min(w, h) * 0.30,
    thickness: () => Math.min(w, h) * 0.045,

    ribbons: 5,
    steps: 520,

    lineWidth: 1,
    alpha: 0.45,
    glow: 4,

    speed: 0.020,
    wobble: 0.55,
    twist: 1.25,

    // neutro (no dominante blu)
    c1: { r: 240, g: 240, b: 240 },
    c2: { r: 120, g: 120, b: 120 },
  };

  /* -------------------- HOTSPOTS -------------------- */
  // Cambia qui nomi, immagini e link ai progetti
  const projects = [
    { label: "Project 01", img: "Immagini/project01.png", url: "Es.7/index.html", theta: 0 },
    { label: "Project 02", img: "Immagini/verde.jpg", url: "./project-02.html", theta: Math.PI / 2 },
    { label: "Project 03", img: "Immagini/giallo.jpg", url: "./project-03.html", theta: Math.PI },
    { label: "Project 04", img: "Immagini/blu.jpeg", url: "./project-04.html", theta: Math.PI * 1.5 },
  ];

  const hotspotLayer = document.getElementById("hotspots");
  const hotspotEls = [];

  if (hotspotLayer) {
    hotspotLayer.innerHTML = "";
    projects.forEach((p) => {
      const wrap = document.createElement("div");
      wrap.className = "hotspot";
      wrap.innerHTML = `
        <a href="${p.url}" aria-label="${p.label}"></a>
        <div class="preview" aria-hidden="true">
          <img src="${p.img}" alt="">
          <div class="label">${p.label}</div>
        </div>
      `;
      hotspotLayer.appendChild(wrap);
      hotspotEls.push(wrap);
    });
  }

  /* -------------------- Helpers colori -------------------- */
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixRGB = (a, b, t) => {
    t = clamp01(t);
    return `rgb(${Math.round(lerp(a.r, b.r, t))},${Math.round(lerp(a.g, b.g, t))},${Math.round(lerp(a.b, b.b, t))})`;
  };

  function colorAt(theta) {
    const tt = Math.sin(theta) * 0.5 + 0.5;
    return mixRGB(cfg.c1, cfg.c2, tt);
  }

  /* -------------------- Punto su una ribbon a un angolo theta -------------------- */
  function ribbonPoint(k, theta, tNow) {
    const cx = w * 0.5;
    const cy = h * 0.5;

    const R = cfg.radius();
    const thick = cfg.thickness();

    const phase = (k / cfg.ribbons) * Math.PI * 2;
    const localT = tNow + phase * 0.25;

    const wob =
      Math.sin(theta * 3 + localT * 2.0) * 0.55 +
      Math.sin(theta * 5 - localT * 1.4) * 0.25 +
      Math.sin(theta * 2 + localT * 0.9) * 0.20;

    const twist = Math.sin(theta * 8 + localT * 2.6) * cfg.twist;

    const r = R + wob * thick * cfg.wobble + twist * (thick * 0.10) * Math.sin(phase);

    const x = cx + Math.cos(theta + localT * 0.25) * r;
    const y = cy + Math.sin(theta + localT * 0.25) * r;

    return { x, y };
  }



  /* -------------------- Animazione -------------------- */
  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = cfg.bg;
    ctx.fillRect(0, 0, w, h);

    const R = cfg.radius();
    const thick = cfg.thickness();

    ctx.shadowColor = "rgba(255,255,255,0.25)";
    ctx.shadowBlur = cfg.glow;
    ctx.globalCompositeOperation = "lighter";

    for (let k = 0; k < cfg.ribbons; k++) {
      const phase = (k / cfg.ribbons) * Math.PI * 2;
      const localT = t + phase * 0.25;

      ctx.beginPath();

      for (let i = 0; i <= cfg.steps; i++) {
        const u = i / cfg.steps;
        const theta = u * Math.PI * 2;

        const wob =
          Math.sin(theta * 3 + localT * 2.0) * 0.55 +
          Math.sin(theta * 5 - localT * 1.4) * 0.25 +
          Math.sin(theta * 2 + localT * 0.9) * 0.20;

        const tw = Math.sin(theta * 8 + localT * 2.6) * cfg.twist;

        const r = R + wob * thick * cfg.wobble + tw * (thick * 0.10) * Math.sin(phase);

        const cx = w * 0.5;
        const cy = h * 0.5;

        const x = cx + Math.cos(theta + localT * 0.25) * r;
        const y = cy + Math.sin(theta + localT * 0.25) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const c = colorAt(phase + t * 1.4);
      ctx.strokeStyle = c;
      ctx.globalAlpha = cfg.alpha * (0.55 + 0.45 * (k / cfg.ribbons));
      ctx.lineWidth = cfg.lineWidth;
      ctx.stroke();
    }

    // --- aggiorna posizioni dei 5 puntini (uno per ribbon) ---
    if (hotspotEls.length) {
      for (let i = 0; i < hotspotEls.length; i++) {
        const k = i % cfg.ribbons;
        const theta = projects[i].theta;
        const pt = ribbonPoint(k, theta, t);

        hotspotEls[i].style.left = pt.x + "px";
        hotspotEls[i].style.top = pt.y + "px";
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;

    if (!reduceMotion) t += cfg.speed;

    requestAnimationFrame(draw);
  }

  draw();
})();

/* =======================
   CIRCLE IMMERSION TRANSITION
   ======================= */
(() => {
  const overlay = document.getElementById("circle-transition");
  if (!overlay) return;

  document.addEventListener("click", (e) => {
    const link = e.target.closest(".hotspot a");
    if (!link) return;

    e.preventDefault();

    const rect = link.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // posiziona il cerchio sul puntino
    overlay.style.left = `${cx}px`;
    overlay.style.top  = `${cy}px`;

    overlay.style.opacity = "1";
    overlay.style.transform = "translate(-50%, -50%) scale(1)";

    // quanto deve diventare grande per coprire tutto
    const maxDim = Math.hypot(window.innerWidth, window.innerHeight) / 10;
    overlay.style.transform = `translate(-50%, -50%) scale(${maxDim})`;

    // naviga dopo l’animazione
    setTimeout(() => {
      window.location.href = link.href;
    }, 650);
  });
})();

(() => {
  const overlay = document.getElementById("circle-transition");
  if (!overlay) return;

  function resetOverlay() {
    overlay.style.opacity = "0";
    overlay.style.transform = "translate(-50%, -50%) scale(0)";
    // posizione offscreen per sicurezza
    overlay.style.left = "-9999px";
    overlay.style.top = "-9999px";
  }

  // Quando la pagina torna da "indietro" (bfcache), resetta
  window.addEventListener("pageshow", (e) => {
    resetOverlay();
  });

  // Extra sicurezza: reset anche al load normale
  window.addEventListener("load", resetOverlay);
})();




const DOT_SCALE = 0.015;

/* p5 in instance mode: non confligge con il tuo JS principale */
new p5((p) => {
  let faccione;
  let small;
  const size = 800; // deve combaciare col CSS (width/height)

  p.preload = () => {
    faccione = p.loadImage("Immagini/ritratto.png"); // immagine
  };

  p.setup = () => {
    const cnv = p.createCanvas(size, size);
    cnv.parent("portrait-p5");

    p.pixelDensity(1);
    p.noStroke();

    // riduco immagine per farla “a puntini”
    // (più piccolo => più grosso l’effetto puntinato)
    small = faccione.get();
    small.resize(Math.floor(faccione.width / 6), Math.floor(faccione.height / 6));
  };

  p.draw = () => {
    // bg trasparente così si fonde con sito; se vuoi nero: p.background(0)
    p.clear();

    const numH = small.width;
    const numV = small.height;

    const d = 4; // distanza fra puntini (puoi cambiare)
    const ox = (p.width - (numH - 1) * d) / 2;
    const oy = (p.height - (numV - 1) * d) / 2;

    // usa il mouse globale (window) per reagire anche fuori dal cerchio
const mx = (window.__mouseX ?? p.mouseX);
const ANCHOR_X = window.innerWidth / 2;  // punto neutro
const strength = 0.20;

const amount = (mx - ANCHOR_X) * strength;


    // noise che “scorre” (animazione)
    const ny = p.frameCount * 0.011;
    const nx = p.frameCount * 0.031;
    const nz = p.frameCount * 0.014;

    // clip circolare (così resta perfetto nel cerchio)
    p.push();
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.arc(p.width / 2, p.height / 2, p.width / 2, 0, Math.PI * 2);
    p.drawingContext.clip();

    // disegna puntini
    for (let j = 0; j < numV; j++) {
      for (let i = 0; i < numH; i++) {
        const col = small.get(i, j);
        const al = p.alpha(col);
        if (al < 250) continue;

        const br = p.brightness(col);

        p.fill(200); // puntini chiari neutri

        const px =
          ox + i * d +
          p.map(p.noise(i * 0.02 + nx, j * 0.02 + ny, nz), 0, 1, -amount, amount);

        const py =
          oy + j * d +
          p.map(p.noise(i * 0.08 + nx, j * 0.02 + ny, nz + 5), 0, 1, -amount, amount);

        p.circle(px, py, br * DOT_SCALE);
      }
    }

    // restore clip
    p.drawingContext.restore();
    p.pop();
  };
});

/* mouse globale per avere controllo anche quando pointer-events è none */
(() => {
  window.__mouseX = 0;
  window.addEventListener("mousemove", (e) => {
    window.__mouseX = e.clientX;
  }, { passive: true });
})();



