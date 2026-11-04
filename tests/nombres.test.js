/*
 * Tests de l'appli « Nombres et opérations » (logique seulement, sans navigateur).
 * Lancer :  node tests/nombres.test.js
 *
 * Pour chaque module (A, B, C), chaque année (9e, 10e, 11e), chaque niveau (1, 2)
 * et chaque difficulté (1 à 4) : au moins 500 questions générées avec une graine fixe.
 * On vérifie :
 *   - que chaque question respecte les bornes de sa difficulté (tailles, opérations, étapes) ;
 *   - qu'aucune question de 9e ne contient de division de fractions, de puissance négative
 *     ou de racine non parfaite (et pas d'écriture périodique ni de puissance en fractions) ;
 *   - les règles par niveau (pas de négatifs en fractions en 10e N1, pas d'exposant négatif
 *     en puissances 10e N1, pas d'intercalation entre réels en 11e N1…) ;
 *   - qu'aucun exemple de référence de l'enseignante n'est reproduit (liste chiffrée) ;
 *   - que la réponse attendue est juste, recalculée par une méthode indépendante
 *     (texte de contrôle lu par Maths.analyser, calcul exact ET calcul en virgule flottante) ;
 *   - que les nombres restent dans les bornes prévues par l'objectif ;
 *   - qu'aucune question n'est impossible (division par zéro, racine non entière…) ;
 *   - qu'aucun objectif au-delà de l'année ou du niveau n'apparaît (niveau 2 réservé) ;
 *   - que la vérification accepte les bonnes réponses et rejette les fausses ;
 *   - quelques conventions d'écriture (·, :, virgule décimale, signe « – »).
 */
'use strict';
var path = require('path');
var Maths = require(path.join(__dirname, '..', 'assets', 'maths.js'));
var Nombres = require(path.join(__dirname, '..', 'nombres', 'js', 'catalogue.js'));
var F = Maths.Fraction;

var reussis = 0, echecs = 0;
var messagesEchecs = {};
function echec(cle, detail) {
  echecs++;
  // DETAIL=1 : regroupe les échecs par objectif et difficulté (utile pour le calibrage)
  if (process.env.DETAIL) cle += ' — ' + String(detail).split(' ').slice(0, 4).join(' ').replace(/\[.*$/, '');
  if (!messagesEchecs[cle]) messagesEchecs[cle] = { n: 0, exemple: detail };
  messagesEchecs[cle].n++;
}
function ok() { reussis++; }
function verifierQue(cond, cle, detail) { if (cond) ok(); else echec(cle, detail); }

function texteBrut(h) {
  return String(h || '').replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/ /g, ' ');
}

function exact(expr) { return Maths.evaluer(expr); }
function approche(expr) { return Maths.evaluerApproche(expr); }
function procheDe(a, b) { return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }

function bonneReponse(q) { return q.choix ? q.choix.filter(function (c) { return c.juste; }) : []; }

function plusPetitEnsemble(x, liste) {
  if (x === null) return 'R';
  if (x.estEntier() && x.signe() >= 0) return 'N';
  if (x.estEntier()) return 'Z';
  if (liste.indexOf('D') >= 0 && x.estDecimale()) return 'D';
  return 'Q';
}

/** Recalcul indépendant de la réponse attendue. */
function controler(q, ident) {
  var c = q.controle;
  if (!c) { echec('controle manquant', ident); return; }
  try {
    if (c.expr !== undefined && !c.type) {
      var r = q.reponse;
      if (r.type === 'valeur' && r.forme === 'racine') {
        var a = approche(c.expr);
        verifierQue(procheDe(a, r.coef * Math.sqrt(r.radicande)), 'racine : valeur', ident + ' ' + c.expr);
        verifierQue(procheDe(a * a, r.coef * r.coef * r.radicande) && Math.sign(a) === Math.sign(r.coef), 'racine : carré', ident);
        var k = 2, sansCarre = true;
        for (k = 2; k * k <= r.radicande; k++) if (r.radicande % (k * k) === 0) sansCarre = false;
        verifierQue(sansCarre, 'racine : forme simplifiée attendue', ident);
        return;
      }
      if (r.type === 'valeur' && r.forme === 'puissance') {
        var b = typeof r.base === 'string' ? null : F.depuis(r.base);
        if (b) verifierQue(exact(c.expr).egal(b.puissance(r.exposant)), 'puissance : valeur', ident + ' ' + c.expr);
        else verifierQue(Maths.equivalentes(c.expr, r.base + '^(' + r.exposant + ')'), 'puissance littérale', ident + ' ' + c.expr);
        return;
      }
      var attendu = r.type === 'coloriage' || r.type === 'valeur' || r.type === 'montant' ? r.valeur : null;
      var v;
      try { v = exact(c.expr); } catch (eIrr) {
        if (!(eIrr instanceof Maths.ErreurIrrationnel)) throw eIrr;
        // racines non exactes dans le calcul (√7 · √343) : comparaison en virgule flottante seulement
        verifierQue(attendu && procheDe(approche(c.expr), attendu.valeur()), 'réponse attendue ≠ recalcul approché (racines)', ident + ' ' + c.expr);
        return;
      }
      verifierQue(attendu && v.egal(attendu), 'réponse attendue ≠ recalcul exact', ident + ' : ' + c.expr + ' = ' + v + ' ; attendu ' + attendu);
      verifierQue(procheDe(approche(c.expr), attendu.valeur()), 'réponse attendue ≠ recalcul approché', ident + ' ' + c.expr);
      if (r.type === 'coloriage') {
        var parts = v.fois(r.parts);
        verifierQue(parts.estEntier() && parts.compare(r.parts) <= 0 && parts.compare(0) >= 0, 'coloriage impossible', ident);
      }
      if (r.forme === 'entier') verifierQue(v.estEntier(), 'entier attendu', ident);
      if (r.type === 'montant') verifierQue(v.fois(100).estEntier(), 'montant au centime', ident);
      return;
    }
    var bonnes = bonneReponse(q);
    switch (c.type) {
      case 'aucun': return;
      case 'vf': {
        var va = approche(c.a), vb = approche(c.b);
        var vrai;
        try {
          var ea = exact(c.a), eb = exact(c.b);
          vrai = c.relation === '=' ? ea.egal(eb) : c.relation === '<' ? ea.compare(eb) < 0 : ea.compare(eb) > 0;
        } catch (e) {
          if (!(e instanceof Maths.ErreurIrrationnel)) throw e;
          vrai = c.relation === '=' ? procheDe(va, vb) : c.relation === '<' ? va < vb : va > vb;
        }
        verifierQue(bonnes.length === 1 && /^Vrai/.test(texteBrut(bonnes[0].h)) === vrai, 'vrai/faux : mauvaise conclusion', ident + ' ' + c.a + ' ' + c.relation + ' ' + c.b);
        return;
      }
      case 'vfTexte':
        verifierQue(bonnes.length === 1 && /^Vrai/.test(texteBrut(bonnes[0].h)) === c.vrai, 'vrai/faux (texte)', ident);
        return;
      case 'compare': {
        var s = exact(c.a).compare(exact(c.b));
        var signe = s < 0 ? '<' : s > 0 ? '>' : '=';
        verifierQue(signe === c.cle && bonnes.length === 1 && bonnes[0].cle === signe, 'comparaison fausse', ident + ' ' + c.a + ' ? ' + c.b);
        return;
      }
      case 'compareApprox': {
        var d = approche(c.a) - approche(c.b);
        var sg = Math.abs(d) < 1e-12 ? '=' : d < 0 ? '<' : '>';
        verifierQue(sg === c.cle && bonnes.length === 1 && bonnes[0].cle === sg, 'comparaison (réels) fausse', ident);
        return;
      }
      case 'ensemble': {
        var x = /^irr/.test(c.x) ? null : exact(c.x);
        var e = plusPetitEnsemble(x, c.liste);
        verifierQue(e === c.cle && bonnes.length === 1 && bonnes[0].cle === e, 'ensemble faux', ident + ' ' + c.x);
        return;
      }
      case 'appartient': {
        var xx = exact(c.x);
        var app = c.ensemble === 'N' ? xx.estEntier() && xx.signe() >= 0 : c.ensemble === 'Z' ? xx.estEntier() : c.ensemble === 'D' ? xx.estDecimale() : true;
        verifierQue(app === c.vrai && /^Vrai/.test(texteBrut(bonnes[0].h)) === app, 'appartenance fausse', ident + ' ' + c.x + ' ∈ ' + c.ensemble);
        return;
      }
      case 'irreductible': {
        verifierQue((Maths.pgcd(c.a, c.b) === 1) === c.vrai && /^Vrai/.test(texteBrut(bonnes[0].h)) === c.vrai, 'irréductible faux', ident);
        return;
      }
      case 'erreur': {
        var memes;
        try { memes = exact(c.correct).egal(exact(c.eleve)); } catch (e2) {
          if (!(e2 instanceof Maths.ErreurIrrationnel)) throw e2;
          memes = procheDe(approche(c.correct), approche(c.eleve));
        }
        if (c.formeSeulement) memes = false;
        var attenduAucune = c.cle === 'aucune';
        verifierQue(memes === attenduAucune || (c.irreductibleEleve && memes), 'erreur d\'élève incohérente', ident + ' ' + c.correct + ' / ' + c.eleve + ' / ' + c.cle);
        verifierQue(bonnes.length === 1 && bonnes[0].cle === c.cle, 'erreur : mauvaise option juste', ident);
        return;
      }
      case 'estimation':
        verifierQue(exact(c.expr).egal(exact(c.valeur)), 'estimation fausse', ident);
        verifierQue(bonnes.length === 1, 'estimation : une seule bonne', ident);
        return;
      case 'maximum': {
        var vals = c.exprs.map(approche);
        var imax = vals.indexOf(Math.max.apply(null, vals));
        verifierQue(c.exprs[imax] === c.cle && bonnes[0].cle === c.cle, 'maximum faux', ident);
        var distincts = vals.filter(function (v1, i) { return vals.findIndex(function (v2) { return procheDe(v1, v2); }) === i; });
        verifierQue(distincts.length === vals.length, 'maximum : valeurs égales', ident);
        return;
      }
      case 'minimum': {
        var vm = c.exprs.map(approche);
        var imin = vm.indexOf(Math.min.apply(null, vm));
        verifierQue(c.exprs[imin] === c.cle && bonnes[0].cle === c.cle, 'minimum faux', ident);
        return;
      }
      case 'entreReels': {
        var ra = approche(c.a), rb = approche(c.b);
        verifierQue(ra < rb && procheDe(q.reponse.minR, ra) && procheDe(q.reponse.maxR, rb), 'intercaler (réels) : bornes', ident);
        return;
      }
      case 'entre': {
        var mn = exact(c.a), mx = exact(c.b);
        verifierQue(mn.compare(mx) < 0 && F.depuis(q.reponse.min).egal(mn) && F.depuis(q.reponse.max).egal(mx), 'intercaler : bornes', ident);
        return;
      }
      case 'encadrement': {
        var xv = approche(c.expr);
        var bas = Math.floor(xv / c.pas + 1e-12) * c.pas;
        var att = q.reponse.valeurs.map(function (v3) { return typeof v3 === 'number' ? v3 : F.depuis(v3).valeur(); });
        verifierQue(procheDe(att[0], bas) && procheDe(att[1], bas + c.pas) && xv > att[0] && xv < att[1], 'encadrement faux', ident + ' ' + c.expr);
        return;
      }
      case 'ordre': {
        var vs = c.exprs.map(approche);
        var tri = vs.slice().sort(function (u, w) { return c.croissant ? u - w : w - u; });
        var att2 = q.reponse.valeurs.map(function (v4) { return typeof v4 === 'number' ? v4 : F.depuis(v4).valeur(); });
        verifierQue(tri.every(function (t, i) { return procheDe(t, att2[i]); }), 'ordre faux', ident);
        var diff = tri.every(function (t, i) { return i === 0 || Math.abs(t - tri[i - 1]) > 1e-9; });
        verifierQue(diff, 'ordre : valeurs égales', ident);
        return;
      }
      case 'carreParfait':
      case 'cubeParfait': {
        var k3 = c.type === 'cubeParfait' ? 3 : 2;
        function parfait(n) { var r = Math.round(Math.pow(n, 1 / k3)); return Math.pow(r, k3) === n; }
        q.choix.forEach(function (ch) { verifierQue(parfait(Number(ch.valeur)) === !!ch.juste, 'carré/cube parfait incohérent', ident + ' ' + ch.valeur); });
        return;
      }
      case 'estCarre':
      case 'estCube': {
        var k4 = c.type === 'estCube' ? 3 : 2;
        var r4 = Math.round(Math.pow(c.n, 1 / k4));
        verifierQue((Math.pow(r4, k4) === c.n) === c.vrai && /^Vrai/.test(texteBrut(bonnes[0].h)) === c.vrai, 'carré/cube parfait (vrai/faux)', ident + ' ' + c.n);
        return;
      }
      case 'estSci': {
        // méthode indépendante : on lit la mantisse et on vérifie 1 ⩽ a < 10
        var mm = /^([\d.,']+)\s*·\s*10\^(-?\d+)$/.exec(c.texte.replace(/\u00a0/g, ' '));
        var mant = mm ? parseFloat(mm[1].replace(/'/g, '').replace(',', '.')) : NaN;
        var estSci = mant >= 1 && mant < 10;
        verifierQue(estSci === c.vrai && /^Vrai/.test(texteBrut(bonnes[0].h)) === c.vrai, 'notation scientifique (vrai/faux)', ident + ' ' + c.texte);
        return;
      }
      case 'comboRacines': {
        var k = Math.sqrt(c.a) * Math.sqrt(c.b), rn = Math.pow(c.c, 1 / c.n);
        var att = c.op === '+' ? k + rn : k - rn;
        verifierQue(procheDe(att, c.res) && Number.isInteger(Math.round(k)) && Math.abs(k - Math.round(k)) < 1e-9 && q.reponse.valeur.egal(new F(c.res)), 'calcul de racines faux', ident);
        return;
      }
      case 'racineN': {
        // question de calcul : la réponse attendue vaut c.res ; question de sens (choix) : l'égalité c.res^n = c.a est vraie
        verifierQue(new F(c.res).puissance(c.n).egal(new F(c.a)) && (!q.reponse.valeur || q.reponse.valeur.egal(new F(c.res))), 'racine n-ième fausse', ident);
        return;
      }
      case 'parentheses': {
        q.choix.forEach(function (ch) {
          verifierQue(exact(ch.avec).egal(exact(ch.sans)) === !!ch.juste, 'parenthèses inutiles incohérent', ident + ' ' + ch.avec);
        });
        return;
      }
      case 'intrus': {
        var cible = approche(c.expr);
        q.choix.forEach(function (ch) {
          var egal = procheDe(approche(ch.valeur), cible);
          verifierQue(egal === !ch.juste, 'intrus incohérent', ident + ' ' + ch.valeur);
        });
        return;
      }
      case 'choixValeur': {
        // la bonne option a la valeur c.expr, les autres non
        var vv = approche(c.expr);
        q.choix.forEach(function (ch) {
          var égal = procheDe(approche(ch.valeur), vv);
          verifierQue(égal === !!ch.juste, 'choix valeur incohérent', ident + ' ' + ch.valeur);
        });
        return;
      }
    }
    echec('type de contrôle inconnu', ident + ' ' + c.type);
  } catch (e) {
    echec('contrôle impossible : ' + e.name, ident + ' ' + e.message + ' ' + JSON.stringify(c));
  }
}

function verifierReponses(q, ident) {
  var ex = q.exemples();
  verifierQue(ex.justes.length > 0, 'aucun exemple juste', ident);
  ex.justes.forEach(function (t) {
    var r = q.verifier(t);
    verifierQue(r.juste === true, 'bonne réponse refusée', ident + ' : « ' + t + ' » → ' + r.statut + ' ' + r.message);
  });
  ex.faux.forEach(function (t) {
    var r = q.verifier(t);
    verifierQue(r.juste === false && r.statut !== 'juste', 'fausse réponse acceptée', ident + ' : « ' + t + ' »');
    verifierQue(r.message && r.message.length > 0, 'fausse réponse sans rétroaction', ident + ' : « ' + t + ' »');
  });
  if (q.reponse.type === 'valeur' && !q.reponse.forme) {
    var v = q.reponse.valeur;
    [v.plus(1), v.plus(new F(1, 997))].forEach(function (w) {
      var r = q.verifier(Maths.formaterFraction(w));
      verifierQue(!r.juste, 'mutation acceptée', ident);
    });
    // une saisie illisible n'est jamais acceptée
    verifierQue(!q.verifier('3++').juste && q.verifier('3++').statut === 'illisible', 'saisie illisible acceptée', ident);
    verifierQue(!q.verifier('').juste, 'réponse vide acceptée', ident);
  }
  if (q.mode === 'choix') {
    verifierQue(bonneReponse(q).length === 1, 'nombre de bonnes options ≠ 1', ident);
    var hs = q.choix.map(function (c) { return texteBrut(c.h).replace(/\s+/g, ' ').trim(); });
    verifierQue(hs.every(function (h, i) { return hs.indexOf(h) === i; }), 'options en double', ident + ' ' + hs.join(' | '));
    q.choix.forEach(function (c) { if (!c.juste) verifierQue(!!c.message, 'option fausse sans rétroaction', ident + ' ' + texteBrut(c.h)); });
  }
}

/*
 * Calibrage par difficulté (règles de l'enseignante) :
 *   D1 : une opération, nombres ⩽ 20, dénominateurs ⩽ 12, résultat simple ;
 *   D2 : deux étapes, nombres ⩽ 100 ;
 *   D3 : deux à trois étapes, nombres ⩽ 200 ;
 *   D4 : trois étapes au plus, nombres ⩽ 300, jamais plus de 4 opérations.
 * « Opérations » et « étapes » sont mesurées sur le texte de contrôle de la question
 * (arbre de calcul lu par Maths.analyser) : une étape = un niveau de l'arbre.
 * Un objectif peut déclarer des bornes propres (bornesD) quand la règle générale
 * n'a pas de sens (exemples : cubes jusqu'à 1000 en 10e, √50 dès D1 en 11e) ;
 * chaque exception est justifiée dans le fichier de l'objectif.
 */
var BORNES_D = {
  nombre: [20, 100, 200, 300],
  den: [12, 100, 200, 300],
  decimales: [2, 2, 3, 3],
  operations: [1, 3, 4, 4],
  etapes: [1, 2, 3, 3]
};

function litteralEntier(n) { if (n.type === 'neg') n = n.arg; return n.type === 'nombre' && n.valeur.estEntier(); }
function estFractionLitterale(n) { if (n && n.type === 'neg') n = n.arg; return !!n && n.type === '/' && n.symbole === '/' && litteralEntier(n.g) && litteralEntier(n.d); }
/** Nombre d'opérations et profondeur (étapes) d'un arbre ; « a/b » entre entiers est un nombre, pas une opération. */
function mesurer(n) {
  if (n.type === 'nombre' || n.type === 'lettre') return { ops: 0, etapes: 0 };
  if (n.type === 'neg') return mesurer(n.arg);
  if (estFractionLitterale(n)) return { ops: 0, etapes: 0 };
  var enfants = n.type === '^' ? [n.base] : n.type === 'racine' ? [n.arg] : [n.g, n.d];
  var m = enfants.map(mesurer);
  return { ops: 1 + m.reduce(function (s, x) { return s + x.ops; }, 0), etapes: 1 + Math.max.apply(null, m.map(function (x) { return x.etapes; })) };
}
function textesControle(c) {
  if (!c) return [];
  return [c.expr, c.a, c.b, c.correct].concat(c.exprs || []).filter(function (t) { return typeof t === 'string' && !/^irr/.test(t); });
}
function borne(o, cle, d) {
  var b = o.bornesD && o.bornesD[cle];
  return b ? b[d - 1] : BORNES_D[cle][d - 1];
}
function nbDecimales(x) {
  var y = x, k = 0;
  while (!y.estEntier() && k < 12) { y = y.fois(10); k++; }
  return y.estEntier() ? k : Infinity;
}

function verifierBornes(q, o, d, ident) {
  var maxN = borne(o, 'nombre', d), maxDen = borne(o, 'den', d), maxDec = borne(o, 'decimales', d);
  q.nombres.forEach(function (x) {
    verifierQue(x.abs().compare(maxN) <= 0, 'nombre trop grand pour la difficulté', ident + ' : ' + x + ' > ' + maxN);
    var okDecimal = nbDecimales(x) <= maxDec;
    var okFraction = Number(x.den) <= maxDen && Math.abs(Number(x.num)) <= Math.max(maxN, Number(x.den));
    verifierQue(okDecimal || okFraction, 'dénominateur ou décimales hors bornes', ident + ' : ' + x + ' (dén. ⩽ ' + maxDen + ', décimales ⩽ ' + maxDec + ')');
  });
  var ops = 0, etapes = 0;
  // Conversion d'écriture, ou comparaison de nombres donnés (√15 et 2√14, 3 · 10⁴ et 9 · 10³) :
  // les nombres sont lus, pas calculés ; on compte une seule étape.
  var lecture = q.controle && /^(compare|compareApprox|ordre|minimum|maximum|encadrement|entreReels|ensemble)$/.test(q.controle.type || '');
  if (q.controle && (q.controle.conversion || lecture)) { ops = 1; etapes = 1; }
  // Le générateur peut déclarer le travail réel de l'élève quand le texte de contrôle contient
  // des écritures qui ne sont pas des calculs (3 · 10⁵, a^m · a^n à écrire en une puissance…).
  else if (q.controle && q.controle.mesure) { ops = q.controle.mesure.ops; etapes = q.controle.mesure.etapes; }
  else textesControle(q.controle).forEach(function (t) {
    var m;
    try { m = mesurer(Maths.analyser(t)); } catch (e) { echec('texte de contrôle illisible', ident + ' ' + t); return; }
    ops = Math.max(ops, m.ops); etapes = Math.max(etapes, m.etapes);
  });
  var maxOps = borne(o, 'operations', d), maxEt = borne(o, 'etapes', d);
  verifierQue(ops <= maxOps, 'trop d\'opérations pour la difficulté', ident + ' : ' + ops + ' > ' + maxOps + ' ' + JSON.stringify(textesControle(q.controle)));
  verifierQue(etapes <= maxEt, 'trop d\'étapes pour la difficulté', ident + ' : ' + etapes + ' > ' + maxEt + ' ' + JSON.stringify(textesControle(q.controle)));
}

/** Texte « visible » de la question (énoncé, consigne, options). */
function htmlVisible(q) {
  return [q.enonce, q.consigne].concat(q.choix ? q.choix.map(function (c) { return c.h; }) : []).join(' ');
}
var EXPOSANT_NEGATIF = /⁻|<sup>\s*[–-]/;
var DIVISION_FRACTIONS = /<\/span><\/span>\)?\s*:\s*\(?(–\s)?<span class="frac"|<\/span><\/span>\)?\s*:|:\s*\(?(–\s)?<span class="frac"/;
var SUPERSCRIPTS = /[⁰¹²³⁴⁵⁶⁷⁸⁹]|<sup>/;
function racinesNonParfaites(h) {
  var t = texteBrut(h).replace(/'/g, '');
  var res = [], re = /(√|∛)\s*\(?\s*(–\s?)?(\d+(?:,\d+)?)/g, m;
  while ((m = re.exec(t))) {
    var k = m[1] === '∛' ? 3 : 2;
    var v = Number(m[3].replace(',', '.'));
    var r = Math.round(Math.pow(v, 1 / k));
    if (Math.abs(Math.pow(r, k) - v) > 1e-9) res.push(m[0]);
  }
  return res;
}

/** Règles de contenu par année et par niveau. */
function verifierContenu(q, o, profil, d, ident) {
  var h = htmlVisible(q);
  if (o.annee === 9) {
    verifierQue(!DIVISION_FRACTIONS.test(h), '9e : division de fractions', ident);
    verifierQue(!EXPOSANT_NEGATIF.test(h), '9e : puissance négative', ident);
    verifierQue(racinesNonParfaites(h).length === 0, '9e : racine non parfaite', ident + ' ' + racinesNonParfaites(h).join(' '));
    if (o.module === 'A') {
      verifierQue(!/class="periode"/.test(h + (q.attenduHtml || '')), '9e (fractions) : écriture périodique', ident);
      verifierQue(!SUPERSCRIPTS.test(h), '9e (fractions) : puissance', ident);
    }
  }
  if (o.module === 'A' && o.annee === 10 && profil.niveau === 1 && o.id !== 'A10-oppose-inverse') {
    verifierQue(q.nombres.every(function (x) { return x.signe() >= 0; }), '10e N1 (fractions) : nombre négatif', ident);
  }
  if (o.module === 'A' && o.annee === 11 && profil.niveau === 1) {
    verifierQue(!(q.reponse.type === 'entre' && q.reponse.reels), '11e N1 : intercalation entre deux réels', ident);
  }
  if (o.module === 'B' && o.annee === 10 && profil.annee === 10 && profil.niveau === 1) {
    verifierQue(!EXPOSANT_NEGATIF.test(h), '10e N1 (puissances) : exposant négatif', ident);
  }
  if (o.module === 'B' && o.annee === 10 && profil.annee === 10 && profil.niveau === 2 && d < 4 && o.id !== 'B10-proprietes') {
    verifierQue(!EXPOSANT_NEGATIF.test(h), '10e N2 : exposant négatif avant D4', ident);
  }
  if (o.module === 'C' && profil.niveau === 1) {
    verifierQue(!/\((–|-)\s?\d+\)[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(texteBrut(h)), 'relatifs N1 : puissance d\'un nombre négatif', ident);
  }
  if (o.module === 'C' && profil.niveau === 2 && d < 4) {
    verifierQue(!/\((–|-)\s?\d+\)[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(texteBrut(h)) || o.id === 'C10-puissance', 'relatifs : puissance d\'un relatif mêlée aux calculs avant D4', ident);
  }
  verifierQue(!Nombres.estInterdite(q), 'exemple de référence reproduit', ident);
}

/** Droite numérique lisible : au moins deux nombres écrits, points dans la droite. */
function verifierVisuels(q, ident) {
  [q.visuel, q.visuelCorrection].forEach(function (v) {
    if (!v) return;
    if (v.type === 'droite') {
      verifierQue(v.max > v.min && v.pas > 0, 'droite : bornes', ident);
      (v.points || []).forEach(function (p) { verifierQue(p.v >= v.min - 1e-9 && p.v <= v.max + 1e-9, 'droite : point hors de la droite', ident + ' ' + p.v + ' [' + v.min + ' ; ' + v.max + ']'); });
      if (v.etiquettes) {
        var dedans = v.etiquettes.filter(function (e) { return e >= v.min - 1e-9 && e <= v.max + 1e-9; });
        verifierQue(dedans.length >= 2, 'droite : moins de deux nombres écrits (graduations illisibles)', ident + ' ' + JSON.stringify(v));
        // le point à trouver n'est pas déjà écrit sous la droite
        if (q.reponse.type === 'valeur' && v === q.visuel) verifierQue(!dedans.some(function (e) { return Math.abs(e - q.reponse.valeur.valeur()) < 1e-9; }), 'droite : la réponse est écrite sous la droite', ident);
      } else {
        var entiers = 0;
        for (var x = Math.ceil(v.min); x <= v.max; x++) entiers++;
        verifierQue(entiers >= 1, 'droite : aucun entier visible', ident + ' ' + JSON.stringify(v));
      }
    }
    if (v.type === 'barre' || v.type === 'disque') verifierQue(v.parts >= 2 && v.parts <= 24 && (v.colorees || 0) <= v.parts, 'figure partagée incohérente', ident);
  });
}

function verifierEcriture(q, ident) {
  var morceaux = [q.enonce, q.consigne, q.indice, q.verification].concat(q.etapes.map(function (e) { return e.texte + ' ' + e.calcul; }));
  if (q.choix) morceaux = morceaux.concat(q.choix.map(function (c) { return c.h + ' ' + (c.message || ''); }));
  var t = texteBrut(morceaux.join(' '));
  verifierQue(!/[×÷*]/.test(t), 'signe × ÷ ou * affiché', ident + ' : ' + t.slice(0, 200));
  var sansMontants = t.replace(/CHF ?–? ?[\d']+\.(\d\d|–)/g, '').replace(/[\d']+\.(\d\d|–) ?(francs?|fr\.)/g, '').replace(/[\d']+\.(\d\d|–)/g, function (m) { return m; });
  verifierQue(!/\d\.\d/.test(sansMontants.replace(/[\d']+\.\d\d\b/g, '')), 'point décimal affiché', ident + ' : ' + (sansMontants.match(/.{0,30}\d\.\d.{0,30}/) || [''])[0]);
  verifierQue(!/(^|[\s(=])-\s?\d/.test(t), 'signe moins ASCII', ident + ' : ' + (t.match(/.{0,20}(^|[\s(=])-\s?\d.{0,20}/) || [''])[0]);
  verifierQue(!/undefined|NaN|\[object/.test(t), 'texte cassé (undefined/NaN)', ident + ' : ' + (t.match(/.{0,40}(undefined|NaN|\[object).{0,20}/) || [''])[0]);
  verifierQue(q.etapes.length > 0 && /^ÉTAPE 1$/.test(q.etapes[0].titre), 'correction sans ÉTAPE 1', ident);
  verifierQue(!!q.rubrique, 'rubrique manquante', ident);
  verifierQue(!!q.indice, 'indice manquant', ident);
  verifierQue(!!q.attenduHtml || q.mode === 'choix', 'réponse attendue non affichable', ident);
}

var modules = ['A', 'B', 'C'];
var parObjectif = {};
var total = 0;
var debut = Date.now();
var seulement = process.argv[2]; // ex. « node tests/nombres.test.js B » pour un seul module

modules.forEach(function (mod) {
  if (seulement && seulement !== mod) return;
  [9, 10, 11].forEach(function (annee) {
    if (process.argv[3] && Number(process.argv[3]) !== annee) return; // « node tests/nombres.test.js A 9 »
    [1, 2].forEach(function (niveau) {
      var profil = { annee: annee, niveau: niveau };
      var dispo = Nombres.objectifsPour(mod, profil);
      if (!dispo.length) { echec('module sans objectif', mod + ' ' + annee + 'e N' + niveau); return; }
      var ids = dispo.map(function (d) { return d.objectif.id; });
      // aucun objectif au-delà de l'année ou du niveau
      dispo.forEach(function (d) {
        verifierQue(d.objectif.annee <= annee, 'objectif au-delà de l\'année', d.objectif.id + ' en ' + annee + 'e');
        verifierQue(d.objectif.niveaux.indexOf(niveau) >= 0, 'objectif réservé au niveau 2 proposé au niveau 1', d.objectif.id);
      });
      [1, 2, 3, 4].forEach(function (diff) {
        var n = 0;
        for (var s = 0; n < 500; s++) {
          var graine = mod + annee + niveau + diff + '-' + s;
          var serie;
          try {
            serie = Nombres.creerSerie({ module: mod, profil: profil, difficulte: diff, objectifs: ids, graine: graine, strict: true });
          } catch (e) {
            echec('génération impossible : ' + e.message, graine + '\n' + e.stack.split('\n').slice(0, 4).join('\n'));
            n += 10;
            continue;
          }
          verifierQue(serie.length === 10, 'série de taille ≠ 10', graine);
          serie.forEach(function (q) {
            n++; total++;
            var o = Nombres.parId[q.objectif];
            var ident = q.objectif + ' ' + annee + 'e N' + niveau + ' D' + diff + ' [' + graine + ' n°' + q.numero + ']';
            parObjectif[q.objectif] = (parObjectif[q.objectif] || 0) + 1;
            verifierQue(o.annee <= annee && o.niveaux.indexOf(niveau) >= 0, 'question hors profil', ident);
            verifierQue(q.palier === diff, 'difficulté incorrecte', ident);
            verifierQue(q.compte === !(niveau === 1 && (o.plusLoinN1 || []).indexOf(annee) >= 0), 'statut « pour aller plus loin » incorrect', ident);
            controler(q, ident);
            verifierReponses(q, ident);
            verifierBornes(q, o, diff, ident);
            verifierContenu(q, o, profil, diff, ident);
            verifierEcriture(q, ident);
            verifierVisuels(q, ident);
          });
        }
      });
    });
  });
});

// Chaque objectif a été exercé
Nombres.objectifs.forEach(function (o) {
  if (seulement && o.module !== seulement) return;
  if (process.argv[3]) return;
  verifierQue(parObjectif[o.id] > 0, 'objectif jamais généré', o.id);
});

// La difficulté choisie est la difficulté appliquée, au niveau 1 comme au niveau 2
verifierQue(Nombres.palier(4, 1) === 4 && Nombres.palier(4, 2) === 4 && Nombres.palier(1, 2) === 1, 'difficulté', '');
// Objectifs propres au niveau 2
['A9-pourcentages', 'B11-racine-n', 'C10-puissance'].forEach(function (id) {
  verifierQue(Nombres.parId[id] && Nombres.parId[id].niveaux.join() === '2', 'objectif censé être réservé au niveau 2', id);
});
// Objectifs réservés au niveau 2 : absents au niveau 1
[9, 10, 11].forEach(function (annee) {
  Nombres.objectifsPour(null, { annee: annee, niveau: 1 }).forEach(function (d) {
    verifierQue(d.objectif.niveaux.indexOf(1) >= 0, 'objectif N2 au niveau 1', d.objectif.id);
  });
});

Object.keys(messagesEchecs).forEach(function (k) {
  console.error('ÉCHEC  ' + k + ' (' + messagesEchecs[k].n + ' fois)\n        ex. ' + messagesEchecs[k].exemple);
});
console.log(total + ' questions générées en ' + ((Date.now() - debut) / 1000).toFixed(1) + ' s.');
console.log(Object.keys(parObjectif).length + ' objectifs exercés.');
console.log(reussis + ' test(s) réussi(s), ' + echecs + ' échec(s).');
process.exitCode = echecs ? 1 : 0;
