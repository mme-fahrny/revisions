/*
 * maths.js — moteur mathématique partagé (sans dépendance)
 * ---------------------------------------------------------
 * Fonctionne dans le navigateur (objet global « Maths ») et dans Node
 * (const Maths = require('./assets/maths.js')).
 *
 * Contenu :
 *   Maths.Alea                     générateur aléatoire avec graine
 *   Maths.Fraction                 fractions exactes (BigInt)
 *   Maths.analyser(texte)          expression -> arbre (AST)
 *   Maths.evaluer(expr, valeurs)   valeur exacte (Fraction)
 *   Maths.lettres(expr)            lettres présentes, triées
 *   Maths.versTexte(expr)          écriture lisible (×, −, virgule)
 *   Maths.equivalentes(a, b)       même expression ? (évaluation en points aléatoires)
 *   Maths.estReduite(expr)         pas de termes semblables, pas de parenthèses…
 *   Maths.estReduiteOrdonnee(expr, lettre?)  réduite + degrés décroissants
 *   Maths.estFractionIrreductible(texte)
 *   Maths.lireNotationScientifique(texte) / Maths.estNotationScientifique(texte)
 *   Maths.formaterNombre(x, decimales)       « 1'234,5 »
 *   Maths.ErreurSaisie                        erreur levée si la saisie est illisible
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
   * 2. Fractions exactes
   * ===================================================================== */

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

  /** Normalise une écriture de nombre « suisse » : − → -, apostrophes, virgule. */
  function normaliserNombre(texte) {
    return String(texte).trim()
      .replace(/[−–]/g, '-')
      .replace(/['’\s]/g, '')
      .replace(',', '.');
  }

  /** Lit un nombre décimal écrit en texte (« -2,5 », « 1'250.75 », « 3e-4 »). */
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

  /**
   * new Maths.Fraction(num, den?) — num et den entiers (Number ou BigInt).
   * La fraction est toujours stockée simplifiée, dénominateur positif.
   * Pour lire « 3/4 », « 2,5 » ou 0.125 : Maths.Fraction.depuis(valeur).
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

  /** Convertit une valeur (Fraction, nombre, BigInt, texte « 3/4 » ou « 2,5 ») en Fraction. */
  Fraction.depuis = function (v) {
    if (v instanceof Fraction) return v;
    if (typeof v === 'bigint') return new Fraction(v, 1n);
    if (typeof v === 'number') {
      if (!isFinite(v)) throw new ErreurCalcul('Nombre non fini');
      if (Number.isSafeInteger(v)) return new Fraction(v, 1);
      return lireDecimal(String(v));
    }
    if (typeof v === 'string') {
      var t = normaliserNombre(v);
      var i = t.indexOf('/');
      if (i >= 0) return lireDecimal(t.slice(0, i)).divise(lireDecimal(t.slice(i + 1)));
      return lireDecimal(t);
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
  /** « 3/4 », « -5/2 », « 7 ». */
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
   * Arrondi décimal exact, au format suisse : versDecimal(2) de 1234.5 -> « 1'234,5 ».
   * options.fixe = true garde les zéros finaux (« 1'234,50 »).
   * options.milliers = false supprime les apostrophes.
   */
  Fraction.prototype.versDecimal = function (decimales, options) {
    if (decimales === undefined) decimales = 10;
    options = options || {};
    var echelle = puissance10(decimales);
    var n = this.num * echelle;
    var q = n / this.den;
    var r = n % this.den;
    if (2n * absBig(r) >= this.den) q += n < 0n ? -1n : 1n;
    var negatif = q < 0n;
    var chiffres = String(absBig(q)).padStart(decimales + 1, '0');
    var entiere = chiffres.slice(0, chiffres.length - decimales);
    var frac = chiffres.slice(chiffres.length - decimales);
    if (!options.fixe) frac = frac.replace(/0+$/, '');
    if (options.milliers !== false && entiere.length > 3) {
      entiere = entiere.replace(/\B(?=(\d{3})+$)/g, "'");
    }
    var texte = entiere + (frac ? ',' + frac : '');
    if (negatif && /[1-9]/.test(texte)) texte = '-' + texte;
    return texte;
  };

  /**
   * Développement décimal exact (division posée).
   * Renvoie { signe: '' ou '-', entier: '0', avantPeriode: '1', periode: '6', periodique: true }
   * pour 1/6 = 0,1666…   Période limitée à 2000 chiffres (sinon tronque: true).
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
   * Écriture décimale exacte en texte : « 0,25 », « 0,16̅ » (barre) ou « 0,1(6) ».
   * options.periode : 'barre' (défaut, trait combinant U+0305) ou 'parentheses'.
   * Pour un affichage HTML soigné, utiliser developpementDecimal() et du CSS
   * (text-decoration: overline) sur la période.
   */
  Fraction.prototype.ecritureDecimale = function (options) {
    options = options || {};
    var dev = this.developpementDecimal();
    var entier = dev.entier.length > 3 ? dev.entier.replace(/\B(?=(\d{3})+$)/g, "'") : dev.entier;
    var texte = dev.signe + entier;
    if (dev.avantPeriode || dev.periode) texte += ',' + dev.avantPeriode;
    if (dev.periode) {
      if (options.periode === 'parentheses') texte += '(' + dev.periode + ')';
      else texte += dev.periode.split('').join('̅') + '̅';
    }
    return texte;
  };

  /** Formate un nombre (Number, Fraction, texte) à la manière suisse : « 1'234,5 ». */
  function formaterNombre(x, decimales, options) {
    return Fraction.depuis(x).versDecimal(decimales === undefined ? 10 : decimales, options);
  }

  /* =====================================================================
   * 3. Erreurs
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

  /** Erreur de calcul (division par zéro…). */
  function ErreurCalcul(message) {
    this.name = 'ErreurCalcul';
    this.message = message;
    this.stack = new Error(message).stack;
  }
  ErreurCalcul.prototype = Object.create(Error.prototype);
  ErreurCalcul.prototype.constructor = ErreurCalcul;

  /* =====================================================================
   * 4. Analyseur d'expressions littérales
   *
   * Accepte : nombres (virgule ou point décimal, apostrophe des milliers),
   * lettres (une lettre = une variable ; « ab » = a·b), + - − × * · ÷ : /,
   * parenthèses ( ) [ ], puissances entières ^n, ², ³, ⁻¹,
   * multiplication implicite : 3a, 2(x+1), (x+1)(x-1), ab.
   * Priorités usuelles, de gauche à droite : 1/2x = (1/2)·x.
   *
   * Nœuds de l'arbre :
   *   { type: 'nombre', valeur: Fraction, texte: '2,5' }
   *   { type: 'lettre', nom: 'x' }
   *   { type: '+' | '-' | '*' | '/', g: nœud, d: nœud, implicite?: true }
   *   { type: 'neg', arg: nœud }
   *   { type: '^', base: nœud, exposant: entier (Number) }
   * Un nœud écrit entre parenthèses porte parentheses: true.
   * ===================================================================== */

  var EXPOSANTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
    '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };

  function normaliserExpression(texte) {
    return String(texte)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, function (s) {
        return '^(' + s.split('').map(function (c) { return EXPOSANTS[c]; }).join('') + ')';
      })
      .replace(/[−–—]/g, '-')
      .replace(/[×·⋅*]/g, '*')
      .replace(/[÷:]/g, '/')
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
        var m = /^\d+(?:['’]\d{3})*(?:[.,]\d+)?/.exec(s.slice(i));
        jetons.push({ type: 'nombre', texte: m[0], valeur: Fraction.depuis(m[0]), pos: i });
        i += m[0].length;
        continue;
      }
      if (/[.,]/.test(c)) {
        throw new ErreurSaisie('Écris un chiffre avant la virgule (par exemple 0,5).', i);
      }
      if (/[a-zA-Z]/.test(c)) { jetons.push({ type: 'lettre', nom: c, pos: i }); i++; continue; }
      if ('+-*/^'.indexOf(c) >= 0) { jetons.push({ type: 'op', op: c, pos: i }); i++; continue; }
      if (c === '(' || c === ')') { jetons.push({ type: c, pos: i }); i++; continue; }
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
      if (this.estOp('*') || this.estOp('/')) {
        this.i++;
        g = { type: j.op, g: g, d: this.unaire() };
      } else if (j && (j.type === 'lettre' || j.type === '(')) {
        g = { type: '*', g: g, d: this.puissance(), implicite: true };
      } else if (j && j.type === 'nombre') {
        throw new ErreurSaisie('Il manque un signe d\'opération avant « ' + j.texte + ' ».', j.pos);
      } else {
        return g;
      }
    }
  };
  Analyseur.prototype.unaire = function () {
    // Le signe moins porte sur tout le terme qui suit : -2x = -(2x), -2^2 = -4.
    if (this.estOp('-')) { this.i++; return { type: 'neg', arg: this.terme() }; }
    if (this.estOp('+')) { this.i++; return this.terme(); }
    return this.puissance();
  };
  Analyseur.prototype.puissance = function () {
    var base = this.primaire();
    if (this.estOp('^')) {
      var pos = this.position();
      this.i++;
      var n = this.exposant(pos);
      base = { type: '^', base: base, exposant: n };
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
      valeur = evaluerNoeud(noeud, {});
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
    throw new ErreurSaisie('Signe « ' + j.op + ' » mal placé.', j.pos);
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
    else if (n.type === 'neg') lettresDe(n.arg, ens);
    else if (n.type === '^') lettresDe(n.base, ens);
    else if (n.g) { lettresDe(n.g, ens); lettresDe(n.d, ens); }
    return Object.keys(ens).sort();
  }

  /** Lettres présentes dans l'expression, par ordre alphabétique. */
  function lettres(expr) { return lettresDe(analyser(expr)); }

  function evaluerNoeud(n, valeurs) {
    switch (n.type) {
      case 'nombre': return n.valeur;
      case 'lettre':
        if (!(n.nom in valeurs)) throw new ErreurCalcul('Valeur manquante pour ' + n.nom);
        return Fraction.depuis(valeurs[n.nom]);
      case 'neg': return evaluerNoeud(n.arg, valeurs).oppose();
      case '^': return evaluerNoeud(n.base, valeurs).puissance(n.exposant);
      case '+': return evaluerNoeud(n.g, valeurs).plus(evaluerNoeud(n.d, valeurs));
      case '-': return evaluerNoeud(n.g, valeurs).moins(evaluerNoeud(n.d, valeurs));
      case '*': return evaluerNoeud(n.g, valeurs).fois(evaluerNoeud(n.d, valeurs));
      case '/': return evaluerNoeud(n.g, valeurs).divise(evaluerNoeud(n.d, valeurs));
    }
    throw new Error('Nœud inconnu : ' + n.type);
  }

  /** Valeur exacte (Fraction). evaluer('3x+1', { x: 2 }) -> 7. Lève ErreurCalcul si division par 0. */
  function evaluer(expr, valeurs) { return evaluerNoeud(analyser(expr), valeurs || {}); }

  /* ---------- Écriture lisible ---------- */

  var PRIORITE = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 1.5, '^': 4, nombre: 5, lettre: 5 };

  function texteNombre(n) {
    var t = n.texte !== undefined ? n.texte.replace('.', ',') : n.valeur.versDecimal(10);
    return t;
  }

  function versTexteNoeud(n) {
    var p = PRIORITE[n.type];
    function enfant(e, min) {
      var t = versTexteNoeud(e);
      return PRIORITE[e.type] < min ? '(' + t + ')' : t;
    }
    switch (n.type) {
      case 'nombre':
        if (n.valeur.estEntier() || n.texte !== undefined) return texteNombre(n);
        return '(' + n.valeur.num + '/' + n.valeur.den + ')';
      case 'lettre': return n.nom;
      case 'neg': return '−' + enfant(n.arg, 2);
      case '^': {
        var base = n.base.type === 'nombre' && n.base.valeur.signe() < 0
          ? '(' + versTexteNoeud(n.base) + ')' : enfant(n.base, 5);
        return base + '^' + (n.exposant < 0 ? '(' + '−' + (-n.exposant) + ')' : n.exposant);
      }
      case '+': return enfant(n.g, 1) + ' + ' + enfant(n.d, 2);
      case '-': return enfant(n.g, 1) + ' − ' + enfant(n.d, 2);
      case '/':
        if (n.g.type === 'nombre' && n.d.type === 'nombre') return texteNombre(n.g) + '/' + texteNombre(n.d);
        return enfant(n.g, 2) + ' / ' + enfant(n.d, 3);
      case '*': {
        // (1/2)x plutôt que 1/2x, qui se lirait 1/(2x)
        var g = n.g.type === '/' && !n.g.parentheses ? '(' + versTexteNoeud(n.g) + ')' : enfant(n.g, 2);
        var d = enfant(n.d, 3);
        var implicite = (n.d.type === 'lettre' || /^\(/.test(d) ||
          (n.d.type === '^' && n.d.base.type === 'lettre')) && !/^[−-]/.test(d);
        return implicite ? g + d : g + ' × ' + d;
      }
    }
    return '?';
  }

  /** Écriture lisible : « 3x^2 − 2(x + 1) ». */
  function versTexte(expr) { return versTexteNoeud(analyser(expr)); }

  /* =====================================================================
   * 5. Équivalence de deux expressions
   * ===================================================================== */

  /**
   * Vrai si les deux expressions prennent la même valeur exacte en
   * plusieurs points rationnels choisis au hasard (avec graine fixe).
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
        var v;
        if (alea.suivant() < 0.6) {
          v = new Fraction(alea.signe() * alea.entier(2, 12), 1);
        } else {
          v = new Fraction(alea.signe() * alea.entier(1, 19), alea.entier(2, 9));
        }
        valeurs[noms[k]] = v;
      }
      var va, vb;
      try {
        va = evaluerNoeud(A, valeurs);
        vb = evaluerNoeud(B, valeurs);
      } catch (e) {
        if (e instanceof ErreurCalcul) continue; // division par zéro en ce point : on en essaie un autre
        throw e;
      }
      if (!va.egal(vb)) return false;
      reussis++;
      if (noms.length === 0) return true;
    }
    return reussis >= Math.min(3, essais);
  }

  /* =====================================================================
   * 6. Tests de forme
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
   * Lit une notation scientifique correcte « a × 10^n » avec 1 ≤ |a| < 10.
   * Accepte ×, *, ·, x comme signe de multiplication, ^n ou exposants ²,⁻³.
   * Renvoie { mantisse: Fraction, exposant: n, valeur: Fraction } ou null.
   */
  function lireNotationScientifique(texte) {
    var t = String(texte)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, function (s) {
        return '^' + s.split('').map(function (c) { return EXPOSANTS[c]; }).join('');
      })
      .replace(/[−–]/g, '-')
      .replace(/\s/g, '');
    var m = /^([+-]?)([1-9](?:[.,]\d+)?)[×*·⋅xX]10\^(?:\(([+-]?\d+)\)|([+-]?\d+))$/.exec(t);
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

  return {
    version: '1.0.0',
    Alea: Alea,
    Fraction: Fraction,
    ErreurSaisie: ErreurSaisie,
    ErreurCalcul: ErreurCalcul,
    pgcd: function (a, b) { return Number(pgcd(entierBig(a), entierBig(b))); },
    analyser: analyser,
    evaluer: evaluer,
    lettres: lettres,
    versTexte: versTexte,
    equivalentes: equivalentes,
    estReduite: estReduite,
    estReduiteOrdonnee: estReduiteOrdonnee,
    estFractionIrreductible: estFractionIrreductible,
    lireNotationScientifique: lireNotationScientifique,
    estNotationScientifique: estNotationScientifique,
    formaterNombre: formaterNombre
  };
});
