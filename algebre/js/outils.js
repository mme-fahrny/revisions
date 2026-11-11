/*
 * algebre/js/outils.js — outils communs de l'appli « Calcul littéral et équations »
 * ---------------------------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : objet global « AlgebreOutils ». Node : require.
 * Dépend de assets/maths.js et de poly.js.
 *
 * Contenu :
 *   - rubriques de l'aide-mémoire (renvois par le NOM de la rubrique) ;
 *   - écriture des expressions (texte et HTML) selon l'aide-mémoire ;
 *   - tests de forme (réduite, ordonnée, factorisée) avec l'explication d'un refus ;
 *   - vérification des réponses (expression, nombre, ensemble de solutions,
 *     couple, formule, contre-exemple, choix) et rétroactions ;
 *   - constructeurs de questions.
 *
 * Une question :
 *   { type, enonce (HTML), consigne (HTML), indice (HTML),
 *     reponse: { type: 'expr' | 'nombre' | 'solutions' | 'couple' | 'formule' | 'contreexemple' | 'choix', … },
 *     choix: [{ h, juste, message }], etapes: [{ titre, texte, calcul }],
 *     verification (HTML), rubrique, visuel, clavier, pieges,
 *     controle (recalcul indépendant, pour les tests),
 *     verifier(texte) -> { juste, statut: 'juste' | 'faux' | 'forme' | 'illisible', message },
 *     exemples() -> { justes: [textes], faux: [textes] } }
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('../../assets/maths.js'), require('./poly.js'));
  else racine.AlgebreOutils = fabrique(racine.Maths, racine.AlgebrePoly);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Maths, P) {
  'use strict';

  var F = Maths.Fraction;
  var NBSP = ' ';
  var MOINS = Maths.MOINS;

  /* =====================================================================
   * Rubriques de l'aide-mémoire. À VÉRIFIER par l'enseignante : intitulés
   * exacts de l'édition 2024. Tout est regroupé ici pour les corriger d'un coup.
   * ===================================================================== */
  var RUBRIQUES = {
    expression: 'Expression littérale',
    conventions: 'Conventions d\'écriture',
    valeur: 'Valeur numérique d\'une expression littérale',
    egalite: 'Égalité de deux expressions',
    monome: 'Monôme',
    polynome: 'Polynôme',
    reduction: 'Réduction d\'un polynôme',
    ordonner: 'Polynôme ordonné',
    parentheses: 'Suppression de parenthèses',
    sommeProduit: 'Somme ou produit ?',
    developper: 'Développement',
    factoriser: 'Factorisation',
    remarquables: 'Produits remarquables',
    preuve: 'Égalité de deux expressions',
    equation: 'Équation',
    equivalence: 'Règles d\'équivalence',
    resolution: 'Résolution d\'une équation du premier degré',
    graphique: 'Résolution graphique d\'une équation',
    formules: 'Formules',
    systemes: 'Systèmes d\'équations',
    deuxieme: 'Équation du deuxième degré'
  };

  var PRENOMS = ['Léa', 'Noah', 'Elif', 'Luca', 'Amélie', 'Yanis', 'Sara', 'Mattia', 'Inès',
    'Gabriel', 'Aline', 'Kevin', 'Zoé', 'Nathan', 'Maëlle', 'Dario', 'Chloé', 'Arben',
    'Lou', 'Timéo', 'Jade', 'Ilyas', 'Emma', 'Loris'];

  /* =====================================================================
   * Petits outils
   * ===================================================================== */
  function fr(a, b) { return new F(a, b === undefined ? 1 : b); }
  function val(x) { return F.depuis(x); }
  function pgcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function nonNul(alea, max) { return alea.entierNonNul(-max, max); }
  function positif(alea, min, max) { return alea.entier(min, max); }
  function sauf(alea, min, max, interdits) {
    var n, k = 0;
    do { n = alea.entier(min, max); k++; } while (interdits.indexOf(n) >= 0 && k < 200);
    return n;
  }
  function echapper(t) { return Maths.html.echapper(t); }

  /* =====================================================================
   * Écriture des expressions
   * ===================================================================== */

  /** Texte d'une expression source (« 3x^2-2(x+1) » -> « 3x² – 2(x + 1) »). */
  function tx(src) { return Maths.versTexte(src); }

  /** Fractions numériques empilées dans un texte déjà échappé. */
  function empiler(h) {
    return h.replace(/(\d+)\/(\d+)/g, function (m, a, b) {
      return '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>';
    });
  }
  /** HTML d'une expression source. */
  function hx(src) { return '<span class="maths">' + empiler(echapper(tx(src))) + '</span>'; }
  /** HTML d'un texte déjà écrit (avec · et –). */
  function hm(texte) { return '<span class="maths">' + empiler(echapper(texte)) + '</span>'; }
  /** HTML d'une équation. */
  function heq(g, d) { return '<span class="maths">' + empiler(echapper(tx(g))) + ' = ' + empiler(echapper(tx(d))) + '</span>'; }
  function teq(g, d) { return tx(g) + ' = ' + tx(d); }
  /** Polynôme -> HTML (ordre décroissant par défaut). */
  function hp(p, options) { return hx(P.src(p, options)); }
  /** Nombre (Fraction) -> HTML : entier, décimal fini ou fraction empilée. */
  function hn(x) {
    var f = val(x);
    return f.estDecimale() ? Maths.html.nombre(f) : Maths.html.fraction(f);
  }
  /** Nombre -> texte (décimal fini, sinon fraction). */
  function tn(x) {
    var f = val(x);
    return f.estDecimale() ? Maths.formaterNombre(f) : Maths.formaterFraction(f);
  }
  /** Nombre entre parenthèses s'il est négatif (substitution : 3 · (– 2)). */
  function tnp(x) { var f = val(x); return f.signe() < 0 || !f.estDecimale() ? '(' + tn(f) + ')' : tn(f); }
  /** Source d'un nombre pour Maths.analyser. */
  function sn(x) { var f = val(x); return '(' + f.toString() + ')'; }

  /**
   * Remplace les lettres par leur valeur en rajoutant les « · » (aide-mémoire,
   * rubrique Valeur numérique). src : expression source ; renvoie le texte.
   */
  function substituerTexte(src, valeurs) {
    var arbre = Maths.analyser(src);
    function ecr(n, parentPrio, cote) {
      var t, prio;
      switch (n.type) {
        case 'nombre': t = tn(n.valeur); prio = 5; break;
        case 'lettre': t = tnp(valeurs[n.nom]); prio = 5; break;
        case 'neg': t = MOINS + ecr(n.arg, 2); prio = 1.5; break;
        case '^': t = ecr(n.base, 5) + P.exposantTexte(n.exposant); prio = 4; break;
        case '+': t = ecr(n.g, 1) + ' + ' + ecr(n.d, 1.1); prio = 1; break;
        case '-': t = ecr(n.g, 1) + ' – ' + ecr(n.d, 1.1); prio = 1; break;
        case '*': t = ecr(n.g, 2) + ' · ' + ecr(n.d, 2.1); prio = 2; break;
        case '/': t = ecr(n.g, 2) + ' : ' + ecr(n.d, 2.1); prio = 2; break;
        default: t = '?'; prio = 5;
      }
      if (n.parentheses || prio < (parentPrio || 0)) t = '(' + t + ')';
      return t;
    }
    return ecr(arbre, 0);
  }

  /** Monômes -> source, dans l'ordre donné, sans réduire (termes non nuls). */
  function srcTermes(termes) {
    if (!termes.length) return '0';
    return termes.map(function (m, i) {
      var s = P.srcMonome({ c: val(m.c), l: m.l || {} });
      if (i === 0) return s;
      return s.charAt(0) === '-' ? '-' + s.slice(1) : '+' + s;
    }).join('');
  }
  /** Monôme rapide : mo(3, 'x', 2) ; mo(-2, {a:1, b:1}). */
  function mo(c, lettre, e) {
    var l = {};
    if (typeof lettre === 'string') l[lettre] = e === undefined ? 1 : e;
    else if (lettre) l = lettre;
    return { c: val(c), l: l };
  }
  /** Polynôme ax + b (lettre x par défaut). */
  function lin(a, b, lettre) { return P.plus(P.monome(a, lettre ? (function () { var l = {}; l[lettre] = 1; return l; })() : { x: 1 }), P.constante(b)); }

  /* =====================================================================
   * Analyse de la forme d'une réponse
   * ===================================================================== */

  function aplatirSomme(n, signe, liste) {
    if (!n.parentheses && (n.type === '+' || n.type === '-')) {
      aplatirSomme(n.g, signe, liste);
      aplatirSomme(n.d, n.type === '-' ? -signe : signe, liste);
    } else if (!n.parentheses && n.type === 'neg' && n.arg.type !== 'neg') {
      aplatirSomme(n.arg, -signe, liste);
    } else {
      liste.push({ signe: signe, noeud: n });
    }
    return liste;
  }
  function contientSommeEntreParentheses(n) {
    if (!n || typeof n !== 'object') return false;
    if ((n.type === '+' || n.type === '-') && n.parentheses) return true;
    if (n.type === 'neg' && n.parentheses) return true;
    return ['g', 'd', 'arg', 'base'].some(function (k) { return n[k] && contientSommeEntreParentheses(n[k]); });
  }
  function polyOuNull(n) { try { return P.depuis(n); } catch (e) { return null; } }

  /** Pourquoi l'expression n'est-elle pas réduite ? null si elle l'est. */
  function raisonNonReduite(texte) {
    if (Maths.estReduite(texte)) return null;
    var termes = aplatirSomme(Maths.analyser(texte), 1, []);
    if (termes.some(function (t) { return contientSommeEntreParentheses(t.noeud); })) {
      return 'Il reste des parenthèses : développe (distributivité) puis réduis.';
    }
    var vus = {};
    for (var i = 0; i < termes.length; i++) {
      var p = polyOuNull(termes[i].noeud);
      if (!p) continue;
      if (P.estZero(p) && termes.length > 1) return 'Un des termes vaut 0 : supprime-le.';
      if (p.length !== 1) continue;
      var k = P.cle(p[0].l);
      if (vus[k]) {
        return 'Il reste des monômes semblables à additionner : ' + vus[k] + ' et ' + P.texte(p.map(function (m) { return { c: m.c.abs(), l: m.l }; })) +
          ' ont la même partie littérale' + (k ? ' (' + P.partieLitterale(p[0]) + ')' : ' (ce sont deux nombres)') + '.';
      }
      vus[k] = P.texte(p.map(function (m) { return { c: m.c.abs(), l: m.l }; }));
    }
    return 'Écris chaque monôme sous sa forme simplifiée : le coefficient devant, puis les lettres (3x plutôt que x · 3, x² plutôt que x · x, x plutôt que 1x, 6x plutôt que 2 · 3x).';
  }

  /** Degrés des termes écrits (dans l'ordre de l'écriture). */
  function degresEcrits(texte, lettre) {
    return aplatirSomme(Maths.analyser(texte), 1, []).map(function (t) {
      var p = polyOuNull(t.noeud);
      return p && p.length ? P.degreMonome(p[0], lettre) : 0;
    });
  }
  function estOrdonnee(texte, lettre) {
    var d = degresEcrits(texte, lettre);
    var dec = true, cro = true;
    for (var i = 1; i < d.length; i++) {
      if (d[i] > d[i - 1]) dec = false;
      if (d[i] < d[i - 1]) cro = false;
    }
    return dec || cro;
  }

  function aplatirProduit(n, liste) {
    if (n.type === '*') { aplatirProduit(n.g, liste); aplatirProduit(n.d, liste); }
    else liste.push(n);
    return liste;
  }

  /**
   * Analyse d'une écriture factorisée.
   * Renvoie null si l'écriture est un produit sans facteur commun restant
   * (et avec au moins options.nbFacteurs facteurs non monômes), sinon le message de refus.
   */
  function raisonNonFactorisee(texte, options) {
    options = options || {};
    var n = Maths.analyser(texte);
    while (n.type === 'neg') n = n.arg;
    if (n.type === '+' || n.type === '-') {
      return 'Ta réponse est une somme : tu as développé au lieu de factoriser. Développer transforme un produit en somme ; factoriser transforme une somme en PRODUIT (voir l\'aide-mémoire, rubrique ' + RUBRIQUES.sommeProduit + ').';
    }
    var facteurs = aplatirProduit(n, []);
    var nonMonomes = 0;
    for (var i = 0; i < facteurs.length; i++) {
      var f = facteurs[i], mult = 1;
      if (f.type === '^' && !(f.base.type === 'lettre' || f.base.type === 'nombre')) { mult = f.exposant; f = f.base; }
      if (f.type === 'neg' && f.parentheses) f = f.arg;
      var p = polyOuNull(f);
      if (!p) return 'Écris un produit de facteurs simples, par exemple 3x(2x – 5).';
      if (p.length < 2) continue;
      nonMonomes += mult;
      var fc = P.facteurCommun(p);
      if (fc.c.compare(1) > 0 || Object.keys(fc.l).length) {
        return 'Il reste un facteur commun dans ' + P.texte(p) + ' : on peut encore mettre ' + P.texteMonome(fc) + ' en évidence.';
      }
    }
    if (nonMonomes === 0) return 'Ta réponse ne contient pas de facteur entre parenthèses : ce n\'est pas une factorisation.';
    if (options.nbFacteurs && nonMonomes < options.nbFacteurs) {
      return 'On peut encore factoriser : un des facteurs est lui-même un produit remarquable (voir l\'aide-mémoire, rubrique ' + RUBRIQUES.remarquables + ').';
    }
    return null;
  }

  /** Message de refus de forme, ou null. */
  function raisonForme(texte, reponse) {
    switch (reponse.forme) {
      case 'reduite':
        return raisonNonReduite(texte);
      case 'ordonnee': {
        var r = raisonNonReduite(texte);
        if (r) return r;
        if (!estOrdonnee(texte, reponse.lettre)) {
          return 'Ta réponse est réduite, mais pas ordonnée : écris les monômes du degré le plus grand au plus petit' +
            (reponse.lettre ? ' (selon les puissances de ' + reponse.lettre + ')' : '') + ', ou du plus petit au plus grand.';
        }
        return null;
      }
      case 'monome': {
        var r2 = raisonNonReduite(texte);
        if (r2) return r2;
        if (aplatirSomme(Maths.analyser(texte), 1, []).length > 1) return 'Écris un seul monôme.';
        return null;
      }
      case 'factorisee':
        return raisonNonFactorisee(texte, reponse);
    }
    return null;
  }

  /* =====================================================================
   * Vérification
   * ===================================================================== */

  function illisible(message) { return { juste: false, statut: 'illisible', message: message }; }
  function nettoyer(t) { return String(t === undefined || t === null ? '' : t).trim(); }

  /** Retire un « A = », « x = », « P = » en tête (l'élève recopie souvent le nom). */
  function sansNom(texte, noms) {
    var m = /^\s*([A-Za-z])\s*=\s*(.+)$/.exec(texte);
    if (m && (!noms || noms.indexOf(m[1]) >= 0)) return m[2];
    return texte;
  }

  var VALEURS_ESSAI = [2, 3, -1, 5, -2, 4, 10, -3];
  /** Contre-exemple : valeurs des lettres pour lesquelles a et b diffèrent (ou null). */
  function contreExemple(a, b) {
    var lettres = Maths.lettres(a).concat(Maths.lettres(b)).filter(function (x, i, t) { return t.indexOf(x) === i; }).sort();
    for (var k = 0; k < VALEURS_ESSAI.length; k++) {
      var v = {};
      lettres.forEach(function (l, i) { v[l] = VALEURS_ESSAI[(k + 2 * i) % VALEURS_ESSAI.length]; });
      try {
        var va = Maths.evaluer(a, v), vb = Maths.evaluer(b, v);
        if (!va.egal(vb)) return { valeurs: v, va: va, vb: vb };
      } catch (e) { /* point non calculable */ }
    }
    return null;
  }
  function texteValeurs(v) {
    return Object.keys(v).map(function (k) { return k + ' = ' + tn(v[k]); }).join(' et ');
  }

  function chercherPiege(pieges, reponseTexte) {
    for (var i = 0; i < (pieges || []).length; i++) {
      var pg = pieges[i];
      if (pg.src === undefined) continue;
      try { if (Maths.equivalentes(reponseTexte, pg.src)) return pg.message; } catch (e) { /* ignore */ }
    }
    return null;
  }

  /** Diagnostic automatique sur un polynôme : erreur de signe ou d'un seul terme. */
  function diagnosticPoly(rep, att) {
    var pr = polyOuNull(rep), pa = polyOuNull(att);
    if (!pr || !pa) return null;
    var diff = P.moins(pr, pa);
    if (diff.length === 1) {
      var m = diff[0];
      var cle = P.cle(m.l);
      var attendu = P.coef(pa, m.l), donne = P.coef(pr, m.l);
      var nom = cle ? 'en ' + P.partieLitterale(m) : 'constant (sans lettre)';
      if (!attendu.estZero() && donne.egal(attendu.oppose())) return 'Erreur de signe sur le terme ' + nom + '.';
      if (attendu.estZero()) return 'Le terme ' + nom + ' ne devrait pas apparaître.';
      if (donne.estZero()) return 'Il manque le terme ' + nom + '.';
      return 'Le terme ' + nom + ' n\'est pas juste : vérifie son coefficient.';
    }
    return null;
  }

  /* ---------- Erreurs typiques reconnues automatiquement (à partir de l'expression de départ) ---------- */

  function versSrc(n) {
    // réécriture d'un arbre en texte lisible par Maths.analyser
    var t;
    switch (n.type) {
      case 'nombre': t = '(' + n.valeur.toString() + ')'; break;
      case 'lettre': t = n.nom; break;
      case 'neg': t = '-(' + versSrc(n.arg) + ')'; break;
      case '^': t = '(' + versSrc(n.base) + ')^(' + n.exposant + ')'; break;
      case 'racine': t = (n.indice === 3 ? '∛' : '√') + '(' + versSrc(n.arg) + ')'; break;
      default: t = '(' + versSrc(n.g) + ')' + { '+': '+', '-': '-', '*': '*', '/': '/' }[n.type] + '(' + versSrc(n.d) + ')';
    }
    return t;
  }
  function estSomme(n) { return n && (n.type === '+' || n.type === '-'); }
  function termesSomme(n) { return aplatirSomme(Object.assign({}, n, { parentheses: false }), 1, []); }
  function sommeDe(termes) {
    return termes.map(function (t, i) { return (t.signe < 0 ? '-' : (i ? '+' : '')) + '(' + versSrc(t.noeud) + ')'; }).join('');
  }
  /** Variante « signe moins oublié » : – (a + b) écrit – a + b. */
  function varianteMoins(n) {
    if (!n || typeof n !== 'object') return null;
    if (n.type === '-' && estSomme(n.d) && n.d.parentheses) {
      var t = termesSomme(n.d);
      return '(' + versSrc(n.g) + ')-' + sommeDe([t[0]]) + (t.length > 1 ? '+(' + sommeDe(t.slice(1)) + ')' : '');
    }
    if (n.type === 'neg' && estSomme(n.arg) && n.arg.parentheses) {
      var t2 = termesSomme(n.arg);
      return '-' + sommeDe([t2[0]]) + '+(' + sommeDe(t2.slice(1)) + ')';
    }
    if (n.type === 'neg' && n.arg.type === '*' && estSomme(n.arg.d) && n.arg.d.parentheses) {
      // – k(a + b) écrit – ka + kb
      var t3 = termesSomme(n.arg.d), k = versSrc(n.arg.g);
      return '-(' + k + ')*' + sommeDe([t3[0]]) + '+(' + k + ')*(' + sommeDe(t3.slice(1)) + ')';
    }
    var cles = ['g', 'd', 'arg', 'base'];
    for (var i = 0; i < cles.length; i++) {
      if (!n[cles[i]]) continue;
      var v = varianteMoins(n[cles[i]]);
      if (v) { var c = Object.assign({}, n); c[cles[i]] = Maths.analyser(v); c[cles[i]].parentheses = true; return versSrc(c); }
    }
    return null;
  }
  /** Variante « (a + b)² = a² + b² ». */
  function varianteCarre(n) {
    if (!n || typeof n !== 'object') return null;
    if (n.type === '^' && n.exposant === 2 && estSomme(n.base)) {
      return sommeDe(termesSomme(n.base).map(function (t) { return { signe: 1, noeud: { type: '^', base: Object.assign({}, t.noeud, { parentheses: true }), exposant: 2 } }; }));
    }
    var cles = ['g', 'd', 'arg', 'base'];
    for (var i = 0; i < cles.length; i++) {
      if (!n[cles[i]]) continue;
      var v = varianteCarre(n[cles[i]]);
      if (v) { var c = Object.assign({}, n); c[cles[i]] = Maths.analyser(v); c[cles[i]].parentheses = true; return versSrc(c); }
    }
    return null;
  }
  /** Diagnostic des erreurs typiques ; null si aucune n'est reconnue. */
  function erreurTypique(reponse, r) {
    var pr = polyOuNull(reponse), pa = polyOuNull(r.attendu);
    if (r.depart) {
      try {
        var arbre = Maths.analyser(r.depart);
        var vm = varianteMoins(arbre);
        if (vm && !Maths.equivalentes(vm, r.attendu) && Maths.equivalentes(reponse, vm)) return 'Tu as oublié de distribuer le signe moins : un signe « – » devant une parenthèse change le signe de TOUS les termes de la parenthèse.';
        var vc = varianteCarre(arbre);
        if (vc && !Maths.equivalentes(vc, r.attendu) && Maths.equivalentes(reponse, vc)) return '(a + b)² n\'est pas a² + b² : il manque le double produit 2ab (voir l\'aide-mémoire, rubrique ' + RUBRIQUES.remarquables + ').';
      } catch (e) { /* ignore */ }
    }
    if (pr && pa && pr.length < pa.length) {
      var un = {};
      P.lettres(pa.concat(pr)).forEach(function (l) { un[l] = 1; });
      try {
        if (P.valeur(pr, un).egal(P.valeur(pa, un))) return 'Tu as additionné des termes qui ne sont pas semblables : par exemple 3a + 2b ne se réduit pas (ce n\'est pas 5ab), et 4 + 5x² n\'est pas 9x². Seuls les monômes de même partie littérale s\'additionnent.';
      } catch (e2) { /* ignore */ }
    }
    return null;
  }

  /** Réponse = expression (équivalente à l'attendu, avec éventuellement une forme exigée). */
  function verifierExpr(q, texteBrut) {
    var r = q.reponse;
    var texte = sansNom(nettoyer(texteBrut), r.nom ? [r.nom] : null);
    if (texte === '') return illisible('Écris ta réponse dans le champ.');
    try { Maths.analyser(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      throw e;
    }
    var permises = Maths.lettres(r.attendu).concat(r.depart ? Maths.lettres(r.depart) : []).concat(r.lettresPermises || []);
    var etrangeres = Maths.lettres(texte).filter(function (l) { return permises.indexOf(l) < 0; });
    if (etrangeres.length) {
      return { juste: false, statut: 'faux', message: 'Ta réponse contient ' + (etrangeres.length > 1 ? 'les lettres ' : 'la lettre ') + etrangeres.join(', ') + ', qui n\'apparaît pas dans l\'expression attendue.' };
    }
    var eq;
    try { eq = Maths.equivalentes(texte, r.attendu); } catch (e2) {
      if (e2 instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible (division par zéro ?). Vérifie ta saisie.');
      throw e2;
    }
    if (eq) {
      var raison = raisonForme(texte, r);
      if (raison) return { juste: false, statut: 'forme', message: 'Ta réponse est bien égale au résultat, mais elle n\'a pas la forme demandée. ' + raison };
      return { juste: true, statut: 'juste', message: '' };
    }
    var p = chercherPiege(q.pieges, texte);
    var diag = p || erreurTypique(texte, r) || diagnosticPoly(texte, r.attendu);
    var ce = contreExemple(texte, r.depart || r.attendu);
    var msg = diag || 'Ta réponse n\'est pas égale au résultat attendu.';
    if (ce && !r.sansContreExemple) {
      msg += ' Contre-exemple : pour ' + texteValeurs(ce.valeurs) + ', ' + (r.depart ? 'l\'expression de départ' : 'le bon résultat') + ' vaut ' + tn(ce.vb) + ', ta réponse vaut ' + tn(ce.va) + '.';
    }
    return { juste: false, statut: 'faux', message: msg };
  }

  /** Lecture d'un nombre seul (sans lettre). Renvoie { exact: Fraction|null, approx: Number } ou lève ErreurSaisie. */
  function lireValeur(texte) {
    var arbre = Maths.analyser(texte);
    if (Maths.lettres(arbre).length) throw new Maths.ErreurSaisie('Écris un nombre, sans lettre.', 0);
    var exact = null;
    try { exact = Maths.evaluer(arbre); } catch (e) {
      if (!(e instanceof Maths.ErreurIrrationnel)) throw e;
    }
    return { exact: exact, approx: exact ? exact.valeur() : Maths.evaluerApproche(arbre) };
  }
  function proches(a, b) { return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }

  function verifierNombre(q, texteBrut) {
    var r = q.reponse;
    var texte = sansNom(nettoyer(texteBrut));
    if (texte === '') return illisible('Écris ta réponse dans le champ.');
    var lu;
    try { lu = lireValeur(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible. Vérifie ta saisie.');
      throw e;
    }
    var att = val(r.valeur);
    if (lu.exact && lu.exact.egal(att)) return { juste: true, statut: 'juste', message: '' };
    for (var i = 0; i < (q.pieges || []).length; i++) {
      var pg = q.pieges[i];
      if (pg.valeur !== undefined && lu.exact && lu.exact.egal(val(pg.valeur))) return { juste: false, statut: 'faux', message: pg.message };
    }
    if (lu.exact && lu.exact.egal(att.oppose())) return { juste: false, statut: 'faux', message: 'Erreur de signe : ta réponse est l\'opposé du résultat.' };
    if (Math.abs(lu.approx - att.valeur()) < 0.01) return { juste: false, statut: 'faux', message: 'Ta réponse est proche, mais elle est arrondie : donne la valeur exacte (fraction si besoin).' };
    return { juste: false, statut: 'faux', message: r.messageFaux || 'Ce n\'est pas le bon résultat.' };
  }

  /**
   * Lecture d'un ensemble de solutions : « 4 », « x = 4 », « S = { 4 } »,
   * « S = { – 3 ; 3 } », « x = 3 ou x = – 3 », « S = { } », « S = ℝ ».
   */
  function lireSolutions(texte) {
    var t = nettoyer(texte).replace(/^S\s*=\s*/i, '').trim();
    if (/^(ℝ|R|IR)$/.test(t)) return { tous: true, elements: [] };
    if (/^\{\s*\}$/.test(t) || t === '∅') return { tous: false, elements: [] };
    t = t.replace(/^\{([\s\S]*)\}$/, '$1');
    t = t.replace(/\bou\b|\bet\b/g, ';');
    t = t.replace(/[a-zA-Z][₁₂12]?\s*=/g, '');
    var parties = t.split(';').map(function (p) { return p.trim(); }).filter(function (p) { return p !== ''; });
    if (!parties.length) throw new Maths.ErreurSaisie('Écris la solution, par exemple S = { 4 }.', 0);
    return { tous: false, elements: parties.map(function (p) { var v = lireValeur(p); v.texte = p; return v; }) };
  }

  function valeurAttendue(s) {
    if (s instanceof F || typeof s === 'number') { var f = val(s); return { exact: f, approx: f.valeur() }; }
    return lireValeur(s);
  }
  function egaliteValeurs(a, b) {
    if (a.exact && b.exact) return a.exact.egal(b.exact);
    if (!a.exact && !b.exact) return proches(a.approx, b.approx);
    return false;
  }

  /** Texte d'un ensemble de solutions attendu. */
  function texteSolutions(r) {
    if (r.tous) return Maths.formaterSolutions('R');
    var vals = r.valeurs.map(function (s) { return (s instanceof F || typeof s === 'number') ? val(s) : null; });
    if (vals.every(function (v) { return v; })) return Maths.formaterSolutions(vals);
    return 'S' + NBSP + '=' + NBSP + '{' + NBSP + r.valeurs.map(function (s) { return typeof s === 'string' ? tx(s) : tn(s); }).join(NBSP + '; ') + NBSP + '}';
  }

  function verifierSolutions(q, texteBrut) {
    var r = q.reponse;
    var texte = nettoyer(texteBrut);
    if (texte === '') return illisible('Écris l\'ensemble des solutions, par exemple S = { 4 }, ou seulement la solution.');
    var lu;
    try { lu = lireSolutions(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Une des valeurs est impossible à calculer.');
      throw e;
    }
    if (r.tous) {
      if (lu.tous) return { juste: true, statut: 'juste', message: '' };
      return { juste: false, statut: 'faux', message: 'Après réduction, on obtient une égalité toujours vraie : tous les nombres sont solutions (S = ℝ).' };
    }
    if (lu.tous) return { juste: false, statut: 'faux', message: 'Tous les nombres ne conviennent pas : essaie par exemple x = 0 dans l\'équation de départ.' };
    var attendus = r.valeurs.map(valeurAttendue);
    if (!attendus.length) {
      if (!lu.elements.length) return { juste: true, statut: 'juste', message: '' };
      return { juste: false, statut: 'faux', message: 'Cette équation n\'a pas de solution : après réduction, on obtient une égalité fausse. On écrit S = { }.' };
    }
    if (!lu.elements.length) return { juste: false, statut: 'faux', message: 'Cette équation a ' + (attendus.length > 1 ? 'des solutions' : 'une solution') + '.' };
    // éléments sans doublons
    var uniques = [];
    lu.elements.forEach(function (e) { if (!uniques.some(function (u) { return egaliteValeurs(u, e); })) uniques.push(e); });
    var manquants = attendus.filter(function (a) { return !uniques.some(function (u) { return egaliteValeurs(u, a); }); });
    var enTrop = uniques.filter(function (u) { return !attendus.some(function (a) { return egaliteValeurs(u, a); }); });
    if (!manquants.length && !enTrop.length) return { juste: true, statut: 'juste', message: '' };
    var msg = '';
    var p = null;
    if (enTrop.length === 1 && uniques.length === 1) {
      for (var i = 0; i < (q.pieges || []).length; i++) {
        var pg = q.pieges[i];
        if (pg.valeur !== undefined && enTrop[0].exact && enTrop[0].exact.egal(val(pg.valeur))) { p = pg.message; break; }
      }
    }
    if (p) msg = p + ' ';
    if (enTrop.length) {
      var e0 = enTrop[0];
      if (attendus.some(function (a) { return Math.abs(a.approx - e0.approx) < 0.01; })) {
        msg += 'Ta valeur est arrondie : donne la valeur exacte (fraction, ou décimal si l\'écriture est finie). ';
      } else if (e0.exact && r.equation) {
        try {
          var v = {}; v[r.lettre || 'x'] = e0.exact;
          var vg = Maths.evaluer(r.equation[0], v), vd = Maths.evaluer(r.equation[1], v);
          msg += 'Vérification par substitution : pour ' + (r.lettre || 'x') + ' = ' + tn(e0.exact) + ', le membre de gauche vaut ' + tn(vg) + ' et le membre de droite ' + tn(vd) + ' : ce n\'est pas une solution. ';
        } catch (e3) { /* ignore */ }
      } else if (!p) {
        msg += tn0(e0) + ' n\'est pas une solution. ';
      }
    }
    var oppose = manquants.some(function (m) { return uniques.some(function (u) { return u.exact && m.exact && u.exact.egal(m.exact.oppose()); }); });
    if (manquants.length && !enTrop.length && oppose) msg += 'Il manque la solution opposée : par exemple x² = 9 a deux solutions, 3 et – 3, car (– 3)² = 9 aussi.';
    else if (manquants.length && !enTrop.length) msg += 'Il manque ' + (manquants.length > 1 ? 'des solutions' : 'une solution') + (r.valeurs.length === 2 ? ' : une équation du deuxième degré peut en avoir deux.' : '.');
    else if (manquants.length && enTrop.length && attendus.length > 1 && uniques.length < attendus.length) msg += 'Il manque aussi une solution.';
    return { juste: false, statut: 'faux', message: msg.trim() };
  }
  function tn0(e) { return e.exact ? tn(e.exact) : e.texte; }

  /** Couple solution d'un système : « (2 ; 3) », « S = { (2 ; 3) } », « x = 2 ; y = 3 ». */
  function lireCouple(texte, lettres) {
    var t = nettoyer(texte).replace(/^S\s*=\s*/i, '').trim().replace(/^\{([\s\S]*)\}$/, '$1').trim();
    lettres = lettres || ['x', 'y'];
    var nomme = {};
    var re = /([a-zA-Z])\s*=\s*([^;]+)/g, m, trouve = false;
    while ((m = re.exec(t))) { nomme[m[1]] = m[2].trim(); trouve = true; }
    var parties;
    if (trouve) {
      if (!(lettres[0] in nomme) || !(lettres[1] in nomme)) throw new Maths.ErreurSaisie('Donne la valeur de ' + lettres[0] + ' et celle de ' + lettres[1] + '.', 0);
      parties = [nomme[lettres[0]], nomme[lettres[1]]];
    } else {
      t = t.replace(/^\(([\s\S]*)\)$/, '$1');
      parties = t.split(';').map(function (p) { return p.trim(); });
      if (parties.length !== 2 || parties.some(function (p) { return !p; })) throw new Maths.ErreurSaisie('Écris le couple solution sous la forme (x ; y), par exemple (2 ; – 1).', 0);
    }
    return parties.map(lireValeur);
  }

  function verifierCouple(q, texteBrut) {
    var r = q.reponse;
    var texte = nettoyer(texteBrut);
    if (texte === '') return illisible('Écris le couple solution, par exemple (2 ; – 1).');
    var lu;
    try { lu = lireCouple(texte, r.lettres); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Une des valeurs est impossible à calculer.');
      throw e;
    }
    var ax = valeurAttendue(r.x), ay = valeurAttendue(r.y);
    if (egaliteValeurs(lu[0], ax) && egaliteValeurs(lu[1], ay)) return { juste: true, statut: 'juste', message: '' };
    if (egaliteValeurs(lu[0], ay) && egaliteValeurs(lu[1], ax)) return { juste: false, statut: 'faux', message: 'Tu as inversé l\'ordre : le couple s\'écrit (' + r.lettres[0] + ' ; ' + r.lettres[1] + ').' };
    var msg = '';
    if (lu[0].exact && lu[1].exact && r.equations) {
      var v = {}; v[r.lettres[0]] = lu[0].exact; v[r.lettres[1]] = lu[1].exact;
      var fausses = [];
      r.equations.forEach(function (e, i) {
        try { if (!Maths.evaluer(e[0], v).egal(Maths.evaluer(e[1], v))) fausses.push(i + 1); } catch (err) { /* ignore */ }
      });
      if (fausses.length) msg = 'Vérification : ce couple ne vérifie pas ' + (fausses.length === 2 ? 'les deux équations.' : 'l\'équation (' + fausses[0] + ').');
    }
    if (egaliteValeurs(lu[0], ax)) msg = 'La valeur de ' + r.lettres[0] + ' est juste, mais pas celle de ' + r.lettres[1] + '. ' + msg;
    else if (egaliteValeurs(lu[1], ay)) msg = 'La valeur de ' + r.lettres[1] + ' est juste, mais pas celle de ' + r.lettres[0] + '. ' + msg;
    return { juste: false, statut: 'faux', message: msg.trim() || 'Ce n\'est pas le bon couple.' };
  }

  /** Formule : exprimer la variable r.variable en fonction des autres. */
  function verifierFormule(q, texteBrut) {
    var r = q.reponse;
    var texte = sansNom(nettoyer(texteBrut), [r.variable]);
    if (texte === '') return illisible('Écris l\'expression de ' + r.variable + '.');
    try { Maths.analyser(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      throw e;
    }
    if (Maths.lettres(texte).indexOf(r.variable) >= 0) {
      return { juste: false, statut: 'forme', message: 'La lettre ' + r.variable + ' ne doit plus apparaître dans ta réponse : exprime ' + r.variable + ' en fonction des AUTRES variables.' };
    }
    var eq;
    try { eq = Maths.equivalentes(texte, r.attendu); } catch (e2) {
      if (e2 instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible. Vérifie ta saisie.');
      throw e2;
    }
    if (eq) return { juste: true, statut: 'juste', message: '' };
    var p = chercherPiege(q.pieges, texte);
    return { juste: false, statut: 'faux', message: p || 'Ce n\'est pas la bonne expression. Contrôle en remplaçant ta réponse dans la formule de départ avec des valeurs simples.' };
  }

  /** Contre-exemple : une valeur de la lettre pour laquelle les deux expressions diffèrent. */
  function verifierContreExemple(q, texteBrut) {
    var r = q.reponse;
    var texte = sansNom(nettoyer(texteBrut), [r.lettre]);
    if (texte === '') return illisible('Écris une valeur de ' + r.lettre + '.');
    var lu;
    try { lu = lireValeur(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible.');
      throw e;
    }
    if (!lu.exact) return illisible('Choisis une valeur simple (un nombre entier, par exemple).');
    var v = {}; v[r.lettre] = lu.exact;
    var va = Maths.evaluer(r.a, v), vb = Maths.evaluer(r.b, v);
    var detail = 'Pour ' + r.lettre + ' = ' + tn(lu.exact) + ' : ' + tx(r.a) + ' = ' + tn(va) + ' et ' + tx(r.b) + ' = ' + tn(vb) + '.';
    if (!va.egal(vb)) return { juste: true, statut: 'juste', message: detail + ' Les valeurs sont différentes : c\'est bien un contre-exemple, donc les expressions ne sont pas égales.' };
    return { juste: false, statut: 'faux', message: detail + ' Les deux valeurs sont égales pour ce nombre : ce n\'est pas un contre-exemple. Essaie une autre valeur (la machine à substituer peut t\'aider).' };
  }

  function verifierChoix(q, texte) {
    var i = parseInt(nettoyer(texte), 10);
    if (!(i >= 0 && i < q.choix.length)) return illisible('Choisis une réponse.');
    var c = q.choix[i];
    if (c.juste) return { juste: true, statut: 'juste', message: c.message || '' };
    return { juste: false, statut: 'faux', message: c.message || 'Ce n\'est pas la bonne réponse.' };
  }

  function verifier(q, texte) {
    switch (q.reponse.type) {
      case 'expr': return verifierExpr(q, texte);
      case 'nombre': return verifierNombre(q, texte);
      case 'solutions': return verifierSolutions(q, texte);
      case 'couple': return verifierCouple(q, texte);
      case 'formule': return verifierFormule(q, texte);
      case 'contreexemple': return verifierContreExemple(q, texte);
      case 'choix': return verifierChoix(q, texte);
    }
    throw new Error('Type de réponse inconnu : ' + q.reponse.type);
  }

  /* =====================================================================
   * Exemples de réponses (tests automatiques et test de l'interface)
   * ===================================================================== */
  function exemples(q) {
    var r = q.reponse;
    var justes = [], faux = [];
    switch (r.type) {
      case 'expr':
        justes.push(tx(r.attendu));
        if (r.alternatives) justes = justes.concat(r.alternatives);
        (q.pieges || []).forEach(function (p) { if (p.src !== undefined) faux.push(tx(p.src)); });
        faux.push(tx(r.attendu + '+1'));
        break;
      case 'nombre':
        justes.push(tn(r.valeur));
        if (!val(r.valeur).estDecimale()) justes.push(val(r.valeur).toString());
        faux.push(tn(val(r.valeur).plus(1)));
        break;
      case 'solutions':
        justes.push(texteSolutions(r));
        if (!r.tous && r.valeurs.length === 1) {
          var s = r.valeurs[0];
          justes.push(typeof s === 'string' ? s : val(s).toString());
          justes.push((r.lettre || 'x') + ' = ' + (typeof s === 'string' ? s : tn(s)));
          faux.push(typeof s === 'string' ? s + '+1' : tn(val(s).plus(1)));
        } else if (!r.tous && r.valeurs.length === 2) {
          var t0 = r.valeurs.map(function (v) { return typeof v === 'string' ? v : val(v).toString(); });
          justes.push(t0[1] + ' ; ' + t0[0]);
          faux.push(t0[0]);
        } else if (r.tous) {
          justes.push('R');
          faux.push('S = { 0 }');
        } else {
          justes.push('{ }');
          faux.push('0');
        }
        break;
      case 'couple':
        justes.push(Maths.formaterCoordonnees(val(r.x), val(r.y)));
        justes.push(r.lettres[0] + ' = ' + val(r.x).toString() + ' ; ' + r.lettres[1] + ' = ' + val(r.y).toString());
        faux.push(Maths.formaterCoordonnees(val(r.y).plus(1), val(r.x)));
        break;
      case 'formule':
        justes.push(tx(r.attendu));
        (q.pieges || []).forEach(function (p) { if (p.src !== undefined) faux.push(tx(p.src)); });
        break;
      case 'contreexemple':
        justes.push(tn(r.exemple));
        if (r.pasExemple !== undefined && r.pasExemple !== null) faux.push(tn(r.pasExemple));
        break;
      case 'choix':
        q.choix.forEach(function (c, i) { (c.juste ? justes : faux).push(String(i)); });
        break;
    }
    return { justes: justes, faux: faux };
  }

  /* =====================================================================
   * Constructeurs de questions
   * ===================================================================== */

  /** Touches du clavier mathématique adaptées à la question. */
  function clavierPour(lettres, options) {
    options = options || {};
    var touches = ['7', '8', '9', '(', ')', 'effacer',
      '4', '5', '6', '·', ':', 'fraction',
      '1', '2', '3', '+', '–', 'exposant', '0', ','];
    if (options.solutions) touches.push(';', '{ }', 'ℝ', '√');
    else if (options.couple) touches.push(';');
    (lettres || []).forEach(function (l) { touches.push(l); });
    touches.push('valider');
    return touches;
  }

  function finaliser(q) {
    // un piège égal à la bonne réponse ne doit jamais servir (cas particuliers des tirages)
    if (q.pieges && q.reponse) {
      q.pieges = q.pieges.filter(function (pg) {
        try {
          if (pg.src !== undefined && (q.reponse.type === 'expr' || q.reponse.type === 'formule')) return !Maths.equivalentes(pg.src, q.reponse.attendu);
          if (pg.valeur !== undefined && q.reponse.type === 'nombre') return !val(pg.valeur).egal(val(q.reponse.valeur));
          if (pg.valeur !== undefined && q.reponse.type === 'solutions') return !(q.reponse.valeurs || []).some(function (v) { return typeof v !== 'string' && val(v).egal(val(pg.valeur)); });
        } catch (e) { return false; }
        return true;
      });
    }
    // deux pièges identiques ne peuvent pas être distingués : on garde le premier
    if (q.pieges) {
      q.pieges = q.pieges.filter(function (pg, i, t) {
        return !t.slice(0, i).some(function (o) {
          try {
            if (pg.valeur !== undefined && o.valeur !== undefined) return val(pg.valeur).egal(val(o.valeur));
            if (pg.src !== undefined && o.src !== undefined) return Maths.equivalentes(pg.src, o.src);
          } catch (e) { /* comparaison impossible : on garde les deux */ }
          return false;
        });
      });
    }
    q.verifier = function (texte) { return verifier(q, texte); };
    q.exemples = function () { return exemples(q); };
    if (!q.etapes) q.etapes = [];
    // une seule étape : pas de titre « ÉTAPE 1 »
    if (q.etapes.length === 1) q.etapes[0] = { titre: '', texte: q.etapes[0].texte, calcul: q.etapes[0].calcul };
    if (q.reponse.type === 'expr' || q.reponse.type === 'formule') {
      q.attenduHtml = q.attenduHtml || hx(q.reponse.attendu);
      if (!q.clavier) {
        var l = Maths.lettres(q.reponse.attendu).concat(q.reponse.lettresPermises || []);
        if (q.reponse.variable) l = l.concat(Maths.lettres(q.reponse.formule ? q.reponse.formule[0] + '+' + q.reponse.formule[1] : ''));
        l = l.filter(function (x, i, t) { return t.indexOf(x) === i && x !== q.reponse.variable; }).sort();
        q.clavier = clavierPour(l.length ? l : ['x']);
      }
    } else if (q.reponse.type === 'nombre' || q.reponse.type === 'contreexemple') {
      q.attenduHtml = q.attenduHtml || (q.reponse.type === 'nombre' ? hn(q.reponse.valeur) : null);
      q.clavier = q.clavier || clavierPour([]);
    } else if (q.reponse.type === 'solutions') {
      q.attenduHtml = q.attenduHtml || hm(texteSolutions(q.reponse));
      q.clavier = q.clavier || clavierPour([], { solutions: true });
    } else if (q.reponse.type === 'couple') {
      q.attenduHtml = q.attenduHtml || hm('S = { ' + Maths.formaterCoordonnees(val(q.reponse.x), val(q.reponse.y)) + ' }');
      q.clavier = q.clavier || clavierPour([], { couple: true });
    }
    return q;
  }

  /** Choix mélangés (le mélange dépend de l'aléa de la question). */
  function melangerChoix(alea, choix) { return alea.melanger(choix); }

  /**
   * Vrai ou faux avec choix de la justification.
   * def : { vrai: bool, justeVrai: html, justeFaux: html, autresVrai: [html], autresFaux: [html] }
   * Les options « Vrai, car … » et « Faux, car … » : une seule est juste.
   */
  function optionsVraiFaux(alea, def) {
    var opts = [];
    var bonne = def.vrai ? { h: '<strong>Vrai</strong>, car ' + def.justeVrai, juste: true } : { h: '<strong>Faux</strong>, car ' + def.justeFaux, juste: true };
    bonne.message = def.messageJuste || '';
    opts.push(bonne);
    (def.vrai ? def.autresVrai : def.autresFaux || []).slice(0, 1).forEach(function (h) {
      opts.push({ h: '<strong>' + (def.vrai ? 'Vrai' : 'Faux') + '</strong>, car ' + h, juste: false, message: 'Le verdict est bon, mais pas la justification. ' + (def.messageFaux || '') });
    });
    (def.vrai ? def.autresFaux : def.autresVrai || []).slice(0, 2).forEach(function (h) {
      opts.push({ h: '<strong>' + (def.vrai ? 'Faux' : 'Vrai') + '</strong>, car ' + h, juste: false, message: def.messageFaux || '' });
    });
    return melangerChoix(alea, opts);
  }

  /* =====================================================================
   * Exemples de référence de l'enseignante (non publics) : l'appli ne doit
   * jamais les proposer, ni tels quels, ni avec d'autres lettres, ni avec les
   * membres échangés ou réécrits (même polynôme g – d, au signe près).
   * ===================================================================== */
  var REFERENCES = [
    '(3x-4)-(11)', '(4x-3)-(2x+1)', '(2x-3)(x+4)', '6a^2b-9ab', '4x^3y-16xy', 'x^2-5x+6', '2x+y-7', 'x-y-2'
  ];
  /** Signature d'un polynôme indépendante du nom des lettres et d'un facteur constant. */
  function signature(p) {
    if (!p || !p.length) return '';
    var t = p.map(function (m) {
      var ex = Object.keys(m.l).map(function (k) { return m.l[k]; }).sort();
      return { c: m.c, ex: ex.join(',') };
    }).sort(function (a, b) { return a.ex < b.ex ? -1 : a.ex > b.ex ? 1 : a.c.compare(b.c); });
    var signe = t[t.length - 1].c.signe() < 0 ? -1 : 1; // au signe près (g – d ou d – g)
    return t.map(function (x) { return x.ex + ':' + x.c.fois(signe).toString(); }).sort().join('|');
  }
  var SIGNATURES_REFERENCES = REFERENCES.map(function (r) { return signature(P.depuis(r)); });
  /** Vrai si l'une des expressions (ou équations « g – d ») ressemble à un exemple de référence. */
  function ressembleReference(sources) {
    return sources.some(function (src) {
      var p = polyOuNull(src);
      return p && p.length && SIGNATURES_REFERENCES.indexOf(signature(p)) >= 0;
    });
  }
  /** Expressions et équations d'une question (pour la comparaison aux références). */
  function sourcesQuestion(q) {
    var r = q.reponse || {}, c = q.controle || {}, s = [];
    if (r.depart) s.push(r.depart);
    if (r.type === 'expr' && r.attendu) s.push(r.attendu);
    if (r.equation) s.push('(' + r.equation[0] + ')-(' + r.equation[1] + ')');
    if (c.g && c.d) s.push('(' + c.g + ')-(' + c.d + ')');
    if (c.eq) s.push('(' + c.eq[0] + ')-(' + c.eq[1] + ')');
    if (c.equations) c.equations.forEach(function (e) { s.push('(' + e[0] + ')-(' + e[1] + ')'); });
    if (c.expr) s.push(c.expr);
    return s;
  }

  return {
    ressembleReference: ressembleReference,
    sourcesQuestion: sourcesQuestion,
    Maths: Maths,
    P: P,
    F: F,
    NBSP: NBSP,
    MOINS: MOINS,
    RUBRIQUES: RUBRIQUES,
    PRENOMS: PRENOMS,
    fr: fr, val: val, pgcd: pgcd, nonNul: nonNul, positif: positif, sauf: sauf,
    tx: tx, hx: hx, hm: hm, heq: heq, teq: teq, hp: hp, hn: hn, tn: tn, tnp: tnp, sn: sn,
    empiler: empiler, echapper: echapper,
    substituerTexte: substituerTexte,
    srcTermes: srcTermes, mo: mo, lin: lin,
    raisonNonReduite: raisonNonReduite,
    raisonNonFactorisee: raisonNonFactorisee,
    estOrdonnee: estOrdonnee,
    raisonForme: raisonForme,
    contreExemple: contreExemple,
    texteValeurs: texteValeurs,
    lireValeur: lireValeur,
    lireSolutions: lireSolutions,
    lireCouple: lireCouple,
    texteSolutions: texteSolutions,
    verifier: verifier,
    exemples: exemples,
    clavierPour: clavierPour,
    finaliser: finaliser,
    optionsVraiFaux: optionsVraiFaux,
    melangerChoix: melangerChoix
  };
});
