/*
 * algebre/js/module-a.js — Module A : calcul littéral (9e, 10e, 11e)
 * -------------------------------------------------------------------
 * Logique pure. Navigateur : objet global « AlgebreModuleA ». Node : require.
 * Chaque objectif : { id, module, annee, niveaux, theme, titre, modeles: [{ type, dMin?, dMax?, gen(alea, d, ctx) }] }
 * d = difficulté (1 à 4), calibrée selon l'année de l'objectif ; ctx = { annee, niveau, objectifAnnee }.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'));
  else racine.AlgebreModuleA = fabrique(racine.AlgebreOutils);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O) {
  'use strict';

  var Maths = O.Maths, P = O.P, F = O.F, R = O.RUBRIQUES;
  var tx = O.tx, hx = O.hx, hm = O.hm, hn = O.hn, tn = O.tn, fr = O.fr, val = O.val;

  function etape(n, texte, calcul) { return { titre: 'ÉTAPE ' + n, texte: texte, calcul: calcul || '' }; }
  function Q(q) { return O.finaliser(q); }
  function lettreAuHasard(alea) { return alea.choix(['x', 'x', 'a', 'y', 'b', 'n']); }
  function verifSubst(depart, resultat, valeurs, texteDepart) {
    var a = Maths.evaluer(depart, valeurs), b = Maths.evaluer(resultat, valeurs);
    return 'Vérification avec ' + O.texteValeurs(valeurs) + ' : ' + hm(texteDepart || tx(depart)) + ' vaut ' + hn(a) + ' et ' + hm(tx(resultat)) + ' vaut ' + hn(b) + '.';
  }
  function valeursTest(src) {
    var v = {};
    Maths.lettres(src).forEach(function (l, i) { v[l] = [2, 3, -1, 5][i % 4]; });
    return v;
  }

  /**
   * Question « repère l'erreur » : lignes successives d'un calcul (HTML),
   * l'erreur apparaît à la ligne « fausse » (indice dans lignes, ≥ 1).
   */
  function qErreur(alea, def) {
    var choix = [];
    for (var i = 1; i < def.lignes.length; i++) {
      choix.push({
        h: 'Ligne ' + (i + 1) + ' : ' + def.lignes[i],
        juste: i === def.fausse,
        message: i === def.fausse ? def.explication : 'La ligne ' + (i + 1) + ' est juste. ' + def.explication
      });
    }
    var calcul = '<ol class="calcul-eleve">' + def.lignes.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ol>';
    return Q({
      type: 'erreur',
      enonce: '<p>' + def.intro + '</p>' + calcul,
      consigne: 'À quelle ligne apparaît la première erreur ?',
      reponse: { type: 'choix' },
      mode: 'choix',
      choix: alea.melanger(choix),
      indice: def.indice || 'Contrôle chaque ligne en remplaçant la lettre par un nombre simple (par exemple 2) : deux lignes qui se suivent doivent donner la même valeur.',
      etapes: def.etapes,
      rubrique: def.rubrique,
      controle: def.controle
    });
  }

  /** Question « vrai ou faux » avec choix de la justification. */
  function qVraiFaux(alea, def) {
    return Q({
      type: 'vraifaux',
      enonce: '<p>Vrai ou faux ?</p><p class="affirmation">' + def.affirmation + '</p>',
      consigne: 'Choisis la réponse et sa justification.',
      reponse: { type: 'choix' },
      mode: 'choix',
      choix: O.optionsVraiFaux(alea, def),
      indice: def.indice || 'Pour montrer que deux expressions ne sont pas égales, un contre-exemple numérique suffit. Pour montrer qu\'elles sont égales, réduis-les.',
      etapes: def.etapes || [],
      rubrique: def.rubrique || R.egalite,
      controle: def.controle
    });
  }

  /* =====================================================================
   * 9e — conventions d'écriture
   * ===================================================================== */
  function casConvention(alea, p) {
    var l = alea.choix(['a', 'b', 'x', 'y']);
    var l2 = l === 'a' ? 'b' : (l === 'x' ? 'y' : (l === 'b' ? 'a' : 'x'));
    var lp = [l, l2].sort();
    var n = alea.entier(2, 9), m = alea.entier(3, 9);
    if (m === n) m = n === 9 ? 3 : n + 1;
    var cas = ['nx', 'xn', 'aa', 'un'];
    if (p >= 2) cas.push('nxm', 'aaa', 'nab', 'nmx');
    if (p >= 3) cas.push('2a3b', 'naba');
    if (p >= 4) cas.push('neg', 'neg1');
    var c = alea.choix(cas);
    switch (c) {
      case 'nx': return { t: n + ' · ' + l, src: n + '*' + l, att: n + l, pieges: [] };
      case 'xn': return { t: l + ' · ' + n, src: l + '*' + n, att: n + l, pieges: [], note: 'Le nombre s\'écrit devant la lettre.' };
      case 'aa': return { t: l + ' · ' + l, src: l + '*' + l, att: l + '^2', pieges: [{ src: '2' + l, message: l + ' · ' + l + ' = ' + l + '², alors que ' + l + ' + ' + l + ' = 2' + l + '.' }] };
      case 'un': return alea.suivant() < 0.5
        ? { t: '1 · ' + l, src: '1*' + l, att: l, pieges: [], note: 'Le coefficient 1 ne s\'écrit pas.' }
        : { t: l + ' · 1', src: l + '*1', att: l, pieges: [], note: 'Multiplier par 1 ne change rien.' };
      case 'nxm': return { t: n + ' · ' + l + ' · ' + m, src: n + '*' + l + '*' + m, att: (n * m) + l,
        pieges: [{ src: (n + m) + l, message: 'Il faut MULTIPLIER les nombres entre eux : ' + n + ' · ' + m + ' = ' + (n * m) + '.' }] };
      case 'nmx': return { t: n + ' · ' + m + l, src: n + '*' + m + l, att: (n * m) + l,
        pieges: [{ src: (n * m) + l + '^2', message: n + ' · ' + m + l + ' = ' + (n * m) + l + ' : un seul facteur contient ' + l + ', il n\'y a donc pas de ' + l + '² (2 · 3x = 6x, pas 6x²).' }] };
      case 'aaa': return { t: l + ' · ' + l + ' · ' + l, src: l + '*' + l + '*' + l, att: l + '^3',
        pieges: [{ src: '3' + l, message: l + ' · ' + l + ' · ' + l + ' = ' + l + '³ (trois facteurs égaux), alors que 3' + l + ' = ' + l + ' + ' + l + ' + ' + l + '.' }] };
      case 'nab': return { t: lp[1] + ' · ' + n + ' · ' + lp[0], src: lp[1] + '*' + n + '*' + lp[0], att: n + lp[0] + lp[1], pieges: [], note: 'Le nombre devant, puis les lettres (on peut les ranger par ordre alphabétique).' };
      case '2a3b': return { t: n + lp[0] + ' · ' + m + lp[1], src: n + lp[0] + '*' + m + lp[1], att: (n * m) + lp[0] + lp[1],
        pieges: [{ src: (n + m) + lp[0] + lp[1], message: 'On multiplie les coefficients : ' + n + ' · ' + m + ' = ' + (n * m) + '.' }] };
      case 'naba': return { t: n + ' · ' + lp[0] + ' · ' + lp[1] + ' · ' + lp[0], src: n + '*' + lp[0] + '*' + lp[1] + '*' + lp[0], att: n + lp[0] + '^2' + lp[1],
        pieges: [{ src: n + lp[0] + lp[1], message: 'La lettre ' + lp[0] + ' apparaît deux fois : ' + lp[0] + ' · ' + lp[0] + ' = ' + lp[0] + '².' }] };
      case 'neg': return { t: '(– ' + n + ') · ' + l + ' · ' + m, src: '(-' + n + ')*' + l + '*' + m, att: '-' + (n * m) + l,
        pieges: [{ src: (n * m) + l, message: 'Attention au signe : (– ' + n + ') · ' + m + ' = – ' + (n * m) + '.' }] };
      default: return { t: l + ' · (– 1)', src: l + '*(-1)', att: '-' + l, pieges: [{ src: l, message: 'Multiplier par (– 1) donne l\'opposé : – ' + l + '.' }], note: 'On écrit – ' + l + ' plutôt que – 1' + l + '.' };
    }
  }

  function genConventionsDirecte(alea, p) {
    var c = casConvention(alea, p);
    return Q({
      type: 'directe',
      enonce: '<p>Écris le plus simplement possible, en respectant les conventions d\'écriture :</p><p class="calcul">' + hm(c.t) + '</p>',
      reponse: { type: 'expr', attendu: c.att, forme: 'monome', depart: c.src },
      pieges: c.pieges,
      indice: 'On peut supprimer le « · » entre un nombre et une lettre (le nombre devant : 3 · x = 3x). ' + 'Un produit de lettres égales s\'écrit avec une puissance : a · a = a².',
      etapes: [
        etape(1, 'Regrouper les nombres, puis les lettres (on peut changer l\'ordre des facteurs d\'un produit).', hm(c.t)),
        etape(2, 'Calculer le produit des nombres et écrire les lettres égales avec un exposant.' + (c.note ? ' ' + c.note : ''), hm(c.t + ' = ' + tx(c.att)))
      ],
      verification: verifSubst(c.src, c.att, valeursTest(c.src), c.t),
      rubrique: R.conventions,
      controle: { type: 'expr' }
    });
  }

  function genConventionsVF(alea, p) {
    var l = alea.choix(['a', 'x', 'y']);
    var n = alea.entier(2, 9);
    var l2 = l === 'a' ? 'b' : 'z';
    var bank = [
      { aff: l + ' + ' + l + ' = ' + l + '²', vrai: false, a: l + '+' + l, b: l + '^2',
        justeFaux: l + ' + ' + l + ' = 2' + l + ' (deux fois ' + l + '), alors que ' + l + ' · ' + l + ' = ' + l + '².',
        autresFaux: ['on ne peut jamais additionner deux lettres.'],
        autresVrai: ['ajouter une lettre à elle-même donne son carré.', 'pour ' + l + ' = 2, les deux membres valent 4.'] },
      { aff: n + ' · ' + l + ' = ' + n + l, vrai: true, a: n + '*' + l, b: n + l,
        justeVrai: 'on peut supprimer le « · » entre un nombre et une lettre, le nombre étant écrit devant.',
        autresVrai: [n + l + ' signifie ' + n + ' + ' + l + '.'],
        autresFaux: ['le signe « · » ne peut jamais être supprimé.', n + l + ' est un nombre à deux chiffres.'] },
      { aff: l + ' · ' + l + ' = 2' + l, vrai: false, a: l + '*' + l, b: '2' + l,
        justeFaux: l + ' · ' + l + ' = ' + l + '². Par exemple, pour ' + l + ' = 3 : 3 · 3 = 9, alors que 2 · 3 = 6.',
        autresFaux: [l + ' · ' + l + ' = ' + l + '.'],
        autresVrai: ['la lettre ' + l + ' apparaît deux fois.', 'c\'est la même chose que ' + l + ' + ' + l + '.'] },
      { aff: n + ' · (' + l + ' + ' + l2 + ') = ' + n + '(' + l + ' + ' + l2 + ')', vrai: true, a: n + '*(' + l + '+' + l2 + ')', b: n + '(' + l + '+' + l2 + ')',
        justeVrai: 'on peut supprimer le « · » entre un nombre et une parenthèse.',
        autresVrai: [n + '(' + l + ' + ' + l2 + ') = ' + n + l + ' + ' + l2 + '.'],
        autresFaux: ['il faut toujours garder le « · » devant une parenthèse.', n + '(' + l + ' + ' + l2 + ') est une puissance.'] },
      { aff: '1' + l + ' = ' + l, vrai: true, a: '1*' + l, b: l,
        justeVrai: 'multiplier par 1 ne change rien : le coefficient 1 ne s\'écrit pas.',
        autresVrai: ['1' + l + ' vaut toujours 1.'],
        autresFaux: ['1' + l + ' = 1 + ' + l + '.', 'on ne peut jamais supprimer un nombre.'] },
      { aff: l + ' · ' + n + ' s\'écrit ' + l + n, vrai: false, conv: true,
        justeFaux: 'on écrit le nombre DEVANT la lettre : ' + l + ' · ' + n + ' = ' + n + l + '.',
        autresFaux: [l + ' · ' + n + ' = ' + l + ' + ' + n + '.'],
        autresVrai: ['on peut toujours supprimer le « · ».', 'l\'ordre des facteurs n\'a pas d\'importance.'] },
      { aff: l2 + ' · (' + l + ' + ' + n + ') = ' + l2 + '(' + l + ' + ' + n + ')', vrai: true, a: l2 + '*(' + l + '+' + n + ')', b: l2 + '(' + l + '+' + n + ')',
        justeVrai: 'on peut supprimer le « · » entre une lettre et une parenthèse.',
        autresVrai: [l2 + '(' + l + ' + ' + n + ') = ' + l2 + l + ' + ' + n + '.'],
        autresFaux: ['le « · » ne se supprime qu\'entre deux nombres.'] },
      { aff: '0 · ' + l + ' = ' + l, vrai: false, a: '0*' + l, b: l,
        justeFaux: '0 · ' + l + ' = 0, quelle que soit la valeur de ' + l + '.',
        autresFaux: ['0 · ' + l + ' = 1.'],
        autresVrai: ['multiplier par 0 ne change rien.', 'le 0 ne s\'écrit pas.'] }
    ];
    var c = alea.choix(bank);
    return qVraiFaux(alea, {
      affirmation: hm(c.aff),
      vrai: c.vrai, justeVrai: c.justeVrai, justeFaux: c.justeFaux, autresVrai: c.autresVrai, autresFaux: c.autresFaux,
      rubrique: R.conventions,
      indice: 'Relis les conventions d\'écriture : quand peut-on supprimer le « · » ? Teste aussi avec un nombre.',
      etapes: [etape(1, c.vrai ? 'L\'affirmation est vraie : ' + c.justeVrai : 'L\'affirmation est fausse : ' + c.justeFaux, hm(c.aff))],
      controle: c.conv ? { type: 'convention', vrai: c.vrai } : { type: 'egalite', a: c.a, b: c.b, vrai: c.vrai }
    });
  }

  function genConventionsErreur(alea, p) {
    var lignes = [], vus = {}, k = 0;
    while (lignes.length < 4 && k < 60) {
      k++;
      var c = casConvention(alea, Math.max(p, 2));
      if (vus[c.t]) continue;
      vus[c.t] = true;
      lignes.push(c);
    }
    var candidates = lignes.map(function (c, i) { return c.pieges.length ? i : -1; }).filter(function (i) { return i >= 1; });
    var fausse;
    if (candidates.length) fausse = alea.choix(candidates);
    else { fausse = alea.entier(1, 3); lignes[fausse] = { t: 'a · a', src: 'a*a', att: 'a^2', pieges: [{ src: '2a', message: 'a · a = a², alors que a + a = 2a.' }] }; }
    var faux = lignes[fausse].pieges[0];
    var paires = lignes.map(function (c, i) { return [c.src, i === fausse ? faux.src : c.att]; });
    var html = lignes.map(function (c, i) { return hm(c.t + ' = ' + tx(i === fausse ? faux.src : c.att)); });
    var choix = html.map(function (h, i) {
      return { h: 'Ligne ' + (i + 1) + ' : ' + h, juste: i === fausse, message: i === fausse ? faux.message : 'Cette ligne est juste. L\'erreur : ' + faux.message };
    });
    return Q({
      type: 'erreur',
      enonce: '<p>' + alea.choix(O.PRENOMS) + ' a simplifié l\'écriture de quatre produits. Une seule ligne est fausse.</p><ol class="calcul-eleve">' + html.map(function (h) { return '<li>' + h + '</li>'; }).join('') + '</ol>',
      consigne: 'Quelle ligne est fausse ?',
      reponse: { type: 'choix' }, mode: 'choix', choix: alea.melanger(choix),
      indice: 'Remplace la lettre par 2 dans chaque ligne : les deux membres doivent avoir la même valeur.',
      etapes: [etape(1, 'Ligne ' + (fausse + 1) + ' : ' + faux.message, hm(lignes[fausse].t + ' = ' + tx(lignes[fausse].att)))],
      rubrique: R.conventions,
      controle: { type: 'paires', paires: paires, fausse: fausse }
    });
  }

  /* =====================================================================
   * 9e — valeur numérique
   * ===================================================================== */
  /**
   * 9e : D1 a·x + b positifs (a, x ≤ 10) ; D2 carré ou parenthèse, x peut être négatif ;
   * D3 trois termes, x négatif ; D4 trois lettres.
   */
  function exprValeur(alea, p) {
    var a = alea.entier(2, 9), b = alea.entier(1, 15), c = alea.entier(1, 9);
    var s, v;
    if (p <= 1) {
      s = alea.choix([a + 'x+' + b, b + '+' + a + 'x', a + 'x']);
      v = { x: alea.entier(1, 10) };
    } else if (p === 2) {
      s = alea.choix([a + 'x^2+' + b, a + '(x+' + c + ')', a + 'x-' + b, b + '-' + c + 'x']);
      v = { x: alea.entier(1, 6) };
      if (alea.suivant() < 0.4) v.x = -alea.entier(1, 5);
    } else if (p === 3) {
      s = alea.choix([a + 'x^2-' + c + 'x+' + b, '-' + c + 'x^2+' + a + 'x-' + b, a + '(x-' + c + ')+' + b]);
      v = { x: -alea.entier(1, 5) };
    } else {
      var l = alea.melanger(['a', 'b', 'c']);
      s = alea.choix([
        a + 'a+' + c + 'b-c',
        'ab-' + c + 'c',
        a + 'a^2-bc',
        'a(b+c)-' + c + 'b',
        c + 'ab+ac-bc'
      ]);
      v = {};
      ['a', 'b', 'c'].forEach(function (k) { v[k] = alea.entierNonNul(-5, 6); });
      void l;
    }
    return { src: s, valeurs: v };
  }

  function valeurFautiveCarre(src, valeurs) {
    var p = P.depuis(src);
    var s = new F(0), different = false;
    p.forEach(function (m) {
      var t = m.c;
      for (var k in m.l) {
        var x = val(valeurs[k]);
        var e = m.l[k];
        var pw = x.abs().puissance(e);
        if (x.signe() < 0 && e % 2 === 1) pw = pw.oppose();
        if (x.signe() < 0 && e % 2 === 0) { pw = pw.oppose(); different = true; }
        t = t.fois(pw);
      }
      s = s.plus(t);
    });
    return different ? s : null;
  }

  function etapesValeur(src, valeurs) {
    var arbre = Maths.analyser(src);
    var termes = [];
    (function aplatir(n, signe) {
      if (!n.parentheses && (n.type === '+' || n.type === '-')) { aplatir(n.g, signe); aplatir(n.d, n.type === '-' ? -signe : signe); }
      else if (!n.parentheses && n.type === 'neg') aplatir(n.arg, -signe);
      else termes.push({ signe: signe, v: Maths.evaluer(n, valeurs) });
    })(arbre, 1);
    var somme = termes.map(function (t, i) {
      var v = t.signe < 0 ? t.v.oppose() : t.v;
      if (i === 0) return tn(v);
      return v.signe() < 0 ? '– ' + tn(v.abs()) : '+ ' + tn(v);
    }).join(' ');
    var resultat = Maths.evaluer(src, valeurs);
    var e = [
      etape(1, 'Remplacer ' + (Object.keys(valeurs).length > 1 ? 'chaque lettre par sa valeur' : 'la lettre par sa valeur') + ', en rajoutant les signes « · » (et des parenthèses autour des nombres négatifs).', hm(O.substituerTexte(src, valeurs)))
    ];
    if (termes.length > 1) {
      e.push(etape(2, 'Calculer les puissances, puis les produits (priorités des opérations).', hm(somme)));
      e.push(etape(3, 'Calculer la somme.', hm(somme + ' = ' + tn(resultat))));
    } else {
      e.push(etape(2, 'Calculer selon les priorités des opérations.', hm('= ' + tn(resultat))));
    }
    return e;
  }

  function genValeurDirecte(alea, p) {
    var e = exprValeur(alea, p);
    var resultat = Maths.evaluer(e.src, e.valeurs);
    var pieges = [];
    var vf = valeurFautiveCarre(e.src, e.valeurs);
    if (vf && !vf.egal(resultat)) pieges.push({ valeur: vf, message: 'Attention aux signes : le carré d\'un nombre négatif est positif, par exemple (– 2)² = (– 2) · (– 2) = 4.' });
    return Q({
      type: 'directe',
      enonce: '<p>Calcule la valeur numérique de l\'expression</p><p class="calcul">' + hx(e.src) + '</p><p>pour ' + hm(O.texteValeurs(e.valeurs)) + '.</p>',
      reponse: { type: 'nombre', valeur: resultat },
      pieges: pieges,
      indice: 'Remplace la lettre par sa valeur en rajoutant les « · », mets les nombres négatifs entre parenthèses, puis respecte les priorités : puissances, puis produits, puis sommes.',
      etapes: etapesValeur(e.src, e.valeurs),
      rubrique: R.valeur,
      visuel: null,
      controle: { type: 'valeur', expr: e.src, valeurs: e.valeurs }
    });
  }

  function genValeurMachine(alea, p) {
    var a = alea.choix(p <= 2 ? [2, 3, 4, 5] : [2, 3, 4, 5, -2, -3]);
    var b = p <= 1 ? alea.entier(1, 9) : alea.entierNonNul(-9, 12);
    var x0 = p <= 2 ? alea.entier(1, 8) : alea.entier(-6, 8);
    var src = O.P.src(O.lin(a, b));
    var cible = a * x0 + b;
    return Q({
      type: 'visuel',
      enonce: '<p>Pour quelle valeur de x l\'expression ' + hx(src) + ' vaut-elle ' + hn(cible) + ' ?</p>',
      consigne: 'Tu peux faire varier x avec la machine à substituer.',
      reponse: { type: 'nombre', valeur: fr(x0) },
      pieges: [{ valeur: cible, message: 'On demande la valeur de x, pas la valeur de l\'expression.' }],
      indice: 'Fais varier x : quand x augmente de 1, l\'expression ' + (a > 0 ? 'augmente' : 'diminue') + ' de ' + Math.abs(a) + '.',
      visuel: { type: 'machine', expressions: [src], lettres: ['x'], min: -10, max: 10, pas: 1 },
      etapes: [
        etape(1, 'Raisonner à rebours : on enlève d\'abord ' + tn(b) + ', puis on divise par ' + tn(a) + '.', hm('(' + tn(cible) + ' – ' + O.tnp(b) + ') : ' + O.tnp(a) + ' = ' + tn(x0))),
        etape(2, 'Contrôler par substitution.', hm(O.substituerTexte(src, { x: x0 }) + ' = ' + tn(cible)))
      ],
      rubrique: R.valeur,
      controle: { type: 'antecedent', expr: src, cible: cible }
    });
  }

  function pairesNonEgales(alea, p) {
    var n = alea.entier(2, 7), m = alea.entier(2, 6), k = alea.entier(2, 5);
    var bank = [
      [n + '+' + m + 'x', (n + m) + 'x', n + ' + ' + m + 'x ne se réduit pas : ' + n + ' et ' + m + 'x ne sont pas semblables.'],
      ['x^2', '2x', 'x² = x · x, alors que 2x = x + x.'],
      ['x+x', 'x^2', 'x + x = 2x, pas x².'],
      [m + 'x-x', String(m), m + 'x – x = ' + (m - 1) + 'x.']
    ];
    if (p >= 2) bank.push([k + '(x+' + n + ')', k + 'x+' + n, 'Il faut multiplier chaque terme de la parenthèse par ' + k + '.']);
    if (p >= 3) {
      bank.push(['(' + k + 'x)^2', k + 'x^2', '(' + k + 'x)² = ' + (k * k) + 'x² : le nombre aussi est au carré.']);
      bank.push(['-(x-' + n + ')', '-x-' + n, 'Le signe moins devant la parenthèse change le signe de TOUS les termes : – x + ' + n + '.']);
    }
    if (p >= 4) bank.push(['(x+' + n + ')^2', 'x^2+' + (n * n), '(x + ' + n + ')² n\'est pas x² + ' + (n * n) + ' : il manque le double produit.']);
    return alea.choix(bank);
  }

  function chercherValeurs(a, b) {
    var ex = null, pasEx = null;
    for (var i = 1; i <= 10 && (ex === null || pasEx === null); i++) {
      [i, -i, 0].forEach(function (x) {
        var v = { x: x };
        var eg = Maths.evaluer(a, v).egal(Maths.evaluer(b, v));
        if (!eg && ex === null) ex = x;
        if (eg && pasEx === null) pasEx = x;
      });
    }
    return { exemple: ex, pasExemple: pasEx };
  }

  function genContreExemple(alea, p) {
    var c = pairesNonEgales(alea, p);
    var v = chercherValeurs(c[0], c[1]);
    var vx = v.exemple;
    return Q({
      type: 'visuel',
      enonce: '<p>Les expressions ' + hx(c[0]) + ' et ' + hx(c[1]) + ' ne sont pas égales.</p><p>Prouve-le en donnant un <strong>contre-exemple</strong> : une valeur de x pour laquelle elles n\'ont pas la même valeur.</p>',
      consigne: 'Écris seulement la valeur de x. La machine à substituer peut t\'aider.',
      reponse: { type: 'contreexemple', a: c[0], b: c[1], lettre: 'x', exemple: fr(vx), pasExemple: v.pasExemple === null ? null : fr(v.pasExemple) },
      indice: 'Choisis un nombre simple (2, 3, 10…), calcule les deux expressions et compare. Attention : certaines valeurs donnent par hasard le même résultat.',
      visuel: { type: 'machine', expressions: [c[0], c[1]], lettres: ['x'], min: -10, max: 10, pas: 1 },
      etapes: [
        etape(1, 'Choisir une valeur de x, par exemple x = ' + tn(vx) + ', et calculer les deux expressions.', hm(O.substituerTexte(c[0], { x: vx }) + ' = ' + tn(Maths.evaluer(c[0], { x: vx })) + ' ; ' + O.substituerTexte(c[1], { x: vx }) + ' = ' + tn(Maths.evaluer(c[1], { x: vx })))),
        etape(2, 'Les deux valeurs sont différentes : un seul contre-exemple suffit pour prouver que les expressions ne sont pas égales. ' + c[2], '')
      ],
      rubrique: R.egalite,
      controle: { type: 'contreexemple', a: c[0], b: c[1] }
    });
  }

  /* =====================================================================
   * Figures géométriques (périmètre, aire)
   * ===================================================================== */
  /**
   * 9e : D1 périmètre, une lettre seule et des nombres ; D2 périmètre avec x + a ;
   * D3 aire (ou périmètre) ; D4 deux lettres, figure composée.
   * reduire (10e) : périmètre en D1-D2, aire à partir de D3 (monôme · polynôme).
   */
  function figureAleatoire(alea, p, reduire) {
    var a = alea.entier(2, 9), b = alea.entier(2, 6);
    var formes, quoi;
    if (p <= 1) { formes = ['rectSimple', 'carreSimple', 'triangleSimple']; quoi = 'perimetre'; }
    else if (p === 2) { formes = ['rect1', 'carre', 'triangle']; quoi = 'perimetre'; }
    else if (p === 3) { formes = ['rect1', 'rect2', 'carre']; quoi = alea.choix(['aire', 'aire', 'perimetre']); }
    else { formes = ['rectLettres', 'rectEnleve', 'rect3']; quoi = alea.choix(['aire', 'perimetre']); }
    var f = alea.choix(formes);
    if (/triangle/.test(f)) quoi = 'perimetre';
    if (!reduire && f === 'carre' && quoi === 'aire') f = 'rect2';
    var d;
    switch (f) {
      case 'rectSimple':
        d = { visuel: { forme: 'rectangle', longueur: 'x', largeur: String(a) }, L: 'x', l: String(a) }; break;
      case 'carreSimple':
        d = { visuel: { forme: 'carre', cote: 'x' }, L: 'x', l: 'x', carre: true }; break;
      case 'triangleSimple':
        d = { visuel: { forme: 'triangle', cotes: ['x', 'x', String(a)] }, triangle: ['x', 'x', String(a)] }; break;
      case 'rect1':
        d = { visuel: { forme: 'rectangle', longueur: 'x + ' + a, largeur: 'x' }, L: 'x+' + a, l: 'x' }; break;
      case 'rect2':
        d = { visuel: { forme: 'rectangle', longueur: b + 'x', largeur: String(a) }, L: b + 'x', l: String(a) }; break;
      case 'rect3':
        d = { visuel: { forme: 'rectangle', longueur: '2x + ' + a, largeur: 'x + ' + b }, L: '2x+' + a, l: 'x+' + b }; break;
      case 'rectLettres':
        d = { visuel: { forme: 'rectangle', longueur: 'a', largeur: 'b' }, L: 'a', l: 'b' }; break;
      case 'carre':
        d = { visuel: { forme: 'carre', cote: 'x + ' + a }, L: 'x+' + a, l: 'x+' + a, carre: true }; break;
      case 'triangle':
        d = { visuel: { forme: 'triangle', cotes: ['x', 'x + ' + a, '2x'] }, triangle: ['x', 'x+' + a, '2x'] }; break;
      default:
        d = { visuel: { forme: 'enleve', longueur: 'x', largeur: 'y', coin: String(a) }, L: 'x', l: 'y', coin: a };
    }
    if (reduire && f === 'rect3' && quoi === 'aire') quoi = 'perimetre';
    var att, formule, subst;
    if (d.triangle) {
      att = d.triangle.join('+');
      formule = 'P = somme des trois côtés';
      subst = 'P = ' + d.triangle.map(tx).join(' + ');
    } else if (quoi === 'perimetre') {
      if (d.coin) { att = '2x+2y'; formule = 'En déplaçant les deux petits côtés de l\'encoche, on retrouve le périmètre du grand rectangle : P = 2 · L + 2 · l'; subst = 'P = 2 · x + 2 · y'; }
      else if (d.carre) { att = '4(' + d.L + ')'; formule = 'P = 4 · c'; subst = 'P = 4 · ' + par(d.L); }
      else { att = '2(' + d.L + ')+2(' + d.l + ')'; formule = 'P = 2 · L + 2 · l'; subst = 'P = 2 · ' + par(d.L) + ' + 2 · ' + par(d.l); }
    } else {
      if (d.coin) { att = 'xy-' + (d.coin * d.coin); formule = 'A = aire du grand rectangle – aire du carré enlevé'; subst = 'A = x · y – ' + d.coin + '²'; }
      else if (d.carre) { att = '(' + d.L + ')^2'; formule = 'A = c · c = c²'; subst = 'A = (' + tx(d.L) + ')²'; }
      else { att = '(' + d.L + ')(' + d.l + ')'; formule = 'A = L · l'; subst = 'A = ' + par(d.L) + ' · ' + par(d.l); }
    }
    var reduit = P.texte(P.depuis(att));
    var pieges = [];
    if (!d.triangle) {
      var autre;
      if (quoi === 'perimetre') autre = d.coin ? 'xy-' + (d.coin * d.coin) : (d.carre ? '(' + d.L + ')^2' : '(' + d.L + ')(' + d.l + ')');
      else autre = d.coin ? '2x+2y' : (d.carre ? '4(' + d.L + ')' : '2(' + d.L + ')+2(' + d.l + ')');
      pieges.push({ src: autre, message: quoi === 'perimetre' ? 'Tu as calculé l\'aire. Le périmètre est la longueur du contour.' : 'Tu as calculé le périmètre. L\'aire est la mesure de la surface.' });
      if (quoi === 'perimetre' && !d.carre && !d.coin) pieges.push({ src: '(' + d.L + ')+(' + d.l + ')', message: 'Tu as calculé la moitié du périmètre : le contour comporte deux longueurs et deux largeurs.' });
    }
    return { d: d, quoi: quoi, att: att, reduit: reduit, formule: formule, subst: subst, pieges: pieges };
  }

  function par(s) { return /[+\-]/.test(s) ? '(' + tx(s) + ')' : tx(s); }

  function genFigure(alea, p, ctx, reduire) {
    var g = figureAleatoire(alea, p, reduire);
    var nom = g.quoi === 'perimetre' ? 'le périmètre P' : 'l\'aire A';
    var et = [
      etape(1, 'Écrire la formule.', hm(g.formule)),
      etape(2, 'Remplacer par les longueurs de la figure.', hm(g.subst))
    ];
    var simple = g.quoi === 'perimetre' || g.d.coin || g.d.visuel.forme === 'rectangle' && !/[+]/.test(g.d.L + g.d.l);
    if (reduire) et.push(etape(3, 'Développer et réduire.', hm((g.quoi === 'perimetre' ? 'P = ' : 'A = ') + g.reduit)));
    else if (simple) et.push(etape(3, 'On peut aussi écrire l\'expression sous forme réduite (toute expression égale est acceptée).', hm((g.quoi === 'perimetre' ? 'P = ' : 'A = ') + g.reduit)));
    return Q({
      type: 'directe',
      enonce: '<p>Exprime ' + nom + ' de cette figure en fonction de ' + (Maths.lettres(g.att).length > 1 ? Maths.lettres(g.att).join(' et de ') : Maths.lettres(g.att)[0]) + (reduire ? ', sous forme réduite' : '') + '.</p>',
      consigne: g.d.visuel.forme === 'triangle' ? 'Les longueurs sont dans la même unité.' : 'Les longueurs sont dans la même unité ; les angles marqués sont droits.',
      visuel: { type: 'figure', figure: g.d.visuel },
      reponse: { type: 'expr', attendu: reduire ? P.src(P.depuis(g.att)) : g.att, forme: reduire ? 'reduite' : null, nom: g.quoi === 'perimetre' ? 'P' : 'A' },
      attenduHtml: reduire ? hm(g.reduit) : hx(g.att) + (g.quoi === 'perimetre' ? ' = ' + hm(g.reduit) : ''),
      pieges: g.pieges,
      indice: g.quoi === 'perimetre' ? 'Le périmètre est la somme des longueurs de tous les côtés.' : 'Aire d\'un rectangle = longueur · largeur ; aire d\'un carré = côté · côté.',
      etapes: et,
      rubrique: R.expression,
      controle: { type: 'expr' }
    });
  }

  /* =====================================================================
   * Traduction phrase <-> expression
   * ===================================================================== */
  /** D1 : une opération sur x ; D2 : deux opérations (parenthèses) ; D3 : deux lettres ; D4 : produits et quotients de sommes. */
  function banqueTraduction(alea, p) {
    var n = alea.entier(2, 9), m = alea.entier(2, 9);
    while (m === n) m = alea.entier(2, 9);
    var b = [
      { ph: 'le double de x', src: '2x', voisins: [['le carré de x', 'x^2', 'Le double, c\'est 2 · x ; le carré, c\'est x · x.'], ['la moitié de x', 'x/2', '']] },
      { ph: 'le carré de x', src: 'x^2', voisins: [['le double de x', '2x', 'Le carré, c\'est x · x = x² ; le double, c\'est 2x.']] },
      { ph: 'la différence entre x et ' + n, src: 'x-' + n, voisins: [['la différence entre ' + n + ' et x', n + '-x', 'L\'ordre compte : la différence entre x et ' + n + ' s\'écrit x – ' + n + '.']] },
      { ph: 'le quotient de x par ' + n, src: 'x/' + n, voisins: [['le quotient de ' + n + ' par x', n + '/x', 'L\'ordre compte : le quotient de x par ' + n + ' s\'écrit x : ' + n + ' = x/' + n + '.']] },
      { ph: 'la somme de x et de ' + n, src: 'x+' + n, voisins: [['le produit de x par ' + n, n + 'x', 'Une somme est une addition : x + ' + n + '.']] }
    ];
    if (p >= 2) {
      b.push({ ph: 'le triple de x, augmenté de ' + n, src: '3x+' + n, voisins: [['le triple de la somme de x et de ' + n, '3(x+' + n + ')', 'Ici, on prend d\'abord le triple de x, PUIS on ajoute ' + n + '.']] });
      b.push({ ph: 'le triple de la somme de x et de ' + n, src: '3(x+' + n + ')', voisins: [['le triple de x, augmenté de ' + n, '3x+' + n, 'C\'est le triple de la SOMME : il faut des parenthèses, 3(x + ' + n + ').']] });
      b.push({ ph: 'la moitié de x, diminuée de ' + n, src: 'x/2-' + n, voisins: [['la moitié de la différence entre x et ' + n, '(x-' + n + ')/2', 'On prend d\'abord la moitié de x, puis on enlève ' + n + '.']] });
      b.push({ ph: 'le produit de ' + n + ' par x, diminué de ' + m, src: n + 'x-' + m, voisins: [['le produit de ' + n + ' par la différence entre x et ' + m, n + '(x-' + m + ')', 'On multiplie d\'abord x par ' + n + ', puis on enlève ' + m + '.']] });
      b.push({ ph: 'l\'opposé du double de x', src: '-2x', voisins: [['le double de x', '2x', 'L\'opposé change le signe : – 2x.']] });
    }
    if (p >= 3) {
      b.push({ ph: 'le carré de la somme de a et de b', src: '(a+b)^2', voisins: [['la somme des carrés de a et de b', 'a^2+b^2', '(a + b)² n\'est pas a² + b² : le carré de la somme n\'est pas la somme des carrés.']] });
      b.push({ ph: 'la somme des carrés de a et de b', src: 'a^2+b^2', voisins: [['le carré de la somme de a et de b', '(a+b)^2', 'La somme des carrés : a² + b². Le carré de la somme serait (a + b)².']] });
      b.push({ ph: 'le double de x, augmenté du triple de y', src: '2x+3y', voisins: [['le double de la somme de x et du triple de y', '2(x+3y)', 'On ajoute le triple de y au double de x : 2x + 3y.']] });
      b.push({ ph: 'le nombre entier qui suit l\'entier n', src: 'n+1', voisins: [['le nombre entier qui précède l\'entier n', 'n-1', 'Le suivant de n est n + 1.']] });
    }
    if (p >= 4) {
      b.push({ ph: 'le produit de deux nombres entiers consécutifs, le plus petit étant n', src: 'n(n+1)', voisins: [['la somme de deux nombres entiers consécutifs, le plus petit étant n', 'n+n+1', 'Le produit (multiplication) de n et de son suivant n + 1 : n(n + 1).']] });
      b.push({ ph: 'la différence des carrés de a et de b', src: 'a^2-b^2', voisins: [['le carré de la différence de a et de b', '(a-b)^2', 'La différence des carrés : a² – b².']] });
      b.push({ ph: 'le tiers de la somme de x et de ' + n, src: '(x+' + n + ')/3', voisins: [['la somme du tiers de x et de ' + n, 'x/3+' + n, 'C\'est le tiers de la SOMME : (x + ' + n + ') : 3.']] });
    }
    return b;
  }

  function genTraductionPhrase(alea, p) {
    var t = alea.choix(banqueTraduction(alea, p));
    var pieges = t.voisins.filter(function (v) { return v[2]; }).map(function (v) { return { src: v[1], message: v[2] }; });
    return Q({
      type: 'traduction',
      enonce: '<p>Traduis par une expression littérale :</p><p class="affirmation">« ' + t.ph + ' »</p>',
      reponse: { type: 'expr', attendu: t.src, forme: null, sansContreExemple: false },
      pieges: pieges,
      indice: 'Cherche la DERNIÈRE opération de la phrase : « le triple de la somme… » est un produit, « la somme du triple… » est une somme.',
      etapes: [
        etape(1, 'Repérer la dernière opération (somme, différence, produit, quotient, carré…).', echapperTexte(t.ph)),
        etape(2, 'Écrire l\'expression, avec des parenthèses si une somme ou une différence doit être calculée en premier.', hx(t.src))
      ],
      rubrique: R.expression,
      controle: { type: 'expr' }
    });
  }
  function echapperTexte(t) { return O.echapper('« ' + t + ' »'); }

  function genTraductionExpression(alea, p) {
    var banque = banqueTraduction(alea, p);
    var t = alea.choix(banque);
    var options = [{ h: t.ph, juste: true, message: '' }];
    t.voisins.forEach(function (v) { options.push({ h: v[0], juste: false, message: v[2] || 'Cette phrase correspond à ' + tx(v[1]) + '.' }); });
    var autres = alea.melanger(banque.filter(function (x) { return x !== t && !Maths.equivalentes(x.src, t.src); }));
    for (var i = 0; options.length < 4 && i < autres.length; i++) {
      if (options.some(function (o) { return o.h === autres[i].ph; })) continue;
      options.push({ h: autres[i].ph, juste: false, message: 'Cette phrase correspond à ' + tx(autres[i].src) + '.' });
    }
    return Q({
      type: 'traduction',
      enonce: '<p>Quelle phrase correspond à l\'expression ' + hx(t.src) + ' ?</p>',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: alea.melanger(options).map(function (o) { return { h: '« ' + O.echapper(o.h) + ' »', juste: o.juste, message: o.message }; }),
      indice: 'Quelle est la dernière opération à effectuer dans l\'expression ? C\'est elle qui donne le début de la phrase.',
      etapes: [etape(1, 'La dernière opération à effectuer donne le début de la phrase.', hx(t.src) + ' : « ' + O.echapper(t.ph) + ' »')],
      rubrique: R.sommeProduit,
      controle: { type: 'traduction', src: t.src, options: options.map(function (o) { return o.h; }) }
    });
  }

  /* =====================================================================
   * Problèmes (expression d'une situation)
   * ===================================================================== */
  /** Contextes : D1-D2 une lettre et des prix entiers ; D3 décimaux ou soustraction ; D4 deux lettres. */
  function contexteProbleme(alea, p) {
    var prenom = alea.choix(O.PRENOMS);
    var cs = [
      function () { var f = alea.choix([30, 40, 45, 60]), u = alea.choix(p >= 3 ? [4, 5, 6, 7.5, 8] : [4, 5, 6, 8]); return { texte: 'Une carte de piscine coûte ' + Maths.formaterMontant(f) + ', puis ' + Maths.formaterMontant(u) + ' par entrée.', lettre: 'n', sens: 'le nombre d\'entrées', grandeur: 'le prix total (en francs)', src: f + '+' + u + 'n', unite: 'francs' }; },
      function () { var f = alea.choix([10, 15, 20]), u = alea.choix(p >= 3 ? [2.5, 3, 4, 6] : [3, 4, 6]); return { texte: 'La location d\'un vélo électrique coûte ' + Maths.formaterMontant(f) + ' de base, plus ' + Maths.formaterMontant(u) + ' par heure.', lettre: 'h', sens: 'le nombre d\'heures', grandeur: 'le prix de la location (en francs)', src: f + '+' + u + 'h', unite: 'francs' }; },
      function () { var f = alea.choix([12, 18, 24]), u = alea.choix([4, 6, 8]); return { texte: 'Le toit de l\'école compte déjà ' + f + ' panneaux solaires. Chaque année, on en installe ' + u + ' de plus.', lettre: 'n', sens: 'le nombre d\'années', grandeur: 'le nombre de panneaux', src: f + '+' + u + 'n', unite: 'panneaux' }; },
      function () { var u = alea.choix([3, 4, 5]); var f = alea.choix([2, 3]); return { texte: 'Dans le jardin de l\'école, on plante des rangées de ' + u + ' salades. On a déjà planté ' + f + ' courges.', lettre: 'r', sens: 'le nombre de rangées', grandeur: 'le nombre total de plantes', src: u + 'r+' + f, unite: 'plantes' }; }
    ];
    if (p >= 3) cs.push(function () { var f = alea.choix([120, 150, 200]), u = alea.choix([15, 20, 25]); return { texte: prenom + ' a ' + Maths.formaterMontant(f) + ' dans sa tirelire et dépense ' + Maths.formaterMontant(u) + ' par mois pour son abonnement de téléphone.', lettre: 'm', sens: 'le nombre de mois', grandeur: 'le montant restant (en francs)', src: f + '-' + u + 'm', unite: 'francs' }; });
    if (p >= 4) {
      cs = [];
      cs.push(function () { return { texte: 'Au championnat de unihockey, une victoire rapporte 3 points et un match nul 1 point.', lettre: 'v', deux: true, sens: 'v le nombre de victoires et n le nombre de matchs nuls', grandeur: 'le nombre de points', src: '3v+n', unite: 'points', lettres: ['n', 'v'] }; });
      cs.push(function () { var a = alea.choix([18, 20, 24]), e = alea.choix([9, 10, 12]); return { texte: 'Au musée, un billet adulte coûte ' + Maths.formaterMontant(a) + ' et un billet enfant ' + Maths.formaterMontant(e) + '.', lettre: 'a', deux: true, sens: 'a le nombre d\'adultes et e le nombre d\'enfants', grandeur: 'le prix total (en francs)', src: a + 'a+' + e + 'e', unite: 'francs', lettres: ['a', 'e'] }; });
    }
    return alea.choix(cs)();
  }

  function genProblemeExpression(alea, p) {
    var c = contexteProbleme(alea, p);
    var ls = Maths.lettres(c.src);
    return Q({
      type: 'probleme',
      enonce: '<p>' + c.texte + '</p><p>On note ' + (c.deux ? c.sens : c.lettre + ' ' + c.sens) + '. Exprime ' + c.grandeur + ' en fonction de ' + ls.join(' et de ') + '.</p>',
      reponse: { type: 'expr', attendu: c.src, forme: null },
      pieges: c.deux ? [] : [{ src: c.src.replace(/[a-z]/, '').replace(/[+-]\d+(\.\d+)?$/, '') + '+' + c.lettre, message: 'Le nombre qui dépend de ' + c.lettre + ' doit être MULTIPLIÉ par ' + c.lettre + '.' }],
      indice: 'Écris d\'abord le calcul pour un exemple (par exemple 10), puis remplace l\'exemple par la lettre.',
      etapes: [
        etape(1, 'Faire le calcul pour un exemple, ici ' + O.texteValeurs(exempleValeurs(ls)) + '.', hm(O.substituerTexte(c.src, exempleValeurs(ls)) + ' = ' + tn(Maths.evaluer(c.src, exempleValeurs(ls))))),
        etape(2, 'Remplacer l\'exemple par la lettre.', hx(c.src))
      ],
      rubrique: R.expression,
      controle: { type: 'expr' }
    });
  }
  function exempleValeurs(ls) { var v = {}; ls.forEach(function (l, i) { v[l] = [10, 4][i] || 3; }); return v; }

  function genProblemeValeur(alea, p) {
    var c = contexteProbleme(alea, p);
    var ls = Maths.lettres(c.src);
    var v = {};
    ls.forEach(function (l) { v[l] = alea.entier(3, 12); });
    var res = Maths.evaluer(c.src, v);
    return Q({
      type: 'probleme',
      enonce: '<p>' + c.texte + '</p><p>On note ' + (c.deux ? c.sens : c.lettre + ' ' + c.sens) + '. ' + capitaliser(c.grandeur) + ' vaut ' + hx(c.src) + '.</p><p>Calcule ' + c.grandeur + ' pour ' + hm(O.texteValeurs(v)) + '.</p>',
      reponse: { type: 'nombre', valeur: res },
      suffixe: c.unite,
      indice: 'Remplace la lettre par sa valeur dans l\'expression, puis calcule.',
      etapes: etapesValeur(c.src, v),
      rubrique: R.valeur,
      controle: { type: 'valeur', expr: c.src, valeurs: v }
    });
  }
  /** 9e D4 : problème à deux étapes (écrire l'expression, puis la calculer). */
  function genProblemeDeuxEtapes(alea, p) {
    var c = contexteProbleme(alea, 4);
    var ls = Maths.lettres(c.src);
    var v = {};
    ls.forEach(function (l) { v[l] = alea.entier(2, 12); });
    var res = Maths.evaluer(c.src, v);
    return Q({
      type: 'probleme',
      enonce: '<p>' + c.texte + '</p><p>On note ' + c.sens + '.</p><p>1) Écris (pour toi) l\'expression de ' + c.grandeur + ' en fonction de ' + ls.join(' et de ') + '.<br>2) Calcule ' + c.grandeur + ' pour ' + hm(O.texteValeurs(v)) + '.</p>',
      consigne: 'Écris seulement le résultat du point 2.',
      reponse: { type: 'nombre', valeur: res },
      suffixe: c.unite,
      indice: 'Exprime d\'abord chaque partie (adultes, enfants…) en fonction de sa lettre, puis additionne.',
      etapes: [etape(1, 'Écrire l\'expression.', hx(c.src))].concat(etapesValeur(c.src, v).map(function (e, i) { e.titre = 'ÉTAPE ' + (i + 2); return e; })),
      rubrique: R.expression,
      controle: { type: 'valeur', expr: c.src, valeurs: v }
    });
  }
  function capitaliser(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  /* =====================================================================
   * 10e — monômes : vocabulaire
   * ===================================================================== */
  /** D1 : une lettre, coefficient positif ; D2 : deux lettres, négatifs ; D3-D4 : trois lettres, coefficient ± 1 possible. */
  function monomeAleatoire(alea, p, options) {
    options = options || {};
    var nbL = p <= 1 ? 1 : alea.entier(1, p >= 3 ? 3 : 2);
    var lettres = alea.melanger(['x', 'y', 'a', 'b']).slice(0, nbL).sort();
    var l = {};
    lettres.forEach(function (k) { l[k] = alea.entier(1, p >= 4 ? 4 : 3); });
    var c = p <= 1 ? alea.entier(2, 9) : alea.entierNonNul(-9, 9);
    if (p >= 3 && alea.suivant() < 0.2) c = alea.choix([1, -1]);
    return { c: val(c), l: l };
  }

  function genVocMonome(alea, p) {
    var m = monomeAleatoire(alea, p);
    var src = P.srcMonome(m);
    var quoi = alea.choix(['coef', 'degre', 'litterale']);
    var deg = P.degreMonome(m);
    var q;
    if (quoi === 'coef') {
      q = {
        enonce: '<p>Quel est le <strong>coefficient</strong> du monôme ' + hx(src) + ' ?</p>',
        reponse: { type: 'nombre', valeur: m.c },
        pieges: m.c.signe() < 0 ? [{ valeur: m.c.abs(), message: 'Le signe fait partie du coefficient.' }] : [],
        etapes: [etape(1, 'Le coefficient est le nombre qui multiplie la partie littérale (avec son signe). ' + (m.c.abs().egal(1) ? 'Quand on n\'écrit pas de nombre, le coefficient est ' + (m.c.signe() < 0 ? '– 1' : '1') + '.' : ''), hm(tx(src) + ' = ' + O.tnp(m.c) + ' · ' + P.partieLitterale(m)))],
        controle: { type: 'monome', src: src, quoi: 'coef' }
      };
    } else if (quoi === 'degre') {
      var exps = Object.keys(m.l).map(function (k) { return m.l[k]; });
      q = {
        enonce: '<p>Quel est le <strong>degré</strong> du monôme ' + hx(src) + ' ?</p>',
        reponse: { type: 'nombre', valeur: fr(deg) },
        pieges: [{ valeur: Math.max.apply(null, exps), message: 'Le degré est la SOMME des exposants de toutes les lettres, pas le plus grand exposant.' },
          { valeur: Object.keys(m.l).length, message: 'Le degré est la somme des exposants, pas le nombre de lettres.' }].filter(function (pg) { return pg.valeur !== deg; }),
        etapes: [etape(1, 'Additionner les exposants de la partie littérale (une lettre sans exposant a l\'exposant 1).', hm(Object.keys(m.l).sort().map(function (k) { return k + ' : ' + m.l[k]; }).join(' ; ') + ' → ' + exps.join(' + ') + ' = ' + deg))],
        controle: { type: 'monome', src: src, quoi: 'degre' }
      };
    } else {
      var pl = P.srcMonome({ c: fr(1), l: m.l });
      q = {
        enonce: '<p>Quelle est la <strong>partie littérale</strong> du monôme ' + hx(src) + ' ?</p>',
        reponse: { type: 'expr', attendu: pl, forme: 'monome' },
        pieges: [],
        etapes: [etape(1, 'La partie littérale est formée des lettres avec leurs exposants (sans le coefficient).', hx(pl))],
        controle: { type: 'monome', src: src, quoi: 'litterale' }
      };
    }
    q.type = 'directe';
    q.indice = 'Un monôme est le produit d\'un nombre (le coefficient) par une ou des lettres (la partie littérale). Son degré est la somme des exposants des lettres.';
    q.rubrique = R.monome;
    return Q(q);
  }

  function genSemblables(alea, p) {
    var m = monomeAleatoire(alea, Math.max(p, 2));
    if (Object.keys(m.l).length < 2) { m.l = { x: 2, y: 1 }; }
    var ks = Object.keys(m.l).sort();
    var bonne = { c: val(alea.entierNonNul(-9, 9)), l: m.l };
    if (bonne.c.egal(m.c)) bonne.c = bonne.c.plus(1);
    var echange = {}; echange[ks[0]] = m.l[ks[1]]; echange[ks[1]] = m.l[ks[0]];
    var plus = JSON.parse(JSON.stringify(m.l)); plus[ks[0]] += 1;
    var moinsUne = {}; moinsUne[ks[0]] = m.l[ks[0]];
    var opts = [{ m: bonne, juste: true, message: 'Même partie littérale : ce sont des monômes semblables (seul le coefficient change).' }];
    if (m.l[ks[0]] !== m.l[ks[1]]) opts.push({ m: { c: m.c, l: echange }, juste: false, message: 'Les exposants ne sont pas portés par les mêmes lettres : la partie littérale est différente.' });
    opts.push({ m: { c: m.c, l: plus }, juste: false, message: 'Un exposant est différent : la partie littérale n\'est pas la même.' });
    opts.push({ m: { c: m.c, l: moinsUne }, juste: false, message: 'Il manque une lettre : la partie littérale n\'est pas la même.' });
    return Q({
      type: 'directe',
      enonce: '<p>Quel monôme est <strong>semblable</strong> à ' + hx(P.srcMonome(m)) + ' ?</p>',
      reponse: { type: 'choix' }, mode: 'choix',
      choix: alea.melanger(opts).map(function (o) { return { h: hx(P.srcMonome(o.m)), juste: o.juste, message: o.message }; }),
      indice: 'Des monômes semblables ont exactement la même partie littérale (mêmes lettres, mêmes exposants). Le coefficient peut être différent.',
      etapes: [etape(1, 'Comparer les parties littérales : seule ' + hx(P.srcMonome({ c: fr(1), l: m.l })) + ' convient.', hx(P.srcMonome(bonne)))],
      rubrique: R.monome,
      controle: { type: 'semblables', ref: P.srcMonome(m), options: opts.map(function (o) { return { src: P.srcMonome(o.m), juste: o.juste }; }) }
    });
  }

  function genVocVF(alea, p) {
    var n = alea.entier(2, 9), k = alea.entier(2, 4);
    var bank = [
      { aff: n + 'x²y est un monôme de degré 2', vrai: false, justeFaux: 'le degré est la somme des exposants : 2 + 1 = 3.', autresFaux: ['ce n\'est pas un monôme.'], autresVrai: ['le plus grand exposant est 2.', 'il y a deux lettres.'] },
      { aff: n + ' est un monôme de degré 0', vrai: true, justeVrai: 'un nombre seul est un monôme sans partie littérale : son degré est 0.', autresVrai: [n + ' n\'a pas de lettre, donc pas de degré.'], autresFaux: ['un monôme contient toujours une lettre.', 'son degré est ' + n + '.'] },
      { aff: 'x + ' + n + ' est un monôme', vrai: false, justeFaux: 'c\'est une somme de deux monômes : un polynôme de deux termes.', autresFaux: ['un monôme ne contient pas de lettre.'], autresVrai: ['il contient une seule lettre.', 'il est de degré 1.'] },
      { aff: 'le coefficient de – x³ est – 1', vrai: true, justeVrai: '– x³ = (– 1) · x³.', autresVrai: ['le coefficient est toujours – 1.'], autresFaux: ['il n\'y a pas de coefficient.', 'le coefficient est 3.'] },
      { aff: k + 'ab et ' + (k + 1) + 'ba sont des monômes semblables', vrai: true, justeVrai: 'ba = ab : ils ont la même partie littérale.', autresVrai: ['ils ont le même degré.'], autresFaux: ['les lettres ne sont pas dans le même ordre.', 'les coefficients sont différents.'] },
      { aff: n + 'x² et ' + n + 'x³ sont des monômes semblables', vrai: false, justeFaux: 'les exposants de x sont différents : les parties littérales x² et x³ ne sont pas les mêmes.', autresFaux: ['ils n\'ont pas le même coefficient.'], autresVrai: ['ils ont le même coefficient.', 'ils contiennent la même lettre.'] }
    ];
    var c = alea.choix(bank);
    return qVraiFaux(alea, {
      affirmation: hm(c.aff) + '.', vrai: c.vrai, justeVrai: c.justeVrai, justeFaux: c.justeFaux, autresVrai: c.autresVrai, autresFaux: c.autresFaux,
      rubrique: R.monome,
      indice: 'Monôme : produit d\'un nombre par des lettres. Degré : somme des exposants. Semblables : même partie littérale.',
      etapes: [etape(1, c.vrai ? 'Vrai : ' + c.justeVrai : 'Faux : ' + c.justeFaux, '')],
      controle: { type: 'convention', vrai: c.vrai }
    });
  }

  /* =====================================================================
   * 10e — opérations sur les monômes
   * ===================================================================== */
  function genOperationsMonomes(alea, p) {
    // D1 : somme de deux monômes semblables positifs ; D2 : somme avec négatifs ou produit simple ;
    // D3 : produits avec négatifs, deux lettres ; D4 : idem, plus de termes.
    var op = alea.choix(p <= 1 ? ['somme'] : (p === 2 ? ['somme', 'produit'] : ['somme', 'produit', 'produit']));
    var lettres = p >= 3 && alea.suivant() < 0.6 ? alea.choix([['a', 'b'], ['x', 'y']]) : [alea.choix(['x', 'a', 'y'])];
    function pl() { var l = {}; lettres.forEach(function (k) { l[k] = alea.entier(1, p >= 3 ? 3 : 2); }); return l; }
    function c() { var v = (p <= 1 || (p === 2 && op === 'produit')) ? alea.entier(2, 9) : alea.entierNonNul(-9, 9); return val(v); }
    var src, att, pieges = [], etapes, txt;
    if (op === 'somme') {
      var l = pl();
      var nb = p <= 1 ? 2 : (p === 2 ? alea.entier(2, 3) : 3);
      var ms = [], tot = new F(0);
      for (var i = 0; i < nb; i++) { var cc = c(); ms.push({ c: cc, l: l }); tot = tot.plus(cc); }
      if (tot.estZero()) { ms[0].c = ms[0].c.plus(1); tot = tot.plus(1); }
      src = O.srcTermes(ms);
      att = P.srcMonome({ c: tot, l: l });
      txt = tx(src);
      var plFaux = JSON.parse(JSON.stringify(l)); var k0 = Object.keys(plFaux)[0]; plFaux[k0] = plFaux[k0] * nb;
      pieges.push({ src: P.srcMonome({ c: tot, l: plFaux }), message: 'Pour additionner des monômes semblables, on additionne les coefficients ; la partie littérale ne change pas.' });
      etapes = [
        etape(1, 'Les monômes sont semblables (même partie littérale ' + P.partieLitterale({ l: l }) + ') : on additionne les coefficients.', hm(ms.map(function (m, i) { return i === 0 ? tn(m.c) : (m.c.signe() < 0 ? '– ' + tn(m.c.abs()) : '+ ' + tn(m.c)); }).join(' ') + ' = ' + tn(tot))),
        etape(2, 'Écrire le résultat avec la partie littérale.', hm(txt + ' = ' + tx(att)))
      ];
    } else if (op === 'produit') {
      var m1 = { c: c(), l: pl() }, m2 = { c: c(), l: pl() };
      // nombre · monôme (2 · 3x = 6x, pas 6x²)
      if (p <= 2 && alea.suivant() < 0.5) {
        m1 = { c: c(), l: {} };
        var lPlus = JSON.parse(JSON.stringify(m2.l)); var kk = Object.keys(lPlus)[0]; lPlus[kk] += 1;
        pieges.push({ src: P.srcMonome({ c: m1.c.fois(m2.c), l: lPlus }), message: tn(m1.c) + ' · ' + tx(P.srcMonome(m2)) + ' = ' + tx(P.srcMonome({ c: m1.c.fois(m2.c), l: m2.l })) + ' : seul un facteur contient la lettre, l\'exposant ne change pas (2 · 3x = 6x, pas 6x²).' });
      }
      var prod = P.fois([m1], [m2])[0];
      src = P.srcMonome(m1) + '*' + (m2.c.signe() < 0 ? '(' + P.srcMonome(m2) + ')' : P.srcMonome(m2));
      txt = tx(P.srcMonome(m1)) + ' · ' + (m2.c.signe() < 0 ? '(' + tx(P.srcMonome(m2)) + ')' : tx(P.srcMonome(m2)));
      att = P.srcMonome(prod);
      var lMul = {}; Object.keys(prod.l).forEach(function (k) { lMul[k] = (m1.l[k] || 1) * (m2.l[k] || 1); });
      if (P.cle(lMul) !== P.cle(prod.l)) pieges.push({ src: P.srcMonome({ c: prod.c, l: lMul }), message: 'Pour multiplier des puissances d\'une même lettre, on ADDITIONNE les exposants : x² · x³ = x⁵.' });
      pieges.push({ src: P.srcMonome({ c: m1.c.plus(m2.c).estZero() ? fr(1) : m1.c.plus(m2.c), l: prod.l }), message: 'Dans un produit, on MULTIPLIE les coefficients.' });
      etapes = [
        etape(1, 'Multiplier les coefficients (règle des signes).', hm(O.tnp(m1.c) + ' · ' + O.tnp(m2.c) + ' = ' + tn(prod.c))),
        etape(2, 'Multiplier les parties littérales : pour une même lettre, on additionne les exposants.', hm(P.partieLitterale(m1) + ' · ' + P.partieLitterale(m2) + ' = ' + P.partieLitterale(prod))),
        etape(3, 'Écrire le résultat.', hm(txt + ' = ' + tx(att)))
      ];
    } else {
      var m = { c: val(alea.entierNonNul(-4, 4)), l: pl() };
      var e = alea.entier(2, 3);
      var pw = P.puissance([m], e)[0];
      src = '(' + P.srcMonome(m) + ')^' + e;
      txt = tx(src);
      att = P.srcMonome(pw);
      pieges.push({ src: P.srcMonome({ c: m.c.fois(e), l: pw.l }), message: 'Le coefficient aussi est élevé à la puissance : (' + tn(m.c) + ')' + P.exposantTexte(e) + ' = ' + tn(m.c.puissance(e)) + '.' });
      etapes = [
        etape(1, 'Élever le coefficient à la puissance ' + e + '.', hm(O.tnp(m.c) + P.exposantTexte(e) + ' = ' + tn(m.c.puissance(e)))),
        etape(2, 'Pour la partie littérale, multiplier chaque exposant par ' + e + '.', hm(txt + ' = ' + tx(att)))
      ];
    }
    return Q({
      type: 'directe',
      enonce: '<p>Calcule et écris le résultat sous la forme d\'un seul monôme :</p><p class="calcul">' + hm(txt) + '</p>',
      reponse: { type: 'expr', attendu: att, forme: 'monome', depart: src },
      pieges: pieges,
      indice: op === 'somme' ? 'Monômes semblables : on additionne les coefficients, la partie littérale reste la même.' : 'On multiplie les coefficients entre eux, puis les lettres entre elles (en additionnant les exposants d\'une même lettre).',
      etapes: etapes,
      verification: verifSubst(src, att, valeursTest(src)),
      rubrique: R.monome,
      controle: { type: 'expr' }
    });
  }

  function genMonomesVF(alea, p) {
    var a = alea.entier(2, 6), b = alea.entier(3, 7);
    if (a === b) b++;
    var bank = [
      { a: a + 'a+' + b + 'b', b: (a + b) + 'ab', aff: a + 'a + ' + b + 'b = ' + (a + b) + 'ab', vrai: false,
        justeFaux: a + 'a + ' + b + 'b ne se réduit pas : ' + a + 'a et ' + b + 'b ne sont pas semblables. Contre-exemple : pour a = 2 et b = 1, le membre de gauche vaut ' + (2 * a + b) + ' et celui de droite ' + (2 * (a + b)) + '.',
        autresFaux: ['on doit écrire ' + (a + b) + 'a + b.'], autresVrai: ['on additionne les coefficients et on garde les lettres.', 'c\'est vrai pour a = 0 et b = 0.'] },
      { a: a + 'x*' + b + 'x', b: (a * b) + 'x^2', aff: a + 'x · ' + b + 'x = ' + (a * b) + 'x²', vrai: true,
        justeVrai: 'on multiplie les coefficients (' + a + ' · ' + b + ' = ' + (a * b) + ') et x · x = x².',
        autresVrai: ['on additionne les exposants des coefficients.'], autresFaux: ['le résultat est ' + (a + b) + 'x.', 'le résultat est ' + (a * b) + 'x.'] },
      { a: 'x^2+x^2', b: 'x^4', aff: 'x² + x² = x⁴', vrai: false,
        justeFaux: 'x² + x² = 2x² (on additionne les coefficients). Pour x = 2 : 4 + 4 = 8, alors que 2⁴ = 16.',
        autresFaux: ['x² + x² = x²'], autresVrai: ['on additionne les exposants.', 'pour x = 0, les deux membres valent 0.'] },
      { a: 'x^2*x^3', b: 'x^6', aff: 'x² · x³ = x⁶', vrai: false,
        justeFaux: 'x² · x³ = x⁵ : on additionne les exposants (2 + 3 = 5).',
        autresFaux: ['x² · x³ = 2x⁵.'], autresVrai: ['on multiplie les exposants : 2 · 3 = 6.'] },
      { a: a + 'x-' + (a + 1) + 'x', b: '-x', aff: a + 'x – ' + (a + 1) + 'x = – x', vrai: true,
        justeVrai: a + ' – ' + (a + 1) + ' = – 1, donc le résultat est – 1x = – x.',
        autresVrai: ['on ne peut pas obtenir un coefficient négatif.'], autresFaux: ['le résultat est x.', 'le résultat est – 1.'] }
    ];
    var c = alea.choix(bank);
    return qVraiFaux(alea, {
      affirmation: hm(c.aff), vrai: c.vrai, justeVrai: c.justeVrai, justeFaux: c.justeFaux, autresVrai: c.autresVrai, autresFaux: c.autresFaux,
      rubrique: R.monome,
      etapes: [etape(1, c.vrai ? 'Vrai : ' + c.justeVrai : 'Faux : ' + c.justeFaux, '')],
      controle: { type: 'egalite', a: c.a, b: c.b, vrai: c.vrai }
    });
  }

  /* =====================================================================
   * 10e — réduire et ordonner
   * ===================================================================== */
  /**
   * Termes à réduire.
   * 9e : D1 deux monômes en x positifs ; D2 2-3 termes positifs (x et nombres) ;
   *      D3 3-4 termes avec négatifs ; D4 4 termes, deux lettres.
   * 10e : D1 2-3 termes positifs ; D2 3-4 termes avec négatifs ; D3 4-5 termes avec x² ;
   *      D4 4-6 termes, deux variables.
   */
  function termesAReduire(alea, p, annee) {
    annee = annee || 10;
    var cfg;
    if (annee <= 9) cfg = [null, { n: [2, 2], cles: [1], neg: false }, { n: [2, 3], cles: [1, 0], neg: false }, { n: [3, 4], cles: [1, 0], neg: true }, { n: [4, 4], deux: true, cles: ['a', 'b', '0'], neg: true }][p];
    else cfg = [null, { n: [2, 3], cles: [1, 0], neg: false }, { n: [3, 4], cles: [1, 0], neg: true }, { n: [4, 5], cles: [2, 1, 0], neg: true }, { n: [4, 6], deux: true, cles: ['a2', 'ab', 'a', 'b', '0'], neg: true }][p];
    var essais = 0;
    for (;;) {
      essais++;
      var lettres = cfg.deux ? alea.choix([['a', 'b'], ['x', 'y']]) : ['x'];
      var n = alea.entier(cfg.n[0], cfg.n[1]);
      var termes = [];
      for (var i = 0; i < n; i++) {
        var k = alea.choix(cfg.cles);
        var l = {};
        if (!cfg.deux) { if (k > 0) l[lettres[0]] = k; }
        else if (k === 'a2') l[lettres[0]] = 2;
        else if (k === 'ab') { l[lettres[0]] = 1; l[lettres[1]] = 1; }
        else if (k === 'a') l[lettres[0]] = 1;
        else if (k === 'b') l[lettres[1]] = 1;
        var c = cfg.neg ? alea.entierNonNul(-9, 9) : alea.entier(1, 9);
        termes.push({ c: val(c), l: l });
      }
      var red = P.plus(termes, []);
      var cles2 = termes.map(function (m) { return P.cle(m.l); });
      var semblables = cles2.some(function (c, i) { return cles2.indexOf(c) !== i; });
      var minRed = n <= 2 ? 1 : 2;
      if ((red.length >= minRed && semblables && red.length < termes.length) || essais > 80) return { termes: termes, red: red, lettres: lettres };
    }
  }

  function etapesReduction(termes, red, ordre) {
    var groupes = {};
    var ordreCles = [];
    termes.forEach(function (m) { var k = P.cle(m.l); if (!groupes[k]) { groupes[k] = []; ordreCles.push(k); } groupes[k].push(m); });
    ordreCles.sort(function (a, b) { return P.comparer(groupes[a][0], groupes[b][0]); });
    var regroupe = [];
    ordreCles.forEach(function (k) { regroupe = regroupe.concat(groupes[k]); });
    var details = ordreCles.map(function (k) {
      var g = groupes[k];
      var tot = g.reduce(function (s, m) { return s.plus(m.c); }, new F(0));
      return hm(tx(O.srcTermes(g)) + ' = ' + (tot.estZero() ? '0' : tx(P.srcMonome({ c: tot, l: g[0].l }))));
    }).join('<br>');
    return [
      etape(1, 'Repérer les monômes semblables (même partie littérale) et les regrouper, chacun avec son signe.', hx(O.srcTermes(regroupe))),
      etape(2, 'Additionner les coefficients des monômes semblables.', details),
      etape(3, ordre ? 'Écrire le polynôme réduit et ordonné (degrés décroissants).' : 'Écrire le polynôme réduit.', hx(P.src(red)))
    ];
  }

  function genReduire(alea, p, ctx) {
    var annee = ctx && ctx.objectifAnnee || 10;
    var t = termesAReduire(alea, p, annee);
    var src = O.srcTermes(t.termes);
    var ordonner = annee >= 10 && p >= 3 && t.lettres.length === 1 && alea.suivant() < 0.6;
    var tuiles = t.lettres.length === 1 && t.termes.every(function (m) { return m.c.abs().compare(5) <= 0; }) &&
      t.termes.reduce(function (s, m) { return s + Number(m.c.abs().num); }, 0) <= 24;
    var pieges = [];
    var toutMelange = t.termes.reduce(function (s, m) { return s.plus(m.c); }, new F(0));
    var lettrePrinc = t.lettres[0];
    if (!toutMelange.estZero()) {
      var l = {}; l[lettrePrinc] = 1;
      pieges.push({ src: P.srcMonome({ c: toutMelange, l: l }), message: 'Tu as additionné des termes qui ne sont pas semblables : 3a + 2b ne fait pas 5ab, et 4 + 5x² ne fait pas 9x² (ces sommes ne se réduisent pas).' });
    }
    return Q({
      type: tuiles && p <= 3 ? 'visuel' : 'directe',
      enonce: '<p>' + (ordonner ? 'Réduis et ordonne' : 'Réduis') + ' le polynôme</p><p class="calcul">' + hx(src) + '</p>',
      consigne: tuiles && p <= 3 ? 'Les tuiles algébriques montrent les termes : touche deux tuiles opposées pour les annuler, ou regroupe les tuiles semblables.' : '',
      reponse: { type: 'expr', attendu: P.src(t.red), forme: ordonner ? 'ordonnee' : 'reduite', depart: src, lettre: t.lettres.length === 1 ? t.lettres[0] : null },
      pieges: pieges,
      visuel: tuiles && p <= 3 ? { type: 'tuiles', mode: 'reduction', termes: t.termes.map(function (m) { return { c: Number(m.c.num), d: P.degreMonome(m) }; }), lettre: t.lettres[0] } : null,
      indice: 'Réduire, c\'est additionner les monômes semblables. Attention : chaque terme garde le signe qui le précède.',
      etapes: etapesReduction(t.termes, t.red, ordonner),
      verification: verifSubst(src, P.src(t.red), valeursTest(src)),
      rubrique: ordonner ? R.ordonner : R.reduction,
      controle: { type: 'expr' }
    });
  }

  /** Termes regroupés : liste de groupes de monômes semblables, du plus haut degré au plus bas. */
  function grouper(termes) {
    var groupes = {}, ordreCles = [];
    termes.forEach(function (m) { var k = P.cle(m.l); if (!groupes[k]) { groupes[k] = []; ordreCles.push(k); } groupes[k].push(m); });
    ordreCles.sort(function (a, b) { return P.comparer(groupes[a][0], groupes[b][0]); });
    return ordreCles.map(function (k) { return groupes[k]; });
  }
  /** Ligne intermédiaire : (c1 + c2)x² + … (coefficients des monômes semblables entre parenthèses). */
  function ligneCoefficients(termes) {
    var morceaux = grouper(termes).map(function (g) {
      if (g.length === 1) return P.srcMonome(g[0]);
      var coefs = g.map(function (m, i) {
        var t = m.c.abs().toString();
        if (i === 0) return (m.c.signe() < 0 ? '-' : '') + t;
        return (m.c.signe() < 0 ? '-' : '+') + t;
      }).join('');
      var pl = P.srcMonome({ c: fr(1), l: g[0].l });
      return '(' + coefs + ')' + (pl === '1' ? '' : pl);
    });
    return morceaux.map(function (m, i) { return i === 0 || m.charAt(0) === '-' ? m : '+' + m; }).join('');
  }

  /** 10e D4 : réduire une expression à deux variables, puis l'évaluer. */
  function genReduireEvaluer(alea, p) {
    var t = termesAReduire(alea, 4, 10);
    var src = O.srcTermes(t.termes);
    var v = {};
    t.lettres.forEach(function (l) { v[l] = alea.entierNonNul(-4, 5); });
    var red = P.src(t.red);
    var res = Maths.evaluer(red, v);
    return Q({
      type: 'directe',
      enonce: '<p>Réduis l\'expression</p><p class="calcul">' + hx(src) + '</p><p>puis calcule sa valeur pour ' + hm(O.texteValeurs(v)) + '.</p>',
      consigne: 'Écris seulement la valeur finale.',
      reponse: { type: 'nombre', valeur: res },
      indice: 'Réduis d\'abord (moins de calculs), puis remplace chaque lettre par sa valeur.',
      etapes: etapesReduction(t.termes, t.red, false).concat(etapesValeur(red, v).map(function (e, i) { e.titre = 'ÉTAPE ' + (i + 4); return e; })),
      rubrique: R.valeur,
      controle: { type: 'valeur', expr: src, valeurs: v }
    });
  }

  function genReduireErreur(alea, p) {
    var t = termesAReduire(alea, Math.max(2, p), 10);
    var regroupe = [];
    grouper(t.termes).forEach(function (g) { regroupe = regroupe.concat(g); });
    var lignes = [O.srcTermes(t.termes), O.srcTermes(regroupe), ligneCoefficients(regroupe), P.src(t.red)];
    var typeErr = alea.choix(['signe', 'melange', 'coef']);
    var explication, fausse;
    if (typeErr === 'signe') {
      // un terme déplacé perd son signe moins
      var idx = regroupe.findIndex(function (m, i) { return i > 0 && m.c.signe() < 0; });
      if (idx < 0) typeErr = 'coef';
      else {
        var faux1 = regroupe.map(function (m, i) { return i === idx ? { c: m.c.oppose(), l: m.l } : m; });
        if (P.plus(faux1, []).length === 0) typeErr = 'coef';
        else {
          lignes[1] = O.srcTermes(faux1);
          lignes[2] = ligneCoefficients(faux1);
          lignes[3] = P.src(P.plus(faux1, []));
          fausse = 1;
          explication = 'En déplaçant le terme ' + tx(P.srcMonome(regroupe[idx])) + ', l\'élève a changé son signe. Un terme garde toujours le signe qui le précède.';
        }
      }
    }
    if (typeErr === 'melange') {
      var red = t.red;
      var j = red.findIndex(function (m, i) { return i < red.length - 1 && Object.keys(m.l).length && Object.keys(red[i + 1].l).length; });
      if (j < 0 || red.length < 2) typeErr = 'coef';
      else {
        var fusion = { c: red[j].c.plus(red[j + 1].c), l: red[j].l };
        if (fusion.c.estZero()) fusion.c = fr(1);
        lignes[3] = O.srcTermes(red.slice(0, j).concat([fusion]).concat(red.slice(j + 2)));
        fausse = 3;
        explication = tx(P.srcMonome(red[j])) + ' et ' + tx(P.srcMonome({ c: red[j + 1].c.abs(), l: red[j + 1].l })) + ' ne sont pas semblables : on ne peut pas les additionner.';
      }
    }
    if (typeErr === 'coef') {
      var k2 = alea.entier(0, t.red.length - 1);
      var faux3 = t.red.map(function (m, i) { return i === k2 ? { c: m.c.plus(m.c.signe() < 0 ? -2 : 2), l: m.l } : m; });
      lignes[3] = O.srcTermes(faux3);
      fausse = 3;
      explication = 'Erreur dans le calcul des coefficients du terme ' + (Object.keys(t.red[k2].l).length ? 'en ' + P.partieLitterale(t.red[k2]) : 'constant') + ' : le bon résultat est ' + tx(P.srcMonome(t.red[k2])) + '.';
    }
    return qErreur(alea, {
      intro: alea.choix(O.PRENOMS) + ' a réduit un polynôme. Son calcul contient une erreur.',
      lignes: lignes.map(function (s, i) { return hm((i === 0 ? 'A = ' : '   = ') + tx(s)); }),
      fausse: fausse,
      explication: explication,
      etapes: etapesReduction(t.termes, t.red, true),
      rubrique: R.reduction,
      controle: { type: 'lignes', lignes: lignes, fausse: fausse }
    });
  }

  function genReduireVF(alea, p) {
    var n = alea.entier(2, 9), m = alea.entier(2, 9);
    var bank = [
      { a: n + '+' + m + 'x', b: (n + m) + 'x', vrai: false },
      { a: n + '+' + m + 'x^2', b: n + '+' + m + 'x^2', aff: n + ' + ' + m + 'x² ne se réduit pas', vrai: true, special: true },
      { a: n + 'x+' + m + 'x', b: (n + m) + 'x', vrai: true },
      { a: n + 'x^2+' + m + 'x', b: (n + m) + 'x^3', vrai: false },
      { a: n + 'x-' + m + '-x', b: (n - 1) + 'x-' + m, vrai: true },
      { a: n + 'x^2-x^2', b: String(n), vrai: false }
    ];
    var c = alea.choix(bank);
    var aff = c.aff || (tx(c.a) + ' = ' + tx(c.b));
    var ce = c.vrai ? null : O.contreExemple(c.a, c.b);
    var red = P.texte(P.depuis(c.a));
    return qVraiFaux(alea, {
      affirmation: hm(aff), vrai: c.vrai,
      justeVrai: c.special ? n + ' et ' + m + 'x² ne sont pas semblables (pas la même partie littérale).' : 'en réduisant le membre de gauche, on obtient ' + red + '.',
      justeFaux: ce ? 'pour ' + O.texteValeurs(ce.valeurs) + ', ' + tx(c.a) + ' vaut ' + tn(ce.va) + ' et ' + tx(c.b) + ' vaut ' + tn(ce.vb) + ' (contre-exemple).' : '',
      autresVrai: c.vrai ? ['les deux membres ont les mêmes lettres.'] : ['on additionne tous les coefficients.', 'les deux membres contiennent la lettre x.'],
      autresFaux: c.vrai ? ['pour x = 0, les deux membres ont une valeur différente.', 'on ne peut jamais additionner des monômes.'] : ['les coefficients sont différents.'],
      rubrique: c.special ? R.reduction : R.egalite,
      etapes: [etape(1, c.vrai ? 'On réduit le membre de gauche : on obtient le membre de droite.' : 'Un contre-exemple suffit à prouver que l\'égalité est fausse.', ce ? hm(O.substituerTexte(c.a, ce.valeurs) + ' = ' + tn(ce.va) + ' ≠ ' + tn(ce.vb)) : hm(tx(c.a) + ' = ' + red))],
      controle: { type: 'egalite', a: c.a, b: c.b, vrai: c.vrai }
    });
  }

  /* =====================================================================
   * 10e — distributivité, suppression de parenthèses
   * ===================================================================== */
  function genDistributivite(alea, p) {
    // D1 : k(ax + b) positifs ; D2 : signe moins, monôme · polynôme ; D3 : somme ou différence de produits ;
    // D4 : trois termes ou deux variables.
    var k = alea.entier(2, 7);
    var a = alea.entier(1, 6), b = p <= 1 ? alea.entier(1, 9) : alea.entierNonNul(-9, 9);
    var cas = p <= 1 ? ['k(ax+b)'] : (p === 2 ? ['-k(ax+b)', '-(ax+b)', 'kx(ax+b)'] : (p === 3 ? ['a-(bx+c)', 'k(..)-m(..)', 'k(..)-m(..)'] : ['kx(ax2+bx+c)', 'ka(a+b)', 'k(..)-m(..)']));
    var c = alea.choix(cas);
    var src, pieges = [], etapes, visuel = null;
    var inner = P.src(O.lin(a, b));
    if (c === 'k(ax+b)') {
      src = k + '(' + inner + ')';
      pieges.push({ src: P.src(O.lin(k * a, b)), message: 'Tu n\'as multiplié que le premier terme : ' + k + ' multiplie CHAQUE terme de la parenthèse.' });
      if (b > 0 && a <= 3 && k <= 4) visuel = { type: 'aire', f1: [0, k], f2: [a, b], lettre: 'x' };
    } else if (c === '-k(ax+b)') {
      src = '-' + k + '(' + inner + ')';
      pieges.push({ src: P.src(O.lin(-k * a, k * b)), message: 'Tu as oublié de distribuer le signe moins au deuxième terme : – ' + k + ' · ' + O.tnp(b) + ' = ' + tn(-k * b) + '.' });
    } else if (c === '-(ax+b)') {
      src = '-(' + inner + ')';
      pieges.push({ src: P.src(O.lin(-a, b)), message: 'Tu as oublié de distribuer le signe moins : il change le signe de TOUS les termes de la parenthèse.' });
    } else if (c === 'kx(ax+b)') {
      src = k + 'x(' + inner + ')';
      pieges.push({ src: P.src(P.plus(P.monome(k * a, { x: 1 }), P.monome(k * b, { x: 1 }))), message: 'x · x = x² : le premier produit est ' + tx((k * a) + 'x^2') + '.' });
    } else if (c === 'a-(bx+c)') {
      var d = alea.entier(2, 9);
      src = d + 'x-(' + inner + ')';
      pieges.push({ src: P.src(P.plus(P.monome(d - a, { x: 1 }), P.constante(b))), message: 'Tu as oublié de distribuer le signe moins : – (' + tx(inner) + ') = ' + P.texte(P.oppose(O.lin(a, b))) + '.' });
    } else if (c === 'ka(a+b)') {
      var bb = alea.entierNonNul(-6, 6);
      src = k + 'a(' + P.src(P.plus(P.monome(a, { a: 1 }), P.monome(bb, { b: 1 }))) + ')';
    } else if (c === 'kx(ax2+bx+c)') {
      var e2 = alea.entierNonNul(-5, 5);
      src = '-' + k + 'x(' + P.src(P.plus(P.monome(a, { x: 2 }), O.lin(b, e2))) + ')';
    } else {
      var m = alea.entier(2, 6), a2 = alea.entier(1, 5), b2 = alea.entierNonNul(-8, 8);
      if (k * a === m * a2) a2 = a2 === 5 ? 1 : a2 + 1;
      var inner2 = P.src(O.lin(a2, b2));
      src = k + '(' + inner + ')-' + m + '(' + inner2 + ')';
      pieges.push({ src: P.src(P.plus(P.fois(P.constante(k), O.lin(a, b)), P.plus(P.monome(-m * a2, { x: 1 }), P.constante(m * b2)))), message: 'Tu as oublié de distribuer le signe moins : – ' + m + ' · ' + O.tnp(b2) + ' = ' + tn(-m * b2) + '.' });
    }
    var res = P.depuis(src);
    var dev = developpementDetaille(src);
    etapes = [etape(1, 'Distribuer : multiplier chaque terme de la parenthèse par le facteur devant (avec son signe).', hm(produitsDetailles(src) + ' = ' + dev))];
    if (dev.replace(/\s/g, '') !== P.texte(res).replace(/\s/g, '')) etapes.push(etape(2, 'Réduire.', hp(res)));
    return Q({
      type: visuel ? 'visuel' : 'directe',
      enonce: '<p>Développe et réduis :</p><p class="calcul">' + hx(src) + '</p>',
      consigne: visuel ? 'Le rectangle des tuiles montre le produit : touche les cases pour les remplir.' : '',
      reponse: { type: 'expr', attendu: P.src(res), forme: 'reduite', depart: src },
      pieges: pieges,
      visuel: visuel,
      indice: 'Le facteur devant la parenthèse multiplie CHAQUE terme de la parenthèse. Un signe « – » devant une parenthèse change le signe de tous ses termes.',
      etapes: etapes,
      verification: verifSubst(src, P.src(res), valeursTest(src)),
      rubrique: R.developper,
      controle: { type: 'expr' }
    });
  }
  function hp(p) { return hx(P.src(p)); }

  /** Texte du développement terme à terme d'une expression : k(a + b) -> ka + kb (non réduit). */
  function developpementDetaille(src) {
    var arbre = Maths.analyser(src);
    var termes = [];
    (function aplatir(n, signe) {
      if (!n.parentheses && (n.type === '+' || n.type === '-')) { aplatir(n.g, signe); aplatir(n.d, n.type === '-' ? -signe : signe); }
      else if (n.type === 'neg' && !n.parentheses) aplatir(n.arg, -signe);
      else termes.push({ signe: signe, n: n });
    })(arbre, 1);
    var mon = [];
    termes.forEach(function (t) {
      var p = P.depuis(t.n);
      // développement terme à terme sans réduire entre facteurs : on garde l'ordre des produits
      if (t.n.type === '*' || (t.n.type === 'neg')) {
        var facteurs = [];
        (function af(n) { if (n.type === '*') { af(n.g); af(n.d); } else facteurs.push(n); })(t.n.type === 'neg' ? t.n.arg : t.n);
        var produits = [P.constante(t.n.type === 'neg' ? -t.signe : t.signe)];
        facteurs.forEach(function (f) {
          var pf = P.depuis(f);
          var ordre = P.ordonner(pf, { ordre: 'tel' });
          var nouv = [];
          produits.forEach(function (pp) { ordre.forEach(function (m) { nouv.push(P.fois(pp, [m])); }); });
          produits = nouv;
        });
        produits.forEach(function (pp) { if (pp.length) mon.push(pp[0]); });
      } else {
        P.ordonner(p, { ordre: 'tel' }).forEach(function (m) { mon.push({ c: t.signe < 0 ? m.c.oppose() : m.c, l: m.l }); });
      }
    });
    return tx(O.srcTermes(mon));
  }

  /** « 4 · 5x + 4 · (– 8) » : produits de la distributivité, avant calcul. */
  function produitsDetailles(src) {
    var arbre = Maths.analyser(src);
    var termes = [];
    (function aplatir(n, signe) {
      if (!n.parentheses && (n.type === '+' || n.type === '-')) { aplatir(n.g, signe); aplatir(n.d, n.type === '-' ? -signe : signe); }
      else if (n.type === 'neg' && !n.parentheses) aplatir(n.arg, -signe);
      else termes.push({ signe: signe, n: n });
    })(arbre, 1);
    var morceaux = [];
    termes.forEach(function (t) {
      var facteurs = [];
      (function af(n) { if (n.type === '*') { af(n.g); af(n.d); } else facteurs.push(n); })(t.n);
      var listes = facteurs.map(function (f) { return P.ordonner(P.depuis(f), { ordre: 'tel' }); });
      // signe du terme reporté sur le premier facteur
      if (t.signe < 0) listes[0] = listes[0].map(function (m) { return { c: m.c.oppose(), l: m.l }; });
      if (listes.every(function (l) { return l.length <= 1; })) {
        var pr = listes.reduce(function (acc, l) { return P.fois(acc, l); }, P.constante(1));
        morceaux.push(pr.length ? P.texteMonome(pr[0]) : '0');
        return;
      }
      var combos = [[]];
      listes.forEach(function (liste) {
        var n2 = [];
        combos.forEach(function (c) { liste.forEach(function (m) { n2.push(c.concat([m])); }); });
        combos = n2;
      });
      combos.forEach(function (c) {
        morceaux.push(c.map(function (m, i) {
          var tm = P.texteMonome(m);
          return (i > 0 && m.c.signe() < 0) ? '(' + tm + ')' : tm;
        }).join(' · '));
      });
    });
    return morceaux.map(function (m, i) {
      if (i === 0) return m;
      return m.charAt(0) === '–' ? '– ' + m.slice(2) : '+ ' + m;
    }).join(' ');
  }

  function genDistributiviteErreur(alea, p) {
    var k = alea.entier(2, 6), a = alea.entier(1, 5), b = alea.entier(1, 9), m = alea.entier(2, 6), a2 = alea.entier(1, 4), b2 = alea.entier(1, 8);
    var src0 = k + '(' + P.src(O.lin(a, b)) + ')-' + m + '(' + P.src(O.lin(a2, -b2)) + ')';
    var bonnes = [O.srcTermes([O.mo(k * a, 'x'), O.mo(k * b), O.mo(-m * a2, 'x'), O.mo(m * b2)])];
    var red = P.depuis(src0);
    var typeErr = alea.choix(['signe', 'partiel']);
    var lignes, explication;
    if (typeErr === 'signe') {
      var faux = O.srcTermes([O.mo(k * a, 'x'), O.mo(k * b), O.mo(-m * a2, 'x'), O.mo(-m * b2)]);
      lignes = [src0, faux, P.src(P.depuis(faux))];
      explication = 'Ligne 2 : l\'élève a oublié de distribuer le signe moins au deuxième terme : – ' + m + ' · (– ' + b2 + ') = + ' + (m * b2) + '.';
    } else {
      var faux2 = O.srcTermes([O.mo(k * a, 'x'), O.mo(b), O.mo(-m * a2, 'x'), O.mo(m * b2)]);
      lignes = [src0, faux2, P.src(P.depuis(faux2))];
      explication = 'Ligne 2 : ' + k + ' ne multiplie pas seulement le premier terme : ' + k + ' · ' + b + ' = ' + (k * b) + '.';
    }
    return qErreur(alea, {
      intro: alea.choix(O.PRENOMS) + ' a développé et réduit une expression. Son calcul contient une erreur.',
      lignes: lignes.map(function (s, i) { return hm((i === 0 ? 'B = ' : '  = ') + tx(s)); }),
      fausse: 1,
      explication: explication,
      etapes: [etape(1, 'Distribuer chaque facteur avec son signe.', hx(bonnes[0])), etape(2, 'Réduire.', hp(red))],
      rubrique: R.parentheses,
      controle: { type: 'lignes', lignes: lignes, fausse: 1 }
    });
  }

  /* =====================================================================
   * Addition, soustraction, multiplication de polynômes
   * ===================================================================== */
  function polyAleatoire(alea, p, nTermes, degMax) {
    var t = [];
    var degres = alea.melanger([0, 1, 2, 3].filter(function (d) { return d <= degMax; })).slice(0, nTermes);
    degres.forEach(function (d) { var l = {}; if (d) l.x = d; t.push({ c: val(alea.entierNonNul(-9, 9)), l: l }); });
    return P.plus(t, []);
  }

  /**
   * D1 : somme de deux binômes positifs ; D2 : somme ou différence de binômes avec négatifs ;
   * D3 : différence de polynômes de 3 termes (x²) ; D4 : deux variables.
   */
  function genAddSousPolynomes(alea, p) {
    function poly() {
      var t;
      if (p <= 2) t = [{ c: val(p <= 1 ? alea.entier(1, 9) : alea.entierNonNul(-9, 9)), l: { x: 1 } }, { c: val(p <= 1 ? alea.entier(1, 9) : alea.entierNonNul(-9, 9)), l: {} }];
      else if (p === 3) t = [{ c: val(alea.entierNonNul(-9, 9)), l: { x: 2 } }, { c: val(alea.entierNonNul(-9, 9)), l: { x: 1 } }, { c: val(alea.entierNonNul(-9, 9)), l: {} }];
      else t = [{ c: val(alea.entierNonNul(-9, 9)), l: { a: 2 } }, { c: val(alea.entierNonNul(-9, 9)), l: { a: 1, b: 1 } }, { c: val(alea.entierNonNul(-9, 9)), l: { b: 2 } }];
      return P.plus(t, []);
    }
    var A = poly(), B = poly();
    var sous = p >= 3 || (p === 2 && alea.suivant() < 0.5);
    var src = '(' + P.src(A) + ')' + (sous ? '-' : '+') + '(' + P.src(B) + ')';
    var affiche = '(' + P.texte(A) + ') ' + (sous ? '–' : '+') + ' (' + P.texte(B) + ')';
    var res = sous ? P.moins(A, B) : P.plus(A, B);
    if (res.length === 0) return genAddSousPolynomes(alea, p);
    var pieges = [];
    var etapes;
    if (sous) {
      var Bo = P.ordonner(B);
      var fauxB = Bo.map(function (m, i) { return i === 0 ? { c: m.c.oppose(), l: m.l } : m; });
      pieges.push({ src: P.src(P.plus(A, fauxB)), message: 'Tu as oublié de distribuer le signe moins : soustraire un polynôme, c\'est additionner son OPPOSÉ, il faut changer le signe de TOUS ses termes.' });
      pieges.push({ src: P.src(P.plus(A, B)), message: 'Tu as additionné au lieu de soustraire : le signe « – » devant la parenthèse change le signe de tous ses termes.' });
      etapes = [
        etape(1, 'Soustraire un polynôme, c\'est additionner son opposé : on supprime les parenthèses en changeant le signe de chaque terme du second polynôme.', hx(O.srcTermes(P.ordonner(A).concat(P.ordonner(P.oppose(B)))))),
        etape(2, 'Réduire et ordonner.', hp(res))
      ];
    } else {
      etapes = [
        etape(1, 'Les parenthèses précédées du signe « + » (ou d\'aucun signe) peuvent être supprimées.', hx(O.srcTermes(P.ordonner(A).concat(P.ordonner(B))))),
        etape(2, 'Réduire et ordonner.', hp(res))
      ];
    }
    var lettre = p >= 4 ? null : 'x';
    return Q({
      type: 'directe',
      enonce: '<p>' + (sous ? 'Soustrais' : 'Additionne') + ' ces polynômes, puis réduis ' + (lettre ? 'et ordonne ' : '') + 'le résultat :</p><p class="calcul">' + hm(affiche) + '</p>',
      reponse: { type: 'expr', attendu: P.src(res), forme: lettre ? 'ordonnee' : 'reduite', depart: src, lettre: lettre },
      pieges: pieges,
      indice: sous ? 'Pour soustraire un polynôme, on additionne son opposé : change le signe de chacun de ses termes.' : 'Supprime les parenthèses, puis additionne les monômes semblables.',
      etapes: etapes,
      verification: verifSubst(src, P.src(res), valeursTest(src), affiche),
      rubrique: R.parentheses,
      controle: { type: 'expr' }
    });
  }

  function genPolynomesOpposesVF(alea, p) {
    var A = polyAleatoire(alea, p, 3, 2);
    var opp = alea.suivant() < 0.5;
    var B = opp ? P.oppose(A) : P.ordonner(A).map(function (m, i) { return i === 0 ? { c: m.c.oppose(), l: m.l } : m; });
    B = P.plus(B, []);
    var somme = P.plus(A, B);
    return qVraiFaux(alea, {
      affirmation: 'Les polynômes ' + hp(A) + ' et ' + hp(B) + ' sont opposés.',
      vrai: opp,
      justeVrai: 'leur somme est nulle : chaque terme de l\'un est l\'opposé d\'un terme de l\'autre.',
      justeFaux: 'leur somme vaut ' + P.texte(somme) + ', pas 0.',
      autresVrai: ['ils ont les mêmes lettres.'],
      autresFaux: ['ils n\'ont pas le même premier terme.', 'deux polynômes ne peuvent pas être opposés.'],
      rubrique: R.parentheses,
      indice: 'Deux polynômes sont opposés si leur somme est nulle.',
      etapes: [etape(1, 'Calculer la somme des deux polynômes.', hm('(' + P.texte(A) + ') + (' + P.texte(B) + ') = ' + P.texte(somme)))],
      controle: { type: 'egalite', a: '(' + P.src(A) + ')+(' + P.src(B) + ')', b: '0', vrai: opp }
    });
  }

  /**
   * D1 : (x + a)(x + b) positifs ; D2 : (x + a)(x – b) ; D3 : (ax + b)(cx + d) positifs ;
   * D4 : coefficients négatifs, deux variables, ou produit remarquable (si remarquables).
   */
  function genMultiplierPolynomes(alea, p, ctx, avecRemarquables) {
    var a = 1, b, c = 1, d;
    if (p <= 1) { b = alea.entier(1, 9); d = alea.entier(1, 9); }
    else if (p === 2) { b = alea.entier(1, 9); d = -alea.entier(1, 9); if (alea.suivant() < 0.5) { var t0 = b; b = d; d = t0; } }
    else if (p === 3) { a = alea.entier(1, 3); c = alea.entier(2, 4); b = alea.entier(1, 7); d = alea.entier(1, 7); }
    else { a = alea.entier(2, 4); c = alea.entier(1, 3); b = -alea.entier(1, 7); d = alea.entierNonNul(-7, 7); }
    var A = O.lin(a, b), B = O.lin(c, d);
    var src = '(' + P.src(A) + ')(' + P.src(B) + ')';
    if (p >= 4 && avecRemarquables && alea.suivant() < 0.4) {
      var k = alea.entier(1, 9);
      var cas = alea.choix(['(x+k)^2', '(x-k)^2', '(x+k)(x-k)']);
      A = O.lin(1, cas === '(x-k)^2' ? -k : k); B = O.lin(1, cas === '(x+k)^2' ? k : -k);
      src = cas.replace(/k/g, k);
    } else if (p >= 4 && alea.suivant() < 0.35) {
      A = P.plus(P.monome(a, { a: 1 }), P.monome(b, { b: 1 }));
      B = P.plus(P.monome(c, { a: 1 }), P.monome(d, { b: 1 }));
      src = '(' + P.src(A) + ')(' + P.src(B) + ')';
    }
    var res = P.fois(A, B);
    var Ao = P.ordonner(A), Bo = P.ordonner(B);
    var produits = [];
    Ao.forEach(function (m) { Bo.forEach(function (n) { produits.push(P.fois([m], [n])[0]); }); });
    var pieges = [];
    if (Ao.length === 2 && Bo.length === 2) {
      pieges.push({ src: P.src(P.plus(P.fois([Ao[0]], [Bo[0]]), P.fois([Ao[1]], [Bo[1]]))), message: 'Il manque les produits « croisés » : avec la double distributivité, chaque terme du premier facteur multiplie CHAQUE terme du second (4 produits). Par exemple (a + b)² n\'est pas a² + b².' });
    }
    var tuiles = Ao.length === 2 && Bo.length === 2 && P.lettres(A).join() === 'x' && P.lettres(B).join() === 'x' && P.degre(B) === 1 &&
      Math.abs(a) <= 3 && Math.abs(c) <= 3 && Math.abs(b) <= 5 && Math.abs(d) <= 5;
    return Q({
      type: tuiles && p <= 3 ? 'visuel' : 'directe',
      enonce: '<p>Développe, réduis et ordonne :</p><p class="calcul">' + hx(src) + '</p>',
      consigne: tuiles && p <= 3 ? 'Le rectangle montre l\'aire (' + P.texte(A) + ')(' + P.texte(B) + ') : touche chaque case pour la remplir.' : '',
      reponse: { type: 'expr', attendu: P.src(res), forme: 'ordonnee', depart: src },
      pieges: pieges,
      visuel: tuiles && p <= 3 ? { type: 'aire', f1: [Number(P.coef(A, { x: 1 }).num), Number(P.coef(A, {}).num)], f2: [Number(P.coef(B, { x: 1 }).num), Number(P.coef(B, {}).num)], lettre: 'x' } : null,
      indice: 'Double distributivité : (a + b)(c + d) = ac + ad + bc + bd. Multiplie chaque terme du premier facteur par chaque terme du second, puis réduis.',
      etapes: [
        etape(1, 'Double distributivité : chaque terme du premier facteur multiplie chaque terme du second.', hm(produitsDetailles(src) + ' = ' + tx(O.srcTermes(produits)))),
        etape(2, 'Réduire et ordonner.', hp(res))
      ],
      verification: verifSubst(src, P.src(res), valeursTest(src)),
      rubrique: R.developper,
      controle: { type: 'expr' }
    });
  }

  /* =====================================================================
   * 11e — degré d'un polynôme
   * ===================================================================== */
  function genDegrePolynome(alea, p) {
    var deux = p >= 3 && alea.suivant() < 0.5;
    var termes = [];
    var n = alea.entier(3, p <= 1 ? 4 : 5);
    var degres = alea.melanger([0, 1, 2, 3, 4]);
    for (var i = 0; i < n; i++) {
      var l = {};
      if (deux) { var e1 = alea.entier(0, 3), e2 = alea.entier(0, 2); if (e1) l.x = e1; if (e2) l.y = e2; }
      else { var e = p <= 1 ? degres[i] : alea.entier(0, 4); if (e) l.x = e; }
      termes.push({ c: val(p <= 1 ? alea.entier(1, 9) : alea.entierNonNul(-9, 9)), l: l });
    }
    // piège : le terme de plus haut degré s'annule
    if (p >= 2 && alea.suivant() < 0.6) {
      var lmax = deux ? { x: 3, y: 2 } : { x: 5 };
      var cm = alea.entierNonNul(-6, 6);
      termes.splice(alea.entier(0, termes.length), 0, { c: val(cm), l: lmax });
      termes.splice(alea.entier(0, termes.length), 0, { c: val(-cm), l: lmax });
    }
    var red = P.plus(termes, []);
    if (red.length < 2) return genDegrePolynome(alea, p);
    var deg = P.degre(red);
    var src = O.srcTermes(termes);
    var degNonReduit = Math.max.apply(null, termes.map(function (m) { return P.degreMonome(m); }));
    var quoi = p <= 1 ? 'degre' : alea.choix(['degre', 'degre', 'coef']);
    if (quoi === 'coef' && !deux) {
      var d0 = alea.choix(red.map(function (m) { return P.degreMonome(m); }));
      var lc = {}; if (d0) lc.x = d0;
      var cf = P.coef(red, lc);
      return Q({
        type: 'directe',
        enonce: '<p>On réduit le polynôme ' + hx(src) + '.</p><p>Quel est le coefficient du terme ' + (d0 ? 'en ' + hm(P.partieLitterale({ l: lc })) : 'constant') + ' ?</p>',
        reponse: { type: 'nombre', valeur: cf },
        indice: 'Réduis d\'abord le polynôme : additionne les monômes semblables.',
        etapes: etapesReduction(termes, red, true).concat([etape(4, 'Lire le coefficient du terme ' + (d0 ? 'en ' + P.partieLitterale({ l: lc }) : 'constant') + '.', hn(cf))]),
        rubrique: R.polynome,
        controle: { type: 'coefPoly', src: src, l: lc }
      });
    }
    var pieges = degNonReduit !== deg ? [{ valeur: degNonReduit, message: 'Il faut d\'abord RÉDUIRE le polynôme : les termes de degré ' + degNonReduit + ' s\'annulent.' }] : [];
    return Q({
      type: 'directe',
      enonce: '<p>Quel est le <strong>degré</strong> du polynôme</p><p class="calcul">' + hx(src) + '</p>',
      reponse: { type: 'nombre', valeur: fr(deg) },
      pieges: pieges,
      indice: 'Le degré d\'un polynôme est le plus haut degré de ses termes APRÈS réduction. Le degré d\'un monôme est la somme des exposants de ses lettres.',
      etapes: etapesReduction(termes, red, true).concat([etape(4, 'Le terme de plus haut degré est ' + tx(P.srcMonome(red[0])) + ' : degré ' + deg + '.', hn(deg))]),
      rubrique: R.polynome,
      controle: { type: 'degre', src: src }
    });
  }

  /** 11e D1-D2 : ordonner un polynôme déjà réduit (une variable). */
  function genOrdonner(alea, p) {
    var degres = alea.melanger([0, 1, 2, 3, 4]).slice(0, p <= 1 ? 3 : 4);
    var termes = degres.map(function (d) { var l = {}; if (d) l.x = d; return { c: val(p <= 1 ? alea.entier(1, 9) : alea.entierNonNul(-9, 9)), l: l }; });
    var red = P.plus(termes, []);
    if (O.estOrdonnee(tx(O.srcTermes(termes)), 'x')) return genOrdonner(alea, p);
    var src = O.srcTermes(termes);
    return Q({
      type: 'directe',
      enonce: '<p>Ordonne le polynôme selon les puissances décroissantes de x :</p><p class="calcul">' + hx(src) + '</p>',
      reponse: { type: 'expr', attendu: P.src(red), forme: 'ordonnee', depart: src, lettre: 'x' },
      indice: 'Écris d\'abord le terme de plus haut degré ; chaque terme garde son signe.',
      etapes: [etape(1, 'Repérer le degré de chaque terme, puis écrire les termes du plus haut degré au plus petit, chacun avec son signe.', hp(red))],
      rubrique: R.ordonner,
      controle: { type: 'expr' }
    });
  }

  function genDegreVF(alea, p) {
    var n = alea.entier(2, 9), k = alea.entier(2, 6);
    var bank = [
      { aff: 'Le polynôme ' + n + 'x²y – x³ + ' + k + ' est de degré 3', vrai: true, justeVrai: 'x²y est de degré 2 + 1 = 3 et x³ de degré 3 : le plus haut degré est 3.', autresVrai: ['il contient x³.'], autresFaux: ['son degré est 2.', 'son degré est 6 (2 + 1 + 3).'] },
      { aff: 'Le polynôme ' + n + 'x² + ' + k + ' – ' + n + 'x² est de degré 2', vrai: false, justeFaux: 'après réduction, il reste ' + k + ' : le degré est 0.', autresFaux: ['son degré est 4.'], autresVrai: ['il contient x².', 'le plus grand exposant écrit est 2.'] },
      { aff: 'Le polynôme x³ + x³ est de degré 6', vrai: false, justeFaux: 'x³ + x³ = 2x³ est de degré 3.', autresFaux: ['son degré est 2.'], autresVrai: ['on additionne les exposants : 3 + 3 = 6.'] },
      { aff: 'Le polynôme ' + k + 'x – ' + n + ' est de degré 1', vrai: true, justeVrai: 'le terme de plus haut degré est ' + k + 'x, de degré 1.', autresVrai: ['il a deux termes.'], autresFaux: ['un nombre seul n\'a pas de degré.', 'son degré est ' + k + '.'] }
    ];
    var c = alea.choix(bank);
    return qVraiFaux(alea, {
      affirmation: hm(c.aff) + '.', vrai: c.vrai, justeVrai: c.justeVrai, justeFaux: c.justeFaux, autresVrai: c.autresVrai, autresFaux: c.autresFaux,
      rubrique: R.polynome,
      indice: 'Le degré d\'un polynôme est le plus haut degré de ses termes, après réduction.',
      etapes: [etape(1, c.vrai ? 'Vrai : ' + c.justeVrai : 'Faux : ' + c.justeFaux, '')],
      controle: { type: 'convention', vrai: c.vrai }
    });
  }

  /* =====================================================================
   * 11e — factoriser (mise en évidence)
   * ===================================================================== */
  function genFactoriser(alea, p) {
    for (var essai = 0; essai < 50; essai++) {
      // D1 : facteur numérique seul, positif ; D2 : facteur monôme (une ou deux lettres) ;
      // D3 : trois termes ; D4 : factorisation complète, signe « – » mis en évidence possible.
      var k = alea.entier(p <= 1 ? 2 : 1, p <= 2 ? 6 : 9);
      var lettres = p >= 2 && alea.suivant() < 0.5 ? ['a', 'b'] : ['x'];
      var lm = {};
      if (p >= 2) lm[lettres[0]] = alea.entier(1, p >= 3 ? 2 : 1);
      if (lettres.length === 2 && p >= 2 && alea.suivant() < 0.6) lm.b = 1;
      if (k === 1 && !Object.keys(lm).length) continue;
      var m = { c: val(p >= 4 && alea.suivant() < 0.3 ? -k : k), l: lm };
      var nT = p >= 3 ? alea.entier(2, 3) : 2;
      if (p === 3) nT = 3;
      var Q2 = [];
      for (var i = 0; i < nT; i++) {
        var l = {};
        lettres.forEach(function (x) { var e = alea.entier(0, p <= 1 ? 1 : 2); if (e) l[x] = e; });
        Q2.push({ c: val(p <= 1 ? alea.entier(1, 7) : alea.entierNonNul(-7, 7)), l: l });
      }
      var Qr = P.plus(Q2, []);
      if (Qr.length < 2) continue;
      var fc = P.facteurCommun(Qr);
      if (fc.c.compare(1) > 0 || Object.keys(fc.l).length) continue;
      if (Qr[0].c.signe() < 0 && m.c.signe() > 0) Qr = P.oppose(Qr), m.c = m.c.oppose();
      Qr = P.plus(Qr, []);
      var dev = P.fois([m], Qr);
      if (dev.length !== Qr.length) continue;
      var attendu = P.srcMonome(m) + '(' + P.src(Qr) + ')';
      var fcd = P.facteurCommun(dev);
      if (m.c.signe() < 0) fcd = { c: fcd.c.oppose(), l: fcd.l };
      var etapes = [
        etape(1, 'Chercher le plus grand facteur commun à tous les termes : le PGDC des coefficients et les lettres communes (avec le plus petit exposant).', hm('facteur commun : ' + tx(P.srcMonome(fcd)) + (m.c.signe() < 0 ? ' (on met aussi le signe « – » en évidence)' : ''))),
        etape(2, 'Diviser chaque terme par ce facteur commun et l\'écrire devant la parenthèse.', hx(P.srcMonome(fcd) + '(' + P.src(P.diviserMonome(dev, fcd)) + ')')),
        etape(3, 'Contrôler qu\'il ne reste plus de facteur commun dans la parenthèse, et vérifier en développant.', hm(tx(attendu) + ' = ' + P.texte(dev)))
      ];
      var pieges = [];
      if (fcd.c.abs().compare(1) > 0 && Object.keys(fcd.l).length) {
        var partiel = { c: fcd.c, l: {} };
        pieges.push({ src: P.srcMonome(partiel) + '(' + P.src(P.diviserMonome(dev, partiel)) + ')', message: 'Ta factorisation est juste, mais incomplète : il reste un facteur commun dans la parenthèse.' });
      }
      return Q({
        type: 'directe',
        enonce: '<p>Factorise le plus possible (mise en évidence) :</p><p class="calcul">' + hp(dev) + '</p>',
        reponse: { type: 'expr', attendu: attendu, forme: 'factorisee', depart: P.src(dev) },
        alternatives: [],
        pieges: pieges,
        indice: 'Cherche le plus grand nombre qui divise tous les coefficients, et les lettres présentes dans TOUS les termes (avec leur plus petit exposant).',
        etapes: etapes,
        verification: 'Vérification en développant : ' + hm(tx(attendu) + ' = ' + P.texte(dev)) + '.',
        rubrique: R.factoriser,
        controle: { type: 'expr' }
      });
    }
    throw new Error('Factorisation : génération impossible');
  }

  function genFactoriserPolynome(alea, p) {
    // mise en évidence d'un polynôme : a(x + b) + c(x + b) = (x + b)(a + c)
    var b = alea.entierNonNul(-7, 7), a = alea.entier(2, 6), c = alea.entierNonNul(-5, 5);
    while (O.pgcd(a, c) !== 1) c = alea.entierNonNul(-5, 5);
    var commun = P.src(O.lin(1, b));
    var src = a + 'x(' + commun + ')' + (c < 0 ? '-' + (-c) : '+' + c) + '(' + commun + ')';
    var att = '(' + commun + ')(' + P.src(O.lin(a, c)) + ')';
    return Q({
      type: 'directe',
      enonce: '<p>Factorise en mettant un polynôme en évidence :</p><p class="calcul">' + hx(src) + '</p>',
      reponse: { type: 'expr', attendu: att, forme: 'factorisee', depart: src, nbFacteurs: 2 },
      indice: 'Le facteur (' + tx(commun) + ') apparaît dans les deux termes : mets-le en évidence.',
      etapes: [
        etape(1, 'Repérer le facteur commun aux deux termes.', hm('(' + tx(commun) + ')')),
        etape(2, 'Le mettre en évidence : ce qui reste de chaque terme va dans la seconde parenthèse.', hx(att))
      ],
      verification: verifSubst(src, att, { x: 2 }),
      rubrique: R.factoriser,
      controle: { type: 'expr' }
    });
  }

  function genFactoriserVF(alea, p) {
    var k = alea.entier(2, 6), a = alea.entier(2, 5), b = alea.entier(1, 7);
    while (O.pgcd(a, b) !== 1) b++;
    var bank = [
      { a: (k * a) + 'x^2+' + (k * b) + 'x', b: k + 'x(' + a + 'x+' + b + ')', vrai: true, complete: true },
      { a: (k * a) + 'x+' + k, b: k + '(' + a + 'x)', vrai: false },
      { a: (k * a) + 'x^2-' + (k * b) + 'x', b: 'x(' + (k * a) + 'x-' + (k * b) + ')', vrai: true, incomplete: true },
      { a: 'x^2+' + b + 'x', b: 'x(x+' + b + ')', vrai: true, complete: true },
      { a: (k * a) + 'x-' + (k * b), b: k + '(' + a + 'x+' + b + ')', vrai: false }
    ];
    var c = alea.choix(bank);
    var ce = c.vrai ? null : O.contreExemple(c.a, c.b);
    if (c.incomplete) {
      return qVraiFaux(alea, {
        affirmation: hx(c.b) + ' est la factorisation la plus complète de ' + hx(c.a) + '.',
        vrai: false,
        justeFaux: 'l\'égalité est juste, mais on peut encore mettre ' + k + ' en évidence : ' + tx(k + 'x(' + a + 'x-' + b + ')') + '.',
        autresFaux: ['l\'égalité est fausse.'],
        autresVrai: ['en développant, on retrouve bien ' + tx(c.a) + '.', 'x est le seul facteur commun.'],
        rubrique: R.factoriser,
        etapes: [etape(1, 'Contrôler qu\'il ne reste plus de facteur commun dans la parenthèse.', hx(k + 'x(' + a + 'x-' + b + ')'))],
        controle: { type: 'convention', vrai: false }
      });
    }
    return qVraiFaux(alea, {
      affirmation: hm(tx(c.a) + ' = ' + tx(c.b)),
      vrai: c.vrai,
      justeVrai: 'en développant ' + tx(c.b) + ', on retrouve ' + tx(c.a) + '.',
      justeFaux: ce ? 'pour ' + O.texteValeurs(ce.valeurs) + ', le membre de gauche vaut ' + tn(ce.va) + ' et celui de droite ' + tn(ce.vb) + '.' : '',
      autresVrai: ['les deux membres contiennent les mêmes nombres.'],
      autresFaux: ['un produit ne peut jamais être égal à une somme.', 'il n\'y a pas de lettre commune.'],
      rubrique: R.factoriser,
      etapes: [etape(1, c.vrai ? 'On vérifie en développant le produit.' : 'Un contre-exemple suffit.', c.vrai ? hm(tx(c.b) + ' = ' + P.texte(P.depuis(c.b))) : hm(O.substituerTexte(c.a, ce.valeurs) + ' = ' + tn(ce.va) + ' ≠ ' + tn(ce.vb)))],
      controle: { type: 'egalite', a: c.a, b: c.b, vrai: c.vrai }
    });
  }

  /* =====================================================================
   * 11e niveau 2 — produits (identités) remarquables
   * ===================================================================== */
  function genRemarquablesDevelopper(alea, p) {
    var a = p <= 2 ? 1 : alea.entier(1, 3), b = alea.entier(1, p <= 2 ? 6 : 9);
    var l = alea.choix(['x', 'x', 'a', 'y']);
    var cas = p <= 1 ? 'plus' : alea.choix(['plus', 'moins', 'conj']);
    var u = (a === 1 ? '' : a) + l;
    var src, res, pieges = [], formule, etape1;
    var A = a * a, B = b * b, D = 2 * a * b;
    var a2 = (A === 1 ? '' : A) + l + '^2';
    if (cas === 'plus') {
      src = '(' + u + '+' + b + ')^2'; res = a2 + '+' + D + l + '+' + B;
      pieges.push({ src: a2 + '+' + B, message: '(a + b)² n\'est pas a² + b² : il manque le double produit 2ab = ' + D + l + '.' });
      formule = '(a + b)² = a² + 2ab + b²';
    } else if (cas === 'moins') {
      src = '(' + u + '-' + b + ')^2'; res = a2 + '-' + D + l + '+' + B;
      pieges.push({ src: a2 + '-' + B, message: '(a – b)² n\'est pas a² – b² : (a – b)² = a² – 2ab + b².' });
      pieges.push({ src: a2 + '+' + D + l + '+' + B, message: 'Le double produit est négatif : (a – b)² = a² – 2ab + b².' });
      formule = '(a – b)² = a² – 2ab + b²';
    } else {
      src = '(' + u + '+' + b + ')(' + u + '-' + b + ')'; res = a2 + '-' + B;
      pieges.push({ src: a2 + '+' + B, message: '(a + b)(a – b) = a² – b² : le second terme est négatif.' });
      formule = '(a + b)(a – b) = a² – b²';
    }
    var visuel = cas === 'plus' && a === 1 && b <= 5 && p <= 3 ? { type: 'aire', f1: [1, b], f2: [1, b], lettre: l } : null;
    return Q({
      type: visuel ? 'visuel' : 'directe',
      enonce: '<p>Développe à l\'aide d\'un produit remarquable, puis ordonne :</p><p class="calcul">' + hx(src) + '</p>',
      consigne: visuel ? 'Le carré de côté ' + tx(u + '+' + b) + ' se partage en quatre rectangles : touche les cases.' : '',
      reponse: { type: 'expr', attendu: res, forme: 'ordonnee', depart: src },
      pieges: pieges,
      visuel: visuel,
      indice: 'Produits remarquables : (a + b)² = a² + 2ab + b² ; (a – b)² = a² – 2ab + b² ; (a + b)(a – b) = a² – b².',
      etapes: [
        etape(1, 'Reconnaître le produit remarquable : ' + formule + ', avec a = ' + tx(u) + ' et b = ' + b + '.', hm(formule)),
        etape(2, 'Remplacer a et b.', hm(cas === 'conj' ? '(' + tx(u) + ')² – ' + b + '²' : '(' + tx(u) + ')² ' + (cas === 'plus' ? '+' : '–') + ' 2 · ' + tx(u) + ' · ' + b + ' + ' + b + '²')),
        etape(3, 'Calculer.', hx(res))
      ],
      verification: verifSubst(src, res, valeursTest(src)),
      rubrique: R.remarquables,
      controle: { type: 'expr' }
    });
  }

  function genRemarquablesFactoriser(alea, p) {
    // D3 : a² – b² ; D4 : les trois identités, avec un facteur commun à mettre d'abord en évidence
    var a = alea.entier(1, 3), b = alea.entier(1, 9);
    while (O.pgcd(a, b) !== 1) b++;
    var l = alea.choix(['x', 'a', 'y']);
    var cas = p <= 3 ? 'conj' : alea.choix(['plus', 'moins', 'conj', 'conj']);
    var u = (a === 1 ? '' : a) + l;
    var A = a * a, B = b * b, D = 2 * a * b;
    var a2 = (A === 1 ? '' : A) + l + '^2';
    var src, att, formule;
    if (cas === 'plus') { src = a2 + '+' + D + l + '+' + B; att = '(' + u + '+' + b + ')^2'; formule = 'a² + 2ab + b² = (a + b)²'; }
    else if (cas === 'moins') { src = a2 + '-' + D + l + '+' + B; att = '(' + u + '-' + b + ')^2'; formule = 'a² – 2ab + b² = (a – b)²'; }
    else { src = a2 + '-' + B; att = '(' + u + '+' + b + ')(' + u + '-' + b + ')'; formule = 'a² – b² = (a + b)(a – b)'; }
    var k = 1, km = null;
    if (p >= 4 && alea.suivant() < 0.6) {
      k = alea.entier(2, 4);
      if (b > 5) b = alea.entier(1, 5);
      while (O.pgcd(a, b) !== 1) b++;
      // recalcul avec le nouveau b
      B = b * b; D = 2 * a * b;
      if (cas === 'plus') { src = a2 + '+' + D + l + '+' + B; att = '(' + u + '+' + b + ')^2'; }
      else if (cas === 'moins') { src = a2 + '-' + D + l + '+' + B; att = '(' + u + '-' + b + ')^2'; }
      else { src = a2 + '-' + B; att = '(' + u + '+' + b + ')(' + u + '-' + b + ')'; }
      km = alea.choix([{}, { x: 1 }, { x: 1, y: 1 }]);
      if (km.x && l === 'x') km = alea.choix([{}, { y: 1 }]);
      var facteur = { c: val(k), l: km };
      src = P.src(P.fois([facteur], P.depuis(src)));
      att = P.srcMonome(facteur) + att;
    }
    return Q({
      type: 'directe',
      enonce: '<p>Factorise' + (k > 1 ? ' le plus possible' : '') + ' à l\'aide d\'un produit remarquable :</p><p class="calcul">' + hx(src) + '</p>',
      reponse: { type: 'expr', attendu: att, forme: 'factorisee', depart: src, nbFacteurs: 2 },
      pieges: cas === 'conj' ? [{ src: '(' + u + '-' + b + ')^2', message: 'a² – b² n\'est pas (a – b)² : c\'est (a + b)(a – b).' }] : [],
      indice: (k > 1 ? 'Mets d\'abord le facteur commun en évidence. ' : '') + 'Repère les carrés : ' + tx(a2) + ' = (' + tx(u) + ')² et ' + B + ' = ' + b + '².',
      etapes: [].concat(k > 1 ? [etape(1, 'Mettre le facteur commun ' + tx(P.srcMonome({ c: val(k), l: km })) + ' en évidence.', hx(P.srcMonome({ c: val(k), l: km }) + '(' + P.src(P.diviserMonome(P.depuis(src), { c: val(k), l: km })) + ')'))] : []).concat([
        etape(k > 1 ? 2 : 1, 'Reconnaître le produit remarquable : ' + formule + ', avec a = ' + tx(u) + ' et b = ' + b + '.', hm(formule)),
        etape(k > 1 ? 3 : 2, 'Écrire le produit et vérifier en développant.', hx(att))
      ]),
      verification: verifSubst(src, att, valeursTest(src)),
      rubrique: R.remarquables,
      controle: { type: 'expr' }
    });
  }

  function genRemarquablesVF(alea, p) {
    var b = alea.entier(2, 9);
    var bank = [
      { a: '(x+' + b + ')^2', b: 'x^2+' + (b * b), vrai: false },
      { a: '(x-' + b + ')^2', b: 'x^2-' + (2 * b) + 'x+' + (b * b), vrai: true },
      { a: '(x+' + b + ')(x-' + b + ')', b: 'x^2-' + (b * b), vrai: true },
      { a: '(x-' + b + ')^2', b: 'x^2-' + (b * b), vrai: false }
    ];
    var c = alea.choix(bank);
    var ce = c.vrai ? null : O.contreExemple(c.a, c.b);
    return qVraiFaux(alea, {
      affirmation: hm(tx(c.a) + ' = ' + tx(c.b)), vrai: c.vrai,
      justeVrai: 'c\'est un produit remarquable : en développant ' + tx(c.a) + ', on obtient ' + P.texte(P.depuis(c.a)) + '.',
      justeFaux: ce ? 'pour ' + O.texteValeurs(ce.valeurs) + ', ' + tx(c.a) + ' vaut ' + tn(ce.va) + ' et ' + tx(c.b) + ' vaut ' + tn(ce.vb) + '. En fait ' + tx(c.a) + ' = ' + P.texte(P.depuis(c.a)) + '.' : '',
      autresVrai: ['on élève chaque terme au carré.'],
      autresFaux: ['un carré est toujours positif.', 'les deux membres n\'ont pas le même nombre de termes.'],
      rubrique: R.remarquables,
      etapes: [etape(1, 'Développer le membre de gauche.', hm(tx(c.a) + ' = ' + P.texte(P.depuis(c.a))))],
      controle: { type: 'egalite', a: c.a, b: c.b, vrai: c.vrai }
    });
  }

  /* =====================================================================
   * 11e niveau 2 — calcul littéral et preuve
   * ===================================================================== */
  var PREUVES = [
    { enonce: 'la somme de trois nombres entiers consécutifs est un multiple de 3', termes: ['n', 'n+1', 'n+2'], somme: '3n+3', fact: '3(n+1)', conclusion: '3(n + 1) est un multiple de 3, car n + 1 est un entier.' },
    { enonce: 'la somme de cinq nombres entiers consécutifs est un multiple de 5', termes: ['n', 'n+1', 'n+2', 'n+3', 'n+4'], somme: '5n+10', fact: '5(n+2)', conclusion: '5(n + 2) est un multiple de 5.' },
    { enonce: 'la somme de deux nombres entiers consécutifs est un nombre impair', termes: ['n', 'n+1'], somme: '2n+1', fact: null, conclusion: '2n est pair, donc 2n + 1 est impair.' },
    { enonce: 'la somme de deux nombres pairs est un nombre pair', termes: ['2n', '2m'], somme: '2n+2m', fact: '2(n+m)', conclusion: '2(n + m) est le double d\'un entier : c\'est un nombre pair.' },
    { enonce: 'la différence entre les carrés de deux entiers consécutifs est un nombre impair', termes: ['(n+1)^2', 'n^2'], difference: true, somme: '2n+1', fact: null, conclusion: '2n + 1 est impair.' },
    { enonce: 'la somme de trois nombres pairs consécutifs est un multiple de 6', termes: ['2n', '2n+2', '2n+4'], somme: '6n+6', fact: '6(n+1)', conclusion: '6(n + 1) est un multiple de 6.' }
  ];

  function genPreuve(alea, p) {
    var c = alea.choix(p <= 2 ? PREUVES.filter(function (x) { return !x.difference && Maths.lettres(x.termes.join('+')).length === 1; }) : PREUVES);
    var src = c.difference ? c.termes[0] + '-' + c.termes[1] : c.termes.map(function (t) { return '(' + t + ')'; }).join('+');
    var factoriser = !!c.fact && p >= 3 && alea.suivant() < 0.75;
    var att = factoriser ? c.fact : c.somme;
    var lettres = Maths.lettres(src);
    var nomsTermes = c.termes.map(function (t) { return tx(t); }).join(' ; ');
    return Q({
      type: 'probleme',
      enonce: '<p>On veut prouver que <strong>' + c.enonce + '</strong>.</p><p>On note ' + lettres.join(' et ') + ' ' + (lettres.length > 1 ? 'des nombres entiers quelconques (indéterminées)' : 'un nombre entier quelconque (indéterminée)') + ' : les nombres s\'écrivent ' + hm(nomsTermes) + '.</p>' +
        '<p>' + (c.difference ? 'Écris la différence ' + hx(src) : 'Écris leur somme') + (factoriser ? ' sous une forme factorisée qui montre la propriété.' : ' sous forme réduite.') + '</p>',
      reponse: { type: 'expr', attendu: att, forme: factoriser ? 'factorisee' : 'reduite', depart: src },
      indice: factoriser ? 'Réduis la somme, puis mets en évidence le facteur qui montre la propriété.' : 'Supprime les parenthèses et réduis.',
      etapes: [
        etape(1, 'Écrire le calcul avec l\'indéterminée.', hx(src)),
        etape(2, 'Réduire.', hx(c.somme))
      ].concat(factoriser ? [etape(3, 'Factoriser.', hx(c.fact))] : []).concat([etape(factoriser ? 4 : 3, 'Conclure : ' + c.conclusion + ' Un exemple numérique ne suffit pas : le calcul littéral prouve la propriété pour TOUS les entiers.', '')]),
      rubrique: R.preuve,
      controle: { type: 'expr' }
    });
  }

  function genPreuveVF(alea, p) {
    var c = alea.choix(PREUVES);
    var n = alea.entier(3, 20);
    var ex = c.termes.map(function (t) { var v = {}; Maths.lettres(t).forEach(function (l, i) { v[l] = n + i; }); return Maths.evaluer(t, v); });
    var calc = c.difference ? tn(ex[0]) + ' – ' + tn(ex[1]) + ' = ' + tn(ex[0].moins(ex[1])) : ex.map(tn).join(' + ') + ' = ' + tn(ex.reduce(function (s, x) { return s.plus(x); }, new F(0)));
    return qVraiFaux(alea, {
      affirmation: 'Le calcul ' + hm(calc) + ' prouve que ' + c.enonce + '.',
      vrai: false,
      justeFaux: 'un exemple ne prouve pas une propriété pour tous les nombres. Il faut un calcul littéral avec une indéterminée (par exemple n).',
      autresFaux: ['le calcul est faux.'],
      autresVrai: ['le résultat a bien la propriété annoncée.', 'on peut toujours généraliser un exemple.'],
      rubrique: R.preuve,
      indice: 'Un exemple peut montrer qu\'une propriété est FAUSSE (contre-exemple), mais jamais qu\'elle est toujours vraie.',
      etapes: [etape(1, 'Preuve avec l\'indéterminée : ' + (c.difference ? tx(c.termes[0]) + ' – ' + tx(c.termes[1]) : c.termes.map(tx).join(' + ')) + ' = ' + tx(c.fact || c.somme) + '. ' + c.conclusion, '')],
      controle: { type: 'convention', vrai: false }
    });
  }

  /* =====================================================================
   * Problèmes (10e et 11e) : expressions à réduire
   * ===================================================================== */
  function genProblemeReduire(alea, p, ctx) {
    var prenoms = alea.melanger(O.PRENOMS).slice(0, 3);
    var a = alea.entier(2, 5), b = alea.entier(3, 15), c = alea.entier(2, 9);
    var tous = [
      function () {
        return { texte: prenoms[0] + ' a x francs. ' + prenoms[1] + ' a ' + b + ' francs de plus que ' + prenoms[0] + ', et ' + prenoms[2] + ' a le ' + ['', '', 'double', 'triple', 'quadruple', 'quintuple'][a] + ' de ce qu\'a ' + prenoms[0] + '.', question: 'Exprime la somme totale des trois en fonction de x, sous forme réduite.', src: 'x+(x+' + b + ')+' + a + 'x' };
      },
      function () {
        return { texte: 'Le potager rectangulaire du jardin de l\'école mesure (x + ' + b + ') m de long et x m de large. On l\'entoure d\'une clôture, en laissant une ouverture de ' + c + ' m pour le portail.', question: 'Exprime la longueur de clôture nécessaire, sous forme réduite.', src: '2(x+' + b + ')+2x-' + c };
      },
      function () {
        return { texte: 'Une installation de panneaux solaires coûte ' + Maths.formaterNombre(b * 1000) + ' francs. Elle fait économiser ' + (c * 100) + ' francs d\'électricité par année. L\'entretien coûte ' + (a * 10) + ' francs par année.', question: 'Exprime le bilan (économies moins coûts) après n années, sous forme réduite.', src: c * 100 + 'n-' + (a * 10) + 'n-' + (b * 1000) };
      },
      function () {
        return { texte: 'Une salle de sport propose un abonnement à ' + (b * 2) + ' francs par mois, avec un rabais de ' + c + ' francs par mois pour les élèves. Les frais d\'inscription coûtent ' + (a * 10) + ' francs.', question: 'Exprime le prix payé par un élève pour m mois, sous forme réduite.', src: (b * 2) + 'm-' + c + 'm+' + (a * 10) };
      }
    ];
    tous.push(function () {
      return { texte: 'Un terrain de sport rectangulaire mesure (2x + ' + b + ') m sur (x + ' + c + ') m.', question: 'Exprime son aire en fonction de x, sous forme réduite et ordonnée.', src: '(2x+' + b + ')(x+' + c + ')' };
    });
    // D1 : somme simple ; D2 : périmètre avec ouverture ; D3 : soustraction de termes ; D4 : aire (produit de binômes)
    var multiplie = !(ctx && ctx.objectifAnnee === 10 && ctx.niveau === 1); // produit de binômes : 10e niveau 2 et 11e
    var cs = p <= 1 ? [tous[0]] : (p === 2 ? [tous[0], tous[1]] : (p === 3 ? [tous[1], tous[2], tous[3]] : (multiplie ? [tous[2], tous[3], tous[4]] : [tous[2], tous[3]])));
    var d = alea.choix(cs)();
    var red = P.depuis(d.src);
    return Q({
      type: 'probleme',
      enonce: '<p>' + d.texte + '</p><p>' + d.question + '</p>',
      reponse: { type: 'expr', attendu: P.src(red), forme: 'reduite', depart: d.src },
      indice: 'Écris d\'abord le calcul sans réduire, puis développe et réduis.',
      etapes: [etape(1, 'Traduire l\'énoncé par une expression.', hx(d.src)), etape(2, 'Développer et réduire.', hp(red))],
      verification: verifSubst(d.src, P.src(red), valeursTest(d.src)),
      rubrique: R.expression,
      controle: { type: 'expr' }
    });
  }

  /* =====================================================================
   * Catalogue des objectifs du module A
   * ===================================================================== */
  function figureLibre(alea, p, ctx) { return genFigure(alea, p, ctx, false); }
  function figureReduite(alea, p, ctx) { return genFigure(alea, p, ctx, true); }

  var objectifs = [
    { id: 'A9-conv', module: 'A', annee: 9, niveaux: [1, 2], theme: 'FA 9.2', titre: 'Conventions d\'écriture algébrique',
      modeles: [{ type: 'directe', gen: genConventionsDirecte }, { type: 'vraifaux', gen: genConventionsVF }, { type: 'erreur', gen: genConventionsErreur, dMin: 2 }] },
    { id: 'A9-val', module: 'A', annee: 9, niveaux: [1, 2], theme: 'FA 9.2', titre: 'Valeur numérique d\'une expression littérale',
      modeles: [{ type: 'directe', gen: genValeurDirecte }, { type: 'visuel', gen: genValeurMachine }, { type: 'visuel', gen: genContreExemple, dMin: 2 }] },
    { id: 'A9-red', module: 'A', annee: 9, niveaux: [1, 2], theme: 'FA 9.2', titre: 'Réduire une expression simple (termes semblables)',
      modeles: [{ type: 'directe', gen: genReduire }, { type: 'vraifaux', gen: genReduireVF, dMin: 2 }] },
    { id: 'A9-geo', module: 'A', annee: 9, niveaux: [1, 2], theme: 'FA 9.2', titre: 'Expressions littérales et figures (périmètre, aire)',
      modeles: [{ type: 'directe', gen: figureLibre }] },
    { id: 'A9-trad', module: 'A', annee: 9, niveaux: [1, 2], theme: 'FA 9.2', titre: 'Traduire une phrase par une expression (et inversement)',
      modeles: [{ type: 'traduction', gen: genTraductionPhrase }, { type: 'choix', gen: genTraductionExpression }] },
    { id: 'A9-pb', module: 'A', annee: 9, niveaux: [1, 2], theme: 'FA 9.2', titre: 'Problèmes : exprimer et calculer',
      modeles: [{ type: 'valeur', gen: genProblemeValeur, dMax: 3 }, { type: 'probleme', gen: genProblemeExpression, dMin: 2 }, { type: 'valeur', gen: genProblemeDeuxEtapes, dMin: 4 }] },

    { id: 'A10-voc', module: 'A', annee: 10, niveaux: [1, 2], theme: 'FA 10.2', titre: 'Monôme : coefficient, partie littérale, degré, monômes semblables',
      modeles: [{ type: 'directe', gen: genVocMonome }, { type: 'choix', gen: genSemblables }, { type: 'vraifaux', gen: genVocVF }] },
    { id: 'A10-mono', module: 'A', annee: 10, niveaux: [1, 2], theme: 'FA 10.2', titre: 'Additionner, soustraire et multiplier des monômes',
      modeles: [{ type: 'directe', gen: genOperationsMonomes }, { type: 'vraifaux', gen: genMonomesVF, dMin: 2 }] },
    { id: 'A10-red', module: 'A', annee: 10, niveaux: [1, 2], theme: 'FA 10.2', titre: 'Réduire et ordonner un polynôme',
      modeles: [{ type: 'directe', gen: genReduire }, { type: 'erreur', gen: genReduireErreur, dMin: 2 }, { type: 'vraifaux', gen: genReduireVF }, { type: 'valeur', gen: genReduireEvaluer, dMin: 4 }] },
    { id: 'A10-dist', module: 'A', annee: 10, niveaux: [1, 2], theme: 'FA 10.2', titre: 'Multiplier un monôme par un polynôme ; supprimer des parenthèses',
      modeles: [{ type: 'directe', gen: genDistributivite }, { type: 'erreur', gen: genDistributiviteErreur, dMin: 3 }] },
    { id: 'A10-add', module: 'A', annee: 10, niveaux: [1, 2], theme: 'FA 10.2', titre: 'Additionner et soustraire des polynômes',
      modeles: [{ type: 'directe', gen: genAddSousPolynomes }, { type: 'vraifaux', gen: genPolynomesOpposesVF, dMin: 2 }] },
    { id: 'A10-expr', module: 'A', annee: 10, niveaux: [1, 2], theme: 'FA 10.2', titre: 'Expressions d\'énoncés et de figures ; problèmes',
      modeles: [{ type: 'directe', gen: figureReduite }, { type: 'probleme', gen: genProblemeReduire }, { type: 'traduction', gen: genTraductionPhrase }] },
    { id: 'A10-mul', module: 'A', annee: 10, niveaux: [2], theme: 'FA 10.2', titre: 'Multiplier des polynômes (double distributivité)',
      modeles: [{ type: 'directe', gen: function (a, p, c) { return genMultiplierPolynomes(a, p, c, true); } }] },

    { id: 'A11-deg', module: 'A', annee: 11, niveaux: [1, 2], theme: 'FA 11.1', titre: 'Degré, ordre et coefficients d\'un polynôme',
      modeles: [{ type: 'directe', gen: genDegrePolynome }, { type: 'directe', gen: genOrdonner, dMax: 2 }, { type: 'vraifaux', gen: genDegreVF }, { type: 'directe', gen: genVocMonome, dMin: 3 }] },
    { id: 'A11-op', module: 'A', annee: 11, niveaux: [1, 2], theme: 'FA 11.1', titre: 'Additionner, soustraire et multiplier des polynômes',
      modeles: [{ type: 'directe', gen: function (a, p, c) { return genAddSousPolynomes(a, p, c); } }, { type: 'directe', gen: function (a, p, c) { return genMultiplierPolynomes(a, p, c, false); } }] },
    { id: 'A11-fact', module: 'A', annee: 11, niveaux: [1, 2], theme: 'FA 11.1', titre: 'Factoriser un polynôme (mise en évidence)',
      modeles: [{ type: 'directe', gen: genFactoriser }, { type: 'vraifaux', gen: genFactoriserVF, dMin: 2 }, { type: 'directe', gen: genFactoriserPolynome, dMin: 3 }] },
    { id: 'A11-pb', module: 'A', annee: 11, niveaux: [1, 2], theme: 'FA 11.1', titre: 'Problèmes de calcul littéral',
      modeles: [{ type: 'probleme', gen: genProblemeReduire }, { type: 'directe', gen: figureReduite }] },
    { id: 'A11-rem', module: 'A', annee: 11, niveaux: [2], theme: 'FA 11.1', titre: 'Produits remarquables (développer et factoriser)',
      modeles: [{ type: 'directe', gen: genRemarquablesDevelopper }, { type: 'directe', gen: genRemarquablesFactoriser, dMin: 3 }, { type: 'vraifaux', gen: genRemarquablesVF }] },
    { id: 'A11-preuve', module: 'A', annee: 11, niveaux: [2], theme: 'FA 11.1', titre: 'Le calcul littéral comme outil de preuve',
      modeles: [{ type: 'probleme', gen: genPreuve }, { type: 'vraifaux', gen: genPreuveVF }] }
  ];


  return {
    objectifs: objectifs,
    // exportés pour les outils visuels (exemples au hasard) et les tests
    termesAReduire: termesAReduire,
    developpementDetaille: developpementDetaille
  };
});
