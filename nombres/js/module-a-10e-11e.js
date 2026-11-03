/*
 * nombres/js/module-a-10e-11e.js — Module A « Fractions et nombres rationnels »,
 * objectifs de 10e (NO 10.3) et de 11e (NO 11.1).
 * Logique pure : voir outils.js pour le format des questions.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'), require('./module-a-9e.js'));
  else racine.NombresModuleA10 = fabrique(racine.NombresOutils, racine.NombresModuleA9);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O, A9) {
  'use strict';

  var M = O.Maths, F = O.F, H = O.H, A = O.A, R = O.RUBRIQUES;
  var fr = O.fr, val = O.val;
  var NB = O.NBSP;

  function m(h) { return H.maths(h); }
  function prenom(alea) { return alea.choix(O.PRENOMS); }
  function lieu(alea) { return alea.choix(O.LIEUX); }

  /* =====================================================================
   * 10e : différentes écritures d'un même nombre
   * ===================================================================== */

  function questionDecVersPourcent(alea, p) {
    var d = p <= 2 ? 2 : 3;
    var x = new F(alea.entier(1, p <= 2 ? 99 : 1500), Math.pow(10, d));
    if (x.fois(100).estEntier() && p >= 3 && alea.suivant() < 0.5) x = new F(alea.entier(1, 999), 1000);
    var pc = x.fois(100);
    var sens = alea.suivant() < 0.5 ? 'versPourcent' : 'versDecimal';
    if (sens === 'versPourcent') {
      return O.saisie({
        type: 'directe',
        enonce: '<p>Écris ' + m(H.n(x)) + ' sous forme de pourcentage.</p>',
        consigne: 'Écris le nombre de pour cent (le signe % est déjà écrit).',
        suffixe: '%',
        indice: 'Un pourcentage est un nombre de centièmes : multiplie par 100.',
        reponse: { type: 'valeur', valeur: pc, unite: '%' },
        pieges: [{ valeur: pc.divise(100).divise(100), message: 'Tu as divisé par 100 au lieu de multiplier par 100.' }, { valeur: x.fois(10), message: 'Multiplie par 100, pas par 10.' }],
        etapes: O.etapes([['Je multiplie par 100 (je déplace la virgule de deux rangs vers la droite).', m(H.n(x) + ' = ' + H.n(x) + ' · 100 % = ' + H.n(pc) + ' %')]]),
        verification: 'Vérification : ' + M.formaterNombre(pc) + ' % = ' + M.formaterNombre(pc) + ' : 100 = ' + M.formaterNombre(x) + '. ✓',
        rubrique: R.pourcentages,
        nombres: [x],
        controle: { expr: '(' + x.toString() + ')*100' },
        attenduHtml: H.n(pc) + ' %'
      });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.n(pc) + ' %') + ' en écriture décimale.</p>',
      consigne: 'Réponse en <strong>écriture décimale</strong>.',
      indice: M.formaterNombre(pc) + ' % = ' + M.formaterNombre(pc) + ' : 100.',
      reponse: { type: 'valeur', valeur: x, forme: 'decimal' },
      pieges: [{ valeur: pc, message: 'Le signe % veut dire « divisé par 100 ».' }, { valeur: pc.divise(10), message: 'Divise par 100, pas par 10.' }],
      etapes: O.etapes([['Je divise par 100 (je déplace la virgule de deux rangs vers la gauche).', m(H.n(pc) + ' % = ' + H.n(pc) + ' : 100 = ' + H.n(x))]]),
      rubrique: R.pourcentages,
      nombres: [x],
      controle: { expr: '(' + pc.toString() + ')/100' },
      attenduHtml: H.n(x)
    });
  }

  function questionIntrus(alea, p) {
    var pool = [[3, 4], [2, 5], [1, 8], [3, 8], [7, 20], [3, 5], [1, 4], [5, 4], [1, 3], [2, 3], [5, 6], [4, 9]];
    var c = alea.choix(p <= 2 ? pool.slice(0, 8) : pool);
    var f = fr(c[0], c[1]);
    var k = alea.entier(2, 5);
    var options = [
      { h: H.fh(c[0] * k, c[1] * k), t: (c[0] * k) + '/' + (c[1] * k) },
      { h: H.n(f), t: f.toString() }
    ];
    if (f.fois(100).estDecimale()) options.push({ h: H.n(f.fois(100)) + ' %', t: '(' + f.fois(100).toString() + ')/100' });
    else options.push({ h: H.fh(c[0] * (k + 1), c[1] * (k + 1)), t: (c[0] * (k + 1)) + '/' + (c[1] * (k + 1)) });
    // intrus : erreur typique
    var intrus;
    if (f.estDecimale()) {
      var r = alea.suivant();
      if (r < 0.5) intrus = { v: M.Fraction.depuis('0,' + c[0] + c[1]), raison: 'on a recopié le numérateur et le dénominateur après la virgule' };
      else intrus = { v: f.fois(100).divise(1000), raison: 'le pourcentage est faux (virgule mal placée)', pourcent: true };
    } else {
      intrus = { v: new F(Math.round(f.valeur() * 100), 100), raison: 'c\'est une valeur arrondie, pas une écriture exacte' };
    }
    if (intrus.v.egal(f)) intrus = { v: f.plus(fr(1, 10)), raison: 'ce nombre est plus grand' };
    var hIntrus = intrus.pourcent ? H.n(intrus.v.fois(100)) + ' %' : H.n(intrus.v);
    var choix = options.map(function (o) { return { h: m(o.h), juste: false, cle: o.t, valeur: o.t, message: 'Cette écriture est bien égale à ' + M.formaterFraction(f) + '.' }; });
    choix.push({ h: m(hIntrus), juste: true, cle: 'intrus', valeur: intrus.v.toString(), message: '' });
    return O.choix({
      type: 'directe',
      enonce: '<p>Une seule de ces écritures n\'est <strong>pas</strong> égale à ' + m(H.f(f)) + '. Laquelle ?</p>',
      consigne: 'Choisis l\'intrus.',
      choix: choix,
      indice: 'Calcule l\'écriture décimale de ' + M.formaterFraction(f) + ', puis compare.',
      etapes: O.etapes([['J\'écris ' + m(H.f(f)) + ' en écriture décimale' + (f.fois(100).estDecimale() ? ' et en pourcentage.' : '.'), m(H.f(f) + ' = ' + H.n(f) + (f.fois(100).estDecimale() ? ' = ' + H.n(f.fois(100)) + ' %' : ''))], ['L\'intrus est ' + m(hIntrus) + ' : ' + intrus.raison + '.', '']]),
      rubrique: R.ecrituresDecimales,
      nombres: [f],
      controle: { type: 'intrus', expr: f.toString() }
    }, alea);
  }

  function vraiFauxPeriodique(alea, p) {
    var c = alea.choix([[1, 3], [2, 3], [1, 9], [4, 9], [2, 9], [1, 6], [5, 6], [1, 11], [7, 9]]);
    var f = fr(c[0], c[1]);
    var dev = f.developpementDecimal();
    var vrai = alea.suivant() < 0.5;
    var annonce = vrai ? f : M.Fraction.depuis('0,' + dev.avantPeriode + dev.periode);
    var h = m(H.f(f) + ' = ' + H.n(annonce));
    return O.vraiFaux({
      enonce: '<p class="calcul">' + h + '</p>',
      vrai: vrai,
      bonne: vrai ? 'la division ' + c[0] + ' : ' + c[1] + ' ne s\'arrête pas et les chiffres ' + dev.periode + ' se répètent : ' + m(H.n(f)) + '.' : m(H.n(annonce)) + ' est un nombre décimal (écriture finie), alors que ' + m(H.f(f)) + ' = ' + m(H.n(f)) + ' a une écriture périodique.',
      mauvaises: vrai ? [
        { h: 'Faux, car une fraction a toujours une écriture décimale finie.', message: 'Non : ' + M.formaterFraction(f) + ' a une écriture illimitée périodique.' },
        { h: 'Faux, car il faudrait écrire ' + m(H.n(new F(Math.round(f.valeur() * 100), 100))) + '.', message: 'C\'est une valeur arrondie, pas l\'écriture exacte.' },
        { h: 'Vrai, car on arrondit au dixième.', message: 'La conclusion est juste, mais il ne s\'agit pas d\'un arrondi : la barre indique une période qui se répète sans fin.' }
      ] : [
        { h: 'Vrai, car on peut arrondir.', message: 'Le signe « = » demande l\'égalité exacte.' },
        { h: 'Vrai, car ' + m(H.n(annonce)) + ' a les mêmes premiers chiffres.', message: 'Les premiers chiffres ne suffisent pas : ' + M.formaterFraction(f) + ' a une écriture illimitée.' },
        { h: 'Faux, car une fraction ne peut pas avoir d\'écriture décimale.', message: 'Toute fraction a une écriture décimale (finie ou périodique).' }
      ],
      indice: 'Effectue la division ' + c[0] + ' : ' + c[1] + '.',
      etapes: O.etapes(A9.etapesDivision(c[0], c[1])),
      rubrique: R.ecrituresDecimales,
      nombres: [f],
      controle: { type: 'vf', a: f.toString(), b: annonce.toString(), relation: '=' }
    }, alea);
  }

  /* =====================================================================
   * 10e : opposé, inverse, ensembles ℕ, ℤ, 𝔻, ℚ, ℝ
   * ===================================================================== */

  /**
   * Nombre pour « opposé, inverse » selon la difficulté (inverse toujours ⩽ la limite).
   * D1 : entiers ⩽ 12, fractions simples, 0,5 ; D2 : fractions ⩽ 9e, 0,25 ; D3-D4 : fractions impropres, 0,125.
   */
  function nombreVarie(alea, p) {
    var genre = alea.choix(p <= 2 ? ['entier', 'fraction', 'decimal', 'entierNeg'] : ['entier', 'fraction', 'decimal', 'fractionNeg', 'decimalNeg']);
    var b = alea.choix(p <= 1 ? [2, 3, 4, 5, 6] : [2, 3, 4, 5, 7, 8, 9]);
    var a = A9.premierAvec(alea, b, p <= 1 ? b - 1 : 2 * b);
    var decimaux = p <= 1 ? [[5, 10], [2, 10], [25, 100]] : p === 2 ? [[5, 10], [2, 10], [25, 100], [4, 10], [75, 100], [8, 10]] : [[5, 10], [25, 100], [4, 10], [75, 100], [125, 1000], [8, 10], [5, 100]];
    var dd = alea.choix(decimaux);
    switch (genre) {
      case 'entier': return fr(alea.entier(2, 12));
      case 'entierNeg': return fr(-alea.entier(2, 12));
      case 'fraction': return fr(a, b);
      case 'decimal': return new F(dd[0], dd[1]);
      case 'fractionNeg': return fr(-a, b);
      default: return new F(-dd[0], dd[1]);
    }
  }

  function hNombre(x) { return x.estDecimale() && !x.estEntier() && x.den <= 1000n && !(x.den % 3n === 0n) && Number(x.den) % 10 === 0 ? H.n(x) : H.f(x); }
  function hNombreAff(x) { return x.estDecimale() && !x.estEntier() ? H.n(x) : H.f(x); }

  function questionOpposeInverse(alea, p) {
    var x = nombreVarie(alea, p);
    var dec = x.estDecimale() && !x.estEntier() && alea.suivant() < 0.5;
    var xh = dec ? H.n(x) : H.f(x);
    var demande = alea.suivant() < 0.5 ? 'opposé' : 'inverse';
    var res = demande === 'opposé' ? x.oppose() : x.inverse();
    var autre = demande === 'opposé' ? x.inverse() : x.oppose();
    var pieges = [];
    if (!autre.egal(res)) pieges.push({ valeur: autre, message: demande === 'opposé' ? 'Tu as donné l\'inverse. L\'opposé d\'un nombre est le nombre qui, additionné à lui, donne 0.' : 'Tu as donné l\'opposé. L\'inverse d\'un nombre est le nombre qui, multiplié par lui, donne 1.' });
    if (demande === 'inverse' && !x.inverse().oppose().egal(res)) pieges.push({ valeur: x.inverse().oppose(), message: 'L\'inverse garde le même signe : le produit d\'un nombre et de son inverse vaut 1 (positif).' });
    var et = demande === 'opposé'
      ? [['L\'opposé de ' + m(xh) + ' est le nombre qui, additionné à ' + m(xh) + ', donne 0 : on change le signe.', m(xh + ' + ' + (res.signe() < 0 ? '(' + hNombreAff(res) + ')' : hNombreAff(res)) + ' = 0')]]
      : (dec ? [['J\'écris d\'abord le nombre sous forme de fraction.', m(xh + ' = ' + H.f(x))]] : []).concat([
        ['L\'inverse d\'une fraction s\'obtient en échangeant numérateur et dénominateur (le signe ne change pas).', m(H.f(res))],
        ['Je vérifie que le produit vaut 1.', m(H.fp(x) + ' · ' + H.fp(res) + ' = 1')]
      ]);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Quel est l\'<strong>' + demande + '</strong> de ' + m(xh) + ' ?</p>',
      consigne: 'Écris un nombre ou une fraction.',
      indice: demande === 'opposé' ? 'Deux nombres opposés ont une somme nulle.' : 'Deux nombres inverses ont un produit égal à 1.',
      reponse: { type: 'valeur', valeur: res },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: demande === 'opposé' ? 'Vérification : la somme vaut 0. ✓' : 'Vérification : le produit vaut 1. ✓',
      rubrique: R.opposeInverse,
      nombres: [x],
      controle: { expr: demande === 'opposé' ? '-(' + x.toString() + ')' : '1/(' + x.toString() + ')' },
      attenduHtml: hNombreAff(res)
    });
  }

  function vraiFauxOpposeInverse(alea, p) {
    var x = nombreVarie(alea, p);
    var annonce = alea.choix(['opposés', 'inverses']);
    var y = alea.choix([x.oppose(), x.inverse(), x.inverse().oppose()]);
    if (y.egal(x)) y = x.oppose();
    var estOpp = x.plus(y).estZero(), estInv = x.fois(y).egal(1);
    var vrai = annonce === 'opposés' ? estOpp : estInv;
    var xh = hNombreAff(x), yh = hNombreAff(y);
    var bonne = annonce === 'opposés'
      ? (vrai ? 'leur somme est nulle : ' + m(xh + ' + ' + (y.signe() < 0 ? '(' + yh + ')' : yh) + ' = 0') + '.' : 'leur somme n\'est pas nulle' + (estInv ? ' : ce sont des nombres inverses (produit égal à 1).' : '.'))
      : (vrai ? 'leur produit est égal à 1 : ' + m((x.signe() < 0 ? '(' + xh + ')' : xh) + ' · ' + (y.signe() < 0 ? '(' + yh + ')' : yh) + ' = 1') + '.' : 'leur produit n\'est pas égal à 1' + (estOpp ? ' : ce sont des nombres opposés (somme nulle).' : ' (il vaut ' + M.formaterFraction(x.fois(y)) + ').'));
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(xh) + ' et ' + m(yh) + ' sont des nombres ' + annonce + '.</p>',
      vrai: vrai,
      bonne: bonne,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car deux nombres ' + annonce + ' ' + (annonce === 'opposés' ? 'ont un produit égal à 1.' : 'ont une somme nulle.'), message: 'Tu confonds : opposés → somme nulle ; inverses → produit égal à 1.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car ' + (annonce === 'opposés' ? 'deux nombres opposés ont le même signe.' : 'deux nombres inverses sont de signes contraires.'), message: annonce === 'opposés' ? 'Deux nombres opposés (non nuls) sont de signes contraires.' : 'Deux nombres inverses ont le même signe.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car on ne peut pas comparer une fraction et un nombre décimal.', message: 'On peut toujours comparer deux nombres : écris-les sous la même forme.' }
      ],
      indice: 'Opposés : somme nulle. Inverses : produit égal à 1.',
      etapes: O.etapes([[annonce === 'opposés' ? 'Je calcule la somme.' : 'Je calcule le produit.', m(annonce === 'opposés' ? H.f(x) + ' + ' + H.fp(y) + ' = ' + H.f(x.plus(y)) : H.fp(x) + ' · ' + H.fp(y) + ' = ' + H.f(x.fois(y)))]]),
      rubrique: R.opposeInverse,
      nombres: [x, y],
      controle: annonce === 'opposés' ? { type: 'vf', a: '(' + x.toString() + ')+(' + y.toString() + ')', b: '0', relation: '=' } : { type: 'vf', a: '(' + x.toString() + ')*(' + y.toString() + ')', b: '1', relation: '=' }
    }, alea);
  }

  function poolEnsemblesR(alea, p) {
    var pool = A9.poolEnsemblesNZQ(alea, p).slice();
    var nonCarre = alea.choix([2, 3, 5, 6, 7, 10, 11]);
    var carre = alea.choix([4, 9, 16, 25, 36, 49]);
    pool.push({ v: 'irr', h: '√' + nonCarre, t: 'irr√' + nonCarre });
    pool.push({ v: 'irr', h: 'π', t: 'irrπ' });
    pool.push({ v: fr(Math.sqrt(carre)), h: '√' + carre, t: '√' + carre, calcul: '√' + carre + ' = ' + Math.sqrt(carre) });
    var d = new F(alea.choix([4, 5, 25, 75, 125]), alea.choix([10, 100, 1000]));
    pool.push({ v: d, h: H.n(d), t: d.toString() });
    var q = fr(alea.choix([4, 2, 3, 6]), 5 * alea.choix([1, 2, 4]));
    pool.push({ v: q, h: H.f(q), t: q.toString(), calcul: H.f(q) + ' = ' + H.n(q) });
    var per = fr(alea.choix([1, 2, 4, 5, 7]), alea.choix([3, 9]));
    if (!per.estEntier()) pool.push({ v: per, h: H.n(per), t: per.toString() });
    return pool;
  }

  function questionEnsembleR(alea, p, ctx) {
    var pool = poolEnsemblesR(alea, p);
    return A9.questionEnsemble(alea, p, ctx, ['N', 'Z', 'D', 'Q', 'R'], pool);
  }

  var AFFIRMATIONS_ENSEMBLES = [
    { t: 'Tout nombre entier relatif est un nombre rationnel.', v: true, j: 'ℤ ⊂ ℚ : un entier n peut s\'écrire n/1.', f: 'Un entier n s\'écrit n/1 : c\'est bien une fraction.' },
    { t: 'Tout nombre décimal est un nombre rationnel.', v: true, j: '𝔻 ⊂ ℚ : par exemple 2,35 = 235/100.', f: 'Un décimal s\'écrit toujours sur 10, 100, 1000…' },
    { t: 'Tout nombre rationnel est un nombre décimal.', v: false, j: '1/3 = 0,333… est rationnel, mais son écriture décimale est illimitée : il n\'est pas décimal.', f: 'Pense à 1/3.' },
    { t: '√2 est un nombre rationnel.', v: false, j: '√2 ne peut pas s\'écrire comme une fraction : c\'est un nombre irrationnel (il appartient à ℝ, pas à ℚ).', f: '√2 ≈ 1,414…, mais aucune fraction n\'est exactement égale à √2.' },
    { t: 'Le nombre 0 appartient à ℕ.', v: true, j: '0 est un nombre naturel : ℕ = { 0 ; 1 ; 2 ; 3 ; … }.', f: 'ℕ commence à 0.' },
    { t: 'Tout nombre naturel est un nombre entier relatif.', v: true, j: 'ℕ ⊂ ℤ : les naturels sont les entiers positifs ou nuls.', f: 'Les naturels sont des entiers relatifs positifs ou nuls.' },
    { t: '0,333… (période 3) est un nombre décimal.', v: false, j: 'son écriture décimale est illimitée : 0,333… = 1/3 est rationnel, mais pas décimal.', f: 'Un décimal a une écriture décimale finie.' },
    { t: 'π est un nombre rationnel.', v: false, j: 'π est irrationnel : 3,14 ou 22/7 n\'en sont que des valeurs approchées.', f: 'π ≈ 3,14159… n\'est égal à aucune fraction.' }
  ];

  function vraiFauxEnsemblesR(alea) {
    var a = alea.choix(AFFIRMATIONS_ENSEMBLES);
    return O.vraiFaux({
      enonce: '<p class="calcul">' + a.t + '</p>',
      vrai: a.v,
      bonne: a.j,
      mauvaises: [
        { h: (a.v ? 'Faux' : 'Vrai') + ', car tous les ensembles de nombres contiennent les mêmes nombres.', message: 'Non : ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ, et chaque ensemble est plus grand que le précédent.' },
        { h: (a.v ? 'Faux' : 'Vrai') + ', car ' + (a.v ? 'un nombre ne peut appartenir qu\'à un seul ensemble.' : 'tout nombre qu\'on peut écrire avec une virgule est rationnel.'), message: a.f },
        { h: (a.v ? 'Vrai' : 'Faux') + ', car ℝ est le plus petit ensemble.', message: 'ℝ est le plus grand de ces ensembles. ' + a.f }
      ],
      indice: 'Rappel : ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ.',
      etapes: O.etapes([[(a.v ? 'Vrai : ' : 'Faux : ') + a.j, '']]),
      rubrique: R.ensembles,
      controle: { type: 'vfTexte', vrai: a.v }
    }, alea);
  }

  /* =====================================================================
   * 10e : diagrammes circulaires et en barre
   * ===================================================================== */

  function questionLireDiagramme(alea, p) {
    var n = alea.choix(p <= 2 ? [4, 5, 10] : [8, 20, 5, 10, 4]);
    var k = alea.entier(1, n - 1);
    var forme = alea.choix(['disque', 'barre']);
    var pc = fr(k * 100, n);
    return O.saisie({
      type: 'visuel',
      enonce: '<p>Quel pourcentage de la figure est colorié ?</p>',
      consigne: 'Écris le nombre de pour cent.',
      suffixe: '%',
      indice: 'Chaque part vaut 100 % : ' + n + ' = ' + M.formaterNombre(fr(100, n)) + ' %.',
      reponse: { type: 'valeur', valeur: pc, unite: '%' },
      pieges: [{ valeur: fr(k), message: 'Tu as donné le nombre de parts coloriées. Une part vaut ' + M.formaterNombre(fr(100, n)) + ' %.' }, { valeur: fr(100 * (n - k), n), message: 'Tu as calculé le pourcentage de la partie non coloriée.' }],
      etapes: O.etapes([['La figure est partagée en ' + n + ' parts égales ; ' + k + ' sont coloriées.', m(H.fh(k, n))], ['Je transforme en pourcentage.', m(H.fh(k, n) + ' = ' + H.n(pc) + ' %')]]),
      rubrique: R.diagrammes,
      visuel: { type: forme, parts: n, colorees: k },
      nombres: [fr(k), fr(n)],
      controle: { expr: k + '/' + n + '*100' },
      attenduHtml: H.n(pc) + ' %'
    });
  }

  function questionColorierPourcent(alea, p) {
    var n = alea.choix([4, 5, 8, 10, 20]);
    var k = alea.entier(1, n - 1);
    var pc = fr(k * 100, n);
    var forme = alea.choix(['disque', 'barre']);
    return O.saisie({
      type: 'visuel',
      enonce: '<p>La figure est partagée en ' + n + ' parts égales. Colorie ' + m(H.n(pc) + ' %') + ' de la figure.</p>',
      consigne: 'Touche les parts pour les colorier, puis valide.',
      indice: 'Une part représente ' + M.formaterNombre(fr(100, n)) + ' %.',
      reponse: { type: 'coloriage', parts: n, valeur: fr(k, n) },
      etapes: O.etapes([['Une part représente 100 % : ' + n + ' = ' + M.formaterNombre(fr(100, n)) + ' %.', ''], ['Je colorie ' + M.formaterNombre(pc) + ' : ' + M.formaterNombre(fr(100, n)) + ' = ' + k + ' part' + (k > 1 ? 's' : '') + '.', '']]),
      rubrique: R.diagrammes,
      visuel: { type: forme, parts: n, colorees: 0, interactif: true },
      visuelCorrection: { type: forme, parts: n, colorees: k },
      nombres: [pc, fr(n)],
      controle: { expr: '(' + pc.toString() + ')/100' }
    });
  }

  function questionAngle(alea, p) {
    var pc = alea.choix(p <= 2 ? [10, 20, 25, 50, 75, 30, 40] : [5, 15, 35, 45, 12.5, 60, 65, 80, 22.5]);
    var x = M.Fraction.depuis(pc);
    var angle = x.fois(360).divise(100);
    var sens = p >= 3 && alea.suivant() < 0.4 ? 'versPourcent' : 'versAngle';
    if (sens === 'versAngle') {
      return O.saisie({
        type: 'directe',
        enonce: '<p>Dans un diagramme circulaire, un secteur représente ' + m(H.n(x) + ' %') + ' du total. Quel est l\'angle de ce secteur ?</p>',
        consigne: 'Réponse en degrés.',
        suffixe: '°',
        indice: 'Le disque entier (100 %) correspond à 360°.',
        reponse: { type: 'valeur', valeur: angle, unite: ['°', 'degrés', 'degres'] },
        pieges: [{ valeur: x, message: 'Il faut transformer le pourcentage en angle : 100 % correspondent à 360°.' }, { valeur: x.fois(100).divise(360), message: 'Tu as divisé au lieu de multiplier : 1 % correspond à 3,6°.' }],
        etapes: O.etapes([['100 % correspondent à 360°, donc 1 % correspond à 3,6°.', ''], ['Je multiplie.', m(H.n(x) + ' · 3,6° = ' + H.n(angle) + '°')]]),
        verification: 'Vérification : ' + M.formaterNombre(angle) + '° est ' + (angle.compare(180) < 0 ? 'moins' : 'plus') + ' que la moitié du disque (180°), comme ' + M.formaterNombre(x) + ' % est ' + (x.compare(50) < 0 ? 'moins' : 'plus') + ' que 50 %. ✓',
        rubrique: R.diagrammes,
        visuelCorrection: { type: 'secteur', angle: angle.valeur() },
        nombres: [x],
        controle: { expr: '(' + x.toString() + ')*(18/5)' },
        attenduHtml: H.n(angle) + '°'
      });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Dans un diagramme circulaire, un secteur a un angle de ' + m(H.n(angle) + '°') + '. Quel pourcentage du total représente-t-il ?</p>',
      consigne: 'Écris le nombre de pour cent.',
      suffixe: '%',
      indice: '360° correspondent à 100 %.',
      reponse: { type: 'valeur', valeur: x, unite: '%' },
      pieges: [{ valeur: angle, message: 'Tu as recopié l\'angle : il faut le transformer en pourcentage.' }],
      etapes: O.etapes([['Je calcule la fraction du disque.', m(H.fh(H.n(angle), 360) + ' = ' + H.f(angle.divise(360)))], ['Je transforme en pourcentage.', m(H.f(angle.divise(360)) + ' = ' + H.n(x) + ' %')]]),
      rubrique: R.diagrammes,
      nombres: [x],
      controle: { expr: '(' + angle.toString() + ')*(5/18)' },
      attenduHtml: H.n(x) + ' %'
    });
  }

  function problemeDiagramme(alea, p) {
    var total = alea.choix([20, 25, 40, 50, 80, 200].filter(function (t) { return t <= Math.max(25, A9.LIMITE[p]); }));
    var pcs = [10, 20, 25, 30, 40, 50, 60, 15, 35, 45, 5];
    var pc;
    do { pc = alea.choix(pcs); } while (!fr(pc * total, 100).estEntier());
    var partie = pc * total / 100;
    var sport = alea.choix(['le football', 'le unihockey', 'la natation', 'le ski', 'la danse', 'l\'escalade']);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Dans un sondage auprès de ' + total + ' élèves d\'une école de ' + lieu(alea) + ', ' + partie + ' élèves ont choisi ' + sport + ' comme sport préféré.</p><p>Quel pourcentage des élèves interrogés cela représente-t-il ?</p>',
      consigne: 'Écris le nombre de pour cent.',
      suffixe: '%',
      indice: 'Écris la fraction ' + partie + '/' + total + ', puis transforme-la en pourcentage (dénominateur 100).',
      reponse: { type: 'valeur', valeur: fr(pc), unite: '%' },
      pieges: [{ valeur: fr(partie), message: 'Tu as recopié le nombre d\'élèves : il faut le comparer au total.' }, { valeur: fr(100 * (total - partie), total), message: 'Tu as calculé le pourcentage des autres élèves.' }],
      etapes: O.etapes([['J\'écris la fraction des élèves concernés.', m(H.fh(partie, total))], ['Je la transforme en pourcentage.', m(H.fh(partie, total) + ' = ' + H.fh(pc, 100) + ' = ' + pc + ' %')]]),
      verification: 'Vérification : ' + pc + ' % de ' + total + ' = ' + partie + '. ✓',
      rubrique: R.pourcentages,
      visuelCorrection: { type: 'secteur', angle: pc * 3.6 },
      nombres: [fr(total), fr(partie)],
      controle: { expr: partie + '/' + total + '*100' },
      attenduHtml: pc + ' %'
    });
  }

  /* =====================================================================
   * 10e et 11e : priorité des opérations avec des rationnels
   * ===================================================================== */

  function fractionSimple(alea, p, negatifPossible) {
    var b = alea.choix(p <= 2 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 8, 10]);
    var a = A9.premierAvec(alea, b, p <= 2 ? b - 1 || 1 : 2 * b);
    var f = fr(a, b);
    if (b === 1) f = fr(a);
    if (negatifPossible && alea.suivant() < 0.4) f = f.oppose();
    return f;
  }

  /** Nombres négatifs dans les calculs de fractions de 10e : seulement au niveau 2, difficulté 4. */
  function negatifs10(ctx, p) { return !!ctx && ctx.niveau === 2 && p >= 4; }

  /**
   * Expression de priorités avec des fractions (ou décimaux).
   * D1-D2 : deux opérations ; D3-D4 : trois opérations ;
   * opts.relatifs : nombres négatifs ; opts.deuxNiveaux : parenthèses sur deux niveaux (10e N2, D4).
   */
  function arbrePriorites(alea, p, opts) {
    opts = opts || {};
    var neg = !!opts.relatifs;
    var style = opts.style || 'fraction';
    function nb() {
      if (style === 'decimal') { var d = O.decimal(alea, 1, p <= 2 ? 30 : 99, 1); return A.f(neg && alea.suivant() < 0.4 ? d.oppose() : d, 'decimal'); }
      return A.f(fractionSimple(alea, p, neg));
    }
    function nbNonNul() { var f; do { f = nb(); } while (f.v.estZero()); return f; }
    var modeles = p <= 1 ? ['a+b·c', 'a–b·c', '(a+b)·c', 'a·b+c'] : p === 2 ? ['a+b·c', 'a–b·c', '(a+b)·c', 'a·b+c', '(a+b):c', 'a–b:c'] : ['a·b–c·d', 'a–b·(c+d)', '(a–b)·(c+d)', 'a·b–c:d', 'a+b:(c–d)'];
    if (opts.deuxNiveaux) modeles = ['a·(b–(c+d))', 'a–(b·(c+d))', '(a+b·(c–d))'];
    var modele = alea.choix(modeles);
    var t;
    switch (modele) {
      case 'a+b·c': t = A.o('+', nb(), A.o('·', nb(), nb())); break;
      case 'a–b·c': t = A.o('–', nb(), A.o('·', nb(), nb())); break;
      case 'a·b+c': t = A.o('+', A.o('·', nb(), nb()), nb()); break;
      case '(a+b)·c': t = A.o('·', A.par(A.o('+', nb(), nb())), nb()); break;
      case '(a+b):c': t = A.o(':', A.par(A.o('+', nb(), nb())), nbNonNul()); break;
      case 'a–b:c': t = A.o('–', nb(), A.o(':', nb(), nbNonNul())); break;
      case 'a·b–c·d': t = A.o('–', A.o('·', nb(), nb()), A.o('·', nb(), nb())); break;
      case 'a–b·(c+d)': t = A.o('–', nb(), A.o('·', nb(), A.par(A.o('+', nb(), nb())))); break;
      case 'a·b–c:d': t = A.o('–', A.o('·', nb(), nb()), A.o(':', nb(), nbNonNul())); break;
      case '(a–b)·(c+d)': t = A.o('·', A.par(A.o('–', nb(), nb())), A.par(A.o('+', nb(), nb()))); break;
      case 'a·(b–(c+d))': t = A.o('·', nb(), A.par(A.o('–', nb(), A.par(A.o('+', nb(), nb()))))); break;
      case 'a–(b·(c+d))': t = A.o('–', nb(), A.par(A.o('·', nb(), A.par(A.o('+', nb(), nb()))))); break;
      case '(a+b·(c–d))': t = A.par(A.o('+', nb(), A.o('·', nb(), A.par(A.o('–', nb(), nb()))))); t.par = false; break;
      default: {
        var b = nb(), c;
        do { c = nb(); } while (c.v.egal(b.v));
        t = A.o('+', nb(), A.o(':', nb(), A.par(A.o('–', b, c))));
      }
    }
    return t;
  }

  function valeursIntermediaires(t, liste) {
    liste = liste || [];
    liste.push(A.valeur(t));
    if (!t.feuille) { valeursIntermediaires(t.g, liste); if (t.d) valeursIntermediaires(t.d, liste); }
    return liste;
  }

  function questionPriorites(alea, p, ctx, opts) {
    opts = opts || {};
    var t, v, essais = 0;
    do {
      t = arbrePriorites(alea, p, opts);
      v = A.valeur(t);
      essais++;
    } while ((Number(v.den) > 120 || v.abs().compare(50) > 0 || A.feuilles(t).some(function (x) { return x.estZero(); }) ||
              (!opts.relatifs && valeursIntermediaires(t).some(function (x) { return x.signe() < 0; })) ||
              (opts.style === 'decimal' && !valeursIntermediaires(t).every(function (x) { return x.estDecimale() && O.nbDecimales(x) <= 3; }))) && essais < 400);
    var naif = A.naif(t);
    var irr = opts.irreductible || (p >= 3 && alea.suivant() < 0.5);
    var et = A.etapes(t).map(function (e, i) { return [e[0], m((i === 0 ? A.html(t) + ' ' : '') + e[1])]; });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule en respectant les priorités des opérations :</p><p class="calcul">' + m(A.html(t)) + '</p>',
      consigne: irr ? 'Donne le résultat sous forme de <strong>fraction irréductible</strong> (ou d\'un entier).' : 'Donne le résultat sous forme de fraction, d\'entier ou de nombre décimal.',
      indice: 'D\'abord les parenthèses, puis les multiplications et divisions, enfin les additions et soustractions.',
      reponse: { type: 'valeur', valeur: v, forme: irr ? 'irreductible' : 'nombre' },
      pieges: naif && !naif.egal(v) ? [{ valeur: naif, message: 'Tu as calculé de gauche à droite sans respecter les priorités : la multiplication et la division passent avant l\'addition et la soustraction.' }] : [],
      etapes: O.etapes(et),
      verification: 'Vérification avec des valeurs approchées : le résultat vaut environ ' + H.arrondi(v, 2) + '.',
      rubrique: R.priorites,
      nombres: A.feuilles(t),
      controle: { expr: A.texte(t) },
      attenduHtml: opts.style === 'decimal' ? H.n(v) : H.f(v)
    });
  }

  function erreurPriorites(alea, p) {
    var t, v, naif, essais = 0;
    do {
      var a = A.f(fr(alea.entier(1, 9), alea.choix([2, 3, 4]))), b = A.f(fr(alea.entier(1, 5), alea.choix([2, 3, 5]))), c = A.f(fr(alea.entier(1, 7), alea.choix([2, 4, 3])));
      t = A.o('+', a, A.o('·', b, c));
      v = A.valeur(t); naif = A.naif(t);
      essais++;
    } while ((naif.egal(v) || Number(v.den) > 60 || Number(naif.den) > 60) && essais < 50);
    var nom = prenom(alea);
    var juste = alea.suivant() < 0.25;
    var etapesNaives = juste
      ? A.etapes(t).map(function (e) { return e[1]; })
      : ['= ' + H.f(A.valeur(t.g).plus(A.valeur(t.d.g))) + ' · ' + H.f(A.valeur(t.d.d)), '= ' + H.f(naif)];
    var cle = juste ? 'aucune' : 'prio';
    var choix = [
      { h: 'L\'addition a été faite avant la multiplication.', juste: cle === 'prio', cle: 'prio', message: 'Regarde l\'ordre des opérations.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : la multiplication est prioritaire.' },
      { h: 'Il fallait d\'abord mettre toutes les fractions au même dénominateur.', juste: false, cle: 'den', message: 'Non : pour multiplier des fractions, on n\'a pas besoin d\'un dénominateur commun.' },
      { h: 'La multiplication des fractions est fausse.', juste: false, cle: 'mul', message: 'Le problème n\'est pas dans la multiplication elle-même.' }
    ];
    choix.forEach(function (x) { if (x.juste) x.message = ''; });
    return O.erreurEleve({
      eleve: nom,
      lignes: [A.html(t)].concat(etapesNaives).map(m),
      choix: choix,
      indice: 'Quelle opération doit être faite en premier ?',
      etapes: O.etapes(A.etapes(t).map(function (e, i) { return [e[0], m((i === 0 ? A.html(t) + ' ' : '') + e[1])]; })),
      rubrique: R.priorites,
      nombres: A.feuilles(t),
      controle: { type: 'erreur', correct: A.texte(t), eleve: (juste ? v : naif).toString(), cle: cle }
    }, alea);
  }

  /* =====================================================================
   * 10e : comparer, ordonner, encadrer, intercaler
   * ===================================================================== */

  function questionOrdonner(alea, p, ctx, opts) {
    var neg = !!(opts && opts.relatifs);
    var vals = [], textes = [], html = [];
    var essais = 0;
    while (vals.length < 4 && essais++ < 100) {
      var genre = alea.choix(['fraction', 'decimal', 'entier']);
      var x;
      if (genre === 'fraction') x = fractionSimple(alea, p, neg);
      else if (genre === 'decimal') x = new F(alea.entier(neg ? -30 : 1, 30), 10);
      else x = fr(alea.entier(neg ? -3 : 0, 3));
      if (vals.some(function (v) { return v.egal(x); })) continue;
      vals.push(x);
      if (genre === 'decimal') { textes.push(M.formaterNombre(x)); html.push(H.n(x)); }
      else { textes.push(M.formaterFraction(x)); html.push(H.f(x)); }
    }
    var croissant = alea.suivant() < 0.6;
    var idx = [0, 1, 2, 3].sort(function (i, j) { return croissant ? vals[i].compare(vals[j]) : vals[j].compare(vals[i]); });
    var tries = idx.map(function (i) { return vals[i]; });
    var lo = Math.floor(Math.min.apply(null, vals.map(function (v) { return v.valeur(); })));
    var hi = Math.ceil(Math.max.apply(null, vals.map(function (v) { return v.valeur(); })));
    if (hi === lo) hi = lo + 1;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Range ces nombres dans l\'ordre <strong>' + (croissant ? 'croissant' : 'décroissant') + '</strong> :</p><p class="calcul">' + m(html.join(NB + '; ')) + '</p>',
      consigne: 'Écris les quatre nombres séparés par des points-virgules « ; », ' + (croissant ? 'du plus petit au plus grand.' : 'du plus grand au plus petit.'),
      indice: 'Écris tous les nombres en écriture décimale (ou avec un dénominateur commun), puis place-les sur la droite numérique.',
      reponse: { type: 'liste', valeurs: tries, ordonne: true, croissant: croissant, textes: idx.map(function (i) { return textes[i]; }), textesHtml: idx.map(function (i) { return html[i]; }) },
      etapes: O.etapes([
        ['J\'écris les nombres en écriture décimale (valeur approchée si besoin).', m(vals.map(function (v, i) { return html[i] + ' ' + (v.estDecimale() ? '= ' + H.n(v) : '≈ ' + H.arrondi(v, 2)); }).join(NB + '; '))],
        ['Je range ' + (croissant ? 'du plus petit au plus grand' : 'du plus grand au plus petit') + '.', m(idx.map(function (i) { return html[i]; }).join(croissant ? ' &lt; ' : ' &gt; '))]
      ]),
      rubrique: R.comparer,
      visuel: { type: 'droite', min: lo, max: hi, pas: hi - lo <= 2 ? 0.1 : hi - lo <= 6 ? 0.5 : 1, interactif: true },
      visuelCorrection: { type: 'droite', min: lo, max: hi, pas: hi - lo <= 2 ? 0.1 : hi - lo <= 6 ? 0.5 : 1, points: vals.map(function (v, i) { return { v: v.valeur(), nom: String.fromCharCode(65 + i), label: textes[i] }; }) },
      nombres: vals,
      controle: { type: 'ordre', exprs: vals.map(function (v) { return v.toString(); }), croissant: croissant }
    });
  }

  function questionIntercaler(alea, p) {
    var a, b;
    if (p <= 3) {
      var n = alea.entier(1, 6), d = alea.entier(n + 1, 9);
      a = fr(n, d); b = fr(n + 1, d + 1);
      if (a.compare(b) > 0) { var t = a; a = b; b = t; }
      if (a.egal(b)) b = b.plus(fr(1, 10));
    } else {
      var x = O.decimal(alea, 11, 99, 1);
      a = x; b = x.plus(fr(1, 100));
    }
    var aH = a.estDecimale() && p > 3 ? H.n(a) : H.f(a), bH = b.estDecimale() && p > 3 ? H.n(b) : H.f(b);
    var mcd = O.ppmc(Number(a.den), Number(b.den));
    var mi = a.plus(b).divise(2);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Intercale un nombre entre ' + m(aH) + ' et ' + m(bH) + '.</p>',
      consigne: 'Écris un nombre strictement compris entre les deux (plusieurs réponses sont possibles).',
      indice: p > 3 ? 'Ajoute un chiffre : entre ' + M.formaterNombre(a) + ' et ' + M.formaterNombre(b) + ', il y a par exemple des nombres à 3 décimales.' : 'Mets les deux fractions au même dénominateur, puis amplifie encore (par 2 ou par 10) pour faire de la place.',
      reponse: { type: 'entre', min: a, max: b },
      etapes: O.etapes(p > 3 ? [
        ['J\'écris les deux nombres avec 3 décimales.', m(M.formaterNombre(a, 3, { fixe: true }) + ' et ' + M.formaterNombre(b, 3, { fixe: true }))],
        ['Je choisis un nombre entre les deux, par exemple le milieu.', m(H.n(mi))]
      ] : [
        ['Je mets les fractions au même dénominateur ' + mcd + ', puis j\'amplifie par 2.', m(H.f(a) + ' = ' + H.fh(Number(a.fois(mcd).num) * 2, mcd * 2) + ' ; ' + H.f(b) + ' = ' + H.fh(Number(b.fois(mcd).num) * 2, mcd * 2))],
        ['Un nombre entre les deux : par exemple le milieu.', m(H.f(mi))]
      ]),
      verification: 'Vérification : ' + M.formaterNombre(a, 4) + ' &lt; ' + M.formaterNombre(mi, 4) + ' &lt; ' + M.formaterNombre(b, 4) + ' (valeurs approchées). ✓',
      rubrique: R.comparer,
      visuel: (function () {
        var lo = Math.floor(a.valeur() * 10 + 1e-9) / 10, hi = Math.ceil(b.valeur() * 10 - 1e-9) / 10;
        if (hi <= lo) hi = lo + 0.1;
        lo = Number(lo.toFixed(1)); hi = Number(hi.toFixed(1));
        return { type: 'droite', min: lo, max: hi, pas: p > 3 ? 0.001 : 0.01, interactif: true, etiquettes: [lo, hi] };
      })(),
      nombres: [a, b],
      controle: { type: 'entre', a: a.toString(), b: b.toString() }
    });
  }

  function questionEncadrer(alea, p) {
    var b = alea.choix([3, 4, 6, 7, 8, 9]);
    var a;
    do { a = alea.entier(b + 1, 6 * b); } while (a % b === 0 || O.pgcd(a, b) !== 1);
    var x = fr(a, b);

    var pas = p >= 3 && alea.suivant() < 0.5 ? fr(1, 10) : fr(1);
    var bas = new F(Math.floor(x.valeur() / pas.valeur() + 1e-12)).fois(pas);
    if (bas.egal(x)) bas = bas.moins(pas);
    var haut = bas.plus(pas);
    var auDixieme = !pas.estEntier();
    return O.saisie({
      type: 'directe',
      enonce: '<p>Encadre ' + m(H.f(x)) + (auDixieme ? ' au dixième près' : ' entre deux nombres entiers consécutifs') + ' :</p><p class="calcul">' + m('… &lt; ' + H.f(x) + ' &lt; …') + '</p>',
      consigne: 'Écris les deux nombres séparés par « ; », le plus petit d\'abord.',
      indice: 'Calcule ' + a + ' : ' + b + ' (au moins jusqu\'au ' + (auDixieme ? 'centième' : 'dixième') + ').',
      reponse: { type: 'liste', valeurs: [bas, haut], ordonne: true, croissant: true, textes: [M.formaterNombre(bas), M.formaterNombre(haut)], textesHtml: [H.n(bas), H.n(haut)] },
      pieges: [],
      etapes: O.etapes([
        ['Je calcule une valeur approchée.', m(H.f(x) + ' ≈ ' + H.arrondi(x, 3))],
        ['J\'encadre ' + (auDixieme ? 'au dixième' : 'entre deux entiers consécutifs') + '.', m(H.n(bas) + ' &lt; ' + H.f(x) + ' &lt; ' + H.n(haut))]
      ]),
      verification: x.signe() < 0 ? 'Attention : avec un nombre négatif, le plus petit des deux nombres est le plus éloigné de zéro.' : '',
      rubrique: R.comparer,
      visuelCorrection: { type: 'droite', min: Number((bas.valeur() - pas.valeur()).toFixed(1)), max: Number((haut.valeur() + pas.valeur()).toFixed(1)), pas: auDixieme ? 0.01 : 0.1, points: [{ v: x.valeur(), nom: 'x', label: M.formaterFraction(x) }], etiquettes: [bas.valeur(), haut.valeur()] },
      nombres: [x],
      controle: { type: 'encadrement', expr: x.toString(), pas: pas.valeur() }
    });
  }

  /* =====================================================================
   * 10e : multiplier et diviser des fractions
   * ===================================================================== */

  function questionMulDiv(alea, p, ctx, opts) {
    // D1 : produit (avec simplification) ; D2 : division simple ; D3-D4 : avec un entier ; négatifs si opts.relatifs
    var op = p <= 1 ? '·' : alea.choix(['·', ':']);
    var neg = !!(opts && opts.relatifs);
    var f1 = fractionSimple(alea, Math.max(p, 3), neg), f2 = fractionSimple(alea, Math.max(p, 3), neg);
    var genre = p >= 3 ? alea.choix(['ff', 'ff', 'nf', 'fn']) : 'ff';
    var x = f1, y = f2;
    if (genre === 'nf') x = fr(alea.entierNonNul(neg ? -9 : 2, 9));
    if (genre === 'fn') y = fr(alea.entierNonNul(neg ? -9 : 2, 9));
    if (x.estZero() || y.estZero()) { x = fr(2, 3); y = fr(3, 4); }
    var res = op === '·' ? x.fois(y) : x.divise(y);
    var xh = H.f(x), yh = y.signe() < 0 ? '(' + H.f(y) + ')' : H.f(y);
    var irr = p >= 2;
    var et = [];
    var xa = Math.abs(Number(x.num)), xb = Number(x.den), ya = Math.abs(Number(y.num)), yb = Number(y.den);
    if (op === ':') {
      var inv = y.inverse();
      et.push(['Diviser par une fraction, c\'est multiplier par son inverse.', m(xh + ' : ' + yh + ' = ' + xh + ' · ' + (inv.signe() < 0 ? '(' + H.f(inv) + ')' : H.f(inv)))]);
      ya = Math.abs(Number(inv.num)); yb = Number(inv.den);
    }
    var signe = res.signe() < 0;
    if (x.signe() < 0 || y.signe() < 0) et.push(['Je détermine le signe : ' + ((x.signe() < 0) !== (y.signe() < 0) ? 'un seul facteur négatif, le produit est négatif.' : 'deux facteurs négatifs, le produit est positif.'), '']);
    et.push(['Je multiplie les numérateurs entre eux et les dénominateurs entre eux (en simplifiant avant si possible).', m((signe ? H.moins : '') + H.fh(xa + NB + '·' + NB + ya, xb + NB + '·' + NB + yb) + ' = ' + (signe ? H.moins : '') + H.fh(xa * ya, xb * yb))]);
    if (O.pgcd(xa * ya, xb * yb) > 1) et.push(['Je simplifie.', m(H.f(res))]);
    var pieges = [];
    if (op === ':') {
      pieges.push({ valeur: x.fois(y), message: 'Tu as multiplié par la fraction au lieu de multiplier par son inverse.' });
      if (!x.estZero()) pieges.push({ valeur: x.inverse().fois(y), message: 'Tu as pris l\'inverse de la première fraction : c\'est la seconde (le diviseur) qu\'il faut inverser.' });
    } else {
      pieges.push({ valeur: fr(Number(x.num) * Number(y.den), Number(x.den) * Number(y.num)), message: 'Tu as fait un « produit en croix ». Pour multiplier, on multiplie numérateur par numérateur et dénominateur par dénominateur.' });
      if (genre === 'nf' || genre === 'fn') {
        var n = genre === 'nf' ? x : y, f = genre === 'nf' ? y : x;
        pieges.push({ valeur: f, message: 'Tu as multiplié le numérateur ET le dénominateur par ' + M.formaterNombre(n) + ' : c\'est amplifier, la valeur ne change pas. Pour multiplier, on multiplie seulement le numérateur.' });
      }
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(xh + ' ' + op + ' ' + yh) + '</p>',
      consigne: irr ? 'Donne le résultat sous forme de <strong>fraction irréductible</strong> (ou d\'un entier).' : 'Donne le résultat sous forme de fraction.',
      indice: op === ':' ? 'Diviser, c\'est multiplier par l\'inverse du diviseur.' : 'Numérateurs entre eux, dénominateurs entre eux ; simplifie avant de multiplier.',
      reponse: { type: 'valeur', valeur: res, forme: irr ? 'irreductible' : 'nombre' },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: op === ':' ? 'Vérification : ' + m(H.fp(res) + ' · ' + yh + ' = ' + xh) + '. ✓' : 'Vérification avec des valeurs approchées : ' + H.arrondi(x, 2) + ' · ' + H.arrondi(y, 2) + ' ≈ ' + H.arrondi(res, 2) + '. ✓',
      rubrique: R.mulFractions,
      nombres: [x, y],
      controle: { expr: '(' + x.toString() + ')' + (op === '·' ? '*' : ':') + '(' + y.toString() + ')' },
      signature: op === '·' ? 'mul:' + [x.toString(), y.toString()].sort().join('*') : 'div:' + x.toString() + ':' + y.toString(),
      attenduHtml: H.f(res)
    });
  }

  function erreurMulDiv(alea, p) {
    var x = fractionSimple(alea, 3, false), y = fractionSimple(alea, 3, false);
    if (x.egal(y) || x.egal(y.inverse())) y = y.plus(1);
    var nom = prenom(alea);
    var type = alea.choix(['premiere', 'pasInverse', 'juste']);
    var res = x.divise(y);
    var lignes, cle, resEleve;
    if (type === 'premiere') { lignes = [H.f(x) + ' : ' + H.f(y) + ' = ' + H.f(x.inverse()) + ' · ' + H.f(y) + ' = ' + H.f(x.inverse().fois(y))]; resEleve = x.inverse().fois(y); cle = 'premiere'; }
    else if (type === 'pasInverse') { lignes = [H.f(x) + ' : ' + H.f(y) + ' = ' + H.f(x.fois(y))]; resEleve = x.fois(y); cle = 'pasinv'; }
    else { lignes = [H.f(x) + ' : ' + H.f(y) + ' = ' + H.f(x) + ' · ' + H.f(y.inverse()) + ' = ' + H.f(res)]; resEleve = res; cle = 'aucune'; }
    if (cle !== 'aucune' && resEleve.egal(res)) { cle = 'aucune'; }
    var choix = [
      { h: 'On a inversé la première fraction au lieu de la seconde.', juste: cle === 'premiere', cle: 'premiere', message: 'Regarde quelle fraction a été inversée.' },
      { h: 'On a multiplié par la seconde fraction sans l\'inverser.', juste: cle === 'pasinv', cle: 'pasinv', message: 'Regarde si une fraction a été inversée.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : le bon résultat est ' + M.formaterFraction(res) + '.' },
      { h: 'Il fallait mettre les deux fractions au même dénominateur.', juste: false, cle: 'den', message: 'Ce n\'est pas nécessaire pour diviser.' }
    ];
    choix.forEach(function (c) { if (c.juste) c.message = ''; });
    return O.erreurEleve({
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'Diviser par une fraction, c\'est multiplier par l\'inverse du diviseur (la seconde fraction).',
      etapes: O.etapes([['Je multiplie par l\'inverse du diviseur.', m(H.f(x) + ' : ' + H.f(y) + ' = ' + H.f(x) + ' · ' + H.f(y.inverse()) + ' = ' + H.f(res))]]),
      rubrique: R.mulFractions,
      nombres: [x, y],
      controle: { type: 'erreur', correct: '(' + x.toString() + '):(' + y.toString() + ')', eleve: resEleve.toString(), cle: cle }
    }, alea);
  }

  function vraiFauxMulDiv(alea, p) {
    var regles = [
      function () { var n = alea.entier(2, 9); return { t: 'Diviser un nombre par ' + M.formaterFraction(fr(1, n)) + ', c\'est le multiplier par ' + n + '.', v: true, a: '7:(1/' + n + ')', b: '7*' + n, j: 'diviser par une fraction, c\'est multiplier par son inverse, et l\'inverse de ' + M.formaterFraction(fr(1, n)) + ' est ' + n + '.' }; },
      function () { var n = alea.entier(2, 9); return { t: 'Diviser un nombre par ' + M.formaterFraction(fr(1, n)) + ', c\'est le diviser par ' + n + '.', v: false, a: '7:(1/' + n + ')', b: '7:' + n, j: 'diviser par ' + M.formaterFraction(fr(1, n)) + ', c\'est multiplier par ' + n + ' (l\'inverse).' }; },
      function () { var n = alea.entier(2, 9), a = alea.entier(1, 7), b = alea.entier(2, 9); return { t: m(n + ' · ' + H.fh(a, b) + ' = ' + H.fh(n * a, n * b)), v: false, a: n + '*(' + a + '/' + b + ')', b: (n * a) + '/' + (n * b), j: m(H.fh(n * a, n * b)) + ' est égal à ' + m(H.fh(a, b)) + ' (on a amplifié) ; le bon produit est ' + m(H.f(fr(n * a, b))) + '.' }; },
      function () { var a = alea.entier(1, 5), b = alea.entier(2, 7), c = alea.entier(1, 5), d = alea.entier(2, 7); return { t: m(H.fh(a, b) + ' · ' + H.fh(c, d) + ' = ' + H.fh(a * c, b * d)), v: true, a: '(' + a + '/' + b + ')*(' + c + '/' + d + ')', b: (a * c) + '/' + (b * d), j: 'on multiplie les numérateurs entre eux et les dénominateurs entre eux.' }; },
      function () { var a = alea.entier(1, 5), b = alea.entier(2, 7), c = alea.entier(1, 5), d = alea.entier(2, 7); if (a * d === b * c) d++; return { t: m(H.fh(a, b) + ' : ' + H.fh(c, d) + ' = ' + H.fh(a * c, b * d)), v: false, a: '(' + a + '/' + b + '):(' + c + '/' + d + ')', b: (a * c) + '/' + (b * d), j: 'pour diviser, on multiplie par l\'inverse : ' + m(H.fh(a, b) + ' · ' + H.fh(d, c) + ' = ' + H.f(fr(a * d, b * c))) + '.' }; }
    ];
    var r = alea.choix(regles)();
    // contrôle : si l'égalité numérique est vraie par hasard, on corrige la conclusion
    var vrai = M.evaluer(r.a).egal(M.evaluer(r.b));
    if (vrai !== r.v) { r = regles[3](); vrai = M.evaluer(r.a).egal(M.evaluer(r.b)); }
    return O.vraiFaux({
      enonce: '<p class="calcul">' + r.t + '</p>',
      vrai: vrai,
      bonne: r.j,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car il faut toujours mettre les fractions au même dénominateur.', message: 'Pour multiplier ou diviser, le dénominateur commun n\'est pas nécessaire.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car multiplier donne toujours un résultat plus grand.', message: 'Faux : multiplier par une fraction plus petite que 1 diminue le nombre.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car on additionne les numérateurs.', message: 'On n\'additionne pas les numérateurs dans une multiplication.' }
      ],
      indice: 'Teste avec un exemple simple, ou applique la règle de l\'aide-mémoire.',
      etapes: O.etapes([[(vrai ? 'Vrai : ' : 'Faux : ') + r.j, '']]),
      rubrique: R.mulFractions,
      controle: { type: 'vf', a: r.a, b: r.b, relation: '=' }
    }, alea);
  }

  function problemeMulDiv(alea, p) {
    var modele = alea.choix(['verres', 'recette', 'arrosage']);
    if (modele === 'verres') {
      var bout = alea.choix([fr(3, 4), fr(1, 2), fr(3, 2), fr(5, 4)]);
      var verre = alea.choix([fr(1, 8), fr(1, 4), fr(1, 10), fr(1, 5)]);
      var n = bout.divise(verre);
      if (!n.estEntier()) { verre = fr(1, 8); bout = fr(3, 4); n = fr(6); }
      return O.saisie({
        type: 'probleme',
        enonce: '<p>Pour une fête de classe, on verse le contenu d\'une bouteille de ' + m(H.f(bout)) + ' L de sirop dilué dans des verres de ' + m(H.f(verre)) + ' L.</p><p>Combien de verres peut-on remplir ?</p>',
        consigne: 'Écris un nombre entier.',
        suffixe: 'verres',
        indice: 'Combien de fois ' + M.formaterFraction(verre) + ' L dans ' + M.formaterFraction(bout) + ' L ? C\'est une division.',
        reponse: { type: 'valeur', valeur: n, unite: 'verres' },
        pieges: [{ valeur: bout.fois(verre), message: 'Tu as multiplié : il faut chercher combien de fois un verre « entre » dans la bouteille (division).' }],
        etapes: O.etapes([['Je divise la contenance de la bouteille par celle d\'un verre.', m(H.f(bout) + ' : ' + H.f(verre) + ' = ' + H.f(bout) + ' · ' + H.f(verre.inverse()) + ' = ' + H.f(n))]]),
        verification: 'Vérification : ' + m(H.f(n) + ' · ' + H.f(verre) + ' = ' + H.f(bout)) + ' L. ✓',
        rubrique: R.mulFractions,
        nombres: [bout, verre],
        controle: { expr: '(' + bout.toString() + '):(' + verre.toString() + ')' },
        attenduHtml: H.f(n) + ' verres'
      });
    }
    if (modele === 'recette') {
      var farine = alea.choix([fr(3, 4), fr(1, 2), fr(2, 3), fr(3, 8)]);
      var pers = alea.choix([4, 6, 8]);
      var voulu;
      do { voulu = alea.choix([2, 3, 6, 9, 10, 12]); } while (voulu === pers);
      var res = farine.fois(fr(voulu, pers));
      return O.saisie({
        type: 'probleme',
        enonce: '<p>Une recette de gâteau aux pommes pour ' + pers + ' personnes demande ' + m(H.f(farine)) + ' kg de farine. On veut faire le gâteau pour ' + voulu + ' personnes.</p><p>Quelle quantité de farine faut-il ?</p>',
        consigne: 'Réponse en kg (fraction ou nombre décimal).',
        suffixe: 'kg',
        indice: 'Calcule d\'abord la quantité pour 1 personne.',
        reponse: { type: 'valeur', valeur: res, unite: 'kg' },
        pieges: [{ valeur: farine.fois(voulu), message: 'Tu as multiplié la quantité pour ' + pers + ' personnes par ' + voulu + ' : calcule d\'abord la quantité pour 1 personne.' }],
        etapes: O.etapes([['Quantité pour 1 personne.', m(H.f(farine) + ' : ' + pers + ' = ' + H.f(farine.divise(pers)))], ['Quantité pour ' + voulu + ' personnes.', m(H.f(farine.divise(pers)) + ' · ' + voulu + ' = ' + H.f(res) + (res.estDecimale() ? ' = ' + H.n(res) : ''))]]),
        verification: 'Vérification : ' + (voulu > pers ? 'plus de personnes, donc plus de farine. ✓' : 'moins de personnes, donc moins de farine. ✓'),
        rubrique: R.mulFractions,
        nombres: [farine, fr(pers), fr(voulu)],
        controle: { expr: '(' + farine.toString() + ')/' + pers + '*' + voulu },
        attenduHtml: H.f(res) + ' kg'
      });
    }
    var cuve = alea.choix([fr(5, 6), fr(3, 4), fr(9, 10), fr(2, 3)]);
    var part = alea.choix([fr(3, 5), fr(1, 2), fr(2, 3), fr(3, 4), fr(4, 5)]);
    var arros = part.fois(cuve);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>La citerne d\'eau de pluie du jardin de l\'école contient ' + m(H.f(cuve)) + ' m³. On utilise les ' + m(H.f(part)) + ' de cette eau pour arroser le potager.</p><p>Quel volume d\'eau sert à l\'arrosage ?</p>',
      consigne: 'Réponse en m³ (fraction).',
      suffixe: 'm³',
      indice: 'Les ' + M.formaterFraction(part) + ' de ' + M.formaterFraction(cuve) + ', c\'est ' + M.formaterFraction(part) + ' · ' + M.formaterFraction(cuve) + '.',
      reponse: { type: 'valeur', valeur: arros, unite: ['m³', 'm3'] },
      pieges: [{ valeur: cuve.moins(arros), message: 'Tu as calculé l\'eau qui reste dans la citerne.' }, { valeur: cuve.divise(part), message: 'Il faut multiplier : « les 3/5 de… » se calcule avec une multiplication.' }],
      etapes: O.etapes([['Je calcule la fraction de la quantité (multiplication).', m(H.f(part) + ' · ' + H.f(cuve) + ' = ' + H.f(arros))]]),
      verification: 'Vérification : le résultat est plus petit que ' + M.formaterFraction(cuve) + ' m³. ✓',
      rubrique: R.mulFractions,
      nombres: [cuve, part],
      controle: { expr: '(' + part.toString() + ')*(' + cuve.toString() + ')' },
      attenduHtml: H.f(arros) + ' m³'
    });
  }

  /* =====================================================================
   * 10e : calcul réfléchi
   * ===================================================================== */

  /**
   * Astuces de calcul réfléchi. dMin : difficulté à partir de laquelle l'astuce est proposée.
   * Chaque astuce reçoit la limite L de la difficulté (nombres ⩽ L).
   * D1 : une opération sur des nombres ⩽ 20 ; D3 : deux opérations ; D4 : mise en évidence.
   */
  function entre(alea, min, max) { return alea.entier(min, Math.max(min, max)); }
  var ASTUCES = [
    { dMin: 1, f: function (alea, L) { var n = 2 * entre(alea, 3, Math.floor(L / 2)); return { e: '0,5 · ' + n, t: '0.5*' + n, i: 'Multiplier par 0,5, c\'est prendre la moitié.', c: '0,5 · ' + n + ' = ' + n + ' : 2', n: [fr(n)] }; } },
    { dMin: 1, f: function (alea, L) { var x = M.Fraction.depuis(entre(alea, 2, Math.min(L - 1, 40)) + 0.5); return { e: H.n(x) + ' : 0,5', t: '(' + x.toString() + '):0.5', i: 'Diviser par 0,5, c\'est multiplier par 2.', c: H.n(x) + ' : 0,5 = ' + H.n(x) + ' · 2', n: [x] }; } },
    { dMin: 1, f: function (alea, L) { var x = O.decimal(alea, 11, Math.min(10 * L, 999), 1); return { e: H.n(x) + ' : 0,1', t: '(' + x.toString() + '):0.1', i: 'Diviser par 0,1, c\'est multiplier par 10.', c: H.n(x) + ' : 0,1 = ' + H.n(x) + ' · 10', n: [x] }; } },
    { dMin: 2, f: function (alea, L) { var n = 4 * entre(alea, 3, Math.floor(L / 4)); return { e: '0,25 · ' + n, t: '0.25*' + n, i: 'Multiplier par 0,25, c\'est prendre le quart : diviser par 4.', c: '0,25 · ' + n + ' = ' + n + ' : 4', n: [fr(n)] }; } },
    { dMin: 2, f: function (alea, L) { var n = 2 * entre(alea, 3, Math.floor(L / 2)); return { e: '1,5 · ' + n, t: '1.5*' + n, i: '1,5 fois un nombre, c\'est ce nombre plus sa moitié.', c: '1,5 · ' + n + ' = ' + n + ' + ' + (n / 2), n: [fr(n)] }; } },
    { dMin: 2, f: function (alea, L) { var n = 4 * entre(alea, 3, Math.floor(L / 4)); var pc = alea.choix([25, 75]); return { e: pc + ' % de ' + n, t: pc + '/100*' + n, i: pc === 25 ? '25 %, c\'est le quart.' : '75 %, ce sont les trois quarts.', c: pc + ' % de ' + n + ' = ' + (pc === 25 ? n + ' : 4' : '3 · (' + n + ' : 4)'), n: [fr(n)] }; } },
    { dMin: 3, f: function (alea, L) { var n = entre(alea, 3, 40); return { e: '9,9 · ' + n, t: '9.9*' + n, i: '9,9 = 10 – 0,1.', c: '9,9 · ' + n + ' = 10 · ' + n + ' – 0,1 · ' + n, n: [fr(n)] }; } },
    { dMin: 3, f: function (alea, L) { var b = alea.choix([3, 4, 5, 8]); var a = A9.premierAvec(alea, b, b - 1); var n = b * entre(alea, 2, Math.floor(L / b)); return { e: H.fh(a, b) + ' de ' + n, t: '(' + a + '/' + b + ')*' + n, i: 'Divise par ' + b + ', puis multiplie par ' + a + '.', c: H.fh(a, b) + ' de ' + n + ' = (' + n + ' : ' + b + ') · ' + a, n: [fr(n), fr(a, b)] }; } },
    { dMin: 3, f: function (alea, L) { var x = O.decimal(alea, 11, 99, 1); return { e: '2,5 · ' + H.n(x) + ' · 4', t: '2.5*(' + x.toString() + ')*4', i: 'Regroupe les facteurs qui donnent un résultat simple : 2,5 · 4 = 10.', c: '2,5 · 4 · ' + H.n(x) + ' = 10 · ' + H.n(x), n: [x] }; } },
    { dMin: 4, f: function (alea, L) { var n = entre(alea, 12, 99); return { e: '0,1 · ' + n + ' + 0,9 · ' + n, t: '0.1*' + n + '+0.9*' + n, i: 'Les deux produits ont le facteur ' + n + ' en commun : mets-le en évidence.', c: '0,1 · ' + n + ' + 0,9 · ' + n + ' = (0,1 + 0,9) · ' + n + ' = 1 · ' + n, n: [fr(n)] }; } }
  ];

  function questionCalculReflechi(alea, p) {
    var a = alea.choix(ASTUCES.filter(function (x) { return x.dMin <= p; })).f(alea, A9.LIMITE[p]);
    var v = M.evaluer(a.t);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule mentalement (sans poser le calcul) :</p><p class="calcul">' + m(a.e) + '</p>',
      consigne: 'Écris le résultat.',
      indice: a.i,
      reponse: { type: 'valeur', valeur: v },
      etapes: O.etapes([['Astuce : ' + a.i, m(a.c)], ['Résultat.', m('= ' + H.n(v))]]),
      verification: 'Vérification : refais le calcul autrement, par exemple en posant l\'opération.',
      rubrique: R.decimaux,
      nombres: a.n,
      controle: { expr: a.t },
      attenduHtml: H.n(v)
    });
  }

  var REGLES_REFLECHI = [
    { t: 'Diviser par 0,5, c\'est multiplier par 2.', v: true, a: function (n) { return n + ':0.5'; }, b: function (n) { return n + '*2'; } },
    { t: 'Multiplier par 0,5, c\'est diviser par 5.', v: false, a: function (n) { return n + '*0.5'; }, b: function (n) { return n + ':5'; }, j: 'multiplier par 0,5, c\'est diviser par 2 (prendre la moitié).' },
    { t: 'Diviser par 0,25, c\'est multiplier par 4.', v: true, a: function (n) { return n + ':0.25'; }, b: function (n) { return n + '*4'; } },
    { t: 'Diviser par 0,1, c\'est diviser par 10.', v: false, a: function (n) { return n + ':0.1'; }, b: function (n) { return n + ':10'; }, j: 'diviser par 0,1, c\'est multiplier par 10.' },
    { t: 'Multiplier par 1,5, c\'est ajouter la moitié du nombre.', v: true, a: function (n) { return n + '*1.5'; }, b: function (n) { return n + '+' + n + '/2'; } },
    { t: 'Prendre 20 % d\'un nombre, c\'est le diviser par 5.', v: true, a: function (n) { return '20/100*' + n; }, b: function (n) { return n + ':5'; } },
    { t: 'Prendre 25 % d\'un nombre, c\'est le diviser par 25.', v: false, a: function (n) { return '25/100*' + n; }, b: function (n) { return n + ':25'; }, j: 'prendre 25 %, c\'est prendre le quart : diviser par 4.' }
  ];

  function vraiFauxReflechi(alea, p) {
    var r = alea.choix(REGLES_REFLECHI);
    var n = 4 * alea.entier(p <= 1 ? 1 : 3, p <= 1 ? 5 : 25);
    var vrai = M.evaluer(r.a(n)).egal(M.evaluer(r.b(n)));
    var exemple = 'par exemple avec ' + n + ' : ' + M.formaterNombre(M.evaluer(r.a(n))) + (vrai ? ' = ' : ' ≠ ') + M.formaterNombre(M.evaluer(r.b(n))) + '.';
    return O.vraiFaux({
      enonce: '<p class="calcul">' + r.t + '</p>',
      vrai: vrai,
      bonne: r.j ? r.j + ' ' + exemple.charAt(0).toUpperCase() + exemple.slice(1) : exemple,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car on ne peut pas remplacer une division par une multiplication.', message: 'Diviser par un nombre, c\'est multiplier par son inverse.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car ' + (vrai ? 'le résultat change toujours.' : 'cela marche avec tous les nombres décimaux.'), message: 'Teste avec un exemple : ' + exemple },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car 0,5 = 5.', message: '0,5 n\'est pas égal à 5.' }
      ],
      indice: 'Teste avec un exemple simple.',
      etapes: O.etapes([['Je teste ' + exemple, '']]),
      rubrique: R.decimaux,
      nombres: [fr(n)],
      controle: { type: 'vf', a: r.a(n), b: r.b(n), relation: '=' }
    }, alea);
  }

  /* =====================================================================
   * 10e : problèmes (pourcentages, fractions)
   * ===================================================================== */

  function problemeRabais(alea, p) {
    var prix = alea.choix([40, 60, 80, 120, 160, 200, 240, 280, 300].filter(function (x) { return x <= Math.max(40, A9.LIMITE[p]); }));
    var pc = alea.choix(p <= 2 ? [10, 20, 25, 50] : [15, 30, 35, 40, 12, 5]);
    var objet = alea.choix([{ un: 'un vélo', du: 'du vélo' }, { un: 'une paire de skis', du: 'de la paire de skis' }, { un: 'un casque de vélo', du: 'du casque de vélo' }, { un: 'une tente de camping', du: 'de la tente de camping' }, { un: 'une trottinette', du: 'de la trottinette' }]);
    var hausse = p >= 3 && alea.suivant() < 0.3;
    var red = fr(prix * pc, 100);
    var res = hausse ? fr(prix).plus(red) : fr(prix).moins(red);
    return O.saisie({
      type: 'probleme',
      enonce: hausse
        ? '<p>Le prix ' + objet.du + ' était de ' + H.chf(fr(prix)) + '. Il augmente de ' + pc + ' %.</p><p>Quel est le nouveau prix ?</p>'
        : '<p>Pendant les soldes, ' + objet.un + ' qui coûtait ' + H.chf(fr(prix)) + ' bénéficie d\'un rabais de ' + pc + ' %.</p><p>Quel est le prix soldé ?</p>',
      consigne: 'Réponse en francs.',
      suffixe: 'francs',
      indice: 'Calcule d\'abord ' + pc + ' % de ' + prix + ' francs, puis ' + (hausse ? 'ajoute-le' : 'soustrais-le') + '.',
      reponse: { type: 'montant', valeur: res },
      pieges: [{ valeur: red, message: 'Tu as calculé le montant ' + (hausse ? 'de l\'augmentation' : 'du rabais') + ' ; on demande le nouveau prix.' }, { valeur: hausse ? fr(prix).moins(red) : fr(prix).plus(red), message: hausse ? 'C\'est une augmentation : le prix monte.' : 'C\'est un rabais : le prix baisse.' }],
      estimation: true,
      etapes: O.etapes([['Je calcule ' + pc + ' % du prix.', m(H.fh(pc, 100) + ' · ' + prix + ' = ' + H.n(red))], [hausse ? 'J\'ajoute l\'augmentation.' : 'Je soustrais le rabais.', m(prix + (hausse ? ' + ' : ' – ') + H.n(red) + ' = ' + H.n(res))]]),
      verification: 'Autre méthode : ' + m(H.n(fr(100 + (hausse ? pc : -pc))) + ' % de ' + prix + ' = ' + H.n(res)) + '. ✓',
      rubrique: R.pourcentages,
      nombres: [fr(prix), fr(pc)],
      controle: { expr: prix + (hausse ? '+' : '-') + pc + '/100*' + prix },
      attenduHtml: H.chf(res)
    });
  }

  function problemeEnergie(alea, p) {
    // consommation mensuelle (ordre de grandeur réaliste pour un ménage), nombres ⩽ la limite
    var conso = alea.choix([20, 40, 60, 80, 120, 160, 200, 240, 300].filter(function (x) { return x <= Math.max(20, A9.LIMITE[p]); }));
    var pc, res, essai = 0;
    do { pc = alea.choix([10, 20, 25, 30, 40, 50, 60, 75]); res = fr(conso * pc, 100); essai++; } while (!res.estEntier() && essai < 50);
    var inutile = p >= 3 ? ' Les panneaux ont une surface de ' + alea.entier(15, 40) + ' m².' : '';
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Une famille consomme ' + H.n(fr(conso)) + ' kWh d\'électricité par mois. Ses panneaux solaires couvrent ' + pc + ' % de cette consommation.' + inutile + '</p><p>Combien de kWh les panneaux fournissent-ils par mois ?</p>',
      consigne: 'Réponse en kWh.',
      suffixe: 'kWh',
      indice: pc + ' % de ' + conso + ' = ' + pc + '/100 · ' + conso + '.',
      reponse: { type: 'valeur', valeur: res, unite: 'kWh' },
      pieges: [{ valeur: fr(conso).moins(res), message: 'Tu as calculé la part qui ne vient pas des panneaux.' }],
      etapes: O.etapes([['Données utiles : la consommation et le pourcentage' + (inutile ? ' (la surface ne sert pas).' : '.'), ''], ['Je calcule le pourcentage.', m(H.fh(pc, 100) + ' · ' + H.n(fr(conso)) + ' = ' + H.n(res))]]),
      verification: 'Vérification : 10 % de ' + H.n(fr(conso)) + ' = ' + H.n(fr(conso, 10)) + ', donc ' + pc + ' % = ' + H.n(res) + '. ✓',
      rubrique: R.pourcentages,
      nombres: [fr(conso), fr(pc)],
      controle: { expr: pc + '/100*' + conso },
      attenduHtml: H.n(res) + ' kWh'
    });
  }

  /* =====================================================================
   * 11e : réels (comparer, ordonner, encadrer)
   * ===================================================================== */

  function questionEncadrerRacine(alea, p) {
    var n;
    do { n = alea.entier(2, A9.LIMITE[p]); } while (Number.isInteger(Math.sqrt(n)));
    var bas = Math.floor(Math.sqrt(n)), haut = bas + 1;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Encadre ' + m('√' + n) + ' entre deux nombres entiers consécutifs :</p><p class="calcul">' + m('… &lt; √' + n + ' &lt; …') + '</p>',
      consigne: 'Écris les deux entiers séparés par « ; », le plus petit d\'abord.',
      indice: 'Cherche les deux carrés parfaits qui entourent ' + n + '.',
      reponse: { type: 'liste', valeurs: [fr(bas), fr(haut)], ordonne: true, croissant: true, textes: [String(bas), String(haut)], textesHtml: [String(bas), String(haut)] },
      pieges: [{ test: function (t) { return t.replace(/\s/g, '') === (bas * bas) + ';' + (haut * haut); }, message: 'Tu as donné les carrés parfaits : il faut leurs racines.' }],
      etapes: O.etapes([['Je cherche les carrés parfaits qui entourent ' + n + '.', m((bas * bas) + ' &lt; ' + n + ' &lt; ' + (haut * haut))], ['Je prends les racines carrées.', m('√' + (bas * bas) + ' &lt; √' + n + ' &lt; √' + (haut * haut) + ', donc ' + bas + ' &lt; √' + n + ' &lt; ' + haut)]]),
      verification: 'Vérification : ' + m('√' + n + ' ≈ ' + H.arrondi(M.Fraction.depuis(Number(Math.sqrt(n).toFixed(6))), 3)) + '. ✓',
      rubrique: R.racines,
      nombres: [fr(n)],
      controle: { type: 'encadrement', expr: '√' + n, pas: 1 }
    });
  }

  function questionOrdonnerReels(alea, p) {
    var items = [];
    var k = alea.entier(2, 9);
    var r = alea.choix([2, 3, 5, 6, 7, 8, 10, 11, 12]);
    var s = Math.sqrt(r);
    items.push({ v: s, t: '√' + r, h: '√' + r });
    var d1 = Math.round(s * 10) / 10;
    if (Math.abs(d1 - s) > 1e-9) items.push({ v: d1, t: M.formaterNombre(M.Fraction.depuis(d1)), h: H.n(M.Fraction.depuis(d1)) });
    var f = fr(Math.round(s * 7) + 1, 7);
    if (Math.abs(f.valeur() - s) > 1e-6 && !items.some(function (i) { return Math.abs(i.v - f.valeur()) < 1e-9; })) items.push({ v: f.valeur(), t: M.formaterFraction(f), h: H.f(f) });
    var per = fr(Math.round(s * 3) * 3 + 1, 9);
    if (!items.some(function (i) { return Math.abs(i.v - per.valeur()) < 1e-6; })) items.push({ v: per.valeur(), t: M.formaterNombre(per), h: H.n(per) });
    if (p >= 4) {
      var neg = -alea.entier(1, 3) - 0.5;
      items.push({ v: neg, t: M.formaterNombre(M.Fraction.depuis(neg)), h: H.n(M.Fraction.depuis(neg)) });
    }
    while (items.length < 4) {
      var x = O.decimal(alea, 5, 40, 1);
      if (!items.some(function (i) { return Math.abs(i.v - x.valeur()) < 1e-6; })) items.push({ v: x.valeur(), t: M.formaterNombre(x), h: H.n(x) });
    }
    items = alea.melanger(items).slice(0, p >= 4 ? 5 : 4);
    var croissant = alea.suivant() < 0.6;
    var tries = items.slice().sort(function (a, b) { return croissant ? a.v - b.v : b.v - a.v; });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Range ces nombres réels dans l\'ordre <strong>' + (croissant ? 'croissant' : 'décroissant') + '</strong> :</p><p class="calcul">' + m(items.map(function (i) { return i.h; }).join(NB + '; ')) + '</p>',
      consigne: 'Écris les nombres séparés par « ; ». Pour une racine, utilise la touche √.',
      clavier: 'complet',
      indice: 'Écris une valeur approchée de chaque nombre (au centième), puis compare.',
      reponse: { type: 'liste', valeurs: tries.map(function (i) { return i.v; }), ordonne: true, croissant: croissant, textes: tries.map(function (i) { return i.t; }), textesHtml: tries.map(function (i) { return i.h; }) },
      etapes: O.etapes([
        ['J\'écris une valeur approchée de chaque nombre.', m(items.map(function (i) { return i.h + ' ≈ ' + H.arrondi(M.Fraction.depuis(Number(i.v.toFixed(8))), 3); }).join(NB + '; '))],
        ['Je range.', m(tries.map(function (i) { return i.h; }).join(croissant ? ' &lt; ' : ' &gt; '))]
      ]),
      rubrique: R.comparer,
      nombres: [fr(r)],
      controle: { type: 'ordre', exprs: items.map(function (i) { return i.t.replace(/ /g, ' '); }), croissant: croissant }
    });
  }

  function questionComparerReels(alea, p) {
    var r = alea.choix([2, 3, 5, 7, 10, 11, 13, 15, 17, 20]);
    var s = Math.sqrt(r);
    var genre = alea.choix(['decimal', 'fraction', 'racine']);
    var autre, ah, at;
    if (genre === 'decimal') { var d = M.Fraction.depuis(Number((Math.round(s * 100 + alea.choix([-1, 1])) / 100).toFixed(2))); autre = d.valeur(); ah = H.n(d); at = d.toString(); }
    else if (genre === 'fraction') { var b = alea.choix([3, 4, 5, 7]); var f = fr(Math.round(s * b) + alea.choix([0, 1]), b); autre = f.valeur(); ah = H.f(f); at = f.toString(); }
    else { var r2 = r + alea.choix([-1, 1, 2]); var c = alea.entier(2, 3); ah = c + '√' + r2; at = c + '√' + r2; autre = c * Math.sqrt(r2); }
    if (Math.abs(autre - s) < 1e-9) { autre += 0.1; }
    var signe = s < autre ? '<' : '>';
    var choix = ['<', '=', '>'].map(function (sym) {
      return { h: m('√' + r + ' ' + (sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '=') + ' ' + ah), juste: sym === signe, cle: sym, message: sym === signe ? '' : 'Compare les carrés des deux nombres (ils sont positifs), ou leurs valeurs approchées.' };
    });
    var carreAutre = genre === 'racine' ? at.replace(/√/, ' · ') : '';
    return O.choix({
      type: 'directe',
      enonce: '<p>Compare ' + m('√' + r) + ' et ' + m(ah) + '.</p>',
      consigne: 'Choisis le bon signe.',
      choix: choix,
      ordreFixe: true,
      indice: 'Deux nombres positifs sont rangés dans le même ordre que leurs carrés.',
      etapes: O.etapes([
        ['Je compare les carrés (les deux nombres sont positifs).', m('(√' + r + ')² = ' + r + ' ; (' + ah + ')² ' + (genre === 'racine' ? '= ' + H.n(M.Fraction.depuis(Number((autre * autre).toFixed(6)))) : '≈ ' + H.arrondi(M.Fraction.depuis(Number((autre * autre).toFixed(8))), 3)))],
        ['Conclusion.', m('√' + r + ' ' + (signe === '<' ? '&lt;' : '&gt;') + ' ' + ah)]
      ]),
      rubrique: R.comparer,
      nombres: [fr(r)],
      controle: { type: 'compareApprox', a: '√' + r, b: at, cle: signe }
    }, alea);
  }

  function questionIrrationnel(alea, p) {
    var irr = alea.choix([{ h: '√' + alea.choix([2, 3, 5, 6, 7, 10]), j: 'n\'est pas une racine d\'un carré parfait' }, { h: 'π', j: 'est un nombre irrationnel célèbre' }]);
    var rats = alea.melanger([
      { h: '√' + alea.choix([4, 9, 16, 25, 36, 49, 64, 81]), m: 'C\'est la racine d\'un carré parfait : c\'est un entier.' },
      { h: H.n(fr(alea.choix([1, 2, 4, 5]), 3)), m: 'Une écriture périodique correspond à une fraction : c\'est un rationnel.' },
      { h: H.f(fr(22, 7)), m: '22/7 est une fraction (valeur approchée de π, mais rationnelle).' },
      { h: '3,14', m: '3,14 = 314/100 : c\'est un décimal, donc un rationnel.' },
      { h: H.moins + '12', m: 'C\'est un entier relatif.' }
    ]).slice(0, 3);
    var choix = [{ h: m(irr.h), juste: true, cle: 'irr', message: '' }].concat(rats.map(function (r) { return { h: m(r.h), juste: false, cle: r.h, message: r.m }; }));
    return O.choix({
      type: 'directe',
      enonce: '<p>Lequel de ces nombres est <strong>irrationnel</strong> (il appartient à ℝ mais pas à ℚ) ?</p>',
      consigne: 'Choisis un nombre.',
      choix: choix,
      indice: 'Un nombre rationnel peut s\'écrire comme une fraction (décimal fini ou périodique).',
      etapes: O.etapes([[m(irr.h) + ' ' + irr.j + ' : il ne peut pas s\'écrire comme une fraction.', '']]),
      rubrique: R.ensembles,
      controle: { type: 'aucun' }
    }, alea);
  }

  /* =====================================================================
   * 11e : problèmes avec des rationnels
   * ===================================================================== */

  function problemeRationnels11(alea, p) {
    // D3 : trajet (trois étapes) ; D4 : trajet, cagnotte ou stockage
    var modele = p <= 3 ? 'trajet' : alea.choix(['trajet', 'cagnotte', 'stockage']);
    if (modele === 'trajet') {
      var total = alea.choix([24, 30, 36, 48, 60]);
      var f1 = alea.choix([fr(1, 3), fr(1, 4), fr(1, 6), fr(2, 5)]);
      var f2 = alea.choix([fr(1, 2), fr(2, 3), fr(3, 4)]);
      var apres1 = fr(total).fois(fr(1).moins(f1));
      var res = apres1.fois(fr(1).moins(f2));
      if (!res.fois(10).estEntier()) { total = 60; f1 = fr(1, 3); f2 = fr(1, 2); apres1 = fr(40); res = fr(20); }
      var nom = prenom(alea);
      return O.saisie({
        type: 'probleme',
        enonce: '<p>' + nom + ' fait une randonnée à vélo de ' + total + ' km dans le Jura. Le matin, ' + nom + ' parcourt ' + m(H.f(f1)) + ' du trajet. L\'après-midi, ' + nom + ' parcourt ' + m(H.f(f2)) + ' de ce qui restait.</p><p>Combien de kilomètres reste-t-il à parcourir le soir ?</p>',
        consigne: 'Réponse en km.',
        suffixe: 'km',
        indice: 'Calcule ce qui reste après le matin ; l\'après-midi porte sur ce reste, pas sur le trajet entier.',
        reponse: { type: 'valeur', valeur: res, unite: 'km' },
        pieges: [{ valeur: fr(total).fois(fr(1).moins(f1).moins(f2)), message: 'Attention : ' + M.formaterFraction(f2) + ' porte sur ce qui restait après le matin, pas sur le trajet entier.' }, { valeur: apres1, message: 'C\'est ce qui reste après le matin ; il faut encore enlever la part de l\'après-midi.' }],
        etapes: O.etapes([
          ['Distance du matin.', m(H.f(f1) + ' · ' + total + ' = ' + H.n(f1.fois(total)) + ' km')],
          ['Reste après le matin.', m(total + ' – ' + H.n(f1.fois(total)) + ' = ' + H.n(apres1) + ' km')],
          ['Distance de l\'après-midi (sur le reste).', m(H.f(f2) + ' · ' + H.n(apres1) + ' = ' + H.n(f2.fois(apres1)) + ' km')],
          ['Reste pour le soir.', m(H.n(apres1) + ' – ' + H.n(f2.fois(apres1)) + ' = ' + H.n(res) + ' km')]
        ]),
        verification: 'Vérification : ' + H.n(f1.fois(total)) + ' + ' + H.n(f2.fois(apres1)) + ' + ' + H.n(res) + ' = ' + total + ' km. ✓',
        rubrique: R.mulFractions,
        nombres: [fr(total), f1, f2],
        controle: { expr: total + '*(1-(' + f1.toString() + '))*(1-(' + f2.toString() + '))' },
        attenduHtml: H.n(res) + ' km'
      });
    }
    if (modele === 'cagnotte') {
      var c = alea.choix([120, 160, 200, 240, 300]);
      var g = alea.choix([fr(1, 4), fr(1, 3), fr(2, 5), fr(3, 8)]);
      var pc = alea.choix([10, 20, 25, 30]);
      var depense = g.fois(c);
      var reste = fr(c).moins(depense);
      var res2 = reste.moins(reste.fois(fr(pc, 100)));
      if (!res2.fois(100).estEntier()) { c = 240; g = fr(1, 4); pc = 20; depense = fr(60); reste = fr(180); res2 = fr(144); }
      return O.saisie({
        type: 'probleme',
        enonce: '<p>Une classe a récolté ' + H.chf(fr(c)) + ' pour sa course d\'école. Elle dépense ' + m(H.f(g)) + ' de la somme pour le transport, puis ' + pc + ' % de ce qui reste pour les entrées d\'un musée.</p><p>Combien d\'argent reste-t-il ?</p>',
        consigne: 'Réponse en francs.',
        suffixe: 'francs',
        indice: 'Travaille par étapes : transport, reste, entrées (' + pc + ' % du reste), reste final.',
        reponse: { type: 'montant', valeur: res2 },
        pieges: [{ valeur: fr(c).moins(depense).moins(fr(c * pc, 100)), message: 'Les ' + pc + ' % portent sur ce qui reste après le transport, pas sur la somme de départ.' }],
        estimation: true,
        etapes: O.etapes([
          ['Transport.', m(H.f(g) + ' · ' + c + ' = ' + H.n(depense))],
          ['Reste.', m(c + ' – ' + H.n(depense) + ' = ' + H.n(reste))],
          ['Entrées : ' + pc + ' % du reste.', m(H.fh(pc, 100) + ' · ' + H.n(reste) + ' = ' + H.n(reste.fois(fr(pc, 100))))],
          ['Reste final.', m(H.n(reste) + ' – ' + H.n(reste.fois(fr(pc, 100))) + ' = ' + H.n(res2))]
        ]),
        verification: 'Vérification : le reste est positif et plus petit que la somme de départ. ✓',
        rubrique: R.pourcentages,
        nombres: [fr(c), g, fr(pc)],
        controle: { expr: '(' + c + '-(' + g.toString() + ')*' + c + ')*(1-' + pc + '/100)' },
        attenduHtml: H.chf(res2)
      });
    }
    var cap = alea.choix([2, 4]);
    var capGo = cap * 1000;
    var pcs = alea.choix([fr(3, 8), fr(1, 4), fr(2, 5), fr(5, 8)]);
    var film = alea.choix([fr(5, 2), fr(3, 2), fr(4, 1), fr(9, 2)]);
    var libre = fr(capGo).fois(fr(1).moins(pcs));
    var n = libre.divise(film);
    var nEntier = fr(Math.floor(n.valeur()));
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Un disque dur de ' + cap + ' To (1 To = 1000 Go) est déjà rempli aux ' + m(H.f(pcs)) + '. Un film occupe ' + m(H.n(film)) + ' Go.</p><p>Combien de films complets peut-on encore enregistrer ?</p>',
      consigne: 'Écris un nombre entier.',
      suffixe: 'films',
      indice: 'Calcule la place libre en Go, puis divise par la taille d\'un film. Garde seulement les films complets.',
      reponse: { type: 'valeur', valeur: nEntier, unite: 'films' },
      pieges: [{ valeur: fr(Math.floor(fr(capGo).fois(pcs).divise(film).valeur())), message: 'Tu as utilisé la place occupée au lieu de la place libre.' }],
      etapes: O.etapes([
        ['Capacité en Go.', m(cap + ' To = ' + H.n(fr(capGo)) + ' Go')],
        ['Place libre.', m('(1 – ' + H.f(pcs) + ') · ' + H.n(fr(capGo)) + ' = ' + H.n(libre) + ' Go')],
        ['Nombre de films.', m(H.n(libre) + ' : ' + H.n(film) + (n.estEntier() ? ' = ' + H.n(n) : ' ≈ ' + H.arrondi(n, 2) + ' ; on garde ' + H.n(nEntier) + ' films complets'))]
      ]),
      verification: 'Vérification : ' + H.n(nEntier) + ' · ' + H.n(film) + ' = ' + H.n(nEntier.fois(film)) + ' Go ⩽ ' + H.n(libre) + ' Go. ✓',
      rubrique: R.mulFractions,
      nombres: [fr(cap), pcs, film],
      controle: { expr: String(Math.floor(fr(capGo).fois(fr(1).moins(pcs)).divise(film).valeur())) },
      attenduHtml: H.n(nEntier) + ' films'
    });
  }

  /* =====================================================================
   * 10e niveau 2 (D4) : écriture périodique, puis calcul avec une fraction
   * ===================================================================== */

  function questionPeriodiquePlusFraction(alea, p) {
    var n, per, f, op, res, essai = 0;
    do {
      n = alea.entier(1, 8);
      per = fr(n, 9);                       // 0,n̄ = n/9
      var b = alea.choix([2, 3, 4, 5, 6]);
      f = fr(A9.premierAvec(alea, b, b - 1), b);
      op = alea.choix(['+', '–']);
      res = op === '+' ? per.plus(f) : per.moins(f);
      essai++;
    } while (res.signe() <= 0 && essai < 100);
    var h = H.n(per) + ' ' + op + ' ' + H.f(f);
    var faux = op === '+' ? fr(n, 10).plus(f) : fr(n, 10).moins(f);
    var corr = A9.corrigerSomme([{ f: per, op: '' }, { f: f, op: op }], O.X.op(O.X.n(per), op, O.X.n(f)));
    var et = [['J\'écris l\'écriture périodique sous forme de fraction. Si x = ' + H.n(per) + ', alors 10x = ' + H.n(per.fois(10)) + ' ; donc 10x – x = ' + n + ', 9x = ' + n + ' et x = ' + H.fh(n, 9) + '.', m(H.n(per) + ' = ' + H.fh(n, 9) + (O.pgcd(n, 9) > 1 ? ' = ' + H.f(per) : ''))]];
    corr.etapes.forEach(function (e) { et.push([e.texte, e.calcul]); });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule et donne le résultat sous forme de fraction :</p><p class="calcul">' + m(h) + '</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong> (le résultat exact, pas une valeur arrondie).',
      indice: 'Commence par écrire ' + M.formaterNombre(per).replace(/̅/g, '') + '… sous forme de fraction (un chiffre qui se répète : ce chiffre sur 9).',
      reponse: { type: 'valeur', valeur: res, forme: 'irreductible' },
      pieges: [{ valeur: faux, message: 'Tu as remplacé ' + M.formaterNombre(per).replace(/̅/g, '') + '… par 0,' + n + ' : ce n\'est pas le même nombre. 0,' + n + ' = ' + n + '/10, alors que l\'écriture périodique vaut ' + M.formaterFraction(per) + '.' }],
      etapes: O.etapes(et),
      verification: A9.verifApprochee(H.arrondi(per, 3) + ' ' + op + ' ' + H.arrondi(f, 3), res),
      rubrique: R.ecrituresDecimales,
      nombres: [per, f],
      controle: { expr: '(' + n + '/9)' + (op === '+' ? '+' : '-') + '(' + f.toString() + ')' },
      signature: op === '+' ? 'per+frac:' + [per.toString(), f.toString()].sort().join('+') : 'per-frac:' + per.toString() + '-' + f.toString(),
      attenduHtml: H.f(res)
    });
  }

  /* =====================================================================
   * 11e niveau 2 (D4) : fractions imbriquées
   * ===================================================================== */

  function questionFractionImbriquee(alea, p) {
    var a, b, c, d, haut, bas, res, opH, opB, essai = 0;
    do {
      a = fractionSimple(alea, 2, true); b = fractionSimple(alea, 2, false);
      c = fractionSimple(alea, 2, false); d = fractionSimple(alea, 2, true);
      opH = alea.choix(['+', '–']); opB = alea.choix(['+', '–']);
      haut = opH === '+' ? a.plus(b) : a.moins(b);
      bas = opB === '+' ? c.plus(d) : c.moins(d);
      essai++;
    } while ((bas.estZero() || haut.estZero() || Number(haut.divise(bas).den) > 60 || haut.divise(bas).abs().compare(20) > 0) && essai < 200);
    res = haut.divise(bas);
    function hp(x) { return x.signe() < 0 ? '(' + H.f(x) + ')' : H.f(x); }
    var hHaut = H.f(a) + ' ' + opH + ' ' + hp(b), hBas = H.f(c) + ' ' + opB + ' ' + hp(d);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(H.fh(hHaut, hBas)) + '</p>',
      consigne: 'Donne le résultat sous forme de <strong>fraction irréductible</strong> (ou d\'un entier).',
      indice: 'La grande barre de fraction est une division : calcule séparément le numérateur et le dénominateur, puis divise.',
      reponse: { type: 'valeur', valeur: res, forme: 'irreductible' },
      pieges: [{ valeur: haut.fois(bas), message: 'Tu as multiplié le numérateur par le dénominateur : la grande barre de fraction est une division.' }],
      etapes: O.etapes([
        ['Je calcule le numérateur.', m(hHaut + ' = ' + H.f(haut))],
        ['Je calcule le dénominateur.', m(hBas + ' = ' + H.f(bas))],
        ['Je divise : diviser par une fraction, c\'est multiplier par son inverse.', m(hp(haut) + ' : ' + hp(bas) + ' = ' + hp(haut) + ' · ' + hp(bas.inverse()) + ' = ' + H.f(res))]
      ]),
      verification: 'Vérification avec des valeurs approchées : ' + H.arrondi(haut, 3) + ' : ' + H.arrondi(bas, 3) + ' ≈ ' + H.arrondi(res, 3) + '. ✓',
      rubrique: R.mulFractions,
      nombres: [a, b, c, d],
      controle: { expr: '((' + a.toString() + ')' + (opH === '+' ? '+' : '-') + '(' + b.toString() + ')):((' + c.toString() + ')' + (opB === '+' ? '+' : '-') + '(' + d.toString() + '))' },
      attenduHtml: H.f(res)
    });
  }

  /* =====================================================================
   * 11e niveau 2 (D4) : intercaler un nombre entre deux réels
   * ===================================================================== */

  function questionIntercalerReels(alea, p) {
    var genre = alea.choix(['racines', 'racineDecimal']);
    var aT, bT, aH, bH, aV, bV;
    if (genre === 'racines') {
      var n;
      do { n = alea.entier(2, 60); } while (Number.isInteger(Math.sqrt(n)) || Number.isInteger(Math.sqrt(n + 1)));
      aT = '√' + n; bT = '√' + (n + 1); aH = '√' + n; bH = '√' + (n + 1);
      aV = Math.sqrt(n); bV = Math.sqrt(n + 1);
    } else {
      var r;
      do { r = alea.entier(2, 99); } while (Number.isInteger(Math.sqrt(r)));
      var s = Math.sqrt(r);
      var d = M.Fraction.depuis(Number((Math.ceil(s * 10) / 10).toFixed(1)));
      aT = '√' + r; aH = '√' + r; aV = s;
      bT = d.toString(); bH = H.n(d); bV = d.valeur();
      if (bV - aV < 0.005) { d = d.plus(fr(1, 10)); bT = d.toString(); bH = H.n(d); bV = d.valeur(); }
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Intercale un nombre décimal entre ' + m(aH) + ' et ' + m(bH) + '.</p>',
      consigne: 'Écris un nombre décimal strictement compris entre les deux (plusieurs réponses sont possibles), sans calculatrice.',
      indice: 'Encadre chaque racine en cherchant des carrés : par exemple 1,4² = 1,96 et 1,5² = 2,25, donc 1,4 &lt; √2 &lt; 1,5.',
      reponse: { type: 'entre', reels: true, minR: aV, maxR: bV, minTexte: aH, maxTexte: bH },
      etapes: O.etapes([
        ['J\'encadre les nombres au centième en comparant des carrés.', m(aH + ' ≈ ' + H.arrondi(M.Fraction.depuis(Number(aV.toFixed(6))), 3) + ' ; ' + bH + ' ≈ ' + H.arrondi(M.Fraction.depuis(Number(bV.toFixed(6))), 3))],
        ['Je choisis un nombre entre les deux, par exemple :', m(H.n(M.Fraction.depuis(Number(((aV + bV) / 2).toFixed(3)))))]
      ]),
      verification: 'Vérification : élève ton nombre au carré ; il doit être compris entre les carrés des deux bornes.',
      rubrique: R.comparer,
      nombres: [],
      controle: { type: 'entreReels', a: aT, b: bT }
    });
  }

  /* =====================================================================
   * Catalogue
   * ===================================================================== */

  function neg10(c, p) { return negatifs10(c, p); }

  // Les objectifs de priorités ont deux opérations dès D1 : une seule opération ne permet pas
  // de travailler les priorités (choix validé par l'enseignante).
  var BORNES_PRIORITES = { operations: [2, 3, 4, 4], etapes: [2, 2, 3, 3] };
  // Un pourcentage s'écrit avec un nombre jusqu'à 100 dès D1 (25 %, 75 %).
  var BORNES_POURCENTS = { nombre: [100, 100, 200, 300] };

  var objectifs = [
    {
      id: 'A10-ecritures', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Écritures d\'un même nombre : décimale, périodique, fraction, pourcentage',
      bornesD: BORNES_POURCENTS,
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionDecVersPourcent(a, p); } },
        { type: 'directe', gen: function (a, p) { return A9.questionFractionVersDec(a, p, { periodique: true }); } },
        { type: 'directe', gen: function (a, p) { return A9.questionFractionPourcent(a, p, { periodique: true }); } },
        { type: 'directe', palierMin: 3, gen: function (a, p) { return questionIntrus(a, p); } },
        { type: 'vraifaux', palierMin: 2, gen: function (a, p) { return vraiFauxPeriodique(a, p); } },
        { type: 'directe', si: function (c, p) { return c.niveau === 2 && p >= 4; }, gen: function (a, p) { return questionPeriodiquePlusFraction(a, p); } }
      ]
    },
    {
      id: 'A10-oppose-inverse', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Opposé, inverse ; ensembles ℕ, ℤ, 𝔻, ℚ, ℝ',
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionOpposeInverse(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxOpposeInverse(a, p); } },
        { type: 'directe', gen: function (a, p, c) { return questionEnsembleR(a, p, c); } },
        { type: 'vraifaux', gen: function (a) { return vraiFauxEnsemblesR(a); } }
      ]
    },
    {
      id: 'A10-diagrammes', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Représenter une fraction ou un pourcentage (diagramme circulaire ou en barre)',
      bornesD: BORNES_POURCENTS,
      modeles: [
        { type: 'visuel', gen: function (a, p) { return questionLireDiagramme(a, p); } },
        { type: 'visuel', gen: function (a, p) { return questionColorierPourcent(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionAngle(a, p); } },
        { type: 'probleme', gen: function (a, p) { return problemeDiagramme(a, p); } }
      ]
    },
    {
      id: 'A10-simplifier', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Simplifier, amplifier, fraction irréductible',
      modeles: [
        { type: 'directe', gen: function (a, p) { return A9.questionSimplifier(a, p); } },
        { type: 'directe', gen: function (a, p) { return A9.questionAmplifier(a, p); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return A9.erreurSimplifier(a, p); } },
        { type: 'vraifaux', palierMin: 2, gen: function (a, p) { return A9.vraiFauxIrreductible(a, p); } }
      ]
    },
    {
      id: 'A10-priorites', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Priorité des opérations avec des nombres rationnels',
      bornesD: BORNES_PRIORITES,
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionPriorites(a, p, c, { relatifs: neg10(c, p), deuxNiveaux: neg10(c, p) && a.suivant() < 0.5 }); } },
        { type: 'directe', gen: function (a, p, c) { return questionPriorites(a, p, c, { style: 'decimal', relatifs: neg10(c, p) }); } },
        { type: 'erreur', gen: function (a, p) { return erreurPriorites(a, p); } }
      ]
    },
    {
      id: 'A10-comparer', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Comparer, ordonner, encadrer et intercaler des nombres rationnels',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return A9.questionComparer(a, p, { relatifs: neg10(c, p) }); } },
        { type: 'vraifaux', gen: function (a, p, c) { return A9.vraiFauxComparer(a, p, { relatifs: neg10(c, p) }); } },
        { type: 'directe', palierMin: 2, gen: function (a, p, c) { return questionOrdonner(a, p, c, { relatifs: neg10(c, p) }); } },
        { type: 'directe', palierMin: 3, gen: function (a, p) { return questionIntercaler(a, p); } },
        { type: 'directe', palierMin: 3, gen: function (a, p) { return questionEncadrer(a, p); } }
      ]
    },
    {
      id: 'A10-addsous', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Additionner et soustraire des fractions',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return A9.questionAddSous(a, p, { relatifs: neg10(c, p), troisTermes: p === 2, denMax: p <= 1 ? 10 : 12 }); } },
        { type: 'directe', gen: function (a, p, c) { return A9.questionAddSous(a, p, { relatifs: neg10(c, p), troisTermes: p === 2, denMax: p <= 1 ? 10 : 12 }); } },
        { type: 'erreur', gen: function (a, p) { return A9.erreurAddition(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return A9.vraiFauxAddition(a, p); } }
      ]
    },
    {
      id: 'A10-muldiv', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Multiplier et diviser des fractions',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionMulDiv(a, p, c, { relatifs: neg10(c, p) }); } },
        { type: 'directe', gen: function (a, p, c) { return questionMulDiv(a, p, c, { relatifs: neg10(c, p) }); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurMulDiv(a, p); } },
        { type: 'vraifaux', palierMin: 2, gen: function (a, p) { return vraiFauxMulDiv(a, p); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemeMulDiv(a, p); } }
      ]
    },
    {
      id: 'A10-reflechi', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Calcul réfléchi avec des nombres rationnels',
      bornesD: BORNES_POURCENTS,
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionCalculReflechi(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionCalculReflechi(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxReflechi(a, p); } }
      ]
    },
    {
      id: 'A10-problemes', module: 'A', annee: 10, niveaux: [1, 2], theme: 'NO 10.3',
      titre: 'Résoudre des problèmes (fractions, pourcentages)',
      bornesD: BORNES_POURCENTS,
      modeles: [
        { type: 'probleme', gen: function (a, p) { return problemeEnergie(a, p); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemeRabais(a, p); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemeMulDiv(a, p); } }
      ]
    },
    {
      id: 'A11-operations', module: 'A', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Les quatre opérations avec des nombres rationnels (fraction irréductible)',
      modeles: [
        // D1 : deux fractions (négatives possibles) ; D2 : produits et quotients ; D3-D4 : trois opérations
        { type: 'directe', gen: function (a, p) { return A9.questionAddSous(a, Math.min(p, 3), { relatifs: true }); } },
        { type: 'directe', palierMin: 2, gen: function (a, p, c) { return questionMulDiv(a, p, c, { relatifs: true }); } },
        { type: 'directe', palierMin: 3, gen: function (a, p, c) { return questionPriorites(a, p, c, { irreductible: true, relatifs: true }); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurPriorites(a, p); } },
        { type: 'vraifaux', palierMin: 2, gen: function (a, p) { return vraiFauxMulDiv(a, p); } },
        { type: 'directe', si: function (c, p) { return c.niveau === 2 && p >= 4; }, gen: function (a, p) { return questionFractionImbriquee(a, p); } }
      ]
    },
    {
      id: 'A11-reels', module: 'A', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Comparer, ordonner et encadrer des nombres réels',
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionComparerReels(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionIrrationnel(a, p); } },
        { type: 'directe', palierMin: 2, gen: function (a, p) { return questionOrdonnerReels(a, p); } },
        { type: 'directe', palierMin: 3, gen: function (a, p) { return questionEncadrerRacine(a, p); } },
        { type: 'directe', si: function (c, p) { return c.niveau === 2 && p >= 4; }, gen: function (a, p) { return questionIntercalerReels(a, p); } }
      ]
    },
    {
      id: 'A11-problemes', module: 'A', annee: 11, niveaux: [1, 2], theme: 'NO 11.1',
      titre: 'Résoudre des problèmes avec des nombres rationnels',
      bornesD: BORNES_POURCENTS,
      modeles: [
        { type: 'probleme', si: function (c, p) { return p <= 1; }, gen: function (a, p) { return problemeEnergie(a, p); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return problemeRabais(a, p); } },
        { type: 'probleme', palierMin: 3, gen: function (a, p) { return problemeRationnels11(a, p); } }
      ]
    }
  ];

  return { objectifs: objectifs, arbrePriorites: arbrePriorites, questionPriorites: questionPriorites };
});
