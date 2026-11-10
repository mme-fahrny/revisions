/*
 * fonctions/js/module-c.js — Module C, 1re partie : fonctions et graphiques (FA 11.3, 11e)
 * ----------------------------------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : « FonctionsModuleC ». Node : require.
 * Objectifs C1 à C6 (la 2e partie, module-c-grandeurs.js, contient C7 à C11).
 *
 * Calibrage (11e) :
 *   difficulté 1 : une lecture ou un calcul ; a entier de – 4 à 4.
 *   difficulté 2 : deux étapes ; coefficients négatifs, x négatifs.
 *   difficulté 3 : trois étapes (pente à partir de deux points, tableau d'une parabole…).
 *   difficulté 4 : fin de module (expression à partir de deux points, situations).
 *   Niveau 1 : coefficients entiers. Niveau 2 en plus : coefficients rationnels (0,5 ; 1,5 ;
 *   2/3…), ax² + bx + c, ax³, √x, a(x – b)² + c (a, b, c entiers), fonction racine carrée.
 *   Les deux écritures f(x) = … et f : x ⟼ … sont utilisées.
 *
 * Champ « controle » : voir module-a.js.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'), require('./module-b.js'));
  else racine.FonctionsModuleC = fabrique(racine.FonctionsOutils, racine.FonctionsModuleB);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O, B) {
  'use strict';

  var val = O.val, tn = O.tn, tnp = O.tnp, tc = O.tc, hm = O.hm, tx = O.tx, ech = O.echapper;
  var R = O.RUBRIQUES, E = O.ERREURS, FICTIF = O.MENTION_FICTIVE;

  /* ---------- petits outils ---------- */
  function lettreChoix(i) { return 'ABCDEF'.charAt(i); }
  function nommer(choix, prefixe) {
    return choix.map(function (ch, i) { ch.h = '<span class="nom-choix">' + prefixe + ' ' + lettreChoix(i) + '</span>' + ch.h; return ch; });
  }
  function image(l, x) { return val(l.a).fois(val(x)).plus(val(l.b)); }
  function src(l) { return O.srcAffine(l.a, l.b); }
  function sig(l) { return 'droite:a=' + tn(l.a).replace(/ /g, '') + ':b=' + tn(l.b).replace(/ /g, ''); }
  function st(x) { return val(x).toString(); }
  /** Formule JavaScript d'un nombre (pour le recalcul indépendant des tests). */
  function js(x) { return '(' + st(x) + ')'; }
  function fraction(haut, bas) { return '<span class="frac" role="math" aria-label="' + haut + ' sur ' + bas + '"><span>' + haut + '</span><span>' + bas + '</span></span>'; }
  /** ax + b en HTML : coefficient décimal écrit 0,5x ; sinon fraction empilée devant x. */
  function corpsAffine(l) {
    var a = val(l.a), b = val(l.b);
    if (a.estDecimale()) return ech(tx(src(l)));
    var h = (a.signe() < 0 ? '– ' : '') + O.Maths.html.fraction(a.abs()) + 'x';
    if (!b.estZero()) h += (b.signe() < 0 ? ' – ' : ' + ') + tn(b.abs());
    return h;
  }
  /** Écriture d'une fonction : f(x) = … ou f : x ⟼ … (corps en HTML). */
  function ecrire(corps, nom, fleche) { nom = nom || 'f'; return '<span class="maths">' + (fleche ? nom + ' : x ⟼ ' : nom + '(x) = ') + corps + '</span>'; }
  function hE(l, nom, fleche) { return ecrire(corpsAffine(l), nom, fleche); }
  function hS(source, nom, fleche) { return ecrire(ech(tx(source)), nom, fleche); }
  function fleche(alea) { return alea.suivant() < 0.4; }
  function terme(k, lettre, premier) {
    k = val(k);
    if (k.estZero()) return '';
    var abs = k.abs();
    var corps = lettre ? ((abs.egal(1) ? '' : O.snPositif(abs)) + lettre) : O.snPositif(abs);
    return (k.signe() < 0 ? '-' : premier ? '' : '+') + corps;
  }
  /** Source de ax² + bx + c (écriture de l'aide-mémoire : – 0,5x² – 2). */
  function srcQuad(a, b, c) {
    var s = terme(a, 'x^2', true);
    s += terme(b, 'x', s === '');
    s += terme(c, '', s === '');
    return s || '0';
  }
  /** Source de a(x – h)² + k. */
  function srcCanonique(a, h, k) {
    var s = (a === 1 ? '' : a === -1 ? '-' : String(a)) + '(x' + (h > 0 ? '-' + h : '+' + (-h)) + ')^2';
    return s + terme(k, '', false);
  }
  function repere(courbes, options) {
    options = options || {};
    return { xmin: options.xmin !== undefined ? options.xmin : -6, xmax: options.xmax !== undefined ? options.xmax : 6,
      ymin: options.ymin !== undefined ? options.ymin : -8, ymax: options.ymax !== undefined ? options.ymax : 8,
      gx: 1, gy: 1, lx: 2, ly: 2, courbes: courbes, points: options.points, description: options.description || 'Graphique dans un repère' };
  }
  /** Pente : entière au niveau 1 ; au niveau 2, une fois sur deux rationnelle. */
  var RATIONNELLES = ['1/2', '-1/2', '3/2', '-3/2', '5/2', '1/4', '3/4', '-3/4', '1/3', '-1/3', '2/3', '-2/3', '4/3'];
  function tirerPente(alea, d, niveau, options) {
    options = options || {};
    if (niveau === 2 && d >= 2 && (options.rationnelle || alea.suivant() < 0.6)) return val(alea.choix(RATIONNELLES));
    var max = d <= 1 ? 4 : options.max || 5;
    return val(alea.entierNonNul(-max, max));
  }
  /** Dénominateur d'une pente (1 pour un entier). */
  function denominateur(a) { for (var q = 1; q <= 4; q++) if (val(a).fois(q).estEntier()) return q; return 1; }
  function signeTexte(x) { return val(x).signe() > 0 ? 'positif' : 'négatif'; }

  /* =====================================================================
   * C1 : reconnaître et nommer une fonction (expression ou graphique)
   * ===================================================================== */
  var NOMS = {
    affine: 'fonction affine', quadratique: 'fonction quadratique', cubique: 'fonction cubique',
    homographique: 'fonction homographique', exponentielle: 'fonction exponentielle', racine: 'fonction racine carrée'
  };
  var RUB = { affine: 'affine', quadratique: 'quadratique', cubique: 'cubique', homographique: 'homographique', exponentielle: 'exponentielle', racine: 'racineCarree' };
  var POURQUOI_GRAPHIQUE = {
    affine: 'Le graphique est une droite : c\'est une fonction affine.',
    quadratique: 'Le graphique est une parabole (une courbe en forme de U, avec un axe de symétrie) : c\'est une fonction quadratique.',
    cubique: 'La courbe passe par l\'origine, elle va d\'un coin du repère au coin opposé en s\'aplatissant près de l\'origine : c\'est une fonction cubique (avec x³).',
    homographique: 'Le graphique est une hyperbole : deux branches séparées, qui s\'approchent des axes sans les toucher. C\'est une fonction homographique.',
    exponentielle: 'La courbe reste au-dessus de l\'axe horizontal ; presque plate d\'un côté, elle monte de plus en plus vite de l\'autre : c\'est une fonction exponentielle.',
    racine: 'La courbe part de l\'origine, n\'existe que pour x ≥ 0 et monte de moins en moins vite : c\'est la fonction racine carrée.'
  };
  var POURQUOI_EXPRESSION = {
    affine: 'L\'expression est de la forme ax + b : c\'est une fonction affine (son graphique est une droite).',
    quadratique: 'La plus grande puissance de x est x² : c\'est une fonction quadratique (son graphique est une parabole).',
    cubique: 'L\'expression est de la forme ax³ : c\'est une fonction cubique.',
    homographique: 'x est au dénominateur (un nombre divisé par x) : c\'est une fonction homographique (son graphique est une hyperbole).',
    exponentielle: 'x est en exposant : c\'est une fonction exponentielle.',
    racine: 'On prend la racine carrée de x : c\'est la fonction racine carrée.'
  };
  function typesPour(niveau) {
    var t = ['affine', 'quadratique', 'cubique', 'homographique', 'exponentielle'];
    if (niveau === 2) t.push('racine');
    return t;
  }
  /** Une fonction de la famille demandée : { type, corps (HTML), courbe, coefs }. */
  function famille(alea, type, complet) {
    var a, b, c;
    switch (type) {
      case 'affine':
        a = alea.entierNonNul(-3, 3); b = alea.entierNonNul(-4, 4);
        return { type: type, corps: ech(tx(O.srcAffine(a, b))), courbe: { src: O.srcAffine(a, b) }, coefs: [a, b] };
      case 'quadratique':
        a = alea.choix([1, -1, 2, -2]); c = alea.entier(-4, 4); b = complet ? alea.choix([-4, -2, 2, 4]) : 0;
        return { type: type, corps: ech(tx(srcQuad(a, b, c))), courbe: { src: srcQuad(a, b, c) }, coefs: [a, b, c] };
      case 'cubique':
        a = alea.choix([1, -1, 2, -2]);
        return { type: type, corps: ech(tx(terme(a, 'x^3', true))), courbe: { src: terme(a, 'x^3', true) }, coefs: [a] };
      case 'homographique':
        a = alea.choix([1, 2, 3, 4, -2, -3, -4]);
        return { type: type, corps: (a < 0 ? '– ' : '') + fraction(Math.abs(a), 'x'), courbe: { f: function (x) { return a / x; } }, coefs: [a] };
      case 'exponentielle':
        return { type: type, corps: '2<sup>x</sup>', courbe: { f: function (x) { return Math.pow(2, x); } }, coefs: [2] };
    }
    return { type: 'racine', corps: '√x', courbe: { f: function (x) { return x < 0 ? NaN : Math.sqrt(x); } }, coefs: [1] };
  }
  function choixFamilles(alea, juste, niveau, pourquoi) {
    var autres = alea.melanger(typesPour(niveau).filter(function (t) { return t !== juste; })).slice(0, 3);
    return O.melanger(alea, [juste].concat(autres).map(function (t) {
      return { h: NOMS[t], juste: t === juste, param: t, message: t === juste ? '' : pourquoi[juste] };
    }));
  }

  /** D1 — nommer la fonction représentée par un graphique. */
  function genNomCourbe(alea, d, ctx) {
    var type = alea.choix(typesPour(ctx.niveau));
    var f = famille(alea, type);
    var g = repere([f.courbe], { description: 'Courbe d\'une fonction dans un repère' });
    return {
      type: 'choix',
      enonce: '<p>Voici la représentation graphique d\'une fonction f.</p>' + O.graphiqueHtml(g) + '<p>De quelle fonction s\'agit-il ?</p>',
      indice: 'Regarde la forme : une droite ? une parabole ? deux branches séparées ? une courbe qui reste au-dessus de l\'axe horizontal ?',
      reponse: { type: 'choix' }, choix: choixFamilles(alea, type, ctx.niveau, POURQUOI_GRAPHIQUE),
      etapes: [{ texte: POURQUOI_GRAPHIQUE[type] }],
      verification: '',
      rubrique: R[RUB[type]],
      controle: { ops: 1, xs: [], ys: [], coefs: f.coefs, calc: { genre: 'choix-cle', attendu: type } }
    };
  }

  /** D2 — nommer une fonction à partir de son expression (les deux écritures). */
  function genNomExpression11(alea, d, ctx) {
    var type = alea.choix(typesPour(ctx.niveau));
    var f = famille(alea, type, alea.suivant() < 0.5);
    return {
      type: 'choix',
      enonce: '<p>Quelle est la nature de la fonction suivante ?</p><p class="calcul">' + ecrire(f.corps, 'f', fleche(alea)) + '</p>',
      indice: 'Regarde où se trouve x : seul (ax + b), au carré, au cube, au dénominateur, en exposant…',
      reponse: { type: 'choix' }, choix: choixFamilles(alea, type, ctx.niveau, POURQUOI_EXPRESSION),
      etapes: [{ texte: POURQUOI_EXPRESSION[type] }],
      verification: '',
      rubrique: R[RUB[type]],
      controle: { ops: 1, xs: [], ys: [], coefs: f.coefs, calc: { genre: 'choix-cle', attendu: type } }
    };
  }

  /** D3 — vrai ou faux : une propriété du graphique d'une fonction. */
  function genVraiFauxNature(alea, d, ctx) {
    var a = alea.entier(2, 4), c = alea.entier(1, 5), cas = alea.choix(['paraboleDroite', 'hyperboleAxe', 'cubiqueOrigine', 'expoOrigine', 'paraboleOrigine']);
    var def, enonce, etapes, rub;
    if (cas === 'paraboleDroite') {
      var vraieDroite = alea.suivant() < 0.4;
      var corps = vraieDroite ? ech(tx(O.srcAffine(-a, c))) : ech(tx(srcQuad(a, 0, -c)));
      enonce = '« La représentation graphique de ' + ecrire(corps) + ' est une droite. »';
      def = { vrai: vraieDroite,
        justeVrai: 'l\'expression est de la forme ax + b : c\'est une fonction affine.',
        justeFaux: 'l\'expression contient x² : c\'est une fonction quadratique, son graphique est une parabole.',
        autresVrai: ['toutes les fonctions ont une droite pour graphique.', 'l\'expression contient un seul x.'],
        autresFaux: ['le coefficient de x est négatif.', 'une droite ne peut pas avoir d\'ordonnée à l\'origine négative.'],
        messageFaux: 'Seules les fonctions affines (ax + b) ont une droite pour graphique.' };
      etapes = [{ texte: vraieDroite ? POURQUOI_EXPRESSION.affine : POURQUOI_EXPRESSION.quadratique }];
      rub = vraieDroite ? R.affine : R.quadratique;
    } else if (cas === 'hyperboleAxe') {
      enonce = '« Le graphique de ' + ecrire(fraction(a, 'x')) + ' coupe l\'axe vertical (axe des y). »';
      def = { vrai: false,
        justeFaux: 'sur l\'axe vertical, x = 0, et on ne peut pas diviser par 0 : f(0) n\'existe pas.',
        autresFaux: ['le graphique est une parabole.', 'une courbe ne coupe jamais un axe.'],
        autresVrai: [hm('f(0) = ' + a) + '.', 'tous les graphiques coupent l\'axe vertical.'],
        messageFaux: 'Pour x = 0, il faudrait calculer ' + a + ' : 0, ce qui est impossible. L\'hyperbole a deux branches séparées.' };
      etapes = [{ texte: 'Un point de l\'axe vertical a pour abscisse x = 0.' }, { texte: a + ' : 0 est impossible : la fonction n\'a pas d\'image pour x = 0. Le graphique (une hyperbole) ne touche pas l\'axe vertical.' }];
      rub = R.homographique;
    } else if (cas === 'cubiqueOrigine') {
      enonce = '« Le graphique de ' + hS(terme(a, 'x^3', true)) + ' passe par l\'origine (0 ; 0). »';
      def = { vrai: true,
        justeVrai: hm('f(0) = ' + a + ' · 0³ = 0') + '.',
        autresVrai: ['tous les graphiques passent par l\'origine.', 'le coefficient ' + a + ' est positif.'],
        autresFaux: [hm('f(0) = ' + a) + '.', 'seules les droites peuvent passer par l\'origine.'],
        messageFaux: 'Calcule f(0) : 0³ = 0, donc f(0) = 0.' };
      etapes = [{ texte: 'On calcule l\'image de 0.', calcul: hm('f(0) = ' + a + ' · 0³ = 0') }, { texte: 'Le point (0 ; 0) est sur le graphique.' }];
      rub = R.cubique;
    } else if (cas === 'expoOrigine') {
      enonce = '« Le graphique de ' + ecrire('2<sup>x</sup>') + ' passe par l\'origine (0 ; 0). »';
      def = { vrai: false,
        justeFaux: '2⁰ = 1 : le graphique passe par (0 ; 1).',
        autresFaux: ['le graphique est une droite qui passe par (0 ; 2).', 'une fonction exponentielle n\'a pas de graphique.'],
        autresVrai: ['2⁰ = 0.', '2 · 0 = 0.'],
        messageFaux: 'Attention : 2⁰ = 1 (et non 0). Ne confonds pas 2 exposant x avec 2 · x.' };
      etapes = [{ texte: 'On calcule l\'image de 0.', calcul: hm('f(0) = 2⁰ = 1') }, { texte: 'Le graphique passe par (0 ; 1), pas par l\'origine.' }];
      rub = R.exponentielle;
    } else {
      var avecC = alea.suivant() < 0.6;
      enonce = '« Le graphique de ' + hS(srcQuad(-a, 0, avecC ? c : 0)) + ' passe par l\'origine (0 ; 0). »';
      def = { vrai: !avecC,
        justeVrai: hm('f(0) = – ' + a + ' · 0² = 0') + '.',
        justeFaux: hm('f(0) = – ' + a + ' · 0² + ' + c + ' = ' + c) + ' : le graphique passe par ' + hm(tc(0, c)) + '.',
        autresVrai: ['toutes les paraboles passent par l\'origine.', 'le coefficient de x² est négatif.'],
        autresFaux: ['une parabole ne passe jamais par l\'origine.', 'le coefficient de x² est négatif.'],
        messageFaux: 'Calcule f(0) : c\'est l\'ordonnée du point du graphique situé sur l\'axe vertical.' };
      etapes = [{ texte: 'On calcule l\'image de 0.', calcul: hm('f(0) = ' + (avecC ? c : 0)) }, { texte: avecC ? 'f(0) ≠ 0 : le graphique ne passe pas par l\'origine.' : 'f(0) = 0 : le graphique passe par l\'origine.' }];
      rub = R.quadratique;
    }
    return {
      type: 'vraifaux',
      enonce: '<p>' + enonce + ' Vrai ou faux ?</p>',
      indice: 'Identifie d\'abord la nature de la fonction, puis calcule f(0) si on parle d\'un axe ou de l\'origine.',
      reponse: { type: 'choix' }, choix: O.optionsVraiFaux(alea, def),
      etapes: etapes,
      verification: '',
      rubrique: rub,
      controle: { ops: 2, xs: [], ys: [], coefs: [a, c], calc: { genre: 'choix' } }
    };
  }

  /** D4 — repère l'erreur : un classement de fonctions écrites autrement. */
  function genErreurNature(alea, d, ctx) {
    var nom = alea.choix(O.PRENOMS);
    var k = alea.entier(2, 5), m = alea.entier(1, 6);
    var catalogue = [
      { h: hm('f(x) = x · x · x'), type: 'cubique', pourquoi: 'x · x · x = x³' },
      { h: hm('g(x) = ' + k + ' : x'), type: 'homographique', pourquoi: k + ' : x, c\'est ' + k + ' divisé par x' },
      { h: hm('h(x) = x(x + ' + m + ')'), type: 'quadratique', pourquoi: 'en développant : x² + ' + m + 'x' },
      { h: hm('k(x) = ' + k + '(x – ' + m + ')'), type: 'affine', pourquoi: 'en développant : ' + k + 'x – ' + (k * m) },
      { h: ecrire('2<sup>x</sup> + ' + m, 'm'), type: 'exponentielle', pourquoi: 'x est en exposant' },
      { h: hm('p(x) = ' + m + ' + ' + k + 'x²'), type: 'quadratique', pourquoi: 'c\'est ' + k + 'x² + ' + m },
      { h: hm('q(x) = x : ' + k), type: 'affine', pourquoi: 'x : ' + k + ' = ' + tn(val(1).divise(k)) + ' · x, de la forme ax (affine linéaire)' }
    ];
    var trois = alea.melanger(catalogue).slice(0, 3);
    var toutJuste = alea.suivant() < 0.2;
    var fausse = toutJuste ? -1 : alea.entier(0, 2);
    var types = ['affine', 'quadratique', 'cubique', 'homographique', 'exponentielle'];
    var affirm = trois.map(function (f, i) {
      return { f: f, dit: i === fausse ? alea.choix(types.filter(function (t) { return t !== f.type; })) : f.type };
    });
    var choix = affirm.map(function (af, i) {
      return { h: af.f.h + ' : « ' + NOMS[af.dit] + ' »', juste: i === fausse, message: i === fausse ? '' : 'Ce classement est juste : ' + af.f.pourquoi + '.' };
    });
    choix.push({ h: 'Les trois classements sont justes.', juste: toutJuste, message: toutJuste ? '' : 'Un classement est faux : récris chaque expression sous sa forme la plus simple.' });
    return {
      type: 'erreur',
      enonce: '<p>' + nom + ' classe ces fonctions.</p><p>Quel classement est faux ? (Il se peut qu\'ils soient tous justes.)</p>',
      indice: 'Récris chaque expression sous sa forme la plus simple, puis regarde où se trouve x : seul, au carré, au cube, au dénominateur, en exposant.',
      reponse: { type: 'choix' }, choix: choix,
      etapes: affirm.map(function (af) { return { texte: af.f.h + ' : ' + af.f.pourquoi + ' → ' + NOMS[af.f.type] + (af.dit === af.f.type ? ' (juste).' : ' (' + nom + ' a écrit « ' + NOMS[af.dit] + ' »).') }; }),
      verification: '',
      rubrique: R.fonction,
      controle: { ops: 4, xs: [], ys: [], coefs: [k, m], calc: { genre: 'choix' } }
    };
  }

  /* =====================================================================
   * C2 : expression, tableau de valeurs et graphique (b, ax, ax + b, ax² ; N2 : ax² + bx + c, ax³, √x)
   * ===================================================================== */

  /** D1 — image d'un nombre par f : x ⟼ ax ou par une fonction affine constante. */
  function genImage11(alea, d, ctx) {
    var constante = alea.suivant() < 0.3;
    var a = constante ? 0 : alea.entierNonNul(-4, 4), b = constante ? alea.entierNonNul(-9, 9) : 0;
    var x = alea.entierNonNul(-6, 6), l = { a: val(a), b: val(b) }, y = image(l, x), fl = alea.suivant() < 0.6;
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hE(l, 'f', fl) + '. Calcule ' + hm('f(' + tn(x) + ')') + '.</p>',
      indice: constante ? 'Regarde bien l\'expression : contient-elle x ?' : 'Remplace x par ' + tn(x) + (x < 0 ? ', entre parenthèses' : '') + '.',
      reponse: { type: 'nombre', valeur: y },
      pieges: constante ? [{ valeur: val(b).fois(x), message: 'Il n\'y a pas de x dans l\'expression : la fonction est affine constante, toutes les images valent ' + tn(b) + '.' }, { valeur: x, message: E.variableImage }]
        : [{ valeur: y.oppose(), message: 'Attention aux signes : ' + hm(tn(a) + ' · ' + tnp(x) + ' = ' + tn(y)) + '.' }, { valeur: val(a).plus(x), message: tx(src(l)) + ' signifie ' + tn(a) + ' · x : il faut multiplier.' }],
      etapes: [constante ? { texte: 'L\'expression ne contient pas x : quelle que soit la valeur de x, l\'image est ' + tn(b) + ' (fonction affine constante).', calcul: hm('f(' + tn(x) + ') = ' + tn(b)) }
        : { texte: 'On remplace x par ' + tn(x) + '.', calcul: hm('f(' + tn(x) + ') = ' + tn(a) + ' · ' + tnp(x) + ' = ' + tn(y)) }],
      verification: 'Le point ' + hm(tc(x, y)) + ' appartient au graphique de f.',
      rubrique: constante ? R.constante : R.lineaire,
      controle: { ops: 1, xs: [x], ys: [st(y)], coefs: [a, b], calc: { genre: 'valeur', a: a, x: x, b: b } }
    };
  }

  /** D2 — tableau de valeurs de f(x) = ax² (a négatif possible ; N2 : a = 0,5 ou 1,5). */
  function genTableauAx2(alea, d, ctx) {
    var a = val(ctx.niveau === 2 && alea.suivant() < 0.5 ? alea.choix(['0.5', '-0.5', '1.5']) : alea.choix([-3, -2, -1, 2, 3]));
    var xs = [alea.entier(-4, -1), alea.entier(1, 2), alea.entier(3, 4)];
    if (!a.estEntier()) xs = [alea.choix([-4, -2]), 2, alea.choix([4, 6])];
    var ys = xs.map(function (x) { return a.fois(x * x); });
    var source = terme(a, 'x^2', true);
    return {
      type: 'tableau',
      enonce: '<p>Complète le tableau de valeurs de ' + hS(source, 'f', fleche(alea)) + '.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ['A', 'B', 'C'] }]),
      consigne: 'Écris A ; B ; C.',
      indice: 'Calcule d\'abord x² (le carré d\'un nombre négatif est positif), puis multiplie par ' + tn(a) + '.',
      reponse: { type: 'liste', valeurs: ys, noms: ['A', 'B', 'C'] },
      pieges: [
        { liste: xs.map(function (x) { return a.fois(x).fois(a.fois(x)); }), message: 'Le carré ne porte que sur x : ' + tx(source) + ' signifie ' + tn(a) + ' · (x · x), pas (' + tn(a) + ' · x)².' },
        { liste: xs.map(function (x) { return a.fois(x * x).fois(x < 0 ? -1 : 1); }), message: 'Le carré d\'un nombre négatif est positif : ' + hm('(' + tn(xs[0]) + ')² = ' + tn(xs[0] * xs[0])) + '.' },
        { liste: xs.map(function (x) { return a.fois(2 * x); }), message: 'x² signifie x · x, pas 2 · x.' }
      ],
      etapes: [
        { texte: 'On calcule les carrés.', calcul: hm(xs.map(function (x) { return tnp(x) + '² = ' + tn(x * x); }).join(' ; ')) },
        { texte: 'On multiplie par ' + tn(a) + '.', calcul: hm(xs.map(function (x, i) { return 'f(' + tn(x) + ') = ' + tn(ys[i]); }).join(' ; ')) }
      ],
      verification: 'Contrôle : toutes les images ont le même signe (' + signeTexte(a) + ', comme a), car x² n\'est jamais négatif.',
      rubrique: R.quadratique,
      controle: { ops: 2, xs: xs, ys: ys.map(st), coefs: [st(a)], calc: { genre: 'liste-f', formules: xs.map(function (x) { return js(a) + '*' + x + '*' + x; }) } }
    };
  }

  /** D2 — de l'expression au graphique : b, ax ou ax + b (coefficients négatifs). */
  function genExprVersGraph11(alea, d, ctx) {
    var forme = alea.choix(['b', 'ax', 'ax+b']), l, autres;
    if (forme === 'b') {
      var b0 = alea.entierNonNul(-5, 5);
      l = { a: val(0), b: val(b0) };
      autres = [{ l: { a: val(b0 > 0 ? 1 : -1), b: val(0) }, message: 'Ce graphique monte ou descend : f(x) changerait avec x. Ici f(x) vaut toujours ' + tn(b0) + ' : droite horizontale.' },
        { l: { a: val(0), b: val(-b0) }, message: 'Attention au signe : la droite horizontale doit passer par ' + hm(tc(0, b0)) + '.' }];
    } else if (forme === 'ax') {
      var a0 = alea.choix([-3, -2, 2, 3]);
      l = { a: val(a0), b: val(0) };
      autres = [{ l: { a: val(-a0), b: val(0) }, message: E.penteSigne }, { l: { a: val(0), b: val(a0) }, message: 'Ce graphique est celui d\'une fonction affine constante. ' + tx(src(l)) + ' est affine linéaire : la droite passe par l\'origine.' }];
    } else {
      do { l = { a: tirerPente(alea, 2, ctx.niveau, { max: 3 }), b: val(alea.entierNonNul(-4, 4)) }; } while (l.a.abs().egal(l.b.abs()) || O.estReference([sig(l)]));
      autres = [{ l: { a: l.a.oppose(), b: l.b }, message: E.penteSigne }, { l: { a: l.a, b: l.b.oppose() }, message: 'Attention au signe de b : le graphique doit couper l\'axe vertical en ' + hm(tc(0, l.b)) + '.' }];
    }
    var choix = [{ h: O.graphiqueHtml(repere([{ src: src(l) }])), juste: true, param: [st(l.a), st(l.b)] }].concat(autres.map(function (o) {
      return { h: O.graphiqueHtml(repere([{ src: src(o.l) }])), juste: false, param: [st(o.l.a), st(o.l.b)], message: o.message };
    }));
    var q = denominateur(l.a);
    return {
      type: 'relier',
      enonce: '<p>Quel graphique représente la fonction ' + hE(l, 'f', fleche(alea)) + ' ?</p>',
      indice: forme === 'b' ? 'L\'expression ne contient pas x : que vaut f(x) pour n\'importe quel x ?' : 'Où la droite coupe-t-elle l\'axe vertical ? Monte-t-elle ou descend-elle ?',
      reponse: { type: 'choix' }, choix: nommer(O.melanger(alea, choix), 'Graphique'), choixGraphiques: true,
      etapes: forme === 'b' ? [{ texte: 'f(x) vaut ' + tn(l.b) + ' pour toute valeur de x : fonction affine constante.' }, { texte: 'Son graphique est la droite horizontale qui passe par ' + hm(tc(0, l.b)) + '.' }]
        : [{ texte: 'L\'ordonnée à l\'origine est b = ' + tn(l.b) + ' : la droite passe par ' + hm(tc(0, l.b)) + '.' },
          { texte: 'La pente est a = ' + tn(l.a) + ' : la droite ' + (l.a.signe() > 0 ? 'monte' : 'descend') + '. Un deuxième point : ' + hm('f(' + q + ') = ' + tn(image(l, q))) + ', donc ' + hm(tc(q, image(l, q))) + '.' }],
      verification: '',
      rubrique: forme === 'b' ? R.constante : forme === 'ax' ? R.lineaire : R.construireAffine,
      signatures: [sig(l)],
      controle: { ops: 2, xs: [0, q], ys: [st(l.b), st(image(l, q))], coefs: [st(l.a), st(l.b)], grad: [1, 1], calc: { genre: 'choix-param', contexte: { a: st(l.a), b: st(l.b) } } }
    };
  }

  /** D3 — tableau de valeurs : ax² + c (N1) ; ax² + bx + c, ax³ ou √x (N2). */
  function genTableauPoly(alea, d, ctx) {
    var forme = ctx.niveau === 2 ? alea.choix(['quad', 'cube', 'racine']) : 'carre';
    var xs, ys, corps, formules, etapes, pieges = [], indice, rub = R.quadratique, coefs;
    if (forme === 'racine') {
      xs = alea.melanger([0, 1, 4, 9, 16, 25, 36]).slice(0, 3).sort(function (p, q) { return p - q; });
      ys = xs.map(function (x) { return val(Math.round(Math.sqrt(x))); });
      corps = '√x'; formules = xs.map(function (x) { return 'Math.sqrt(' + x + ')'; }); coefs = [1];
      indice = '√x est le nombre positif dont le carré vaut x.';
      pieges.push({ liste: xs.map(function (x) { return val(x).divise(2); }), message: 'La racine carrée n\'est pas la moitié : √' + xs[2] + ' = ' + tn(ys[2]) + ', car ' + tn(ys[2]) + '² = ' + xs[2] + '.' });
      pieges.push({ liste: xs.map(function (x) { return x * x; }), message: 'Tu as calculé x² : la racine carrée est l\'opération inverse.' });
      etapes = [{ texte: 'Pour chaque x, on cherche le nombre positif dont le carré vaut x.', calcul: hm(xs.map(function (x, i) { return '√' + x + ' = ' + tn(ys[i]) + ', car ' + tn(ys[i]) + '² = ' + x; }).join(' ; ')) }];
      rub = R.racineCarree;
    } else if (forme === 'cube') {
      var a3 = alea.choix([1, -1, 2, -2]);
      xs = [alea.entier(-3, -1), alea.entier(1, 2), 3];
      ys = xs.map(function (x) { return val(a3 * x * x * x); });
      corps = ech(tx(terme(a3, 'x^3', true))); formules = xs.map(function (x) { return a3 + '*Math.pow(' + x + ',3)'; }); coefs = [a3];
      indice = 'x³ = x · x · x. Le cube d\'un nombre négatif est négatif.';
      pieges.push({ liste: xs.map(function (x) { return val(a3 * Math.abs(x * x * x)); }), message: 'Le cube d\'un nombre négatif est négatif : ' + hm('(' + tn(xs[0]) + ')³ = ' + tn(xs[0] * xs[0] * xs[0])) + '.' });
      pieges.push({ liste: xs.map(function (x) { return val(a3 * 3 * x); }), message: 'x³ signifie x · x · x, pas 3 · x.' });
      etapes = [{ texte: 'On calcule les cubes.', calcul: hm(xs.map(function (x) { return tnp(x) + '³ = ' + tn(x * x * x); }).join(' ; ')) }];
      if (a3 !== 1) etapes.push({ texte: 'On multiplie par ' + tn(a3) + '.', calcul: hm(xs.map(function (x, i) { return 'f(' + tn(x) + ') = ' + tn(ys[i]); }).join(' ; ')) });
      rub = R.cubique;
    } else {
      var a = alea.choix(forme === 'quad' ? [1, -1, 2] : [1, -1, 2, -2, 3]), b = forme === 'quad' ? alea.entierNonNul(-4, 4) : 0, c = alea.entierNonNul(-6, 6);
      xs = [alea.entier(-3, -1), alea.entier(0, 1), alea.entier(2, 4)];
      ys = xs.map(function (x) { return val(a * x * x + b * x + c); });
      corps = ech(tx(srcQuad(a, b, c))); coefs = [a, b, c];
      formules = xs.map(function (x) { return a + '*' + x + '*' + x + '+' + b + '*' + x + '+' + c; });
      indice = 'Remplace x par chaque valeur, entre parenthèses si elle est négative. Calcule d\'abord le carré.';
      pieges.push({ liste: xs.map(function (x) { return val(a * x * x * (x < 0 ? -1 : 1) + b * x + c); }), message: 'Le carré d\'un nombre négatif est positif : ' + hm('(' + tn(xs[0]) + ')² = ' + tn(xs[0] * xs[0])) + '.' });
      pieges.push({ liste: xs.map(function (x) { return val(a * 2 * x + b * x + c); }), message: 'x² signifie x · x, pas 2 · x.' });
      etapes = [
        { texte: 'On remplace x par chaque valeur.', calcul: hm(xs.map(function (x) { return 'f(' + tn(x) + ') = ' + (a === 1 ? '' : a === -1 ? '– ' : tn(a) + ' · ') + tnp(x) + '²' + (b ? (b < 0 ? ' – ' : ' + ') + Math.abs(b) + ' · ' + tnp(x) : '') + (c < 0 ? ' – ' : ' + ') + Math.abs(c); }).join(' ; ')) },
        { texte: 'On calcule les carrés' + (b ? ' et les produits' : '') + '.', calcul: hm(xs.map(function (x) { return tn(a * x * x) + (b ? (b * x < 0 ? ' – ' : ' + ') + Math.abs(b * x) : '') + (c < 0 ? ' – ' : ' + ') + Math.abs(c); }).join(' ; ')) },
        { texte: 'Résultats.', calcul: hm(xs.map(function (x, i) { return 'f(' + tn(x) + ') = ' + tn(ys[i]); }).join(' ; ')) }
      ];
    }
    return {
      type: 'tableau',
      enonce: '<p>Complète le tableau de valeurs de ' + ecrire(corps, 'f', fleche(alea)) + '.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ['A', 'B', 'C'] }]),
      consigne: 'Écris A ; B ; C.',
      indice: indice,
      reponse: { type: 'liste', valeurs: ys, noms: ['A', 'B', 'C'] },
      pieges: pieges,
      etapes: etapes,
      verification: 'Ces trois points appartiennent au graphique de f : ' + hm(xs.map(function (x, i) { return tc(x, ys[i]); }).join(', ')) + '.',
      rubrique: rub,
      controle: { ops: Math.min(3, etapes.length), xs: xs, ys: ys.map(st), coefs: coefs, calc: { genre: 'liste-f', formules: formules } }
    };
  }

  /** D4 — vrai ou faux : un point appartient-il au graphique ? (ax² + c ; N2 : ax² + bx + c, ax³). */
  function genPointSurCourbe(alea, d, ctx) {
    var forme = ctx.niveau === 2 ? alea.choix(['quad', 'cube']) : 'carre';
    var a = alea.choix([1, -1, 2, -2]), b = forme === 'quad' ? alea.entierNonNul(-3, 3) : 0, c = forme === 'cube' ? 0 : alea.entierNonNul(-5, 5);
    var x = alea.choix([-3, -2, 2, 3]);
    var y = forme === 'cube' ? a * x * x * x : a * x * x + b * x + c;
    var vrai = alea.suivant() < 0.5;
    var faux = forme === 'cube' ? a * Math.abs(x * x * x) * (x < 0 ? 1 : -1) : a * x * x * (x < 0 ? -1 : 1) + b * x + c;
    if (x > 0 || faux === y) faux = y + alea.choix([-2, 2, a * x]);
    if (faux === y) faux = y + 1;
    var py = vrai ? y : faux;
    var source = forme === 'cube' ? terme(a, 'x^3', true) : srcQuad(a, b, c);
    var calcul = forme === 'cube' ? 'f(' + tn(x) + ') = ' + (a === 1 ? '' : a === -1 ? '– ' : tn(a) + ' · ') + tnp(x) + '³ = ' + tn(y)
      : 'f(' + tn(x) + ') = ' + (a === 1 ? '' : a === -1 ? '– ' : tn(a) + ' · ') + tnp(x) + '²' + (b ? (b < 0 ? ' – ' : ' + ') + Math.abs(b) + ' · ' + tnp(x) : '') + (c < 0 ? ' – ' : ' + ') + Math.abs(c) + ' = ' + tn(y);
    return {
      type: 'vraifaux',
      enonce: '<p>« Le point ' + hm(tc(x, py)) + ' appartient au graphique de ' + hS(source, 'f', fleche(alea)) + '. » Vrai ou faux ?</p>',
      indice: 'Calcule l\'image de ' + tn(x) + ' et compare-la à l\'ordonnée du point.',
      reponse: { type: 'choix' }, choix: O.optionsVraiFaux(alea, {
        vrai: vrai,
        justeVrai: hm('f(' + tn(x) + ') = ' + tn(y)) + ', l\'ordonnée du point.',
        justeFaux: hm('f(' + tn(x) + ') = ' + tn(y)) + ', et non ' + tn(py) + '.',
        autresVrai: ['les deux coordonnées sont des nombres entiers.', hm('f(' + tn(py) + ') = ' + tn(x)) + '.'],
        autresFaux: ['un point d\'abscisse ' + (x < 0 ? 'négative' : 'positive') + ' n\'est jamais sur ce graphique.', 'le graphique n\'est pas une droite.'],
        messageFaux: 'Un point (x ; y) est sur le graphique si y = f(x). ' + hm(calcul) + '.'
      }),
      etapes: [{ texte: 'On calcule l\'image de l\'abscisse.', calcul: hm(calcul) }, { texte: vrai ? 'On trouve l\'ordonnée du point : il appartient au graphique.' : 'On trouve ' + tn(y) + ', pas ' + tn(py) + ' : le point n\'appartient pas au graphique.' }],
      verification: '',
      rubrique: forme === 'cube' ? R.cubique : R.quadratique,
      controle: { ops: 3, xs: [x], ys: [py], coefs: [a, b, c], calc: { genre: 'vf-f', formule: (forme === 'cube' ? a + '*Math.pow(' + x + ',3)' : a + '*' + x + '*' + x + '+' + b + '*' + x + '+' + c) + '===' + py } }
    };
  }

  /** D4 — de l'expression au graphique : ax² + c (N1), ax² + bx + c (N2). */
  function genChoisirGraphPoly(alea, d, ctx) {
    var a = alea.choix([1, -1]), c = alea.entierNonNul(-3, 3), b = ctx.niveau === 2 ? alea.choix([-2, 2, -4, 4]) : 0;
    if (ctx.niveau === 1) a = alea.choix([1, -1, 2, -2]);
    var variantes = ctx.niveau === 2
      ? [{ p: [a, b, c], juste: true }, { p: [-a, -b, c], message: 'Regarde le signe du coefficient de x² : ' + (a > 0 ? 'positif, la parabole est ouverte vers le haut' : 'négatif, la parabole est ouverte vers le bas') + '.' }, { p: [a, -b, c], message: 'Contrôle avec un point : ' + hm('f(1) = ' + tn(a + b + c)) + '.' }]
      : [{ p: [a, 0, c], juste: true }, { p: [-a, 0, c], message: 'Regarde le signe du coefficient de x² : ' + (a > 0 ? 'positif, la parabole est ouverte vers le haut' : 'négatif, la parabole est ouverte vers le bas') + '.' }, { p: [a, 0, -c], message: 'Calcule f(0) : le graphique doit couper l\'axe vertical en ' + hm(tc(0, c)) + '.' }];
    var choix = variantes.map(function (v) {
      return { h: O.graphiqueHtml(repere([{ src: srcQuad(v.p[0], v.p[1], v.p[2]) }], { description: 'Parabole dans un repère' })), juste: !!v.juste, param: v.p.join(','), message: v.message || '' };
    });
    return {
      type: 'relier',
      enonce: '<p>Quel graphique représente la fonction ' + hS(srcQuad(a, b, c), 'f', fleche(alea)) + ' ?</p>',
      indice: 'Calcule f(0) pour trouver le point sur l\'axe vertical. Le signe du coefficient de x² indique si la parabole est ouverte vers le haut ou vers le bas.',
      reponse: { type: 'choix' }, choix: nommer(O.melanger(alea, choix), 'Graphique'), choixGraphiques: true,
      etapes: [
        { texte: 'Point sur l\'axe vertical.', calcul: hm('f(0) = ' + tn(c)) },
        { texte: 'Le coefficient de x² est ' + signeTexte(a) + ' : la parabole est ouverte vers le ' + (a > 0 ? 'haut' : 'bas') + '.' },
        { texte: 'Contrôle avec un autre point.', calcul: hm('f(1) = ' + tn(a + b + c)) + ', donc ' + hm(tc(1, a + b + c)) }
      ],
      verification: '',
      rubrique: R.quadratique,
      controle: { ops: 3, xs: [0, 1], ys: [c, a + b + c], coefs: [a, b, c], grad: [1, 1], calc: { genre: 'choix-cle', attendu: [a, b, c].join(',') } }
    };
  }

  /* =====================================================================
   * C3 : pente d'une droite (entière au niveau 1, rationnelle au niveau 2)
   * ===================================================================== */

  /** D1 — lire la pente sur un graphique : de A à B, x augmente de 1. */
  function genPenteLire(alea, d, ctx) {
    var l, x0;
    do { l = { a: val(alea.entierNonNul(-4, 4)), b: val(alea.entier(-3, 3)) }; x0 = alea.entier(-1, 1); }
    while (Math.abs(image(l, x0).valeur()) > 7 || Math.abs(image(l, x0 + 1).valeur()) > 7 || l.a.egal(l.b) || O.estReference([sig(l)]));
    var A = [x0, image(l, x0)], Bp = [x0 + 1, image(l, x0 + 1)];
    var g = repere([{ src: src(l) }], { points: [{ x: A[0], y: A[1].valeur(), nom: 'A' }, { x: Bp[0], y: Bp[1].valeur(), nom: 'B' }], description: 'Droite passant par deux points marqués' });
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique d\'une fonction affine. De A à B, x augmente de 1.</p>' + O.graphiqueHtml(g) + '<p>Quelle est la pente de cette droite ?</p>',
      indice: 'La pente dit de combien y change quand x augmente de 1. Si la droite descend, la pente est négative.',
      reponse: { type: 'nombre', valeur: l.a },
      pieges: [{ valeur: l.a.oppose(), message: E.penteSigne }, { valeur: l.b, message: E.penteB }],
      etapes: [{ texte: 'De A à B, x augmente de 1 et y passe de ' + tn(A[1]) + ' à ' + tn(Bp[1]) + ' : il ' + (l.a.signe() > 0 ? 'augmente' : 'diminue') + ' de ' + tn(l.a.abs()) + '.', calcul: hm('pente = ' + tn(l.a)) }],
      verification: 'La droite ' + (l.a.signe() > 0 ? 'monte : pente positive.' : 'descend : pente négative.'),
      rubrique: R.pente,
      signatures: [sig(l)],
      controle: { ops: 1, xs: [A[0], Bp[0]], ys: [st(A[1]), st(Bp[1])], coefs: [st(l.a)], grad: [1, 1], calc: { genre: 'pente', x1: A[0], y1: st(A[1]), x2: Bp[0], y2: st(Bp[1]) } }
    };
  }

  /** Expression écrite dans l'ordre ax + b ou b + ax (pour repérer le bon coefficient). */
  function ecritureMelangee(alea, l, nom, fl) {
    var a = val(l.a), b = val(l.b);
    if (b.estZero() || alea.suivant() < 0.5) return hE(l, nom, fl);
    var ha = a.estDecimale() ? (a.abs().egal(1) ? '' : tn(a.abs())) : O.Maths.html.fraction(a.abs());
    return ecrire(tn(b) + (a.signe() < 0 ? ' – ' : ' + ') + ha + 'x', nom, fl);
  }
  function genLireCoefficient(alea, d, ctx, quoi) {
    var l;
    do { l = { a: tirerPente(alea, d, ctx.niveau), b: val(alea.entierNonNul(-9, 9)) }; } while (l.a.egal(l.b) || l.a.abs().egal(1) || O.estReference([sig(l)]));
    var pente = quoi === 'pente';
    return {
      type: 'directe',
      enonce: '<p>On donne ' + ecritureMelangee(alea, l, 'f', fleche(alea)) + '.</p><p>Quelle est ' + (pente ? 'la pente de la droite qui représente f' : 'l\'ordonnée à l\'origine de la droite qui représente f') + ' ?</p>',
      indice: 'Dans ax + b, la pente est le nombre a qui multiplie x ; l\'ordonnée à l\'origine est le nombre b, sans x. Attention à l\'ordre des termes et aux signes.',
      reponse: { type: 'nombre', valeur: pente ? l.a : l.b },
      pieges: [{ valeur: pente ? l.b : l.a, message: E.ordonneePente }, { valeur: (pente ? l.a : l.b).oppose(), message: 'Attention au signe : le signe placé devant un terme fait partie du coefficient.' }],
      etapes: [{ texte: pente ? 'La pente est le coefficient de x.' : 'L\'ordonnée à l\'origine est le terme sans x : la droite coupe l\'axe vertical en ' + hm(tc(0, l.b)) + '.', calcul: hm((pente ? 'a = ' + tn(l.a) : 'b = ' + tn(l.b))) }],
      verification: pente ? 'Quand x augmente de 1, f(x) ' + (l.a.signe() > 0 ? 'augmente' : 'diminue') + ' de ' + tn(l.a.abs()) + '.' : 'Contrôle : ' + hm('f(0) = ' + tn(l.b)) + '.',
      rubrique: R.pente,
      signatures: [sig(l)],
      controle: { ops: 1, xs: [], ys: [], coefs: [st(l.a), st(l.b)], calc: { genre: 'formule', formule: js(pente ? l.a : l.b) } }
    };
  }
  /** D2 — pente lue dans l'expression. */
  function genPenteExpression(alea, d, ctx) { return genLireCoefficient(alea, d, ctx, 'pente'); }
  /** D1 — ordonnée à l'origine lue dans l'expression (objectif C5). */
  function genOrdonneeExpression(alea, d, ctx) { return genLireCoefficient(alea, 1, ctx, 'ordonnee'); }

  /** Deux points à coordonnées entières d'une droite, dans le repère. */
  function deuxPoints(alea, l, sansZero) {
    var q = denominateur(l.a), x1, x2, essais = 0;
    do {
      x1 = q * alea.entier(-Math.floor(5 / q), Math.floor(2 / q));
      x2 = x1 + q * alea.entier(q === 1 ? 2 : 1, q === 1 ? 4 : 2);
      essais++;
    } while ((Math.abs(image(l, x1).valeur()) > 7 || Math.abs(image(l, x2).valeur()) > 7 || x2 > 6 || x1 < -6 || (sansZero && (x1 === 0 || x2 === 0))) && essais < 300);
    if (essais >= 300) return null;
    return [[x1, image(l, x1)], [x2, image(l, x2)]];
  }
  function etapesPente(A, Bp, p) {
    var dy = val(Bp[1]).moins(A[1]), dx = val(Bp[0] - A[0]);
    return [
      { texte: 'Différence des ordonnées (de A à B).', calcul: hm('y₂ – y₁ = ' + tn(Bp[1]) + ' – ' + tnp(A[1]) + ' = ' + tn(dy)) },
      { texte: 'Différence des abscisses (dans le même ordre).', calcul: hm('x₂ – x₁ = ' + tn(Bp[0]) + ' – ' + tnp(A[0]) + ' = ' + tn(dx)) },
      { texte: 'La pente est le quotient de ces deux différences.', calcul: '<span class="maths">p = ' + fraction(tn(dy), tn(dx)) + (tn(dy) + '/' + tn(dx) === tn(p) ? '' : ' = ' + O.hn(p)) + '</span>' }
    ];
  }
  function piegesPente(A, Bp, p, l) {
    var dy = val(Bp[1]).moins(A[1]), dx = val(Bp[0] - A[0]);
    var t = [{ valeur: dx.divise(dy), message: E.penteInverse }, { valeur: p.oppose(), message: E.penteOrdre + ' ' + E.penteSigne }, { valeur: dy, message: 'Tu as donné la différence des ordonnées : il faut encore la diviser par la différence des abscisses (' + tn(dx) + ').' }];
    if (l) t.push({ valeur: l.b, message: E.penteB });
    return t;
  }

  /** D3 — pente de la droite passant par deux points donnés. */
  function genPenteDeuxPoints11(alea, d, ctx) {
    var l, pts;
    do { l = { a: tirerPente(alea, 3, ctx.niveau), b: val(alea.entier(-6, 6)) }; pts = deuxPoints(alea, l, false); } while (!pts || O.estReference([sig(l)]));
    var A = pts[0], Bp = pts[1];
    return {
      type: 'directe',
      enonce: '<p>Une droite passe par les points ' + hm('A' + tc(A[0], A[1])) + ' et ' + hm('B' + tc(Bp[0], Bp[1])) + '.</p><p>Calcule sa pente.</p>',
      indice: 'Pente = différence des ordonnées divisée par la différence des abscisses, en gardant le même ordre des points.',
      reponse: { type: 'nombre', valeur: l.a },
      pieges: piegesPente(A, Bp, l.a),
      etapes: etapesPente(A, Bp, l.a),
      verification: 'Contrôle : en partant de A, on avance de ' + tn(Bp[0] - A[0]) + ' et on ' + (l.a.signe() > 0 ? 'monte' : 'descend') + ' de ' + tn(val(Bp[1]).moins(A[1]).abs()) + ' : on arrive en B.',
      rubrique: R.penteGraphique,
      signatures: [sig(l)],
      controle: { ops: 3, xs: [A[0], Bp[0]], ys: [st(A[1]), st(Bp[1])], coefs: [st(l.a)], calc: { genre: 'pente', x1: A[0], y1: st(A[1]), x2: Bp[0], y2: st(Bp[1]) } }
    };
  }

  /** D3 — pente d'une droite à partir de sa représentation graphique (deux points marqués). */
  function genPenteGraphique(alea, d, ctx) {
    var l, pts;
    do { l = { a: tirerPente(alea, 3, ctx.niveau, { max: 3 }), b: val(alea.entier(-4, 4)) }; pts = deuxPoints(alea, l, false); } while (!pts || O.estReference([sig(l)]));
    var A = pts[0], Bp = pts[1];
    var g = repere([{ src: src(l) }], { points: [{ x: A[0], y: A[1].valeur(), nom: 'A' }, { x: Bp[0], y: Bp[1].valeur(), nom: 'B' }], description: 'Droite passant par deux points marqués' });
    return {
      type: 'lecture',
      enonce: '<p>Voici une droite d et deux de ses points, A et B.</p>' + O.graphiqueHtml(g) + '<p>Détermine la pente de la droite d.</p>',
      consigne: ctx.niveau === 2 ? 'Si la pente n\'est pas un nombre entier, écris une fraction ou un nombre décimal.' : '',
      indice: 'Lis les coordonnées de A et de B, puis divise la différence des ordonnées par la différence des abscisses (même ordre).',
      reponse: { type: 'nombre', valeur: l.a },
      pieges: piegesPente(A, Bp, l.a, l),
      etapes: [{ texte: 'On lit les coordonnées.', calcul: hm('A' + tc(A[0], A[1]) + ' et B' + tc(Bp[0], Bp[1])) }].concat(etapesPente(A, Bp, l.a).slice(0, 1), [{ texte: 'On divise par la différence des abscisses, ' + tn(Bp[0] - A[0]) + '.', calcul: '<span class="maths">p = ' + fraction(tn(val(Bp[1]).moins(A[1])), tn(Bp[0] - A[0])) + ' = ' + O.hn(l.a) + '</span>' }]),
      verification: 'La droite ' + (l.a.signe() > 0 ? 'monte : la pente est positive.' : 'descend : la pente est négative.'),
      rubrique: R.penteGraphique,
      signatures: [sig(l)],
      controle: { ops: 3, xs: [A[0], Bp[0]], ys: [st(A[1]), st(Bp[1])], coefs: [st(l.a)], grad: [1, 1], calc: { genre: 'pente', x1: A[0], y1: st(A[1]), x2: Bp[0], y2: st(Bp[1]) } }
    };
  }

  /** D4 — utiliser la pente : ordonnée d'un deuxième point de la droite. */
  function genPointManquant(alea, d, ctx) {
    var a = tirerPente(alea, 4, ctx.niveau), q = denominateur(a);
    var x1 = alea.entier(-4, 4), y1 = alea.entier(-6, 6), dx = q * alea.entier(2, q === 1 ? 5 : 3) * alea.choix([1, 1, -1]);
    var x2 = x1 + dx, y2 = val(y1).plus(a.fois(dx));
    return {
      type: 'probleme',
      enonce: '<p>Une droite de pente <span class="maths">' + O.hn(a) + '</span> passe par le point ' + hm('A' + tc(x1, y1)) + '. Elle passe aussi par le point ' + hm('B(' + tn(x2) + ' ; y)') + '.</p><p>Calcule l\'ordonnée y du point B.</p>',
      indice: 'De A à B, de combien x change-t-il ? La pente dit de combien y change quand x augmente de 1.',
      reponse: { type: 'nombre', valeur: y2 },
      pieges: [{ valeur: val(y1).plus(a), message: 'Tu as ajouté la pente une seule fois : de A à B, x change de ' + tn(dx) + ', pas de 1.' }, { valeur: val(y1).moins(a.fois(dx)), message: 'Attention aux signes : la variation de y est ' + hm('pente · (x₂ – x₁)') + '.' }, { valeur: a.fois(dx), message: 'C\'est la variation de y : il faut encore l\'ajouter à l\'ordonnée de A (' + tn(y1) + ').' }],
      etapes: [
        { texte: 'Différence des abscisses, de A à B.', calcul: hm('x₂ – x₁ = ' + tn(x2) + ' – ' + tnp(x1) + ' = ' + tn(dx)) },
        { texte: 'Différence des ordonnées : pente · différence des abscisses.', calcul: '<span class="maths">' + O.hn(a) + ' · ' + ech(tnp(dx)) + ' = ' + ech(tn(a.fois(dx))) + '</span>' },
        { texte: 'Ordonnée de B.', calcul: hm('y = ' + tn(y1) + ' + ' + tnp(a.fois(dx)) + ' = ' + tn(y2)) }
      ],
      verification: 'Contrôle : ' + hm('(' + tn(y2) + ' – ' + tnp(y1) + ') : (' + tn(x2) + ' – ' + tnp(x1) + ') = ' + tn(a)) + ', la pente.',
      rubrique: R.pente,
      controle: { ops: 3, xs: [x1, x2], ys: [y1, st(y2)], coefs: [st(a)], calc: { genre: 'formule', formule: y1 + '+' + js(a) + '*(' + x2 + '-(' + x1 + '))' } }
    };
  }

  /* =====================================================================
   * C4 : expression fonctionnelle à partir du graphique (b, ax, ax + b)
   * ===================================================================== */

  /** D1 — graphique d'une fonction affine constante ou affine linéaire. */
  function genExprGraphSimple(alea, d, ctx) {
    var constante = alea.suivant() < 0.4, l;
    do { l = constante ? { a: val(0), b: val(alea.entierNonNul(-6, 6)) } : { a: val(alea.entierNonNul(-4, 4)), b: val(0) }; } while (O.estReference([sig(l)]));
    var pts = constante ? [{ x: 0, y: l.b.valeur(), nom: 'M' }] : [{ x: 1, y: l.a.valeur(), nom: 'M' }];
    var g = repere([{ src: src(l) }], { points: pts, description: constante ? 'Droite horizontale' : 'Droite passant par l\'origine' });
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique d\'une fonction f.</p>' + O.graphiqueHtml(g) + '<p>Écris son expression fonctionnelle.</p>',
      consigne: 'Écris seulement ce qui suit « f(x) = ».',
      prefixe: 'f(x) =',
      indice: constante ? 'La droite est horizontale : que vaut f(x) pour n\'importe quel x ?' : 'La droite passe par l\'origine : f(x) = ax. Lis l\'image de 1 pour trouver a.',
      reponse: { type: 'expr', attendu: src(l) },
      pieges: constante ? [{ src: O.srcAffine(l.b, 0), message: 'La droite est horizontale : f(x) ne dépend pas de x. C\'est une fonction affine constante, f(x) = b.' }, { src: O.srcAffine(0, l.b.oppose()), message: 'Attention au signe : la droite passe par ' + hm(tc(0, l.b)) + '.' }]
        : [{ src: O.srcAffine(0, l.a), message: 'La droite n\'est pas horizontale : f(x) change avec x. Elle passe par l\'origine : f(x) = ax.' }, { src: O.srcAffine(l.a.oppose(), 0), message: E.penteSigne }],
      etapes: constante ? [{ texte: 'La droite est horizontale et passe par M' + tc(0, l.b) + ' : toutes les images valent ' + tn(l.b) + '.', calcul: O.hf(src(l)) }]
        : [{ texte: 'La droite passe par l\'origine (b = 0) et par M' + tc(1, l.a) + ' : quand x augmente de 1, y change de ' + tn(l.a) + '.', calcul: O.hf(src(l)) }],
      verification: constante ? 'Fonction affine constante : pente nulle.' : 'Contrôle : ' + hm('f(2) = ' + tn(l.a.fois(2))) + ', et le point ' + hm(tc(2, l.a.fois(2))) + ' est sur la droite.',
      rubrique: constante ? R.constante : R.lineaire,
      signatures: [sig(l)],
      controle: { ops: 1, xs: [0, 1], ys: [st(l.b), st(image(l, 1))], coefs: [st(l.a), st(l.b)], grad: [1, 1], calc: { genre: 'expr', a: st(l.a), b: st(l.b) } }
    };
  }

  /** D2, D3 — expression d'une fonction affine : ordonnée à l'origine, puis pente (méthode de l'aide-mémoire). */
  function genExprGraphAffine(alea, d, ctx) {
    var l, q;
    do {
      l = { a: d <= 2 ? val(alea.entierNonNul(-4, 4)) : tirerPente(alea, 3, ctx.niveau, { max: 3 }), b: val(alea.entierNonNul(-4, 4)) };
      q = d <= 2 ? 1 : denominateur(l.a) * (l.a.estEntier() ? alea.entier(2, 3) : 1);
    } while (Math.abs(image(l, q).valeur()) > 7 || l.a.egal(l.b) || O.estReference([sig(l)]));
    var N = [q, image(l, q)];
    var g = repere([{ src: src(l) }], { points: [{ x: 0, y: l.b.valeur(), nom: 'M' }, { x: N[0], y: N[1].valeur(), nom: 'N' }], description: 'Droite passant par deux points marqués' });
    var dy = N[1].moins(l.b);
    return {
      type: 'lecture',
      enonce: '<p>Voici la droite qui représente une fonction affine h, avec deux de ses points.</p>' + O.graphiqueHtml(g) + '<p>Détermine l\'expression fonctionnelle de h.</p>',
      consigne: 'Écris seulement ce qui suit « h(x) = ».',
      prefixe: 'h(x) =',
      indice: 'h(x) = ax + b. Lis b sur l\'axe vertical (point M). Calcule ensuite la pente a avec M et N.',
      reponse: { type: 'expr', attendu: src(l), nom: 'h' },
      attenduHtml: hE(l, 'h'),
      pieges: [
        { src: O.srcAffine(l.b, l.a), message: E.ordonneePente },
        { src: O.srcAffine(l.a.oppose(), l.b), message: E.penteSigne },
        { src: O.srcAffine(val(q).divise(dy), l.b), message: E.penteInverse },
        { src: O.srcAffine(dy, l.b), message: 'Tu as pris la différence des ordonnées comme pente : il faut la diviser par la différence des abscisses (' + q + ').' }
      ],
      etapes: [
        { texte: 'Ordonnée à l\'origine : la droite coupe l\'axe vertical en M' + tc(0, l.b) + '.', calcul: hm('b = ' + tn(l.b)) },
        { texte: 'Pente, avec M' + tc(0, l.b) + ' et N' + tc(N[0], N[1]) + '.', calcul: '<span class="maths">a = ' + fraction(ech(tn(N[1]) + ' – ' + tnp(l.b)), q + ' – 0') + ' = ' + (q === 1 ? '' : fraction(tn(dy), q) + ' = ') + O.hn(l.a) + '</span>' },
        { texte: 'Expression fonctionnelle.', calcul: hE(l, 'h') }
      ],
      verification: 'Contrôle avec N : <span class="maths">h(' + q + ') = ' + O.hn(l.a) + ' · ' + q + (l.b.signe() < 0 ? ' – ' : ' + ') + tn(l.b.abs()) + ' = ' + tn(N[1]) + '</span>.',
      rubrique: R.expressionGraphique,
      signatures: [sig(l)],
      controle: { ops: d <= 2 ? 2 : 3, xs: [0, q], ys: [st(l.b), st(N[1])], coefs: [st(l.a), st(l.b)], grad: [1, 1], calc: { genre: 'expr', a: st(l.a), b: st(l.b) } }
    };
  }

  /** D4 — expression de la fonction affine dont la droite passe par deux points (sans graphique). */
  function genExpressionDeuxPoints11(alea, d, ctx) {
    var l, pts;
    do { l = { a: tirerPente(alea, 4, ctx.niveau), b: val(alea.entierNonNul(-6, 6)) }; pts = deuxPoints(alea, l, true); } while (!pts || O.estReference([sig(l)]));
    var A = pts[0], Bp = pts[1], dy = val(Bp[1]).moins(A[1]), dx = val(Bp[0] - A[0]);
    return {
      type: 'directe',
      enonce: '<p>La droite qui représente une fonction affine f passe par ' + hm('A' + tc(A[0], A[1])) + ' et ' + hm('B' + tc(Bp[0], Bp[1])) + '.</p><p>Détermine l\'expression fonctionnelle de f.</p>',
      consigne: 'Écris seulement ce qui suit « f(x) = ».',
      prefixe: 'f(x) =',
      indice: 'Calcule d\'abord la pente a avec les deux points. Puis remplace x et f(x) par les coordonnées de A dans f(x) = ax + b pour trouver b.',
      reponse: { type: 'expr', attendu: src(l) },
      attenduHtml: hE(l, 'f'),
      pieges: [
        { src: O.srcAffine(l.a, 0), message: 'Il manque b : ' + E.affineOrigine },
        { src: O.srcAffine(dx.divise(dy), l.b), message: E.penteInverse },
        { src: O.srcAffine(l.a.oppose(), l.b), message: E.penteSigne },
        { src: O.srcAffine(l.a, A[1]), message: 'b n\'est pas l\'ordonnée de A : b est l\'image de 0. Remplace x par ' + tn(A[0]) + ' et f(x) par ' + tn(A[1]) + ' pour le trouver.' }
      ],
      etapes: [
        { texte: 'Pente.', calcul: '<span class="maths">a = ' + fraction(ech(tn(Bp[1]) + ' – ' + tnp(A[1])), ech(tn(Bp[0]) + ' – ' + tnp(A[0]))) + ' = ' + fraction(tn(dy), tn(dx)) + ' = ' + O.hn(l.a) + '</span>' },
        { texte: 'On remplace x et f(x) par les coordonnées de A.', calcul: '<span class="maths">' + tn(A[1]) + ' = ' + O.hn(l.a) + ' · ' + ech(tnp(A[0])) + ' + b</span>' },
        { texte: 'On trouve b.', calcul: hm('b = ' + tn(A[1]) + ' – ' + tnp(l.a.fois(A[0])) + ' = ' + tn(l.b)) },
        { texte: 'Expression fonctionnelle.', calcul: hE(l, 'f') }
      ],
      verification: 'Contrôle avec B : ' + hm('f(' + tn(Bp[0]) + ') = ' + tn(image(l, Bp[0]))) + '.',
      rubrique: R.expressionGraphique,
      signatures: [sig(l)],
      controle: { ops: 4, xs: [A[0], Bp[0]], ys: [st(A[1]), st(Bp[1])], coefs: [st(l.a), st(l.b)], calc: { genre: 'expr', a: st(l.a), b: st(l.b) } }
    };
  }

  /* =====================================================================
   * C5 : interpréter les coefficients (b, ax, ax + b ; N2 : a(x – b)² + c)
   * ===================================================================== */

  /** D2 — signes de a et de b lus sur le graphique (les quatre cas de l'aide-mémoire). */
  function genSigneCoefficients(alea, d, ctx) {
    var l;
    do { l = { a: tirerPente(alea, 2, ctx.niveau, { max: 3 }), b: val(alea.entierNonNul(-5, 5)) }; } while (O.estReference([sig(l)]));
    var cle = function (a, b) { return (a > 0 ? 'a+' : 'a-') + (b > 0 ? 'b+' : 'b-'); };
    var juste = cle(l.a.signe(), l.b.signe());
    var choix = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(function (s) {
      var k = cle(s[0], s[1]);
      var msg = s[0] !== l.a.signe() && s[1] !== l.b.signe() ? 'Les deux signes sont à revoir : la droite ' + (l.a.signe() > 0 ? 'monte' : 'descend') + ' et coupe l\'axe vertical ' + (l.b.signe() > 0 ? 'au-dessus' : 'au-dessous') + ' de l\'origine.'
        : s[0] !== l.a.signe() ? E.penteSigne : 'b est l\'ordonnée à l\'origine : la droite coupe l\'axe vertical ' + (l.b.signe() > 0 ? 'au-dessus de l\'origine, donc b est positif.' : 'au-dessous de l\'origine, donc b est négatif.');
      return { h: hm('a ' + (s[0] > 0 ? '>' : '<') + ' 0 et b ' + (s[1] > 0 ? '>' : '<') + ' 0'), juste: k === juste, param: k, message: k === juste ? '' : msg };
    });
    return {
      type: 'choix',
      enonce: '<p>Voici la droite qui représente une fonction affine ' + hm('f(x) = ax + b') + '.</p>' + O.graphiqueHtml(repere([{ src: src(l) }], { description: 'Droite dans un repère' })) + '<p>Que peut-on dire des coefficients a et b ?</p>',
      indice: 'a est la pente : la droite monte-t-elle ou descend-elle ? b est l\'ordonnée à l\'origine : où la droite coupe-t-elle l\'axe vertical ?',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'La droite ' + (l.a.signe() > 0 ? 'monte de gauche à droite : la pente a est positive.' : 'descend de gauche à droite : la pente a est négative.') },
        { texte: 'Elle coupe l\'axe vertical en ' + hm(tc(0, l.b)) + ' : l\'ordonnée à l\'origine b est ' + (l.b.signe() > 0 ? 'positive.' : 'négative.') }
      ],
      verification: '',
      rubrique: R.pente,
      signatures: [sig(l)],
      controle: { ops: 2, xs: [0], ys: [st(l.b)], coefs: [st(l.a), st(l.b)], grad: [1, 1], calc: { genre: 'choix-signes', a: st(l.a), b: st(l.b) } }
    };
  }

  /** D3 — comparer deux fonctions affines par leurs coefficients. */
  function genComparerDroites(alea, d, ctx) {
    var cas = alea.choix(['paralleles', 'memeB', 'rien']);
    var a1 = tirerPente(alea, 3, ctx.niveau), b1 = val(alea.entierNonNul(-8, 8)), a2, b2;
    do {
      a2 = cas === 'paralleles' ? a1 : tirerPente(alea, 3, ctx.niveau);
      b2 = cas === 'memeB' ? b1 : val(alea.entierNonNul(-8, 8));
    } while ((cas !== 'paralleles' && a2.egal(a1)) || (cas !== 'memeB' && b2.egal(b1)));
    var f = { a: a1, b: b1 }, g = { a: a2, b: b2 };
    var textes = {
      paralleles: 'Les deux droites sont parallèles.',
      memeB: 'Les deux droites coupent l\'axe vertical au même point.',
      rien: 'Les deux droites ne sont pas parallèles et coupent l\'axe vertical en deux points différents.'
    };
    var explication = { paralleles: 'Les pentes sont égales (a = ' + tn(a1) + ') : les droites sont parallèles. Les ordonnées à l\'origine sont différentes.',
      memeB: 'Les ordonnées à l\'origine sont égales (b = ' + tn(b1) + ') : les deux droites passent par ' + tc(0, b1) + '. Les pentes sont différentes : elles ne sont pas parallèles.',
      rien: 'Les pentes sont différentes (' + tn(a1) + ' et ' + tn(a2) + ') et les ordonnées à l\'origine aussi (' + tn(b1) + ' et ' + tn(b2) + ').' };
    var choix = ['paralleles', 'memeB', 'rien'].map(function (k) { return { h: textes[k], juste: k === cas, param: k, message: k === cas ? '' : explication[cas] }; });
    return {
      type: 'choix',
      enonce: '<p>On donne ' + ecritureMelangee(alea, f, 'f') + ' et ' + ecritureMelangee(alea, g, 'g') + '.</p><p>Sans les tracer, que peut-on dire des droites qui représentent f et g ?</p>',
      indice: 'Compare les pentes (coefficients de x), puis les ordonnées à l\'origine (termes sans x).',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'Pentes : ' + tn(a1) + ' pour f et ' + tn(a2) + ' pour g. ' + (a1.egal(a2) ? 'Même pente : droites parallèles.' : 'Pentes différentes : les droites se coupent.') },
        { texte: 'Ordonnées à l\'origine : ' + tn(b1) + ' pour f et ' + tn(b2) + ' pour g. ' + (b1.egal(b2) ? 'Les deux droites passent par ' + tc(0, b1) + '.' : 'Elles coupent l\'axe vertical en deux points différents.') }
      ],
      verification: '',
      rubrique: R.pente,
      controle: { ops: 2, xs: [], ys: [], coefs: [st(a1), st(b1), st(a2), st(b2)], calc: { genre: 'choix-droites', f: [st(a1), st(b1)], g: [st(a2), st(b2)] } }
    };
  }

  var SITUATIONS = [
    { texte: function (a, b) { return 'Une bougie se consume. Sa hauteur, en centimètres, après x heures est ' + hm('h(x) = ' + b + ' – ' + a + 'x') + '.'; }, a: 'la bougie raccourcit de {a} cm par heure', b: 'la hauteur de la bougie au départ, en centimètres', autre: 'la durée, en heures, jusqu\'à ce que la bougie soit consumée', unite: 'heure', aVals: [2, 3, 4], bVals: [12, 18, 24] },
    { texte: function (a, b) { return 'On vide une citerne. Le volume d\'eau restant, en litres, après x minutes est ' + hm('V(x) = ' + b + ' – ' + a + 'x') + '.'; }, a: 'la citerne perd {a} litres par minute', b: 'le volume d\'eau au départ, en litres', autre: 'la durée, en minutes, pour vider la citerne', unite: 'minute', aVals: [20, 25, 40], bVals: [600, 800, 1000] },
    { texte: function (a, b) { return 'Le crédit restant sur une carte de cantine, en francs, après x repas est ' + hm('C(x) = ' + b + ' – ' + a + 'x') + '.'; }, a: 'chaque repas coûte {a} francs', b: 'le crédit au départ, en francs', autre: 'le nombre de repas jusqu\'à ce que le crédit soit épuisé', unite: 'repas', aVals: [6, 8, 10], bVals: [120, 240] }
  ];
  /** D4 — sens de a (négatif) et de b dans une situation. */
  function genSituationCoefficients11(alea, d, ctx) {
    var s = alea.choix(SITUATIONS), a = alea.choix(s.aVals), b = alea.choix(s.bVals);
    var quoi = alea.choix(['a', 'b']);
    var choix = [
      { h: s.a.replace('{a}', a) + ' (la pente est – ' + a + ')', juste: quoi === 'a', message: quoi === 'a' ? '' : E.ordonneePente },
      { h: s.b + ' (l\'ordonnée à l\'origine)', juste: quoi === 'b', message: quoi === 'b' ? '' : E.ordonneePente },
      { h: s.autre, juste: false, message: 'C\'est la valeur de x pour laquelle l\'expression vaut 0 : ce n\'est ni a, ni b.' },
      { h: 'la valeur de l\'expression après 1 ' + s.unite, juste: false, message: 'Après 1 ' + s.unite + ', la valeur est ' + b + ' – ' + a + ' = ' + (b - a) + '.' }
    ];
    return {
      type: 'choix',
      enonce: '<p>' + s.texte(a, b) + '</p>' + FICTIF + '<p>Que représente le nombre ' + (quoi === 'a' ? a : b) + ' dans cette situation ?</p>',
      indice: 'L\'expression s\'écrit aussi – ' + a + 'x + ' + b + ' : quel nombre multiplie x ? Quel nombre obtient-on pour x = 0 ?',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'On écrit l\'expression sous la forme ax + b.', calcul: hm('– ' + a + 'x + ' + b + ' : a = – ' + a + ' et b = ' + b) },
        { texte: quoi === 'a' ? 'La pente est négative : la grandeur diminue de ' + a + ' chaque fois que x augmente de 1.' : 'Pour x = 0 (au départ), la valeur est ' + b + ' : c\'est l\'ordonnée à l\'origine.' }
      ],
      verification: '',
      rubrique: R.pente,
      controle: { ops: 2, xs: [], ys: [], coefs: [-a, b], calc: { genre: 'choix' } }
    };
  }

  /** D3 (niveau 2) — sommet de la parabole de f(x) = a(x – b)² + c. */
  function genSommetParabole(alea, d, ctx) {
    var a = alea.choix([1, -1, 2, -2, 3]), h = alea.entierNonNul(-5, 5), k = alea.entierNonNul(-6, 6);
    while (k === h) k = alea.entierNonNul(-6, 6);
    var source = srcCanonique(a, h, k);
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hS(source, 'f', fleche(alea)) + '. Son graphique est une parabole.</p><p>Écris les coordonnées du sommet de cette parabole (son point le plus ' + (a > 0 ? 'bas' : 'haut') + ').</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Un carré vaut au minimum 0. Pour quelle valeur de x la parenthèse vaut-elle 0 ? Que vaut alors f(x) ?',
      reponse: { type: 'couple', x: h, y: k, messageFaux: 'Cherche la valeur de x qui annule la parenthèse, puis calcule son image.', messageY: 'Quand la parenthèse vaut 0, il reste f(x) = ' + tn(k) + '.' },
      etapes: [
        { texte: 'Le carré ' + hm('(x ' + (h > 0 ? '– ' + h : '+ ' + (-h)) + ')²') + ' vaut 0 quand x = ' + tn(h) + ' ; sinon il est positif.' },
        { texte: 'Image de ' + tn(h) + '.', calcul: hm('f(' + tn(h) + ') = ' + tn(a) + ' · 0² ' + (k < 0 ? '– ' : '+ ') + Math.abs(k) + ' = ' + tn(k)) },
        { texte: 'a = ' + tn(a) + ' est ' + signeTexte(a) + ' : la parabole est ouverte vers le ' + (a > 0 ? 'haut' : 'bas') + ', le sommet ' + hm(tc(h, k)) + ' est son point le plus ' + (a > 0 ? 'bas.' : 'haut.') }
      ],
      verification: 'Contrôle : ' + hm('f(' + tn(h + 1) + ') = ' + tn(a + k)) + ', ' + (a > 0 ? 'plus grand' : 'plus petit') + ' que ' + tn(k) + '.',
      rubrique: R.quadratique,
      controle: { ops: 3, xs: [h], ys: [k], coefs: [a, h, k], calc: { genre: 'sommet', a: a, h: h, k: k } }
    };
  }

  /** D4 (niveau 2) — retrouver a(x – b)² + c à partir de la parabole. */
  function genCanoniqueGraph(alea, d, ctx) {
    var a = alea.choix([1, -1]), h = alea.entierNonNul(-3, 3), k = alea.entierNonNul(-4, 4);
    while (k === h || k === -h) k = alea.entierNonNul(-4, 4);
    var variantes = [
      { p: [a, h, k], juste: true },
      { p: [a, -h, k], message: 'Attention au signe dans la parenthèse : (x – b)² vaut 0 pour x = b. Le sommet a pour abscisse ' + tn(h) + ', donc la parenthèse est ' + hm('(x ' + (h > 0 ? '– ' + h : '+ ' + (-h)) + ')') + '.' },
      { p: [-a, h, k], message: 'Regarde l\'ouverture de la parabole : vers le ' + (a > 0 ? 'haut, donc a est positif.' : 'bas, donc a est négatif.') },
      { p: [a, k, h], message: 'Tu as échangé les coordonnées du sommet : dans a(x – b)² + c, le sommet est (b ; c).' }
    ];
    var choix = variantes.map(function (v) { return { h: hS(srcCanonique(v.p[0], v.p[1], v.p[2])), juste: !!v.juste, param: v.p.join(','), message: v.message || '' }; });
    var g = repere([{ src: srcCanonique(a, h, k) }], { points: [{ x: h, y: k, nom: 'S' }], description: 'Parabole et son sommet S' });
    return {
      type: 'relier',
      enonce: '<p>Voici une parabole et son sommet S.</p>' + O.graphiqueHtml(g) + '<p>Quelle expression correspond à cette parabole ?</p>',
      indice: 'Dans a(x – b)² + c, le sommet est le point (b ; c). Le signe de a indique l\'ouverture de la parabole.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'On lit le sommet.', calcul: hm('S' + tc(h, k)) },
        { texte: 'Le sommet (b ; c) donne la parenthèse et le nombre ajouté.', calcul: hm('(x ' + (h > 0 ? '– ' + h : '+ ' + (-h)) + ')² ' + (k < 0 ? '– ' : '+ ') + Math.abs(k)) },
        { texte: 'La parabole est ouverte vers le ' + (a > 0 ? 'haut : a est positif.' : 'bas : a est négatif.'), calcul: hS(srcCanonique(a, h, k)) }
      ],
      verification: 'Contrôle : ' + hm('f(' + tn(h + 1) + ') = ' + tn(a + k)) + ', et le point ' + hm(tc(h + 1, a + k)) + ' est sur la parabole.',
      rubrique: R.quadratique,
      controle: { ops: 3, xs: [h], ys: [k], coefs: [a, h, k], grad: [1, 1], calc: { genre: 'choix-cle', attendu: [a, h, k].join(',') } }
    };
  }

  /* =====================================================================
   * C6 : intersections d'un graphique avec les axes Ox et Oy
   * ===================================================================== */

  /** D1 — lire sur le graphique d'une droite le point d'intersection avec un axe. */
  function genAxesLire(alea, d, ctx) {
    var l, p, essais = 0;
    do {
      l = { a: val(alea.entierNonNul(-3, 3)), b: val(alea.entierNonNul(-6, 6)) };
      p = l.b.oppose().divise(l.a); essais++;
    } while ((!p.estEntier() || Math.abs(p.valeur()) > 5 || O.estReference([sig(l)])) && essais < 300);
    var axe = alea.choix(['Ox', 'Oy']);
    var x = axe === 'Ox' ? p : val(0), y = axe === 'Ox' ? val(0) : l.b;
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique d\'une fonction f.</p>' + O.graphiqueHtml(repere([{ src: src(l) }], { description: 'Droite dans un repère' })) + '<p>Lis les coordonnées du point d\'intersection du graphique avec l\'axe ' + (axe === 'Ox' ? 'Ox (axe horizontal).' : 'Oy (axe vertical).') + '</p>',
      consigne: 'Écris (x ; y).',
      indice: axe === 'Ox' ? 'Sur l\'axe horizontal Ox, tous les points ont une ordonnée y = 0.' : 'Sur l\'axe vertical Oy, tous les points ont une abscisse x = 0.',
      reponse: { type: 'couple', x: x, y: y, messageFaux: 'Tu as peut-être lu l\'autre axe : le point demandé est sur l\'axe ' + axe + '.' },
      etapes: [{ texte: axe === 'Ox' ? 'La droite coupe l\'axe horizontal en x = ' + tn(p) + ' ; sur cet axe, y = 0.' : 'La droite coupe l\'axe vertical en y = ' + tn(l.b) + ' ; sur cet axe, x = 0.', calcul: hm(tc(x, y)) }],
      verification: 'L\'autre axe est coupé en ' + hm(axe === 'Ox' ? tc(0, l.b) : tc(p, 0)) + '.',
      rubrique: R.graphique,
      signatures: [sig(l)],
      controle: { ops: 1, xs: [st(x)], ys: [st(y)], coefs: [st(l.a), st(l.b)], grad: [1, 1], calc: { genre: 'couple-f', x: axe === 'Ox' ? '-' + js(l.b) + '/' + js(l.a) : '0', y: axe === 'Ox' ? '0' : js(l.b) } }
    };
  }

  /** D2 — intersection avec l'axe Oy par le calcul : f(0). */
  function genAxeOy(alea, d, ctx) {
    var quad = alea.suivant() < 0.4, a = alea.entierNonNul(-4, 4), c = alea.entierNonNul(-9, 9), b = quad && ctx.niveau === 2 ? alea.entierNonNul(-5, 5) : 0;
    while (c === a) c = alea.entierNonNul(-9, 9);
    var source = quad ? srcQuad(a, b, c) : O.srcAffine(a, c);
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hS(source, 'f', fleche(alea)) + '.</p><p>Calcule les coordonnées du point d\'intersection de son graphique avec l\'axe Oy.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Sur l\'axe Oy (axe vertical), x = 0 : calcule f(0).',
      reponse: { type: 'couple', x: 0, y: c, messageFaux: 'Sur l\'axe Oy, x vaut 0 : le point cherché est (0 ; f(0)).', messageY: 'Calcule f(0) : tous les termes avec x valent 0.' },
      etapes: [
        { texte: 'Sur l\'axe Oy, x = 0.' },
        { texte: 'On calcule f(0).', calcul: hm('f(0) = ' + tx(source).replace(/(\d)x/g, '$1 · 0').replace(/x/g, '0') + ' = ' + tn(c)) }
      ],
      verification: 'Le graphique coupe l\'axe Oy en ' + hm(tc(0, c)) + (quad ? '.' : ' : c\'est l\'ordonnée à l\'origine b.'),
      rubrique: quad ? R.quadratique : R.pente,
      controle: { ops: 2, xs: [0], ys: [c], coefs: [a, b, c], calc: { genre: 'couple-f', x: '0', y: a + '*0*' + (quad ? '0' : '1') + '+' + b + '*0+' + c } }
    };
  }

  /** D3 — intersection avec l'axe Ox par le calcul : f(x) = 0. */
  function genAxeOx(alea, d, ctx) {
    var a, b, x, essais = 0;
    do {
      a = val(alea.entierNonNul(-5, 5)); b = val(alea.entierNonNul(-12, 12));
      x = b.oppose().divise(a); essais++;
    } while ((a.abs().egal(1) || (ctx.niveau === 1 ? !x.estEntier() : (!x.fois(2).estEntier() && !x.fois(3).estEntier())) || O.estReference([sig({ a: a, b: b })])) && essais < 500);
    var l = { a: a, b: b };
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hE(l, 'f', fleche(alea)) + '.</p><p>Calcule les coordonnées du point d\'intersection de son graphique avec l\'axe Ox.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Sur l\'axe Ox (axe horizontal), y = 0 : résous l\'équation f(x) = 0.',
      reponse: { type: 'couple', x: x, y: 0, messageFaux: 'Sur l\'axe Ox, y vaut 0 : résous ' + tx(src(l)) + ' = 0 pour trouver x.', messageY: 'Sur l\'axe Ox, l\'ordonnée est toujours 0.' },
      etapes: [
        { texte: 'Sur l\'axe Ox, y = 0 : on résout f(x) = 0.', calcul: hm(tx(src(l)) + ' = 0') },
        { texte: 'On isole le terme en x.', calcul: hm(tx(O.srcAffine(a, 0)) + ' = ' + tn(b.oppose())) },
        { texte: 'On divise par ' + tn(a) + '.', calcul: '<span class="maths">x = ' + (x.estEntier() ? '' : fraction(tn(b.oppose()), tn(a)) + ' = ') + O.hn(x) + '</span>' }
      ],
      verification: 'Contrôle : ' + hm('f(' + tn(x) + ') = 0') + '. Le graphique coupe l\'axe Ox en ' + hm(tc(x, 0)) + '.',
      rubrique: R.equations,
      signatures: [sig(l)],
      controle: { ops: 3, xs: [st(x)], ys: [0], coefs: [st(a), st(b)], calc: { genre: 'couple-f', x: '-' + js(b) + '/' + js(a), y: '0' } }
    };
  }

  /** D4 — lire sur une parabole les intersections avec l'axe Ox. */
  function genAxesParabole(alea, d, ctx) {
    var a = alea.choix([1, -1]), r1, r2;
    do { r1 = alea.entier(-5, 3); r2 = r1 + alea.choix([2, 4]); } while (r2 > 5 || r1 * r2 === 0 || Math.abs(r1 * r2) > 7);
    var b = -a * (r1 + r2), c = a * r1 * r2;
    var g = repere([{ src: srcQuad(a, b, c) }], { description: 'Parabole qui coupe l\'axe horizontal en deux points' });
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique de ' + hS(srcQuad(a, b, c)) + '.</p>' + O.graphiqueHtml(g) + '<p>Lis les abscisses des deux points d\'intersection du graphique avec l\'axe Ox.</p>',
      consigne: 'Écris les deux valeurs de x, de la plus petite à la plus grande, séparées par un point-virgule.',
      indice: 'Cherche les points de la parabole situés sur l\'axe horizontal (y = 0) et lis leur abscisse.',
      reponse: { type: 'liste', valeurs: [r1, r2], noms: ['la plus petite', 'la plus grande'] },
      pieges: [{ liste: [0, c], message: 'Tu as donné le point d\'intersection avec l\'axe Oy : sur l\'axe Ox, on cherche les points où y = 0.' }, { liste: [r2, r1], message: 'Les deux valeurs sont justes, mais écris-les de la plus petite à la plus grande.' }],
      etapes: [
        { texte: 'La parabole coupe l\'axe horizontal en deux points.', calcul: hm(tc(r1, 0) + ' et ' + tc(r2, 0)) },
        { texte: 'Abscisses de ces points.', calcul: hm('x = ' + tn(r1) + ' et x = ' + tn(r2)) }
      ],
      verification: 'Contrôle : ' + hm('f(' + tn(r1) + ') = 0') + ' et ' + hm('f(' + tn(r2) + ') = 0') + '. Le graphique coupe aussi l\'axe Oy, en ' + hm(tc(0, c)) + '.',
      rubrique: R.quadratique,
      controle: { ops: 2, xs: [r1, r2], ys: [0, 0], coefs: [a, b, c], grad: [1, 1], calc: { genre: 'racines', a: a, b: b, c: c } }
    };
  }

  /** D4 — problème : quand la grandeur vaut-elle 0 ? (intersection avec l'axe Ox dans une situation). */
  function genZeroSituation(alea, d, ctx) {
    var s = alea.choix(SITUATIONS), a = alea.choix(s.aVals), b = alea.choix(s.bVals);
    var x = val(b).divise(a), essais = 0;
    while ((ctx.niveau === 1 ? !x.estEntier() : !x.fois(4).estEntier()) && essais < 50) { a = alea.choix(s.aVals); b = alea.choix(s.bVals); x = val(b).divise(a); essais++; }
    if (ctx.niveau === 1 && !x.estEntier()) { b = a * alea.entier(4, 6); x = val(b).divise(a); }
    var unite = { heure: 'h', minute: 'min', repas: 'repas' }[s.unite];
    return {
      type: 'probleme',
      enonce: '<p>' + s.texte(a, b) + '</p>' + FICTIF + '<p>Calcule ' + s.autre + '.</p>',
      indice: 'On cherche x pour que l\'expression vaille 0 : c\'est l\'abscisse du point où le graphique coupe l\'axe Ox.',
      reponse: { type: 'nombre', valeur: x, unite: unite }, suffixe: unite,
      pieges: [{ valeur: b, message: 'C\'est la valeur au départ (pour x = 0). On cherche x pour que l\'expression vaille 0.' }, { valeur: b - a, message: 'C\'est la valeur après 1 ' + s.unite + '. On cherche x pour que l\'expression vaille 0.' }, { valeur: val(a).divise(b), message: 'Tu as inversé la division : ' + a + 'x = ' + b + ', donc x = ' + b + ' : ' + a + '.' }],
      etapes: [
        { texte: 'On cherche x pour que l\'expression vaille 0.', calcul: hm(b + ' – ' + a + 'x = 0') },
        { texte: 'On isole le terme en x.', calcul: hm(a + 'x = ' + b) },
        { texte: 'On divise par ' + a + '.', calcul: hm('x = ' + b + ' : ' + a + ' = ' + tn(x)) }
      ],
      verification: 'Contrôle : ' + hm(b + ' – ' + a + ' · ' + tn(x) + ' = 0') + '. Sur le graphique, c\'est le point ' + hm(tc(x, 0)) + ' de l\'axe Ox.',
      rubrique: R.equations,
      controle: { ops: 3, xs: [st(x)], ys: [0], coefs: [-a, b], calc: { genre: 'formule', formule: b + '/' + a } }
    };
  }

  /* ---------- objectifs ---------- */
  var T = 'FA 11.3';
  var objectifs = [
    { id: 'C1', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Reconnaître et nommer une fonction : affine, quadratique, cubique, homographique, exponentielle (niveau 2 : racine carrée)',
      modeles: [
        { type: 'choix', dMin: 1, dMax: 1, gen: genNomCourbe, niveauDependant: true },
        { type: 'choix', dMin: 2, dMax: 2, gen: genNomExpression11, niveauDependant: true },
        { type: 'vraifaux', dMin: 3, dMax: 3, gen: genVraiFauxNature },
        { type: 'erreur', dMin: 4, dMax: 4, gen: genErreurNature }
      ] },
    { id: 'C2', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Expression, tableau de valeurs et graphique : b, ax, ax + b, ax² (niveau 2 : ax² + bx + c, ax³, √x)',
      modeles: [
        { type: 'directe', dMin: 1, dMax: 1, gen: genImage11 },
        { type: 'tableau', dMin: 2, dMax: 2, gen: genTableauAx2, niveauDependant: true },
        { type: 'relier', dMin: 2, dMax: 2, gen: genExprVersGraph11, niveauDependant: true },
        { type: 'tableau', dMin: 3, dMax: 3, gen: genTableauPoly, niveauDependant: true },
        { type: 'vraifaux', dMin: 4, dMax: 4, gen: genPointSurCourbe, niveauDependant: true },
        { type: 'relier', dMin: 4, dMax: 4, gen: genChoisirGraphPoly, niveauDependant: true }
      ] },
    { id: 'C3', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Déterminer la pente d\'une droite (entière au niveau 1, rationnelle au niveau 2)',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genPenteLire },
        { type: 'directe', dMin: 2, dMax: 2, gen: genPenteExpression, niveauDependant: true },
        { type: 'directe', dMin: 3, dMax: 3, gen: genPenteDeuxPoints11, niveauDependant: true },
        { type: 'lecture', dMin: 3, dMax: 3, gen: genPenteGraphique, niveauDependant: true },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genPointManquant, niveauDependant: true }
      ] },
    { id: 'C4', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Déterminer l\'expression fonctionnelle à partir du graphique : b, ax, ax + b',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genExprGraphSimple },
        { type: 'lecture', dMin: 2, dMax: 3, gen: genExprGraphAffine, niveauDependant: true },
        { type: 'directe', dMin: 4, dMax: 4, gen: genExpressionDeuxPoints11, niveauDependant: true }
      ] },
    { id: 'C5', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Interpréter les coefficients : a et b de ax + b (niveau 2 : a(x – b)² + c)',
      modeles: [
        { type: 'choix', dMin: 1, dMax: 1, gen: B.gens.genCoefficientNul },
        { type: 'directe', dMin: 1, dMax: 1, gen: genOrdonneeExpression },
        { type: 'choix', dMin: 2, dMax: 2, gen: genSigneCoefficients, niveauDependant: true },
        { type: 'choix', dMin: 3, dMax: 3, gen: genComparerDroites, niveauDependant: true },
        { type: 'directe', dMin: 3, dMax: 3, gen: genSommetParabole, niveaux: [2] },
        { type: 'choix', dMin: 4, dMax: 4, gen: genSituationCoefficients11 },
        { type: 'relier', dMin: 4, dMax: 4, gen: genCanoniqueGraph, niveaux: [2] }
      ] },
    { id: 'C6', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Déterminer les intersections d\'un graphique avec les axes Ox et Oy',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genAxesLire },
        { type: 'directe', dMin: 2, dMax: 2, gen: genAxeOy, niveauDependant: true },
        { type: 'directe', dMin: 3, dMax: 3, gen: genAxeOx, niveauDependant: true },
        { type: 'lecture', dMin: 4, dMax: 4, gen: genAxesParabole },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genZeroSituation, niveauDependant: true }
      ] }
  ];

  return { objectifs: objectifs, outils: { repere: repere, srcQuad: srcQuad, ecrire: ecrire, hS: hS, hE: hE, fleche: fleche, fraction: fraction, nommer: nommer, st: st, js: js, tirerPente: tirerPente, sig: sig } };
});
