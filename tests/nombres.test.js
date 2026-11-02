/*
 * Tests de l'appli « Nombres et opérations » (logique seulement, sans navigateur).
 * Lancer :  node tests/nombres.test.js
 *
 * Pour chaque module (A, B, C), chaque année (9e, 10e, 11e), chaque niveau (1, 2)
 * et chaque difficulté (1 à 4) : au moins 500 questions générées avec une graine fixe.
 * On vérifie :
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
      case 'racineN': {
        verifierQue(new F(c.res).puissance(c.n).egal(new F(c.a)) && q.reponse.valeur.egal(new F(c.res)), 'racine n-ième fausse', ident);
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

function verifierBornes(q, o, ident) {
  var b = o.bornes;
  if (!b) { echec('bornes non définies', o.id); return; }
  var max = b.max[q.palier - 1], den = b.den[q.palier - 1];
  q.nombres.forEach(function (x) {
    verifierQue(x.abs().compare(max) <= 0, 'nombre hors bornes (taille)', ident + ' : ' + x + ' > ' + max);
    verifierQue(Number(x.den) <= den, 'nombre hors bornes (dénominateur ou décimales)', ident + ' : ' + x + ' (dén. max ' + den + ')');
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
            var ident = q.objectif + ' p' + q.palier + ' [' + graine + ' n°' + q.numero + ']';
            parObjectif[q.objectif] = (parObjectif[q.objectif] || 0) + 1;
            verifierQue(o.annee <= annee && o.niveaux.indexOf(niveau) >= 0, 'question hors profil', ident);
            verifierQue(q.palier === diff + (niveau === 2 ? 1 : 0), 'palier incorrect', ident);
            verifierQue(q.compte === !(niveau === 1 && (o.plusLoinN1 || []).indexOf(annee) >= 0), 'statut « pour aller plus loin » incorrect', ident);
            controler(q, ident);
            verifierReponses(q, ident);
            verifierBornes(q, o, ident);
            verifierEcriture(q, ident);
          });
        }
      });
    });
  });
});

// Chaque objectif a été exercé
Nombres.objectifs.forEach(function (o) {
  if (seulement && o.module !== seulement) return;
  verifierQue(parObjectif[o.id] > 0, 'objectif jamais généré', o.id);
});

// Règles de niveau : le niveau 2 atteint un palier que le niveau 1 n'atteint pas
verifierQue(Nombres.palier(4, 1) === 4 && Nombres.palier(4, 2) === 5 && Nombres.palier(1, 1) === 1, 'paliers', '');
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
