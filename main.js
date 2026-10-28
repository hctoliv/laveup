(() => {
  const WA = '5511993185690';
  const PRICE = 16.99, PROMO = 14.99;
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DAYS_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const isPromo = d => d >= 1 && d <= 3;
  const brl = v => 'R$' + v.toFixed(2).replace('.', ',');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const today = new Date().getDay();

  $('#yr').textContent = new Date().getFullYear();

  /* header: esconde ao descer, menu mobile */
  const hd = $('#hd'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const o = hd.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
  });
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => {
    hd.classList.remove('open'); burger.setAttribute('aria-expanded', false);
  }));

  /* preço de hoje */
  const hp = $('#heroPrice');
  if (isPromo(today)) {
    hp.classList.add('promo');
    $('#hpTag').textContent = 'promo de hoje';
    $('#hpVal').textContent = brl(PROMO);
    $('#hpTxt').textContent = 'lave ou seque · seg a qua';
    $('#pcPromo').classList.add('today');
  } else {
    $('#hpTag').textContent = 'hoje';
    $('#hpTxt').textContent = 'o ciclo · seg a qua sai R$14,99';
    $('#pcNormal').classList.add('today');
  }

  /* relógio + contagem do ciclo no visor da máquina */
  const wClock = $('#wClock'), wTime = $('#wTime');
  let cycle = 35 * 60;
  const tick = () => {
    const n = new Date();
    wClock.textContent = 'agora ' + String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    cycle = cycle <= 0 ? 35 * 60 : cycle - 1;
    wTime.textContent = String(Math.floor(cycle / 60)).padStart(2, '0') + ':' + String(cycle % 60).padStart(2, '0');
  };
  tick(); setInterval(tick, 1000);

  /* bolhas (hero e espuma) */
  function bubbleField(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, list = [], visible = false;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const make = (y) => {
      const r = opts.min + Math.random() * (opts.max - opts.min);
      return { x: Math.random() * w, y: y ?? h + r + Math.random() * h * .3, r, vy: .25 + Math.random() * .6 * (opts.speed || 1), ph: Math.random() * 6.28, pop: 0 };
    };
    resize(); addEventListener('resize', resize);
    for (let i = 0; i < opts.count; i++) list.push(make(Math.random() * h));
    const draw = (b) => {
      if (b.pop) {
        const k = b.pop / 12;
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * 6.28, r1 = b.r * (1 + k * .6), r2 = b.r * (1 + k * 1.1);
          ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * r1, b.y + Math.sin(a) * r1);
          ctx.lineTo(b.x + Math.cos(a) * r2, b.y + Math.sin(a) * r2); ctx.stroke();
        }
        return;
      }
      const g = ctx.createRadialGradient(b.x - b.r * .35, b.y - b.r * .4, b.r * .1, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(255,255,255,.85)');
      g.addColorStop(.35, opts.tint1);
      g.addColorStop(.9, opts.tint2);
      g.addColorStop(1, 'rgba(255,255,255,.55)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
      ctx.stroke();
    };
    const step = (t) => {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        if (b.pop) { b.pop++; if (b.pop > 12) { list.splice(i, 1); if (opts.respawn) list.push(make()); continue; } }
        else if (!reduce) { b.y -= b.vy; b.x += Math.sin(t / 900 + b.ph) * .35; }
        if (b.y < -b.r * 2) { list.splice(i, 1); list.push(make()); continue; }
        draw(b);
      }
      requestAnimationFrame(step);
    };
    new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was) requestAnimationFrame(step);
    }).observe(canvas);
    return {
      list,
      popAt(x, y) {
        let hit = 0;
        for (const b of list) if (!b.pop && Math.hypot(b.x - x, b.y - y) < b.r + 6) { b.pop = 1; hit++; }
        return hit;
      }
    };
  }

  const hero = $('#hero');
  const heroField = bubbleField($('#bubbles'), { count: innerWidth < 700 ? 16 : 30, min: 6, max: 34, tint1: 'rgba(191,230,246,.18)', tint2: 'rgba(12,132,168,.22)', respawn: true });
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    heroField.popAt(e.clientX - r.left, e.clientY - r.top);
  });

  /* espuma: estoura bolhas pra revelar a resposta */
  const foamCanvas = $('#foam');
  const foam = bubbleField(foamCanvas, { count: innerWidth < 700 ? 26 : 46, min: 14, max: 58, speed: .5, tint1: 'rgba(191,230,246,.12)', tint2: 'rgba(24,163,201,.28)', respawn: false });
  let popped = 0; const goal = innerWidth < 700 ? 6 : 10;
  const ans = $('#foamAns'), count = $('#foamCount'), hint = $('#foamHint');
  const popFoam = (e) => {
    const r = foamCanvas.getBoundingClientRect();
    popped += foam.popAt(e.clientX - r.left, e.clientY - r.top);
    if (popped > 0 && popped < goal) count.textContent = `(${popped}/${goal})`;
    if (popped >= goal && !ans.classList.contains('on')) { ans.classList.add('on'); hint.style.opacity = 0; }
  };
  foamCanvas.addEventListener('pointerdown', popFoam);
  foamCanvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') popFoam(e); });
  // quem só rola a página também vê a resposta
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) setTimeout(() => { ans.classList.add('on'); hint.style.opacity = 0; }, 9000);
  }, { threshold: .6 }).observe(foamCanvas);

  /* modo de usar: lavadora / secadora */
  const MODES = {
    lavar: { h: 'Selecione o programa e aperte iniciar', p: 'Sabão e amaciante entram sozinhos. Não precisa levar nada.', t: 'por ciclo de lavagem' },
    secar: { h: 'Selecione a temperatura e aperte iniciar', p: 'Antes de começar, limpe o filtro. E limpe de novo no fim.', t: 'por ciclo de secagem' }
  };
  document.querySelectorAll('.modo-tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.modo-tabs button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    const m = MODES[b.dataset.m];
    $('#step3').textContent = m.h; $('#step3p').textContent = m.p; $('#modoTimerTxt').textContent = m.t;
    if (b.dataset.m === 'secar') { const f = $('#ruleFiltro'); f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash'); }
  }));

  /* calculadora */
  const st = { day: today, lavar: 1, secar: 1 };
  const daysEl = $('#days');
  DAYS.forEach((d, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = i === today ? 'Hoje' : d;
    if (isPromo(i)) b.classList.add('promo');
    b.dataset.d = i;
    b.addEventListener('click', () => { st.day = i; render(); });
    daysEl.appendChild(b);
  });
  document.querySelectorAll('.stepper').forEach(s => s.addEventListener('click', e => {
    const d = +e.target.dataset.d; if (!d) return;
    const k = s.dataset.k; st[k] = Math.max(0, Math.min(9, st[k] + d)); render();
  }));
  function render() {
    daysEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.d === st.day));
    document.querySelectorAll('.stepper').forEach(s => s.querySelector('output').textContent = st[s.dataset.k]);
    const p = isPromo(st.day) ? PROMO : PRICE, n = st.lavar + st.secar;
    $('#total').textContent = brl(n * p);
    $('#totalNote').textContent = n ? `${n} ciclo${n > 1 ? 's' : ''} de ${brl(p)}${isPromo(st.day) ? ' · promo' : ''}` : 'escolha pelo menos um ciclo';
    const quando = st.day === today ? 'hoje' : (st.day % 6 === 0 ? 'no ' : 'na ') + DAYS_LONG[st.day];
    const parts = [];
    if (st.lavar) parts.push(`lavar ${st.lavar} cesto${st.lavar > 1 ? 's' : ''}`);
    if (st.secar) parts.push(`secar ${st.secar}`);
    const msg = `Oi, LaveUp! Vi o site e tô pensando em passar ${quando} pra ${parts.join(' e ') || 'lavar umas roupas'} (deu ${brl(n * p)} na conta do site). Queria tirar uma dúvida:`;
    $('#calcWa').href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  }
  render();

  /* vídeos: carrega perto da tela, pausa fora */
  const vids = document.querySelectorAll('video[data-src]');
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src) { v.src = v.dataset.src; v.load(); }
      if (v.muted) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }), { rootMargin: '200px 0px' });
  vids.forEach(v => vio.observe(v));

  /* vídeo do dono com som */
  const dp = $('#donoPlayer'), dv = dp.querySelector('video');
  $('#donoPlay').addEventListener('click', () => {
    if (!dv.src) dv.src = dv.dataset.src;
    dv.muted = false; dv.controls = true; dv.play(); dp.classList.add('playing');
  });
  dv.addEventListener('ended', () => { dp.classList.remove('playing'); dv.controls = false; });

  /* reveal */
  const rvs = document.querySelectorAll('.sec-head, .step, .rule, .pc, .calc, .feats li, .est-video, .est-photo, .dono-player, .phone, .map, .modo-photo');
  rvs.forEach(el => el.classList.add('rv'));
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: .15 });
  rvs.forEach(el => rio.observe(el));

  /* scroll: um rAF só */
  const washer = $('#washer'), ring = $('#wRing'), water = $('#wWater');
  const ask = $('#ask'), askL = document.querySelectorAll('.ask-l, .ask-note');
  const steps = document.querySelectorAll('.step');
  const fab = document.querySelector('.wa-float');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    // header
    hd.classList.toggle('hide', y > lastY && y > 300 && !hd.classList.contains('open'));
    lastY = y;
    fab.classList.toggle('on', y > vh * .8);
    // máquina do hero
    if (!reduce && y < vh * 1.2) {
      const k = y / vh;
      washer.style.setProperty('--rot', (k * -6) + 'deg');
      washer.style.setProperty('--ty', (k * 60) + 'px');
      ring.style.setProperty('--ringRot', (y * .4) + 'deg');
      water.style.setProperty('--water', (28 + k * 40) + '%');
      washer.querySelector('.w-knob').style.setProperty('--knob', (y * .8) + 'deg');
    }
    // perguntas
    const ar = ask.getBoundingClientRect();
    const p = Math.max(0, Math.min(.999, -ar.top / (ar.height - vh)));
    const idx = Math.floor(p * 4);
    askL.forEach(l => {
      const i = +l.dataset.i;
      l.classList.toggle('on', i === idx || (idx === 3 && i === 3));
      l.classList.toggle('past', i < idx && i < 3);
    });
    // passos
    steps.forEach(s => {
      const r = s.getBoundingClientRect();
      s.classList.toggle('on', r.top < vh * .72);
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
