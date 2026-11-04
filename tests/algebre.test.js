/*
 * Tests de l'appli « Calcul littéral et équations » (logique seulement, sans navigateur).
 * Lancer :  node tests/algebre.test.js
 *
 * Pour chaque module (A, B), chaque année (9e, 10e, 11e), chaque niveau (1, 2)
 * et chaque difficulté (1 à 4) : au moins 500 questions générées avec une graine fixe
 * (tous les objectifs disponibles, années précédentes comprises). On vérifie :
 *   - que la réponse attendue est juste, par une méthode INDÉPENDANTE du moteur de
 *     polynômes de l'appli : substitution de valeurs (Maths.evaluer), vérification de la
 *     solution dans l'équation de départ, recalcul du degré par différences finies… ;
 *   - que les équations prévues avec une solution unique en ont bien une seule ;
 *   - qu'aucun objectif de niveau 2 n'apparaît au niveau 1, ni au-delà de l'année ;
 *   - que la vérification accepte les réponses justes (et des écritures équivalentes),
 *     rejette les fausses et applique les exigences de forme (réduite, ordonnée, factorisée) ;
 *   - quelques conventions d'écriture dans les textes affichés (·, –, virgule décimale).
 */
'use strict';
var path = require('path');
var Maths = require(path.join(__dirname, '..', 'assets', 'maths.js'));
var Algebre = require(path.join(__dirname, '..', 'algebre', 'js', 'catalogue.js'));
var O = Algebre.Outils;
var F = Maths.Fraction;

var reussis = 0, echecs = 0;
var messagesEchecs = {};
function echec(cle, detail) {
  echecs++;
  if (!messagesEchecs[cle]) messagesEchecs[cle] = { n: 0, exemple: detail };
  messagesEchecs[cle].n++;
}
function verifierQue(cond, cle, detail) { if (cond) reussis++; else echec(cle, detail); }

function texteBrut(h) {
  return String(h || '').replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}
function egalExact(a, b) { return F.depuis(a).egal(F.depuis(b)); }
function proches(a, b) { return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }

/* ---------- méthodes indépendantes ---------- */

/** Valeurs de test des lettres (rationnelles, sans zéro). */
var JEUX = [{ base: 2 }, { base: 3 }, { base: -1 }, { base: 5 }, { base: '1/2' }, { base: -4 }];
function valeursPour(lettres, k) {
  var v = {};
  lettres.forEach(function (l, i) { v[l] = F.depuis(JEUX[(k + i) % JEUX.length].base).plus(i); });
  return v;
}
/** Égalité de deux expressions par substitution en 6 points. */
function egalesParSubstitution(a, b) {
  var lettres = Maths.lettres(a).concat(Maths.lettres(b)).filter(function (x, i, t) { return t.indexOf(x) === i; });
  for (var k = 0; k < 6; k++) {
    var v = valeursPour(lettres, k);
    var va, vb;
    try { va = Maths.evaluer(a, v); vb = Maths.evaluer(b, v); } catch (e) { continue; }
    if (!va.egal(vb)) return false;
  }
  return true;
}
/** Degré d'un polynôme (une ou deux lettres) par différences finies sur f(t·a, t·b). */
function degreParDifferences(src) {
  var lettres = Maths.lettres(src);
  var dirs = [F.depuis(3), F.depuis(-2), F.depuis(5)];
  var vals = [];
  for (var t = 0; t <= 10; t++) {
    var v = {};
    lettres.forEach(function (l, i) { v[l] = dirs[i].fois(t).plus(i === 0 ? 0 : 1); });
    vals.push(Maths.evaluer(src, v));
  }
  var d = 0;
  while (vals.length > 1 && !vals.every(function (x) { return x.egal(vals[0]); })) {
    var n = [];
    for (var i = 1; i < vals.length; i++) n.push(vals[i].moins(vals[i - 1]));
    vals = n; d++;
  }
  return d;
}
/** Coefficients d'un polynôme en x (degré ≤ 6) par interpolation exacte (pivot de Gauss). */
function coefficientsParInterpolation(src, deg) {
  var n = deg + 1, A = [], b = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    for (var j = 0; j < n; j++) row.push(new F(i).puissance(j));
    A.push(row); b.push(Maths.evaluer(src, { x: i }));
  }
  for (var c = 0; c < n; c++) {
    var piv = c; while (A[piv][c].estZero()) piv++;
    var t = A[c]; A[c] = A[piv]; A[piv] = t; var tb = b[c]; b[c] = b[piv]; b[piv] = tb;
    for (var r = 0; r < n; r++) {
      if (r === c || A[r][c].estZero()) continue;
      var f = A[r][c].divise(A[c][c]);
      for (var k = c; k < n; k++) A[r][k] = A[r][k].moins(A[c][k].fois(f));
      b[r] = b[r].moins(b[c].fois(f));
    }
  }
  return b.map(function (x, i) { return x.divise(A[i][i]); });
}
/** f(x) = g – d, supposé de degré ≤ 1 : { pente, ordonnee } exacts, ou null si non affine. */
function affine(g, d) {
  function f(x) { return Maths.evaluer('(' + g + ')-(' + d + ')', { x: x }); }
  var f0 = f(0), f1 = f(1), f2 = f(2), f7 = f(7);
  var pente = f1.moins(f0);
  if (!f2.moins(f1).egal(pente) || !f7.moins(f0).egal(pente.fois(7))) return null;
  return { pente: pente, ordonnee: f0 };
}
/** f(x) = g – d supposé de degré ≤ 2 : nombre de solutions réelles distinctes. */
function nbSolutionsDeg2(g, d) {
  function f(x) { return Maths.evaluer('(' + g + ')-(' + d + ')', { x: x }); }
  var c = f(0), a = f(1).plus(f(-1)).divise(2).moins(c), b = f(1).moins(f(-1)).divise(2);
  if (!f(3).egal(a.fois(9).plus(b.fois(3)).plus(c))) return -1;
  if (a.estZero()) return b.estZero() ? (c.estZero() ? Infinity : 0) : 1;
  var delta = b.fois(b).moins(a.fois(c).fois(4));
  return delta.signe() < 0 ? 0 : (delta.estZero() ? 1 : 2);
}
function valeurApprochee(s) { return typeof s === 'string' ? Maths.evaluerApproche(s) : F.depuis(s).valeur(); }

/* ---------- contrôle d'une question ---------- */
function controler(q, ident) {
  var c = q.controle;
  if (!c) { echec('contrôle manquant', ident); return; }
  var r = q.reponse;
  switch (c.type) {
    case 'expr':
      if (r.depart) verifierQue(egalesParSubstitution(r.depart, r.attendu), 'attendu ≠ expression de départ', ident + ' : ' + r.depart + ' ≠ ' + r.attendu);
      if (r.forme) {
        verifierQue(O.raisonForme(Maths.versTexte(r.attendu), r) === null, 'attendu sans la forme exigée', ident + ' ' + r.forme + ' : ' + r.attendu);
        // l'expression de départ (si elle n'a pas la forme) est refusée pour la forme
        if (r.depart && O.raisonForme(Maths.versTexte(r.depart), r) !== null) {
          var v = q.verifier(Maths.versTexte(r.depart));
          verifierQue(!v.juste && v.statut === 'forme', 'départ non refusé pour la forme', ident + ' : ' + r.depart + ' → ' + JSON.stringify(v));
        }
      }
      (q.pieges || []).forEach(function (pg) {
        if (pg.src !== undefined) verifierQue(!egalesParSubstitution(pg.src, r.attendu), 'piège égal à la réponse', ident + ' ' + pg.src);
      });
      if (q.visuel && q.visuel.type === 'figure') controlerFigure(q, ident);
      break;
    case 'valeur':
      verifierQue(proches(Maths.evaluerApproche(c.expr, c.valeurs), F.depuis(r.valeur).valeur()), 'valeur numérique fausse', ident + ' ' + c.expr);
      break;
    case 'antecedent':
      var vx = {}; vx.x = r.valeur;
      verifierQue(Maths.evaluer(c.expr, vx).egal(c.cible), 'antécédent faux', ident);
      verifierQue(affine(c.expr, '0') && !affine(c.expr, '0').pente.estZero(), 'antécédent non unique', ident);
      break;
    case 'contreexemple':
      var ve = { x: r.exemple };
      verifierQue(!Maths.evaluer(c.a, ve).egal(Maths.evaluer(c.b, ve)), 'contre-exemple invalide', ident);
      if (r.pasExemple !== null && r.pasExemple !== undefined) {
        var vp = { x: r.pasExemple };
        verifierQue(Maths.evaluer(c.a, vp).egal(Maths.evaluer(c.b, vp)), 'faux contre-exemple invalide', ident);
      }
      verifierQue(!egalesParSubstitution(c.a, c.b), 'expressions en fait égales', ident);
      break;
    case 'monome': {
      var ls = Maths.lettres(c.src);
      var un = {}, deux = {};
      ls.forEach(function (l) { un[l] = 1; deux[l] = 2; });
      var coef = Maths.evaluer(c.src, un);
      if (c.quoi === 'coef') verifierQue(coef.egal(r.valeur), 'coefficient faux', ident);
      else if (c.quoi === 'degre') {
        var rapport = Maths.evaluer(c.src, deux).divise(coef);
        verifierQue(rapport.egal(new F(2).puissance(Number(F.depuis(r.valeur).num))), 'degré du monôme faux', ident);
      } else verifierQue(egalesParSubstitution('(' + coef.toString() + ')*(' + r.attendu + ')', c.src), 'partie littérale fausse', ident);
      break;
    }
    case 'semblables':
      c.options.forEach(function (o) {
        var lettres = Maths.lettres(c.ref + '+' + o.src);
        var v1 = valeursPour(lettres, 0), v2 = valeursPour(lettres, 3);
        var semblable = Maths.lettres(o.src).join() === Maths.lettres(c.ref).join() &&
          Maths.evaluer(o.src, v1).divise(Maths.evaluer(c.ref, v1)).egal(Maths.evaluer(o.src, v2).divise(Maths.evaluer(c.ref, v2)));
        verifierQue(semblable === o.juste, 'monômes semblables mal classés', ident + ' ' + o.src);
      });
      break;
    case 'degre':
      verifierQue(egalExact(degreParDifferences(c.src), r.valeur), 'degré du polynôme faux', ident + ' ' + c.src);
      break;
    case 'coefPoly': {
      var k = c.l.x || 0;
      var coefs = coefficientsParInterpolation(c.src, 6);
      verifierQue(coefs[k].egal(r.valeur), 'coefficient du polynôme faux', ident);
      break;
    }
    case 'paires':
      c.paires.forEach(function (pr, i) {
        verifierQue(egalesParSubstitution(pr[0], pr[1]) === (i !== c.fausse), 'ligne fausse mal placée (conventions)', ident + ' ' + i);
      });
      break;
    case 'lignes':
      for (var i = 1; i < c.lignes.length; i++) {
        var eq = egalesParSubstitution(c.lignes[i - 1], c.lignes[i]);
        verifierQue(eq === (i !== c.fausse), 'ligne fausse mal placée (calcul)', ident + ' ligne ' + i + ' : ' + c.lignes[i - 1] + ' → ' + c.lignes[i]);
      }
      break;
    case 'lignesEq': {
      var sol = function (l) { var a = affine(l[0], l[1]); return a.ordonnee.oppose().divise(a.pente); };
      for (var j = 1; j < c.lignes.length; j++) {
        verifierQue(sol(c.lignes[j - 1]).egal(sol(c.lignes[j])) === (j !== c.fausse), 'ligne fausse mal placée (équation)', ident + ' ligne ' + j);
      }
      break;
    }
    case 'egalite':
      verifierQue(egalesParSubstitution(c.a, c.b) === c.vrai, 'vrai/faux : égalité mal évaluée', ident + ' ' + c.a + ' = ' + c.b);
      verifierVraiFaux(q, c.vrai, ident);
      break;
    case 'convention':
      verifierVraiFaux(q, c.vrai, ident);
      break;
    case 'traduction':
      verifierQue(q.choix.filter(function (x) { return x.juste; }).length === 1, 'traduction : une seule bonne réponse', ident);
      break;
    case 'equation': {
      var a = affine(c.g, c.d);
      verifierQue(!!a, 'équation non affine', ident);
      if (!a) break;
      if (c.special === 'tous') verifierQue(a.pente.estZero() && a.ordonnee.estZero() && r.tous, 'S = ℝ attendu', ident);
      else if (c.special === 'aucune') verifierQue(a.pente.estZero() && !a.ordonnee.estZero() && r.valeurs.length === 0, 'S = { } attendu', ident);
      else {
        verifierQue(!a.pente.estZero(), 'solution non unique', ident + ' ' + c.g + ' = ' + c.d);
        verifierQue(r.valeurs.length === 1, 'une seule solution attendue', ident);
        var vs = { x: r.valeurs[0] };
        verifierQue(Maths.evaluer(c.g, vs).egal(Maths.evaluer(c.d, vs)), 'la solution ne vérifie pas l\'équation', ident + ' ' + c.g + ' = ' + c.d);
      }
      break;
    }
    case 'estSolution': {
      var v2 = { x: c.v };
      verifierQue(Maths.evaluer(c.g, v2).egal(Maths.evaluer(c.d, v2)) === c.vrai, 'est-solution mal évalué', ident);
      verifierVraiFaux(q, c.vrai, ident);
      break;
    }
    case 'regle': {
      var cands = [];
      for (var t = -12; t <= 12; t++) cands.push(new F(t));
      var a1 = affine(c.e1[0], c.e1[1]);
      if (a1 && !a1.pente.estZero()) cands.push(a1.ordonnee.oppose().divise(a1.pente));
      var memes = cands.every(function (x) {
        var vv = { x: x };
        return Maths.evaluer(c.e1[0], vv).egal(Maths.evaluer(c.e1[1], vv)) === Maths.evaluer(c.e2[0], vv).egal(Maths.evaluer(c.e2[1], vv));
      });
      verifierQue(memes === c.equivalentes, 'équivalence des équations mal évaluée', ident + ' ' + c.e1 + ' / ' + c.e2);
      break;
    }
    case 'probleme': {
      var vsol = { x: c.sol };
      verifierQue(Maths.evaluer(c.eq[0], vsol).egal(Maths.evaluer(c.eq[1], vsol)), 'problème : solution fausse', ident);
      var ap = affine(c.eq[0], c.eq[1]);
      verifierQue(ap && !ap.pente.estZero(), 'problème : solution non unique', ident);
      c.faux.forEach(function (f) {
        var same = egalesParSubstitution('(' + f[0] + ')-(' + f[1] + ')', '(' + c.eq[0] + ')-(' + c.eq[1] + ')');
        verifierQue(!same, 'problème : une équation fausse est en fait juste', ident + ' ' + f);
      });
      verifierQue(c.sol > 0, 'problème : solution négative', ident);
      if (r.type === 'nombre') verifierQue(egalExact(r.valeur, c.sol), 'problème : réponse ≠ solution', ident);
      break;
    }
    case 'formule': {
      var autres = Maths.lettres(c.eq[0] + '+' + c.eq[1]).filter(function (l) { return l !== c.cible; });
      for (var kf = 0; kf < 5; kf++) {
        var vf = {};
        autres.forEach(function (l, i) { vf[l] = new F(2 + kf + 3 * i, 1 + (kf % 3)); });
        vf[c.cible] = Maths.evaluer(c.src, vf);
        verifierQue(Maths.evaluer(c.eq[0], vf).egal(Maths.evaluer(c.eq[1], vf)), 'formule : expression fausse', ident + ' ' + c.cible + ' = ' + c.src);
      }
      break;
    }
    case 'systeme': {
      var vxy = { x: r.x, y: r.y };
      c.equations.forEach(function (e) { verifierQue(Maths.evaluer(e[0], vxy).egal(Maths.evaluer(e[1], vxy)), 'système : couple faux', ident); });
      function coefs(e) { var f0 = Maths.evaluer(e[0], { x: 0, y: 0 }); return [Maths.evaluer(e[0], { x: 1, y: 0 }).moins(f0), Maths.evaluer(e[0], { x: 0, y: 1 }).moins(f0)]; }
      var k1 = coefs(c.equations[0]), k2 = coefs(c.equations[1]);
      verifierQue(!k1[0].fois(k2[1]).moins(k1[1].fois(k2[0])).estZero(), 'système : solution non unique', ident);
      break;
    }
    case 'systemeVF': {
      var vc = { x: c.couple[0], y: c.couple[1] };
      var ok = c.equations.every(function (e) { return Maths.evaluer(e[0], vc).egal(Maths.evaluer(e[1], vc)); });
      verifierQue(ok === c.vrai, 'système vrai/faux mal évalué', ident);
      verifierVraiFaux(q, c.vrai, ident);
      break;
    }
    case 'deg2': {
      var nb = nbSolutionsDeg2(c.g, c.d);
      verifierQue(nb === c.nb && r.valeurs.length === nb, 'deuxième degré : nombre de solutions', ident + ' ' + c.g + ' = ' + c.d + ' : ' + nb + ' / ' + r.valeurs.length);
      r.valeurs.forEach(function (s) {
        var x = valeurApprochee(s);
        verifierQue(proches(Maths.evaluerApproche(c.g, { x: x }), Maths.evaluerApproche(c.d, { x: x })), 'deuxième degré : solution fausse', ident + ' ' + s);
      });
      break;
    }
    case 'deg2pb': {
      var vd = { x: c.sol };
      verifierQue(Maths.evaluer(c.eq[0], vd).egal(Maths.evaluer(c.eq[1], vd)) && c.sol > 0, 'deuxième degré (problème) : solution fausse', ident);
      break;
    }
    default:
      echec('type de contrôle inconnu', ident + ' ' + c.type);
  }
}

function verifierVraiFaux(q, vrai, ident) {
  var bonnes = q.choix.filter(function (x) { return x.juste; });
  verifierQue(bonnes.length === 1, 'vrai/faux : une seule bonne option', ident);
  if (bonnes.length === 1 && q.type === 'vraifaux') {
    var debut = texteBrut(bonnes[0].h).trim();
    verifierQue(debut.indexOf(vrai ? 'Vrai' : 'Faux') === 0, 'vrai/faux : verdict incohérent', ident + ' ' + debut);
  }
  var textes = q.choix.map(function (x) { return texteBrut(x.h); });
  verifierQue(textes.every(function (t, i) { return textes.indexOf(t) === i; }), 'options en double', ident + ' ' + textes.join(' | '));
}

function controlerFigure(q, ident) {
  var f = q.visuel.figure, r = q.reponse, att;
  var L = f.longueur, l = f.largeur;
  function s(t) { return '(' + String(t).replace(/–/g, '-') + ')'; }
  if (f.forme === 'triangle') att = f.cotes.map(s).join('+');
  else if (f.forme === 'carre') att = r.nom === 'P' ? '4*' + s(f.cote) : s(f.cote) + '^2';
  else if (f.forme === 'enleve') att = r.nom === 'P' ? '2*' + s(L) + '+2*' + s(l) : s(L) + '*' + s(l) + '-' + s(f.coin) + '^2';
  else att = r.nom === 'P' ? '2*' + s(L) + '+2*' + s(l) : s(L) + '*' + s(l);
  verifierQue(egalesParSubstitution(att, r.attendu), 'figure : expression fausse', ident + ' ' + JSON.stringify(f) + ' ' + r.attendu);
}

/** Conventions d'écriture dans les textes affichés. */
function controlerEcriture(q, ident) {
  var textes = [q.enonce, q.consigne, q.indice, q.verification, q.attenduHtml].concat(q.etapes.map(function (e) { return e.texte + ' ' + e.calcul; }))
    .concat((q.choix || []).map(function (c) { return c.h + ' ' + (c.message || ''); }));
  var t = texteBrut(textes.join(' \n '));
  verifierQue(!/[*×÷]/.test(t), 'signe de multiplication ou de division non conforme', ident + ' : ' + (t.match(/.{0,30}[*×÷].{0,30}/) || [''])[0]);
  verifierQue(!/\d\s?-\s?\d|\s-\s|\(-|^-|=\s?-/.test(t), 'signe moins ASCII affiché', ident + ' : ' + (t.match(/.{0,30}(\d\s?-\s?\d|\s-\s|\(-|=\s?-).{0,30}/) || [''])[0]);
  var sansMontants = t.replace(/\d+\.\d\d(\s| )francs?/g, '').replace(/CHF\s\d+\.\d\d/g, '');
  verifierQue(!/\d\.\d/.test(sansMontants), 'point décimal au lieu de la virgule', ident + ' : ' + (sansMontants.match(/.{0,30}\d\.\d.{0,30}/) || [''])[0]);
  verifierQue(!/undefined|NaN|\[object/.test(t), 'texte mal construit', ident + ' : ' + (t.match(/.{0,40}(undefined|NaN|\[object).{0,40}/) || [''])[0]);
  verifierQue(!/aide-mémoire[^.]*page|p\.\s?\d/i.test(t), 'renvoi par numéro de page', ident);
  verifierQue(!/Viète/.test(t), 'nom « formule de Viète » encore affiché (nomenclature provisoire : formule de résolution)', ident);
}

/* ---------- bornes de difficulté (calibrage de l'enseignante) ----------
 * Mesures faites ici, sans le moteur de polynômes de l'appli :
 *   - nombres écrits juste devant une lettre ou une parenthèse (coefficients) ;
 *   - coefficient négatif devant une lettre ;
 *   - nombre de termes écrits, profondeur des parenthèses ;
 *   - étapes de résolution d'une équation du premier degré (calculées par substitution) ;
 *   - nature de la solution (entière, décimale, fraction, S = { }, S = ℝ).
 */
var ETAPES_MAX = { 1: 2, 2: 3, 3: 4, 4: 5 };
var TERMES_MAX = { 9: { 1: 2, 2: 3, 3: 4, 4: 4 }, 10: { 1: 3, 2: 4, 3: 5, 4: 6 } };
// objectifs dont les nombres viennent d'un contexte (prix, longueurs…) : pas de borne sur les coefficients
// et formes développées à factoriser (les coefficients y sont des produits)
var CONTEXTE = /pb|geo|expr|sys|deg2|graph|form|preuve|fact|mev|rem/;

function sourcesDepart(q) {
  var r = q.reponse, c = q.controle || {}, s = [];
  if (r.depart) s.push(r.depart);
  if (c.type === 'equation' || c.type === 'estSolution') s.push(c.g, c.d);
  if (c.type === 'regle') s.push(c.e1[0], c.e1[1]);
  if (c.type === 'lignesEq') s.push(c.lignes[0][0], c.lignes[0][1]);
  return s;
}
function profondeur(src) {
  var p = 0, max = 0;
  String(src).replace(/\[/g, '(').replace(/\]/g, ')').split('').forEach(function (ch) { if (ch === '(') { p++; max = Math.max(max, p); } if (ch === ')') p--; });
  return max;
}
function termesEcrits(src) {
  var n = 0;
  (function f(x) { if (!x.parentheses && (x.type === '+' || x.type === '-')) { f(x.g); f(x.d); } else if (!x.parentheses && x.type === 'neg') f(x.arg); else n++; })(Maths.analyser(src));
  return n;
}
/** Coefficients écrits devant une lettre ou une parenthèse (« 12x », « 3(x + 1) », « 4 · x »). */
function coefficientsEcrits(src) {
  var t = String(src).replace(/\^\(?-?\d+\)?/g, '').replace(/\s/g, '').replace(/\|/g, ' ');
  var res = [], re = /(\d+(?:[.,]\d+)?)\*?(?=[a-zA-Z(])/g, m;
  while ((m = re.exec(t))) res.push(Number(m[1].replace(',', '.')));
  return res;
}
/** Étapes de résolution de g = d (premier degré), mesurées par substitution. */
function etapesEquation(g, d) {
  function aff(s) { var v0 = Maths.evaluer(s, { x: 0 }), v1 = Maths.evaluer(s, { x: 1 }); return { a: v1.moins(v0), b: v0 }; }
  var G = aff(g), D = aff(d), n = 0;
  if (/\/\d/.test(g + d)) {                       // fractions : multiplier les deux membres par le dénominateur commun
    n++;
    var m = 1;
    [G.a, G.b, D.a, D.b].forEach(function (f) { var dd = Number(f.den); m = m * dd / pgcdN(m, dd); });
    G = { a: G.a.fois(m), b: G.b.fois(m) }; D = { a: D.a.fois(m), b: D.b.fois(m) };
  } else if (/[(\[]/.test(g + d)) n++;               // développer et réduire
  if (!G.a.estZero() && !D.a.estZero()) n++;       // inconnue des deux côtés
  var cotX = G.a.estZero() ? D : G;
  if (!cotX.b.estZero()) n++;                      // nombre du côté de l'inconnue
  if (!G.a.moins(D.a).abs().egal(1)) n++;          // diviser par le coefficient
  return n;
}
function pgcdN(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
function natureSolution(r) {
  if (r.tous) return 'tous';
  if (!r.valeurs.length) return 'vide';
  var vals = r.valeurs.map(function (v) { return typeof v === 'string' ? null : F.depuis(v); });
  if (vals.some(function (v) { return v === null; })) return 'irrationnelle';
  if (vals.every(function (v) { return v.estEntier(); })) return 'entier';
  if (vals.every(function (v) { return v.estDecimale(); })) return 'decimal';
  return 'fraction';
}

function controlerBornes(q, ident, d, niveau, anneeObjectif) {
  var r = q.reponse, c = q.controle || {}, id = q.objectif;
  var src = sourcesDepart(q);
  var tout = src.join(' | ');
  // nombre de lettres : D1 une seule variable (sauf systèmes, formules, monômes à deux lettres en conventions)
  if (d === 1 && src.length && !/sys|form/.test(id)) {
    var ls = Maths.lettres(src.map(function (x) { return '(' + x + ')'; }).join('+'));
    verifierQue(ls.length <= 1, 'D1 : plus d\'une variable', ident + ' ' + tout);
  }
  // D1 : coefficients positifs devant les lettres
  if (d === 1 && !/graph/.test(id)) verifierQue(!/-\s*\d*\s*\*?\s*[a-zA-Z(]/.test(tout.replace(/\s/g, '')), 'D1 : coefficient négatif', ident + ' ' + tout);
  // coefficients ≤ 9 (hors contextes)
  if (!CONTEXTE.test(id)) {
    var co = coefficientsEcrits(tout);
    verifierQue(co.every(function (x) { return x <= 9; }), 'coefficient > 9 (' + id + ')', ident + ' ' + tout);
  }
  // termes écrits (réduction)
  if (/A9-red|A10-red/.test(id) && r.depart && c.type === 'expr') {
    var nt = termesEcrits(r.depart);
    verifierQue(nt <= TERMES_MAX[anneeObjectif][d], 'trop de termes à réduire', ident + ' ' + nt + ' : ' + r.depart);
  }
  // parenthèses : imbriquées seulement en D3 (module A) / D4 (équations de 10e)
  src.forEach(function (x) {
    var pr = profondeur(x);
    if (id.charAt(0) === 'A') verifierQue(pr <= (d >= 3 ? 3 : 1), 'parenthèses imbriquées trop tôt', ident + ' ' + x);
    else if (/res|voc/.test(id)) verifierQue(pr <= (d >= 4 ? 2 : 1) && (d >= 2 || pr === 0 || /11/.test(id)), 'parenthèses trop tôt (équation)', ident + ' ' + x);
  });
  // équations du premier degré : étapes et nature de la solution
  if (c.type === 'equation' && /res|graph/.test(id)) {
    if (!c.special) verifierQue(etapesEquation(c.g, c.d) <= ETAPES_MAX[d], 'trop d\'étapes de résolution', ident + ' ' + etapesEquation(c.g, c.d) + ' : ' + c.g + ' = ' + c.d);
    var nat = natureSolution(r);
    var permises;
    if (d <= 3 || /graph/.test(id)) permises = ['entier'];
    else if (anneeObjectif === 10) permises = niveau === 2 ? ['entier', 'fraction', 'decimal', 'vide', 'tous'] : ['entier'];
    else permises = niveau === 2 ? ['entier', 'fraction', 'decimal', 'vide', 'tous'] : ['entier', 'decimal'];
    verifierQue(permises.indexOf(nat) >= 0, 'solution hors calibrage (' + nat + ')', ident + ' ' + c.g + ' = ' + c.d);
    if (nat === 'fraction') verifierQue(Number(F.depuis(r.valeurs[0]).den) <= 5, 'fraction non simple', ident);
    if (anneeObjectif === 10 && d === 1 && /res/.test(id)) verifierQue(/^x[+-]\d+$|^\d+\+x$/.test(c.g.replace(/\s/g, '')) && /^-?\d+$/.test(c.d), 'D1 (10e) : forme x + a = b attendue', ident + ' ' + c.g + ' = ' + c.d);
    if (anneeObjectif === 11 && d <= 1) verifierQue(!/\//.test(c.g + c.d), 'fraction avant D2 (11e)', ident);
  }
  // contenus réservés à une difficulté
  if (id === 'A11-fact' && d <= 2) verifierQue(!r.nbFacteurs, 'facteur commun polynôme avant D3', ident);
  if (id === 'A11-mev' && r.type === 'expr') verifierQue(!r.nbFacteurs && /^-?\d*[a-z^0-9]*\([^()]*\)$/.test(r.attendu.replace(/\s/g, '')), 'mise en évidence : un monôme devant UNE parenthèse attendu', ident + ' ' + r.attendu);
  if (/A11-(fact|mev)/.test(id) && d === 1 && r.attendu) verifierQue(/^\d+\(/.test(r.attendu), 'D1 : facteur numérique seul attendu', ident + ' ' + r.attendu);
  if (id === 'A11-rem' && r.forme === 'factorisee') verifierQue(d >= 3, 'factorisation par identité avant D3', ident);
  if (id === 'A11-rem' && d <= 3 && r.forme === 'factorisee') verifierQue(/\)\(/.test(r.attendu) && !/\^2/.test(r.attendu), 'D3 : seulement a² – b²', ident + ' ' + r.attendu);
  if (/A10-mul|A11-op|A10-expr|A11-pb/.test(id) && r.depart && /\)\(/.test(r.depart)) {
    verifierQue(!(anneeObjectif === 10 && niveau === 1), 'produit de binômes en 10e niveau 1', ident);
    if (id === 'A10-mul') verifierQue(d >= 1, '', ident);
  }
  if (id === 'A10-mul' && d <= 2 && r.depart) verifierQue(/^\(x[+-]\d\)\(x[+-]\d\)$/.test(r.depart.replace(/\s/g, '')), 'D1-D2 : (x + a)(x + b) attendu', ident + ' ' + r.depart);
  if (id === 'A10-mul' && d === 1 && r.depart) verifierQue(!/-/.test(r.depart), 'D1 : binômes positifs', ident + ' ' + r.depart);
  if (id === 'B11-sys' && c.equations) {
    var max = d <= 1 ? 3 : (d <= 3 ? 5 : 6);
    var cf = [];
    c.equations.forEach(function (e) { var f0 = Maths.evaluer(e[0], { x: 0, y: 0 }); cf.push(Maths.evaluer(e[0], { x: 1, y: 0 }).moins(f0).abs().valeur(), Maths.evaluer(e[0], { x: 0, y: 1 }).moins(f0).abs().valeur()); });
    if (q.type !== 'probleme') verifierQue(cf.every(function (x) { return x <= max; }), 'système : coefficient trop grand', ident + ' ' + JSON.stringify(c.equations));
    if (d <= 2 && q.type !== 'probleme') verifierQue(cf[0] === 1, 'système : substitution attendue en D1-D2 (coefficient 1)', ident + ' ' + JSON.stringify(c.equations));
    if (d <= 3 && r.type === 'couple') verifierQue(F.depuis(r.x).estEntier() && F.depuis(r.y).estEntier(), 'système : solution non entière avant D4', ident);
  }
  if (id === 'B11-deg2' && c.type === 'deg2') {
    var nat2 = natureSolution(r);
    verifierQue(nat2 !== 'irrationnelle', 'deuxième degré : solution irrationnelle', ident);
    if (d === 1) verifierQue(c.g === 'x^2' && /^\d+$/.test(c.d) && Number.isInteger(Math.sqrt(Number(c.d))), 'D1 : x² = n (carré parfait) attendu', ident + ' ' + c.g + ' = ' + c.d);
    if (d <= 3) verifierQue(!/x\^2[+-]\d+x[+-]\d+$/.test(c.g) || /\(/.test(c.g), 'trinôme avant D4', ident + ' ' + c.g);
  }
  if (id === 'B11-form' && c.type === 'formule') {
    if (c.eq[1] === 'b*h/2') verifierQue(d >= 3, 'h = 2A : b avant D3', ident);
    if (/\+/.test(c.eq[1]) && c.cible !== 'f') verifierQue(d >= 3, 'formule avec somme avant D3', ident);
  }
  // exemples de référence de l'enseignante : jamais proposés
  verifierQue(!ressembleReferenceTest(q), 'exemple de référence repris', ident + ' ' + tout);
}

/* Exemples de référence (non publics), recopiés ici indépendamment de l'appli :
 * comparaison des polynômes « g – d » ou des expressions, quelles que soient les lettres. */
var REFERENCES_TEST = [['3x-4', '11'], ['4x-3', '2x+1'], ['(2x-3)(x+4)', '0'], ['2x^2+5x-12', '0'], ['6a^2b-9ab', '0'], ['4x^3y-16xy', '0'], ['x^2-5x+6', '0'], ['2x+y', '7'], ['x-y', '2']];
function empreinte(src) {
  // valeurs en quelques points, lettres prises dans l'ordre alphabétique (indépendant du nom des lettres)
  var ls = Maths.lettres(src);
  if (!ls.length || ls.length > 3) return null;
  var pts = [[2, 3, 5], [-1, 4, 2], [3, -2, 7], [5, 1, -3]];
  return pts.map(function (pt) { var v = {}; ls.forEach(function (l, i) { v[l] = pt[i]; }); return Maths.evaluer(src, v).abs().toString(); }).join('/') + '#' + ls.length;
}
var EMPREINTES_REF = REFERENCES_TEST.map(function (e) { return empreinte('(' + e[0] + ')-(' + e[1] + ')'); });
function ressembleReferenceTest(q) {
  var r = q.reponse, c = q.controle || {}, srcs = [];
  if (r.depart) srcs.push(r.depart);
  if (r.type === 'expr') srcs.push(r.attendu);
  if (c.g && c.d) srcs.push('(' + c.g + ')-(' + c.d + ')');
  if (c.eq) srcs.push('(' + c.eq[0] + ')-(' + c.eq[1] + ')');
  if (c.equations) c.equations.forEach(function (e) { srcs.push('(' + e[0] + ')-(' + e[1] + ')'); });
  return srcs.some(function (s) {
    try {
      var e = empreinte(s);
      if (!e) return false;
      // lettres permutées : on teste aussi l'ordre inverse pour deux lettres
      var ls = Maths.lettres(s);
      var e2 = ls.length === 2 ? empreinte(s.replace(new RegExp(ls[0], 'g'), '§').replace(new RegExp(ls[1], 'g'), ls[0]).replace(/§/g, ls[1])) : null;
      return EMPREINTES_REF.indexOf(e) >= 0 || (e2 && EMPREINTES_REF.indexOf(e2) >= 0);
    } catch (err) { return false; }
  });
}

/* ---------- boucle principale ---------- */
var parCombinaison = {};
var debut = Date.now();
['A', 'B'].forEach(function (module) {
  [9, 10, 11].forEach(function (annee) {
    [1, 2].forEach(function (niveau) {
      var profil = { annee: annee, niveau: niveau };
      var dispo = Algebre.objectifsPour(module, profil);
      // jamais au-delà de l'année et du niveau
      dispo.forEach(function (d) {
        verifierQue(d.objectif.annee <= annee, 'objectif au-delà de l\'année', module + ' ' + annee + 'e : ' + d.objectif.id);
        verifierQue(d.objectif.niveaux.indexOf(niveau) >= 0, 'objectif de niveau 2 proposé au niveau 1', module + ' ' + annee + 'e N' + niveau + ' : ' + d.objectif.id);
      });
      if (!dispo.length) {
        verifierQue(module === 'B' && annee === 9, 'module sans objectif', module + ' ' + annee + 'e N' + niveau);
        return;
      }
      var ids = dispo.map(function (d) { return d.objectif.id; });
      [1, 2, 3, 4].forEach(function (diff) {
        var cle = module + ' ' + annee + 'e N' + niveau + ' D' + diff;
        var total = 0, vusObjectifs = {};
        for (var serie = 0; total < 500; serie++) {
          var qs;
          try {
            qs = Algebre.creerSerie({ module: module, profil: profil, difficulte: diff, objectifs: ids, graine: cle + '#' + serie, strict: true });
          } catch (e) { echec('génération impossible', cle + ' série ' + serie + ' : ' + e.stack.split('\n').slice(0, 3).join(' | ')); total += 10; continue; }
          qs.forEach(function (q) {
            total++;
            vusObjectifs[q.objectif] = true;
            var ident = cle + ' ' + q.objectif + ' (' + q.type + ')';
            var o = Algebre.parId[q.objectif];
            verifierQue(o.niveaux.indexOf(niveau) >= 0 && o.annee <= annee, 'objectif hors profil dans une série', ident);
            var plusLoin = niveau === 1 && (o.plusLoinN1 || []).indexOf(annee) >= 0;
            verifierQue(q.compte === !plusLoin && (q.statut === 'plusLoin') === plusLoin, '« pour aller plus loin » mal compté', ident);
            verifierQue(q.difficulte === diff, 'difficulté incorrecte', ident);
            try { controlerBornes(q, ident, diff, niveau, o.annee); } catch (e) { echec('exception dans le contrôle des bornes', ident + ' : ' + e.stack.split('\n').slice(0, 2).join(' | ')); }
            try { controler(q, ident); } catch (e) { echec('exception dans le contrôle', ident + ' : ' + e.stack.split('\n').slice(0, 2).join(' | ')); }
            var ex = q.exemples();
            verifierQue(ex.justes.length > 0, 'aucun exemple de réponse juste', ident);
            ex.justes.forEach(function (j) {
              var res = q.verifier(j);
              verifierQue(res.juste, 'réponse juste refusée', ident + ' : « ' + j + ' » → ' + JSON.stringify(res));
            });
            ex.faux.forEach(function (f) {
              var res = q.verifier(f);
              verifierQue(!res.juste, 'réponse fausse acceptée', ident + ' : « ' + f + ' »');
              if (!res.juste) verifierQue(res.message && res.message.length > 5, 'rétroaction vide', ident + ' : « ' + f + ' »');
            });
            verifierQue(!q.verifier('').juste && q.verifier('').statut === 'illisible', 'réponse vide non signalée', ident);
            controlerEcriture(q, ident);
            verifierQue(q.etapes.length > 0 && !!q.rubrique && !!q.indice, 'correction, indice ou renvoi manquant', ident);
          });
        }
        parCombinaison[cle] = { questions: total, objectifs: Object.keys(vusObjectifs).length, dispo: ids.length };
        verifierQue(total >= 500, 'moins de 500 questions', cle);
        verifierQue(Object.keys(vusObjectifs).length === ids.length, 'objectifs jamais tirés', cle + ' : ' + ids.filter(function (i) { return !vusObjectifs[i]; }).join(', '));
      });
    });
  });
});

/* ---------- factorisation : niveau 2 ; mise en évidence d'un monôme « pour aller plus loin » en 11e N1 ---------- */
(function () {
  var n1 = Algebre.objectifsPour('A', { annee: 11, niveau: 1 }), n2 = Algebre.objectifsPour('A', { annee: 11, niveau: 2 });
  function statut(liste, id) { var d = liste.filter(function (x) { return x.objectif.id === id; })[0]; return d ? d.statut : null; }
  verifierQue(statut(n1, 'A11-fact') === null, 'factorisation proposée au niveau 1', '');
  verifierQue(statut(n1, 'A11-mev') === 'plusLoin', 'mise en évidence non proposée « pour aller plus loin » en 11e N1', statut(n1, 'A11-mev'));
  verifierQue(statut(n2, 'A11-fact') === 'courant' && statut(n2, 'A11-mev') === null, 'factorisation de 11e N2', '');
  verifierQue(Algebre.selectionParDefaut('A', { annee: 11, niveau: 1 }).indexOf('A11-mev') < 0, '« pour aller plus loin » coché par défaut', '');
  verifierQue(statut(Algebre.objectifsPour('A', { annee: 10, niveau: 1 }), 'A11-mev') === null, 'mise en évidence proposée en 10e', '');
})();

/* ---------- tests ciblés de la vérification ---------- */
function q(reponse, extra) { var o = { reponse: reponse }; for (var k in extra || {}) o[k] = extra[k]; return O.finaliser(o); }
function attendre(question, texte, juste, statut, cle) {
  var r = question.verifier(texte);
  verifierQue(r.juste === juste && (!statut || r.statut === statut), cle, '« ' + texte + ' » → ' + JSON.stringify(r));
}
var red = q({ type: 'expr', attendu: '5x-1', forme: 'reduite', depart: '3x+2x-1' });
attendre(red, '5x – 1', true, 'juste', 'réduite : juste');
attendre(red, '-1+5x', true, 'juste', 'réduite : ordre libre');
attendre(red, '3x + 2x – 1', false, 'forme', 'réduite : termes semblables refusés');
attendre(red, 'x · 5 – 1', false, 'forme', 'réduite : écriture non simplifiée refusée');
attendre(red, '5x + 1', false, 'faux', 'réduite : signe faux');
attendre(red, '5x – 1 + 0', false, 'forme', 'réduite : terme nul refusé');
attendre(red, '5x-', false, 'illisible', 'saisie incomplète');
var ordo = q({ type: 'expr', attendu: '2x^2-3x+1', forme: 'ordonnee', lettre: 'x' });
attendre(ordo, '2x² – 3x + 1', true, 'juste', 'ordonnée décroissante');
attendre(ordo, '1 – 3x + 2x²', true, 'juste', 'ordonnée croissante acceptée');
attendre(ordo, '– 3x + 2x² + 1', false, 'forme', 'non ordonnée refusée');
var fact = q({ type: 'expr', attendu: '6x(2x-3)', forme: 'factorisee' });
attendre(fact, '6x(2x – 3)', true, 'juste', 'factorisée');
attendre(fact, '(2x – 3) · 6x', true, 'juste', 'factorisée : ordre des facteurs libre');
attendre(fact, '– 6x(3 – 2x)', true, 'juste', 'factorisée : signe mis en évidence');
attendre(fact, '3x(4x – 6)', false, 'forme', 'factorisation incomplète refusée');
attendre(fact, '6(2x² – 3x)', false, 'forme', 'factorisation incomplète (lettre) refusée');
attendre(fact, '12x² – 18x', false, 'forme', 'somme refusée');
attendre(fact, '6x(2x + 3)', false, 'faux', 'factorisation fausse');
var rem = q({ type: 'expr', attendu: '(x+3)(x-3)', forme: 'factorisee', nbFacteurs: 2 });
attendre(rem, '(x – 3)(x + 3)', true, 'juste', 'identité : juste');
attendre(rem, '1(x² – 9)', false, 'forme', 'identité : non factorisée refusée');
var carre = q({ type: 'expr', attendu: '(x+3)^2', forme: 'factorisee', nbFacteurs: 2 });
attendre(carre, '(x + 3)²', true, 'juste', 'carré : juste');
attendre(carre, '(x + 3)(x + 3)', true, 'juste', 'carré écrit en produit');
var sol = q({ type: 'solutions', valeurs: [new F(5, 3)], equation: ['3x', '5'], lettre: 'x' });
['5/3', 'x = 5/3', 'S = { 5/3 }', 'S={5/3}', '1,6̅', '10/6'].forEach(function (t) { attendre(sol, t, true, 'juste', 'solution fractionnaire acceptée'); });
attendre(sol, '1,67', false, 'faux', 'solution arrondie refusée');
attendre(sol, 'S = { }', false, 'faux', 'ensemble vide refusé');
var dec = q({ type: 'solutions', valeurs: [new F(5, 2)], equation: ['2x', '5'], lettre: 'x' });
['2,5', '2.5', '5/2', 'S = { 2,5 }'].forEach(function (t) { attendre(dec, t, true, 'juste', 'décimal exact accepté'); });
var deux = q({ type: 'solutions', valeurs: [new F(-3), new F(3)], equation: ['x^2', '9'], lettre: 'x' });
attendre(deux, 'S = { – 3 ; 3 }', true, 'juste', 'deux solutions');
attendre(deux, '3 ; -3', true, 'juste', 'deux solutions, ordre libre');
attendre(deux, 'x = 3 ou x = – 3', true, 'juste', 'deux solutions avec « ou »');
attendre(deux, '3', false, 'faux', 'solution manquante');
var irr = q({ type: 'solutions', valeurs: ['-√7', '√7'], equation: ['x^2', '7'], lettre: 'x' });
attendre(irr, 'S = { – √7 ; √7 }', true, 'juste', 'solutions irrationnelles');
attendre(irr, '2,65 ; – 2,65', false, 'faux', 'solutions irrationnelles arrondies refusées');
var tous = q({ type: 'solutions', valeurs: [], tous: true, equation: ['2x+2', '2(x+1)'], lettre: 'x' });
attendre(tous, 'S = ℝ', true, 'juste', 'S = ℝ');
attendre(tous, 'R', true, 'juste', 'S = R');
attendre(tous, 'S = { }', false, 'faux', 'S = ℝ : vide refusé');
var vide = q({ type: 'solutions', valeurs: [], equation: ['2x+1', '2x+3'], lettre: 'x' });
attendre(vide, 'S = { }', true, 'juste', 'S = { }');
attendre(vide, '{}', true, 'juste', 'S = { } sans espace');
var couple = q({ type: 'couple', x: new F(-2), y: new F(9, 2), lettres: ['x', 'y'], equations: [['x+y', '5/2'], ['x-y', '-13/2']] });
['(– 2 ; 4,5)', 'S = { (– 2 ; 4,5) }', 'x = -2 ; y = 9/2', '(-2;4.5)'].forEach(function (t) { attendre(couple, t, true, 'juste', 'couple accepté'); });
attendre(couple, '(4,5 ; – 2)', false, 'faux', 'couple inversé refusé');
var formule = q({ type: 'formule', attendu: 'd/v', variable: 't', formule: ['v', 'd/t'] });
attendre(formule, 't = d/v', true, 'juste', 'formule juste');
attendre(formule, 'd : v', true, 'juste', 'formule avec « : »');
attendre(formule, 'd · v', false, 'faux', 'formule fausse');
attendre(formule, 'd/t', false, 'forme', 'formule contenant encore la variable');

/* ---------- erreurs typiques nommées dans la rétroaction ---------- */
function message(question, texte) { return question.verifier(texte).message || ''; }
verifierQue(/3a \+ 2b ne se réduit pas/.test(message(q({ type: 'expr', attendu: '5a+2b', forme: 'reduite', depart: '3a+2a+2b' }), '7ab')), 'rétroaction 3a + 2b = 5ab', message(q({ type: 'expr', attendu: '5a+2b', forme: 'reduite', depart: '3a+2a+2b' }), '7ab'));
verifierQue(/4 \+ 5x² n'est pas 9x²/.test(message(q({ type: 'expr', attendu: '5x^2+4', forme: 'reduite', depart: '2x^2+3x^2+4' }), '9x^2')), 'rétroaction 4 + 5x² = 9x²', '');
verifierQue(/signe moins/.test(message(q({ type: 'expr', attendu: '4x-6', forme: 'reduite', depart: '7x-(3x+6)' }), '4x+6')), 'rétroaction signe moins oublié', '');
verifierQue(/signe moins/.test(message(q({ type: 'expr', attendu: '-6x-9', forme: 'reduite', depart: '-3(2x+3)' }), '-6x+9')), 'rétroaction signe moins oublié (– k)', '');
verifierQue(/n'est pas a² \+ b²/.test(message(q({ type: 'expr', attendu: 'x^2+6x+9', forme: 'ordonnee', depart: '(x+3)^2' }), 'x^2+9')), 'rétroaction (a + b)² = a² + b²', '');
verifierQue(/développé au lieu de factoriser/.test(message(q({ type: 'expr', attendu: '3x(x+2)', forme: 'factorisee', depart: '3x^2+6x' }), '3x^2+6x')), 'rétroaction développer / factoriser', '');
verifierQue(/solution opposée/.test(message(q({ type: 'solutions', valeurs: [new F(-7), new F(7)], equation: ['x^2', '49'] }), '7')), 'rétroaction solution négative oubliée', '');
(function () {
  var ctxA = { annee: 10, niveau: 1 };
  var trouve23 = false, trouveSigne = false, trouveMembre = false, k;
  var al = new Maths.Alea('erreurs-typiques');
  for (k = 0; k < 400 && !trouve23; k++) {
    var qq = Algebre.creerQuestion(Algebre.parId['A10-mono'], al, 2, ctxA);
    (qq.pieges || []).forEach(function (pg) { if (/2 · 3x = 6x, pas 6x²/.test(pg.message) && !qq.verifier(Maths.versTexte(pg.src)).juste && /6x²/.test(qq.verifier(Maths.versTexte(pg.src)).message)) trouve23 = true; });
  }
  verifierQue(trouve23, 'rétroaction 2 · 3x = 6x²', '');
  for (k = 0; k < 400 && !(trouveSigne && trouveMembre); k++) {
    var qe = Algebre.creerQuestion(Algebre.parId['B10-res'], al, 2, ctxA, { visuel: 1, erreur: 1 });
    if (!qe.pieges) continue;
    qe.pieges.forEach(function (pg) {
      var m = qe.verifier(String(pg.valeur)).message;
      if (/x \+ 5 = 12 ne donne pas x = 12 \+ 5/.test(m)) trouveSigne = true;
      if (/Un membre a été oublié/.test(m)) trouveMembre = true;
    });
  }
  verifierQue(trouveSigne, 'rétroaction « x + 5 = 12 ⇒ x = 12 + 5 »', '');
  verifierQue(trouveMembre, 'rétroaction « un membre oublié à la règle 2 »', '');
  var parx = false;
  for (k = 0; k < 600 && !parx; k++) {
    var qr = Algebre.creerQuestion(Algebre.parId['B10-voc'], al, 4, ctxA, { vraifaux: 5 });
    if (qr.controle.type === 'regle' && !qr.controle.equivalentes && /multiplié les deux membres par x/.test(qr.choix[0].message)) parx = true;
  }
  verifierQue(parx, 'règle : multiplier par l\'inconnue signalé comme non équivalent', '');
})();

/* ---------- bilan ---------- */
Object.keys(parCombinaison).forEach(function (k) {
  console.log(k.padEnd(16) + ' ' + String(parCombinaison[k].questions).padStart(4) + ' questions, ' + parCombinaison[k].objectifs + '/' + parCombinaison[k].dispo + ' objectifs');
});
Object.keys(messagesEchecs).forEach(function (k) {
  console.error('ÉCHEC ×' + messagesEchecs[k].n + ' : ' + k + '\n        ex. ' + messagesEchecs[k].exemple);
});
console.log('Durée : ' + Math.round((Date.now() - debut) / 1000) + ' s');
console.log(reussis + ' test(s) réussi(s), ' + echecs + ' échec(s).');
process.exitCode = echecs ? 1 : 0;
