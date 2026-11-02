/*
 * nombres/js/outils.js — outils communs aux générateurs de l'appli « Nombres et opérations »
 * ------------------------------------------------------------------------------------------
 * Logique pure (sans DOM) : fonctionne dans le navigateur (objet global NombresOutils)
 * et dans Node (require). Dépend uniquement de assets/maths.js.
 *
 * Contenu :
 *   - écriture HTML des nombres selon l'aide-mémoire (via Maths.html et Maths.formater…) ;
 *   - petit constructeur d'expressions (X) qui produit en même temps l'affichage HTML,
 *     un texte de contrôle lisible par Maths.analyser et la valeur exacte ;
 *   - constructeurs de questions (saisie, choix, vrai/faux, erreur d'un élève fictif) ;
 *   - vérification des réponses et rétroactions (erreur probable, forme exigée).
 *
 * Une question est un objet simple :
 *   { type, enonce (HTML), consigne (HTML), indice (HTML),
 *     reponse: { type: 'valeur' | 'liste' | 'entre' | 'montant' | 'coloriage' | 'choix', … },
 *     choix: [{ h, juste, message }]   (questions à choix)
 *     etapes: [{ titre, texte, calcul }], verification (HTML), rubrique,
 *     visuel (facultatif), nombres: [Fraction] (bornes, pour les tests),
 *     controle: { … } (recalcul indépendant, pour les tests),
 *     verifier(texte) -> { juste, statut, message } }
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('../../assets/maths.js'));
  else racine.NombresOutils = fabrique(racine.Maths);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Maths) {
  'use strict';

  var F = Maths.Fraction;
  var NBSP = ' ';
  var MOINS = Maths.MOINS;

  /* =====================================================================
   * Rubriques de l'aide-mémoire (renvois par le NOM de la rubrique).
   * À VÉRIFIER par l'enseignante : intitulés exacts de l'édition 2024.
   * Tout est regroupé ici pour pouvoir les corriger en un seul endroit.
   * ===================================================================== */
  var RUBRIQUES = {
    ensembles: 'Ensembles de nombres',
    vocabulaireFractions: 'Fractions',
    amplifier: 'Amplification et simplification de fractions',
    ecrituresDecimales: 'Écriture décimale d\'une fraction',
    comparer: 'Comparaison de nombres',
    fractionNombre: 'Fraction d\'un nombre',
    addFractions: 'Addition et soustraction de fractions',
    mulFractions: 'Multiplication et division de fractions',
    decimaux: 'Opérations avec les nombres décimaux',
    estimation: 'Estimation et arrondi',
    pourcentages: 'Pourcentages',
    priorites: 'Priorité des opérations',
    opposeInverse: 'Nombres opposés et nombres inverses',
    puissances: 'Puissances',
    proprietesPuissances: 'Propriétés des puissances',
    notationScientifique: 'Notation scientifique',
    prefixes: 'Préfixes et puissances de 10',
    racines: 'Racines',
    relatifs: 'Nombres relatifs',
    addRelatifs: 'Addition et soustraction de nombres relatifs',
    mulRelatifs: 'Multiplication et division de nombres relatifs',
    diagrammes: 'Diagrammes'
  };

  /* =====================================================================
   * Contextes (prénoms fictifs, lieux de Suisse romande)
   * ===================================================================== */
  var PRENOMS = ['Léa', 'Noah', 'Elif', 'Luca', 'Amélie', 'Yanis', 'Sara', 'Mattia', 'Inès',
    'Gabriel', 'Aline', 'Kevin', 'Zoé', 'Nathan', 'Maëlle', 'Dario', 'Chloé', 'Arben',
    'Lou', 'Timéo', 'Jade', 'Ilyas', 'Emma', 'Loris'];
  var LIEUX = ['La Chaux-de-Fonds', 'Neuchâtel', 'Le Locle', 'Fleurier', 'Yverdon-les-Bains',
    'Bienne', 'Lausanne', 'Fribourg', 'Delémont', 'Saint-Imier', 'Cernier', 'Boudry'];

  /* =====================================================================
   * Petits outils numériques
   * ===================================================================== */

  function fr(a, b) { return new F(a, b === undefined ? 1 : b); }
  function val(x) { return F.depuis(x); }
  function pgcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function ppmc(a, b) { return Math.abs(a * b) / pgcd(a, b); }
  function num(x) { return Number(val(x).num); }
  function den(x) { return Number(val(x).den); }
  function pow10(n) { return new F(10).puissance(n); }

  /** Entier entre min et max, choisi par alea, différent des valeurs interdites. */
  function entierSauf(alea, min, max, interdits) {
    var n, essais = 0;
    do { n = alea.entier(min, max); essais++; } while (interdits.indexOf(n) >= 0 && essais < 200);
    return n;
  }

  /** Décimal aléatoire : entier entre min et max divisé par 10^d. */
  function decimal(alea, min, max, d) {
    return new F(alea.entier(min, max), Math.pow(10, d));
  }

  /** Nombre de décimales d'un décimal (fraction dont le dénominateur divise une puissance de 10). */
  function nbDecimales(x) {
    var f = val(x), d = 0;
    while (!f.estEntier() && d < 30) { f = f.fois(10); d++; }
    return d;
  }

  /** Plus grand carré parfait qui divise n (n entier positif). */
  function plusGrandCarre(n) {
    var best = 1;
    for (var k = 2; k * k <= n; k++) if (n % (k * k) === 0) best = k * k;
    return best;
  }
  function sansFacteurCarre(n) { return plusGrandCarre(n) === 1; }

  /* =====================================================================
   * Écriture HTML (conventions de l'aide-mémoire, via assets/maths.js)
   * ===================================================================== */

  var H = {
    /** Fraction empilée (ou entier). */
    f: function (x) { return Maths.html.fraction(x); },
    /** Écriture décimale exacte (période barrée). */
    n: function (x) { return Maths.html.nombre(x); },
    /** Nombre arrondi (décimales imposées). */
    arrondi: function (x, d) { return Maths.formaterNombre(x, d); },
    /** Relatif entre parenthèses (9e) : (+ 5), (– 3) ; fraction empilée si besoin. */
    rel: function (x, options) {
      var f = val(x);
      options = options || {};
      if (f.estZero()) return '0';
      var corps = options.fraction || !f.estDecimale() ? H.f(f.abs()) : H.n(f.abs());
      var signe = f.signe() < 0 ? '–' : '+';
      if (options.parentheses === false) return f.signe() < 0 ? MOINS + corps : corps;
      return '(' + signe + NBSP + corps + ')';
    },
    /** Fraction avec parenthèses si négative : (– 3/4). */
    fp: function (x) { var f = val(x); return f.signe() < 0 ? '(' + H.f(f) + ')' : H.f(f); },
    /** Nombre (décimal) avec parenthèses si négatif. */
    np: function (x) { var f = val(x); return f.signe() < 0 ? '(' + H.n(f) + ')' : H.n(f); },
    pui: function (base, n) { return Maths.formaterPuissance(base, n); },
    sci: function (x, d) { return Maths.formaterNotationScientifique(x, d); },
    /** Notation scientifique à partir de la mantisse et de l'exposant (mantisse déjà entre 1 et 10). */
    sciME: function (m, e) { return H.n(m) + NBSP + '·' + NBSP + '10' + Maths.texteExposant(e); },
    rac: function (r, indice, coef) { return Maths.formaterRacine(r, indice, coef); },
    /** Racine n-ième : ⁴√81. */
    racN: function (r, n) {
      if (n === 2) return '√' + H.n(r);
      if (n === 3) return '∛' + H.n(r);
      return '<sup>' + n + '</sup>√' + H.n(r);
    },
    /** Fraction empilée à partir de deux morceaux HTML : (3 · 2)/(4 · 2). */
    fh: function (n, d) { return '<span class="frac"><span>' + n + '</span><span>' + d + '</span></span>'; },
    chf: function (x) { return Maths.formaterMontant(x); },
    chfStyle: function (x) { return Maths.formaterMontant(x, { style: 'CHF' }); },
    liste: function (t) { return t.join(NBSP + '; '); },
    maths: function (h) { return '<span class="maths">' + h + '</span>'; },
    moins: MOINS,
    nbsp: NBSP
  };

  /* =====================================================================
   * Constructeur d'expressions : X.n(valeur) puis X.op(a, '+', b)…
   * Chaque nœud : { h: HTML, t: texte de contrôle (Maths.analyser), v: Fraction,
   *                 prio: 1 (+ –), 2 (· :), 3 (puissance), 4 (nombre) }
   * ===================================================================== */

  var X = {
    /**
     * Nombre. style : 'fraction' (défaut), 'decimal', 'relatif' (9e : toujours (± n)).
     */
    n: function (x, style) {
      var f = val(x);
      var h;
      if (style === 'relatif') h = H.rel(f, { fraction: !f.estDecimale() });
      else if (style === 'decimal') h = H.n(f);
      else h = H.f(f);
      return { h: h, t: '(' + f.toString() + ')', v: f, prio: 4, neg: f.signe() < 0 && style !== 'relatif', style: style };
    },
    /** Opération binaire : '+', '–', '·', ':'. */
    op: function (a, op, b) {
      var prio = (op === '+' || op === '–') ? 1 : 2;
      var v;
      if (op === '+') v = a.v.plus(b.v);
      else if (op === '–') v = a.v.moins(b.v);
      else if (op === '·') v = a.v.fois(b.v);
      else if (op === ':') v = a.v.divise(b.v);
      else throw new Error('Opération inconnue ' + op);
      var gh = (a.prio < prio) ? '(' + a.h + ')' : a.h;
      // à droite : parenthèses si priorité inférieure ou égale (soustraction, division) ou nombre négatif
      var besoinD = b.neg || b.prio < prio || (b.prio === prio && (op === '–' || op === ':'));
      var dh = besoinD ? '(' + b.h + ')' : b.h;
      var tOp = { '+': '+', '–': '-', '·': '*', ':': ':' }[op];
      return { h: gh + ' ' + op + ' ' + dh, t: '(' + a.t + ')' + tOp + '(' + b.t + ')', v: v, prio: prio, neg: false };
    },
    /** Puissance a^n (n entier). */
    pow: function (a, n) {
      var bh = (a.prio < 4 || a.neg || a.style === 'relatif' && a.v.signe() < 0 || !a.v.estEntier()) ? '(' + a.h + ')' : a.h;
      if (a.style === 'relatif' && a.v.signe() < 0) bh = a.h; // déjà entre parenthèses
      return { h: bh + Maths.texteExposant(n), t: '(' + a.t + ')^(' + n + ')', v: a.v.puissance(n), prio: 3, neg: false };
    },
    /** Racine carrée (2) ou cubique (3) d'une expression. */
    rac: function (a, indice) {
      indice = indice || 2;
      var signe = indice === 3 ? '∛' : '√';
      var h = a.prio === 4 && !a.neg ? signe + a.h : signe + '(' + a.h + ')';
      return { h: h, t: signe + '(' + a.t + ')', v: a.v.racine(indice), prio: 3, neg: false };
    },
    /** Opposé d'une expression : – a (écrit devant). */
    neg: function (a) {
      var h = MOINS + (a.prio <= 2 ? '(' + a.h + ')' : a.h);
      return { h: h, t: '-(' + a.t + ')', v: a.v.oppose(), prio: 1.5, neg: true };
    },
    /** Parenthèses explicites (pour l'affichage). */
    par: function (a) { return { h: '(' + a.h + ')', t: a.t, v: a.v, prio: 4, neg: false }; }
  };

  /* =====================================================================
   * Arbres de calcul : correction pas à pas selon les priorités
   *   A.f(valeur, style)        feuille (style : 'fraction', 'decimal', 'relatif')
   *   A.o(op, g, d)             op : '+', '–', '·', ':'
   *   A.p(base, n)              puissance (n entier)
   *   A.r(arg, indice)          racine carrée (2) ou cubique (3)
   *   A.par(noeud)              parenthèses imposées à l'affichage
   *   A.valeur(n), A.html(n), A.texte(n) (contrôle), A.etapes(n), A.naif(n)
   * ===================================================================== */

  var A = {
    f: function (v, style) { return { feuille: true, v: val(v), style: style || 'fraction' }; },
    o: function (op, g, d) { return { op: op, g: g, d: d }; },
    p: function (base, n) { return { op: '^', g: base, n: n }; },
    r: function (arg, indice) { return { op: 'rac', g: arg, indice: indice || 2 }; },
    par: function (n) { var c = {}; for (var k in n) c[k] = n[k]; c.par = true; return c; },
    prio: function (n) {
      if (n.feuille) return 4;
      if (n.op === '^' || n.op === 'rac') return 3;
      if (n.op === '·' || n.op === ':') return 2;
      return 1;
    },
    valeur: function (n) {
      if (n.feuille) return n.v;
      if (n.op === '^') return A.valeur(n.g).puissance(n.n);
      if (n.op === 'rac') return A.valeur(n.g).racine(n.indice);
      var a = A.valeur(n.g), b = A.valeur(n.d);
      if (n.op === '+') return a.plus(b);
      if (n.op === '–') return a.moins(b);
      if (n.op === '·') return a.fois(b);
      return a.divise(b);
    },
    texte: function (n) {
      if (n.feuille) return '(' + n.v.toString() + ')';
      if (n.op === '^') return '(' + A.texte(n.g) + ')^(' + n.n + ')';
      if (n.op === 'rac') return (n.indice === 3 ? '∛' : '√') + '(' + A.texte(n.g) + ')';
      var t = { '+': '+', '–': '-', '·': '*', ':': ':' }[n.op];
      return '(' + A.texte(n.g) + ')' + t + '(' + A.texte(n.d) + ')';
    },
    /** Faut-il des parenthèses autour de l'enfant e (côté 'g' ou 'd') du nœud parent ? */
    besoinPar: function (e, parent, cote, debut) {
      if (e.par) return true;
      if (!parent) return false;
      if (e.feuille) {
        if (e.style === 'relatif') return false; // déjà « (– 3) »
        if (e.v.signe() < 0) {
          if (parent.op === '^') return true;
          return !(debut && cote === 'g');
        }
        if (parent.op === '^' && !e.v.estEntier()) return true;
        return false;
      }
      var pe = A.prio(e), pp = A.prio(parent);
      if (parent.op === '^') return true;
      if (parent.op === 'rac') return false;
      if (pe < pp) return true;
      if (cote === 'd' && pe === pp && (parent.op === '–' || parent.op === ':')) return true;
      return false;
    },
    feuilleHtml: function (n) {
      if (n.style === 'relatif') return H.rel(n.v, { fraction: !n.v.estDecimale() });
      if (n.style === 'decimal' || (n.v.estDecimale() && n.style !== 'fraction')) return H.n(n.v);
      return H.f(n.v);
    },
    html: function (n, parent, cote, debut) {
      if (debut === undefined) debut = true;
      var h;
      var par = A.besoinPar(n, parent, cote, debut);
      var d0 = par ? true : debut;
      if (n.feuille) h = A.feuilleHtml(n);
      else if (n.op === '^') h = A.html(n.g, n, 'g', true) + Maths.texteExposant(n.n);
      else if (n.op === 'rac') {
        var arg = A.html(n.g, n, 'g', true);
        h = (n.indice === 3 ? '∛' : '√') + (n.g.feuille && n.g.v.signe() >= 0 ? arg : '(' + arg + ')');
      } else {
        h = A.html(n.g, n, 'g', d0) + ' ' + n.op + ' ' + A.html(n.d, n, 'd', false);
      }
      return par ? '(' + h + ')' : h;
    },
    /** Nœuds calculables (enfants déjà calculés), avec l'information « entre parenthèses ». */
    candidats: function (n, parent, cote, debut, liste) {
      if (n.feuille) return liste;
      var par = A.besoinPar(n, parent, cote, debut);
      var enfantsFeuilles = n.g.feuille && (n.op === '^' || n.op === 'rac' || n.d.feuille);
      if (enfantsFeuilles) liste.push({ noeud: n, par: par, prio: A.prio(n) });
      else {
        A.candidats(n.g, n, 'g', par ? true : debut, liste);
        if (n.d) A.candidats(n.d, n, 'd', false, liste);
      }
      return liste;
    },
    remplacer: function (n, cibles) {
      if (n.feuille) return n;
      if (cibles.indexOf(n) >= 0) {
        var f = A.f(A.valeur(n), n.styleResultat || A.styleDe(n));
        return f;
      }
      var c = {};
      for (var k in n) c[k] = n[k];
      c.g = A.remplacer(n.g, cibles);
      if (n.d) c.d = A.remplacer(n.d, cibles);
      return c;
    },
    styleDe: function (n) {
      if (n.feuille) return n.style;
      return A.styleDe(n.g);
    },
    /** Étapes [texte, calculHtml] selon les priorités de l'aide-mémoire. */
    etapes: function (racine) {
      var et = [];
      var courant = racine;
      var garde = 0;
      while (!courant.feuille && garde++ < 20) {
        var c = A.candidats(courant, null, null, true, []);
        var entre = c.filter(function (x) { return x.par; });
        var choisis;
        var texte;
        if (entre.length) {
          var pmax = Math.max.apply(null, entre.map(function (x) { return x.prio; }));
          choisis = entre.filter(function (x) { return x.prio === pmax; });
          texte = 'Je calcule d\'abord entre parenthèses.';
        } else {
          var pm = Math.max.apply(null, c.map(function (x) { return x.prio; }));
          choisis = c.filter(function (x) { return x.prio === pm; });
          texte = pm === 3 ? 'Je calcule les puissances et les racines.' : pm === 2 ? 'Je calcule les multiplications et les divisions, de gauche à droite.' : 'Je calcule les additions et les soustractions, de gauche à droite.';
          if (pm === 1) choisis = [choisis[0]];
          if (pm === 2) choisis = [choisis[0]].concat(choisis.slice(1));
        }
        courant = A.remplacer(courant, choisis.map(function (x) { return x.noeud; }));
        et.push([texte, '= ' + A.html(courant)]);
      }
      return et;
    },
    /** Valeur obtenue en calculant de gauche à droite sans respecter les priorités (erreur fréquente). */
    naif: function (n) {
      if (n.feuille) return n.v;
      if (n.op === '^') return A.naif(n.g).puissance(n.n);
      if (n.op === 'rac') return A.naif(n.g).racine(n.indice);
      // aplatit la chaîne sans parenthèses
      var termes = [], ops = [];
      (function aplatir(x, parent, cote) {
        var racineChaine = x === n;
        if (!x.feuille && x.op !== '^' && x.op !== 'rac' && (racineChaine || (!A.besoinPar(x, parent, cote, false) && !x.par))) {
          aplatir(x.g, x, 'g'); ops.push(x.op); aplatir(x.d, x, 'd');
        } else termes.push(A.naif(x));
      })(n, null, null);
      var v = termes[0];
      for (var i = 0; i < ops.length; i++) {
        var b = termes[i + 1];
        if (ops[i] === '+') v = v.plus(b);
        else if (ops[i] === '–') v = v.moins(b);
        else if (ops[i] === '·') v = v.fois(b);
        else { if (b.estZero()) return null; v = v.divise(b); }
      }
      return v;
    },
    /** Toutes les feuilles (nombres de l'énoncé). */
    feuilles: function (n, liste) {
      liste = liste || [];
      if (n.feuille) liste.push(n.v);
      else { A.feuilles(n.g, liste); if (n.d) A.feuilles(n.d, liste); }
      return liste;
    }
  };

  /* =====================================================================
   * Lecture des réponses
   * ===================================================================== */

  function nettoyer(texte) {
    return String(texte == null ? '' : texte).replace(/ /g, ' ').trim();
  }

  function echapperRegExp(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /** Retire une unité finale (%, °, km…) si l'élève l'a écrite. */
  function sansUnite(texte, unite) {
    if (!unite) return texte;
    var u = Array.isArray(unite) ? unite : [unite];
    for (var i = 0; i < u.length; i++) {
      var re = new RegExp('\\s*' + echapperRegExp(u[i]) + '\\s*$', 'i');
      if (re.test(texte)) return texte.replace(re, '');
    }
    return texte;
  }

  /** Erreur de lecture : on demande à l'élève de recommencer (non compté). */
  function illisible(message) {
    return { juste: false, statut: 'illisible', message: message };
  }

  /**
   * Lit un nombre ou une fraction a/b saisis par l'élève.
   * Renvoie { valeur: Fraction, arbre, simple: bool } ; lève Maths.ErreurSaisie.
   * simple = un seul nombre (décimal, périodique, entier) ou une fraction d'entiers.
   */
  function lireNombre(texte) {
    var arbre = Maths.analyser(texte);
    var valeur = Maths.evaluer(arbre);
    return { valeur: valeur, arbre: arbre, simple: estNombreSimple(arbre) };
  }

  function estLitteral(n) { return n.type === 'nombre'; }
  function estNombreSimple(n) {
    if (n.type === 'neg') n = n.arg;
    if (estLitteral(n)) return true;
    if (n.type === '/' && n.symbole === '/' && estLitteral(n.g) && estLitteral(n.d) &&
        n.g.valeur.estEntier() && n.d.valeur.estEntier() && !n.parentheses) return true;
    return false;
  }
  function estDecimalEcrit(n) {
    if (n.type === 'neg') n = n.arg;
    return estLitteral(n);
  }

  /** Analyse d'un texte « a/b » : { a, b } ou null. */
  function fractionEcrite(texte) {
    var m = /^[–\-−]?\s*\(?\s*(\d+)\s*\/\s*(\d+)\s*\)?$/.exec(nettoyer(texte));
    return m ? { a: parseInt(m[1], 10), b: parseInt(m[2], 10) } : null;
  }

  /* =====================================================================
   * Rétroactions génériques quand la valeur est fausse
   * ===================================================================== */

  function estPuissanceDe10(f) {
    if (f.estZero()) return 0;
    var a = f.abs();
    for (var k = -8; k <= 8; k++) if (k !== 0 && a.egal(pow10(k))) return k;
    return 0;
  }

  function diagnosticGenerique(v, attendu, options) {
    options = options || {};
    if (!attendu.estZero() && v.egal(attendu.oppose())) {
      return 'Attention au signe : ta réponse est l\'opposé du résultat.';
    }
    if (!attendu.estZero() && !v.estZero() && !attendu.egal(1) && !attendu.egal(-1) &&
        v.egal(attendu.inverse())) {
      return 'Tu as donné l\'inverse du résultat (numérateur et dénominateur échangés).';
    }
    if (!attendu.estZero() && !v.estZero()) {
      var k = estPuissanceDe10(v.divise(attendu));
      if (k) return 'La virgule est mal placée : ta réponse est ' + (k > 0 ? Math.pow(10, k) + ' fois trop grande' : Math.pow(10, -k) + ' fois trop petite') + '.';
    }
    if (!attendu.estDecimale() && !v.egal(attendu)) {
      var ecart = Math.abs(v.valeur() - attendu.valeur());
      if (ecart < 0.006 * Math.max(1, Math.abs(attendu.valeur()))) {
        return 'Ta réponse est une valeur arrondie. On demande la valeur exacte : une fraction ou l\'écriture périodique (avec la barre sur la période, ou « … »).';
      }
    }
    if (options.estimation) {
      var r = v.valeur() / attendu.valeur();
      if (r > 3 || r < 1 / 3) return 'Ta réponse est très loin d\'une estimation du résultat. Estime d\'abord l\'ordre de grandeur.';
    }
    return 'Ce n\'est pas le bon résultat.';
  }

  function chercherPiege(pieges, v, texte) {
    for (var i = 0; i < (pieges || []).length; i++) {
      var p = pieges[i];
      if (p.valeur !== undefined && v && val(p.valeur).egal(v)) return p.message;
      if (p.test && p.test(texte, v)) return p.message;
    }
    return null;
  }

  /* =====================================================================
   * Vérification d'une réponse
   * ===================================================================== */

  var MESSAGES_FORME = {
    irreductible: 'La consigne demande une fraction irréductible : c\'est l\'écriture la plus simple, et elle est unique, ce qui permet de comparer facilement les résultats.',
    decimal: 'La consigne demande l\'écriture décimale (avec la virgule), pas une fraction.',
    entier: 'La réponse attendue est un nombre entier.',
    scientifique: 'La consigne demande la notation scientifique a · 10ⁿ avec 1 ⩽ a < 10 : un seul chiffre non nul devant la virgule. Cette écriture permet de lire tout de suite l\'ordre de grandeur.'
  };

  /** Vérifie une réponse « valeur » (nombre, fraction, puissance, racine…). */
  function verifierValeur(q, texteBrut) {
    var r = q.reponse;
    var texte = sansUnite(nettoyer(texteBrut), r.unite);
    if (texte === '') return illisible('Écris ta réponse dans le champ.');
    if (r.forme === 'scientifique') {
      // « 3,2 x 10^4 » : la lettre x sert de signe « fois »
      texte = texte.replace(/\s*[xX×]\s*(?=10)/g, ' · ');
    }
    if (r.forme === 'racine') return verifierRacine(q, texte);
    if (r.forme === 'puissance') return verifierPuissance(q, texte);
    var lu;
    try {
      lu = lireNombre(texte);
    } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible (' + e.message.toLowerCase() + '). Vérifie ta saisie.');
      throw e;
    }
    var v = lu.valeur;
    var attendu = r.valeur;
    var forme = r.forme || 'nombre';
    if (forme === 'sciOuNombre') {
      // un nombre, ou une écriture avec une puissance de 10 : 3 · 10^9, 10^-4, 0,5 · 10^3
      var t2 = texte.replace(/\s*[xX×]\s*(?=10)/g, ' · ');
      var ar = lu.arbre;
      var puiss10 = function (n) { return n.type === '^' && n.base.type === 'nombre' && n.base.valeur.egal(10); };
      var okForme = lu.simple || puiss10(ar) || (ar.type === '*' && estNombreSimple(ar.g) && puiss10(ar.d)) ||
        (ar.type === 'neg' && ar.arg.type === '*' && estNombreSimple(ar.arg.g) && puiss10(ar.arg.d));
      if (!okForme) return illisible('Écris un nombre, ou un nombre multiplié par une puissance de 10 (par exemple 3 · 10^9).');
      texte = t2;
      forme = 'nombre';
    } else if (forme !== 'scientifique' && !lu.simple) {
      if (v.egal(attendu)) {
        return illisible('Écris le résultat sous la forme d\'un seul nombre (ou d\'une fraction), pas d\'un calcul.');
      }
      return illisible('Écris un seul nombre (ou une fraction a/b), pas un calcul.');
    }
    if (v.egal(attendu)) {
      if (forme === 'irreductible') {
        var sansMilliers = texte.replace(/(\d)['’ ](?=\d{3})/g, '$1');
        var fe = fractionEcrite(sansMilliers);
        if (!Maths.estFractionIrreductible(sansMilliers.replace(/[()]/g, ''))) {
          var detail = '';
          if (fe && fe.b !== 0) {
            var g = pgcd(fe.a, fe.b);
            if (g > 1) detail = 'Ta fraction vaut bien le résultat, mais on peut encore la simplifier par ' + g + '. ';
            else if (fe.b === 1) detail = 'Un dénominateur égal à 1 est inutile : écris simplement l\'entier. ';
          } else {
            detail = 'Ta réponse vaut bien le résultat, mais elle n\'est pas écrite sous forme de fraction. ';
          }
          return { juste: false, statut: 'forme', message: detail + MESSAGES_FORME.irreductible };
        }
      } else if (forme === 'decimal') {
        if (!estDecimalEcrit(lu.arbre)) {
          return { juste: false, statut: 'forme', message: 'Ta réponse vaut bien le résultat, mais elle est écrite en fraction. ' + MESSAGES_FORME.decimal };
        }
      } else if (forme === 'entier') {
        if (!estDecimalEcrit(lu.arbre)) {
          return { juste: false, statut: 'forme', message: 'Ta réponse vaut bien le résultat : écris-la simplement comme un nombre entier.' };
        }
      } else if (forme === 'scientifique') {
        if (!Maths.estNotationScientifique(texte)) {
          var msg = 'Ta réponse vaut bien le nombre, mais elle n\'est pas en notation scientifique. ';
          return { juste: false, statut: 'forme', message: msg + MESSAGES_FORME.scientifique };
        }
      }
      return { juste: true, statut: 'juste', message: r.messageJuste || '' };
    }
    var p = chercherPiege(q.pieges, v, texte);
    return { juste: false, statut: 'faux', message: p || diagnosticGenerique(v, attendu, { estimation: q.estimation }) };
  }

  /** Forme a√b simplifiée (b sans facteur carré), entier, ou √b. */
  function lireRacineEcrite(arbre) {
    var signe = 1;
    if (arbre.type === 'neg') { signe = -1; arbre = arbre.arg; }
    if (arbre.type === 'nombre' && arbre.valeur.estEntier()) {
      return { coef: signe * Number(arbre.valeur.num), radicande: 1 };
    }
    var c = 1, rac = null;
    if (arbre.type === 'racine' && arbre.indice === 2) rac = arbre;
    else if (arbre.type === '*' && arbre.g.type === 'nombre' && arbre.g.valeur.estEntier() &&
             arbre.d.type === 'racine' && arbre.d.indice === 2) {
      c = Number(arbre.g.valeur.num); rac = arbre.d;
    }
    if (!rac) return null;
    var a = rac.arg;
    if (a.type !== 'nombre' || !a.valeur.estEntier()) return null;
    return { coef: signe * c, radicande: Number(a.valeur.num) };
  }

  function verifierRacine(q, texte) {
    var r = q.reponse;
    var arbre, approx;
    try {
      arbre = Maths.analyser(texte);
      approx = Maths.evaluerApproche(arbre);
    } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible. Vérifie ta saisie.');
      throw e;
    }
    var lu = lireRacineEcrite(arbre);
    var attenduApprox = r.coef * Math.sqrt(r.radicande);
    var egal = Math.abs(approx - attenduApprox) <= 1e-9 * Math.max(1, Math.abs(attenduApprox));
    if (lu) {
      // comparaison exacte : c²·r et signe
      var a = lu.coef * lu.coef * lu.radicande, b = r.coef * r.coef * r.radicande;
      egal = a === b && Math.sign(lu.coef) === Math.sign(r.coef);
    }
    if (egal) {
      if (!lu) return illisible('Écris ta réponse sous la forme a√b (par exemple 5√2), pas sous la forme d\'un calcul.');
      if (!sansFacteurCarre(lu.radicande) && lu.radicande > 1) {
        var k = plusGrandCarre(lu.radicande);
        return { juste: false, statut: 'forme', message: 'Ta réponse vaut bien le résultat, mais on peut encore extraire un entier de la racine : ' +
          lu.radicande + ' = ' + k + ' · ' + (lu.radicande / k) + ', et ' + k + ' est un carré parfait. La consigne demande la forme la plus simple a√b.' };
      }
      return { juste: true, statut: 'juste', message: '' };
    }
    var p = chercherPiege(q.pieges, null, texte);
    if (!p && lu) {
      for (var i = 0; i < (q.pieges || []).length; i++) {
        var pg = q.pieges[i];
        if (pg.racine && pg.racine[0] === lu.coef && pg.racine[1] === lu.radicande) { p = pg.message; break; }
      }
    }
    return { juste: false, statut: 'faux', message: p || 'Ce n\'est pas le bon résultat.' };
  }

  /** Une seule puissance de base donnée : 2^7, a^12, (–3)^5, 10^–4. */
  function verifierPuissance(q, texte) {
    var r = q.reponse;
    var arbre;
    try { arbre = Maths.analyser(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      throw e;
    }
    var baseLettre = typeof r.base === 'string';
    var memeValeur;
    try {
      var attenduTexte = baseLettre ? r.base + '^(' + r.exposant + ')' : '(' + val(r.base).toString() + ')^(' + r.exposant + ')';
      memeValeur = Maths.equivalentes(arbre, attenduTexte);
    } catch (e2) {
      if (e2 instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible. Vérifie ta saisie.');
      throw e2;
    }
    var estPuissance = arbre.type === '^';
    var bonneForme = false;
    if (estPuissance) {
      var b = arbre.base;
      if (baseLettre) bonneForme = b.type === 'lettre' && b.nom === r.base && arbre.exposant === r.exposant;
      else {
        try { bonneForme = Maths.lettres(b).length === 0 && Maths.evaluer(b).egal(val(r.base)) && arbre.exposant === r.exposant; } catch (e3) { bonneForme = false; }
      }
    }
    if (memeValeur && bonneForme) return { juste: true, statut: 'juste', message: '' };
    if (memeValeur) {
      var nomBase = baseLettre ? r.base : Maths.formaterPuissance(val(r.base), 1).replace(/¹$/, '');
      return { juste: false, statut: 'forme', message: 'Ta réponse a la bonne valeur, mais la consigne demande une seule puissance de base ' +
        nomBase + ' (de la forme ' + nomBase + 'ⁿ).' };
    }
    var p = null;
    if (estPuissance) {
      for (var i = 0; i < (q.pieges || []).length; i++) {
        if (q.pieges[i].exposant === arbre.exposant) { p = q.pieges[i].message; break; }
      }
    }
    return { juste: false, statut: 'faux', message: p || 'Ce n\'est pas le bon exposant (ou la bonne base).' };
  }

  /** Liste de nombres « a ; b ; c » (ordre imposé si ordonne). */
  function verifierListe(q, texteBrut) {
    var r = q.reponse;
    var texte = nettoyer(texteBrut);
    if (texte === '') return illisible('Écris ta réponse dans le champ.');
    var elements;
    try { elements = Maths.lireListe(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      throw e;
    }
    if (elements.length !== r.valeurs.length) {
      return illisible('Écris ' + r.valeurs.length + ' nombres séparés par des points-virgules « ; ».');
    }
    var lus = [];
    for (var i = 0; i < elements.length; i++) {
      try { lus.push(Maths.evaluerApproche(elements[i])); } catch (e2) {
        if (e2 instanceof Maths.ErreurSaisie) return illisible(e2.message);
        if (e2 instanceof Maths.ErreurCalcul) return illisible('Un des nombres est impossible à calculer.');
        throw e2;
      }
    }
    var attendus = r.valeurs.map(function (v) { return typeof v === 'number' ? v : val(v).valeur(); });
    function memes(a, b) { return a.every(function (x, k) { return Math.abs(x - b[k]) < 1e-9 * Math.max(1, Math.abs(b[k])); }); }
    if (memes(lus, attendus)) return { juste: true, statut: 'juste', message: '' };
    if (r.ordonne && memes(lus, attendus.slice().reverse())) {
      return { juste: false, statut: 'faux', message: 'Tu as rangé les nombres dans l\'ordre inverse de celui demandé (' + (r.croissant ? 'croissant : du plus petit au plus grand' : 'décroissant : du plus grand au plus petit') + ').' };
    }
    var p = chercherPiege(q.pieges, null, texte);
    if (!p && r.ordonne) {
      var tries = lus.slice().sort(function (a, b) { return a - b; });
      var att = attendus.slice().sort(function (a, b) { return a - b; });
      if (!memes(tries, att)) p = 'Recopie exactement les nombres de l\'énoncé, puis range-les.';
      else p = 'Les nombres sont bons, mais l\'ordre n\'est pas correct.';
    }
    return { juste: false, statut: 'faux', message: p || 'Ce n\'est pas la bonne réponse.' };
  }

  /** Un nombre strictement compris entre min et max (intercaler). */
  function verifierEntre(q, texteBrut) {
    var r = q.reponse;
    var texte = nettoyer(texteBrut);
    if (texte === '') return illisible('Écris ta réponse dans le champ.');
    var lu;
    try { lu = lireNombre(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible. Vérifie ta saisie.');
      throw e;
    }
    if (!lu.simple) return illisible('Écris un seul nombre (ou une fraction a/b), pas un calcul.');
    var v = lu.valeur, min = val(r.min), max = val(r.max);
    if (v.compare(min) > 0 && v.compare(max) < 0) return { juste: true, statut: 'juste', message: '' };
    if (v.egal(min) || v.egal(max)) return { juste: false, statut: 'faux', message: 'Ton nombre est égal à une des bornes : il doit être strictement compris entre les deux.' };
    return { juste: false, statut: 'faux', message: v.compare(min) < 0 ? 'Ton nombre est plus petit que les deux nombres donnés.' : 'Ton nombre est plus grand que les deux nombres donnés.' };
  }

  function verifierMontant(q, texteBrut) {
    var r = q.reponse;
    var texte = nettoyer(texteBrut);
    if (texte === '') return illisible('Écris ta réponse dans le champ.');
    var v = Maths.lireMontant(texte);
    if (!v) return illisible('Écris un montant en francs, par exemple 7.20 ou 7,20 (au plus deux décimales).');
    if (v.egal(r.valeur)) return { juste: true, statut: 'juste', message: '' };
    var p = chercherPiege(q.pieges, v, texte);
    return { juste: false, statut: 'faux', message: p || diagnosticGenerique(v, val(r.valeur), { estimation: true }) };
  }

  function verifierColoriage(q, texteBrut) {
    var r = q.reponse;
    var n = parseInt(nettoyer(texteBrut), 10);
    if (!(n >= 0)) return illisible('Colorie des parts en les touchant, puis valide.');
    if (new F(n, r.parts).egal(r.valeur)) return { juste: true, statut: 'juste', message: '' };
    var p = chercherPiege(q.pieges, new F(n, 1), String(n));
    return { juste: false, statut: 'faux', message: p || ('Tu as colorié ' + n + ' part' + (n > 1 ? 's' : '') + ' sur ' + r.parts + ', soit ' + Maths.formaterFraction(new F(n, r.parts)).replace(/ /g, ' ') + ' de la figure.') };
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
      case 'valeur': return verifierValeur(q, texte);
      case 'liste': return verifierListe(q, texte);
      case 'entre': return verifierEntre(q, texte);
      case 'montant': return verifierMontant(q, texte);
      case 'coloriage': return verifierColoriage(q, texte);
      case 'choix': return verifierChoix(q, texte);
    }
    throw new Error('Type de réponse inconnu : ' + q.reponse.type);
  }

  /* =====================================================================
   * Exemples de réponses (justes et fausses) — utilisés par les tests
   * automatiques et par le test de l'interface.
   * ===================================================================== */

  function texteFraction(f) { return Maths.formaterFraction(f); }
  function texteDecimal(f) { return Maths.formaterNombre(f); }

  function exemplesValeur(q) {
    var r = q.reponse, v = val(r.valeur);
    var justes = [], faux = [];
    var forme = r.forme || 'nombre';
    var unite = r.unite ? (Array.isArray(r.unite) ? r.unite[0] : r.unite) : '';
    if (forme === 'racine') {
      justes.push(r.coef === 1 ? '√' + r.radicande : (r.radicande === 1 ? String(r.coef) : (r.coef === -1 ? '–√' + r.radicande : r.coef + '√' + r.radicande)));
      faux.push((r.coef + 1) + '√' + r.radicande);
      if (r.radicande > 1) faux.push('√' + (r.coef * r.coef * r.radicande + 1));
      (q.pieges || []).forEach(function (p) { if (p.racine) faux.push(p.racine[0] + '√' + p.racine[1]); });
      return { justes: justes, faux: faux };
    }
    if (forme === 'puissance') {
      var b = typeof r.base === 'string' ? r.base : (val(r.base).signe() < 0 || !val(r.base).estEntier() ? '(' + val(r.base).toString() + ')' : val(r.base).toString());
      justes.push(b + '^' + r.exposant);
      justes.push(b + '^(' + r.exposant + ')');
      faux.push(b + '^' + (r.exposant + 1));
      (q.pieges || []).forEach(function (p) { if (p.exposant !== undefined && p.exposant !== r.exposant) faux.push(b + '^' + p.exposant); });
      return { justes: justes, faux: faux };
    }
    if (forme === 'sciOuNombre') {
      justes.push(Maths.formaterNotationScientifique(v));
      justes.push(texteDecimal(v));
      faux.push(Maths.formaterNotationScientifique(v.fois(10)));
      faux.push(texteDecimal(v.plus(1)));
      (q.pieges || []).forEach(function (p) { if (p.valeur !== undefined && !val(p.valeur).egal(v)) faux.push(Maths.formaterNotationScientifique(val(p.valeur))); });
      return { justes: justes, faux: faux };
    }
    if (forme === 'scientifique') {
      justes.push(Maths.formaterNotationScientifique(v));
      var t = Maths.formaterNotationScientifique(v).replace(/ · /, ' x ');
      justes.push(t);
      faux.push(Maths.formaterNotationScientifique(v.fois(10)));
      faux.push(texteDecimal(v)); // forme non conforme
      return { justes: justes, faux: faux };
    }
    if (forme === 'irreductible') {
      justes.push(texteFraction(v));
      if (!v.estEntier()) faux.push((v.signe() < 0 ? '-' : '') + (Number(v.abs().num) * 2) + '/' + (Number(v.den) * 2));
      if (v.estDecimale() && !v.estEntier()) faux.push(texteDecimal(v));
    } else if (forme === 'decimal') {
      justes.push(texteDecimal(v));
      if (!v.estDecimale()) {
        var dev = v.developpementDecimal();
        justes.push((dev.signe ? '-' : '') + dev.entier + ',' + dev.avantPeriode + dev.periode + dev.periode + '…');
      }
      if (!v.estEntier()) faux.push(texteFraction(v));
    } else if (forme === 'entier') {
      justes.push(texteDecimal(v));
    } else {
      justes.push(texteFraction(v));
      if (v.estDecimale()) justes.push(texteDecimal(v));
      else justes.push(texteDecimal(v)); // période barrée
      if (!v.estEntier()) justes.push((v.signe() < 0 ? '-' : '') + (Number(v.abs().num) * 3) + '/' + (Number(v.den) * 3));
    }
    if (unite) justes.push(justes[0] + ' ' + unite);
    faux.push(texteFraction(v.plus(1)));
    if (!v.estZero()) faux.push(texteFraction(v.oppose()));
    (q.pieges || []).forEach(function (p) { if (p.valeur !== undefined && !val(p.valeur).egal(v)) faux.push(texteFraction(val(p.valeur))); });
    return { justes: justes, faux: faux };
  }

  function exemples(q) {
    var r = q.reponse;
    switch (r.type) {
      case 'valeur': return exemplesValeur(q);
      case 'choix': {
        var j = [], f = [];
        q.choix.forEach(function (c, i) { (c.juste ? j : f).push(String(i)); });
        return { justes: j, faux: f };
      }
      case 'liste': {
        var tx = r.textes || r.valeurs.map(function (v) { return texteFraction(val(v)); });
        var inv = tx.slice().reverse();
        return { justes: [tx.join(' ; ')], faux: inv.join() === tx.join() ? [] : [inv.join(' ; ')] };
      }
      case 'entre': {
        var mi = val(r.min).plus(val(r.max)).divise(2);
        return { justes: [texteFraction(mi)], faux: [texteFraction(val(r.min)), texteFraction(val(r.max)), texteFraction(val(r.max).plus(1))] };
      }
      case 'montant': {
        var m = val(r.valeur);
        return { justes: [Maths.formaterMontant(m, { style: 'CHF' }), m.versDecimal(2, { fixe: true, milliers: false })],
          faux: [Maths.formaterMontant(m.plus(1), { style: 'CHF' })] };
      }
      case 'coloriage': {
        var k = val(r.valeur).fois(r.parts);
        return { justes: [String(k.num)], faux: [String(Number(k.num) === r.parts ? Number(k.num) - 1 : Number(k.num) + 1)] };
      }
    }
    return { justes: [], faux: [] };
  }

  /* =====================================================================
   * Constructeurs de questions
   * ===================================================================== */

  function base(o) {
    var q = {
      type: o.type || 'directe',
      enonce: o.enonce || '',
      consigne: o.consigne || '',
      indice: o.indice || '',
      etapes: o.etapes || [],
      verification: o.verification || '',
      rubrique: o.rubrique || '',
      visuel: o.visuel || null,
      visuelCorrection: o.visuelCorrection || null,
      nombres: (o.nombres || []).map(val),
      controle: o.controle || null,
      pieges: o.pieges || [],
      estimation: !!o.estimation,
      clavier: o.clavier || 'nombres',
      barreOblique: o.barreOblique || 'fraction',
      suffixe: o.suffixe || '',
      attenduHtml: o.attenduHtml || ''
    };
    q.verifier = function (texte) { return verifier(q, texte); };
    q.exemples = function () { return exemples(q); };
    return q;
  }

  /** Écriture HTML de la réponse attendue (affichée après la réponse de l'élève). */
  function attenduParDefaut(r) {
    var u = r.unite ? NBSP + (Array.isArray(r.unite) ? r.unite[0] : r.unite) : '';
    switch (r.type) {
      case 'valeur':
        if (r.forme === 'decimal' || r.forme === 'entier') return H.n(r.valeur) + u;
        if (r.forme === 'scientifique') return H.sci(r.valeur);
        if (r.forme === 'sciOuNombre') return (r.valeur.abs().compare(100000) >= 0 || (r.valeur.abs().compare(fr(1, 1000)) < 0 && !r.valeur.estZero()) ? H.sci(r.valeur) + ' = ' : '') + H.n(r.valeur) + u;
        if (r.forme === 'racine') return r.radicande === 1 ? String(r.coef) : H.rac(r.radicande, 2, r.coef === 1 ? undefined : (r.coef === -1 ? MOINS : r.coef));
        if (r.forme === 'puissance') return typeof r.base === 'string' ? r.base + Maths.texteExposant(r.exposant) : H.pui(r.base, r.exposant);
        if (r.forme === 'irreductible') return H.f(r.valeur) + u;
        return (r.valeur.estDecimale() && !r.valeur.estEntier() && u ? H.n(r.valeur) : H.f(r.valeur)) + u;
      case 'montant': return H.chf(r.valeur);
      case 'liste': return (r.textesHtml || r.valeurs.map(function (v) { return typeof v === 'number' ? H.n(Maths.Fraction.depuis(v)) : H.f(v); })).join(NBSP + '; ');
      case 'entre': return 'un nombre strictement compris entre ' + H.f(r.min) + ' et ' + H.f(r.max) + ', par exemple ' + H.f(val(r.min).plus(val(r.max)).divise(2));
      case 'coloriage': return String(val(r.valeur).fois(r.parts).num) + ' parts sur ' + r.parts;
    }
    return '';
  }

  /** Question à réponse saisie. reponse : { type: 'valeur', valeur, forme?, unite? } (ou liste, entre…). */
  function saisie(o) {
    var q = base(o);
    q.mode = 'saisie';
    q.reponse = o.reponse;
    if (q.reponse.type === 'valeur' && q.reponse.valeur !== undefined) q.reponse.valeur = val(q.reponse.valeur);
    if (q.reponse.type === 'montant') q.reponse.valeur = val(q.reponse.valeur);
    if (!q.attenduHtml) q.attenduHtml = attenduParDefaut(q.reponse);
    return q;
  }

  /**
   * Question à choix. choix : [{ h, juste, message }] — mélangés si alea fourni
   * (sauf o.ordreFixe).
   */
  function choix(o, alea) {
    var q = base(o);
    q.mode = 'choix';
    var liste = o.choix.slice();
    if (alea && !o.ordreFixe) liste = alea.melanger(liste);
    q.choix = liste;
    q.reponse = { type: 'choix' };
    var bonne = liste.filter(function (c) { return c.juste; })[0];
    q.attenduHtml = bonne ? bonne.h : '';
    return q;
  }

  /**
   * Vrai ou faux avec choix de la justification.
   * o.vrai : booléen ; o.justifications : { bonne, autreVrai, autresFaux: [..] } …
   * Plus simplement : o.choix déjà prêts (« Vrai, car … », « Faux, car … »).
   */
  function vraiFaux(o, alea) {
    o.type = 'vraifaux';
    var bonnes = [{ h: (o.vrai ? 'Vrai' : 'Faux') + ', car ' + o.bonne, juste: true, message: '' }];
    var mauvaises = (o.mauvaises || []).map(function (m) {
      return { h: m.h, juste: false, message: m.message };
    });
    o.choix = bonnes.concat(mauvaises);
    o.consigne = o.consigne || 'Vrai ou faux ? Choisis la réponse avec la bonne justification.';
    return choix(o, alea);
  }

  /**
   * Repère l'erreur dans le calcul d'un élève fictif.
   * o.eleve : prénom ; o.lignes : [HTML] ; o.choix : [{ h, juste, message }]
   */
  function erreurEleve(o, alea) {
    o.type = 'erreur';
    var lignes = o.lignes.map(function (l) { return '<li>' + l + '</li>'; }).join('');
    o.enonce = (o.enonce ? o.enonce : '') + '<p>Voici le calcul ' + de(o.eleve) + ' :</p><ol class="calcul-eleve maths">' + lignes + '</ol>';
    o.consigne = o.consigne || 'Quelle erreur trouves-tu dans le calcul ' + de(o.eleve) + ' ?';
    return choix(o, alea);
  }

  /** « de Léa », « d'Elif ». */
  function de(nom) { return (/^[AEIOUYÉÈÊÂÎ]/i.test(nom) ? 'd\'' : 'de ') + nom; }

  /** Étape de correction. */
  function etape(i, texte, calcul) {
    return { titre: 'ÉTAPE ' + i, texte: texte, calcul: calcul || '' };
  }

  function etapes(liste) {
    return liste.map(function (e, i) { return etape(i + 1, e[0], e[1]); });
  }

  return {
    Maths: Maths,
    F: F,
    H: H,
    X: X,
    A: A,
    RUBRIQUES: RUBRIQUES,
    PRENOMS: PRENOMS,
    LIEUX: LIEUX,
    NBSP: NBSP,
    MOINS: MOINS,
    fr: fr,
    val: val,
    pgcd: pgcd,
    ppmc: ppmc,
    num: num,
    den: den,
    pow10: pow10,
    entierSauf: entierSauf,
    decimal: decimal,
    nbDecimales: nbDecimales,
    plusGrandCarre: plusGrandCarre,
    sansFacteurCarre: sansFacteurCarre,
    saisie: saisie,
    choix: choix,
    vraiFaux: vraiFaux,
    erreurEleve: erreurEleve,
    etape: etape,
    etapes: etapes,
    de: de,
    verifier: verifier,
    exemples: exemples,
    diagnosticGenerique: diagnosticGenerique,
    lireNombre: lireNombre
  };
});
