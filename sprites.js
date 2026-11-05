/* =====================================================================
   Grands monuments en pixel art isométrique (dessins originaux du jeu).
   Chaque monument est une petite maquette en cubes posée sur un socle, rendue en pixels nets :
   dessus clair, côté gauche moyen, côté droit sombre, contour foncé.
   Repère : i vers la droite-avant, j vers la gauche-avant, k vers le haut (1 cube = 4 pixels de large).
   ===================================================================== */
(function () {
  'use strict';

  // ---------- Couleurs ----------
  const hex = h => [1, 3, 5].map(p => parseInt(h.slice(p, p + 2), 16));
  const mix = (a, b, t) => a.map((v, n) => Math.round(v + (b[n] - v) * t));
  const LIGHT = [255, 250, 238], NIGHT = [28, 22, 42];
  const MATS = [null], NOISE = [0], ID = {};
  // Matériau : couleur des côtés, du dessus (sinon éclaircie), bruit (variation d'un cube à l'autre).
  function def(name, side, top, noise = 0.03) {
    const s = hex(side);
    ID[name] = MATS.length;
    MATS.push([top ? hex(top) : mix(s, LIGHT, 0.25), s, mix(s, NIGHT, 0.24), mix(s, NIGHT, 0.62)]);
    NOISE.push(noise);
  }
  def('soil', '#9a6a45', '#a87650', 0.07); def('grass', '#5fa046', '#86c95b', 0.09); def('leaf', '#3d8a3a', '#5cb04a', 0.14);
  def('leaf2', '#4c9a3e', '#78c257', 0.12); def('trunk', '#6e4a2c'); def('path', '#d2c09a', '#e8dbbb', 0.05);
  def('pave', '#c9c0ae', '#e0d9c9', 0.04); def('road', '#80838b', '#9a9ea6', 0.03); def('sand', '#dcc38a', '#f0e0b0', 0.06);
  def('water', '#3a86c8', '#5cb2ea', 0.05); def('rock', '#867b70', '#a39789', 0.12); def('stone', '#ddd0b3', '#f2e9d4', 0.04);
  def('stone2', '#c4b493', '#d9cdb0', 0.05); def('white', '#d9d4c9', '#ffffff', 0.02); def('cream', '#e8d9b5', '#f7ecd0', 0.03);
  def('ochre', '#d0a66a', '#e6c48c', 0.04); def('pink', '#c28470', '#d9a08c', 0.06); def('red', '#b0574a', '#c87262', 0.06);
  def('slate', '#5a6a82', '#7486a0', 0.04); def('lead', '#76848f', '#94a1ac', 0.03); def('tile', '#bf5e3c', '#d97a52', 0.06);
  def('iron', '#86573a', '#a8734f', 0.03); def('ironL', '#a46d47', '#c48b60'); def('metal', '#8f99a4', '#b4bcc6');
  def('gold', '#d9a62e', '#ffd761'); def('glass', '#68b4e2', '#a8dcf8'); def('glassD', '#3d78b0', '#5b97cc');
  def('win', '#34425a', '#46566f'); def('dark', '#3f3640', '#51464f'); def('rose', '#4d48a0', '#6a64c4');
  def('copper', '#4f9e86', '#74c4a9'); def('green', '#6f8f7d', '#8eae9b'); def('concrete', '#cfd4da', '#eaedf1');
  def('blue', '#2c6ccf'); def('redp', '#d6413a'); def('yellow', '#efc23a'); def('greenp', '#3aa857');
  def('brick', '#b4623e', '#cc8058', 0.06); def('sky', '#6db9e6', '#9bd5f3', 0.03); def('pitch', '#4f9e3f', '#6cc24f', 0.02); def('rosy', '#d97f92', '#eea3b2');
  def('shade', '#9c8460', '#b39b75');

  // ---------- Maquette en cubes ----------
  const lerp = (tab, x) => {
    for (let n = 1; n < tab.length; n++) if (x <= tab[n][0]) {
      const [x0, y0] = tab[n - 1], [x1, y1] = tab[n];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
    return tab[tab.length - 1][1];
  };
  class Grid {
    constructor(w, d, h) { this.w = w; this.d = d; this.h = h; this.v = new Uint8Array(w * d * h); }
    get(i, j, k) { return i < 0 || j < 0 || k < 0 || i >= this.w || j >= this.d || k >= this.h ? 0 : this.v[(k * this.d + j) * this.w + i]; }
    set(i, j, k, m) {
      i = Math.floor(i); j = Math.floor(j); k = Math.floor(k);
      if (i >= 0 && j >= 0 && k >= 0 && i < this.w && j < this.d && k < this.h) this.v[(k * this.d + j) * this.w + i] = m ? ID[m] : 0;
      return this;
    }
    box(i0, j0, k0, i1, j1, k1, m) { for (let k = k0; k < k1; k++) for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) this.set(i, j, k, m); return this; }
    // Disque (ou anneau si r0) de rayon r centré en (ci, cj), sur les niveaux [k0, k1).
    disc(ci, cj, r, k0, k1, m, r0) {
      for (let k = k0; k < k1; k++) for (let j = Math.floor(cj - r - 1); j <= cj + r + 1; j++) for (let i = Math.floor(ci - r - 1); i <= ci + r + 1; i++) {
        const d2 = (i + 0.5 - ci) ** 2 + (j + 0.5 - cj) ** 2;
        if (d2 <= r * r + 0.25 && !(r0 && d2 < r0 * r0)) this.set(i, j, k, m);
      }
      return this;
    }
    cone(ci, cj, r, k0, k1, m) { for (let k = k0; k < k1; k++) this.disc(ci, cj, Math.max(0.5, r * (k1 - k) / (k1 - k0)), k, k + 1, m); return this; }
    dome(ci, cj, r, k0, h, m) { for (let n = 0; n < h; n++) this.disc(ci, cj, Math.max(0.5, r * Math.sqrt(1 - (n / h) ** 2)), k0 + n, k0 + n + 1, m); return this; }
    // Toit à deux pans (faîte le long de l'axe), « rise » niveaux par rang (toits pentus).
    gable(i0, j0, i1, j1, k0, m, axis = 'i', rise = 1) {
      for (let s = 0, k = k0; ; s++) {
        const lo = (axis === 'i' ? j0 : i0) + s, hi = (axis === 'i' ? j1 : i1) - s;
        if (lo >= hi) break;
        for (let r = 0; r < rise; r++, k++) axis === 'i' ? this.box(i0, lo, k, i1, hi, k + 1, m) : this.box(lo, j0, k, hi, j1, k + 1, m);
      }
      return this;
    }
    hip(i0, j0, i1, j1, k0, m, rise = 1) {
      for (let s = 0, k = k0; i0 + s < i1 - s && j0 + s < j1 - s; s++) for (let r = 0; r < rise; r++, k++) this.box(i0 + s, j0 + s, k, i1 - s, j1 - s, k + 1, m);
      return this;
    }
    crenel(i0, j0, i1, j1, k, m) {
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++)
        if ((i === i0 || j === j0 || i === i1 - 1 || j === j1 - 1) && (i + j) % 2 === 0) this.set(i, j, k, m);
      return this;
    }
    // Repeint les cubes existants de la boîte qui vérifient fn (fenêtres, bandes, motifs).
    paint(i0, j0, k0, i1, j1, k1, m, fn = () => true) {
      for (let k = k0; k < k1; k++) for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) if (this.get(i, j, k) && fn(i, j, k)) this.set(i, j, k, m);
      return this;
    }
    // Fenêtres sur les deux façades visibles d'un bloc (une sur deux, aux niveaux donnés).
    windows(i0, j0, i1, j1, levels, m = 'win', step = 2) {
      for (const k of levels) {
        for (let i = i0 + 1; i < i1 - 1; i++) if ((i - i0) % step === 1) this.set(i, j1 - 1, k, m);
        for (let j = j0 + 1; j < j1 - 1; j++) if ((j - j0) % step === 1) this.set(i1 - 1, j, k, m);
      }
      return this;
    }
    tree(i, j, k, tall) {
      this.set(i, j, k, 'trunk');
      if (tall) { this.box(i, j, k + 1, i + 1, j + 1, k + 5, 'leaf'); return this; }  // cyprès
      this.box(i - 1, j - 1, k + 1, i + 2, j + 2, k + 3, 'leaf').set(i, j, k + 3, 'leaf2');
      this.set(i - 1, j - 1, k + 2, null).set(i + 1, j - 1, k + 2, 'leaf2');
      return this;
    }
    ground(top = 'grass') { return this.box(0, 0, 0, this.w, this.d, 1, 'soil').box(0, 0, 1, this.w, this.d, 2, top); }
  }
  const G = (w, d, h) => new Grid(w, d, h);

  // ---------- Rendu en pixels ----------
  // Cube (i, j, k) → carreau de 4 × 4 pixels en x = ox + 2(i − j), y = oy + i + j − 2k.
  const TOP = [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1]], LEFT = [[0, 2], [1, 2], [0, 3], [1, 3]], RIGHT = [[2, 2], [3, 2], [2, 3], [3, 3]];
  function render(g) {
    const W = (g.w + g.d) * 2 + 2, H = g.w + g.d + 2 * g.h + 2, ox = (g.d - 1) * 2 + 1, oy = (g.h - 1) * 2 + 1, N = W * H;
    const col = new Uint8ClampedArray(N * 4), key = new Int32Array(N).fill(-1), vi = new Int16Array(N), vj = new Int16Array(N), vk = new Int16Array(N), mm = new Uint8Array(N);
    const list = [];
    for (let k = 0; k < g.h; k++) for (let j = 0; j < g.d; j++) for (let i = 0; i < g.w; i++) {
      const m = g.get(i, j, k);
      if (m && !(g.get(i + 1, j, k) && g.get(i, j + 1, k) && g.get(i, j, k + 1))) list.push([i, j, k, m]);
    }
    list.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]) || a[2] - b[2]);
    for (const [i, j, k, m] of list) {
      const h = (((i * 73856093) ^ (j * 19349663) ^ (k * 83492791)) >>> 0) % 1000 / 1000, f = 1 + NOISE[m] * (h - 0.5) * 2;
      const x = ox + 2 * (i - j), y = oy + i + j - 2 * k;
      const put = (pts, c) => {
        for (const [dx, dy] of pts) {
          const p = (y + dy) * W + x + dx;
          col[p * 4] = c[0] * f; col[p * 4 + 1] = c[1] * f; col[p * 4 + 2] = c[2] * f; col[p * 4 + 3] = 255;
          key[p] = i + j + k; vi[p] = i; vj[p] = j; vk[p] = k; mm[p] = m;
        }
      };
      if (!g.get(i, j, k + 1)) put(TOP, MATS[m][0]);
      if (!g.get(i, j + 1, k)) put(LEFT, MATS[m][1]);
      if (!g.get(i + 1, j, k)) put(RIGHT, MATS[m][2]);
    }
    // Traits intérieurs : un objet devant un autre, sans le toucher, reçoit un liseré sombre.
    const out = new Uint8ClampedArray(col);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (key[p] < 0) continue;
      for (const q of [p - W, p + W, p - 1, p + 1]) {
        if (q < 0 || q >= N || key[q] < 0 || key[q] >= key[p] - 1) continue;
        if (Math.abs(vi[q] - vi[p]) > 1 || Math.abs(vj[q] - vj[p]) > 1 || Math.abs(vk[q] - vk[p]) > 1) {
          const c = mix([col[p * 4], col[p * 4 + 1], col[p * 4 + 2]], MATS[mm[p]][3], 0.5);
          out[p * 4] = c[0]; out[p * 4 + 1] = c[1]; out[p * 4 + 2] = c[2];
          break;
        }
      }
    }
    // Contour extérieur d'un pixel, de la couleur sombre du cube voisin.
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (key[p] >= 0) continue;
      let best = -1;
      for (const [q, ok] of [[p - W, y > 0], [p + W, y < H - 1], [p - 1, x > 0], [p + 1, x < W - 1]]) if (ok && key[q] >= 0 && (best < 0 || key[q] > key[best])) best = q;
      if (best < 0) continue;
      const c = MATS[mm[best]][3];
      out[p * 4] = c[0]; out[p * 4 + 1] = c[1]; out[p * 4 + 2] = c[2]; out[p * 4 + 3] = 255;
    }
    // Recadrage sur le dessin.
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (out[(y * W + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, img = new ImageData(cw, ch);
    for (let y = 0; y < ch; y++) img.data.set(out.subarray(((y + y0) * W + x0) * 4, ((y + y0) * W + x1 + 1) * 4), y * cw * 4);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    cv.getContext('2d').putImageData(img, 0, 0);
    // Point d'ancrage : centre du dessus du socle (niveau 2) ; badge près du coin droit du socle.
    const px = (I, J, K) => [ox + 2 + 2 * (I - J) - x0, oy + I + J - 2 * (K - 1) - y0];
    const [ax, ay] = px(g.w / 2, g.d / 2, 2), [bx, by] = px(g.w, 0, 2);
    return {canvas: cv, w: cw, h: ch, ax, ay, bx: Math.min(cw - 6, bx - 5), by: Math.max(5, by - 8)};
  }

  // ---------- Gabarits réutilisés ----------
  // Cathédrale gothique : nef selon j, façade à deux tours tournée vers l'avant (j grand).
  function cathedral(o) {
    const g = G(o.gw || 18, o.gd || 24, o.gh || 34), s = o.mat || 'stone', roof = o.roof || 'lead';
    const i0 = o.i0 || 5, w = o.w || 8, i1 = i0 + w, j0 = o.j0 || 2, j1 = o.j1 || g.d - 2, jf = j1 - 3, wall = o.wall || 12;
    g.ground(o.top);
    if (o.yard) g.box(i0 - 2, jf - 1, 1, i1 + 2, g.d, 2, o.yard);
    g.box(i0, j0 + 2, 2, i1, jf, wall - 4, s);                                   // bas-côtés
    g.box(i0 + 1, j0 + 1, 2, i1 - 1, jf, wall, s);                               // nef
    g.disc(i0 + w / 2, j0 + 2, (w - 2) / 2, 2, wall, s);                          // abside
    g.disc(i0 + w / 2, j0 + 2.5, w / 2, 2, wall - 4, s);
    const tj = j0 + Math.round((jf - j0) * 0.42);
    g.box(i0 - 2, tj, 2, i1 + 2, tj + 3, wall, s);                               // transept
    g.gable(i0 + 1, j0 + 1, i1 - 1, jf, wall, roof, 'j');
    g.gable(i0 - 2, tj, i1 + 2, tj + 3, wall, roof, 'i');
    for (let j = j0 + 3; j < jf; j += 2) if (j < tj || j >= tj + 3) { g.box(i0 - 1, j, 2, i0, j + 1, wall - 5, s); g.box(i1, j, 2, i1 + 1, j + 1, wall - 5, s); }
    g.paint(i0, j0, wall - 7, i1 + 1, jf, wall - 5, 'rose', (i, j) => j % 2 === 0 && (i === i1 - 1 || i === i1 - 2));
    // Façade et tours
    const tw = Math.max(3, Math.round(w * 0.38)), ft = o.tower || wall + 8;
    g.box(i0, jf, 2, i1, j1, wall + 2, s);
    g.box(i0, jf, 2, i0 + tw, j1, ft, s); g.box(i1 - tw, jf, 2, i1, j1, ft, s);
    if (o.left) g.box(i0, jf, 2, i0 + tw, j1, o.left, s);
    g.paint(i0, j1 - 1, 2, i1, j1, 5, 'dark', i => (i - i0) % Math.ceil(w / 3) === 1);   // portails
    g.paint(i0, j1 - 1, 5, i1, j1, 6, o.mat2 || 'stone2');                                // galerie des rois
    const ci = i0 + w / 2 - 0.5;
    g.paint(i0, j1 - 1, wall - 3, i1, j1, wall, 'rose', (i, j, k) => Math.abs(i - ci) <= 1.2 && !(Math.abs(i - ci) > 1 && k !== wall - 2));
    for (const ti of [i0, i1 - tw]) g.paint(ti, j1 - 1, ft - 6, ti + tw, j1, ft - 2, 'dark', i => (i - ti) % 2 === 1);
    g.paint(i0 + tw, j1 - 1, wall, i1 - tw, j1, wall + 2, 'dark', i => i % 2 === 0);
    if (o.spire) g.cone(i0 + w / 2, tj + 1.5, 1.3, wall + 2, o.spire, roof);
    if (o.flat !== false) { g.crenel(i0, jf, i0 + tw, j1, ft, s); g.crenel(i1 - tw, jf, i1, j1, ft, s); }
    return {g, i0, i1, jf, j1, tw, ft, wall};
  }
  // Château à tours rondes coiffées de poivrières.
  const towerRound = (g, ci, cj, r, k0, k1, wall, roof, roofH) => { g.disc(ci, cj, r, k0, k1, wall); g.cone(ci, cj, r + 0.6, k1, k1 + roofH, roof); };

  // Stade ovale en coupe : l'avant est abaissé et sans toit pour laisser voir la pelouse et les gradins.
  function stadium(o) {
    const W = o.w || 30, D = o.d || 26, g = G(W, D, o.h || 22).ground('pave'), cx = W / 2, cy = D / 2, rx = W / 2 - 1, ry = D / 2 - 1;
    for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) {
      const u = (i + 0.5 - cx) / rx, v = (j + 0.5 - cy) / ry, e = u * u + v * v;
      if (e > 1) continue;
      if (Math.abs(u) < 0.6 && Math.abs(v) < 0.54) {
        const line = Math.abs(u) > 0.53 || Math.abs(v) > 0.45 || Math.abs(i + 0.5 - cx) < 0.6;
        g.set(i, j, 1, line ? 'white' : (i % 4 < 2 ? 'pitch' : 'grass'));
        continue;
      }
      const t = Math.min(1, Math.max(0, (Math.sqrt(e) - 0.6) / 0.4));
      const front = Math.min(1, Math.max(0, (u + v + 0.1) / 0.5));          // 0 au fond, 1 devant
      const top = 2 + Math.round(t * (9 - 6 * front)) + 1;
      g.box(i, j, 2, i + 1, j + 1, top, o.seats[top % 2]);
      if (e >= 0.86) g.box(i, j, 2, i + 1, j + 1, top + 1, 'concrete');
      if (e >= o.roof && front < 0.5) {
        const a = Math.atan2(v, u), k = o.roofK + Math.round(o.wave * Math.sin(3 * a));
        g.set(i, j, k, o.roofM || 'white');
        if (o.wave) g.set(i, j, k + 1, o.roofM || 'white');
        if (e >= 0.9 && (i + j) % 4 === 0) g.box(i, j, top + 1, i + 1, j + 1, k, o.post || 'white');
      }
    }
    return g;
  }
  // Temple à colonnes (façade vers l'avant), sur son podium.
  function temple(o) {
    const g = G(o.w, o.d, o.h).ground(o.top || 'pave'), s = o.mat, x0 = 2, x1 = o.w - 2, y0 = 2, y1 = o.d - 3, ck = o.ck;
    g.box(x0, y0, 2, x1, y1, 4, s);
    g.box(x0 + 1, y1, 2, x1 - 1, y1 + 1, 4, s).box(x0 + 1, y1 + 1, 2, x1 - 1, y1 + 2, 3, s);
    g.box(x0 + 2, y0 + 2, 4, x1 - 2, y1 - (o.porch || 3), ck, o.cella || s);
    for (let i = x0; i < x1; i += 2) for (const j of [y0, y1 - 1]) g.box(i, j, 4, i + 1, j + 1, ck, s);
    for (let j = y0; j < y1; j += 2) for (const i of [x0, x1 - 1]) g.box(i, j, 4, i + 1, j + 1, ck, s);
    g.box(x0, y0, ck, x1, y1, ck + 1, s).gable(x0, y0, x1, y1, ck + 1, o.roof || s, 'j');
    g.box(x0, y1 - 1, ck + 1, x1, y1, ck + 2, s);
    for (let n = 1; n < (x1 - x0) / 2; n++) g.box(x0 + n, y1 - 1, ck + 1, x1 - n, y1, ck + 1 + n, s);
    return g;
  }
  const palm = (g, i, j, k) => {
    g.box(i, j, k, i + 1, j + 1, k + 4, 'trunk').set(i, j, k + 4, 'leaf2');
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.set(i + a, j + b, k + 4, 'leaf').set(i + 2 * a, j + 2 * b, k + 3, 'leaf');
    return g;
  };

  // ---------- Les monuments ----------
  const DEFS = {
    // Tour Eiffel
    Q243() {
      const g = G(20, 20, 48).ground();
      g.box(8, 0, 1, 12, 20, 2, 'path').box(0, 8, 1, 20, 12, 2, 'path');
      g.tree(2, 2, 2).tree(17, 2, 2).tree(2, 17, 2).tree(5, 2, 2).tree(2, 5, 2);
      const c = 10, hwT = [[0, 7.6], [7, 5.3], [15, 3.5], [22, 2.4], [30, 1.6], [36, 1.15], [42, 0.6]];
      for (let k = 2; k < 44; k++) {
        const z = k - 2, hw = lerp(hwT, z), t = z < 18 ? 2.3 - z * 0.04 : 99;
        for (let j = 0; j < 20; j++) for (let i = 0; i < 20; i++) {
          const dx = Math.abs(i + 0.5 - c), dy = Math.abs(j + 0.5 - c), mx = Math.max(dx, dy), mn = Math.min(dx, dy);
          if (mx > hw) continue;
          if (mn >= hw - t || (z >= 5 && z <= 7 && mx >= hw - 1)) g.set(i, j, k, 'iron');
        }
      }
      for (const [k, z] of [[10, 8], [19, 17]]) {
        const hw = lerp(hwT, z);
        for (let j = 0; j < 20; j++) for (let i = 0; i < 20; i++) {
          const mx = Math.max(Math.abs(i + 0.5 - c), Math.abs(j + 0.5 - c));
          if (mx <= hw + 1 && mx >= hw - 1.5) g.set(i, j, k, 'ironL');
        }
      }
      g.disc(c, c, 1.7, 39, 40, 'ironL');
      g.box(9, 9, 44, 10, 10, 47, 'metal');
      return g;
    },
    // Arc de triomphe de l'Étoile
    Q64436() {
      const g = G(16, 16, 24).ground('pave');
      g.box(0, 6, 1, 16, 10, 2, 'road').box(6, 0, 1, 10, 16, 2, 'road');
      g.box(3, 5, 2, 13, 11, 16, 'stone');
      g.box(6, 5, 2, 10, 11, 10, null).box(7, 5, 10, 9, 11, 11, null);
      g.box(3, 7, 2, 13, 9, 7, null);
      g.box(3, 5, 12, 13, 11, 13, 'stone2').box(3, 5, 15, 13, 11, 16, 'stone2');
      g.paint(3, 10, 5, 13, 11, 9, 'stone2', i => i === 4 || i === 11);
      g.paint(12, 5, 5, 13, 11, 9, 'stone2', (i, j) => j === 6 || j === 9);
      g.set(8, 8, 2, 'gold');
      return g;
    },
    // Notre-Dame de Paris (sur l'île de la Cité)
    Q2981() {
      const {g} = cathedral({gw: 18, gd: 24, gh: 30, wall: 12, tower: 21, spire: 27, yard: 'pave'});
      g.box(0, 0, 0, 18, 24, 2, null).box(0, 0, 0, 18, 24, 1, 'water');
      g.box(2, 0, 1, 16, 24, 2, 'grass').box(3, 20, 1, 15, 24, 2, 'pave');
      g.tree(15, 3, 2).tree(2, 4, 2);
      return g;
    },
    // Musée du Louvre et sa pyramide
    Q19675() {
      const g = G(22, 22, 18).ground('pave');
      g.box(0, 0, 2, 22, 4, 9, 'cream').box(0, 0, 2, 4, 22, 9, 'cream');
      g.gable(0, 0, 22, 4, 9, 'slate', 'i', 2).gable(0, 0, 4, 22, 9, 'slate', 'j', 2);
      g.box(9, 0, 2, 14, 5, 11, 'cream').hip(9, 0, 14, 5, 11, 'slate', 2);
      g.box(0, 9, 2, 5, 14, 11, 'cream').hip(0, 9, 5, 14, 11, 'slate', 2);
      g.box(0, 0, 2, 5, 5, 11, 'cream').hip(0, 0, 5, 5, 11, 'slate', 2);
      for (const k of [4, 6, 8]) { for (let i = 5; i < 22; i += 2) g.set(i, 3, k, 'win'); for (let j = 5; j < 22; j += 2) g.set(3, j, k, 'win'); }
      g.box(8, 8, 1, 21, 21, 2, 'water').box(10, 10, 1, 19, 19, 2, 'pave');
      for (let s = 0; s < 4; s++) g.box(10 + s, 10 + s, 2 + 2 * s, 19 - s, 19 - s, 4 + 2 * s, 'glass');
      g.set(14, 14, 10, 'glass');
      g.box(7, 14, 2, 8, 15, 4, 'glass').box(14, 7, 2, 15, 8, 4, 'glass');
      return g;
    },
    // Basilique du Sacré-Cœur, sur la butte Montmartre
    Q28785() {
      const g = G(18, 18, 40).ground();
      g.box(1, 1, 2, 17, 17, 3, 'grass').box(2, 2, 3, 16, 16, 4, 'grass');
      for (let s = 0; s < 3; s++) g.box(7, 14 + s, 2 + Math.max(0, 1 - s), 11, 15 + s, 4 - s, 'path');
      g.box(7, 14, 2, 11, 16, 4, 'path');
      g.tree(2, 15, 3).tree(15, 2, 3).tree(15, 14, 2).tree(3, 3, 4);
      g.box(5, 4, 4, 13, 13, 11, 'white').box(6, 13, 4, 12, 15, 10, 'white');
      g.paint(6, 14, 4, 12, 15, 7, 'dark', i => i % 2 === 1);
      g.windows(5, 4, 13, 13, [7, 8]);
      g.disc(9, 8.5, 3.2, 11, 16, 'white');
      g.box(9, 11, 13, 10, 12, 15, 'win').box(11, 9, 13, 12, 10, 15, 'win').box(7, 11, 13, 8, 12, 15, 'win').box(11, 7, 13, 12, 8, 15, 'win');
      g.disc(9, 8.5, 3.6, 16, 17, 'stone').dome(9, 8.5, 3.3, 17, 9, 'white');
      g.disc(9, 8.5, 1, 26, 28, 'white').set(8, 8, 28, 'gold').set(8, 8, 29, 'gold');
      for (const [x, y] of [[6, 5.5], [12, 5.5], [6, 12], [12, 12]]) { g.disc(x, y, 1.3, 11, 13, 'white'); g.dome(x, y, 1.6, 13, 3, 'white'); }
      g.box(8, 1, 4, 11, 4, 22, 'white').dome(9.5, 2.5, 1.8, 22, 4, 'white').set(9, 2, 26, 'gold');
      g.paint(8, 1, 17, 11, 4, 20, 'dark', (i, j) => (i + j) % 2 === 0);
      return g;
    },
    // Basilique Notre-Dame de Fourvière (Lyon), sur sa colline
    Q1516() {
      const g = G(20, 20, 32).ground();
      g.box(1, 1, 2, 19, 19, 3, 'grass').box(2, 2, 3, 18, 18, 4, 'grass');
      g.tree(2, 16, 3).tree(16, 2, 3).tree(17, 17, 2).tree(5, 17, 2).tree(17, 6, 2);
      g.box(6, 4, 4, 14, 15, 14, 'white');
      g.gable(6, 4, 14, 15, 14, 'slate', 'j');
      g.windows(6, 4, 14, 15, [7, 8, 11, 12]);
      for (const [x, y] of [[6, 4.5], [14, 4.5], [6, 14.5], [14, 14.5]]) {
        g.disc(x, y, 1.9, 4, 18, 'white');
        g.box(Math.floor(x), Math.floor(y) + 1, 11, Math.floor(x) + 1, Math.floor(y) + 2, 16, 'win').box(Math.floor(x) + 1, Math.floor(y), 11, Math.floor(x) + 2, Math.floor(y) + 1, 16, 'win');
        g.disc(x, y, 2.2, 18, 19, 'white');
        for (let n = 0; n < 8; n++) g.set(x + 1.8 * Math.cos(n * Math.PI / 4), y + 1.8 * Math.sin(n * Math.PI / 4), 19, 'white');
      }
      // Portique à colonnes et fronton
      g.box(7, 15, 4, 13, 18, 5, 'white');
      for (let i = 7; i < 13; i += 2) g.box(i, 17, 5, i + 1, 18, 10, 'white');
      g.box(7, 15, 5, 13, 17, 10, 'stone2').paint(7, 16, 5, 13, 17, 9, 'dark', i => i % 2 === 0);
      g.box(7, 15, 10, 13, 18, 11, 'white').gable(7, 15, 13, 18, 11, 'white', 'j');
      // Chapelle et la Vierge dorée
      g.box(15, 1, 4, 18, 4, 17, 'stone').box(15, 1, 17, 18, 4, 19, 'stone2').box(16, 2, 19, 17, 3, 22, 'gold');
      return g;
    },
    // Tour métallique de Fourvière
    Q625() {
      const g = G(12, 12, 40).ground();
      g.box(1, 1, 2, 11, 11, 3, 'grass').tree(1, 9, 3).tree(9, 1, 3).tree(10, 10, 2);
      const c = 6;
      for (let k = 3; k < 33; k++) {
        const hw = 3.2 - (k - 3) * 0.06;
        for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
          const dx = Math.abs(i + 0.5 - c), dy = Math.abs(j + 0.5 - c), mx = Math.max(dx, dy), mn = Math.min(dx, dy);
          if (mx > hw) continue;
          if (mn >= hw - 1 || (k % 5 === 0 && mx >= hw - 1)) g.set(i, j, k, 'metal');
        }
      }
      g.box(3, 3, 33, 9, 9, 34, 'metal').box(4, 4, 34, 8, 8, 36, 'white').box(5, 5, 36, 7, 7, 37, 'metal').box(5, 5, 37, 6, 6, 40, 'redp');
      return g;
    },
    // Notre-Dame-de-la-Garde (Marseille) : pierres à bandes, Vierge dorée
    Q975925() {
      const g = G(16, 16, 46);
      g.box(0, 0, 0, 16, 16, 1, 'rock').box(1, 1, 1, 15, 15, 3, 'rock').box(2, 2, 3, 14, 14, 5, 'rock');
      g.set(1, 13, 3, 'leaf').set(13, 1, 3, 'leaf').set(14, 9, 3, 'leaf2').tree(3, 3, 5);
      const band = (i, j, k) => (k % 2 ? 'stone' : 'green');
      for (let k = 5; k < 12; k++) g.box(5, 3, k, 12, 11, k + 1, band(0, 0, k));
      g.windows(5, 3, 12, 11, [8]);
      g.dome(8.5, 6, 2.6, 12, 4, 'stone').dome(8.5, 3.5, 1.6, 12, 3, 'stone');
      for (let k = 5; k < 25; k++) g.box(6, 11, k, 11, 15, k + 1, band(0, 0, k));
      g.paint(6, 11, 18, 11, 15, 23, 'dark', (i, j, k) => (j === 14 && i % 2 === 1 || i === 10 && j % 2 === 0) && k < 22);
      g.box(7, 12, 25, 10, 14, 29, 'stone').box(7, 12, 29, 10, 14, 30, 'stone2');
      g.box(8, 12, 30, 9, 14, 37, 'gold').box(7, 12, 33, 10, 13, 34, 'gold').set(8, 12, 37, 'gold');
      return g;
    },
    // Abbaye du Mont-Saint-Michel, entre sable et mer
    Q651388() {
      const g = G(22, 22, 42);
      g.box(0, 0, 0, 22, 22, 1, 'water').disc(11, 11, 10.5, 0, 1, 'sand');
      for (let k = 1; k < 13; k++) g.disc(11, 11, 9 - (k - 1) * 0.55, k, k + 1, 'rock');
      g.disc(11, 11, 9.2, 1, 4, 'stone2', 8.2).disc(11, 11, 9.2, 4, 5, null, 8.2);
      for (let n = 0; n < 36; n += 2) g.set(11 + 8.7 * Math.cos(n * Math.PI / 18), 11 + 8.7 * Math.sin(n * Math.PI / 18), 4, 'stone2');
      for (const [a, r, k] of [[0.3, 7, 4], [0.7, 6.8, 5], [1.1, 6.4, 6], [1.5, 6, 7], [-0.2, 6.8, 5], [1.9, 5.4, 8], [0.9, 5, 8]]) {
        const x = 11 + r * Math.cos(a), y = 11 + r * Math.sin(a);
        g.box(x, y, k, x + 2, y + 2, k + 2, 'cream').box(x, y, k + 2, x + 2, y + 2, k + 3, a > 1 ? 'slate' : 'tile');
      }
      g.box(9, 6, 12, 13, 15, 19, 'stone2').gable(9, 6, 13, 15, 19, 'slate', 'j');
      g.box(6, 10, 9, 9, 16, 17, 'stone2').windows(6, 10, 9, 16, [11, 14]);
      g.box(10, 9, 19, 12, 11, 24, 'stone2').cone(11, 10, 1.4, 24, 35, 'slate');
      g.set(10, 9, 35, 'gold').set(10, 9, 36, 'gold');
      return g;
    },
    // Pont du Gard
    Q189764() {
      const g = G(28, 10, 22);
      g.box(0, 0, 0, 28, 10, 1, 'soil').box(0, 0, 1, 7, 10, 2, 'grass').box(21, 0, 1, 28, 10, 2, 'grass').box(7, 0, 0, 21, 10, 1, 'water');
      g.box(6, 0, 1, 7, 10, 2, 'rock').box(21, 0, 1, 22, 10, 2, 'rock');
      g.tree(2, 2, 2).tree(25, 7, 2).tree(3, 8, 2).tree(25, 1, 2, true);
      g.box(0, 3, 1, 28, 7, 9, 'ochre').box(0, 3, 9, 28, 7, 16, 'ochre').box(0, 4, 16, 28, 6, 20, 'ochre');
      for (let i = 0; i < 28; i++) {
        const p = (i + 1) % 6;
        if (p >= 2) { g.box(i, 3, 1, i + 1, 7, 6, null); if (p >= 3 && p <= 4) g.box(i, 3, 6, i + 1, 7, 7, null); }
        if (p >= 2) { g.box(i, 3, 9, i + 1, 7, 13, null); if (p >= 3 && p <= 4) g.box(i, 3, 13, i + 1, 7, 14, null); }
        if (i % 2 === 1) g.box(i, 4, 16, i + 1, 6, 18, null);
      }
      g.box(0, 4, 20, 28, 6, 21, 'stone2');
      return g;
    },
    // Château de Chambord
    Q205367() {
      const g = G(24, 20, 30).ground();
      g.box(0, 17, 0, 24, 20, 2, null).box(0, 17, 0, 24, 20, 1, 'water');
      g.box(2, 2, 2, 22, 5, 8, 'cream').box(2, 2, 2, 5, 15, 8, 'cream').box(19, 2, 2, 22, 15, 8, 'cream').box(2, 13, 2, 22, 15, 5, 'cream');
      g.gable(2, 2, 22, 5, 8, 'slate', 'i').gable(2, 5, 5, 15, 8, 'slate', 'j').gable(19, 5, 22, 15, 8, 'slate', 'j');
      g.windows(2, 2, 22, 15, [4, 6]);
      for (const [x, y] of [[2.5, 2.5], [21.5, 2.5], [2.5, 14.5], [21.5, 14.5]]) towerRound(g, x, y, 2.3, 2, 9, 'cream', 'slate', 4);
      g.box(8, 5, 2, 16, 12, 12, 'cream').windows(8, 5, 16, 12, [4, 7, 10]);
      for (const [x, y] of [[8, 5], [16, 5], [8, 12], [16, 12]]) towerRound(g, x, y, 2.1, 2, 13, 'cream', 'slate', 5);
      for (const [x, y, h] of [[10, 6, 3], [14, 7, 4], [9, 10, 4], [15, 10, 3], [12, 6, 2], [11, 11, 3], [13, 11, 2]]) g.box(x, y, 12, x + 1, y + 1, 12 + h, 'slate').set(x, y, 12 + h, 'cream');
      g.disc(12, 8.5, 1.6, 12, 19, 'cream').paint(10, 6, 14, 15, 11, 18, 'win', (i, j, k) => k % 2 === 0 && (i + j) % 2 === 0);
      g.dome(12, 8.5, 1.9, 19, 3, 'slate').box(11, 8, 22, 12, 9, 25, 'cream').set(11, 8, 25, 'gold');
      return g;
    },
    // Château de Chenonceau, sur le Cher
    Q193215() {
      const g = G(26, 12, 22);
      g.box(0, 0, 0, 26, 12, 1, 'water').box(0, 0, 0, 5, 12, 2, 'soil').box(0, 0, 2, 5, 12, 3, 'grass');
      g.tree(1, 2, 3).tree(1, 9, 3);
      g.box(4, 2, 1, 11, 10, 3, 'stone2');
      g.box(4, 2, 3, 11, 10, 11, 'cream').windows(4, 2, 11, 10, [5, 8]);
      g.hip(4, 2, 11, 10, 11, 'slate', 2);
      for (const [x, y] of [[4.5, 2.5], [10.5, 2.5], [4.5, 9.5], [10.5, 9.5]]) towerRound(g, x, y, 1.2, 3, 12, 'cream', 'slate', 4);
      g.box(11, 4, 4, 25, 8, 10, 'cream').windows(11, 4, 25, 8, [6, 8]);
      g.gable(11, 4, 25, 8, 10, 'slate', 'i', 2);
      for (let i = 11; i < 25; i++) if (i % 3 !== 1) g.box(i, 4, 1, i + 1, 8, 3, 'stone2');
      g.box(11, 4, 3, 25, 8, 4, 'stone2');
      for (let i = 13; i < 25; i += 3) g.set(i, 5, 12, 'stone2').set(i, 5, 13, 'stone2');
      return g;
    },
    // Palais des papes (Avignon)
    Q143463() {
      const g = G(22, 20, 30).ground('pave');
      g.box(3, 3, 2, 19, 17, 14, 'ochre');
      g.paint(3, 3, 3, 19, 17, 12, 'shade', (i, j) => (i === 18 && j % 3 === 1) || (j === 16 && i % 3 === 1));
      g.box(4, 4, 14, 18, 16, 15, null).crenel(3, 3, 19, 17, 14, 'ochre');
      for (const [x, y, h] of [[3, 3, 24], [15, 3, 19], [15, 13, 18], [3, 13, 21], [9, 13, 16]]) {
        g.box(x, y, 2, x + 4, y + 4, h, 'ochre').crenel(x, y, x + 4, y + 4, h, 'ochre');
        g.paint(x, y, 4, x + 4, y + 4, h - 2, 'win', (i, j, k) => k % 4 === 0 && (i === x + 3 || j === y + 3) && (i + j) % 2 === 1);
      }
      g.box(18, 0, 2, 21, 3, 15, 'stone').box(18, 0, 15, 21, 3, 16, 'stone2').box(19, 1, 16, 20, 2, 20, 'gold');
      g.tree(1, 18, 2).tree(20, 18, 2, true);
      return g;
    },
    // Cathédrale Notre-Dame de Strasbourg : grès rose, flèche unique
    Q745460() {
      const {g, i0, jf, j1, tw} = cathedral({gw: 18, gd: 24, gh: 58, mat: 'pink', mat2: 'red', wall: 13, tower: 22, roof: 'tile', top: 'pave'});
      g.box(i0, jf, 22, i0 + tw, j1, 23, 'pink');
      g.disc(i0 + tw / 2, jf + 1.5, 1.6, 23, 33, 'pink').paint(i0, jf, 25, i0 + tw, j1, 32, 'dark', (i, j, k) => k % 2 === 0 && (i + j) % 2 === 0);
      for (let k = 33; k < 46; k++) g.disc(i0 + tw / 2, jf + 1.5, Math.max(0.5, 1.8 * (46 - k) / 13), k, k + 1, (k % 3) ? 'pink' : 'red');
      g.set(i0 + 1, jf + 1, 46, 'pink').set(i0 + 1, jf + 1, 47, 'gold');
      return g;
    },
    // Cathédrale de Chartres : deux flèches différentes
    Q180274() {
      const {g, i0, i1, jf, tw} = cathedral({gw: 18, gd: 24, gh: 44, wall: 12, tower: 18, roof: 'copper', flat: false});
      g.cone(i0 + tw / 2, jf + 1.5, 1.9, 18, 32, 'stone2');
      g.cone(i1 - tw / 2, jf + 1.5, 1.9, 18, 36, 'stone');
      g.paint(i1 - tw, jf, 22, i1, jf + 3, 30, 'stone2', (i, j, k) => k % 3 === 0);
      g.tree(1, 21, 2).tree(16, 21, 2);
      return g;
    },
    // Cathédrale de Reims
    Q206823() {
      const {g, i0, i1, jf, j1, tw, ft} = cathedral({gw: 18, gd: 24, gh: 34, wall: 13, tower: 22, top: 'pave', mat: 'stone2', mat2: 'stone'});
      for (const ti of [i0, i1 - tw]) for (const [di, dj] of [[0, 0], [tw - 1, 0], [0, 2], [tw - 1, 2]]) g.box(ti + di, jf + dj, ft, ti + di + 1, jf + dj + 1, ft + 3, 'stone2');
      g.box(i0 + tw, j1 - 1, 15, i1 - tw, j1, 16, 'gold');
      return g;
    },
    // Opéra Garnier
    Q187840() {
      const g = G(18, 20, 26).ground('pave');
      g.box(3, 3, 2, 15, 18, 11, 'cream');
      g.paint(3, 17, 5, 15, 18, 9, 'shade', i => i % 2 === 0).paint(14, 3, 3, 15, 18, 10, 'win', (i, j, k) => j % 2 === 1 && k % 3 === 0);
      g.paint(3, 17, 2, 15, 18, 4, 'dark', i => i % 2 === 1).box(3, 17, 9, 15, 18, 10, 'gold');
      g.box(3, 15, 11, 15, 18, 12, 'cream').set(3, 17, 12, 'gold').set(3, 17, 13, 'gold').set(14, 17, 12, 'gold').set(14, 17, 13, 'gold');
      g.disc(9, 10, 3.6, 11, 12, 'cream').dome(9, 10, 4, 12, 4, 'copper').set(8, 9, 16, 'gold').set(8, 9, 17, 'gold');
      g.box(4, 3, 2, 14, 7, 17, 'cream').gable(4, 3, 14, 7, 17, 'copper', 'i');
      g.set(8, 4, 21, 'gold').set(8, 4, 22, 'gold').set(4, 4, 17, 'gold').set(13, 4, 17, 'gold');
      return g;
    },
    // Panthéon
    Q188856() {
      const g = G(18, 22, 36).ground('pave');
      g.box(4, 3, 2, 14, 18, 12, 'stone').box(2, 7, 2, 16, 13, 12, 'stone');
      g.box(5, 18, 2, 13, 21, 3, 'stone2');
      for (let i = 5; i < 13; i += 2) g.box(i, 20, 3, i + 1, 21, 10, 'stone');
      g.box(5, 18, 3, 13, 20, 10, 'shade').box(5, 18, 10, 13, 21, 11, 'stone').gable(5, 18, 13, 21, 11, 'stone', 'j');
      g.disc(9, 10, 4.2, 12, 13, 'stone').disc(9, 10, 4, 13, 18, 'stone').paint(4, 5, 13, 15, 16, 17, 'shade', (i, j) => (i + j) % 2 === 0);
      g.disc(9, 10, 4.3, 18, 19, 'stone2').dome(9, 10, 3.8, 19, 6, 'lead');
      g.disc(9, 10, 1, 25, 28, 'stone').dome(9, 10, 1, 28, 2, 'lead').set(8, 9, 30, 'gold');
      return g;
    },
    // Centre Pompidou : tuyaux de couleur et escalator vitré
    Q178065() {
      const g = G(22, 16, 16).ground('pave');
      g.box(2, 2, 2, 20, 12, 13, 'glassD');
      g.paint(2, 2, 2, 20, 12, 13, 'white', (i, j, k) => k % 3 === 1 || (i === 19 && j % 3 === 2) || (j === 11 && i % 3 === 2));
      const pipes = ['blue', 'greenp', 'yellow', 'redp'];
      for (let i = 3; i < 20; i += 2) g.box(i, 12, 2, i + 1, 13, 13 + (i % 4 === 1 ? 1 : 0), pipes[(i >> 1) % 4]);
      for (let n = 0; n < 9; n++) g.box(3 + 2 * n, 13, 3 + n, 5 + 2 * n, 14, 4 + n, 'glass');
      g.box(4, 4, 13, 5, 5, 15, 'redp').box(15, 6, 13, 16, 7, 14, 'blue').box(9, 3, 13, 11, 4, 14, 'white');
      g.box(2, 14, 1, 20, 16, 2, 'pave');
      return g;
    },
    // Grande Arche de la Défense
    Q216357() {
      const g = G(18, 18, 24).ground('pave');
      g.box(3, 4, 2, 15, 13, 20, 'white').box(6, 4, 5, 12, 13, 17, null);
      g.paint(3, 4, 2, 15, 13, 20, 'concrete', (i, j, k) => (i + k) % 2 === 0 && j === 12);
      g.box(7, 7, 13, 11, 10, 14, 'white');
      for (let s = 0; s < 3; s++) g.box(2, 13 + s, 2, 16, 14 + s, 4 - s, 'stone');
      g.box(2, 13, 2, 16, 14, 4, 'stone');
      return g;
    },
    // Musée d'Orsay : ancienne gare, verrière et horloges
    Q23402() {
      const g = G(26, 14, 20).ground('pave');
      g.box(0, 11, 1, 26, 14, 2, 'water');
      g.box(2, 2, 2, 24, 10, 10, 'cream').windows(2, 2, 24, 10, [4, 7]);
      for (let j = 2; j < 10; j++) for (let k = 10; k < 14; k++) if ((j + 0.5 - 6) ** 2 + ((k - 9.5) * 1.6) ** 2 <= 16) g.box(5, j, k, 21, j + 1, k + 1, 'glass');
      for (const x of [2, 21]) { g.box(x, 2, 2, x + 3, 10, 13, 'cream').hip(x, 2, x + 3, 10, 13, 'slate', 2); }
      for (const x of [2, 21]) g.set(x + 1, 9, 10, 'white').set(x, 9, 10, 'white').set(x + 2, 9, 10, 'white').set(x + 1, 9, 11, 'white').set(x + 1, 9, 9, 'white').set(x + 1, 9, 10, 'dark');
      g.set(24, 5, 10, 'white').set(24, 6, 10, 'dark').set(24, 7, 10, 'white');
      g.box(24, 4, 9, 25, 9, 12, 'white').set(24, 6, 10, 'dark').set(24, 5, 10, 'gold');
      return g;
    },
    // Château de Versailles et ses jardins
    Q2946() {
      const g = G(28, 24, 16).ground();
      g.box(3, 2, 2, 25, 6, 8, 'cream').box(3, 6, 2, 8, 13, 8, 'cream').box(20, 6, 2, 25, 13, 8, 'cream');
      g.windows(3, 2, 25, 6, [3, 5, 7]).windows(3, 6, 8, 13, [3, 5]).windows(20, 6, 25, 13, [3, 5]);
      g.gable(3, 2, 25, 6, 8, 'slate', 'i').gable(3, 6, 8, 13, 8, 'slate', 'j').gable(20, 6, 25, 13, 8, 'slate', 'j');
      g.paint(3, 2, 8, 25, 13, 9, 'gold', (i, j) => (i + j) % 4 === 0);
      g.box(8, 6, 1, 20, 14, 2, 'pave');
      for (let i = 8; i < 20; i++) if (i % 2 === 0) g.box(i, 13, 2, i + 1, 14, 4, 'gold');
      g.box(13, 13, 2, 15, 14, 5, 'gold');
      g.box(4, 15, 1, 24, 24, 2, 'path').box(13, 15, 1, 15, 24, 2, 'grass');
      g.disc(14, 19, 2.6, 1, 2, 'water').box(13, 18, 2, 15, 20, 3, 'glass');
      for (const [x, y] of [[5, 16], [5, 21], [21, 16], [21, 21]]) g.box(x, y, 2, x + 3, y + 2, 3, 'leaf');
      g.tree(1, 22, 2).tree(26, 22, 2).tree(1, 15, 2).tree(26, 15, 2);
      return g;
    },
    // Arènes de Nîmes
    Q179656() {
      const g = G(22, 18, 14).ground('pave');
      for (let j = 0; j < 18; j++) for (let i = 0; i < 22; i++) {
        const e = ((i + 0.5 - 11) / 10) ** 2 + ((j + 0.5 - 9) / 8) ** 2;
        if (e > 1) continue;
        if (e < 0.36) { g.set(i, j, 2, 'sand'); continue; }
        const top = e >= 0.78 ? 11 : e >= 0.58 ? 8 : 5;
        g.box(i, j, 2, i + 1, j + 1, top, 'ochre');
        if (e >= 0.78) {
          const a = Math.floor((Math.atan2(j + 0.5 - 9, (i + 0.5 - 11) * 0.8) + Math.PI) / (2 * Math.PI) * 34);
          if (a % 2 === 0) { g.box(i, j, 3, i + 1, j + 1, 6, 'shade'); g.box(i, j, 7, i + 1, j + 1, 10, 'shade'); }
        }
      }
      g.tree(1, 16, 2).tree(20, 1, 2);
      return g;
    },
    // Viaduc de Millau
    Q99236() {
      const g = G(34, 8, 30);
      g.box(0, 0, 0, 34, 8, 1, 'soil');
      for (let i = 0; i < 34; i++) {
        const h = Math.max(1, Math.round(9 - 9 * Math.sin(Math.PI * i / 33)));
        g.box(i, 0, 1, i + 1, 8, h, 'soil').box(i, 0, h, i + 1, 8, h + 1, 'grass');
      }
      g.box(15, 0, 0, 19, 8, 2, null).box(15, 0, 0, 19, 8, 1, 'water');
      g.tree(2, 1, 10).tree(31, 6, 10).tree(6, 6, 6).tree(28, 1, 6);
      g.box(0, 3, 14, 34, 5, 15, 'white').box(0, 3, 15, 34, 4, 16, 'concrete');
      for (const x of [4, 11, 18, 25, 31]) {
        for (let k = 1; k < 14; k++) if (!g.get(x, 3, k) || k > 1) g.box(x, 3, k, x + 1, 5, k + 1, 'white');
        g.box(x, 4, 15, x + 1, 5, 21, 'white');
        for (let d = 1; d <= 3; d++) { g.set(x - d, 4, 20 - d, 'yellow'); g.set(x + d, 4, 20 - d, 'yellow'); }
      }
      return g;
    },
    // Château d'If
    Q622500() {
      const g = G(18, 18, 20);
      g.box(0, 0, 0, 18, 18, 1, 'water').disc(9, 9, 8, 0, 3, 'rock').disc(9, 9, 6.6, 3, 4, 'rock');
      g.disc(9, 9, 6.4, 4, 6, 'stone2', 5.4);
      for (let n = 0; n < 32; n += 2) g.set(9 + 5.9 * Math.cos(n * Math.PI / 16), 9 + 5.9 * Math.sin(n * Math.PI / 16), 6, 'stone2');
      g.box(6, 6, 4, 12, 12, 11, 'stone').box(7, 7, 11, 11, 11, 12, null).crenel(6, 6, 12, 12, 11, 'stone');
      g.windows(6, 6, 12, 12, [7, 9]);
      for (const [x, y] of [[6, 6], [12, 6], [6, 12]]) { g.disc(x, y, 1.8, 4, 13, 'stone'); g.disc(x, y, 1.8, 13, 14, 'stone', 1.1); }
      g.set(12, 12, 3, 'leaf');
      return g;
    },
    // Château du Haut-Kœnigsbourg, sur sa montagne boisée
    Q1552366() {
      const g = G(18, 18, 34);
      g.box(0, 0, 0, 18, 18, 1, 'soil');
      for (let s = 0; s < 5; s++) g.disc(9, 9, 9.2 - s * 1.3, 1 + s, 2 + s, 'grass');
      for (const [x, y, k] of [[2, 4, 2], [3, 14, 2], [14, 3, 2], [15, 14, 2], [13, 16, 1], [5, 16, 2], [16, 9, 2]]) g.tree(x, y, k);
      g.box(5, 5, 6, 13, 12, 12, 'red').gable(5, 5, 13, 12, 12, 'tile', 'i', 2);
      g.windows(5, 5, 13, 12, [8, 10]);
      g.box(7, 3, 6, 10, 6, 21, 'red').paint(7, 3, 9, 10, 6, 20, 'win', (i, j, k) => k % 4 === 0 && i === 9);
      g.hip(7, 3, 10, 6, 21, 'tile', 2);
      towerRound(g, 12.5, 12, 1.9, 6, 15, 'red', 'tile', 5);
      g.box(4, 11, 6, 9, 14, 9, 'red').crenel(4, 11, 9, 14, 9, 'red');
      g.box(8, 4, 26, 9, 5, 28, 'gold');
      return g;
    },
    // Stade Vélodrome (Marseille) : toit blanc ondulé, gradins bleu ciel
    Q202150() { return stadium({seats: ['sky', 'blue'], roof: 0.6, roofK: 15, wave: 2}); },
    // Stade de France : grand toit plat en anneau, posé sur ses mâts
    Q13205() { return stadium({seats: ['redp', 'blue'], roof: 0.55, roofK: 16, wave: 0, post: 'metal', roofM: 'concrete'}); },
    // Mucem (Marseille) : cube de dentelle sombre, passerelle vers le fort Saint-Jean
    Q2808698() {
      const g = G(22, 18, 18);
      g.box(0, 0, 0, 22, 18, 1, 'water').box(2, 2, 0, 16, 15, 2, 'pave');
      g.box(4, 4, 2, 14, 14, 11, 'glassD');
      g.box(3, 3, 2, 15, 15, 12, 'dark');
      g.paint(3, 3, 2, 15, 15, 12, 'win', (i, j, k) => (i + j + k) % 2 === 0).box(3, 3, 11, 15, 15, 12, 'dark');
      g.box(4, 4, 11, 14, 14, 12, 'pave');
      g.box(15, 7, 10, 18, 9, 11, 'metal');
      g.box(18, 4, 0, 22, 12, 7, 'stone2').crenel(18, 4, 22, 12, 7, 'stone2').box(19, 5, 7, 21, 8, 11, 'stone').crenel(19, 5, 21, 8, 11, 'stone');
      return g;
    },
    // Sainte-Chapelle : flèche fine et grands vitraux
    Q193193() {
      const g = G(14, 20, 40).ground('pave');
      g.box(4, 3, 2, 10, 17, 19, 'stone');
      g.paint(9, 3, 7, 10, 17, 17, 'rose', (i, j) => j % 2 === 0);
      g.paint(4, 16, 11, 10, 17, 16, 'rose', (i, j, k) => Math.abs(i - 6.5) < 2 && k !== 11);
      g.paint(4, 16, 2, 10, 17, 5, 'dark', i => i % 2 === 1);
      for (let j = 3; j < 17; j += 2) g.box(10, j, 2, 11, j + 1, 18, 'stone2');
      g.gable(4, 3, 10, 17, 19, 'lead', 'j', 2);
      g.box(6, 3, 24, 8, 17, 25, 'gold');
      g.cone(7, 9, 1.2, 25, 36, 'lead').box(6, 8, 36, 7, 9, 38, 'gold');
      for (const [x, y] of [[4, 16], [9, 16]]) g.box(x, y, 19, x + 1, y + 1, 24, 'stone').set(x, y, 24, 'lead');
      return g;
    },
    // Pont Alexandre-III : arche basse et pylônes dorés
    Q390418() {
      const g = G(28, 12, 22);
      g.box(0, 0, 0, 28, 12, 1, 'water').box(0, 0, 0, 5, 12, 3, 'pave').box(23, 0, 0, 28, 12, 3, 'pave');
      for (let i = 5; i < 23; i++) {
        const k = 3 + Math.round(3 * Math.sin(Math.PI * (i - 4.5) / 19));
        g.box(i, 3, k, i + 1, 9, 7, 'copper');
      }
      g.box(0, 3, 7, 28, 9, 8, 'stone').box(0, 3, 8, 28, 4, 9, 'gold').box(0, 8, 8, 28, 9, 9, 'gold');
      for (const x of [3, 23]) for (const y of [1, 9]) {
        g.box(x, y, 3, x + 2, y + 2, 15, 'stone').box(x, y, 15, x + 2, y + 2, 16, 'stone2').box(x, y, 16, x + 1, y + 1, 20, 'gold').set(x + 1, y, 18, 'gold');
      }
      for (let i = 8; i < 22; i += 4) g.box(i, 8, 9, i + 1, 9, 12, 'dark').set(i, 8, 12, 'yellow');
      return g;
    },
    // Tour Montparnasse
    Q323767() {
      const g = G(16, 16, 50).ground('pave');
      g.box(2, 2, 2, 14, 14, 5, 'glassD').box(2, 2, 5, 14, 14, 6, 'concrete');
      g.box(4, 5, 6, 12, 11, 44, 'win');
      g.paint(4, 5, 6, 12, 11, 44, 'glassD', (i, j, k) => k % 2 === 0);
      g.box(4, 5, 44, 12, 11, 45, 'dark').box(6, 7, 45, 10, 9, 47, 'metal').box(8, 8, 47, 9, 9, 49, 'redp');
      return g;
    },
    // Grand Palais : nef de verre et dôme
    Q457318() {
      const g = G(28, 16, 24).ground();
      g.box(2, 3, 2, 26, 13, 9, 'stone').windows(2, 3, 26, 13, [4, 5, 7]);
      for (let j = 3; j < 13; j++) for (let k = 9; k < 15; k++) if ((j + 0.5 - 8) ** 2 + ((k - 8.5) * 0.95) ** 2 <= 27) g.box(2, j, k, 26, j + 1, k + 1, 'glass');
      g.paint(2, 3, 9, 26, 13, 15, 'glassD', i => i % 4 === 1);
      g.box(12, 3, 2, 16, 14, 11, 'stone').dome(14, 8, 4.4, 14, 6, 'glass').disc(14, 8, 1, 20, 21, 'glassD').box(13, 7, 21, 14, 8, 23, 'gold');
      for (const x of [2, 25]) g.box(x, 12, 9, x + 1, 13, 12, 'copper');
      g.tree(1, 14, 2).tree(26, 14, 2);
      return g;
    },
    // Place de la Concorde : obélisque et fontaines
    Q189503() {
      const g = G(20, 20, 30).ground('pave');
      g.box(0, 9, 1, 20, 11, 2, 'road').box(9, 0, 1, 11, 20, 2, 'road');
      g.box(8, 8, 2, 12, 12, 3, 'stone').box(9, 9, 3, 11, 11, 5, 'stone2');
      g.box(9, 9, 5, 11, 11, 25, 'pink').paint(9, 9, 6, 11, 11, 24, 'red', (i, j, k) => k % 3 === 0);
      g.box(9, 9, 25, 11, 11, 26, 'gold').set(9, 9, 26, 'gold');
      for (const [x, y] of [[4.5, 15.5], [15.5, 4.5]]) { g.disc(x, y, 3.2, 2, 3, 'stone').disc(x, y, 2.4, 2, 3, 'water').disc(x, y, 1, 3, 5, 'copper').box(Math.floor(x), Math.floor(y), 5, Math.floor(x) + 1, Math.floor(y) + 1, 7, 'gold'); }
      return g;
    },
    // Église de la Madeleine : temple à colonnes
    Q330564() { return temple({w: 16, d: 24, h: 18, mat: 'stone', ck: 12, cella: 'stone2', roof: 'lead'}); },
    // Maison carrée (Nîmes)
    Q677659() { return temple({w: 14, d: 20, h: 14, mat: 'ochre', ck: 10, cella: 'ochre', roof: 'tile', porch: 5}); },
    // Phare de Cordouan, en pleine mer
    Q199234() {
      const g = G(14, 14, 42);
      g.box(0, 0, 0, 14, 14, 1, 'water').disc(7, 7, 6.3, 0, 2, 'rock').disc(7, 7, 5.6, 2, 5, 'stone2').disc(7, 7, 4.6, 5, 6, null);
      g.disc(7, 7, 4.2, 2, 11, 'white').disc(7, 7, 4.8, 11, 12, 'stone2');
      g.disc(7, 7, 3.4, 12, 20, 'white').disc(7, 7, 3.9, 20, 21, 'stone2');
      g.disc(7, 7, 2.5, 21, 29, 'white').disc(7, 7, 3, 29, 30, 'stone2');
      g.disc(7, 7, 1.7, 30, 33, 'white').disc(7, 7, 2.2, 33, 34, 'dark').disc(7, 7, 1.5, 34, 37, 'yellow').dome(7, 7, 1.8, 37, 3, 'lead');
      for (const k of [7, 15, 24]) g.box(7, 10, k, 8, 11, k + 2, 'win').box(10, 7, k, 11, 8, k + 2, 'win');
      return g;
    },
    // Cathédrale d'Amiens : tours inégales, flèche dorée
    Q106934() {
      const {g} = cathedral({gw: 18, gd: 24, gh: 36, wall: 14, tower: 21, left: 23, spire: 30, roof: 'lead', top: 'pave'});
      return g;
    },
    // Cathédrale de Rouen : très haute flèche de fonte
    Q476516() {
      const {g} = cathedral({gw: 18, gd: 24, gh: 44, wall: 12, tower: 19, left: 22, spire: 40, roof: 'slate', top: 'pave', mat: 'stone2', mat2: 'stone'});
      return g;
    },
    // Cathédrale d'Albi : forteresse de briques
    Q94744() {
      const g = G(14, 26, 32).ground('pave');
      g.box(3, 3, 2, 11, 18, 14, 'brick');
      for (let j = 3; j < 18; j += 2) { g.box(11, j, 2, 12, j + 1, 14, 'brick'); g.box(2, j, 2, 3, j + 1, 14, 'brick'); }
      g.disc(7, 4, 4, 2, 14, 'brick').paint(10, 3, 8, 11, 18, 12, 'win', (i, j) => j % 2 === 0);
      g.gable(3, 3, 11, 18, 14, 'tile', 'j');
      g.box(3, 18, 2, 11, 24, 24, 'brick').box(4, 19, 24, 10, 23, 28, 'brick').box(5, 20, 28, 9, 22, 30, 'brick');
      for (const [x, y] of [[3, 23], [10, 23], [3, 18], [10, 18]]) g.box(x, y, 2, x + 1, y + 1, 25, 'red');
      g.paint(3, 23, 16, 11, 24, 21, 'win', i => i === 6 || i === 7);
      return g;
    },
    // Basilique Saint-Sernin (Toulouse) : clocher octogonal à étages
    Q1010268() {
      const g = G(20, 24, 36).ground('pave');
      g.box(6, 2, 2, 14, 22, 10, 'brick').box(3, 9, 2, 17, 13, 10, 'brick');
      g.disc(10, 3, 4, 2, 8, 'brick').gable(6, 2, 14, 22, 10, 'tile', 'j').gable(3, 9, 17, 13, 10, 'tile', 'i');
      g.windows(6, 2, 14, 22, [6]);
      [[3.4, 13, 17], [3, 17, 21], [2.6, 21, 25], [2.2, 25, 28], [1.8, 28, 30]].forEach(([r, a, b], n) => {
        g.disc(10, 11, r, a, b, 'brick').disc(10, 11, r + 0.5, b - 1, b, 'stone');
        g.box(10, Math.floor(11 + r), a + 1, 11, Math.floor(11 + r) + 1, b - 1, 'win').box(Math.floor(10 + r), 11, a + 1, Math.floor(10 + r) + 1, 12, b - 1, 'win');
      });
      g.cone(10, 11, 1.8, 30, 34, 'stone').set(9, 10, 34, 'gold');
      return g;
    },
    // Théâtre antique d'Orange : immense mur de scène et gradins
    Q958961() {
      const g = G(24, 20, 22).ground('sand');
      g.box(1, 16, 1, 23, 20, 2, 'grass');
      g.box(1, 1, 2, 23, 5, 18, 'ochre');
      g.paint(1, 4, 4, 23, 5, 17, 'shade', (i, j, k) => i % 3 === 1 && k % 5 !== 3);
      g.box(9, 4, 2, 15, 5, 8, 'dark').box(11, 4, 12, 13, 5, 16, 'shade').box(11, 5, 12, 12, 6, 15, 'white').box(1, 1, 18, 23, 5, 19, 'stone2');
      for (let j = 5; j < 20; j++) for (let i = 0; i < 24; i++) {
        const r = Math.hypot((i + 0.5 - 12) / 1.05, j + 0.5 - 5);
        if (r >= 5 && r <= 12.5) g.box(i, j, 2, i + 1, j + 1, 3 + Math.round((r - 5) * 0.9), Math.round(r) % 2 ? 'ochre' : 'stone2');
      }
      return g;
    },
    // Pont d'Avignon : quatre arches inachevées et sa chapelle
    Q284444() {
      const g = G(28, 10, 16);
      g.box(0, 0, 0, 28, 10, 1, 'water').box(0, 0, 0, 5, 10, 2, 'soil').box(0, 0, 2, 5, 10, 3, 'grass').tree(1, 2, 3).tree(2, 8, 3);
      g.box(4, 3, 1, 22, 7, 7, 'stone');
      for (let i = 5; i < 22; i++) {
        const p = (i - 5) % 5;
        if (p > 0) { g.box(i, 3, 1, i + 1, 7, 4, null); if (p === 2 || p === 3) g.box(i, 3, 4, i + 1, 7, 5, null); }
      }
      g.box(22, 3, 1, 23, 7, 3, 'stone2').box(20, 3, 7, 21, 7, 8, null);
      for (let i = 4; i < 20; i += 2) { g.set(i, 3, 7, 'stone2'); g.set(i, 6, 7, 'stone2'); }
      g.box(9, 2, 7, 14, 8, 11, 'stone').gable(9, 2, 14, 8, 11, 'tile', 'i').box(11, 7, 7, 12, 8, 9, 'dark').box(13, 4, 13, 14, 5, 15, 'stone');
      return g;
    },
    // Château de Fontainebleau : escalier en fer à cheval
    Q201428() {
      const g = G(26, 20, 18).ground();
      g.box(5, 7, 1, 21, 20, 2, 'path');
      g.box(2, 2, 2, 24, 7, 10, 'cream').box(2, 7, 2, 6, 15, 8, 'cream').box(20, 7, 2, 24, 15, 8, 'cream');
      g.windows(2, 2, 24, 7, [4, 7]).windows(2, 7, 6, 15, [4, 6]).windows(20, 7, 24, 15, [4, 6]);
      g.gable(2, 2, 24, 7, 10, 'slate', 'i', 2).gable(2, 7, 6, 15, 8, 'slate', 'j', 2).gable(20, 7, 24, 15, 8, 'slate', 'j', 2);
      for (const x of [8, 16]) g.box(x, 2, 2, x + 3, 7, 12, 'cream').hip(x, 2, x + 3, 7, 12, 'slate', 2);
      g.box(11, 7, 2, 15, 9, 6, 'stone');
      g.disc(13, 9, 4.2, 2, 6, 'stone', 3).box(9, 9, 2, 17, 15, 6, null);
      for (let n = 0; n < 4; n++) { g.box(8 - 0, 9 + n, 2, 11, 10 + n, 5 - n, 'stone'); g.box(15, 9 + n, 2, 18, 10 + n, 5 - n, 'stone'); }
      g.box(11, 8, 6, 15, 9, 9, 'dark');
      g.tree(1, 17, 2).tree(24, 17, 2);
      return g;
    },
    // Château de Montsoreau, les pieds dans la Loire
    Q1143049() {
      const g = G(20, 18, 28).ground();
      g.box(0, 13, 0, 20, 18, 2, null).box(0, 13, 0, 20, 18, 1, 'water');
      g.box(5, 4, 1, 15, 13, 3, 'stone2').box(5, 4, 3, 15, 12, 14, 'cream').windows(5, 4, 15, 12, [6, 7, 10, 11]);
      g.hip(5, 4, 15, 12, 14, 'slate', 2);
      for (const [x, y] of [[5, 12], [15, 12]]) towerRound(g, x, y, 2, 2, 15, 'cream', 'slate', 6);
      g.box(9, 11, 14, 11, 12, 18, 'cream').gable(9, 10, 11, 12, 18, 'slate', 'i', 2);
      g.tree(2, 3, 2).tree(17, 3, 2).tree(17, 9, 2);
      return g;
    },
    // Alignements de Carnac
    Q833850() {
      const g = G(24, 18, 10).ground();
      for (let r = 0; r < 4; r++) for (let n = 0; n < 7; n++) {
        const i = 2 + n * 3 + (r % 2), j = 3 + r * 4, h = 2 + ((n * 5 + r * 3) % 4) - (n > 4 ? 1 : 0);
        g.box(i, j, 2, i + 1, j + 2, 2 + h, 'rock');
      }
      g.tree(1, 16, 2).set(22, 1, 2, 'leaf').set(12, 16, 2, 'leaf2');
      return g;
    },
    // Chapelle de Ronchamp : murs blancs courbes, toit-coque sombre
    Q638250() {
      const g = G(18, 18, 24).ground();
      g.box(1, 1, 2, 17, 17, 3, 'grass');
      for (let j = 3; j < 15; j++) for (let i = 4; i < 14; i++) {
        const c = 8 + 3 * Math.sin((j - 3) / 12 * Math.PI);
        if (i <= c + 2) g.box(i, j, 3, i + 1, j + 1, 10, 'white');
      }
      g.paint(4, 3, 4, 14, 15, 9, 'win', (i, j, k) => (i * 3 + j * 5 + k * 7) % 11 === 0);
      for (let j = 2; j < 16; j++) for (let i = 3; i < 15; i++) {
        const k = 10 + Math.round(2.2 * Math.abs(i - 9) / 6 + 1.2 * Math.sin(j / 3));
        if (i <= 8 + 3 * Math.sin((j - 3) / 12 * Math.PI) + 3) g.box(i, j, 10, i + 1, j + 1, k + 1, 'shade');
      }
      g.disc(5, 4, 2.2, 3, 19, 'white').dome(5, 4, 2.3, 19, 2, 'white');
      g.tree(15, 3, 3).tree(3, 15, 3);
      return g;
    },
    // Pont de Normandie : pylônes en Y renversé et haubans
    Q504710() {
      const g = G(36, 8, 34);
      g.box(0, 0, 0, 36, 8, 1, 'water').box(0, 0, 0, 4, 8, 3, 'soil').box(0, 0, 3, 4, 8, 4, 'grass').box(32, 0, 0, 36, 8, 3, 'soil').box(32, 0, 3, 36, 8, 4, 'grass');
      for (let i = 0; i < 36; i++) { const k = 9 + Math.round(3 * Math.sin(Math.PI * i / 35)); g.box(i, 3, k, i + 1, 5, k + 1, 'white'); }
      for (const x of [8, 27]) {
        for (let k = 1; k < 24; k++) { const s = k < 22 ? Math.round((22 - k) / 8) : 0; g.set(x, 3 - s, k, 'concrete'); g.set(x, 4 + s, k, 'concrete'); }
        g.box(x, 3, 22, x + 1, 5, 31, 'concrete');
        for (let d = 1; d <= 8; d++) { const k = 29 - 2 * d; g.box(x - d, 4, k, x - d + 1, 5, k + 2, 'metal').box(x + d, 4, k, x + d + 1, 5, k + 2, 'metal'); }
      }
      return g;
    },
    // Pont Valentré (Cahors) : trois tours fortifiées
    Q1816823() {
      const g = G(28, 8, 24);
      g.box(0, 0, 0, 28, 8, 1, 'water').box(0, 0, 0, 3, 8, 2, 'soil').box(0, 0, 2, 3, 8, 3, 'grass').box(25, 0, 0, 28, 8, 2, 'soil').box(25, 0, 2, 28, 8, 3, 'grass');
      g.box(0, 2, 1, 28, 6, 7, 'stone2');
      for (let i = 3; i < 25; i++) { const p = (i - 3) % 4; if (p) { g.box(i, 2, 1, i + 1, 6, 4, null); if (p === 2) g.box(i, 2, 4, i + 1, 6, 5, null); } }
      for (let i = 0; i < 28; i += 2) { g.set(i, 2, 7, 'stone2'); g.set(i, 5, 7, 'stone2'); }
      for (const x of [4, 13, 22]) {
        g.box(x, 1, 7, x + 3, 7, 17, 'stone').box(x, 2, 7, x + 3, 6, 10, null).crenel(x, 1, x + 3, 7, 17, 'stone');
        g.box(x, 1, 17, x + 3, 7, 18, 'stone2').hip(x, 1, x + 3, 7, 18, 'tile', 2).box(x + 1, 6, 12, x + 2, 7, 15, 'win');
      }
      return g;
    },
    // Hôtel Negresco (Nice) : coupole rose, palmiers et Méditerranée
    Q743147() {
      const g = G(20, 18, 30).ground('pave');
      g.box(0, 14, 0, 20, 18, 2, null).box(0, 14, 0, 20, 18, 1, 'water').box(0, 12, 1, 20, 14, 2, 'sand');
      g.box(4, 3, 2, 17, 11, 13, 'white').windows(4, 3, 17, 11, [4, 6, 8, 10]).box(4, 3, 13, 17, 11, 14, 'stone');
      g.hip(4, 3, 17, 11, 14, 'slate', 2);
      g.disc(8, 8, 3, 2, 17, 'white').disc(8, 8, 3.4, 17, 18, 'stone').dome(8, 8, 3.2, 18, 6, 'rosy').set(7, 7, 24, 'gold').set(7, 7, 25, 'gold');
      for (let k = 4; k < 17; k += 2) g.box(8, 10, k, 9, 11, k + 1, 'win');
      palm(g, 2, 10, 2); palm(g, 18, 11, 2); palm(g, 12, 11, 2);
      return g;
    },
  };
  // Monuments déjà modélisés à la même place sous un autre nom.
  const ALIAS = {};

  // ---------- Badge « carte gagnée » en pixels ----------
  const DISC = ['..xxxxx..', '.xxxxxxx.', 'xxxxxxxxx', 'xxxxxxxxx', 'xxxxxxxxx', 'xxxxxxxxx', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..'];
  const CHECK = [[2, 4], [3, 5], [4, 6], [5, 5], [6, 4], [7, 3], [3, 4], [4, 5], [5, 4], [6, 3]];
  function badge(g2, x, y, color, bonus) {
    const px = (a, b, c) => { g2.fillStyle = c; g2.fillRect(x + a, y + b, 1, 1); };
    for (let b = -1; b <= 9; b++) for (let a = -1; a <= 9; a++) {
      const on = (u, v) => u >= 0 && v >= 0 && u < 9 && v < 9 && DISC[v][u] === 'x';
      if (on(a, b)) px(a, b, color);
      else if (on(a + 1, b) || on(a - 1, b) || on(a, b + 1) || on(a, b - 1)) px(a, b, bonus ? '#ffd761' : '#1c1626');
    }
    for (const [a, b] of CHECK) px(a, b, '#ffffff');
  }

  const base = new Map(), urls = new Map(), datas = new Map();
  const get = id => {
    id = ALIAS[id] || id;
    if (!base.has(id)) { try { base.set(id, render(DEFS[id]())); } catch (e) { console.warn('sprite', id, e); base.set(id, null); } }
    return base.get(id);
  };
  // Dessin final (badge compris), agrandi « scale » fois sans flou.
  function draw(id, st, color, scale) {
    const b = get(id), cv = document.createElement('canvas');
    cv.width = b.w * scale; cv.height = b.h * scale;
    const g2 = cv.getContext('2d');
    g2.imageSmoothingEnabled = false;
    g2.scale(scale, scale);
    g2.drawImage(b.canvas, 0, 0);
    if (st) badge(g2, b.bx - 4, b.by - 4, color, st === 2);
    return cv;
  }

  window.Sprites = {
    has: id => !!(DEFS[id] || ALIAS[id]) && !!get(id),
    ids: Object.keys(DEFS),
    meta: id => { const b = get(id); return b && {w: b.w, h: b.h, ax: b.ax, ay: b.ay}; },
    // Image pour la carte 3D (MapLibre) : 3 pixels réels par pixel du dessin, à ajouter avec pixelRatio 3.
    data(id, st, color) {
      const k = `${id}-${st}-${color}`;
      if (!datas.has(k)) { const cv = draw(id, st, color, 3); datas.set(k, cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)); }
      return datas.get(k);
    },
    // Image pour la carte 2D et les fiches (taille du dessin ; à afficher en « pixelated »).
    url(id, st = 0, color = '#888') {
      const k = `${id}-${st}-${color}`;
      if (!urls.has(k)) urls.set(k, draw(id, st, color, 1).toDataURL());
      return urls.get(k);
    },
    // Taille d'affichage selon le zoom (niveaux de la carte 3D) : 1 = un pixel du dessin par pixel d'écran.
    scale: z => z < 6 ? 0.5 : z < 10 ? 0.5 + (z - 6) * 0.05 : z < 14 ? 0.7 + (z - 10) * 0.075 : Math.min(1.9, 1 + (z - 14) * 0.25),
  };
})();
