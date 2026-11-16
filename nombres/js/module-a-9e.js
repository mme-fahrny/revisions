/*
 * nombres/js/module-a-9e.js — Module A « Fractions et nombres rationnels », objectifs de 9e (NO 9.3)
 * Logique pure : chaque objectif fournit des modèles de questions (voir outils.js).
 * Exporte aussi des générateurs réutilisés par les objectifs de 10e et 11e.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'));
  else racine.NombresModuleA9 = fabrique(racine.NombresOutils);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O) {
  'use strict';

  var M = O.Maths, F = O.F, H = O.H, X = O.X, R = O.RUBRIQUES;
  var fr = O.fr, val = O.val;
  var NB = O.NBSP;

  function m(h) { return H.maths(h); }
  function prenom(alea) { return alea.choix(O.PRENOMS); }
  function deuxPrenoms(alea) {
    var t = alea.melanger(O.PRENOMS);
    return [t[0], t[1]];
  }
  function lieu(alea) { return alea.choix(O.LIEUX); }
  function frT(f) { return M.formaterFraction(f); }
  /** « de Léa », « d'Elif » */
  function de(nom) { return (/^[AEIOUYÉÈÊÂÎ]/i.test(nom) ? 'd\'' : 'de ') + nom; }
  /** Numérateur entre 1 et max, premier avec b (fraction irréductible). */
  function premierAvec(alea, b, max) {
    var a, essais = 0;
    do { a = alea.entier(1, max); essais++; } while ((O.pgcd(a, b) !== 1 || a % b === 0) && essais < 100);
    return a;
  }

  /* =====================================================================
   * Fractions : outils de correction
   * ===================================================================== */

  /** Étapes : simplifier a/b jusqu'à l'irréductible (par le pgdc). */
  function etapesSimplifier(a, b) {
    var g = O.pgcd(a, b);
    if (g === 1) return [['La fraction est déjà irréductible : pgdc (' + a + ' ; ' + b + ') = 1.', m(H.f(fr(a, b)))]];
    return [
      ['Je cherche le plus grand diviseur commun du numérateur et du dénominateur : pgdc (' + a + ' ; ' + b + ') = ' + g + '.', ''],
      ['Je divise le numérateur et le dénominateur par ' + g + '.',
        m(H.fh(a, b) + ' = ' + H.fh(a + NB + ':' + NB + g, b + NB + ':' + NB + g) + ' = ' + H.f(fr(a, b)))]
    ];
  }

  /** Vérification approchée d'un calcul (valeurs arrondies au centième). */
  function verifApprochee(termes, resultat) {
    return 'Vérification avec des valeurs approchées : ' + termes + ' ≈ ' + H.arrondi(resultat, 2) +
      ', et le résultat ' + H.f(resultat) + ' ≈ ' + H.arrondi(resultat, 2) + '. ✓';
  }

  /* =====================================================================
   * Addition et soustraction de fractions (réutilisé en 10e et 11e)
   * ===================================================================== */

  var PAIRES_FACTEUR_COMMUN = [[4, 6], [6, 8], [6, 9], [8, 12], [9, 12], [6, 10], [10, 12], [4, 10]];

  /**
   * Deux dénominateurs (toujours ⩽ 12) selon la difficulté :
   * D1 égaux ou liés (l'un multiple de l'autre), D2 liés, D3 premiers entre eux,
   * D4 avec un facteur commun (le ppmc n'est pas le produit).
   */
  function denominateurs(alea, p) {
    var b, d;
    if (p <= 1) { b = alea.choix([2, 3, 4, 5, 6]); d = alea.suivant() < 0.4 ? b : b * 2; }
    else if (p === 2) { b = alea.choix([2, 3, 4, 6]); d = b * (b <= 4 ? alea.choix([2, 3]) : 2); }
    else if (p === 3) {
      do { b = alea.entier(2, 7); d = alea.entier(2, 9); } while (b === d || O.pgcd(b, d) !== 1);
    } else {
      var paire = alea.choix(PAIRES_FACTEUR_COMMUN);
      b = paire[0]; d = paire[1];
    }
    if (alea.suivant() < 0.5) { var t = b; b = d; d = t; }
    return [b, d];
  }

  /**
   * Somme algébrique de fractions. termes : [{ f: Fraction (positive), op: '+' | '–' }], le premier
   * peut porter signe négatif (f négative). Renvoie les étapes et le résultat.
   */
  function corrigerSomme(termes, expr) {
    var dens = termes.map(function (t) { return Number(t.f.den); });
    var memeDen = dens.every(function (d) { return d === dens[0]; });
    var mcd = dens.reduce(function (acc, d) { return O.ppmc(acc, d); }, 1);
    var et = [];
    if (memeDen) {
      et.push(['Les fractions ont le même dénominateur ' + mcd + '.', '']);
    } else {
      et.push(['Je cherche un dénominateur commun : ppmc (' + dens.join(' ; ') + ') = ' + mcd + '.', '']);
      var amp = termes.map(function (t) {
        var k = mcd / Number(t.f.den);
        var a = Math.abs(Number(t.f.num));
        if (k === 1) return H.f(t.f.abs()) + ' = ' + H.fh(a, mcd);
        return H.f(t.f.abs()) + ' = ' + H.fh(a + NB + '·' + NB + k, t.f.den + NB + '·' + NB + k) + ' = ' + H.fh(a * k, mcd);
      });
      et.push(['J\'amplifie chaque fraction pour obtenir le dénominateur ' + mcd + '.', m(amp.join(' ; '))]);
    }
    // somme des numérateurs
    var morceaux = '', total = 0;
    termes.forEach(function (t, i) {
      var n = Number(t.f.num) * (mcd / Number(t.f.den));
      var signe = t.op === '–' ? -1 : 1;
      if (i === 0) { morceaux += (n < 0 ? H.moins + Math.abs(n) : String(n)); total = n; }
      else {
        var nn = signe * n;
        morceaux += (t.op === '–' ? ' – ' : ' + ') + (n < 0 ? '(' + H.moins + Math.abs(n) + ')' : n);
        total += nn;
      }
    });
    var resultat = fr(total, mcd);
    et.push(['J\'additionne ou je soustrais les numérateurs et je garde le dénominateur commun.',
      m(expr.h + ' = ' + H.fh(morceaux, mcd) + ' = ' + (total < 0 ? H.moins + H.fh(Math.abs(total), mcd) : H.fh(total, mcd)))]);
    if (O.pgcd(Math.abs(total), mcd) > 1 && total !== 0) {
      var g = O.pgcd(Math.abs(total), mcd);
      et.push(['Je simplifie par ' + g + ' (pgdc (' + Math.abs(total) + ' ; ' + mcd + ') = ' + g + ').',
        m((total < 0 ? H.moins : '') + H.fh(Math.abs(total), mcd) + ' = ' + H.f(resultat))]);
    }
    return { etapes: O.etapes(et), resultat: resultat, mcd: mcd };
  }

  /**
   * Question d'addition / soustraction de fractions.
   * opts.relatifs : nombres négatifs possibles ; opts.troisTermes.
   */
  function questionAddSous(alea, p, opts) {
    opts = opts || {};
    var dd, essaiDen = 0;
    do { dd = denominateurs(alea, p); essaiDen++; } while (opts.denMax && Math.max(dd[0], dd[1]) > opts.denMax && essaiDen < 100);
    var b = dd[0], d = dd[1];
    var maxNum = p >= 4 ? 2 : 1;
    var a = premierAvec(alea, b, b * maxNum - 1), c = premierAvec(alea, d, d * maxNum - 1);
    var f1 = fr(a, b), f2 = fr(c, d);
    var op = alea.suivant() < 0.5 ? '+' : '–';
    var termes = [{ f: f1, op: '' }, { f: f2, op: op }];
    if (opts.relatifs && alea.suivant() < 0.5) termes[0].f = f1.oppose();
    if (!opts.relatifs && op === '–' && f1.compare(f2) < 0) {
      termes = [{ f: f2, op: '' }, { f: f1, op: '–' }];
    }
    if (opts.troisTermes || (p >= 4 && alea.suivant() < 0.5)) {
      var e = alea.choix([2, 3, 4, 6]);
      var f3 = fr(alea.entier(1, e - 1), e);
      var op3 = alea.suivant() < 0.5 ? '+' : '–';
      termes.push({ f: f3, op: op3 });
    }
    // valeur et affichage
    var expr = X.n(termes[0].f);
    for (var i = 1; i < termes.length; i++) expr = X.op(expr, termes[i].op, X.n(termes[i].f));
    if (!opts.relatifs && expr.v.signe() < 0) {
      // 9e : résultat positif — on inverse l'ordre des deux premiers termes si besoin
      return questionAddSous(alea, p, opts);
    }
    var corr = corrigerSomme(termes, expr);
    var res = expr.v;
    if (res.estZero()) return questionAddSous(alea, p, opts);   // « 1/2 – 1/2 » n'apprend rien
    var irreductible = opts.irreductible || (p >= 2 && alea.suivant() < 0.6);
    var pieges = [];
    if (termes.length === 2) {
      var A = Number(termes[0].f.num), B = Number(termes[0].f.den), C = Number(termes[1].f.num), D = Number(termes[1].f.den);
      var s = termes[1].op === '–' ? -1 : 1;
      if (B + D !== 0 && A + s * C !== 0) pieges.push({ valeur: fr(A + s * C, B + D), message: 'Tu as additionné les dénominateurs. On garde le dénominateur commun : seuls les numérateurs s\'additionnent (ou se soustraient).' });
      if (B !== D && B - D !== 0) pieges.push({ valeur: fr(A + s * C, s > 0 ? B + D : B - D), message: 'Tu as calculé les numérateurs entre eux et les dénominateurs entre eux. Il faut d\'abord mettre les fractions au même dénominateur.' });
      if (B !== D) pieges.push({ valeur: fr(A + s * C, B * D), message: 'Tu as bien pris un dénominateur commun (' + (B * D) + '), mais tu as oublié d\'amplifier les numérateurs.' });
      pieges.push({ valeur: s > 0 ? termes[0].f.moins(termes[1].f) : termes[0].f.plus(termes[1].f), message: 'Tu as fait ' + (s > 0 ? 'une soustraction au lieu d\'une addition' : 'une addition au lieu d\'une soustraction') + '. Relis le signe de l\'opération.' });
    }
    var termesApprox = termes.map(function (t, k) {
      return (k === 0 ? '' : (t.op === '–' ? ' – ' : ' + ')) + H.arrondi(t.f, 2);
    }).join('');
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule :</p><p class="calcul">' + m(expr.h) + '</p>',
      consigne: irreductible ? 'Donne le résultat sous forme de <strong>fraction irréductible</strong> (qu\'on ne peut plus simplifier).' : 'Donne le résultat sous forme de fraction (ou d\'un nombre entier).',
      indice: corr.mcd === Number(termes[0].f.den) && termes.every(function (t) { return Number(t.f.den) === corr.mcd; })
        ? 'Les dénominateurs sont égaux : additionne ou soustrais seulement les numérateurs.'
        : 'Cherche d\'abord un dénominateur commun (le ppmc des dénominateurs), puis amplifie chaque fraction.',
      reponse: { type: 'valeur', valeur: res, forme: irreductible ? 'irreductible' : 'nombre' },
      pieges: pieges,
      etapes: corr.etapes,
      verification: verifApprochee(termesApprox, res),
      rubrique: R.addFractions,
      clavier: 'nombres',
      nombres: termes.map(function (t) { return t.f; }),
      controle: { expr: expr.t },
      attenduHtml: H.f(res)
    });
  }

  function erreurAddition(alea, p) {
    var dd = denominateurs(alea, Math.max(2, p));
    var b = dd[0], d = dd[1];
    var a = premierAvec(alea, b, b - 1), c = premierAvec(alea, d, d - 1);
    var nom = prenom(alea);
    var vraie = fr(a, b).plus(fr(c, d));
    var type = alea.choix(['denominateurs', 'amplifier', 'juste']);
    var lignes, cle;
    var mcd = O.ppmc(b, d);
    if (type === 'denominateurs') {
      lignes = [H.f(fr(a, b)) + ' + ' + H.f(fr(c, d)) + ' = ' + H.fh(a + ' + ' + c, b + ' + ' + d) + ' = ' + H.fh(a + c, b + d)];
      cle = 'den';
    } else if (type === 'amplifier') {
      lignes = [H.f(fr(a, b)) + ' + ' + H.f(fr(c, d)) + ' = ' + H.fh(a, mcd) + ' + ' + H.fh(c, mcd) + ' = ' + H.fh(a + c, mcd)];
      cle = 'amp';
      if ((a + c) / mcd === vraie.valeur()) type = 'juste';
    }
    if (type === 'juste') {
      var k1 = mcd / b, k2 = mcd / d;
      lignes = [H.f(fr(a, b)) + ' + ' + H.f(fr(c, d)) + ' = ' + H.fh(a * k1, mcd) + ' + ' + H.fh(c * k2, mcd),
        '= ' + H.fh(a * k1 + c * k2, mcd) + (O.pgcd(a * k1 + c * k2, mcd) > 1 ? ' = ' + H.f(vraie) : '')];
      cle = 'aucune';
    }
    var resEleve = type === 'denominateurs' ? fr(a + c, b + d) : type === 'amplifier' ? fr(a + c, mcd) : vraie;
    var choix = [
      { h: 'Les dénominateurs ont été additionnés entre eux.', juste: cle === 'den', cle: 'den',
        message: cle === 'den' ? '' : 'Non : regarde bien le dénominateur obtenu.' },
      { h: 'Les numérateurs n\'ont pas été amplifiés comme les dénominateurs.', juste: cle === 'amp', cle: 'amp',
        message: cle === 'amp' ? '' : 'Non : vérifie chaque amplification.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune',
        message: cle === 'aucune' ? '' : 'Si, il y a une erreur : calcule toi-même le résultat et compare.' },
      { h: 'Le dénominateur commun choisi n\'est pas un multiple des deux dénominateurs.', juste: false, cle: 'mult',
        message: 'Non : ce n\'est pas le problème ici.' }
    ];
    var corr = corrigerSomme([{ f: fr(a, b), op: '' }, { f: fr(c, d), op: '+' }], X.op(X.n(fr(a, b)), '+', X.n(fr(c, d))));
    var q = O.erreurEleve({
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'Refais le calcul toi-même : même dénominateur, puis on additionne seulement les numérateurs.',
      etapes: corr.etapes,
      verification: 'Le bon résultat est ' + m(H.f(vraie)) + (cle === 'aucune' ? ', comme ' + nom + '.' : ', et non ' + m(H.f(resEleve)) + '.'),
      rubrique: R.addFractions,
      nombres: [fr(a, b), fr(c, d)],
      controle: { type: 'erreur', correct: '(' + a + '/' + b + ')+(' + c + '/' + d + ')', eleve: resEleve.toString(), cle: cle }
    }, alea);
    q.controle.cleJuste = cle;
    return q;
  }

  function vraiFauxAddition(alea, p) {
    var dd = denominateurs(alea, Math.max(2, p));
    var b = dd[0], d = dd[1];
    var a = premierAvec(alea, b, b - 1), c = premierAvec(alea, d, d - 1);
    var vraie = fr(a, b).plus(fr(c, d));
    var faux = fr(a + c, b + d);
    var annonceVraie = alea.suivant() < 0.4;
    var annonce = annonceVraie ? vraie : faux;
    var h = m(H.f(fr(a, b)) + ' + ' + H.f(fr(c, d)) + ' = ' + H.f(annonce));
    var q = O.vraiFaux({
      enonce: '<p class="calcul">' + h + '</p>',
      vrai: annonceVraie,
      bonne: annonceVraie
        ? 'avec le dénominateur commun ' + O.ppmc(b, d) + ', on trouve bien ' + m(H.f(vraie)) + '.'
        : 'on n\'additionne pas les dénominateurs : avec le dénominateur commun ' + O.ppmc(b, d) + ', on trouve ' + m(H.f(vraie)) + '.',
      mauvaises: annonceVraie ? [
        { h: 'Faux, car on doit additionner les numérateurs et les dénominateurs.', message: 'Non : on n\'additionne jamais les dénominateurs.' },
        { h: 'Faux, car le résultat doit avoir le dénominateur ' + (b * d) + '.', message: 'Le produit des dénominateurs est un dénominateur commun possible, mais le résultat peut se simplifier : il est bien égal à ' + M.formaterFraction(vraie) + '.' },
        { h: 'Vrai, car ' + (a + c) + ' et ' + (b + d) + ' sont les sommes des numérateurs et des dénominateurs.', message: 'La conclusion est juste, mais pas la justification : on n\'additionne pas les dénominateurs.' }
      ] : [
        { h: 'Vrai, car on additionne les numérateurs entre eux et les dénominateurs entre eux.', message: 'C\'est l\'erreur classique : les dénominateurs ne s\'additionnent pas.' },
        { h: 'Vrai, car ' + M.formaterFraction(faux) + ' est irréductible.', message: 'Être irréductible ne dit rien sur la justesse du calcul.' },
        { h: 'Faux, car le résultat doit être plus petit que chacune des deux fractions.', message: 'Non : en additionnant deux nombres positifs, on obtient un nombre plus grand que chacun d\'eux.' }
      ],
      indice: 'Calcule toi-même la somme avec un dénominateur commun.',
      etapes: corrigerSomme([{ f: fr(a, b), op: '' }, { f: fr(c, d), op: '+' }], X.op(X.n(fr(a, b)), '+', X.n(fr(c, d)))).etapes,
      verification: 'Astuce : ' + m(H.f(fr(a + c, b + d))) + ' est compris entre les deux fractions de départ, alors qu\'une somme de deux nombres positifs est plus grande que chacun d\'eux.',
      rubrique: R.addFractions,
      nombres: [fr(a, b), fr(c, d)],
      controle: { type: 'vf', a: '(' + a + '/' + b + ')+(' + c + '/' + d + ')', b: annonce.toString(), relation: '=' }
    }, alea);
    return q;
  }

  function problemeAddition(alea, p) {
    var nom = deuxPrenoms(alea);
    var dd = denominateurs(alea, Math.min(Math.max(p, 2), 4));
    var b = dd[0], d = dd[1];
    var a = premierAvec(alea, b, Math.max(1, Math.floor(b / 2))), c = premierAvec(alea, d, Math.max(1, Math.floor(d / 2)));
    var f1 = fr(a, b), f2 = fr(c, d);
    if (f1.plus(f2).compare(1) >= 0) { f1 = fr(1, b); f2 = fr(1, d); a = 1; c = 1; }
    var reste = fr(1).moins(f1).moins(f2);
    var contexte = alea.choix([
      { objet: 'une pizza', verbe: 'a mangé', fin: 'Quelle fraction de la pizza reste-t-il ?', unite: 'de la pizza' },
      { objet: 'le jardin potager de la classe', verbe: 'a planté', fin: 'Quelle fraction du jardin reste-t-il à planter ?', unite: 'du jardin' },
      { objet: 'la mémoire d\'une clé USB', verbe: 'a rempli', fin: 'Quelle fraction de la mémoire reste libre ?', unite: 'de la mémoire' }
    ]);
    var deuxEtapes = p >= 3;
    var enonce = '<p>' + nom[0] + ' ' + contexte.verbe + ' ' + m(H.f(f1)) + ' ' + contexte.unite + ', et ' + nom[1] + ' ' + contexte.verbe + ' ' + m(H.f(f2)) + ' ' + contexte.unite + '.</p>';
    var question = deuxEtapes ? contexte.fin : 'Quelle fraction ' + contexte.unite + ' a été ' + (contexte.verbe === 'a mangé' ? 'mangée' : contexte.verbe === 'a planté' ? 'plantée' : 'remplie') + ' en tout ?';
    var res = deuxEtapes ? reste : f1.plus(f2);
    var expr = deuxEtapes ? X.op(X.op(X.n(1), '–', X.n(f1)), '–', X.n(f2)) : X.op(X.n(f1), '+', X.n(f2));
    var corrS = corrigerSomme([{ f: f1, op: '' }, { f: f2, op: '+' }], X.op(X.n(f1), '+', X.n(f2)));
    var et = corrS.etapes.slice();
    if (deuxEtapes) {
      et.push(O.etape(et.length + 1, 'Le tout vaut 1. Je soustrais la part utilisée.', m('1 – ' + H.f(f1.plus(f2)) + ' = ' + H.f(reste))));
    }
    return O.saisie({
      type: 'probleme',
      enonce: enonce + '<p>' + question + '</p>',
      consigne: 'Donne une fraction.',
      indice: deuxEtapes ? 'Calcule d\'abord la part utilisée en tout. Le tout correspond à 1.' : 'Additionne les deux fractions avec un dénominateur commun.',
      reponse: { type: 'valeur', valeur: res },
      pieges: deuxEtapes ? [{ valeur: f1.plus(f2), message: 'Tu as calculé la part utilisée ; la question demande ce qui reste.' }, { valeur: fr(a + c, b + d), message: 'Tu as additionné les dénominateurs.' }] : [{ valeur: fr(a + c, b + d), message: 'Tu as additionné les dénominateurs.' }],
      etapes: et,
      verification: deuxEtapes ? 'Vérification : ' + m(H.f(f1) + ' + ' + H.f(f2) + ' + ' + H.f(reste) + ' = 1') + '. ✓' : verifApprochee(H.arrondi(f1, 2) + ' + ' + H.arrondi(f2, 2), res),
      rubrique: R.addFractions,
      visuel: O.ppmc(b, d) <= 24 ? { type: 'disque', parts: O.ppmc(b, d), colorees: 0, interactif: true, aide: true } : null,
      nombres: [f1, f2],
      controle: { expr: expr.t }
    });
  }

  /* =====================================================================
   * Objectif : vocabulaire et ensembles ℕ, ℤ, ℚ
   * ===================================================================== */

  /** Plus petit ensemble (parmi la liste) contenant x. x : Fraction ou 'irr'. */
  function plusPetitEnsemble(x, liste) {
    if (x === 'irr') return 'R';
    if (x.estEntier() && x.signe() >= 0) return 'N';
    if (x.estEntier()) return 'Z';
    if (liste.indexOf('D') >= 0 && x.estDecimale()) return 'D';
    return 'Q';
  }

  var NOMS_ENSEMBLES = {
    N: 'ℕ (nombres naturels)', Z: 'ℤ (nombres entiers relatifs)', D: '𝔻 (nombres décimaux)',
    Q: 'ℚ (nombres rationnels)', R: 'ℝ (nombres réels)'
  };

  function messageEnsemble(x, choisi, bon, xh) {
    if (choisi === 'N' && bon !== 'N') return xh + ' n\'est pas un nombre naturel : ' + (x !== 'irr' && x.estEntier() ? 'il est négatif.' : 'ce n\'est pas un entier.');
    if (choisi === 'Z' && (bon === 'D' || bon === 'Q' || bon === 'R')) return xh + ' n\'est pas un nombre entier.';
    if (choisi === 'D' && (bon === 'Q')) return xh + ' n\'a pas d\'écriture décimale finie : ce n\'est pas un nombre décimal.';
    if (choisi === 'Q' && bon === 'R') return xh + ' ne peut pas s\'écrire comme une fraction : il est irrationnel.';
    return xh + ' appartient bien à cet ensemble, mais il appartient aussi à un ensemble plus petit. Pense à simplifier ou à calculer d\'abord.';
  }

  function questionEnsemble(alea, p, ctx, liste, pool) {
    var item = alea.choix(pool);
    var x = item.v;
    var bon = plusPetitEnsemble(x, liste);
    var xh = m(item.h);
    var choix = liste.map(function (e) {
      return { h: M.ENSEMBLES[e] + ' ' + NOMS_ENSEMBLES[e].replace(/^.\s|^𝔻\s/, ''), juste: e === bon, cle: e, message: e === bon ? '' : messageEnsemble(x, e, bon, xh) };
    });
    var explication = {
      N: 'est un nombre entier positif (ou nul) : il appartient à ℕ, donc aussi à ℤ' + (liste.indexOf('D') >= 0 ? ', 𝔻' : '') + ' et ℚ.',
      Z: 'est un nombre entier négatif : il appartient à ℤ, mais pas à ℕ.',
      D: 'a une écriture décimale finie : il appartient à 𝔻, mais ce n\'est pas un entier.',
      Q: 'peut s\'écrire comme une fraction, mais n\'est pas un entier' + (liste.indexOf('D') >= 0 ? ' et son écriture décimale est illimitée' : '') + '.',
      R: 'ne peut pas s\'écrire comme une fraction : c\'est un nombre irrationnel, il appartient à ℝ seulement.'
    }[bon];
    var et = [];
    if (item.calcul) et.push(['Je calcule ou je simplifie d\'abord.', m(item.calcul)]);
    et.push([xh + ' ' + explication, '']);
    return O.choix({
      type: 'directe',
      enonce: '<p>Quel est le <strong>plus petit</strong> ensemble de nombres qui contient ' + xh + ' ?</p>',
      consigne: 'Choisis un ensemble. Rappel : ' + liste.map(function (e) { return M.ENSEMBLES[e]; }).join(' ⊂ ') + '.',
      choix: choix,
      indice: item.calcul ? 'Simplifie ou calcule d\'abord ce nombre.' : 'Est-ce un entier ? Est-il positif ?',
      etapes: O.etapes(et),
      verification: 'Les ensembles sont emboîtés : ' + liste.map(function (e) { return M.ENSEMBLES[e]; }).join(' ⊂ ') + '.',
      rubrique: R.ensembles,
      nombres: x === 'irr' ? [] : [x],
      controle: { type: 'ensemble', x: item.t, liste: liste.join(''), cle: bon },
      ordreFixe: true
    }, alea);
  }

  function poolEnsemblesNZQ(alea, p) {
    var n = alea.entier(2, 9 * p);
    var k = alea.entier(2, 6);
    var a = alea.entier(1, 9), b = alea.choix([3, 4, 5, 7, 8]);
    if (a % b === 0) a++;
    var pool = [
      { v: fr(n), h: String(n), t: String(n) },
      { v: fr(-n), h: H.moins + n, t: '-' + n },
      { v: fr(a, b), h: H.f(fr(a, b)), t: a + '/' + b }
    ];
    if (p >= 2) {
      pool.push({ v: fr(-a, b), h: H.f(fr(-a, b)), t: '-' + a + '/' + b });
      pool.push({ v: fr(k * n, n), h: H.fh(k * n, n), t: (k * n) + '/' + n, calcul: H.fh(k * n, n) + ' = ' + (k * n) + ' : ' + n + ' = ' + k });
      pool.push({ v: new F(alea.entier(11, 99), 10), h: '', t: '' });
      var dx = pool[pool.length - 1]; dx.h = H.n(dx.v); dx.t = dx.v.toString();
    }
    if (p >= 3) {
      pool.push({ v: fr(-k * n, n), h: H.moins + H.fh(k * n, n), t: '-' + (k * n) + '/' + n, calcul: H.moins + H.fh(k * n, n) + ' = ' + H.moins + k });
      pool.push({ v: fr(0), h: '0', t: '0' });
      pool.push({ v: fr(n, 1).moins(fr(n + k)), h: n + ' – ' + (n + k), t: n + '-' + (n + k), calcul: n + ' – ' + (n + k) + ' = ' + H.moins + k });
    }
    return pool;
  }

  var VOCABULAIRE = [
    { q: 'Comment appelle-t-on une fraction qu\'on ne peut plus simplifier ?', bon: 'une fraction irréductible', faux: ['une fraction amplifiée', 'une fraction périodique', 'une fraction décimale'] },
    { q: 'Dans une fraction, comment appelle-t-on le nombre écrit sous la barre de fraction ?', bon: 'le dénominateur', faux: ['le numérateur', 'le diviseur commun', 'le quotient'] },
    { q: 'Dans une fraction, comment appelle-t-on le nombre écrit au-dessus de la barre de fraction ?', bon: 'le numérateur', faux: ['le dénominateur', 'le dividende commun', 'le produit'] },
    { q: 'Comment appelle-t-on une écriture décimale illimitée où un groupe de chiffres se répète, comme 0,272727… ?', bon: 'une écriture périodique', faux: ['une écriture irréductible', 'une écriture décimale finie', 'une écriture fractionnaire'] },
    { q: 'Que veut dire « amplifier une fraction » ?', bon: 'multiplier le numérateur et le dénominateur par un même nombre non nul', faux: ['ajouter un même nombre au numérateur et au dénominateur', 'multiplier seulement le numérateur', 'diviser le numérateur et le dénominateur par un même nombre'] },
    { q: 'Que veut dire « simplifier une fraction » ?', bon: 'diviser le numérateur et le dénominateur par un même diviseur commun', faux: ['soustraire un même nombre au numérateur et au dénominateur', 'diviser seulement le dénominateur', 'remplacer la fraction par son écriture décimale arrondie'] },
    { q: 'Dans l\'écriture 3/4, comment appelle-t-on ce code ?', bon: 'un code fractionnaire (une fraction)', faux: ['une écriture périodique', 'une puissance', 'un pourcentage'] }
  ];

  function questionVocabulaire(alea) {
    var v = alea.choix(VOCABULAIRE);
    var choix = [{ h: v.bon, juste: true, cle: 'bon', message: '' }].concat(v.faux.map(function (f) {
      return { h: f, juste: false, cle: 'faux', message: 'Non. La bonne réponse est : ' + v.bon + '.' };
    }));
    return O.choix({
      type: 'directe',
      enonce: '<p>' + v.q + '</p>',
      consigne: 'Choisis la bonne réponse.',
      choix: choix,
      indice: 'Pense à l\'aide-mémoire, rubrique ' + R.vocabulaireFractions + '.',
      etapes: O.etapes([['Réponse : ' + v.bon + '.', '']]),
      rubrique: R.vocabulaireFractions,
      controle: { type: 'aucun' }
    }, alea);
  }

  function questionNumDen(alea, p) {
    var b = alea.entier(3, 12 + 3 * p), a = alea.entier(1, b - 1);
    if (a === b - a) a = Math.max(1, a - 1);
    var demande = alea.suivant() < 0.5 ? 'dénominateur' : 'numérateur';
    var rep = demande === 'dénominateur' ? b : a;
    var autre = demande === 'dénominateur' ? a : b;
    return O.saisie({
      type: 'directe',
      enonce: '<p>Quel est le <strong>' + demande + '</strong> de la fraction ' + m(H.fh(a, b)) + ' ?</p>',
      consigne: 'Écris un nombre.',
      indice: 'Le numérateur est au-dessus de la barre de fraction, le dénominateur en dessous.',
      reponse: { type: 'valeur', valeur: fr(rep), forme: 'entier' },
      pieges: [{ valeur: fr(autre), message: 'Tu as donné le ' + (demande === 'dénominateur' ? 'numérateur (au-dessus de la barre)' : 'dénominateur (sous la barre)') + '.' }],
      etapes: O.etapes([['Le numérateur est ' + a + ' (au-dessus de la barre), le dénominateur est ' + b + ' (sous la barre).', m(H.fh(a, b))]]),
      rubrique: R.vocabulaireFractions,
      nombres: [fr(a), fr(b)],
      controle: { expr: String(rep) }
    });
  }

  function vraiFauxEnsemble(alea, p, liste) {
    var pool = poolEnsemblesNZQ(alea, p);
    var item = alea.choix(pool);
    var E = alea.choix(liste.filter(function (e) { return e !== 'Q' && e !== 'R'; }));
    var x = item.v;
    var appartient = E === 'N' ? (x.estEntier() && x.signe() >= 0) : E === 'Z' ? x.estEntier() : x.estDecimale();
    var xh = m(item.h);
    var nomE = M.ENSEMBLES[E];
    var bonne, mauvaises;
    if (appartient) {
      bonne = xh + (item.calcul ? ' = ' + m(item.calcul.split(' = ').pop()) : '') + (E === 'D' ? ' a une écriture décimale finie.' : ' est un nombre entier' + (E === 'N' ? ' positif ou nul.' : '.'));
      mauvaises = [
        { h: 'Faux, car ' + xh + (item.calcul ? ' est écrit sous forme de fraction.' : ' n\'est pas écrit avec une virgule.'), message: 'L\'écriture ne compte pas : seule la valeur du nombre compte. ' + (item.calcul ? 'Calcule-la.' : '') },
        { h: 'Faux, car seuls les nombres positifs appartiennent à ' + nomE + '.', message: E === 'N' ? 'C\'est vrai pour ℕ, mais ' + xh + ' est bien positif ou nul.' : 'ℤ contient aussi les entiers négatifs.' },
        { h: 'Vrai, car tous les nombres appartiennent à ' + nomE + '.', message: 'La conclusion est juste, mais pas la justification : par exemple ' + (E === 'N' ? '– 2' : '1/3') + ' n\'appartient pas à ' + nomE + '.' }
      ];
    } else {
      var raison = E === 'N' ? (x.estEntier() ? 'il est négatif.' : 'ce n\'est pas un nombre entier.') : (E === 'Z' ? 'ce n\'est pas un nombre entier.' : 'son écriture décimale est illimitée.');
      bonne = xh + ' n\'appartient pas à ' + nomE + ' : ' + raison;
      mauvaises = [
        { h: 'Vrai, car tous les nombres appartiennent à ' + nomE + '.', message: 'Non : ' + nomE + ' ne contient pas tous les nombres.' },
        { h: 'Vrai, car ' + xh + ' peut s\'écrire avec une fraction.', message: 'Pouvoir s\'écrire avec une fraction signifie appartenir à ℚ, pas forcément à ' + nomE + '.' },
        { h: 'Faux, car ' + nomE + ' ne contient que des nombres à virgule.', message: 'Ce n\'est pas la définition de ' + nomE + '.' }
      ];
    }
    return O.vraiFaux({
      enonce: '<p class="calcul">' + xh + ' ∈ ' + nomE + '</p><p>(« ∈ » se lit « appartient à ».)</p>',
      vrai: appartient,
      bonne: bonne,
      mauvaises: mauvaises,
      indice: 'Rappelle-toi ce que contient ' + NOMS_ENSEMBLES[E] + '.',
      etapes: O.etapes([[bonne.charAt(0).toUpperCase() === bonne.charAt(0) ? bonne : bonne, '']]),
      rubrique: R.ensembles,
      nombres: [x],
      controle: { type: 'appartient', x: item.t, ensemble: E, vrai: appartient }
    }, alea);
  }

  /* =====================================================================
   * Objectif : écritures décimales usuelles
   * ===================================================================== */

  /**
   * Fractions usuelles par difficulté. 9e : écritures décimales finies seulement
   * (l'écriture périodique n'est pas travaillée en 9e). periodique : 1/3, 2/3… (10e).
   */
  function poolUsuelles(p, periodique) {
    var t = [[1, 2], [1, 4], [1, 5], [1, 10]];
    if (p >= 2) t = t.concat([[1, 100], [3, 4], [2, 5], [3, 10]]);
    if (p >= 3) t = t.concat([[1, 8], [1, 1000], [3, 8], [7, 100], [4, 5], [3, 5]]);
    if (p >= 4) t = t.concat([[5, 8], [7, 8], [9, 1000], [5, 4], [3, 2], [9, 20]]);
    if (periodique && p >= 2) t = t.concat([[1, 3], [2, 3]]);
    if (periodique && p >= 3) t = t.concat([[1, 6], [1, 9], [5, 6]]);
    return t;
  }

  function etapesDivision(a, b) {
    var f = fr(a, b);
    var dev = f.developpementDecimal();
    var et = [['Je divise le numérateur par le dénominateur : ' + a + ' : ' + b + '.', '']];
    if (dev.periodique) {
      et.push(['La division ne s\'arrête pas : un reste déjà rencontré revient, donc les chiffres ' + dev.periode + ' se répètent.', '']);
      et.push(['J\'écris la période avec une barre.', m(H.f(f) + ' = ' + H.n(f) + ' (= ' + M.formaterNombre(f, null, { periode: 'parentheses' }).replace(/\((\d+)\)/, '$1$1') + '…)')]);
    } else {
      et.push(['La division s\'arrête (reste nul).', m(H.f(f) + ' = ' + H.n(f))]);
    }
    return et;
  }

  function questionUsuelle(alea, p) {
    var c = alea.choix(poolUsuelles(p));
    var f = fr(c[0], c[1]);
    var sens = alea.suivant() < 0.6 ? 'versDecimal' : 'versFraction';
    if (!f.estDecimale()) sens = 'versDecimal';
    if (sens === 'versDecimal') {
      var pieges = [];
      var recopie = M.Fraction.depuis('0,' + c[0] + '' + c[1]);
      pieges.push({ valeur: recopie, message: 'Tu as recopié les chiffres du numérateur et du dénominateur après la virgule. Il faut diviser ' + c[0] + ' par ' + c[1] + '.' });
      if (c[0] === 1 && c[1] < 10) pieges.push({ valeur: new F(c[1], 10), message: 'Tu as écrit 0,' + c[1] + ', qui vaut ' + c[1] + '/10 et non 1/' + c[1] + '.' });
      if (!f.estDecimale()) pieges.push({ test: function (t, v) { return v && !v.egal(f) && Math.abs(v.valeur() - f.valeur()) < 0.01; }, message: 'C\'est une valeur arrondie. L\'écriture exacte est périodique : utilise la barre de période (touche 1̅) ou écris les chiffres deux fois suivis de « … ».' });
      return O.saisie({
        type: 'directe',
        enonce: '<p>Écris ' + m(H.f(f)) + ' en écriture décimale.</p>',
        consigne: 'Réponse en <strong>écriture décimale</strong> (avec la virgule).' + (f.estDecimale() ? '' : ' Si l\'écriture est illimitée, indique la période (touche 1̅ ou « … »).'),
        indice: c[0] === 1 ? 'Divise 1 par ' + c[1] + '.' : 'Pars de ' + M.formaterFraction(fr(1, c[1])) + ' = ' + M.formaterNombre(fr(1, c[1])).replace(/̅/g, '') + (fr(1, c[1]).estDecimale() ? '' : '…') + ', puis multiplie par ' + c[0] + '.',
        reponse: { type: 'valeur', valeur: f, forme: 'decimal' },
        pieges: pieges,
        etapes: O.etapes(etapesDivision(c[0], c[1])),
        verification: f.estDecimale() ? 'Vérification : ' + m(H.n(f) + ' · ' + c[1] + ' = ' + c[0]) + '. ✓' : 'Vérification : ' + m(H.n(f)) + ' · ' + c[1] + ' redonne ' + c[0] + ' (avec la période, le calcul « tombe juste »).',
        rubrique: R.ecrituresDecimales,
        nombres: [f],
        controle: { expr: c[0] + '/' + c[1] },
        attenduHtml: H.n(f)
      });
    }
    var d = O.nbDecimales(f);
    var p10 = Math.pow(10, d);
    var n = Number(f.fois(p10).num);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.n(f)) + ' sous forme de fraction.</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong> (qu\'on ne peut plus simplifier).',
      indice: 'Écris d\'abord ' + M.formaterNombre(f) + ' = ' + n + '/' + p10 + ', puis simplifie.',
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: [{ valeur: fr(n, 10), message: 'Attention au nombre de décimales : ' + M.formaterNombre(f) + ' = ' + n + '/' + p10 + '.' }],
      etapes: O.etapes([['Je lis le nombre de décimales : ' + d + ', donc le dénominateur est ' + p10 + '.', m(H.n(f) + ' = ' + H.fh(n, p10))]].concat(etapesSimplifier(n, p10))),
      verification: 'Vérification : ' + m(f.num + ' : ' + f.den + ' = ' + H.n(f)) + '. ✓',
      rubrique: R.ecrituresDecimales,
      nombres: [f],
      controle: { expr: f.toString() },
      attenduHtml: H.f(f)
    });
  }

  function vraiFauxUsuelle(alea, p) {
    var c = alea.choix(poolUsuelles(p));
    var f = fr(c[0], c[1]);
    var piege = alea.suivant() < 0.55;
    var annonce;
    if (!piege) annonce = f;
    else if (!f.estDecimale()) annonce = M.Fraction.depuis('0,' + String(f.developpementDecimal().periode).slice(0, 1));
    else annonce = M.Fraction.depuis('0,' + c[1]);
    if (annonce.egal(f)) { piege = false; }
    var annonceH = H.n(annonce);
    var h = m(H.f(f) + ' = ' + annonceH);
    var bonne = piege
      ? m(c[0] + ' : ' + c[1] + ' = ' + H.n(f)) + ', et non ' + m(annonceH) + '.'
      : 'la division ' + m(c[0] + ' : ' + c[1]) + ' donne ' + m(H.n(f)) + '.';
    return O.vraiFaux({
      enonce: '<p class="calcul">' + h + '</p>',
      vrai: !piege,
      bonne: bonne,
      mauvaises: piege ? [
        { h: 'Vrai, car on écrit le dénominateur après la virgule.', message: 'Non : une fraction est un quotient. Il faut diviser le numérateur par le dénominateur.' },
        { h: 'Vrai, car c\'est une bonne valeur approchée.', message: 'Le signe « = » demande une égalité exacte.' },
        { h: 'Faux, car une fraction n\'a jamais d\'écriture décimale.', message: 'Toute fraction a une écriture décimale (finie ou périodique).' }
      ] : [
        { h: 'Faux, car ' + m(H.f(f)) + ' = ' + m(H.n(M.Fraction.depuis('0,' + c[1]))) + '.', message: 'Non : 0,' + c[1] + ' = ' + c[1] + '/' + Math.pow(10, String(c[1]).length) + '.' },
        { h: 'Faux, car une fraction ne peut pas être égale à un nombre décimal.', message: 'Une fraction peut avoir une écriture décimale finie : c\'est le cas ici.' },
        { h: 'Vrai, car ' + c[1] + ' · ' + M.formaterNombre(f) + ' = ' + c[1] + '.', message: 'La conclusion est juste, mais le calcul de la justification est faux.' }
      ],
      indice: 'Calcule ' + c[0] + ' : ' + c[1] + '.',
      etapes: O.etapes(etapesDivision(c[0], c[1])),
      rubrique: R.ecrituresDecimales,
      nombres: [f],
      controle: { type: 'vf', a: c[0] + '/' + c[1], b: annonce.toString(), relation: '=' }
    }, alea);
  }

  /* =====================================================================
   * Objectif : simplifier, amplifier, irréductible
   * ===================================================================== */

  /** Plus grand nombre autorisé à chaque difficulté (règles de calibrage). */
  var LIMITE = [0, 20, 100, 200, 300];

  function fractionIrreductible(alea, p) {
    var maxD = [0, 6, 10, 12, 12][p];
    var b = alea.entier(2, maxD), a;
    do { a = alea.entier(1, b - 1 + (p >= 4 ? b : 0)); } while (O.pgcd(a, b) !== 1 || a % b === 0);
    return [a, b];
  }

  /** Facteur de simplification selon la difficulté : évident (D1), ⩽ 12 (D2), à trouver (D3), non évident (D4). */
  var FACTEURS_SIMPLIFICATION = [null, [2, 5, 10], [2, 3, 4, 5, 6, 8, 9, 10, 12], [4, 6, 8, 9, 12, 14, 15, 16, 18], [7, 11, 13, 14, 18, 21, 24]];

  /** Fraction a/b à simplifier par k, avec a et b sous la limite de la difficulté. */
  function fractionASimplifier(alea, p) {
    for (var essai = 0; essai < 200; essai++) {
      var ab = fractionIrreductible(alea, p);
      var k = alea.choix(FACTEURS_SIMPLIFICATION[p]);
      if (ab[0] * k <= LIMITE[p] && ab[1] * k <= LIMITE[p]) return { ab: ab, k: k, a: ab[0] * k, b: ab[1] * k };
    }
    return { ab: [1, 2], k: 2, a: 2, b: 4 };
  }

  function questionSimplifier(alea, p) {
    var s = fractionASimplifier(alea, p);
    var ab = s.ab, k = s.k, a = s.a, b = s.b;
    var f = fr(a, b);
    var g = O.pgcd(a, b);
    var pieges = [
      { valeur: fr(a / g, b), message: 'Tu as simplifié seulement le numérateur. Pour simplifier, on divise le numérateur ET le dénominateur par le même nombre.' },
      { valeur: fr(a, b / g), message: 'Tu as simplifié seulement le dénominateur. Pour simplifier, on divise le numérateur ET le dénominateur par le même nombre.' }
    ].filter(function (pg) { return !pg.valeur.egal(f); });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Simplifie la fraction ' + m(H.fh(a, b)) + '.</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong> : on ne doit plus pouvoir la simplifier.',
      indice: p <= 1 ? 'Divise le numérateur et le dénominateur par ' + (k === 10 ? '10' : k === 5 ? '5' : '2') + '.' : 'Cherche un diviseur commun à ' + a + ' et ' + b + ' (2, 3, 5, 7…), ou directement le pgdc.',
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: pieges,
      etapes: O.etapes(etapesSimplifier(a, b)),
      verification: 'Vérification : ' + m(H.f(f)) + ' est irréductible (pgdc (' + ab[0] + ' ; ' + ab[1] + ') = 1), et ' + m(ab[0] + ' · ' + k + ' = ' + a) + ', ' + m(ab[1] + ' · ' + k + ' = ' + b) + '. ✓',
      rubrique: R.amplifier,
      nombres: [fr(a), fr(b)],
      controle: { expr: a + '/' + b },
      attenduHtml: H.f(f)
    });
  }

  function questionAmplifier(alea, p) {
    var ab, k, cible, essai = 0;
    do {
      ab = fractionIrreductible(alea, p);
      k = alea.entier(2, [0, 5, 10, 12, 15][p]);
      cible = ab[1] * k;
      essai++;
    } while ((cible > LIMITE[p] || ab[0] * k > LIMITE[p]) && essai < 200);
    var inconnueEnHaut = alea.suivant() < 0.7;
    var rep = inconnueEnHaut ? ab[0] * k : cible;
    var enonce = inconnueEnHaut
      ? m(H.fh(ab[0], ab[1]) + ' = ' + H.fh('?', cible))
      : m(H.fh(ab[0], ab[1]) + ' = ' + H.fh(ab[0] * k, '?'));
    return O.saisie({
      type: 'directe',
      enonce: '<p>Complète pour que les deux fractions soient égales :</p><p class="calcul">' + enonce + '</p>',
      consigne: 'Écris le nombre qui remplace « ? ».',
      indice: inconnueEnHaut ? 'Par combien a-t-on multiplié ' + ab[1] + ' pour obtenir ' + cible + ' ?' : 'Par combien a-t-on multiplié ' + ab[0] + ' pour obtenir ' + (ab[0] * k) + ' ?',
      reponse: { type: 'valeur', valeur: fr(rep), forme: 'entier' },
      pieges: inconnueEnHaut ? [{ valeur: fr(ab[0] + cible - ab[1]), message: 'Tu as ajouté ' + (cible - ab[1]) + ' au numérateur. Pour amplifier, on multiplie numérateur et dénominateur par le même nombre.' }] : [{ valeur: fr(ab[1] + ab[0] * k - ab[0]), message: 'Tu as ajouté au lieu de multiplier.' }],
      etapes: O.etapes([
        ['Je cherche le facteur d\'amplification.', m((inconnueEnHaut ? cible + ' : ' + ab[1] : (ab[0] * k) + ' : ' + ab[0]) + ' = ' + k)],
        ['Je multiplie le numérateur et le dénominateur par ' + k + '.', m(H.fh(ab[0], ab[1]) + ' = ' + H.fh(ab[0] + NB + '·' + NB + k, ab[1] + NB + '·' + NB + k) + ' = ' + H.fh(ab[0] * k, cible))]
      ]),
      verification: 'Vérification : en simplifiant ' + m(H.fh(ab[0] * k, cible)) + ' par ' + k + ', on retrouve ' + m(H.fh(ab[0], ab[1])) + '. ✓',
      rubrique: R.amplifier,
      nombres: [fr(ab[0]), fr(ab[1]), fr(cible)],
      controle: { expr: inconnueEnHaut ? '(' + ab[0] + '/' + ab[1] + ')*' + cible : (ab[0] * k) + ':(' + ab[0] + '/' + ab[1] + ')' }
    });
  }

  function erreurSimplifier(alea, p) {
    var ab = fractionIrreductible(alea, Math.max(2, p));
    var k = alea.choix([2, 3, 4, 6]);
    var a = ab[0] * k, b = ab[1] * k;
    var nom = prenom(alea);
    var type = alea.choix(['differents', 'soustraction', 'pasFini', 'juste']);
    var lignes, cle, resEleve;
    if (type === 'differents') {
      var d1 = k, d2 = 1;
      // divise le numérateur par k et le dénominateur par un autre diviseur
      var divs = [];
      for (var t = 2; t <= b; t++) if (b % t === 0 && t !== k) divs.push(t);
      if (!divs.length) type = 'soustraction';
      else {
        d2 = alea.choix(divs);
        lignes = [H.fh(a, b) + ' = ' + H.fh(a + NB + ':' + NB + d1, b + NB + ':' + NB + d2) + ' = ' + H.fh(a / d1, b / d2)];
        resEleve = fr(a / d1, b / d2);
        cle = 'diff';
        if (resEleve.egal(fr(a, b))) type = 'soustraction';
      }
    }
    if (type === 'soustraction') {
      var s = Math.min(a, b) - 1 > 1 ? alea.entier(1, Math.min(a, b) - 1) : 1;
      lignes = [H.fh(a, b) + ' = ' + H.fh(a + ' – ' + s, b + ' – ' + s) + ' = ' + H.fh(a - s, b - s)];
      resEleve = fr(a - s, b - s);
      cle = 'sous';
    }
    if (type === 'pasFini') {
      if (k === 2 || k === 3) { type = 'juste'; }
      else {
        var etape1 = 2;
        lignes = [H.fh(a, b) + ' = ' + H.fh(a / etape1, b / etape1) + '   (fraction irréductible)'];
        resEleve = fr(a / etape1, b / etape1);
        cle = 'pasfini';
      }
    }
    if (type === 'juste') {
      lignes = [H.fh(a, b) + ' = ' + H.fh(a + NB + ':' + NB + k, b + NB + ':' + NB + k) + ' = ' + H.fh(ab[0], ab[1])];
      resEleve = fr(a, b);
      cle = 'aucune';
    }
    var choix = [
      { h: 'Le numérateur et le dénominateur n\'ont pas été divisés par le même nombre.', juste: cle === 'diff', cle: 'diff', message: 'Regarde les deux divisions effectuées.' },
      { h: 'On a soustrait un nombre au lieu de diviser.', juste: cle === 'sous', cle: 'sous', message: 'Regarde quelle opération est faite en haut et en bas.' },
      { h: 'La fraction obtenue n\'est pas encore irréductible.', juste: cle === 'pasfini', cle: 'pasfini', message: 'Vérifie si on peut encore simplifier le résultat.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : compare les valeurs des deux fractions.' }
    ];
    choix.forEach(function (c) { if (c.juste) c.message = ''; });
    return O.erreurEleve({
      enonce: '<p>On demande de simplifier ' + m(H.fh(a, b)) + ' jusqu\'à la fraction irréductible.</p>',
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'Pour simplifier, on divise le numérateur ET le dénominateur par le même diviseur commun.',
      etapes: O.etapes(etapesSimplifier(a, b)),
      rubrique: R.amplifier,
      nombres: [fr(a), fr(b)],
      controle: { type: 'erreur', correct: a + '/' + b, eleve: resEleve.toString(), cle: cle, irreductibleEleve: cle === 'pasfini' }
    }, alea);
  }

  function vraiFauxIrreductible(alea, p) {
    var ab = fractionIrreductible(alea, Math.max(p, 2));
    var irreductible = alea.suivant() < 0.45;
    var a = ab[0], b = ab[1], k = 1;
    if (!irreductible) { k = alea.choix([2, 3, 5, 7]); a *= k; b *= k; }
    var g = O.pgcd(a, b);
    var piegePremier = !irreductible && k === 7;
    return O.vraiFaux({
      enonce: '<p class="calcul">La fraction ' + m(H.fh(a, b)) + ' est irréductible.</p>',
      vrai: irreductible,
      bonne: irreductible ? 'pgdc (' + a + ' ; ' + b + ') = 1 : ' + a + ' et ' + b + ' n\'ont pas de diviseur commun autre que 1.' : a + ' et ' + b + ' sont tous deux divisibles par ' + g + ' : on peut simplifier, ' + m(H.fh(a, b) + ' = ' + H.f(fr(a, b))) + '.',
      mauvaises: irreductible ? [
        { h: 'Faux, car ' + b + ' n\'est pas un nombre premier.', message: 'Ce qui compte, c\'est d\'avoir un diviseur commun au numérateur ET au dénominateur.' },
        { h: 'Faux, car on peut toujours diviser par 1.', message: 'Diviser par 1 ne simplifie rien : une fraction est irréductible quand le seul diviseur commun est 1.' },
        { h: 'Vrai, car le numérateur est plus petit que le dénominateur.', message: 'La conclusion est juste, mais la justification ne l\'est pas : 2/4 a aussi un numérateur plus petit, et on peut la simplifier.' }
      ] : [
        { h: 'Vrai, car ' + (a % 2 === 0 && b % 2 === 0 ? 'on ne peut pas simplifier par 3.' : 'les deux nombres ne sont pas pairs.'), message: 'Il faut chercher tous les diviseurs communs, pas seulement 2' + (a % 2 === 0 && b % 2 === 0 ? ' ou 3' : '') + '.' },
        { h: 'Vrai, car le numérateur est plus petit que le dénominateur.', message: 'Cela ne dit pas si on peut simplifier.' },
        { h: 'Faux, car ' + a + ' est un nombre pair.', message: piegePremier ? 'Ce n\'est pas la bonne raison.' : 'Ce n\'est pas la bonne raison : il faut un diviseur commun au numérateur ET au dénominateur.' }
      ],
      indice: 'Cherche le pgdc du numérateur et du dénominateur.',
      etapes: O.etapes(etapesSimplifier(a, b)),
      rubrique: R.amplifier,
      nombres: [fr(a), fr(b)],
      controle: { type: 'irreductible', a: a, b: b, vrai: irreductible }
    }, alea);
  }

  /* =====================================================================
   * CALIBRAGE EN 5 PALIERS — objectif « simplifier » (9e et 10e), validé par l'enseignante
   * ---------------------------------------------------------------------
   * Calibrage calqué sur les exercices du cours (types repris, nombres jamais recopiés) :
   *   D1-D2 : 9e F183 « Irréductible ! »          D3 : 9e F184 « Vers l'irréductible »
   *   D3-D4 : 10e F104 « Réductions possibles ? » (fondamentum du niveau 1)
   *   D4-D5 : 10e F105 « Simplifications sauvages » (approfondissement)
   *   D5    : 10e F106 « Toujours plus simple » (absent du fil rouge du niveau 1)
   * ===================================================================== */

  var S5 = [null,
    { limite: 50, maxDen: 6, facteurs: [2, 3, 5, 10] },
    { limite: 100, maxDen: 10, facteurs: [2, 3, 4, 5, 6, 7, 8, 9] },
    { limite: 200, maxDen: 12, facteurs: [6, 8, 9, 12, 14, 15, 16, 18] },
    { limite: 300, maxDen: 12, facteurs: [13, 17, 19, 21, 23, 24, 26] },
    { limite: 500, maxDen: 15, facteurs: [28, 34, 36, 38, 39, 42, 46, 51, 52, 57] }
  ];

  function estPremier(n) {
    if (n < 2) return false;
    for (var t = 2; t * t <= n; t++) if (n % t === 0) return false;
    return true;
  }
  function plusGrandFacteurPremier(n) {
    var g = 1;
    for (var t = 2; n > 1; t++) while (n % t === 0) { n /= t; g = t; }
    return g;
  }
  /** « 2² · 3² · 7 » */
  function decomposition(n) {
    var parts = [], t = 2;
    while (n > 1) {
      var e = 0;
      while (n % t === 0) { n /= t; e++; }
      if (e) parts.push(t + (e > 1 ? M.texteExposant(e) : ''));
      t++;
    }
    return parts.join(NB + '·' + NB);
  }
  function produitHtml(facteurs) { return facteurs.join(NB + '·' + NB); }
  function produitTexte(facteurs) { return facteurs.join('*'); }
  function produitDe(facteurs) { return facteurs.reduce(function (x, y) { return x * y; }, 1); }
  function distincts(alea, liste, n) { return alea.melanger(liste).slice(0, n); }

  /** Fraction à simplifier au palier d (1 à 5). */
  function fractionASimplifier5(alea, d) {
    var s = S5[d];
    // D2 et plus : parfois une fraction déjà irréductible qui « a l'air » simplifiable (9e F183, F184)
    if (d >= 2 && alea.suivant() < 0.12) {
      for (var e = 0; e < 300; e++) {
        // D2 : petits nombres des livrets (35/64, 27/20) ; ensuite jusqu'à 130 (56/65, 105/64)
        var x = alea.entier(8, d === 2 ? 64 : 130), y = alea.entier(8, d === 2 ? 64 : 130);
        if (d === 2 && (plusGrandFacteurPremier(x) > 7 || plusGrandFacteurPremier(y) > 7)) continue;
        if (x !== y && !estPremier(x) && !estPremier(y) && O.pgcd(x, y) === 1) return { ab: [x, y], k: 1, a: x, b: y };
      }
    }
    // D2 : parfois un résultat entier (27/9)
    if (d === 2 && alea.suivant() < 0.1) {
      var n = alea.entier(2, 6), q = alea.entier(3, 12);
      return { ab: [n, 1], k: q, a: n * q, b: q };
    }
    for (var essai = 0; essai < 400; essai++) {
      var b0 = alea.entier(2, s.maxDen);
      var a0 = alea.entier(1, d === 1 ? b0 - 1 : 2 * b0);
      if (O.pgcd(a0, b0) !== 1 || a0 === b0) continue;
      var k = alea.choix(s.facteurs);
      if (a0 * k <= s.limite && b0 * k <= s.limite) return { ab: [a0, b0], k: k, a: a0 * k, b: b0 * k };
    }
    return { ab: [1, 2], k: s.facteurs[0], a: s.facteurs[0], b: 2 * s.facteurs[0] };
  }

  function questionSimplifier5(alea, d) {
    var s = fractionASimplifier5(alea, d);
    var a = s.a, b = s.b, k = s.k;
    var f = fr(a, b), g = O.pgcd(a, b);
    var pieges = g === 1 ? [] : [
      { valeur: fr(a / g, b), message: 'Tu as simplifié seulement le numérateur. Pour simplifier, on divise le numérateur ET le dénominateur par le même nombre.' },
      { valeur: fr(a, b / g), message: 'Tu as simplifié seulement le dénominateur. Pour simplifier, on divise le numérateur ET le dénominateur par le même nombre.' }
    ].filter(function (pg) { return !pg.valeur.egal(f); });
    var indice = d === 1 ? 'Divise le numérateur et le dénominateur par ' + k + '.'
      : d === 2 ? 'Cherche dans tes livrets un nombre qui divise à la fois ' + a + ' et ' + b + '.'
      : d === 3 ? 'Tu peux simplifier en plusieurs fois (par 2, par 3…) ou chercher directement le pgdc de ' + a + ' et ' + b + '.'
      : 'Décompose ' + a + ' et ' + b + ' en produits de facteurs premiers pour trouver leur pgdc.';
    var et = etapesSimplifier(a, b);
    if (d >= 4 && g > 1) {
      et = [['Je décompose le numérateur et le dénominateur en produits de facteurs premiers.',
        m(a + ' = ' + decomposition(a)) + ' et ' + m(b + ' = ' + decomposition(b))]].concat(et);
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Simplifie' + (d >= 2 ? ', si c\'est possible,' : '') + ' la fraction ' + m(H.fh(a, b)) + '.</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong> : on ne doit plus pouvoir la simplifier.',
      indice: indice,
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: pieges,
      etapes: O.etapes(et),
      verification: g === 1 ? 'Vérification : ' + m(a + ' = ' + decomposition(a)) + ' et ' + m(b + ' = ' + decomposition(b)) + ' n\'ont aucun facteur premier commun. ✓'
        : 'Vérification : ' + m(H.f(f)) + ' est irréductible, et ' + m(O.num(f) + ' · ' + g + ' = ' + a) + ', ' + m(O.den(f) + ' · ' + g + ' = ' + b) + '. ✓',
      rubrique: R.amplifier,
      nombres: [fr(a), fr(b)],
      controle: { expr: a + '/' + b },
      attenduHtml: H.f(f)
    });
  }

  /** 10e — quotient de deux produits à simplifier sans calculer les produits (F104 e, g, h ; F106 c, f, h). */
  function questionProduitASimplifier(alea, d) {
    var x, y, k, haut, bas, decHaut, decBas, communs;
    do { x = alea.entier(1, 9); y = alea.entier(1, 9); } while (x === y || O.pgcd(x, y) !== 1);
    function f1(v) { return v === 1 ? [] : [v]; }
    if (d <= 3) {
      k = distincts(alea, [2, 3, 5, 7], 2);
      haut = [k[0], k[1]].concat(f1(x)); bas = [k[1], k[0]].concat(f1(y));
      decHaut = haut.slice(); decBas = bas.slice(); communs = k;
      haut = alea.melanger(haut); bas = alea.melanger(bas);
    } else if (d === 4) {
      // deux facteurs en haut et en bas, tous ⩽ 100 (10e F104 g, h)
      do {
        k = distincts(alea, [2, 3, 5, 7, 10, 13, 17], 3);
        haut = [k[0] * k[1], k[2] * x]; bas = [k[0] * k[2], k[1] * y];
      } while (Math.max(haut[0], haut[1], bas[0], bas[1]) > 100 || haut[0] === bas[0] || haut[1] === bas[1]);
      decHaut = [k[0] + NB + '·' + NB + k[1], x === 1 ? String(k[2]) : k[2] + NB + '·' + NB + x];
      decBas = [k[0] + NB + '·' + NB + k[2], y === 1 ? String(k[1]) : k[1] + NB + '·' + NB + y];
      communs = k;
    } else {
      // trois facteurs en haut et en bas, dont un grand facteur premier visible des deux côtés (10e F106 c, f, h)
      var K = alea.choix([17, 19, 23, 29, 31, 37, 41, 43, 47]);
      do { x = alea.entier(2, 9); y = alea.entier(2, 9); } while (x === y || O.pgcd(x, y) !== 1);
      do {
        k = distincts(alea, [2, 3, 4, 5, 6, 7, 8, 9, 11, 12], 3);
        haut = [k[0] * k[1], K, k[2] * x]; bas = [K, k[0] * y, k[1] * k[2]];
      } while (Math.max(haut[0], haut[2], bas[1], bas[2]) > 110);
      decHaut = [k[0] + NB + '·' + NB + k[1], String(K), k[2] + NB + '·' + NB + x];
      decBas = [String(K), k[0] + NB + '·' + NB + y, k[1] + NB + '·' + NB + k[2]];
      communs = k.concat([K]);
    }
    var P = produitDe(haut), Q = produitDe(bas), f = fr(P, Q);
    var listeCommuns = communs.slice().sort(function (u, v) { return u - v; });
    var texteCommuns = listeCommuns.length > 1 ? listeCommuns.slice(0, -1).join(', ') + ' et ' + listeCommuns[listeCommuns.length - 1] : String(listeCommuns[0]);
    var pieges = [];
    if (x === 1) pieges.push({ valeur: fr(0), message: 'Quand tous les facteurs du numérateur sont simplifiés, il reste 1 (et non 0) : simplifier, c\'est diviser.' });
    pieges.push({ valeur: fr(Q, P), message: 'Tu as inversé le numérateur et le dénominateur.' });
    var et = [];
    if (d >= 4) et.push(['Je décompose les facteurs pour faire apparaître les facteurs communs.', m(H.fh(produitHtml(haut), produitHtml(bas)) + ' = ' + H.fh(produitHtml(decHaut), produitHtml(decBas)))]);
    et.push(['Le numérateur et le dénominateur sont des produits : je simplifie par les facteurs communs ' + texteCommuns + '.',
      m(H.fh(produitHtml(d >= 4 ? decHaut : haut), produitHtml(d >= 4 ? decBas : bas)) + ' = ' + H.fh(x, y) + (y === 1 ? ' = ' + x : ''))]);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Trouve la fraction irréductible égale à cette expression, <strong>sans calculer les produits</strong> :</p><p class="calcul">' + m(H.fh(produitHtml(haut), produitHtml(bas))) + '</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong> (ou l\'entier).',
      indice: d <= 3 ? 'Repère les facteurs écrits à la fois en haut et en bas.' : 'Écris chaque facteur comme un produit (par exemple ' + haut[0] + ' = ' + decomposition(haut[0]) + ') pour repérer les facteurs communs.',
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: pieges.filter(function (pg) { return !pg.valeur.egal(f); }),
      etapes: O.etapes(et),
      verification: 'Vérification : ' + m(produitHtml(haut) + ' = ' + M.formaterNombre(P)) + ' et ' + m(produitHtml(bas) + ' = ' + M.formaterNombre(Q)) + ' ; en divisant les deux par ' + M.formaterNombre(O.pgcd(P, Q)) + ', on retrouve ' + m(H.f(f)) + '. ✓',
      rubrique: R.amplifier,
      nombres: haut.concat(bas).map(function (v) { return fr(v); }),
      controle: { expr: '(' + produitTexte(haut) + ')/(' + produitTexte(bas) + ')' },
      attenduHtml: H.f(f)
    });
  }

  var MESSAGE_TERME = 'Tu as supprimé un <strong>terme</strong> en haut et en bas. On ne simplifie que par un <strong>facteur</strong> commun : ici, calcule d\'abord les sommes (ou mets en évidence).';

  /** 10e — expression contenant une somme ou une différence (F104 c, d, f ; Faire le point p. 45 ; F106 a, b, d, e). */
  function questionSommeASimplifier(alea, d) {
    var PLUS = ' + ', MOINS = ' – ';
    var type = d <= 3 ? alea.choix(['aPlusAb', 'troisTermes']) : d === 4 ? alea.choix(['aSurSomme', 'kbPlusK']) : alea.choix(['evidence', 'difference', 'consecutifs', 'opposes']);
    var haut, bas, f, et, pieges = [], expr, indice, a, b, c, k, q, n;
    if (type === 'aPlusAb') {
      a = alea.entier(2, 9); b = alea.entier(1, 5);
      haut = b === 1 ? a + PLUS + a : a + PLUS + a + NB + '·' + NB + b; bas = String(a);
      f = fr(a + a * b, a); expr = '(' + a + '+' + a + '*' + b + ')/' + a;
      pieges.push({ valeur: fr(a * b), message: MESSAGE_TERME });
      pieges.push({ valeur: fr(1 + a * b), message: 'Il faut diviser <strong>chaque</strong> terme du numérateur par ' + a + ', pas seulement le premier.' });
      et = [['Je calcule d\'abord le numérateur (la multiplication avant l\'addition).', m(H.fh(haut, bas) + ' = ' + H.fh(a + a * b, a))],
        ['Je simplifie par ' + a + '.', m(H.fh(a + a * b, a) + ' = ' + (1 + b))]];
      indice = 'Le numérateur est une somme : calcule-la avant de simplifier.';
    } else if (type === 'troisTermes') {
      do { a = alea.entier(2, 9); b = alea.entier(2, 9); c = alea.entier(2, 9); } while (a === c || fr(a + b + c, a + c).egal(fr(b)) || (a + b + c) % (a + c) === 0);
      haut = a + PLUS + b + PLUS + c; bas = a + PLUS + c;
      f = fr(a + b + c, a + c); expr = '(' + a + '+' + b + '+' + c + ')/(' + a + '+' + c + ')';
      pieges.push({ valeur: fr(b), message: MESSAGE_TERME });
      et = [['Le numérateur et le dénominateur sont des sommes : je les calcule d\'abord.', m(H.fh(haut, bas) + ' = ' + H.fh(a + b + c, a + c))],
        [O.pgcd(a + b + c, a + c) > 1 ? 'Je simplifie par ' + O.pgcd(a + b + c, a + c) + '.' : 'La fraction obtenue est déjà irréductible.', m(H.fh(a + b + c, a + c) + ' = ' + H.f(f))]];
      indice = 'Calcule la somme du haut et la somme du bas avant de chercher à simplifier.';
    } else if (type === 'aSurSomme') {
      a = alea.choix([11, 12, 13, 14, 15, 16, 17, 18, 19]); n = alea.entier(2, 5);
      haut = String(a); bas = a + PLUS + (n * a);
      f = fr(1, n + 1); expr = a + '/(' + a + '+' + (n * a) + ')';
      pieges.push({ valeur: fr(1, n * a), message: MESSAGE_TERME });
      pieges.push({ valeur: fr(1, n), message: 'Vérifie le dénominateur : ' + a + ' + ' + (n * a) + ' = ' + ((n + 1) * a) + ', c\'est ' + (n + 1) + ' fois ' + a + '.' });
      et = [['Je calcule d\'abord la somme du dénominateur.', m(H.fh(haut, bas) + ' = ' + H.fh(a, (n + 1) * a))],
        ['Je simplifie par ' + a + ' : ' + ((n + 1) * a) + ' = ' + (n + 1) + ' · ' + a + '.', m(H.fh(a, (n + 1) * a) + ' = ' + H.f(f))]];
      indice = 'Calcule d\'abord le dénominateur. Combien de fois contient-il ' + a + ' ?';
    } else if (type === 'kbPlusK') {
      do { k = alea.choix([6, 8, 10, 12, 15, 20, 25]); b = alea.entier(2, 6); q = alea.entier(2, 12); } while (O.pgcd(b + 1, q) !== 1 || q === 1 || k * q > 300);
      haut = k + NB + '·' + NB + b + PLUS + k; bas = String(k * q);
      f = fr(b + 1, q); expr = '(' + k + '*' + b + '+' + k + ')/' + (k * q);
      pieges.push({ valeur: fr(k * b, q), message: 'Dans le numérateur, ' + k + ' · ' + b + ' + ' + k + ' vaut ' + (b + 1) + ' fois ' + k + ' : en simplifiant par ' + k + ', le dernier terme devient 1, il ne disparaît pas.' });
      et = [['Je calcule le numérateur (la multiplication avant l\'addition).', m(H.fh(haut, bas) + ' = ' + H.fh(k * (b + 1), k * q))],
        ['Je simplifie par ' + O.pgcd(k * (b + 1), k * q) + '.', m(H.fh(k * (b + 1), k * q) + ' = ' + H.f(f))]];
      indice = 'Calcule d\'abord le numérateur, puis cherche le pgdc.';
    } else if (type === 'evidence') {
      do { k = alea.choix([17, 19, 23, 29, 31, 37, 41, 43]); b = alea.entier(2, 7); q = alea.entier(2, 9); } while (O.pgcd(b + 1, q) !== 1 && (b + 1) % q !== 0 || q === b + 1);
      haut = k + NB + '·' + NB + b + PLUS + k; bas = String(k * q);
      f = fr(b + 1, q); expr = '(' + k + '*' + b + '+' + k + ')/' + (k * q);
      pieges.push({ valeur: fr(b, q), message: 'En mettant ' + k + ' en évidence, le dernier terme devient 1 : ' + k + ' · ' + b + ' + ' + k + ' = ' + k + ' · (' + b + ' + 1).' });
      et = [['Je mets ' + k + ' en évidence au numérateur et je reconnais ' + k + ' dans le dénominateur.', m(H.fh(haut, bas) + ' = ' + H.fh(k + NB + '·' + NB + '(' + b + PLUS + '1)', k + NB + '·' + NB + q))],
        ['Je simplifie par le facteur ' + k + '.', m(H.fh(b + 1, q) + (fr(b + 1, q).estEntier() ? ' = ' + H.f(f) : ''))]];
      indice = 'Le nombre ' + k + ' apparaît deux fois en haut. Le dénominateur est-il un multiple de ' + k + ' ?';
    } else if (type === 'difference') {
      do { k = alea.choix([23, 29, 31, 37, 41, 43, 47, 53]); a = alea.entier(12, 45); b = alea.entier(2, 9); } while (a === k || (a + b) % 10 === 0 && (a - b) % 10 === 0);
      haut = k + NB + '·' + NB + a + MOINS + k + NB + '·' + NB + b; bas = k + NB + '·' + NB + a + PLUS + k + NB + '·' + NB + b;
      f = fr(a - b, a + b); expr = '(' + k + '*' + a + '-' + k + '*' + b + ')/(' + k + '*' + a + '+' + k + '*' + b + ')';
      pieges.push({ valeur: fr(-1), message: MESSAGE_TERME });
      et = [['Je mets ' + k + ' en évidence en haut et en bas.', m(H.fh(haut, bas) + ' = ' + H.fh(k + NB + '·' + NB + '(' + a + MOINS + b + ')', k + NB + '·' + NB + '(' + a + PLUS + b + ')'))],
        ['Je simplifie par le facteur ' + k + ', puis je calcule.', m(H.fh(a - b, a + b) + (O.pgcd(a - b, a + b) > 1 ? ' = ' + H.f(f) : ''))]];
      indice = 'Ne calcule pas les produits : quel facteur est commun aux quatre produits ?';
    } else if (type === 'consecutifs') {
      n = 2 * alea.entier(60, 190) + 1; c = alea.choix([1, 2, 3]);
      haut = String(n); bas = (n - c) + PLUS + n + PLUS + (n + c);
      f = fr(1, 3); expr = n + '/(' + (n - c) + '+' + n + '+' + (n + c) + ')';
      pieges.push({ valeur: fr(1, 2 * n), message: MESSAGE_TERME });
      et = [['Je remarque que ' + (n - c) + ' + ' + (n + c) + ' = 2 · ' + n + ' : le dénominateur vaut 3 · ' + n + '.', m(H.fh(haut, bas) + ' = ' + H.fh(n, '3' + NB + '·' + NB + n))],
        ['Je simplifie par le facteur ' + n + '.', m(H.fh(1, 3))]];
      indice = 'Observe les trois nombres du dénominateur : que vaut la somme du premier et du dernier ?';
    } else {
      a = alea.entier(301, 899); b = a + alea.entier(11, 95);
      haut = a + MOINS + b; bas = b + MOINS + a;
      f = fr(-1); expr = '(' + a + '-' + b + ')/(' + b + '-' + a + ')';
      pieges.push({ valeur: fr(1), message: 'Attention au signe : ' + a + ' – ' + b + ' et ' + b + ' – ' + a + ' sont deux nombres <strong>opposés</strong>, pas égaux.' });
      pieges.push({ valeur: fr(0), message: 'Le numérateur ne vaut pas 0 : ' + a + ' – ' + b + ' = ' + M.formaterNombre(a - b) + '.' });
      et = [['Je calcule les deux différences : elles sont opposées.', m(H.fh(haut, bas) + ' = ' + H.fh(M.formaterNombre(a - b), b - a))],
        ['Le quotient de deux nombres opposés vaut – 1.', m(H.f(f))]];
      indice = 'Compare le numérateur et le dénominateur : sont-ils égaux ?';
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Trouve la fraction irréductible (ou l\'entier) égale à cette expression :</p><p class="calcul">' + m(H.fh(haut, bas)) + '</p>',
      consigne: 'Donne le résultat sous sa forme <strong>la plus simple</strong>.',
      indice: indice,
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: pieges.filter(function (pg) { return !pg.valeur.egal(f); }),
      etapes: O.etapes(et),
      rubrique: R.amplifier,
      nombres: [],
      controle: { expr: expr },
      attenduHtml: H.f(f)
    });
  }

  /** 10e — « simplifications sauvages » : juger si une simplification est permise (F105). */
  function vraiFauxSauvage(alea, d) {
    var PLUS = ' + ';
    var type = d <= 4 ? alea.choix(['termes', 'facteurs', 'sommeEgale']) : alea.choix(['termes', 'facteurs', 'sommeEgale', 'chiffres', 'puissances']);
    var k, a, b, gauche, droite, vrai, bonne, mauvaises, et, u, v, c, exprG, exprD;
    var kmin = d <= 4 ? 3 : 13, kmax = d <= 4 ? 12 : 29, tmax = d <= 4 ? 30 : 70;
    if (type === 'termes') {
      do { k = alea.entier(kmin, kmax); a = alea.entier(2, tmax); b = alea.entier(2, tmax); } while (a === b || a === k || b === k);
      gauche = H.fh(k + PLUS + a, k + PLUS + b); droite = H.fh(a, b); vrai = false;
      exprG = '(' + k + '+' + a + ')/(' + k + '+' + b + ')'; exprD = a + '/' + b;
      bonne = k + ' est un terme d\'une somme, pas un facteur : ' + m(H.fh(k + PLUS + a, k + PLUS + b) + ' = ' + H.fh(k + a, k + b)) + ', ce qui n\'est pas égal à ' + m(H.fh(a, b)) + '.';
      mauvaises = [
        { h: 'Vrai, car on a simplifié par ' + k + ' en haut et en bas.', message: 'On ne peut simplifier que par un <strong>facteur</strong> commun. Ici, ' + k + ' est ajouté : c\'est un terme.' },
        { h: 'Vrai, car on a enlevé le même nombre au numérateur et au dénominateur.', message: 'Enlever le même nombre en haut et en bas change la valeur d\'une fraction : ' + m(H.fh(2, 3)) + ' n\'est pas égal à ' + m(H.fh(1, 2)) + '.' },
        { h: 'Faux, car on ne peut jamais simplifier une fraction qui contient un calcul.', message: 'La conclusion est juste, mais pas la raison : si le numérateur et le dénominateur sont des <strong>produits</strong>, on peut simplifier par un facteur commun.' }
      ];
      et = [['Je calcule les deux sommes.', m(H.fh(k + PLUS + a, k + PLUS + b) + ' = ' + H.fh(k + a, k + b) + (O.pgcd(k + a, k + b) > 1 ? ' = ' + H.f(fr(k + a, k + b)) : ''))],
        ['Je compare avec la fraction proposée : les produits en croix sont différents.', m((k + a) + ' · ' + b + ' = ' + M.formaterNombre((k + a) * b)) + ', mais ' + m((k + b) + ' · ' + a + ' = ' + M.formaterNombre((k + b) * a))]];
    } else if (type === 'facteurs') {
      do { k = alea.entier(kmin, kmax); a = alea.entier(2, d <= 4 ? 12 : 30); b = alea.entier(2, d <= 4 ? 12 : 30); } while (a === b || a === k || b === k);
      gauche = H.fh(k + NB + '·' + NB + a, k + NB + '·' + NB + b); droite = H.fh(a, b); vrai = true;
      exprG = '(' + k + '*' + a + ')/(' + k + '*' + b + ')'; exprD = a + '/' + b;
      bonne = k + ' est un facteur commun du numérateur et du dénominateur : on peut simplifier par ' + k + '.';
      mauvaises = [
        { h: 'Faux, car il faut d\'abord calculer les deux produits.', message: 'Calculer d\'abord est possible, mais pas nécessaire : simplifier par un facteur commun ne change pas la valeur de la fraction.' },
        { h: 'Faux, car on ne peut pas supprimer un nombre en haut et en bas.', message: 'On le peut quand ce nombre est un <strong>facteur</strong> du numérateur et du dénominateur : c\'est une division par ' + k + '.' },
        { h: 'Vrai, car on peut toujours supprimer un nombre écrit en haut et en bas.', message: 'La conclusion est juste, mais pas la raison : ce n\'est permis que pour un facteur d\'un produit, jamais pour un terme d\'une somme.' }
      ];
      et = [['Le numérateur et le dénominateur sont des produits qui ont le facteur ' + k + ' en commun.', m(H.fh(k + NB + '·' + NB + a, k + NB + '·' + NB + b) + ' = ' + H.fh(a, b))],
        ['Vérification en calculant les produits.', m(H.fh(k * a, k * b) + ' = ' + H.f(fr(a, b)))]];
    } else if (type === 'sommeEgale') {
      k = alea.entier(kmin, kmax); u = alea.entier(2, 4); do { v = alea.entier(2, 5); } while (v === u || O.pgcd(u, v) !== 1);
      var rep = function (n, sep) { var t = []; for (var i = 0; i < n; i++) t.push(k); return t.join(sep); };
      gauche = H.fh(rep(u, PLUS), rep(v, PLUS)); droite = H.fh(u, v); vrai = true;
      exprG = '(' + rep(u, '+') + ')/(' + rep(v, '+') + ')'; exprD = u + '/' + v;
      bonne = 'le numérateur vaut ' + u + ' · ' + k + ' et le dénominateur ' + v + ' · ' + k + ' : on simplifie par le facteur ' + k + '.';
      mauvaises = [
        { h: 'Faux, car on ne simplifie jamais quand il y a des additions.', message: 'On ne simplifie pas terme à terme, mais ici chaque somme s\'écrit comme un produit : ' + u + ' · ' + k + ' et ' + v + ' · ' + k + '.' },
        { h: 'Vrai, car on a supprimé un ' + k + ' en haut et un ' + k + ' en bas.', message: 'La conclusion est juste, mais pas la raison : supprimer un terme en haut et en bas ne donnerait pas ' + m(H.fh(u, v)) + '.' },
        { h: 'Faux, car le résultat vaut 1.', message: 'Il n\'y a pas le même nombre de termes en haut (' + u + ') et en bas (' + v + ').' }
      ];
      et = [['J\'écris chaque somme de termes égaux comme un produit.', m(H.fh(rep(u, PLUS), rep(v, PLUS)) + ' = ' + H.fh(u + NB + '·' + NB + k, v + NB + '·' + NB + k))],
        ['Je simplifie par le facteur ' + k + '.', m(H.fh(u, v))]];
    } else if (type === 'chiffres') {
      do { u = alea.entier(11, 39); v = alea.entier(12, 59); c = alea.entier(1, 9); a = 10 * u + c; b = 10 * v + c; } while (u === v || u % 10 === 0 || v % 10 === 0 || a * v === b * u);
      gauche = H.fh(a, b); droite = H.fh(u, v); vrai = false;
      exprG = a + '/' + b; exprD = u + '/' + v;
      bonne = 'supprimer le chiffre ' + c + ' n\'est pas une division : ' + m(a + ' · ' + v + ' = ' + M.formaterNombre(a * v)) + ', mais ' + m(b + ' · ' + u + ' = ' + M.formaterNombre(b * u)) + '.';
      mauvaises = [
        { h: 'Vrai, car on a simplifié par ' + c + ' en haut et en bas.', message: 'Simplifier par ' + c + ', c\'est <strong>diviser</strong> par ' + c + ' : ' + a + ' : ' + c + ' ne donne pas ' + u + '.' },
        { h: 'Vrai, car on a enlevé le même chiffre au numérateur et au dénominateur.', message: 'Un chiffre des unités n\'est pas un facteur du nombre : ' + a + ' = ' + u + ' · 10 + ' + c + '.' },
        { h: 'Faux, car une fraction écrite avec des nombres de trois chiffres est toujours irréductible.', message: 'La conclusion est juste, mais pas la raison : ' + m(H.fh(100, 200) + ' = ' + H.fh(1, 2)) + '.' }
      ];
      et = [['Je compare les deux fractions avec les produits en croix.', m(a + ' · ' + v + ' = ' + M.formaterNombre(a * v)) + ' et ' + m(b + ' · ' + u + ' = ' + M.formaterNombre(b * u))],
        ['Les produits sont différents : les fractions ne sont pas égales.', '']];
    } else {
      k = alea.entier(3, 19); u = alea.entier(2, 3);
      var kp = function (e) { return k + M.texteExposant(e); };
      gauche = H.fh(kp(u) + PLUS + kp(u + 1), kp(u)); droite = '1' + PLUS + k; vrai = true;
      exprG = '(' + k + '^' + u + '+' + k + '^' + (u + 1) + ')/' + k + '^' + u; exprD = '1+' + k;
      bonne = m(kp(u) + PLUS + kp(u + 1) + ' = ' + kp(u) + ' · (1' + PLUS + k + ')') + ' : on simplifie par le facteur ' + m(kp(u)) + '.';
      mauvaises = [
        { h: 'Faux, car ' + m(kp(u) + PLUS + kp(u + 1) + ' = ' + kp(2 * u + 1)) + '.', message: 'On additionne les exposants pour un <strong>produit</strong> de puissances, pas pour une somme.' },
        { h: 'Faux, car en supprimant ' + m(kp(u)) + ' en haut et en bas, il reste ' + m(kp(u + 1)) + '.', message: 'Supprimer un terme n\'est pas permis ; de plus ' + m(H.fh(kp(u), kp(u)) + ' = 1') + ', pas 0.' },
        { h: 'Faux, car on ne simplifie jamais quand il y a une addition.', message: 'On peut mettre ' + m(kp(u)) + ' en évidence : le numérateur devient alors un produit.' }
      ];
      et = [['Je partage la fraction en deux (ou je mets ' + m(kp(u)) + ' en évidence).', m(gauche + ' = ' + H.fh(kp(u), kp(u)) + PLUS + H.fh(kp(u + 1), kp(u)))],
        ['Je simplifie chaque fraction.', m('1' + PLUS + k + ' = ' + (1 + k))]];
    }
    return O.vraiFaux({
      enonce: '<p>Un élève a écrit cette égalité. Est-elle correcte ?</p><p class="calcul">' + m(gauche + ' = ' + droite) + '</p>',
      vrai: vrai,
      bonne: bonne,
      mauvaises: mauvaises,
      indice: 'On ne peut simplifier que par un facteur commun à tout le numérateur et à tout le dénominateur.',
      etapes: O.etapes(et),
      rubrique: R.amplifier,
      nombres: [],
      // l'égalité est recalculée par les tests : les deux membres ont-ils la même valeur ?
      controle: { type: 'vf', a: exprG, relation: '=', b: exprD, mesure: { ops: 1, etapes: 1 } }
    }, alea);
  }

  /* =====================================================================
   * Objectif : écriture décimale <-> fraction
   * ===================================================================== */

  function questionDecVersFraction(alea, p) {
    // D1 : 0,6 ; D2 : deux décimales à simplifier ; D3 : trois décimales, ou nombre plus grand que 1 ; D4 : trois décimales, plus grand que 1
    var d = p <= 1 ? 1 : p === 2 ? 2 : p === 3 ? alea.choix([2, 3]) : 3;
    var p10 = Math.pow(10, d);
    var max = p <= 2 ? p10 - 1 : p === 3 ? (d === 2 ? 9 * p10 : p10 - 1) : 4 * p10;
    var n;
    do { n = alea.entier(p >= 3 && d === 2 ? p10 + 1 : 1, max); } while (n % 10 === 0 || (O.pgcd(n, p10) === 1 && p >= 2 && p <= 3));
    var f = fr(n, p10);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.n(f)) + ' sous forme de fraction.</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong> : c\'est l\'écriture fractionnaire la plus simple.',
      indice: 'Combien de décimales ? Le dénominateur est 10, 100 ou 1000 ; ensuite, simplifie.',
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: [
        { valeur: fr(n, Math.pow(10, d + 1)), message: 'Attention au dénominateur : ' + d + ' décimale' + (d > 1 ? 's' : '') + ' donne' + (d > 1 ? 'nt' : '') + ' le dénominateur ' + p10 + '.' },
        { valeur: d > 1 ? fr(n, Math.pow(10, d - 1)) : fr(n, 100), message: 'Attention au dénominateur : ' + d + ' décimale' + (d > 1 ? 's' : '') + ' donne' + (d > 1 ? 'nt' : '') + ' le dénominateur ' + p10 + '.' }
      ],
      etapes: O.etapes([['J\'écris le nombre sur ' + p10 + ' (' + d + ' décimale' + (d > 1 ? 's' : '') + ').', m(H.n(f) + ' = ' + H.fh(n, p10))]].concat(etapesSimplifier(n, p10))),
      verification: 'Vérification : ' + m(f.num + ' : ' + f.den + ' = ' + H.n(f)) + '. ✓',
      rubrique: R.ecrituresDecimales,
      nombres: [f],
      controle: { expr: f.toString() },
      signature: 'dec>frac:' + f.toString(),
      attenduHtml: H.f(f)
    });
  }

  function questionFractionVersDec(alea, p, opts) {
    opts = opts || {};
    var a, b;
    // écriture périodique : seulement si demandé (10e et plus), jamais en 9e
    var periodique = opts.periodique && p >= 2 && alea.suivant() < 0.6;
    if (periodique) {
      b = alea.choix([3, 6, 9, 11, 12]);
      do { a = alea.entier(1, b - 1); } while (fr(a, b).estDecimale());
    } else {
      b = alea.choix([null, [2, 4, 5, 10], [20, 25, 50], [8, 40, 125], [8, 40, 80, 125, 200]][p]);
      var maxA = Math.min(LIMITE[p], p <= 1 ? 2 * b : p === 2 ? b - 1 : 2 * b);
      do { a = alea.entier(1, maxA); } while (a % b === 0);
    }
    var f = fr(a, b);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.fh(a, b)) + ' en écriture décimale.</p>',
      consigne: 'Réponse en <strong>écriture décimale</strong>. Si elle est illimitée, indique la période : touche 1̅ (barre) ou chiffres répétés suivis de « … ».',
      indice: 'Divise ' + a + ' par ' + b + ' ; arrête-toi quand le reste est nul ou quand un reste revient.',
      reponse: { type: 'valeur', valeur: f, forme: 'decimal' },
      pieges: [{ test: function (t, v) { return v && !v.egal(f) && !f.estDecimale() && Math.abs(v.valeur() - f.valeur()) < 0.01; }, message: 'C\'est une valeur arrondie. L\'écriture exacte est périodique : indique la période.' }],
      etapes: O.etapes(etapesDivision(a, b)),
      verification: f.estDecimale() ? 'Vérification : ' + m(H.n(f) + ' · ' + b + ' = ' + a) + '. ✓' : 'Vérification : la calculatrice n\'est pas nécessaire, la division redonne toujours les mêmes restes.',
      rubrique: R.ecrituresDecimales,
      nombres: [fr(a), fr(b)],
      controle: { expr: a + '/' + b },
      attenduHtml: H.n(f)
    });
  }

  function erreurConversion(alea, p) {
    var nom = prenom(alea);
    var d = p <= 2 ? 2 : alea.entier(2, 3);
    var p10 = Math.pow(10, d);
    var n;
    do { n = alea.entier(11, p10 - 1); } while (n % 10 === 0);
    var f = fr(n, p10);
    var type = alea.choix(['denominateur', 'simplif', 'juste']);
    var lignes, cle, resEleve;
    if (type === 'denominateur') {
      lignes = [H.n(f) + ' = ' + H.fh(n, p10 / 10)];
      resEleve = fr(n, p10 / 10);
      cle = 'den';
    } else if (type === 'simplif' && O.pgcd(n, p10) > 1) {
      var g = O.pgcd(n, p10);
      lignes = [H.n(f) + ' = ' + H.fh(n, p10), '= ' + H.fh(n / g, p10 / g + 1)];
      resEleve = fr(n / g, p10 / g + 1);
      cle = 'simp';
    } else {
      lignes = [H.n(f) + ' = ' + H.fh(n, p10)].concat(O.pgcd(n, p10) > 1 ? ['= ' + H.f(f)] : []);
      resEleve = f;
      cle = 'aucune';
    }
    var choix = [
      { h: 'Le dénominateur ne correspond pas au nombre de décimales.', juste: cle === 'den', cle: 'den', message: 'Compte les décimales de ' + M.formaterNombre(f) + '.' },
      { h: 'La simplification est fausse.', juste: cle === 'simp', cle: 'simp', message: 'Vérifie la dernière ligne.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : recalcule ' + f.num + ' : ' + f.den + '.' },
      { h: 'Il fallait mettre la partie décimale au dénominateur.', juste: false, cle: 'x', message: 'Non : on écrit tous les chiffres au numérateur, sur 10, 100 ou 1000.' }
    ];
    choix.forEach(function (c) { if (c.juste) c.message = ''; });
    return O.erreurEleve({
      enonce: '<p>On demande d\'écrire ' + m(H.n(f)) + ' sous forme de fraction irréductible.</p>',
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: d + ' décimales : le dénominateur est ' + p10 + '.',
      etapes: O.etapes([['J\'écris le nombre sur ' + p10 + '.', m(H.n(f) + ' = ' + H.fh(n, p10))]].concat(etapesSimplifier(n, p10))),
      rubrique: R.ecrituresDecimales,
      nombres: [f],
      controle: { type: 'erreur', correct: f.toString(), eleve: resEleve.toString(), cle: cle }
    }, alea);
  }

  /* =====================================================================
   * Objectif : représenter une fraction / une quantité par une fraction
   * ===================================================================== */

  function questionColorier(alea, p) {
    var ab = p <= 1 ? [alea.entier(1, 3), 4] : fractionIrreductible(alea, Math.min(p, 3));
    if (ab[1] > 10) ab = [3, 8];
    var k = p >= 2 ? alea.choix([1, 2, 2, 3]) : 1;
    var parts = ab[1] * k;
    if (parts > 24) { k = 1; parts = ab[1]; }
    var forme = alea.choix(['barre', 'disque']);
    var f = fr(ab[0], ab[1]);
    return O.saisie({
      type: 'visuel',
      enonce: '<p>La figure est partagée en ' + parts + ' parts égales. Colorie ' + m(H.f(f)) + ' de la figure.</p>',
      consigne: 'Touche les parts pour les colorier, puis valide.',
      indice: k > 1 ? 'La figure a ' + parts + ' parts : ' + m(H.f(f)) + ' = ' + m(H.fh('?', parts)) + '.' : 'Colorie ' + ab[0] + ' part' + (ab[0] > 1 ? 's' : '') + ' sur ' + ab[1] + '.',
      reponse: { type: 'coloriage', parts: parts, valeur: f },
      pieges: [{ valeur: fr(ab[0]), message: k > 1 ? 'Tu as colorié ' + ab[0] + ' parts, mais la figure est partagée en ' + parts + ' parts, pas en ' + ab[1] + '. Amplifie la fraction : ' + M.formaterFraction(f) + ' = ' + (ab[0] * k) + '/' + parts + '.' : null }].filter(function (pg) { return pg.message; }),
      etapes: O.etapes(k > 1 ? [
        ['J\'amplifie la fraction pour obtenir ' + parts + ' parts.', m(H.f(f) + ' = ' + H.fh(ab[0] * k, parts))],
        ['Je colorie ' + (ab[0] * k) + ' parts sur ' + parts + '.', '']
      ] : [['Je colorie ' + ab[0] + ' part' + (ab[0] > 1 ? 's' : '') + ' sur ' + ab[1] + '.', '']]),
      rubrique: R.vocabulaireFractions,
      visuel: { type: forme, parts: parts, colorees: 0, interactif: true },
      visuelCorrection: { type: forme, parts: parts, colorees: ab[0] * k },
      nombres: [f],
      controle: { expr: ab[0] + '/' + ab[1] },
      attenduHtml: (ab[0] * k) + ' parts sur ' + parts
    });
  }

  function questionLireFraction(alea, p) {
    var n = alea.choix(p <= 2 ? [3, 4, 5, 6, 8] : [6, 8, 9, 10, 12]);
    var k = alea.entier(1, n - 1);
    var forme = alea.choix(['barre', 'disque']);
    var f = fr(k, n);
    var irr = p >= 3 && O.pgcd(k, n) > 1;
    return O.saisie({
      type: 'visuel',
      enonce: '<p>Quelle fraction de la figure est coloriée ?</p>',
      consigne: irr ? 'Donne la <strong>fraction irréductible</strong>.' : 'Donne une fraction.',
      indice: 'Compte les parts coloriées et le nombre total de parts égales.',
      reponse: { type: 'valeur', valeur: f, forme: irr ? 'irreductible' : 'nombre' },
      pieges: [
        { valeur: fr(k, n - k), message: 'Tu as comparé les parts coloriées aux parts blanches. Le dénominateur est le nombre total de parts.' },
        { valeur: fr(n - k, n), message: 'Tu as compté les parts blanches au lieu des parts coloriées.' }
      ],
      etapes: O.etapes([
        ['La figure est partagée en ' + n + ' parts égales, et ' + k + ' sont coloriées.', m(H.fh(k, n))]
      ].concat(O.pgcd(k, n) > 1 ? etapesSimplifier(k, n) : [])),
      rubrique: R.vocabulaireFractions,
      visuel: { type: forme, parts: n, colorees: k },
      nombres: [fr(k), fr(n)],
      controle: { expr: k + '/' + n }
    });
  }

  function problemeQuantiteFraction(alea, p) {
    var total = alea.choix(p <= 1 ? [12, 15, 16, 18, 20] : [20, 24, 25, 28, 30, 32]);
    var diviseurs = [];
    for (var d = 2; d <= total; d++) if (total % d === 0 && d <= 10) diviseurs.push(d);
    var den = alea.choix(diviseurs);
    var a;
    do { a = alea.entier(1, den - 1); } while (O.pgcd(a, den) !== 1);
    var part = total / den * a;
    var ctx = alea.choix([
      { tout: 'élèves dans la classe', ce: 'viennent à l\'école à vélo', question: 'Quelle fraction des élèves vient à vélo ?' },
      { tout: 'élèves au camp de ski', ce: 'font du snowboard', question: 'Quelle fraction des élèves fait du snowboard ?' },
      { tout: 'matchs joués par le club de unihockey', ce: 'ont été gagnés', question: 'Quelle fraction des matchs a été gagnée ?' }
    ]);
    var ecrire = p >= 2;
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Il y a ' + total + ' ' + ctx.tout + '. ' + part + ' d\'entre eux ' + ctx.ce + '.</p><p>' + ctx.question + '</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong>.',
      indice: 'La fraction est « nombre de la partie / nombre total », puis simplifie.',
      reponse: { type: 'valeur', valeur: fr(part, total), forme: 'irreductible' },
      pieges: [
        { valeur: fr(part, total - part), message: 'Tu as comparé à ceux qui ne sont pas concernés ; le dénominateur doit être le total (' + total + ').' },
        { valeur: fr(total - part, total), message: 'Tu as calculé la fraction de ceux qui ne sont pas concernés.' }
      ],
      etapes: O.etapes([['La partie vaut ' + part + ', le total vaut ' + total + '.', m(H.fh(part, total))]].concat(etapesSimplifier(part, total))),
      verification: 'Vérification : ' + m(H.f(fr(part, total))) + ' de ' + total + ' = ' + part + '. ✓',
      rubrique: R.vocabulaireFractions,
      nombres: [fr(total), fr(part)],
      controle: { expr: part + '/' + total },
      attenduHtml: H.f(fr(part, total)),
      ecrire: ecrire
    });
  }

  /* =====================================================================
   * Objectif : comparer deux nombres
   * ===================================================================== */

  function couplePourComparer(alea, p, ctx) {
    var x, y, a, b, c, d;
    var genre = p <= 1 ? 'memeDen' : p === 2 ? alea.choix(['memeNum', 'multiple']) : p === 3 ? alea.choix(['different', 'decFrac']) : alea.choix(['different', 'decFrac', 'egal', 'negatif']);
    if (genre === 'negatif' && !(ctx && ctx.relatifs)) genre = 'different';
    if (genre === 'memeDen') {
      b = d = alea.entier(3, 12); a = alea.entier(1, b - 1); do { c = alea.entier(1, b - 1); } while (c === a);
    } else if (genre === 'memeNum') {
      a = c = alea.entier(1, 7); b = alea.entier(a + 1, 11); do { d = alea.entier(a + 1, 12); } while (d === b);
    } else if (genre === 'multiple') {
      b = alea.choix([2, 3, 4]); d = b * alea.choix([2, 3]); a = alea.entier(1, b - 1); do { c = alea.entier(1, d - 1); } while (c * b === a * d);
    } else if (genre === 'egal') {
      var ab = fractionIrreductible(alea, 3); var k1 = alea.entier(2, 4), k2 = alea.entier(2, 5);
      if (k1 === k2) k2++;
      a = ab[0] * k1; b = ab[1] * k1; c = ab[0] * k2; d = ab[1] * k2;
    } else {
      do { b = alea.entier(3, 12); d = alea.entier(3, 12); } while (b === d);
      a = alea.entier(1, b - 1); do { c = alea.entier(1, d - 1); } while (c * b === a * d);
    }
    x = fr(a, b); y = fr(c, d);
    var hx = H.fh(a, b), hy = H.fh(c, d), tx = a + '/' + b, ty = c + '/' + d;
    if (genre === 'decFrac') {
      var dec = new F(Math.round(y.valeur() * 100 + alea.choix([-3, -2, 2, 3])), 100);
      if (dec.compare(0) <= 0) dec = new F(5, 100);
      x = dec; hx = H.n(dec); tx = dec.toString();
    }
    if (genre === 'negatif') {
      x = x.oppose(); hx = H.moins + hx; tx = '-' + tx;
      if (alea.suivant() < 0.5) { y = y.oppose(); hy = H.moins + hy; ty = '-' + ty; }
    }
    if (alea.suivant() < 0.5) return { x: y, y: x, hx: hy, hy: hx, tx: ty, ty: tx, genre: genre };
    return { x: x, y: y, hx: hx, hy: hy, tx: tx, ty: ty, genre: genre };
  }

  function etapesComparer(c) {
    var et = [];
    var x = c.x, y = c.y;
    if (c.genre === 'decFrac') {
      var ex = function (h, v) { return h === H.n(v) ? h : h + ' = ' + H.n(v); };
      et.push(['J\'écris les deux nombres en écriture décimale.', m(ex(c.hx, x) + ' ; ' + ex(c.hy, y))]);
    } else if (c.genre === 'memeNum') {
      et.push(['Les numérateurs sont égaux : la fraction qui a le plus petit dénominateur a les plus grandes parts, elle est la plus grande.', '']);
    } else {
      var b = Number(x.den), d = Number(y.den);
      var mcd = O.ppmc(b, d);
      var xa = x.fois(mcd), ya = y.fois(mcd);
      et.push(['Je mets les deux fractions au même dénominateur : ppmc (' + b + ' ; ' + d + ') = ' + mcd + '.',
        m(c.hx + ' = ' + (xa.signe() < 0 ? H.moins : '') + H.fh(Math.abs(Number(xa.num)), mcd) + ' ; ' + c.hy + ' = ' + (ya.signe() < 0 ? H.moins : '') + H.fh(Math.abs(Number(ya.num)), mcd))]);
      if (x.signe() < 0 || y.signe() < 0) et.push(['Avec des nombres négatifs : le plus grand est celui qui est le plus à droite sur la droite numérique.', '']);
      else et.push(['Avec le même dénominateur, je compare les numérateurs.', '']);
    }
    var s = x.compare(y);
    et.push(['Conclusion.', m(c.hx + ' ' + (s < 0 ? '&lt;' : s > 0 ? '&gt;' : '=') + ' ' + c.hy)]);
    return O.etapes(et);
  }

  function questionComparer(alea, p, ctx) {
    var c = couplePourComparer(alea, p, ctx);
    var s = c.x.compare(c.y);
    var bon = s < 0 ? '<' : s > 0 ? '>' : '=';
    var piegeNaif = '';
    if (c.genre === 'memeNum') piegeNaif = 'Attention : avec le même numérateur, plus le dénominateur est grand, plus les parts sont petites.';
    if (c.genre === 'decFrac') piegeNaif = 'Écris les deux nombres de la même manière (par exemple en écriture décimale) avant de comparer.';
    var choix = ['<', '=', '>'].map(function (sym) {
      return {
        h: m(c.hx + ' ' + (sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '=') + ' ' + c.hy),
        juste: sym === bon, cle: sym,
        message: sym === bon ? '' : (piegeNaif || (sym === '=' ? 'Les deux nombres ne sont pas égaux : mets-les au même dénominateur.' : 'Mets les deux fractions au même dénominateur pour comparer les numérateurs.'))
      };
    });
    var lo = Math.floor(Math.min(c.x.valeur(), c.y.valeur(), 0)), hi = Math.ceil(Math.max(c.x.valeur(), c.y.valeur(), 1));
    return O.choix({
      type: 'directe',
      enonce: '<p>Compare les deux nombres ' + m(c.hx) + ' et ' + m(c.hy) + '.</p>',
      consigne: 'Choisis le bon signe. Tu peux t\'aider de la droite numérique.',
      choix: choix,
      ordreFixe: true,
      indice: c.genre === 'memeDen' ? 'Même dénominateur : compare les numérateurs.' : 'Mets les fractions au même dénominateur, ou écris-les en écriture décimale.',
      etapes: etapesComparer(c),
      verification: 'Vérification avec des valeurs approchées : ' + m(c.hx + ' ≈ ' + H.arrondi(c.x, 3) + ' et ' + c.hy + ' ≈ ' + H.arrondi(c.y, 3)) + '. ✓',
      rubrique: R.comparer,
      visuel: { type: 'droite', min: lo, max: hi, pas: hi - lo <= 2 ? 0.1 : 0.5, interactif: true },
      visuelCorrection: { type: 'droite', min: lo, max: hi, pas: hi - lo <= 2 ? 0.1 : 0.5, points: [{ v: c.x.valeur(), nom: 'A', label: M.formaterFraction(c.x) }, { v: c.y.valeur(), nom: 'B', label: M.formaterFraction(c.y) }] },
      nombres: [c.x, c.y],
      controle: { type: 'compare', a: c.tx, b: c.ty, cle: bon }
    }, alea);
  }

  function questionComparerDecimaux(alea, p, ctx) {
    var e = alea.entier(0, p >= 3 ? 20 : 5);
    var d1 = alea.entier(1, 9);
    var piege = alea.choix(p >= 3 ? ['longueur', 'zero', 'normal'] : ['longueur', 'normal']);
    var x, y;
    if (piege === 'longueur') { x = new F(e * 10 + d1, 10); y = new F(e * 100 + (d1 - 1) * 10 + alea.entier(1, 9), 100); if (d1 === 1) y = new F(e * 100 + alea.entier(1, 9), 100); }
    else if (piege === 'zero') { x = new F(e * 100 + d1, 100); y = new F(e * 10 + d1, 100).plus(fr(e * 9, 10)); y = new F(e * 1000 + d1 * 10 + alea.entier(1, 9), 1000); }
    else { x = new F(e * 100 + alea.entier(1, 99), 100); do { y = new F(e * 100 + alea.entier(1, 99), 100); } while (y.egal(x)); }
    if (ctx && ctx.relatifs && p >= 4 && alea.suivant() < 0.5) { x = x.oppose(); y = y.oppose(); }
    if (alea.suivant() < 0.5) { var t = x; x = y; y = t; }
    var s = x.compare(y);
    var bon = s < 0 ? '<' : s > 0 ? '>' : '=';
    var choix = ['<', '=', '>'].map(function (sym) {
      return {
        h: m(H.n(x) + ' ' + (sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '=') + ' ' + H.n(y)),
        juste: sym === bon, cle: sym,
        message: sym === bon ? '' : (piege === 'longueur' ? 'Un nombre qui a plus de chiffres après la virgule n\'est pas forcément plus grand : compare chiffre par chiffre, en commençant par les dixièmes.' : 'Compare la partie entière, puis les dixièmes, puis les centièmes…' + (x.signe() < 0 ? ' Avec des nombres négatifs, le plus grand est le plus proche de zéro.' : ''))
      };
    });
    var nd = Math.max(O.nbDecimales(x), O.nbDecimales(y));
    return O.choix({
      type: 'directe',
      enonce: '<p>Compare ' + m(H.n(x)) + ' et ' + m(H.n(y)) + '.</p>',
      consigne: 'Choisis le bon signe.',
      choix: choix,
      ordreFixe: true,
      indice: 'Écris les deux nombres avec le même nombre de décimales (ajoute des zéros), puis compare.',
      etapes: O.etapes([
        ['J\'écris les deux nombres avec ' + nd + ' décimales.', m(M.formaterNombre(x, nd, { fixe: true }) + ' et ' + M.formaterNombre(y, nd, { fixe: true }))],
        [x.signe() < 0 ? 'Je compare : pour des nombres négatifs, le plus grand est celui qui a la plus petite distance à zéro.' : 'Je compare chiffre par chiffre, de gauche à droite.', m(H.n(x) + ' ' + (bon === '<' ? '&lt;' : bon === '>' ? '&gt;' : '=') + ' ' + H.n(y))]
      ]),
      rubrique: R.comparer,
      nombres: [x, y],
      controle: { type: 'compare', a: x.toString(), b: y.toString(), cle: bon }
    }, alea);
  }

  function vraiFauxComparer(alea, p, ctx) {
    var c = couplePourComparer(alea, Math.max(2, p), ctx);
    var s = c.x.compare(c.y);
    if (s === 0) return questionComparer(alea, p, ctx);
    var annonce = alea.suivant() < 0.5 ? '<' : '>';
    var vrai = (annonce === '<' && s < 0) || (annonce === '>' && s > 0);
    var sym = annonce === '<' ? '&lt;' : '&gt;';
    var et = etapesComparer(c);
    return O.vraiFaux({
      enonce: '<p class="calcul">' + m(c.hx + ' ' + sym + ' ' + c.hy) + '</p>',
      vrai: vrai,
      bonne: 'en les mettant au même dénominateur (ou en écriture décimale), on trouve ' + m(c.hx + ' ' + (s < 0 ? '&lt;' : '&gt;') + ' ' + c.hy) + '.',
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car la fraction qui a le plus grand dénominateur est la plus grande.', message: 'Le dénominateur seul ne permet pas de comparer : il indique la taille des parts.' },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car la fraction qui a le plus grand numérateur est la plus grande.', message: 'Le numérateur seul ne suffit pas, sauf si les dénominateurs sont égaux.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car les deux nombres sont égaux.', message: 'Les deux nombres ne sont pas égaux.' }
      ],
      indice: 'Mets les deux nombres sous la même forme.',
      etapes: et,
      verification: 'Vérification avec des valeurs approchées : ' + m(c.hx + ' ≈ ' + H.arrondi(c.x, 3) + ' et ' + c.hy + ' ≈ ' + H.arrondi(c.y, 3)) + '. ✓',
      rubrique: R.comparer,
      nombres: [c.x, c.y],
      controle: { type: 'vf', a: c.tx, b: c.ty, relation: annonce }
    }, alea);
  }

  /* =====================================================================
   * Objectif : part d'un nombre (fraction d'un nombre)
   * ===================================================================== */

  function questionPart(alea, p) {
    // D1 : fraction unité d'un petit nombre (1/4 de 20) ; ensuite a/b d'un nombre sous la limite
    var a, b, c, essai = 0;
    do {
      var ab = fractionIrreductible(alea, Math.min(p, 3));
      a = p <= 1 ? 1 : (ab[0] > ab[1] ? (ab[0] % ab[1]) || 1 : ab[0]); b = ab[1];
      if (O.pgcd(a, b) !== 1) a = 1;
      c = b * alea.entier(2, Math.max(2, Math.floor(LIMITE[p] / b)));
      essai++;
    } while (c > LIMITE[p] && essai < 100);
    var res = fr(a, b).fois(c);
    var resH = res.estDecimale() ? H.n(res) : H.f(res);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule ' + m(H.fh(a, b)) + ' de ' + m(H.n(fr(c))) + '.</p>',
      consigne: 'Écris un nombre.',
      indice: 'Calcule d\'abord ' + M.formaterFraction(fr(1, b)) + ' de ' + c + ' (diviser par ' + b + '), puis multiplie par ' + a + '.',
      reponse: { type: 'valeur', valeur: res },
      pieges: [
        { valeur: fr(c, b), message: 'Tu as calculé ' + M.formaterFraction(fr(1, b)) + ' de ' + c + ' : il faut encore multiplier par ' + a + '.' },
        { valeur: fr(c * b, a), message: 'Tu as divisé par le numérateur et multiplié par le dénominateur : c\'est l\'inverse.' },
        { valeur: fr(c * a), message: 'Tu as confondu « fraction d\'un nombre » et multiplication par le numérateur : il faut aussi diviser par le dénominateur ' + b + '.' }
      ],
      etapes: O.etapes([
        ['Je calcule ' + m(H.fh(1, b)) + ' de ' + c + ' : je divise par ' + b + '.', m(c + ' : ' + b + ' = ' + H.n(fr(c, b)))],
        ['Je multiplie par ' + a + '.', m(H.n(fr(c, b)) + ' · ' + a + ' = ' + resH)]
      ]),
      verification: 'Autre méthode : ' + m(H.fh(a, b) + ' · ' + c + ' = ' + H.fh(a + NB + '·' + NB + c, b) + ' = ' + resH) + '. ✓',
      rubrique: R.fractionNombre,
      nombres: [fr(a, b), fr(c)],
      controle: { expr: '(' + a + '/' + b + ')*' + c },
      attenduHtml: resH
    });
  }

  var CONTEXTES_PART = [
    { tout: function (n) { return 'Elif a un abonnement de téléphone avec ' + n + ' Go de données par mois.'; }, partie: 'Elif a déjà utilisé', unite: 'Go', q: 'Combien de Go ont déjà été utilisés ?', qReste: 'Combien de Go reste-t-il pour ce mois ?', totaux: [10, 12, 20, 24, 30, 40, 60] },
    { tout: function (n) { return 'La batterie d\'une installation solaire peut stocker ' + n + ' kWh.'; }, partie: 'la batterie est chargée aux', unite: 'kWh', q: 'Combien de kWh contient-elle ?', qReste: 'Combien de kWh manque-t-il pour qu\'elle soit pleine ?', totaux: [8, 10, 12, 15, 16, 20] },
    { tout: function (n, l) { return 'Le trajet à vélo de Boudry à ' + l + ' mesure ' + n + ' km.'; }, partie: 'Luca en a déjà parcouru', unite: 'km', q: 'Combien de kilomètres ont déjà été parcourus ?', qReste: 'Combien de kilomètres reste-t-il à parcourir ?', totaux: [12, 18, 20, 24, 30, 36] },
    { tout: function (n) { return 'Une recette de tresse demande ' + n + ' g de farine.'; }, partie: 'Zoé en a déjà versé', unite: 'g', q: 'Combien de grammes de farine ont déjà été versés ?', qReste: 'Combien de grammes de farine faut-il encore ajouter ?', totaux: [120, 150, 200, 240, 250, 300] }
  ];

  function problemePart(alea, p) {
    var ctx = alea.choix(CONTEXTES_PART);
    var candidats = [];
    var contextes = CONTEXTES_PART.filter(function (c) { return c.totaux.some(function (n) { return n <= LIMITE[p]; }); });
    ctx = alea.choix(contextes);
    ctx.totaux.forEach(function (n) {
      if (n > LIMITE[p]) return;
      [2, 3, 4, 5, 6, 8, 10].forEach(function (b) { if (n % b === 0) candidats.push([n, b]); });
    });
    var cb = alea.choix(candidats);
    var n = cb[0], b = cb[1];
    var a;
    do { a = alea.entier(1, b - 1); } while (O.pgcd(a, b) !== 1);
    var f = fr(a, b);
    var partie = f.fois(n);
    var reste = p >= 3;
    var res = reste ? fr(n).moins(partie) : partie;
    var donneeInutile = p >= 3 ? ' (Ce relevé a été noté le ' + alea.entier(2, 28) + ' du mois.)' : '';
    var autreLieu = alea.choix(['Neuchâtel', 'Yverdon-les-Bains', 'Bienne']);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>' + ctx.tout(n, autreLieu) + ' ' + ctx.partie.charAt(0).toUpperCase() + ctx.partie.slice(1) + ' ' + m(H.f(f)) + '.' + donneeInutile + '</p><p>' + (reste ? ctx.qReste : ctx.q) + '</p>',
      consigne: 'Réponse en ' + ctx.unite + '.',
      suffixe: ctx.unite,
      indice: 'Calcule ' + M.formaterFraction(f) + ' de ' + n + ' (divise par ' + b + ', puis multiplie par ' + a + ')' + (reste ? ', puis soustrais du total.' : '.'),
      reponse: { type: 'valeur', valeur: res, unite: ctx.unite },
      pieges: reste ? [{ valeur: partie, message: 'Tu as calculé la partie déjà utilisée ; on demande ce qui reste.' }, { valeur: fr(n, b), message: 'Tu as seulement divisé par ' + b + '.' }] : [{ valeur: fr(n, b), message: 'Tu as seulement divisé par ' + b + ' : il faut encore multiplier par ' + a + '.' }],
      etapes: O.etapes([
        ['Je calcule ' + m(H.f(f)) + ' de ' + n + '.', m(n + ' : ' + b + ' · ' + a + ' = ' + H.n(partie))]
      ].concat(reste ? [['Je soustrais du total.', m(n + ' – ' + H.n(partie) + ' = ' + H.n(res))]] : [])),
      verification: 'Vérification : la réponse est plus petite que ' + n + ' ' + ctx.unite + ', ce qui est cohérent. ✓',
      rubrique: R.fractionNombre,
      nombres: [f, fr(n)],
      controle: { expr: reste ? n + '-(' + a + '/' + b + ')*' + n : '(' + a + '/' + b + ')*' + n },
      attenduHtml: H.n(res) + ' ' + ctx.unite
    });
  }

  function erreurPart(alea, p) {
    var ab, a, b, essai = 0;
    do {
      ab = fractionIrreductible(alea, 3);
      a = ab[0] > ab[1] ? 1 : ab[0]; b = ab[1];
      if (a === 1) a = Math.min(b - 1, 2);
      if (O.pgcd(a, b) !== 1) a = 1;
      essai++;
    } while (a * b * 2 > LIMITE[p] && essai < 100);
    var k = alea.entier(2, Math.max(2, Math.min(8, Math.floor(LIMITE[p] / (a * b)))));
    var c = a * b * k;
    var nom = prenom(alea);
    var type = alea.choix(['inverse', 'oubli', 'juste']);
    var lignes, cle, res;
    if (type === 'inverse') { lignes = [c + ' : ' + a + ' = ' + (c / a), (c / a) + ' · ' + b + ' = ' + (c / a * b)]; res = fr(c / a * b); cle = 'inverse'; }
    else if (type === 'oubli') { lignes = [c + ' : ' + b + ' = ' + (c / b)]; res = fr(c / b); cle = 'oubli'; if (a === 1) { type = 'juste'; } }
    if (type === 'juste') { lignes = [c + ' : ' + b + ' = ' + (c / b), (c / b) + ' · ' + a + ' = ' + (c / b * a)]; res = fr(c / b * a); cle = 'aucune'; }
    var choix = [
      { h: 'On a divisé par le numérateur et multiplié par le dénominateur.', juste: cle === 'inverse', cle: 'inverse', message: 'Regarde par quel nombre on divise.' },
      { h: 'On a oublié de multiplier par le numérateur.', juste: cle === 'oubli', cle: 'oubli', message: 'Vérifie s\'il manque une étape.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : ' + M.formaterFraction(fr(a, b)) + ' de ' + c + ' = ' + (c / b * a) + '.' },
      { h: 'Il fallait additionner ' + a + ' et ' + b + '.', juste: false, cle: 'x', message: 'Non : une fraction d\'un nombre se calcule avec une division et une multiplication.' }
    ];
    choix.forEach(function (x) { if (x.juste) x.message = ''; });
    return O.erreurEleve({
      enonce: '<p>On demande de calculer ' + m(H.fh(a, b)) + ' de ' + c + '.</p>',
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: m(H.fh(a, b)) + ' de ' + c + ' : on divise par ' + b + ' puis on multiplie par ' + a + '.',
      etapes: O.etapes([['Je divise par le dénominateur ' + b + '.', m(c + ' : ' + b + ' = ' + (c / b))], ['Je multiplie par le numérateur ' + a + '.', m((c / b) + ' · ' + a + ' = ' + (c / b * a))]]),
      rubrique: R.fractionNombre,
      nombres: [fr(a, b), fr(c)],
      controle: { type: 'erreur', correct: '(' + a + '/' + b + ')*' + c, eleve: res.toString(), cle: cle }
    }, alea);
  }

  /* =====================================================================
   * Objectif : opérations avec les nombres décimaux
   * ===================================================================== */

  /**
   * Deux décimaux pour une opération. D1 : + et – à une décimale, produit par un entier ;
   * D2 : deux décimales, produit de deux décimaux ; D3 : division par un entier ;
   * D4 : division par un décimal. Nombres sous la limite de la difficulté.
   */
  function tirerDecimaux(alea, p, op, relatifs) {
    var x, y;
    if (op === '+' || op === '–') {
      var dx = p <= 1 ? 1 : alea.entier(1, 2), dy = p <= 1 ? 1 : alea.entier(1, 2);
      var maxE = [0, 99, 999, 9999, 9999][p];
      x = O.decimal(alea, 1, Math.min(maxE, LIMITE[p] * Math.pow(10, dx)), dx);
      y = O.decimal(alea, 1, Math.min(maxE, LIMITE[p] * Math.pow(10, dy)), dy);
      if (op === '–' && x.compare(y) < 0) { var t = x; x = y; y = t; }
    } else if (op === '·') {
      if (p <= 1) { x = O.decimal(alea, 11, 99, 1); y = fr(alea.entier(2, 9)); }
      else if (p === 2) { x = O.decimal(alea, 11, 99, 1); y = O.decimal(alea, 2, 9, 1); }
      else if (p === 3) { x = O.decimal(alea, 11, 999, 2); y = O.decimal(alea, 2, 9, 1); }
      else { x = O.decimal(alea, 11, 99, alea.entier(1, 2)); y = O.decimal(alea, 2, 99, 2); }
    } else {
      // division : quotient décimal exact
      var q, dv;
      if (p <= 3) { dv = fr(alea.entier(2, 9)); q = O.decimal(alea, 11, p <= 2 ? 99 : 999, p <= 2 ? 1 : 2); }
      else { dv = O.decimal(alea, 2, 9, 1); q = fr(alea.entier(2, 30)); }
      x = q.fois(dv); y = dv;
    }
    if (relatifs) {
      if (alea.suivant() < 0.5) x = x.oppose();
      if (alea.suivant() < 0.5) y = y.oppose();
    }
    return [x, y];
  }

  function estimer(x) {
    var v = Math.abs(x.valeur());
    if (v === 0) return fr(0);
    var e = Math.floor(Math.log10(v));
    var r = Math.round(v / Math.pow(10, e)) * Math.pow(10, e);
    return M.Fraction.depuis(Number(r.toPrecision(2))).fois(x.signe());
  }

  function questionDecimaux(alea, p, ctx) {
    var op = alea.choix(p <= 2 ? ['+', '–', '·'] : ['+', '–', '·', ':']);
    var xy = tirerDecimaux(alea, p, op, ctx && ctx.relatifs && p >= 4);
    var x = xy[0], y = xy[1];
    var expr = X.op(X.n(x, 'decimal'), op, X.n(y, 'decimal'));
    var res = expr.v;
    var ex = estimer(x), ey = estimer(y);
    var est = op === '+' ? ex.plus(ey) : op === '–' ? ex.moins(ey) : op === '·' ? ex.fois(ey) : (ey.estZero() ? null : ex.divise(ey));
    var pieges = [];
    if (op === '+' || op === '–') {
      // décimales mal alignées : on aligne les chiffres à droite
      var dx = O.nbDecimales(x), dy = O.nbDecimales(y);
      if (dx !== dy) {
        var dmax = Math.max(dx, dy);
        var nx = Number(x.fois(Math.pow(10, dx)).num), ny = Number(y.fois(Math.pow(10, dy)).num);
        var faux = fr(op === '+' ? nx + ny : nx - ny, Math.pow(10, dmax));
        pieges.push({ valeur: faux, message: 'Les virgules ne sont pas alignées : on aligne les unités sous les unités, les dixièmes sous les dixièmes…' });
      }
    }
    if (op === '·') {
      var dtot = O.nbDecimales(x) + O.nbDecimales(y);
      pieges.push({ test: function (t, v) { return v && !v.egal(res) && O.pow10 && estPuissance10(v.divise(res)); }, message: 'La virgule est mal placée : le produit a autant de décimales que les deux facteurs ensemble (' + dtot + ').' });
    }
    if (op === ':') {
      pieges.push({ test: function (t, v) { return v && !v.egal(res) && estPuissance10(v.divise(res)); }, message: 'La virgule est mal placée. Astuce : multiplie le dividende et le diviseur par 10 (ou 100) pour avoir un diviseur entier.' });
    }
    var et = [];
    if (est) et.push(['J\'estime d\'abord le résultat.', m(H.n(ex) + ' ' + op + ' ' + H.np(ey) + ' = ' + H.n(est))]);
    if (op === '+' || op === '–') et.push(['Je pose le calcul en alignant les virgules (unités sous unités).', '']);
    if (op === '·') et.push(['Je calcule sans les virgules, puis je place la virgule : le résultat a ' + (O.nbDecimales(x) + O.nbDecimales(y)) + ' décimale(s), comme les deux facteurs ensemble.', m(Number(x.abs().fois(Math.pow(10, O.nbDecimales(x))).num) + ' · ' + Number(y.abs().fois(Math.pow(10, O.nbDecimales(y))).num) + ' = ' + Number(res.abs().fois(Math.pow(10, O.nbDecimales(x) + O.nbDecimales(y))).num))]);
    if (op === ':' && !y.estEntier()) {
      var k = Math.pow(10, O.nbDecimales(y));
      et.push(['Je multiplie le dividende et le diviseur par ' + k + ' pour avoir un diviseur entier (le quotient ne change pas).', m(H.np(x.fois(k)) + ' : ' + H.np(y.fois(k)))]);
    }
    if (x.signe() < 0 || y.signe() < 0) et.push(['Je détermine le signe du résultat (règles des signes).', '']);
    et.push(['Résultat.', m(expr.h + ' = ' + H.n(res))]);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule sans calculatrice :</p><p class="calcul">' + m(expr.h) + '</p>',
      consigne: 'Estime d\'abord le résultat, puis calcule. Écris un nombre décimal.',
      indice: est ? 'Estimation : environ ' + M.formaterNombre(est) + '.' : 'Pose le calcul.',
      reponse: { type: 'valeur', valeur: res },
      pieges: pieges,
      estimation: true,
      etapes: O.etapes(et),
      verification: est ? 'Vérification : le résultat ' + m(H.n(res)) + ' est proche de l\'estimation ' + m(H.n(est)) + '. ✓' : '',
      rubrique: R.decimaux,
      nombres: [x, y],
      controle: { expr: expr.t },
      attenduHtml: H.n(res)
    });
  }

  function estPuissance10(f) {
    if (f.estZero()) return false;
    var a = f.abs();
    for (var k = -6; k <= 6; k++) if (k !== 0 && a.egal(O.pow10(k))) return true;
    return false;
  }

  function erreurDecimaux(alea, p) {
    var nom = prenom(alea);
    var op = alea.choix(['+', '·']);
    var x, y, lignes, res, cle, vraie;
    if (op === '+') {
      x = O.decimal(alea, 11, 99, 1); y = O.decimal(alea, 101, 999, 2);
      vraie = x.plus(y);
      var nx = Number(x.fois(10).num), ny = Number(y.fois(100).num);
      if (alea.suivant() < 0.7) { res = fr(nx + ny, 100); cle = 'align'; }
      else { res = vraie; cle = 'aucune'; }
      lignes = [H.n(x) + ' + ' + H.n(y) + ' = ' + H.n(res)];
    } else {
      x = O.decimal(alea, 11, 99, 1); y = O.decimal(alea, 2, 9, 1);
      vraie = x.fois(y);
      var r = alea.suivant();
      if (r < 0.4) { res = vraie.fois(10); cle = 'virgule'; }
      else if (r < 0.8) { res = vraie.divise(10); cle = 'virgule'; }
      else { res = vraie; cle = 'aucune'; }
      lignes = [H.n(x) + ' · ' + H.n(y) + ' = ' + H.n(res)];
    }
    var choix = [
      { h: 'Les virgules n\'ont pas été alignées.', juste: cle === 'align', cle: 'align', message: 'Regarde l\'alignement des chiffres.' },
      { h: 'La virgule du résultat est mal placée (mauvais nombre de décimales).', juste: cle === 'virgule', cle: 'virgule', message: 'Compte les décimales des facteurs et du résultat.' },
      { h: 'Il n\'y a pas d\'erreur.', juste: cle === 'aucune', cle: 'aucune', message: 'Il y a une erreur : estime le résultat pour la trouver.' },
      { h: 'Il fallait arrondir le résultat à l\'unité.', juste: false, cle: 'x', message: 'Non : on demande le résultat exact.' }
    ];
    choix.forEach(function (c) { if (c.juste) c.message = ''; });
    var est = op === '+' ? estimer(x).plus(estimer(y)) : estimer(x).fois(estimer(y));
    return O.erreurEleve({
      eleve: nom,
      lignes: lignes.map(m),
      choix: choix,
      indice: 'Estime le résultat : environ ' + M.formaterNombre(est) + '.',
      etapes: O.etapes([['J\'estime le résultat.', m('≈ ' + H.n(est))], ['Le calcul exact donne :', m(H.n(x) + ' ' + op + ' ' + H.n(y) + ' = ' + H.n(vraie))]]),
      rubrique: R.decimaux,
      nombres: [x, y],
      controle: { type: 'erreur', correct: '(' + x.toString() + ')' + (op === '+' ? '+' : '*') + '(' + y.toString() + ')', eleve: res.toString(), cle: cle }
    }, alea);
  }

  function problemeMontant(alea, p) {
    var nom = prenom(alea);
    var articles = alea.melanger([
      { nom: 'croissant', pluriel: 'croissants', prix: [1.3, 1.4, 1.5, 1.6, 1.8] },
      { nom: 'petit pain', pluriel: 'petits pains', prix: [0.8, 0.9, 1.1, 1.2] },
      { nom: 'yogourt', pluriel: 'yogourts', prix: [0.75, 0.85, 0.95, 1.05] },
      { nom: 'jus d\'orange', pluriel: 'jus d\'orange', prix: [2.4, 2.8, 3.2, 3.5] },
      { nom: 'cahier', pluriel: 'cahiers', prix: [2.9, 3.5, 4.2, 4.8] }
    ]);
    var a1 = articles[0], a2 = articles[1];
    var q1 = alea.entier(2, p >= 3 ? 6 : 4), q2 = alea.entier(1, 3);
    var p1 = M.Fraction.depuis(alea.choix(a1.prix)), p2 = M.Fraction.depuis(alea.choix(a2.prix));
    // D1 : un seul article (une multiplication) ; D2 : deux articles ; D3-D4 : avec la monnaie rendue
    var seul = p <= 1;
    if (seul) q2 = 0;
    var total = p1.fois(q1).plus(p2.fois(q2));
    var rendu = p >= 3;
    var billet = total.compare(10) < 0 ? 10 : total.compare(20) < 0 ? 20 : 50;
    var res = rendu ? fr(billet).moins(total) : total;
    var inutile = p >= 4 ? ' Le magasin est ouvert de 7 h à 18 h 30.' : '';
    return O.saisie({
      type: 'probleme',
      enonce: '<p>' + nom + ' achète ' + q1 + ' ' + a1.pluriel + ' à ' + H.chf(p1) + ' pièce' + (seul ? '' : ' et ' + q2 + ' ' + (q2 > 1 ? a2.pluriel : a2.nom) + ' à ' + H.chf(p2) + ' pièce') + '.' + inutile + '</p>' +
        (rendu ? '<p>' + nom + ' paie avec un billet de ' + billet + ' francs. Combien d\'argent est rendu ?</p>' : '<p>Quel est le prix total des achats ?</p>'),
      consigne: 'Réponse en francs (par exemple 7.20).',
      suffixe: 'francs',
      indice: seul ? 'Multiplie la quantité par le prix d\'une pièce.' : 'Calcule le prix de chaque sorte d\'article (quantité · prix), puis additionne' + (rendu ? ', puis soustrais du billet.' : '.'),
      reponse: { type: 'montant', valeur: res },
      pieges: rendu ? [{ valeur: total, message: 'Tu as calculé le prix total ; on demande la monnaie rendue.' }, { valeur: fr(billet).moins(p1.plus(p2)), message: 'Tu as oublié de multiplier par les quantités.' }] : seul ? [{ valeur: p1.plus(q1), message: 'Tu as additionné la quantité et le prix : il faut les multiplier.' }] : [{ valeur: p1.plus(p2), message: 'Tu as oublié de multiplier par les quantités.' }],
      estimation: true,
      etapes: O.etapes([
        ['Prix des ' + a1.pluriel + '.', m(q1 + ' · ' + H.chfStyle(p1).replace('CHF' + NB, '') + ' = ' + H.chfStyle(p1.fois(q1)).replace('CHF' + NB, '') + ' francs')],
      ].concat(seul ? [] : [
        ['Prix ' + (q2 > 1 ? 'des ' + a2.pluriel : 'du ' + a2.nom) + '.', m(q2 + ' · ' + H.chfStyle(p2).replace('CHF' + NB, '') + ' = ' + H.chfStyle(p2.fois(q2)).replace('CHF' + NB, '') + ' francs')],
        ['Total.', m(H.chf(total))]
      ]).concat(rendu ? [['Monnaie rendue.', m(billet + '.– – ' + H.chfStyle(total).replace('CHF' + NB, '') + ' = ' + H.chf(res))]] : [])),
      verification: 'Estimation : environ ' + Math.round(total.valeur()) + ' francs de courses. ✓',
      rubrique: R.decimaux,
      nombres: seul ? [p1, fr(q1)] : [p1, p2, fr(q1), fr(q2)],
      controle: { expr: seul ? q1 + '*(' + p1.toString() + ')' : rendu ? billet + '-(' + q1 + '*(' + p1.toString() + ')+' + q2 + '*(' + p2.toString() + '))' : q1 + '*(' + p1.toString() + ')+' + q2 + '*(' + p2.toString() + ')' },
      attenduHtml: H.chf(res)
    });
  }

  function vraiFauxEstimation(alea, p) {
    var x = O.decimal(alea, 11, 99, 1);
    var y = O.decimal(alea, 11, 99, 2);
    var plusPetit = y.compare(1) < 0;
    var op = alea.choix(['·', ':']);
    var res = op === '·' ? x.fois(y) : x.divise(y);
    var annonce = alea.choix(['plus petit', 'plus grand']);
    var vrai = (annonce === 'plus petit') === (res.compare(x) < 0);
    var regle = op === '·'
      ? (plusPetit ? 'multiplier par un nombre plus petit que 1 donne un résultat plus petit que le nombre de départ.' : 'multiplier par un nombre plus grand que 1 donne un résultat plus grand que le nombre de départ.')
      : (plusPetit ? 'diviser par un nombre plus petit que 1 donne un résultat plus grand que le nombre de départ.' : 'diviser par un nombre plus grand que 1 donne un résultat plus petit que le nombre de départ.');
    return O.vraiFaux({
      enonce: '<p>Sans calculer exactement : le résultat de ' + m(H.n(x) + ' ' + op + ' ' + H.n(y)) + ' est ' + annonce + ' que ' + m(H.n(x)) + '.</p>',
      vrai: vrai,
      bonne: regle,
      mauvaises: [
        { h: (vrai ? 'Faux' : 'Vrai') + ', car une ' + (op === '·' ? 'multiplication' : 'division') + ' donne toujours un résultat plus ' + (op === '·' ? 'grand' : 'petit') + '.', message: 'C\'est vrai avec des nombres plus grands que 1, mais pas toujours avec des décimaux : ' + regle },
        { h: (vrai ? 'Faux' : 'Vrai') + ', car ' + M.formaterNombre(y) + ' est un nombre décimal.', message: 'Ce qui compte, c\'est de savoir si ' + M.formaterNombre(y) + ' est plus petit ou plus grand que 1.' },
        { h: (vrai ? 'Vrai' : 'Faux') + ', car on ne peut pas savoir sans calculer.', message: 'On peut le savoir en comparant ' + M.formaterNombre(y) + ' à 1.' }
      ],
      indice: 'Compare ' + M.formaterNombre(y) + ' avec 1.',
      etapes: O.etapes([[M.formaterNombre(y) + (plusPetit ? ' &lt; 1' : ' &gt; 1') + ' : ' + regle, ''], ['Calcul exact (pour vérifier) :', m(H.n(x) + ' ' + op + ' ' + H.n(y) + ' = ' + (res.estDecimale() ? H.n(res) : '≈ ' + H.arrondi(res, 2)))]]),
      rubrique: R.estimation,
      nombres: [x, y],
      controle: { type: 'vf', a: '(' + x.toString() + ')' + (op === '·' ? '*' : ':') + '(' + y.toString() + ')', b: x.toString(), relation: annonce === 'plus petit' ? '<' : '>' }
    }, alea);
  }

  /* =====================================================================
   * Objectif : résoudre des problèmes (données utiles, estimation)
   * ===================================================================== */

  function problemeDonneesUtiles(alea, p) {
    // D1 : une opération (gourde, solaire) ; D2 : + train (deux étapes) ; D3-D4 : + stockage (trois étapes)
    var modele = alea.choix(p <= 1 ? ['gourde', 'solaire'] : p === 2 ? ['gourde', 'solaire', 'train'] : ['solaire', 'train', 'stockage']);
    var enonce, question, res, unite, etapes, expr, nombres, pieges = [];
    if (modele === 'gourde') {
      var cap = alea.choix([fr(3, 4), fr(1, 2), M.Fraction.depuis('0,6'), M.Fraction.depuis('1,5')]);
      var f = alea.choix([fr(1, 3), fr(2, 3), fr(1, 4), fr(3, 4), fr(1, 2)]);
      if (!cap.fois(f).fois(100).estEntier()) f = fr(1, 2);
      var nom = prenom(alea);
      res = cap.fois(f);
      enonce = '<p>' + nom + ' part s\'entraîner au foot pendant ' + alea.choix([75, 90, 105]) + ' minutes avec une gourde de ' + H.n(cap) + ' L. Pendant l\'entraînement, ' + nom + ' boit les ' + m(H.f(f)) + ' de la gourde.</p>';
      question = 'Quelle quantité d\'eau, en litres, a été bue ?';
      unite = 'L';
      expr = '(' + f.toString() + ')*(' + cap.toString() + ')';
      etapes = [['Je repère les données utiles : la contenance (' + H.n(cap) + ' L) et la fraction bue. La durée ne sert à rien ici.', ''], ['Je calcule la fraction de la quantité.', m(H.f(f) + ' · ' + H.n(cap) + ' = ' + H.n(res))]];
      nombres = [cap, f];
      pieges.push({ valeur: cap.moins(res), message: 'Tu as calculé ce qui reste dans la gourde.' });
    } else if (modele === 'solaire') {
      var prod = O.decimal(alea, 12, 48, 1);
      var jours = alea.entier(p <= 1 ? 10 : 12, p <= 1 ? 20 : 28);
      res = prod.fois(jours);
      enonce = '<p>Les panneaux solaires du toit de l\'école produisent en moyenne ' + H.n(prod) + ' kWh par jour ensoleillé. En juillet (31 jours), il y a eu ' + jours + ' jours ensoleillés.</p>';
      question = 'Combien de kWh ont été produits pendant les jours ensoleillés de juillet ?';
      unite = 'kWh';
      expr = '(' + prod.toString() + ')*' + jours;
      etapes = [['Données utiles : la production par jour ensoleillé et le nombre de jours ensoleillés (pas les 31 jours du mois).', ''], ['Estimation.', m(H.n(estimer(prod)) + ' · ' + H.n(estimer(fr(jours))) + ' ≈ ' + H.n(estimer(prod).fois(estimer(fr(jours)))))], ['Calcul.', m(H.n(prod) + ' · ' + jours + ' = ' + H.n(res))]];
      nombres = [prod, fr(jours)];
      pieges.push({ valeur: prod.fois(31), message: 'Tu as utilisé les 31 jours du mois : seuls les jours ensoleillés comptent.' });
    } else if (modele === 'train') {
      var prix = M.Fraction.depuis(alea.choix(['5.60', '6.80', '7.40', '8.20', '11.40', '12.60']));
      var n = alea.entier(3, 6);
      var billet = prix.fois(n).compare(50) < 0 ? 50 : 100;
      res = fr(billet).moins(prix.fois(n));
      enonce = '<p>Pour une sortie, ' + n + ' amis prennent le train de ' + lieu(alea) + ' à ' + alea.choix(['Neuchâtel', 'Lausanne', 'Fribourg']) + '. Le trajet dure ' + alea.entier(25, 75) + ' minutes et un billet coûte ' + H.chf(prix) + '. Ils paient tous les billets ensemble avec un billet de ' + billet + ' francs.</p>';
      question = 'Combien d\'argent leur rend-on ?';
      unite = 'francs';
      expr = billet + '-(' + prix.toString() + ')*' + n;
      etapes = [['Données utiles : le prix d\'un billet, le nombre d\'amis et le billet donné. La durée ne sert à rien.', ''], ['Prix total.', m(n + ' · ' + H.chfStyle(prix).replace('CHF' + NB, '') + ' = ' + H.chf(prix.fois(n)))], ['Monnaie rendue.', m(billet + '.– – ' + H.chfStyle(prix.fois(n)).replace('CHF' + NB, '') + ' = ' + H.chf(res))]];
      nombres = [prix, fr(n)];
      pieges.push({ valeur: prix.fois(n), message: 'Tu as calculé le prix total ; on demande la monnaie rendue.' });
      return O.saisie({
        type: 'probleme', enonce: enonce + '<p>' + question + '</p>', consigne: 'Réponse en francs.', suffixe: 'francs',
        indice: 'Quelles données sont utiles ? Calcule le prix total, puis la différence.',
        reponse: { type: 'montant', valeur: res }, pieges: pieges, estimation: true, etapes: O.etapes(etapes),
        verification: 'Vérification : ' + H.chf(res) + ' + ' + H.chf(prix.fois(n)) + ' = ' + billet + ' francs. ✓',
        rubrique: R.decimaux, nombres: nombres, controle: { expr: expr }, attenduHtml: H.chf(res)
      });
    } else {
      var cap2 = alea.choix(p <= 3 ? [64, 128] : [64, 128, 256]);
      var photos = alea.choix([fr(1, 4), fr(3, 8), fr(1, 8), fr(1, 2)]);
      var appli = alea.choix([fr(1, 8), fr(1, 16), fr(1, 4)]);
      if (photos.plus(appli).compare(1) >= 0) appli = fr(1, 16);
      res = fr(cap2).fois(fr(1).moins(photos).moins(appli));
      enonce = '<p>Le téléphone ' + de(prenom(alea)) + ' a une mémoire de ' + cap2 + ' Go. Les photos occupent ' + m(H.f(photos)) + ' de la mémoire et les applications ' + m(H.f(appli)) + '. Le téléphone a été acheté il y a ' + alea.entier(2, 4) + ' ans.</p>';
      question = 'Combien de Go restent libres ?';
      unite = 'Go';
      expr = cap2 + '*(1-(' + photos.toString() + ')-(' + appli.toString() + '))';
      etapes = [['Je calcule la place occupée par les photos et par les applications.', m(H.f(photos) + ' de ' + cap2 + ' = ' + H.n(photos.fois(cap2)) + ' Go ; ' + H.f(appli) + ' de ' + cap2 + ' = ' + H.n(appli.fois(cap2)) + ' Go')], ['Je soustrais de la mémoire totale.', m(cap2 + ' – ' + H.n(photos.fois(cap2)) + ' – ' + H.n(appli.fois(cap2)) + ' = ' + H.n(res))]];
      nombres = [fr(cap2), photos, appli];
      pieges.push({ valeur: fr(cap2).fois(photos.plus(appli)), message: 'Tu as calculé la place occupée ; on demande la place libre.' });
    }
    return O.saisie({
      type: 'probleme',
      enonce: enonce + '<p>' + question + '</p>',
      consigne: 'Réponse en ' + unite + '.',
      suffixe: unite,
      indice: 'Souligne les données utiles. Une des données ne sert à rien.',
      reponse: { type: 'valeur', valeur: res, unite: unite },
      pieges: pieges,
      estimation: true,
      etapes: O.etapes(etapes),
      verification: 'Vérification : le résultat a un ordre de grandeur raisonnable pour la situation. ✓',
      rubrique: R.decimaux,
      nombres: nombres,
      controle: { expr: expr },
      attenduHtml: H.n(res) + ' ' + unite
    });
  }

  function questionOrdreGrandeur(alea, p) {
    var x = O.decimal(alea, 101, 999, 1), y = O.decimal(alea, 11, 99, 1);
    var op = alea.choix(['·', '+']);
    var res = op === '·' ? x.fois(y) : x.plus(y);
    var est = op === '·' ? estimer(x).fois(estimer(y)) : estimer(x).plus(estimer(y));
    var vraiOrdre = Math.pow(10, Math.floor(Math.log10(res.valeur())));
    var propositions = [res];
    propositions.push(res.fois(10));
    propositions.push(res.divise(10));
    propositions.push(res.divise(100));
    var choix = propositions.map(function (v, i) {
      return { h: m(H.n(v)), juste: i === 0, cle: i === 0 ? 'bon' : 'x', message: i === 0 ? '' : 'Ce résultat est ' + (v.compare(res) > 0 ? 'beaucoup trop grand' : 'beaucoup trop petit') + ' : estime avec des nombres arrondis.' };
    });
    return O.choix({
      type: 'probleme',
      enonce: '<p>Sans poser le calcul, lequel de ces résultats est le bon pour ' + m(H.n(x) + ' ' + op + ' ' + H.n(y)) + ' ?</p>',
      consigne: 'Estime avec des nombres arrondis.',
      choix: choix,
      indice: 'Arrondis : ' + M.formaterNombre(x) + ' ≈ ' + M.formaterNombre(estimer(x)) + ' et ' + M.formaterNombre(y) + ' ≈ ' + M.formaterNombre(estimer(y)) + '.',
      etapes: O.etapes([['J\'arrondis les nombres et j\'estime.', m(H.n(estimer(x)) + ' ' + op + ' ' + H.n(estimer(y)) + ' = ' + H.n(est))], ['Le seul résultat proche de l\'estimation est ' + m(H.n(res)) + '.', '']]),
      rubrique: R.estimation,
      nombres: [x, y],
      controle: { type: 'estimation', expr: '(' + x.toString() + ')' + (op === '·' ? '*' : '+') + '(' + y.toString() + ')', valeur: res.toString() },
      ordreGrandeur: vraiOrdre
    }, alea);
  }

  /* =====================================================================
   * Objectif (9e, niveau 2) : pourcentages
   * ===================================================================== */

  function questionFractionPourcent(alea, p, opts) {
    // D1 : 50 %, 25 %, 75 %, 10 % ; D2 : 35 %, 60 %… ; D3-D4 : 44 %, 37,5 %…
    var pool = [[1, 2], [1, 4], [3, 4], [1, 10]];
    if (p >= 2) pool = pool.concat([[7, 20], [3, 5], [2, 5], [9, 20], [6, 25], [3, 10], [7, 10], [1, 5], [4, 5]]);
    if (p >= 3) pool = pool.concat([[11, 25], [13, 50], [3, 8], [17, 20]]);
    if (p >= 4) pool = pool.concat([[1, 8], [5, 8], [7, 8], [3, 40]]);
    if (opts && opts.periodique && p >= 3) pool = pool.concat([[1, 3], [2, 3]]);
    var c = alea.choix(pool);
    var f = fr(c[0], c[1]);
    var pc = f.fois(100);
    var sens = alea.suivant() < 0.55 ? 'versPourcent' : 'versFraction';
    if (!pc.estDecimale()) sens = 'versPourcent';
    if (sens === 'versPourcent') {
      return O.saisie({
        type: 'directe',
        enonce: '<p>Écris ' + m(H.f(f)) + ' sous forme de pourcentage.</p>',
        consigne: 'Écris le nombre de pour cent (le signe % est déjà écrit).',
        suffixe: '%',
        indice: 'Un pourcentage est une fraction sur 100 : amplifie pour obtenir le dénominateur 100, ou calcule ' + c[0] + ' : ' + c[1] + ' · 100.',
        reponse: { type: 'valeur', valeur: pc, unite: '%' },
        pieges: [{ valeur: f, message: 'Tu as donné l\'écriture décimale : multiplie encore par 100 pour obtenir le pourcentage.' }],
        etapes: O.etapes(100 % c[1] === 0 ? [['J\'amplifie pour obtenir le dénominateur 100.', m(H.f(f) + ' = ' + H.fh(c[0] + NB + '·' + NB + (100 / c[1]), c[1] + NB + '·' + NB + (100 / c[1])) + ' = ' + H.fh(c[0] * 100 / c[1], 100) + ' = ' + (c[0] * 100 / c[1]) + ' %')]]
          : [['Je calcule l\'écriture décimale, puis je multiplie par 100.', m(H.f(f) + ' = ' + H.n(f) + ' = ' + H.n(pc) + ' %')]]),
        verification: 'Vérification : ' + M.formaterNombre(pc) + ' % = ' + M.formaterNombre(pc) + '/100 = ' + M.formaterFraction(f) + '. ✓',
        rubrique: R.pourcentages,
        nombres: [f],
        controle: { expr: '(' + c[0] + '/' + c[1] + ')*100' },
        attenduHtml: H.n(pc) + ' %'
      });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.n(pc) + ' %') + ' sous forme de fraction.</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong>.',
      indice: M.formaterNombre(pc) + ' % = ' + M.formaterNombre(pc) + '/100, puis simplifie.',
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: [{ valeur: pc, message: 'Un pourcentage, c\'est « sur 100 » : ' + M.formaterNombre(pc) + ' % = ' + M.formaterNombre(pc) + '/100.' }],
      etapes: O.etapes([['J\'écris le pourcentage sur 100.', m(H.n(pc) + ' % = ' + H.fh(H.n(pc), 100))]].concat(pc.estEntier() ? etapesSimplifier(Number(pc.num), 100) : [['Je simplifie.', m(H.f(f))]])),
      rubrique: R.pourcentages,
      nombres: [f],
      controle: { expr: '(' + pc.toString() + ')/100' },
      attenduHtml: H.f(f)
    });
  }

  function questionPourcentDe(alea, p) {
    // D1 : 10, 25, 50, 75 % d'un petit nombre ; D2 : 12 % de 250, 35 % de 80… ; ensuite nombres ⩽ la limite
    var pc, total, res, essai = 0;
    var maxTotal = [0, 20, 250, 250, 300][p];
    do {
      pc = alea.choix(p <= 1 ? [10, 25, 50, 75] : [5, 12, 15, 20, 30, 35, 40, 60, 80]);
      total = alea.choix([4, 8, 10, 12, 16, 20, 40, 50, 60, 80, 100, 120, 150, 200, 240, 250, 300].filter(function (t) { return t <= maxTotal; }));
      res = fr(pc * total, 100);
      essai++;
    } while (!res.estEntier() && essai < 200);
    var ctx = alea.choix([
      { t: function (n) { return 'Un club de natation de ' + lieu(alea) + ' compte ' + n + ' membres.'; }, q: function (x) { return x + ' % d\'entre eux ont moins de 16 ans. Combien de membres ont moins de 16 ans ?'; }, u: 'membres' },
      { t: function (n) { return 'Une installation solaire a produit ' + n + ' kWh en une semaine.'; }, q: function (x) { return 'Le chauffe-eau en a utilisé ' + x + ' %. Combien de kWh le chauffe-eau a-t-il utilisés ?'; }, u: 'kWh' },
      { t: function (n) { return 'Un disque dur a une capacité de ' + n + ' Go.'; }, q: function (x) { return x + ' % de la capacité est occupée par des vidéos. Combien de Go occupent les vidéos ?'; }, u: 'Go' }
    ]);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>' + ctx.t(total) + ' ' + ctx.q(pc) + '</p>',
      consigne: 'Réponse en ' + ctx.u + '.',
      suffixe: ctx.u,
      indice: pc + ' % de ' + total + ' = ' + pc + '/100 de ' + total + '.',
      reponse: { type: 'valeur', valeur: res, unite: ctx.u },
      pieges: [{ valeur: fr(total).moins(res), message: 'Tu as calculé l\'autre partie (' + (100 - pc) + ' %).' }, { valeur: fr(total * 100, pc), message: 'Tu as divisé par le pourcentage au lieu de calculer ' + pc + '/100 du total.' }],
      etapes: O.etapes([['Je traduis le pourcentage en fraction.', m(pc + ' % = ' + H.fh(pc, 100))], ['Je calcule la fraction du nombre.', m(H.fh(pc, 100) + ' · ' + total + ' = ' + H.n(res))]]),
      verification: 'Vérification : 10 % de ' + total + ' = ' + M.formaterNombre(fr(total, 10)) + ', donc ' + pc + ' % ≈ ' + M.formaterNombre(res) + '. ✓',
      rubrique: R.pourcentages,
      nombres: [fr(pc), fr(total)],
      controle: { expr: pc + '/100*' + total },
      attenduHtml: H.n(res) + ' ' + ctx.u
    });
  }

  function questionComparerPourcent(alea, p) {
    var base = alea.choix([[3, 5], [2, 5], [3, 4], [7, 10], [1, 4], [4, 5], [7, 20], [9, 20]]);
    var f = fr(base[0], base[1]);
    var v = f.valeur();
    var dec = new F(Math.round(v * 100) + alea.choix([-4, -3, 3, 4]), 100);
    var pc = new F(Math.round(v * 100) + alea.choix([-2, -1, 1, 2]), 1);
    if (pc.egal(dec.fois(100))) pc = pc.plus(5);
    var nombres = [
      { v: f, h: H.f(f), t: f.toString() },
      { v: dec, h: H.n(dec), t: dec.toString() },
      { v: pc.divise(100), h: H.n(pc) + ' %', t: pc.toString() + '/100' }
    ];
    var max = nombres.reduce(function (a, b) { return b.v.compare(a.v) > 0 ? b : a; });
    var choix = nombres.map(function (n) {
      return { h: m(n.h), juste: n === max, cle: n.t, message: n === max ? '' : 'Écris les trois nombres sous la même forme (par exemple en pourcentage) avant de comparer.' };
    });
    return O.choix({
      type: 'directe',
      enonce: '<p>Quel est le plus grand de ces trois nombres ?</p><p class="calcul">' + m(nombres.map(function (n) { return n.h; }).join(NB + '; ')) + '</p>',
      consigne: 'Choisis le plus grand.',
      choix: choix,
      indice: 'Transforme chaque nombre en pourcentage.',
      etapes: O.etapes([['J\'écris les trois nombres en pourcentage.', m(nombres.map(function (n) { return n.h + ' = ' + H.n(n.v.fois(100)) + ' %'; }).join(NB + '; '))], ['Le plus grand est ' + m(max.h) + '.', '']]),
      rubrique: R.pourcentages,
      nombres: [f, dec, pc],
      controle: { type: 'maximum', exprs: nombres.map(function (n) { return n.t; }), cle: max.t }
    }, alea);
  }

  /** 9e N2, D3 : comparer « x % d'un nombre » et « une fraction d'un autre nombre ». */
  function questionComparerQuantites(alea, p) {
    var pc, A, f, B, va, vb, essai = 0;
    var maxN = LIMITE[p];
    do {
      pc = alea.choix([10, 15, 20, 25, 30, 40, 60, 75]);
      A = alea.choix([40, 60, 80, 100, 120, 150, 160, 180, 200, 240, 250, 300].filter(function (t) { return t <= maxN; }));
      f = alea.choix([fr(1, 4), fr(1, 3), fr(2, 5), fr(3, 5), fr(3, 4), fr(2, 3), fr(1, 5)]);
      B = alea.choix([30, 45, 60, 75, 90, 100, 120, 150, 180, 200, 240, 300].filter(function (t) { return t <= maxN; }));
      va = fr(pc * A, 100); vb = f.fois(B);
      essai++;
    } while ((!va.estEntier() || !vb.estEntier() || Math.abs(va.valeur() - vb.valeur()) > 40) && essai < 300);
    var s = va.compare(vb);
    var bon = s < 0 ? '<' : s > 0 ? '>' : '=';
    var ha = pc + ' % de ' + H.n(fr(A)), hb = H.f(f) + ' de ' + H.n(fr(B));
    var signes = { '<': '&lt;', '>': '&gt;', '=': '=' };
    var choix = ['<', '=', '>'].map(function (sym) {
      return { h: m(ha + ' ' + signes[sym] + ' ' + hb), juste: sym === bon, cle: sym,
        message: sym === bon ? '' : 'Calcule les deux quantités : ' + pc + ' % de ' + A + ' = ' + M.formaterNombre(va) + ' et ' + M.formaterFraction(f) + ' de ' + B + ' = ' + M.formaterNombre(vb) + '. Ne compare pas seulement ' + pc + ' % et ' + M.formaterFraction(f) + ' : les deux nombres de départ sont différents.' };
    });
    var items = ['pc' + pc + 'de' + A, 'f' + f.toString() + 'de' + B].sort();
    return O.choix({
      type: 'directe',
      enonce: '<p>Compare ces deux quantités :</p><p class="calcul">' + m(ha + ' et ' + hb) + '</p>',
      consigne: 'Choisis le bon signe.',
      choix: choix,
      ordreFixe: true,
      indice: 'Calcule chaque quantité séparément, puis compare les résultats.',
      etapes: O.etapes([
        ['Je calcule le pourcentage.', m(H.fh(pc, 100) + ' · ' + A + ' = ' + H.n(va))],
        ['Je calcule la fraction du nombre.', m(H.f(f) + ' · ' + B + ' = ' + H.n(vb))],
        ['Je compare.', m(H.n(va) + ' ' + signes[bon] + ' ' + H.n(vb))]
      ]),
      rubrique: R.pourcentages,
      nombres: [fr(pc), fr(A), f, fr(B)],
      controle: { type: 'compare', a: pc + '/100*' + A, b: '(' + f.toString() + ')*' + B, cle: bon },
      signature: 'pc-vs-frac:' + items.join('|')
    }, alea);
  }

  /** 9e N2, D4 : deux remises successives (on ne peut pas additionner les pourcentages). */
  function problemeDeuxRemises(alea, p) {
    var prix, r1, r2, final, essai = 0;
    do {
      prix = alea.choix([80, 120, 150, 160, 200, 240, 250, 280, 300]);
      r1 = alea.choix([10, 20, 25, 50]); r2 = alea.choix([10, 20, 25]);
      final = fr(prix).fois(fr(100 - r1, 100)).fois(fr(100 - r2, 100));
      essai++;
    } while (!final.fois(20).estEntier() && essai < 100);
    var apres1 = fr(prix).fois(fr(100 - r1, 100));
    var objet = alea.choix(['une veste de ski', 'un sac de sport', 'une paire de chaussures de randonnée', 'un casque de vélo']);
    var faux = fr(prix).fois(fr(100 - r1 - r2, 100));
    return O.saisie({
      type: 'probleme',
      enonce: '<p>' + objet.charAt(0).toUpperCase() + objet.slice(1) + ' coûte ' + H.chf(fr(prix)) + '. Pendant les soldes, le magasin fait une remise de ' + r1 + ' %. Le dernier jour, il fait encore une remise de ' + r2 + ' % sur le prix déjà réduit.</p><p>Quel est le prix final ?</p>',
      consigne: 'Réponse en francs.',
      suffixe: 'francs',
      indice: 'Calcule d\'abord le prix après la première remise. La deuxième remise se calcule sur ce nouveau prix.',
      reponse: { type: 'montant', valeur: final },
      pieges: faux.egal(final) ? [] : [{ valeur: faux, message: 'Tu as additionné les deux remises (' + (r1 + r2) + ' %). La deuxième remise porte sur le prix déjà réduit, pas sur le prix de départ.' }],
      estimation: true,
      etapes: O.etapes([
        ['Première remise : il reste ' + (100 - r1) + ' % du prix.', m(H.fh(100 - r1, 100) + ' · ' + prix + ' = ' + H.n(apres1))],
        ['Deuxième remise, sur le prix réduit : il reste ' + (100 - r2) + ' %.', m(H.fh(100 - r2, 100) + ' · ' + H.n(apres1) + ' = ' + H.n(final))]
      ]),
      verification: 'Vérification : deux remises de ' + r1 + ' % et ' + r2 + ' % font moins qu\'une remise de ' + (r1 + r2) + ' %, donc le prix final est plus grand que ' + H.chf(faux) + '. ✓',
      rubrique: R.pourcentages,
      nombres: [fr(prix), fr(r1), fr(r2)],
      controle: { expr: prix + '*(1-' + r1 + '/100)*(1-' + r2 + '/100)' },
      attenduHtml: H.chf(final)
    });
  }

  /* =====================================================================
   * Catalogue des objectifs de 9e
   * ===================================================================== */


  /* =====================================================================
   * PALIER D5 (niveau 2 seulement) — objectifs de 9e
   * ---------------------------------------------------------------------
   * Types d'exercices repris de la colonne « Activités pour le niveau 2 » du fichier
   * d'objectifs NO 9.3 (nombres jamais recopiés) :
   *   F202, F204 (tableaux d'écritures), L190 (décimal -> fraction irréductible),
   *   F170 (« est-ce bien 3/4 ? »), L166, L179 (comparer), L228, L232 (part d'une part),
   *   F220, F221, F223 (additions à trou, écritures mêlées), L203 (problèmes).
   * ===================================================================== */

  var FOIS = NB + '·' + NB;
  function signeH(negatif, h) { return (negatif ? '–' + NB : '') + h; }

  /** Vocabulaire et ensembles : écriture « déguisée » à simplifier avant de répondre (F204). */
  function questionEnsembleDeguise(alea) {
    var type = alea.choix(['N', 'Z', 'Q', 'Q']);
    var num, den, negatif = false, simple;
    if (type === 'Q') {
      var b0 = alea.choix([3, 4, 5, 6, 7, 8]), a0 = premierAvec(alea, b0, 2 * b0), k = alea.choix([6, 7, 8, 9, 11, 12, 13]);
      num = a0 * k; den = b0 * k; negatif = alea.suivant() < 0.3;
    } else {
      den = alea.choix([7, 11, 13, 17, 19, 23]); num = den * alea.entier(2, 20); negatif = type === 'Z';
    }
    var x = fr(negatif ? -num : num, den);
    var xh = m(signeH(negatif, H.fh(num, den)));
    simple = m(H.f(x));
    var noms = { N: 'ℕ (nombres naturels)', Z: 'ℤ (nombres entiers relatifs)', Q: 'ℚ (nombres rationnels)' };
    var messages = {
      N: x.estEntier() ? 'Regarde le signe : un nombre naturel est positif ou nul.' : 'Simplifie d\'abord : ' + xh + ' = ' + simple + ', ce n\'est pas un nombre entier.',
      Z: x.estEntier() ? 'Il existe un ensemble plus petit : ' + xh + ' = ' + simple + ' est un entier positif.' : 'Simplifie d\'abord : ' + xh + ' = ' + simple + ', ce n\'est pas un nombre entier.',
      Q: 'Il existe un ensemble plus petit : simplifie, ' + xh + ' = ' + simple + ' est un nombre entier.'
    };
    return O.choix({
      type: 'directe',
      enonce: '<p>Quel est le <strong>plus petit</strong> ensemble de nombres qui contient ' + xh + ' ?</p>',
      consigne: 'Simplifie d\'abord l\'écriture. Rappel : ℕ ⊂ ℤ ⊂ ℚ.',
      indice: 'Une écriture fractionnaire peut cacher un nombre entier : divise le numérateur par le dénominateur.',
      choix: ['N', 'Z', 'Q'].map(function (e) { return { h: noms[e], juste: e === type, cle: e, message: e === type ? '' : messages[e] }; }),
      ordreFixe: true,
      etapes: O.etapes([['Je simplifie l\'écriture.', xh + ' = ' + simple],
        [type === 'N' ? 'C\'est un entier positif : il appartient à ℕ.' : type === 'Z' ? 'C\'est un entier négatif : il appartient à ℤ, mais pas à ℕ.' : 'Ce n\'est pas un entier : il appartient à ℚ, mais pas à ℤ.', '']]),
      rubrique: R.ensembles,
      nombres: [fr(num), fr(den)],
      controle: { type: 'ensemble', x: (negatif ? '-' : '') + num + '/' + den, liste: ['N', 'Z', 'Q'], cle: type }
    }, alea);
  }

  /** Écritures usuelles : multiples de 1/4, 1/5 et 1/8, dans les deux sens (F202). */
  function questionUsuelle5(alea) {
    var f = alea.choix([[3, 8], [5, 8], [7, 8], [9, 8], [11, 8], [13, 8], [5, 4], [7, 4], [9, 4], [6, 5], [7, 5], [9, 5], [11, 5]]);
    var x = fr(f[0], f[1]), unite = fr(1, f[1]);
    var et = [['Je pars de l\'écriture usuelle ' + m(H.f(unite) + ' = ' + H.n(unite)) + '.', ''],
      ['Je multiplie par ' + f[0] + '.', m(H.f(x) + ' = ' + f[0] + FOIS + H.n(unite) + ' = ' + H.n(x))]];
    if (alea.suivant() < 0.5) {
      return O.saisie({
        type: 'directe',
        enonce: '<p>Écris ' + m(H.f(x)) + ' en écriture décimale.</p>',
        consigne: 'Réponse en écriture décimale (avec la virgule), sans poser la division.',
        indice: 'Combien vaut ' + m(H.f(unite)) + ' en écriture décimale ?',
        reponse: { type: 'valeur', valeur: x, forme: 'decimal' },
        pieges: [{ valeur: fr(f[0] * 10 + f[1], 10), message: 'On n\'écrit pas le numérateur et le dénominateur de part et d\'autre de la virgule : ' + m(H.f(x)) + ' vaut ' + f[0] + ' fois ' + m(H.n(unite)) + '.' }],
        etapes: O.etapes(et), rubrique: R.ecrituresDecimales, nombres: [x], controle: { expr: f[0] + '/' + f[1], conversion: true }
      });
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.n(x)) + ' sous forme de fraction.</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong>.',
      indice: 'Combien de fois ' + m(H.n(unite)) + ' y a-t-il dans ' + m(H.n(x)) + ' ?',
      reponse: { type: 'valeur', valeur: x, forme: 'irreductible' },
      pieges: [],
      etapes: O.etapes([['Je reconnais un multiple de ' + m(H.n(unite) + ' = ' + H.f(unite)) + '.', m(H.n(x) + ' = ' + f[0] + FOIS + H.n(unite))],
        ['J\'écris la fraction.', m(H.n(x) + ' = ' + H.f(x))]]),
      rubrique: R.ecrituresDecimales, nombres: [x], controle: { expr: f[0] + '/' + f[1], conversion: true }, attenduHtml: H.f(x)
    });
  }

  /** Décimal à trois décimales, parfois négatif -> fraction irréductible (L190). */
  function questionDecVersFraction5(alea) {
    var den = alea.choix([8, 25, 40, 125, 200, 250]), num;
    do { num = alea.entier(den + 1, Math.min(9 * den, 2400)); } while (O.pgcd(num, den) !== 1);
    if (alea.suivant() < 0.4) num = premierAvec(alea, den, den - 1);
    var negatif = alea.suivant() < 0.35;
    var x = fr(negatif ? -num : num, den);
    var dec = O.nbDecimales(x), p10 = Math.pow(10, dec), brut = Math.round(num * p10 / den), g = O.pgcd(brut, p10);
    return O.saisie({
      type: 'directe',
      enonce: '<p>Écris ' + m(H.n(x)) + ' sous forme de fraction.</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong>' + (negatif ? ' (avec son signe)' : '') + '.',
      indice: 'Le nombre a ' + dec + ' décimale' + (dec > 1 ? 's' : '') + ' : écris-le d\'abord avec le dénominateur ' + M.formaterNombre(p10) + ', puis simplifie.',
      reponse: { type: 'valeur', valeur: x, forme: 'irreductible' },
      pieges: negatif ? [{ valeur: x.oppose(), message: 'N\'oublie pas le signe : le nombre de départ est négatif.' }] : [],
      etapes: O.etapes([['J\'écris le nombre avec le dénominateur ' + M.formaterNombre(p10) + '.', m(H.n(x) + ' = ' + signeH(negatif, H.fh(M.formaterNombre(brut), M.formaterNombre(p10))))],
        ['Je simplifie par ' + g + ' (pgdc).', m(signeH(negatif, H.fh(M.formaterNombre(brut), M.formaterNombre(p10))) + ' = ' + H.f(x))]]),
      rubrique: R.ecrituresDecimales, nombres: [x], controle: { expr: (negatif ? '-' : '') + num + '/' + den, conversion: true }, attenduHtml: H.f(x)
    });
  }

  /** Représenter : « est-ce bien 3/4 ? » avec une figure partagée autrement (F170). */
  function vraiFauxPartColoriee(alea) {
    var f = alea.choix([[3, 4], [2, 3], [3, 5], [5, 6], [1, 4], [3, 8], [2, 5]]);
    var k = alea.entier(2, f[1] <= 4 ? 4 : 3), n = f[1] * k, vrai = alea.suivant() < 0.5;
    var c = f[0] * k + (vrai ? 0 : alea.choix([-1, 1]));
    var qui = prenom(alea), g = O.pgcd(c, n);
    var fh = m(H.fh(f[0], f[1])), ch = m(H.fh(c, n)), simple = m(H.f(fr(c, n)));
    return O.vraiFaux({
      enonce: '<p>' + qui + ' affirme : « J\'ai colorié les ' + fh + ' de cette figure. »</p>',
      visuel: { type: alea.choix(['barre', 'disque']), parts: n, colorees: c },
      vrai: vrai,
      bonne: vrai ? c + ' parts sur ' + n + ' sont coloriées, et ' + ch + ' = ' + fh + ' (on simplifie par ' + k + ').'
        : c + ' parts sur ' + n + ' sont coloriées : ' + ch + (g > 1 ? ' = ' + simple : '') + ', ce qui n\'est pas égal à ' + fh + ' (il faudrait ' + (f[0] * k) + ' parts).',
      mauvaises: vrai ? [
        { h: 'Faux, car la figure n\'est pas partagée en ' + f[1] + ' parts.', message: 'Le nombre de parts peut être différent : ' + ch + ' et ' + fh + ' sont des fractions équivalentes.' },
        { h: 'Faux, car il y a ' + c + ' parts coloriées, et non ' + f[0] + '.', message: 'Compare les fractions, pas seulement les numérateurs : ' + ch + ' = ' + fh + '.' },
        { h: 'Vrai, car une grande partie de la figure est coloriée.', message: 'La conclusion est juste, mais pas la raison : une fraction est une valeur exacte, il faut compter les parts.' }
      ] : [
        { h: 'Vrai, car ' + ch + ' se simplifie en ' + fh + '.', message: 'Vérifie : ' + fh + ' de ' + n + ' parts, c\'est ' + (f[0] * k) + ' parts, pas ' + c + '.' },
        { h: 'Vrai, car c\'est à peu près ' + fh + ' de la figure.', message: 'Une fraction est une valeur exacte : « à peu près » ne suffit pas.' },
        { h: 'Faux, car la figure n\'est pas partagée en ' + f[1] + ' parts.', message: 'La conclusion est juste, mais pas la raison : avec ' + n + ' parts, on peut très bien colorier ' + fh + ' de la figure (' + (f[0] * k) + ' parts).' }
      ],
      indice: 'Compte les parts coloriées et le nombre total de parts, puis compare la fraction obtenue avec ' + fh + '.',
      etapes: O.etapes([['Je compte : ' + c + ' parts coloriées sur ' + n + '.', ch],
        ['Je cherche combien de parts représentent ' + fh + ' de la figure.', m(H.fh(f[0], f[1]) + ' = ' + H.fh(f[0] + FOIS + k, f[1] + FOIS + k) + ' = ' + H.fh(f[0] * k, n))]]),
      rubrique: R.amplifier,
      nombres: [fr(c), fr(n)],
      controle: { type: 'vf', a: c + '/' + n, relation: '=', b: f[0] + '/' + f[1] }
    }, alea);
  }

  /** Représenter une quantité par une fraction, en deux étapes (L166). */
  function problemeQuantiteReste(alea) {
    var ctx = alea.choix([
      { groupe: 'jeunes de l\'école de musique', a: 'jouent d\'un instrument à cordes', b: 'd\'un instrument à vent', q: 'jouent d\'un autre instrument' },
      { groupe: 'élèves inscrits au camp de ski', a: 'font du ski alpin', b: 'du snowboard', q: 'font du ski de fond' },
      { groupe: 'membres du club de sport', a: 'pratiquent l\'unihockey', b: 'le volley', q: 'pratiquent un autre sport' }
    ]);
    var N, a, b, r;
    do { N = alea.choix([24, 30, 36, 40, 45, 48, 60, 72]); a = alea.entier(5, N / 2); b = alea.entier(4, N / 3); r = N - a - b; } while (r < 3 || O.pgcd(r, N) === 1 || O.pgcd(r, N) === r);
    var f = fr(r, N);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Sur les ' + N + ' ' + ctx.groupe + ' de ' + lieu(alea) + ', ' + a + ' ' + ctx.a + ' et ' + b + ' ' + ctx.b + ' ; personne ne fait les deux.</p><p>Quelle fraction du groupe représentent ceux qui ' + ctx.q + ' ?</p>',
      consigne: 'Donne la <strong>fraction irréductible</strong>.',
      indice: 'Calcule d\'abord combien de personnes ' + ctx.q + '.',
      reponse: { type: 'valeur', valeur: f, forme: 'irreductible' },
      pieges: [{ valeur: fr(a + b, N), message: 'Tu as donné la fraction de ceux qui sont déjà cités : on demande les autres.' }].filter(function (pg) { return !pg.valeur.egal(f); }),
      etapes: O.etapes([['Je calcule le nombre de personnes restantes.', m(N + ' – ' + a + ' – ' + b + ' = ' + r)],
        ['J\'écris la fraction du groupe.', m(H.fh(r, N))],
        ['Je simplifie par ' + O.pgcd(r, N) + '.', m(H.fh(r, N) + ' = ' + H.f(f))]]),
      rubrique: R.vocabulaireFractions, nombres: [fr(N), fr(a), fr(b)], controle: { expr: '(' + N + '-' + a + '-' + b + ')/' + N }, attenduHtml: H.f(f)
    });
  }

  /** Comparer : ranger quatre nombres d'écritures différentes (L179, F202). */
  function questionOrdonnerMixte(alea) {
    var liste, vals, ok;
    do {
      var b1 = alea.choix([3, 6, 7, 9, 11, 12]), a1 = premierAvec(alea, b1, b1 - 1);
      var b2 = alea.choix([3, 4, 6, 7, 8]), a2 = b2 + premierAvec(alea, b2, b2 - 1);
      var d1 = fr(alea.entier(5, 95), 100), d2 = fr(alea.entier(11, 19), 10);
      var b3 = alea.choix([4, 5, 8]), a3 = premierAvec(alea, b3, b3 - 1), k3 = alea.choix([3, 4, 6]);
      liste = [
        { v: fr(a1, b1), t: a1 + '/' + b1, h: H.fh(a1, b1) },
        { v: fr(a2, b2), t: a2 + '/' + b2, h: H.fh(a2, b2) },
        { v: d1, t: M.formaterNombre(d1), h: H.n(d1), e: d1.toString() },
        { v: alea.suivant() < 0.5 ? d2 : fr(a3, b3), t: '', h: '' }
      ];
      if (liste[3].v === d2) { liste[3].t = M.formaterNombre(d2); liste[3].h = H.n(d2); liste[3].e = d2.toString(); }
      else { liste[3].t = (a3 * k3) + '/' + (b3 * k3); liste[3].h = H.fh(a3 * k3, b3 * k3); }
      vals = liste.map(function (x) { return x.v.valeur(); }).sort(function (u, w) { return u - w; });
      ok = vals.every(function (x, i) { return i === 0 || x - vals[i - 1] > 0.015; });
    } while (!ok);
    liste = alea.melanger(liste);
    var croissant = alea.suivant() < 0.5;
    var tri = liste.slice().sort(function (u, w) { return croissant ? u.v.compare(w.v) : w.v.compare(u.v); });
    return O.saisie({
      type: 'directe',
      enonce: '<p>Range ces nombres dans l\'ordre <strong>' + (croissant ? 'croissant' : 'décroissant') + '</strong> :</p><p class="calcul">' + m(H.liste(liste.map(function (x) { return x.h; }))) + '</p>',
      consigne: 'Recopie les quatre nombres séparés par des points-virgules « ; », du plus ' + (croissant ? 'petit au plus grand' : 'grand au plus petit') + '.',
      indice: 'Écris chaque nombre en écriture décimale (au centième près) pour les comparer.',
      reponse: { type: 'liste', valeurs: tri.map(function (x) { return x.v; }), ordonne: true, croissant: croissant, textes: tri.map(function (x) { return x.t; }), textesHtml: tri.map(function (x) { return x.h; }) },
      pieges: [],
      etapes: O.etapes([['J\'écris chaque nombre en écriture décimale (valeur approchée au millième).', m(H.liste(liste.map(function (x) { return x.h + ' ≈ ' + H.arrondi(x.v, 3); })))],
        ['Je range les nombres.', m(tri.map(function (x) { return x.h; }).join(croissant ? ' &lt; ' : ' &gt; '))]]),
      rubrique: R.comparer,
      nombres: liste.map(function (x) { return x.v; }),
      controle: { type: 'ordre', exprs: liste.map(function (x) { return x.e || x.t; }), croissant: croissant }
    });
  }

  /** Part d'une part, ou retrouver le tout à partir d'une part (L228, L232). */
  function problemePartDePart(alea) {
    var a, b, c, e, k, N, res, ou = lieu(alea);
    if (alea.suivant() < 0.5) {
      do { b = alea.choix([3, 4, 5, 6, 7]); a = alea.entier(2, b - 1); c = alea.choix([2, 3, 4, 5]); e = c > 2 && alea.suivant() < 0.5 ? c - 1 : 1; k = alea.entier(2, 12); N = b * c * k; } while (O.pgcd(a, b) !== 1 || N > 500 || N < 60);
      res = N * a / b * e / c;
      var premier = N * a / b;
      return O.saisie({
        type: 'probleme',
        enonce: '<p>La société de gymnastique de ' + ou + ' compte ' + N + ' membres. Les ' + m(H.fh(a, b)) + ' des membres ont moins de 16 ans et, parmi eux, ' + (e === 1 ? 'le' : 'les') + ' ' + m(H.fh(e, c)) + ' participe' + (e === 1 ? '' : 'nt') + ' au camp d\'été.</p><p>Combien de membres participent au camp d\'été ?</p>',
        consigne: 'Écris un nombre entier.',
        indice: 'Calcule d\'abord le nombre de membres de moins de 16 ans.',
        reponse: { type: 'valeur', valeur: fr(res), forme: 'entier' },
        pieges: [{ valeur: fr(premier), message: 'C\'est le nombre de membres de moins de 16 ans : il faut encore en prendre ' + m(H.fh(e, c)) + '.' },
          { valeur: fr(N * e, c), message: 'Tu as pris ' + m(H.fh(e, c)) + ' de tous les membres : cette fraction ne porte que sur les moins de 16 ans.' }].filter(function (pg) { return !pg.valeur.egal(fr(res)); }),
        etapes: O.etapes([['Je calcule le nombre de membres de moins de 16 ans.', m(H.fh(a, b) + ' de ' + N + ' = ' + N + ' : ' + b + FOIS + a + ' = ' + premier)],
          ['Je prends ' + m(H.fh(e, c)) + ' de ce nombre.', m(H.fh(e, c) + ' de ' + premier + ' = ' + premier + ' : ' + c + (e > 1 ? FOIS + e : '') + ' = ' + res)]]),
        verification: 'Vérification : ' + m(H.fh(a, b) + FOIS + H.fh(e, c) + ' = ' + H.f(fr(a * e, b * c))) + ' des membres, et ' + m(H.f(fr(a * e, b * c)) + ' de ' + N + ' = ' + res) + '. ✓',
        rubrique: R.fractionNombre, nombres: [fr(N), fr(a, b), fr(e, c)], controle: { expr: N + '*(' + a + '/' + b + ')*(' + e + '/' + c + ')' }
      });
    }
    do { b = alea.choix([3, 4, 5, 7, 8, 9]); a = alea.entier(2, b - 1); k = alea.entier(6, 60); } while (O.pgcd(a, b) !== 1 || b * k > 500 || b * k < 60);
    var n = a * k, T = b * k;
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Lors d\'un concert à ' + ou + ', ' + n + ' places sont occupées : cela représente les ' + m(H.fh(a, b)) + ' des places de la salle.</p><p>Combien de places sont encore libres ?</p>',
      consigne: 'Écris un nombre entier.',
      indice: 'Si ' + a + ' parts valent ' + n + ' places, combien vaut une part ? Combien y a-t-il de parts en tout ?',
      reponse: { type: 'valeur', valeur: fr(T - n), forme: 'entier' },
      pieges: [{ valeur: fr(T), message: 'C\'est le nombre total de places : on demande les places libres.' },
        { valeur: fr(n * a, b), message: 'Tu as pris ' + m(H.fh(a, b)) + ' de ' + n + ' : or ' + n + ' places représentent déjà les ' + m(H.fh(a, b)) + ' de la salle.' }].filter(function (pg) { return !pg.valeur.egal(fr(T - n)); }),
      etapes: O.etapes([['Une part vaut ' + n + ' : ' + a + '.', m(n + ' : ' + a + ' = ' + k)],
        ['La salle compte ' + b + ' parts.', m(b + FOIS + k + ' = ' + T)],
        ['Je soustrais les places occupées.', m(T + ' – ' + n + ' = ' + (T - n))]]),
      verification: 'Vérification : ' + m(H.fh(a, b) + ' de ' + T + ' = ' + n) + '. ✓',
      rubrique: R.fractionNombre, nombres: [fr(n), fr(a, b)], controle: { expr: n + ':(' + a + '/' + b + ')-' + n }
    });
  }

  /** Décimaux : deux opérations à enchaîner en respectant les priorités. */
  function questionDecimaux5(alea) {
    var a, b, c, res, html, expr, et;
    function d1(min, max) { return fr(alea.entier(min, max), 10); }
    function t(x) { return '(' + x.toString() + ')'; }
    if (alea.suivant() < 0.5) {
      var moins = alea.suivant() < 0.5;
      do { b = d1(12, 95); c = d1(11, 45); a = d1(25, 400); res = moins ? a.moins(b.fois(c)) : a.plus(b.fois(c)); } while (res.signe() <= 0 || b.estEntier() || c.estEntier() || res.abs().compare(300) > 0);
      html = H.n(a) + (moins ? ' – ' : ' + ') + H.n(b) + FOIS + H.n(c);
      expr = t(a) + (moins ? '-' : '+') + t(b) + '*' + t(c);
      et = [['La multiplication est prioritaire.', m(H.n(b) + FOIS + H.n(c) + ' = ' + H.n(b.fois(c)))],
        ['J\'effectue ensuite ' + (moins ? 'la soustraction' : 'l\'addition') + '.', m(H.n(a) + (moins ? ' – ' : ' + ') + H.n(b.fois(c)) + ' = ' + H.n(res))]];
    } else {
      c = alea.choix([fr(1, 4), fr(1, 2), fr(1, 5), fr(5, 2), fr(3, 2), fr(1, 20), fr(2, 5)]);
      var somme;
      do { res = alea.suivant() < 0.5 ? fr(alea.entier(4, 60)) : d1(15, 195); somme = res.fois(c); a = d1(3, 120); b = somme.moins(a); } while (b.compare(fr(3, 10)) < 0 || O.nbDecimales(somme) > 2 || O.nbDecimales(b) > 2 || a.egal(b));
      html = '(' + H.n(a) + ' + ' + H.n(b) + ') : ' + H.n(c);
      expr = '(' + t(a) + '+' + t(b) + '):' + t(c);
      et = [['Je calcule d\'abord la parenthèse.', m(H.n(a) + ' + ' + H.n(b) + ' = ' + H.n(somme))],
        ['Je divise par ' + m(H.n(c)) + (c.compare(1) < 0 ? ' : le résultat est plus grand que ' + m(H.n(somme)) + '.' : '.'), m(H.n(somme) + ' : ' + H.n(c) + ' = ' + H.n(res))]];
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>Calcule sans calculatrice :</p><p class="calcul">' + m(html) + '</p>',
      consigne: 'Respecte les priorités des opérations. Écris un nombre décimal.',
      indice: 'Quelle opération faut-il effectuer en premier ?',
      reponse: { type: 'valeur', valeur: res, forme: 'decimal' },
      estimation: true,
      pieges: [],
      etapes: O.etapes(et),
      rubrique: R.priorites, nombres: [a, b, c], controle: { expr: expr }
    });
  }

  /** Additions et soustractions de fractions : à trou, écritures mêlées, fractions à simplifier d'abord (F220, F221, F223). */
  function questionAddSous5(alea) {
    var DENS = [2, 3, 4, 5, 6, 8, 10, 12];
    var type = alea.choix(['trou', 'mixte', 'simplifier']), f1, f2, res, html, expr, et, indice, b, d;
    function fracAlea(maxNum) { var den = alea.choix(DENS); return fr(premierAvec(alea, den, maxNum || den + 3), den); }
    if (type === 'trou') {
      var somme;
      do { f1 = fracAlea(); res = fracAlea(); somme = f1.plus(res); } while (O.den(f1) === O.den(res) || O.den(somme) > 60);
      html = H.f(f1) + ' + … = ' + H.f(somme);
      expr = somme.toString() + '-' + f1.toString();
      indice = 'Le nombre cherché est la différence entre le résultat et le premier terme.';
      et = [['Je cherche le terme manquant par une soustraction.', m('… = ' + H.f(somme) + ' – ' + H.f(f1))],
        ['Je mets les deux fractions au même dénominateur, je soustrais, puis je simplifie.', m(H.f(somme) + ' – ' + H.f(f1) + ' = ' + H.f(res))]];
    } else if (type === 'mixte') {
      var dec, moins;
      do { dec = alea.choix([fr(1, 2), fr(1, 4), fr(3, 4), fr(3, 2), fr(5, 4), fr(1, 5), fr(2, 5), fr(6, 5), fr(13, 10), fr(7, 10)]); d = alea.choix([3, 6, 8, 12]); f2 = fr(premierAvec(alea, d, d - 1), d); moins = alea.suivant() < 0.6; res = moins ? dec.moins(f2) : dec.plus(f2); } while (res.signe() <= 0);
      f1 = dec;
      html = H.n(dec) + (moins ? ' – ' : ' + ') + H.f(f2);
      expr = dec.toString() + (moins ? '-' : '+') + f2.toString();
      indice = 'Écris d\'abord ' + m(H.n(dec)) + ' sous forme de fraction.';
      et = [['J\'écris le nombre décimal sous forme de fraction.', m(H.n(dec) + ' = ' + H.f(dec))],
        ['Je mets au même dénominateur, je calcule, puis je simplifie.', m(H.f(dec) + (moins ? ' – ' : ' + ') + H.f(f2) + ' = ' + H.f(res))]];
    } else {
      var k1, k2, a1, a2, moins2;
      do {
        b = alea.choix([2, 3, 4, 5, 6]); d = alea.choix([2, 3, 4, 5, 6]); a1 = premierAvec(alea, b, b + 2); a2 = premierAvec(alea, d, d - 1);
        k1 = alea.choix([4, 6, 7, 9, 11, 13]); k2 = alea.choix([3, 5, 8, 12]); moins2 = alea.suivant() < 0.5;
        f1 = fr(a1, b); f2 = fr(a2, d); res = moins2 ? f1.moins(f2) : f1.plus(f2);
      } while (b === d || res.signe() <= 0 || a1 * k1 > 100 || b * k1 > 100);
      html = H.fh(a1 * k1, b * k1) + (moins2 ? ' – ' : ' + ') + H.fh(a2 * k2, d * k2);
      expr = (a1 * k1) + '/' + (b * k1) + (moins2 ? '-' : '+') + (a2 * k2) + '/' + (d * k2);
      indice = 'Simplifie chaque fraction avant de chercher un dénominateur commun.';
      et = [['Je simplifie d\'abord chaque fraction.', m(H.fh(a1 * k1, b * k1) + ' = ' + H.f(f1)) + ' et ' + m(H.fh(a2 * k2, d * k2) + ' = ' + H.f(f2))],
        ['Je mets au même dénominateur, je calcule, puis je simplifie.', m(H.f(f1) + (moins2 ? ' – ' : ' + ') + H.f(f2) + ' = ' + H.f(res))]];
    }
    return O.saisie({
      type: 'directe',
      enonce: '<p>' + (type === 'trou' ? 'Complète' : 'Calcule') + ' :</p><p class="calcul">' + m(html) + '</p>',
      consigne: (type === 'trou' ? 'Écris le nombre qui manque' : 'Donne le résultat') + ' sous forme de <strong>fraction irréductible</strong> (ou d\'un entier).',
      indice: indice,
      reponse: { type: 'valeur', valeur: res, forme: 'irreductible' },
      pieges: [],
      etapes: O.etapes(et),
      rubrique: R.addFractions, nombres: [f1, f2 || res], controle: { expr: expr }, attenduHtml: H.f(res)
    });
  }

  /** Problème à deux fractions et un reste (L203, L228). */
  function problemeDeuxFractions(alea) {
    var paires = [[[1, 2], [1, 3]], [[2, 5], [1, 4]], [[1, 3], [2, 5]], [[3, 8], [1, 4]], [[1, 2], [3, 10]], [[2, 5], [1, 3]], [[1, 4], [1, 6]], [[3, 10], [1, 5]]];
    var pr = alea.choix(paires), f1 = fr(pr[0][0], pr[0][1]), f2 = fr(pr[1][0], pr[1][1]);
    var base = O.ppmc(pr[0][1], pr[1][1]), N;
    N = base * alea.entier(Math.ceil(120 / base), Math.floor(480 / base));
    var reste = fr(1).moins(f1).moins(f2), res = reste.fois(N);
    return O.saisie({
      type: 'probleme',
      enonce: '<p>Une classe de ' + lieu(alea) + ' dispose de ' + H.chf(fr(N)) + ' pour sa course d\'école. Elle dépense ' + m(H.f(f1)) + ' de cette somme pour le transport et ' + m(H.f(f2)) + ' pour les repas. Le reste sert à payer les entrées.</p><p>Quelle somme reste-t-il pour les entrées ?</p>',
      consigne: 'Réponse en francs.',
      suffixe: 'francs',
      indice: 'Cherche d\'abord quelle fraction de la somme reste pour les entrées.',
      reponse: { type: 'montant', valeur: res },
      pieges: [{ valeur: f1.plus(f2).fois(N), message: 'C\'est la somme dépensée pour le transport et les repas : on demande ce qui reste.' }].filter(function (pg) { return !pg.valeur.egal(res); }),
      etapes: O.etapes([['J\'additionne les deux fractions dépensées.', m(H.f(f1) + ' + ' + H.f(f2) + ' = ' + H.f(f1.plus(f2)))],
        ['Je calcule la fraction qui reste.', m('1 – ' + H.f(f1.plus(f2)) + ' = ' + H.f(reste))],
        ['Je prends cette fraction de la somme.', m(H.f(reste) + ' de ' + N + ' = ' + H.n(res)) + ' francs']]),
      verification: 'Vérification : transport ' + H.chf(f1.fois(N)) + ', repas ' + H.chf(f2.fois(N)) + ', entrées ' + H.chf(res) + ' ; le total fait bien ' + H.chf(fr(N)) + '. ✓',
      rubrique: R.fractionNombre, nombres: [fr(N), f1, f2], controle: { expr: N + '*(1-' + f1.toString() + '-' + f2.toString() + ')' }
    });
  }

  // « Simplifier » (calibrage validé) : nombres jusqu'à 50 dès D1, expressions à plusieurs facteurs dès D3.
  var BORNES_SIMPLIFIER = { nombre: [50, 100, 200, 300, 500], den: [50, 100, 200, 300, 500], operations: [1, 3, 6, 7, 7], etapes: [1, 2, 3, 3, 3] };

  var objectifs = [
    {
      id: 'A9-vocabulaire', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Vocabulaire des fractions et ensembles ℕ, ℤ, ℚ',
      modeles: [
        { type: 'directe', palierMax: 3, gen: function (a, p, c) { return questionNumDen(a, p); } },
        { type: 'directe', palierMax: 4, gen: function (a) { return questionVocabulaire(a); } },
        { type: 'directe', gen: function (a, p, c) { return questionEnsemble(a, p, c, ['N', 'Z', 'Q'], poolEnsemblesNZQ(a, p)); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxEnsemble(a, p, ['N', 'Z']); } },
        { type: 'directe', palierMin: 5, d5: true, gen: function (a) { return questionEnsembleDeguise(a); } }
      ]
    },
    {
      id: 'A9-usuelles', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Écritures décimales de 1/2, 1/3, 1/4, 1/5, 1/8, 1/10, 1/100, 1/1000',
      modeles: [
        { type: 'directe', palierMax: 4, gen: function (a, p) { return questionUsuelle(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionUsuelle(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxUsuelle(a, p); } },
        { type: 'directe', palierMin: 5, d5: true, gen: function (a) { return questionUsuelle5(a); } }
      ]
    },
    {
      id: 'A9-simplifier', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3', bornesD: BORNES_SIMPLIFIER,
      titre: 'Simplifier, amplifier, fraction irréductible',
      modeles: [
        { type: 'directe', d5: true, gen: function (a, p) { return questionSimplifier5(a, p); } },
        { type: 'directe', palierMax: 4, gen: function (a, p) { return questionAmplifier(a, p); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurSimplifier(a, p); } },
        { type: 'vraifaux', palierMin: 2, gen: function (a, p) { return vraiFauxIrreductible(a, p); } }
      ]
    },
    {
      id: 'A9-conversions', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Passer de l\'écriture décimale à la fraction et inversement',
      modeles: [
        { type: 'directe', palierMax: 4, gen: function (a, p) { return questionDecVersFraction(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionFractionVersDec(a, p); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurConversion(a, p); } },
        { type: 'directe', palierMin: 5, d5: true, gen: function (a) { return questionDecVersFraction5(a); } }
      ]
    },
    {
      id: 'A9-representer', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Représenter une fraction par un dessin, une quantité par une fraction',
      modeles: [
        { type: 'visuel', palierMax: 4, gen: function (a, p) { return questionColorier(a, p); } },
        { type: 'visuel', gen: function (a, p) { return questionLireFraction(a, p); } },
        { type: 'probleme', gen: function (a, p) { return problemeQuantiteFraction(a, p); } },
        { type: 'vraifaux', palierMin: 5, d5: true, gen: function (a) { return vraiFauxPartColoriee(a); } },
        { type: 'probleme', palierMin: 5, d5: true, gen: function (a) { return problemeQuantiteReste(a); } }
      ]
    },
    {
      id: 'A9-comparer', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Comparer deux nombres (fractions ou nombres décimaux)',
      modeles: [
        { type: 'directe', gen: function (a, p, c) { return questionComparer(a, p, c); } },
        { type: 'directe', palierMax: 4, gen: function (a, p, c) { return questionComparerDecimaux(a, p, c); } },
        { type: 'vraifaux', gen: function (a, p, c) { return vraiFauxComparer(a, p, c); } },
        { type: 'directe', palierMin: 5, d5: true, gen: function (a) { return questionOrdonnerMixte(a); } }
      ]
    },
    {
      id: 'A9-part', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Calculer la part d\'un nombre (fraction d\'un nombre)',
      modeles: [
        { type: 'directe', palierMax: 4, gen: function (a, p) { return questionPart(a, p); } },
        { type: 'probleme', gen: function (a, p) { return problemePart(a, p); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurPart(a, p); } },
        { type: 'probleme', palierMin: 5, d5: true, gen: function (a) { return problemePartDePart(a); } }
      ]
    },
    {
      id: 'A9-decimaux', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Additionner, soustraire, multiplier et diviser des nombres décimaux',
      modeles: [
        { type: 'directe', palierMax: 4, gen: function (a, p, c) { return questionDecimaux(a, p, c); } },
        { type: 'directe', gen: function (a, p, c) { return questionDecimaux(a, p, c); } },
        { type: 'erreur', palierMin: 2, gen: function (a, p) { return erreurDecimaux(a, p); } },
        { type: 'probleme', gen: function (a, p) { return problemeMontant(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxEstimation(a, p); } },
        { type: 'directe', palierMin: 5, d5: true, gen: function (a) { return questionDecimaux5(a); } }
      ]
    },
    {
      id: 'A9-addsous', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Additionner et soustraire des fractions',
      modeles: [
        { type: 'directe', palierMax: 4, gen: function (a, p) { return questionAddSous(a, p); } },
        { type: 'directe', gen: function (a, p) { return questionAddSous(a, p); } },
        { type: 'erreur', gen: function (a, p) { return erreurAddition(a, p); } },
        { type: 'vraifaux', gen: function (a, p) { return vraiFauxAddition(a, p); } },
        { type: 'probleme', gen: function (a, p) { return problemeAddition(a, p); } },
        { type: 'directe', palierMin: 5, d5: true, gen: function (a) { return questionAddSous5(a); } }
      ]
    },
    {
      id: 'A9-problemes', module: 'A', annee: 9, niveaux: [1, 2], theme: 'NO 9.3',
      titre: 'Résoudre des problèmes (données utiles, estimation)',
      modeles: [
        { type: 'probleme', palierMax: 4, gen: function (a, p) { return problemeDonneesUtiles(a, p); } },
        { type: 'probleme', gen: function (a, p) { return problemeDonneesUtiles(a, p); } },
        { type: 'probleme', palierMin: 2, gen: function (a, p) { return questionOrdreGrandeur(a, p); } },
        { type: 'probleme', palierMin: 5, d5: true, gen: function (a) { return problemeDeuxFractions(a); } },
        { type: 'probleme', palierMin: 5, d5: true, gen: function (a) { return problemePartDePart(a); } }
      ]
    },
    {
      id: 'A9-pourcentages', module: 'A', annee: 9, niveaux: [2], theme: 'NO 9.3',
      titre: 'Pourcentages : notion, fraction ↔ pourcentage, comparer',
      // Un pourcentage s'écrit avec un nombre jusqu'à 100 (50 %, 75 %) dès D1 ;
      // « 12 % de 250 » est un exercice de difficulté 2 : on autorise 250 dès D2.
      bornesD: { nombre: [100, 250, 250, 300] },
      modeles: [
        { type: 'directe', gen: function (a, p) { return questionFractionPourcent(a, p); } },
        { type: 'probleme', gen: function (a, p) { return questionPourcentDe(a, p); } },
        { type: 'directe', palierMin: 3, gen: function (a, p) { return questionComparerPourcent(a, p); } },
        { type: 'directe', palierMin: 3, gen: function (a, p) { return questionComparerQuantites(a, p); } },
        { type: 'probleme', palierMin: 4, gen: function (a, p) { return problemeDeuxRemises(a, p); } }
      ]
    }
  ];

  return {
    objectifs: objectifs,
    // réutilisés par les autres fichiers
    questionAddSous: questionAddSous,
    erreurAddition: erreurAddition,
    corrigerSomme: corrigerSomme,
    etapesSimplifier: etapesSimplifier,
    etapesDivision: etapesDivision,
    questionEnsemble: questionEnsemble,
    plusPetitEnsemble: plusPetitEnsemble,
    poolEnsemblesNZQ: poolEnsemblesNZQ,
    questionComparer: questionComparer,
    questionComparerDecimaux: questionComparerDecimaux,
    vraiFauxComparer: vraiFauxComparer,
    questionDecimaux: questionDecimaux,
    questionFractionPourcent: questionFractionPourcent,
    questionPourcentDe: questionPourcentDe,
    questionPart: questionPart,
    fractionIrreductible: fractionIrreductible,
    estimer: estimer,
    verifApprochee: verifApprochee,
    questionSimplifier: questionSimplifier,
    questionSimplifier5: questionSimplifier5,
    questionProduitASimplifier: questionProduitASimplifier,
    questionSommeASimplifier: questionSommeASimplifier,
    vraiFauxSauvage: vraiFauxSauvage,
    BORNES_SIMPLIFIER: BORNES_SIMPLIFIER,
    problemePartDePart: problemePartDePart,
    problemeDeuxFractions: problemeDeuxFractions,
    questionAmplifier: questionAmplifier,
    erreurSimplifier: erreurSimplifier,
    vraiFauxIrreductible: vraiFauxIrreductible,
    questionFractionVersDec: questionFractionVersDec,
    questionDecVersFraction: questionDecVersFraction,
    vraiFauxAddition: vraiFauxAddition,
    problemeAddition: problemeAddition,
    questionComparerPourcent: questionComparerPourcent,
    premierAvec: premierAvec,
    de: de,
    LIMITE: LIMITE,
    denominateurs: denominateurs
  };
});
