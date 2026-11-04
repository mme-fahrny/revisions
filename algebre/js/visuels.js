/*
 * algebre/js/visuels.js — outils visuels manipulables (navigateur seulement)
 * ---------------------------------------------------------------------------
 *   AlgebreVisuels.creer(def, options) -> { element, valeur?, detruire? }
 *
 *   def.type :
 *     'tuiles'    tuiles algébriques (x², x, 1 ; positives et négatives) pour réduire :
 *                 { mode: 'reduction', termes: [{ c, d }], lettre }
 *     'aire'      rectangle (a x + b)(c x + d) rempli de tuiles : { f1: [a, b], f2: [c, d], lettre }
 *     'balance'   balance des équations : { g, d, lettre }
 *     'machine'   machine à substituer : { expressions: [src], lettres, min, max, pas }
 *     'graphique' courbes et lecture de coordonnées : { courbes: [{ src, nom }], xmin, xmax, ymin, ymax }
 *     'figure'    figure géométrique cotée : { figure: { forme, ... } }
 *
 *   options.libre : true dans l'écran « Outils » (affiche plus d'informations).
 * Tous les contrôles sont des boutons (clic, toucher, clavier) ; les tuiles se
 * déplacent aussi au doigt (glisser une tuile sur une tuile opposée l'annule).
 */
(function (global) {
  'use strict';

  var Maths = global.Maths, P = global.AlgebrePoly, O = global.AlgebreOutils;
  var F = Maths.Fraction;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var compteur = 0;

  function el(nom, attrs, enfants) {
    var n = document.createElement(nom);
    for (var k in attrs || {}) {
      if (k === 'texte') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    }
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === 'string' ? document.createTextNode(e) : e); });
    return n;
  }
  function svg(nom, attrs, enfants) {
    var n = document.createElementNS(SVGNS, nom);
    for (var k in attrs || {}) {
      if (k === 'texte') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (enfants || []).forEach(function (e) { if (e) n.appendChild(e); });
    return n;
  }
  function id(prefixe) { compteur++; return prefixe + '-' + compteur; }

  /* =====================================================================
   * Tuiles algébriques : réduction
   * ===================================================================== */
  var NOMS_TUILES = function (lettre) { return { 2: lettre + '²', 1: lettre, 0: '1' }; };

  function tuilesReduction(def, options) {
    var lettre = def.lettre || 'x';
    var noms = NOMS_TUILES(lettre);
    var racine = el('div', { 'class': 'outil outil-tuiles' });
    var legende = el('p', { 'class': 'legende-tuiles' }, [
      el('span', { 'class': 'tuile-mini t2 positive', 'aria-hidden': 'true' }), ' ' + noms[2] + '   ',
      el('span', { 'class': 'tuile-mini t1 positive', 'aria-hidden': 'true' }), ' ' + noms[1] + '   ',
      el('span', { 'class': 'tuile-mini t0 positive', 'aria-hidden': 'true' }), ' 1   ',
      el('span', { 'class': 'tuile-mini t0 negative', 'aria-hidden': 'true' }), ' négative (signe –)'
    ]);
    var tapis = el('div', { 'class': 'tapis', role: 'group', 'aria-label': 'Tapis de tuiles' });
    var message = el('p', { 'class': 'message-outil', 'aria-live': 'polite' });
    var etat = { tuiles: [], selection: null, range: false };

    function initialiser() {
      etat.tuiles = [];
      var n = 0;
      def.termes.forEach(function (t, i) {
        for (var k = 0; k < Math.abs(t.c); k++) etat.tuiles.push({ id: n++, d: t.d, signe: t.c < 0 ? -1 : 1, groupe: i });
      });
      etat.selection = null;
      etat.range = false;
      message.textContent = 'Touche une tuile, puis une tuile opposée de même forme pour les annuler. Tu peux aussi glisser une tuile sur l\'autre.';
      dessiner();
    }

    function bilan() {
      var s = { 2: 0, 1: 0, 0: 0 };
      etat.tuiles.forEach(function (t) { s[t.d] += t.signe; });
      return s;
    }
    function texteBilan() {
      var b = bilan();
      var termes = [];
      [2, 1, 0].forEach(function (d) { if (b[d]) { var l = {}; if (d) l[lettre] = d; termes.push({ c: new F(b[d]), l: l }); } });
      return termes.length ? P.texte(termes) : '0';
    }

    function creerTuile(t) {
      var b = el('button', {
        type: 'button',
        'class': 'tuile t' + t.d + (t.signe < 0 ? ' negative' : ' positive') + (etat.selection === t.id ? ' choisie' : ''),
        'data-tuile': String(t.id), 'data-forme': String(t.d), 'data-signe': String(t.signe),
        'aria-label': (t.signe < 0 ? 'moins ' : '') + noms[t.d] + (etat.selection === t.id ? ', choisie' : ''),
        'aria-pressed': etat.selection === t.id ? 'true' : 'false'
      }, [el('span', { 'aria-hidden': 'true', texte: (t.signe < 0 ? '–' : '') + noms[t.d] })]);
      b.addEventListener('click', function () { toucher(t.id); });
      glisser(b, t);
      return b;
    }

    function dessiner() {
      tapis.innerHTML = '';
      if (!etat.tuiles.length) {
        tapis.appendChild(el('p', { 'class': 'tapis-vide', texte: 'Tapis vide : l\'expression vaut 0.' }));
      } else if (etat.range) {
        [2, 1, 0].forEach(function (d) {
          var ligne = el('div', { 'class': 'rangee-tuiles' });
          etat.tuiles.filter(function (t) { return t.d === d; })
            .sort(function (a, b) { return b.signe - a.signe; })
            .forEach(function (t) { ligne.appendChild(creerTuile(t)); });
          if (ligne.childNodes.length) tapis.appendChild(ligne);
        });
      } else {
        var groupes = {};
        etat.tuiles.forEach(function (t) { (groupes[t.groupe] = groupes[t.groupe] || []).push(t); });
        Object.keys(groupes).sort(function (a, b) { return a - b; }).forEach(function (g) {
          var grp = el('div', { 'class': 'groupe-tuiles' });
          groupes[g].forEach(function (t) { grp.appendChild(creerTuile(t)); });
          tapis.appendChild(grp);
        });
      }
      if (options.libre) total.textContent = 'Sur le tapis : ' + texteBilan();
    }

    function trouver(idT) { for (var i = 0; i < etat.tuiles.length; i++) if (etat.tuiles[i].id === idT) return etat.tuiles[i]; return null; }

    function annuler(a, b) {
      etat.tuiles = etat.tuiles.filter(function (t) { return t !== a && t !== b; });
      etat.selection = null;
      message.textContent = noms[a.d] + ' et – ' + noms[a.d] + ' : leur somme est nulle, les deux tuiles disparaissent.';
      dessiner();
    }

    function toucher(idT) {
      var t = trouver(idT);
      if (!t) return;
      if (etat.selection === null || etat.selection === idT) {
        etat.selection = etat.selection === idT ? null : idT;
        message.textContent = etat.selection === null ? '' : 'Tuile ' + (t.signe < 0 ? '– ' : '') + noms[t.d] + ' choisie : touche une tuile opposée de même forme.';
        dessiner();
        focusTuile(idT);
        return;
      }
      var s = trouver(etat.selection);
      essayerAnnuler(s, t);
    }
    function essayerAnnuler(s, t) {
      if (!s || !t || s === t) return;
      if (s.d === t.d && s.signe !== t.signe) { annuler(s, t); return; }
      if (s.d !== t.d) message.textContent = noms[s.d] + ' et ' + noms[t.d] + ' ne sont pas semblables : on ne peut pas les additionner (ni les annuler).';
      else message.textContent = 'Ces deux tuiles ont le même signe : elles ne s\'annulent pas, elles s\'additionnent.';
      etat.selection = t.id;
      dessiner();
      focusTuile(t.id);
    }
    function focusTuile(idT) {
      var b = tapis.querySelector('[data-tuile="' + idT + '"]');
      if (b) b.focus({ preventScroll: true });
    }

    /* glisser au doigt ou à la souris (événements de pointeur) */
    function glisser(bouton, t) {
      var depart = null, fantome = null;
      bouton.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        depart = { x: e.clientX, y: e.clientY, id: e.pointerId };
      });
      bouton.addEventListener('pointermove', function (e) {
        if (!depart || e.pointerId !== depart.id) return;
        var dx = e.clientX - depart.x, dy = e.clientY - depart.y;
        if (!fantome && Math.abs(dx) + Math.abs(dy) > 10) {
          try { bouton.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
          fantome = bouton;
          fantome.classList.add('glisse');
        }
        if (fantome) fantome.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      function fin(e) {
        if (!depart) return;
        var deplace = !!fantome;
        if (fantome) { fantome.style.transform = ''; fantome.classList.remove('glisse'); }
        fantome = null;
        depart = null;
        if (!deplace) return;
        bouton.style.visibility = 'hidden';
        var cible = document.elementFromPoint(e.clientX, e.clientY);
        bouton.style.visibility = '';
        var b = cible && cible.closest ? cible.closest('[data-tuile]') : null;
        if (b && tapis.contains(b)) essayerAnnuler(t, trouver(Number(b.getAttribute('data-tuile'))));
        // le clic qui suit un glisser ne doit pas sélectionner
        bouton.addEventListener('click', function stop(ev) { ev.stopImmediatePropagation(); bouton.removeEventListener('click', stop, true); }, { capture: true, once: true });
      }
      bouton.addEventListener('pointerup', fin);
      bouton.addEventListener('pointercancel', function () {
        if (fantome) { fantome.style.transform = ''; fantome.classList.remove('glisse'); }
        fantome = null; depart = null;
      });
    }

    var total = el('p', { 'class': 'total-tuiles', 'aria-live': 'polite' });
    var actions = el('div', { 'class': 'actions actions-outil' }, [
      el('button', { type: 'button', 'class': 'bouton-secondaire', 'data-action': 'ranger', texte: 'Regrouper les tuiles semblables', onclick: function () { etat.range = true; etat.selection = null; message.textContent = 'Les tuiles semblables sont rangées sur une même ligne.'; dessiner(); } }),
      el('button', { type: 'button', 'class': 'bouton-discret', 'data-action': 'recommencer', texte: 'Recommencer', onclick: initialiser })
    ]);
    racine.appendChild(legende);
    racine.appendChild(tapis);
    racine.appendChild(actions);
    racine.appendChild(message);
    if (options.libre) racine.appendChild(total);
    initialiser();
    return { element: racine, bilan: bilan, texte: texteBilan };
  }

  /* =====================================================================
   * Tuiles algébriques : aire d'un rectangle (a x + b)(c x + d)
   * ===================================================================== */
  function tuilesAire(def, options) {
    var lettre = def.lettre || 'x';
    var X = 3, U = 1; // longueurs relatives d'une tuile x et d'une tuile 1
    function morceaux(f) {
      var t = [];
      for (var i = 0; i < Math.abs(f[0]); i++) t.push({ d: 1, signe: f[0] < 0 ? -1 : 1 });
      for (var j = 0; j < Math.abs(f[1]); j++) t.push({ d: 0, signe: f[1] < 0 ? -1 : 1 });
      return t;
    }
    var lignes = morceaux(def.f1), colonnes = morceaux(def.f2);
    var marge = 1.6;
    var larg = colonnes.reduce(function (s, c) { return s + (c.d ? X : U); }, 0);
    var haut = lignes.reduce(function (s, c) { return s + (c.d ? X : U); }, 0);
    var echelle = 20;
    var W = (larg + marge) * echelle, H = (haut + marge) * echelle;
    var racine = el('div', { 'class': 'outil outil-aire' });
    var titre = el('p', { 'class': 'legende-tuiles' }, ['Rectangle de côtés ', el('span', { 'class': 'maths', texte: tx(def.f1) }), ' et ', el('span', { 'class': 'maths', texte: tx(def.f2) }), '. Touche une case pour y placer la tuile produit.']);
    var dessin = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'svg-aire', role: 'group', 'aria-label': 'Rectangle des produits' });
    var message = el('p', { 'class': 'message-outil', 'aria-live': 'polite' });
    var remplies = 0, total = lignes.length * colonnes.length;
    var cellules = [];
    function nom(d) { return d === 2 ? lettre + '²' : (d === 1 ? lettre : '1'); }
    // en-têtes
    var x = marge * echelle;
    colonnes.forEach(function (c) {
      var w = (c.d ? X : U) * echelle;
      dessin.appendChild(svg('rect', { x: x + 1, y: 2, width: w - 2, height: marge * echelle - 6, 'class': 'tuile-svg ' + (c.signe < 0 ? 'negative' : 'positive') }));
      dessin.appendChild(svg('text', { x: x + w / 2, y: marge * echelle / 2 + 3, 'class': 'texte-tuile', texte: (c.signe < 0 ? '–' : '') + nom(c.d) }));
      x += w;
    });
    var y = marge * echelle;
    lignes.forEach(function (l) {
      var h = (l.d ? X : U) * echelle;
      dessin.appendChild(svg('rect', { x: 2, y: y + 1, width: marge * echelle - 6, height: h - 2, 'class': 'tuile-svg ' + (l.signe < 0 ? 'negative' : 'positive') }));
      dessin.appendChild(svg('text', { x: marge * echelle / 2 - 1, y: y + h / 2 + 4, 'class': 'texte-tuile', texte: (l.signe < 0 ? '–' : '') + nom(l.d) }));
      var x2 = marge * echelle;
      colonnes.forEach(function (c) {
        var w = (c.d ? X : U) * echelle;
        var d = l.d + c.d, signe = l.signe * c.signe;
        var g = svg('g', { 'class': 'case-aire', tabindex: '0', role: 'button', 'data-case': String(cellules.length), 'aria-label': 'case vide : ' + (l.signe < 0 ? '– ' : '') + nom(l.d) + ' fois ' + (c.signe < 0 ? '– ' : '') + nom(c.d) });
        var r = svg('rect', { x: x2 + 1, y: y + 1, width: w - 2, height: h - 2, 'class': 'case-vide' });
        var t = svg('text', { x: x2 + w / 2, y: y + h / 2 + 4, 'class': 'texte-tuile', texte: '' });
        g.appendChild(r); g.appendChild(t);
        var cel = { g: g, r: r, t: t, d: d, signe: signe, pleine: false };
        cellules.push(cel);
        function remplir() {
          if (cel.pleine) return;
          cel.pleine = true; remplies++;
          r.setAttribute('class', 'tuile-svg ' + (signe < 0 ? 'negative' : 'positive'));
          t.textContent = (signe < 0 ? '–' : '') + nom(d);
          g.setAttribute('aria-label', 'case remplie : ' + (signe < 0 ? '– ' : '') + nom(d));
          message.textContent = (l.signe < 0 ? '(– ' : '') + nom(l.d) + (l.signe < 0 ? ')' : '') + ' · ' + (c.signe < 0 ? '(– ' : '') + nom(c.d) + (c.signe < 0 ? ')' : '') + ' = ' + (signe < 0 ? '– ' : '') + nom(d) + '. ' + (remplies === total ? 'Le rectangle est rempli : ' + resume() : remplies + ' case' + (remplies > 1 ? 's' : '') + ' sur ' + total + '.');
        }
        g.addEventListener('click', remplir);
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remplir(); } });
        dessin.appendChild(g);
        x2 += w;
      });
      y += h;
    });
    function resume() {
      var s = { 2: 0, 1: 0, 0: 0 };
      cellules.forEach(function (c) { s[c.d] += c.signe; });
      var parties = [];
      [2, 1, 0].forEach(function (d) {
        var n = cellules.filter(function (c) { return c.d === d; }).length;
        if (n) parties.push(n + ' tuile' + (n > 1 ? 's' : '') + ' ' + nom(d));
      });
      return parties.join(', ') + (options.libre ? '. Aire = ' + P.texte(P.fois(O.lin(def.f1[0], def.f1[1], lettre), O.lin(def.f2[0], def.f2[1], lettre))) : '') + '.';
    }
    racine.appendChild(titre);
    racine.appendChild(el('div', { 'class': 'cadre-svg' }, [dessin]));
    racine.appendChild(el('div', { 'class': 'actions actions-outil' }, [
      el('button', { type: 'button', 'class': 'bouton-secondaire', 'data-action': 'remplir', texte: 'Remplir tout le rectangle', onclick: function () { cellules.forEach(function (c) { if (!c.pleine) c.g.dispatchEvent(new Event('click')); }); } })
    ]));
    racine.appendChild(message);
    function tx(f) { return P.texte(O.lin(f[0], f[1], lettre)); }
    return { element: racine, remplies: function () { return remplies; } };
  }

  /* =====================================================================
   * Balance des équations
   * ===================================================================== */
  var OPERATIONS = [
    { id: 'plus', signe: '+', texte: 'ajouter', regle: 2 },
    { id: 'moins', signe: '–', texte: 'soustraire', regle: 2 },
    { id: 'fois', signe: '·', texte: 'multiplier', regle: 3 },
    { id: 'div', signe: ':', texte: 'diviser', regle: 3 }
  ];

  function balance(def, options) {
    var lettre = def.lettre || 'x';
    var lx = {}; lx[lettre] = 1;
    var depart = { g: def.g, d: def.d };
    var etat = { G: P.depuis(def.g), D: P.depuis(def.d), brut: true, historique: [], operation: 'moins' };
    var racine = el('div', { 'class': 'outil outil-balance' });
    var nomGroupe = id('op');

    // dessin
    var plateauG = el('div', { 'class': 'plateau plateau-g' });
    var plateauD = el('div', { 'class': 'plateau plateau-d' });
    var fleau = el('div', { 'class': 'fleau' }, [plateauG, el('div', { 'class': 'egal', 'aria-hidden': 'true', texte: '=' }), plateauD]);
    var scene = el('div', { 'class': 'scene-balance', role: 'img' }, [fleau, el('div', { 'class': 'pied-balance', 'aria-hidden': 'true' })]);
    var etatTexte = el('p', { 'class': 'etat-balance', 'aria-live': 'polite' });

    // commandes
    var radios = el('div', { 'class': 'choix-operation', role: 'radiogroup', 'aria-label': 'Opération' });
    OPERATIONS.forEach(function (o) {
      var idr = id('op-' + o.id);
      var input = el('input', { type: 'radio', name: nomGroupe, id: idr, value: o.id });
      if (o.id === etat.operation) input.checked = true;
      input.addEventListener('change', function () { etat.operation = o.id; });
      radios.appendChild(el('label', { 'for': idr, 'class': 'option-operation', 'data-operation': o.id }, [input, el('span', { 'class': 'signe-operation', 'aria-hidden': 'true', texte: o.signe }), el('span', { texte: o.texte })]));
    });
    var champ = el('input', { type: 'text', 'class': 'champ champ-court maths', 'aria-label': 'Nombre ou terme (par exemple 3 ou 2x)', placeholder: 'ex. 3 ou 2' + lettre, autocomplete: 'off', inputmode: 'text' });
    var caseG = el('input', { type: 'checkbox', id: id('mg'), checked: 'checked' });
    var caseD = el('input', { type: 'checkbox', id: id('md'), checked: 'checked' });
    var membres = el('div', { 'class': 'choix-membres' }, [
      el('label', { 'for': caseG.id, 'class': 'option-membre' }, [caseG, ' membre de gauche']),
      el('label', { 'for': caseD.id, 'class': 'option-membre' }, [caseD, ' membre de droite'])
    ]);
    var message = el('p', { 'class': 'message-outil', role: 'status', 'aria-live': 'polite' });
    var historique = el('ol', { 'class': 'historique-balance' });
    var zoneVerif = el('div', { 'class': 'verif-substitution', hidden: 'hidden' });

    var boutonAppliquer = el('button', { type: 'button', 'class': 'bouton', 'data-action': 'appliquer', texte: 'Appliquer', onclick: appliquer });
    var boutonReduire = el('button', { type: 'button', 'class': 'bouton-secondaire', 'data-action': 'reduire', texte: 'Développer et réduire (règle 1)', onclick: reduire });
    var boutonAnnuler = el('button', { type: 'button', 'class': 'bouton-discret', 'data-action': 'annuler', texte: 'Annuler la dernière opération', onclick: annulerDerniere });
    champ.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); appliquer(); } });

    // touches rapides (au doigt, sans clavier)
    var rapides = el('div', { 'class': 'touches-rapides', 'aria-label': 'Valeurs rapides' });
    function majRapides() {
      rapides.innerHTML = '';
      var vals = [];
      var a = P.coef(etat.G, lx), b = P.coef(etat.G, {}), c = P.coef(etat.D, lx), d = P.coef(etat.D, {});
      [c, a].forEach(function (k) { if (!k.estZero()) vals.push(P.srcMonome({ c: k.abs(), l: lx })); });
      [b, d].forEach(function (k) { if (!k.estZero()) vals.push(k.abs().toString()); });
      var coef = a.moins(c);
      if (!coef.estZero() && !coef.abs().egal(1)) vals.push(coef.abs().toString());
      vals.filter(function (v, i, t) { return t.indexOf(v) === i; }).slice(0, 5).forEach(function (v) {
        rapides.appendChild(el('button', { type: 'button', 'class': 'touche-rapide maths', 'data-valeur': v, texte: Maths.versTexte(v), onclick: function () { champ.value = Maths.versTexte(v); } }));
      });
    }

    function texteMembre(p, brut, src) { return brut ? Maths.versTexte(src) : P.texte(p); }
    function dessiner(penche) {
      plateauG.textContent = texteMembre(etat.G, etat.brut, depart.g);
      plateauD.textContent = texteMembre(etat.D, etat.brut, depart.d);
      scene.setAttribute('aria-label', 'Balance en équilibre : ' + plateauG.textContent + ' = ' + plateauD.textContent);
      fleau.classList.remove('penche-g', 'penche-d');
      if (penche) {
        void fleau.offsetWidth;
        fleau.classList.add(penche);
        setTimeout(function () { fleau.classList.remove(penche); }, 1400);
      }
      majRapides();
      fin();
    }
    function ajouterHistorique(texte) {
      etat.historique.push({ G: etat.G, D: etat.D, brut: etat.brut });
      historique.appendChild(el('li', { html: texte }));
    }

    function lireTerme(t) {
      var p = P.depuis(Maths.analyser(t));
      if (p.length > 1) throw new Error('Un seul nombre ou un seul terme, par exemple 3 ou 2' + lettre + '.');
      var m = p[0] || { c: new F(0), l: {} };
      var ls = Object.keys(m.l);
      if (ls.some(function (k) { return k !== lettre; }) || (m.l[lettre] || 0) > 1) throw new Error('Choisis un nombre ou un terme en ' + lettre + ' (par exemple 3 ou 2' + lettre + ').');
      return p;
    }

    function appliquer() {
      var o = OPERATIONS.filter(function (x) { return x.id === etat.operation; })[0];
      var t = champ.value.trim();
      if (!t) { message.className = 'message-outil info'; message.textContent = 'Écris le nombre ou le terme (par exemple 3 ou 2' + lettre + ').'; champ.focus(); return; }
      var terme;
      try { terme = lireTerme(t); } catch (e) {
        message.className = 'message-outil faux';
        message.textContent = e instanceof Maths.ErreurSaisie ? e.message : (e.message || 'Saisie illisible.');
        return;
      }
      var avecLettre = terme.length && terme[0].l[lettre];
      var g = caseG.checked, d = caseD.checked;
      if (!g && !d) { message.className = 'message-outil info'; message.textContent = 'Coche les deux membres.'; return; }
      if (g !== d) {
        message.className = 'message-outil faux';
        message.textContent = 'Refusé : l\'opération doit être appliquée aux DEUX membres. Sinon l\'égalité n\'est plus vraie : regarde, la balance penche !';
        dessiner(g ? 'penche-g' : 'penche-d');
        return;
      }
      if ((o.id === 'fois' || o.id === 'div') && P.estZero(terme)) {
        message.className = 'message-outil faux';
        message.textContent = o.id === 'div' ? 'Refusé : on ne peut pas diviser par 0.' : 'Refusé : multiplier par 0 donne 0 = 0, on perd toute l\'information. La règle (3) demande un nombre NON NUL.';
        return;
      }
      if ((o.id === 'fois' || o.id === 'div') && avecLettre) {
        message.className = 'message-outil faux';
        message.textContent = 'Refusé : multiplier ou diviser par l\'inconnue ne donne pas une équation équivalente (' + lettre + ' peut valoir 0). Exemple : ' + lettre + '² = ' + lettre + ' a deux solutions, 0 et 1 ; en divisant par ' + lettre + ', on obtient ' + lettre + ' = 1 et on perd la solution 0.';
        return;
      }
      if (etat.brut && (o.id === 'fois' || o.id === 'div') && (Maths.versTexte(depart.g) !== P.texte(etat.G) || Maths.versTexte(depart.d) !== P.texte(etat.D))) {
        // on accepte, en développant d'abord
        etat.brut = false;
      }
      var G = etat.G, D = etat.D;
      if (o.id === 'plus') { G = P.plus(G, terme); D = P.plus(D, terme); }
      else if (o.id === 'moins') { G = P.moins(G, terme); D = P.moins(D, terme); }
      else if (o.id === 'fois') { G = P.fois(G, terme); D = P.fois(D, terme); }
      else { var inv = P.constante(new F(1).divise(terme[0].c)); G = P.fois(G, inv); D = P.fois(D, inv); }
      var nomOp = { plus: 'ajoute ', moins: 'soustrait ', fois: 'multiplie les deux membres par ', div: 'divise les deux membres par ' }[o.id];
      var tt = P.texte(terme);
      ajouterHistorique('Règle (' + o.regle + ') : on ' + nomOp + (o.id === 'plus' || o.id === 'moins' ? tt + ' aux deux membres' : (terme[0].c.signe() < 0 ? '(' + tt + ')' : tt)) + ' → <span class="maths">' + O.echapper(P.texte(G) + ' = ' + P.texte(D)) + '</span>');
      etat.G = G; etat.D = D; etat.brut = false;
      message.className = 'message-outil juste';
      message.textContent = 'La même opération des deux côtés : la balance reste en équilibre.';
      champ.value = '';
      dessiner();
    }

    function reduire() {
      if (!etat.brut) { message.className = 'message-outil info'; message.textContent = 'Les deux membres sont déjà réduits.'; return; }
      ajouterHistorique('Règle (1) : on développe et on réduit chaque membre → <span class="maths">' + O.echapper(P.texte(etat.G) + ' = ' + P.texte(etat.D)) + '</span>');
      etat.brut = false;
      message.className = 'message-outil juste';
      message.textContent = 'Chaque membre est développé et réduit : la balance reste en équilibre.';
      dessiner();
    }

    function annulerDerniere() {
      var h = etat.historique.pop();
      if (!h) return;
      historique.removeChild(historique.lastChild);
      etat.G = h.G; etat.D = h.D; etat.brut = h.brut;
      message.className = 'message-outil';
      message.textContent = 'Dernière opération annulée.';
      dessiner();
    }

    function isole(A, B) {
      // A = lettre seule, B = constante
      return A.length === 1 && A[0].c.egal(1) && P.cle(A[0].l) === P.cle(lx) && P.lettres(B).length === 0;
    }
    function fin() {
      var sol = null;
      if (isole(etat.G, etat.D)) sol = P.coef(etat.D, {});
      else if (isole(etat.D, etat.G)) sol = P.coef(etat.G, {});
      etatTexte.textContent = '';
      zoneVerif.hidden = true;
      if (sol) {
        etatTexte.textContent = 'Bravo : ' + lettre + ' est isolé. La solution est ' + lettre + ' = ' + O.tn(sol) + '. Vérifie-la par substitution.';
        preparerVerification(sol);
      } else if (!etat.brut && P.lettres(etat.G.concat(etat.D)).indexOf(lettre) < 0) {
        var eg = P.egal(etat.G, etat.D);
        etatTexte.textContent = eg ? 'On obtient une égalité toujours vraie : tous les nombres sont solutions (S = ℝ).' : 'On obtient une égalité fausse : l\'équation n\'a pas de solution (S = { }).';
      }
    }
    function preparerVerification(sol) {
      zoneVerif.innerHTML = '';
      zoneVerif.hidden = false;
      var v = {}; v[lettre] = sol;
      var cg = el('input', { type: 'text', 'class': 'champ champ-court maths', 'aria-label': 'Valeur du membre de gauche', autocomplete: 'off', 'data-verif': 'g' });
      var cd = el('input', { type: 'text', 'class': 'champ champ-court maths', 'aria-label': 'Valeur du membre de droite', autocomplete: 'off', 'data-verif': 'd' });
      var retour = el('p', { 'class': 'message-outil', 'aria-live': 'polite' });
      zoneVerif.appendChild(el('p', {}, [el('strong', { texte: 'Vérification par substitution. ' }), 'Remplace ' + lettre + ' par ' + O.tn(sol) + ' dans l\'équation de départ et calcule chaque membre.']));
      zoneVerif.appendChild(el('div', { 'class': 'ligne-verif' }, [el('span', { 'class': 'maths', texte: O.substituerTexte(depart.g, v) + ' =' }), cg]));
      zoneVerif.appendChild(el('div', { 'class': 'ligne-verif' }, [el('span', { 'class': 'maths', texte: O.substituerTexte(depart.d, v) + ' =' }), cd]));
      zoneVerif.appendChild(el('div', { 'class': 'actions actions-outil' }, [el('button', { type: 'button', 'class': 'bouton-secondaire', 'data-action': 'verifier-substitution', texte: 'Vérifier les deux membres', onclick: function () {
        var vg = Maths.evaluer(depart.g, v), vd = Maths.evaluer(depart.d, v);
        function ok(champ, attendu) {
          try { var lu = Maths.evaluer(champ.value || 'x', {}); return lu.egal(attendu); } catch (e) { return false; }
        }
        var bonG = ok(cg, vg), bonD = ok(cd, vd);
        cg.classList.toggle('champ-faux', !bonG); cd.classList.toggle('champ-faux', !bonD);
        if (bonG && bonD) { retour.className = 'message-outil juste'; retour.textContent = 'Juste : les deux membres valent ' + O.tn(vg) + '. La solution est vérifiée.'; }
        else retour.className = 'message-outil faux', retour.textContent = (bonG ? '' : 'Le membre de gauche n\'est pas juste. ') + (bonD ? '' : 'Le membre de droite n\'est pas juste. ') + 'Respecte les priorités : puissances, produits, puis sommes.';
      } })]));
      zoneVerif.appendChild(retour);
    }

    racine.appendChild(el('p', { 'class': 'petit', texte: 'Équation de départ : ' + Maths.versTexte(depart.g) + ' = ' + Maths.versTexte(depart.d) }));
    racine.appendChild(scene);
    racine.appendChild(etatTexte);
    racine.appendChild(el('fieldset', { 'class': 'commandes-balance' }, [
      el('legend', { texte: 'Opération à appliquer' }), radios,
      el('div', { 'class': 'ligne-terme' }, [champ, rapides]),
      membres,
      el('div', { 'class': 'actions actions-outil' }, [boutonAppliquer, boutonReduire, boutonAnnuler])
    ]));
    racine.appendChild(message);
    racine.appendChild(el('details', { 'class': 'details-historique', open: 'open' }, [el('summary', { texte: 'Étapes réalisées' }), historique]));
    racine.appendChild(zoneVerif);
    dessiner();
    return { element: racine, equation: function () { return P.texte(etat.G) + ' = ' + P.texte(etat.D); } };
  }

  /* =====================================================================
   * Machine à substituer
   * ===================================================================== */
  function machine(def, options) {
    var racine = el('div', { 'class': 'outil outil-machine' });
    var valeurs = {};
    var min = def.min === undefined ? -10 : def.min, max = def.max === undefined ? 10 : def.max, pas = def.pas || 1;
    var lettres = def.lettres && def.lettres.length ? def.lettres : Maths.lettres(def.expressions.join('+'));
    var noms = def.noms || (def.expressions.length > 1 ? ['A', 'B', 'C'] : ['E']);
    var curseurs = el('div', { 'class': 'curseurs-machine' });
    var sorties = el('div', { 'class': 'sorties-machine', 'aria-live': 'polite' });
    lettres.forEach(function (l, i) {
      valeurs[l] = i === 0 ? 2 : 1;
      var idc = id('curseur-' + l);
      var aff = el('output', { 'for': idc, 'class': 'valeur-curseur maths', texte: l + ' = ' + O.tn(valeurs[l]) });
      var r = el('input', { type: 'range', id: idc, min: String(min), max: String(max), step: String(pas), value: String(valeurs[l]), 'data-lettre': l, 'aria-label': 'Valeur de ' + l });
      function regler(v) {
        v = Math.max(min, Math.min(max, Math.round(v / pas) * pas));
        valeurs[l] = Number(v.toFixed(4));
        r.value = String(valeurs[l]);
        aff.textContent = l + ' = ' + O.tn(F.depuis(String(valeurs[l]))).replace(/^–/, '– ');
        calculer();
      }
      r.addEventListener('input', function () { regler(Number(r.value)); });
      var moinsB = el('button', { type: 'button', 'class': 'bouton-discret bouton-pas', 'data-pas': '-' + l, 'aria-label': 'Diminuer ' + l, texte: '–', onclick: function () { regler(valeurs[l] - pas); } });
      var plusB = el('button', { type: 'button', 'class': 'bouton-discret bouton-pas', 'data-pas': '+' + l, 'aria-label': 'Augmenter ' + l, texte: '+', onclick: function () { regler(valeurs[l] + pas); } });
      curseurs.appendChild(el('div', { 'class': 'ligne-curseur' }, [aff, moinsB, r, plusB]));
    });
    function calculer() {
      sorties.innerHTML = '';
      var v = {};
      lettres.forEach(function (l) { v[l] = F.depuis(String(valeurs[l])); });
      var res = [];
      def.expressions.forEach(function (src, i) {
        var ligne = el('div', { 'class': 'sortie' });
        ligne.appendChild(el('p', { 'class': 'sortie-expression maths', texte: noms[i] + ' = ' + Maths.versTexte(src) }));
        try {
          var r = Maths.evaluer(src, v);
          res.push(r);
          ligne.appendChild(el('p', { 'class': 'sortie-calcul maths' }, [O.substituerTexte(src, v) + ' = ', el('strong', { 'data-resultat': String(i), texte: O.tn(r) })]));
        } catch (e) {
          res.push(null);
          ligne.appendChild(el('p', { 'class': 'sortie-calcul', texte: 'Calcul impossible pour cette valeur (division par 0 ?).' }));
        }
        sorties.appendChild(ligne);
      });
      if (def.expressions.length === 2 && res[0] && res[1]) {
        var eg = res[0].egal(res[1]);
        sorties.appendChild(el('p', { 'class': 'comparaison ' + (eg ? 'egales' : 'differentes'), texte: eg ? 'Pour ces valeurs, A et B ont la même valeur.' : 'Pour ces valeurs, A ≠ B : c\'est un contre-exemple !' }));
      }
    }
    racine.appendChild(el('p', { 'class': 'legende-tuiles', texte: 'Fais varier ' + (lettres.length > 1 ? 'les lettres' : 'la lettre') + ' : la machine remplace par la valeur choisie et calcule.' }));
    racine.appendChild(curseurs);
    racine.appendChild(sorties);
    calculer();
    return { element: racine, valeurs: valeurs };
  }

  /* =====================================================================
   * Graphique (résolution graphique)
   * ===================================================================== */
  function graphique(def, options) {
    var xmin = def.xmin, xmax = def.xmax, ymin = def.ymin, ymax = def.ymax;
    var u = 24, W = (xmax - xmin) * u, H = (ymax - ymin) * u;
    var marge = 14;
    function X(x) { return marge + (x - xmin) * u; }
    function Y(y) { return marge + (ymax - y) * u; }
    var s = svg('svg', { viewBox: '0 0 ' + (W + 2 * marge) + ' ' + (H + 2 * marge), 'class': 'svg-graphique', role: 'img', 'aria-label': 'Graphique des fonctions ' + def.courbes.map(function (c) { return c.nom + '(x) = ' + Maths.versTexte(c.src); }).join(' et ') });
    var grille = svg('g', { 'class': 'grille' });
    for (var x = xmin; x <= xmax; x++) grille.appendChild(svg('line', { x1: X(x), y1: Y(ymin), x2: X(x), y2: Y(ymax), 'class': x === 0 ? 'axe' : 'ligne-grille' }));
    for (var y = ymin; y <= ymax; y++) grille.appendChild(svg('line', { x1: X(xmin), y1: Y(y), x2: X(xmax), y2: Y(y), 'class': y === 0 ? 'axe' : 'ligne-grille' }));
    s.appendChild(grille);
    var etiquettes = svg('g', { 'class': 'etiquettes-axes' });
    for (var ex = xmin + 1; ex < xmax; ex++) if (ex !== 0 && ex % 2 === 0) etiquettes.appendChild(svg('text', { x: X(ex), y: Y(0) + 15, texte: ex < 0 ? '–' + (-ex) : String(ex) }));
    for (var ey = ymin + 1; ey < ymax; ey++) if (ey !== 0 && ey % 2 === 0) etiquettes.appendChild(svg('text', { x: X(0) - 6, y: Y(ey) + 4, 'text-anchor': 'end', texte: ey < 0 ? '–' + (-ey) : String(ey) }));
    etiquettes.appendChild(svg('text', { x: X(xmax) - 4, y: Y(0) - 6, 'text-anchor': 'end', texte: 'x' }));
    etiquettes.appendChild(svg('text', { x: X(0) + 6, y: Y(ymax) + 12, texte: 'y' }));
    etiquettes.appendChild(svg('text', { x: X(1), y: Y(0) + 15, texte: '1' }));
    s.appendChild(etiquettes);
    var clip = id('clip');
    s.appendChild(svg('defs', {}, [svg('clipPath', { id: clip }, [svg('rect', { x: X(xmin), y: Y(ymax), width: W, height: H })])]));
    def.courbes.forEach(function (c, i) {
      var pts = [];
      for (var k = 0; k <= 240; k++) {
        var xx = xmin + (xmax - xmin) * k / 240;
        var yy = Maths.evaluerApproche(c.src, { x: xx });
        pts.push(X(xx).toFixed(2) + ',' + Y(Math.max(ymin - 5, Math.min(ymax + 5, yy))).toFixed(2));
      }
      s.appendChild(svg('polyline', { points: pts.join(' '), 'class': 'courbe courbe-' + i, 'clip-path': 'url(#' + clip + ')' }));
      // nom de la courbe près du bord
      var xn = xmax - 1.2 - i * 2, yn = Maths.evaluerApproche(c.src, { x: xn });
      if (yn > ymax - 0.5 || yn < ymin + 0.5) { xn = xmin + 1.5 + i * 2; yn = Maths.evaluerApproche(c.src, { x: xn }); }
      if (yn <= ymax - 0.5 && yn >= ymin + 0.5) s.appendChild(svg('text', { x: X(xn) + 4, y: Y(yn) - 6, 'class': 'nom-courbe nom-courbe-' + i, texte: c.nom }));
    });
    var curseur = svg('g', { 'class': 'curseur-graphique', visibility: 'hidden' });
    var ligneC = svg('line', { y1: Y(ymin), y2: Y(ymax), 'class': 'ligne-curseur' });
    curseur.appendChild(ligneC);
    var points = def.courbes.map(function (c, i) { var p = svg('circle', { r: 5, 'class': 'point-curseur courbe-' + i }); curseur.appendChild(p); return p; });
    s.appendChild(curseur);
    var lecture = el('p', { 'class': 'lecture-graphique', 'aria-live': 'polite', texte: 'Touche le graphique (ou utilise les flèches) pour lire les valeurs.' });
    var xc = null;
    function placer(x) {
      x = Math.max(xmin, Math.min(xmax, Math.round(x * 2) / 2));
      xc = x;
      curseur.setAttribute('visibility', 'visible');
      ligneC.setAttribute('x1', X(x)); ligneC.setAttribute('x2', X(x));
      var morceaux = [];
      def.courbes.forEach(function (c, i) {
        var v = Maths.evaluer(c.src, { x: F.depuis(String(x)) });
        var vy = v.valeur();
        points[i].setAttribute('cx', X(x)); points[i].setAttribute('cy', Y(Math.max(ymin, Math.min(ymax, vy))));
        points[i].setAttribute('visibility', vy >= ymin && vy <= ymax ? 'visible' : 'hidden');
        morceaux.push(c.nom + '(' + O.tn(F.depuis(String(x))) + ') = ' + O.tn(v));
      });
      lecture.textContent = 'x = ' + O.tn(F.depuis(String(x))) + ' : ' + morceaux.join(' ; ') + '.';
    }
    s.addEventListener('click', function (e) {
      var rect = s.getBoundingClientRect();
      var vb = s.viewBox.baseVal;
      var px = (e.clientX - rect.left) * vb.width / rect.width;
      placer(xmin + (px - marge) / u);
    });
    var ctrl = el('div', { 'class': 'actions actions-outil' }, [
      el('button', { type: 'button', 'class': 'bouton-discret', 'data-action': 'gauche', 'aria-label': 'Déplacer la lecture vers la gauche', texte: '◀ x', onclick: function () { placer((xc === null ? 0 : xc) - 0.5); } }),
      el('button', { type: 'button', 'class': 'bouton-discret', 'data-action': 'droite', 'aria-label': 'Déplacer la lecture vers la droite', texte: 'x ▶', onclick: function () { placer((xc === null ? 0 : xc) + 0.5); } })
    ]);
    var legende = el('ul', { 'class': 'legende-courbes' }, def.courbes.map(function (c, i) {
      return el('li', { 'class': 'legende-courbe-' + i }, [el('span', { 'class': 'pastille courbe-' + i, 'aria-hidden': 'true' }), el('span', { 'class': 'maths', texte: c.nom + '(x) = ' + Maths.versTexte(c.src) })]);
    }));
    var racine = el('div', { 'class': 'outil outil-graphique' }, [legende, el('div', { 'class': 'cadre-svg cadre-graphique' }, [s]), ctrl, lecture]);
    return { element: racine, placer: placer };
  }

  /* =====================================================================
   * Figure géométrique cotée
   * ===================================================================== */
  function figure(def) {
    var f = def.figure;
    var s = svg('svg', { viewBox: '0 0 300 190', 'class': 'svg-figure', role: 'img' });
    function cote(x, y, t, ancre) { s.appendChild(svg('text', { x: x, y: y, 'text-anchor': ancre || 'middle', 'class': 'cote', texte: t })); }
    function angle(x, y, dx, dy) { s.appendChild(svg('path', { d: 'M' + (x + dx) + ' ' + y + ' L' + (x + dx) + ' ' + (y + dy) + ' L' + x + ' ' + (y + dy), 'class': 'angle-droit' })); }
    var desc;
    if (f.forme === 'rectangle' || f.forme === 'carre') {
      var w = f.forme === 'carre' ? 130 : 210, h = f.forme === 'carre' ? 130 : 110;
      var x0 = (300 - w) / 2, y0 = 22;
      s.appendChild(svg('rect', { x: x0, y: y0, width: w, height: h, 'class': 'contour' }));
      angle(x0, y0, 12, 12); angle(x0 + w, y0 + h, -12, -12);
      var L = f.forme === 'carre' ? f.cote : f.longueur, l = f.forme === 'carre' ? f.cote : f.largeur;
      cote(x0 + w / 2, y0 + h + 22, L);
      cote(x0 + w + 8, y0 + h / 2 + 5, l, 'start');
      desc = (f.forme === 'carre' ? 'Carré de côté ' + L : 'Rectangle de longueur ' + L + ' et de largeur ' + l);
      s.setAttribute('viewBox', '0 0 300 ' + (y0 + h + 34));
    } else if (f.forme === 'triangle') {
      s.appendChild(svg('polygon', { points: '40,160 260,160 110,30', 'class': 'contour' }));
      cote(150, 182, f.cotes[2]);
      cote(62, 92, f.cotes[0], 'end');
      cote(196, 88, f.cotes[1], 'start');
      desc = 'Triangle de côtés ' + f.cotes.join(', ');
    } else {
      // rectangle dont on a retiré un carré dans un coin
      var a = 26;
      s.appendChild(svg('path', { d: 'M45 22 L' + (255 - 44) + ' 22 L' + (255 - 44) + ' ' + (22 + 44) + ' L255 ' + (22 + 44) + ' L255 150 L45 150 Z', 'class': 'contour' }));
      s.appendChild(svg('rect', { x: 255 - 44, y: 22, width: 44, height: 44, 'class': 'retire' }));
      angle(45, 22, 12, 12);
      cote(150, 172, f.longueur);
      cote(36, 92, f.largeur, 'end');
      cote(233, 16, f.coin);
      cote(262, 48, f.coin, 'start');
      desc = 'Rectangle de longueur ' + f.longueur + ' et de largeur ' + f.largeur + ', auquel on a retiré un carré de côté ' + f.coin + ' dans un coin';
      void a;
    }
    s.setAttribute('aria-label', desc);
    return { element: el('div', { 'class': 'outil outil-figure' }, [el('div', { 'class': 'cadre-svg cadre-figure' }, [s])]) };
  }

  function creer(def, options) {
    options = options || {};
    switch (def.type) {
      case 'tuiles': return tuilesReduction(def, options);
      case 'aire': return tuilesAire(def, options);
      case 'balance': return balance(def, options);
      case 'machine': return machine(def, options);
      case 'graphique': return graphique(def, options);
      case 'figure': return figure(def, options);
    }
    throw new Error('Visuel inconnu : ' + def.type);
  }

  global.AlgebreVisuels = { creer: creer };
})(window);
