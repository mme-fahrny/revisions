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
        if (q.palier <= 3 && /résous/i.test(texteBrut(q.enonce)) && q.objectif !== 'B11-res') {
          verifierQue(F.depuis(r.valeurs[0]).estEntier(), 'solution non entière aux difficultés basses', ident + ' ' + c.g + ' = ' + c.d);
        }
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
            verifierQue(q.palier === diff + (niveau === 2 ? 1 : 0), 'palier incorrect', ident);
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
