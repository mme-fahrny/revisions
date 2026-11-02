/*
 * algebre/js/module-b.js — Module B : équations (10e, 11e)
 * ---------------------------------------------------------
 * Logique pure. Navigateur : objet global « AlgebreModuleB ». Node : require.
 * Règles d'équivalence numérotées comme dans l'aide-mémoire :
 *   (1) développer, réduire ou factoriser chacun des membres ;
 *   (2) ajouter ou soustraire un même nombre, monôme ou polynôme aux deux membres ;
 *   (3) multiplier ou diviser les deux membres par un même nombre non nul.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'));
  else racine.AlgebreModuleB = fabrique(racine.AlgebreOutils);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O) {
  'use strict';

  var Maths = O.Maths, P = O.P, F = O.F, R = O.RUBRIQUES;
  var tx = O.tx, hx = O.hx, hm = O.hm, hn = O.hn, tn = O.tn, fr = O.fr, val = O.val, heq = O.heq;

  function etape(n, texte, calcul) { return { titre: 'ÉTAPE ' + n, texte: texte, calcul: calcul || '' }; }
  function Q(q) { return O.finaliser(q); }
  function op(t) { return ' <span class="operation">| ' + O.echapper(t) + '</span>'; }
  function ppcm(a, b) { return a / O.pgcd(a, b) * b; }

  var REGLES = {
    1: 'Règle (1) : développer, réduire ou factoriser un membre',
    2: 'Règle (2) : ajouter ou soustraire un même nombre (ou monôme) aux deux membres',
    3: 'Règle (3) : multiplier ou diviser les deux membres par un même nombre non nul'
  };

  /* =====================================================================
   * Équations du premier degré
   * ===================================================================== */

  /** Coefficients de l'équation réduite a x + b = c x + d. */
  function lineaire(g, d, lettre) {
    lettre = lettre || 'x';
    var l = {}; l[lettre] = 1;
    var PG = P.depuis(g), PD = P.depuis(d);
    return { a: P.coef(PG, l), b: P.coef(PG, {}), c: P.coef(PD, l), d: P.coef(PD, {}), PG: PG, PD: PD };
  }
  /** Solution : { type: 'unique', valeur } | { type: 'aucune' } | { type: 'tous' }. */
  function resoudreLineaire(g, d, lettre) {
    var e = lineaire(g, d, lettre);
    var A = e.a.moins(e.c), B = e.d.moins(e.b);
    if (A.estZero()) return B.estZero() ? { type: 'tous' } : { type: 'aucune' };
    return { type: 'unique', valeur: B.divise(A) };
  }

  /** Texte « ax + b » à partir de coefficients. */
  function srcLin(a, b, lettre) {
    var l = {}; l[lettre || 'x'] = 1;
    return P.src(P.plus(P.monome(a, l), P.constante(b)));
  }
  function termeTexte(c, lettre) {
    return tx(P.srcMonome({ c: val(c), l: lettre ? (function () { var o = {}; o[lettre] = 1; return o; })() : {} }));
  }

  /** Équation aléatoire selon le palier. Renvoie { g, d, sol: Fraction|null, special }. */
  function equationAleatoire(alea, p, options) {
    options = options || {};
    var s = val(p <= 1 ? alea.entier(1, 10) : alea.entier(-6, 10));
    var forme, g, d;
    function nz(max) { return alea.entierNonNul(-max, max); }
    var specialPossible = p >= 4 && !options.uniqueSeulement;
    if (specialPossible && alea.suivant() < 0.15) {
      var k = alea.entier(2, 5), m = nz(6), b0 = nz(9);
      var tous = alea.suivant() < 0.5;
      var dd = k * m + b0 + (tous ? 0 : nz(5));
      g = k + '(x' + (m < 0 ? m : '+' + m) + ')' + (b0 < 0 ? b0 : '+' + b0);
      d = srcLin(k, dd);
      return { g: g, d: d, sol: null, special: tous ? 'tous' : 'aucune' };
    }
    if (p <= 1) {
      forme = alea.choix(['x+b=c', 'ax=c', 'ax+b=c', 'ax-b=c']);
      var a = alea.entier(2, 6), b = alea.entier(1, 15);
      if (forme === 'x+b=c') { g = 'x+' + b; d = String(s.plus(b)); }
      else if (forme === 'ax=c') { g = a + 'x'; d = String(s.fois(a)); }
      else if (forme === 'ax+b=c') { g = a + 'x+' + b; d = String(s.fois(a).plus(b)); }
      else { g = a + 'x-' + b; d = String(s.fois(a).moins(b)); }
      return { g: g, d: d, sol: s };
    }
    // membres de la forme gauche(x) = c x + d, d ajusté pour obtenir la solution s
    var fractionnaire = p >= 4 && alea.suivant() < 0.4;
    var c = alea.entier(-5, 6);
    var gauche;
    if (p === 2) {
      var a2 = alea.choix([2, 3, 4, 5, 6, 7, 8, 9, -2, -3]);
      gauche = alea.suivant() < 0.7 ? srcLin(a2, nz(12)) : nz(12) + '-' + Math.abs(a2) + 'x';
    } else if (p === 3) {
      var k3 = alea.entier(2, 6), m3 = nz(7);
      gauche = alea.choix([
        k3 + '(x' + (m3 < 0 ? m3 : '+' + m3) + ')',
        k3 + '(' + srcLin(alea.entier(1, 3), m3) + ')' + (nz(9) > 0 ? '+' : '-') + alea.entier(1, 9),
        alea.entier(2, 15) + '-(' + srcLin(1, m3) + ')',
        '-' + k3 + '(' + srcLin(1, m3) + ')+' + alea.entier(1, 9) + 'x'
      ]);
    } else if (p === 4) {
      var k4 = alea.entier(2, 5), j4 = alea.entier(2, 5);
      gauche = k4 + '(' + srcLin(alea.entier(1, 4), nz(6)) + ')-' + j4 + '(' + srcLin(alea.entier(1, 3), nz(6)) + ')';
    } else {
      var den1 = alea.choix([2, 3, 4, 5]), den2 = alea.choix([2, 3, 4, 6]);
      if (den1 === den2) den2 = den1 === 2 ? 3 : 2;
      var num1 = srcLin(alea.entier(1, 5), nz(7)), num2 = srcLin(alea.entierNonNul(-3, 4), nz(7));
      g = '(' + num1 + ')/' + den1;
      d = '(' + num2 + ')/' + den2;
      var r5 = resoudreLineaire(g, d);
      if (r5.type !== 'unique') return equationAleatoire(alea, p, options);
      return { g: g, d: d, sol: r5.valeur };
    }
    var PG = P.depuis(gauche);
    var aG = P.coef(PG, { x: 1 });
    if (aG.egal(c)) c = c + 1;
    var dConst;
    if (fractionnaire) {
      dConst = val(nz(15));
      d = srcLin(c, dConst);
      var r = resoudreLineaire(gauche, d);
      if (r.type !== 'unique') return equationAleatoire(alea, p, options);
      return { g: gauche, d: d, sol: r.valeur };
    }
    // d = G(s) – c s
    dConst = P.valeur(PG, { x: s }).moins(s.fois(c));
    d = srcLin(c, dConst);
    if (alea.suivant() < 0.25 && c !== 0) { var t = g; g = d; d = gauche; return { g: g, d: d, sol: s }; }
    return { g: gauche, d: d, sol: s };
  }

  /** Étapes de résolution (savoir-faire de l'aide-mémoire). */
  function etapesLineaire(g, d, lettre) {
    lettre = lettre || 'x';
    var st = [], n = 1;
    var lx = {}; lx[lettre] = 1;
    var PG = P.depuis(g), PD = P.depuis(d);
    // dénominateurs : multiplier par le ppcm (règle 3)
    var den = 1;
    PG.concat(PD).forEach(function (m) { den = ppcm(den, Number(m.c.den)); });
    if (den > 1) {
      PG = P.fois(P.constante(den), PG); PD = P.fois(P.constante(den), PD);
      st.push(etape(n++, 'Multiplier les deux membres par ' + den + ' pour supprimer les fractions (règle 3), puis développer et réduire (règle 1).', heq(P.src(PG), P.src(PD)) + op('· ' + den)));
    } else if (P.src(PG) !== Maths.versTexte(g).replace(/\s/g, '') && (tx(P.src(PG)) !== tx(g) || tx(P.src(PD)) !== tx(d))) {
      st.push(etape(n++, 'Développer et réduire chaque membre (règle 1).', heq(P.src(PG), P.src(PD))));
    }
    var a = P.coef(PG, lx), b = P.coef(PG, {}), c = P.coef(PD, lx), e = P.coef(PD, {});
    // regrouper les termes en x à gauche
    if (!c.estZero()) {
      var A0 = a.moins(c);
      st.push(etape(n++, 'Regrouper les termes avec l\'inconnue dans le membre de gauche : ' + (c.signe() > 0 ? 'soustraire ' : 'ajouter ') + termeTexte(c.abs(), lettre) + ' aux deux membres (règle 2).',
        heq(srcLin(A0, b, lettre), P.src(P.constante(e))) + op((c.signe() > 0 ? '– ' : '+ ') + termeTexte(c.abs(), lettre))));
      a = A0; c = val(0);
    }
    if (!b.estZero()) {
      st.push(etape(n++, 'Regrouper les nombres dans le membre de droite : ' + (b.signe() > 0 ? 'soustraire ' : 'ajouter ') + tn(b.abs()) + ' aux deux membres (règle 2).',
        heq(srcLin(a, 0, lettre), P.src(P.constante(e.moins(b)))) + op((b.signe() > 0 ? '– ' : '+ ') + tn(b.abs()))));
      e = e.moins(b); b = val(0);
    }
    if (a.estZero()) {
      st.push(etape(n++, e.estZero() ? 'On obtient 0 = 0 : l\'égalité est vraie pour tous les nombres.' : 'On obtient 0 = ' + tn(e) + ' : l\'égalité est fausse quel que soit le nombre choisi.', hm(Maths.formaterSolutions(e.estZero() ? 'R' : []))));
      return st;
    }
    var sol = e.divise(a);
    if (!a.egal(1)) {
      st.push(etape(n++, 'Diviser les deux membres par ' + tn(a) + ' (règle 3).', hm(lettre + ' = ') + hn(sol) + op(': ' + O.tnp(a))));
    }
    st.push(etape(n++, 'Écrire l\'ensemble des solutions.', hm(Maths.formaterSolutions([sol]))));
    return st;
  }

  function verificationSubstitution(g, d, sol, lettre) {
    lettre = lettre || 'x';
    var v = {}; v[lettre] = sol;
    var vg = Maths.evaluer(g, v), vd = Maths.evaluer(d, v);
    return 'Vérification : on remplace ' + lettre + ' par ' + hn(sol) + ' dans l\'équation de départ. Membre de gauche : ' + hm(O.substituerTexte(g, v) + ' = ' + tn(vg)) +
      ' ; membre de droite : ' + hm(O.substituerTexte(d, v) + ' = ' + tn(vd)) + '. Les deux membres sont égaux.';
  }

  function piegesLineaire(g, d) {
    var e = lineaire(g, d);
    var pieges = [];
    var A = e.a.moins(e.c), B = e.d.moins(e.b);
    if (!A.estZero()) {
      // terme constant déplacé sans changer de signe
      var faux1 = e.d.plus(e.b);
      if (!faux1.egal(B)) pieges.push({ valeur: faux1.divise(A), message: 'Erreur de signe en changeant un nombre de membre : pour faire disparaître ' + tn(e.b) + ' à gauche, on ' + (e.b.signe() > 0 ? 'soustrait ' : 'ajoute ') + tn(e.b.abs()) + ' aux DEUX membres (règle 2).' });
      // soustraction au lieu de division
      if (A.compare(1) !== 0) pieges.push({ valeur: B.moins(A), message: 'Pour isoler x dans ' + tn(A) + 'x = ' + tn(B) + ', on DIVISE les deux membres par ' + tn(A) + ' (règle 3) : on ne soustrait pas ' + tn(A) + '.' });
      if (!B.estZero()) pieges.push({ valeur: A.divise(B), message: 'Tu as divisé dans le mauvais sens : ' + tn(A) + 'x = ' + tn(B) + ' donne x = ' + tn(B) + ' : ' + O.tnp(A) + '.' });
      if (!e.c.estZero() && !e.a.plus(e.c).estZero()) pieges.push({ valeur: B.divise(e.a.plus(e.c)), message: 'Erreur de signe en regroupant les termes en x : on soustrait ' + termeTexte(e.c, 'x') + ' aux deux membres.' });
    }
    return pieges;
  }

  function qResolution(alea, p, eq, options) {
    options = options || {};
    var sol = eq.sol;
    var valeurs = eq.special === 'tous' ? [] : (sol === null ? [] : [sol]);
    var reponse = { type: 'solutions', valeurs: valeurs, tous: eq.special === 'tous', equation: [eq.g, eq.d], lettre: 'x' };
    var balance = options.balance;
    return Q({
      type: balance ? 'visuel' : 'directe',
      enonce: '<p>Résous l\'équation' + (balance ? ' à l\'aide de la balance' : '') + ' et écris l\'ensemble des solutions :</p><p class="calcul">' + heq(eq.g, eq.d) + '</p>',
      consigne: balance ? 'Choisis une opération à appliquer aux deux plateaux, jusqu\'à obtenir x seul d\'un côté. Écris ensuite la solution ci-dessous.' : 'Écris par exemple S = { 4 }, ou seulement la solution.',
      reponse: reponse,
      pieges: sol ? piegesLineaire(eq.g, eq.d) : [],
      visuel: balance ? { type: 'balance', g: eq.g, d: eq.d, lettre: 'x' } : null,
      indice: 'Développe et réduis chaque membre (règle 1), regroupe les termes en x d\'un côté et les nombres de l\'autre (règle 2), puis divise par le coefficient de x (règle 3).',
      etapes: etapesLineaire(eq.g, eq.d),
      verification: sol && !eq.special ? verificationSubstitution(eq.g, eq.d, sol) : (eq.special === 'tous' ? 'Vérification : par exemple pour x = 0 et x = 1, les deux membres sont égaux.' : 'Vérification : par exemple pour x = 0, les deux membres sont différents ; et ce sera le cas pour tout nombre.'),
      rubrique: R.resolution,
      controle: { type: 'equation', g: eq.g, d: eq.d, special: eq.special || null }
    });
  }

  function genResoudre(alea, p) { return qResolution(alea, p, equationAleatoire(alea, p)); }
  function genResoudreBalance(alea, p) {
    var eq;
    var k = 0;
    do { eq = equationAleatoire(alea, Math.min(p, 3), { uniqueSeulement: true }); k++; } while (k < 20 && !eq.sol.estEntier());
    return qResolution(alea, p, eq, { balance: true });
  }

  function genResoudreErreur(alea, p) {
    var eq;
    do { eq = equationAleatoire(alea, Math.max(2, Math.min(p, 4)), { uniqueSeulement: true }); } while (!eq.sol.estEntier());
    var e = lineaire(eq.g, eq.d);
    var lignes = [[eq.g, eq.d]];
    var avecDev = tx(P.src(e.PG)) !== tx(eq.g) || tx(P.src(e.PD)) !== tx(eq.d);
    if (avecDev) lignes.push([P.src(e.PG), P.src(e.PD)]);
    var A = e.a.moins(e.c), b = e.b, dd = e.d;
    lignes.push([srcLin(A, b), P.src(P.constante(dd))]);
    lignes.push([srcLin(A, 0), P.src(P.constante(dd.moins(b)))]);
    lignes.push(['x', P.src(P.constante(dd.moins(b).divise(A)))]);
    // supprimer les lignes identiques consécutives
    lignes = lignes.filter(function (l, i) { return i === 0 || tx(l[0]) + tx(l[1]) !== tx(lignes[i - 1][0]) + tx(lignes[i - 1][1]); });
    var types = [];
    if (!b.estZero()) types.push('signe');
    if (!A.egal(1)) types.push('division');
    if (avecDev && /-\d*\(/.test(eq.g.replace(/\s/g, ''))) types.push('distribution');
    if (!types.length) return genResoudreErreur(alea, p);
    var t = alea.choix(types);
    if (t === 'division' && dd.moins(b).moins(A).egal(dd.moins(b).divise(A))) {
      if (types.indexOf('signe') < 0) return genResoudreErreur(alea, p);
      t = 'signe';
    }
    if (t === 'signe' && dd.plus(b).divise(A).egal(dd.moins(b).divise(A))) return genResoudreErreur(alea, p);
    var fausse, explication;
    var idxSigne = lignes.findIndex(function (l) { return tx(l[1]) === tx(P.src(P.constante(dd.moins(b)))) && l[0] === srcLin(A, 0); });
    if (t === 'signe') {
      fausse = idxSigne;
      var c2 = dd.plus(b);
      lignes[fausse] = [srcLin(A, 0), P.src(P.constante(c2))];
      lignes[fausse + 1] = ['x', P.src(P.constante(c2.divise(A)))];
      explication = 'Pour supprimer ' + tn(b) + ' dans le membre de gauche, il faut ' + (b.signe() > 0 ? 'soustraire ' : 'ajouter ') + tn(b.abs()) + ' aux DEUX membres : le nombre change de signe en « changeant de membre ».';
    } else if (t === 'division') {
      fausse = lignes.length - 1;
      lignes[fausse] = ['x', P.src(P.constante(dd.moins(b).moins(A)))];
      explication = 'Pour passer de ' + tx(srcLin(A, 0)) + ' = ' + tn(dd.moins(b)) + ' à x, on DIVISE les deux membres par ' + tn(A) + ' (règle 3) ; l\'élève a soustrait ' + tn(A) + '.';
    } else {
      fausse = 1;
      // oubli de distribuer le signe moins : on recalcule à partir d'un membre faux
      var gFaux = eq.g.replace(/-(\d*)\(([^)]*)\)/, function (m, k, inner) {
        var Pi = P.depuis(inner).map(function (mm, i) { return i === 0 ? { c: mm.c.fois(-(k ? Number(k) : 1)), l: mm.l } : { c: mm.c.fois(k ? Number(k) : 1), l: mm.l }; });
        return '+(' + P.src(Pi) + ')';
      });
      var ef = lineaire(gFaux, eq.d);
      var Af = ef.a.moins(ef.c);
      if (Af.estZero()) return genResoudreErreur(alea, p);
      lignes = [[eq.g, eq.d], [P.src(ef.PG), P.src(ef.PD)], [srcLin(Af, ef.b), P.src(P.constante(ef.d))], [srcLin(Af, 0), P.src(P.constante(ef.d.moins(ef.b)))], ['x', P.src(P.constante(ef.d.moins(ef.b).divise(Af)))]];
      explication = 'En supprimant la parenthèse précédée d\'un signe « – », il faut changer le signe de TOUS ses termes : l\'élève a oublié de distribuer le signe moins.';
    }
    var html = lignes.map(function (l) { return heq(l[0], l[1]); });
    return Q({
      type: 'erreur',
      enonce: '<p>' + alea.choix(O.PRENOMS) + ' a résolu une équation. Son calcul contient une erreur.</p><ol class="calcul-eleve">' + html.map(function (h) { return '<li>' + h + '</li>'; }).join('') + '</ol>',
      consigne: 'À quelle ligne apparaît la première erreur ?',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: alea.melanger(html.slice(1).map(function (h, i) {
        return { h: 'Ligne ' + (i + 2) + ' : ' + h, juste: i + 1 === fausse, message: i + 1 === fausse ? explication : 'La ligne ' + (i + 2) + ' est juste. ' + explication };
      })),
      indice: 'Remplace x par la solution trouvée par l\'élève dans chaque ligne : la première ligne où les deux membres ne sont plus égaux… n\'est pas forcément la bonne ! Compare plutôt chaque ligne avec la précédente : quelle règle a été appliquée ?',
      etapes: etapesLineaire(eq.g, eq.d),
      verification: verificationSubstitution(eq.g, eq.d, eq.sol),
      rubrique: R.equivalence,
      controle: { type: 'lignesEq', lignes: lignes, fausse: fausse }
    });
  }

  /* =====================================================================
   * Vocabulaire : solution, équations équivalentes, règles
   * ===================================================================== */
  function genEstSolution(alea, p) {
    var eq = equationAleatoire(alea, Math.min(p, 3), { uniqueSeulement: true });
    var vrai = alea.suivant() < 0.5;
    var v = vrai ? eq.sol : eq.sol.plus(alea.entierNonNul(-3, 3));
    var vv = {}; vv.x = v;
    var vg = Maths.evaluer(eq.g, vv), vd = Maths.evaluer(eq.d, vv);
    return Q({
      type: 'vraifaux',
      enonce: '<p>Vrai ou faux ?</p><p class="affirmation">' + hn(v) + ' est solution de l\'équation ' + heq(eq.g, eq.d) + '.</p>',
      consigne: 'Choisis la réponse et sa justification.',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: O.optionsVraiFaux(alea, {
        vrai: vrai,
        justeVrai: 'pour x = ' + tn(v) + ', les deux membres valent ' + tn(vg) + '.',
        justeFaux: 'pour x = ' + tn(v) + ', le membre de gauche vaut ' + tn(vg) + ' et le membre de droite ' + tn(vd) + '.',
        autresVrai: vrai ? ['le nombre ' + tn(v) + ' apparaît dans l\'équation.'] : ['le membre de gauche vaut ' + tn(vg) + '.', 'une équation est toujours vraie.'],
        autresFaux: vrai ? ['une équation du premier degré n\'a jamais de solution entière.', 'les deux membres n\'ont pas la même écriture.'] : ['il faut résoudre l\'équation pour le savoir.']
      }),
      indice: 'Remplace x par ce nombre dans chaque membre : c\'est une solution si les deux membres ont la même valeur.',
      etapes: [etape(1, 'Remplacer x par ' + tn(v) + ' dans chaque membre.', hm(O.substituerTexte(eq.g, vv) + ' = ' + tn(vg) + ' ; ' + O.substituerTexte(eq.d, vv) + ' = ' + tn(vd))),
        etape(2, vrai ? 'Les deux membres sont égaux : ' + tn(v) + ' est solution.' : 'Les deux membres sont différents : ' + tn(v) + ' n\'est pas solution.', '')],
      rubrique: R.equation,
      controle: { type: 'estSolution', g: eq.g, d: eq.d, v: v, vrai: vrai }
    });
  }

  function genRegles(alea, p) {
    var s = alea.entierNonNul(-5, 8);
    var a = alea.entier(2, 7), b = alea.entierNonNul(-9, 9), c = alea.entier(-3, 5);
    if (c === a) c++;
    var d = (a - c) * s + b;
    var g1 = srcLin(a, b), d1 = srcLin(c, d);
    var cas = alea.choix(['r1', 'r2', 'r2x', 'r3', 'un', 'parx', 'un']);
    var g2, d2, bonne, explication;
    var k = alea.entier(2, 6);
    if (cas === 'r1') {
      var m = alea.entier(2, 4);
      var bb = b - m * 2;
      g1 = m + '(x+2)' + (bb < 0 ? bb : '+' + bb) + (a - m ? (a - m > 0 ? '+' : '') + P.srcMonome({ c: val(a - m), l: { x: 1 } }) : '');
      g2 = srcLin(a, b); d2 = d1;
      bonne = 1; explication = 'Le membre de gauche a été développé et réduit : c\'est la règle (1).';
    } else if (cas === 'r2') {
      g2 = srcLin(a, b - k); d2 = srcLin(c, d - k);
      bonne = 2; explication = 'On a soustrait ' + k + ' aux deux membres : c\'est la règle (2).';
    } else if (cas === 'r2x') {
      g2 = srcLin(a - c, b); d2 = String(d);
      bonne = 2; explication = 'On a ' + (c > 0 ? 'soustrait ' : 'ajouté ') + termeTexte(Math.abs(c), 'x') + ' aux deux membres : c\'est la règle (2).';
      if (c === 0) { g2 = srcLin(a, b - k); d2 = srcLin(c, d - k); explication = 'On a soustrait ' + k + ' aux deux membres : c\'est la règle (2).'; }
    } else if (cas === 'r3') {
      g2 = P.src(P.fois(P.constante(k), P.depuis(g1))); d2 = P.src(P.fois(P.constante(k), P.depuis(d1)));
      bonne = 3; explication = 'On a multiplié les deux membres par ' + k + ' : c\'est la règle (3).';
    } else if (cas === 'un') {
      g2 = srcLin(a, b + k); d2 = d1;
      bonne = 0; explication = 'On a ajouté ' + k + ' au membre de gauche SEULEMENT : les équations ne sont pas équivalentes (elles n\'ont pas les mêmes solutions).';
    } else {
      g2 = P.src(P.fois(P.lettre('x'), P.depuis(g1))); d2 = P.src(P.fois(P.lettre('x'), P.depuis(d1)));
      bonne = 0; explication = 'On a multiplié les deux membres par x : ce n\'est pas permis, car x peut valoir 0. La nouvelle équation a une solution de plus (x = 0) : elle n\'est pas équivalente.';
    }
    var options = [
      { h: REGLES[1], juste: bonne === 1 },
      { h: REGLES[2], juste: bonne === 2 },
      { h: REGLES[3], juste: bonne === 3 },
      { h: 'Les deux équations ne sont pas équivalentes', juste: bonne === 0 }
    ].map(function (o) { o.message = explication; return o; });
    return Q({
      type: 'directe',
      enonce: '<p>On passe de l\'équation</p><p class="calcul">' + heq(g1, d1) + '</p><p>à l\'équation</p><p class="calcul">' + heq(g2, d2) + '</p>',
      consigne: 'Quelle règle d\'équivalence a été utilisée ?',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: options,
      indice: 'Compare les deux membres de chaque équation : qu\'est-ce qui a changé ? A-t-on fait la même chose des deux côtés ? Multiplier par l\'inconnue n\'est pas permis.',
      etapes: [etape(1, explication, '')],
      rubrique: R.equivalence,
      controle: { type: 'regle', e1: [g1, d1], e2: [g2, d2], equivalentes: bonne !== 0 }
    });
  }

  /* =====================================================================
   * Problèmes : inconnue, équation, solution
   * ===================================================================== */
  function probleme(alea, p) {
    var prenoms = alea.melanger(O.PRENOMS).slice(0, 3);
    var bank = [
      function () {
        var f = alea.choix([30, 40, 45, 60]), u = alea.choix([4, 5, 6, 8]), n = alea.entier(5, 20);
        return { texte: 'Une carte de piscine coûte ' + Maths.formaterMontant(f) + ', puis ' + Maths.formaterMontant(u) + ' par entrée. ' + prenoms[0] + ' a payé ' + Maths.formaterMontant(f + u * n) + ' en tout.',
          question: 'Combien d\'entrées ' + prenoms[0] + ' a-t-il ou elle payées ?', inconnue: 'x = le nombre d\'entrées',
          autresInconnues: ['x = le prix total', 'x = le prix d\'une entrée'], eq: [f + '+' + u + 'x', String(f + u * n)], sol: n, unite: 'entrées',
          faux: [[f + 'x+' + u, String(f + u * n), 'Le prix fixe ne dépend pas du nombre d\'entrées : c\'est le prix par entrée qui multiplie x.'], [f + '+' + u + 'x', String(u * n), 'Le membre de droite est le prix total payé.']] };
      },
      function () {
        var a = alea.entier(3, 15), x = alea.entier(10, 40), k = alea.choix([2, 3]);
        var total = x + (x + a) + k * x;
        return { texte: prenoms[0] + ', ' + prenoms[1] + ' et ' + prenoms[2] + ' se partagent le prix d\'un cadeau de ' + Maths.formaterMontant(total) + '. ' + prenoms[1] + ' paie ' + Maths.formaterMontant(a) + ' de plus que ' + prenoms[0] + ', et ' + prenoms[2] + ' paie le ' + (k === 2 ? 'double' : 'triple') + ' de ce que paie ' + prenoms[0] + '.',
          question: 'Combien paie ' + prenoms[0] + ' ?', inconnue: 'x = le montant payé par ' + prenoms[0],
          autresInconnues: ['x = le prix du cadeau', 'x = le montant payé par ' + prenoms[2]], eq: ['x+(x+' + a + ')+' + k + 'x', String(total)], sol: x, unite: 'francs',
          faux: [['x+' + a + 'x+' + k + 'x', String(total), prenoms[1] + ' paie x + ' + a + ' (' + a + ' francs DE PLUS), pas ' + a + 'x.'], ['x+(x+' + a + ')+' + k, String(total), prenoms[2] + ' paie ' + k + 'x (le ' + (k === 2 ? 'double' : 'triple') + ' de x).']] };
      },
      function () {
        var a = alea.entier(2, 9), l = alea.entier(3, 15);
        var per = 2 * (l + a) + 2 * l;
        return { texte: 'Le potager rectangulaire du jardin de l\'école a un périmètre de ' + per + ' m. Sa longueur mesure ' + a + ' m de plus que sa largeur.',
          question: 'Quelle est la largeur du potager (en m) ?', inconnue: 'x = la largeur du potager (en m)',
          autresInconnues: ['x = le périmètre du potager', 'x = l\'aire du potager'], eq: ['2(x+' + a + ')+2x', String(per)], sol: l, unite: 'm',
          faux: [['x+' + a + '+x', String(per), 'Le périmètre comprend DEUX longueurs et DEUX largeurs.'], ['x(x+' + a + ')', String(per), 'x(x + ' + a + ') est l\'aire, pas le périmètre.']] };
      },
      function () {
        var n = alea.entier(5, 60);
        var s = 3 * n + 3;
        return { texte: 'La somme de trois nombres entiers consécutifs vaut ' + s + '.',
          question: 'Quel est le plus petit de ces trois nombres ?', inconnue: 'x = le plus petit des trois nombres',
          autresInconnues: ['x = la somme des trois nombres', 'x = le nombre de nombres'], eq: ['x+(x+1)+(x+2)', String(s)], sol: n, unite: '',
          faux: [['x+2x+3x', String(s), 'Des nombres consécutifs se suivent : x, x + 1 et x + 2.'], ['3x', String(s), 'Les trois nombres ne sont pas égaux : x, x + 1 et x + 2.']] };
      },
      function () {
        var a = alea.choix([12, 16, 20, 24]), b = alea.choix([3, 4, 5, 6]), n = alea.entier(4, 15);
        return { texte: 'Sur le toit de la salle de sport, il y a déjà ' + a + ' panneaux solaires. Une équipe en installe ' + b + ' de plus chaque semaine. Le projet prévoit ' + (a + b * n) + ' panneaux en tout.',
          question: 'Après combien de semaines le projet sera-t-il terminé ?', inconnue: 'x = le nombre de semaines',
          autresInconnues: ['x = le nombre total de panneaux', 'x = le nombre de panneaux posés par semaine'], eq: [a + '+' + b + 'x', String(a + b * n)], sol: n, unite: 'semaines',
          faux: [[a + 'x+' + b, String(a + b * n), 'C\'est le nombre de panneaux posés CHAQUE semaine qui est multiplié par le nombre de semaines.'], [b + 'x', String(a + b * n), 'N\'oublie pas les ' + a + ' panneaux déjà installés.']] };
      },
      function () {
        var dif = alea.entier(2, 6), x = alea.entier(3, 9), nuls = alea.entier(1, 4);
        var total = x + (x + dif) + nuls;
        return { texte: 'Cette saison, l\'équipe de unihockey de l\'école a joué ' + total + ' matchs. Elle a gagné ' + dif + ' matchs de plus qu\'elle n\'en a perdu, et fait ' + nuls + ' matchs nuls.',
          question: 'Combien de matchs l\'équipe a-t-elle perdus ?', inconnue: 'x = le nombre de matchs perdus',
          autresInconnues: ['x = le nombre de matchs joués', 'x = le nombre de matchs nuls'], eq: ['x+(x+' + dif + ')+' + nuls, String(total)], sol: x, unite: 'matchs',
          faux: [['x+' + dif + 'x+' + nuls, String(total), 'Les victoires valent x + ' + dif + ' (' + dif + ' DE PLUS que les défaites).'], ['x+(x+' + dif + ')', String(total), 'N\'oublie pas les ' + nuls + ' matchs nuls.']] };
      }
    ];
    if (p >= 3) bank.push(function () {
      var u1 = alea.choix([4, 5, 6]), u2 = u1 + alea.choix([2, 3, 4]), n = alea.entier(6, 18);
      var f = (u2 - u1) * n;
      return { texte: 'Deux offres pour une salle d\'escalade : l\'offre A coûte ' + Maths.formaterMontant(f) + ' d\'abonnement, puis ' + Maths.formaterMontant(u1) + ' par entrée ; l\'offre B coûte ' + Maths.formaterMontant(u2) + ' par entrée, sans abonnement.',
        question: 'Pour combien d\'entrées les deux offres coûtent-elles le même prix ?', inconnue: 'x = le nombre d\'entrées',
        autresInconnues: ['x = le prix de l\'offre A', 'x = la différence de prix'], eq: [f + '+' + u1 + 'x', u2 + 'x'], sol: n, unite: 'entrées',
        faux: [[f + '+' + u1 + 'x+' + u2 + 'x', '0', 'On cherche quand les deux prix sont ÉGAUX : prix A = prix B.'], [f + 'x+' + u1, u2 + 'x', 'L\'abonnement se paie une seule fois : c\'est le prix par entrée qui multiplie x.']] };
    });
    if (p >= 3) bank.push(function () {
      var l = alea.entier(4, 12), a = alea.entier(1, 6);
      var L = 2 * l + a;
      var per = 2 * (L + l);
      return { texte: 'Un terrain de beach-volley rectangulaire a un périmètre de ' + per + ' m. Sa longueur mesure ' + a + ' m de plus que le double de sa largeur.',
        question: 'Quelle est la largeur du terrain (en m) ?', inconnue: 'x = la largeur du terrain (en m)',
        autresInconnues: ['x = la longueur du terrain', 'x = le périmètre'], eq: ['2(2x+' + a + ')+2x', String(per)], sol: l, unite: 'm',
        faux: [['2(x+' + a + ')+2x', String(per), 'La longueur vaut le DOUBLE de la largeur, plus ' + a + ' : 2x + ' + a + '.'], ['2x+' + a + '+x', String(per), 'Le périmètre comprend deux longueurs et deux largeurs.']] };
    });
    return alea.choix(bank)();
  }

  function genProblemeEquation(alea, p) {
    var pb = probleme(alea, p);
    var opts = [{ h: heq(pb.eq[0], pb.eq[1]), juste: true, message: 'Avec ' + pb.inconnue + ', cette équation traduit bien l\'énoncé.' }];
    pb.faux.forEach(function (f) { opts.push({ h: heq(f[0], f[1]), juste: false, message: f[2] }); });
    return Q({
      type: 'traduction',
      enonce: '<p>' + pb.texte + '</p><p>' + pb.question + '</p><p>On choisit comme inconnue : <strong>' + O.echapper(pb.inconnue) + '</strong>.</p>',
      consigne: 'Quelle équation traduit la situation ?',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: alea.melanger(opts),
      indice: 'Exprime chaque quantité de l\'énoncé en fonction de x, puis écris l\'égalité que l\'énoncé décrit.',
      etapes: [etape(1, 'Choisir l\'inconnue : ' + pb.inconnue + '.', ''), etape(2, 'Traduire l\'énoncé par une équation.', heq(pb.eq[0], pb.eq[1]))],
      rubrique: R.equation,
      controle: { type: 'probleme', eq: pb.eq, sol: pb.sol, faux: pb.faux.map(function (f) { return [f[0], f[1]]; }) }
    });
  }

  function genProblemeResoudre(alea, p) {
    var pb = probleme(alea, p);
    var st = [etape(1, 'Choisir l\'inconnue : ' + pb.inconnue + '.', ''), etape(2, 'Traduire l\'énoncé par une équation.', heq(pb.eq[0], pb.eq[1]))];
    etapesLineaire(pb.eq[0], pb.eq[1]).forEach(function (e, i) { e.titre = 'ÉTAPE ' + (i + 3); st.push(e); });
    st.push(etape(st.length + 1, 'Répondre à la question par une phrase.', O.echapper(pb.question.replace(/ \?$/, '') + ' : ' + pb.sol + (pb.unite ? ' ' + pb.unite : '') + '.')));
    return Q({
      type: 'probleme',
      enonce: '<p>' + pb.texte + '</p><p>' + pb.question + '</p>',
      consigne: 'Choisis l\'inconnue, écris une équation et résous-la. Écris seulement le nombre trouvé.',
      reponse: { type: 'nombre', valeur: fr(pb.sol) },
      suffixe: pb.unite,
      indice: 'Inconnue : ' + O.echapper(pb.inconnue) + '. Exprime les autres quantités en fonction de x.',
      etapes: st,
      verification: verificationSubstitution(pb.eq[0], pb.eq[1], fr(pb.sol)),
      rubrique: R.equation,
      controle: { type: 'probleme', eq: pb.eq, sol: pb.sol, faux: [] }
    });
  }

  function genProblemeInconnue(alea, p) {
    var pb = probleme(alea, p);
    var opts = [{ h: O.echapper(pb.inconnue), juste: true, message: 'C\'est la quantité demandée : on la note x.' }];
    pb.autresInconnues.forEach(function (t) { opts.push({ h: O.echapper(t), juste: false, message: 'Cette quantité est connue ou n\'est pas demandée : l\'inconnue est ce que l\'on cherche, ici ' + pb.inconnue.replace('x = ', '') + '.' }); });
    return Q({
      type: 'directe',
      enonce: '<p>' + pb.texte + '</p><p>' + pb.question + '</p>',
      consigne: 'Quelle inconnue choisis-tu pour résoudre ce problème avec une équation ?',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: alea.melanger(opts),
      indice: 'L\'inconnue est en général la quantité demandée dans la question.',
      etapes: [etape(1, 'On choisit comme inconnue la quantité demandée : ' + pb.inconnue + '.', ''), etape(2, 'Équation :', heq(pb.eq[0], pb.eq[1]))],
      rubrique: R.equation,
      controle: { type: 'probleme', eq: pb.eq, sol: pb.sol, faux: [] }
    });
  }

  function genProblemeExpression(alea, p) {
    var pb = probleme(alea, Math.max(p, 3));
    var gauche = pb.eq[0];
    return Q({
      type: 'traduction',
      enonce: '<p>' + pb.texte + '</p><p>On choisit comme inconnue : <strong>' + O.echapper(pb.inconnue) + '</strong>.</p><p>Exprime en fonction de x la quantité qui sera égale à ' + hx(pb.eq[1]) + ' dans l\'équation (le membre de gauche).</p>',
      consigne: 'Toute expression égale est acceptée.',
      reponse: { type: 'expr', attendu: gauche, forme: null },
      pieges: pb.faux.filter(function (f) { return f[1] === pb.eq[1]; }).map(function (f) { return { src: f[0], message: f[2] }; }),
      indice: 'Exprime chaque quantité de l\'énoncé en fonction de x, puis additionne-les si besoin.',
      etapes: [etape(1, 'Exprimer chaque quantité en fonction de x.', hx(gauche)), etape(2, 'L\'équation est alors :', heq(pb.eq[0], pb.eq[1])), etape(3, 'Sa solution est x = ' + pb.sol + '.', '')],
      rubrique: R.expression,
      controle: { type: 'expr' }
    });
  }

  /* =====================================================================
   * Résolution graphique
   * ===================================================================== */
  function genGraphique(alea, p) {
    for (var k = 0; k < 100; k++) {
      var s = alea.entier(-4, 4);
      var a = alea.entierNonNul(-3, 3), c = alea.entier(-3, 3);
      if (a === c) continue;
      var y0 = alea.entier(-5, 5);
      var b = y0 - a * s, d = y0 - c * s;
      if (Math.abs(b) > 8 || Math.abs(d) > 8) continue;
      var g = srcLin(a, b), dd = c === 0 ? String(d) : srcLin(c, d);
      return Q({
        type: 'visuel',
        enonce: '<p>On a représenté les fonctions <span class="maths">f(x) = ' + O.echapper(tx(g)) + '</span> et <span class="maths">g(x) = ' + O.echapper(tx(dd)) + '</span>.</p><p>Résous graphiquement l\'équation ' + heq(g, dd) + '.</p>',
        consigne: 'Touche le graphique pour lire les coordonnées d\'un point. Écris l\'ensemble des solutions.',
        reponse: { type: 'solutions', valeurs: [fr(s)], equation: [g, dd], lettre: 'x' },
        pieges: [{ valeur: y0, message: 'Tu as donné l\'ordonnée du point d\'intersection : la solution est son ABSCISSE (sa première coordonnée).' }],
        visuel: { type: 'graphique', courbes: [{ src: g, nom: 'f' }, { src: dd, nom: 'g' }], xmin: -6, xmax: 6, ymin: -9, ymax: 9 },
        indice: 'Les solutions sont les abscisses des points d\'intersection des deux droites.',
        etapes: [
          etape(1, 'Repérer le point d\'intersection des deux droites.', hm(Maths.formaterCoordonnees(s, y0))),
          etape(2, 'La solution est l\'abscisse de ce point.', hm(Maths.formaterSolutions([s]))),
          etape(3, 'Vérifier par le calcul.', verificationSubstitution(g, dd, fr(s)))
        ],
        rubrique: R.graphique,
        controle: { type: 'equation', g: g, d: dd, special: null }
      });
    }
    throw new Error('graphique');
  }

  function genGraphiqueDeg2(alea, p) {
    for (var k = 0; k < 100; k++) {
      var r1 = alea.entier(-5, 4), r2 = alea.entier(-4, 5);
      if (r1 === r2 && alea.suivant() < 0.8) continue;
      var poly = P.fois(O.lin(1, -r1), O.lin(1, -r2));
      var cas = alea.choix(['axe', 'droite']);
      var g = P.src(poly), d = '0';
      var courbes = [{ src: g, nom: 'f' }];
      var enonce;
      var ymin = Math.min(-2, P.valeur(poly, { x: fr(r1 + r2, 2) }).valeur() - 1);
      if (ymin < -9) continue;
      if (cas === 'droite') {
        var m = alea.entier(-2, 2), h = alea.entier(-3, 3);
        var lin = O.lin(m, h);
        var gg = P.plus(poly, lin);
        if (P.estZero(lin)) continue;
        g = P.src(gg); d = P.src(lin);
        // f(x) = gg, g(x) = lin : intersections aux racines r1, r2
        if (P.valeur(lin, { x: r1 }).abs().compare(9) > 0 || P.valeur(lin, { x: r2 }).abs().compare(9) > 0) continue;
        var ymin2 = Math.min.apply(null, [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(function (x) { return P.valeur(gg, { x: x }).valeur(); }));
        if (ymin2 < -9) continue;
        courbes = [{ src: g, nom: 'f' }, { src: d, nom: 'g' }];
        enonce = '<p>On a représenté les fonctions <span class="maths">f(x) = ' + O.echapper(tx(g)) + '</span> et <span class="maths">g(x) = ' + O.echapper(tx(d)) + '</span>.</p><p>Résous graphiquement l\'équation ' + heq(g, d) + '.</p>';
      } else {
        enonce = '<p>On a représenté la fonction <span class="maths">f(x) = ' + O.echapper(tx(g)) + '</span>.</p><p>Résous graphiquement l\'équation ' + heq(g, '0') + '.</p>';
      }
      var sols = r1 === r2 ? [fr(r1)] : [fr(r1), fr(r2)];
      return Q({
        type: 'visuel',
        enonce: enonce,
        consigne: 'Touche le graphique pour lire les coordonnées d\'un point. Écris l\'ensemble des solutions, par exemple S = { – 1 ; 3 }.',
        reponse: { type: 'solutions', valeurs: sols, equation: [g, d], lettre: 'x' },
        visuel: { type: 'graphique', courbes: courbes, xmin: -6, xmax: 6, ymin: -9, ymax: 9 },
        indice: cas === 'axe' ? 'Les solutions de f(x) = 0 sont les abscisses des points où la parabole coupe l\'axe des abscisses.' : 'Les solutions sont les abscisses des points d\'intersection de la parabole et de la droite.',
        etapes: [
          etape(1, cas === 'axe' ? 'Repérer les points où la parabole coupe l\'axe des abscisses.' : 'Repérer les points d\'intersection de la parabole et de la droite.', hm(sols.map(function (s) { return Maths.formaterCoordonnees(s, P.valeur(P.depuis(d), { x: s })); }).join(' et '))),
          etape(2, 'Les solutions sont les abscisses de ces points.', hm(Maths.formaterSolutions(sols)))
        ],
        rubrique: R.graphique,
        controle: { type: 'deg2', g: g, d: d, nb: sols.length }
      });
    }
    throw new Error('graphique deg2');
  }

  /* =====================================================================
   * Formules : exprimer une variable en fonction des autres
   * ===================================================================== */
  var FORMULES = [
    { p: 1, eq: ['v', 'd/t'], contexte: 'vitesse moyenne v, distance d, durée t', cibles: {
      d: { src: 'v*t', etapes: [['Multiplier les deux membres par t (règle 3).', 'v · t = d'], ['Écrire d en fonction de v et t.', 'd = vt']], pieges: [['v/t', 'Pour isoler d, on MULTIPLIE les deux membres par t.']] },
      t: { src: 'd/v', etapes: [['Multiplier les deux membres par t (règle 3).', 'v · t = d'], ['Diviser les deux membres par v (règle 3).', 't = d/v']], pieges: [['d*v', 'Pour isoler t, on divise d par v.'], ['v/d', 'Le quotient est inversé : t = d/v.']] } } },
    { p: 1, eq: ['U', 'R*I'], contexte: 'tension U, résistance R, intensité I (loi d\'Ohm)', cibles: {
      R: { src: 'U/I', etapes: [['Diviser les deux membres par I (règle 3).', 'R = U/I']], pieges: [['U*I', 'On divise par I, on ne multiplie pas.'], ['I/U', 'Le quotient est inversé : R = U/I.']] },
      I: { src: 'U/R', etapes: [['Diviser les deux membres par R (règle 3).', 'I = U/R']], pieges: [['U*R', 'On divise par R, on ne multiplie pas.']] } } },
    { p: 2, eq: ['A', 'b*h/2'], contexte: 'aire A d\'un triangle de base b et de hauteur h', cibles: {
      b: { src: '2A/h', etapes: [['Multiplier les deux membres par 2 (règle 3).', '2A = bh'], ['Diviser les deux membres par h (règle 3).', 'b = 2A/h']], pieges: [['A/h', 'N\'oublie pas le 2 : on multiplie d\'abord les deux membres par 2.'], ['2A*h', 'On divise par h.']] },
      h: { src: '2A/b', etapes: [['Multiplier les deux membres par 2 (règle 3).', '2A = bh'], ['Diviser les deux membres par b (règle 3).', 'h = 2A/b']], pieges: [['A/b', 'N\'oublie pas le 2 : on multiplie d\'abord les deux membres par 2.'], ['A/(2b)', 'On multiplie A par 2 (et non b) : h = 2A/b.']] } } },
    { p: 2, eq: ['E', 'P*t'], contexte: 'énergie E produite par des panneaux solaires de puissance P pendant une durée t', cibles: {
      P: { src: 'E/t', etapes: [['Diviser les deux membres par t (règle 3).', 'P = E/t']], pieges: [['E*t', 'On divise par t.']] },
      t: { src: 'E/P', etapes: [['Diviser les deux membres par P (règle 3).', 't = E/P']], pieges: [['E*P', 'On divise par P.']] } } },
    { p: 3, eq: ['p', 'f+u*n'], contexte: 'prix p d\'un abonnement : frais fixes f plus u francs par entrée, pour n entrées', cibles: {
      n: { src: '(p-f)/u', etapes: [['Soustraire f aux deux membres (règle 2).', 'p – f = un'], ['Diviser les deux membres par u (règle 3).', 'n = (p – f)/u']], pieges: [['p/u-f', 'On soustrait f AVANT de diviser : n = (p – f)/u.'], ['(p+f)/u', 'Erreur de signe : on soustrait f aux deux membres.']] },
      f: { src: 'p-u*n', etapes: [['Soustraire un aux deux membres (règle 2).', 'f = p – un']], pieges: [['p+u*n', 'Erreur de signe : on soustrait un aux deux membres.']] } } },
    { p: 3, eq: ['P', '2a+2b'], contexte: 'périmètre P d\'un rectangle de côtés a et b', cibles: {
      a: { src: '(P-2b)/2', etapes: [['Soustraire 2b aux deux membres (règle 2).', 'P – 2b = 2a'], ['Diviser les deux membres par 2 (règle 3).', 'a = (P – 2b)/2']], pieges: [['P-2b', 'Il reste à diviser par 2 : P – 2b = 2a.'], ['P/2-2b', 'Tout le membre P – 2b est divisé par 2 : a = (P – 2b)/2 = P/2 – b.']] } } },
    { p: 4, eq: ['A', '(B+b)*h/2'], contexte: 'aire A d\'un trapèze de bases B et b et de hauteur h', cibles: {
      h: { src: '2A/(B+b)', etapes: [['Multiplier les deux membres par 2 (règle 3).', '2A = (B + b)h'], ['Diviser les deux membres par (B + b) (règle 3).', 'h = 2A/(B + b)']], pieges: [['2A/B+b', 'Il faut diviser par toute la somme (B + b) : mets des parenthèses.'], ['A/(B+b)', 'N\'oublie pas le 2.']] },
      B: { src: '2A/h-b', etapes: [['Multiplier les deux membres par 2, puis diviser par h (règle 3).', '2A/h = B + b'], ['Soustraire b aux deux membres (règle 2).', 'B = 2A/h – b']], pieges: [['2A/h+b', 'Erreur de signe : on soustrait b.']] } } },
    { p: 4, eq: ['y', 'm*x+h'], contexte: 'fonction affine y = mx + h', cibles: {
      x: { src: '(y-h)/m', etapes: [['Soustraire h aux deux membres (règle 2).', 'y – h = mx'], ['Diviser les deux membres par m (règle 3).', 'x = (y – h)/m']], pieges: [['y/m-h', 'On soustrait h AVANT de diviser par m.'], ['(y+h)/m', 'Erreur de signe : on soustrait h.']] },
      m: { src: '(y-h)/x', etapes: [['Soustraire h aux deux membres (règle 2).', 'y – h = mx'], ['Diviser les deux membres par x (règle 3).', 'm = (y – h)/x']], pieges: [['y/x-h', 'On soustrait h AVANT de diviser.']] } } },
    { p: 5, eq: ['F', '1.8C+32'], contexte: 'température F en degrés Fahrenheit et C en degrés Celsius', cibles: {
      C: { src: '(F-32)/1.8', etapes: [['Soustraire 32 aux deux membres (règle 2).', 'F – 32 = 1,8C'], ['Diviser les deux membres par 1,8 (règle 3).', 'C = (F – 32) : 1,8']], pieges: [['F/1.8-32', 'On soustrait 32 AVANT de diviser.'], ['(F-32)*1.8', 'On divise par 1,8.']] } } }
  ];

  function genFormule(alea, p) {
    var dispo = FORMULES.filter(function (f) { return f.p <= p && f.p >= p - 2; });
    var f = alea.choix(dispo.length ? dispo : FORMULES);
    var cible = alea.choix(Object.keys(f.cibles));
    var c = f.cibles[cible];
    var autres = Maths.lettres(f.eq[0] + '+' + f.eq[1]).filter(function (l) { return l !== cible; });
    var lettresClavier = autres.slice().sort();
    var q = Q({
      type: 'directe',
      enonce: '<p>La formule ' + hm(tx(f.eq[0]) + ' = ' + tx(f.eq[1])) + ' relie : ' + O.echapper(f.contexte) + '.</p><p>Exprime <strong>' + cible + '</strong> en fonction de ' + autres.join(', ').replace(/, ([^,]*)$/, ' et $1') + '.</p>',
      consigne: 'Écris seulement l\'expression de ' + cible + ' (ou « ' + cible + ' = … »).',
      reponse: { type: 'formule', attendu: c.src, variable: cible, formule: f.eq },
      pieges: c.pieges.map(function (pg) { return { src: pg[0], message: pg[1] }; }),
      clavier: O.clavierPour(lettresClavier),
      indice: 'On applique les règles d\'équivalence comme pour une équation : ' + cible + ' joue le rôle de l\'inconnue, les autres lettres sont des nombres.',
      etapes: c.etapes.map(function (e, i) { return etape(i + 1, e[0], hm(e[1])); }),
      verification: 'Vérification : en remplaçant ' + cible + ' par ' + hm(tx(c.src)) + ' dans la formule de départ, on obtient une égalité vraie pour toutes les valeurs des autres lettres.',
      rubrique: R.formules,
      controle: { type: 'formule', eq: f.eq, cible: cible, src: c.src }
    });
    q.attenduHtml = hm(cible + ' = ' + tx(c.src));
    return q;
  }

  /* =====================================================================
   * Systèmes de deux équations à deux inconnues (11e, niveau 2)
   * ===================================================================== */
  function systemeAleatoire(alea, p, sol) {
    for (var k = 0; k < 200; k++) {
      var x0 = sol ? sol[0] : alea.entier(-5, 6), y0 = sol ? sol[1] : alea.entier(-4, 6);
      if (!sol && p >= 4 && alea.suivant() < 0.4) y0 = val(alea.choix([-3, -1, 1, 3, 5, 7, 9])).divise(2);
      x0 = val(x0); y0 = val(y0);
      var subst = p <= 2 || alea.suivant() < 0.5;
      var a1 = subst ? 1 : alea.entierNonNul(-6, 6), b1 = alea.entierNonNul(-6, 6);
      var a2 = alea.entierNonNul(-6, 6), b2 = alea.entierNonNul(-6, 6);
      if (!subst && (Math.abs(a1) === 1 || Math.abs(b1) === 1 || Math.abs(a2) === 1 || Math.abs(b2) === 1) && alea.suivant() < 0.7) continue;
      if (a1 * b2 - a2 * b1 === 0) continue;
      var c1 = x0.fois(a1).plus(y0.fois(b1)), c2 = x0.fois(a2).plus(y0.fois(b2));
      if (!c1.estEntier() || !c2.estEntier()) continue;
      return { a1: a1, b1: b1, c1: c1, a2: a2, b2: b2, c2: c2, x: x0, y: y0, methode: subst ? 'substitution' : 'combinaison' };
    }
    throw new Error('système');
  }
  function srcXY(a, b) { return P.src(P.plus(P.monome(a, { x: 1 }), P.monome(b, { y: 1 }))); }
  function htmlSysteme(s) {
    return '<div class="systeme"><span class="accolade" aria-hidden="true">{</span><span class="systeme-lignes">' +
      '<span>' + heq(srcXY(s.a1, s.b1), String(s.c1)) + ' <span class="numero">(1)</span></span>' +
      '<span>' + heq(srcXY(s.a2, s.b2), String(s.c2)) + ' <span class="numero">(2)</span></span></span></div>';
  }

  function etapesSysteme(s) {
    var st = [];
    if (s.methode === 'substitution' && Math.abs(s.a1) === 1) {
      // x = (c1 – b1 y) / a1
      var expX = P.plus(P.constante(s.c1.divise(s.a1)), P.monome(val(-s.b1).divise(s.a1), { y: 1 }));
      st.push(etape(1, 'Méthode par substitution. Exprimer x en fonction de y à partir de l\'équation (1).', hm('x = ' + P.texte(expX, { ordre: 'croissant' }))));
      var eq2 = P.plus(P.fois(P.constante(s.a2), expX), P.monome(s.b2, { y: 1 }));
      var facteur = s.a2 === 1 ? '' : (s.a2 === -1 ? '– ' : tn(s.a2));
      var termeY = (s.b2 < 0 ? ' – ' : ' + ') + (Math.abs(s.b2) === 1 ? '' : Math.abs(s.b2)) + 'y';
      st.push(etape(2, 'Remplacer x par cette expression dans l\'équation (2), puis développer et réduire.', hm(facteur + '(' + P.texte(expX, { ordre: 'croissant' }) + ')' + termeY + ' = ' + tn(s.c2)) + '<br>' + heq(P.src(eq2), String(s.c2))));
      st.push(etape(3, 'Résoudre cette équation à une inconnue.', hm('y = ') + hn(s.y)));
      st.push(etape(4, 'Calculer x en remplaçant y par sa valeur.', hm('x = ' + O.substituerTexte(P.src(expX, { ordre: 'croissant' }), { y: s.y }) + ' = ' + tn(s.x))));
    } else {
      var g = O.pgcd(s.a1, s.a2);
      var k1 = s.a2 / g, k2 = -s.a1 / g;
      var nb = k1 * s.b1 + k2 * s.b2;
      var nc = s.c1.fois(k1).plus(s.c2.fois(k2));
      st.push(etape(1, 'Méthode par combinaison linéaire. Multiplier l\'équation (1) par ' + tn(k1) + ' et l\'équation (2) par ' + tn(k2) + ' pour que les coefficients de x soient opposés.',
        heq(srcXY(s.a1 * k1, s.b1 * k1), tn(s.c1.fois(k1)).replace(/ /g, '')) + '<br>' + heq(srcXY(s.a2 * k2, s.b2 * k2), s.c2.fois(k2).toString())));
      st.push(etape(2, 'Additionner les deux équations membre à membre : x disparaît.', heq(P.src(P.monome(nb, { y: 1 })), nc.toString())));
      st.push(etape(3, 'Résoudre cette équation.', hm('y = ') + hn(s.y)));
      var tx1 = P.texteMonome({ c: val(s.a1), l: { x: 1 } }) + (s.b1 < 0 ? ' – ' : ' + ') + tn(Math.abs(s.b1)) + ' · ' + O.tnp(s.y);
      st.push(etape(4, 'Remplacer y par sa valeur dans l\'équation (1) pour calculer x.', hm(tx1 + ' = ' + tn(s.c1)) + ' → ' + hm('x = ' + tn(s.x))));
    }
    st.push(etape(st.length + 1, 'Écrire la solution.', hm('S = { ' + Maths.formaterCoordonnees(s.x, s.y) + ' }')));
    return st;
  }
  function verifSysteme(s) {
    var v = { x: s.x, y: s.y };
    return 'Vérification dans les deux équations : (1) ' + hm(O.substituerTexte(srcXY(s.a1, s.b1), v) + ' = ' + tn(s.c1)) + ' ; (2) ' + hm(O.substituerTexte(srcXY(s.a2, s.b2), v) + ' = ' + tn(s.c2)) + '.';
  }

  function genSysteme(alea, p) {
    var s = systemeAleatoire(alea, p);
    return Q({
      type: 'directe',
      enonce: '<p>Résous le système ' + (s.methode === 'substitution' ? '(par exemple par substitution)' : '(par exemple par combinaison linéaire)') + ' :</p>' + htmlSysteme(s),
      consigne: 'Écris le couple solution (x ; y), par exemple (2 ; – 1).',
      reponse: { type: 'couple', x: s.x, y: s.y, lettres: ['x', 'y'], equations: [[srcXY(s.a1, s.b1), String(s.c1)], [srcXY(s.a2, s.b2), String(s.c2)]] },
      indice: s.methode === 'substitution' ? 'Dans l\'équation (1), le coefficient de x vaut ' + tn(s.a1) + ' : exprime x en fonction de y, puis remplace dans (2).' : 'Multiplie les équations pour que les coefficients de x (ou de y) soient opposés, puis additionne-les.',
      etapes: etapesSysteme(s),
      verification: verifSysteme(s),
      rubrique: R.systemes,
      controle: { type: 'systeme', equations: [[srcXY(s.a1, s.b1), String(s.c1)], [srcXY(s.a2, s.b2), String(s.c2)]] }
    });
  }

  function genSystemeProbleme(alea, p) {
    var cs = [
      function () {
        var x = alea.choix([3, 3.5, 4, 4.5]), y = alea.choix([2, 2.5, 3, 3.5]);
        var a1 = alea.entier(1, 3), b1 = alea.entier(1, 3), a2 = alea.entier(1, 4), b2 = alea.entier(1, 4);
        if (a1 * b2 === a2 * b1) b2 = b2 === 4 ? 1 : b2 + 1;
        return { x: x, y: y, a1: a1, b1: b1, a2: a2, b2: b2,
          texte: 'À la cafétéria de l\'école, ' + a1 + ' chocolat' + (a1 > 1 ? 's' : '') + ' chaud' + (a1 > 1 ? 's' : '') + ' et ' + b1 + ' croissant' + (b1 > 1 ? 's' : '') + ' coûtent ' + Maths.formaterMontant(a1 * x + b1 * y) + ' ; ' + a2 + ' chocolat' + (a2 > 1 ? 's' : '') + ' chaud' + (a2 > 1 ? 's' : '') + ' et ' + b2 + ' croissant' + (b2 > 1 ? 's' : '') + ' coûtent ' + Maths.formaterMontant(a2 * x + b2 * y) + '.',
          inc: 'x = le prix d\'un chocolat chaud et y = le prix d\'un croissant (en francs)', question: 'Quel est le prix d\'un chocolat chaud et celui d\'un croissant ?' };
      },
      function () {
        var x = alea.choix([15, 18, 20, 24]), y = alea.choix([8, 9, 10, 12]);
        var a1 = alea.entier(1, 3), b1 = alea.entier(2, 4), a2 = alea.entier(2, 4), b2 = alea.entier(1, 3);
        if (a1 * b2 === a2 * b1) a2++;
        return { x: x, y: y, a1: a1, b1: b1, a2: a2, b2: b2,
          texte: 'Au musée, une famille de ' + a1 + ' adulte' + (a1 > 1 ? 's' : '') + ' et ' + b1 + ' enfants paie ' + Maths.formaterMontant(a1 * x + b1 * y) + '. Une autre famille de ' + a2 + ' adultes et ' + b2 + ' enfant' + (b2 > 1 ? 's' : '') + ' paie ' + Maths.formaterMontant(a2 * x + b2 * y) + '.',
          inc: 'x = le prix d\'un billet adulte et y = le prix d\'un billet enfant (en francs)', question: 'Quel est le prix d\'un billet adulte et celui d\'un billet enfant ?' };
      },
      function () {
        var x = alea.entier(8, 20), y = alea.entier(3, 12);
        var t = x + y;
        return { x: x, y: y, a1: 1, b1: 1, a2: 3, b2: 1,
          texte: 'Lors d\'un tournoi de unihockey, une équipe a joué ' + t + ' matchs sans match nul et obtenu ' + (3 * x + y) + ' points. Une victoire rapporte 3 points et une défaite 1 point (de participation).',
          inc: 'x = le nombre de victoires et y = le nombre de défaites', question: 'Combien de victoires et de défaites ?' };
      }
    ];
    var c = alea.choix(cs)();
    var s = { a1: c.a1, b1: c.b1, c1: val(c.a1).fois(c.x).plus(val(c.b1).fois(c.y)), a2: c.a2, b2: c.b2, c2: val(c.a2).fois(c.x).plus(val(c.b2).fois(c.y)), x: val(c.x), y: val(c.y) };
    s.methode = Math.abs(s.a1) === 1 ? 'substitution' : 'combinaison';
    return Q({
      type: 'probleme',
      enonce: '<p>' + c.texte + '</p><p>' + c.question + '</p><p>On note ' + O.echapper(c.inc) + '.</p>',
      consigne: 'Traduis la situation par un système, résous-le et écris le couple (x ; y).',
      reponse: { type: 'couple', x: s.x, y: s.y, lettres: ['x', 'y'], equations: [[srcXY(s.a1, s.b1), String(s.c1)], [srcXY(s.a2, s.b2), String(s.c2)]] },
      indice: 'Chaque phrase de l\'énoncé donne une équation.',
      etapes: [etape(1, 'Traduire par un système.', htmlSysteme(s))].concat(etapesSysteme(s).map(function (e, i) { e.titre = 'ÉTAPE ' + (i + 2); return e; })),
      verification: verifSysteme(s),
      rubrique: R.systemes,
      controle: { type: 'systeme', equations: [[srcXY(s.a1, s.b1), String(s.c1)], [srcXY(s.a2, s.b2), String(s.c2)]] }
    });
  }

  function genSystemeVF(alea, p) {
    var s = systemeAleatoire(alea, p);
    var cas = alea.choix(['vrai', 'une', 'inverse']);
    var cx = s.x, cy = s.y;
    if (cas === 'une') {
      // vérifie (1) mais pas (2) : on se déplace sur la droite (1)
      cx = s.x.plus(s.b1); cy = s.y.moins(s.a1);
    } else if (cas === 'inverse') { cx = s.y; cy = s.x; if (cx.egal(cy)) { cx = cx.plus(1); } }
    var v = { x: cx, y: cy };
    var e1 = Maths.evaluer(srcXY(s.a1, s.b1), v), e2 = Maths.evaluer(srcXY(s.a2, s.b2), v);
    var vrai = e1.egal(s.c1) && e2.egal(s.c2);
    return Q({
      type: 'vraifaux',
      enonce: '<p>Vrai ou faux ?</p><p class="affirmation">Le couple ' + hm(Maths.formaterCoordonnees(cx, cy)) + ' est solution du système</p>' + htmlSysteme(s),
      consigne: 'Choisis la réponse et sa justification.',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: O.optionsVraiFaux(alea, {
        vrai: vrai,
        justeVrai: 'il vérifie les deux équations : ' + tn(e1) + ' = ' + tn(s.c1) + ' et ' + tn(e2) + ' = ' + tn(s.c2) + '.',
        justeFaux: 'dans l\'équation ' + (e1.egal(s.c1) ? '(2), on obtient ' + tn(e2) + ' au lieu de ' + tn(s.c2) : '(1), on obtient ' + tn(e1) + ' au lieu de ' + tn(s.c1)) + '.',
        autresVrai: ['il vérifie au moins une des deux équations.'],
        autresFaux: ['un système a toujours plusieurs solutions.', 'il faudrait d\'abord résoudre le système.']
      }),
      indice: 'Un couple est solution du système s\'il vérifie LES DEUX équations.',
      etapes: [etape(1, 'Remplacer x et y dans chaque équation.', hm('(1) ' + O.substituerTexte(srcXY(s.a1, s.b1), v) + ' = ' + tn(e1) + ' ; (2) ' + O.substituerTexte(srcXY(s.a2, s.b2), v) + ' = ' + tn(e2)))],
      rubrique: R.systemes,
      controle: { type: 'systemeVF', equations: [[srcXY(s.a1, s.b1), String(s.c1)], [srcXY(s.a2, s.b2), String(s.c2)]], couple: [cx, cy], vrai: vrai }
    });
  }

  /* =====================================================================
   * Équations du deuxième degré (11e, niveau 2)
   * ===================================================================== */
  function genDeg2(alea, p) {
    var cas = ['x2n', 'produitNul', 'facteurCommun', 'diffCarres'];
    if (p >= 3) cas.push('viete', 'viete');
    if (p >= 5) cas.push('vieteIrr');
    var c = alea.choix(cas);
    var g, d = '0', sols, st = [], pieges = [];
    if (c === 'x2n') {
      var r = alea.entier(1, 12);
      var n = r * r, irr = false, vide = false;
      if (p >= 4 && alea.suivant() < 0.3) { n = alea.choix([2, 3, 5, 6, 7, 10, 11, 13]); irr = true; }
      if (p >= 4 && alea.suivant() < 0.15) { n = -alea.entier(1, 20); vide = true; irr = false; }
      g = 'x^2'; d = String(n);
      if (vide) { sols = []; st.push(etape(1, 'Un carré n\'est jamais négatif : x² = ' + tn(n) + ' n\'a pas de solution.', hm('S = { }'))); }
      else if (irr) { sols = ['-√' + n, '√' + n]; st.push(etape(1, 'Cas x² = n avec n > 0 : deux solutions opposées, √n et – √n.', hm('x = √' + n + ' ou x = – √' + n))); st.push(etape(2, 'Écrire l\'ensemble des solutions.', hm('S = { – √' + n + ' ; √' + n + ' }'))); }
      else { sols = [fr(-r), fr(r)]; pieges.push({ valeur: r, message: 'Il manque une solution : (– ' + r + ')² = ' + n + ' aussi.' }); st.push(etape(1, 'Cas x² = n avec n > 0 : deux solutions opposées, √n et – √n.', hm('x = √' + n + ' = ' + r + ' ou x = – √' + n + ' = – ' + r))); st.push(etape(2, 'Écrire l\'ensemble des solutions.', hm(Maths.formaterSolutions(sols)))); }
      if (alea.suivant() < 0.4 && !vide) { var k = alea.entier(1, 9); g = 'x^2+' + k; d = String(n + k); st.unshift(etape(0, 'Soustraire ' + k + ' aux deux membres (règle 2).', heq('x^2', String(n)))); }
    } else if (c === 'produitNul') {
      var a = alea.entierNonNul(-7, 7), b = alea.entierNonNul(-7, 7);
      var k2 = p >= 3 && alea.suivant() < 0.5 ? alea.entier(2, 4) : 1;
      var f1 = k2 === 1 ? P.src(O.lin(1, -a)) : P.src(O.lin(k2, -a));
      g = '(' + f1 + ')(' + P.src(O.lin(1, b)) + ')';
      sols = [fr(a, k2), fr(-b)];
      st.push(etape(1, 'Un produit est nul si et seulement si un des facteurs est nul.', hm(tx(f1) + ' = 0 ou ' + tx(P.src(O.lin(1, b))) + ' = 0')));
      st.push(etape(2, 'Résoudre chaque équation du premier degré.', hm('x = ' + tn(fr(a, k2)) + ' ou x = ' + tn(-b))));
      pieges.push({ valeur: -a, message: 'Attention au signe : x – ' + a + ' = 0 donne x = ' + a + '.' });
    } else if (c === 'facteurCommun') {
      var a3 = alea.entier(1, 5), b3 = alea.entierNonNul(-9, 9);
      g = P.src(P.plus(P.monome(a3, { x: 2 }), P.monome(b3, { x: 1 })));
      sols = [fr(0), fr(-b3, a3)];
      st.push(etape(1, 'Factoriser le membre de gauche (règle 1) : mettre x en évidence.', heq('x(' + P.src(O.lin(a3, b3)) + ')', '0')));
      st.push(etape(2, 'Produit nul : un des facteurs est nul.', hm('x = 0 ou ' + tx(P.src(O.lin(a3, b3))) + ' = 0')));
      st.push(etape(3, 'Écrire l\'ensemble des solutions.', hm(Maths.formaterSolutions(sols))));
      pieges.push({ valeur: fr(-b3, a3), message: 'Il manque la solution x = 0 : on ne divise jamais les deux membres par x (règle 3 : diviser par un nombre NON NUL).' });
    } else if (c === 'diffCarres') {
      var r4 = alea.entier(1, 9), a4 = p >= 3 ? alea.entier(1, 3) : 1;
      g = P.src(P.plus(P.monome(a4 * a4, { x: 2 }), P.constante(-r4 * r4)));
      sols = [fr(-r4, a4), fr(r4, a4)];
      var u = (a4 === 1 ? '' : a4) + 'x';
      st.push(etape(1, 'Factoriser avec un produit remarquable (règle 1) : a² – b² = (a + b)(a – b).', heq('(' + u + '+' + r4 + ')(' + u + '-' + r4 + ')', '0')));
      st.push(etape(2, 'Produit nul : un des facteurs est nul.', hm(tx(u + '+' + r4) + ' = 0 ou ' + tx(u + '-' + r4) + ' = 0')));
      st.push(etape(3, 'Écrire l\'ensemble des solutions.', hm(Maths.formaterSolutions(sols))));
    } else {
      var A, B, C, delta;
      if (c === 'vieteIrr') {
        do { A = 1; B = alea.entierNonNul(-6, 6); C = alea.entierNonNul(-6, 6); delta = B * B - 4 * A * C; } while (delta <= 0 || Number.isInteger(Math.sqrt(delta)));
      } else {
        var mode = p >= 4 ? alea.choix(['deux', 'deux', 'deux', 'une', 'aucune']) : 'deux';
        if (mode === 'aucune') { do { A = alea.entier(1, 3); B = alea.entier(-5, 5); C = alea.entier(1, 9); delta = B * B - 4 * A * C; } while (delta >= 0); }
        else {
          A = p >= 4 ? alea.entier(1, 3) : 1;
          var x1 = alea.entier(-6, 6), x2 = mode === 'une' ? x1 : alea.entier(-6, 6);
          if (mode === 'deux' && x1 === x2) x2++;
          // A(x – x1)(x – x2)
          B = -A * (x1 + x2); C = A * x1 * x2;
          if (A > 1 && alea.suivant() < 0.5 && mode === 'deux') { // racine fractionnaire : (Ax – m)(x – x2)
            var m = alea.choix([1, -1, 3, -3, 5]);
            if (O.pgcd(m, A) === 1) { B = -(m + A * x2); C = m * x2; }
          }
          delta = B * B - 4 * A * C;
        }
      }
      g = P.src(P.plus(P.monome(A, { x: 2 }), O.lin(B, C)));
      st.push(etape(1, 'L\'équation est de la forme ax² + bx + c = 0 avec a = ' + tn(A) + ', b = ' + tn(B) + ', c = ' + tn(C) + '. Calculer le discriminant.', hm('Δ = b² – 4ac = ' + O.tnp(B) + '² – 4 · ' + O.tnp(A) + ' · ' + O.tnp(C) + ' = ' + tn(delta))));
      if (delta < 0) { sols = []; st.push(etape(2, 'Δ < 0 : l\'équation n\'a pas de solution.', hm('S = { }'))); }
      else if (delta === 0) { sols = [fr(-B, 2 * A)]; st.push(etape(2, 'Δ = 0 : une seule solution, x = – b : 2a.', hm('x = ' + O.tnp(-B) + ' : ' + (2 * A) + ' = ' + tn(fr(-B, 2 * A))))); }
      else {
        var rd = Math.sqrt(delta);
        if (Number.isInteger(rd)) {
          sols = [fr(-B - rd, 2 * A), fr(-B + rd, 2 * A)];
          st.push(etape(2, 'Δ > 0 : deux solutions, x₁ et x₂ = (– b ± √Δ) : 2a (formule de Viète).', hm('x₁ = (' + tn(-B) + ' – ' + rd + ') : ' + (2 * A) + ' = ' + tn(sols[0]) + ' ; x₂ = (' + tn(-B) + ' + ' + rd + ') : ' + (2 * A) + ' = ' + tn(sols[1]))));
        } else {
          sols = ['(' + (-B) + '-√' + delta + ')/' + (2 * A), '(' + (-B) + '+√' + delta + ')/' + (2 * A)];
          st.push(etape(2, 'Δ > 0 : deux solutions, x₁ et x₂ = (– b ± √Δ) : 2a (formule de Viète). √' + delta + ' n\'est pas entier : on garde la racine.', hm('x₁ = (' + tn(-B) + ' – √' + delta + ')/' + (2 * A) + ' ; x₂ = (' + tn(-B) + ' + √' + delta + ')/' + (2 * A))));
        }
      }
      if (sols.length) st.push(etape(3, 'Écrire l\'ensemble des solutions.', hm(typeof sols[0] !== 'string' ? Maths.formaterSolutions(sols) : 'S = { ' + sols.map(tx).join(' ; ') + ' }')));
    }
    st = st.map(function (e, i) { e.titre = 'ÉTAPE ' + (i + 1); return e; });
    sols = sols.filter(function (v, i) { return typeof v === 'string' || !sols.slice(0, i).some(function (w) { return typeof w !== 'string' && val(w).egal(val(v)); }); });
    return Q({
      type: 'directe',
      enonce: '<p>Résous l\'équation du deuxième degré et écris l\'ensemble des solutions :</p><p class="calcul">' + heq(g, d) + '</p>',
      consigne: 'Sépare les solutions par un point-virgule : S = { – 2 ; 5 }. S\'il n\'y a pas de solution : S = { }.',
      reponse: { type: 'solutions', valeurs: sols, equation: [g, d], lettre: 'x' },
      pieges: pieges,
      indice: c === 'viete' || c === 'vieteIrr' ? 'Calcule le discriminant Δ = b² – 4ac, puis utilise la formule de Viète.' : (c === 'x2n' ? 'Un nombre et son opposé ont le même carré.' : 'Factorise le membre de gauche, puis utilise : un produit est nul si et seulement si un des facteurs est nul.'),
      etapes: st,
      verification: sols.length && typeof sols[0] !== 'string' ? 'Vérification : ' + sols.map(function (s) { var v = { x: s }; return 'pour x = ' + tn(s) + ', ' + hm(O.substituerTexte(g, v) + ' = ' + tn(Maths.evaluer(g, v))); }).join(' ; ') + '.' : '',
      rubrique: R.deuxieme,
      controle: { type: 'deg2', g: g, d: d, nb: sols.length }
    });
  }

  function genDeg2Probleme(alea, p) {
    var l = alea.entier(3, 12), a = alea.entier(1, 7);
    var aire = l * (l + a);
    var cs = alea.choix(['rect', 'nombre']);
    if (cs === 'rect') {
      return Q({
        type: 'probleme',
        enonce: '<p>Une plate-bande rectangulaire du jardin de l\'école a une aire de ' + aire + ' m². Sa longueur mesure ' + a + ' m de plus que sa largeur.</p><p>Quelle est sa largeur (en m) ?</p>',
        consigne: 'Traduis par une équation du deuxième degré, résous-la et garde la solution qui a un sens.',
        reponse: { type: 'nombre', valeur: fr(l) },
        pieges: [{ valeur: -(l + a), message: 'Cette solution de l\'équation est négative : une longueur ne peut pas être négative.' }],
        suffixe: 'm',
        indice: 'Avec x = la largeur : x(x + ' + a + ') = ' + aire + ', puis ramène tout dans le membre de gauche.',
        etapes: [
          etape(1, 'Inconnue : x = la largeur (en m). Équation :', heq('x(x+' + a + ')', String(aire))),
          etape(2, 'Ramener à la forme ax² + bx + c = 0 (règles 1 et 2).', heq(P.src(P.depuis('x^2+' + a + 'x-' + aire)), '0')),
          etape(3, 'Calculer le discriminant.', hm('Δ = ' + a + '² – 4 · 1 · (– ' + aire + ') = ' + (a * a + 4 * aire))),
          etape(4, 'Formule de Viète.', hm('x₁ = ' + tn(-(l + a)) + ' ; x₂ = ' + l)),
          etape(5, 'Une largeur est positive : on garde x = ' + l + '. La plate-bande mesure ' + l + ' m de large.', '')
        ],
        verification: 'Vérification : ' + l + ' · ' + (l + a) + ' = ' + aire + '.',
        rubrique: R.deuxieme,
        controle: { type: 'deg2pb', eq: ['x(x+' + a + ')', String(aire)], sol: l }
      });
    }
    var n = alea.entier(3, 15);
    return Q({
      type: 'probleme',
      enonce: '<p>Le produit de deux nombres entiers naturels consécutifs vaut ' + (n * (n + 1)) + '.</p><p>Quel est le plus petit de ces deux nombres ?</p>',
      consigne: 'Traduis par une équation du deuxième degré et résous-la.',
      reponse: { type: 'nombre', valeur: fr(n) },
      pieges: [{ valeur: -(n + 1), message: 'On cherche des entiers NATURELS : la solution négative ne convient pas.' }, { valeur: n + 1, message: 'C\'est le plus grand des deux nombres.' }],
      indice: 'Avec x = le plus petit nombre : x(x + 1) = ' + (n * (n + 1)) + '.',
      etapes: [
        etape(1, 'Inconnue : x = le plus petit nombre. Équation :', heq('x(x+1)', String(n * (n + 1)))),
        etape(2, 'Forme ax² + bx + c = 0.', heq('x^2+x-' + (n * (n + 1)), '0')),
        etape(3, 'Discriminant et formule de Viète.', hm('Δ = 1 + 4 · ' + (n * (n + 1)) + ' = ' + (1 + 4 * n * (n + 1)) + ' ; x₁ = – ' + (n + 1) + ' ; x₂ = ' + n)),
        etape(4, 'Les nombres sont des entiers naturels : on garde ' + n + '.', '')
      ],
      verification: 'Vérification : ' + n + ' · ' + (n + 1) + ' = ' + (n * (n + 1)) + '.',
      rubrique: R.deuxieme,
      controle: { type: 'deg2pb', eq: ['x(x+1)', String(n * (n + 1))], sol: n }
    });
  }

  /* =====================================================================
   * Catalogue des objectifs du module B
   * ===================================================================== */
  function plus1(gen) { return function (a, p, c) { return gen(a, Math.min(5, p + 1), c); }; }

  var objectifs = [
    { id: 'B10-voc', module: 'B', annee: 10, niveaux: [1, 2], theme: 'FA 10.3', titre: 'Équation, solution, équations équivalentes, règles d\'équivalence',
      modeles: [{ type: 'vraifaux', gen: genEstSolution }, { type: 'directe', gen: genRegles }] },
    { id: 'B10-res', module: 'B', annee: 10, niveaux: [1, 2], theme: 'FA 10.3', titre: 'Résoudre une équation du premier degré et vérifier la solution',
      modeles: [{ type: 'directe', gen: genResoudre }, { type: 'visuel', gen: genResoudreBalance }, { type: 'erreur', gen: genResoudreErreur }] },
    { id: 'B10-pb', module: 'B', annee: 10, niveaux: [1, 2], theme: 'FA 10.3', titre: 'Identifier l\'inconnue et traduire une situation par une équation',
      modeles: [{ type: 'directe', gen: genProblemeInconnue }, { type: 'traduction', gen: genProblemeEquation }, { type: 'probleme', gen: genProblemeResoudre }] },
    { id: 'B10-graph', module: 'B', annee: 10, niveaux: [2], theme: 'FA 10.3', titre: 'Résoudre une équation du premier degré par voie graphique',
      modeles: [{ type: 'visuel', gen: genGraphique }] },

    { id: 'B11-pb', module: 'B', annee: 11, niveaux: [1, 2], theme: 'FA 11.2', titre: 'Traduire une situation par une expression, puis par une équation',
      modeles: [{ type: 'traduction', gen: genProblemeExpression }, { type: 'probleme', gen: plus1(genProblemeResoudre) }, { type: 'traduction', gen: plus1(genProblemeEquation) }] },
    { id: 'B11-res', module: 'B', annee: 11, niveaux: [1, 2], theme: 'FA 11.2', titre: 'Résoudre une équation du premier degré',
      modeles: [{ type: 'directe', gen: plus1(genResoudre) }, { type: 'erreur', gen: plus1(genResoudreErreur) }] },
    { id: 'B11-form', module: 'B', annee: 11, niveaux: [1, 2], theme: 'FA 11.2', titre: 'Exprimer une variable d\'une formule en fonction des autres',
      modeles: [{ type: 'directe', gen: genFormule }] },
    { id: 'B11-graph', module: 'B', annee: 11, niveaux: [1, 2], theme: 'FA 11.2', titre: 'Résoudre une équation du premier degré par voie graphique',
      modeles: [{ type: 'visuel', gen: genGraphique }] },
    { id: 'B11-sys', module: 'B', annee: 11, niveaux: [2], theme: 'FA 11.2', titre: 'Systèmes de deux équations à deux inconnues',
      modeles: [{ type: 'directe', gen: genSysteme }, { type: 'probleme', gen: genSystemeProbleme }, { type: 'vraifaux', gen: genSystemeVF }] },
    { id: 'B11-deg2', module: 'B', annee: 11, niveaux: [2], theme: 'FA 11.2', titre: 'Équations du deuxième degré (factorisation, formule de Viète)',
      modeles: [{ type: 'directe', gen: genDeg2 }, { type: 'probleme', gen: genDeg2Probleme }] },
    { id: 'B11-deg2g', module: 'B', annee: 11, niveaux: [2], theme: 'FA 11.2', titre: 'Résoudre une équation du deuxième degré par voie graphique',
      modeles: [{ type: 'visuel', gen: genGraphiqueDeg2 }] }
  ];

  return {
    objectifs: objectifs,
    lineaire: lineaire,
    resoudreLineaire: resoudreLineaire,
    equationAleatoire: equationAleatoire,
    etapesLineaire: etapesLineaire,
    REGLES: REGLES
  };
});
