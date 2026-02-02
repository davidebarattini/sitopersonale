(() => {
  const el = document.querySelector(".slot");
  if (!el) return;

  const finalText = el.dataset.text || el.textContent;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/._-";
  const frameMs = 45;        // velocità “slot”
  const holdMs = 2000;        // quanto resta fermo il testo finale
  const settleFrames = 18;   // quante “tacche” per stabilizzarsi

  // Accessibilità: se l’utente preferisce ridurre animazioni, lascia testo fisso
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
      // progress da 0 a 1
      const t = frame / settleFrames;

      // quante lettere “si sono già fermate”
      const settled = Math.floor(t * len);

      let out = "";
      for (let i = 0; i < len; i++) {
        if (i < settled) {
          out += finalText[i];
        } else {
          // mantieni spazi e caratteri “speciali” stabili se vuoi
          const c = finalText[i];
          out += c === " " ? " " : randomChar();
        }
      }

      el.textContent = out;

      frame++;
      if (frame > settleFrames) {
        clearInterval(timer);
        el.textContent = finalText;
        el.classList.remove("is-shuffling");

        // pausa e loop
        setTimeout(shuffleOnce, holdMs);
      }
    }, frameMs);
  }

  // Avvio con una piccola pausa (così non parte troppo “aggressivo”)
  setTimeout(shuffleOnce, 500);
})();
