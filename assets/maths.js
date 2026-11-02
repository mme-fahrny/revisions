/*
 * maths.js — moteur mathématique partagé (sans dépendance)
 * ---------------------------------------------------------
 * Fonctionne dans le navigateur (objet global « Maths ») et dans Node
 * (const Maths = require('./assets/maths.js')).
 *
 * Conventions d'écriture : celles de l'Aide-mémoire Mathématiques 9-10-11
 * (CIIP, 2024). Voir la section « Conventions d'écriture » du README.
 *
 * CALCUL ET CORRECTION
 *   Maths.Alea                     générateur aléatoire avec graine
 *   Maths.Fraction                 fractions exactes (BigInt)
 *   Maths.analyser(texte)          expression -> arbre ; lève Maths.ErreurSaisie
 *   Maths.evaluer(expr, valeurs)   valeur exacte (Fraction)
 *   Maths.evaluerApproche(expr, valeurs)   valeur approchée (Number), utile avec √
 *   Maths.lettres(expr)            lettres présentes, triées
 *   Maths.equivalentes(a, b)       même valeur en plusieurs points tirés au hasard ?
 *   Maths.estReduite(expr), Maths.estReduiteOrdonnee(expr, lettre?)
 *   Maths.estFractionIrreductible(texte)
 *   Maths.lireNotationScientifique(texte), Maths.estNotationScientifique(texte)
 *   Maths.lireMontant(texte)       « 7.20 », « 7,20 », « CHF 7.20 », « 7.– » -> Fraction
 *   Maths.lireListe(texte), Maths.lireEnsemble(texte), Maths.ensemblesEgaux(a, b)
 *
 * AFFICHAGE (à utiliser partout, pour une écriture uniforme)
 *   Maths.versTexte(expr)                  3x² – 2(x + 1) ; 12 : 4 ; √(x + 1)
 *   Maths.formaterNombre(x, decimales?)    31'500 ; – 2,5 ; 1,18 (barre sur 18)
 *   Maths.formaterFraction(x)              – 3/4
 *   Maths.formaterRelatif(x, options?)     (+ 5) ; (– 3) ; ou 5 ; – 3
 *   Maths.formaterPuissance(base, n)       x² ; (– 3)⁴ ; 10⁻³
 *   Maths.formaterNotationScientifique(x, decimales?)   3,2 · 10⁴
 *   Maths.formaterRacine(radicande, indice?, coefficient?)   √2 ; ∛8 ; 3√(x + 1)
 *   Maths.formaterMontant(x, options?)     7.20 francs ; CHF 7.20
 *   Maths.formaterListe(elements)          1 ; 2 ; 3
 *   Maths.formaterEnsemble(elements)       { 1 ; 2 ; 3 } ; { }
 *   Maths.formaterCoordonnees(x, y, …)     (2 ; – 3)
 *   Maths.formaterSolutions(solutions)     S = { – 3 ; 3 } ; S = { } ; S = ℝ
 *   Maths.ENSEMBLES                        { N: 'ℕ', Z: 'ℤ', D: '𝔻', Q: 'ℚ', R: 'ℝ' }
 *   Maths.html.nombre(x), Maths.html.fraction(x)   versions HTML (barre de période, fraction empilée)
 *
 * Typographie produite : signe moins « – » (tiret demi-cadratin) suivi d'une
 * espace insécable (U+00A0), apostrophe droite « ' » pour les milliers,
 * espaces insécables avant « ; » et à l'intérieur des accolades.
 *
 * Toutes les fonctions qui acceptent « expr » prennent soit un texte, soit un
 * arbre déjà produit par Maths.analyser.
 */
(function (racine, fabrique) {
  'use strict';
  var M = fabrique();
  if (typeof module === 'object' && module.exports) module.exports = M;
  else racine.Maths = M;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* =====================================================================
   * 1. Générateur aléatoire avec graine (mulberry32)
   * ===================================================================== */

  function hacher(texte) {
    var h = 2166136261;
    for (var i = 0; i < texte.length; i++) {
      h ^= texte.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /**
   * new Maths.Alea(graine?) — graine : nombre ou texte. Sans graine : aléatoire.
   * Même graine => même suite de nombres (tests reproductibles).
   */
  function Alea(graine) {
    if (!(this instanceof Alea)) return new Alea(graine);
    if (graine === undefined || graine === null) graine = Math.floor(Math.random() * 4294967296);
    if (typeof graine === 'string') graine = hacher(graine);
    this.etat = graine >>> 0;
  }
  /** Nombre décimal dans [0 ; 1[. */
  Alea.prototype.suivant = function () {
    var t = (this.etat = (this.etat + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** Entier entre min et max (inclus). */
  Alea.prototype.entier = function (min, max) {
    return min + Math.floor(this.suivant() * (max - min + 1));
  };
  /** Entier entre min et max (inclus), différent de 0. */
  Alea.prototype.entierNonNul = function (min, max) {
    var n;
    do { n = this.entier(min, max); } while (n === 0);
    return n;
  };
  /** Un élément au hasard du tableau. */
  Alea.prototype.choix = function (tableau) {
    return tableau[Math.floor(this.suivant() * tableau.length)];
  };
  /** Copie mélangée du tableau (Fisher-Yates). */
  Alea.prototype.melanger = function (tableau) {
    var t = tableau.slice();
    for (var i = t.length - 1; i > 0; i--) {
      var j = Math.floor(this.suivant() * (i + 1));
      var x = t[i]; t[i] = t[j]; t[j] = x;
    }
    return t;
  };
  /** +1 ou -1. */
  Alea.prototype.signe = function () {
    return this.suivant() < 0.5 ? -1 : 1;
  };

  /* =====================================================================
   * 2. Erreurs
   * ===================================================================== */

  /** Erreur de saisie : message en français destiné à l'élève, position du problème. */
  function ErreurSaisie(message, position) {
    this.name = 'ErreurSaisie';
    this.message = message;
    this.position = position === undefined ? -1 : position;
    this.stack = new Error(message).stack;
  }
  ErreurSaisie.prototype = Object.create(Error.prototype);
  ErreurSaisie.prototype.constructor = ErreurSaisie;

  /** Erreur de calcul (division par zéro, racine carrée d'un nombre négatif…). */
  function ErreurCalcul(message) {
    this.name = 'ErreurCalcul';
    this.message = message;
    this.stack = new Error(message).stack;
  }
  ErreurCalcul.prototype = Object.create(Error.prototype);
  ErreurCalcul.prototype.constructor = ErreurCalcul;

  /** Résultat non rationnel (√2…) : impossible en calcul exact. Sous-type d'ErreurCalcul. */
  function ErreurIrrationnel(message) {
    ErreurCalcul.call(this, message);
    this.name = 'ErreurIrrationnel';
  }
  ErreurIrrationnel.prototype = Object.create(ErreurCalcul.prototype);
  ErreurIrrationnel.prototype.constructor = ErreurIrrationnel;

  /* =====================================================================
   * 3. Fractions exactes
   * ===================================================================== */

  var NBSP = ' ';
  var MOINS = '–' + NBSP;          // « – » + espace insécable
  var OVERLINE = '̅';              // trait suscrit combinant (barre de période)

  function absBig(a) { return a < 0n ? -a : a; }
  function pgcd(a, b) {
    a = absBig(a); b = absBig(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }
  function puissance10(n) { return 10n ** BigInt(n); }

  function entierBig(n) {
    if (typeof n === 'bigint') return n;
    if (typeof n === 'number' && Number.isSafeInteger(n)) return BigInt(n);
    if (typeof n === 'string' && /^[+-]?\d+$/.test(n)) return BigInt(n);
    throw new TypeError('Entier attendu : ' + n);
  }

  /** Racine k-ième entière (partie entière) d'un BigInt positif, méthode de Newton. */
  function racineEntiere(n, k) {
    if (n < 2n) return n;
    var K = BigInt(k);
    var x = 1n << BigInt(Math.ceil(n.toString(2).length / k) + 1);
    for (;;) {
      var y = ((K - 1n) * x + n / (x ** (K - 1n))) / K;
      if (y >= x) return x;
      x = y;
    }
  }

  function groupesMilliers(chiffres) {
    return chiffres.length > 3 ? chiffres.replace(/\B(?=(\d{3})+$)/g, "'") : chiffres;
  }

  /** Lit un nombre décimal brut (« -2.5 », « 3e-4 ») ; usage interne. */
  function lireDecimal(texte) {
    var m = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(texte);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) {
      throw new ErreurSaisie('Nombre illisible : « ' + texte + ' »', 0);
    }
    var decimales = m[3] || '';
    var num = BigInt((m[2] || '0') + decimales);
    var den = puissance10(decimales.length);
    var exp = m[4] ? parseInt(m[4], 10) : 0;
    if (exp > 0) num *= puissance10(exp);
    if (exp < 0) den *= puissance10(-exp);
    if (m[1] === '-') num = -num;
    return new Fraction(num, den);
  }

  /*
   * Lecture d'un nombre tel que l'élève l'écrit :
   *   milliers séparés par apostrophe, espace (ou rien) : 31'500 ; 31 500 ; 31500
   *   virgule (ou point) décimale : 2,5
   *   période barrée (touche « période » du clavier) : 1,18̅ ou 1,1̅8̅
   *   période répétée suivie de « … » ou « ... » : 1,1818… ; 0,1666…
   */
  var RE_NOMBRE = /^(\d{1,3}(?:['’   ]\d{3})+(?!\d)|\d+)(?:[.,]((?:\d̅?)+))?(…|\.\.\.)?/;

  /** Cherche la période dans des chiffres écrits « au moins deux fois » (1818 -> 18). */
  function trouverPeriode(ch) {
    for (var debut = 0; debut < ch.length; debut++) {
      var reste = ch.slice(debut);
      for (var p = 1; 2 * p <= reste.length; p++) {
        var ok = true;
        for (var i = p; i < reste.length; i++) {
          if (reste[i] !== reste[i - p]) { ok = false; break; }
        }
        if (ok) return { avant: ch.slice(0, debut), periode: reste.slice(0, p) };
      }
    }
    return null;
  }

  /** Valeur exacte de entier,avant(periode) : ex. 1,1(18) -> 13/11. */
  function valeurDecimale(entier, avant, periode) {
    var f = new Fraction(BigInt((entier || '0') + avant), puissance10(avant.length));
    if (periode) {
      f = f.plus(new Fraction(BigInt(periode), puissance10(avant.length) * (puissance10(periode.length) - 1n)));
    }
    return f;
  }

  function interpreterNombre(m, pos) {
    var entier = m[1].replace(/\D/g, '');
    var dec = m[2] || '';
    var chiffres = dec.replace(/̅/g, '');
    var avant = chiffres, periode = '';
    if (dec.indexOf(OVERLINE) >= 0) {
      var marques = [];
      for (var i = 0; i < dec.length; i++) {
        if (dec[i] === OVERLINE) continue;
        marques.push(dec[i + 1] === OVERLINE);
      }
      var k = marques.indexOf(true);
      for (var j = k; j < marques.length; j++) {
        if (!marques[j]) throw new ErreurSaisie('La barre de période doit couvrir les derniers chiffres.', pos);
      }
      avant = chiffres.slice(0, k);
      periode = chiffres.slice(k);
    } else if (m[3]) {
      var r = chiffres ? trouverPeriode(chiffres) : null;
      if (!r) throw new ErreurSaisie('Écris la période au moins deux fois avant « … », par exemple 1,1818…', pos);
      avant = r.avant;
      periode = r.periode;
    }
    return valeurDecimale(entier, avant, periode);
  }

  /**
   * new Maths.Fraction(num, den?) — num et den entiers (Number ou BigInt).
   * Toujours stockée simplifiée, dénominateur positif.
   * Pour lire « 3/4 », « 2,5 », « 31'500 », « 0,1666… » ou 0.125 : Maths.Fraction.depuis(valeur).
   */
  function Fraction(num, den) {
    if (!(this instanceof Fraction)) return new Fraction(num, den);
    if (den === undefined && !(typeof num === 'number' && Number.isSafeInteger(num)) &&
        typeof num !== 'bigint') {
      var f = Fraction.depuis(num);
      this.num = f.num; this.den = f.den;
      return;
    }
    var n = entierBig(num);
    var d = den === undefined ? 1n : entierBig(den);
    if (d === 0n) throw new ErreurCalcul('Division par zéro');
    if (d < 0n) { n = -n; d = -d; }
    var g = pgcd(n, d);
    if (g > 1n) { n /= g; d /= g; }
    this.num = n;
    this.den = d;
  }

  /** Convertit une valeur (Fraction, nombre, BigInt ou texte) en Fraction. */
  Fraction.depuis = function (v) {
    if (v instanceof Fraction) return v;
    if (typeof v === 'bigint') return new Fraction(v, 1n);
    if (typeof v === 'number') {
      if (!isFinite(v)) throw new ErreurCalcul('Nombre non fini');
      if (Number.isSafeInteger(v)) return new Fraction(v, 1);
      return lireDecimal(String(v));
    }
    if (typeof v === 'string') {
      var t = v.trim().replace(/[−–—]/g, '-');
      var negatif = false;
      var s = /^([+-])\s*/.exec(t);
      if (s) { negatif = s[1] === '-'; t = t.slice(s[0].length); }
      var res;
      var i = t.indexOf('/');
      if (i >= 0) {
        res = Fraction.depuis(t.slice(0, i)).divise(Fraction.depuis(t.slice(i + 1)));
      } else {
        var m = RE_NOMBRE.exec(t);
        if (m && m[0].length === t.length) res = interpreterNombre(m, 0);
        else res = lireDecimal(t.replace(/['’\s]/g, '').replace(',', '.'));
      }
      return negatif ? res.oppose() : res;
    }
    throw new TypeError('Impossible de convertir en fraction : ' + v);
  };

  Fraction.prototype.plus = function (b) {
    b = Fraction.depuis(b);
    return new Fraction(this.num * b.den + b.num * this.den, this.den * b.den);
  };
  Fraction.prototype.moins = function (b) {
    b = Fraction.depuis(b);
    return new Fraction(this.num * b.den - b.num * this.den, this.den * b.den);
  };
  Fraction.prototype.fois = function (b) {
    b = Fraction.depuis(b);
    return new Fraction(this.num * b.num, this.den * b.den);
  };
  Fraction.prototype.divise = function (b) {
    b = Fraction.depuis(b);
    if (b.num === 0n) throw new ErreurCalcul('Division par zéro');
    return new Fraction(this.num * b.den, this.den * b.num);
  };
  /** Puissance entière (exposant positif, nul ou négatif). */
  Fraction.prototype.puissance = function (k) {
    if (!Number.isInteger(k)) throw new ErreurCalcul('Exposant entier attendu');
    if (k < 0) {
      if (this.num === 0n) throw new ErreurCalcul('Division par zéro');
      return new Fraction(this.den ** BigInt(-k), this.num ** BigInt(-k));
    }
    return new Fraction(this.num ** BigInt(k), this.den ** BigInt(k));
  };
  /**
   * Racine exacte d'indice k (2 par défaut). √(9/4) = 3/2 ; ∛(-8) = -2.
   * Lève ErreurIrrationnel si le résultat n'est pas rationnel (√2),
   * ErreurCalcul pour la racine carrée d'un nombre négatif.
   */
  Fraction.prototype.racine = function (k) {
    k = k || 2;
    if (this.num < 0n && k % 2 === 0) throw new ErreurCalcul('Racine carrée d\'un nombre négatif');
    var a = absBig(this.num);
    var rn = racineEntiere(a, k), rd = racineEntiere(this.den, k);
    var K = BigInt(k);
    if (rn ** K !== a || rd ** K !== this.den) throw new ErreurIrrationnel('Racine non rationnelle');
    return new Fraction(this.num < 0n ? -rn : rn, rd);
  };
  Fraction.prototype.oppose = function () { return new Fraction(-this.num, this.den); };
  Fraction.prototype.inverse = function () { return new Fraction(1n, 1n).divise(this); };
  Fraction.prototype.abs = function () { return new Fraction(absBig(this.num), this.den); };
  /** -1, 0 ou 1 selon que this < b, this = b, this > b. */
  Fraction.prototype.compare = function (b) {
    b = Fraction.depuis(b);
    var d = this.num * b.den - b.num * this.den;
    return d < 0n ? -1 : d > 0n ? 1 : 0;
  };
  Fraction.prototype.egal = function (b) { return this.compare(b) === 0; };
  Fraction.prototype.estZero = function () { return this.num === 0n; };
  Fraction.prototype.estEntier = function () { return this.den === 1n; };
  Fraction.prototype.signe = function () { return this.num < 0n ? -1 : this.num > 0n ? 1 : 0; };
  /** Valeur approchée (Number JavaScript). */
  Fraction.prototype.valeur = function () { return Number(this.num) / Number(this.den); };
  /** Écriture technique « 3/4 », « -5/2 », « 7 » (pour l'affichage : Maths.formaterFraction). */
  Fraction.prototype.toString = function () {
    return this.den === 1n ? String(this.num) : this.num + '/' + this.den;
  };
  /** Vrai si l'écriture décimale est finie (dénominateur = 2^a·5^b). */
  Fraction.prototype.estDecimale = function () {
    var d = this.den;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  };
  /** Vrai si l'écriture décimale est illimitée périodique (ex. 1/3, 1/6). */
  Fraction.prototype.estPeriodique = function () { return !this.estDecimale(); };

  /**
   * Arrondi décimal exact, au format suisse : versDecimal(2) de -1234.5 -> « – 1'234,5 ».
   * options.fixe = true garde les zéros finaux (« 1'234,50 »).
   * options.milliers = false supprime les apostrophes.
   */
  Fraction.prototype.versDecimal = function (decimales, options) {
    if (decimales === undefined) decimales = 10;
    options = options || {};
    var n = this.num * puissance10(decimales);
    var q = n / this.den;
    var r = n % this.den;
    if (2n * absBig(r) >= this.den) q += n < 0n ? -1n : 1n;
    var negatif = q < 0n;
    var chiffres = String(absBig(q)).padStart(decimales + 1, '0');
    var entiere = chiffres.slice(0, chiffres.length - decimales);
    var frac = chiffres.slice(chiffres.length - decimales);
    if (!options.fixe) frac = frac.replace(/0+$/, '');
    if (options.milliers !== false) entiere = groupesMilliers(entiere);
    var texte = entiere + (frac ? ',' + frac : '');
    if (negatif && /[1-9]/.test(texte)) texte = MOINS + texte;
    return texte;
  };

  /**
   * Développement décimal exact (division posée).
   * 1/6 -> { signe: '', entier: '0', avantPeriode: '1', periode: '6', periodique: true }
   * Période limitée à 2000 chiffres (sinon tronque: true).
   */
  Fraction.prototype.developpementDecimal = function () {
    var n = absBig(this.num), d = this.den;
    var entier = String(n / d);
    var reste = n % d;
    var vus = new Map();
    var chiffres = '';
    var tronque = false;
    while (reste !== 0n && !vus.has(reste)) {
      if (chiffres.length >= 2000) { tronque = true; break; }
      vus.set(reste, chiffres.length);
      reste *= 10n;
      chiffres += String(reste / d);
      reste %= d;
    }
    var debut = (reste !== 0n && !tronque) ? vus.get(reste) : chiffres.length;
    return {
      signe: this.num < 0n ? '-' : '',
      entier: entier,
      avantPeriode: chiffres.slice(0, debut),
      periode: chiffres.slice(debut),
      periodique: debut < chiffres.length,
      tronque: tronque
    };
  };

  /**
   * Écriture décimale exacte en texte : « 0,25 », « 1,18 » avec barre sur 18
   * (trait suscrit combinant U+0305 après chaque chiffre de la période),
   * ou « 1,(18) » avec options.periode = 'parentheses'.
   * En HTML, préférer Maths.html.nombre (barre en CSS, plus nette).
   */
  Fraction.prototype.ecritureDecimale = function (options) {
    options = options || {};
    var dev = this.developpementDecimal();
    var texte = (dev.signe ? MOINS : '') + groupesMilliers(dev.entier);
    if (dev.avantPeriode || dev.periode) texte += ',' + dev.avantPeriode;
    if (dev.periode) {
      if (options.periode === 'parentheses') texte += '(' + dev.periode + ')';
      else texte += dev.periode.split('').join(OVERLINE) + OVERLINE;
    }
    return texte;
  };

  /* =====================================================================
   * 4. Analyseur d'expressions littérales
   *
   * Accepte :
   *   nombres : virgule (ou point) décimale ; milliers avec apostrophe,
   *             espace ou rien (31'500, 31 500) ; périodes (1,1̅8̅ ou 1,1818…)
   *   lettres : une lettre = une variable ; « ab » = a·b
   *   opérations : + ; - – − ; · * × ; : ÷ ; / (barre de fraction) ; ^n ² ³ ⁻¹
   *   racines : √ (carrée) et ∛ (cubique). Le radical porte sur ce qui suit
   *             immédiatement : √2x = √2 · x ; √(x + 1) ; √x² = √(x²)
   *   parenthèses ( ) et [ ]
   *   multiplication implicite : 3x, 2(x + 1), a(b + 5), (x + 1)(x – 1), 3√2
   * Priorités usuelles, de gauche à droite : 1/2x = (1/2)·x ; 12 : 3 · 2 = 8.
   * Le signe moins porte sur tout le terme : – 2² = – 4.
   *
   * Nœuds de l'arbre :
   *   { type: 'nombre', valeur: Fraction, texte }
   *   { type: 'lettre', nom: 'x' }
   *   { type: '+' | '-' | '*', g, d, implicite?: true }
   *   { type: '/', g, d, symbole: '/' (barre de fraction) ou ':' }
   *   { type: 'neg', arg }
   *   { type: '^', base, exposant: entier (Number) }
   *   { type: 'racine', indice: 2 | 3, arg }
   * Un nœud écrit entre parenthèses porte parentheses: true.
   * ===================================================================== */

  var EXPOSANTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
    '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  var CHIFFRES_EXPOSANTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

  function normaliserExpression(texte) {
    return String(texte)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, function (s) {
        return '^(' + s.split('').map(function (c) { return EXPOSANTS[c]; }).join('') + ')';
      })
      .replace(/[−–—]/g, '-')
      .replace(/[×·⋅∙*]/g, '*')
      .replace(/÷/g, ':')
      .replace(/\[/g, '(').replace(/\]/g, ')');
  }

  function decouper(texte) {
    var s = normaliserExpression(texte);
    var jetons = [];
    var i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/\d/.test(c)) {
        var m = RE_NOMBRE.exec(s.slice(i));
        jetons.push({ type: 'nombre', texte: m[0], valeur: interpreterNombre(m, i), pos: i });
        i += m[0].length;
        continue;
      }
      if (c === '.' || c === ',') {
        throw new ErreurSaisie('Écris un chiffre avant la virgule (par exemple 0,5).', i);
      }
      if (c === OVERLINE) throw new ErreurSaisie('La barre de période se place sur des chiffres après la virgule.', i);
      if (/[a-zA-Z]/.test(c)) { jetons.push({ type: 'lettre', nom: c, pos: i }); i++; continue; }
      if (c === '+' || c === '-' || c === '*' || c === '^') { jetons.push({ type: 'op', op: c, pos: i }); i++; continue; }
      if (c === '/' || c === ':') { jetons.push({ type: 'op', op: '/', symbole: c, pos: i }); i++; continue; }
      if (c === '√' || c === '∛') { jetons.push({ type: 'racine', indice: c === '√' ? 2 : 3, pos: i }); i++; continue; }
      if (c === '(' || c === ')') { jetons.push({ type: c, pos: i }); i++; continue; }
      if (c === ';') throw new ErreurSaisie('Le point-virgule sépare des éléments d\'une liste : une seule expression est attendue ici.', i);
      throw new ErreurSaisie('Caractère non reconnu : « ' + c + ' »', i);
    }
    return jetons;
  }

  function Analyseur(texte) {
    this.jetons = decouper(texte);
    this.i = 0;
  }
  Analyseur.prototype.voir = function () { return this.jetons[this.i]; };
  Analyseur.prototype.estOp = function (op) {
    var j = this.voir();
    return j && j.type === 'op' && j.op === op;
  };
  Analyseur.prototype.position = function () {
    var j = this.voir();
    return j ? j.pos : -1;
  };
  Analyseur.prototype.expression = function () {
    var g = this.terme();
    while (this.estOp('+') || this.estOp('-')) {
      var op = this.voir().op; this.i++;
      g = { type: op, g: g, d: this.terme() };
    }
    return g;
  };
  Analyseur.prototype.terme = function () {
    var g = this.unaire();
    for (;;) {
      var j = this.voir();
      if (this.estOp('*')) {
        this.i++;
        g = { type: '*', g: g, d: this.unaire() };
      } else if (this.estOp('/')) {
        this.i++;
        g = { type: '/', g: g, d: this.unaire(), symbole: j.symbole };
      } else if (j && (j.type === 'lettre' || j.type === '(' || j.type === 'racine')) {
        g = { type: '*', g: g, d: this.puissance(), implicite: true };
      } else if (j && j.type === 'nombre') {
        throw new ErreurSaisie('Il manque un signe d\'opération avant « ' + j.texte + ' ».', j.pos);
      } else {
        return g;
      }
    }
  };
  Analyseur.prototype.unaire = function () {
    // Le signe porte sur tout le terme qui suit : -2x = -(2x), -2^2 = -4.
    if (this.estOp('-')) { this.i++; return { type: 'neg', arg: this.terme() }; }
    if (this.estOp('+')) { this.i++; return this.terme(); }
    return this.puissance();
  };
  Analyseur.prototype.puissance = function () {
    var base = this.primaire();
    if (this.estOp('^')) {
      var pos = this.position();
      this.i++;
      base = { type: '^', base: base, exposant: this.exposant(pos) };
      if (this.estOp('^')) {
        throw new ErreurSaisie('Mets des parenthèses pour enchaîner deux puissances.', this.position());
      }
    }
    return base;
  };
  Analyseur.prototype.exposant = function (pos) {
    var signe = 1;
    while (this.estOp('-') || this.estOp('+')) {
      if (this.voir().op === '-') signe = -signe;
      this.i++;
    }
    var j = this.voir();
    var valeur;
    if (j && j.type === 'nombre') {
      this.i++;
      valeur = j.valeur;
    } else if (j && j.type === '(') {
      var noeud = this.primaire();
      if (lettresDe(noeud).length) throw new ErreurSaisie('L\'exposant doit être un nombre entier.', pos);
      try { valeur = evaluerNoeud(noeud, {}); } catch (e) {
        throw new ErreurSaisie('L\'exposant doit être un nombre entier.', pos);
      }
    } else {
      throw new ErreurSaisie('Il manque l\'exposant après « ^ ».', pos);
    }
    if (!valeur.estEntier()) throw new ErreurSaisie('L\'exposant doit être un nombre entier.', pos);
    var k = signe * Number(valeur.num);
    if (Math.abs(k) > 1000) throw new ErreurSaisie('Exposant trop grand.', pos);
    return k;
  };
  Analyseur.prototype.primaire = function () {
    var j = this.voir();
    if (!j) throw new ErreurSaisie('L\'expression est incomplète.', -1);
    if (j.type === 'nombre') { this.i++; return { type: 'nombre', valeur: j.valeur, texte: j.texte }; }
    if (j.type === 'lettre') { this.i++; return { type: 'lettre', nom: j.nom }; }
    if (j.type === 'racine') {
      this.i++;
      var suivant = this.voir();
      if (!suivant || suivant.type === 'op' || suivant.type === ')') {
        throw new ErreurSaisie('Écris ce qui est sous la racine, par exemple √(x + 1).', j.pos);
      }
      return { type: 'racine', indice: j.indice, arg: this.puissance() };
    }
    if (j.type === '(') {
      this.i++;
      if (this.voir() && this.voir().type === ')') throw new ErreurSaisie('Parenthèses vides.', j.pos);
      var e = this.expression();
      var f = this.voir();
      if (!f || f.type !== ')') throw new ErreurSaisie('Il manque une parenthèse fermante.', j.pos);
      this.i++;
      e = copier(e);
      e.parentheses = true;
      return e;
    }
    if (j.type === ')') throw new ErreurSaisie('Parenthèse fermante en trop.', j.pos);
    throw new ErreurSaisie('Signe « ' + (j.symbole || j.op) + ' » mal placé.', j.pos);
  };

  function copier(n) {
    var c = {};
    for (var k in n) if (Object.prototype.hasOwnProperty.call(n, k)) c[k] = n[k];
    return c;
  }

  /** Texte -> arbre. Lève Maths.ErreurSaisie (message en français) si la saisie est illisible. */
  function analyser(texte) {
    if (texte && typeof texte === 'object') return texte;
    if (String(texte).trim() === '') throw new ErreurSaisie('La réponse est vide.', 0);
    var a = new Analyseur(texte);
    var arbre = a.expression();
    if (a.i < a.jetons.length) {
      var j = a.voir();
      throw new ErreurSaisie(j.type === ')' ? 'Parenthèse fermante en trop.' : 'Saisie incorrecte.', j.pos);
    }
    return arbre;
  }

  function lettresDe(n, ens) {
    ens = ens || {};
    if (n.type === 'lettre') ens[n.nom] = true;
    else if (n.type === 'neg' || n.type === 'racine') lettresDe(n.arg, ens);
    else if (n.type === '^') lettresDe(n.base, ens);
    else if (n.g) { lettresDe(n.g, ens); lettresDe(n.d, ens); }
    return Object.keys(ens).sort();
  }

  /** Lettres présentes dans l'expression, par ordre alphabétique. */
  function lettres(expr) { return lettresDe(analyser(expr)); }

  /* =====================================================================
   * 5. Évaluation
   * ===================================================================== */

  function evaluerNoeud(n, valeurs) {
    switch (n.type) {
      case 'nombre': return n.valeur;
      case 'lettre':
        if (!(n.nom in valeurs)) throw new ErreurCalcul('Valeur manquante pour ' + n.nom);
        return Fraction.depuis(valeurs[n.nom]);
      case 'neg': return evaluerNoeud(n.arg, valeurs).oppose();
      case '^': return evaluerNoeud(n.base, valeurs).puissance(n.exposant);
      case 'racine': return evaluerNoeud(n.arg, valeurs).racine(n.indice);
      case '+': return evaluerNoeud(n.g, valeurs).plus(evaluerNoeud(n.d, valeurs));
      case '-': return evaluerNoeud(n.g, valeurs).moins(evaluerNoeud(n.d, valeurs));
      case '*': return evaluerNoeud(n.g, valeurs).fois(evaluerNoeud(n.d, valeurs));
      case '/': return evaluerNoeud(n.g, valeurs).divise(evaluerNoeud(n.d, valeurs));
    }
    throw new Error('Nœud inconnu : ' + n.type);
  }

  function approcheNoeud(n, valeurs) {
    var r;
    switch (n.type) {
      case 'nombre': return n.valeur.valeur();
      case 'lettre':
        if (!(n.nom in valeurs)) throw new ErreurCalcul('Valeur manquante pour ' + n.nom);
        return Fraction.depuis(valeurs[n.nom]).valeur();
      case 'neg': return -approcheNoeud(n.arg, valeurs);
      case '^': r = Math.pow(approcheNoeud(n.base, valeurs), n.exposant); break;
      case 'racine': {
        var a = approcheNoeud(n.arg, valeurs);
        if (n.indice === 2 && a < 0) throw new ErreurCalcul('Racine carrée d\'un nombre négatif');
        r = n.indice === 2 ? Math.sqrt(a) : Math.cbrt(a);
        break;
      }
      case '+': r = approcheNoeud(n.g, valeurs) + approcheNoeud(n.d, valeurs); break;
      case '-': r = approcheNoeud(n.g, valeurs) - approcheNoeud(n.d, valeurs); break;
      case '*': r = approcheNoeud(n.g, valeurs) * approcheNoeud(n.d, valeurs); break;
      case '/': {
        var d = approcheNoeud(n.d, valeurs);
        if (d === 0) throw new ErreurCalcul('Division par zéro');
        r = approcheNoeud(n.g, valeurs) / d;
        break;
      }
      default: throw new Error('Nœud inconnu : ' + n.type);
    }
    if (!isFinite(r)) throw new ErreurCalcul('Valeur non calculable');
    return r;
  }

  /**
   * Valeur exacte (Fraction). evaluer('3x + 1', { x: 2 }) -> 7.
   * Lève ErreurCalcul (division par 0…) ou ErreurIrrationnel (√2…).
   */
  function evaluer(expr, valeurs) { return evaluerNoeud(analyser(expr), valeurs || {}); }

  /** Valeur approchée (Number), fonctionne aussi avec les racines non exactes. */
  function evaluerApproche(expr, valeurs) { return approcheNoeud(analyser(expr), valeurs || {}); }

  /* =====================================================================
   * 6. Équivalence de deux expressions
   * ===================================================================== */

  function memesValeurs(A, B, valeurs) {
    try {
      return evaluerNoeud(A, valeurs).egal(evaluerNoeud(B, valeurs));
    } catch (e) {
      if (!(e instanceof ErreurIrrationnel)) throw e;
    }
    // Racines non exactes : comparaison approchée (écart relatif < 10⁻¹¹)
    var x = approcheNoeud(A, valeurs), y = approcheNoeud(B, valeurs);
    return Math.abs(x - y) <= 1e-11 * Math.max(1, Math.abs(x), Math.abs(y));
  }

  /**
   * Vrai si les deux expressions prennent la même valeur en plusieurs points
   * rationnels choisis au hasard (graine fixe : résultat reproductible).
   * Calcul exact ; approché à 10⁻¹¹ près seulement en présence de racines non exactes.
   * options : { essais: 12, graine: 2024, lettres: [...] }
   * Lève ErreurSaisie si l'une des expressions est illisible :
   * appeler Maths.analyser(reponse) d'abord pour afficher un message à l'élève.
   */
  function equivalentes(a, b, options) {
    options = options || {};
    var A = analyser(a), B = analyser(b);
    var noms = options.lettres || lettresDe(B, lettresDe(A).reduce(function (o, l) { o[l] = true; return o; }, {}));
    var essais = options.essais || 12;
    var alea = new Alea(options.graine === undefined ? 2024 : options.graine);
    var reussis = 0;
    for (var tentative = 0; tentative < essais * 6 && reussis < essais; tentative++) {
      var valeurs = {};
      for (var k = 0; k < noms.length; k++) {
        valeurs[noms[k]] = alea.suivant() < 0.6
          ? new Fraction(alea.signe() * alea.entier(2, 12), 1)
          : new Fraction(alea.signe() * alea.entier(1, 19), alea.entier(2, 9));
      }
      var egales;
      try {
        egales = memesValeurs(A, B, valeurs);
      } catch (e) {
        if (e instanceof ErreurCalcul) continue; // pas calculable en ce point : on en essaie un autre
        throw e;
      }
      if (!egales) return false;
      reussis++;
      if (noms.length === 0) return true;
    }
    return reussis >= Math.min(3, essais);
  }

  /* =====================================================================
   * 7. Tests de forme
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

  function aplatirProduit(n, liste) {
    if (n.type === '*' && !n.parentheses) {
      aplatirProduit(n.g, liste);
      aplatirProduit(n.d, liste);
    } else {
      liste.push(n);
    }
    return liste;
  }

  /** Coefficient écrit comme nombre ou comme fraction irréductible d'entiers. */
  function coefficientEcrit(n) {
    if (n.type === 'nombre') return n.valeur;
    if (n.type === '/' && n.g.type === 'nombre' && n.d.type === 'nombre' &&
        n.g.valeur.estEntier() && n.d.valeur.estEntier() && n.d.valeur.compare(1) > 0 &&
        pgcd(n.g.valeur.num, n.d.valeur.num) === 1n) {
      return n.g.valeur.divise(n.d.valeur);
    }
    return null;
  }

  /**
   * Analyse un terme tel qu'il est écrit. Renvoie { coef: Fraction, lettres: { x: 2 } }
   * ou null s'il n'est pas sous forme de monôme réduit (2·3x, x·x, x^1, 1x, 6/8x, (x+1)…).
   */
  function monomeEcrit(n) {
    if (n.type === 'nombre') return { coef: n.valeur, lettres: {} };
    if (n.type === 'lettre') { var l = {}; l[n.nom] = 1; return { coef: new Fraction(1), lettres: l }; }
    if (n.type === '^') {
      if (n.base.type !== 'lettre' || n.exposant < 2) return null;
      var p = {}; p[n.base.nom] = n.exposant;
      return { coef: new Fraction(1), lettres: p };
    }
    if (n.parentheses) return null;
    if (n.type === '/') {
      var c = coefficientEcrit(n);
      if (c) return { coef: c, lettres: {} };
      // x/2, 3x/4 : numérateur monôme à coefficient entier, dénominateur entier > 1
      var haut = monomeEcrit(n.g);
      if (!haut || !Object.keys(haut.lettres).length || !haut.coef.estEntier()) return null;
      if (n.d.type !== 'nombre' || !n.d.valeur.estEntier() || n.d.valeur.compare(1) <= 0) return null;
      if (pgcd(haut.coef.num, n.d.valeur.num) !== 1n) return null;
      return { coef: haut.coef.divise(n.d.valeur), lettres: haut.lettres };
    }
    if (n.type !== '*') return null;
    var facteurs = aplatirProduit(n, []);
    var coef = null;
    var lettresM = {};
    for (var i = 0; i < facteurs.length; i++) {
      var f = facteurs[i];
      if (i === 0) {
        var ce = coefficientEcrit(f);
        if (ce) {
          if (ce.egal(1) || ce.estZero()) return null; // 1x, 0x
          coef = ce;
          continue;
        }
      }
      var m = monomeEcrit(f);
      if (!m || !m.coef.egal(1) || f.type === 'nombre') return null;
      for (var nom in m.lettres) {
        if (lettresM[nom]) return null; // x·x
        lettresM[nom] = m.lettres[nom];
      }
    }
    return { coef: coef || new Fraction(1), lettres: lettresM };
  }

  function cleMonome(lettresM) {
    return Object.keys(lettresM).sort().map(function (k) { return k + '^' + lettresM[k]; }).join('·');
  }
  function degre(lettresM, lettre) {
    if (lettre) return lettresM[lettre] || 0;
    var d = 0;
    for (var k in lettresM) d += lettresM[k];
    return d;
  }

  function termesReduits(expr) {
    var termes = aplatirSomme(analyser(expr), 1, []);
    var vus = {};
    var res = [];
    for (var i = 0; i < termes.length; i++) {
      var m = monomeEcrit(termes[i].noeud);
      if (!m) return null;
      if (m.coef.estZero() && termes.length > 1) return null; // x + 0
      var cle = cleMonome(m.lettres);
      if (vus[cle]) return null; // termes semblables
      vus[cle] = true;
      res.push(m);
    }
    return res;
  }

  /**
   * Vrai si l'expression est réduite : somme de monômes écrits simplement,
   * sans termes semblables, sans parenthèses à développer.
   * Exemples réduits : 3x^2 - 2x + 1, x/2 + 3, 2ab - b.
   * Non réduits : 3x + 2x, 2·3x, x·x, 2(x+1), x + 0, 1x.
   * Lève ErreurSaisie si la saisie est illisible.
   */
  function estReduite(expr) { return termesReduits(expr) !== null; }

  /**
   * Réduite ET ordonnée selon les puissances décroissantes.
   * lettre (facultative) : degré selon cette lettre ; sinon degré total.
   */
  function estReduiteOrdonnee(expr, lettre) {
    var t = termesReduits(expr);
    if (!t) return false;
    for (var i = 1; i < t.length; i++) {
      if (degre(t[i].lettres, lettre) > degre(t[i - 1].lettres, lettre)) return false;
    }
    return true;
  }

  /**
   * Vrai si le texte est une fraction irréductible « a/b » (b > 1, signe devant).
   * options.entierAccepte (défaut true) : un entier seul (« 4 ») est accepté.
   * « 6/8 », « 4/1 », « 3/-4 », « 0/5 » -> faux.
   */
  function estFractionIrreductible(texte, options) {
    options = options || {};
    var t = String(texte).replace(/[−–]/g, '-').replace(/\s/g, '');
    if (/^[+-]?\d+$/.test(t)) return options.entierAccepte !== false;
    var m = /^[+-]?(\d+)\/(\d+)$/.exec(t);
    if (!m) return false;
    var a = BigInt(m[1]), b = BigInt(m[2]);
    return b > 1n && pgcd(a, b) === 1n;
  }

  /**
   * Lit une notation scientifique correcte « a · 10ⁿ » avec 1 ≤ |a| < 10.
   * Accepte ·, *, ×, x comme signe de multiplication ; ^n, ^(–n) ou exposants ⁻³.
   * Renvoie { mantisse: Fraction, exposant: n, valeur: Fraction } ou null.
   */
  function lireNotationScientifique(texte) {
    var t = String(texte)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, function (s) {
        return '^' + s.split('').map(function (c) { return EXPOSANTS[c]; }).join('');
      })
      .replace(/[−–—]/g, '-')
      .replace(/\s/g, '');
    var m = /^([+-]?)([1-9](?:[.,]\d+)?)[·⋅∙×*xX]10\^(?:\(([+-]?\d+)\)|([+-]?\d+))$/.exec(t);
    if (!m) return null;
    var mantisse = Fraction.depuis(m[1] + m[2]);
    var exposant = parseInt(m[3] !== undefined ? m[3] : m[4], 10);
    return {
      mantisse: mantisse,
      exposant: exposant,
      valeur: mantisse.fois(new Fraction(10).puissance(exposant))
    };
  }

  /** Vrai si le texte est une notation scientifique correcte (voir lireNotationScientifique). */
  function estNotationScientifique(texte) { return lireNotationScientifique(texte) !== null; }

  /* =====================================================================
   * 8. Affichage (conventions de l'aide-mémoire)
   * ===================================================================== */

  var ENSEMBLES = { N: 'ℕ', Z: 'ℤ', D: '𝔻', Q: 'ℚ', R: 'ℝ' };

  /** Exposant en chiffres surélevés : -3 -> « ⁻³ ». */
  function texteExposant(k) {
    var s = String(Math.abs(k)).split('').map(function (c) { return CHIFFRES_EXPOSANTS[+c]; }).join('');
    return (k < 0 ? '⁻' : '') + s;
  }

  /**
   * Nombre au format suisse : virgule décimale, apostrophe des milliers, « – » typographique.
   * Sans « decimales » : écriture exacte, période barrée si besoin (1/3 -> 0,3̅).
   * Avec « decimales » : arrondi (formaterNombre(2/3, 2) -> 0,67).
   * options : { fixe: true } garde les zéros finaux ; { milliers: false } ;
   *           { periode: 'parentheses' } -> 1,(18).
   * Pour un Number issu d'un calcul (0.1 + 0.2), préciser « decimales ».
   */
  function formaterNombre(x, decimales, options) {
    var f = Fraction.depuis(x);
    if (decimales === undefined || decimales === null) return f.ecritureDecimale(options);
    return f.versDecimal(decimales, options);
  }

  /** Fraction : « 3/4 », « – 3/4 », « 5 ». */
  function formaterFraction(x) {
    var f = Fraction.depuis(x);
    var signe = f.signe() < 0 ? MOINS : '';
    var a = f.abs();
    if (a.estEntier()) return signe + groupesMilliers(String(a.num));
    return signe + groupesMilliers(String(a.num)) + '/' + groupesMilliers(String(a.den));
  }

  /** Décimal si l'écriture est finie, sinon fraction (pour les listes, ensembles…). */
  function formaterValeur(v) {
    if (typeof v === 'string') return v;
    var f = Fraction.depuis(v);
    return f.estDecimale() ? formaterNombre(f) : formaterFraction(f);
  }

  /**
   * Nombre relatif.
   *   formaterRelatif(5)  -> « (+ 5) »     formaterRelatif(-3) -> « (– 3) »
   *   formaterRelatif(-3, { parentheses: false }) -> « – 3 »
   *   formaterRelatif(5, { parentheses: false }) -> « 5 » ; avec signePlus: true -> « + 5 »
   *   0 s'écrit toujours « 0 ».
   *   Décimal si l'écriture est finie (– 0,75), sinon fraction (+ 1/3) ;
   *   { fraction: true } force la fraction : (– 3/4).
   */
  function formaterRelatif(x, options) {
    options = options || {};
    var f = Fraction.depuis(x);
    if (f.estZero()) return '0';
    var corps = options.fraction ? formaterFraction(f.abs()) : formaterValeur(f.abs());
    var signe = f.signe() < 0 ? '–' : '+';
    if (options.parentheses !== false) return '(' + signe + NBSP + corps + ')';
    if (f.signe() < 0) return MOINS + corps;
    return options.signePlus ? '+' + NBSP + corps : corps;
  }

  /** Puissance : formaterPuissance('x', 2) -> x² ; (-3, 4) -> (– 3)⁴ ; (10, -3) -> 10⁻³. */
  function formaterPuissance(base, exposant) {
    var b;
    if (typeof base === 'string') {
      b = /^([a-zA-Z]|\d+(?:,\d+)?)$/.test(base) ? base : '(' + base + ')';
    } else {
      var f = Fraction.depuis(base);
      b = formaterValeur(f);
      if (f.signe() < 0 || !f.estDecimale()) b = '(' + b + ')';
    }
    return b + texteExposant(exposant);
  }

  /**
   * Notation scientifique : 32000 -> « 3,2 · 10⁴ » ; -0,00105 -> « – 1,05 · 10⁻³ ».
   * decimales (facultatif) : nombre de décimales de la mantisse (arrondi).
   */
  function formaterNotationScientifique(x, decimales) {
    var f = Fraction.depuis(x);
    if (f.estZero()) return '0';
    var a = f.abs();
    var n = String(a.num).length - String(a.den).length;
    var m = a.divise(new Fraction(10).puissance(n));
    while (m.compare(10) >= 0) { m = m.divise(10); n++; }
    while (m.compare(1) < 0) { m = m.fois(10); n--; }
    var texte;
    if (decimales === undefined) {
      texte = formaterValeur(m);
    } else {
      texte = m.versDecimal(decimales);
      if (Fraction.depuis(texte).compare(10) >= 0) { n++; texte = '1'; }
    }
    return (f.signe() < 0 ? MOINS : '') + texte + NBSP + '·' + NBSP + '10' + texteExposant(n);
  }

  /**
   * Racine : formaterRacine(2) -> √2 ; formaterRacine(8, 3) -> ∛8 ;
   * formaterRacine('x + 1') -> √(x + 1) ; formaterRacine(2, 2, 3) -> 3√2.
   */
  function formaterRacine(radicande, indice, coefficient) {
    var r = typeof radicande === 'string' ? radicande : formaterValeur(radicande);
    if (!/^([a-zA-Z]|[\d',]+)$/.test(r)) r = '(' + r + ')';
    var c = coefficient === undefined || coefficient === null ? '' :
      (typeof coefficient === 'string' ? coefficient : formaterValeur(coefficient));
    return c + (indice === 3 ? '∛' : '√') + r;
  }

  /**
   * Montant en francs, comme sur les étiquettes suisses (point avant les centimes).
   *   formaterMontant(7.2) -> « 7.20 francs »
   *   formaterMontant(7.2, { style: 'CHF' }) -> « CHF 7.20 »
   *   formaterMontant(1250.5) -> « 1'250.50 francs » ; 1.5 -> « 1.50 franc » (singulier sous 2)
   * Arrondi au centime.
   */
  function formaterMontant(x, options) {
    options = options || {};
    var f = Fraction.depuis(x);
    var t = f.abs().versDecimal(2, { fixe: true }).replace(',', '.');
    var signe = f.signe() < 0 && t !== '0.00' ? MOINS : '';
    if (options.style === 'CHF') return 'CHF' + NBSP + signe + t;
    var unite = f.abs().compare(2) < 0 ? 'franc' : 'francs';
    return signe + t + NBSP + unite;
  }

  /** Liste avec points-virgules : [1, 2, 3] -> « 1 ; 2 ; 3 ». Les textes sont repris tels quels. */
  function formaterListe(elements) {
    return elements.map(formaterValeur).join(NBSP + '; ');
  }

  /** Ensemble : [1, 2, 3] -> « { 1 ; 2 ; 3 } » ; [] -> « { } ». */
  function formaterEnsemble(elements) {
    if (!elements.length) return '{' + NBSP + '}';
    return '{' + NBSP + formaterListe(elements) + NBSP + '}';
  }

  /** Coordonnées : formaterCoordonnees(2, -3) -> « (2 ; – 3) ». */
  function formaterCoordonnees() {
    return '(' + formaterListe(Array.prototype.slice.call(arguments)) + ')';
  }

  /**
   * Ensemble de solutions :
   *   formaterSolutions([3, -3]) -> « S = { – 3 ; 3 } » (nombres triés)
   *   formaterSolutions([])      -> « S = { } »
   *   formaterSolutions('R') ou (Maths.ENSEMBLES.R) -> « S = ℝ »
   */
  function formaterSolutions(solutions) {
    var debut = 'S' + NBSP + '=' + NBSP;
    if (solutions === 'R' || solutions === ENSEMBLES.R) return debut + ENSEMBLES.R;
    var liste = solutions.slice();
    var tousNombres = liste.every(function (v) { return typeof v !== 'string'; });
    if (tousNombres) {
      liste = liste.map(function (v) { return Fraction.depuis(v); })
        .sort(function (a, b) { return a.compare(b); });
    }
    return debut + formaterEnsemble(liste);
  }

  /* ---------- Versions HTML ---------- */

  function echapperHTML(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var html = {
    /** Nombre exact, période barrée en CSS : <span class="periode">18</span> (voir commun.css). */
    nombre: function (x) {
      var f = Fraction.depuis(x);
      var dev = f.developpementDecimal();
      var h = (dev.signe ? MOINS : '') + groupesMilliers(dev.entier);
      if (dev.avantPeriode || dev.periode) h += ',' + dev.avantPeriode;
      if (dev.periode) h += '<span class="periode">' + dev.periode + '</span>';
      return h;
    },
    /** Fraction empilée : <span class="frac"><span>3</span><span>4</span></span>. */
    fraction: function (x) {
      var f = Fraction.depuis(x);
      var signe = f.signe() < 0 ? MOINS : '';
      var a = f.abs();
      if (a.estEntier()) return signe + groupesMilliers(String(a.num));
      return signe + '<span class="frac" role="math" aria-label="' + a.num + ' sur ' + a.den + '">' +
        '<span>' + groupesMilliers(String(a.num)) + '</span><span>' + groupesMilliers(String(a.den)) + '</span></span>';
    },
    echapper: echapperHTML
  };

  /* ---------- Écriture d'une expression ---------- */

  var PRIORITE = { '+': 1, '-': 1, neg: 1.5, '*': 2, '/': 2, racine: 4, '^': 4, nombre: 5, lettre: 5 };

  function versTexteNoeud(n) {
    function enfant(e, min) {
      var t = versTexteNoeud(e);
      return PRIORITE[e.type] < min ? '(' + t + ')' : t;
    }
    switch (n.type) {
      case 'nombre': return formaterNombre(n.valeur);
      case 'lettre': return n.nom;
      case 'neg': return MOINS + enfant(n.arg, 2);
      case '^': {
        var base = enfant(n.base, 5);
        return base + texteExposant(n.exposant);
      }
      case 'racine': {
        var a = versTexteNoeud(n.arg);
        var simple = (n.arg.type === 'nombre' && n.arg.valeur.estDecimale()) || n.arg.type === 'lettre';
        return (n.indice === 3 ? '∛' : '√') + (simple ? a : '(' + a + ')');
      }
      case '+': return enfant(n.g, 1) + ' + ' + enfant(n.d, 2);
      case '-': return enfant(n.g, 1) + ' – ' + enfant(n.d, 2);
      case '/':
        if (n.symbole === ':') return enfant(n.g, 2) + ' : ' + enfant(n.d, 3);
        return enfant(n.g, 3) + '/' + enfant(n.d, 3);
      case '*': {
        // (1/2)x plutôt que 1/2x, qui se lirait 1/(2x)
        var g = n.g.type === '/' && n.g.symbole !== ':' && !n.g.parentheses
          ? '(' + versTexteNoeud(n.g) + ')' : enfant(n.g, 2);
        var d = enfant(n.d, 3);
        var droiteImplicite = n.d.type === 'lettre' || n.d.type === 'racine' || /^\(/.test(d) ||
          (n.d.type === '^' && n.d.base.type === 'lettre');
        var implicite = droiteImplicite && n.g.type !== 'racine' && d.charAt(0) !== '–';
        return implicite ? g + d : g + ' · ' + d;
      }
    }
    return '?';
  }

  /**
   * Écriture lisible d'une expression, selon l'aide-mémoire :
   * « 3x² – 2(x + 1) », « 12 : (– 4) », « 2 · 3 », « √(x + 1) », « (x + 1)/2 ».
   */
  function versTexte(expr) { return versTexteNoeud(analyser(expr)); }

  /* =====================================================================
   * 9. Lecture de réponses particulières
   * ===================================================================== */

  /**
   * Montant en francs saisi par l'élève -> Fraction, ou null si illisible.
   * Accepte « 7.20 », « 7,20 », « 7 », « 7.– », « CHF 7.20 », « 7.20 fr. »,
   * « 1'250.50 », « 1 250,50 ». Au plus deux décimales.
   */
  function lireMontant(texte) {
    var t = String(texte).trim().replace(/[−–—]/g, '-')
      .replace(/^(CHF|Fr\.?)\s*/i, '')
      .replace(/\s*(CHF|francs?|fr\.?)$/i, '')
      .trim();
    var m = /^([+-]?)\s*(\d{1,3}(?:['’   ]\d{3})+|\d+)(?:[.,](\d{1,2}|-{1,2}))?$/.exec(t);
    if (!m) return null;
    var centimes = m[3] && /\d/.test(m[3]) ? (m[3] + '0').slice(0, 2) : '00';
    var v = new Fraction(BigInt(m[2].replace(/\D/g, '') + centimes), 100n);
    return m[1] === '-' ? v.oppose() : v;
  }

  /**
   * Découpe une liste saisie avec des points-virgules : « 2 ; – 3 », « (2 ; – 3) »,
   * « { 1 ; 2 } », « S = { – 3 ; 3 } » -> ['2', '– 3']… (textes, à analyser ensuite).
   * Les accolades et « S = » sont retirés ; les parenthèses extérieures aussi
   * s'il y a un point-virgule. « { } » ou « ∅ » -> [].
   * Lève ErreurSaisie si un élément est vide.
   */
  function lireListe(texte) {
    var t = String(texte).trim().replace(/^S\s*=\s*/i, '').trim();
    if (t === '∅') return [];
    if (/^\{[\s\S]*\}$/.test(t)) t = t.slice(1, -1).trim();
    else if (/^\([\s\S]*\)$/.test(t) && t.indexOf(';') >= 0) t = t.slice(1, -1).trim();
    if (t === '') return [];
    var parties = t.split(';').map(function (p) { return p.trim(); });
    if (parties.some(function (p) { return p === ''; })) {
      throw new ErreurSaisie('Sépare les éléments par des points-virgules, sans élément vide.', 0);
    }
    return parties;
  }

  /**
   * Ensemble de solutions saisi : renvoie { tous: true } pour « ℝ » (ou « R »),
   * sinon { tous: false, elements: [textes] }. Chaque élément est vérifié (Maths.analyser).
   */
  function lireEnsemble(texte) {
    var t = String(texte).trim().replace(/^S\s*=\s*/i, '').trim();
    if (/^(ℝ|R|IR)$/.test(t)) return { tous: true, elements: [] };
    var elements = lireListe(t);
    elements.forEach(function (e) { analyser(e); });
    return { tous: false, elements: elements };
  }

  /**
   * Vrai si les deux ensembles contiennent les mêmes éléments (ordre et doublons
   * sans importance, éléments comparés avec Maths.equivalentes).
   * ensemblesEgaux('S = { 3 ; – 3 }', '{ – 3 ; 3 }') -> true
   */
  function ensemblesEgaux(a, b) {
    var A = lireEnsemble(a), B = lireEnsemble(b);
    if (A.tous || B.tous) return A.tous === B.tous;
    function sansDoublons(liste) {
      var res = [];
      liste.forEach(function (e) {
        if (!res.some(function (r) { return equivalentes(r, e); })) res.push(e);
      });
      return res;
    }
    var ea = sansDoublons(A.elements), eb = sansDoublons(B.elements);
    if (ea.length !== eb.length) return false;
    return ea.every(function (e) { return eb.some(function (f) { return equivalentes(e, f); }); });
  }

  return {
    version: '2.0.0',
    Alea: Alea,
    Fraction: Fraction,
    ErreurSaisie: ErreurSaisie,
    ErreurCalcul: ErreurCalcul,
    ErreurIrrationnel: ErreurIrrationnel,
    pgcd: function (a, b) { return Number(pgcd(entierBig(a), entierBig(b))); },
    // calcul et correction
    analyser: analyser,
    evaluer: evaluer,
    evaluerApproche: evaluerApproche,
    lettres: lettres,
    equivalentes: equivalentes,
    estReduite: estReduite,
    estReduiteOrdonnee: estReduiteOrdonnee,
    estFractionIrreductible: estFractionIrreductible,
    lireNotationScientifique: lireNotationScientifique,
    estNotationScientifique: estNotationScientifique,
    lireMontant: lireMontant,
    lireListe: lireListe,
    lireEnsemble: lireEnsemble,
    ensemblesEgaux: ensemblesEgaux,
    // affichage
    versTexte: versTexte,
    formaterNombre: formaterNombre,
    formaterFraction: formaterFraction,
    formaterRelatif: formaterRelatif,
    formaterPuissance: formaterPuissance,
    formaterNotationScientifique: formaterNotationScientifique,
    formaterRacine: formaterRacine,
    formaterMontant: formaterMontant,
    formaterListe: formaterListe,
    formaterEnsemble: formaterEnsemble,
    formaterCoordonnees: formaterCoordonnees,
    formaterSolutions: formaterSolutions,
    texteExposant: texteExposant,
    html: html,
    ENSEMBLES: ENSEMBLES,
    MOINS: MOINS
  };
});
