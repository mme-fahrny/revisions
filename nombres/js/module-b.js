/*
 * nombres/js/module-b.js — Module B « Puissances, racines et notation scientifique »
 * 9e (NO 9.1), 10e (NO 10.1, partie puissances), 11e (NO 11.1).
 * Logique pure : voir outils.js pour le format des questions.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'));
  else racine.NombresModuleB = fabrique(racine.NombresOutils);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O) {
  'use strict';

  var M = O.Maths, F = O.F, H = O.H, A = O.A, R = O.RUBRIQUES;
  var fr = O.fr, val = O.val;
  var NB = O.NBSP;
  var sup = M.texteExposant;

  function m(h) { return H.maths(h); }
  function prenom(alea) { return alea.choix(O.PRENOMS); }
  function pui(b, n) { return H.pui(b, n); }
  /** Puissance avec base lettre ou nombre. */
  function puiX(b, n) { return typeof b === 'string' ? b + sup(n) : H.pui(b, n); }
  function txtB(b) { return typeof b === 'string' ? b : '(' + val(b).toString() + ')'; }

  /* =====================================================================
   * 9e : notion de puissance
   * ===================================================================== */

  function tirerPuissance(alea, p) {
    var b, n;
    if (p <= 1) { b = alea.entier(2, 5); n = alea.entier(2, 3); }
    else if (p === 2) { b = alea.entier(2, 9); n = alea.entier(2, b <= 3 ? 5 : 3); }
    else if (p === 3) { b = alea.choix([2, 3, 4, 5, 10, 6, 7]); n = b === 10 ? alea.entier(3, 6) : b === 2 ? alea.entier(4, 8) : alea.entier(2, 4); }
    else { b = alea.choix([2, 3, 5, 10, 11, 12, 1, 0]); n = b === 2 ? alea.entier(6, 10) : b === 10 ? alea.entier(4, 9) : b <= 1 ? alea.entier(3, 9) : alea.entier(2, b === 3 ? 6 : 3); }
    return [b, n];
  }

  function questionCalculerPuissance(alea, p) {
    var bn = tirerPuissance(alea, p);
    var b = bn[0], n = bn[1];
    var v = fr(b).puissance(n);
    var pieges = [{ valeur: fr(b * n), message: 'Tu as multiplié la base par l\'exposant. ' + pui(b, n) + ' veut dire ' + Array(n + 1).join(b + ' · ').slice(0, -3) + '.' }];
    if (b !== n && b > 1 && n > 1) pieges.push({ valeur: fr(n).puissance(b), message: 'Tu as inversé la base et l\'exposant : tu as calculé ' + pui(n, b) + '.' });
    if (b > 1) pieges.push({ valeur: fr(b).puissance(n - 1), message: 'Il y a un facteur de trop ou de moins : compte ' + n + ' facteurs égaux à ' + b + '.' });
    pieges.push({ valeur: fr(b).puissance(n + 1), message: 'Il y a un facteur de trop : ' + pui(b, n) + ' contient exactement ' + n + ' facteurs.' });
    var produit = Array(n + 1).join(b + ' · ').slice(0, -3);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(pui(b, n)) + '</p>',
      consigne: 'Écris le résultat (un nombre entier).',
      indice: pui(b, n) + ' est le produit de ' + n + ' facteurs égaux à ' + b + '.',
      reponse: { type: 'valeur', valeur: v, forme: 'entier' },
      pieges: pieges,
      etapes: O.etapes([['J\'écris la puissance comme un produit de ' + n + ' facteurs égaux à la base ' + b + '.', m(pui(b, n) + ' = ' + produit)], ['Je calcule.', m('= ' + H.n(v))]]),
      verification: b === 10 ? 'Vérification : ' + pui(10, n) + ' s\'écrit 1 suivi de ' + n + ' zéros. ✓' : b <= 1 ? 'Vérification : un produit de facteurs tous égaux à ' + b + ' vaut ' + b + '. ✓' : 'Vérification : ' + m(H.n(v.divise(b)) + ' · ' + b + ' = ' + H.n(v)) + '. ✓',
      rubrique: R.puissances,
      nombres: [fr(b), fr(n)],
      controle: { expr: b + '^' + n }
    });
  }

  function questionEcrirePuissance(alea, p) {
    var bn = tirerPuissance(alea, Math.min(p, 3));
    var b = bn[0] === 10 && p < 3 ? 7 : bn[0], n = Math.max(3, bn[1]);
    if (b <= 1) b = 6;
    var lettre = p >= 3 && alea.suivant() < 0.4 ? alea.choix(['a', 'x']) : null;
    var base = lettre || b;
    var produit = Array(n + 1).join((lettre || b) + ' · ').slice(0, -3);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ce produit sous la forme d\'une seule puissance :</p><p class="calcul">' + m(produit) + '</p>',
      consigne: 'Utilise la touche d\'exposant (xⁿ) : par exemple 5^3 s\'affiche 5³.',
      clavier: 'complet',
      indice: 'Compte les facteurs : c\'est l\'exposant. Le facteur qui se répète est la base.',
      reponse: { type: 'valeur', valeur: lettre ? fr(0) : fr(b).puissance(n), forme: 'puissance', base: base, exposant: n },
      pieges: [{ exposant: n - 1, message: 'Compte bien les facteurs : il y en a ' + n + '.' }, { exposant: n + 1, message: 'Compte bien les facteurs : il y en a ' + n + '.' }],
      etapes: O.etapes([['Il y a ' + n + ' facteurs égaux à ' + base + ' : la base est ' + base + ', l\'exposant est ' + n + '.', m(produit + ' = ' + puiX(base, n))]]),
      verification: 'Vérification : ' + puiX(base, n) + ' se lit « ' + base + ' exposant ' + n + ' ». ✓',
      rubrique: R.puissances,
      nombres: [fr(b), fr(n)],
      controle: { expr: lettre ? lettre + '^' + n : b + '^' + n }
    });
  }

  function questionBaseExposant(alea, p) {
    var bn = tirerPuissance(alea, Math.max(2, p));
    var b = bn[0] <= 1 ? 7 : bn[0], n = bn[1];
    if (b === n) n++;
    var demande = alea.suivant() < 0.5 ? 'base' : 'exposant';
    var rep = demande === 'base' ? b : n;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Dans la puissance ' + m(pui(b, n)) + ', quel est ' + (demande === 'base' ? 'la base' : 'l\'exposant') + ' ?</p>',
      consigne: 'Écris un nombre.',
      indice: 'Dans aⁿ, a est la base et n l\'exposant (écrit en petit, en haut).',
      reponse: { type: 'valeur', valeur: fr(rep), forme: 'entier' },
      pieges: [{ valeur: fr(demande === 'base' ? n : b), message: 'Tu as donné ' + (demande === 'base' ? 'l\'exposant' : 'la base') + '.' }, { valeur: fr(b).puissance(n), message: 'On ne demande pas la valeur de la puissance.' }],
      etapes: O.etapes([['Dans ' + m(pui(b, n)) + ', la base est ' + b + ' et l\'exposant est ' + n + '.', '']]),
      rubrique: R.puissances,
      nombres: [fr(b), fr(n)],
      controle: { expr: String(rep) },
      attenduHtml: String(rep)
    });
  }

  var AFFIRMATIONS_PUISSANCES = [
    function (alea) { var b = alea.entier(2, 9), n = alea.entier(2, 4); return { h: pui(b, n) + ' = ' + (b * n), a: b + '^' + n, b: String(b * n), j: function (v) { return v ? '' : pui(b, n) + ' = ' + Array(n + 1).join(b + ' · ').slice(0, -3) + ' = ' + H.n(fr(b).puissance(n)) + ', et non ' + b + ' · ' + n + '.'; } }; },
    function (alea) { var c = alea.choix([[2, 3], [2, 4], [3, 2], [2, 5]]); return { h: pui(c[0], c[1]) + ' = ' + pui(c[1], c[0]), a: c[0] + '^' + c[1], b: c[1] + '^' + c[0], j: function (v) { return pui(c[0], c[1]) + ' = ' + H.n(fr(c[0]).puissance(c[1])) + ' et ' + pui(c[1], c[0]) + ' = ' + H.n(fr(c[1]).puissance(c[0])) + (v ? ' : ils sont égaux.' : ' : ils sont différents.'); } }; },
    function (alea) { var n = alea.entier(3, 7); return { h: pui(10, n) + ' = 1' + Array(n + 1).join('0').replace(/\B(?=(\d{3})+$)/g, "'"), a: '10^' + n, b: '1' + Array(n + 1).join('0'), j: function (v) { return pui(10, n) + ' s\'écrit 1 suivi de ' + n + ' zéros.'; } }; },
    function (alea) { var n = alea.entier(3, 9); return { h: pui(1, n) + ' = ' + n, a: '1^' + n, b: String(n), j: function (v) { return 'un produit de facteurs tous égaux à 1 vaut 1 : ' + pui(1, n) + ' = 1.'; } }; },
    function (alea) { var n = alea.entier(2, 6); return { h: pui(0, n) + ' = 0', a: '0^' + n, b: '0', j: function (v) { return 'un produit dont un facteur est nul vaut 0.'; } }; },
    function (alea) { var b = alea.entier(2, 6), n = alea.entier(2, 3); return { h: pui(b, n) + ' = ' + H.n(fr(b).puissance(n)), a: b + '^' + n, b: fr(b).puissance(n).toString(), j: function (v) { return pui(b, n) + ' = ' + Array(n + 1).join(b + ' · ').slice(0, -3) + ' = ' + H.n(fr(b).puissance(n)) + '.'; } }; }
  ];

  function vraiFauxPuissance(alea, p) {
    var a = alea.choix(AFFIRMATIONS_PUISSANCES)(alea);
    var vrai = M.evaluer(a.a).egal(M.evaluer(a.b));
    var just = a.j(vrai) || (vrai ? 'le calcul est juste.' : 'le calcul est faux.');
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(a.h) + '</p>',
      vrai: vrai,
      bonne: just,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car on multiplie la base par l\'exposant.', message: 'Non : une puissance est un produit de facteurs égaux à la base.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car on peut échanger la base et l\'exposant.', message: 'En général, on ne peut pas : 2³ = 8 mais 3² = 9.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car l\'exposant indique le nombre de zéros.', message: 'C\'est vrai seulement pour les puissances de 10.' }
      ],
      indice: 'Écris la puissance comme un produit, puis calcule.',
      etapes: O.etapes([[(vrai ? 'Vrai : ' : 'Faux : ') + just, '']]),
      rubrique: R.puissances,
      controle: { type: 'vf', a: a.a, b: a.b, relation: '=' }
    }, alea);
  }

  /* =====================================================================
   * 9e : carrés parfaits et cubes parfaits
   * ===================================================================== */

  function questionTrouverCarre(alea, p) {
    var cube = p >= 2 && alea.suivant() < 0.4;
    // 9e : carrés ⩽ 144 (12²), cubes ⩽ 125 (5³)
    var max = cube ? [0, 3, 4, 5, 5][p] : [0, 8, 10, 12, 12][p];
    var k = alea.entier(2, max);
    var n = cube ? k * k * k : k * k;
    var options = [{ v: n, juste: true }];
    var essais = 0;
    while (options.length < 4 && essais++ < 100) {
      var x = n + alea.choix([-1, 1]) * alea.entier(1, Math.max(3, Math.round(n / 10)));
      if (x <= 1 || x > [0, 64, 100, 144, 144][p] || options.some(function (o) { return o.v === x; })) continue;
      var r = cube ? Math.round(Math.cbrt(x)) : Math.round(Math.sqrt(x));
      if ((cube ? r * r * r : r * r) === x) continue;
      options.push({ v: x, juste: false });
    }
    var nom = cube ? 'cube parfait' : 'carré parfait';
    var choix = options.map(function (o) {
      var r = cube ? Math.floor(Math.cbrt(o.v) + 1e-9) : Math.floor(Math.sqrt(o.v) + 1e-9);
      return {
        h: m(H.n(fr(o.v))), juste: o.juste, cle: String(o.v), valeur: String(o.v),
        message: o.juste ? '' : H.n(fr(o.v)) + ' n\'est pas un ' + nom + ' : ' + (cube ? pui(r, 3) + ' = ' + (r * r * r) + ' et ' + pui(r + 1, 3) + ' = ' + Math.pow(r + 1, 3) : pui(r, 2) + ' = ' + (r * r) + ' et ' + pui(r + 1, 2) + ' = ' + ((r + 1) * (r + 1))) + '.'
      };
    });
    return O.choix({
      type: 'directe',
      enonce: '<p>Lequel de ces nombres est un <strong>' + nom + '</strong> ?</p>',
      consigne: 'Choisis un nombre.',
      choix: choix,
      indice: 'Un ' + nom + ' est ' + (cube ? 'le cube' : 'le carré') + ' d\'un nombre naturel, par exemple ' + (cube ? pui(4, 3) + ' = 64' : pui(7, 2) + ' = 49') + '.',
      etapes: O.etapes([[H.n(fr(n)) + ' est un ' + nom + ' :', m(pui(k, cube ? 3 : 2) + ' = ' + H.n(fr(n)))]]),
      verification: 'Les autres nombres sont compris entre deux ' + (cube ? 'cubes' : 'carrés') + ' parfaits consécutifs.',
      rubrique: R.puissances,
      nombres: options.map(function (o) { return fr(o.v); }),
      controle: { type: cube ? 'cubeParfait' : 'carreParfait', cle: String(n) }
    }, alea);
  }

  function vraiFauxCarreCube(alea, p) {
    var cube = alea.suivant() < 0.5;
    var k = alea.entier(2, cube ? [0, 3, 4, 5, 5][p] : [0, 8, 10, 12, 12][p]);
    var vrai = alea.suivant() < 0.5;
    var n = cube ? k * k * k : k * k;
    if (!vrai) n += (n + 3 > [0, 64, 100, 144, 144][p] ? -1 : alea.choix([-1, 1])) * alea.entier(1, 3);
    var r = cube ? Math.round(Math.cbrt(n)) : Math.round(Math.sqrt(n));
    vrai = (cube ? r * r * r : r * r) === n;
    var nom = cube ? 'cube parfait' : 'carré parfait';
    var rr = cube ? Math.floor(Math.cbrt(n) + 1e-9) : Math.floor(Math.sqrt(n) + 1e-9);
    var just = vrai ? m(H.n(fr(n)) + ' = ' + pui(r, cube ? 3 : 2)) + '.' : H.n(fr(n)) + ' est compris entre ' + m(pui(rr, cube ? 3 : 2) + ' = ' + H.n(fr(Math.pow(rr, cube ? 3 : 2)))) + ' et ' + m(pui(rr + 1, cube ? 3 : 2) + ' = ' + H.n(fr(Math.pow(rr + 1, cube ? 3 : 2)))) + '.';
    return O.vraiFaux({
      enonce: '<p class="calcul">' + H.n(fr(n)) + ' est un ' + nom + '.</p>',
      vrai: vrai,
      bonne: just,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car ' + H.n(fr(n)) + ' est ' + (n % 2 === 0 ? 'pair' : 'impair') + '.', message: 'La parité ne permet pas de savoir si c\'est un ' + nom + '.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car ' + H.n(fr(n)) + ' se termine par ' + (n % 10) + '.', message: 'Le dernier chiffre ne suffit pas : cherche un nombre dont ' + (cube ? 'le cube' : 'le carré') + ' vaut ' + n + '.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car ' + H.n(fr(n)) + ' est divisible par ' + (cube ? 3 : 2) + '.', message: 'Être divisible par ' + (cube ? 3 : 2) + ' n\'a rien à voir avec ' + (cube ? 'un cube' : 'un carré') + ' parfait.' }
      ],
      indice: 'Cherche un nombre naturel dont ' + (cube ? 'le cube' : 'le carré') + ' vaut ' + n + '.',
      etapes: O.etapes([[(vrai ? 'Vrai : ' : 'Faux : ') + just, '']]),
      rubrique: R.puissances,
      nombres: [fr(n)],
      controle: { type: cube ? 'estCube' : 'estCarre', n: n, vrai: vrai }
    }, alea);
  }

  function questionCarreDe(alea, p) {
    var cube = alea.suivant() < 0.35;
    var k = alea.entier(2, cube ? [0, 3, 4, 5, 5][p] : [0, 8, 10, 12, 12][p]);
    var n = cube ? k * k * k : k * k;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Complète :</p><p class="calcul">' + m(H.n(fr(n)) + ' = …' + sup(cube ? 3 : 2)) + '</p>',
      consigne: 'Écris le nombre naturel qui manque.',
      indice: 'Quel nombre, multiplié par lui-même' + (cube ? ' trois fois' : '') + ', donne ' + n + ' ?',
      reponse: { type: 'valeur', valeur: fr(k), forme: 'entier' },
      pieges: [{ valeur: fr(n, cube ? 3 : 2), message: 'Tu as divisé par ' + (cube ? 3 : 2) + '. Cherche un nombre qui, multiplié par lui-même' + (cube ? ' trois fois' : '') + ', donne ' + n + '.' }],
      etapes: O.etapes([['Je cherche le nombre dont ' + (cube ? 'le cube' : 'le carré') + ' vaut ' + n + '.', m(cube ? k + ' · ' + k + ' · ' + k + ' = ' + H.n(fr(n)) : k + ' · ' + k + ' = ' + H.n(fr(n)))]]),
      verification: 'Vérification : ' + m(pui(k, cube ? 3 : 2) + ' = ' + H.n(fr(n))) + '. ✓',
      rubrique: R.puissances,
      nombres: [fr(n)],
      controle: { expr: cube ? '∛' + n : '√' + n }
    });
  }

  /* =====================================================================
   * Priorité des opérations avec des puissances (9e : naturels ; 10e : relatifs, racines)
   * ===================================================================== */

  /**
   * Priorités avec des puissances. Modèles classés par nombre d'opérations :
   * D1 : deux opérations ; D2 : + a² + b² ; D3 : trois opérations ; D4 : avec une racine (10e).
   * relatifs : bases négatives et « – a² » (10e N2 D4, 11e).
   */
  function arbrePuissances(alea, p, relatifs, racines) {
    function e(min, max) { return A.f(relatifs ? alea.entierNonNul(-max, max) : alea.entier(min, max)); }
    function pos(min, max) { return A.f(alea.entier(min, max)); }
    var modeles = ['(a+b)²', 'a·b²', 'a–b²'];
    if (p >= 2) modeles = modeles.concat(['a²+b²']);
    if (p >= 3) modeles = modeles.concat(['a+b²·c', '(a·b)²–c', 'a+b³:c', '(a–b)³+c']);
    if (relatifs) modeles = modeles.concat(['–a²+b', '(–a)²+b']);
    if (racines && p >= 4) modeles = ['√c+a·b²', 'a·√c–b²'].concat(relatifs ? ['–a²+b', '(–a)²+b'] : []);
    var mod = alea.choix(modeles);
    switch (mod) {
      case 'a+b²·c': return A.o('+', e(1, 12), A.o('·', A.p(e(2, 6), 2), e(2, 9)));
      case '(a+b)²': return A.p(A.par(A.o('+', e(1, 6), e(1, 6))), 2);
      case 'a·b²': return A.o('·', e(2, 9), A.p(e(2, 6), 2));
      case 'a²+b²': return A.o('+', A.p(e(2, 9), 2), A.p(e(2, 9), 2));
      case 'a–b²': { var b = alea.entier(2, p <= 1 ? 4 : 5); return A.o('–', pos(b * b + 1, Math.min(b * b + 40, 20 * p)), A.p(relatifs ? e(2, 5) : A.f(b), 2)); }
      case '(a·b)²–c': return A.o('–', A.p(A.par(A.o('·', e(2, 4), e(2, 4))), 2), pos(1, 20));
      case 'a+b³:c': { var c = alea.choix([2, 4, 8]); return A.o('+', e(1, 20), A.o(':', A.p(A.f(alea.choix([2, 4, 6])), 3), A.f(c))); }
      case '(a–b)³+c': return A.o('+', A.p(A.par(A.o('–', e(1, 6), e(1, 6))), 3), e(1, 20));
      case '√c+a·b²': return A.o('+', A.r(A.f(alea.choix([4, 9, 16, 25, 36, 49, 64, 81, 100]))), A.o('·', e(2, 5), A.p(e(2, 4), 2)));
      case '–a²+b': { var x = alea.entier(2, 9); return A.o('+', { op: 'neg2', g: A.p(A.f(x), 2), feuille: false }, e(1, 20)); }
      case '(–a)²+b': return A.o('+', A.p(A.f(-alea.entier(2, 9)), 2), e(1, 20));
      default: return A.o('–', A.o('·', e(2, 5), A.r(A.f(alea.choix([4, 9, 16, 25, 36, 49])))), A.p(e(2, 4), 2));
    }
  }

  function sansNeg2(t) {
    if (t.feuille) return t;
    if (t.op === 'neg2') return { op: '·', g: A.f(-1), d: t.g, moinsDevant: true };
    var c = {}; for (var k in t) c[k] = t[k];
    c.g = sansNeg2(t.g); if (t.d) c.d = sansNeg2(t.d);
    return c;
  }

  function htmlAvecNeg2(t) {
    // – a² + b : affichage spécial
    if (t.op === '+' && t.g.op === 'neg2') return H.moins + A.html(t.g.g) + ' + ' + A.html(t.d, t, 'd', false);
    return A.html(t);
  }

  function questionPrioritesPuissances(alea, p, ctx, opts) {
    opts = opts || {};
    var t, v, essais = 0, neg2;
    do {
      t = arbrePuissances(alea, p, opts.relatifs, opts.racines);
      neg2 = t.op === '+' && t.g.op === 'neg2';
      v = A.valeur(sansNeg2(t));
      essais++;
    } while ((v.abs().compare(1000) > 0 || (!opts.relatifs && v.signe() < 0)) && essais < 50);
    var h = htmlAvecNeg2(t);
    var calc = sansNeg2(t);
    var et;
    var pieges = [];
    if (neg2) {
      var a = t.g.g.g.v, b = t.d.v;
      var a2 = a.puissance(2);
      et = [['La puissance porte seulement sur ' + H.n(a) + ' (le signe – n\'en fait pas partie) : je calcule ' + pui(a, 2) + ' = ' + H.n(a2) + '.', m(h + ' = ' + H.moins + H.n(a2) + ' + ' + H.np(b))], ['J\'additionne.', m('= ' + H.n(v))]];
      pieges.push({ valeur: a2.plus(b), message: 'Attention : ' + H.moins + pui(a, 2) + ' = ' + H.moins + H.n(a2) + ' (l\'opposé du carré). Seul (' + H.moins + H.n(a) + ')² vaut ' + H.n(a2) + '.' });
    } else {
      et = A.etapes(t).map(function (e, i) { return [e[0], m((i === 0 ? h + ' ' : '') + e[1])]; });
      var naif = A.naif(t);
      if (naif && !naif.egal(v)) pieges.push({ valeur: naif, message: 'Tu as calculé de gauche à droite sans respecter les priorités : les puissances passent avant les multiplications et les divisions, qui passent avant les additions et les soustractions.' });
      // (a·b)² confondu avec a·b² ; a²+b² confondu avec (a+b)²
      if (t.op === '·' && t.d.op === '^' && t.d.g.feuille) pieges.push({ valeur: A.valeur(t.g).fois(A.valeur(t.d.g)).puissance(2), message: 'L\'exposant porte seulement sur le nombre juste avant lui : ' + A.html(t) + ' n\'est pas (' + A.html(t.g) + ' · ' + A.html(t.d.g) + ')².' });
      if (t.op === '+' && t.g.op === '^' && t.d.op === '^') pieges.push({ valeur: A.valeur(t.g.g).plus(A.valeur(t.d.g)).puissance(2), message: 'Attention : a² + b² n\'est pas égal à (a + b)².' });
      if (t.op === '^' && t.g.par && t.g.op === '+') pieges.push({ valeur: A.valeur(t.g.g).puissance(2).plus(A.valeur(t.g.d).puissance(2)), message: 'Attention : (a + b)² n\'est pas égal à a² + b² : calcule d\'abord la parenthèse.' });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule en respectant les priorités des opérations :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Écris le résultat.',
      indice: 'D\'abord les parenthèses, puis les puissances et les racines, puis · et :, enfin + et –.',
      reponse: { type: 'valeur', valeur: v },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: 'Vérification : refais le calcul en écrivant chaque étape sur une nouvelle ligne.',
      rubrique: R.priorites,
      nombres: A.feuilles(calc).filter(function (x) { return !(neg2 && x.egal(-1)); }),
      // « – a² + b » : le signe devant la puissance n'est pas une opération
      controle: { expr: neg2 ? '-(' + t.g.g.g.v.toString() + '^2)+(' + t.d.v.toString() + ')' : A.texte(calc) },
      attenduHtml: H.n(v)
    });
  }

  function erreurPrioritesPuissances(alea, p, relatifs) {
    var nom = prenom(alea);
    var type = alea.choix(relatifs ? ['produitCarre', 'moinsCarre', 'sommeCarre', 'juste'] : ['produitCarre', 'sommeCarre', 'gaucheDroite', 'juste']);
    var lignes, cle, correct, eleve;
    var a = alea.entier(2, 5), b = alea.entier(2, 5), c = alea.entier(2, 9);
    if (type === 'produitCarre') {
      lignes = [a + ' · ' + pui(b, 2) + ' = ' + pui(a * b, 2) + ' = ' + (a * b * a * b)];
      correct = a + '*' + b + '^2'; eleve = String(a * b * a * b); cle = 'exposant';
    } else if (type === 'moinsCarre') {
      lignes = [H.moins + pui(a, 2) + ' + ' + c + ' = ' + (a * a) + ' + ' + c + ' = ' + (a * a + c)];
      correct = '-' + a + '^2+' + c; eleve = String(a * a + c); cle = 'signe';
    } else if (type === 'sommeCarre') {
      lignes = ['(' + a + ' + ' + b + ')² = ' + pui(a, 2) + ' + ' + pui(b, 2) + ' = ' + (a * a + b * b)];
      correct = '(' + a + '+' + b + ')^2'; eleve = String(a * a + b * b); cle = 'somme';
    } else if (type === 'gaucheDroite') {
      lignes = [c + ' + ' + a + ' · ' + pui(b, 2) + ' = ' + (c + a) + ' · ' + pui(b, 2) + ' = ' + (c + a) + ' · ' + (b * b) + ' = ' + ((c + a) * b * b)];
      correct = c + '+' + a + '*' + b + '^2'; eleve = String((c + a) * b * b); cle = 'ordre';
    } else {
      lignes = [c + ' + ' + a + ' · ' + pui(b, 2) + ' = ' + c + ' + ' + a + ' · ' + (b * b) + ' = ' + c + ' + ' + (a * b * b) + ' = ' + (c + a * b * b)];
      correct = c + '+' + a + '*' + b + '^2'; eleve = String(c + a * b * b); cle = 'aucune';
    }
    var choix = [
      { h: 'L\'exposant a été appliqué à tout le produit, alors qu\'il porte seulement sur le nombre juste avant lui.', juste: cle === 'exposant', cle: 'exposant', message: 'Regarde sur quel nombre porte l\'exposant.' },
      { h: 'Le carré d\'une somme a été remplacé par la somme des carrés.', juste: cle === 'somme', cle: 'somme', message: 'Regarde s\'il y a une parenthèse à calculer d\'abord.' },
      { h: 'Les priorités n\'ont pas été respectées (calcul de gauche à droite).', juste: cle === 'ordre', cle: 'ordre', message: 'Regarde l\'ordre des opérations.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : refais le calcul toi-même.' }
    ];
    if (relatifs) choix[2] = { h: 'Le signe – devant la puissance a été oublié : – a² est l\'opposé de a².', juste: cle === 'signe', cle: 'signe', message: 'Regarde le signe devant la puissance.' };
    choix.forEach(function (x) { if (x.juste) x.message = ''; });
    var vraie = M.evaluer(correct);
    return O.erreurEleve({
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'Rappel des priorités : parenthèses, puis puissances, puis · et :, enfin + et –.',
      etapes: O.etapes([['Le calcul correct donne :', m(M.versTexte(correct).replace(/-/g, '–') + ' = ' + H.n(vraie))]]),
      verification: cle === 'aucune' ? 'Le calcul ' + O.de(nom) + ' est juste.' : 'Le bon résultat est ' + H.n(vraie) + ', et non ' + eleve + '.',
      rubrique: R.priorites,
      nombres: [fr(a), fr(b), fr(c)],
      controle: { type: 'erreur', correct: correct, eleve: eleve, cle: cle }
    }, alea);
  }

  function vraiFauxSommeCarres(alea, p) {
    var a = alea.entier(2, 9), b = alea.entier(2, 9);
    var genre = alea.choix(['somme', 'produit', 'difference']);
    var gauche, droite, ta, tb;
    if (genre === 'somme') { gauche = pui(a, 2) + ' + ' + pui(b, 2); droite = '(' + a + ' + ' + b + ')²'; ta = a + '^2+' + b + '^2'; tb = '(' + a + '+' + b + ')^2'; }
    else if (genre === 'produit') { gauche = pui(a, 2) + ' · ' + pui(b, 2); droite = '(' + a + ' · ' + b + ')²'; ta = a + '^2*' + b + '^2'; tb = '(' + a + '*' + b + ')^2'; }
    else { gauche = pui(a, 3) + ' + ' + pui(a, 2); droite = pui(a, 5); ta = a + '^3+' + a + '^2'; tb = a + '^5'; }
    var vrai = M.evaluer(ta).egal(M.evaluer(tb));
    var va = M.evaluer(ta), vb = M.evaluer(tb);
    var just = m(gauche + ' = ' + H.n(va)) + ' et ' + m(droite + ' = ' + H.n(vb)) + (vrai ? ' : c\'est la propriété « puissance d\'un produit ».' : '.');
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(gauche + ' = ' + droite) + '</p>',
      vrai: vrai,
      bonne: just,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car on peut toujours « distribuer » l\'exposant.', message: 'L\'exposant se distribue sur un produit, jamais sur une somme : (a + b)² ≠ a² + b².' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car les exposants s\'additionnent.', message: 'On additionne les exposants seulement pour un produit de puissances de même base : aᵐ · aⁿ = aᵐ⁺ⁿ.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car les deux membres ont les mêmes nombres.', message: 'Avoir les mêmes nombres ne suffit pas : calcule chaque membre.' }
      ],
      indice: 'Calcule chaque membre séparément.',
      etapes: O.etapes([['Je calcule chaque membre.', just]]),
      rubrique: R.puissances,
      nombres: [fr(a), fr(b)],
      controle: { type: 'vf', a: ta, b: tb, relation: '=' }
    }, alea);
  }

  /* =====================================================================
   * 10e : écritures (puissance, racine, notation scientifique), exposants négatifs
   * ===================================================================== */

  /** 10e N1 : un même nombre écrit avec une puissance, une racine… Trouver l'écriture qui ne convient pas. */
  var ECRITURES = [
    { n: 16, egales: [['2⁴', '2^4'], ['4²', '4^2'], ['√256', '√256']], fausses: [['2⁸', '2^8'], ['8²', '8^2'], ['√16', '√16']] },
    { n: 64, egales: [['2⁶', '2^6'], ['4³', '4^3'], ['8²', '8^2']], fausses: [['6²', '6^2'], ['3⁴', '3^4'], ['2⁸', '2^8']] },
    { n: 81, egales: [['3⁴', '3^4'], ['9²', '9^2'], ['√6561', '√6561']], fausses: [['3⁵', '3^5'], ['4³', '4^3'], ['3³', '3^3']] },
    { n: 100, egales: [['10²', '10^2'], ['√10\'000', '√10000']], fausses: [['10³', '10^3'], ['50²', '50^2'], ['2⁵⁰', '2^50']] },
    { n: 27, egales: [['3³', '3^3'], ['√729', '√729']], fausses: [['9³', '9^3'], ['3⁹', '3^9'], ['2⁷', '2^7']] },
    { n: 125, egales: [['5³', '5^3'], ['√15\'625', '√15625']], fausses: [['3⁵', '3^5'], ['25³', '25^3'], ['5²', '5^2']] },
    { n: 8, egales: [['2³', '2^3'], ['√64', '√64'], ['∛512', '∛512']], fausses: [['3²', '3^2'], ['4²', '4^2'], ['√4', '√4']] },
    { n: 1000, egales: [['10³', '10^3'], ['√1\'000\'000', '√1000000']], fausses: [['10⁴', '10^4'], ['3¹⁰', '3^10'], ['100³', '100^3']] }
  ];

  function questionEcrituresNombre(alea, p) {
    var e = alea.choix(ECRITURES.filter(function (x) { return x.n <= [0, 20, 100, 200, 300][p]; }));
    var egales = alea.melanger(e.egales).slice(0, Math.min(3, e.egales.length));
    var intrus = alea.choix(e.fausses);
    var choix = egales.map(function (x) { return { h: m(x[0]), juste: false, cle: x[1], valeur: x[1], message: m(x[0]) + ' est bien égal à ' + H.n(fr(e.n)) + '.' }; });
    choix.push({ h: m(intrus[0]), juste: true, cle: 'intrus', valeur: intrus[1], message: '' });
    var vi = M.evaluerApproche(intrus[1]);
    return O.choix({
      type: 'directe',
      enonce: '<p>Une seule de ces écritures n\'est <strong>pas</strong> égale à ' + m(H.n(fr(e.n))) + '. Laquelle ?</p>',
      consigne: 'Choisis l\'intrus.',
      choix: choix,
      indice: 'Calcule chaque puissance (produit de facteurs égaux) ; pour une racine, cherche le nombre dont le carré (ou le cube) vaut le nombre sous la racine.',
      etapes: O.etapes([['L\'intrus est ' + m(intrus[0]) + ' : il vaut ' + (Number.isInteger(vi) && vi < 1e9 ? H.n(fr(vi)) : 'un autre nombre') + ', et non ' + H.n(fr(e.n)) + '.', '']]),
      rubrique: R.puissances,
      nombres: [fr(e.n)],
      controle: { type: 'intrus', expr: String(e.n), mesure: { ops: 1, etapes: 1 } }
    }, alea);
  }

  /** Puissance de 10 : 10ⁿ ↔ écriture décimale. Exposants négatifs seulement si opts.negatifs. */
  function questionPuissance10(alea, p, opts) {
    var neg = !!(opts && opts.negatifs);
    var n = neg && alea.suivant() < 0.6 ? -alea.entier(1, 6) : alea.entier(2, [0, 4, 6, 9, 12][p]);
    var v = fr(10).puissance(n);
    var sens = alea.suivant() < 0.5 ? 'versDecimal' : 'versPuissance';
    if (sens === 'versDecimal') {
      return O.saisie({
        type: 'directe',
        enonce: '<p>Écris ' + m(pui(10, n)) + ' en écriture décimale.</p>',
        consigne: 'Réponse en <strong>écriture décimale</strong> (un nombre, sans puissance).',
        indice: n > 0 ? pui(10, n) + ' : 1 suivi de ' + n + ' zéros.' : pui(10, n) + ' = 1/' + pui(10, -n) + ' : le chiffre 1 est au rang n° ' + (-n) + ' après la virgule.',
        reponse: { type: 'valeur', valeur: v, forme: 'decimal' },
        pieges: n < 0 ? [{ valeur: fr(n), message: pui(10, n) + ' n\'est pas égal à ' + H.n(fr(n)) + ' : l\'exposant négatif indique l\'inverse, ' + pui(10, n) + ' = 1/' + pui(10, -n) + '.' }, { valeur: fr(10).puissance(-n).oppose(), message: 'Un exposant négatif ne donne pas un nombre négatif : ' + pui(10, n) + ' est l\'inverse de ' + pui(10, -n) + '.' }, { valeur: fr(10).puissance(n - 1), message: 'Un zéro de trop : le 1 est à la ' + (-n) + 'e décimale.' }, { valeur: fr(10).puissance(n + 1), message: 'Il manque un zéro : le 1 est à la ' + (-n) + 'e décimale.' }]
          : [{ valeur: fr(10 * n), message: pui(10, n) + ' n\'est pas 10 · ' + n + '.' }],
        etapes: O.etapes(n > 0 ? [[pui(10, n) + ' est le produit de ' + n + ' facteurs 10 : 1 suivi de ' + n + ' zéros.', m(pui(10, n) + ' = ' + H.n(v))]] : [['Un exposant négatif indique l\'inverse.', m(pui(10, n) + ' = ' + H.fh(1, pui(10, -n)) + ' = ' + H.fh(1, H.n(fr(10).puissance(-n))) + ' = ' + H.n(v))]]),
        verification: n < 0 ? 'Vérification : ' + H.n(v) + ' a ' + (-n) + ' décimales. ✓' : 'Vérification : ' + H.n(v) + ' a ' + n + ' zéros. ✓',
        rubrique: R.puissances,
        nombres: [fr(n)],
        controle: { expr: '10^(' + n + ')', conversion: true }
      });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.n(v)) + ' sous la forme d\'une puissance de 10.</p>',
      consigne: 'Utilise la touche d\'exposant (xⁿ), par exemple 10^-3.',
      clavier: 'complet',
      indice: n > 0 ? 'Compte les zéros.' : 'Compte le rang du chiffre 1 après la virgule ; l\'exposant est négatif.',
      reponse: { type: 'valeur', valeur: v, forme: 'puissance', base: 10, exposant: n },
      pieges: [{ exposant: -n, message: n < 0 ? 'Le nombre est plus petit que 1 : l\'exposant est négatif.' : 'Le nombre est plus grand que 1 : l\'exposant est positif.' }, { exposant: n > 0 ? n + 1 : n - 1, message: 'Compte bien : ' + (n > 0 ? n + ' zéros.' : 'le 1 est au ' + (-n) + 'e rang après la virgule.') }, { exposant: n > 0 ? n - 1 : n + 1, message: 'Compte bien : ' + (n > 0 ? n + ' zéros.' : 'le 1 est au ' + (-n) + 'e rang après la virgule.') }],
      etapes: O.etapes([[n > 0 ? 'Il y a ' + n + ' zéros après le 1.' : 'Le chiffre 1 est au ' + (-n) + 'e rang après la virgule : c\'est 1/' + H.n(fr(10).puissance(-n)) + '.', m(H.n(v) + ' = ' + pui(10, n))]]),
      rubrique: R.puissances,
      nombres: [fr(n)],
      controle: { expr: '10^(' + n + ')', conversion: true }
    });
  }

  function questionExposantNegatif(alea, p) {
    var b = alea.choix(p <= 2 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, -2, -3, 10]);
    var n = alea.entier(1, b === 2 || b === -2 ? 5 : 3);
    var v = fr(b).puissance(-n);
    var bh = b < 0 ? '(' + H.moins + Math.abs(b) + ')' : String(b);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule et écris le résultat sous forme de fraction :</p><p class="calcul">' + m(bh + sup(-n)) + '</p>',
      consigne: 'Écris une fraction (ou un nombre décimal).',
      indice: 'a⁻ⁿ est l\'inverse de aⁿ : ' + bh + sup(-n) + ' = 1/' + bh + sup(n) + '.',
      reponse: { type: 'valeur', valeur: v },
      pieges: [{ valeur: fr(b).puissance(n).oppose(), message: 'Un exposant négatif ne rend pas le nombre négatif : a⁻ⁿ est l\'inverse de aⁿ.' }, { valeur: fr(b * -n), message: 'Tu as multiplié la base par l\'exposant.' }, { valeur: fr(b).puissance(n), message: 'Tu as oublié de prendre l\'inverse : a⁻ⁿ = 1/aⁿ.' }],
      etapes: O.etapes([['a⁻ⁿ est l\'inverse de aⁿ.', m(bh + sup(-n) + ' = ' + H.fh(1, bh + sup(n)))], ['Je calcule la puissance.', m('= ' + H.fh(1, H.n(fr(b).puissance(n))) + (fr(b).puissance(n).signe() < 0 ? ' = ' + H.f(v) : ''))]]),
      verification: 'Vérification : ' + m(bh + sup(n) + ' · ' + bh + sup(-n) + ' = 1') + ' (nombres inverses). ✓',
      rubrique: R.puissances,
      nombres: [fr(b), fr(n)],
      controle: { expr: '(' + b + ')^(' + (-n) + ')' }
    });
  }

  function questionEcrituresEgales(alea, p) {
    var b = alea.choix([2, 3, 5]);
    var n = alea.entier(2, b === 2 ? 5 : 3);
    var cible = fr(1, Math.pow(b, n));
    var options = [
      { h: pui(b, -n), t: b + '^(' + (-n) + ')' },
      { h: H.moins + pui(b, n), t: '-(' + b + '^' + n + ')' },
      { h: pui(-b, n), t: '(-' + b + ')^' + n },
      { h: pui(b * n, -1), t: '(' + (b * n) + ')^(-1)' }
    ];
    if (Math.pow(b, n) === b * n) options[3] = { h: H.f(fr(1, b * n + 1)), t: '1/' + (b * n + 1) };
    var choix = options.map(function (o, i) {
      var vo = M.evaluer(o.t);
      return { h: m(o.h), juste: vo.egal(cible), cle: o.t, valeur: o.t, message: vo.egal(cible) ? '' : m(o.h) + ' = ' + H.f(vo) + ', et non ' + H.f(cible) + '.' };
    });
    return O.choix({
      type: 'directe',
      enonce: '<p>Quelle écriture est égale à ' + m(H.f(cible)) + ' ?</p>',
      consigne: 'Choisis une écriture.',
      choix: choix,
      indice: 'a⁻ⁿ est l\'inverse de aⁿ. Attention au signe – : il ne rend pas l\'exposant négatif.',
      etapes: O.etapes([[m(H.f(cible) + ' = ' + H.fh(1, pui(b, n)) + ' = ' + pui(b, -n)), '']]),
      rubrique: R.puissances,
      nombres: [fr(b), fr(n)],
      controle: { type: 'choixValeur', expr: cible.toString() }
    }, alea);
  }

  /* =====================================================================
   * 10e : préfixes
   * ===================================================================== */

  var PREFIXES = [
    { nom: 'téra', s: 'T', e: 12 }, { nom: 'giga', s: 'G', e: 9 }, { nom: 'méga', s: 'M', e: 6 },
    { nom: 'kilo', s: 'k', e: 3 }, { nom: 'centi', s: 'c', e: -2 }, { nom: 'milli', s: 'm', e: -3 },
    { nom: 'micro', s: 'µ', e: -6 }, { nom: 'nano', s: 'n', e: -9 }
  ];

  /** Tableau des préfixes ; sansNegatifs : la colonne « puissance » n'affiche pas 10⁻ⁿ (10e N1). */
  function visuelPrefixes(surligne, sansNegatifs) { return { type: 'prefixes', prefixes: PREFIXES, surligne: surligne, sansNegatifs: !!sansNegatifs }; }
  function positifs() { return PREFIXES.filter(function (x) { return x.e > 0; }); }
  /** Exposants négatifs autorisés : 10e niveau 2 en difficulté 4, et 11e. */
  function expNeg(c, p) { return !!c && (c.annee >= 11 || (c.niveau === 2 && p >= 4)); }
  function choixParDifficulte(alea, p, listes) { return alea.choix(listes[Math.min(p, listes.length) - 1]); }

  function questionPrefixePuissance(alea, p, opts) {
    var neg = !!(opts && opts.negatifs);
    var pr = alea.choix(neg ? PREFIXES : positifs());
    var sens = alea.suivant() < 0.6 ? 'puissance' : 'prefixe';
    if (sens === 'puissance') {
      return O.saisie({
        type: 'directe',
        enonce: '<p>Le préfixe <strong>' + pr.nom + '</strong> (symbole ' + pr.s + ') correspond à quelle puissance de 10 ?</p>',
        consigne: 'Écris une puissance de 10 avec la touche d\'exposant, par exemple 10^3.',
        clavier: 'complet',
        indice: 'Kilo = mille = 10³. Les préfixes suivants vont de 1000 en 1000 (exposants 3, 6, 9, 12) ; milli, micro, nano vont dans l\'autre sens.',
        reponse: { type: 'valeur', valeur: fr(10).puissance(pr.e), forme: 'puissance', base: 10, exposant: pr.e },
        pieges: [{ exposant: -pr.e, message: pr.e > 0 ? pr.nom + ' multiplie l\'unité : l\'exposant est positif.' : pr.nom + ' divise l\'unité : l\'exposant est négatif.' }],
        etapes: O.etapes([['Je lis le tableau des préfixes.', m('1 ' + pr.s + '… = ' + pui(10, pr.e) + ' …')]]),
        rubrique: R.prefixes,
        visuel: visuelPrefixes(null, !neg),
        visuelCorrection: visuelPrefixes(pr.s, !neg),
        nombres: [fr(pr.e)],
        controle: { expr: '10^(' + pr.e + ')' }
      });
    }
    var choix = (neg ? PREFIXES : positifs()).filter(function (x) { return x !== pr; });
    choix = alea.melanger(choix).slice(0, 3).concat([pr]).map(function (x) {
      return { h: x.nom + ' (' + x.s + ')', juste: x === pr, cle: x.nom, message: x === pr ? '' : x.nom + ' correspond à ' + pui(10, x.e) + '.' };
    });
    return O.choix({
      type: 'directe',
      enonce: '<p>Quel préfixe correspond à ' + m(pui(10, pr.e)) + ' ?</p>',
      consigne: 'Choisis un préfixe.',
      choix: choix,
      indice: pr.e > 0 ? 'Le préfixe multiplie l\'unité.' : 'Le préfixe divise l\'unité.',
      etapes: O.etapes([['Je lis le tableau des préfixes : ' + pr.nom + ' (' + pr.s + ') = ' + pui(10, pr.e) + '.', '']]),
      rubrique: R.prefixes,
      visuelCorrection: visuelPrefixes(pr.s, !neg),
      nombres: [fr(pr.e)],
      controle: { type: 'aucun' }
    }, alea);
  }

  var GRANDEURS = [
    { u: 'o', nom: 'octets', prefixes: ['T', 'G', 'M', 'k'], vers: 'o', ctx: function (x, s) { return 'Une clé USB a une capacité de ' + x + ' ' + s + 'o.'; } },
    { u: 'm', nom: 'mètres', prefixes: ['k', 'm', 'µ', 'n'], vers: 'm', ctx: function (x, s) { return s === 'n' ? 'Un virus mesure environ ' + x + ' nm.' : s === 'µ' ? 'Un cheveu a un diamètre d\'environ ' + x + ' µm.' : s === 'm' ? 'Une fourmi mesure ' + x + ' mm.' : 'Le trajet mesure ' + x + ' km.'; } },
    { u: 'W', nom: 'watts', prefixes: ['k', 'M', 'G'], vers: 'W', ctx: function (x, s) { return s === 'G' ? 'Une centrale produit une puissance de ' + x + ' GW.' : s === 'M' ? 'Une éolienne a une puissance de ' + x + ' MW.' : 'Un panneau solaire a une puissance de ' + x + ' kW.'; } }
  ];

  function questionConversionPrefixe(alea, p, opts) {
    var neg = !!(opts && opts.negatifs);
    var g = alea.choix(GRANDEURS);
    var s = alea.choix(g.prefixes.filter(function (x) { return neg || PREFIXES.filter(function (y) { return y.s === x; })[0].e > 0; }));
    var pr = PREFIXES.filter(function (x) { return x.s === s; })[0];
    var x = choixParDifficulte(alea, p, [[fr(2), fr(3), fr(5), fr(8), fr(12), fr(16)], [fr(25), fr(32), fr(64), M.Fraction.depuis('1,5'), M.Fraction.depuis('2,4')],
      [fr(128), fr(150), fr(200), M.Fraction.depuis('7,5'), M.Fraction.depuis('2,4')], [fr(250), fr(256), fr(300), M.Fraction.depuis('1,25'), M.Fraction.depuis('7,5')]]);
    var v = x.fois(fr(10).puissance(pr.e));
    var unite = g.u === 'o' ? 'octets' : g.nom;
    return O.saisie({
      type: 'probleme',
      enonce: '<p>' + g.ctx(H.n(x), s) + '</p><p>Combien cela fait-il en ' + unite + ' (' + g.u + ') ?</p>',
      consigne: 'Écris un nombre, ou un nombre multiplié par une puissance de 10 (par exemple 3 · 10^9).',
      clavier: 'complet',
      suffixe: g.u,
      indice: '1 ' + s + g.u + ' = ' + pui(10, pr.e) + ' ' + g.u + '.',
      reponse: { type: 'valeur', valeur: v, forme: 'sciOuNombre', unite: [g.u, unite] },
      pieges: [{ valeur: x.fois(fr(10).puissance(-pr.e)), message: 'Tu as utilisé l\'exposant ' + (-pr.e) + ' au lieu de ' + pr.e + ' : ' + pr.nom + ' ' + (pr.e > 0 ? 'multiplie' : 'divise') + ' l\'unité.' }, { valeur: x.fois(fr(10).puissance(pr.e > 0 ? pr.e - 3 : pr.e + 3)), message: 'Erreur de préfixe : relis le tableau (1 ' + s + g.u + ' = ' + pui(10, pr.e) + ' ' + g.u + ').' }],
      etapes: O.etapes([['Je lis le tableau des préfixes : 1 ' + s + g.u + ' = ' + pui(10, pr.e) + ' ' + g.u + '.', ''], ['Je multiplie.', m(H.n(x) + ' ' + s + g.u + ' = ' + H.n(x) + ' · ' + pui(10, pr.e) + ' ' + g.u + ' = ' + H.sci(v) + ' ' + g.u + (Math.abs(pr.e) <= 9 ? ' = ' + H.n(v) + ' ' + g.u : ''))]]),
      verification: pr.e > 0 ? 'Vérification : l\'unité ' + g.u + ' est plus petite que ' + s + g.u + ', donc on obtient un nombre plus grand que ' + M.formaterNombre(x) + '. ✓' : 'Vérification : l\'unité ' + g.u + ' est plus grande que ' + s + g.u + ', donc on obtient un nombre plus petit que ' + M.formaterNombre(x) + '. ✓',
      rubrique: R.prefixes,
      visuel: visuelPrefixes(null, !neg),
      visuelCorrection: visuelPrefixes(s, !neg),
      nombres: [x],
      controle: { expr: '(' + x.toString() + ')*10^(' + pr.e + ')', conversion: true }
    });
  }

  /**
   * 10e N1 : milli, centi, micro sans exposant négatif (écriture décimale) : 8 mm = 0,008 m.
   * Les puissances négatives (10⁻³) ne sont introduites qu'au niveau 2, en difficulté 4.
   */
  function questionPrefixeDecimal(alea, p) {
    var pr = alea.choix(p <= 2 ? [{ nom: 'milli', s: 'm', d: 1000 }, { nom: 'centi', s: 'c', d: 100 }] : [{ nom: 'milli', s: 'm', d: 1000 }, { nom: 'centi', s: 'c', d: 100 }, { nom: 'micro', s: 'µ', d: 1000000 }]);
    var x = alea.choix([null, [fr(2), fr(5), fr(8), fr(12), fr(15)], [fr(25), fr(40), fr(75), fr(90)], [fr(120), fr(150), fr(180), fr(200)], [fr(250), fr(300), fr(45), fr(60)]][p]);
    var ctx = alea.choix([
      { t: function (v) { return 'Une fourmi mesure ' + v + ' ' + pr.s + 'm.'; }, u: 'm', nom: 'mètres' },
      { t: function (v) { return 'Une goutte de sirop a une masse de ' + v + ' ' + pr.s + 'g.'; }, u: 'g', nom: 'grammes' }
    ]);
    var v = x.divise(pr.d);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>' + ctx.t(H.n(x)) + '</p><p>Combien cela fait-il en ' + ctx.nom + ' (' + ctx.u + ') ?</p>',
      consigne: 'Réponse en <strong>écriture décimale</strong>.',
      suffixe: ctx.u,
      indice: 'Le préfixe ' + pr.nom + ' (' + pr.s + ') veut dire « divisé par ' + H.n(fr(pr.d)) + ' » : 1 ' + pr.s + ctx.u + ' = ' + M.formaterNombre(fr(1, pr.d)) + ' ' + ctx.u + '.',
      reponse: { type: 'valeur', valeur: v, forme: 'decimal', unite: [ctx.u, ctx.nom] },
      pieges: [{ valeur: x.fois(pr.d), message: 'Tu as multiplié : l\'unité ' + ctx.u + ' est plus grande que ' + pr.s + ctx.u + ', le nombre doit devenir plus petit.' }, { valeur: x.divise(pr.d === 1000 ? 100 : 1000), message: 'Erreur de préfixe : relis le tableau (1 ' + pr.s + ctx.u + ' = ' + M.formaterNombre(fr(1, pr.d)) + ' ' + ctx.u + ').' }],
      etapes: O.etapes([
        ['Je lis le tableau des préfixes : 1 ' + pr.s + ctx.u + ' = ' + H.n(fr(1, pr.d)) + ' ' + ctx.u + '.', ''],
        ['Je divise par ' + H.n(fr(pr.d)) + ' (je déplace la virgule vers la gauche).', m(H.n(x) + ' ' + pr.s + ctx.u + ' = ' + H.n(x) + ' : ' + H.n(fr(pr.d)) + ' ' + ctx.u + ' = ' + H.n(v) + ' ' + ctx.u)]
      ]),
      verification: 'Vérification : l\'unité ' + ctx.u + ' est plus grande, donc on obtient un nombre plus petit que ' + M.formaterNombre(x) + '. ✓',
      rubrique: R.prefixes,
      visuel: visuelPrefixes(null, true),
      visuelCorrection: visuelPrefixes(pr.s === 'c' ? 'c' : pr.s, true),
      nombres: [x],
      controle: { expr: '(' + x.toString() + ')*(1/' + pr.d + ')' }
    });
  }

  function problemePrefixes(alea, p) {
    var modele = alea.choix(['photos', 'films']);
    if (modele === 'photos') {
      var cap = alea.choix([fr(1), fr(2), fr(4)]); // To
      var photo = alea.choix([fr(2), fr(4), fr(5), fr(8)]); // Mo
      var n = cap.fois(fr(10).puissance(12)).divise(photo.fois(fr(10).puissance(6)));
      return O.saisie({
        type: 'probleme',
        enonce: '<p>Un disque dur externe a une capacité de ' + H.n(cap) + ' To. Une photo occupe en moyenne ' + H.n(photo) + ' Mo.</p><p>Combien de photos peut-on enregistrer au maximum ?</p>',
        consigne: 'Écris un nombre (ou un nombre multiplié par une puissance de 10).',
        clavier: 'complet',
        suffixe: 'photos',
        indice: 'Écris les deux capacités en octets avec des puissances de 10 (1 To = 10¹² o ; 1 Mo = 10⁶ o), puis divise.',
        reponse: { type: 'valeur', valeur: n, forme: 'sciOuNombre', unite: 'photos' },
        pieges: [{ valeur: cap.divise(photo), message: 'Les deux capacités ne sont pas dans la même unité : convertis-les en octets.' }, { valeur: n.divise(1000), message: 'Erreur de préfixe : 1 To = 10¹² o et 1 Mo = 10⁶ o, le rapport est 10⁶.' }],
        etapes: O.etapes([['J\'écris les capacités en octets.', m(H.n(cap) + ' To = ' + H.n(cap) + ' · ' + pui(10, 12) + ' o ; ' + H.n(photo) + ' Mo = ' + H.n(photo) + ' · ' + pui(10, 6) + ' o')], ['Je divise.', m(H.fh(H.n(cap) + ' · ' + pui(10, 12), H.n(photo) + ' · ' + pui(10, 6)) + ' = ' + H.n(cap.divise(photo)) + ' · ' + pui(10, 6) + ' = ' + H.n(n))]]),
        verification: 'Vérification : ' + H.n(n) + ' · ' + H.n(photo) + ' Mo = ' + H.n(n.fois(photo)) + ' Mo = ' + H.n(cap) + ' To. ✓',
        rubrique: R.prefixes,
        visuel: visuelPrefixes(null, true),
        nombres: [cap, photo],
        // deux conversions (en parallèle), puis une division
        controle: { expr: '(' + cap.toString() + ')*10^12/((' + photo.toString() + ')*10^6)', mesure: { ops: 3, etapes: 2 } }
      });
    }
    var debit = alea.choix([fr(50), fr(100), fr(200), fr(250)].filter(function (x) { return x.compare(Math.max(50, [0, 20, 100, 200, 300][p])) <= 0; })); // Mo par seconde
    var taille = alea.choix([fr(2), fr(4), fr(5), fr(10)]); // Go
    var t = taille.fois(1000).divise(debit);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Un réseau permet de télécharger ' + H.n(debit) + ' Mo par seconde. Un film occupe ' + H.n(taille) + ' Go.</p><p>Combien de secondes faut-il pour télécharger le film ?</p>',
      consigne: 'Écris un nombre de secondes.',
      suffixe: 's',
      indice: '1 Go = 1000 Mo.',
      reponse: { type: 'valeur', valeur: t, unite: ['s', 'secondes'] },
      pieges: [{ valeur: taille.divise(debit), message: 'Convertis d\'abord les Go en Mo (1 Go = 1000 Mo).' }],
      etapes: O.etapes([['Je convertis la taille en Mo.', m(H.n(taille) + ' Go = ' + H.n(taille.fois(1000)) + ' Mo')], ['Je divise par le débit.', m(H.n(taille.fois(1000)) + ' : ' + H.n(debit) + ' = ' + H.n(t))]]),
      verification: 'Vérification : ' + H.n(t) + ' s · ' + H.n(debit) + ' Mo/s = ' + H.n(taille.fois(1000)) + ' Mo. ✓',
      rubrique: R.prefixes,
      visuel: visuelPrefixes(null, true),
      nombres: [debit, taille],
      controle: { expr: '(' + taille.toString() + ')*1000/(' + debit.toString() + ')' }
    });
  }

  /* =====================================================================
   * 10e : notation scientifique
   * ===================================================================== */

  /**
   * Nombre à écrire en notation scientifique. D1 : entier (deux chiffres significatifs) ;
   * D2 : décimaux, exposant jusqu'à 9 ; D3-D4 : mantisse plus longue, exposant jusqu'à 12.
   * Exposant négatif seulement si neg (10e N2 D4, 11e).
   */
  function tirerNombreSci(alea, p, neg) {
    var dec = alea.entier(0, p <= 1 ? 1 : p === 2 ? 2 : 3);
    var mant = new F(alea.entier(Math.pow(10, dec), 10 * Math.pow(10, dec) - 1), Math.pow(10, dec));
    while (mant.fois(Math.pow(10, dec)).estEntier() && dec > 0 && Number(mant.fois(Math.pow(10, dec)).num) % 10 === 0) mant = mant.plus(fr(1, Math.pow(10, dec)));
    var e = p <= 1 ? alea.entier(3, 7) : p === 2 ? alea.entier(2, 9) : alea.entier(3, p >= 4 ? 12 : 9);
    if (neg && alea.suivant() < 0.5) e = -alea.entier(1, p >= 4 ? 9 : 5);
    return { mant: mant, e: e, v: mant.fois(fr(10).puissance(e)) };
  }

  function questionEcrireSci(alea, p, opts) {
    var s = tirerNombreSci(alea, p, opts && opts.negatifs);
    var depart, departH, kDec = 0;
    var nonNormalise = p >= 3 && alea.suivant() < 0.5;
    if (nonNormalise) {
      var k = alea.choix([-2, -1, 1, 2]);
      kDec = k;
      depart = s.mant.fois(fr(10).puissance(k));
      departH = H.n(depart) + NB + '·' + NB + '10' + sup(s.e - k);
    } else {
      departH = H.n(s.v);
    }
    var dec = s.e;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ce nombre en notation scientifique :</p><p class="calcul">' + m(departH) + '</p>',
      consigne: 'Forme exigée : <strong>a · 10ⁿ avec 1 ⩽ a &lt; 10</strong> (un seul chiffre non nul devant la virgule). Exemple de saisie : 3,2 · 10^4.',
      clavier: 'complet',
      indice: nonNormalise ? 'Le nombre devant la puissance de 10 n\'est pas entre 1 et 10 : déplace la virgule et corrige l\'exposant.' : 'Le nombre est ' + (s.e >= 0 ? 'plus grand' : 'plus petit') + ' que 1 : l\'exposant est ' + (s.e >= 0 ? 'positif' : 'négatif') + '. Compte de combien de rangs la virgule se déplace.',
      reponse: { type: 'valeur', valeur: s.v, forme: 'scientifique' },
      pieges: [{ valeur: s.mant.fois(fr(10).puissance(-s.e)), message: 'Attention au signe de l\'exposant : un nombre ' + (s.e >= 0 ? 'plus grand' : 'plus petit') + ' que 1 a un exposant ' + (s.e >= 0 ? 'positif' : 'négatif') + '.' }, { valeur: s.mant.fois(fr(10).puissance(s.e + 1)), message: 'Tu t\'es trompé·e d\'un rang en comptant le déplacement de la virgule.' }, { valeur: s.mant.fois(fr(10).puissance(s.e - 1)), message: 'Tu t\'es trompé·e d\'un rang en comptant le déplacement de la virgule.' }],
      etapes: O.etapes(nonNormalise ? [
        ['J\'écris d\'abord ' + H.n(depart) + ' en notation scientifique.', m(H.n(depart) + ' = ' + H.sciME(s.mant, kDec))],
        ['Produit de puissances de 10 : j\'additionne les exposants.', m(H.sciME(s.mant, kDec) + ' · 10' + sup(s.e - kDec) + ' = ' + H.sciME(s.mant, s.e))]
      ] : [
        ['Je détermine le signe de l\'exposant : le nombre est ' + (s.e >= 0 ? 'plus grand que 1, l\'exposant est positif.' : 'plus petit que 1, l\'exposant est négatif.'), ''],
        ['Je place la virgule après le premier chiffre non nul : ' + H.n(s.mant) + '. La virgule s\'est déplacée de ' + Math.abs(s.e) + ' rang' + (Math.abs(s.e) > 1 ? 's' : '') + '.', m(H.n(s.v) + ' = ' + H.sciME(s.mant, s.e))]
      ]),
      verification: 'Vérification : ' + H.n(s.mant) + ' est bien compris entre 1 et 10. ✓',
      rubrique: R.notationScientifique,
      nombres: [s.mant, fr(s.e)],
      controle: { expr: '(' + s.mant.toString() + ')*10^(' + s.e + ')', conversion: true },
      signature: 'sci:' + s.v.toString()
    });
  }

  function questionSciVersDecimal(alea, p, opts) {
    var s = tirerNombreSci(alea, Math.min(p, 3), opts && opts.negatifs);
    if (Math.abs(s.e) > 7) s = { mant: s.mant, e: s.e > 0 ? 6 : -5, v: s.mant.fois(fr(10).puissance(s.e > 0 ? 6 : -5)) };
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris en écriture décimale :</p><p class="calcul">' + m(H.sciME(s.mant, s.e)) + '</p>',
      consigne: 'Réponse en <strong>écriture décimale</strong> (sans puissance de 10).',
      indice: 'Multiplier par ' + pui(10, s.e) + ', c\'est déplacer la virgule de ' + Math.abs(s.e) + ' rang' + (Math.abs(s.e) > 1 ? 's' : '') + ' vers la ' + (s.e > 0 ? 'droite' : 'gauche') + '.',
      reponse: { type: 'valeur', valeur: s.v, forme: 'decimal' },
      pieges: [{ valeur: s.mant.fois(fr(10).puissance(-s.e)), message: 'Tu as déplacé la virgule dans le mauvais sens.' }],
      etapes: O.etapes([['Je déplace la virgule de ' + Math.abs(s.e) + ' rang' + (Math.abs(s.e) > 1 ? 's' : '') + ' vers la ' + (s.e > 0 ? 'droite' : 'gauche') + '.', m(H.sciME(s.mant, s.e) + ' = ' + H.n(s.v))]]),
      rubrique: R.notationScientifique,
      nombres: [s.mant, fr(s.e)],
      controle: { expr: '(' + s.mant.toString() + ')*10^(' + s.e + ')', conversion: true }
    });
  }

  function vraiFauxSci(alea, p, opts) {
    var genre = alea.choix(['petit', 'grand', 'ok', 'ok', 'zero']);
    var s = tirerNombreSci(alea, p, opts && opts.negatifs);
    var mantTexte, e = s.e;
    if (genre === 'petit') { mantTexte = M.formaterNombre(s.mant.divise(10)); e = s.e + 1; }
    else if (genre === 'grand') { mantTexte = M.formaterNombre(s.mant.fois(alea.choix([10, 100]))); e = s.e - 1; }
    else if (genre === 'zero') { mantTexte = M.formaterNombre(s.mant.divise(100)); e = s.e + 2; }
    else mantTexte = M.formaterNombre(s.mant);
    var texte = mantTexte + ' · 10^' + e;
    var vrai = M.estNotationScientifique(texte);
    var affiche = mantTexte + NB + '·' + NB + '10' + sup(e);
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(affiche) + ' est écrit en notation scientifique.</p>',
      vrai: vrai,
      bonne: vrai ? 'le nombre devant la puissance de 10 est compris entre 1 et 10 (un seul chiffre non nul devant la virgule).' : 'le nombre ' + mantTexte + ' n\'est pas compris entre 1 et 10 : en notation scientifique, on écrit ' + H.sci(s.v) + '.',
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car il y a une puissance de 10.', message: 'Une puissance de 10 ne suffit pas : il faut aussi 1 ⩽ a &lt; 10.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car l\'exposant doit être positif.', message: 'L\'exposant peut être négatif (nombres plus petits que 1).' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car il faut une virgule dans le premier nombre.', message: 'Ce n\'est pas la règle : 1 ⩽ a &lt; 10, avec ou sans virgule.' }
      ],
      indice: 'Notation scientifique : a · 10ⁿ avec 1 ⩽ a &lt; 10.',
      etapes: O.etapes([['Je regarde le nombre devant la puissance de 10 : ' + mantTexte + '.', ''], [(vrai ? 'Il' : 'Il n\'') + ' est ' + (vrai ? '' : 'pas ') + 'compris entre 1 et 10.', '']]),
      rubrique: R.notationScientifique,
      nombres: [s.mant],
      controle: { type: 'estSci', texte: texte, vrai: vrai }
    }, alea);
  }

  /* Ordres de grandeur réels (valeurs approchées connues ; voir le résumé : à vérifier) */
  var OBJETS = [
    { q: 'la taille d\'une cellule humaine (environ)', e: -5, u: 'm' },
    { q: 'la taille d\'une bactérie (environ)', e: -6, u: 'm' },
    { q: 'la taille d\'un atome (environ)', e: -10, u: 'm' },
    { q: 'l\'épaisseur d\'une feuille de papier (environ)', e: -4, u: 'm' },
    { q: 'la distance Terre–Lune (environ 384\'000 km)', e: 8, u: 'm' },
    { q: 'la distance Terre–Soleil (environ 150 millions de km)', e: 11, u: 'm' },
    { q: 'la longueur de la Suisse d\'est en ouest (environ 350 km)', e: 5, u: 'm' },
    { q: 'la capacité d\'un téléphone de 128 Go', e: 11, u: 'octets' },
    { q: 'la population de la Suisse (environ 9 millions d\'habitants)', e: 6, u: 'habitants' },
    { q: 'la vitesse de la lumière (environ 300\'000 km/s)', e: 8, u: 'm/s' }
  ];

  function questionOrdreGrandeurSci(alea, p, opts) {
    var neg = opts && opts.negatifs;
    var o = alea.choix(OBJETS.filter(function (x) { return neg || x.e > 0; }));
    var exposants = [o.e];
    var decalages = alea.melanger([-6, -3, 3, 6, -4, 4].filter(function (k) { return neg || o.e + k > 0; }));
    for (var i = 0; exposants.length < 4 && i < decalages.length; i++) exposants.push(o.e + decalages[i]);
    if (exposants.length < 4) exposants.push(o.e + 9);
    var choix = exposants.map(function (e) {
      return { h: m(pui(10, e) + ' ' + o.u), juste: e === o.e, cle: String(e), message: e === o.e ? '' : (e > o.e ? 'Beaucoup trop grand' : 'Beaucoup trop petit') + ' : ' + pui(10, e) + ' ' + o.u + ' = ' + (e >= 0 ? '1 suivi de ' + e + ' zéros.' : '0,' + Array(-e).join('0') + '1 ' + o.u + '.') };
    });
    return O.choix({
      type: 'directe',
      enonce: '<p>Quel est l\'ordre de grandeur de ' + o.q + ' ?</p>',
      consigne: 'Choisis la puissance de 10 la plus proche.',
      choix: choix,
      indice: 'Écris d\'abord la grandeur dans l\'unité demandée' + (o.u === 'm' ? ' (en mètres : 1 km = 10³ m, 1 mm = 10⁻³ m, 1 µm = 10⁻⁶ m).' : '.'),
      etapes: O.etapes([['L\'ordre de grandeur de ' + o.q + ' est ' + m(pui(10, o.e) + ' ' + o.u) + '.', '']]),
      verification: 'Ces valeurs sont des ordres de grandeur (valeurs approchées).',
      rubrique: R.notationScientifique,
      visuelCorrection: o.u === 'm' ? visuelPrefixes(null, !neg) : null,
      controle: { type: 'aucun' }
    }, alea);
  }

  function questionComparerSci(alea, p, opts) {
    var neg = opts && opts.negatifs;
    var a = tirerNombreSci(alea, p, neg), b = tirerNombreSci(alea, p, neg);
    if (alea.suivant() < 0.5) b = { mant: tirerNombreSci(alea, p).mant, e: a.e + alea.choix([-1, 1]), v: null };
    if (!neg && b.e < 1) b.e = 1;
    b.v = b.mant.fois(fr(10).puissance(b.e));
    if (a.v.egal(b.v)) b = { mant: b.mant, e: b.e + 1, v: b.mant.fois(fr(10).puissance(b.e + 1)) };
    var s = a.v.compare(b.v);
    var bon = s < 0 ? '<' : '>';
    var ha = H.sciME(a.mant, a.e), hb = H.sciME(b.mant, b.e);
    var choix = ['<', '=', '>'].map(function (sym) {
      return { h: m(ha + ' ' + (sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '=') + ' ' + hb), juste: sym === bon, cle: sym, message: sym === bon ? '' : 'Compare d\'abord les exposants : le nombre qui a le plus grand exposant est le plus grand (si les deux sont en notation scientifique et positifs).' };
    });
    return O.choix({
      type: 'directe',
      enonce: '<p>Compare ces deux nombres :</p><p class="calcul">' + m(ha + ' et ' + hb) + '</p>',
      consigne: 'Choisis le bon signe.',
      choix: choix,
      ordreFixe: true,
      indice: 'Compare d\'abord les exposants ; s\'ils sont égaux, compare les nombres devant.',
      etapes: O.etapes([a.e !== b.e ? ['Les exposants sont différents : ' + H.n(fr(a.e)) + ' et ' + H.n(fr(b.e)) + '. Le plus grand exposant donne le plus grand nombre.', m(ha + ' ' + (bon === '<' ? '&lt;' : '&gt;') + ' ' + hb)] : ['Les exposants sont égaux : je compare ' + H.n(a.mant) + ' et ' + H.n(b.mant) + '.', m(ha + ' ' + (bon === '<' ? '&lt;' : '&gt;') + ' ' + hb)]]),
      rubrique: R.notationScientifique,
      nombres: [a.mant, b.mant, fr(a.e), fr(b.e)],
      controle: { type: 'compare', a: '(' + a.mant.toString() + ')*10^(' + a.e + ')', b: '(' + b.mant.toString() + ')*10^(' + b.e + ')', cle: bon }
    }, alea);
  }

  /* =====================================================================
   * 10e : racines carrées et cubiques
   * ===================================================================== */

  function questionRacine(alea, p, ctx) {
    var cubique = alea.suivant() < 0.4;
    // 10e : carrés parfaits ⩽ 225 (15²), cubes parfaits ⩽ 1000 (10³) ; racine cubique d'un négatif en D4
    var k = alea.entier(cubique ? 1 : 2, cubique ? [0, 4, 5, 10, 10][p] : [0, 10, 15, 15, 15][p]);
    var negatif = cubique && p >= 4 && alea.suivant() < 0.5;
    var n = cubique ? k * k * k : k * k;
    if (negatif) n = -n;
    var res = negatif ? -k : k;
    var signe = cubique ? '∛' : '√';
    var nh = negatif ? '(' + H.moins + Math.abs(n) + ')' : H.n(fr(n));
    var nH = H.n(fr(n));
    var pieges = [{ valeur: fr(n, cubique ? 3 : 2), message: 'Tu as divisé par ' + (cubique ? 3 : 2) + '. ' + (cubique ? 'La racine cubique' : 'La racine carrée') + ' de ' + nH + ' est le nombre dont ' + (cubique ? 'le cube' : 'le carré') + ' vaut ' + nH + '.' }];
    if (!cubique) pieges.push({ valeur: fr(-k), message: '√' + n + ' est le nombre POSITIF dont le carré vaut ' + n + '. On écrit √' + n + ' = ' + k + ' (et non – ' + k + ').' });
    if (negatif) pieges.push({ valeur: fr(k), message: 'Le cube d\'un nombre négatif est négatif : ' + pui(-k, 3) + ' = ' + nH + '. Donc ∛(' + nH + ') = ' + H.n(fr(-k)) + '.' });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(signe + nh) + '</p>',
      consigne: 'Écris un nombre entier.',
      indice: 'Cherche le nombre dont ' + (cubique ? 'le cube' : 'le carré') + ' vaut ' + nH + '.',
      reponse: { type: 'valeur', valeur: fr(res), forme: 'entier' },
      pieges: pieges,
      etapes: O.etapes([['Je cherche le nombre ' + (cubique ? '' : 'positif ') + 'dont ' + (cubique ? 'le cube' : 'le carré') + ' vaut ' + nH + '.', m((res < 0 ? '(' + H.moins + k + ')' : k) + sup(cubique ? 3 : 2) + ' = ' + H.n(fr(n)))], ['Donc :', m(signe + nh + ' = ' + H.n(fr(res)))]]),
      verification: 'Vérification : ' + m((res < 0 ? '(' + H.moins + k + ')' : k) + sup(cubique ? 3 : 2) + ' = ' + H.n(fr(n))) + '. ✓',
      rubrique: R.racines,
      nombres: [fr(n)],
      controle: { expr: signe + '(' + n + ')' }
    });
  }

  var AFFIRMATIONS_RACINES = [
    function (alea) { var k = alea.entier(2, 12); return { h: '√' + (k * k) + ' = ' + H.moins + k, vrai: false, j: '√' + (k * k) + ' est le nombre positif dont le carré vaut ' + (k * k) + ' : √' + (k * k) + ' = ' + k + '.' }; },
    function (alea) { var k = alea.entier(2, 9); return { h: '√(' + H.moins + (k * k) + ') = ' + H.moins + k, vrai: false, j: 'un nombre négatif n\'a pas de racine carrée dans ℝ (un carré n\'est jamais négatif).' }; },
    function (alea) { var k = alea.entier(2, 6); return { h: '∛(' + H.moins + (k * k * k) + ') = ' + H.moins + k, vrai: true, j: 'la racine cubique d\'un nombre négatif existe : (– ' + k + ')³ = – ' + (k * k * k) + '.' }; },
    function (alea) { var c = alea.choix([[9, 16], [36, 64], [25, 144], [16, 9], [81, 144], [64, 36]]); var s = Math.sqrt(c[0] + c[1]); return { h: '√' + c[0] + ' + √' + c[1] + ' = √' + (c[0] + c[1]), vrai: false, j: '√' + c[0] + ' + √' + c[1] + ' = ' + Math.sqrt(c[0]) + ' + ' + Math.sqrt(c[1]) + ' = ' + (Math.sqrt(c[0]) + Math.sqrt(c[1])) + (Number.isInteger(s) ? ', alors que √' + (c[0] + c[1]) + ' = ' + s : ', alors que √' + (c[0] + c[1]) + ' n\'est même pas un entier (' + (Math.floor(s)) + ' &lt; √' + (c[0] + c[1]) + ' &lt; ' + (Math.floor(s) + 1) + ')') + ' : √a + √b ≠ √(a + b).' }; },
    function (alea) { var a = alea.choix([4, 9, 16, 25]), b = alea.choix([4, 9, 16, 25, 36]); return { h: '√(' + a + ' · ' + b + ') = √' + a + ' · √' + b, vrai: true, j: '√(' + a + ' · ' + b + ') = √' + (a * b) + ' = ' + Math.sqrt(a * b) + ' et √' + a + ' · √' + b + ' = ' + Math.sqrt(a) + ' · ' + Math.sqrt(b) + ' = ' + (Math.sqrt(a) * Math.sqrt(b)) + '.' }; },
    function (alea) { var r = alea.entier(2, 12), k = r * r; return { h: '(√' + k + ')² = ' + k, vrai: true, j: 'par définition, le carré de √' + k + ' vaut ' + k + ' (√' + k + ' = ' + r + ' et ' + r + '² = ' + k + ').' }; }
  ];

  function vraiFauxRacine(alea, p) {
    var a = alea.choix(AFFIRMATIONS_RACINES)(alea);
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(a.h) + '</p>',
      vrai: a.vrai,
      bonne: a.j,
      mauvaises: [
        { h: (a.vrai ? 'Faux' : 'Vrai') + ', car une racine carrée peut être positive ou négative.', message: '√a désigne toujours le nombre POSITIF dont le carré vaut a.' },
        { h: (a.vrai ? 'Faux' : 'Vrai') + ', car la racine d\'une somme est la somme des racines.', message: 'Non : √a + √b ≠ √(a + b). C\'est vrai pour un produit, pas pour une somme.' },
        { h: (a.vrai ? 'Vrai' : 'Faux') + ', car on divise par 2 pour obtenir la racine carrée.', message: 'Prendre la racine carrée n\'est pas diviser par 2.' }
      ],
      indice: 'Rappel : √a est le nombre positif dont le carré vaut a.',
      etapes: O.etapes([[(a.vrai ? 'Vrai : ' : 'Faux : ') + a.j, '']]),
      rubrique: R.racines,
      controle: { type: 'vfTexte', vrai: a.vrai }
    }, alea);
  }

  /* =====================================================================
   * 10e : propriétés des puissances (N2 : évalué ; N1 : « Pour aller plus loin »)
   * ===================================================================== */

  /**
   * Propriétés des puissances. D1 : produit de même base ; D2 : + quotient, puissance d'une puissance ;
   * D3 : + même exposant (2³ · 5³) ; D4 : + exposants négatifs (si opts.negatifs).
   */
  function questionPropriete(alea, p, opts) {
    opts = opts || {};
    // niveau 1 (opts.simple) : une propriété de moins à chaque difficulté, pas de lettres
    var genres = opts.simple
      ? [['produit'], ['produit', 'quotient'], ['produit', 'quotient', 'puissance'], ['produit', 'quotient', 'puissance', 'produitBases']][p - 1]
      : [['produit'], ['produit', 'quotient', 'puissance'], ['produit', 'quotient', 'puissance', 'produitBases'], ['produit', 'quotient', 'puissance', 'produitBases']][p - 1];
    if (opts && opts.negatifs && p >= 4) genres = genres.concat(['negatif', 'negatif']);
    var genre = alea.choix(genres);
    var base = !opts.simple && p >= 3 && alea.suivant() < 0.4 ? alea.choix(['a', 'x']) : alea.choix([2, 3, 5, 7, 10]);
    var m1 = alea.entier(2, 7), n1 = alea.entier(2, 6);
    var h, exp, et, pieges, baseRep = base, b1 = 0, b2 = 0;
    if (genre === 'produit') {
      exp = m1 + n1; h = puiX(base, m1) + ' · ' + puiX(base, n1);
      et = [['Produit de puissances de même base : on garde la base et on additionne les exposants.', m(h + ' = ' + base + '<sup>' + m1 + ' + ' + n1 + '</sup> = ' + puiX(base, exp))]];
      pieges = [{ exposant: m1 * n1, message: 'Pour un produit de puissances de même base, on additionne les exposants (on ne les multiplie pas).' }];
    } else if (genre === 'quotient') {
      if (m1 <= n1) { var t = m1; m1 = n1 + 1; n1 = t; }
      exp = m1 - n1; h = puiX(base, m1) + ' : ' + puiX(base, n1);
      et = [['Quotient de puissances de même base : on garde la base et on soustrait les exposants.', m(h + ' = ' + base + '<sup>' + m1 + ' – ' + n1 + '</sup> = ' + puiX(base, exp))]];
      pieges = [{ exposant: m1 + n1, message: 'Pour un quotient, on soustrait les exposants.' }];
      if (m1 % n1 === 0) pieges.push({ exposant: m1 / n1, message: 'Pour un quotient, on soustrait les exposants (on ne les divise pas).' });
    } else if (genre === 'puissance') {
      m1 = alea.entier(2, 5); n1 = alea.entier(2, 4);
      exp = m1 * n1; h = '(' + puiX(base, m1) + ')' + sup(n1);
      et = [['Puissance d\'une puissance : on garde la base et on multiplie les exposants.', m(h + ' = ' + base + '<sup>' + m1 + ' · ' + n1 + '</sup> = ' + puiX(base, exp))]];
      pieges = [{ exposant: m1 + n1, message: 'Pour une puissance de puissance, on multiplie les exposants (on ne les additionne pas).' }];
    } else if (genre === 'produitBases') {
      b1 = alea.choix([2, 4, 5]); b2 = b1 === 5 ? 2 : 5;
      if (b1 === 4) b2 = alea.choix([5, 2]);
      n1 = alea.entier(2, 6);
      base = b1 * b2; baseRep = base;
      exp = n1; h = pui(b1, n1) + ' · ' + pui(b2, n1);
      et = [['Même exposant : produit de puissances de même exposant = puissance du produit des bases.', m(h + ' = (' + b1 + ' · ' + b2 + ')' + sup(n1) + ' = ' + pui(base, n1))]];
      pieges = [{ exposant: 2 * n1, message: 'Les bases sont différentes : on multiplie les bases et on garde l\'exposant commun.' }];
    } else {
      base = typeof base === 'string' ? base : 10; baseRep = base;
      m1 = alea.entierNonNul(-8, 8); n1 = alea.entierNonNul(-8, 8);
      exp = m1 + n1;
      h = puiX(base, m1) + ' · ' + puiX(base, n1);
      et = [['Produit de puissances de même base : on additionne les exposants (attention aux signes).', m(h + ' = ' + (typeof base === 'string' ? base : '10') + '<sup>' + H.n(fr(m1)) + ' + ' + (n1 < 0 ? '(' + H.moins + Math.abs(n1) + ')' : n1) + '</sup> = ' + puiX(base, exp))]];
      pieges = [{ exposant: m1 * n1, message: 'On additionne les exposants (on ne les multiplie pas).' }, { exposant: m1 - n1, message: 'Attention aux signes : ' + m1 + ' + (' + n1 + ') = ' + exp + '.' }];
    }
    pieges = pieges.filter(function (pg) { return pg.exposant !== exp; });
    var valeur = typeof baseRep === 'string' ? fr(0) : fr(baseRep).puissance(exp);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris sous la forme d\'une seule puissance :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Écris une seule puissance (touche xⁿ), par exemple ' + (typeof baseRep === 'string' ? baseRep : baseRep) + '^5.',
      clavier: 'complet',
      indice: { produit: 'Même base, produit : additionne les exposants.', quotient: 'Même base, quotient : soustrais les exposants.', puissance: 'Puissance d\'une puissance : multiplie les exposants.', produitBases: 'Même exposant : multiplie les bases.', negatif: 'Même base, produit : additionne les exposants (attention aux signes).' }[genre],
      reponse: { type: 'valeur', valeur: valeur, forme: 'puissance', base: baseRep, exposant: exp },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: typeof baseRep === 'string' || Math.abs(exp) > 6 ? 'Vérification : compte les facteurs ' + baseRep + ' (ou applique la propriété dans l\'autre sens).' : 'Vérification : ' + m(h + ' = ' + H.n(valeur)) + ' et ' + m(pui(baseRep, exp) + ' = ' + H.n(valeur)) + '. ✓',
      rubrique: R.proprietesPuissances,
      nombres: [fr(m1), fr(n1)],
      controle: { expr: genre === 'puissance' ? '(' + txtB(base) + '^(' + m1 + '))^(' + n1 + ')' : genre === 'produitBases' ? b1 + '^' + n1 + '*' + b2 + '^' + n1 : txtB(base) + '^(' + m1 + ')' + (genre === 'quotient' ? ':' : '*') + txtB(base) + '^(' + n1 + ')', mesure: { ops: 1, etapes: 1 } }
    });
  }

  function vraiFauxProprietes(alea, p, opts) {
    var b = alea.choix([2, 3, 5]), m1 = alea.entier(2, 4), n1 = alea.entier(2, 4);
    var cas = alea.choix([
      { h: pui(b, m1) + ' + ' + pui(b, n1) + ' = ' + pui(b, m1 + n1), a: b + '^' + m1 + '+' + b + '^' + n1, b2: b + '^' + (m1 + n1), j: 'on additionne les exposants pour un PRODUIT de puissances de même base, pas pour une somme : ' + pui(b, m1) + ' + ' + pui(b, n1) + ' = ' + H.n(fr(b).puissance(m1).plus(fr(b).puissance(n1))) + ' et ' + pui(b, m1 + n1) + ' = ' + H.n(fr(b).puissance(m1 + n1)) + '.' },
      { h: pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b, m1 + n1), a: b + '^' + m1 + '*' + b + '^' + n1, b2: b + '^' + (m1 + n1), j: 'produit de puissances de même base : on additionne les exposants.' },
      { h: '(' + pui(b, m1) + ')' + sup(n1) + ' = ' + pui(b, m1 + n1), a: '(' + b + '^' + m1 + ')^' + n1, b2: b + '^' + (m1 + n1), j: 'pour une puissance de puissance, on multiplie les exposants : (' + pui(b, m1) + ')' + sup(n1) + ' = ' + pui(b, m1 * n1) + '.' },
      opts && opts.negatifs ? { h: pui(b, m1) + ' · ' + pui(b, -m1) + ' = 1', a: b + '^' + m1 + '*' + b + '^(-' + m1 + ')', b2: '1', j: pui(b, m1) + ' et ' + pui(b, -m1) + ' sont des nombres inverses : leur produit vaut 1.' } : null,
      { h: pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b * b, m1 + n1), a: b + '^' + m1 + '*' + b + '^' + n1, b2: (b * b) + '^' + (m1 + n1), j: 'on garde la base : ' + pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b, m1 + n1) + '.' },
      { h: pui(2, n1) + ' · ' + pui(5, n1) + ' = ' + pui(10, n1), a: '2^' + n1 + '*5^' + n1, b2: '10^' + n1, j: 'même exposant : on multiplie les bases, 2 · 5 = 10.' }
    ].filter(Boolean));
    var vrai = M.evaluer(cas.a).egal(M.evaluer(cas.b2));
    if (vrai && cas.h.indexOf(' + ') > 0) vrai = true;
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(cas.h) + '</p>',
      vrai: vrai,
      bonne: cas.j,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car on additionne toujours les exposants.', message: 'Non : on additionne les exposants seulement pour un produit de puissances de même base.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car on multiplie toujours les exposants.', message: 'Non : on multiplie les exposants seulement pour une puissance de puissance.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car les bases sont égales.', message: 'Que les bases soient égales ne suffit pas : regarde l\'opération.' }
      ],
      indice: 'Calcule les deux membres avec de petits nombres pour vérifier.',
      etapes: O.etapes([[(vrai ? 'Vrai : ' : 'Faux : ') + cas.j, '']]),
      rubrique: R.proprietesPuissances,
      nombres: [fr(b), fr(m1), fr(n1)],
      controle: { type: 'vf', a: cas.a, b: cas.b2, relation: '=', mesure: { ops: 1, etapes: 1 } }
    }, alea);
  }

  function erreurProprietes(alea, p) {
    var b = alea.choix([2, 3, 5, 7]), m1 = alea.entier(2, 5), n1 = alea.entier(2, 5);
    var nom = prenom(alea);
    var type = alea.choix(['bases', 'exposants', 'juste']);
    var lignes, cle, eleve;
    if (type === 'bases') { lignes = [pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b * b, m1 + n1)]; eleve = (b * b) + '^' + (m1 + n1); cle = 'bases'; }
    else if (type === 'exposants') { lignes = [pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b, m1 * n1)]; eleve = b + '^' + (m1 * n1); cle = 'exposants'; if (m1 * n1 === m1 + n1) cle = 'aucune'; }
    else { lignes = [pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b, m1 + n1)]; eleve = b + '^' + (m1 + n1); cle = 'aucune'; }
    var choix = [
      { h: 'Les bases ont été multipliées : on doit garder la base.', juste: cle === 'bases', cle: 'bases', message: 'Regarde la base du résultat.' },
      { h: 'Les exposants ont été multipliés au lieu d\'être additionnés.', juste: cle === 'exposants', cle: 'exposants', message: 'Regarde l\'exposant du résultat.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : ' + pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b, m1 + n1) + '.' },
      { h: 'Les exposants auraient dû être soustraits.', juste: false, cle: 'sous', message: 'On soustrait les exposants pour un quotient, pas pour un produit.' }
    ];
    choix.forEach(function (c) { if (c.juste) c.message = ''; });
    return O.erreurEleve({
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'aᵐ · aⁿ = aᵐ⁺ⁿ : on garde la base, on additionne les exposants.',
      etapes: O.etapes([['Produit de puissances de même base : on garde la base et on additionne les exposants.', m(pui(b, m1) + ' · ' + pui(b, n1) + ' = ' + pui(b, m1 + n1))]]),
      rubrique: R.proprietesPuissances,
      nombres: [fr(b), fr(m1), fr(n1)],
      controle: { type: 'erreur', correct: b + '^' + m1 + '*' + b + '^' + n1, eleve: eleve, cle: cle, mesure: { ops: 1, etapes: 1 } }
    }, alea);
  }

  /* =====================================================================
   * 11e : inverse, opposé, racines de rationnels
   * ===================================================================== */

  /** √(9/16), √0,49, ∛(– 8/27) : D1 petits carrés (dénominateur ⩽ 9) ; la taille augmente avec la difficulté. */
  function questionRacineRationnel(alea, p) {
    var genre = alea.choix(p <= 1 ? ['fraction', 'decimal'] : ['fraction', 'decimal', 'cubique']);
    var res, rad, rh, signe = '√';
    if (genre === 'fraction') {
      var a = alea.entier(1, [0, 3, 9, 9, 12][p]), b = alea.entier(2, [0, 3, 9, 12, 12][p]);
      if (O.pgcd(a, b) !== 1) a = 1;
      res = fr(a, b); rad = res.puissance(2); rh = '(' + H.f(rad) + ')';
    } else if (genre === 'decimal') {
      var k = alea.entier(1, p <= 2 ? 9 : 12);
      res = fr(k, 10); if (k % 10 === 0) res = fr(11, 10);
      rad = res.puissance(2); rh = H.n(rad);
    } else {
      signe = '∛';
      var c = alea.entier(1, p <= 2 ? 2 : 5), d = alea.entier(2, p <= 2 ? 3 : 5);
      if (O.pgcd(c, d) !== 1) c = 1;
      res = fr(c, d); if (alea.suivant() < 0.5) res = res.oppose();
      rad = res.puissance(3); rh = '(' + H.f(rad) + ')';
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(signe + rh) + '</p>',
      consigne: 'Écris une fraction ou un nombre décimal.',
      indice: genre === 'decimal' ? 'Écris ' + M.formaterNombre(rad) + ' sous forme de fraction (sur 100 ou 10\'000), puis prends la racine du numérateur et du dénominateur.' : 'Prends la racine du numérateur et celle du dénominateur.',
      reponse: { type: 'valeur', valeur: res },
      pieges: [{ valeur: rad.divise(signe === '√' ? 2 : 3), message: 'Prendre la racine n\'est pas diviser par ' + (signe === '√' ? 2 : 3) + '.' }].concat(signe === '√' ? [{ valeur: res.oppose(), message: 'Une racine carrée est toujours positive.' }] : [{ valeur: res.oppose(), message: 'Attention au signe : la racine cubique d\'un nombre négatif est négative.' }]),
      etapes: O.etapes(genre === 'decimal' ? [['J\'écris le nombre sous forme de fraction.', m(H.n(rad) + ' = ' + H.f(rad))], ['Je prends la racine du numérateur et du dénominateur.', m('√' + H.n(rad) + ' = ' + H.f(res) + ' = ' + H.n(res))]] : [['Je prends la racine du numérateur et du dénominateur.', m(signe + rh + ' = ' + H.f(res))]]),
      verification: 'Vérification : ' + m((res.signe() < 0 ? '(' + H.f(res) + ')' : '(' + H.f(res) + ')') + sup(signe === '√' ? 2 : 3) + ' = ' + H.f(rad)) + '. ✓',
      rubrique: R.racines,
      nombres: [rad],
      controle: { expr: signe + '(' + rad.toString() + ')' },
      attenduHtml: genre === 'decimal' ? H.n(res) : H.f(res)
    });
  }

  function questionInversePuissance(alea, p) {
    var b = alea.choix([2, 3, 4, 5, 10]), n = alea.entier(1, b === 2 ? 5 : 3);
    var neg = alea.suivant() < 0.5;
    var x = fr(b).puissance(neg ? -n : n);
    var demande = alea.suivant() < 0.5 ? 'inverse' : 'opposé';
    var res = demande === 'inverse' ? x.inverse() : x.oppose();
    return O.saisie({
      type: 'directe',
      enonce: '<p>Quel est l\'<strong>' + demande + '</strong> de ' + m(pui(b, neg ? -n : n)) + ' ?</p>',
      consigne: 'Écris un nombre ou une fraction (pas de puissance).',
      indice: demande === 'inverse' ? 'L\'inverse de aⁿ est a⁻ⁿ (produit égal à 1). Calcule ensuite sa valeur.' : 'L\'opposé change le signe (somme nulle). Calcule d\'abord la puissance.',
      reponse: { type: 'valeur', valeur: res },
      pieges: [{ valeur: demande === 'inverse' ? x.oppose() : x.inverse(), message: demande === 'inverse' ? 'Tu as donné l\'opposé : l\'inverse est le nombre dont le produit avec ' + pui(b, neg ? -n : n) + ' vaut 1.' : 'Tu as donné l\'inverse : l\'opposé est le nombre dont la somme avec ' + pui(b, neg ? -n : n) + ' vaut 0.' }],
      etapes: O.etapes([['Je calcule la puissance.', m(pui(b, neg ? -n : n) + ' = ' + H.f(x))], ['Je cherche ' + (demande === 'inverse' ? 'l\'inverse (produit égal à 1).' : 'l\'opposé (somme nulle).'), m(demande === 'inverse' ? H.f(x) + ' · ' + H.f(res) + ' = 1' : H.f(x) + ' + (' + H.f(res) + ') = 0')]]),
      rubrique: R.opposeInverse,
      nombres: [fr(b), fr(n)],
      controle: { expr: demande === 'inverse' ? '1/(' + b + '^(' + (neg ? -n : n) + '))' : '-(' + b + '^(' + (neg ? -n : n) + '))' },
      attenduHtml: H.f(res)
    });
  }

  /* =====================================================================
   * 11e : propriétés et notation scientifique
   * ===================================================================== */

  function questionCalculSci(alea, p) {
    var op = alea.choix(['·', ':']);
    var a = alea.entier(1, 9), b = op === '·' ? alea.entier(1, 9) : alea.choix([2, 4, 5, 8]);
    var ea = alea.entierNonNul(-8, 9), eb = alea.entierNonNul(-8, 9);
    var ma = fr(a), mb = fr(b);
    var res = op === '·' ? ma.fois(fr(10).puissance(ea)).fois(mb.fois(fr(10).puissance(eb))) : ma.fois(fr(10).puissance(ea)).divise(mb.fois(fr(10).puissance(eb)));
    var mres = op === '·' ? ma.fois(mb) : ma.divise(mb);
    var eres = op === '·' ? ea + eb : ea - eb;
    var ha = H.sciME(ma, ea), hb = H.sciME(mb, eb);
    var et = [['Je regroupe les nombres et les puissances de 10.', m('(' + H.n(ma) + ' ' + op + ' ' + H.n(mb) + ') · (10' + sup(ea) + ' ' + op + ' 10' + sup(eb) + ')')],
      ['Je calcule : ' + (op === '·' ? 'on additionne les exposants.' : 'on soustrait les exposants.'), m('= ' + H.n(mres) + ' · 10' + sup(eres))]];
    if (mres.compare(10) >= 0 || mres.compare(1) < 0) et.push(['J\'écris le résultat en notation scientifique (1 ⩽ a &lt; 10).', m('= ' + H.sci(res))]);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule et donne le résultat en notation scientifique :</p><p class="calcul">' + m('(' + ha + ') ' + op + ' (' + hb + ')') + '</p>',
      consigne: 'Forme exigée : <strong>notation scientifique</strong> a · 10ⁿ avec 1 ⩽ a &lt; 10.',
      clavier: 'complet',
      indice: 'Calcule séparément ' + H.n(ma) + ' ' + op + ' ' + H.n(mb) + ' et 10' + sup(ea) + ' ' + op + ' 10' + sup(eb) + '.',
      reponse: { type: 'valeur', valeur: res, forme: 'scientifique' },
      pieges: [{ valeur: mres.fois(fr(10).puissance(op === '·' ? ea * eb : ea + eb)), message: op === '·' ? 'Pour multiplier des puissances de 10, on additionne les exposants.' : 'Pour diviser des puissances de 10, on soustrait les exposants.' }],
      etapes: O.etapes(et),
      verification: 'Vérification : le nombre devant la puissance de 10 est compris entre 1 et 10. ✓',
      rubrique: R.notationScientifique,
      nombres: [ma, mb, fr(ea), fr(eb)],
      // l'élève multiplie (ou divise) les nombres et additionne (ou soustrait) les exposants, puis écrit le résultat
      controle: { expr: '(' + a + '*10^(' + ea + '))' + (op === '·' ? '*' : ':') + '(' + b + '*10^(' + eb + '))', mesure: { ops: 2, etapes: 2 } },
      signature: op === '·' ? 'sciprod:' + [a + 'e' + ea, b + 'e' + eb].sort().join('*') : 'scidiv:' + a + 'e' + ea + ':' + b + 'e' + eb
    });
  }

  function erreurSci(alea, p) {
    var a = alea.entier(2, 9), b = alea.entier(2, 9);
    while (a * b < 10) b++;
    var ea = alea.entier(2, 8), eb = alea.entierNonNul(-6, 6);
    var nom = prenom(alea);
    var vraie = fr(a * b).fois(fr(10).puissance(ea + eb));
    var type = alea.choix(['pasNormalise', 'exposants', 'juste']);
    var lignes, cle, eleve, formeSeulement = false;
    var pr = fr(a * b);
    if (type === 'pasNormalise') { lignes = ['(' + H.sciME(fr(a), ea) + ') · (' + H.sciME(fr(b), eb) + ') = ' + H.n(pr) + ' · 10' + sup(ea + eb)]; eleve = String(a * b) + '*10^(' + (ea + eb) + ')'; cle = 'forme'; formeSeulement = true; }
    else if (type === 'exposants') { lignes = ['(' + H.sciME(fr(a), ea) + ') · (' + H.sciME(fr(b), eb) + ') = ' + H.n(pr) + ' · 10' + sup(ea * eb) + ' = ' + H.sci(pr.fois(fr(10).puissance(ea * eb)))]; eleve = '(' + pr.toString() + ')*10^(' + (ea * eb) + ')'; cle = 'exposants'; if (ea * eb === ea + eb) cle = 'aucune'; }
    else { lignes = ['(' + H.sciME(fr(a), ea) + ') · (' + H.sciME(fr(b), eb) + ') = ' + H.n(pr) + ' · 10' + sup(ea + eb) + ' = ' + H.sci(vraie)]; eleve = vraie.toString(); cle = 'aucune'; }
    var choix = [
      { h: 'Le résultat n\'est pas en notation scientifique (le nombre devant n\'est pas entre 1 et 10).', juste: cle === 'forme', cle: 'forme', message: 'Regarde le nombre devant la puissance de 10.' },
      { h: 'Les exposants ont été multipliés au lieu d\'être additionnés.', juste: cle === 'exposants', cle: 'exposants', message: 'Regarde l\'exposant obtenu.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : le résultat attendu est ' + H.sci(vraie) + '.' },
      { h: 'Il fallait additionner ' + a + ' et ' + b + '.', juste: false, cle: 'add', message: 'Non : dans un produit, on multiplie ' + a + ' et ' + b + '.' }
    ];
    choix.forEach(function (c) { if (c.juste) c.message = ''; });
    return O.erreurEleve({
      enonce: '<p>On demande le résultat en notation scientifique.</p>',
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'Vérifie l\'exposant, puis vérifie que le nombre devant est compris entre 1 et 10.',
      etapes: O.etapes([['Je multiplie les nombres et j\'additionne les exposants.', m(H.n(pr) + ' · 10' + sup(ea + eb))], ['J\'écris en notation scientifique.', m('= ' + H.sci(vraie))]]),
      rubrique: R.notationScientifique,
      nombres: [fr(a), fr(b), fr(ea), fr(eb)],
      controle: { type: 'erreur', correct: '(' + a + '*10^(' + ea + '))*(' + b + '*10^(' + eb + '))', eleve: eleve, cle: cle, formeSeulement: formeSeulement, mesure: { ops: 2, etapes: 2 } }
    }, alea);
  }

  function problemeSci(alea, p) {
    var modele = alea.choix(['lumiere', 'serveur', 'globules']);
    if (modele === 'lumiere') {
      var d = alea.choix([[M.Fraction.depuis('1,5'), 8, 'le Soleil'], [M.Fraction.depuis('3,84'), 5, 'la Lune']]);
      var dist = d[0].fois(fr(10).puissance(d[1]));
      var t = dist.divise(fr(3).fois(fr(10).puissance(5)));
      return O.saisie({
        type: 'probleme',
        enonce: '<p>La lumière parcourt environ ' + H.sciME(fr(3), 5) + ' km par seconde. La distance entre la Terre et ' + d[2] + ' est d\'environ ' + H.sciME(d[0], d[1]) + ' km.</p><p>Combien de secondes la lumière met-elle pour venir de ' + d[2] + ' jusqu\'à la Terre ?</p>',
        consigne: 'Écris un nombre (ou un nombre multiplié par une puissance de 10).',
        clavier: 'complet',
        suffixe: 's',
        indice: 'Temps = distance : vitesse.',
        reponse: { type: 'valeur', valeur: t, forme: 'sciOuNombre', unite: ['s', 'secondes'] },
        pieges: [{ valeur: dist.fois(fr(3).fois(fr(10).puissance(5))), message: 'Il faut diviser la distance par la vitesse, pas multiplier.' }],
        etapes: O.etapes([['Temps = distance : vitesse.', m('(' + H.sciME(d[0], d[1]) + ') : (' + H.sciME(fr(3), 5) + ')')], ['Je divise les nombres et je soustrais les exposants.', m('= ' + H.n(d[0].divise(3)) + ' · 10' + sup(d[1] - 5) + ' = ' + H.n(t))]]),
        verification: 'Vérification : ' + H.n(t) + ' s ' + (t.compare(100) > 0 ? '≈ ' + H.arrondi(t.divise(60), 1) + ' minutes' : '≈ ' + H.arrondi(t, 1) + ' secondes') + ', c\'est l\'ordre de grandeur connu. ✓',
        rubrique: R.notationScientifique,
        nombres: [d[0], fr(d[1])],
        controle: { expr: '(' + d[0].toString() + '*10^' + d[1] + ')/(3*10^5)', mesure: { ops: 2, etapes: 2 } }
      });
    }
    if (modele === 'serveur') {
      var cap = alea.choix([fr(2), M.Fraction.depuis('2,4'), fr(3), fr(6)]);
      var video = alea.choix([M.Fraction.depuis('1,2'), M.Fraction.depuis('1,5'), fr(3), fr(4)]);
      var n = cap.fois(1000).divise(video);
      if (!n.estEntier()) { cap = fr(6); video = fr(3); n = fr(2000); }
      return O.saisie({
        type: 'probleme',
        enonce: '<p>Le serveur d\'une école stocke ' + H.n(cap) + ' To de données (1 To = 10³ Go). Une vidéo de cours occupe ' + H.n(video) + ' Go.</p><p>Combien de vidéos de cours ce serveur peut-il contenir ?</p>',
        consigne: 'Écris un nombre.',
        clavier: 'complet',
        suffixe: 'vidéos',
        indice: 'Convertis d\'abord les To en Go.',
        reponse: { type: 'valeur', valeur: n, forme: 'sciOuNombre', unite: 'vidéos' },
        pieges: [{ valeur: cap.divise(video), message: 'Convertis d\'abord ' + M.formaterNombre(cap) + ' To en Go.' }],
        etapes: O.etapes([['Je convertis en Go.', m(H.n(cap) + ' To = ' + H.n(cap) + ' · 10³ Go = ' + H.n(cap.fois(1000)) + ' Go')], ['Je divise.', m(H.n(cap.fois(1000)) + ' : ' + H.n(video) + ' = ' + H.n(n))]]),
        rubrique: R.notationScientifique,
        nombres: [cap, video],
        controle: { expr: '(' + cap.toString() + ')*1000/(' + video.toString() + ')', mesure: { ops: 2, etapes: 2 } }
      });
    }
    var taille = alea.choix([8, 5, 4, 2]); // µm
    var longueur = alea.choix([1, 2, 5]); // cm
    var n2 = fr(longueur).fois(fr(10).puissance(-2)).divise(fr(taille).fois(fr(10).puissance(-6)));
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Un globule rouge a un diamètre d\'environ ' + taille + ' µm (1 µm = 10⁻⁶ m).</p><p>Combien de globules rouges faudrait-il aligner pour obtenir une longueur de ' + longueur + ' cm (1 cm = 10⁻² m) ?</p>',
      consigne: 'Écris un nombre.',
      clavier: 'complet',
      suffixe: 'globules',
      indice: 'Écris les deux longueurs en mètres avec des puissances de 10, puis divise.',
      reponse: { type: 'valeur', valeur: n2, forme: 'sciOuNombre', unite: 'globules' },
      pieges: [{ valeur: fr(longueur, taille), message: 'Les deux longueurs ne sont pas dans la même unité.' }],
      etapes: O.etapes([['J\'écris les longueurs en mètres.', m(longueur + ' cm = ' + longueur + ' · 10⁻² m ; ' + taille + ' µm = ' + taille + ' · 10⁻⁶ m')], ['Je divise : on soustrait les exposants.', m(H.fh(longueur + ' · 10⁻²', taille + ' · 10⁻⁶') + ' = ' + H.n(fr(longueur, taille)) + ' · 10⁴ = ' + H.n(n2))]]),
      rubrique: R.notationScientifique,
      visuel: visuelPrefixes(null),
      nombres: [fr(taille), fr(longueur)],
      controle: { expr: '(' + longueur + '*10^(-2))/(' + taille + '*10^(-6))', mesure: { ops: 3, etapes: 2 } }
    });
  }

  function questionOrdonnerPuissances(alea, p) {
    var pool = alea.melanger([
      { t: '2^(-3)', h: pui(2, -3), s: '2^-3' },
      { t: '0.1', h: '0,1', s: '0,1' },
      { t: '10^(-2)', h: pui(10, -2), s: '10^-2' },
      { t: '1/9', h: H.f(fr(1, 9)), s: '1/9' },
      { t: '√(0.04)', h: '√0,04', s: '√0,04' },
      { t: '3^(-1)', h: pui(3, -1), s: '3^-1' },
      { t: '0.15', h: '0,15', s: '0,15' },
      { t: '(-2)^3', h: pui(-2, 3), s: '(-2)^3' },
      { t: '-(2^2)', h: H.moins + pui(2, 2), s: '-2^2' }
    ]);
    var items = [];
    pool.forEach(function (it) {
      if (items.length >= 4) return;
      var v = M.evaluerApproche(it.t);
      if (items.some(function (x) { return Math.abs(x.v - v) < 1e-9; })) return;
      it.v = v; items.push(it);
    });
    var croissant = alea.suivant() < 0.6;
    var tries = items.slice().sort(function (a, b) { return croissant ? a.v - b.v : b.v - a.v; });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Range ces nombres dans l\'ordre <strong>' + (croissant ? 'croissant' : 'décroissant') + '</strong> :</p><p class="calcul">' + m(items.map(function (i) { return i.h; }).join(NB + '; ')) + '</p>',
      consigne: 'Recopie les nombres séparés par « ; » (touches xⁿ et √ disponibles).',
      clavier: 'complet',
      indice: 'Écris chaque nombre en écriture décimale.',
      reponse: { type: 'liste', valeurs: tries.map(function (i) { return i.v; }), ordonne: true, croissant: croissant, textes: tries.map(function (i) { return i.s; }), textesHtml: tries.map(function (i) { return i.h; }) },
      etapes: O.etapes([['J\'écris chaque nombre en écriture décimale.', m(items.map(function (i) { return i.h + ' = ' + H.n(M.evaluer(i.t.replace('√(0.04)', '0.2'))); }).join(NB + '; '))], ['Je range.', m(tries.map(function (i) { return i.h; }).join(croissant ? ' &lt; ' : ' &gt; '))]]),
      rubrique: R.comparer,
      controle: { type: 'ordre', exprs: items.map(function (i) { return i.t; }), croissant: croissant }
    });
  }

  function questionComparerPuissances(alea, p) {
    var paires = [
      ['2^10', pui(2, 10), '10^3', pui(10, 3)], ['3^(-2)', pui(3, -2), '0.1', '0,1'], ['(-2)^3', pui(-2, 3), '-(2^2)', H.moins + pui(2, 2)],
      ['2^5', pui(2, 5), '5^2', pui(5, 2)], ['√50', '√50', '7', '7'], ['10^(-3)', pui(10, -3), '2^(-10)', pui(2, -10)], ['(-3)^2', pui(-3, 2), '-(3^2)', H.moins + pui(3, 2)],
      ['∛30', '∛30', '3', '3'], ['2^(-1)', pui(2, -1), '0.25', '0,25']
    ];
    var c = alea.choix(paires);
    var va = M.evaluerApproche(c[0]), vb = M.evaluerApproche(c[2]);
    var bon = va < vb ? '<' : va > vb ? '>' : '=';
    var choix = ['<', '=', '>'].map(function (sym) {
      return { h: m(c[1] + ' ' + (sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '=') + ' ' + c[3]), juste: sym === bon, cle: sym, message: sym === bon ? '' : 'Calcule une valeur (exacte ou approchée) de chaque nombre avant de comparer.' };
    });
    function aff(v) { return Number.isInteger(v) ? H.n(fr(v)) : '≈ ' + H.arrondi(M.Fraction.depuis(Number(v.toFixed(8))), 4); }
    return O.choix({
      type: 'directe',
      enonce: '<p>Compare ' + m(c[1]) + ' et ' + m(c[3]) + '.</p>',
      consigne: 'Choisis le bon signe.',
      choix: choix,
      ordreFixe: true,
      indice: 'Calcule chaque nombre.',
      etapes: O.etapes([['Je calcule chaque nombre.', m(c[1] + ' ' + (Number.isInteger(va) ? '= ' : '') + aff(va) + ' ; ' + c[3] + ' ' + (Number.isInteger(vb) ? '= ' : '') + aff(vb))], ['Conclusion.', m(c[1] + ' ' + (bon === '<' ? '&lt;' : bon === '>' ? '&gt;' : '=') + ' ' + c[3])]]),
      rubrique: R.comparer,
      controle: { type: 'compareApprox', a: c[0], b: c[2], cle: bon }
    }, alea);
  }

  /* =====================================================================
   * 11e niveau 2 : racine n-ième, propriétés des racines
   * ===================================================================== */

  /**
   * 11e N2 : sens de la racine n-ième (questions théoriques, sans calcul à effectuer).
   * « ⁿ√a = b » signifie « bⁿ = a ».
   */
  function questionSensRacineN(alea, p) {
    var c = alea.choix(p <= 2 ? [[4, 81, 3], [4, 16, 2], [5, 32, 2], [6, 64, 2]] : [[4, 81, 3], [4, 16, 2], [5, 32, 2], [6, 64, 2], [4, 625, 5]]);
    var n = c[0], a = c[1], b = c[2];
    var h = '<sup>' + n + '</sup>√' + a + ' = ' + b;
    var choix = [
      { h: m(b + sup(n) + ' = ' + a), juste: true, cle: 'bon', message: '' },
      { h: m(a + ' : ' + n + ' = ' + b), juste: false, cle: 'div', message: 'Prendre une racine n\'est pas diviser par l\'indice.' },
      { h: m(n + sup(b) + ' = ' + a), juste: false, cle: 'inv', message: 'Attention à l\'ordre : c\'est ' + b + ' qui est élevé à la puissance ' + n + ' (l\'indice devient l\'exposant).' },
      { h: m(b + ' · ' + n + ' = ' + a), juste: false, cle: 'mul', message: 'Une puissance n\'est pas un produit de la base par l\'exposant.' }
    ];
    return O.choix({
      type: 'directe',
      enonce: '<p>Que signifie l\'égalité suivante ?</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Choisis l\'égalité qui a le même sens.',
      choix: choix,
      indice: 'La racine carrée de a est le nombre dont le carré vaut a. De même pour la racine d\'indice ' + n + '.',
      etapes: O.etapes([['<sup>n</sup>√a = b signifie que bⁿ = a : l\'indice de la racine devient l\'exposant.', m(h + ' parce que ' + b + sup(n) + ' = ' + a)]]),
      rubrique: R.racines,
      nombres: [fr(a)],
      controle: { type: 'racineN', n: n, a: a, res: b, mesure: { ops: 1, etapes: 1 } }
    }, alea);
  }

  function vraiFauxRacineN(alea, p) {
    var cas = alea.choix([
      { h: '<sup>4</sup>√(' + H.moins + '16)', vrai: false, txt: 'existe dans ℝ', j: 'une racine d\'indice pair d\'un nombre négatif n\'existe pas dans ℝ (une puissance paire n\'est jamais négative).' },
      { h: '<sup>5</sup>√(' + H.moins + '32) = ' + H.moins + '2', vrai: true, txt: '', j: '(– 2)⁵ = – 32 : l\'indice est impair, la racine d\'un nombre négatif existe.' },
      { h: '<sup>4</sup>√81 = 3', vrai: true, txt: '', j: '3⁴ = 81.' },
      { h: '<sup>3</sup>√27 = 9', vrai: false, txt: '', j: '3³ = 27, donc ∛27 = 3 (et non 27 : 3).' },
      { h: '<sup>6</sup>√64 = 2', vrai: true, txt: '', j: '2⁶ = 64.' }
    ]);
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(cas.h) + (cas.txt ? ' ' + cas.txt : '') + '</p>',
      vrai: cas.vrai,
      bonne: cas.j,
      mauvaises: [
        { h: (cas.vrai ? 'Faux' : 'Vrai') + ', car on divise le nombre par l\'indice.', message: 'Prendre une racine n\'est pas diviser par l\'indice.' },
        { h: (cas.vrai ? 'Faux' : 'Vrai') + ', car une racine est toujours positive.', message: 'C\'est vrai pour un indice pair seulement.' },
        { h: (cas.vrai ? 'Vrai' : 'Faux') + ', car tous les nombres ont une racine de n\'importe quel indice.', message: 'Les nombres négatifs n\'ont pas de racine d\'indice pair dans ℝ.' }
      ],
      indice: 'ⁿ√a est le nombre dont la puissance n vaut a.',
      etapes: O.etapes([[(cas.vrai ? 'Vrai : ' : 'Faux : ') + cas.j, '']]),
      rubrique: R.racines,
      controle: { type: 'vfTexte', vrai: cas.vrai }
    }, alea);
  }

  var SANS_CARRE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];

  /** √50 = 5√2. Radicande ⩽ 100 (D1), 200 (D2), 300 (D3-D4). */
  function questionExtraire(alea, p) {
    var k, r, n, essai = 0, lim = [0, 100, 200, 300, 300][p];
    do { k = alea.entier(2, 10); r = alea.choix(SANS_CARRE); n = k * k * r; essai++; } while ((n > lim || (p >= 3 && n < 50)) && essai < 200);
    var gc = O.plusGrandCarre(n);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Simplifie en extrayant un entier de la racine :</p><p class="calcul">' + m('√' + n) + '</p>',
      consigne: 'Forme exigée : <strong>a√b</strong> avec b le plus petit possible (exemple de saisie : 5√2).',
      clavier: 'complet',
      indice: 'Cherche le plus grand carré parfait qui divise ' + n + '.',
      reponse: { type: 'valeur', forme: 'racine', coef: k, radicande: r, valeur: fr(0) },
      pieges: [{ racine: [k * k, r], message: 'On extrait la racine du carré parfait : √' + (k * k) + ' = ' + k + ', et non ' + (k * k) + '.' }, { racine: [r, k * k], message: 'Attention : le carré parfait sort de la racine, l\'autre facteur reste dessous.' }],
      etapes: O.etapes([['Je décompose ' + n + ' avec le plus grand carré parfait possible.', m('√' + n + ' = √(' + gc + ' · ' + (n / gc) + ')')], ['√(a · b) = √a · √b.', m('= √' + gc + ' · √' + (n / gc) + ' = ' + k + '√' + r)]]),
      verification: 'Vérification : ' + m('(' + k + '√' + r + ')² = ' + (k * k) + ' · ' + r + ' = ' + n) + '. ✓',
      rubrique: R.racines,
      nombres: [fr(n)],
      controle: { expr: '√(' + n + ')' },
      signature: 'extr:' + n
    });
  }

  function questionProduitRacines(alea, p) {
    // a = r · s², c = r · t² : a · c est un carré parfait ; nombres sous la limite
    var a, c, k, r, essai = 0, lim = [0, 20, 100, 200, 300][p];
    do {
      r = alea.choix([2, 3, 5, 6, 7]);
      var s1 = alea.entier(1, 3), t1 = alea.entier(1, 5);
      if (s1 === t1) t1++;
      a = r * s1 * s1; c = r * t1 * t1; k = s1 * t1;
      essai++;
    } while ((a > lim || c > lim) && essai < 200);
    var op = alea.choix(['·', ':']);
    if (op === ':' && t1 % s1 !== 0) op = '·';
    var res, h;
    if (op === '·') { res = Math.sqrt(a * c); h = '√' + a + ' · √' + c; }
    else { res = Math.sqrt(c / a); h = '√' + c + ' : √' + a; }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Écris un nombre entier.',
      indice: op === '·' ? '√a · √b = √(a · b).' : '√a : √b = √(a : b).',
      reponse: { type: 'valeur', valeur: fr(res), forme: 'entier' },
      pieges: op === '·' ? [{ valeur: fr(a * c), message: 'N\'oublie pas la racine : √a · √b = √(a · b).' }] : [{ valeur: fr(c / a), message: 'N\'oublie pas la racine : √a : √b = √(a : b).' }],
      etapes: O.etapes([[op === '·' ? 'Produit de racines : √a · √b = √(a · b).' : 'Quotient de racines : √a : √b = √(a : b).', m(h + ' = √' + (op === '·' ? '(' + a + ' · ' + c + ')' : '(' + c + ' : ' + a + ')') + ' = √' + (op === '·' ? a * c : c / a) + ' = ' + res)]]),
      verification: 'Vérification : ' + m(res + '² = ' + (res * res)) + '. ✓',
      rubrique: R.racines,
      nombres: [fr(a), fr(c)],
      // propriété √a · √b = √(a · b) puis racine d'un carré parfait : deux étapes
      controle: { expr: op === '·' ? '√' + a + '*√' + c : '√' + c + ':√' + a, mesure: { ops: 2, etapes: 2 } }
    });
  }

  function questionSommeRacines(alea, p) {
    var r = alea.choix([2, 3, 5, 6, 7]);
    var genre = p >= 3 && alea.suivant() < 0.6 ? 'extraire' : 'simple';
    var coefs, h, res, et, pieges;
    if (genre === 'simple') {
      coefs = [alea.entier(1, 9), alea.entierNonNul(-8, 9), alea.entierNonNul(-8, 6)];
      res = coefs[0] + coefs[1] + coefs[2];
      if (res === 0) { coefs[0]++; res++; }
      h = coefs[0] + '√' + r + (coefs[1] < 0 ? ' – ' : ' + ') + Math.abs(coefs[1]) + '√' + r + (coefs[2] < 0 ? ' – ' : ' + ') + Math.abs(coefs[2]) + '√' + r;
      et = [['Les termes ont la même racine √' + r + ' : j\'additionne les coefficients.', m(h + ' = (' + coefs[0] + (coefs[1] < 0 ? ' – ' : ' + ') + Math.abs(coefs[1]) + (coefs[2] < 0 ? ' – ' : ' + ') + Math.abs(coefs[2]) + ')√' + r + ' = ' + (res === 1 ? '' : res === -1 ? H.moins : (res < 0 ? H.moins + Math.abs(res) : res)) + '√' + r)]];
      pieges = [{ racine: [res, 3 * r], message: 'On n\'additionne pas les nombres sous la racine : 3√7 + 5√7 = 8√7 (comme 3x + 5x = 8x).' }];
    } else {
      var k1 = alea.entier(2, 4), k2 = alea.entier(2, 5);
      if (k1 === k2) k2++;
      var n1 = k1 * k1 * r, n2 = k2 * k2 * r;
      var s = alea.suivant() < 0.5 ? 1 : -1;
      res = k1 + s * k2;
      if (res === 0) { s = 1; res = k1 + k2; }
      h = '√' + n1 + (s > 0 ? ' + ' : ' – ') + '√' + n2;
      et = [['J\'extrais un entier de chaque racine.', m('√' + n1 + ' = ' + k1 + '√' + r + ' ; √' + n2 + ' = ' + k2 + '√' + r)], ['J\'additionne les coefficients.', m(k1 + '√' + r + (s > 0 ? ' + ' : ' – ') + k2 + '√' + r + ' = ' + (res < 0 ? H.moins + Math.abs(res) : res) + '√' + r)]];
      pieges = [];
      if (n1 + s * n2 > 0) pieges.push({ racine: [1, n1 + s * n2], message: 'Attention : √a + √b ≠ √(a + b). Extrais d\'abord un entier de chaque racine.' });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris le plus simplement possible :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Forme exigée : <strong>a√b</strong> (exemple de saisie : 2√7 ou –3√5).',
      clavier: 'complet',
      indice: genre === 'simple' ? 'Fais comme pour 3x + 5x – 6x.' : 'Extrais d\'abord un entier de chaque racine.',
      reponse: { type: 'valeur', forme: 'racine', coef: res, radicande: r, valeur: fr(0) },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: 'Vérification avec des valeurs approchées : les deux écritures valent environ ' + H.arrondi(M.Fraction.depuis(Number((res * Math.sqrt(r)).toFixed(6))), 2) + '. ✓',
      rubrique: R.racines,
      nombres: [fr(r)],
      controle: { expr: h.replace(/–/g, '-').replace(/\s/g, '').replace(/(\d)√/g, '$1*√'), mesure: genre === 'simple' ? { ops: 2, etapes: 2 } : { ops: 3, etapes: 2 } }
    });
  }

  /** opts.extraction : seulement l'extraction (11e N1) ; sinon aussi sommes et produits de racines (N2). */
  function vraiFauxRacinesProp(alea, p, opts) {
    var extraction = !!(opts && opts.extraction);
    var cas = alea.choix([
      function () { var a = alea.choix([9, 16, 36]), b = alea.choix([16, 64, 144]); return { h: '√' + a + ' + √' + b + ' = √' + (a + b), a: '√' + a + '+√' + b, b: '√' + (a + b) }; },
      function () { var a = alea.choix([2, 3, 5]), k = alea.entier(2, 4); return { h: '√' + a + ' · √' + (a * k * k) + ' = ' + (a * k), a: '√' + a + '*√' + (a * k * k), b: String(a * k) }; },
      function () { var k = alea.entier(2, 5), r = alea.choix([2, 3]); return { h: '√' + (k * k * r) + ' = ' + (k * k) + '√' + r, a: '√' + (k * k * r), b: (k * k) + '*√' + r }; },
      function () { var k = alea.entier(2, 5), r = alea.choix([2, 3, 5]); return { h: '√' + (k * k * r) + ' = ' + k + '√' + r, a: '√' + (k * k * r), b: k + '*√' + r }; }
    ].slice(extraction ? 2 : 0))();
    var va = M.evaluerApproche(cas.a), vb = M.evaluerApproche(cas.b);
    var vrai = Math.abs(va - vb) < 1e-9;
    function aff(v) { var r = Math.round(v); return Math.abs(v - r) < 1e-9 ? '= ' + H.n(fr(r)) : '≈ ' + H.arrondi(M.Fraction.depuis(Number(v.toFixed(6))), 3); }
    function beau(t) { return t.replace(/\*/g, ' · ').replace(/\+/g, ' + '); }
    var just = m(beau(cas.a) + ' ' + aff(va)) + ' et ' + m(beau(cas.b) + ' ' + aff(vb)) + (vrai ? ' : les deux membres sont égaux.' : ' : les deux membres ne sont pas égaux.');
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(cas.h) + '</p>',
      vrai: vrai,
      bonne: just,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car la racine d\'une somme est la somme des racines.', message: '√a + √b ≠ √(a + b) ; par contre √a · √b = √(a · b).' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car on ne peut jamais multiplier des racines.', message: 'On peut : √a · √b = √(a · b).' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car le carré parfait sort de la racine sans changer.', message: 'Quand on extrait un carré parfait, c\'est sa racine qui sort : √(25 · 2) = 5√2.' }
      ],
      indice: 'Compare des valeurs approchées des deux membres.',
      etapes: O.etapes([['Je compare des valeurs approchées.', just]]),
      rubrique: R.racines,
      controle: { type: 'vf', a: cas.a, b: cas.b, relation: '=', mesure: { ops: 1, etapes: 1 } }
    }, alea);
  }

  /* =====================================================================
   * 10e niveau 2 (D4) : somme de deux nombres en notation scientifique
   * ===================================================================== */

  function questionSommeSci(alea, p) {
    var a = alea.entier(1, 8), b = alea.entier(1, 9), e = alea.entier(3, 8);
    var op = alea.choix(['+', '–']);
    var total = op === '+' ? fr(a).fois(fr(10).puissance(e)).plus(fr(b).fois(fr(10).puissance(e - 1))) : fr(a + 1).fois(fr(10).puissance(e)).moins(fr(b).fois(fr(10).puissance(e - 1)));
    var aa = op === '+' ? a : a + 1;
    var ha = H.sciME(fr(aa), e), hb = H.sciME(fr(b), e - 1);
    var bDec = fr(b, 10);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule et donne le résultat en notation scientifique :</p><p class="calcul">' + m(ha + ' ' + op + ' ' + hb) + '</p>',
      consigne: 'Forme exigée : <strong>notation scientifique</strong> a · 10ⁿ avec 1 ⩽ a &lt; 10.',
      clavier: 'complet',
      indice: 'Pour additionner, il faut la même puissance de 10 : ' + M.formaterNombre(fr(b)) + ' · 10' + sup(e - 1) + ' = ' + M.formaterNombre(bDec) + ' · 10' + sup(e) + '.',
      reponse: { type: 'valeur', valeur: total, forme: 'scientifique' },
      pieges: [{ valeur: fr(op === '+' ? aa + b : aa - b).fois(fr(10).puissance(e)), message: 'Les deux nombres n\'ont pas la même puissance de 10 : on ne peut pas additionner directement ' + aa + ' et ' + b + '.' },
        { valeur: fr(op === '+' ? aa + b : aa - b).fois(fr(10).puissance(2 * e - 1)), message: 'Pour une somme, on n\'additionne pas les exposants : on écrit d\'abord les deux nombres avec la même puissance de 10.' }],
      etapes: O.etapes([
        ['J\'écris les deux nombres avec la même puissance de 10.', m(hb + ' = ' + H.n(bDec) + ' · 10' + sup(e))],
        ['J\'additionne (ou je soustrais) les nombres devant la puissance de 10.', m(ha + ' ' + op + ' ' + H.n(bDec) + ' · 10' + sup(e) + ' = ' + H.sci(total))]
      ]),
      verification: 'Vérification : ' + H.n(fr(aa).fois(fr(10).puissance(e))) + ' ' + op + ' ' + H.n(fr(b).fois(fr(10).puissance(e - 1))) + ' = ' + H.n(total) + '. ✓',
      rubrique: R.notationScientifique,
      nombres: [fr(aa), fr(b), fr(e)],
      controle: { expr: '(' + aa + '*10^' + e + ')' + (op === '+' ? '+' : '-') + '(' + b + '*10^' + (e - 1) + ')', mesure: { ops: 2, etapes: 2 } }
    });
  }

  /* =====================================================================
   * 11e niveau 2 (D4) : calcul combinant produits de racines et racine n-ième
   * ===================================================================== */

  // racines cubiques seulement : la racine n-ième (n ⩾ 4) n'est pas appliquée en exercice
  var RACINES_N = [[3, 8, 2], [3, 27, 3], [3, 64, 4], [3, 125, 5]];

  function questionCalculRacines(alea, p) {
    var r = alea.choix([2, 3, 5, 6]);
    var s1 = alea.entier(1, 2), t1 = alea.entier(2, 4);
    if (s1 === t1) t1++;
    var a = r * s1 * s1, b = r * t1 * t1;
    if (alea.suivant() < 0.5) { var tmp = a; a = b; b = tmp; }
    var k = Math.sqrt(a * b);
    var rn = alea.choix(RACINES_N);
    var op = alea.choix(['+', '–']);
    var res = op === '+' ? k + rn[2] : k - rn[2];
    var hRn = rn[0] === 3 ? '∛' + rn[1] : '<sup>' + rn[0] + '</sup>√' + rn[1];
    var h = '√' + a + ' · √' + b + ' ' + op + ' ' + hRn;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Écris un nombre entier.',
      indice: '√a · √b = √(a · b). Pour ' + (rn[0] === 3 ? '∛' : rn[0] + 'e racine de ') + rn[1] + ', cherche le nombre dont la puissance ' + rn[0] + ' vaut ' + rn[1] + '.',
      reponse: { type: 'valeur', valeur: fr(res), forme: 'entier' },
      pieges: [{ valeur: fr(a * b + (op === '+' ? rn[2] : -rn[2])), message: 'N\'oublie pas la racine : √' + a + ' · √' + b + ' = √' + (a * b) + ' = ' + k + '.' },
        { valeur: op === '+' ? fr(k).plus(fr(rn[1], rn[0])) : fr(k).moins(fr(rn[1], rn[0])), message: 'Prendre une racine n\'est pas diviser par l\'indice.' }],
      etapes: O.etapes([
        ['Produit de racines : √a · √b = √(a · b).', m('√' + a + ' · √' + b + ' = √' + (a * b) + ' = ' + k)],
        ['Racine ' + (rn[0] === 3 ? 'cubique' : 'd\'indice ' + rn[0]) + ' : je cherche le nombre dont la puissance ' + rn[0] + ' vaut ' + rn[1] + '.', m(rn[2] + sup(rn[0]) + ' = ' + rn[1] + ', donc ' + hRn + ' = ' + rn[2])],
        ['Je termine le calcul.', m(k + ' ' + op + ' ' + rn[2] + ' = ' + H.n(fr(res)))]
      ]),
      verification: 'Vérification : ' + m(k + '² = ' + (a * b)) + ' et ' + m(rn[2] + sup(rn[0]) + ' = ' + rn[1]) + '. ✓',
      rubrique: R.racines,
      nombres: [fr(a), fr(b), fr(rn[1])],
      controle: { type: 'comboRacines', a: a, b: b, n: rn[0], c: rn[1], op: op, res: res, mesure: { ops: 4, etapes: 3 } },
      signature: 'racop:' + [String(a), String(b)].sort().join('*') + (op === '+' ? '+' : '-') + 'r' + rn[0] + ':' + rn[1]
    });
  }

  /* =====================================================================
   * Catalogue
   * ===================================================================== */

  // Les objectifs de priorités ont deux opérations dès D1 (une seule opération ne permet pas
  // de travailler les priorités ; choix validé par l'enseignante).
  var BORNES_PRIORITES = { operations: [2, 3, 4, 4], etapes: [2, 2, 3, 3] };
  function neg(c, p) { return expNeg(c, p); }

  var objectifs = [
    {
      id: 'B9-puissances', module: 'B', annee: 9, niveaux: [1, 2], theme: 'NO 9.1',
      titre: 'Notion de puissance ; calculer la puissance d\'un nombre naturel',
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionCalculerPuissance(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionEcrirePuissance(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionBaseExposant(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxPuissance(a, p); } }
      ]
    },
    {
      id: 'B9-carres', module: 'B', annee: 9, niveaux: [1, 2], theme: 'NO 9.1',
      titre: 'Carrés parfaits (jusqu\'à 144) et cubes parfaits (jusqu\'à 125)',
      // un carré parfait jusqu'à 144 et un cube jusqu'à 125 sont les nombres mêmes de l'objectif
      bornesD: { nombre: [64, 100, 144, 144] },
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionTrouverCarre(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxCarreCube(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionCarreDe(a, p); } }
      ]
    },
    {
      id: 'B9-priorites', module: 'B', annee: 9, niveaux: [1, 2], theme: 'NO 9.1',
      titre: 'Priorité des opérations avec des puissances',
      bornesD: BORNES_PRIORITES,
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionPrioritesPuissances(a, p, c); } },
        { type: 'directe', gen: function (a, p, c) { return questionPrioritesPuissances(a, p, c); } },
        { type: 'erreur', palierMin: 3, gen: function (a, p) { return erreurPrioritesPuissances(a, p, false); } },
        { type: 'vraifaux', palierMin: 2, gen: function (a, p) { return vraiFauxSommeCarres(a, p); } }
      ]
    },
    {
      id: 'B10-ecritures', module: 'B', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Écritures d\'un même nombre : puissance, racine, puissance de 10',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionPuissance10(a, p, { negatifs: neg(c, p) }); } },
        { type: 'directe', gen: function (a, p) { return questionEcrituresNombre(a, p); } },
        { type: 'directe', si: function (c, p) { return neg(c, p); }, gen: function (a, p) { return questionExposantNegatif(a, p); } },
        { type: 'directe', si: function (c, p) { return neg(c, p); }, gen: function (a, p) { return questionEcrituresEgales(a, p); } }
      ]
    },
    {
      id: 'B10-prefixes', module: 'B', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Préfixes des puissances de 10 (kilo, méga, giga, téra ; milli, micro, nano)',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionPrefixePuissance(a, p, { negatifs: neg(c, p) }); } },
        { type: 'probleme', gen: function (a, p, c) { return questionConversionPrefixe(a, p, { negatifs: neg(c, p) }); } },
        { type: 'directe', si: function (c, p) { return !neg(c, p); }, gen: function (a, p) { return questionPrefixeDecimal(a, p); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemePrefixes(a, p); } }
      ]
    },
    {
      id: 'B10-notation', module: 'B', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Écrire et interpréter un nombre en notation scientifique',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionEcrireSci(a, p, { negatifs: neg(c, p) }); } },
        { type: 'directe', gen: function (a, p, c) { return questionSciVersDecimal(a, p, { negatifs: neg(c, p) }); } },
        { type: 'vraifaux', gen: function (a, p, c) { return vraiFauxSci(a, p, { negatifs: neg(c, p) }); } },
        { type: 'directe', palierMin: 2, gen: function (a, p, c) { return questionOrdreGrandeurSci(a, p, { negatifs: neg(c, p) }); } },
        { type: 'directe', palierMin: 2, gen: function (a, p, c) { return questionComparerSci(a, p, { negatifs: neg(c, p) }); } },
        { type: 'directe', si: function (c, p) { return c.niveau === 2 && p >= 4; }, gen: function (a, p) { return questionSommeSci(a, p); } },
        { type: 'directe', si: function (c, p) { return c.niveau === 2 && p >= 4; }, gen: function (a, p) { return questionCalculSci(a, p); } }
      ]
    },
    {
      id: 'B10-priorites', module: 'B', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Priorité des opérations (puissances et racines)',
      bornesD: BORNES_PRIORITES,
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionPrioritesPuissances(a, p, c, { relatifs: neg(c, p), racines: true }); } },
        { type: 'directe', gen: function (a, p, c) { return questionPrioritesPuissances(a, p, c, { relatifs: neg(c, p), racines: true }); } },
        { type: 'erreur', palierMin: 3, gen: function (a, p, c) { return erreurPrioritesPuissances(a, p, neg(c, p)); } }
      ]
    },
    {
      id: 'B10-racines', module: 'B', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Racine carrée d\'un carré parfait (jusqu\'à 225), racine cubique d\'un cube parfait (jusqu\'à 1000)',
      // le radicande est le nombre de l'objectif : 225 et 1000 sont les bornes fixées par l'enseignante
      bornesD: { nombre: [100, 225, 1000, 1000] },
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionRacine(a, p, c); } },
        { type: 'directe', gen: function (a, p, c) { return questionRacine(a, p, c); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxRacine(a, p); } }
      ]
    },
    {
      id: 'B10-proprietes', module: 'B', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Propriétés des puissances',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionPropriete(a, p, { negatifs: neg(c, p), simple: c.annee === 10 && c.niveau === 1 }); } },
        { type: 'directe', gen: function (a, p, c) { return questionPropriete(a, p, { negatifs: neg(c, p), simple: c.annee === 10 && c.niveau === 1 }); } },
        { type: 'vraifaux', gen: function (a, p, c) { return vraiFauxProprietes(a, p, { negatifs: neg(c, p) }); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurProprietes(a, p); } }
      ]
    },
    {
      id: 'B10-problemes', module: 'B', annee: 10, niveaux: [1, 2], theme: 'NO 10.1',
      titre: 'Résoudre des problèmes (données numériques, puissances de 10)',
      modeles: [
        { type: 'probleme', gen: function (a, p, c) { return questionConversionPrefixe(a, p, { negatifs: neg(c, p) }); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemePrefixes(a, p); } }
      ]
    },
    {
      id: 'B11-racines', module: 'B', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Inverse, opposé ; racines carrées et cubiques de nombres parfaits',
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionRacineRationnel(a, p); } },
        { type: 'directe', palierMin: 2, gen: function (a, p) { return questionInversePuissance(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxRacine(a, p); } }
      ]
    },
    {
      id: 'B11-extraction', module: 'B', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Simplifier une racine en extrayant un entier (√50 = 5√2)',
      // le radicande (50, 72…) est le nombre à simplifier : jusqu'à 100 dès D1
      bornesD: { nombre: [100, 200, 300, 300] },
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionExtraire(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionExtraire(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxRacinesProp(a, p, { extraction: true }); } }
      ]
    },
    {
      id: 'B11-notation', module: 'B', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Propriétés des puissances (exposants entiers relatifs) et notation scientifique',
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionPropriete(a, p, { negatifs: true }); } },
        { type: 'directe', palierMin: 2, gen: function (a, p) { return questionCalculSci(a, p); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurSci(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxProprietes(a, p, { negatifs: true }); } }
      ]
    },
    {
      id: 'B11-reels', module: 'B', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Comparer et ordonner des nombres réels (puissances, racines)',
      modeles: [
        { type: 'directe', palierMin: 2, gen: function (a, p) { return questionOrdonnerPuissances(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionComparerPuissances(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionComparerSci(a, p, { negatifs: true }); } }
      ]
    },
    {
      id: 'B11-problemes', module: 'B', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Résoudre des problèmes avec des nombres réels (notation scientifique)',
      modeles: [
        { type: 'probleme', si: function (c, p) { return p <= 1; }, gen: function (a, p) { return questionConversionPrefixe(a, p, { negatifs: true }); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemeSci(a, p); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemeSci(a, p); } }
      ]
    },
    {
      // À VÉRIFIER : la racine n-ième n'a pas été confirmée dans le livre de 11e.
      id: 'B11-racine-n', module: 'B', annee: 11, niveaux: [2], theme: 'NO 11.1',
      // Choix de l'enseignante : la racine n-ième doit être comprise, mais elle n'est pas
      // appliquée en exercice. Seulement des questions sur son sens.
      titre: 'Sens de la racine n-ième',
      bornesD: { nombre: [100, 100, 1000, 1000] },
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionSensRacineN(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxRacineN(a, p); } }
      ]
    },
    {
      id: 'B11-racines-prop', module: 'B', annee: 11, niveaux: [2], theme: 'NO 11.1',
      titre: 'Opérations sur les racines (√a · √b, sommes de racines)',
      bornesD: { nombre: [100, 200, 300, 300] },
      modeles: [
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxRacinesProp(a, p); } },
        { type: 'directe', palierMin: 2, gen: function (a, p) { return questionProduitRacines(a, p); } },
        { type: 'directe', palierMin: 2, gen: function (a, p) { return questionSommeRacines(a, p); } },
        { type: 'directe', palierMin: 4, gen: function (a, p) { return questionCalculRacines(a, p); } }
      ]
    }
  ];

  return { objectifs: objectifs, PREFIXES: PREFIXES };
});
