/*
 * fonctions/js/module-b.js — Module B : fonctions affines, linéaires et constantes (FA 10.1, 10e)
 * -----------------------------------------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : « FonctionsModuleB ». Node : require.
 *
 * Calibrage (10e) :
 *   difficulté 1 : lire f(x) sur un graphique (graduations de 1) ; x de 0 à 10, y au plus 50 ;
 *                  une seule lecture ou un seul calcul.
 *   difficulté 2 : f(x) = ax + b, a entier positif, b entier ; x de – 5 à 10 ; deux étapes.
 *   difficulté 3 : pente entière (négative possible) ou 0,5 ; trois étapes.
 *                  Niveau 2 en plus : pentes décimales (– 0,5 ; 1,5 ; – 2,5…).
 *   difficulté 4 : intersection de deux droites en coordonnées entières (fin de module).
 *                  Niveau 2 en plus : interpréter a et b dans une situation, comparer deux offres.
 *   Exclu en 10e N1 : pente décimale autre que 0,5, coefficients rationnels, interprétation de a et b.
 *   Tracer x² et – x² (tableau de valeurs) : prolongement en N1, évalué en N2.
 *
 * Champ « controle » : voir module-a.js. Les modèles marqués « niveauDependant » ont des
 * nombres ou des contenus différents au niveau 2.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'));
  else racine.FonctionsModuleB = fabrique(racine.FonctionsOutils);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O) {
  'use strict';

  var F = O.F, val = O.val, tn = O.tn, tnp = O.tnp, tm = O.tm, tc = O.tc, hm = O.hm, hf = O.hf;
  var R = O.RUBRIQUES, E = O.ERREURS, FICTIF = O.MENTION_FICTIVE;

  /* ---------- petits outils ---------- */
  function lettreChoix(i) { return 'ABCDEF'.charAt(i); }
  function image(l, x) { return val(l.a).fois(val(x)).plus(val(l.b)); }
  function src(l) { return O.srcAffine(l.a, l.b); }
  function hl(l, nom) { return hf(src(l), nom); }
  function sig(l) { return 'droite:a=' + tn(l.a).replace(/ /g, '') + ':b=' + tn(l.b).replace(/ /g, ''); }
  function sigTexte(x) { return String(val(x).valeur()); }
  function sigInter(l1, l2) { return 'inter:' + [sigTexte(l1.a) + ',' + sigTexte(l1.b), sigTexte(l2.a) + ',' + sigTexte(l2.b)].sort().join('|'); }
  function nommer(choix, prefixe) {
    return choix.map(function (ch, i) { ch.h = '<span class="nom-choix">' + prefixe + ' ' + lettreChoix(i) + '</span>' + ch.h; return ch; });
  }
  function repere(courbes, options) {
    options = options || {};
    return { xmin: options.xmin !== undefined ? options.xmin : -6, xmax: options.xmax !== undefined ? options.xmax : 6,
      ymin: options.ymin !== undefined ? options.ymin : -8, ymax: options.ymax !== undefined ? options.ymax : 8,
      gx: 1, gy: 1, lx: 2, ly: 2, courbes: courbes, points: options.points, description: options.description || 'Graphique dans un repère' };
  }

  /** Pente selon la difficulté et le niveau (fractions). options.graphe : pas de 0,25 (lecture). */
  function tirerPente(alea, d, niveau, options) {
    options = options || {};
    if (d <= 1) return val(alea.choix([1, 2, 3]));
    if (d === 2) return val(alea.choix([1, 2, 3, 4]));
    var n1 = [-3, -2, -1, 1, 2, 3, '0.5'];
    if (options.positive) n1 = [1, 2, 3, '0.5'];
    if (niveau === 2 && alea.suivant() < 0.5) {
      var n2 = options.positive ? ['1.5', '2.5'] : ['-0.5', '1.5', '-1.5', '2.5', '-2.5'];
      if (!options.graphe) n2 = n2.concat(options.positive ? ['0.25'] : ['0.25', '-0.25']);
      return val(alea.choix(n2));
    }
    return val(alea.choix(n1));
  }
  function estDecimale(a) { return !val(a).estEntier(); }

  /* =====================================================================
   * B1 : identifier et nommer (droite linéaire, affine, constante, parabole)
   * ===================================================================== */
  // Noms les plus précis (vocabulaire de la classe) : affine linéaire, affine constante, affine.
  var NOMS = { lineaire: 'affine linéaire', affine: 'affine', constante: 'affine constante', parabole: 'parabole' };
  var NOMS_CHOIX = { lineaire: 'fonction affine linéaire', affine: 'fonction affine', constante: 'fonction affine constante', parabole: 'fonction quadratique (son graphique est une parabole)' };
  var EXPLICATION = {
    lineaire: 'Le graphique est une droite qui passe par l\'origine (0 ; 0) : c\'est une fonction affine linéaire, f(x) = ax.',
    affine: 'Le graphique est une droite qui ne passe pas par l\'origine et n\'est pas horizontale : c\'est une fonction affine, f(x) = ax + b avec b ≠ 0. ' + E.affineOrigine,
    constante: 'Le graphique est une droite horizontale : f(x) a toujours la même valeur. C\'est une fonction affine constante, f(x) = b.',
    parabole: 'Le graphique n\'est pas une droite : c\'est une parabole, le graphique d\'une fonction quadratique (par exemple f(x) = x² ou f(x) = – x²).'
  };
  function choixNoms(juste) {
    return ['lineaire', 'affine', 'constante', 'parabole'].map(function (t) {
      return { h: NOMS_CHOIX[t], juste: t === juste, param: t, message: t === juste ? '' : EXPLICATION[juste] };
    });
  }
  function tirerFonctionType(alea, type) {
    if (type === 'lineaire') return { a: val(alea.choix([1, 2, 3, 4])), b: val(0) };
    if (type === 'affine') return { a: val(alea.choix([1, 2, 3])), b: val(alea.entierNonNul(-5, 5)) };
    if (type === 'constante') return { a: val(0), b: val(alea.entierNonNul(-5, 6)) };
    return { carre: alea.choix([1, -1]) };
  }
  function srcType(f) { return f.carre ? (f.carre > 0 ? 'x^2' : '-x^2') : src(f); }

  /** D1 — nommer la représentation d'un graphique. */
  function genNomGraphique(alea, d) {
    var type = alea.choix(['lineaire', 'affine', 'constante', 'parabole']);
    var f = tirerFonctionType(alea, type);
    var g = repere([{ src: srcType(f) }], { ymin: -8, ymax: 10, description: 'Courbe d\'une fonction dans un repère' });
    return {
      type: 'choix',
      enonce: '<p>Voici le graphique d\'une fonction f.</p>' + O.graphiqueHtml(g) + '<p>Quelle fonction ce graphique représente-t-il ?</p>',
      consigne: 'Choisis le nom le plus précis.',
      indice: 'Est-ce une droite ? Si oui : passe-t-elle par l\'origine (0 ; 0) (affine linéaire) ? Est-elle horizontale (affine constante) ?',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choixNoms(type)),
      etapes: [{ texte: EXPLICATION[type] }],
      verification: type === 'parabole' ? '' : 'Contrôle : le graphique coupe l\'axe vertical au point ' + hm(tc(0, f.b)) + '.',
      rubrique: type === 'parabole' ? R.quadratique : R[type === 'lineaire' ? 'lineaire' : type === 'constante' ? 'constante' : 'affine'],
      signatures: f.carre ? [] : [sig(f)],
      controle: { ops: 1, xs: [], ys: [], coefs: f.carre ? [f.carre] : [f.a.toString(), f.b.toString()], calc: { genre: 'choix-nom', fonction: f.carre ? { carre: f.carre } : { a: f.a.toString(), b: f.b.toString() } } }
    };
  }

  /** D1 — nommer une fonction donnée par son expression. */
  function genNomExpression(alea, d) {
    var type = alea.choix(['lineaire', 'affine', 'constante', 'parabole']);
    var f = tirerFonctionType(alea, type);
    return {
      type: 'choix',
      enonce: '<p>Quelle est la nature de la fonction suivante ?</p><p class="calcul">' + hf(srcType(f)) + '</p>',
      consigne: 'Choisis le nom le plus précis.',
      indice: 'f(x) = ax : affine linéaire. f(x) = ax + b avec b ≠ 0 : affine. f(x) = b : affine constante. Avec x² : parabole.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choixNoms(type)),
      etapes: [{ texte: { lineaire: 'L\'expression est de la forme ax (pas de nombre ajouté) : fonction affine linéaire, son graphique passe par l\'origine.', affine: 'L\'expression est de la forme ax + b avec b ≠ 0 : fonction affine.', constante: 'L\'expression ne contient pas x : f(x) vaut toujours ' + (f.b ? tn(f.b) : '') + ', fonction affine constante (droite horizontale).', parabole: 'L\'expression contient x² : le graphique est une parabole.' }[type] }],
      verification: '',
      rubrique: type === 'parabole' ? R.quadratique : R[type === 'lineaire' ? 'lineaire' : type === 'constante' ? 'constante' : 'affine'],
      controle: { ops: 1, xs: [], ys: [], coefs: f.carre ? [f.carre] : [f.a.toString(), f.b.toString()], calc: { genre: 'choix-nom', fonction: f.carre ? { carre: f.carre } : { a: f.a.toString(), b: f.b.toString() } } }
    };
  }

  /** D2 — vrai ou faux sur l'origine, l'ordonnée à l'origine, une droite constante. */
  function genVraiFauxOrigine(alea, d) {
    var a = alea.entier(1, 5), b = alea.entierNonNul(-6, 6);
    var cas = alea.choix(['origine', 'origineLin', 'pointB', 'pointInverse']);
    var l = { a: val(a), b: val(cas === 'origineLin' ? 0 : b) };
    var enonce, vrai, opts, etapes;
    if (cas === 'origine' || cas === 'origineLin') {
      vrai = cas === 'origineLin';
      enonce = '« Le graphique de ' + hl(l) + ' passe par l\'origine (0 ; 0). »';
      opts = O.optionsVraiFaux(alea, {
        vrai: vrai,
        justeVrai: hm('f(0) = ' + tn(a) + ' · 0 = 0') + ' : la fonction est affine linéaire.',
        justeFaux: hm('f(0) = ' + tn(a) + ' · 0 + ' + tnp(b) + ' = ' + tn(b)) + ' : la droite passe par ' + hm(tc(0, b)) + ', pas par l\'origine.',
        autresVrai: ['toutes les droites passent par l\'origine.', 'le coefficient de x est positif.'],
        autresFaux: ['le coefficient de x n\'est pas 1.', 'une droite ne passe jamais par l\'origine.'],
        messageFaux: E.affineOrigine
      });
      etapes = [{ texte: 'On calcule f(0), l\'ordonnée du point d\'abscisse 0.', calcul: hm('f(0) = ' + tn(l.b)) }, { texte: vrai ? 'f(0) = 0 : la droite passe par l\'origine.' : 'f(0) ≠ 0 : la droite ne passe pas par l\'origine. ' + E.affineOrigine }];
    } else {
      vrai = cas === 'pointB';
      var px = vrai ? 0 : b, py = vrai ? b : 0;
      enonce = '« Le point ' + hm(tc(px, py)) + ' appartient au graphique de ' + hl(l) + '. »';
      var fpx = image(l, px);
      opts = O.optionsVraiFaux(alea, {
        vrai: vrai,
        justeVrai: 'pour x = 0, ' + hm('f(0) = ' + tn(b)) + ' : c\'est l\'ordonnée à l\'origine.',
        justeFaux: hm('f(' + tn(px) + ') = ' + tn(fpx)) + ' et non 0. Le point sur l\'axe vertical est ' + hm(tc(0, b)) + '.',
        autresVrai: ['b = ' + tn(b) + ' se place sur l\'axe horizontal.', 'les deux coordonnées contiennent le nombre ' + tn(b) + '.'],
        autresFaux: ['un point d\'une fonction affine n\'a jamais de coordonnée nulle.', 'le coefficient de x vaut ' + tn(a) + '.'],
        messageFaux: E.inverse + ' L\'ordonnée à l\'origine b donne le point (0 ; b).'
      });
      etapes = [{ texte: 'On calcule l\'image de l\'abscisse du point.', calcul: hm('f(' + tn(px) + ') = ' + tn(a) + ' · ' + tnp(px) + ' + ' + tnp(b) + ' = ' + tn(fpx)) }, { texte: vrai ? 'On trouve bien ' + tn(py) + '.' : 'On trouve ' + tn(fpx) + ', pas ' + tn(py) + '.' }];
    }
    return {
      type: 'vraifaux',
      enonce: '<p>' + enonce + ' Vrai ou faux ?</p>',
      indice: 'Calcule f(0) : c\'est l\'ordonnée du point où la droite coupe l\'axe vertical.',
      reponse: { type: 'choix' }, choix: opts,
      etapes: etapes,
      verification: 'Le graphique de ' + hl(l) + ' coupe l\'axe vertical en ' + hm(tc(0, l.b)) + '.',
      rubrique: R.affine,
      controle: { ops: 2, xs: [0], ys: [l.b.toString()], coefs: [a, l.b.toString()], calc: { genre: 'choix' } }
    };
  }

  /** D3 — nommer une fonction à partir d'un tableau de valeurs. */
  function genNomTableau(alea, d, ctx) {
    var type = alea.choix(['lineaire', 'affine', 'constante', 'parabole']);
    var xs = alea.choix([[-2, -1, 0, 1, 2], [-4, -2, 0, 2, 4], [0, 1, 2, 3, 4]]);
    var a = tirerPente(alea, 3, ctx.niveau), b = val(alea.entierNonNul(-5, 5));
    var ys, f;
    if (type === 'parabole') { var sg = alea.choix([1, -1]); f = { carre: sg }; ys = xs.map(function (x) { return sg * x * x; }); }
    else { f = { a: type === 'constante' ? val(0) : a, b: type === 'lineaire' ? val(0) : b }; ys = xs.map(function (x) { return image(f, x); }); }
    if (!f.carre && xs.some(function (x) { return !image(f, x).estDecimale(); })) xs = [-4, -2, 0, 2, 4];
    if (!f.carre) ys = xs.map(function (x) { return image(f, x); });
    var dif = ys.slice(1).map(function (y, i) { return val(y).moins(val(ys[i])); });
    return {
      type: 'tableau',
      enonce: '<p>Voici le tableau de valeurs d\'une fonction f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>De quelle fonction s\'agit-il ?</p>',
      consigne: 'Choisis le nom le plus précis.',
      indice: 'Quand x augmente toujours du même pas, f(x) change-t-il toujours de la même quantité ? Que vaut f(0) ?',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choixNoms(type)),
      etapes: [
        { texte: 'On regarde de combien f(x) change d\'une colonne à la suivante.', calcul: hm(dif.map(tn).join(' ; ')) },
        { texte: type === 'parabole' ? 'Les variations ne sont pas toutes égales : ce n\'est pas une droite.' : 'Les variations sont toutes égales : c\'est une droite.' },
        { texte: type === 'parabole' ? 'Les valeurs sont symétriques (f(– 2) = f(2)) : c\'est une parabole.' : type === 'constante' ? 'f(x) ne change pas : fonction affine constante.' : type === 'lineaire' ? 'f(0) = 0 : la droite passe par l\'origine, c\'est une fonction affine linéaire.' : 'f(0) = ' + tn(b) + ' ≠ 0 : c\'est une fonction affine (non linéaire).' }
      ],
      verification: '',
      rubrique: R.tableau,
      controle: { ops: 3, xs: xs, ys: ys.map(String), coefs: f.carre ? [f.carre] : [f.a.toString(), f.b.toString()], calc: { genre: 'choix-nom', fonction: f.carre ? { carre: f.carre } : { a: f.a.toString(), b: f.b.toString() } } }
    };
  }

  /** D4 — repérer l'erreur d'un élève qui classe des fonctions écrites sous des formes variées. */
  function genErreurClassement(alea, d) {
    var nom = alea.choix(O.PRENOMS);
    var k = alea.entier(2, 5), m = alea.entier(1, 6), c = alea.entier(2, 9);
    var catalogue = [
      { h: 'f(x) = ' + m + ' + ' + k + 'x', type: 'affine', pourquoi: 'c\'est ' + k + 'x + ' + m + ', avec b = ' + m + ' ≠ 0' },
      { h: 'g(x) = ' + k + '(x + ' + m + ')', type: 'affine', pourquoi: 'en développant : ' + k + 'x + ' + (k * m) },
      { h: 'h(x) = x · x', type: 'parabole', pourquoi: 'x · x = x²' },
      { h: 'k(x) = x : 2', type: 'lineaire', pourquoi: 'x : 2 = 0,5x, sans nombre ajouté' },
      { h: 'm(x) = ' + c + ' + 0 · x', type: 'constante', pourquoi: '0 · x = 0, donc m(x) = ' + c },
      { h: 'p(x) = ' + k + 'x + ' + m + ' – ' + m, type: 'lineaire', pourquoi: 'les nombres s\'annulent : p(x) = ' + k + 'x' }
    ];
    var trois = alea.melanger(catalogue).slice(0, 3);
    var toutJuste = alea.suivant() < 0.2;
    var fausse = toutJuste ? -1 : alea.entier(0, 2);
    var types = ['lineaire', 'affine', 'constante', 'parabole'];
    var affirm = trois.map(function (f, i) {
      var dit = i === fausse ? alea.choix(types.filter(function (t) { return t !== f.type; })) : f.type;
      return { f: f, dit: dit };
    });
    var choix = affirm.map(function (af, i) {
      return { h: hm(af.f.h) + ' : « ' + NOMS[af.dit] + ' »', juste: i === fausse, message: i === fausse ? '' : 'Ce classement est juste : ' + af.f.pourquoi + '.' };
    });
    choix.push({ h: 'Les trois classements sont justes.', juste: toutJuste, message: toutJuste ? '' : 'Un classement est faux : récris chaque expression sous la forme ax + b (ou avec x²).' });
    return {
      type: 'erreur',
      enonce: '<p>' + nom + ' classe ces fonctions (affine linéaire, affine constante, affine ou parabole).</p><p>Quel classement est faux ? (Il se peut qu\'ils soient tous justes.)</p>',
      indice: 'Récris chaque expression sous la forme la plus simple : ax, ax + b, b ou avec x².',
      reponse: { type: 'choix' }, choix: choix,
      etapes: affirm.map(function (af) { return { texte: hm(af.f.h) + ' : ' + af.f.pourquoi + ' → ' + NOMS[af.f.type] + (af.dit === af.f.type ? ' (juste).' : ' (' + nom + ' a écrit « ' + NOMS[af.dit] + ' »).') }; }),
      verification: '',
      rubrique: R.affine,
      controle: { ops: 4, xs: [], ys: [], coefs: [k, m, c], calc: { genre: 'choix' } }
    };
  }

  /* =====================================================================
   * B2 : passer de l'expression au tableau et au graphique, et inversement
   * ===================================================================== */

  /** D1 — lire une image sur un graphique (droite ou parabole), graduations de 1. */
  function genLireImage(alea, d) {
    var parabole = alea.suivant() < 0.3, f, x0, y0, s;
    if (parabole) { f = { carre: 1 }; x0 = alea.entier(1, 4); y0 = x0 * x0; s = 'x^2'; }
    else {
      do { f = { a: val(alea.entier(1, 3)), b: val(alea.entier(0, 5)) }; } while (sig(f) === 'droite:a=2:b=1');
      do { x0 = alea.entier(1, 6); y0 = image(f, x0).valeur(); } while (y0 > 20);
      s = src(f);
    }
    var g = { xmin: 0, xmax: 8, ymin: 0, ymax: 20, gx: 1, gy: 1, lx: 1, ly: 2, courbes: [{ src: s }], description: 'Graphique d\'une fonction' };
    var pieges = [];
    for (var x = 0; x <= 8; x++) {
      var v = parabole ? x * x : image(f, x).valeur();
      if (v === x0 && x !== y0) pieges.push({ valeur: x, message: E.axes });
    }
    pieges.push({ valeur: x0, message: 'Tu as donné la valeur de x. L\'image se lit sur l\'axe vertical.' });
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique d\'une fonction f.</p>' + O.graphiqueHtml(g) + '<p>Lis sur le graphique la valeur de ' + hm('f(' + x0 + ')') + '.</p>',
      indice: 'Pars de ' + x0 + ' sur l\'axe horizontal, monte jusqu\'à la courbe, puis va horizontalement jusqu\'à l\'axe vertical. Un carreau vaut 1.',
      reponse: { type: 'nombre', valeur: y0 },
      pieges: pieges,
      etapes: [{ texte: 'De x = ' + x0 + ' sur l\'axe horizontal, on monte jusqu\'à la courbe et on lit l\'ordonnée sur l\'axe vertical.', calcul: hm('f(' + x0 + ') = ' + y0) }],
      verification: 'Le point ' + hm(tc(x0, y0)) + ' est sur la courbe.',
      rubrique: R.graphique,
      signatures: parabole ? [] : [sig(f)],
      controle: { ops: 1, xs: [x0], ys: [y0], coefs: parabole ? [1] : [f.a.toString(), f.b.toString()], grad: [1, 1], calc: parabole ? { genre: 'carre', s: 1, x: x0 } : { genre: 'valeur', a: f.a.toString(), b: f.b.toString(), x: x0 } }
    };
  }

  /** D1 — image par une fonction linéaire (un calcul). */
  function genImageLineaire(alea, d) {
    var a, x0;
    do { a = alea.entier(2, 9); x0 = alea.entier(2, 10); } while (a * x0 > 50);
    return {
      type: 'directe',
      enonce: '<p>Pour la fonction linéaire ' + hf(a + 'x') + ', calcule ' + hm('f(' + x0 + ')') + '.</p>',
      indice: hm(a + 'x') + ' veut dire ' + a + ' · x.',
      reponse: { type: 'nombre', valeur: a * x0 },
      pieges: [{ valeur: a + x0, message: a + 'x signifie ' + a + ' · x : il faut multiplier.' }],
      etapes: [{ texte: 'On remplace x par ' + x0 + '.', calcul: hm('f(' + x0 + ') = ' + a + ' · ' + x0 + ' = ' + (a * x0)) }],
      verification: 'Le point ' + hm(tc(x0, a * x0)) + ' est sur la droite de cette fonction affine linéaire, qui passe aussi par (0 ; 0).',
      rubrique: R.lineaire,
      controle: { ops: 1, xs: [x0], ys: [a * x0], coefs: [a, 0], calc: { genre: 'valeur', a: a, b: 0, x: x0 } }
    };
  }

  /** D2 — de l'expression au tableau (trois cases). */
  function genExprVersTableau(alea, d) {
    var l = { a: val(alea.entier(1, 5)), b: val(alea.entierNonNul(-6, 6)) };
    var xs = alea.melanger([-5, -3, -2, -1, 0, 1, 2, 3, 4, 6]).slice(0, 3).sort(function (u, v) { return u - v; });
    var ys = xs.map(function (x) { return image(l, x); });
    return {
      type: 'tableau',
      enonce: '<p>Complète le tableau de valeurs de ' + hl(l) + '.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ['A', 'B', 'C'] }]),
      consigne: 'Écris A ; B ; C.',
      indice: 'Pour chaque colonne, remplace x par le nombre du haut (entre parenthèses s\'il est négatif).',
      reponse: { type: 'liste', valeurs: ys, noms: ['A', 'B', 'C'] },
      pieges: [
        { liste: xs.map(function (x) { return val(l.a).fois(x); }), message: 'Tu as oublié d\'ajouter b = ' + tn(l.b) + '.' },
        { liste: xs.map(function (x) { return val(l.b).fois(x).plus(l.a); }), message: E.ordonneePente }
      ],
      etapes: [
        { texte: 'On remplace x par chaque valeur.', calcul: hm(xs.map(function (x) { return 'f(' + tn(x) + ') = ' + tn(l.a) + ' · ' + tnp(x) + ' + ' + tnp(l.b); }).join(' ; ')) },
        { texte: 'On calcule.', calcul: hm(xs.map(function (x, i) { return 'f(' + tn(x) + ') = ' + tn(ys[i]); }).join(' ; ')) }
      ],
      verification: 'Contrôle : quand x augmente de 1, f(x) augmente de ' + tn(l.a) + ' (la pente).',
      rubrique: R.tableau,
      controle: { ops: 2, xs: xs, ys: ys.map(String), coefs: [l.a.toString(), l.b.toString()], calc: { genre: 'liste', a: l.a.toString(), b: l.b.toString(), xs: xs } }
    };
  }

  /** D2 et D4 — du graphique à l'expression (lire b, puis la pente). */
  function genGraphiqueVersExpression(alea, d, ctx) {
    var l;
    do {
      l = { a: d >= 4 ? tirerPente(alea, 3, ctx.niveau, { graphe: true }) : val(alea.entier(1, 3)), b: val(alea.entierNonNul(-4, 4)) };
      if (d >= 4 && l.a.signe() > 0 && (ctx.niveau === 2 || l.a.estEntier()) && alea.suivant() < 0.6) l.a = l.a.oppose();
    } while (sig(l) === 'droite:a=2:b=1' || l.a.egal(l.b));
    var pas = l.a.estEntier() ? 1 : 2;
    var pts = [{ x: 0, y: l.b.valeur(), nom: 'A' }, { x: pas, y: image(l, pas).valeur(), nom: 'B' }];
    var g = repere([{ src: src(l) }], { points: pts, description: 'Droite passant par deux points marqués' });
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique d\'une fonction affine f. Les points A et B, sur la droite, peuvent t\'aider.</p>' + O.graphiqueHtml(g) + '<p>Écris l\'expression fonctionnelle de f.</p>',
      consigne: 'Écris seulement le membre de droite, par exemple 2x – 3.',
      prefixe: 'f(x) =',
      indice: 'Lis quelques points du graphique et écris-les dans un tableau de valeurs (x ; f(x)). Que vaut f(0) ? De combien f(x) change-t-il quand x augmente de 1 ?',
      reponse: { type: 'expr', attendu: src(l) },
      pieges: [
        { src: O.srcAffine(l.b, l.a), message: E.ordonneePente },
        { src: O.srcAffine(l.a.oppose(), l.b), message: E.penteSigne },
        { src: O.srcAffine(l.a, l.b.oppose()), message: 'Attention au signe de b : la droite coupe l\'axe vertical en ' + hm(tc(0, l.b)) + '.' }
      ],
      etapes: [
        { texte: 'On lit des points du graphique et on les écrit dans un tableau de valeurs.', calcul: O.tableauHtml([{ entete: 'x', valeurs: [0, pas, 2 * pas] }, { entete: 'f(x)', valeurs: [l.b, image(l, pas), image(l, 2 * pas)] }]) },
        { texte: 'Pour x = 0, f(0) = ' + tn(l.b) + ' : c\'est le nombre ajouté. Quand x augmente de ' + pas + ', f(x) change de ' + tn(l.a.fois(pas)) + (pas > 1 ? ', donc de ' + tn(l.a) + ' quand x augmente de 1' : '') + ' : c\'est le nombre qui multiplie x.', calcul: hm('f(x) = ' + tn(l.a) + ' · x + ' + tnp(l.b)) },
        { texte: 'On écrit l\'expression.', calcul: hl(l) }
      ],
      verification: 'Contrôle avec B : ' + hm('f(' + pas + ') = ' + tn(l.a) + ' · ' + pas + ' + ' + tnp(l.b) + ' = ' + tn(image(l, pas))) + '.',
      rubrique: R.affine,
      signatures: [sig(l)],
      controle: { ops: d >= 4 ? 3 : 2, xs: [0, pas], ys: [l.b.toString(), image(l, pas).toString()], coefs: [l.a.toString(), l.b.toString()], grad: [1, 1], calc: { genre: 'expr', a: l.a.toString(), b: l.b.toString() } }
    };
  }

  /** D3 — de l'expression au graphique (choisir parmi trois). */
  function genExprVersGraphique(alea, d, ctx) {
    var l;
    do { l = { a: tirerPente(alea, 3, ctx.niveau, { graphe: true }), b: val(alea.entierNonNul(-4, 4)) }; } while (l.a.abs().egal(l.b.abs()) || sig(l) === 'droite:a=2:b=1');
    var autres = [
      { l: { a: l.b, b: l.a }, message: E.ordonneePente },
      { l: { a: l.a.oppose(), b: l.b }, message: E.penteSigne }
    ];
    if (!l.a.estEntier()) autres[0] = { l: { a: l.a, b: l.b.oppose() }, message: 'Attention au signe de b : le graphique doit couper l\'axe vertical en ' + hm(tc(0, l.b)) + '.' };
    var choix = [{ h: O.graphiqueHtml(repere([{ src: src(l) }])), juste: true, param: [l.a.toString(), l.b.toString()] }].concat(autres.map(function (o) {
      return { h: O.graphiqueHtml(repere([{ src: src(o.l) }])), juste: false, param: [o.l.a.toString(), o.l.b.toString()], message: o.message };
    }));
    return {
      type: 'relier',
      enonce: '<p>Quel graphique représente la fonction ' + hl(l) + ' ?</p>',
      indice: 'Repère d\'abord le point (0 ; ' + tn(l.b) + ') sur l\'axe vertical. Puis : la droite monte-t-elle ou descend-elle, et de combien pour 1 vers la droite ?',
      reponse: { type: 'choix' }, choix: nommer(O.melanger(alea, choix), 'Graphique'), choixGraphiques: true,
      etapes: [
        { texte: 'L\'ordonnée à l\'origine est b = ' + tn(l.b) + ' : la droite passe par ' + hm(tc(0, l.b)) + '.' },
        { texte: 'La pente est a = ' + tn(l.a) + ' : quand x augmente de 1, f(x) ' + (l.a.signe() > 0 ? 'augmente' : 'diminue') + ' de ' + tn(l.a.abs()) + '.' },
        { texte: 'Un deuxième point : ' + hm('f(2) = ' + tn(image(l, 2))) + ', donc ' + hm(tc(2, image(l, 2))) + '.' }
      ],
      verification: 'Contrôle sur le graphique choisi : il passe par ' + hm(tc(0, l.b)) + ' et par ' + hm(tc(2, image(l, 2))) + '.',
      rubrique: R.graphique,
      signatures: [sig(l)],
      controle: { ops: 3, xs: [0, 2], ys: [l.b.toString(), image(l, 2).toString()], coefs: [l.a.toString(), l.b.toString()], grad: [1, 1], calc: { genre: 'choix-param', attendu: [l.a.toString(), l.b.toString()], contexte: { a: l.a.toString(), b: l.b.toString() } } }
    };
  }

  /** Deux points entiers d'une droite de pente a (fractions), dans le repère. */
  function deuxPoints(alea, l) {
    var pas = l.a.fois(4).estEntier() && !l.a.fois(2).estEntier() ? 4 : l.a.estEntier() ? alea.entier(1, 3) : 2;
    var x1, x2, essais = 0;
    do {
      x1 = alea.entier(-5, 3); x2 = x1 + pas * alea.entier(1, 2); essais++;
    } while ((Math.abs(image(l, x1).valeur()) > 9 || Math.abs(image(l, x2).valeur()) > 9 || x2 > 6 || x1 === 0) && essais < 200);
    return [[x1, image(l, x1)], [x2, image(l, x2)]];
  }

  /** D3 — du graphique au tableau de valeurs (lire trois images). */
  function genGraphiqueVersTableau(alea, d, ctx) {
    var l;
    do { l = { a: tirerPente(alea, 3, ctx.niveau, { graphe: true }), b: val(alea.entier(-4, 4)) }; } while (sig(l) === 'droite:a=2:b=1');
    var cand = [];
    for (var x = -5; x <= 5; x++) { var y = image(l, x); if (y.estEntier() && Math.abs(y.valeur()) <= 7) cand.push(x); }
    var xs = alea.melanger(cand).slice(0, 3).sort(function (u, v) { return u - v; });
    var ys = xs.map(function (x) { return image(l, x); });
    var g = repere([{ src: src(l) }], { description: 'Droite d\'une fonction affine' });
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique d\'une fonction affine f.</p>' + O.graphiqueHtml(g) + '<p>Complète son tableau de valeurs.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ['A', 'B', 'C'] }]),
      consigne: 'Écris A ; B ; C.',
      indice: 'Pour chaque x, pars de l\'axe horizontal, va (vers le haut ou vers le bas) jusqu\'à la droite, puis lis la valeur sur l\'axe vertical.',
      reponse: { type: 'liste', valeurs: ys, noms: ['A', 'B', 'C'] },
      pieges: [{ liste: ys.map(function (y) { return y.oppose(); }), message: 'Attention aux signes : un point sous l\'axe horizontal a une ordonnée négative.' }],
      etapes: [
        { texte: 'Pour chaque valeur de x, on lit l\'ordonnée du point de la droite.', calcul: hm(xs.map(function (x, i) { return 'f(' + tn(x) + ') = ' + tn(ys[i]); }).join(' ; ')) },
        { texte: 'On contrôle la régularité : quand x augmente de 1, f(x) change toujours de ' + tn(l.a) + '.' },
        { texte: 'On contrôle avec l\'expression de la droite.', calcul: hl(l) }
      ],
      verification: '',
      rubrique: R.tableau,
      signatures: [sig(l)],
      controle: { ops: 3, xs: xs, ys: ys.map(String), coefs: [l.a.toString(), l.b.toString()], grad: [1, 1], calc: { genre: 'liste', a: l.a.toString(), b: l.b.toString(), xs: xs } }
    };
  }

  /** D4 — du tableau de valeurs (x non consécutifs) à l'expression. */
  function genTableauVersExpression(alea, d, ctx) {
    var l, xs, essais = 0;
    do {
      l = { a: tirerPente(alea, 3, ctx.niveau, { graphe: true }), b: val(alea.entierNonNul(-6, 6)) };
      if (l.a.signe() > 0 && (ctx.niveau === 2 || l.a.estEntier()) && alea.suivant() < 0.5) l.a = l.a.oppose();
      xs = alea.melanger([-4, -2, -1, 1, 2, 3, 4, 6]).slice(0, 4).sort(function (u, v) { return u - v; });
      essais++;
    } while ((sig(l) === 'droite:a=2:b=1' || l.a.egal(l.b) || xs.some(function (x) { return !image(l, x).estEntier(); })) && essais < 300);
    var ys = xs.map(function (x) { return image(l, x); });
    var dx = xs[1] - xs[0], dy = ys[1].moins(ys[0]);
    return {
      type: 'tableau',
      enonce: '<p>Voici le tableau de valeurs d\'une fonction affine f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>Écris son expression fonctionnelle.</p>',
      consigne: 'Écris seulement le membre de droite, par exemple 2x – 3.',
      prefixe: 'f(x) =',
      indice: 'Quand x augmente de ' + dx + ' (entre les deux premières colonnes), de combien f(x) change-t-il ? Déduis-en le changement pour 1, puis calcule f(0).',
      reponse: { type: 'expr', attendu: src(l) },
      pieges: [
        { src: O.srcAffine(l.a, 0), message: 'Il manque le nombre ajouté : f(0) ne vaut pas 0 ici.' },
        { src: O.srcAffine(l.b, l.a), message: 'Tu as inversé le nombre qui multiplie x et le nombre ajouté.' },
        { src: O.srcAffine(l.a.oppose(), l.b), message: 'Attention au signe : ici, quand x augmente, f(x) ' + (l.a.signe() > 0 ? 'augmente' : 'diminue') + '.' }
      ],
      etapes: [
        { texte: 'Entre les deux premières colonnes, x augmente de ' + dx + ' et f(x) change de ' + tn(dy) + '.', calcul: hm(tn(dy) + ' : ' + dx + ' = ' + tn(l.a)) },
        { texte: 'Quand x augmente de 1, f(x) change de ' + tn(l.a) + ' : c\'est le nombre qui multiplie x. On calcule f(0) depuis la première colonne.', calcul: hm('f(0) = ' + tn(ys[0]) + ' – ' + tnp(l.a) + ' · ' + tnp(xs[0]) + ' = ' + tn(l.b)) },
        { texte: 'On écrit l\'expression.', calcul: hl(l) }
      ],
      verification: 'Contrôle avec la dernière colonne : ' + hm('f(' + tn(xs[3]) + ') = ' + tn(ys[3])) + '.',
      rubrique: R.tableau,
      signatures: [sig(l)],
      controle: { ops: 3, xs: xs, ys: ys.map(String), coefs: [l.a.toString(), l.b.toString()], calc: { genre: 'expr', a: l.a.toString(), b: l.b.toString() } }
    };
  }

  /** D3 — calculer la pente à partir de deux points. */
  function genPenteDeuxPoints(alea, d, ctx) {
    var l = { a: tirerPente(alea, 3, ctx.niveau), b: val(alea.entier(-4, 4)) };
    var pts = deuxPoints(alea, l);
    var A = pts[0], B = pts[1];
    var dy = val(B[1]).moins(A[1]), dx = val(B[0] - A[0]);
    var p = dy.divise(dx);
    return {
      type: 'directe',
      enonce: '<p>Une droite passe par les points ' + hm('A' + tc(A[0], A[1])) + ' et ' + hm('B' + tc(B[0], B[1])) + '.</p><p>Calcule sa pente p.</p>',
      indice: hm('p = (y₂ – y₁) : (x₂ – x₁)') + ' : la variation de y divisée par la variation de x, avec les points dans le même ordre.',
      reponse: { type: 'nombre', valeur: p },
      pieges: [
        { valeur: dx.divise(dy), message: E.penteInverse },
        { valeur: p.oppose(), message: E.penteOrdre + ' ' + E.penteSigne },
        { valeur: l.b, message: E.penteB }
      ],
      etapes: [
        { texte: 'Variation de y (de A à B).', calcul: hm('y₂ – y₁ = ' + tn(B[1]) + ' – ' + tnp(A[1]) + ' = ' + tn(dy)) },
        { texte: 'Variation de x (de A à B, même ordre).', calcul: hm('x₂ – x₁ = ' + tn(B[0]) + ' – ' + tnp(A[0]) + ' = ' + tn(dx)) },
        { texte: 'On divise.', calcul: hm('p = ' + tn(dy) + ' : ' + tn(dx) + ' = ' + tn(p)) }
      ],
      verification: 'Contrôle : en partant de A, on avance de ' + tn(dx) + ' et on ' + (p.signe() >= 0 ? 'monte' : 'descend') + ' de ' + tn(dy.abs()) + ' : on arrive bien en B.',
      rubrique: R.pente,
      controle: { ops: 3, xs: [A[0], B[0]], ys: [A[1].toString(), B[1].toString()], coefs: [p.toString()], calc: { genre: 'pente', x1: A[0], y1: A[1].toString(), x2: B[0], y2: B[1].toString() } }
    };
  }

  /** D4 — expression de la droite passant par deux points. */
  function genExpressionDeuxPoints(alea, d, ctx) {
    var l;
    do { l = { a: tirerPente(alea, 3, ctx.niveau), b: val(alea.entierNonNul(-6, 6)) }; } while (sig(l) === 'droite:a=2:b=1');
    var pts = deuxPoints(alea, l), A = pts[0], B = pts[1];
    var dy = val(B[1]).moins(A[1]), dx = val(B[0] - A[0]);
    return {
      type: 'directe',
      enonce: '<p>Une fonction affine f a pour graphique la droite qui passe par ' + hm('A' + tc(A[0], A[1])) + ' et ' + hm('B' + tc(B[0], B[1])) + '.</p><p>Écris son expression fonctionnelle.</p>',
      consigne: 'Écris seulement le membre de droite.',
      prefixe: 'f(x) =',
      indice: 'Calcule d\'abord la pente a = (y₂ – y₁) : (x₂ – x₁). Puis trouve b avec un des points : f(x₁) = y₁.',
      reponse: { type: 'expr', attendu: src(l) },
      pieges: [
        { src: O.srcAffine(l.a, 0), message: 'Il manque b : ' + E.affineOrigine },
        { src: O.srcAffine(dx.divise(dy), l.b), message: E.penteInverse },
        { src: O.srcAffine(l.a.oppose(), l.b), message: E.penteSigne }
      ],
      etapes: [
        { texte: 'Pente.', calcul: hm('a = (' + tn(B[1]) + ' – ' + tnp(A[1]) + ') : (' + tn(B[0]) + ' – ' + tnp(A[0]) + ') = ' + tn(dy) + ' : ' + tn(dx) + ' = ' + tn(l.a)) },
        { texte: 'On remplace x et f(x) par les coordonnées de A.', calcul: hm(tn(A[1]) + ' = ' + tn(l.a) + ' · ' + tnp(A[0]) + ' + b') },
        { texte: 'On trouve b.', calcul: hm('b = ' + tn(A[1]) + ' – ' + tnp(l.a.fois(A[0])) + ' = ' + tn(l.b)) },
        { texte: 'Expression :', calcul: hl(l) }
      ],
      verification: 'Contrôle avec B : ' + hm('f(' + tn(B[0]) + ') = ' + tn(image(l, B[0]))) + '.',
      rubrique: R.affine,
      signatures: [sig(l)],
      controle: { ops: 4, xs: [A[0], B[0]], ys: [A[1].toString(), B[1].toString()], coefs: [l.a.toString(), l.b.toString()], calc: { genre: 'expr', a: l.a.toString(), b: l.b.toString() } }
    };
  }

  /* =====================================================================
   * B3 : intersection de deux droites
   * ===================================================================== */

  /** Deux droites qui se coupent en (x0 ; y0), pentes données par tirer(). */
  function deuxDroites(alea, tirer, borne) {
    for (var k = 0; k < 500; k++) {
      var x0 = alea.entier(borne.xmin, borne.xmax), y0 = alea.entier(borne.ymin, borne.ymax);
      var a1 = tirer(), a2 = tirer();
      if (a1.egal(a2)) continue;
      var l1 = { a: a1, b: val(y0).moins(a1.fois(x0)) }, l2 = { a: a2, b: val(y0).moins(a2.fois(x0)) };
      if (!l1.b.estEntier() || !l2.b.estEntier()) continue;
      if (Math.abs(l1.b.valeur()) > borne.bmax || Math.abs(l2.b.valeur()) > borne.bmax) continue;
      if (borne.positifs && (l1.b.signe() < 0 || l2.b.signe() < 0)) continue;
      if (O.estReference([sigInter(l1, l2)])) continue;
      return { l1: l1, l2: l2, x: x0, y: y0 };
    }
    throw new Error('Pas de droites trouvées');
  }

  /** D1 — lire le point d'intersection sur un graphique. */
  function genLireIntersection(alea, d) {
    var dd = deuxDroites(alea, function () { return val(alea.choix([0, 1, 2, 3])); }, { xmin: 1, xmax: 6, ymin: 2, ymax: 12, bmax: 12, positifs: true });
    var g = { xmin: 0, xmax: 8, ymin: 0, ymax: 16, gx: 1, gy: 1, lx: 1, ly: 2, courbes: [{ src: src(dd.l1), nom: 'f' }, { src: src(dd.l2), nom: 'g' }], description: 'Deux droites qui se coupent' };
    return {
      type: 'lecture',
      enonce: '<p>Voici les graphiques de deux fonctions f et g.</p>' + O.graphiqueHtml(g) + '<p>Lis les coordonnées du point d\'intersection des deux droites.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Le point d\'intersection est le point commun aux deux droites. Lis d\'abord x (axe horizontal), puis y (axe vertical).',
      reponse: { type: 'couple', x: dd.x, y: dd.y },
      etapes: [{ texte: 'Les deux droites se coupent au point de coordonnées x = ' + dd.x + ' (axe horizontal) et y = ' + dd.y + ' (axe vertical).', calcul: hm(tc(dd.x, dd.y)) }],
      verification: 'Contrôle : ' + hm('f(' + dd.x + ') = ' + tn(image(dd.l1, dd.x))) + ' et ' + hm('g(' + dd.x + ') = ' + tn(image(dd.l2, dd.x))) + '.',
      rubrique: R.intersection,
      controle: { ops: 1, xs: [dd.x], ys: [dd.y], coefs: [dd.l1.a.toString(), dd.l1.b.toString(), dd.l2.a.toString(), dd.l2.b.toString()], grad: [1, 1], calc: { genre: 'intersection', l1: [dd.l1.a.toString(), dd.l1.b.toString()], l2: [dd.l2.a.toString(), dd.l2.b.toString()] } }
    };
  }

  /** D2 — vrai ou faux : ce point est-il le point d'intersection ? (vérifier les deux) */
  function genVerifierIntersection(alea, d) {
    var dd = deuxDroites(alea, function () { return val(alea.entier(1, 5)); }, { xmin: -3, xmax: 5, ymin: -6, ymax: 10, bmax: 9 });
    var vrai = alea.suivant() < 0.45;
    // faux : le point est sur f seulement
    var px = vrai ? dd.x : dd.x + alea.choix([-1, 1]), py = image(dd.l1, px);
    var g2 = image(dd.l2, px);
    var opts = O.optionsVraiFaux(alea, {
      vrai: vrai,
      justeVrai: hm('f(' + tn(px) + ') = ' + tn(py)) + ' et ' + hm('g(' + tn(px) + ') = ' + tn(g2)) + ' : le point est sur les deux droites.',
      justeFaux: hm('f(' + tn(px) + ') = ' + tn(py)) + ', mais ' + hm('g(' + tn(px) + ') = ' + tn(g2)) + ' : le point n\'est pas sur la droite de g.',
      autresVrai: [hm('f(' + tn(px) + ') = ' + tn(py)) + ' : le point est sur la droite de f.', 'les deux pentes sont différentes.'],
      autresFaux: ['les deux droites ne se coupent pas.', 'un point d\'intersection a toujours des coordonnées positives.'],
      messageFaux: E.intersection
    });
    return {
      type: 'vraifaux',
      enonce: '<p>On donne ' + hl(dd.l1, 'f') + ' et ' + hl(dd.l2, 'g') + '.</p><p>« Le point ' + hm(tc(px, py)) + ' est le point d\'intersection des droites de f et de g. » Vrai ou faux ?</p>',
      indice: 'Calcule f(' + tn(px) + ') ET g(' + tn(px) + ').',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: 'Avec f.', calcul: hm('f(' + tn(px) + ') = ' + tn(dd.l1.a) + ' · ' + tnp(px) + ' + ' + tnp(dd.l1.b) + ' = ' + tn(py)) },
        { texte: 'Avec g.', calcul: hm('g(' + tn(px) + ') = ' + tn(dd.l2.a) + ' · ' + tnp(px) + ' + ' + tnp(dd.l2.b) + ' = ' + tn(g2)) }
      ],
      verification: vrai ? 'Les deux images sont égales à ' + tn(py) + ' : c\'est bien le point d\'intersection.' : 'Le vrai point d\'intersection est ' + hm(tc(dd.x, dd.y)) + '. ' + E.intersection,
      rubrique: R.intersection,
      controle: { ops: 2, xs: [px], ys: [py.toString()], coefs: [dd.l1.a.toString(), dd.l1.b.toString(), dd.l2.a.toString(), dd.l2.b.toString()], calc: { genre: 'choix' } }
    };
  }

  /** D3 (N1) — lire une intersection (coordonnées négatives possibles), puis vérifier avec les deux expressions. */
  function genIntersectionGraphique(alea, d, ctx) {
    var dd = deuxDroites(alea, function () { return val(alea.choix([-3, -2, -1, 1, 2, 3])); }, { xmin: -4, xmax: 4, ymin: -6, ymax: 6, bmax: 7 });
    var g = repere([{ src: src(dd.l1), nom: 'f' }, { src: src(dd.l2), nom: 'g' }], { description: 'Deux droites qui se coupent' });
    return {
      type: 'lecture',
      enonce: '<p>On donne ' + hl(dd.l1, 'f') + ' et ' + hl(dd.l2, 'g') + '.</p>' + O.graphiqueHtml(g) + '<p>Lis les coordonnées du point d\'intersection, puis vérifie-les avec les deux expressions.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Lis x sur l\'axe horizontal, puis y sur l\'axe vertical. Contrôle : f(x) et g(x) doivent donner le même nombre.',
      reponse: { type: 'couple', x: dd.x, y: dd.y, messageY: 'Contrôle y avec f(x) et g(x).' },
      etapes: [
        { texte: 'Lecture sur le graphique.', calcul: hm(tc(dd.x, dd.y)) },
        { texte: 'Vérification avec f.', calcul: hm('f(' + tn(dd.x) + ') = ' + tn(dd.l1.a) + ' · ' + tnp(dd.x) + ' + ' + tnp(dd.l1.b) + ' = ' + tn(dd.y)) },
        { texte: 'Vérification avec g.', calcul: hm('g(' + tn(dd.x) + ') = ' + tn(dd.l2.a) + ' · ' + tnp(dd.x) + ' + ' + tnp(dd.l2.b) + ' = ' + tn(dd.y)) }
      ],
      verification: E.intersection,
      rubrique: R.intersection,
      signatures: [sigInter(dd.l1, dd.l2)],
      controle: { ops: 3, xs: [dd.x], ys: [dd.y], coefs: [dd.l1.a.toString(), dd.l1.b.toString(), dd.l2.a.toString(), dd.l2.b.toString()], grad: [1, 1], calc: { genre: 'intersection', l1: [dd.l1.a.toString(), dd.l1.b.toString()], l2: [dd.l2.a.toString(), dd.l2.b.toString()] } }
    };
  }

  /** D4 (N1) — trouver l'intersection avec des tableaux de valeurs (sans graphique). */
  function genIntersectionTableau(alea, d, ctx) {
    var dd = deuxDroites(alea, function () { return val(alea.choix([-3, -2, -1, 1, 2, 3, 4])); }, { xmin: -2, xmax: 4, ymin: -6, ymax: 9, bmax: 9 });
    var xs = [-2, -1, 0, 1, 2, 3, 4];
    var trous = xs.map(function (x, i) { return i; }).filter(function (i) { return i % 2 === 1; });
    var f = xs.map(function (x, i) { return trous.indexOf(i) >= 0 ? null : image(dd.l1, x); });
    var g = xs.map(function (x, i) { return trous.indexOf(i) >= 0 ? null : image(dd.l2, x); });
    return {
      type: 'tableau',
      enonce: '<p>On donne ' + hl(dd.l1, 'f') + ' et ' + hl(dd.l2, 'g') + '.</p><p>Complète le tableau de valeurs, puis trouve le point d\'intersection des deux droites.</p>' +
        O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: f }, { entete: 'g(x)', valeurs: g }]),
      consigne: 'Écris (x ; y).',
      indice: 'Le point d\'intersection est dans la colonne où f(x) et g(x) sont égaux.',
      reponse: { type: 'couple', x: dd.x, y: dd.y, messageY: 'Dans la bonne colonne, y est la valeur commune de f(x) et de g(x).' },
      etapes: [
        { texte: 'On complète le tableau.', calcul: O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: xs.map(function (x) { return image(dd.l1, x); }) }, { entete: 'g(x)', valeurs: xs.map(function (x) { return image(dd.l2, x); }) }]) },
        { texte: 'On cherche la colonne où f(x) = g(x) : x = ' + tn(dd.x) + '.', calcul: hm('f(' + tn(dd.x) + ') = g(' + tn(dd.x) + ') = ' + tn(dd.y)) },
        { texte: 'Le point d\'intersection est :', calcul: hm(tc(dd.x, dd.y)) }
      ],
      verification: 'Dans les autres colonnes, f(x) et g(x) sont différents : il n\'y a qu\'un seul point commun.',
      rubrique: R.intersection,
      signatures: [sigInter(dd.l1, dd.l2)],
      controle: { ops: 4, xs: [dd.x], ys: [dd.y], coefs: [dd.l1.a.toString(), dd.l1.b.toString(), dd.l2.a.toString(), dd.l2.b.toString()], calc: { genre: 'intersection', l1: [dd.l1.a.toString(), dd.l1.b.toString()], l2: [dd.l2.a.toString(), dd.l2.b.toString()] } }
    };
  }

  /** D3 — intersection d'une droite et d'une droite constante (calcul). */
  function genIntersectionConstante(alea, d, ctx) {
    var a, x0, b, c;
    for (;;) {
      a = tirerPente(alea, 3, ctx.niveau); x0 = alea.entier(-5, 6); b = val(alea.entier(-6, 6));
      c = a.fois(x0).plus(b);
      if (c.estEntier() && Math.abs(c.valeur()) <= 12 && !c.egal(b)) break;
    }
    var l = { a: a, b: b };
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hl(l, 'f') + ' et la fonction constante ' + hm('g(x) = ' + tn(c)) + '.</p><p>Calcule les coordonnées du point d\'intersection de leurs graphiques.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Au point d\'intersection, f(x) = g(x), donc ' + hm(O.tx(src(l)) + ' = ' + tn(c)) + '.',
      reponse: { type: 'couple', x: x0, y: c, messageY: 'L\'ordonnée est la valeur de la fonction constante : y = ' + tn(c) + '.' },
      etapes: [
        { texte: 'On écrit f(x) = g(x).', calcul: hm(O.tx(src(l)) + ' = ' + tn(c)) },
        { texte: 'On résout.', calcul: hm(tn(a) + 'x = ' + tn(c) + ' – ' + tnp(b) + ' = ' + tn(c.moins(b)) + ' ; x = ' + tn(c.moins(b)) + ' : ' + tnp(a) + ' = ' + tn(x0)) },
        { texte: 'y est la valeur de g.', calcul: hm('y = ' + tn(c)) }
      ],
      verification: 'Vérification dans les DEUX fonctions : ' + hm('f(' + tn(x0) + ') = ' + tn(image(l, x0))) + ' et ' + hm('g(' + tn(x0) + ') = ' + tn(c)) + '.',
      rubrique: R.intersection,
      controle: { ops: 3, xs: [x0], ys: [c.toString()], coefs: [a.toString(), b.toString(), '0', c.toString()], calc: { genre: 'intersection', l1: [a.toString(), b.toString()], l2: ['0', c.toString()] } }
    };
  }

  /** D4 — intersection de deux droites (calcul), coordonnées entières. */
  function genIntersectionAlgebrique(alea, d, ctx) {
    var dd = deuxDroites(alea, function () { var a = tirerPente(alea, 3, ctx.niveau); return a; }, { xmin: -4, xmax: 5, ymin: -6, ymax: 8, bmax: 9 });
    var l1 = dd.l1, l2 = dd.l2;
    var da = l1.a.moins(l2.a), db = l2.b.moins(l1.b);
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hl(l1, 'f') + ' et ' + hl(l2, 'g') + '.</p><p>Calcule les coordonnées du point d\'intersection de leurs graphiques.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Au point d\'intersection, f(x) = g(x). Résous cette équation, puis calcule y avec f ET contrôle avec g.',
      reponse: { type: 'couple', x: dd.x, y: dd.y, messageY: 'Calcule y en remplaçant x dans f(x), puis contrôle avec g(x).' },
      etapes: [
        { texte: 'On écrit f(x) = g(x).', calcul: hm(O.tx(src(l1)) + ' = ' + O.tx(src(l2))) },
        { texte: 'On regroupe les x d\'un côté et les nombres de l\'autre.', calcul: hm(tn(da) + 'x = ' + tn(db)) },
        { texte: 'On divise.', calcul: hm('x = ' + tn(db) + ' : ' + tnp(da) + ' = ' + tn(dd.x)) },
        { texte: 'On calcule y avec f.', calcul: hm('y = f(' + tn(dd.x) + ') = ' + tn(dd.y)) }
      ],
      verification: 'Vérification dans l\'autre fonction : ' + hm('g(' + tn(dd.x) + ') = ' + tn(image(l2, dd.x))) + '. ' + E.intersection,
      rubrique: R.intersection,
      signatures: [sigInter(l1, l2)],
      controle: { ops: 4, xs: [dd.x], ys: [dd.y], coefs: [l1.a.toString(), l1.b.toString(), l2.a.toString(), l2.b.toString()], calc: { genre: 'intersection', l1: [l1.a.toString(), l1.b.toString()], l2: [l2.a.toString(), l2.b.toString()] } }
    };
  }

  /** D4 (N2) — intersection lue approximativement, puis calculée (coordonnées non entières). */
  function genIntersectionLireCalculer(alea, d) {
    var l1, l2, x, y;
    for (;;) {
      l1 = { a: val(alea.choix([1, 2, 3])), b: val(alea.entier(-3, 2)) };
      l2 = { a: val(alea.choix([-1, -2, '-0.5'])), b: val(alea.entier(2, 6)) };
      x = l2.b.moins(l1.b).divise(l1.a.moins(l2.a));
      y = image(l1, x);
      if (!x.estEntier() && x.fois(2).estEntier() && y.fois(2).estEntier() && Math.abs(y.valeur()) < 7 && Math.abs(x.valeur()) < 5) break;
    }
    var g = repere([{ src: src(l1), nom: 'f' }, { src: src(l2), nom: 'g' }], { description: 'Deux droites qui se coupent entre deux carreaux' });
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hl(l1, 'f') + ' et ' + hl(l2, 'g') + '.</p>' + O.graphiqueHtml(g) + '<p>Sur le graphique, le point d\'intersection n\'est pas sur un nœud du quadrillage. Calcule ses coordonnées exactes.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Lis d\'abord une valeur approchée sur le graphique, puis résous f(x) = g(x).',
      reponse: { type: 'couple', x: x, y: y },
      etapes: [
        { texte: 'Lecture approchée : x est entre ' + tn(Math.floor(x.valeur())) + ' et ' + tn(Math.ceil(x.valeur())) + '.' },
        { texte: 'On résout f(x) = g(x).', calcul: hm(O.tx(src(l1)) + ' = ' + O.tx(src(l2)) + ' ; ' + tn(l1.a.moins(l2.a)) + 'x = ' + tn(l2.b.moins(l1.b)) + ' ; x = ' + tn(x)) },
        { texte: 'On calcule y.', calcul: hm('y = f(' + tn(x) + ') = ' + tn(y)) }
      ],
      verification: 'Vérification : ' + hm('g(' + tn(x) + ') = ' + tn(image(l2, x))) + ', c\'est cohérent avec la lecture du graphique.',
      rubrique: R.intersection,
      controle: { ops: 4, xs: [x.toString()], ys: [y.toString()], coefs: [l1.a.toString(), l1.b.toString(), l2.a.toString(), l2.b.toString()], grad: [1, 1], calc: { genre: 'intersection', l1: [l1.a.toString(), l1.b.toString()], l2: [l2.a.toString(), l2.b.toString()] } }
    };
  }

  /* =====================================================================
   * B4 : proportionnalité (échelle, pourcentage, pente d'une route, agrandissement)
   * ===================================================================== */

  /** D1 à D3 — pourcentages. */
  function genPourcentage(alea, d) {
    var objet = alea.choix(['un casque de ski', 'une veste', 'un sac de sport', 'une paire de baskets', 'un jeu de société']);
    var base, taux, valeur, enonce, etapes, pieges, formule, ops;
    if (d === 1) {
      taux = alea.choix([10, 50, 25]);
      base = taux === 25 ? alea.choix([20, 24, 32, 40, 48]) : taux === 50 ? alea.choix([18, 30, 46, 50]) : alea.choix([20, 30, 40, 50]);
      valeur = base * taux / 100;
      enonce = '<p>Calcule ' + taux + ' % de ' + tm(base) + '.</p>';
      etapes = [{ texte: taux === 10 ? '10 %, c\'est diviser par 10.' : taux === 50 ? '50 %, c\'est la moitié.' : '25 %, c\'est le quart.', calcul: hm(tn(base) + ' : ' + (100 / taux) + ' = ' + tn(valeur)) }];
      pieges = base > taux ? [{ valeur: base - taux, message: 'Un pourcentage n\'est pas une soustraction : ' + taux + ' % de ' + tn(base) + ', c\'est ' + taux + ' centièmes de ' + tn(base) + '.' }] : [{ valeur: base * taux, message: 'Tu as multiplié par ' + taux + ' : il faut ensuite diviser par 100.' }];
      formule = base + '*' + taux + '/100'; ops = 1;
    } else if (d === 2) {
      taux = alea.choix([20, 30, 40, 15, 75]);
      base = alea.choix([40, 60, 80, 120, 140]);
      valeur = base * taux / 100;
      enonce = '<p>Calcule ' + taux + ' % de ' + tm(base) + '.</p>';
      etapes = taux === 75 ? [{ texte: '25 % est le quart.', calcul: hm(tn(base) + ' : 4 = ' + tn(base / 4)) }, { texte: '75 % = 3 · 25 %.', calcul: hm('3 · ' + tn(base / 4) + ' = ' + tn(valeur)) }]
        : taux === 15 ? [{ texte: '10 % et 5 %.', calcul: hm('10 % : ' + tn(base / 10) + ' ; 5 % : ' + tn(base / 20)) }, { texte: 'On additionne.', calcul: hm(tn(base / 10) + ' + ' + tn(base / 20) + ' = ' + tn(valeur)) }]
          : [{ texte: '10 % de ' + tn(base) + '.', calcul: hm(tn(base) + ' : 10 = ' + tn(base / 10)) }, { texte: taux + ' % = ' + (taux / 10) + ' · 10 %.', calcul: hm((taux / 10) + ' · ' + tn(base / 10) + ' = ' + tn(valeur)) }];
      pieges = [{ valeur: base - taux, message: 'Un pourcentage n\'est pas une soustraction.' }, { valeur: base / 10, message: 'Tu as calculé 10 % seulement.' }];
      formule = base + '*' + taux + '/100'; ops = 2;
    } else {
      taux = alea.choix([20, 30, 25, 40]);
      base = alea.choix([40, 60, 80, 120]);
      var hausse = alea.suivant() < 0.3;
      valeur = hausse ? base * (100 + taux) / 100 : base * (100 - taux) / 100;
      enonce = '<p>' + objet.charAt(0).toUpperCase() + objet.slice(1) + ' coûte ' + tm(base) + '. ' + (hausse ? 'Son prix augmente de ' : 'Pendant les soldes, son prix baisse de ') + taux + ' %.</p>' + FICTIF + '<p>Quel est le nouveau prix ?</p>';
      etapes = [
        { texte: 'Calcul de ' + taux + ' % de ' + tn(base) + '.', calcul: hm(tn(base) + ' : 100 · ' + taux + ' = ' + tn(base * taux / 100)) },
        { texte: hausse ? 'On ajoute la hausse.' : 'On enlève le rabais.', calcul: hm(tn(base) + (hausse ? ' + ' : ' – ') + tn(base * taux / 100) + ' = ' + tn(valeur)) },
        { texte: 'Autre méthode : ' + (hausse ? (100 + taux) : (100 - taux)) + ' % du prix.', calcul: hm(tn(base) + ' · ' + tn(val((hausse ? 100 + taux : 100 - taux) + '/100')) + ' = ' + tn(valeur)) }
      ];
      pieges = [{ valeur: base * taux / 100, message: 'Tu as calculé ' + (hausse ? 'la hausse' : 'le rabais') + ', pas le nouveau prix : ' + (hausse ? 'ajoute-la au' : 'enlève-le du') + ' prix de départ.' }, { valeur: hausse ? base + taux : base - taux, message: 'On ' + (hausse ? 'n\'ajoute' : 'n\'enlève') + ' pas ' + taux + ' CHF, mais ' + taux + ' % du prix.' }];
      formule = base + '*' + (hausse ? 100 + taux : 100 - taux) + '/100'; ops = 3;
    }
    return {
      type: d >= 3 ? 'probleme' : 'directe',
      enonce: enonce,
      indice: '10 % = diviser par 10 ; 50 % = la moitié ; 25 % = le quart.',
      reponse: { type: 'nombre', valeur: valeur, montant: true },
      suffixe: 'CHF',
      pieges: pieges,
      etapes: etapes,
      verification: d >= 3 ? '' : 'Contrôle : ' + hm(tn(valeur) + ' : ' + tn(base) + ' = ' + tn(val(taux).divise(100))) + ' = ' + taux + ' %.',
      rubrique: R.pourcentage,
      controle: { ops: ops, xs: [], ys: [], coefs: [taux], calc: { genre: 'formule', formule: formule } }
    };
  }

  /** D1 à D3 — échelle d'un plan ou d'une carte. */
  function genEchelle(alea, d) {
    var enonce, valeur, etapes, unite, formule, pieges, ops;
    if (d === 1) {
      var e1 = alea.choix([100, 50]), cm = alea.entier(2, 9);
      valeur = cm * e1 / 100;
      enonce = '<p>Le plan de la salle de classe est à l\'échelle 1 :\u00a0' + e1 + '. Sur le plan, le tableau mesure ' + cm + ' cm.</p><p>Quelle est sa longueur réelle, en mètres ?</p>';
      etapes = [{ texte: '1 cm sur le plan = ' + e1 + ' cm en réalité' + (e1 === 100 ? ' = 1 m.' : ' = 0,5 m.'), calcul: hm(cm + ' · ' + tn(val(e1).divise(100)) + ' = ' + tn(valeur) + ' m') }];
      unite = 'm'; formule = cm + '*' + e1 + '/100'; ops = 1;
      pieges = [{ valeur: cm * e1, message: 'Tu as la réponse en centimètres : convertis en mètres (100 cm = 1 m).' }];
    } else if (d === 2) {
      var e2 = alea.choix([25000, 50000]), cm2 = alea.choix([2, 4, 6, 8, 3]);
      valeur = cm2 * e2 / 100000;
      enonce = '<p>Une carte de randonnée du Jura est à l\'échelle 1 :\u00a0' + tn(e2) + '. Sur la carte, un sentier mesure ' + cm2 + ' cm.</p><p>Quelle est sa longueur réelle, en kilomètres ?</p>';
      etapes = [
        { texte: 'Longueur réelle en cm.', calcul: hm(cm2 + ' · ' + tn(e2) + ' = ' + tn(cm2 * e2) + ' cm') },
        { texte: 'Conversion : 1 km = 100\'000 cm.', calcul: hm(tn(cm2 * e2) + ' cm = ' + tn(valeur) + ' km') }
      ];
      unite = 'km'; formule = cm2 + '*' + e2 + '/100000'; ops = 2;
      pieges = [{ valeur: cm2 * e2, message: 'Ta réponse est en centimètres : convertis en kilomètres.' }, { valeur: cm2 * e2 / 1000, message: '1 km = 100\'000 cm (et non 1000 cm).' }];
    } else {
      var reel = alea.choix([1, 2, 3, 1.5]), cm3 = alea.choix([2, 4, 6]);
      var echelle = reel * 100000 / cm3;
      if (!Number.isInteger(echelle)) { reel = 3; cm3 = 6; echelle = 50000; }
      valeur = echelle;
      enonce = '<p>Sur une carte, deux villages distants de ' + tn(reel) + ' km sont séparés de ' + cm3 + ' cm.</p><p>Quelle est l\'échelle de la carte ? Écris le nombre n de l\'échelle 1 :\u00a0n.</p>';
      etapes = [
        { texte: 'On convertit la distance réelle en cm.', calcul: hm(tn(reel) + ' km = ' + tn(reel * 100000) + ' cm') },
        { texte: 'On cherche combien de cm réels correspondent à 1 cm sur la carte.', calcul: hm(tn(reel * 100000) + ' : ' + cm3 + ' = ' + tn(echelle)) },
        { texte: 'L\'échelle est donc :', calcul: hm('1 :\u00a0' + tn(echelle)) }
      ];
      unite = ''; formule = reel + '*100000/' + cm3; ops = 3;
      pieges = [{ valeur: reel / cm3, message: 'Convertis d\'abord les deux longueurs dans la même unité (en cm).' }, { valeur: reel * 1000 / cm3, message: '1 km = 100\'000 cm (et non 1000 cm).' }];
    }
    return {
      type: 'probleme',
      enonce: enonce + FICTIF,
      indice: 'À l\'échelle 1 :\u00a0n, 1 cm sur le plan représente n cm en réalité. 1 m = 100 cm ; 1 km = 100\'000 cm.',
      reponse: { type: 'nombre', valeur: valeur, unite: unite },
      suffixe: unite || null,
      pieges: pieges,
      etapes: etapes,
      verification: '',
      rubrique: R.echelle,
      controle: { ops: ops, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: formule } }
    };
  }

  /** D2 et D3 — pente d'une route, en pour cent. */
  function genPenteRoute(alea, d) {
    var p = alea.choix([5, 6, 8, 10, 12]), dist = alea.choix([100, 200, 250, 300, 500]);
    var den = p * dist / 100;
    var lieu = alea.choix(['la route de La Vue-des-Alpes', 'une route du Jura', 'la montée vers Chaumont', 'une route des Franches-Montagnes']);
    if (d === 2) {
      return {
        type: 'probleme',
        enonce: '<p>Un panneau indique une pente de ' + p + ' % sur ' + lieu + '.</p>' + FICTIF + '<p>De combien de mètres monte-t-on pour une distance horizontale de ' + dist + ' m ?</p>',
        indice: 'Une pente de ' + p + ' % : on monte de ' + p + ' m pour 100 m à l\'horizontale.',
        reponse: { type: 'nombre', valeur: den, unite: 'm' }, suffixe: 'm',
        pieges: [{ valeur: p, message: p + ' m, c\'est pour 100 m seulement : ici la distance est ' + dist + ' m.' }, { valeur: dist - p, message: 'Une pente en % n\'est pas une soustraction : c\'est une proportion.' }],
        etapes: [
          { texte: 'Pente de ' + p + ' % : ' + p + ' m de montée pour 100 m horizontaux.', calcul: hm(dist + ' : 100 = ' + tn(dist / 100)) },
          { texte: 'On multiplie.', calcul: hm(tn(dist / 100) + ' · ' + p + ' = ' + tn(den) + ' m') }
        ],
        verification: 'Contrôle : ' + hm(tn(den) + ' : ' + dist + ' = ' + tn(val(p).divise(100))) + ' = ' + p + ' %.',
        rubrique: R.pente,
        controle: { ops: 2, xs: [], ys: [], coefs: [p], calc: { genre: 'formule', formule: p + '*' + dist + '/100' } }
      };
    }
    return {
      type: 'probleme',
      enonce: '<p>Sur ' + lieu + ', on monte de ' + tn(den) + ' m pour une distance horizontale de ' + dist + ' m.</p>' + FICTIF + '<p>Quelle est la pente de cette route, en pour cent ?</p>',
      indice: 'Pente = dénivelé : distance horizontale. Écris ensuite le résultat en %.',
      reponse: { type: 'nombre', valeur: p, unite: '%' }, suffixe: '%',
      pieges: [{ valeur: val(den).divise(dist), message: 'Tu as la pente en nombre décimal : écris-la en pour cent (multiplie par 100).' }, { valeur: val(dist).divise(den), message: 'C\'est le dénivelé qu\'on divise par la distance horizontale, pas l\'inverse.' }],
      etapes: [
        { texte: 'Pente = dénivelé : distance horizontale.', calcul: hm(tn(den) + ' : ' + dist) },
        { texte: 'On calcule.', calcul: hm(tn(den) + ' : ' + dist + ' = ' + tn(val(p).divise(100))) },
        { texte: 'En pour cent.', calcul: hm(tn(val(p).divise(100)) + ' = ' + p + ' %') }
      ],
      verification: 'Contrôle : ' + p + ' m pour 100 m, donc ' + hm(p + ' · ' + tn(dist / 100) + ' = ' + tn(den)) + ' m pour ' + dist + ' m.',
      rubrique: R.pente,
      controle: { ops: 3, xs: [], ys: [], coefs: [p], calc: { genre: 'formule', formule: den + '/' + dist + '*100' } }
    };
  }

  /** D1 à D4 — agrandissement et réduction. */
  function genAgrandissement(alea, d) {
    var L = alea.entier(2, 6), l = alea.entier(1, L - 1 || 1);
    if (l === L) l = L - 1 || 1;
    var k, enonce, valeur, etapes, pieges, unite = 'cm', formule, ops;
    if (d === 1) {
      k = alea.choix([2, 3, 4]);
      valeur = L * k;
      enonce = '<p>On agrandit une photo de ' + L + ' cm sur ' + l + ' cm. Toutes les longueurs sont multipliées par ' + k + '.</p><p>Quelle est la nouvelle longueur du grand côté ?</p>';
      etapes = [{ texte: 'On multiplie par ' + k + '.', calcul: hm(L + ' · ' + k + ' = ' + valeur + ' cm') }];
      pieges = [{ valeur: L + k, message: 'Agrandir, c\'est multiplier les longueurs, pas ajouter.' }];
      formule = L + '*' + k; ops = 1;
    } else if (d === 2) {
      k = alea.choix([2, 3, 4, 5]);
      enonce = '<p>Un rectangle de ' + L + ' cm sur ' + l + ' cm est agrandi. Son grand côté mesure maintenant ' + (L * k) + ' cm.</p><p>Combien mesure son petit côté ?</p>';
      valeur = l * k;
      etapes = [{ texte: 'Coefficient d\'agrandissement.', calcul: hm((L * k) + ' : ' + L + ' = ' + k) }, { texte: 'Petit côté.', calcul: hm(l + ' · ' + k + ' = ' + valeur + ' cm') }];
      pieges = [{ valeur: l + (L * k - L), message: E.additif + ' On ne rajoute pas la même longueur aux deux côtés.' }];
      formule = l + '*' + (L * k) + '/' + L; ops = 2;
    } else if (d === 3) {
      k = val(alea.choix(['1.5', '0.5', '2.5']));
      var L2 = L * 2, l2 = l * 2;
      enonce = '<p>Une figure a un côté de ' + L2 + ' cm et un autre de ' + l2 + ' cm. On la ' + (k.valeur() < 1 ? 'réduit' : 'agrandit') + ' avec le coefficient ' + tn(k) + '.</p><p>Quelle est la somme des deux nouvelles longueurs ?</p>';
      valeur = k.fois(L2 + l2);
      etapes = [
        { texte: 'Premier côté.', calcul: hm(L2 + ' · ' + tn(k) + ' = ' + tn(k.fois(L2))) },
        { texte: 'Deuxième côté.', calcul: hm(l2 + ' · ' + tn(k) + ' = ' + tn(k.fois(l2))) },
        { texte: 'Somme.', calcul: hm(tn(k.fois(L2)) + ' + ' + tn(k.fois(l2)) + ' = ' + tn(valeur)) }
      ];
      pieges = [{ valeur: k.plus(L2).plus(k).plus(l2), message: 'Le coefficient multiplie les longueurs, il ne s\'ajoute pas.' }, { valeur: val(L2 + l2), message: 'Tu as oublié d\'appliquer le coefficient.' }];
      formule = k.valeur() + '*(' + L2 + '+' + l2 + ')'; ops = 3;
    } else {
      k = alea.choix([2, 3]);
      var aire = L * l;
      enonce = '<p>Un rectangle de ' + L + ' cm sur ' + l + ' cm est agrandi : toutes ses longueurs sont multipliées par ' + k + '.</p><p>Quelle est l\'aire du rectangle agrandi, en cm² ?</p>';
      valeur = aire * k * k;
      unite = 'cm²';
      etapes = [
        { texte: 'Nouvelles longueurs.', calcul: hm(L + ' · ' + k + ' = ' + (L * k) + ' ; ' + l + ' · ' + k + ' = ' + (l * k)) },
        { texte: 'Nouvelle aire.', calcul: hm((L * k) + ' · ' + (l * k) + ' = ' + valeur + ' cm²') },
        { texte: 'On remarque : l\'aire est multipliée par ' + k + ' · ' + k + ' = ' + (k * k) + ', pas par ' + k + '.' }
      ];
      pieges = [{ valeur: aire * k, message: 'Quand les longueurs sont multipliées par ' + k + ', l\'aire est multipliée par ' + k + ' · ' + k + ' = ' + (k * k) + ' : la longueur ET la largeur sont agrandies.' }];
      formule = '(' + L + '*' + k + ')*(' + l + '*' + k + ')'; ops = 3;
    }
    return {
      type: d >= 4 ? 'probleme' : 'directe',
      enonce: enonce,
      indice: 'Agrandir ou réduire : toutes les longueurs sont multipliées par le même coefficient.',
      reponse: { type: 'nombre', valeur: valeur, unite: unite }, suffixe: unite,
      pieges: pieges,
      etapes: etapes,
      verification: '',
      rubrique: R.agrandissement,
      controle: { ops: ops, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: formule } }
    };
  }

  /** D4 — vrai ou faux : une hausse puis une baisse du même pourcentage. */
  function genHausseBaisse(alea, d) {
    var p = alea.choix([10, 20, 25, 50]), base = alea.choix([40, 80, 100, 200]);
    var apres = base * (100 + p) / 100, fin = apres * (100 - p) / 100;
    var opts = O.optionsVraiFaux(alea, {
      vrai: false,
      justeFaux: 'la baisse de ' + p + ' % se calcule sur le nouveau prix ' + tm(apres) + ' : on obtient ' + tm(fin) + ', pas ' + tm(base) + '.',
      autresFaux: ['on ne peut pas faire deux pourcentages de suite.'],
      autresVrai: ['+ ' + p + ' % puis – ' + p + ' %, cela s\'annule.', 'on ajoute ' + tm(base * p / 100) + ', puis on enlève ' + tm(base * p / 100) + '.'],
      messageFaux: 'Le deuxième pourcentage se calcule sur le nouveau prix, qui est plus grand : la baisse est donc plus grande que la hausse.'
    });
    return {
      type: 'vraifaux',
      enonce: '<p>Un vélo coûte ' + tm(base) + ' en location à la saison. Le prix augmente de ' + p + ' %, puis baisse de ' + p + ' %.</p>' + FICTIF + '<p>« À la fin, le prix est de nouveau ' + tm(base) + '. » Vrai ou faux ?</p>',
      indice: 'Calcule le prix après la hausse, puis la baisse sur ce nouveau prix.',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: 'Après la hausse.', calcul: hm(tn(base) + ' + ' + tn(base * p / 100) + ' = ' + tn(apres)) },
        { texte: 'Baisse de ' + p + ' % du NOUVEAU prix.', calcul: hm(tn(apres) + ' : 100 · ' + p + ' = ' + tn(apres * p / 100)) },
        { texte: 'Prix final.', calcul: hm(tn(apres) + ' – ' + tn(apres * p / 100) + ' = ' + tn(fin)) }
      ],
      verification: 'Le prix final ' + tm(fin) + ' est plus petit que ' + tm(base) + '.',
      rubrique: R.pourcentage,
      controle: { ops: 3, xs: [], ys: [], coefs: [p], calc: { genre: 'choix' } }
    };
  }

  /* =====================================================================
   * B5 : diagrammes circulaires et en barres
   * ===================================================================== */
  var TRANSPORTS = ['à pied', 'vélo', 'bus', 'voiture', 'trottinette'];
  var DECHETS = ['papier', 'PET', 'compost', 'verre', 'alu'];

  /** D1 — lire une barre. */
  function genLireBarres(alea, d) {
    var cats = alea.melanger(TRANSPORTS).slice(0, 4), vals = cats.map(function () { return alea.entier(1, 12); });
    var i = alea.entier(0, 3);
    var def = { categories: cats, valeurs: vals, max: 14, pas: 1, lpas: 2, titreY: 'nombre d\'élèves', description: 'Diagramme en barres des moyens de transport' };
    return {
      type: 'lecture',
      enonce: '<p>Le diagramme montre comment les élèves d\'une classe viennent au collège.</p>' + FICTIF + O.svgBarres(def) + '<p>Combien d\'élèves viennent ' + (cats[i] === 'à pied' ? 'à pied' : 'en ' + cats[i]) + ' ?</p>',
      indice: 'Lis la hauteur de la barre sur l\'axe vertical. Un carreau vaut 1 élève.',
      reponse: { type: 'nombre', valeur: vals[i] },
      pieges: [],
      etapes: [{ texte: 'On lit la hauteur de la barre « ' + cats[i] + ' » sur l\'axe vertical.', calcul: hm(vals[i] + ' élèves') }],
      verification: '',
      rubrique: R.diagrammes,
      controle: { ops: 1, xs: [], ys: vals, coefs: [], grad: [1, 1], calc: { genre: 'formule', formule: String(vals[i]) } }
    };
  }

  /** D2 — lire un diagramme circulaire (pourcentages) et calculer un effectif. */
  function genLireCirculaire(alea, d) {
    var cats = alea.melanger(TRANSPORTS).slice(0, 4);
    var parts = alea.choix([[50, 25, 15, 10], [40, 30, 20, 10], [25, 25, 30, 20], [50, 20, 20, 10], [30, 30, 25, 15]]);
    parts = alea.melanger(parts);
    var total = alea.choix([20, 40, 60, 80]);
    var i = alea.entier(0, 3);
    var n = total * parts[i] / 100;
    if (!Number.isInteger(n)) { total = 100; n = parts[i]; }
    return {
      type: 'lecture',
      enonce: '<p>On a demandé à ' + total + ' élèves comment ils viennent au collège.</p>' + FICTIF + O.svgCirculaire({ categories: cats, parts: parts, etiquettes: parts.map(function (p) { return p + ' %'; }) }) + '<p>Combien d\'élèves viennent ' + (cats[i] === 'à pied' ? 'à pied' : 'en ' + cats[i]) + ' ?</p>',
      indice: 'Lis le pourcentage du secteur, puis calcule ce pourcentage de ' + total + '.',
      reponse: { type: 'nombre', valeur: n },
      pieges: [{ valeur: parts[i], message: 'C\'est le pourcentage : calcule ' + parts[i] + ' % de ' + total + ' élèves.' }],
      etapes: [
        { texte: 'Le secteur « ' + cats[i] + ' » représente ' + parts[i] + ' %.' },
        { texte: parts[i] + ' % de ' + total + '.', calcul: hm(total + ' : 100 · ' + parts[i] + ' = ' + tn(n)) }
      ],
      verification: 'Contrôle : la somme des pourcentages fait 100 %.',
      rubrique: R.diagrammes,
      controle: { ops: 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: total + '*' + parts[i] + '/100' } }
    };
  }

  /** D2 — différence entre deux barres. */
  function genDifferenceBarres(alea, d) {
    var mois = ['mars', 'avril', 'mai', 'juin', 'juillet'];
    var vals = mois.map(function () { return alea.entier(4, 24) * 2; });
    var i = alea.entier(0, 4), j;
    do { j = alea.entier(0, 4); } while (j === i || vals[j] === vals[i]);
    var def = { categories: mois, valeurs: vals, max: 50, pas: 2, lpas: 10, titreY: 'production (kWh)', description: 'Production solaire par mois' };
    return {
      type: 'lecture',
      enonce: '<p>Le diagramme donne la production d\'énergie d\'un panneau solaire test sur le toit de l\'école (label Eco-School), en kWh.</p>' + FICTIF + O.svgBarres(def) + '<p>Combien de kWh de plus a-t-on produit en ' + (vals[i] > vals[j] ? mois[i] : mois[j]) + ' qu\'en ' + (vals[i] > vals[j] ? mois[j] : mois[i]) + ' ?</p>',
      indice: 'Lis les deux barres (un carreau vaut 2 kWh), puis soustrais.',
      reponse: { type: 'nombre', valeur: Math.abs(vals[i] - vals[j]), unite: 'kWh' }, suffixe: 'kWh',
      pieges: [{ valeur: Math.max(vals[i], vals[j]), message: 'C\'est la production d\'un seul mois : calcule la différence.' }],
      etapes: [
        { texte: 'On lit les deux barres.', calcul: hm(mois[i] + ' : ' + vals[i] + ' kWh ; ' + mois[j] + ' : ' + vals[j] + ' kWh') },
        { texte: 'On soustrait.', calcul: hm(Math.max(vals[i], vals[j]) + ' – ' + Math.min(vals[i], vals[j]) + ' = ' + Math.abs(vals[i] - vals[j]) + ' kWh') }
      ],
      verification: '',
      rubrique: R.diagrammes,
      controle: { ops: 2, xs: [], ys: vals, coefs: [], grad: [1, 2], calc: { genre: 'formule', formule: 'Math.abs(' + vals[i] + '-' + vals[j] + ')' } }
    };
  }

  /** D3 — angle d'un secteur (réaliser un diagramme circulaire). */
  function genAngleSecteur(alea, d) {
    var total = alea.choix([20, 24, 30, 36, 40]);
    var cats = alea.melanger(DECHETS).slice(0, 4);
    var n;
    do { n = alea.entier(2, total / 2); } while ((360 * n) % total !== 0);
    var angle = 360 * n / total;
    var i = alea.entier(0, 3);
    return {
      type: 'probleme',
      enonce: '<p>Pour le label Eco-School, une classe trie ' + total + ' sacs de déchets en une semaine ; ' + n + ' sacs sont du ' + cats[i] + '.</p>' + FICTIF + '<p>On veut représenter ces données par un diagramme circulaire. Quel angle, en degrés, faut-il pour le secteur « ' + cats[i] + ' » ?</p>',
      indice: 'Le disque entier (360°) représente les ' + total + ' sacs. Combien de degrés pour 1 sac ?',
      reponse: { type: 'nombre', valeur: angle, unite: '°' }, suffixe: '°',
      pieges: [{ valeur: val(n * 100).divise(total), message: 'C\'est le pourcentage : un diagramme circulaire se dessine avec des angles (le disque entier fait 360°).' }, { valeur: n, message: 'C\'est le nombre de sacs : il faut le transformer en angle.' }],
      etapes: [
        { texte: 'Le disque entier fait 360° pour ' + total + ' sacs.' },
        { texte: 'Angle pour 1 sac.', calcul: hm('360 : ' + total + ' = ' + tn(val(360).divise(total)) + '°') },
        { texte: 'Angle pour ' + n + ' sacs.', calcul: hm(tn(val(360).divise(total)) + ' · ' + n + ' = ' + angle + '°') }
      ],
      verification: 'Contrôle : ' + hm(angle + ' : 360 = ' + tn(val(n).divise(total))) + ', comme ' + n + ' : ' + total + '.',
      rubrique: R.diagrammes,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: '360*' + n + '/' + total } }
    };
  }

  /** D3 — pourcentage d'une catégorie dans un diagramme en barres. */
  function genPourcentageBarres(alea, d) {
    var cats = alea.melanger(['football', 'unihockey', 'natation', 'danse', 'escalade']).slice(0, 4);
    var vals;
    do { vals = cats.map(function () { return alea.entier(1, 10); }); } while ([20, 25, 40, 50].indexOf(vals.reduce(function (s, v) { return s + v; }, 0)) < 0);
    var total = vals.reduce(function (s, v) { return s + v; }, 0);
    var i = alea.entier(0, 3);
    var pc = val(vals[i] * 100).divise(total);
    var def = { categories: cats, valeurs: vals, max: 12, pas: 1, lpas: 2, titreY: 'nombre d\'élèves', description: 'Sport préféré des élèves' };
    return {
      type: 'probleme',
      enonce: '<p>Sport préféré des élèves d\'un groupe.</p>' + FICTIF + O.svgBarres(def) + '<p>Quel pourcentage des élèves préfère « ' + cats[i] + ' » ?</p>',
      indice: 'Calcule d\'abord le nombre total d\'élèves (additionne toutes les barres).',
      reponse: { type: 'nombre', valeur: pc, unite: '%' }, suffixe: '%',
      pieges: [{ valeur: vals[i], message: 'C\'est le nombre d\'élèves : divise-le par le total, puis écris-le en %.' }],
      etapes: [
        { texte: 'Total des élèves.', calcul: hm(vals.join(' + ') + ' = ' + total) },
        { texte: 'Part de « ' + cats[i] + ' ».', calcul: hm(vals[i] + ' : ' + total + ' = ' + tn(val(vals[i]).divise(total))) },
        { texte: 'En pour cent.', calcul: hm(tn(val(vals[i]).divise(total)) + ' = ' + tn(pc) + ' %') }
      ],
      verification: '',
      rubrique: R.diagrammes,
      controle: { ops: 3, xs: [], ys: vals, coefs: [], grad: [1, 1], calc: { genre: 'formule', formule: vals[i] + '*100/' + total } }
    };
  }

  /** D4 — compléter un diagramme circulaire (catégorie manquante). */
  function genCompleterCirculaire(alea, d) {
    var cats = alea.melanger(TRANSPORTS).slice(0, 4);
    var parts = alea.melanger(alea.choix([[45, 25, 20, 10], [35, 30, 25, 10], [40, 30, 15, 15], [50, 20, 15, 15]]));
    var i = alea.entier(0, 3), total = alea.choix([40, 60, 80, 120]);
    var n = total * parts[i] / 100;
    if (!Number.isInteger(n)) { total = 100; n = parts[i]; }
    var et = parts.map(function (p, k) { return k === i ? '?' : p + ' %'; });
    var autres = parts.filter(function (p, k) { return k !== i; });
    return {
      type: 'probleme',
      enonce: '<p>Le diagramme montre comment ' + total + ' élèves viennent au collège. Un pourcentage est effacé.</p>' + FICTIF + O.svgCirculaire({ categories: cats, parts: parts, etiquettes: et }) + '<p>Combien d\'élèves sont dans la catégorie « ' + cats[i] + ' » ?</p>',
      indice: 'La somme des pourcentages vaut 100 %. Trouve le pourcentage manquant, puis calcule ce pourcentage de ' + total + '.',
      reponse: { type: 'nombre', valeur: n },
      pieges: [{ valeur: parts[i], message: 'C\'est le pourcentage : calcule ' + parts[i] + ' % de ' + total + ' élèves.' }],
      etapes: [
        { texte: 'Pourcentage manquant.', calcul: hm('100 – (' + autres.join(' + ') + ') = ' + parts[i] + ' %') },
        { texte: parts[i] + ' % de ' + total + '.', calcul: hm(total + ' : 100 · ' + parts[i] + ' = ' + tn(n)) }
      ],
      verification: 'Contrôle : la somme des effectifs fait ' + total + '.',
      rubrique: R.diagrammes,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: total + '*(100-' + autres.join('-') + ')/100' } }
    };
  }

  /** D4 — erreur d'un élève : il confond pourcentage et degrés. */
  function genErreurDiagramme(alea, d) {
    var nom = alea.choix(O.PRENOMS), p = alea.choix([10, 20, 25, 30, 40]);
    var faux = alea.suivant() < 0.8;
    var dit = faux ? p : p * 3.6;
    var opts = O.optionsVraiFaux(alea, {
      vrai: !faux,
      justeVrai: p + ' % de 360° = ' + hm('360 : 100 · ' + p + ' = ' + tn(p * 3.6)) + '°.',
      justeFaux: 'un secteur de ' + p + ' % mesure ' + p + ' % de 360°, c\'est-à-dire ' + tn(p * 3.6) + '°.',
      autresVrai: ['un pourcentage et un angle, c\'est la même chose.'],
      autresFaux: ['un angle ne peut pas dépasser 90°.', 'il faut diviser ' + p + ' par 360.'],
      messageFaux: 'Dans un diagramme circulaire, 100 % correspond à 360° : 1 % correspond à 3,6°.'
    });
    return {
      type: 'erreur',
      enonce: '<p>' + nom + ' dessine un diagramme circulaire. Pour une catégorie qui représente ' + p + ' %, ' + nom + ' trace un secteur de ' + tn(dit) + '°.</p><p>« Le secteur est juste. » Vrai ou faux ?</p>',
      indice: 'Le disque entier (360°) représente 100 %.',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: '100 % correspondent à 360°.', calcul: hm('1 % → 360 : 100 = 3,6°') },
        { texte: p + ' % correspondent à :', calcul: hm(p + ' · 3,6 = ' + tn(p * 3.6) + '°') },
        { texte: faux ? nom + ' a tracé ' + tn(dit) + '° : c\'est faux (confusion entre % et degrés).' : 'Le secteur est juste.' }
      ],
      verification: '',
      rubrique: R.diagrammes,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'choix' } }
    };
  }

  /* =====================================================================
   * B6 (niveau 2) : interpréter a et b dans une situation, comparer des offres
   * ===================================================================== */
  var SITUATIONS = [
    { id: 'trottinette', texte: function (a, b) { return 'Une trottinette en libre-service coûte ' + hm(O.tx(O.srcAffine(a, b))) + ' CHF pour x minutes.'; }, a: 'le prix par minute', b: 'la prise en charge', x: 'minutes', y: 'prix (CHF)', aVals: ['0.5', '0.4', '0.3'], bVals: [1, 2] },
    { id: 'mobile', texte: function (a, b) { return 'Un forfait mobile coûte ' + hm(O.tx(O.srcAffine(a, b))) + ' CHF par mois pour x Go de données.'; }, a: 'le prix par Go', b: 'le prix de base du forfait', x: 'Go', y: 'prix (CHF)', aVals: [2, 3, 4], bVals: [10, 15, 20] },
    { id: 'recharge', texte: function (a, b) { return 'Une borne de recharge facture ' + hm(O.tx(O.srcAffine(a, b))) + ' CHF pour x kWh.'; }, a: 'le prix par kWh', b: 'les frais de connexion', x: 'kWh', y: 'prix (CHF)', aVals: ['0.5', '0.6'], bVals: [2, 3] }
  ];

  /** D1 — que représente a (ou b) dans la situation ? */
  function genSensCoefficients(alea, d) {
    var s = alea.choix(SITUATIONS), a = val(alea.choix(s.aVals)), b = val(alea.choix(s.bVals));
    var quoi = alea.choix(['a', 'b']);
    var nombre = quoi === 'a' ? a : b;
    var choix = [
      { h: s.a + ' (la pente a)', juste: quoi === 'a', message: quoi === 'a' ? '' : E.ordonneePente },
      { h: s.b + ' (l\'ordonnée à l\'origine b)', juste: quoi === 'b', message: quoi === 'b' ? '' : E.ordonneePente },
      { h: 'le prix total', juste: false, message: 'Le prix total est f(x) : il dépend de x.' },
      { h: 'le nombre de ' + s.x, juste: false, message: E.variableImage }
    ];
    return {
      type: 'choix',
      enonce: '<p>' + s.texte(a, b) + '</p>' + FICTIF + '<p>Que représente le nombre ' + tn(nombre) + ' dans cette situation ?</p>',
      indice: 'Dans f(x) = ax + b, a est multiplié par x (il dépend de la quantité), b est payé une seule fois.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [{ texte: quoi === 'a' ? tn(a) + ' est multiplié par x : c\'est ' + s.a + ', la pente de la droite.' : tn(b) + ' est payé même pour x = 0 : c\'est ' + s.b + ', l\'ordonnée à l\'origine (point (0 ; ' + tn(b) + ')).' }],
      verification: '',
      rubrique: R.affine,
      controle: { ops: 1, xs: [], ys: [], coefs: [a.toString(), b.toString()], calc: { genre: 'choix' } }
    };
  }

  /** D2 — que devient le graphique quand a ou b change ? (affine, linéaire, constante) */
  function genChangementCoefficient(alea, d) {
    var cas = alea.choix(['b+', 'a+', 'a0', 'b0']);
    var a = alea.entier(2, 4), b = alea.entier(10, 20);
    var textes = {
      'b+': { q: 'La prise en charge augmente de 5 CHF, le prix par heure ne change pas.', juste: 'La droite monte de 5 carreaux de 1 CHF, elle reste parallèle (même pente).', calcul: 'f(x) = ' + a + 'x + ' + b + ' devient g(x) = ' + a + 'x + ' + (b + 5) },
      'a+': { q: 'Le prix par heure passe de ' + a + ' CHF à ' + (a + 2) + ' CHF, la prise en charge ne change pas.', juste: 'La droite part du même point (0 ; ' + b + '), mais elle est plus raide.', calcul: 'f(x) = ' + a + 'x + ' + b + ' devient g(x) = ' + (a + 2) + 'x + ' + b },
      'a0': { q: 'On remplace la location à l\'heure par un forfait de ' + b + ' CHF, quelle que soit la durée.', juste: 'La droite devient horizontale : fonction constante (a = 0).', calcul: 'f(x) = ' + a + 'x + ' + b + ' devient g(x) = ' + b },
      'b0': { q: 'La prise en charge est supprimée, le prix par heure ne change pas.', juste: 'La droite passe par l\'origine : fonction linéaire (b = 0), même pente.', calcul: 'f(x) = ' + a + 'x + ' + b + ' devient g(x) = ' + a + 'x' }
    };
    var t = textes[cas];
    var choix = ['b+', 'a+', 'a0', 'b0'].map(function (k) {
      return { h: textes[k].juste, juste: k === cas, message: k === cas ? '' : (k === 'b+' || k === 'b0') && (cas === 'a+' || cas === 'a0') ? E.ordonneePente : (k === 'a+' || k === 'a0') && (cas === 'b+' || cas === 'b0') ? E.ordonneePente : 'Relis ce qui change : la pente (a) ou l\'ordonnée à l\'origine (b) ?' };
    });
    return {
      type: 'choix',
      enonce: '<p>La location d\'un vélo électrique coûte ' + hf(a + 'x+' + b) + ' CHF pour x heures (' + b + ' CHF de prise en charge, ' + a + ' CHF par heure).</p>' + FICTIF + '<p>' + t.q + ' Que devient le graphique ?</p>',
      indice: 'Le prix par heure est la pente a ; la prise en charge est l\'ordonnée à l\'origine b.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [{ texte: 'Nouvelle expression.', calcul: hm(t.calcul) }, { texte: t.juste }],
      verification: '',
      rubrique: R.affine,
      controle: { ops: 2, xs: [], ys: [], coefs: [a, b], calc: { genre: 'choix' } }
    };
  }

  /** D3 — effet de a dans f(x) = ax² (sens et ouverture de la parabole). */
  function genSensAParabole(alea, d) {
    var a = val(alea.choix([-3, -2, -1, '-0.5', '0.5', 2, 3]));
    var srcA = (a.signe() < 0 ? '-' : '') + (a.abs().egal(1) ? '' : O.snPositif(a.abs())) + 'x^2';
    var g = repere([{ src: srcA, nom: 'f' }, { src: 'x^2', classe: 'c1', nom: 'g' }], { ymin: -9, ymax: 9, description: 'Deux paraboles' });
    var haut = a.signe() > 0, ouverte = a.abs().valeur() < 1;
    var juste = 'Elle est tournée vers ' + (haut ? 'le haut' : 'le bas') + ' et ' + (ouverte ? 'plus ouverte' : a.abs().egal(1) ? 'aussi ouverte' : 'plus fermée') + ' que celle de x².';
    var choix = [
      { h: juste, juste: true },
      { h: 'Elle est tournée vers ' + (haut ? 'le bas' : 'le haut') + ' et ' + (ouverte ? 'plus ouverte' : a.abs().egal(1) ? 'aussi ouverte' : 'plus fermée') + ' que celle de x².', juste: false, message: 'Le signe de a donne le sens : a ' + (haut ? '> 0 : vers le haut.' : '< 0 : vers le bas.') },
      { h: 'Elle est tournée vers ' + (haut ? 'le haut' : 'le bas') + ' et ' + (ouverte ? 'plus fermée' : 'plus ouverte') + ' que celle de x².', juste: false, message: 'Plus a est grand en valeur absolue, plus les valeurs de f(x) grandissent vite : la parabole est plus fermée. Ici |a| = ' + tn(a.abs()) + '.' },
      { h: 'Ce n\'est plus une parabole, c\'est une droite.', juste: false, message: 'Avec x², le graphique reste une parabole, quel que soit a ≠ 0.' }
    ].filter(function (c, i) { return !(a.abs().egal(1) && i === 2); });
    return {
      type: 'choix',
      enonce: '<p>On compare le graphique de ' + hf(srcA) + ' à celui de ' + hm('g(x) = x²') + ' (en pointillé).</p>' + O.graphiqueHtml(g) + '<p>Que peut-on dire de la parabole de f ?</p>',
      indice: 'Le signe de a dit si la parabole est tournée vers le haut ou vers le bas. Compare f(2) et g(2).',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'Signe de a : a = ' + tn(a) + (haut ? ' > 0, la parabole est tournée vers le haut.' : ' < 0, la parabole est tournée vers le bas.') },
        { texte: 'On compare des valeurs.', calcul: hm('f(2) = ' + tn(a.fois(4)) + ' ; g(2) = 4') },
        { texte: ouverte ? '|a| < 1 : les valeurs grandissent moins vite, la parabole est plus ouverte.' : a.abs().egal(1) ? '|a| = 1 : même ouverture que x².' : '|a| > 1 : les valeurs grandissent plus vite, la parabole est plus fermée.' }
      ],
      verification: '',
      rubrique: R.quadratique,
      controle: { ops: 3, xs: [2], ys: [a.fois(4).toString()], coefs: [a.toString()], calc: { genre: 'choix' } }
    };
  }

  /** D3 — trouver a et b d'une situation à partir de deux données (décimaux). */
  function genTrouverAB(alea, d) {
    var s = alea.choix(SITUATIONS), a = val(alea.choix(s.aVals)), b = val(alea.choix(s.bVals));
    var x1 = alea.choix([4, 5, 10]), x2 = x1 + alea.choix([5, 10]);
    var y1 = image({ a: a, b: b }, x1), y2 = image({ a: a, b: b }, x2);
    return {
      type: 'probleme',
      enonce: '<p>Pour ' + x1 + ' ' + s.x + ', on paie ' + tm(y1) + ' ; pour ' + x2 + ' ' + s.x + ', on paie ' + tm(y2) + '. Le prix est une fonction affine du nombre de ' + s.x + '.</p>' + FICTIF + '<p>Écris l\'expression fonctionnelle du prix.</p>',
      consigne: 'Écris seulement le membre de droite.',
      prefixe: 'f(x) =',
      indice: 'Pente a : (différence des prix) : (différence des quantités). Puis b avec une des deux données.',
      reponse: { type: 'expr', attendu: O.srcAffine(a, b) },
      pieges: [{ src: O.srcAffine(b, a), message: E.ordonneePente }, { src: O.srcAffine(val(y1).divise(x1), 0), message: 'Le prix n\'est pas proportionnel (il y a un montant fixe) : ' + E.affineOrigine }],
      etapes: [
        { texte: 'Pente : ce que coûte une unité de plus.', calcul: hm('a = (' + tn(y2) + ' – ' + tn(y1) + ') : (' + x2 + ' – ' + x1 + ') = ' + tn(y2.moins(y1)) + ' : ' + (x2 - x1) + ' = ' + tn(a)) },
        { texte: 'Ordonnée à l\'origine : le montant fixe.', calcul: hm('b = ' + tn(y1) + ' – ' + tn(a) + ' · ' + x1 + ' = ' + tn(b)) },
        { texte: 'Expression.', calcul: hf(O.srcAffine(a, b)) }
      ],
      verification: 'Interprétation : ' + tn(a) + ' CHF est ' + s.a + ', ' + tn(b) + ' CHF est ' + s.b + '.',
      rubrique: R.affine,
      controle: { ops: 3, xs: [x1, x2], ys: [y1.toString(), y2.toString()], coefs: [a.toString(), b.toString()], calc: { genre: 'expr', a: a.toString(), b: b.toString() } }
    };
  }

  /** Offres : A (fixe + prix réduit) et B (prix plein, ou forfait constant). */
  function tirerOffres(alea) {
    for (;;) {
      var cas = alea.choix(['train', 'piscine', 'streaming']);
      var o;
      if (cas === 'train') {
        var plein = alea.choix([16, 20, 24, 30, 36]), abo = alea.choix([100, 120, 150]);
        o = { cas: cas, A: { a: val(plein / 2), b: val(abo) }, B: { a: val(plein), b: val(0) }, unite: 'trajets', texteA: 'abonnement demi-tarif à ' + tm(abo) + ' par an, puis ' + tm(plein / 2) + ' par trajet', texteB: 'plein tarif, ' + tm(plein) + ' par trajet', contexte: 'Pour un trajet régulier en train' };
      } else if (cas === 'piscine') {
        var entree = alea.choix([6, 7, 8]), carte = alea.choix([40, 50, 60]), red = alea.choix([2, 3]);
        o = { cas: cas, A: { a: val(red), b: val(carte) }, B: { a: val(entree), b: val(0) }, unite: 'entrées', texteA: 'carte de membre à ' + tm(carte) + ' par saison, puis ' + tm(red) + ' par entrée', texteB: tm(entree) + ' par entrée', contexte: 'À la piscine des Mélèzes' };
      } else {
        var film = alea.choix([4, 5, 6]), mensuel = alea.choix([20, 24, 30]);
        o = { cas: cas, A: { a: val(0), b: val(mensuel) }, B: { a: val(film), b: val(0) }, unite: 'films', texteA: 'abonnement illimité à ' + tm(mensuel) + ' par mois', texteB: tm(film) + ' par film loué', contexte: 'Pour regarder des films en ligne' };
      }
      var sg = 'offres:' + [sigTexte(o.A.a) + ',' + sigTexte(o.A.b), sigTexte(o.B.a) + ',' + sigTexte(o.B.b)].sort().join('|');
      if (O.estReference([sg])) continue;
      o.signature = sg;
      return o;
    }
  }

  /** D4 — à partir de quelle quantité l'offre A est-elle strictement moins chère ? */
  function genComparerOffres(alea, d) {
    var o = tirerOffres(alea);
    var x = o.A.b.divise(o.B.a.moins(o.A.a)); // égalité
    var n = x.estEntier() ? Number(x.valeur()) + 1 : Math.ceil(x.valeur());
    var ent = x.estEntier();
    return {
      type: 'probleme',
      enonce: '<p>' + o.contexte + ', on a deux offres. Offre A : ' + o.texteA + '. Offre B : ' + o.texteB + '.</p>' + FICTIF + '<p>À partir de combien de ' + o.unite + ' l\'offre A est-elle strictement moins chère que l\'offre B ?</p>',
      indice: 'Écris le prix de chaque offre en fonction de x, puis cherche pour quel x les prix sont égaux. Attention : « strictement moins chère ».',
      reponse: { type: 'nombre', valeur: n },
      pieges: ent ? [{ valeur: n - 1, message: 'Pour ' + (n - 1) + ' ' + o.unite + ', les deux offres coûtent exactement la même chose : A n\'est pas encore STRICTEMENT moins chère.' }] : [{ valeur: Math.floor(x.valeur()), message: 'Pour ' + Math.floor(x.valeur()) + ' ' + o.unite + ', l\'offre B est encore moins chère : arrondis vers le haut.' }],
      etapes: [
        { texte: 'Prix des deux offres pour x ' + o.unite + '.', calcul: hm('A(x) = ' + O.tx(src(o.A)) + ' ; B(x) = ' + O.tx(src(o.B))) },
        { texte: 'Les prix sont égaux quand A(x) = B(x).', calcul: hm(O.tx(src(o.A)) + ' = ' + O.tx(src(o.B)) + ' ; x = ' + tn(x)) },
        { texte: ent ? 'Pour x = ' + tn(x) + ', les prix sont égaux ; A est strictement moins chère à partir de ' + n + '.' : 'x n\'est pas entier : on arrondit vers le haut, ' + n + ' ' + o.unite + '.' }
      ],
      verification: 'Vérification : ' + hm('A(' + n + ') = ' + tn(image(o.A, n)) + ' < B(' + n + ') = ' + tn(image(o.B, n))) + ', mais ' + hm('A(' + (n - 1) + ') = ' + tn(image(o.A, n - 1)) + ' ⩾ B(' + (n - 1) + ') = ' + tn(image(o.B, n - 1))) + '.',
      rubrique: R.intersection,
      signatures: [o.signature],
      controle: { ops: 4, xs: [n], ys: [], coefs: [o.A.a.toString(), o.A.b.toString(), o.B.a.toString(), o.B.b.toString()], calc: { genre: 'offres', A: [o.A.a.toString(), o.A.b.toString()], B: [o.B.a.toString(), o.B.b.toString()] } }
    };
  }

  /** D4 — interpréter le point d'intersection de deux offres tracées. */
  function genSensIntersection(alea, d) {
    var o;
    do { o = tirerOffres(alea); } while (!o.A.b.divise(o.B.a.moins(o.A.a)).estEntier());
    var x = o.A.b.divise(o.B.a.moins(o.A.a)), y = image(o.A, x);
    var xmax = Number(x.valeur()) * 2, ymax = Math.ceil(image(o.B, xmax).valeur() / 10) * 10;
    var g = { xmin: 0, xmax: xmax, ymin: 0, ymax: ymax, gx: O.pasAdapte(xmax, 12), gy: O.pasAdapte(ymax, 12), lx: O.pasAdapte(xmax, 6), ly: O.pasAdapte(ymax, 6), titreX: o.unite, titreY: 'prix (CHF)', courbes: [{ src: src(o.A), nom: 'A' }, { src: src(o.B), nom: 'B' }], description: 'Prix des deux offres' };
    var choix = [
      { h: 'Pour ' + tn(x) + ' ' + o.unite + ', les deux offres coûtent ' + tm(y) + '.', juste: true },
      { h: 'Pour ' + tn(y) + ' ' + o.unite + ', les deux offres coûtent ' + tm(x) + '.', juste: false, message: E.inverse },
      { h: 'L\'offre A coûte ' + tm(y) + ' de prise en charge.', juste: false, message: 'Le montant fixe de A se lit en x = 0 : c\'est ' + tm(o.A.b) + '.' },
      { h: 'À partir de ' + tn(x) + ' ' + o.unite + ', l\'offre B est moins chère.', juste: false, message: 'Regarde les droites après le point d\'intersection : laquelle est en dessous ?' }
    ];
    return {
      type: 'raconte',
      enonce: '<p>' + o.contexte + ' : offre A, ' + o.texteA + ' ; offre B, ' + o.texteB + '.</p>' + FICTIF + O.graphiqueHtml(g) + '<p>Les deux droites se coupent au point ' + hm(tc(x, y)) + '. Que signifie ce point ?</p>',
      indice: 'L\'abscisse est le nombre de ' + o.unite + ', l\'ordonnée est un prix.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'x = ' + tn(x) + ' : le nombre de ' + o.unite + '. y = ' + tn(y) + ' : le prix en CHF.' },
        { texte: 'Au point d\'intersection, les deux offres ont le même prix.', calcul: hm('A(' + tn(x) + ') = B(' + tn(x) + ') = ' + tn(y)) },
        { texte: 'Après ce point, la droite de A est en dessous : A devient moins chère.' }
      ],
      verification: '',
      rubrique: R.intersection,
      signatures: [o.signature],
      controle: { ops: 3, xs: [x.toString()], ys: [y.toString()], coefs: [o.A.a.toString(), o.A.b.toString()], calc: { genre: 'choix' } }
    };
  }

  /* =====================================================================
   * B7 : f(x) = x² et f(x) = – x² (prolongement N1, évalué N2)
   * ===================================================================== */
  function nomCarre(s) { return s > 0 ? 'x^2' : '-x^2'; }

  /** D1 — image par x² ou – x². */
  function genCarreImage(alea, d) {
    var s = alea.choix([1, -1]), x0 = alea.entier(2, 7);
    var y = s * x0 * x0;
    return {
      type: 'directe',
      enonce: '<p>On donne ' + hf(nomCarre(s)) + '. Calcule ' + hm('f(' + x0 + ')') + '.</p>',
      indice: s > 0 ? 'x² = x · x.' : '– x² : on calcule d\'abord x², puis on prend l\'opposé.',
      reponse: { type: 'nombre', valeur: y },
      pieges: [{ valeur: s * 2 * x0, message: 'x² n\'est pas 2 · x : c\'est x · x.' }, { valeur: -y, message: s < 0 ? '– x² : on prend l\'opposé du carré, le résultat est négatif.' : 'Un carré est positif.' }],
      etapes: [{ texte: 'On remplace x par ' + x0 + '.', calcul: hm('f(' + x0 + ') = ' + (s < 0 ? '– ' : '') + x0 + '² = ' + (s < 0 ? '– ' : '') + x0 + ' · ' + x0 + ' = ' + tn(y)) }],
      verification: '',
      rubrique: R.quadratique,
      controle: { ops: 1, xs: [x0], ys: [y], coefs: [s], calc: { genre: 'carre', s: s, x: x0 } }
    };
  }

  /** D2 — compléter un tableau de x² ou – x² (x négatifs). */
  function genTableauCarre(alea, d) {
    var s = alea.choix([1, -1]);
    var xs = [-3, -2, -1, 0, 1, 2, 3];
    var trous = alea.choix([[0, 5], [1, 6], [0, 2], [1, 4]]);
    var ys = xs.map(function (x) { return s * x * x; });
    var aff = ys.map(function (y, i) { return trous.indexOf(i) >= 0 ? (i === trous[0] ? 'A' : 'B') : y; });
    return {
      type: 'tableau',
      enonce: '<p>Complète le tableau de valeurs de ' + hf(nomCarre(s)) + '.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: aff }]),
      consigne: 'Écris A ; B.',
      indice: s > 0 ? '(– 3)² = (– 3) · (– 3) : moins fois moins donne plus.' : '– x² : calcule d\'abord x² (toujours positif), puis prends l\'opposé.',
      reponse: { type: 'liste', valeurs: trous.map(function (i) { return ys[i]; }), noms: ['A', 'B'] },
      pieges: [{ liste: trous.map(function (i) { return -ys[i]; }), message: s > 0 ? 'Un carré n\'est jamais négatif : (– 3)² = 9.' : '– (– 3)² = – 9 : on élève au carré AVANT de prendre l\'opposé.' }],
      etapes: [
        { texte: 'Case A (x = ' + tn(xs[trous[0]]) + ').', calcul: hm('f(' + tn(xs[trous[0]]) + ') = ' + (s < 0 ? '– ' : '') + tnp(xs[trous[0]]) + '² = ' + tn(ys[trous[0]])) },
        { texte: 'Case B (x = ' + tn(xs[trous[1]]) + ').', calcul: hm('f(' + tn(xs[trous[1]]) + ') = ' + (s < 0 ? '– ' : '') + tnp(xs[trous[1]]) + '² = ' + tn(ys[trous[1]])) }
      ],
      verification: 'Contrôle : le tableau est symétrique, ' + hm('f(– 2) = f(2)') + '.',
      rubrique: R.quadratique,
      controle: { ops: 2, xs: xs, ys: ys, coefs: [s], calc: { genre: 'liste-carre', s: s, xs: trous.map(function (i) { return xs[i]; }) } }
    };
  }

  /** D3 — choisir le graphique de x² ou de – x². */
  function genChoisirParabole(alea, d) {
    var s = alea.choix([1, -1]);
    var g = function (sr) { return O.graphiqueHtml(repere([{ src: sr }], { ymin: -9, ymax: 9 })); };
    var choix = [
      { h: g(nomCarre(s)), juste: true, param: nomCarre(s) },
      { h: g(nomCarre(-s)), juste: false, param: nomCarre(-s), message: s > 0 ? 'x² est toujours positif : la parabole est tournée vers le haut.' : '– x² est toujours négatif ou nul : la parabole est tournée vers le bas.' },
      { h: g(s > 0 ? '2*x' : '-2*x'), juste: false, param: 'droite', message: 'Ce graphique est une droite : x² n\'est pas 2x.' }
    ];
    return {
      type: 'relier',
      enonce: '<p>Quel graphique représente ' + hf(nomCarre(s)) + ' ?</p>',
      indice: 'Calcule f(2) et f(– 2). Les points sont-ils au-dessus ou en dessous de l\'axe horizontal ?',
      reponse: { type: 'choix' }, choix: nommer(O.melanger(alea, choix), 'Graphique'), choixGraphiques: true,
      etapes: [
        { texte: 'Quelques valeurs.', calcul: hm('f(0) = 0 ; f(1) = ' + tn(s) + ' ; f(2) = ' + tn(4 * s) + ' ; f(– 2) = ' + tn(4 * s)) },
        { texte: 'Les points ne sont pas alignés : c\'est une parabole.' },
        { texte: s > 0 ? 'Toutes les valeurs sont positives ou nulles : la parabole est tournée vers le haut, sommet en (0 ; 0).' : 'Toutes les valeurs sont négatives ou nulles : la parabole est tournée vers le bas, sommet en (0 ; 0).' }
      ],
      verification: '',
      rubrique: R.quadratique,
      controle: { ops: 3, xs: [], ys: [], coefs: [s], calc: { genre: 'choix-param', attendu: nomCarre(s), contexte: { s: s } } }
    };
  }

  /** D3 — vrai ou faux : un point appartient-il au graphique de x² ou de – x² ? */
  function genPointParabole(alea, d) {
    var s = alea.choix([1, -1]), x0 = alea.choix([-4, -3, -2, 2, 3, 4]);
    var vrai = alea.suivant() < 0.5;
    var y = vrai ? s * x0 * x0 : -s * x0 * x0;
    var opts = O.optionsVraiFaux(alea, {
      vrai: vrai,
      justeVrai: hm('f(' + tn(x0) + ') = ' + (s < 0 ? '– ' : '') + tnp(x0) + '² = ' + tn(s * x0 * x0)) + '.',
      justeFaux: hm('f(' + tn(x0) + ') = ' + (s < 0 ? '– ' : '') + tnp(x0) + '² = ' + tn(s * x0 * x0)) + ' et non ' + tn(y) + '.',
      autresVrai: ['un carré est toujours positif, donc ' + tn(y) + ' convient.', tnp(x0) + ' · 2 = ' + tn(2 * x0) + '.'],
      autresFaux: ['un point d\'une parabole a toujours une abscisse positive.', 'x² = 2x.'],
      messageFaux: s > 0 ? '(– 3)² = (– 3) · (– 3) = 9 : moins fois moins donne plus.' : '– x² : on élève d\'abord au carré, puis on prend l\'opposé. – (– 3)² = – 9.'
    });
    return {
      type: 'vraifaux',
      enonce: '<p>« Le point ' + hm(tc(x0, y)) + ' appartient au graphique de ' + hf(nomCarre(s)) + '. » Vrai ou faux ?</p>',
      indice: 'Calcule f(' + tn(x0) + ') et compare avec la deuxième coordonnée.',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: 'On calcule l\'image de la première coordonnée.', calcul: hm('f(' + tn(x0) + ') = ' + (s < 0 ? '– ' : '') + tnp(x0) + '² = ' + tn(s * x0 * x0)) },
        { texte: 'On compare avec la deuxième coordonnée, ' + tn(y) + '.' },
        { texte: vrai ? 'C\'est le même nombre : le point appartient au graphique.' : 'Les nombres sont différents : le point n\'appartient pas au graphique.' }
      ],
      verification: '',
      rubrique: R.quadratique,
      controle: { ops: 3, xs: [x0], ys: [y], coefs: [s], calc: { genre: 'choix' } }
    };
  }

  /** D4 — symétrie : un autre point de même ordonnée. */
  function genSymetrieParabole(alea, d) {
    var s = alea.choix([1, -1]), x0 = alea.choix([-4, -3, -2, 2, 3, 4]);
    var y = s * x0 * x0;
    return {
      type: 'directe',
      enonce: '<p>Le point ' + hm('A' + tc(x0, y)) + ' appartient au graphique de ' + hf(nomCarre(s)) + '.</p><p>Donne les coordonnées de l\'autre point du graphique qui a la même ordonnée que A.</p>',
      consigne: 'Écris (x ; y).',
      indice: 'Le graphique est symétrique par rapport à l\'axe vertical : f(– x) = f(x).',
      reponse: { type: 'couple', x: -x0, y: y },
      etapes: [
        { texte: 'La parabole est symétrique par rapport à l\'axe vertical.' },
        { texte: 'On calcule l\'image de l\'opposé.', calcul: hm('f(' + tn(-x0) + ') = ' + (s < 0 ? '– ' : '') + tnp(-x0) + '² = ' + tn(y)) },
        { texte: 'L\'autre point :', calcul: hm(tc(-x0, y)) }
      ],
      verification: 'Contrôle : ' + hm('f(' + tn(x0) + ') = f(' + tn(-x0) + ') = ' + tn(y)) + '.',
      rubrique: R.quadratique,
      controle: { ops: 3, xs: [x0, -x0], ys: [y], coefs: [s], calc: { genre: 'couple-carre', s: s, x: -x0, y: y } }
    };
  }

  /* =====================================================================
   * Catalogue du module B
   * ===================================================================== */
  var objectifs = [
    { id: 'B1', module: 'B', annee: 10, niveaux: [1, 2], statut: 'evalue', theme: 'FA 10.1', titre: 'Reconnaître une fonction affine (linéaire, constante) ou une parabole',
      modeles: [
        { type: 'choix', dMin: 1, dMax: 1, gen: genNomGraphique },
        { type: 'choix', dMin: 1, dMax: 1, gen: genNomExpression },
        { type: 'vraifaux', dMin: 2, dMax: 2, gen: genVraiFauxOrigine },
        { type: 'tableau', dMin: 3, dMax: 3, gen: genNomTableau, niveauDependant: true },
        { type: 'relier', dMin: 3, dMax: 3, gen: genChoisirParabole },
        { type: 'erreur', dMin: 4, dMax: 4, gen: genErreurClassement }
      ] },
    { id: 'B2', module: 'B', annee: 10, niveaux: [1, 2], statut: 'evalue', theme: 'FA 10.1', titre: 'Passer de l\'expression au tableau et au graphique, et inversement',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genLireImage },
        { type: 'directe', dMin: 1, dMax: 1, gen: genImageLineaire },
        { type: 'tableau', dMin: 2, dMax: 2, gen: genExprVersTableau },
        { type: 'lecture', dMin: 2, dMax: 2, gen: genGraphiqueVersExpression },
        { type: 'relier', dMin: 3, dMax: 3, gen: genExprVersGraphique, niveauDependant: true },
        { type: 'lecture', dMin: 3, dMax: 3, gen: genGraphiqueVersTableau, niveauDependant: true },
        { type: 'tableau', dMin: 4, dMax: 4, gen: genTableauVersExpression, niveauDependant: true },
        { type: 'lecture', dMin: 4, dMax: 4, gen: genGraphiqueVersExpression, niveauDependant: true }
      ] },
    { id: 'B3', module: 'B', annee: 10, niveaux: [1, 2], statut: 'evalue', theme: 'FA 10.1', titre: 'Intersection de deux droites : graphiquement (et par le calcul au niveau 2)',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genLireIntersection },
        { type: 'vraifaux', dMin: 2, dMax: 2, gen: genVerifierIntersection },
        { type: 'lecture', dMin: 3, dMax: 3, gen: genIntersectionGraphique, niveaux: [1] },
        { type: 'tableau', dMin: 4, dMax: 4, gen: genIntersectionTableau, niveaux: [1] },
        { type: 'directe', dMin: 3, dMax: 3, gen: genIntersectionConstante, niveaux: [2] },
        { type: 'directe', dMin: 4, dMax: 4, gen: genIntersectionAlgebrique, niveaux: [2] },
        { type: 'directe', dMin: 4, dMax: 4, gen: genIntersectionLireCalculer, niveaux: [2] }
      ] },
    { id: 'B4', module: 'B', annee: 10, niveaux: [1, 2], statut: 'evalue', theme: 'FA 10.1', titre: 'Proportionnalité : échelle, pourcentage, pente d\'une route, agrandissement',
      modeles: [
        { type: 'directe', dMin: 1, dMax: 3, gen: genPourcentage },
        { type: 'probleme', dMin: 1, dMax: 3, gen: genEchelle },
        { type: 'directe', dMin: 1, dMax: 4, gen: genAgrandissement },
        { type: 'probleme', dMin: 2, dMax: 3, gen: genPenteRoute },
        { type: 'vraifaux', dMin: 4, dMax: 4, gen: genHausseBaisse }
      ] },
    { id: 'B5', module: 'B', annee: 10, niveaux: [1, 2], statut: 'evalue', theme: 'FA 10.1', titre: 'Lire et réaliser un diagramme circulaire ou en barres',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genLireBarres },
        { type: 'lecture', dMin: 2, dMax: 2, gen: genLireCirculaire },
        { type: 'lecture', dMin: 2, dMax: 2, gen: genDifferenceBarres },
        { type: 'probleme', dMin: 3, dMax: 3, gen: genAngleSecteur },
        { type: 'probleme', dMin: 3, dMax: 3, gen: genPourcentageBarres },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genCompleterCirculaire },
        { type: 'erreur', dMin: 4, dMax: 4, gen: genErreurDiagramme }
      ] },
    { id: 'B6', module: 'B', annee: 10, niveaux: [2], statut: 'evalue', theme: 'FA 10.1', titre: 'Interpréter les coefficients : a et b de ax + b (situations, offres), a de ax²',
      modeles: [
        { type: 'choix', dMin: 1, dMax: 1, gen: genSensCoefficients },
        { type: 'choix', dMin: 2, dMax: 2, gen: genChangementCoefficient },
        { type: 'probleme', dMin: 3, dMax: 3, gen: genTrouverAB },
        { type: 'choix', dMin: 3, dMax: 3, gen: genSensAParabole },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genComparerOffres },
        { type: 'raconte', dMin: 4, dMax: 4, gen: genSensIntersection }
      ] },
    { id: 'B7', module: 'B', annee: 10, niveaux: [1, 2], statut: 'evalue', plusLoinN1: [10, 11], theme: 'FA 10.1', titre: 'Tracer x² et – x² avec un tableau de valeurs',
      modeles: [
        { type: 'directe', dMin: 1, dMax: 1, gen: genCarreImage },
        { type: 'tableau', dMin: 2, dMax: 2, gen: genTableauCarre },
        { type: 'vraifaux', dMin: 3, dMax: 3, gen: genPointParabole },
        { type: 'directe', dMin: 4, dMax: 4, gen: genSymetrieParabole }
      ] }
  ];

  // genPenteDeuxPoints et genExpressionDeuxPoints (pente et ordonnée à l'origine) : réservés au module C (11e).
  return { objectifs: objectifs, tirerPente: tirerPente, genPenteDeuxPoints: genPenteDeuxPoints, genExpressionDeuxPoints: genExpressionDeuxPoints };
});
