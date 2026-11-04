/*
 * nombres/js/visuels.js — représentations visuelles (navigateur uniquement)
 * -------------------------------------------------------------------------
 * NombresVisuels.creer(spec) -> { element, valeur() }
 *   spec.type : 'barre' | 'disque' | 'secteur' | 'droite' | 'prefixes'
 *   barre / disque : { parts, colorees, interactif }  (interactif : on colorie en touchant)
 *   secteur        : { angle } (en degrés)
 *   droite         : { min, max, pas, points: [{ v, nom, label }], etiquettes: [valeurs], interactif }
 *   prefixes       : { prefixes: [{ nom, s, e }], surligne: symbole }
 * valeur() : nombre de parts coloriées (barre, disque), sinon null.
 */
(function (global) {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';
  var Maths = global.Maths;

  function el(nom, attrs, texte) {
    var n = document.createElement(nom);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (texte !== undefined) n.textContent = texte;
    return n;
  }
  function svg(nom, attrs) {
    var n = document.createElementNS(SVG, nom);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    return n;
  }
  function nombre(v) {
    try { return Maths.formaterNombre(Maths.Fraction.depuis(Number(Number(v).toFixed(6)))); } catch (e) { return String(v); }
  }

  /* ---------- Barre partagée ---------- */
  function barre(spec, annoncer) {
    var conteneur = el('div', { 'class': 'visuel-barre' + (spec.interactif ? ' interactif' : ''), role: spec.interactif ? 'group' : 'img',
      'aria-label': spec.interactif ? 'Barre partagée en ' + spec.parts + ' parts : touche une part pour la colorier' : 'Barre partagée en ' + spec.parts + ' parts, dont ' + spec.colorees + ' coloriées' });
    var etats = [];
    for (var i = 0; i < spec.parts; i++) {
      var on = i < (spec.colorees || 0);
      etats.push(on);
      var part;
      if (spec.interactif) {
        part = el('button', { type: 'button', 'class': 'part' + (on ? ' coloriee' : ''), 'aria-pressed': String(on), 'aria-label': 'Part ' + (i + 1) });
        (function (j, b) {
          b.addEventListener('click', function () {
            etats[j] = !etats[j];
            b.classList.toggle('coloriee', etats[j]);
            b.setAttribute('aria-pressed', String(etats[j]));
            annoncer(compter());
          });
        })(i, part);
      } else {
        part = el('span', { 'class': 'part' + (on ? ' coloriee' : '') });
      }
      conteneur.appendChild(part);
    }
    function compter() { return etats.filter(Boolean).length; }
    return { element: conteneur, valeur: compter };
  }

  /* ---------- Disque partagé ---------- */
  function cheminSecteur(cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.sin(a0), y0 = cy - r * Math.cos(a0);
    var x1 = cx + r * Math.sin(a1), y1 = cy - r * Math.cos(a1);
    var grand = a1 - a0 > Math.PI ? 1 : 0;
    return 'M' + cx + ',' + cy + ' L' + x0.toFixed(2) + ',' + y0.toFixed(2) + ' A' + r + ',' + r + ' 0 ' + grand + ' 1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' Z';
  }

  function disque(spec, annoncer) {
    var n = spec.parts;
    var s = svg('svg', { viewBox: '0 0 220 220', 'class': 'visuel-disque' + (spec.interactif ? ' interactif' : ''), role: spec.interactif ? 'group' : 'img',
      'aria-label': spec.interactif ? 'Disque partagé en ' + n + ' parts : touche une part pour la colorier' : 'Disque partagé en ' + n + ' parts, dont ' + (spec.colorees || 0) + ' coloriées' });
    var etats = [];
    for (var i = 0; i < n; i++) {
      var on = i < (spec.colorees || 0);
      etats.push(on);
      var a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n;
      var p = n === 1 ? svg('circle', { cx: 110, cy: 110, r: 100 }) : svg('path', { d: cheminSecteur(110, 110, 100, a0, a1) });
      p.setAttribute('class', 'secteur' + (on ? ' coloriee' : ''));
      if (spec.interactif) {
        p.setAttribute('tabindex', '0');
        p.setAttribute('role', 'button');
        p.setAttribute('aria-pressed', String(on));
        p.setAttribute('aria-label', 'Part ' + (i + 1));
        (function (j, chemin) {
          function basculer() {
            etats[j] = !etats[j];
            chemin.setAttribute('class', 'secteur' + (etats[j] ? ' coloriee' : ''));
            chemin.setAttribute('aria-pressed', String(etats[j]));
            annoncer(etats.filter(Boolean).length);
          }
          chemin.addEventListener('click', basculer);
          chemin.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculer(); }
          });
        })(i, p);
      }
      s.appendChild(p);
    }
    var cadre = el('div', { 'class': 'visuel-disque-cadre' });
    cadre.appendChild(s);
    return { element: cadre, valeur: function () { return etats.filter(Boolean).length; } };
  }

  function secteur(spec) {
    var a = Math.max(0, Math.min(360, spec.angle));
    var s = svg('svg', { viewBox: '0 0 220 220', 'class': 'visuel-disque', role: 'img', 'aria-label': 'Diagramme circulaire : secteur de ' + nombre(a) + ' degrés' });
    s.appendChild(svg('circle', { cx: 110, cy: 110, r: 100, 'class': 'secteur' }));
    if (a > 0) s.appendChild(a >= 360 ? svg('circle', { cx: 110, cy: 110, r: 100, 'class': 'secteur coloriee' }) : svg('path', { d: cheminSecteur(110, 110, 100, 0, a * Math.PI / 180), 'class': 'secteur coloriee' }));
    var cadre = el('div', { 'class': 'visuel-disque-cadre' });
    cadre.appendChild(s);
    return { element: cadre, valeur: function () { return null; } };
  }

  /* ---------- Droite numérique ---------- */
  function droite(spec) {
    var L = 400, H = 96, marge = 22, y = 52;
    var min = spec.min, max = spec.max;
    if (!(max > min)) max = min + 1;
    var pas = spec.pas || 1;
    var nTicks = Math.round((max - min) / pas);
    while (nTicks > 40) { pas *= 2; nTicks = Math.round((max - min) / pas); }
    function X(v) { return marge + (v - min) / (max - min) * (L - 2 * marge); }
    var s = svg('svg', { viewBox: '0 0 ' + L + ' ' + H, 'class': 'visuel-droite' + (spec.interactif ? ' interactif' : ''), role: 'img',
      'aria-label': 'Droite numérique de ' + nombre(min) + ' à ' + nombre(max) + (spec.points && spec.points.length ? ', avec les points ' + spec.points.map(function (p) { return p.nom; }).join(', ') : '') });
    s.appendChild(svg('line', { x1: marge - 10, y1: y, x2: L - marge + 12, y2: y, 'class': 'axe' }));
    s.appendChild(svg('path', { d: 'M' + (L - marge + 12) + ',' + y + ' l-9,-5 v10 z', 'class': 'fleche' }));
    var etiquettes = spec.etiquettes;
    for (var i = 0; i <= nTicks; i++) {
      var v = min + i * pas;
      var vr = Math.round(v * 1e6) / 1e6;
      var entier = Math.abs(vr - Math.round(vr)) < 1e-9;
      var grand = entier || (pas < 0.2 && Math.abs(vr * 2 - Math.round(vr * 2)) < 1e-9);
      s.appendChild(svg('line', { x1: X(v), y1: y - (grand ? 9 : 5), x2: X(v), y2: y + (grand ? 9 : 5), 'class': 'graduation' + (Math.abs(vr) < 1e-9 ? ' zero' : '') }));
      var afficher = etiquettes ? etiquettes.some(function (e) { return Math.abs(e - vr) < 1e-9; }) : (entier && (nTicks <= 24 || Math.round(vr) % 2 === 0));
      if (afficher) {
        var t = svg('text', { x: X(v), y: y + 28, 'text-anchor': 'middle', 'class': 'etiquette-droite' });
        t.textContent = nombre(vr);
        s.appendChild(t);
      }
    }
    (spec.points || []).forEach(function (p, k) {
      var x = X(p.v);
      s.appendChild(svg('circle', { cx: x, cy: y, r: 5, 'class': 'point' }));
      var t = svg('text', { x: x, y: y - 16 - (k % 2) * 0, 'text-anchor': 'middle', 'class': 'nom-point' });
      t.textContent = p.nom + (p.label ? ' (' + p.label.replace(/ /g, ' ') + ')' : '');
      s.appendChild(t);
    });
    var cadre = el('div', { 'class': 'visuel-droite-cadre' });
    cadre.appendChild(s);
    if (spec.interactif) {
      var lecture = el('p', { 'class': 'lecture-droite', 'aria-live': 'polite' }, 'Touche la droite pour placer un repère et lire sa position.');
      var marque = svg('g', { 'class': 'marque' });
      var ligne = svg('line', { x1: 0, y1: y - 18, x2: 0, y2: y + 18 });
      var texte = svg('text', { x: 0, y: H - 2, 'text-anchor': 'middle', 'class': 'etiquette-marque' });
      marque.appendChild(ligne); marque.appendChild(texte);
      marque.style.display = 'none';
      s.appendChild(marque);
      s.addEventListener('click', function (e) {
        var r = s.getBoundingClientRect();
        var xv = (e.clientX - r.left) / r.width * L;
        var v = min + (xv - marge) / (L - 2 * marge) * (max - min);
        var pasLecture = spec.pas || pas;
        v = Math.round(v / pasLecture) * pasLecture;
        v = Math.max(min, Math.min(max, v));
        ligne.setAttribute('x1', X(v)); ligne.setAttribute('x2', X(v));
        texte.setAttribute('x', Math.max(20, Math.min(L - 20, X(v))));
        texte.textContent = nombre(v);
        marque.style.display = '';
        lecture.textContent = 'Repère placé à ' + nombre(v) + '.';
      });
      cadre.appendChild(lecture);
    }
    return { element: cadre, valeur: function () { return null; } };
  }

  /* ---------- Tableau des préfixes ---------- */
  function prefixes(spec) {
    var cadre = el('div', { 'class': 'visuel-prefixes' });
    var table = el('table', { 'class': 'table-prefixes' });
    var cap = el('caption', {}, 'Préfixes et puissances de 10 (touche une ligne pour la mettre en évidence)');
    table.appendChild(cap);
    var thead = el('thead');
    var tr = el('tr');
    ['Préfixe', 'Symbole', 'Puissance', 'Facteur'].forEach(function (t) { tr.appendChild(el('th', { scope: 'col' }, t)); });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = el('tbody');
    var lignes = spec.prefixes.slice();
    // ligne de l'unité, entre kilo et centi
    var idx = lignes.findIndex(function (p) { return p.e < 0; });
    lignes.splice(idx, 0, { nom: '(unité)', s: '–', e: 0 });
    lignes.forEach(function (p) {
      var ligne = el('tr', { tabindex: '0' });
      if (p.s === spec.surligne) ligne.classList.add('surligne');
      ligne.appendChild(el('td', {}, p.nom));
      ligne.appendChild(el('td', {}, p.s));
      // sansNegatifs (10e niveau 1) : les puissances négatives ne sont pas encore vues
      ligne.appendChild(el('td', { 'class': 'maths' }, spec.sansNegatifs && p.e < 0 ? '—' : '10' + Maths.texteExposant(p.e)));
      ligne.appendChild(el('td', { 'class': 'maths' }, Maths.formaterNombre(new Maths.Fraction(10).puissance(p.e))));
      function basculer() { ligne.classList.toggle('surligne'); }
      ligne.addEventListener('click', basculer);
      ligne.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculer(); } });
      tbody.appendChild(ligne);
    });
    table.appendChild(tbody);
    cadre.appendChild(table);
    return { element: cadre, valeur: function () { return null; } };
  }

  function creer(spec, options) {
    options = options || {};
    var annoncer = options.surChangement || function () {};
    switch (spec.type) {
      case 'barre': return barre(spec, annoncer);
      case 'disque': return disque(spec, annoncer);
      case 'secteur': return secteur(spec);
      case 'droite': return droite(spec);
      case 'prefixes': return prefixes(spec);
    }
    return { element: el('div'), valeur: function () { return null; } };
  }

  global.NombresVisuels = { creer: creer };
})(typeof window !== 'undefined' ? window : globalThis);
