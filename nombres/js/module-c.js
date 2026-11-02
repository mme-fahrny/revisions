/*
 * nombres/js/module-c.js — Module C « Révision : nombres relatifs et priorités »
 * 9e (NO 9.2) et 10e (NO 10.1, partie relatifs).
 * Logique pure : voir outils.js pour le format des questions.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'), require('./module-a-9e.js'));
  else racine.NombresModuleC = fabrique(racine.NombresOutils, racine.NombresModuleA9);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O, A9) {
  'use strict';

  var M = O.Maths, F = O.F, H = O.H, A = O.A, R = O.RUBRIQUES;
  var fr = O.fr, val = O.val;
  var NB = O.NBSP;
  var sup = M.texteExposant;

  function m(h) { return H.maths(h); }
  function prenom(alea) { return alea.choix(O.PRENOMS); }
  function rel(x) { return H.rel(x); }                       // (+ 5), (– 3)
  function simp(x) { return H.rel(x, { parentheses: false }); } // 5, – 3
  /** 9e : écriture avec parenthèses ; à partir de la 10e (ou palier élevé) : parfois l'écriture simplifiée. */
  function relatif(alea, max, decimal) {
    var x = decimal ? new F(alea.entierNonNul(-max * 10, max * 10), 10) : fr(alea.entierNonNul(-max, max));
    return x;
  }

  /* =====================================================================
   * Droite numérique
   * ===================================================================== */

  /** Deux nombres entiers écrits sous la droite (0 s'il est visible), pour pouvoir lire les graduations. */
  function etiquettesDroite(min, max, pas) {
    var entiers = [];
    for (var e = Math.ceil(min); e <= max + 1e-9; e++) entiers.push(e);
    if (pas === 1) {
      var t = entiers.filter(function (x) { return x === 0 || x % 5 === 0; });
      return t.length >= 2 ? t.slice(0, 2) : [entiers[0], entiers[entiers.length - 1]];
    }
    var zero = entiers.indexOf(0);
    if (zero >= 0 && zero + 1 < entiers.length) return [0, 1];
    if (zero > 0) return [-1, 0];
    return entiers.slice(0, 2);
  }

  function questionLireDroite(alea, p) {
    var pas = [0, 1, 0.5, 0.25, 0.1, 0.2][p];
    var min = p <= 1 ? alea.entier(-8, -2) : alea.entier(-5, -1);
    var nTicks = p === 1 ? 12 : p === 4 ? 20 : 12;
    var max = min + nTicks * pas;
    var etiquettes = etiquettesDroite(min, max, pas);
    var k;
    do { k = alea.entier(1, nTicks - 1); } while (etiquettes.some(function (e) { return Math.abs(min + k * pas - e) < 1e-9; }));
    var v = M.Fraction.depuis(Number((min + k * pas).toFixed(4)));
    return O.saisie({
      type: 'visuel',
      enonce: '<p>Quel nombre correspond au point A sur la droite numérique ?</p>',
      consigne: 'Écris un nombre (avec son signe s\'il est négatif).',
      indice: 'Cherche d\'abord ce que vaut une graduation : il y a ' + Math.round(1 / pas) + ' graduation' + (Math.round(1 / pas) > 1 ? 's' : '') + ' entre 0 et 1.',
      reponse: { type: 'valeur', valeur: v },
      pieges: [{ valeur: v.oppose(), message: 'Attention au signe : le point A est ' + (v.signe() < 0 ? 'à gauche' : 'à droite') + ' de 0.' }, { valeur: M.Fraction.depuis(Number((min + (k + (v.signe() < 0 ? 1 : -1)) * pas).toFixed(4))), message: 'Tu t\'es trompé·e d\'une graduation : compte à partir de 0.' }],
      etapes: O.etapes([['Une graduation vaut ' + H.n(M.Fraction.depuis(pas)) + ' (il y a ' + Math.round(1 / pas) + ' intervalle' + (Math.round(1 / pas) > 1 ? 's' : '') + ' entre 0 et 1).', ''], ['Le point A est à ' + Math.round(Math.abs(v.valeur()) / pas) + ' graduation' + (Math.round(Math.abs(v.valeur()) / pas) > 1 ? 's' : '') + ' ' + (v.signe() < 0 ? 'à gauche' : 'à droite') + ' de 0.', m('A = ' + H.n(v))]]),
      rubrique: R.relatifs,
      visuel: { type: 'droite', min: min, max: max, pas: pas, points: [{ v: v.valeur(), nom: 'A' }], etiquettes: etiquettes },
      visuelCorrection: { type: 'droite', min: min, max: max, pas: pas, points: [{ v: v.valeur(), nom: 'A', label: M.formaterNombre(v) }], etiquettes: etiquettes },
      nombres: [v],
      controle: { expr: v.toString() },
      attenduHtml: H.n(v)
    });
  }

  function questionPlacerDroite(alea, p) {
    var pas = [0, 1, 0.5, 0.25, 0.1, 0.2][p];
    var min = alea.entier(-5, -1);
    var nTicks = 12;
    var max = min + nTicks * pas;
    var indices = alea.melanger([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).filter(function (k) { return Math.abs(min + k * pas) > 1e-9; }).slice(0, 4);
    var noms = ['A', 'B', 'C', 'D'];
    var points = indices.map(function (k, i) { return { v: Number((min + k * pas).toFixed(4)), nom: noms[i] }; });
    var cible = alea.choix(points);
    var cv = M.Fraction.depuis(cible.v);
    var choix = points.map(function (pt) {
      return { h: 'Le point ' + pt.nom, juste: pt === cible, cle: pt.nom, message: pt === cible ? '' : 'Le point ' + pt.nom + ' correspond à ' + M.formaterNombre(M.Fraction.depuis(pt.v)) + '.' };
    });
    return O.choix({
      type: 'visuel',
      enonce: '<p>Quel point correspond au nombre ' + m(H.n(cv)) + ' ?</p>',
      consigne: 'Choisis un point.',
      choix: choix,
      ordreFixe: true,
      indice: 'Repère 0, puis compte les graduations : une graduation vaut ' + M.formaterNombre(M.Fraction.depuis(pas)) + '.',
      etapes: O.etapes([['Une graduation vaut ' + H.n(M.Fraction.depuis(pas)) + '.', ''], [H.n(cv) + ' est ' + (cv.signe() < 0 ? 'à gauche' : 'à droite') + ' de 0, à ' + Math.round(Math.abs(cible.v) / pas) + ' graduation(s) : c\'est le point ' + cible.nom + '.', '']]),
      rubrique: R.relatifs,
      visuel: { type: 'droite', min: min, max: max, pas: pas, points: points, etiquettes: etiquettesDroite(min, max, pas) },
      nombres: [cv],
      controle: { type: 'aucun' }
    }, alea);
  }

  /* =====================================================================
   * Comparer, ordonner, encadrer
   * ===================================================================== */

  function questionOrdonnerRelatifs(alea, p) {
    var dec = p >= 3;
    var vals = [];
    while (vals.length < (p >= 4 ? 5 : 4)) {
      var x = dec && alea.suivant() < 0.6 ? new F(alea.entierNonNul(-99, 99), 10) : fr(alea.entierNonNul(-12, 12));
      if (!vals.some(function (v) { return v.egal(x); })) vals.push(x);
    }
    var croissant = alea.suivant() < 0.6;
    var tries = vals.slice().sort(function (a, b) { return croissant ? a.compare(b) : b.compare(a); });
    var lo = Math.floor(tries.reduce(function (a, b) { return Math.min(a, b.valeur()); }, 0)), hi = Math.ceil(tries.reduce(function (a, b) { return Math.max(a, b.valeur()); }, 0));
    return O.saisie({
      type: 'directe',
      enonce: '<p>Range ces nombres dans l\'ordre <strong>' + (croissant ? 'croissant' : 'décroissant') + '</strong> :</p><p class="calcul">' + m(vals.map(function (v) { return H.n(v); }).join(NB + '; ')) + '</p>',
      consigne: 'Écris les nombres séparés par « ; », ' + (croissant ? 'du plus petit au plus grand.' : 'du plus grand au plus petit.'),
      indice: 'Les nombres négatifs sont plus petits que les positifs. Entre deux négatifs, le plus petit est celui qui a la plus grande distance à zéro.',
      reponse: { type: 'liste', valeurs: tries, ordonne: true, croissant: croissant, textes: tries.map(function (v) { return M.formaterNombre(v); }), textesHtml: tries.map(function (v) { return H.n(v); }) },
      etapes: O.etapes([['Je sépare les nombres négatifs et positifs. Parmi les négatifs, plus la distance à zéro est grande, plus le nombre est petit.', ''], ['Je range.', m(tries.map(function (v) { return H.n(v); }).join(croissant ? ' &lt; ' : ' &gt; '))]]),
      rubrique: R.relatifs,
      visuel: { type: 'droite', min: lo, max: hi, pas: hi - lo > 12 ? 2 : 1, interactif: true },
      visuelCorrection: { type: 'droite', min: lo, max: hi, pas: hi - lo > 12 ? 2 : 1, points: vals.map(function (v, i) { return { v: v.valeur(), nom: String.fromCharCode(65 + i), label: M.formaterNombre(v) }; }) },
      nombres: vals,
      controle: { type: 'ordre', exprs: vals.map(function (v) { return v.toString(); }), croissant: croissant }
    });
  }

  function questionEncadrerRelatif(alea, p) {
    var x = new F(alea.entierNonNul(-99, -1), p >= 3 ? 100 : 10).plus(fr(alea.entier(-5, 2)));
    if (x.estEntier()) x = x.plus(fr(1, 10));
    var bas = fr(Math.floor(x.valeur())), haut = bas.plus(1);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Encadre ' + m(H.n(x)) + ' entre deux nombres entiers consécutifs :</p><p class="calcul">' + m('… &lt; ' + H.n(x) + ' &lt; …') + '</p>',
      consigne: 'Écris les deux entiers séparés par « ; », le plus petit d\'abord.',
      indice: x.signe() < 0 ? 'Avec un nombre négatif, l\'entier plus petit est celui qui est plus loin de zéro.' : 'Regarde la partie entière.',
      reponse: { type: 'liste', valeurs: [bas, haut], ordonne: true, croissant: true, textes: [M.formaterNombre(bas), M.formaterNombre(haut)], textesHtml: [H.n(bas), H.n(haut)] },
      etapes: O.etapes([['Je place ' + H.n(x) + ' sur la droite numérique entre deux entiers.', m(H.n(bas) + ' &lt; ' + H.n(x) + ' &lt; ' + H.n(haut))]]),
      verification: x.signe() < 0 ? 'Vérification : ' + H.n(bas) + ' est plus loin de zéro que ' + H.n(x) + ', donc plus petit. ✓' : '',
      rubrique: R.relatifs,
      visuelCorrection: { type: 'droite', min: bas.valeur() - 1, max: haut.valeur() + 1, pas: 0.1, points: [{ v: x.valeur(), nom: 'x', label: M.formaterNombre(x) }], etiquettes: [bas.valeur(), haut.valeur()] },
      nombres: [x],
      controle: { type: 'encadrement', expr: x.toString(), pas: 1 }
    });
  }

  /* =====================================================================
   * Signe opératoire et signe du nombre
   * ===================================================================== */

  function questionSignes(alea, p) {
    var a = fr(alea.entierNonNul(-9, 9)), b = fr(alea.entierNonNul(-9, 9));
    var op = alea.choix(['+', '–']);
    // on choisit un signe à désigner : l'opération, ou le signe du second nombre
    var cible = b.signe() < 0 && alea.suivant() < 0.5 ? 'nombre' : 'operation';
    if (cible === 'nombre' && b.signe() > 0) cible = 'operation';
    var bh = rel(b);
    var opHtml = cible === 'operation' ? '<mark class="signe-cible">' + op + '</mark>' : op;
    var bHtml = cible === 'nombre' ? '(<mark class="signe-cible">–</mark>' + NB + Math.abs(Number(b.num)) + ')' : bh;
    var choix = [
      { h: 'C\'est un signe opératoire : il indique une ' + (op === '+' ? 'addition' : 'soustraction') + '.', juste: cible === 'operation', cle: 'operation', message: cible === 'operation' ? '' : 'Ce signe est collé au nombre, dans la parenthèse : il indique que le nombre est négatif.' },
      { h: 'C\'est le signe du nombre : il indique un nombre négatif.', juste: cible === 'nombre', cle: 'nombre', message: cible === 'nombre' ? '' : 'Ce signe est entre deux nombres : il indique une opération.' }
    ];
    return O.choix({
      type: 'directe',
      enonce: '<p>Dans ce calcul, que représente le signe surligné ?</p><p class="calcul">' + m(rel(a) + ' ' + opHtml + ' ' + bHtml) + '</p>',
      consigne: 'Choisis la bonne réponse.',
      choix: choix,
      ordreFixe: true,
      indice: 'Un signe opératoire est entre deux nombres ; le signe d\'un nombre est dans sa parenthèse, juste devant lui.',
      etapes: O.etapes([[cible === 'operation' ? 'Le signe « ' + op + ' » est placé entre les deux nombres : c\'est le signe d\'une opération.' : 'Le signe « – » est dans la parenthèse, juste devant ' + Math.abs(Number(b.num)) + ' : c\'est le signe du nombre ' + bh + '.', '']]),
      rubrique: R.relatifs,
      nombres: [a, b],
      controle: { type: 'aucun' }
    }, alea);
  }

  /* =====================================================================
   * Addition et soustraction de relatifs
   * ===================================================================== */

  function questionAddSousRelatifs(alea, p, ctx) {
    var dec = p >= 4;
    var max = [0, 10, 20, 30, 20, 50][p];
    var n = p >= 3 ? 3 : 2;
    var termes = [], ops = [];
    for (var i = 0; i < n; i++) {
      termes.push(dec && alea.suivant() < 0.5 ? new F(alea.entierNonNul(-max * 10, max * 10), 10) : fr(alea.entierNonNul(-max, max)));
      if (i > 0) ops.push(alea.choix(['+', '–']));
    }
    var simplifiee = (ctx && ctx.annee >= 10) && p >= 3 && alea.suivant() < 0.5;
    var h = rel(termes[0]);
    var v = termes[0];
    var sommeOpp = rel(termes[0]);
    for (var j = 1; j < n; j++) {
      h += ' ' + ops[j - 1] + ' ' + rel(termes[j]);
      v = ops[j - 1] === '+' ? v.plus(termes[j]) : v.moins(termes[j]);
      sommeOpp += ' + ' + rel(ops[j - 1] === '+' ? termes[j] : termes[j].oppose());
    }
    var ecritSimple = simp(termes[0]);
    var t2 = [termes[0]];
    for (var k = 1; k < n; k++) {
      var tk = ops[k - 1] === '+' ? termes[k] : termes[k].oppose();
      t2.push(tk);
      ecritSimple += (tk.signe() < 0 ? ' – ' : ' + ') + H.n(tk.abs());
    }
    var aff = simplifiee ? ecritSimple : h;
    var texte = termes.map(function (t, i2) { return (i2 > 0 ? (ops[i2 - 1] === '+' ? '+' : '-') : '') + '(' + t.toString() + ')'; }).join('');
    var et = [];
    if (!simplifiee && ops.indexOf('–') >= 0) et.push(['Soustraire un nombre, c\'est additionner son opposé.', m(h + ' = ' + sommeOpp)]);
    if (!simplifiee) et.push(['J\'écris le calcul en écriture simplifiée (sans les signes d\'addition ni les parenthèses).', m('= ' + ecritSimple)]);
    var cumul = t2[0];
    for (var q = 1; q < t2.length; q++) {
      var avant = cumul;
      cumul = cumul.plus(t2[q]);
      et.push([q === 1 ? 'Je calcule de gauche à droite.' : 'Je continue.', m(H.n(avant) + (t2[q].signe() < 0 ? ' – ' : ' + ') + H.n(t2[q].abs()) + ' = ' + H.n(cumul))]);
    }
    var pieges = [];
    if (n === 2) {
      pieges.push({ valeur: ops[0] === '+' ? termes[0].moins(termes[1]) : termes[0].plus(termes[1]), message: ops[0] === '–' ? 'Soustraire ' + M.formaterRelatif(termes[1]) + ', c\'est additionner son opposé ' + M.formaterRelatif(termes[1].oppose()) + '.' : 'C\'est une addition : on n\'a pas besoin de changer le signe du second nombre.' });
      pieges.push({ valeur: termes[0].abs().plus(termes[1].abs()).fois(v.signe() || 1), message: 'Attention : pour additionner deux nombres de signes contraires, on soustrait leurs distances à zéro.' });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(aff) + '</p>',
      consigne: 'Écris le résultat (avec son signe s\'il est négatif).',
      indice: 'Soustraire un nombre, c\'est additionner son opposé. Puis passe à l\'écriture simplifiée.',
      reponse: { type: 'valeur', valeur: v },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: 'Vérification sur la droite numérique : pars de ' + H.n(t2[0]) + ' et avance (vers la droite) pour un terme positif, recule pour un terme négatif.',
      rubrique: R.addRelatifs,
      nombres: termes,
      controle: { expr: texte },
      attenduHtml: H.n(v)
    });
  }

  function erreurAddSousRelatifs(alea, p) {
    var a = alea.entierNonNul(-9, 9), b = alea.entier(-9, -1);
    var nom = prenom(alea);
    var vraie = fr(a - b);
    var type = alea.choix(['opposeOublie', 'distance', 'juste']);
    var lignes, cle, eleve;
    if (type === 'opposeOublie') { lignes = [rel(fr(a)) + ' – ' + rel(fr(b)) + ' = ' + rel(fr(a)) + ' + ' + rel(fr(b)) + ' = ' + H.n(fr(a + b))]; eleve = String(a + b); cle = 'oppose'; }
    else if (type === 'distance') { lignes = [rel(fr(a)) + ' – ' + rel(fr(b)) + ' = ' + rel(fr(a)) + ' + ' + rel(fr(-b)) + ' = ' + H.n(fr(-(Math.abs(a) + Math.abs(b))))]; eleve = String(-(Math.abs(a) + Math.abs(b))); cle = 'signe'; if (fr(Number(eleve)).egal(vraie)) cle = 'aucune'; }
    else { lignes = [rel(fr(a)) + ' – ' + rel(fr(b)) + ' = ' + rel(fr(a)) + ' + ' + rel(fr(-b)) + ' = ' + H.n(vraie)]; eleve = String(a - b); cle = 'aucune'; }
    if (cle === 'oppose' && a + b === a - b) cle = 'aucune';
    var choix = [
      { h: 'On a remplacé la soustraction par une addition sans prendre l\'opposé du second nombre.', juste: cle === 'oppose', cle: 'oppose', message: 'Regarde le second nombre après le changement d\'opération.' },
      { h: 'Le signe du résultat est faux.', juste: cle === 'signe', cle: 'signe', message: 'Regarde la dernière étape.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : le résultat est ' + M.formaterNombre(vraie) + '.' },
      { h: 'Il fallait multiplier les deux nombres.', juste: false, cle: 'mul', message: 'Non : c\'est une soustraction.' }
    ];
    choix.forEach(function (c) { if (c.juste) c.message = ''; });
    return O.erreurEleve({
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'Soustraire un nombre, c\'est additionner son opposé.',
      etapes: O.etapes([['Soustraire ' + rel(fr(b)) + ', c\'est additionner son opposé ' + rel(fr(-b)) + '.', m(rel(fr(a)) + ' – ' + rel(fr(b)) + ' = ' + rel(fr(a)) + ' + ' + rel(fr(-b)) + ' = ' + H.n(vraie))]]),
      rubrique: R.addRelatifs,
      nombres: [fr(a), fr(b)],
      controle: { type: 'erreur', correct: '(' + a + ')-(' + b + ')', eleve: eleve, cle: cle }
    }, alea);
  }

  function vraiFauxRelatifs(alea, p) {
    var n = alea.entier(2, 15), a = alea.entierNonNul(-15, 15);
    var cas = alea.choix([
      { h: 'Soustraire ' + rel(fr(-n)) + ', c\'est additionner ' + rel(fr(n)) + '.', a: a + '-(' + (-n) + ')', b: a + '+' + n, j: 'soustraire un nombre, c\'est additionner son opposé, et l\'opposé de ' + rel(fr(-n)) + ' est ' + rel(fr(n)) + '.' },
      { h: 'Soustraire ' + rel(fr(n)) + ', c\'est additionner ' + rel(fr(n)) + '.', a: a + '-' + n, b: a + '+' + n, j: 'soustraire ' + rel(fr(n)) + ', c\'est additionner son opposé ' + rel(fr(-n)) + '.' },
      { h: 'La somme de deux nombres négatifs est négative.', a: '(-' + n + ')+(-' + (n + 1) + ')<0', vf: true, j: 'on additionne les distances à zéro et on garde le signe – : par exemple (– ' + n + ') + (– ' + (n + 1) + ') = – ' + (2 * n + 1) + '.' },
      { h: rel(fr(-n)) + ' &gt; ' + rel(fr(-(n + 3))), a: String(-n), b: String(-(n + 3)), rel: '>', j: H.moins + n + ' est plus proche de zéro que ' + H.moins + (n + 3) + ', donc il est plus grand.' },
      { h: rel(fr(-n)) + ' &gt; ' + rel(fr(2)), a: String(-n), b: '2', rel: '>', j: 'un nombre négatif est toujours plus petit qu\'un nombre positif.' }
    ]);
    var vrai, controle;
    if (cas.vf) { vrai = true; controle = { type: 'vf', a: '(-' + n + ')+(-' + (n + 1) + ')', b: '0', relation: '<' }; }
    else if (cas.rel) { vrai = M.evaluer(cas.a).compare(M.evaluer(cas.b)) > 0; controle = { type: 'vf', a: cas.a, b: cas.b, relation: '>' }; }
    else { vrai = M.evaluer(cas.a).egal(M.evaluer(cas.b)); controle = { type: 'vf', a: cas.a, b: cas.b, relation: '=' }; }
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(cas.h) + '</p>',
      vrai: vrai,
      bonne: cas.j,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car un nombre négatif plus grand en valeur est plus grand.', message: 'Pour les nombres négatifs, c\'est l\'inverse : plus la distance à zéro est grande, plus le nombre est petit.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car deux signes « – » donnent toujours « + ».', message: 'Cette règle concerne la multiplication et la division, pas l\'addition.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car on ne peut pas soustraire un nombre négatif.', message: 'On peut toujours soustraire : soustraire un nombre, c\'est additionner son opposé.' }
      ],
      indice: 'Pense à la droite numérique.',
      etapes: O.etapes([[(vrai ? 'Vrai : ' : 'Faux : ') + cas.j, '']]),
      rubrique: R.relatifs,
      nombres: [fr(n), fr(a)],
      controle: controle
    }, alea);
  }

  /* =====================================================================
   * Multiplication et division de relatifs
   * ===================================================================== */

  function questionMulDivRelatifs(alea, p, ctx) {
    var op = alea.choix(['·', ':']);
    var nFacteurs = op === '·' && p >= 3 ? alea.entier(2, p >= 4 ? 4 : 3) : 2;
    var facteurs = [];
    var h, v, texte;
    if (op === '·') {
      for (var i = 0; i < nFacteurs; i++) facteurs.push(fr(alea.entierNonNul(nFacteurs > 2 ? -6 : -12, nFacteurs > 2 ? 6 : 12)));
      v = facteurs.reduce(function (a, b) { return a.fois(b); }, fr(1));
      h = facteurs.map(rel).join(' · ');
      texte = facteurs.map(function (f) { return '(' + f.toString() + ')'; }).join('*');
    } else {
      var q = fr(alea.entierNonNul(-12, 12)), d = fr(alea.entierNonNul(-12, 12));
      if (d.egal(1)) d = fr(-3);
      facteurs = [q.fois(d), d];
      v = q;
      h = rel(facteurs[0]) + ' : ' + rel(d);
      texte = '(' + facteurs[0].toString() + '):(' + d.toString() + ')';
    }
    var negatifs = facteurs.filter(function (f) { return f.signe() < 0; }).length;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Écris le résultat (avec son signe s\'il est négatif).',
      barreOblique: 'division',
      indice: 'Compte les nombres négatifs : un nombre pair de nombres négatifs donne un résultat positif, un nombre impair un résultat négatif.',
      reponse: { type: 'valeur', valeur: v },
      pieges: [{ valeur: v.oppose(), message: 'Le signe est faux : il y a ' + negatifs + ' nombre' + (negatifs > 1 ? 's' : '') + ' négatif' + (negatifs > 1 ? 's' : '') + ', c\'est un nombre ' + (negatifs % 2 === 0 ? 'pair' : 'impair') + ', donc le résultat est ' + (negatifs % 2 === 0 ? 'positif.' : 'négatif.') }],
      etapes: O.etapes([
        ['Je détermine le signe : il y a ' + negatifs + ' nombre' + (negatifs > 1 ? 's' : '') + ' négatif' + (negatifs > 1 ? 's' : '') + ' (' + (negatifs % 2 === 0 ? 'pair' : 'impair') + '), le résultat est ' + (negatifs % 2 === 0 ? 'positif.' : 'négatif.'), ''],
        ['Je calcule avec les distances à zéro.', m(facteurs.map(function (f) { return H.n(f.abs()); }).join(op === '·' ? ' · ' : ' : ') + ' = ' + H.n(v.abs()))],
        ['Résultat.', m(h + ' = ' + H.n(v))]
      ]),
      verification: op === ':' ? 'Vérification : ' + m(rel(v) + ' · ' + rel(facteurs[1]) + ' = ' + rel(facteurs[0])) + '. ✓' : 'Vérification : le signe correspond au nombre de facteurs négatifs. ✓',
      rubrique: R.mulRelatifs,
      nombres: facteurs,
      controle: { expr: texte },
      attenduHtml: H.n(v)
    });
  }

  function vraiFauxSigneProduit(alea, p) {
    var n = alea.entier(3, 6);
    var facteurs = [];
    for (var i = 0; i < n; i++) facteurs.push(fr(alea.entierNonNul(-5, 5)));
    var negatifs = facteurs.filter(function (f) { return f.signe() < 0; }).length;
    var annonce = alea.choix(['positif', 'négatif']);
    var prod = facteurs.reduce(function (a, b) { return a.fois(b); }, fr(1));
    var vrai = (annonce === 'positif') === (prod.signe() > 0);
    var texte = facteurs.map(function (f) { return '(' + f.toString() + ')'; }).join('*');
    return O.vraiFaux({
      enonce: '<p>Sans calculer : le produit ' + m(facteurs.map(rel).join(' · ')) + ' est ' + annonce + '.</p>',
      vrai: vrai,
      bonne: 'il y a ' + negatifs + ' facteur' + (negatifs > 1 ? 's' : '') + ' négatif' + (negatifs > 1 ? 's' : '') + ' : c\'est un nombre ' + (negatifs % 2 === 0 ? 'pair' : 'impair') + ', donc le produit est ' + (negatifs % 2 === 0 ? 'positif' : 'négatif') + '.',
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car il y a plus de facteurs ' + (annonce === 'positif' ? 'négatifs' : 'positifs') + '.', message: 'Ce n\'est pas la majorité qui compte, c\'est la parité du nombre de facteurs négatifs.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car « moins par moins donne plus », donc le produit est toujours positif.', message: 'C\'est vrai pour DEUX facteurs négatifs. Avec trois, le produit est négatif.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car le premier facteur est ' + (facteurs[0].signe() < 0 ? 'négatif' : 'positif') + '.', message: 'Le premier facteur ne suffit pas : compte tous les facteurs négatifs.' }
      ],
      indice: 'Compte les facteurs négatifs.',
      etapes: O.etapes([['Je compte les facteurs négatifs : ' + negatifs + ' (' + (negatifs % 2 === 0 ? 'pair' : 'impair') + ').', ''], ['Le produit est donc ' + (negatifs % 2 === 0 ? 'positif' : 'négatif') + ' : il vaut ' + H.n(prod) + '.', '']]),
      rubrique: R.mulRelatifs,
      nombres: facteurs,
      controle: { type: 'vf', a: texte, b: '0', relation: annonce === 'positif' ? '>' : '<' }
    }, alea);
  }

  /* =====================================================================
   * 10e : puissance d'un entier relatif
   * ===================================================================== */

  function questionPuissanceRelatif(alea, p) {
    var b = alea.entier(2, p >= 3 ? 5 : 3), n = alea.entier(2, b === 2 ? 6 : 4);
    var genre = alea.choix(['parentheses', 'sans']);
    var v, h, texte;
    if (genre === 'parentheses') { v = fr(-b).puissance(n); h = '(' + H.moins + b + ')' + sup(n); texte = '(-' + b + ')^' + n; }
    else { v = fr(b).puissance(n).oppose(); h = H.moins + b + sup(n); texte = '-(' + b + '^' + n + ')'; }
    var autre = genre === 'parentheses' ? fr(b).puissance(n).oppose() : fr(-b).puissance(n);
    var pieges = [];
    if (!autre.egal(v)) pieges.push({ valeur: autre, message: genre === 'sans' ? 'Sans parenthèses, l\'exposant porte seulement sur ' + b + ' : ' + H.moins + b + sup(n) + ' = ' + H.moins + '(' + b + sup(n) + ').' : 'Avec les parenthèses, la base est ' + H.moins + b + ' : on multiplie ' + n + ' facteurs négatifs (' + (n % 2 === 0 ? 'nombre pair : résultat positif' : 'nombre impair : résultat négatif') + ').' });
    pieges.push({ valeur: fr(-b * n), message: 'Tu as multiplié la base par l\'exposant.' });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Écris le résultat (avec son signe).',
      indice: genre === 'parentheses' ? 'La base est ' + H.moins + b + ' : écris le produit de ' + n + ' facteurs (' + H.moins + b + ').' : 'Attention : sans parenthèses, l\'exposant porte seulement sur ' + b + '.',
      reponse: { type: 'valeur', valeur: v },
      pieges: pieges,
      etapes: O.etapes(genre === 'parentheses'
        ? [['La base est ' + H.moins + b + '.', m(h + ' = ' + Array(n + 1).join('(' + H.moins + b + ') · ').slice(0, -3))], ['Il y a ' + n + ' facteurs négatifs (' + (n % 2 === 0 ? 'pair' : 'impair') + ') : le résultat est ' + (n % 2 === 0 ? 'positif.' : 'négatif.'), m('= ' + H.n(v))]]
        : [['L\'exposant porte seulement sur ' + b + ' (c\'est l\'opposé de ' + b + sup(n) + ').', m(h + ' = ' + H.moins + '(' + Array(n + 1).join(b + ' · ').slice(0, -3) + ')')], ['Je calcule.', m('= ' + H.n(v))]]),
      verification: 'Comparaison : ' + m('(' + H.moins + b + ')' + sup(n) + ' = ' + H.n(fr(-b).puissance(n))) + ' et ' + m(H.moins + b + sup(n) + ' = ' + H.n(fr(b).puissance(n).oppose())) + '.',
      rubrique: R.puissances,
      nombres: [fr(b), fr(n)],
      controle: { expr: texte },
      attenduHtml: H.n(v)
    });
  }

  /* =====================================================================
   * 10e : priorités et parenthèses inutiles
   * ===================================================================== */

  function questionPrioritesRelatifs(alea, p, ctx) {
    var t, v, essais = 0;
    function e(max) { return A.f(alea.entierNonNul(-max, max)); }
    do {
      var mod = alea.choix(['a+b·c', 'a·(b–c)', 'a–b:c', '(a+b)·(c–d)', 'a·b–c·d', 'a+b·c²']);
      switch (mod) {
        case 'a+b·c': t = A.o('+', e(20), A.o('·', e(9), e(9))); break;
        case 'a·(b–c)': t = A.o('·', e(9), A.par(A.o('–', e(12), e(12)))); break;
        case 'a–b:c': { var c = e(6), q = alea.entierNonNul(-9, 9); t = A.o('–', e(20), A.o(':', A.f(c.v.fois(q)), c)); break; }
        case '(a+b)·(c–d)': t = A.o('·', A.par(A.o('+', e(9), e(9))), A.par(A.o('–', e(9), e(9)))); break;
        case 'a·b–c·d': t = A.o('–', A.o('·', e(9), e(9)), A.o('·', e(9), e(9))); break;
        default: t = A.o('+', e(20), A.o('·', e(5), A.p(e(4), 2)));
      }
      v = A.valeur(t);
      essais++;
    } while (v.abs().compare(200) > 0 && essais < 30);
    var naif = A.naif(t);
    var h = A.html(t);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule en respectant les priorités des opérations :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Écris le résultat.',
      barreOblique: 'division',
      indice: 'D\'abord les parenthèses, puis les puissances, puis · et :, enfin + et –. Attention aux signes.',
      reponse: { type: 'valeur', valeur: v },
      pieges: naif && !naif.egal(v) ? [{ valeur: naif, message: 'Tu as calculé de gauche à droite sans respecter les priorités.' }, { valeur: v.oppose(), message: 'Attention aux signes (règle des signes pour · et :).' }] : [{ valeur: v.oppose(), message: 'Attention aux signes.' }],
      etapes: O.etapes(A.etapes(t).map(function (e2, i) { return [e2[0], m((i === 0 ? h + ' ' : '') + e2[1])]; })),
      verification: 'Vérification : refais le calcul en notant le signe de chaque résultat intermédiaire.',
      rubrique: R.priorites,
      nombres: A.feuilles(t),
      controle: { expr: A.texte(t) },
      attenduHtml: H.n(v)
    });
  }

  function questionParenthesesInutiles(alea, p) {
    var a = alea.entier(2, 9), b = alea.entier(2, 9), c = alea.entier(2, 9);
    var options = alea.melanger([
      { h: a + ' + (' + b + ' · ' + c + ')', avec: a + '+(' + b + '*' + c + ')', sans: a + '+' + b + '*' + c },
      { h: '(' + a + ' + ' + b + ') · ' + c, avec: '(' + a + '+' + b + ')*' + c, sans: a + '+' + b + '*' + c },
      { h: a + ' – (' + b + ' + ' + c + ')', avec: a + '-(' + b + '+' + c + ')', sans: a + '-' + b + '+' + c },
      { h: '(' + H.moins + a + ')²', avec: '(-' + a + ')^2', sans: '-' + a + '^2' },
      { h: '(' + a + ' · ' + b + ') : ' + c, avec: '(' + a + '*' + b + '):' + c, sans: a + '*' + b + ':' + c },
      { h: a + ' : (' + b + ' · ' + c + ')', avec: a + ':(' + b + '*' + c + ')', sans: a + ':' + b + '*' + c }
    ]);
    var inutiles = options.filter(function (o) { return M.evaluer(o.avec).egal(M.evaluer(o.sans)); });
    var utiles = options.filter(function (o) { return !M.evaluer(o.avec).egal(M.evaluer(o.sans)); });
    var bonne = inutiles[0];
    var choix = [bonne].concat(utiles.slice(0, 3)).map(function (o) {
      var vs = M.evaluer(o.sans), va = M.evaluer(o.avec);
      return { h: m(o.h), juste: o === bonne, cle: o.h, avec: o.avec, sans: o.sans, message: o === bonne ? '' : 'Ici, les parenthèses sont utiles : avec elles on obtient ' + M.formaterNombre(va) + ', sans elles ' + M.formaterNombre(vs) + '.' };
    });
    return O.choix({
      type: 'directe',
      enonce: '<p>Dans quel calcul les parenthèses sont-elles <strong>inutiles</strong> (on peut les supprimer sans changer le résultat) ?</p>',
      consigne: 'Choisis un calcul.',
      choix: choix,
      indice: 'Les parenthèses sont inutiles si elles entourent un calcul qui serait de toute façon fait en premier.',
      etapes: O.etapes([['Dans ' + m(bonne.h) + ', le calcul entre parenthèses serait de toute façon effectué en premier (priorités ou ordre de gauche à droite).', m(M.versTexte(bonne.sans).replace(/-/g, '–') + ' = ' + H.n(M.evaluer(bonne.sans)))]]),
      rubrique: R.priorites,
      nombres: [fr(a), fr(b), fr(c)],
      controle: { type: 'parentheses' }
    }, alea);
  }

  /* =====================================================================
   * Problèmes
   * ===================================================================== */

  function problemeRelatifs(alea, p) {
    var modele = alea.choix(['temperature', 'plongeur', 'ascenseur', 'compte']);
    var enonce, question, res, et, unite, expr, nombres, pieges = [];
    if (modele === 'temperature') {
      var t1 = alea.entier(-18, -3), t2 = alea.entier(-2, 12);
      res = fr(t2 - t1);
      enonce = '<p>Un matin d\'hiver à La Brévine, le thermomètre indique ' + H.n(fr(t1)) + ' °C à 7 h. À 14 h, il indique ' + H.n(fr(t2)) + ' °C.</p>';
      question = 'De combien de degrés la température a-t-elle augmenté ?';
      unite = '°C'; expr = '(' + t2 + ')-(' + t1 + ')';
      et = [['L\'écart est la différence : température finale – température initiale.', m(H.n(fr(t2)) + ' – ' + rel(fr(t1)) + ' = ' + H.n(fr(t2)) + ' + ' + rel(fr(-t1)) + ' = ' + H.n(res))]];
      nombres = [fr(t1), fr(t2)];
      pieges.push({ valeur: fr(t2 + t1), message: 'Tu as additionné les températures. L\'écart se calcule avec une soustraction : ' + t2 + ' – (' + t1 + ').' });
      pieges.push({ valeur: fr(Math.abs(t2) - Math.abs(t1)).abs(), message: 'Soustraire un nombre négatif, c\'est additionner son opposé.' });
    } else if (modele === 'plongeur') {
      var prof = alea.entier(8, 30), remonte = alea.entier(2, prof - 1);
      res = fr(-prof + remonte);
      enonce = '<p>Un plongeur se trouve à ' + prof + ' m sous la surface du lac de Neuchâtel (altitude relative ' + H.n(fr(-prof)) + ' m). Il remonte de ' + remonte + ' m.</p>';
      question = 'À quelle altitude relative se trouve-t-il maintenant ?';
      unite = 'm'; expr = '(-' + prof + ')+' + remonte;
      et = [['Remonter, c\'est ajouter.', m(rel(fr(-prof)) + ' + ' + rel(fr(remonte)) + ' = ' + H.n(res))]];
      nombres = [fr(prof), fr(remonte)];
      pieges.push({ valeur: fr(-prof - remonte), message: 'Remonter fait augmenter l\'altitude : on ajoute ' + remonte + '.' });
      pieges.push({ valeur: res.oppose(), message: 'Le plongeur est encore sous la surface : la réponse est négative.' });
    } else if (modele === 'ascenseur') {
      var depart = alea.entier(-3, -1), monte = alea.entier(2, 8), descend = alea.entier(1, 9);
      res = fr(depart + monte - descend);
      enonce = '<p>Dans un immeuble de ' + alea.choix(O.LIEUX) + ', ' + prenom(alea) + ' prend l\'ascenseur au niveau ' + H.n(fr(depart)) + ' (au parking). L\'ascenseur monte de ' + monte + ' étages, puis descend de ' + descend + ' étages.</p>';
      question = 'À quel niveau arrive l\'ascenseur ?';
      unite = ''; expr = '(' + depart + ')+' + monte + '-' + descend;
      et = [['Monter : + ; descendre : –.', m(H.n(fr(depart)) + ' + ' + monte + ' – ' + descend + ' = ' + H.n(res))]];
      nombres = [fr(depart), fr(monte), fr(descend)];
      pieges.push({ valeur: fr(-depart + monte - descend), message: 'Le niveau de départ est négatif (sous le rez-de-chaussée).' });
    } else {
      var solde = M.Fraction.depuis(String(-alea.entier(5, 60)) + '.' + alea.choix(['00', '50', '20', '80']));
      var depot = fr(alea.choix([20, 30, 40, 50, 80, 100]));
      res = solde.plus(depot);
      enonce = '<p>Le compte d\'une association de jeunes est à découvert : son solde est de ' + H.chfStyle(solde) + '. On y dépose ' + H.chfStyle(depot) + '.</p>';
      question = 'Quel est le nouveau solde ?';
      unite = 'francs'; expr = '(' + solde.toString() + ')+' + depot.toString();
      et = [['Déposer, c\'est ajouter.', m(H.chfStyle(solde) + ' + ' + H.chfStyle(depot).replace('CHF' + NB, '') + ' = ' + H.chfStyle(res))]];
      nombres = [solde, depot];
      pieges.push({ valeur: solde.abs().plus(depot), message: 'Le solde de départ est négatif (découvert).' });
    }
    return O.saisie({
      type: 'probleme',
      enonce: enonce + '<p>' + question + '</p>',
      consigne: unite === 'francs' ? 'Écris le solde en francs (avec son signe s\'il est négatif).' : 'Écris un nombre (avec son signe s\'il est négatif).',
      suffixe: unite,
      indice: 'Traduis la situation par un calcul avec des nombres relatifs.',
      reponse: unite === 'francs' ? { type: 'montant', valeur: res } : { type: 'valeur', valeur: res, unite: unite ? [unite, unite === '°C' ? '°' : unite] : null },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: 'Vérification sur la droite numérique : le résultat est cohérent avec la situation. ✓',
      rubrique: R.relatifs,
      nombres: nombres,
      controle: { expr: expr },
      attenduHtml: unite === 'francs' ? H.chfStyle(res) : H.n(res) + (unite ? ' ' + unite : '')
    });
  }

  /* =====================================================================
   * Catalogue
   * ===================================================================== */

  var objectifs = [
    {
      id: 'C9-droite', module: 'C', annee: 9, niveaux: [1, 2], theme: 'NO 9.2',
      titre: 'Associer un point de la droite numérique à un nombre relatif',
      bornes: { max: [10, 10, 10, 10, 10], den: [1, 2, 4, 10, 5] },
      modeles: [
        { type: 'visuel', gen: function (a, p) { return questionLireDroite(a, p); } },
        { type: 'visuel', gen: function (a, p) { return questionPlacerDroite(a, p); } }
      ]
    },
    {
      id: 'C9-comparer', module: 'C', annee: 9, niveaux: [1, 2], theme: 'NO 9.2',
      titre: 'Comparer, ordonner, encadrer des nombres relatifs et décimaux',
      bornes: { max: [25, 25, 25, 25, 25], den: [1000, 1000, 1000, 1000, 1000] },
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionOrdonnerRelatifs(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionEncadrerRelatif(a, p); } },
        { type: 'directe', gen: function (a, p) { return A9.questionComparerDecimaux(a, Math.max(4, p), { relatifs: true }); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxRelatifs(a, p); } }
      ]
    },
    {
      id: 'C9-signes', module: 'C', annee: 9, niveaux: [1, 2], theme: 'NO 9.2',
      titre: 'Distinguer le signe opératoire et le signe du nombre',
      bornes: { max: [10, 10, 10, 10, 10], den: [1, 1, 1, 1, 1] },
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionSignes(a, p); } }
      ]
    },
    {
      id: 'C9-addsous', module: 'C', annee: 9, niveaux: [1, 2], theme: 'NO 9.2',
      titre: 'Additionner et soustraire des nombres relatifs (écriture simplifiée)',
      bornes: { max: [20, 20, 30, 30, 50], den: [1, 1, 1, 10, 10] },
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionAddSousRelatifs(a, p, c); } },
        { type: 'directe', gen: function (a, p, c) { return questionAddSousRelatifs(a, p, c); } },
        { type: 'erreur', gen: function (a, p) { return erreurAddSousRelatifs(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxRelatifs(a, p); } }
      ]
    },
    {
      id: 'C9-muldiv', module: 'C', annee: 9, niveaux: [1, 2], theme: 'NO 9.2',
      titre: 'Multiplier et diviser des nombres relatifs (règle des signes)',
      bornes: { max: [150, 150, 150, 150, 150], den: [1, 1, 1, 1, 1] },
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionMulDivRelatifs(a, p, c); } },
        { type: 'directe', gen: function (a, p, c) { return questionMulDivRelatifs(a, p, c); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxSigneProduit(a, p); } }
      ]
    },
    {
      id: 'C9-problemes', module: 'C', annee: 9, niveaux: [1, 2], theme: 'NO 9.2',
      titre: 'Résoudre des problèmes avec des nombres relatifs',
      bornes: { max: [100, 100, 100, 100, 100], den: [10, 10, 10, 10, 10] },
      modeles: [
        { type: 'probleme', gen: function (a, p) { return problemeRelatifs(a, p); } }
      ]
    },
    {
      id: 'C10-puissance', module: 'C', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Puissance d\'un entier relatif : (– 2)⁴ et – 2⁴',
      bornes: { max: [6, 6, 6, 6, 6], den: [1, 1, 1, 1, 1] },
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionPuissanceRelatif(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxSigneProduit(a, p); } }
      ]
    },
    {
      id: 'C10-priorites', module: 'C', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Priorité des opérations avec des relatifs ; supprimer les parenthèses inutiles',
      bornes: { max: [100, 100, 100, 100, 100], den: [1, 1, 1, 1, 1] },
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionPrioritesRelatifs(a, p, c); } },
        { type: 'directe', gen: function (a, p, c) { return questionPrioritesRelatifs(a, p, c); } },
        { type: 'directe', gen: function (a, p) { return questionParenthesesInutiles(a, p); } }
      ]
    }
  ];

  return { objectifs: objectifs };
});
