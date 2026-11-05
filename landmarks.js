/* =====================================================================
   Modèles 3D des grands monuments de France, extrudés sur la carte comme les immeubles.
   Chaque modèle est fait de volumes simples (blocs, cylindres, dômes et pyramides en gradins)
   décrits en mètres dans un repère local : x vers la droite, y vers l'arrière du monument,
   « rot » = cap (en degrés, depuis le nord) de l'axe +y, mesuré sur les bâtiments d'OpenStreetMap. Les immeubles de la carte qui se
   trouvent sous un modèle sont masqués (rayon « hide »). « zoom » = cadrage quand on le vise.
   ===================================================================== */
(function () {
  'use strict';
  const M = 111320;  // mètres par degré de latitude

  // ---------- Briques de construction ----------
  const rect = (x, y, w, d) => [[x - w / 2, y - d / 2], [x + w / 2, y - d / 2], [x + w / 2, y + d / 2], [x - w / 2, y + d / 2]];
  const circ = (x, y, r, n = 24) => Array.from({length: n}, (_, i) => [x + r * Math.cos(2 * Math.PI * i / n), y + r * Math.sin(2 * Math.PI * i / n)]);
  const box = (x, y, w, d, base, top, color, glass) => ({ring: rect(x, y, w, d), base, top, color, glass: !!glass});
  const cyl = (x, y, r, base, top, color) => ({ring: circ(x, y, r), base, top, color});
  // Dôme : cylindres empilés qui suivent le profil d'une demi-sphère.
  const dome = (x, y, r, base, h, color, steps = 7) => Array.from({length: steps}, (_, i) => {
    const t = i / steps;
    return cyl(x, y, Math.max(0.6, r * Math.sqrt(1 - t * t)), base + h * t, base + h * (i + 1) / steps, color);
  });
  // Pyramide (ou flèche) : carrés empilés de plus en plus petits.
  const pyramid = (x, y, w, base, h, color, steps = 8, glass) => Array.from({length: steps}, (_, i) => {
    const s = Math.max(0.8, w * (1 - i / steps));
    return box(x, y, s, s, base + h * i / steps, base + h * (i + 1) / steps, color, glass);
  });
  const four = (d, fn) => [[-d, -d], [d, -d], [d, d], [-d, d]].map(([x, y]) => fn(x, y));
  const range = (from, to, n) => Array.from({length: n}, (_, i) => from + (to - from) * i / (n - 1));

  // ---------- Couleurs ----------
  const C = {
    iron: '#9a6b45', ironDark: '#6f4a2f', stone: '#ece2cc', stoneShade: '#ddd0b5', slate: '#8b96a0', slateDark: '#6d7781',
    white: '#f7f4ec', whiteShade: '#ece6d8', gold: '#d6a92c', copper: '#6fa48b', glass: '#9fcbe8', granite: '#b7ab96',
    rock: '#a99d88', green: '#93b47e', concrete: '#dedcd6',
  };

  // ---------- Les monuments ----------
  const LANDMARKS = [
    {id: 'Q243', name: 'Tour Eiffel', lat: 48.85826, lng: 2.29451, rot: 43, hide: 95, zoom: 15.4, parts: () => [
      ...four(49, (x, y) => box(x, y, 26, 26, 0, 20, C.iron)),
      ...four(42, (x, y) => box(x, y, 23, 23, 20, 38, C.iron)),
      ...four(35, (x, y) => box(x, y, 20, 20, 38, 57, C.iron)),
      box(0, -35, 50, 4, 45, 57, C.ironDark), box(0, 35, 50, 4, 45, 57, C.ironDark),
      box(-35, 0, 4, 50, 45, 57, C.ironDark), box(35, 0, 4, 50, 45, 57, C.ironDark),
      box(0, 0, 74, 74, 57, 63, C.ironDark),
      ...four(24, (x, y) => box(x, y, 15, 15, 63, 80, C.iron)),
      ...four(19, (x, y) => box(x, y, 12, 12, 80, 97, C.iron)),
      ...four(14, (x, y) => box(x, y, 10, 10, 97, 115, C.iron)),
      box(0, 0, 40, 40, 115, 120, C.ironDark),
      box(0, 0, 24, 24, 120, 150, C.iron), box(0, 0, 20, 20, 150, 180, C.iron), box(0, 0, 16, 16, 180, 210, C.iron),
      box(0, 0, 13, 13, 210, 240, C.iron), box(0, 0, 10, 10, 240, 276, C.iron),
      box(0, 0, 16, 16, 276, 281, C.ironDark), box(0, 0, 8, 8, 281, 300, C.iron), cyl(0, 0, 1.2, 300, 330, C.ironDark),
    ]},
    {id: 'Q64436', name: 'Arc de triomphe', lat: 48.87378, lng: 2.29504, rot: 105, hide: 40, zoom: 17, parts: () => [
      box(-15, 0, 15, 22, 0, 29.2, C.stone), box(15, 0, 15, 22, 0, 29.2, C.stone),
      box(0, 0, 45, 22, 29.2, 44, C.stone), box(0, 0, 46.5, 23.5, 44, 45.5, C.stoneShade), box(0, 0, 44, 21, 45.5, 50, C.stone),
    ]},
    {id: 'Q2981', name: 'Notre-Dame de Paris', lat: 48.85296, lng: 2.34990, rot: 118, hide: 90, zoom: 16.3, parts: () => [
      box(-12.5, -57, 14, 14, 0, 69, C.stone), box(12.5, -57, 14, 14, 0, 69, C.stone), box(0, -57, 11, 14, 0, 45, C.stoneShade),
      box(0, -10, 24, 80, 0, 33, C.stone), box(0, -10, 20, 80, 33, 38, C.slate), box(0, -10, 12, 80, 38, 43, C.slate), box(0, -10, 4, 80, 43, 45, C.slate),
      box(-18, -5, 12, 90, 0, 20, C.stoneShade), box(18, -5, 12, 90, 0, 20, C.stoneShade),
      box(-18, -5, 10, 90, 20, 23, C.slate), box(18, -5, 10, 90, 20, 23, C.slate),
      box(0, 8, 48, 14, 0, 33, C.stone), box(0, 8, 44, 10, 33, 40, C.slate),
      box(0, 42, 24, 30, 0, 33, C.stone), cyl(0, 57, 20, 0, 18, C.stoneShade), cyl(0, 57, 12, 18, 33, C.stone),
      box(0, 42, 18, 30, 33, 41, C.slate), cyl(0, 57, 9, 33, 40, C.slate),
      cyl(0, 8, 3, 40, 60, C.slateDark), cyl(0, 8, 2, 60, 80, C.slateDark), cyl(0, 8, 1, 80, 96, C.slateDark),
    ]},
    {id: 'Q13397', name: 'Pyramide du Louvre', lat: 48.86105, lng: 2.33582, rot: 21, hide: 22, zoom: 17.2, parts: () =>
      pyramid(0, 0, 35.4, 0, 21.6, C.glass, 9, true)},
    {id: 'Q28785', name: 'Sacré-Cœur', lat: 48.88682, lng: 2.34300, rot: 356, hide: 80, zoom: 16.4, parts: () => [
      box(0, 0, 36, 70, 0, 32, C.white), box(0, -40, 26, 10, 0, 24, C.whiteShade), cyl(0, 36, 14, 0, 30, C.white),
      cyl(0, -2, 13, 32, 52, C.white), ...dome(0, -2, 13, 52, 24, C.whiteShade), cyl(0, -2, 2.2, 76, 83, C.white),
      ...[[-14, -22], [14, -22], [-14, 18], [14, 18]].flatMap(([x, y]) => [cyl(x, y, 5, 32, 40, C.white), ...dome(x, y, 5, 40, 8, C.whiteShade, 4)]),
      box(0, 50, 12, 12, 0, 62, C.white), cyl(0, 50, 4.5, 62, 76, C.white), ...dome(0, 50, 4.5, 76, 8, C.whiteShade, 4),
    ]},
    {id: 'Q188856', name: 'Panthéon', lat: 48.84620, lng: 2.34611, rot: 82, hide: 80, zoom: 16.4, parts: () => [
      box(0, 5, 42, 100, 0, 30, C.stone), box(0, 5, 84, 40, 0, 30, C.stone),
      box(0, -52, 36, 14, 0, 24, C.stoneShade), box(0, -52, 36, 14, 24, 28, C.stone),
      cyl(0, 5, 17, 30, 50, C.stone), cyl(0, 5, 14, 50, 58, C.stoneShade), ...dome(0, 5, 14, 58, 20, C.slate, 6), cyl(0, 5, 2.5, 78, 83, C.stone),
    ]},
    {id: 'invalides', name: 'Dôme des Invalides', lat: 48.85502, lng: 2.31253, rot: 0, hide: 38, zoom: 16.4, parts: () => [
      box(0, 0, 56, 56, 0, 26, C.stone), box(0, -31, 26, 8, 0, 28, C.stoneShade),
      cyl(0, 0, 16, 26, 52, C.stone), ...dome(0, 0, 16, 52, 34, C.gold, 8), cyl(0, 0, 3, 86, 96, C.gold), cyl(0, 0, 1, 96, 107, C.gold),
    ]},
    {id: 'Q187840', name: 'Palais Garnier', lat: 48.87195, lng: 2.33167, rot: 344, hide: 110, zoom: 16.2, parts: () => [
      box(0, 0, 100, 150, 0, 30, C.stone), box(0, -78, 70, 10, 0, 33, C.stoneShade),
      box(-30, -78, 8, 10, 33, 38, C.gold), box(30, -78, 8, 10, 33, 38, C.gold),
      cyl(0, -12, 20, 30, 40, C.stone), ...dome(0, -12, 20, 40, 12, C.copper, 5), cyl(0, -12, 2, 52, 56, C.gold),
      box(0, 35, 56, 40, 30, 52, C.stone), box(0, 35, 48, 40, 52, 56, C.copper), box(0, 35, 30, 40, 56, 60, C.copper), box(0, 35, 12, 40, 60, 63, C.copper),
      cyl(0, 54, 1.5, 63, 70, C.gold),
    ]},
    {id: 'Q178065', name: 'Centre Pompidou', lat: 48.86064, lng: 2.35225, rot: 9, hide: 95, zoom: 16.2, parts: () => [
      box(0, 0, 60, 166, 0, 42, '#c9d4de'),
      ...range(-66, 66, 7).map(y => cyl(33, y, 2.6, 0, 48, '#2f6fd6')),
      ...[-55, -11, 33].map(y => cyl(36.5, y, 1.6, 0, 44, '#2fa34f')),
      ...[-33, 11, 55].map(y => cyl(36.5, y, 1.4, 0, 40, '#f2c318')),
      ...[[12, -50], [12, -20], [12, 10], [-10, 40]].map(([x, y]) => cyl(x, y, 3, 42, 50, '#f1f1f1')),
      ...Array.from({length: 6}, (_, i) => box(-33, -70 + i * 24, 4, 26, 6 + i * 6, 10 + i * 6, '#e5473b')),
    ]},
    {id: 'Q651388', name: 'Mont-Saint-Michel', lat: 48.63600, lng: -1.51130, rot: 90, hide: 260, zoom: 15.2, parts: () => [
      cyl(0, 0, 150, 0, 8, C.stoneShade), cyl(0, 0, 128, 8, 20, '#bfb29c'), cyl(0, 0, 100, 20, 34, '#b3a690'),
      cyl(0, 0, 72, 34, 48, C.rock), cyl(0, 0, 48, 48, 62, '#9e8f78'), cyl(-30, 0, 60, 20, 40, C.green),
      box(-25, 0, 22, 60, 62, 88, '#c2b59e'),
      box(0, -5, 14, 70, 62, 92, C.granite), box(0, -5, 10, 70, 92, 98, C.slate), box(0, 5, 34, 12, 62, 92, C.granite),
      box(0, 5, 12, 12, 92, 110, C.granite), cyl(0, 5, 3, 110, 140, C.slateDark), cyl(0, 5, 1.5, 140, 152, C.slateDark), cyl(0, 5, 0.8, 152, 157, C.gold),
    ]},
    {id: 'Q189764', name: 'Pont du Gard', lat: 43.94730, lng: 4.53550, rot: 128, hide: 200, zoom: 15.8, parts: () => [
      ...range(-71, 71, 7).map(y => box(0, y, 6, 6, 0, 18, '#e3cc9f')), box(0, 0, 6, 148, 18, 22, '#d9c08f'),
      ...range(-121, 121, 12).map(y => box(0, y, 4.6, 4, 22, 38, '#e3cc9f')), box(0, 0, 4.6, 246, 38, 42, '#d9c08f'),
      ...range(-137.5, 137.5, 36).map(y => box(0, y, 3.5, 2, 42, 46, '#e3cc9f')), box(0, 0, 3.5, 277, 46, 49, '#d9c08f'),
    ]},
    {id: 'Q99236', name: 'Viaduc de Millau', lat: 44.08028, lng: 3.02250, rot: 175, hide: 0, zoom: 13.6, parts: () => [
      box(0, 0, 32, 2460, 232, 240, '#f2f2f0'),
      ...range(-1026, 1026, 7).flatMap(y => [box(0, y, 24, 16, 0, 90, C.concrete), box(0, y, 20, 12, 90, 170, C.concrete),
        box(0, y, 16, 9, 170, 232, C.concrete), box(0, y, 3, 8, 240, 327, '#f7f7f5')]),
    ]},
    {id: 'Q180274', name: 'Cathédrale de Chartres', lat: 48.44778, lng: 1.48778, rot: 45, hide: 85, zoom: 16.2, parts: () => [
      box(-11, -58, 15, 15, 0, 48, C.stone), box(11, -58, 15, 15, 0, 48, C.stone), box(0, -58, 8, 15, 0, 40, C.stoneShade),
      ...pyramid(11, -58, 15, 48, 57, C.stoneShade, 8), box(-11, -58, 12, 12, 48, 70, C.stone), ...pyramid(-11, -58, 12, 70, 43, C.stoneShade, 8),
      box(0, -10, 16, 80, 0, 37, C.stone), box(0, -10, 14, 80, 37, 42, C.copper), box(0, -10, 8, 80, 42, 47, C.copper), box(0, -10, 3, 80, 47, 50, C.copper),
      box(-13, -5, 10, 90, 0, 18, C.stoneShade), box(13, -5, 10, 90, 0, 18, C.stoneShade),
      box(0, 25, 64, 14, 0, 37, C.stone), box(0, 25, 60, 10, 37, 46, C.copper),
      box(0, 45, 16, 30, 0, 37, C.stone), cyl(0, 58, 18, 0, 18, C.stoneShade), cyl(0, 60, 9, 18, 37, C.stone),
      box(0, 45, 12, 30, 37, 46, C.copper), cyl(0, 60, 6, 37, 44, C.copper),
    ]},
  ];

  // Repère local (mètres) → longitude/latitude, en tournant de « rot » autour du centre du monument.
  function toLngLat(l, [x, y]) {
    const r = l.rot * Math.PI / 180, east = x * Math.cos(r) + y * Math.sin(r), north = -x * Math.sin(r) + y * Math.cos(r);
    return [+(l.lng + east / (M * Math.cos(l.lat * Math.PI / 180))).toFixed(7), +(l.lat + north / M).toFixed(7)];
  }
  const distM = (lat1, lng1, lat2, lng2) => Math.hypot((lat2 - lat1) * M, (lng2 - lng1) * M * Math.cos(lat1 * Math.PI / 180));

  const Landmarks = {
    list: LANDMARKS,
    ids: new Set(LANDMARKS.map(l => l.id)),
    get: id => LANDMARKS.find(l => l.id === id),
    hidden: new Set(), base: null, busy: false,
    geojson() {
      const features = [];
      for (const l of LANDMARKS) for (const p of l.parts()) {
        const ring = p.ring.map(pt => toLngLat(l, pt));
        ring.push(ring[0]);
        features.push({type: 'Feature', geometry: {type: 'Polygon', coordinates: [ring]}, properties: {base: p.base, top: p.top, color: p.color, glass: p.glass ? 1 : 0}});
      }
      return {type: 'FeatureCollection', features};
    },
    // Ajoute les modèles à la carte (sous les épingles) et masque les immeubles d'origine en dessous.
    attach(map, beforeId) {
      this.hidden = new Set(); this.base = null;  // carte neuve (ou recréée)
      map.addSource('landmarks', {type: 'geojson', data: this.geojson()});
      const paint = op => ({'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-height': ['get', 'top'], 'fill-extrusion-base': ['get', 'base'], 'fill-extrusion-opacity': op, 'fill-extrusion-vertical-gradient': true});
      map.addLayer({id: 'lm-solid', type: 'fill-extrusion', source: 'landmarks', minzoom: 11, filter: ['==', ['get', 'glass'], 0], paint: paint(1)}, beforeId);
      map.addLayer({id: 'lm-glass', type: 'fill-extrusion', source: 'landmarks', minzoom: 11, filter: ['==', ['get', 'glass'], 1], paint: paint(0.72)}, beforeId);
      if (!map.getLayer('building-3d')) return;
      this.base = map.getFilter('building-3d');
      // Après chaque déplacement et chaque tuile chargée (l'animation des halos empêche d'attendre que la carte soit « au repos »).
      const src = map.getLayer('building-3d').source;
      let timer = null;
      const later = () => { clearTimeout(timer); timer = setTimeout(() => this.scan(map), 300); };
      map.on('moveend', later);
      map.on('sourcedata', e => { if (e.sourceId === src && e.tile) later(); });
    },
    scan(map) {
      if (this.busy || map.getZoom() < 13) return;
      const c = map.getCenter(), near = LANDMARKS.filter(l => l.hide && distM(c.lat, c.lng, l.lat, l.lng) < 6000);
      if (!near.length) return;
      this.busy = true;
      try {
        const src = map.getLayer('building-3d').source;
        let changed = false;
        for (const f of map.querySourceFeatures(src, {sourceLayer: 'building'})) {
          if (f.id === undefined || f.id === null || this.hidden.has(f.id)) continue;
          const g = f.geometry, ring = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0][0] : null;
          if (!ring) continue;
          let sx = 0, sy = 0;
          for (const p of ring) { sx += p[0]; sy += p[1]; }
          const lng = sx / ring.length, lat = sy / ring.length;
          if (near.some(l => distM(lat, lng, l.lat, l.lng) < l.hide)) { this.hidden.add(f.id); changed = true; }
        }
        if (changed) {
          const hide = ['!', ['in', ['id'], ['literal', [...this.hidden]]]];
          map.setFilter('building-3d', this.base ? ['all', this.base, hide] : hide);
        }
      } catch (e) { console.warn('landmarks', e); }
      this.busy = false;
    },
  };
  window.Landmarks = Landmarks;
})();
