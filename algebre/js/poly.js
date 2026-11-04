/*
 * algebre/js/poly.js — polynômes à coefficients rationnels exacts
 * ----------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : objet global « AlgebrePoly ».
 * Node : require('./poly.js'). Dépend uniquement de assets/maths.js.
 *
 * Un monôme : { c: Maths.Fraction, l: { x: 2, y: 1 } } (partie littérale).
 * Un polynôme : tableau de monômes réduit (pas deux monômes semblables,
 * aucun coefficient nul), toujours ordonné par degré décroissant.
 *
 *   P.depuis(expr)          texte ou arbre de Maths.analyser -> polynôme
 *                           (lève une erreur si l'expression n'est pas polynomiale)
 *   P.monome(c, l), P.constante(c), P.lettre('x')
 *   P.plus(a, b), P.moins(a, b), P.fois(a, b), P.puissance(a, n), P.oppose(a)
 *   P.egal(a, b), P.estZero(a), P.degre(a, lettre?), P.degreMonome(m, lettre?)
 *   P.coef(a, l)            coefficient de la partie littérale l
 *   P.valeur(a, valeurs)    Fraction
 *   P.src(a, options)       texte « source » lisible par Maths.analyser (3x^2-2x+1)
 *   P.texte(a, options)     écriture de l'aide-mémoire : 3x² – 2x + 1
 *   P.srcMonome(m), P.texteMonome(m), P.partieLitterale(m) (« x²y »)
 *   P.facteurCommun(a)      plus grand monôme qui divise tous les termes
 *                           (coefficient entier positif, si tous les coefficients sont entiers)
 *   P.diviserMonome(a, m)
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('../../assets/maths.js'));
  else racine.AlgebrePoly = fabrique(racine.Maths);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Maths) {
  'use strict';

  var F = Maths.Fraction;
  var EXP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

  function ErreurNonPolynome(message) {
    this.name = 'ErreurNonPolynome';
    this.message = message;
    this.stack = new Error(message).stack;
  }
  ErreurNonPolynome.prototype = Object.create(Error.prototype);

  function cle(l) {
    return Object.keys(l).sort().map(function (k) { return k + l[k]; }).join('');
  }
  function degreMonome(m, lettre) {
    if (lettre) return m.l[lettre] || 0;
    var d = 0;
    for (var k in m.l) d += m.l[k];
    return d;
  }
  /** Ordre : degré décroissant, puis puissances décroissantes des lettres dans l'ordre alphabétique. */
  function comparer(a, b, lettre) {
    var d = degreMonome(b, lettre) - degreMonome(a, lettre);
    if (d) return d;
    if (lettre) { d = degreMonome(b) - degreMonome(a); if (d) return d; }
    var lettres = Object.keys(a.l).concat(Object.keys(b.l)).sort();
    for (var i = 0; i < lettres.length; i++) {
      var e = (b.l[lettres[i]] || 0) - (a.l[lettres[i]] || 0);
      if (e) return e;
    }
    return 0;
  }

  function reduire(termes, lettre) {
    var parCle = {}, ordre = [];
    termes.forEach(function (m) {
      var k = cle(m.l);
      if (!parCle[k]) { parCle[k] = { c: new F(0), l: copieL(m.l) }; ordre.push(k); }
      parCle[k].c = parCle[k].c.plus(m.c);
    });
    return ordre.map(function (k) { return parCle[k]; })
      .filter(function (m) { return !m.c.estZero(); })
      .sort(function (a, b) { return comparer(a, b, lettre); });
  }
  function copieL(l) { var c = {}; for (var k in l) if (l[k]) c[k] = l[k]; return c; }

  function monome(c, l) { return reduire([{ c: F.depuis(c), l: copieL(l || {}) }]); }
  function constante(c) { return monome(c, {}); }
  function lettre(nom) { var l = {}; l[nom] = 1; return monome(1, l); }

  function plus(a, b) { return reduire(a.concat(b)); }
  function oppose(a) { return a.map(function (m) { return { c: m.c.oppose(), l: m.l }; }); }
  function moins(a, b) { return plus(a, oppose(b)); }
  function foisMonomes(m, n) {
    var l = copieL(m.l);
    for (var k in n.l) l[k] = (l[k] || 0) + n.l[k];
    return { c: m.c.fois(n.c), l: l };
  }
  function fois(a, b) {
    var t = [];
    a.forEach(function (m) { b.forEach(function (n) { t.push(foisMonomes(m, n)); }); });
    return reduire(t);
  }
  function puissance(a, n) {
    if (n < 0 || !Number.isInteger(n)) throw new ErreurNonPolynome('Exposant entier positif attendu');
    var r = constante(1);
    for (var i = 0; i < n; i++) r = fois(r, a);
    return r;
  }
  function estZero(a) { return a.length === 0; }
  function egal(a, b) { return estZero(moins(a, b)); }
  function degre(a, lettre) {
    if (!a.length) return -Infinity;
    return Math.max.apply(null, a.map(function (m) { return degreMonome(m, lettre); }));
  }
  function coef(a, l) {
    var k = cle(l || {});
    for (var i = 0; i < a.length; i++) if (cle(a[i].l) === k) return a[i].c;
    return new F(0);
  }
  function valeur(a, valeurs) {
    var s = new F(0);
    a.forEach(function (m) {
      var t = m.c;
      for (var k in m.l) {
        if (!(k in valeurs)) throw new Error('Valeur manquante pour ' + k);
        t = t.fois(F.depuis(valeurs[k]).puissance(m.l[k]));
      }
      s = s.plus(t);
    });
    return s;
  }
  function lettresDe(a) {
    var e = {};
    a.forEach(function (m) { for (var k in m.l) e[k] = true; });
    return Object.keys(e).sort();
  }

  /* ---------- Lecture d'un arbre de Maths.analyser ---------- */
  function depuisNoeud(n) {
    switch (n.type) {
      case 'nombre': return constante(n.valeur);
      case 'lettre': return lettre(n.nom);
      case 'neg': return oppose(depuisNoeud(n.arg));
      case '+': return plus(depuisNoeud(n.g), depuisNoeud(n.d));
      case '-': return moins(depuisNoeud(n.g), depuisNoeud(n.d));
      case '*': return fois(depuisNoeud(n.g), depuisNoeud(n.d));
      case '^': return puissance(depuisNoeud(n.base), n.exposant);
      case '/': {
        var d = depuisNoeud(n.d);
        if (d.length !== 1 || Object.keys(d[0].l).length) throw new ErreurNonPolynome('Division par une expression qui contient une lettre');
        return fois(depuisNoeud(n.g), constante(new F(1).divise(d[0].c)));
      }
    }
    throw new ErreurNonPolynome('Expression non polynomiale');
  }
  function depuis(expr) {
    if (Array.isArray(expr)) return expr;
    return depuisNoeud(Maths.analyser(expr));
  }

  /* ---------- Écriture ---------- */
  function lettresOrdonnees(l) { return Object.keys(l).sort(); }
  function partieLitteraleSrc(l) {
    return lettresOrdonnees(l).map(function (k) { return l[k] === 1 ? k : k + '^' + l[k]; }).join('');
  }
  function exposantTexte(n) { return String(n).split('').map(function (c) { return EXP[+c]; }).join(''); }
  function partieLitterale(m) {
    var l = m.l || m;
    return lettresOrdonnees(l).map(function (k) { return l[k] === 1 ? k : k + exposantTexte(l[k]); }).join('');
  }
  function coefSrc(c, avecLettres) {
    var a = c.abs();
    var s = c.signe() < 0 ? '-' : '';
    if (!avecLettres) return s + (a.estEntier() ? String(a.num) : a.num + '/' + a.den);
    if (a.egal(1)) return s;
    return s + (a.estEntier() ? String(a.num) : '(' + a.num + '/' + a.den + ')');
  }
  function srcMonome(m) {
    var pl = partieLitteraleSrc(m.l);
    return coefSrc(m.c, pl !== '') + pl;
  }
  /** options : { ordre: 'croissant' | 'decroissant' (défaut) | 'tel' , lettre } */
  function ordonner(a, options) {
    options = options || {};
    if (options.ordre === 'tel') return a.slice();
    var t = a.slice().sort(function (m, n) { return comparer(m, n, options.lettre); });
    if (options.ordre === 'croissant') t.reverse();
    return t;
  }
  function src(a, options) {
    var t = ordonner(a, options);
    if (!t.length) return '0';
    return t.map(function (m, i) {
      var s = srcMonome(m);
      if (i === 0) return s;
      return s.charAt(0) === '-' ? '-' + s.slice(1) : '+' + s;
    }).join('');
  }
  function texte(a, options) { return Maths.versTexte(src(a, options)); }
  function texteMonome(m) { return Maths.versTexte(srcMonome(m)); }

  /* ---------- Facteur commun ---------- */
  function pgcdN(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function facteurCommun(a) {
    if (!a.length) return { c: new F(1), l: {} };
    var entiers = a.every(function (m) { return m.c.estEntier(); });
    var g = 0;
    if (entiers) a.forEach(function (m) { g = pgcdN(g, Number(m.c.num)); });
    var l = {};
    lettresOrdonnees(a[0].l).forEach(function (k) {
      var e = Math.min.apply(null, a.map(function (m) { return m.l[k] || 0; }));
      if (e > 0) l[k] = e;
    });
    return { c: new F(entiers ? g : 1), l: l };
  }
  function diviserMonome(a, m) {
    return reduire(a.map(function (t) {
      var l = copieL(t.l);
      for (var k in m.l) {
        l[k] = (l[k] || 0) - m.l[k];
        if (l[k] < 0) throw new ErreurNonPolynome('Division impossible');
      }
      return { c: t.c.divise(m.c), l: l };
    }));
  }

  return {
    ErreurNonPolynome: ErreurNonPolynome,
    depuis: depuis,
    monome: monome,
    constante: constante,
    lettre: lettre,
    plus: plus,
    moins: moins,
    fois: fois,
    puissance: puissance,
    oppose: oppose,
    egal: egal,
    estZero: estZero,
    degre: degre,
    degreMonome: degreMonome,
    coef: coef,
    valeur: valeur,
    lettres: lettresDe,
    ordonner: ordonner,
    comparer: comparer,
    src: src,
    texte: texte,
    srcMonome: srcMonome,
    texteMonome: texteMonome,
    partieLitterale: partieLitterale,
    cle: cle,
    facteurCommun: facteurCommun,
    diviserMonome: diviserMonome,
    exposantTexte: exposantTexte
  };
});
