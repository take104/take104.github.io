/* Ace Metal renewal demo: shared script (GSAP + ScrollTrigger + Lenis, three.js on the top page) */
/* Ace Metal renewal demo: motion layer (GSAP + ScrollTrigger + Lenis + three.js r149) */
(() => {
  'use strict';
  const doc = document, root = doc.documentElement;
  const qs = (s, el = doc) => el.querySelector(s);
  const qsa = (s, el = doc) => Array.from(el.querySelectorAll(s));
  const params = new URLSearchParams(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('static');
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGSAP && !reduce;
  const webgl = (() => {
    if (params.has('no3d') || !window.THREE) return false;
    try { const c = doc.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();
  const want3D = motion && webgl && !!window.THREE;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const isMobile = () => innerWidth <= 760;
  root.classList.add(motion ? 'is-motion' : 'is-static');
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (motion) gsap.ticker.lagSmoothing(0);
  if (hasGSAP && window.Flip) gsap.registerPlugin(Flip);

  /* ---------------------------------------------------------------- menu, form, files (always) */
  const header = qs('.site-header');
  const menuBtn = qs('.menu-btn');
  const menuLabel = qs('.menu-btn__label');
  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? '閉じる' : 'メニュー';
    if (open) header.classList.remove('is-hidden');
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  qsa('.gnav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });

  if (qs('#quote-form')) {
  const fileInput = qs('#f-files'), zone = qs('.dropzone'), fileList = qs('.file-list');
  const showFiles = (files) => {
    fileList.innerHTML = '';
    Array.from(files).forEach((f) => {
      const li = doc.createElement('li');
      li.textContent = f.name + '（' + Math.max(1, Math.round(f.size / 1024)).toLocaleString('ja-JP') + ' KB）';
      fileList.appendChild(li);
    });
  };
  fileInput.addEventListener('change', () => showFiles(fileInput.files));
  ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove('is-over'); }));
  zone.addEventListener('drop', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    try { fileInput.files = e.dataTransfer.files; } catch (err) { /* read-only in some browsers */ }
    showFiles(e.dataTransfer.files);
  });
  const form = qs('#quote-form'), msg = qs('.demo-msg', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = qsa('[required]', form).filter((el) => (el.type === 'checkbox' ? !el.checked : !el.value.trim()));
    msg.textContent = missing.length
      ? '「必須」の項目が未入力です。' + missing.length + '件の項目を入力してください。（デモのため送信はされません）'
      : 'デモのため送信されません。公開版では送信完了ページに移り、その表示を問い合わせ件数として計測します。';
    msg.classList.add('is-shown');
    msg.focus();
  });
    const hashKind = (location.hash.match(/^#form-([a-z]+)$/) || [])[1];
    if (hashKind) {
      const radio = qs('input[name="kind"][value="' + hashKind + '"]', form);
      if (radio) radio.checked = true;
      requestAnimationFrame(() => {
        const f = qs('#form');
        if (!f) return;
        const y = Math.max(0, f.getBoundingClientRect().top + scrollY - (header.offsetHeight + 12));
        if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y);
      });
    }
  }

  /* ---------------------------------------------------------------- smooth scroll and anchors */
  let lenis = null;
  if (motion && window.Lenis && !params.has('nosmooth')) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const headerOffset = () => -(header.offsetHeight + 12);
  const PAGES = { 'index.html': 'ホーム', 'service.html': '事業内容', 'cases.html': '加工事例', 'equipment.html': '設備・品質保証', 'company.html': '会社情報', 'recruit.html': '採用情報', 'contact.html': '見積り依頼・お問い合わせ', 'privacy.html': 'プライバシーポリシー' };
  const fileOf = (path) => path.split('/').pop() || 'index.html';
  const dirOf = (path) => path.replace(/[^/]*$/, '');
  const isThisPage = (u) => fileOf(u.pathname) === fileOf(location.pathname) && dirOf(u.pathname) === dirOf(location.pathname);
  const scrollToHash = (hash) => {
    if (hash === '#top') {
      if (lenis) lenis.scrollTo(0, { duration: 1.2 }); else scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      return true;
    }
    let target = null;
    try { target = qs(hash); } catch (err) { return false; }
    if (!target) return false;
    const y = Math.max(0, target.getBoundingClientRect().top + scrollY + headerOffset());
    if (lenis) lenis.scrollTo(y, { duration: 1.3 }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    return true;
  };
  const pt = qs('.pt'), ptLabel = qs('.pt__label');
  let leaving = false;
  const leaveTo = (href, label) => {
    if (leaving) return;
    leaving = true;
    if (ptLabel) ptLabel.textContent = label || '';
    try { sessionStorage.setItem('am-pt', '1'); } catch (err) { /* storage unavailable: arrive without the curtain */ }
    root.classList.remove('pt-cover', 'pt-lift');
    void pt.offsetWidth;
    root.classList.add('pt-leave');
    setTimeout(() => { location.href = href; }, 520);
    setTimeout(() => { leaving = false; root.classList.remove('pt-leave'); }, 4000);
  };
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    root.classList.remove('pt-leave', 'pt-cover', 'pt-lift');
    try { sessionStorage.removeItem('am-pt'); } catch (err) { /* storage unavailable */ }
  });
  doc.addEventListener('click', (e) => {
    const a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href') || '';
    if (/^(tel:|mailto:|javascript:)/i.test(raw)) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    if (isThisPage(url) && url.search === location.search) {
      if (url.hash.length > 1) { if (scrollToHash(url.hash)) e.preventDefault(); }
      else { e.preventDefault(); scrollToHash('#top'); }
      return;
    }
    if (!motion || !pt) return;
    e.preventDefault();
    leaveTo(url.href, PAGES[fileOf(url.pathname)] || '');
  });

  /* ---------------------------------------------------------------- header state and scroll meter */
  const meter = qs('.scroll-meter');
  let lastY = scrollY;
  const onScroll = (y) => {
    const max = Math.max(1, root.scrollHeight - innerHeight);
    if (meter) meter.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)).toFixed(4) + ')';
    header.classList.toggle('is-solid', y > 8);
    if (motion) {
      if (y > lastY + 2 && y > innerHeight * 0.7 && !header.classList.contains('is-open')) header.classList.add('is-hidden');
      else if (y < lastY - 2 || y < innerHeight * 0.7) header.classList.remove('is-hidden');
    }
    lastY = y;
  };
  if (lenis) lenis.on('scroll', (e) => onScroll(e.scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);

  /* ---------------------------------------------------------------- Japanese-aware text splitting */
  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
  const CLOSE = /^[、。，．・：；？！）」』】〕〉》ー…]+$/;
  const OPEN = /^[（「『【〔〈《]+$/;
  function splitText(el) {
    if (el.dataset.splitDone) return qsa('.sc', el);
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const nodes = Array.from(el.childNodes);
    el.textContent = '';
    const sr = doc.createElement('span'); sr.className = 'vh'; sr.textContent = label;
    const out = doc.createElement('span'); out.setAttribute('aria-hidden', 'true');
    let prev = null, open = '';
    const addChars = (word, text) => { for (const ch of text) { const c = doc.createElement('span'); c.className = 'sc'; c.textContent = ch; word.appendChild(c); } };
    const pushWord = (text) => {
      if (!text) return;
      if (/^\s+$/.test(text)) { out.appendChild(doc.createTextNode(text)); prev = null; return; }
      if (CLOSE.test(text) && prev) { addChars(prev, text); return; }
      if (OPEN.test(text)) { open += text; return; }
      const w = doc.createElement('span'); w.className = 'sw'; addChars(w, open + text); open = '';
      out.appendChild(w); prev = w;
    };
    const pushText = (t) => (seg ? Array.from(seg.segment(t), (s) => s.segment) : Array.from(t)).forEach(pushWord);
    nodes.forEach((n) => {
      if (n.nodeType === 3) pushText(n.textContent);
      else if (n.nodeName === 'BR') { out.appendChild(doc.createElement('br')); prev = null; }
      else if (n.classList && n.classList.contains('nb')) pushWord(n.textContent);
      else pushText(n.textContent);
    });
    if (open) pushWord(open);
    el.append(sr, out);
    el.dataset.splitDone = '1';
    return qsa('.sc', out);
  }

  /* ---------------------------------------------------------------- line drawings that draw themselves */
  function drawIn(host) {
    const svg = host.tagName.toLowerCase() === 'svg' ? host : qs('svg', host);
    if (!svg) return;
    const strokes = [], fills = [], chains = [];
    qsa('path,polygon,polyline,rect,circle,ellipse,line,text', svg).forEach((el) => {
      if (el.closest('[stroke-dasharray]')) { chains.push(el); return; }
      const cs = getComputedStyle(el);
      if (cs.stroke && cs.stroke !== 'none') { el.setAttribute('pathLength', '1'); strokes.push(el); }
      if (cs.fill && cs.fill !== 'none' && cs.fill !== 'rgba(0, 0, 0, 0)') fills.push(el);
    });
    const tl = gsap.timeline({ delay: parseFloat(host.dataset.drawDelay || 0), scrollTrigger: { trigger: svg, start: 'top 92%', once: true } });
    if (strokes.length) { gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 }); tl.to(strokes, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: { amount: 0.6 } }); }
    if (fills.length) { gsap.set(fills, { fillOpacity: 0 }); tl.to(fills, { fillOpacity: 1, duration: 0.8, ease: 'power1.out' }, '-=0.9'); }
    if (chains.length) { gsap.set(chains, { opacity: 0 }); tl.to(chains, { opacity: 1, duration: 0.6 }, '-=0.5'); }
  }

  function countUp(el, to, dur) {
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: dur || 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
  }

  /* ---------------------------------------------------------------- page arrival: curtain lift and entrance */
  const covered = root.classList.contains('pt-cover');
  if (covered && pt) {
    void pt.offsetWidth;
    root.classList.add('pt-lift');
    root.classList.remove('pt-cover');
    setTimeout(() => root.classList.remove('pt-lift'), 1000);
  }
  const lead = covered ? 0.5 : 0.12;
  const present = (list) => list.filter(Boolean);
  if (motion && qs('.hero__title')) {
    const chars = splitText(qs('.hero__title'));
    const leadEl = qs('.hero__lead'), actions = qsa('.hero__actions > *'), specs = qsa('.hero-specs > div');
    gsap.set(present([leadEl].concat(actions, specs)), { autoAlpha: 0, y: 20 });
    root.classList.remove('js-pending');
    const t = gsap.timeline({ delay: lead })
      .fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.03 }, 0);
    if (leadEl) t.to(leadEl, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.35);
    if (actions.length) t.to(actions, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.5);
    if (specs.length) t.to(specs, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.6);
    t.add(() => qsa('.hero-specs [data-count]').forEach((el) => countUp(el, parseFloat(el.dataset.count))), 0.6);
  } else if (motion && qs('.page-hero__title')) {
    const chars = splitText(qs('.page-hero__title'));
    const rest = present([qs('.breadcrumb'), qs('.page-hero__lead'), qs('.subnav')]);
    if (rest.length) gsap.set(rest, { autoAlpha: 0, y: 16 });
    root.classList.remove('js-pending');
    const t = gsap.timeline({ delay: lead })
      .fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045 }, 0.05);
    if (rest.length) t.to(rest, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, clearProps: 'opacity,visibility,transform' }, 0);
  } else {
    root.classList.remove('js-pending');
  }

  /* ---------------------------------------------------------------- 3D: shared helpers */
  const TX = {};
  function sharedTextures() {
    if (TX.brushed) return TX;
    const T = THREE;
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const canvasTex = (size, draw, rx, ry) => {
      const c = doc.createElement('canvas'); c.width = c.height = size;
      draw(c.getContext('2d'), size);
      const t = new T.CanvasTexture(c);
      t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8;
      return t;
    };
    TX.brushed = canvasTex(512, (g, n) => {
      g.fillStyle = '#868686'; g.fillRect(0, 0, n, n);
      for (let i = 0; i < 2600; i++) {
        const y = rnd() * n, x = rnd() * n, len = n * (0.15 + rnd() * 0.7), v = rnd() < 0.5 ? 255 : 0;
        g.strokeStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.03 + rnd() * 0.09).toFixed(3) + ')';
        g.lineWidth = 0.4 + rnd() * 1.1;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
        g.beginPath(); g.moveTo(x - n, y); g.lineTo(x + len - n, y); g.stroke();
      }
    }, 2.5, 2.5);
    TX.swirl = canvasTex(256, (g, n) => {
      g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, n, n);
      for (let r = 1; r < n * 0.72; r += 1.5) {
        g.strokeStyle = 'rgba(255,255,255,' + (0.035 + rnd() * 0.1).toFixed(3) + ')'; g.lineWidth = 0.8;
        g.beginPath(); g.arc(n / 2, n / 2, r, 0, Math.PI * 2); g.stroke();
      }
    });
    TX.flutes = canvasTex(128, (g, n) => {
      g.fillStyle = '#b8bec5'; g.fillRect(0, 0, n, n);
      g.strokeStyle = '#2a323a'; g.lineWidth = n * 0.16;
      for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * n / 2, 0); g.lineTo(i * n / 2 + n * 0.8, n); g.stroke(); }
    }, 2, 1);
    TX.flutes.encoding = T.sRGBEncoding;
    const sc = doc.createElement('canvas'); sc.width = sc.height = 128;
    const sg = sc.getContext('2d'), gr = sg.createRadialGradient(64, 64, 6, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,.9)'); gr.addColorStop(0.55, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = gr; sg.fillRect(0, 0, 128, 128);
    TX.shadow = new T.CanvasTexture(sc);
    return TX;
  }

  function makeRenderer(canvas) {
    const T = THREE;
    const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 1.75));
    r.outputEncoding = T.sRGBEncoding;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.setClearColor(0x000000, 0);
    return r;
  }

  function studioEnv(renderer) {
    const T = THREE;
    const pm = new T.PMREMGenerator(renderer);
    const s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(24, 12, 24), new T.MeshBasicMaterial({ color: 0x0b1a2a, side: T.BackSide })));
    const panel = (w, h, hex, k, pos, rot) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]); m.rotation.set(rot[0], rot[1], rot[2]); s.add(m);
    };
    panel(10, 3, 0xffffff, 5, [0, 5.9, 0], [Math.PI / 2, 0, 0]);
    panel(4, 7, 0xffffff, 2.6, [-11.9, 1.5, 3], [0, Math.PI / 2, 0]);
    panel(4, 7, 0xdde6ef, 1.8, [11.9, 1.5, -4], [0, -Math.PI / 2, 0]);
    panel(9, 1.6, 0xde9a6a, 1.5, [0, 1, -11.9], [0, 0, 0]);
    panel(9, 1.6, 0xffffff, 1.2, [2, 0.5, 11.9], [0, Math.PI, 0]);
    const tex = pm.fromScene(s, 0.035).texture;
    pm.dispose();
    return tex;
  }

  function makeMats(renderer) {
    const T = THREE, X = sharedTextures(), env = studioEnv(renderer);
    const std = (o) => new T.MeshStandardMaterial(Object.assign({ envMap: env }, o));
    return {
      stock: std({ color: 0xc4cad1, metalness: 1, roughness: 0.38, roughnessMap: X.brushed, bumpMap: X.brushed, bumpScale: 0.0012, envMapIntensity: 1.1 }),
      machined: std({ color: 0xdfe3e8, metalness: 1, roughness: 0.26, roughnessMap: X.swirl, bumpMap: X.swirl, bumpScale: 0.0016, envMapIntensity: 1.2 }),
      cutter: std({ color: 0xffffff, map: X.flutes, metalness: 0.95, roughness: 0.22 }),
      steel: std({ color: 0x4a5561, metalness: 0.95, roughness: 0.3 }),
      spindle: std({ color: 0x1c2a39, metalness: 0.7, roughness: 0.45 }),
      blade: std({ color: 0xaeb6bf, metalness: 1, roughness: 0.18 }),
      ruby: std({ color: 0x8e1b2c, metalness: 0.2, roughness: 0.15 }),
      probe: std({ color: 0x2a3644, metalness: 0.8, roughness: 0.35 }),
    };
  }

  function addLights(scene) {
    const T = THREE;
    scene.add(new T.HemisphereLight(0xe3ecf5, 0x0b1826, 0.45));
    const key = new T.DirectionalLight(0xffffff, 1.35); key.position.set(3.5, 6.5, 4); scene.add(key);
    const rim = new T.DirectionalLight(0xffc49a, 0.9); rim.position.set(-5, 2.5, -4); scene.add(rim);
  }

  function contactShadow(w, d, opacity) {
    const T = THREE;
    const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: sharedTextures().shadow, transparent: true, opacity, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = -0.003;
    return m;
  }

  function buildPlate({ L, W, T: TH, D, pockets, holes, bevel, mats }) {
    const T3 = THREE, group = new T3.Group();
    const rect = () => { const s = new T3.Shape(); s.moveTo(-L / 2, -W / 2); s.lineTo(L / 2, -W / 2); s.lineTo(L / 2, W / 2); s.lineTo(-L / 2, W / 2); s.lineTo(-L / 2, -W / 2); return s; };
    const cut = (s, list) => list.forEach(([x, z, r]) => { const p = new T3.Path(); p.absarc(x, -z, r, 0, Math.PI * 2, true); s.holes.push(p); });
    const sb = rect(); cut(sb, holes);
    const baseGeo = new T3.ExtrudeGeometry(sb, { depth: TH - D, bevelEnabled: false, curveSegments: 40 });
    baseGeo.rotateX(-Math.PI / 2);
    group.add(new T3.Mesh(baseGeo, mats.stock));
    const st = rect(); cut(st, pockets); cut(st, holes);
    const topGeo = new T3.ExtrudeGeometry(st, { depth: D, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 2, curveSegments: 56 });
    topGeo.rotateX(-Math.PI / 2); topGeo.translate(0, TH - D, 0);
    group.add(new T3.Mesh(topGeo, mats.stock));
    const plugs = pockets.map(([x, z, r]) => {
      const floor = new T3.Mesh(new T3.CircleGeometry(r + 0.002, 64), mats.machined);
      floor.rotation.x = -Math.PI / 2; floor.position.set(x, TH - D + 0.0008, z); group.add(floor);
      const hgt = D + bevel;
      const g = new T3.CylinderGeometry(r - 0.0025, r - 0.0025, hgt, 64, 1); g.translate(0, hgt / 2, 0);
      const plug = new T3.Mesh(g, [mats.stock, mats.stock, mats.stock]);
      plug.position.set(x, TH - D, z); group.add(plug);
      return plug;
    });
    return { group, plugs };
  }

  function buildTool(mats) {
    const T3 = THREE, g = new T3.Group();
    const cutter = new T3.Mesh(new T3.CylinderGeometry(0.045, 0.045, 0.3, 32, 1), mats.cutter); cutter.position.y = 0.15; g.add(cutter);
    const holder = new T3.Mesh(new T3.CylinderGeometry(0.075, 0.1, 0.22, 40), mats.steel); holder.position.y = 0.41; g.add(holder);
    const nut = new T3.Mesh(new T3.CylinderGeometry(0.13, 0.13, 0.08, 40), mats.steel); nut.position.y = 0.56; g.add(nut);
    const spindle = new T3.Mesh(new T3.CylinderGeometry(0.25, 0.25, 3, 48), mats.spindle); spindle.position.y = 2.1; g.add(spindle);
    g.userData.spin = cutter;
    return g;
  }

  function buildSaw(mats) {
    const T3 = THREE, g = new T3.Group(), spin = new T3.Group();
    const teeth = 56, R = 0.95, r0 = 0.89, s = new T3.Shape();
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.62) / teeth) * Math.PI * 2, a2 = ((i + 1) / teeth) * Math.PI * 2;
      if (i === 0) s.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
      s.lineTo(Math.cos(a1) * R, Math.sin(a1) * R);
      s.lineTo(Math.cos(a2) * r0, Math.sin(a2) * r0);
    }
    const hole = new T3.Path(); hole.absarc(0, 0, 0.1, 0, Math.PI * 2, true); s.holes.push(hole);
    const geo = new T3.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }); geo.translate(0, 0, -0.011);
    const blade = new T3.Mesh(geo, mats.blade); blade.rotation.y = Math.PI / 2; spin.add(blade);
    const hub = new T3.Mesh(new T3.CylinderGeometry(0.22, 0.22, 0.07, 40), mats.steel); hub.rotation.z = Math.PI / 2; spin.add(hub);
    g.add(spin);
    const guardGeo = new T3.CylinderGeometry(1.05, 1.05, 0.16, 48, 1, true, 0, Math.PI); guardGeo.rotateZ(Math.PI / 2);
    const guardMat = mats.steel.clone(); guardMat.side = T3.DoubleSide;
    g.add(new T3.Mesh(guardGeo, guardMat));
    const arm = new T3.Mesh(new T3.BoxGeometry(0.16, 3, 0.16), mats.steel); arm.position.y = 2.55; g.add(arm);
    g.userData.spin = spin;
    return g;
  }

  function buildProbe(mats) {
    const T3 = THREE, g = new T3.Group();
    g.add(new T3.Mesh(new T3.SphereGeometry(0.035, 24, 16), mats.ruby));
    const stem = new T3.Mesh(new T3.CylinderGeometry(0.011, 0.011, 0.34, 16), mats.steel); stem.position.y = 0.205; g.add(stem);
    const body = new T3.Mesh(new T3.CylinderGeometry(0.075, 0.075, 0.3, 32), mats.probe); body.position.y = 0.525; g.add(body);
    const arm = new T3.Mesh(new T3.CylinderGeometry(0.05, 0.05, 3, 24), mats.spindle); arm.position.y = 2.175; g.add(arm);
    return g;
  }

  class Chips {
    constructor(scene, n) {
      const T3 = THREE;
      this.n = n; this.i = 0;
      this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.life = new Float32Array(n);
      for (let k = 0; k < n; k++) this.pos[k * 3 + 1] = -99;
      const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.BufferAttribute(this.pos, 3));
      this.points = new T3.Points(geo, new T3.PointsMaterial({ color: 0xe3e8ee, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
      this.points.frustumCulled = false;
      scene.add(this.points);
    }
    emit(x, y, z, count, spread) {
      for (let c = 0; c < count; c++) {
        const k = this.i++ % this.n, a = Math.random() * Math.PI * 2, s = (0.5 + Math.random()) * spread;
        this.pos[k * 3] = x; this.pos[k * 3 + 1] = y; this.pos[k * 3 + 2] = z;
        this.vel[k * 3] = Math.cos(a) * s; this.vel[k * 3 + 1] = 0.9 + Math.random() * 1.5; this.vel[k * 3 + 2] = Math.sin(a) * s;
        this.life[k] = 0.45 + Math.random() * 0.45;
      }
    }
    update(dt) {
      const p = this.pos, v = this.vel;
      for (let k = 0; k < this.n; k++) {
        if (this.life[k] <= 0) continue;
        this.life[k] -= dt; v[k * 3 + 1] -= 7 * dt;
        p[k * 3] += v[k * 3] * dt; p[k * 3 + 1] += v[k * 3 + 1] * dt; p[k * 3 + 2] += v[k * 3 + 2] * dt;
        if (this.life[k] <= 0 || p[k * 3 + 1] < 0) { this.life[k] = 0; p[k * 3 + 1] = -99; }
      }
      this.points.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* dimension lines drawn in screen space over a canvas */
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => { const el = doc.createElementNS(NS, tag); Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k])); if (parent) parent.appendChild(el); return el; };
  function dimSet(svg, id) {
    const defs = svgEl('defs', {}, svg);
    const m = svgEl('marker', { id, viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    svgEl('path', { d: 'M0 2L10 5L0 8z', fill: '#DE9A6A' }, m);
    const g = svgEl('g', { fill: 'none', stroke: '#DE9A6A', 'stroke-width': 1 }, svg);
    const make = () => ({
      line: svgEl('line', { pathLength: 1, 'marker-start': 'url(#' + id + ')', 'marker-end': 'url(#' + id + ')' }, g),
      extA: svgEl('line', { pathLength: 1, 'stroke-opacity': 0.7 }, g),
      extB: svgEl('line', { pathLength: 1, 'stroke-opacity': 0.7 }, g),
      text: svgEl('text', { class: 'dim-text', fill: '#DE9A6A', stroke: 'none', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, svg),
    });
    return { g, a: make(), b: make() };
  }
  const projector = (camera, size) => { const v = new THREE.Vector3(); return (p) => { v.set(p[0], p[1], p[2]).project(camera); const s = size(); return [(v.x + 1) * 0.5 * s[0], (1 - v.y) * 0.5 * s[1]]; }; };
  const placeLine = (el, a, b) => { el.setAttribute('x1', a[0].toFixed(1)); el.setAttribute('y1', a[1].toFixed(1)); el.setAttribute('x2', b[0].toFixed(1)); el.setAttribute('y2', b[1].toFixed(1)); };
  const placeText = (el, p, a, b) => {
    let ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    if (ang > 90) ang -= 180; else if (ang < -90) ang += 180;
    el.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
  };
  const updateDim = (d, P, A, B, e1, e2, e3, e4, tp) => {
    const a = P(A), b = P(B);
    placeLine(d.line, a, b); placeLine(d.extA, P(e1), P(e2)); placeLine(d.extB, P(e3), P(e4)); placeText(d.text, P(tp), a, b);
  };

  /* ---------------------------------------------------------------- 3D hero: a plate machined live */
  function initHero3D() {
    const T3 = THREE;
    root.classList.add('has-hero3d');
    const wrap = qs('.hero__visual'), canvas = qs('#hero-canvas'), svg = qs('#hero-dims');
    const renderer = makeRenderer(canvas);
    const scene = new T3.Scene();
    const mats = makeMats(renderer);
    addLights(scene);
    const L = 3.2, W = 2.45, TH = 0.16, D = 0.085, BEV = 0.006;
    const at = (x, z, r) => [x / 1000 - L / 2, z / 1000 - W / 2, r / 1000];
    const pockets = [[560, 560, 230], [1253, 560, 230], [1947, 560, 230], [2640, 560, 230], [907, 1225, 260], [1600, 1225, 260], [2293, 1225, 260], [560, 1890, 230], [1253, 1890, 230], [1947, 1890, 230], [2640, 1890, 230]].map((p) => at(...p));
    const holes = [[170, 170, 55], [3030, 170, 55], [3030, 2280, 55], [170, 2280, 55]].map((p) => at(...p));
    const plate = buildPlate({ L, W, T: TH, D, pockets, holes, bevel: BEV, mats });
    scene.add(plate.group);
    scene.add(contactShadow(L + 1.2, W + 1.1, 0.7));
    const tool = buildTool(mats); scene.add(tool);
    const chips = new Chips(scene, 240);
    const camera = new T3.PerspectiveCamera(28, 1, 0.1, 80);
    const look = new T3.Vector3(0.1, isMobile() ? 0.3 : 0.02, 0.05);

    let w = 1, h = 1;
    const layout = () => {
      w = Math.max(1, wrap.clientWidth); h = Math.max(1, wrap.clientHeight);
      renderer.setSize(w, h, false);
      const sx = isMobile() ? 0 : innerWidth > 1080 ? 0.2 : 0.1;
      const sy = isMobile() ? 0 : innerWidth > 1080 ? 0 : 0.16;
      const fw = w * (1 + 2 * sx), fh = h * (1 + 2 * sy);
      camera.aspect = fw / fh; camera.setViewOffset(fw, fh, 0, 0, w, h); camera.updateProjectionMatrix();
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    };
    layout();
    new ResizeObserver(layout).observe(wrap);

    let mx = 0, my = 0, cx = 0, cy = 0;
    if (finePointer) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    const orbit = (t) => {
      cx += (mx - cx) * 0.045; cy += (my - cy) * 0.045;
      const th = 0.64 + Math.sin(t * 0.11) * 0.08 + cx * 0.18, ph = 0.96 + cy * 0.08, r = isMobile() ? 8.6 : 12.2;
      camera.position.set(look.x + r * Math.sin(ph) * Math.sin(th), look.y + r * Math.cos(ph), look.z + r * Math.sin(ph) * Math.cos(th));
      camera.lookAt(look);
    };

    const dims = dimSet(svg, 'hdArrow');
    const P = projector(camera, () => [w, h]);
    const off = 0.46, gap = 0.1, ext = 0.12;
    const updateDims = () => {
      updateDim(dims.a, P, [-L / 2, 0, W / 2 + off], [L / 2, 0, W / 2 + off], [-L / 2, 0, W / 2 + gap], [-L / 2, 0, W / 2 + off + ext], [L / 2, 0, W / 2 + gap], [L / 2, 0, W / 2 + off + ext], [0, 0, W / 2 + off + 0.2]);
      updateDim(dims.b, P, [L / 2 + off, 0, W / 2], [L / 2 + off, 0, -W / 2], [L / 2 + gap, 0, W / 2], [L / 2 + off + ext, 0, W / 2], [L / 2 + gap, 0, -W / 2], [L / 2 + off + ext, 0, -W / 2], [L / 2 + off + 0.2, 0, 0]);
    };
    const dimLines = qsa('line', svg);
    dims.a.text.textContent = '0'; dims.b.text.textContent = '0';
    gsap.set(dimLines, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set([dims.g, dims.a.text, dims.b.text], { opacity: 0 });

    // machining loop: helical pocketing in two step-downs per pocket
    const topY = TH + BEV, SAFE = topY + 0.42, toolR = 0.045;
    const st = { cutting: false };
    const order = [0, 1, 2, 3, 6, 5, 4, 7, 8, 9, 10];
    const first = pockets[order[0]];
    const home = { x: first[0] + (first[2] - toolR - 0.012), y: SAFE + 1.4, z: first[1] };
    tool.position.set(home.x, home.y, home.z);
    const mtl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 });
    order.forEach((i, n) => {
      const [x, z, r] = pockets[i], R = r - toolR - 0.012, plug = plate.plugs[i];
      mtl.to(tool.position, { x: x + R, z, y: SAFE, duration: n === 0 ? 0.9 : 0.55, ease: 'power2.inOut' });
      mtl.to(tool.position, { y: topY + 0.015, duration: 0.2, ease: 'power1.in' });
      mtl.add(() => { st.cutting = true; });
      for (let k = 1; k <= 2; k++) {
        const ang = { a: 0 };
        mtl.to(ang, { a: Math.PI * 2, duration: 0.6, ease: 'none', onUpdate: () => { tool.position.x = x + R * Math.cos(ang.a); tool.position.z = z + R * Math.sin(ang.a); } });
        mtl.to(tool.position, { y: topY - ((D + BEV) * k) / 2 + 0.002, duration: 0.6, ease: 'none' }, '<');
        mtl.to(plug.scale, { y: Math.max(0.0001, 1 - k / 2), duration: 0.6, ease: 'none' }, '<');
      }
      mtl.add(() => { st.cutting = false; });
      mtl.to(tool.position, { y: SAFE, duration: 0.28, ease: 'power2.out' });
    });
    mtl.to(tool.position, { x: home.x, y: home.y, z: home.z, duration: 1, ease: 'power2.inOut' });
    mtl.to(plate.plugs.map((p) => p.scale), { y: 1, duration: 0.7, ease: 'power3.inOut', stagger: 0.04 }, '-=0.6');

    gsap.timeline({ delay: 0.45 })
      .from(canvas, { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
      .from(plate.group.position, { y: -0.6, duration: 2.2, ease: 'expo.out' }, 0)
      .from(plate.group.rotation, { y: -0.35, duration: 2.4, ease: 'expo.out' }, 0)
      .to(dims.g, { opacity: 1, duration: 0.3 }, 1.2)
      .to(dimLines, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.08 }, 1.2)
      .to([dims.a.text, dims.b.text], { opacity: 1, duration: 0.4 }, 1.6)
      .add(() => { countUp(dims.a.text, 3200, 1.6); countUp(dims.b.text, 2450, 1.6); }, 1.6)
      .add(() => mtl.play(), 1.5);

    let visible = true, last = performance.now();
    const t0 = last;
    new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }).observe(wrap);
    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!visible || doc.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      tool.userData.spin.rotation.y -= dt * 40;
      if (st.cutting) chips.emit(tool.position.x, tool.position.y + 0.02, tool.position.z, 3, 0.9);
      chips.update(dt);
      plate.plugs.forEach((p) => { p.material[1] = p.scale.y < 0.999 ? mats.machined : mats.stock; });
      orbit((now - t0) / 1000);
      updateDims();
      renderer.render(scene, camera);
    };
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------- 3D scroll story: material to delivery */
  function initProcess3D() {
    const T3 = THREE;
    root.classList.add('has-story');
    const section = qs('#process'), wrap = qs('.process__visual'), canvas = qs('#process-canvas'), svg = qs('#process-dims');
    const steps = qsa('.process__steps li'), cap = qs('.process__caption');
    const renderer = makeRenderer(canvas);
    const scene = new T3.Scene();
    scene.fog = new T3.Fog(0x0b1a2b, 10, 20);
    const mats = makeMats(renderer);
    addLights(scene);
    const grid = new T3.GridHelper(18, 36, 0x2d4d6d, 0x1a3450);
    grid.material.transparent = true; grid.material.opacity = 0.5; grid.material.depthWrite = false; grid.position.y = -0.004;
    scene.add(grid);

    const L = 2.4, W = 1.5, TH = 0.16, D = 0.08, OFF = 1.5;
    const pockets = [[-0.62, -0.36, 0.24], [0.62, -0.36, 0.24], [-0.62, 0.36, 0.24], [0.62, 0.36, 0.24]];
    const part = buildPlate({ L, W, T: TH, D, pockets, holes: [], bevel: 0, mats });
    const offMat = mats.stock.clone(); offMat.transparent = true;
    const offcut = new T3.Mesh(new T3.BoxGeometry(OFF, TH, W), offMat);
    const stock = new T3.Group(); stock.add(part.group, offcut); scene.add(stock);
    const shPart = contactShadow(L + 1, W + 1, 0.6), shOff = contactShadow(OFF + 0.8, W + 1, 0.6);
    scene.add(shPart, shOff);
    const saw = buildSaw(mats); scene.add(saw);
    const tool = buildTool(mats); scene.add(tool);
    const probe = buildProbe(mats); scene.add(probe);
    const crateMat = new T3.LineBasicMaterial({ color: 0xde9a6a, transparent: true, opacity: 0 });
    const crate = new T3.LineSegments(new T3.EdgesGeometry(new T3.BoxGeometry(L + 0.6, 0.8, W + 0.6)), crateMat);
    scene.add(crate);
    const ringMat = new T3.MeshBasicMaterial({ color: 0xde9a6a, transparent: true, opacity: 0, side: T3.DoubleSide, depthWrite: false });
    const ring = new T3.Mesh(new T3.RingGeometry(0.06, 0.078, 48), ringMat); scene.add(ring);
    const chips = new Chips(scene, 220);
    const camera = new T3.PerspectiveCamera(30, 1, 0.1, 60);
    const rig = { r: 8.8, th: 0.56, ph: 0.98, tx: 0.75, ty: 0.1, tz: 0 };
    const S = { stockX: -3.6, sawY: 5, offX: 0, offO: 1, toolX: 0, toolY: 4.6, toolZ: 0, probeX: -2.8, probeY: 3, probeZ: 0.25, lift: 0, turn: 0, crate: 0, dims: 0 };
    const plugS = pockets.map(() => ({ s: 1 }));
    const R = 0.24 - 0.045 - 0.012;

    /* one timeline unit per step: 0 material, 1 cut, 2 machine, 3 measure, 4 deliver */
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    tl.to(S, { stockX: 0, duration: 0.75, ease: 'power2.out' }, 0.05);
    tl.to(S, { sawY: -1.1, duration: 0.5, ease: 'power1.inOut' }, 1.05);
    tl.to(S, { sawY: 5.2, duration: 0.22, ease: 'power2.in' }, 1.57);
    tl.to(S, { offX: 2.8, duration: 0.32, ease: 'power2.in' }, 1.6);
    tl.to(S, { offO: 0, duration: 0.2 }, 1.7);
    tl.to(rig, { tx: 0, r: 6.7, duration: 0.4, ease: 'power2.inOut' }, 1.55);
    tl.to(S, { toolY: TH + 0.35, toolX: pockets[0][0] + R, toolZ: pockets[0][1], duration: 0.1, ease: 'power2.out' }, 2.02);
    pockets.forEach(([x, z], i) => {
      const t0 = 2.14 + i * 0.18;
      if (i > 0) tl.to(S, { toolX: x + R, toolZ: z, duration: 0.04, ease: 'power1.inOut' }, t0);
      tl.to(S, { toolY: TH + 0.01, duration: 0.02 }, t0 + 0.04);
      tl.to(S, { toolY: TH - D + 0.002, duration: 0.1 }, t0 + 0.06);
      tl.to(plugS[i], { s: 0.0001, duration: 0.1 }, t0 + 0.06);
      tl.to(S, { toolY: TH + 0.3, duration: 0.02 }, t0 + 0.16);
    });
    tl.to(S, { toolY: 4.6, duration: 0.12, ease: 'power2.in' }, 2.86);
    const touches = [[3.28, [-L / 2, TH * 0.5, 0.25]], [3.57, [-0.86, TH - D / 2, -0.36]], [3.8, [0.15, TH, 0.05]]];
    tl.to(S, { probeX: -L / 2 - 0.45, probeY: TH * 0.5, probeZ: 0.25, duration: 0.16, ease: 'power2.out' }, 3.04);
    tl.to(S, { probeX: -L / 2 - 0.035, duration: 0.06, ease: 'power1.in' }, 3.22);
    tl.to(S, { probeX: -L / 2 - 0.3, duration: 0.04 }, 3.3);
    tl.to(S, { probeY: TH + 0.42, duration: 0.05 }, 3.34);
    tl.to(S, { probeX: -0.72, probeZ: -0.36, duration: 0.08, ease: 'power1.inOut' }, 3.39);
    tl.to(S, { probeY: TH - D / 2, duration: 0.05 }, 3.47);
    tl.to(S, { probeX: -0.825, duration: 0.05 }, 3.52);
    tl.to(S, { probeX: -0.72, duration: 0.03 }, 3.58);
    tl.to(S, { probeY: TH + 0.32, duration: 0.05 }, 3.61);
    tl.to(S, { probeX: 0.15, probeZ: 0.05, duration: 0.08, ease: 'power1.inOut' }, 3.66);
    tl.to(S, { probeY: TH + 0.035, duration: 0.06 }, 3.74);
    tl.to(S, { dims: 1, duration: 0.55 }, 3.28);
    tl.to(S, { probeY: 3, probeX: -2.8, duration: 0.14, ease: 'power2.in' }, 4.02);
    tl.to(S, { dims: 0, duration: 0.12 }, 4.02);
    tl.to(S, { lift: 0.32, turn: -0.55, duration: 0.5, ease: 'power2.inOut' }, 4.12);
    tl.to(S, { crate: 1, duration: 0.4, ease: 'power2.out' }, 4.45);
    tl.to(rig, { r: 6.2, ph: 0.92, ty: 0.3, duration: 0.75, ease: 'power2.inOut' }, 4.08);
    tl.to({}, { duration: 0.01 }, 4.99);

    let w = 1, h = 1;
    const layout = () => {
      w = Math.max(1, wrap.clientWidth); h = Math.max(1, wrap.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    };
    layout();
    new ResizeObserver(layout).observe(wrap);

    /* stepper: plays the five steps in turn; a step button replays that step */
    const DUR = [2.6, 3.2, 4.4, 4.0, 3.0], HOLD = 1.6;
    const names = ['材料', '切断', '切削加工', '測定', '納品'];
    const toggle = qs('.process__toggle', section), toggleLabel = toggle ? qs('span', toggle) : null;
    const meters = steps.map((li) => qs('.process__meter i', li));
    const fadeEls = [canvas, svg];
    let cur = 0, run = null, wait = null, fade = null, auto = true, inView = false, started = false, viewPaused = false;
    const setUI = (i) => {
      steps.forEach((li, k) => {
        li.classList.toggle('is-active', k === i);
        const b = qs('.process__btn', li);
        if (b) { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }
      });
      cap.textContent = '工程 ' + (i + 1) + '／5　' + names[i];
    };
    const updateMeters = (tt) => meters.forEach((m, k) => {
      if (m) m.style.transform = 'scaleX(' + (k === cur ? Math.min(1, Math.max(0, tt - k)) : 0).toFixed(3) + ')';
    });
    const stop = () => {
      if (run) run.kill();
      if (wait) wait.kill();
      if (fade) fade.kill();
      run = wait = fade = null;
      viewPaused = false;
    };
    const play = (i) => {
      run = tl.tweenFromTo(i, i + 0.999, {
        duration: DUR[i], ease: 'none',
        onComplete: () => {
          run = null;
          if (!auto) return;
          wait = gsap.delayedCall(HOLD, next);
          if (!inView) { wait.pause(); viewPaused = true; }
        },
      });
      if (!inView) { run.pause(); viewPaused = true; }
    };
    const go = (i, jump) => {
      stop();
      cur = i;
      setUI(i);
      if (!jump) { gsap.to(fadeEls, { opacity: 1, duration: 0.3, overwrite: true }); play(i); return; }
      fade = gsap.timeline()
        .to(fadeEls, { opacity: 0, duration: 0.2, ease: 'power1.in', overwrite: true })
        .add(() => { tl.time(i); play(i); })
        .to(fadeEls, { opacity: 1, duration: 0.4, ease: 'power1.out' });
    };
    function next() { go((cur + 1) % 5, cur === 4); }
    steps.forEach((li, i) => {
      const head = qs('.process__head', li);
      if (!head) return;
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'process__btn';
      while (head.firstChild) b.appendChild(head.firstChild);
      head.appendChild(b);
      b.addEventListener('click', () => { started = true; go(i, true); });
    });
    const setAuto = (on) => {
      auto = on;
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(!on));
        if (toggleLabel) toggleLabel.textContent = on ? '一時停止' : '再生';
      }
      if (!on) {
        if (run) run.pause();
        if (wait) { wait.kill(); wait = null; }
        viewPaused = false;
      } else if (run) {
        if (inView) run.resume(); else viewPaused = true;
      } else if (started) next();
    };
    if (toggle) { toggle.hidden = false; toggle.addEventListener('click', () => setAuto(!auto)); }
    setUI(0);
    new IntersectionObserver((es) => {
      const v = es[es.length - 1].isIntersecting;
      if (v === inView) return;
      inView = v;
      if (v) {
        if (!started) { started = true; go(0, false); return; }
        if (viewPaused) { viewPaused = false; if (run) run.resume(); if (wait) wait.resume(); }
      } else {
        if (run && !run.paused()) { run.pause(); viewPaused = true; }
        if (wait && !wait.paused()) { wait.pause(); viewPaused = true; }
      }
    }, { threshold: 0.45 }).observe(section);

    const dims = dimSet(svg, 'pdArrow');
    dims.a.text.textContent = '寸法を確認';
    dims.g.style.opacity = 0; dims.a.text.style.opacity = 0;
    const dimLines = qsa('line', svg);
    const P = projector(camera, () => [w, h]);
    let visible = false, last = performance.now(), lastT = 0;
    new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }, { rootMargin: '120px 0px' }).observe(section);
    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!visible || doc.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const tt = tl.time(), moving = Math.abs(tt - lastT) > 1e-4; lastT = tt;
      updateMeters(tt);

      stock.position.x = S.stockX;
      offcut.position.set(L / 2 + OFF / 2 + S.offX, TH / 2, 0);
      offMat.opacity = S.offO; offcut.visible = S.offO > 0.01;
      part.group.position.y = S.lift; part.group.rotation.y = S.turn;
      shPart.position.x = S.stockX; shPart.material.opacity = 0.6 * Math.max(0, 1 - S.lift * 1.6);
      shOff.position.x = S.stockX + L / 2 + OFF / 2 + S.offX; shOff.material.opacity = 0.6 * S.offO; shOff.visible = offcut.visible;

      saw.position.set(S.stockX + L / 2, S.sawY, 0);
      if (tt > 0.95 && tt < 1.95) saw.userData.spin.rotation.x -= dt * 22;
      if (moving && S.sawY < TH + 0.95 && S.sawY > -0.95) chips.emit(S.stockX + L / 2, TH + 0.02, (Math.random() - 0.5) * W, 4, 1.2);

      let tx = S.toolX, tz = S.toolZ, cutting = false;
      const k = Math.floor((tt - 2.14) / 0.18);
      if (k >= 0 && k < 4) {
        const loc = tt - (2.14 + k * 0.18);
        if (loc >= 0.06 && loc <= 0.16) {
          const a = ((loc - 0.06) / 0.1) * Math.PI * 4;
          tx = pockets[k][0] + R * Math.cos(a); tz = pockets[k][1] + R * Math.sin(a); cutting = true;
        }
      }
      tool.position.set(tx, S.toolY, tz);
      if (tt > 2.0 && tt < 2.99) tool.userData.spin.rotation.y -= dt * 40;
      if (cutting && moving) chips.emit(tx, S.toolY + 0.02, tz, 3, 0.9);
      part.plugs.forEach((p, i) => { p.scale.y = plugS[i].s; p.material[1] = plugS[i].s < 0.999 ? mats.machined : mats.stock; });

      probe.position.set(S.probeX, S.probeY, S.probeZ);
      ringMat.opacity = 0;
      touches.forEach(([t0, pt]) => {
        const age = tt - t0;
        if (age >= 0 && age < 0.14) {
          ring.position.set(pt[0], pt[1], pt[2]);
          const s = 1 + age * 22; ring.scale.set(s, s, s);
          ringMat.opacity = 1 - age / 0.14; ring.lookAt(camera.position);
        }
      });

      crate.visible = S.crate > 0.01; crateMat.opacity = S.crate;
      const cs = 0.86 + 0.14 * S.crate; crate.scale.set(cs, cs, cs);
      crate.position.set(0, S.lift + 0.38, 0); crate.rotation.y = S.turn;

      chips.update(dt);
      camera.position.set(rig.tx + rig.r * Math.sin(rig.ph) * Math.sin(rig.th), rig.ty + rig.r * Math.cos(rig.ph), rig.tz + rig.r * Math.sin(rig.ph) * Math.cos(rig.th));
      camera.lookAt(rig.tx, rig.ty, rig.tz);

      dims.g.style.opacity = S.dims; dims.a.text.style.opacity = S.dims;
      if (S.dims > 0.001) {
        const o = 0.36;
        updateDim(dims.a, P, [-L / 2, 0, W / 2 + o], [L / 2, 0, W / 2 + o], [-L / 2, 0, W / 2 + 0.08], [-L / 2, 0, W / 2 + o + 0.1], [L / 2, 0, W / 2 + 0.08], [L / 2, 0, W / 2 + o + 0.1], [0, 0, W / 2 + o + 0.22]);
        updateDim(dims.b, P, [L / 2 + o, 0, W / 2], [L / 2 + o, 0, -W / 2], [L / 2 + 0.08, 0, W / 2], [L / 2 + o + 0.1, 0, W / 2], [L / 2 + 0.08, 0, -W / 2], [L / 2 + o + 0.1, 0, -W / 2], [L / 2 + o + 0.22, 0, 0]);
        const off = (1 - S.dims).toFixed(3);
        dimLines.forEach((l) => { l.style.strokeDasharray = '1'; l.style.strokeDashoffset = off; });
      }
      renderer.render(scene, camera);
    };
    requestAnimationFrame(frame);
  }

  if (want3D) {
    if (qs('#hero-canvas')) try { initHero3D(); } catch (err) { root.classList.remove('has-hero3d'); console.warn('Hero 3D disabled:', err); }
    if (qs('#process-canvas')) try { initProcess3D(); } catch (err) { root.classList.remove('has-story'); console.warn('Process 3D disabled:', err); }
  }

  /* ---------------------------------------------------------------- scroll reveals */
  if (motion) {
    qsa('[data-split]').forEach((el) => {
      const chars = splitText(el);
      gsap.fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.022, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    qsa('[data-reveal]').forEach((el) => gsap.fromTo(el, { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', clearProps: 'opacity,visibility', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    qsa('[data-stagger]').forEach((g) => gsap.fromTo(g.children, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', stagger: 0.09, clearProps: 'opacity,visibility', scrollTrigger: { trigger: g, start: 'top 88%', once: true } }));
    qsa('[data-wipe]').forEach((el) => gsap.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 86%', once: true } }));
    qsa('[data-draw]').forEach(drawIn);
  }

  /* ---------------------------------------------------------------- machine-envelope chart */
  const env = qs('.env');
  if (env) {
    const rects = qsa('.env__rect', env), marks = qsa('.env__marker', env), items = qsa('.env-legend li', env);
    const focus = (n) => {
      env.classList.toggle('is-focus', !!n);
      rects.concat(marks, items).forEach((el) => el.classList.toggle('is-active', !!n && el.dataset.env === n));
    };
    items.concat(rects).forEach((el) => {
      el.addEventListener('pointerenter', () => focus(el.dataset.env));
      el.addEventListener('pointerleave', () => focus(null));
      el.addEventListener('focus', () => focus(el.dataset.env));
      el.addEventListener('blur', () => focus(null));
    });
    if (motion) {
      const svg = qs('.env__svg', env);
      gsap.set(rects, { scale: 0, svgOrigin: svg.dataset.origin || '64 418' });
      gsap.set(marks, { scale: 0, transformOrigin: '50% 50%' });
      gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 78%', once: true } })
        .to(rects.slice().reverse(), { scale: 1, duration: 1.2, ease: 'expo.out', stagger: 0.16 })
        .to(marks.slice().reverse(), { scale: 1, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.1 }, 0.35)
        .fromTo(items, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07, clearProps: 'opacity,visibility,transform' }, 0.3);
    }
  }

  /* ---------------------------------------------------------------- timelines that fill as you scroll */
  if (motion) {
    const hw = qs('.history-wrap');
    if (hw) {
      gsap.fromTo('.history__fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: hw, start: 'top 75%', end: 'bottom 55%', scrub: 0.5 } });
      qsa('.history li').forEach((li) => ScrollTrigger.create({ trigger: li, start: 'top 72%', onEnter: () => li.classList.add('is-on'), onLeaveBack: () => li.classList.remove('is-on') }));
    }
    const fw = qs('.flow-wrap');
    if (fw) {
      const fill = qs('.flow__fill', fw), nos = qsa('.flow__no', fw);
      const size = () => {
        const base = fw.getBoundingClientRect().top;
        const c = (el) => { const r = el.getBoundingClientRect(); return r.top - base + r.height / 2; };
        const a = c(nos[0]), b = c(nos[nos.length - 1]);
        fill.style.top = a + 'px'; fill.style.height = (b - a) + 'px';
      };
      size(); addEventListener('resize', size);
      gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: fw, start: 'top 70%', end: 'bottom 60%', scrub: 0.5 } });
      qsa('.flow li').forEach((li) => ScrollTrigger.create({ trigger: li, start: 'top 68%', onEnter: () => li.classList.add('is-on'), onLeaveBack: () => li.classList.remove('is-on') }));
    }
  }

  /* ---------------------------------------------------------------- case cards: tilt and light */
  if (motion && finePointer) {
    qsa('.case__inner').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 10); rx(-py * 8);
        card.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------------------------------------------------------------- tabs (equipment list) */
  qsa('[data-tabs]').forEach((box) => {
    const list = qs('[role="tablist"]', box), tabs = qsa('[role="tab"]', box), panels = qsa('[role="tabpanel"]', box), ink = qs('.tabs__ink', box);
    if (!list || !tabs.length || tabs.length !== panels.length) return;
    list.hidden = false;
    box.classList.add('is-tabs');
    let current = 0;
    const moveInk = () => {
      const t = tabs[current];
      if (ink && t) { ink.style.width = t.offsetWidth + 'px'; ink.style.transform = 'translateX(' + t.offsetLeft + 'px)'; }
    };
    const select = (i, opts) => {
      const o = opts || {};
      current = i;
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      moveInk();
      if (o.focus) tabs[i].focus();
      if (o.animate && motion) gsap.fromTo(panels[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,visibility,transform' });
      if (o.animate && hasGSAP) ScrollTrigger.refresh();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, { animate: true }));
      t.addEventListener('keydown', (e) => {
        const n = tabs.length;
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(j, { focus: true, animate: true }); }
      });
    });
    select(0);
    addEventListener('resize', moveInk);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(moveInk);
  });

  /* ---------------------------------------------------------------- case filter */
  const filterBox = qs('[data-filter]');
  if (filterBox) {
    const btns = qsa('button[data-tag]', filterBox), cards = qsa('.case[data-tags]'), label = qs('[data-count-label]');
    btns.forEach((b) => b.addEventListener('click', () => {
      const tag = b.dataset.tag;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const state = motion && window.Flip ? Flip.getState(cards) : null;
      let n = 0;
      cards.forEach((c) => {
        const on = tag === 'all' || c.dataset.tags.split(' ').indexOf(tag) > -1;
        c.classList.toggle('is-off', !on);
        if (on) n += 1;
      });
      if (label) label.textContent = n + '件の事例を表示しています';
      if (state) {
        Flip.from(state, {
          duration: 0.65, ease: 'power3.inOut', absolute: true,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.15 }),
          onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.3 }),
          onComplete: () => ScrollTrigger.refresh(),
        });
      } else if (hasGSAP) ScrollTrigger.refresh();
    }));
  }

  /* ---------------------------------------------------------------- FAQ accordion */
  qsa('.faq details').forEach((d) => {
    const sum = qs('summary', d), body = qs('.faq__a', d);
    if (!sum || !body) return;
    sum.addEventListener('click', (e) => {
      if (!motion) return;
      e.preventDefault();
      gsap.killTweensOf(body);
      if (d.open && !d.classList.contains('is-closing')) {
        d.classList.add('is-closing');
        gsap.to(body, { height: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => { d.open = false; d.classList.remove('is-closing'); gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
      } else {
        d.classList.remove('is-closing');
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.5, ease: 'power2.out', onComplete: () => { gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
      }
    });
  });

  /* ---------------------------------------------------------------- lines that draw on scroll, guide-card hover */
  if (motion) {
    qsa('[data-line]').forEach((el) => gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    if (finePointer) qsa('.gate').forEach((g) => g.addEventListener('pointerenter', () => {
      const strokes = qsa('.gate__fig [pathLength]', g);
      if (strokes.length) gsap.fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: { amount: 0.25 }, overwrite: true });
    }));
  }

  if (hasGSAP) {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
