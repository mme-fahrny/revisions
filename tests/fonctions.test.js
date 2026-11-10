/*
 * Tests de l'appli « Fonctions » (logique seulement, sans navigateur).
 * Lancer :  node tests/fonctions.test.js
 *
 * Pour chaque module disponible, chaque année (9e, 10e, 11e), chaque niveau (1, 2) et
 * chaque difficulté (1 à 4) : au moins 500 questions générées avec une graine fixe
 * (tous les objectifs disponibles, années précédentes comprises). On vérifie :
 *   - que la réponse attendue est juste, recalculée par une méthode INDÉPENDANTE
 *     (calcul direct en nombres décimaux à partir des paramètres de la question) ;
 *   - les bornes de chaque difficulté (valeurs de x et de y, graduations, nombre d'étapes),
 *     selon le calibrage de l'année de l'objectif ;
 *   - les contenus exclus par année (9e : coefficients négatifs, pente, expression
 *     « … x – … ») ;
 *   - qu'aucun objectif de niveau 2 n'apparaît au niveau 1, ni au-delà de l'année ;
 *   - que la vérification accepte les réponses justes (et des écritures équivalentes)
 *     et rejette les fausses ;
 *   - qu'aucun exemple de référence de l'enseignante n'est reproduit (comparaison par
 *     empreintes : les exemples ne figurent pas en clair dans le dépôt) ;
 *   - que la bonne réponse des questions à choix n'est pas toujours à la même place ;
 *   - quelques conventions d'écriture (·, –, virgule décimale, pas de ×, ÷ ni *).
 */
'use strict';
var path = require('path');
var Maths = require(path.join(__dirname, '..', 'assets', 'maths.js'));
var Fn = require(path.join(__dirname, '..', 'fonctions', 'js', 'catalogue.js'));
var O = Fn.Outils;

var reussis = 0, echecs = 0, messages = {};
function verifierQue(cond, cle, detail) {
  if (cond) { reussis++; return; }
  echecs++;
  if (!messages[cle]) messages[cle] = { n: 0, exemple: detail };
  messages[cle].n++;
}
function nb(x) { return typeof x === 'number' ? x : Maths.Fraction.depuis(String(x)).valeur(); }
function proches(a, b) { return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }
function texteBrut(h) {
  return String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\u00a0/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}
function textesQuestion(q) {
  var t = [q.enonce, q.consigne, q.indice, q.verification];
  (q.etapes || []).forEach(function (e) { t.push(e.texte, e.calcul); });
  (q.choix || []).forEach(function (c) { t.push(c.h, c.message); });
  (q.pieges || []).forEach(function (p) { t.push(p.message); });
  return texteBrut(t.join(' \n '));
}

/* ---------- empreintes des exemples de référence (jamais en clair) ---------- */
function empreinte(texte) {
  var h = 2166136261;
  for (var i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ('0000000' + (h >>> 0).toString(16)).slice(-8);
}
var REFERENCES = ['4efeb2c6', '01fc0160', '44ff6ee8', '0fb8c8a8', '03fe54e5', '7396e873', '66d291f0', '8368a7b2', '31fcf80f'];
/** Signatures recalculées À PARTIR DES PARAMÈTRES (controle), pas de q.signatures. */
function signaturesControle(q) {
  var c = q.controle, s = [];
  var xs = c.xs || [];
  if (c.coefs && c.coefs.length >= 1 && xs.length >= 3) {
    var k = c.coefs[0], b = c.coefs.length > 1 ? c.coefs[1] : 0;
    var regulier = xs.every(function (x, i) { return i === 0 || x - xs[i - 1] === xs[1] - xs[0]; });
    if (regulier && nb(b) === 0) s.push('tableau-kx:k=' + O.tn(k) + ':depart=' + xs[0] + ':pas=' + (xs[1] - xs[0]));
  }
  if (c.calc && (c.calc.genre === 'vitesse' || c.calc.genre === 'duree')) s.push('vitesse:v=' + c.calc.v);
  return s;
}

/* ---------- recalcul indépendant de la réponse attendue ---------- */
function calculer(formule) { return Function('return (' + formule + ');')(); }
function attenduIndependant(q) {
  var c = q.controle.calc, r = q.reponse;
  function egal(v) { return proches(nb(r.valeur), v); }
  switch (c.genre) {
    case 'valeur': return egal(nb(c.a) * nb(c.x) + nb(c.b));
    case 'antecedent': return egal((nb(c.y) - nb(c.b)) / nb(c.a));
    case 'prix': return egal(nb(c.p1) / nb(c.n1) * nb(c.n2));
    case 'conversion': return c.versChf ? egal(nb(c.eur) * 9 / 10) : egal(nb(c.chf) * 10 / 9);
    case 'vitesse': return egal(nb(c.v) * nb(c.t));
    case 'duree': return egal(nb(c.d) / nb(c.v) * 60);
    case 'budget': return egal(Math.floor((c.budget - c.fixe) / c.p));
    case 'difference': return egal(Math.abs(c.eur * 9 / 10 - c.chf));
    case 'expr':
      return [-3, 0, 1, 2, 7].every(function (x) { return proches(Maths.evaluerApproche(r.attendu, { x: x }), nb(c.a) * x + nb(c.b)); });
    case 'liste':
      return r.valeurs.length === c.xs.length && c.xs.every(function (x, i) { return proches(nb(r.valeurs[i]), nb(c.a) * x + nb(c.b)); });
    case 'couple':
      return proches(nb(r.x), c.x) && proches(nb(r.y), c.y) && proches(c.y, c.a * c.x + c.b);
    case 'proportionnel': {
      var quotients = c.xs.map(function (x, i) { return c.ys[i] / x; });
      var prop = quotients.every(function (v) { return proches(v, quotients[0]); });
      var juste = q.choix.filter(function (ch) { return ch.juste; })[0];
      return prop === c.attendu && /^<strong>(Vrai|Faux)/.exec(juste.h)[1] === (prop ? 'Vrai' : 'Faux');
    }
    case 'appartient': {
      var dedans = proches(c.a * c.x + c.b, c.y);
      var j = q.choix.filter(function (ch) { return ch.juste; })[0];
      return dedans === c.attendu && /^<strong>(Vrai|Faux)/.exec(j.h)[1] === (dedans ? 'Vrai' : 'Faux');
    }
    case 'choix-param': {
      var jp = q.choix.filter(function (ch) { return ch.juste; })[0];
      if (c.contexte.fixe !== undefined) return jp.param[0] === c.contexte.p && jp.param[1] === c.contexte.fixe;
      if (c.contexte.s !== undefined) return jp.param === (c.contexte.s > 0 ? 'x^2' : '-x^2');
      return nb(jp.param[0]) === nb(c.contexte.a) && nb(jp.param[1]) === nb(c.contexte.b);
    }
    case 'choix-points': {
      var jt = q.choix.filter(function (ch) { return ch.juste; })[0];
      // le graphique juste contient bien les points (x ; ax + b)
      return jt.param === 'vrais';
    }
    case 'carre': return egal(c.s * c.x * c.x);
    case 'liste-carre': return r.valeurs.length === c.xs.length && c.xs.every(function (x, i) { return proches(nb(r.valeurs[i]), c.s * x * x); });
    case 'couple-carre': return proches(nb(r.x), c.x) && proches(nb(r.y), c.s * c.x * c.x);
    case 'pente': return egal((nb(c.y2) - nb(c.y1)) / (c.x2 - c.x1));
    case 'formule': return egal(Number(Function('return (' + c.formule + ');')()));
    case 'intersection': {
      var a1 = nb(c.l1[0]), b1 = nb(c.l1[1]), a2 = nb(c.l2[0]), b2 = nb(c.l2[1]);
      var xi = (b2 - b1) / (a1 - a2);
      return proches(nb(r.x), xi) && proches(nb(r.y), a1 * xi + b1);
    }
    case 'offres': {
      // premier entier n à partir duquel A est strictement moins chère (et le reste)
      var A = function (n) { return nb(c.A[0]) * n + nb(c.A[1]); }, B = function (n) { return nb(c.B[0]) * n + nb(c.B[1]); };
      for (var n = 0; n < 10000; n++) if (A(n) < B(n) - 1e-9 && A(n + 50) < B(n + 50)) return egal(n);
      return false;
    }
    case 'choix-nom': {
      var f = c.fonction;
      var type = f.carre ? 'parabole' : nb(f.a) === 0 ? 'constante' : nb(f.b) === 0 ? 'lineaire' : 'affine';
      return q.choix.filter(function (ch) { return ch.juste; })[0].param === type;
    }
    /* ----- module C (11e) ----- */
    case 'couple-f': return proches(nb(r.x), calculer(c.x)) && proches(nb(r.y), calculer(c.y));
    case 'liste-f': return r.valeurs.length === c.formules.length && c.formules.every(function (f, i) { return proches(nb(r.valeurs[i]), calculer(f)); });
    case 'choix-cle': return String(q.choix.filter(function (ch) { return ch.juste; })[0].param) === String(c.attendu);
    case 'choix-signes': return q.choix.filter(function (ch) { return ch.juste; })[0].param === (nb(c.a) > 0 ? 'a+' : 'a-') + (nb(c.b) > 0 ? 'b+' : 'b-');
    case 'choix-droites': {
      var memeA = proches(nb(c.f[0]), nb(c.g[0])), memeB = proches(nb(c.f[1]), nb(c.g[1]));
      return q.choix.filter(function (ch) { return ch.juste; })[0].param === (memeA ? 'paralleles' : memeB ? 'memeB' : 'rien') && !(memeA && memeB);
    }
    case 'vf-f': {
      var vf = !!calculer(c.formule);
      return /^<strong>(Vrai|Faux)/.exec(q.choix.filter(function (ch) { return ch.juste; })[0].h)[1] === (vf ? 'Vrai' : 'Faux');
    }
    case 'vf-monotone': {
      var mono = c.ys.every(function (y, i) { return i === 0 || (y - c.ys[i - 1]) * c.dit > 0; });
      return /^<strong>(Vrai|Faux)/.exec(q.choix.filter(function (ch) { return ch.juste; })[0].h)[1] === (mono ? 'Vrai' : 'Faux');
    }
    case 'sommet': {
      // le sommet annule la parenthèse ; de part et d'autre, f s'écarte du même côté (signe de a)
      var fs = function (x) { return c.a * (x - c.h) * (x - c.h) + c.k; }, sx = nb(r.x), sy = nb(r.y);
      return proches(fs(sx), sy) && (fs(sx - 1) - sy) * c.a > 0 && (fs(sx + 1) - sy) * c.a > 0 && proches(fs(sx - 1), fs(sx + 1));
    }
    case 'racines': {
      // les deux valeurs annulent ax² + bx + c, sont différentes et rangées dans l'ordre croissant
      var v1 = nb(r.valeurs[0]), v2 = nb(r.valeurs[1]), pol = function (x) { return c.a * x * x + c.b * x + c.c; };
      return r.valeurs.length === 2 && v1 < v2 && proches(pol(v1), 0) && proches(pol(v2), 0);
    }
    case 'choix': return true;
  }
  throw new Error('genre inconnu : ' + c.genre);
}

/* ---------- bornes par difficulté (calibrage de l'année de l'objectif) ---------- */
function entier(x) { return Number.isInteger(nb(x)); }
function verifierBornes(q, annee, cle) {
  var c = q.controle, d = q.difficulte;
  var xs = (c.xs || []).map(nb), ys = (c.ys || []).map(nb);
  if (annee === 9) {
    if (d === 1) {
      verifierQue(xs.every(function (x) { return entier(x) && x >= 0 && x <= 10; }), cle + ' D1 : x entier de 0 à 10', xs);
      verifierQue(ys.every(function (y) { return Math.abs(y) <= 50; }), cle + ' D1 : y au plus 50', ys);
      verifierQue(!c.grad || c.grad.every(function (g) { return g === 1 || g === 2; }), cle + ' D1 : graduations de 1 ou 2', c.grad);
      verifierQue(c.ops <= 1, cle + ' D1 : une seule étape', c.ops);
    } else if (d === 2) {
      verifierQue(xs.every(function (x) { return entier(x) && x >= -5 && x <= 10; }), cle + ' D2 : x entier de – 5 à 10', xs);
      verifierQue((c.coefs || []).every(entier), cle + ' D2 : coefficients entiers', c.coefs);
      verifierQue(c.ops <= 2, cle + ' D2 : deux étapes au plus', c.ops);
    } else if (d === 3) {
      verifierQue(c.ops <= 3, cle + ' D3 : trois étapes au plus', c.ops);
    }
    // exclusions de 9e
    verifierQue((c.coefs || []).every(function (k) { return nb(k) >= 0; }), cle + ' 9e : coefficient négatif', c.coefs);
    var t = textesQuestion(q).replace(/\s+/g, ' ');
    var sansTableaux = texteBrut([q.enonce, q.indice, q.verification].concat((q.etapes || []).map(function (e) { return e.calcul; })).join(' ').replace(/<table[\s\S]*?<\/table>/g, ' '));
    verifierQue(!/pente/i.test(t), cle + ' 9e : le mot « pente »', t.slice(0, 120));
    verifierQue(!/\dx\s*–|\bx\s–\s\d/.test(sansTableaux), cle + ' 9e : expression « … x – … »', sansTableaux.slice(0, 160));
  }
  if (annee === 10) {
    if (d === 1) {
      verifierQue(xs.every(function (x) { return entier(x) && x >= 0 && x <= 10; }), cle + ' D1 : x entier de 0 à 10', xs);
      verifierQue(ys.every(function (y) { return Math.abs(y) <= 50; }), cle + ' D1 : y au plus 50', ys);
      verifierQue(!c.grad || c.grad.every(function (g) { return g === 1 || g === 2; }), cle + ' D1 : graduations de 1 ou 2', c.grad);
      verifierQue(c.ops <= 1, cle + ' D1 : une seule étape', c.ops);
    } else if (d === 2) {
      verifierQue(xs.every(function (x) { return entier(x) && x >= -5 && x <= 10; }), cle + ' D2 : x entier de – 5 à 10', xs);
      verifierQue((c.coefs || []).every(entier), cle + ' D2 : coefficients entiers', c.coefs);
      verifierQue(c.ops <= 2, cle + ' D2 : deux étapes au plus', c.ops);
    } else if (d === 3) {
      verifierQue(c.ops <= 3, cle + ' D3 : trois étapes au plus', c.ops);
    }
    if (q.niveauEleve === 1) {
      // N1 : pas de pente décimale autre que 0,5, pas de calcul algébrique d'intersection, pas d'interprétation
      verifierQue((c.coefs || []).every(function (k) { return entier(k) || nb(k) === 0.5; }), cle + ' 10e N1 : nombre décimal autre que 0,5', c.coefs);
      verifierQue(['genIntersectionConstante', 'genIntersectionAlgebrique', 'genIntersectionLireCalculer', 'genPenteDeuxPoints', 'genExpressionDeuxPoints'].indexOf(q.modele) < 0, cle + ' 10e N1 : contenu exclu', q.modele);
      verifierQue(q.objectif !== 'B6', cle + ' 10e N1 : interprétation de a et b', q.objectif);
    }
    verifierQue(['genPenteDeuxPoints', 'genExpressionDeuxPoints'].indexOf(q.modele) < 0, cle + ' 10e : pente calculée (11e seulement)', q.modele);
  }
  if (annee === 11) {
    if (d === 1) verifierQue(c.ops <= 1, cle + ' D1 : une seule étape', c.ops);
    else if (d === 2) verifierQue(c.ops <= 2, cle + ' D2 : deux étapes au plus', c.ops);
    else if (d === 3) verifierQue(c.ops <= 3, cle + ' D3 : trois étapes au plus', c.ops);
    var fonctions = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].indexOf(q.objectif) >= 0;
    if (fonctions && d === 1 && ['genNomCourbe'].indexOf(q.modele) < 0) {
      verifierQue(!(c.coefs || []).length || Math.abs(nb(c.coefs[0])) <= 4, cle + ' 11e D1 : a de – 4 à 4', c.coefs);
    }
    if (q.niveauEleve === 1) {
      // N1 : coefficients entiers ; ni racine carrée, ni ax² + bx + c tracé, ni a(x – b)² + c, ni débit, ni croissance
      if (fonctions) verifierQue((c.coefs || []).every(entier), cle + ' 11e N1 : coefficient non entier', c.coefs);
      verifierQue(['genSommetParabole', 'genCanoniqueGraph', 'genDebit', 'genEquation2Graph'].indexOf(q.modele) < 0, cle + ' 11e N1 : contenu réservé au niveau 2', q.modele);
      verifierQue(q.objectif !== 'C11', cle + ' 11e N1 : croissance et décroissance', q.objectif);
      var tq = textesQuestion(q);
      verifierQue(!/√|racine carrée/.test(tq), cle + ' 11e N1 : racine carrée', q.modele);
      verifierQue(!/débit/i.test(tq), cle + ' 11e N1 : débit', q.modele);
    }
  }
}

/* ---------- conventions d'écriture ---------- */
function verifierConventions(q, cle) {
  var t = textesQuestion(q).replace(/CHF\s*\d[\d']*\.\d\d/g, '').replace(/\d[\d']*\.\d\d\s*francs?/g, '');
  verifierQue(!/[×÷*]/.test(t), cle + ' : ×, ÷ ou * affiché', t.slice(0, 160));
  // jamais de produit implicite avec un nombre négatif entre parenthèses (« x(– 2) », « (– 3)x ») : bug d'écriture
  verifierQue(!/[0-9x²]\(\s*–\s*[\d,]+\s*\)|\(\s*–\s*[\d,]+\s*\)x/.test(t), cle + ' : écriture « x(– 2) » ou « (– 3)x »', (/.{0,30}(\(\s*–\s*[\d,]+\s*\)).{0,20}/.exec(t) || [''])[0]);
  verifierQue(!/\d\.\d/.test(t), cle + ' : point décimal hors montant', (/.{0,30}\d\.\d.{0,30}/.exec(t) || [''])[0]);
  verifierQue(!/(^|[\s(=])-\s?\d/.test(t), cle + ' : tiret au lieu du signe moins', (/.{0,30}(^|[\s(=])-\s?\d.{0,30}/.exec(t) || [''])[0]);
  verifierQue(/Voir|./.test(q.rubrique || ''), cle + ' : rubrique de l\'aide-mémoire manquante', q.modele);
  verifierQue(q.etapes.length >= 1 && q.etapes.every(function (e, i) { return e.titre === 'ÉTAPE ' + (i + 1); }), cle + ' : étapes de correction', q.modele);
  if (/Données fictives/.test(q.enonce)) reussis++;
}

/* ---------- vérification des réponses ---------- */
function verifierCorrection(q, cle) {
  var ex = q.exemples();
  ex.justes.forEach(function (t) {
    var r = q.verifier(t);
    verifierQue(r.juste, cle + ' : bonne réponse refusée', q.modele + ' « ' + t + ' » → ' + r.message);
  });
  ex.faux.forEach(function (t) {
    var r = q.verifier(t);
    verifierQue(!r.juste, cle + ' : mauvaise réponse acceptée', q.modele + ' « ' + t + ' »');
    verifierQue(r.statut !== 'illisible', cle + ' : mauvaise réponse jugée illisible', q.modele + ' « ' + t + ' » → ' + r.message);
  });
  (q.pieges || []).forEach(function (p) {
    var t = p.valeur !== undefined ? O.tn(p.valeur) : p.src !== undefined ? O.tx(p.src) : p.liste ? p.liste.map(O.tn).join(' ; ') : null;
    if (t === null) return;
    var r = q.verifier(t);
    verifierQue(!r.juste && r.message.length > 10, cle + ' : erreur typique sans rétroaction', q.modele + ' « ' + t + ' »');
  });
  if (q.mode === 'choix') verifierQue(q.choix.filter(function (c) { return c.juste; }).length === 1, cle + ' : une seule bonne option', q.modele);
  verifierQue(q.verifier('').statut === 'illisible', cle + ' : réponse vide non signalée', q.modele);
}

/* ---------- boucle principale ---------- */
var NB = 500;
var positions = {};
Fn.MODULES.forEach(function (m) {
  [9, 10, 11].forEach(function (annee) {
    [1, 2].forEach(function (niveau) {
      var profil = { annee: annee, niveau: niveau };
      var dispo = Fn.objectifsPour(m.id, profil);
      // aucun objectif au-delà de l'année, aucun objectif de niveau 2 au niveau 1
      dispo.forEach(function (d) {
        verifierQue(d.objectif.annee <= annee, 'objectif au-delà de l\'année', d.objectif.id + ' en ' + annee + 'e');
        verifierQue(d.objectif.niveaux.indexOf(niveau) >= 0, 'objectif de niveau 2 au niveau 1', d.objectif.id);
      });
      if (!dispo.length) return;
      var ids = dispo.map(function (d) { return d.objectif.id; });
      [1, 2, 3, 4].forEach(function (diff) {
        var cle = m.id + ' ' + annee + 'e N' + niveau + ' D' + diff;
        var n = 0, s = 0;
        while (n < NB) {
          var serie = Fn.creerSerie({ module: m.id, profil: profil, difficulte: diff, objectifs: ids, graine: cle + '#' + (s++), strict: true });
          serie.forEach(function (q) {
            n++;
            q.niveauEleve = niveau;
            var o = Fn.parId[q.objectif];
            verifierQue(ids.indexOf(q.objectif) >= 0, cle + ' : objectif hors sélection', q.objectif);
            verifierQue(o.niveaux.indexOf(niveau) >= 0 && o.annee <= annee, cle + ' : objectif interdit pour ce profil', q.objectif);
            var ok;
            try { ok = attenduIndependant(q); } catch (e) { ok = false; }
            verifierQue(ok, cle + ' : réponse attendue fausse (recalcul indépendant)', q.modele + ' ' + JSON.stringify(q.controle));
            verifierBornes(q, o.annee, cle + ' ' + q.modele);
            verifierConventions(q, cle);
            verifierCorrection(q, cle);
            verifierQue(!signaturesControle(q).some(function (sg) { return REFERENCES.indexOf(empreinte(sg)) >= 0; }), cle + ' : exemple de référence reproduit', q.modele + ' ' + JSON.stringify(q.controle));
            if (q.mode === 'choix') {
              var pk = q.modele;
              positions[pk] = positions[pk] || {};
              var i = q.choix.findIndex(function (c) { return c.juste; });
              positions[pk][i] = (positions[pk][i] || 0) + 1;
            }
          });
        }
      });
    });
  });
});

/* ---------- la bonne réponse change de place ---------- */
Object.keys(positions).forEach(function (modele) {
  var p = positions[modele], total = 0, places = Object.keys(p);
  places.forEach(function (k) { total += p[k]; });
  verifierQue(places.length >= 3, 'choix : bonne réponse toujours aux mêmes places', modele + ' ' + JSON.stringify(p));
  places.forEach(function (k) { verifierQue(p[k] <= 0.6 * total, 'choix : bonne réponse trop souvent à la place ' + (Number(k) + 1), modele + ' ' + JSON.stringify(p)); });
});

/* ---------- écriture des expressions ax + b ---------- */
[[1, -2, 'x – 2'], [2, -4, '2x – 4'], [-3, -4, '– 3x – 4'], ['0.5', -1, '0,5x – 1'], ['-0.5', 3, '– 0,5x + 3'], [-1, 0, '– x'], [0, -5, '– 5'], [4, 0, '4x'], [1, 3, 'x + 3']].forEach(function (c) {
  var src = O.srcAffine(c[0], c[1]);
  verifierQue(O.tx(src).replace(/\u00a0/g, ' ') === c[2], 'écriture de ax + b', src + ' → ' + O.tx(src) + ' (attendu ' + c[2] + ')');
  verifierQue([-2, 0, 1, 3].every(function (x) { return proches(Maths.evaluerApproche(src, { x: x }), nb(c[0]) * x + nb(c[1])); }), 'valeur de ax + b', src);
});

/* ---------- saisies particulières ---------- */
(function () {
  var A3 = Fn.parId.A3;
  var alea = new Maths.Alea('saisies');
  var q = Fn.creerQuestion(A3, alea, 2, { annee: 9, niveau: 1 }, {}, true, A3.modeles.filter(function (m) { return m.gen.name === 'genCoordonnees'; })[0]);
  var x = q.reponse.x, y = q.reponse.y;
  ['(' + x + ';' + y + ')', '(' + x + ' ; ' + y + ')', x + ';' + y, 'A(' + x + ' ; ' + y + ')', 'x = ' + x + ' ; y = ' + y].forEach(function (t) {
    verifierQue(q.verifier(t).juste, 'saisie d\'un couple refusée', t);
  });
  var inv = q.verifier('(' + y + ' ; ' + x + ')');
  verifierQue(!inv.juste && /inversé/.test(inv.message), 'couple inversé : erreur non nommée', inv.message);
  var A1 = Fn.parId.A1;
  var qe = Fn.creerQuestion(Fn.parId.A3, alea, 2, { annee: 9, niveau: 1 }, {}, true, A3.modeles.filter(function (m) { return m.gen.name === 'genOperationTableau'; })[0]);
  var att = O.tx(qe.reponse.attendu);
  ['f(x) = ' + att, 'y=' + att, 'f : x ⟼ ' + att, 'f: x -> ' + att].forEach(function (t) {
    verifierQue(qe.verifier(t).juste, 'saisie d\'une expression refusée', t);
  });
  verifierQue(qe.verifier('2a + 1').statut === 'illisible', 'lettre autre que x acceptée', '2a + 1');
  void A1;
})();

Object.keys(messages).forEach(function (k) {
  console.error('ÉCHEC  ' + k + ' (' + messages[k].n + ' fois) — exemple : ' + JSON.stringify(messages[k].exemple).slice(0, 300));
});
console.log(reussis + ' test(s) réussi(s), ' + echecs + ' échec(s).');
process.exitCode = echecs ? 1 : 0;
