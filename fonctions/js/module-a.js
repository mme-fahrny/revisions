/*
 * fonctions/js/module-a.js — Module A : situations, tableaux et graphiques (FA 9.1, 9e)
 * -----------------------------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : « FonctionsModuleA ». Node : require.
 *
 * Calibrage (9e, niveaux 1 et 2 identiques ; même calibrage en révision) :
 *   difficulté 1 : x entier de 0 à 10, y au plus 50, graduations de 1 ou 2 ; une seule
 *                  lecture ou un seul calcul (ex. compléter un tableau à pas constant y = kx).
 *   difficulté 2 : x entier de – 5 à 10, coefficients entiers ; deux étapes
 *                  (ex. relier une situation « forfait fixe + Go » à son graphique).
 *   difficulté 3 : nombres décimaux possibles ; trois étapes (ex. tracer depuis un tableau
 *                  entier, lire une grandeur en CHF/EUR avec un taux fictif).
 *   difficulté 4 : fin de module (ex. proportionnalité à deux étapes : vitesse en km/h,
 *                  durée en heures décimales).
 *   Exclu en 9e : coefficients négatifs, pente, expression à deux termes avec un signe moins.
 *   Les valeurs de x et de y peuvent être négatives.
 *
 * Chaque générateur renvoie une question (voir outils.js) avec un champ « controle »
 * qui décrit ses paramètres pour les tests indépendants :
 *   { ops: nombre d'étapes, xs: [x affichés], ys: [y affichés], coefs: [coefficients],
 *     grad: [pas x, pas y] (graphiques), calc: { genre, … } }
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'));
  else racine.FonctionsModuleA = fabrique(racine.FonctionsOutils);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O) {
  'use strict';

  var F = O.F, val = O.val, tn = O.tn, tm = O.tm, tc = O.tc, hm = O.hm, hf = O.hf, tx = O.tx;
  var R = O.RUBRIQUES, E = O.ERREURS;
  var FICTIF = O.MENTION_FICTIVE;

  /* ---------- petits outils ---------- */
  function suite(depart, pas, n) { var t = []; for (var i = 0; i < n; i++) t.push(depart + i * pas); return t; }
  function lettreChoix(i) { return 'ABCDEF'.charAt(i); }
  function affine(a, b) { return function (x) { return val(a).fois(val(x)).plus(val(b)); }; }
  function nombreFr(x) { return Number(val(x).valeur().toFixed(6)); }
  function sigTableau(k, b, xs) {
    var s = [];
    if (val(b).estZero() && xs.length > 1) s.push('tableau-kx:k=' + tn(k) + ':depart=' + xs[0] + ':pas=' + (xs[1] - xs[0]));
    return s;
  }
  /** Signatures d'une série de valeurs x « régulière » (pour tous les tableaux). */
  function sigs(k, b, xs) {
    var regulier = xs.every(function (x, i) { return i === 0 || x - xs[i - 1] === xs[1] - xs[0]; });
    return regulier ? sigTableau(k, b, xs) : [];
  }

  /* ---------- contextes (données fictives, prix vraisemblables, sans marque) ---------- */
  // situations de proportionnalité : prix unitaire entier
  var CONTEXTES_PROP = [
    { id: 'pommes', phrase: function (p) { return 'Au marché, les pommes coûtent ' + tm(p) + ' le kilo.'; }, x: 'la masse de pommes (en kg)', y: 'le prix (en CHF)', titreX: 'masse (kg)', titreY: 'prix (CHF)', unite: 'kg', min: 3, max: 5, discret: false, un: '1 kg', n: function (n) { return tn(n) + ' kg'; } },
    { id: 'bus', phrase: function (p) { return 'Un billet de bus pour la ville coûte ' + tm(p) + '.'; }, x: 'le nombre de billets', y: 'le prix total (en CHF)', titreX: 'billets', titreY: 'prix (CHF)', unite: 'billets', min: 2, max: 4, discret: true, un: '1 billet', n: function (n) { return tn(n) + ' ' + O.pluriel(n, 'billet'); } },
    { id: 'piscine', phrase: function (p) { return 'Une entrée à la piscine couverte coûte ' + tm(p) + '.'; }, x: 'le nombre d\'entrées', y: 'le prix total (en CHF)', titreX: 'entrées', titreY: 'prix (CHF)', unite: 'entrées', min: 4, max: 7, discret: true, un: '1 entrée', n: function (n) { return tn(n) + ' ' + O.pluriel(n, 'entrée'); } },
    { id: 'carottes', phrase: function (p) { return 'Les carottes bio coûtent ' + tm(p) + ' le kilo.'; }, x: 'la masse de carottes (en kg)', y: 'le prix (en CHF)', titreX: 'masse (kg)', titreY: 'prix (CHF)', unite: 'kg', min: 2, max: 4, discret: false, un: '1 kg', n: function (n) { return tn(n) + ' kg'; } },
    { id: 'cahiers', phrase: function (p) { return 'À la papeterie, un classeur coûte ' + tm(p) + '.'; }, x: 'le nombre de classeurs', y: 'le prix total (en CHF)', titreX: 'classeurs', titreY: 'prix (CHF)', unite: 'classeurs', min: 3, max: 6, discret: true, un: '1 classeur', n: function (n) { return tn(n) + ' ' + O.pluriel(n, 'classeur'); } }
  ];
  // situations « montant fixe + prix par unité » (entiers)
  var CONTEXTES_AFFINE = [
    { id: 'mobile', phrase: function (fixe, p) { return 'Un forfait de téléphone mobile coûte ' + tm(fixe) + ' par mois, plus ' + tm(p) + ' par Go de données utilisé.'; }, x: 'le nombre de Go utilisés dans le mois', y: 'le prix du mois (en CHF)', titreX: 'Go', titreY: 'prix (CHF)', fixeNom: 'le forfait fixe', unNom: 'le prix par Go', n: function (n) { return tn(n) + ' Go'; }, fixe: [10, 20], p: [2, 4] },
    { id: 'velo', phrase: function (fixe, p) { return 'La location d\'un vélo électrique coûte ' + tm(fixe) + ' de prise en charge, plus ' + tm(p) + ' par heure.'; }, x: 'la durée de location (en heures)', y: 'le prix (en CHF)', titreX: 'heures', titreY: 'prix (CHF)', fixeNom: 'la prise en charge', unNom: 'le prix par heure', n: function (n) { return tn(n) + ' ' + O.pluriel(n, 'heure'); }, fixe: [5, 10], p: [3, 5] },
    { id: 'sport', phrase: function (fixe, p) { return 'Un centre de sport demande ' + tm(fixe) + ' d\'inscription, plus ' + tm(p) + ' par séance.'; }, x: 'le nombre de séances', y: 'le prix total (en CHF)', titreX: 'séances', titreY: 'prix (CHF)', fixeNom: 'l\'inscription', unNom: 'le prix par séance', n: function (n) { return tn(n) + ' ' + O.pluriel(n, 'séance'); }, fixe: [10, 20], p: [3, 5] }
  ];
  // situations « montant fixe + prix par unité » (décimaux, difficulté 3)
  var CONTEXTES_AFFINE_DEC = [
    { id: 'trottinette', phrase: function (fixe, p) { return 'Une trottinette électrique en libre-service coûte ' + tm(fixe) + ' de prise en charge, plus ' + tm(p) + ' par minute.'; }, x: 'la durée du trajet (en minutes)', fixe: ['1', '1.5', '2'], p: ['0.2', '0.3', '0.4', '0.5'] },
    { id: 'recharge', phrase: function (fixe, p) { return 'Une borne de recharge pour voiture électrique facture ' + tm(fixe) + ' de frais de connexion, plus ' + tm(p) + ' par kWh.'; }, x: 'l\'énergie rechargée (en kWh)', fixe: ['2', '3'], p: ['0.4', '0.5', '0.6'] },
    { id: 'ski', phrase: function (fixe, p) { return 'Au téléski du village, la carte coûte ' + tm(fixe) + ', plus ' + tm(p) + ' par montée.'; }, x: 'le nombre de montées', fixe: ['5', '6'], p: ['1.5', '2.5'] }
  ];

  /* =====================================================================
   * Objectif A1 : vocabulaire
   * ===================================================================== */

  /** D1 — lire l'image d'un nombre dans un tableau. */
  function genImageTableau(alea, d) {
    var proportionnel = alea.suivant() < 0.6;
    var k, b, xs;
    for (;;) {
      k = proportionnel ? alea.entier(2, 9) : 1;
      b = proportionnel ? 0 : alea.entier(2, 15);
      var pas = alea.choix([1, 2]), depart = alea.entier(0, 2);
      xs = suite(depart, pas, 5);
      if (xs[4] > 10 || k * xs[4] + b > 50) continue;
      break;
    }
    var f = affine(k, b);
    var ys = xs.map(function (x) { return nombreFr(f(x)); });
    // de préférence un x0 qui apparaît aussi dans la ligne des images (piège x / f(x))
    var communs = xs.filter(function (x) { return ys.indexOf(x) >= 0 && nombreFr(f(x)) !== x; });
    var x0 = communs.length ? alea.choix(communs) : alea.choix(xs.slice(1));
    var y0 = nombreFr(f(x0));
    var forme = alea.choix(['image', 'f']);
    var question = forme === 'image' ? 'Quelle est l\'image de ' + tn(x0) + ' par la fonction f ?' : 'Que vaut ' + hm('f(' + tn(x0) + ')') + ' ?';
    var pieges = [];
    var inv = xs[ys.indexOf(x0)];
    if (inv !== undefined) pieges.push({ valeur: inv, message: E.variableImage + ' Tu as cherché ' + tn(x0) + ' dans la ligne des images.' });
    return {
      type: 'lecture',
      enonce: '<p>Voici le tableau de valeurs d\'une fonction f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>' + question + '</p>',
      indice: 'Repère ' + tn(x0) + ' dans la ligne des x (en haut). Son image est le nombre juste en dessous.',
      reponse: { type: 'nombre', valeur: y0 },
      pieges: pieges,
      etapes: [{ texte: 'Dans la ligne des x, on repère la colonne x = ' + tn(x0) + ' ; l\'image est le nombre de la ligne f(x) dans cette colonne.', calcul: hm('f(' + tn(x0) + ') = ' + tn(y0)) }],
      verification: 'Vérification : le tableau contient bien la colonne ' + hm('x = ' + tn(x0)) + ' et ' + hm('f(x) = ' + tn(y0)) + ' ; le point ' + hm(tc(x0, y0)) + ' appartient au graphique de f.',
      rubrique: R.tableau,
      signatures: sigs(k, b, xs),
      controle: { ops: 1, xs: xs, ys: ys, coefs: [k, b], calc: { genre: 'valeur', a: k, b: b, x: x0 } }
    };
  }

  /** D1 — nommer : expression fonctionnelle, tableau de valeurs, graphique, image, variable. */
  function genVocabulaire(alea, d) {
    var k = alea.entier(2, 9), b = alea.choix([0, alea.entier(1, 9)]);
    var src = O.srcAffine(k, b);
    var x0 = alea.entier(1, 5), y0 = k * x0 + b;
    var cas = alea.choix(['expression', 'image', 'variable', 'tableau', 'graphique']);
    var enonce, choix, etape, ys, xs = [];
    var NOMS = { expression: 'une expression fonctionnelle', tableau: 'un tableau de valeurs', graphique: 'un graphique', image: 'une image' };
    function choixNoms(juste) {
      return Object.keys(NOMS).map(function (n) {
        return { h: NOMS[n], juste: n === juste, message: n === juste ? '' : 'Non : ' + {
          expression: 'une expression fonctionnelle est une écriture du type f(x) = 3x + 2.',
          tableau: 'un tableau de valeurs a une ligne pour x et une ligne pour f(x).',
          graphique: 'un graphique est un dessin dans un repère, avec deux axes.',
          image: 'l\'image est un NOMBRE : la valeur f(x) obtenue pour un x donné.'
        }[n] };
      });
    }
    if (cas === 'expression') {
      enonce = '<p>Comment appelle-t-on cette écriture ?</p><p class="calcul">' + hf(src) + '</p>';
      choix = choixNoms('expression');
      etape = 'Une écriture qui dit comment calculer f(x) à partir de x s\'appelle une expression fonctionnelle.';
    } else if (cas === 'tableau') {
      xs = suite(0, 1, 5); ys = xs.map(function (x) { return k * x + b; });
      while (ys[4] > 50) { k--; ys = xs.map(function (x) { return k * x + b; }); }
      enonce = '<p>Comment appelle-t-on cette représentation d\'une fonction ?</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]);
      choix = choixNoms('tableau');
      etape = 'Une ligne de valeurs de x et, en dessous, leurs images f(x) : c\'est un tableau de valeurs.';
    } else if (cas === 'graphique') {
      k = alea.entier(1, 4); b = alea.entier(0, 6);
      var g = { xmin: 0, xmax: 8, ymin: 0, ymax: 40, gx: 1, gy: 2, lx: 1, ly: 10, courbes: [{ src: O.srcAffine(k, b) }], description: 'Droite dans un repère' };
      enonce = '<p>Comment appelle-t-on cette représentation d\'une fonction ?</p>' + O.graphiqueHtml(g);
      choix = choixNoms('graphique');
      etape = 'Un dessin dans un repère (axe des x horizontal, axe des y vertical) : c\'est le graphique de la fonction.';
    } else if (cas === 'image') {
      enonce = '<p>On sait que ' + hm('f(' + tn(x0) + ') = ' + tn(y0)) + '.</p><p>Comment appelle-t-on le nombre ' + tn(y0) + ' ?</p>';
      choix = [
        { h: 'l\'image de ' + tn(x0) + ' par f', juste: true },
        { h: 'la valeur de la variable x', juste: false, message: E.variableImage },
        { h: 'l\'expression fonctionnelle', juste: false, message: 'Non : l\'expression fonctionnelle est une écriture du type f(x) = 3x + 2, pas un nombre.' },
        { h: 'le graphique de f', juste: false, message: 'Non : le graphique est un dessin dans un repère.' }
      ];
      etape = 'Dans ' + hm('f(' + tn(x0) + ') = ' + tn(y0)) + ', ' + tn(x0) + ' est la valeur de x et ' + tn(y0) + ' est son image.';
    } else {
      enonce = '<p>On sait que ' + hm('f(' + tn(x0) + ') = ' + tn(y0)) + '.</p><p>Quelle est la valeur de la variable x ?</p>';
      choix = [
        { h: 'x = ' + tn(x0), juste: true },
        { h: 'x = ' + tn(y0), juste: false, message: E.variableImage },
        { h: 'x = ' + tn(x0 + y0), juste: false, message: 'Non : on n\'additionne pas. La valeur de x est le nombre entre parenthèses.' }
      ];
      etape = 'La valeur de x est le nombre écrit entre les parenthèses de f( ) ; le nombre après le signe = est son image.';
    }
    return {
      type: 'choix',
      enonce: enonce,
      indice: 'Variable x, image f(x), expression fonctionnelle, tableau de valeurs, graphique : relis ces mots dans l\'aide-mémoire.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [{ texte: etape }],
      verification: '',
      rubrique: R.fonction,
      controle: { ops: 1, xs: xs, ys: ys || [], coefs: [k, b], calc: { genre: 'choix' } }
    };
  }

  /** D2 — calculer une image avec l'expression fonctionnelle. */
  function genImageExpression(alea, d) {
    var k = alea.entier(2, 6), b = alea.entier(1, 9);
    var x0 = alea.entierNonNul(-5, 10);
    var y0 = k * x0 + b;
    var src = O.srcAffine(k, b);
    return {
      type: 'directe',
      enonce: '<p>On donne la fonction ' + hf(src) + '.</p><p>Calcule l\'image de ' + tn(x0) + ', c\'est-à-dire ' + hm('f(' + tn(x0) + ')') + '.</p>',
      indice: 'Remplace x par ' + O.tnp(x0) + ' dans l\'expression, puis calcule : d\'abord la multiplication, ensuite l\'addition.',
      reponse: { type: 'nombre', valeur: y0 },
      pieges: [
        { valeur: k * x0, message: 'Tu as oublié d\'ajouter ' + tn(b) + ' après la multiplication.' },
        { valeur: k * (x0 + b), message: 'Attention aux priorités : on multiplie d\'abord ' + tn(k) + ' · ' + O.tnp(x0) + ', puis on ajoute ' + tn(b) + '.' },
        { valeur: k + x0 + b, message: tn(k) + 'x signifie ' + tn(k) + ' · x : il faut multiplier, pas additionner.' }
      ],
      etapes: [
        { texte: 'On remplace x par ' + O.tnp(x0) + '.', calcul: hm('f(' + tn(x0) + ') = ' + tn(k) + ' · ' + O.tnp(x0) + ' + ' + tn(b)) },
        { texte: 'On calcule : d\'abord la multiplication, puis l\'addition.', calcul: hm('f(' + tn(x0) + ') = ' + tn(k * x0) + ' + ' + tn(b) + ' = ' + tn(y0)) }
      ],
      verification: 'Vérification : ' + hm(tn(y0) + ' – ' + tn(b) + ' = ' + tn(k * x0)) + ' et ' + hm(tn(k * x0) + ' : ' + tn(k) + ' = ' + tn(x0)) + '.',
      rubrique: R.expression,
      controle: { ops: 2, xs: [x0], ys: [y0], coefs: [k, b], calc: { genre: 'valeur', a: k, b: b, x: x0 } }
    };
  }

  /** D2 — vrai ou faux : « ce tableau est un tableau de proportionnalité ». */
  function genVraiFauxProportion(alea, d) {
    var vrai = alea.suivant() < 0.5;
    var k = alea.entier(2, 6), b = vrai ? 0 : alea.entier(1, 6);
    var depart = alea.entier(1, 3), pas = alea.choix([1, 2]);
    var xs = suite(depart, pas, 4);
    var ys = xs.map(function (x) { return k * x + b; });
    var x1 = xs[0], x2 = xs[2];
    var q1 = new F(ys[0], x1), q2 = new F(ys[2], x2);
    var opts = O.optionsVraiFaux(alea, {
      vrai: vrai,
      justeVrai: 'on passe de x à f(x) en multipliant toujours par ' + tn(k) + '.',
      justeFaux: 'on ne multiplie pas toujours par le même nombre : ' + hm(tn(ys[0]) + ' : ' + tn(x1) + ' = ' + tn(q1)) + ' mais ' + hm(tn(ys[2]) + ' : ' + tn(x2) + ' = ' + tn(q2)) + '.',
      autresVrai: ['les nombres des deux lignes augmentent en même temps.', 'on ajoute toujours le même nombre d\'une colonne à la suivante.'],
      autresFaux: ['les nombres de la ligne f(x) sont plus grands que ceux de la ligne x.', 'il n\'y a pas de colonne x = 0.'],
      messageFaux: 'Un tableau est de proportionnalité si l\'on passe de x à f(x) en multipliant TOUJOURS par le même nombre. Que les nombres augmentent ensemble ne suffit pas.'
    });
    return {
      type: 'vraifaux',
      enonce: '<p>Voici un tableau de valeurs.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>« Ce tableau est un tableau de proportionnalité. » Vrai ou faux ?</p>',
      indice: 'Pour chaque colonne, calcule f(x) : x. Est-ce toujours le même nombre ?',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: 'Pour chaque colonne, on calcule f(x) : x.', calcul: hm(xs.map(function (x, i) { return tn(ys[i]) + ' : ' + tn(x) + ' = ' + tn(new F(ys[i], x)); }).join(' ; ')) },
        { texte: vrai ? 'On obtient toujours ' + tn(k) + ' : c\'est un tableau de proportionnalité (coefficient ' + tn(k) + ').' : 'Les quotients ne sont pas tous égaux : ce n\'est pas un tableau de proportionnalité.' }
      ],
      verification: vrai ? 'Contrôle : ' + hm(tn(x1) + ' · ' + tn(k) + ' = ' + tn(ys[0])) + '.' : 'Contrôle : si c\'était proportionnel, f(' + tn(x2) + ') vaudrait ' + tn(q1.fois(x2)) + ' et non ' + tn(ys[2]) + '.',
      rubrique: R.proportionnalite,
      signatures: sigs(k, b, xs),
      controle: { ops: 2, xs: xs, ys: ys, coefs: [k, b], calc: { genre: 'proportionnel', xs: xs, ys: ys, attendu: vrai } }
    };
  }

  /** D3 — sens de f(x0) = y0 dans une situation. */
  function genSensImage(alea, d) {
    var c = alea.choix(CONTEXTES_AFFINE);
    var fixe = alea.entier(c.fixe[0], c.fixe[1]), p = alea.entier(c.p[0], c.p[1]);
    var x0 = alea.entier(2, 9), y0 = fixe + p * x0;
    var src = O.srcAffine(p, fixe);
    var choix = [
      { h: 'Pour ' + c.n(x0) + ', le prix est de ' + tm(y0) + '.', juste: true },
      { h: 'Pour ' + c.n(y0) + ', le prix est de ' + tm(x0) + '.', juste: false, message: E.variableImage },
      { h: 'Chaque unité coûte ' + tm(y0) + '.', juste: false, message: 'Non : ' + tm(y0) + ' est le prix TOTAL pour x = ' + tn(x0) + ', montant fixe compris.' },
      { h: c.fixeNom.charAt(0).toUpperCase() + c.fixeNom.slice(1) + ' vaut ' + tm(y0) + '.', juste: false, message: E.fixeUnitaire + ' Ici, ' + c.fixeNom + ' vaut ' + tm(fixe) + '.' }
    ];
    return {
      type: 'choix',
      enonce: '<p>' + c.phrase(fixe, p) + '</p>' + FICTIF + '<p>Le prix est donné par la fonction ' + hf(src) + ', où x est ' + c.x + '.</p><p>Que signifie ' + hm('f(' + tn(x0) + ') = ' + tn(y0)) + ' ?</p>',
      indice: 'Le nombre entre parenthèses est la valeur de x ; le nombre après le signe = est l\'image, ici un prix.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'Dans ' + hm('f(' + tn(x0) + ') = ' + tn(y0)) + ', x = ' + tn(x0) + ' : c\'est ' + c.x + '.' },
        { texte: 'L\'image ' + tn(y0) + ' est le prix correspondant, en CHF.' },
        { texte: 'Donc : pour ' + c.n(x0) + ', on paie ' + tm(y0) + '.' }
      ],
      verification: 'Vérification : ' + hm(tn(fixe) + ' + ' + tn(p) + ' · ' + tn(x0) + ' = ' + tn(y0)) + '.',
      rubrique: R.fonction,
      controle: { ops: 3, xs: [x0], ys: [y0], coefs: [p, fixe], calc: { genre: 'choix' } }
    };
  }

  /** D3 — quel nombre a pour image y0 ? (opérations réciproques) */
  function genAntecedent(alea, d) {
    var k = alea.entier(2, 6), b = alea.entier(1, 9), x0 = alea.entier(1, 10);
    var y0 = k * x0 + b;
    var src = O.srcAffine(k, b);
    return {
      type: 'directe',
      enonce: '<p>On donne la fonction ' + hf(src) + '.</p><p>Quel nombre x a pour image ' + tn(y0) + ' ? Autrement dit, pour quel x a-t-on ' + hm('f(x) = ' + tn(y0)) + ' ?</p>',
      indice: 'Fais le chemin à l\'envers : f multiplie par ' + tn(k) + ' puis ajoute ' + tn(b) + '. Pour revenir à x, enlève ' + tn(b) + ' puis divise par ' + tn(k) + '.',
      reponse: { type: 'nombre', valeur: x0 },
      pieges: [
        { valeur: k * y0 + b, message: E.variableImage + ' Tu as calculé f(' + tn(y0) + ') au lieu de chercher le x dont l\'image est ' + tn(y0) + '.' },
        { valeur: y0 - b, message: 'Tu as bien enlevé ' + tn(b) + ', mais il faut encore diviser par ' + tn(k) + '.' }
      ],
      etapes: [
        { texte: 'La fonction f multiplie x par ' + tn(k) + ', puis ajoute ' + tn(b) + '. On fait le chemin à l\'envers.', calcul: hm('x → · ' + tn(k) + ' → + ' + tn(b) + ' → ' + tn(y0)) },
        { texte: 'On enlève d\'abord ' + tn(b) + '.', calcul: hm(tn(y0) + ' – ' + tn(b) + ' = ' + tn(y0 - b)) },
        { texte: 'Puis on divise par ' + tn(k) + '.', calcul: hm(tn(y0 - b) + ' : ' + tn(k) + ' = ' + tn(x0)) }
      ],
      verification: 'Vérification : ' + hm('f(' + tn(x0) + ') = ' + tn(k) + ' · ' + tn(x0) + ' + ' + tn(b) + ' = ' + tn(y0)) + '.',
      rubrique: R.expression,
      controle: { ops: 3, xs: [x0], ys: [y0], coefs: [k, b], calc: { genre: 'antecedent', a: k, b: b, y: y0 } }
    };
  }

  /** D4 — repérer l'affirmation fausse d'un élève fictif. */
  function genErreurVocabulaire(alea, d) {
    var k = alea.entier(2, 5), b = alea.entier(1, 8);
    var xs = alea.melanger([-4, -2, -1, 0, 1, 3, 5, 6, 8, 10]).slice(0, 5).sort(function (u, v) { return u - v; });
    var ys = xs.map(function (x) { return k * x + b; });
    var nom = alea.choix(O.PRENOMS);
    var idx = alea.melanger([0, 1, 2, 3, 4]).slice(0, 3);
    var fausse = alea.entier(0, 2);
    var formes = alea.melanger(['f', 'image', 'point']);
    var affirmations = idx.map(function (i, j) {
      var x = xs[i], y = ys[i];
      var swap = j === fausse;
      var a = swap ? y : x, bb = swap ? x : y;
      var t;
      if (formes[j] === 'f') t = hm('f(' + tn(a) + ') = ' + tn(bb));
      else if (formes[j] === 'image') t = 'L\'image de ' + tn(a) + ' est ' + tn(bb) + '.';
      else t = 'Le point ' + hm(tc(a, bb)) + ' appartient au graphique de f.';
      return { h: t, x: x, y: y, swap: swap };
    });
    var choix = affirmations.map(function (af) {
      return { h: af.h, juste: af.swap, message: af.swap ? '' : 'Cette affirmation est juste : dans la colonne x = ' + tn(af.x) + ', on lit f(x) = ' + tn(af.y) + '.' };
    });
    choix.push({ h: 'Les trois affirmations sont justes.', juste: false, message: 'Une des affirmations inverse x et f(x) : contrôle chacune avec le tableau.' });
    var af = affirmations[fausse];
    return {
      type: 'erreur',
      enonce: '<p>Voici le tableau de valeurs d\'une fonction f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) +
        '<p>' + nom + ' écrit trois affirmations. Laquelle est fausse ?</p>',
      indice: 'Pour chaque affirmation, repère quel nombre est x (ligne du haut) et quel nombre est f(x) (ligne du bas).',
      reponse: { type: 'choix' }, choix: choix,
      etapes: affirmations.map(function (a) {
        return { texte: a.h + ' → ' + (a.swap ? 'fausse : dans le tableau, c\'est ' + hm('f(' + tn(a.x) + ') = ' + tn(a.y)) + ' (x et f(x) sont inversés).' : 'juste : colonne x = ' + tn(a.x) + ', f(x) = ' + tn(a.y) + '.') };
      }),
      verification: 'Vérification : ' + hm('f(' + tn(af.x) + ') = ' + tn(k) + ' · ' + O.tnp(af.x) + ' + ' + tn(b) + ' = ' + tn(af.y)) + '.',
      rubrique: R.fonction,
      controle: { ops: 3, xs: xs, ys: ys, coefs: [k, b], calc: { genre: 'choix' } }
    };
  }

  /** D4 — vrai ou faux : un point appartient-il au graphique ? */
  function genPointGraphique(alea, d) {
    var k = alea.entier(2, 5), b = alea.entier(1, 9), x0 = alea.entier(2, 8);
    var y0 = k * x0 + b;
    var cas = alea.choix(['juste', 'inverse', 'decale']);
    var px = cas === 'inverse' ? y0 : x0, py = cas === 'inverse' ? x0 : (cas === 'decale' ? y0 + alea.choix([-1, 1]) * alea.entier(1, 3) : y0);
    var vrai = cas === 'juste';
    var fpx = k * px + b;
    var src = O.srcAffine(k, b);
    var opts = O.optionsVraiFaux(alea, {
      vrai: vrai,
      justeVrai: hm('f(' + tn(px) + ') = ' + tn(fpx)) + ', qui est bien l\'ordonnée du point.',
      justeFaux: hm('f(' + tn(px) + ') = ' + tn(fpx)) + ' et non ' + tn(py) + '.',
      autresVrai: ['f(' + tn(py) + ') = ' + tn(k * py + b) + '.', 'les deux coordonnées sont positives.'],
      autresFaux: ['f(' + tn(py) + ') = ' + tn(k * py + b) + ' et non ' + tn(px) + '.', 'le point n\'est pas sur l\'axe des x.'],
      messageFaux: 'Pour savoir si le point (x ; y) appartient au graphique, on calcule f(x) avec la PREMIÈRE coordonnée, puis on compare avec la deuxième. ' + E.inverse
    });
    return {
      type: 'vraifaux',
      enonce: '<p>On donne la fonction ' + hf(src) + '.</p><p>« Le point ' + hm(tc(px, py)) + ' appartient au graphique de f. » Vrai ou faux ?</p>',
      indice: 'Calcule f(' + tn(px) + ') avec la première coordonnée, puis compare avec la deuxième.',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: 'Le point a pour coordonnées x = ' + tn(px) + ' et y = ' + tn(py) + '.' },
        { texte: 'On calcule l\'image de ' + tn(px) + '.', calcul: hm('f(' + tn(px) + ') = ' + tn(k) + ' · ' + tn(px) + ' + ' + tn(b) + ' = ' + tn(fpx)) },
        { texte: vrai ? 'On trouve bien ' + tn(py) + ' : le point appartient au graphique.' : 'On trouve ' + tn(fpx) + ', pas ' + tn(py) + ' : le point n\'appartient pas au graphique.' }
      ],
      verification: vrai ? '' : 'Le point du graphique d\'abscisse ' + tn(px) + ' est ' + hm(tc(px, fpx)) + '.',
      rubrique: R.graphique,
      controle: { ops: 3, xs: [px], ys: [py], coefs: [k, b], calc: { genre: 'appartient', a: k, b: b, x: px, y: py, attendu: vrai } }
    };
  }

  /* =====================================================================
   * Objectif A2 : situations
   * ===================================================================== */

  /** D1 — choisir l'expression d'une situation de proportionnalité. */
  function genExpressionSituationProp(alea, d) {
    var c = alea.choix(CONTEXTES_PROP), p = alea.entier(c.min, c.max);
    var choix = [
      { h: hf(O.srcAffine(p, 0)), juste: true },
      { h: hf('x+' + p), juste: false, message: E.additif + ' Pour 2 unités, on paie 2 · ' + tn(p) + ', pas 2 + ' + tn(p) + '.' },
      { h: hm('f(x) = x : ' + tn(p)), juste: false, message: 'Non : le prix augmente quand x augmente ; on multiplie par ' + tn(p) + ', on ne divise pas.' },
      { h: hf(String(p)), juste: false, message: 'Non : avec f(x) = ' + tn(p) + ', le prix serait toujours le même, quel que soit x.' }
    ];
    return {
      type: 'choix',
      enonce: '<p>' + c.phrase(p) + '</p>' + FICTIF + '<p>On note x ' + c.x + ' et f(x) ' + c.y + '. Quelle expression fonctionnelle correspond à cette situation ?</p>',
      indice: 'Combien paie-t-on pour 1 ? pour 2 ? pour 3 ? Quel calcul fais-tu à chaque fois ?',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [{ texte: 'Pour x unités, on paie x fois ' + tm(p) + '.', calcul: hf(O.srcAffine(p, 0)) }],
      verification: 'Contrôle : pour x = 2, ' + hm('f(2) = ' + tn(p) + ' · 2 = ' + tn(2 * p)) + ' (le prix de 2 unités).',
      rubrique: R.expression,
      controle: { ops: 1, xs: [], ys: [], coefs: [p], calc: { genre: 'choix' } }
    };
  }

  /** D1 — lire un prix sur le graphique d'une situation de proportionnalité. */
  function genLireGraphiqueSituation(alea, d) {
    var c, p, xmax;
    do { c = alea.choix(CONTEXTES_PROP); p = alea.entier(c.min, c.max); xmax = 8; } while (p * xmax > 50);
    var x0 = alea.entier(2, xmax);
    var y0 = p * x0;
    var ymax = Math.ceil((p * xmax) / 10) * 10;
    var g = { xmin: 0, xmax: xmax, ymin: 0, ymax: ymax, gx: 1, gy: 2, lx: 1, ly: 10, titreX: c.titreX, titreY: c.titreY,
      description: 'Graphique du prix en fonction de ' + c.x };
    if (c.discret) g.points = suite(0, 1, xmax + 1).map(function (x) { return { x: x, y: p * x }; });
    else g.courbes = [{ src: O.srcAffine(p, 0) }];
    var pieges = [];
    if (x0 % p === 0 && x0 / p !== y0) pieges.push({ valeur: x0 / p, message: E.axes });
    pieges.push({ valeur: x0, message: 'Tu as donné la valeur de x. Le prix se lit sur l\'axe vertical, en face du point d\'abscisse ' + tn(x0) + '.' });
    return {
      type: 'lecture',
      enonce: '<p>Le graphique donne ' + c.y + ' en fonction de ' + c.x + '.</p>' + FICTIF + O.graphiqueHtml(g) + '<p>Lis sur le graphique le prix de ' + c.n(x0) + '.</p>',
      indice: 'Pars de ' + tn(x0) + ' sur l\'axe horizontal, monte jusqu\'au ' + (c.discret ? 'point' : 'trait') + ', puis va à gauche lire le prix sur l\'axe vertical. Un petit carreau vaut 2 CHF en hauteur.',
      reponse: { type: 'nombre', valeur: y0, montant: true },
      suffixe: 'CHF',
      pieges: pieges,
      etapes: [{ texte: 'On part de x = ' + tn(x0) + ' sur l\'axe horizontal, on monte jusqu\'au ' + (c.discret ? 'point' : 'trait') + ' et on lit la hauteur sur l\'axe vertical (un carreau = 2 CHF).', calcul: hm('f(' + tn(x0) + ') = ' + tn(y0)) }],
      verification: 'Contrôle : ' + hm(tn(x0) + ' · ' + tn(p) + ' = ' + tn(y0)) + ' (' + c.un + ' coûte ' + tm(p) + ').',
      rubrique: R.graphique,
      controle: { ops: 1, xs: [x0, xmax], ys: [y0, ymax], coefs: [p], grad: [1, 2], calc: { genre: 'valeur', a: p, b: 0, x: x0 } }
    };
  }

  /** Paramètres « montant fixe + prix par unité » pour un graphique jusqu'à x = 8, y ≤ 50. */
  function tirerAffine(alea) {
    var c, fixe, p;
    do {
      c = alea.choix(CONTEXTES_AFFINE);
      fixe = alea.entier(c.fixe[0], c.fixe[1]); p = alea.entier(c.p[0], c.p[1]);
    } while (fixe + 8 * p > 50 || fixe === p);
    return { c: c, fixe: fixe, p: p };
  }

  /** D2 — relier une situation (montant fixe + prix par unité) à son graphique. */
  function genRelierGraphique(alea, d) {
    var t = tirerAffine(alea), c = t.c, fixe = t.fixe, p = t.p;
    function gr(a, b) { return { xmin: 0, xmax: 8, ymin: 0, ymax: 50, gx: 1, gy: 2, lx: 1, ly: 10, titreX: c.titreX, titreY: c.titreY, courbes: [{ src: O.srcAffine(a, b) }], description: 'Droite qui part de (0 ; ' + tn(b) + ') et augmente de ' + tn(a) + ' quand x augmente de 1' }; }
    var choix = [
      { h: O.graphiqueHtml(gr(p, fixe)), juste: true, param: [p, fixe] },
      { h: O.graphiqueHtml(gr(p, 0)), juste: false, param: [p, 0], message: E.origine },
      { h: O.graphiqueHtml(gr(fixe, p)), juste: false, param: [fixe, p], message: E.fixeUnitaire }
    ];
    choix = O.melanger(alea, choix).map(function (ch, i) { ch.h = '<span class="nom-choix">Graphique ' + lettreChoix(i) + '</span>' + ch.h; return ch; });
    return {
      type: 'relier',
      enonce: '<p>' + c.phrase(fixe, p) + '</p>' + FICTIF + '<p>Quel graphique donne ' + c.y + ' en fonction de ' + c.x + ' ?</p>',
      indice: 'Combien paie-t-on pour x = 0 ? Où le graphique doit-il commencer sur l\'axe vertical ? Puis : de combien le prix augmente-t-il pour chaque unité en plus ?',
      reponse: { type: 'choix' }, choix: choix, choixGraphiques: true,
      etapes: [
        { texte: 'Pour x = 0, on paie seulement ' + c.fixeNom + ' : le graphique part du point ' + hm(tc(0, fixe)) + '.', calcul: hm('f(0) = ' + tn(fixe)) },
        { texte: 'Pour chaque unité en plus, le prix augmente de ' + tm(p) + '.', calcul: hm('f(1) = ' + tn(fixe + p) + ' ; f(2) = ' + tn(fixe + 2 * p)) }
      ],
      verification: 'Contrôle sur le graphique choisi : pour x = 5, on doit lire ' + hm(tn(fixe) + ' + 5 · ' + tn(p) + ' = ' + tn(fixe + 5 * p)) + '.',
      rubrique: R.graphique,
      controle: { ops: 2, xs: [0, 8], ys: [fixe, fixe + 8 * p, 50], coefs: [p, fixe], grad: [1, 2], calc: { genre: 'choix-param', attendu: [p, fixe], contexte: { fixe: fixe, p: p } } }
    };
  }

  /** D2 — relier une situation à son tableau de valeurs. */
  function genRelierTableau(alea, d) {
    var t = tirerAffine(alea), c = t.c, fixe = t.fixe, p = t.p;
    var xs = [0, 1, 2, 3, 4];
    function tab(a, b) { return O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: xs.map(function (x) { return a * x + b; }) }]); }
    var choix = [
      { h: tab(p, fixe), juste: true, param: [p, fixe] },
      { h: tab(p, 0), juste: false, param: [p, 0], message: E.origine + ' Pour x = 0, on paie déjà ' + tm(fixe) + '.' },
      { h: tab(fixe, p), juste: false, param: [fixe, p], message: E.fixeUnitaire }
    ];
    choix = O.melanger(alea, choix).map(function (ch, i) { ch.h = '<span class="nom-choix">Tableau ' + lettreChoix(i) + '</span>' + ch.h; return ch; });
    return {
      type: 'relier',
      enonce: '<p>' + c.phrase(fixe, p) + '</p>' + FICTIF + '<p>x est ' + c.x + ' et f(x) ' + c.y + '. Quel tableau de valeurs correspond à cette situation ?</p>',
      indice: 'Calcule le prix pour x = 0, puis pour x = 1.',
      reponse: { type: 'choix' }, choix: choix,
      etapes: [
        { texte: 'Pour x = 0, on paie seulement ' + c.fixeNom + '.', calcul: hm('f(0) = ' + tn(fixe)) },
        { texte: 'Chaque unité ajoute ' + tm(p) + '.', calcul: hm('f(1) = ' + tn(fixe) + ' + ' + tn(p) + ' = ' + tn(fixe + p)) }
      ],
      verification: 'Contrôle : ' + hm('f(4) = ' + tn(fixe) + ' + 4 · ' + tn(p) + ' = ' + tn(fixe + 4 * p)) + '.',
      rubrique: R.tableau,
      controle: { ops: 2, xs: xs, ys: xs.map(function (x) { return fixe * x + p; }).concat(xs.map(function (x) { return p * x + fixe; })), coefs: [p, fixe], calc: { genre: 'choix-param', attendu: [p, fixe], contexte: { fixe: fixe, p: p } } }
    };
  }

  /** D3 — écrire l'expression fonctionnelle d'une situation (nombres décimaux). */
  function genExpressionSituation(alea, d) {
    var c = alea.choix(CONTEXTES_AFFINE_DEC);
    var fixe = val(alea.choix(c.fixe)), p = val(alea.choix(c.p));
    var src = O.srcAffine(p, fixe);
    return {
      type: 'directe',
      enonce: '<p>' + c.phrase(fixe, p) + '</p>' + FICTIF + '<p>On note x ' + c.x + '. Écris l\'expression fonctionnelle f qui donne le prix en CHF.</p>',
      consigne: 'Écris seulement le membre de droite, par exemple 2x + 3.',
      prefixe: 'f(x) =',
      indice: 'Le prix contient une partie fixe (payée une seule fois) et une partie qui dépend de x (prix par unité · x).',
      reponse: { type: 'expr', attendu: src },
      pieges: [
        { src: O.srcAffine(fixe, p), message: E.fixeUnitaire },
        { src: O.srcAffine(p, 0), message: E.oubliFixe },
        { src: O.srcAffine(fixe.plus(p), 0), message: 'On n\'additionne pas le montant fixe et le prix par unité : seul le prix par unité est multiplié par x.' }
      ],
      etapes: [
        { texte: 'La partie fixe vaut ' + tm(fixe) + ' : elle est payée une seule fois.', calcul: hm(tn(fixe)) },
        { texte: 'La partie variable : ' + tm(p) + ' pour chaque unité, donc ' + tn(p) + ' · x.', calcul: hm(tn(p) + 'x') },
        { texte: 'Le prix est la somme des deux.', calcul: hf(src) }
      ],
      verification: 'Contrôle : pour x = 10, ' + hm('f(10) = ' + tn(p) + ' · 10 + ' + tn(fixe) + ' = ' + tn(p.fois(10).plus(fixe))) + ' CHF.',
      rubrique: R.expression,
      controle: { ops: 3, xs: [], ys: [], coefs: [p.toString(), fixe.toString()], calc: { genre: 'expr', a: p.toString(), b: fixe.toString() } }
    };
  }

  /** D3 — « raconte ce graphique » : distance à la maison en fonction du temps. */
  function genRaconte(alea, d) {
    var nom = alea.choix(O.PRENOMS);
    var t1 = alea.choix([10, 15, 20]), d1 = alea.choix([2, 3, 4, 5]);
    var pause = alea.choix([10, 15, 20]);
    var t2 = t1 + pause;
    var retour = alea.suivant() < 0.5;
    var t3 = t2 + alea.choix([10, 15, 20]);
    var d3 = retour ? 0 : d1 + alea.choix([2, 3]);
    var xmax = 60, ymax = 10;
    var g = { xmin: 0, xmax: xmax, ymin: 0, ymax: ymax, gx: 5, gy: 1, lx: 10, ly: 2, titreX: 'temps (min)', titreY: 'distance à la maison (km)',
      segments: [[[0, 0], [t1, d1], [t2, d1], [t3, d3]]], description: 'Graphique de la distance à la maison en fonction du temps, en trois parties' };
    var juste = nom + ' roule ' + t1 + ' min et s\'éloigne de ' + d1 + ' km, s\'arrête ' + pause + ' min, puis ' + (retour ? 'rentre à la maison en ' + (t3 - t2) + ' min.' : 'repart et s\'éloigne encore jusqu\'à ' + d3 + ' km.');
    var choix = [
      { h: juste, juste: true },
      { h: nom + ' monte une côte pendant ' + t1 + ' min, roule sur le plat, puis ' + (retour ? 'descend la côte.' : 'monte une deuxième côte.'), juste: false, message: 'Le graphique n\'est pas un dessin du chemin : il montre la DISTANCE à la maison en fonction du TEMPS. Une partie horizontale signifie que la distance ne change pas : on est arrêté.' },
      { h: nom + ' roule ' + t1 + ' min, s\'arrête ' + pause + ' min, puis ' + (retour ? 'repart et s\'éloigne encore.' : 'rentre à la maison.'), juste: false, message: 'Regarde la dernière partie : ' + (retour ? 'la distance diminue jusqu\'à 0, donc ' + nom + ' revient à la maison.' : 'la distance augmente, donc ' + nom + ' s\'éloigne encore.') },
      { h: nom + ' roule ' + pause + ' min et s\'éloigne de ' + d1 + ' km, s\'arrête ' + t1 + ' min, puis ' + (retour ? 'rentre à la maison.' : 'repart et s\'éloigne encore.'), juste: false, message: 'Lis les durées sur l\'axe horizontal : la première partie dure de 0 à ' + t1 + ' min, l\'arrêt de ' + t1 + ' à ' + t2 + ' min.' }
    ];
    if (t1 === pause) choix.pop();
    return {
      type: 'raconte',
      enonce: '<p>' + nom + ' fait une sortie à vélo. Le graphique donne sa distance à la maison en fonction du temps.</p>' + FICTIF + O.graphiqueHtml(g) + '<p>Quel récit correspond à ce graphique ?</p>',
      indice: 'Lis le graphique partie par partie : la distance augmente-t-elle, reste-t-elle la même ou diminue-t-elle ? Combien de minutes dure chaque partie ?',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'De 0 à ' + t1 + ' min, la distance passe de 0 à ' + d1 + ' km : ' + nom + ' s\'éloigne.' },
        { texte: 'De ' + t1 + ' à ' + t2 + ' min, la distance reste ' + d1 + ' km (partie horizontale) : c\'est l\'arrêt.' },
        { texte: 'De ' + t2 + ' à ' + t3 + ' min, la distance ' + (retour ? 'diminue jusqu\'à 0 : retour à la maison.' : 'augmente jusqu\'à ' + d3 + ' km : ' + nom + ' s\'éloigne encore.') }
      ],
      verification: '',
      rubrique: R.graphique,
      controle: { ops: 3, xs: [0, t1, t2, t3], ys: [0, d1, d3], coefs: [], grad: [5, 1], calc: { genre: 'choix' } }
    };
  }

  /** D4 — budget : combien d'unités au maximum ? */
  function genBudget(alea, d) {
    var c = alea.choix(CONTEXTES_AFFINE);
    var fixe = alea.entier(c.fixe[0], c.fixe[1]), p = alea.entier(c.p[0], c.p[1]);
    var n = alea.entier(5, 15), reste = alea.entier(0, p - 1);
    var budget = fixe + n * p + reste;
    return {
      type: 'probleme',
      enonce: '<p>' + c.phrase(fixe, p) + '</p>' + FICTIF + '<p>On dispose de ' + tm(budget) + '. Quelle est la plus grande valeur possible pour ' + c.x + ' ?</p>',
      indice: 'Enlève d\'abord le montant fixe du budget. Combien de fois ' + tm(p) + ' y a-t-il dans ce qui reste ?',
      reponse: { type: 'nombre', valeur: n },
      pieges: [
        { valeur: Math.floor(budget / p), message: E.oubliFixe + ' Il faut d\'abord l\'enlever du budget.' },
        { valeur: n + 1, message: 'Avec ' + tn(n + 1) + ', le prix serait ' + tm(fixe + (n + 1) * p) + ' : c\'est plus que le budget.' }
      ],
      etapes: [
        { texte: 'On enlève le montant fixe du budget.', calcul: hm(tn(budget) + ' – ' + tn(fixe) + ' = ' + tn(budget - fixe)) },
        { texte: 'On cherche combien de fois ' + tn(p) + ' entre dans ' + tn(budget - fixe) + '.', calcul: hm(tn(budget - fixe) + ' : ' + tn(p) + (reste ? ' = ' + tn(n) + ', reste ' + tn(reste) : ' = ' + tn(n))) },
        { texte: 'La plus grande valeur possible est donc ' + tn(n) + '.' }
      ],
      verification: 'Vérification : ' + hm('f(' + tn(n) + ') = ' + tn(fixe) + ' + ' + tn(n) + ' · ' + tn(p) + ' = ' + tn(fixe + n * p)) + ' ⩽ ' + tn(budget) + ', mais ' + hm('f(' + tn(n + 1) + ') = ' + tn(fixe + (n + 1) * p)) + ' > ' + tn(budget) + '.',
      rubrique: R.expression,
      controle: { ops: 3, xs: [n], ys: [budget], coefs: [p, fixe], calc: { genre: 'budget', fixe: fixe, p: p, budget: budget } }
    };
  }

  /** D4 — vrai ou faux : « le prix est proportionnel à … ». */
  function genVraiFauxSituation(alea, d) {
    var vrai = alea.suivant() < 0.4;
    var c, fixe = 0, p, phrase, x;
    if (vrai) { c = alea.choix(CONTEXTES_PROP); p = alea.entier(c.min, c.max); phrase = c.phrase(p); x = c.x; }
    else { c = alea.choix(CONTEXTES_AFFINE); fixe = alea.entier(c.fixe[0], c.fixe[1]); p = alea.entier(c.p[0], c.p[1]); phrase = c.phrase(fixe, p); x = c.x; }
    var xs = [1, 2, 4], ys = xs.map(function (v) { return fixe + p * v; });
    var opts = O.optionsVraiFaux(alea, {
      vrai: vrai,
      justeVrai: 'pour 0 on paie 0 CHF, et si x double, le prix double : ' + hm('f(2) = ' + tn(ys[1]) + ' = 2 · ' + tn(ys[0])) + '.',
      justeFaux: 'si x double, le prix ne double pas : ' + hm('f(1) = ' + tn(ys[0])) + ' mais ' + hm('f(2) = ' + tn(ys[1])) + ', pas ' + tn(2 * ys[0]) + '.',
      autresVrai: ['plus x est grand, plus le prix est grand.', 'le prix augmente toujours du même montant pour chaque unité en plus.'],
      autresFaux: ['le prix n\'augmente pas toujours du même montant.', 'on ne peut pas acheter 0 unité.'],
      messageFaux: 'Une situation est de proportionnalité si l\'on multiplie toujours x par le même nombre pour obtenir le prix : alors 0 donne 0, et si x double, le prix double. « Plus x est grand, plus le prix est grand » ne suffit pas.'
    });
    return {
      type: 'vraifaux',
      enonce: '<p>' + phrase + '</p>' + FICTIF + '<p>« Le prix est proportionnel à ' + x + '. » Vrai ou faux ?</p>',
      indice: 'Calcule le prix pour 1, puis pour 2. Le prix double-t-il ?',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: 'On calcule quelques prix.', calcul: hm(xs.map(function (v, i) { return 'f(' + v + ') = ' + tn(ys[i]); }).join(' ; ')) },
        { texte: 'On compare : ' + hm('2 · f(1) = ' + tn(2 * ys[0])) + ' et ' + hm('f(2) = ' + tn(ys[1])) + '.' },
        { texte: vrai ? 'Le prix double quand x double : situation de proportionnalité.' : 'Le prix ne double pas (à cause du montant fixe) : ce n\'est pas une situation de proportionnalité.' }
      ],
      verification: vrai ? '' : E.origine,
      rubrique: R.proportionnalite,
      controle: { ops: 3, xs: xs, ys: ys, coefs: [p, fixe], calc: { genre: 'proportionnel', xs: xs, ys: ys, attendu: vrai } }
    };
  }

  /* =====================================================================
   * Objectif A3 : tableaux et graphiques
   * ===================================================================== */

  /** D1 — compléter un tableau à pas constant (y = kx ou y = x + b), une case. */
  function genCompleterTableau(alea, d) {
    var multiplicatif = alea.suivant() < 0.65;
    var k, b, xs, pas;
    for (;;) {
      k = multiplicatif ? alea.entier(2, 9) : 1;
      b = multiplicatif ? 0 : alea.entier(2, 20);
      pas = alea.choix([1, 2]);
      xs = suite(alea.entier(0, 2), pas, 5);
      if (xs[4] > 10 || k * xs[4] + b > 50) continue;
      if (O.estReference(sigs(k, b, xs))) continue;
      break;
    }
    var ys = xs.map(function (x) { return k * x + b; });
    var i = alea.entier(2, 4);
    var aff = ys.slice(); aff[i] = null;
    var pieges = [];
    if (multiplicatif) pieges.push({ valeur: ys[i - 1] + pas, message: E.additif + ' Quand x augmente de ' + pas + ', f(x) augmente de ' + tn(k * pas) + ', pas de ' + pas + '.' });
    else if (xs[1] !== 0 && ys[1] % xs[1] === 0) pieges.push({ valeur: ys[1] / xs[1] * xs[i], message: 'Ici, on n\'obtient pas f(x) en multipliant : regarde la différence entre f(x) et x dans chaque colonne.' });
    return {
      type: 'tableau',
      enonce: '<p>Complète le tableau de valeurs de la fonction f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: aff }]) + '<p>Quel nombre manque sous x = ' + tn(xs[i]) + ' ?</p>',
      indice: 'Regarde une colonne complète : que fait-on à x pour obtenir f(x) ? ' + (multiplicatif ? 'Multiplie-t-on ? ' : 'Ajoute-t-on ? ') + 'Fais la même chose avec ' + tn(xs[i]) + '.',
      reponse: { type: 'nombre', valeur: ys[i] },
      pieges: pieges,
      etapes: [{ texte: multiplicatif ? 'Dans chaque colonne, f(x) = ' + tn(k) + ' · x (par exemple ' + tn(xs[1]) + ' · ' + tn(k) + ' = ' + tn(ys[1]) + ').' : 'Dans chaque colonne, f(x) = x + ' + tn(b) + ' (par exemple ' + tn(xs[1]) + ' + ' + tn(b) + ' = ' + tn(ys[1]) + ').', calcul: hm('f(' + tn(xs[i]) + ') = ' + (multiplicatif ? tn(k) + ' · ' + tn(xs[i]) : tn(xs[i]) + ' + ' + tn(b)) + ' = ' + tn(ys[i])) }],
      verification: 'Contrôle avec la colonne précédente : quand x augmente de ' + pas + ', f(x) augmente de ' + tn(k * pas) + ' ; ' + hm(tn(ys[i - 1]) + ' + ' + tn(k * pas) + ' = ' + tn(ys[i])) + '.',
      rubrique: R.tableau,
      signatures: sigs(k, b, xs),
      controle: { ops: 1, xs: xs, ys: ys, coefs: [k, b], calc: { genre: 'valeur', a: k, b: b, x: xs[i] } }
    };
  }

  /** D2 — trouver l'expression d'un tableau (une opération : · k ou + b). */
  function genOperationTableau(alea, d) {
    var multiplicatif = alea.suivant() < 0.5;
    var k, b, xs;
    for (;;) {
      k = multiplicatif ? alea.entier(2, 9) : 1;
      b = multiplicatif ? 0 : alea.entier(2, 12);
      xs = alea.melanger([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 10]).slice(0, 4).sort(function (u, v) { return u - v; });
      // première colonne « ambiguë » si possible (piège : vérifier une seule colonne)
      var y1 = k * xs[0] + b;
      if (multiplicatif && xs[0] === 0) continue;
      if (O.estReference(sigs(k, b, xs))) continue;
      void y1;
      break;
    }
    var ys = xs.map(function (x) { return k * x + b; });
    var src = O.srcAffine(k, b);
    var pieges = [];
    xs.forEach(function (x, i) {
      if (multiplicatif && x !== 0) pieges.push({ src: 'x+' + (ys[i] - x), message: E.premiereColonne });
      if (!multiplicatif && x !== 0 && ys[i] % x === 0) pieges.push({ src: (ys[i] / x) + '*x', message: E.premiereColonne });
    });
    return {
      type: 'tableau',
      enonce: '<p>Voici le tableau de valeurs d\'une fonction f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>Trouve l\'expression fonctionnelle de f (une seule opération : on multiplie x par un nombre, ou on ajoute un nombre à x).</p>',
      consigne: 'Écris seulement le membre de droite, par exemple 4x ou x + 7.',
      prefixe: 'f(x) =',
      indice: 'Compare x et f(x) dans plusieurs colonnes. L\'opération doit marcher pour TOUTES les colonnes.',
      reponse: { type: 'expr', attendu: src },
      pieges: pieges,
      etapes: [
        { texte: 'On cherche l\'opération dans une colonne, puis on la contrôle dans les autres.', calcul: hm(xs.map(function (x, i) { return multiplicatif ? tn(x) + ' · ' + tn(k) + ' = ' + tn(ys[i]) : O.tnp(x) + ' + ' + tn(b) + ' = ' + tn(ys[i]); }).join(' ; ')) },
        { texte: 'L\'opération marche pour toutes les colonnes.', calcul: hf(src) }
      ],
      verification: 'Contrôle : ' + hm('f(' + tn(xs[3]) + ') = ' + tn(ys[3])) + ', comme dans le tableau.',
      rubrique: R.tableau,
      controle: { ops: 2, xs: xs, ys: ys, coefs: [k, b], calc: { genre: 'expr', a: k, b: b } }
    };
  }

  /** D2 — lire les coordonnées d'un point sur un graphique. */
  function genCoordonnees(alea, d) {
    var k, b, pts;
    do {
      k = alea.entier(1, 3); b = alea.entier(0, 4); pts = [];
      for (var x = -5; x <= 6; x++) { var y = k * x + b; if (y >= -6 && y <= 10 && x !== 0 && y !== 0 && x !== y) pts.push([x, y]); }
    } while (!pts.length);
    var pt = alea.choix(pts);
    var g = { xmin: -6, xmax: 6, ymin: -6, ymax: 10, gx: 1, gy: 1, lx: 2, ly: 2, courbes: [{ src: O.srcAffine(k, b) }], points: [{ x: pt[0], y: pt[1], nom: 'A' }],
      description: 'Droite avec un point A marqué' };
    return {
      type: 'lecture',
      enonce: '<p>Le point A est sur le graphique de la fonction f.</p>' + O.graphiqueHtml(g) + '<p>Quelles sont les coordonnées du point A ?</p>',
      consigne: 'Écris (x ; y), par exemple (2 ; – 1).',
      indice: 'Descends (ou monte) verticalement du point A jusqu\'à l\'axe horizontal : c\'est x. Puis va horizontalement jusqu\'à l\'axe vertical : c\'est y. Un carreau vaut 1.',
      reponse: { type: 'couple', x: pt[0], y: pt[1] },
      etapes: [
        { texte: 'Abscisse : on lit la position du point A sur l\'axe horizontal (axe des x).', calcul: hm('x = ' + tn(pt[0])) },
        { texte: 'Ordonnée : on lit la position du point A sur l\'axe vertical (axe des y).', calcul: hm('y = ' + tn(pt[1])) }
      ],
      verification: 'On écrit d\'abord x, puis y : ' + hm('A' + tc(pt[0], pt[1])) + '. Ici, ' + hm('f(' + tn(pt[0]) + ') = ' + tn(pt[1])) + '.',
      rubrique: R.graphique,
      controle: { ops: 2, xs: [pt[0]], ys: [pt[1]], coefs: [k, b], grad: [1, 1], calc: { genre: 'couple', a: k, b: b, x: pt[0], y: pt[1] } }
    };
  }

  /** D3 — choisir le graphique qui correspond à un tableau (points). */
  function genTableauVersGraphique(alea, d) {
    var k, b, xs, ys;
    do {
      k = alea.entier(1, 3); b = alea.entier(1, 4);
      xs = alea.melanger([-3, -2, -1, 0, 1, 2, 3]).slice(0, 4).sort(function (u, v) { return u - v; });
      ys = xs.map(function (x) { return k * x + b; });
    } while (ys.some(function (y, i) { return y === xs[i]; }) || ys.some(function (y) { return y > 10 || y < -6; }));
    function gr(points) { return { xmin: -6, xmax: 10, ymin: -6, ymax: 10, gx: 1, gy: 1, lx: 2, ly: 2, points: points.map(function (p) { return { x: p[0], y: p[1] }; }), description: 'Quatre points dans un repère' }; }
    var vrais = xs.map(function (x, i) { return [x, ys[i]]; });
    var inverses = xs.map(function (x, i) { return [ys[i], x]; });
    var sansB = xs.map(function (x) { return [x, k * x]; });
    var choix = [
      { h: O.graphiqueHtml(gr(vrais)), juste: true, param: 'vrais' },
      { h: O.graphiqueHtml(gr(inverses)), juste: false, param: 'inverses', message: E.inverse },
      { h: O.graphiqueHtml(gr(sansB)), juste: false, param: 'decales', message: 'Contrôle chaque point avec le tableau : pour x = ' + tn(xs[0]) + ', le tableau donne f(x) = ' + tn(ys[0]) + ', pas ' + tn(k * xs[0]) + '.' }
    ];
    choix = O.melanger(alea, choix).map(function (ch, i) { ch.h = '<span class="nom-choix">Graphique ' + lettreChoix(i) + '</span>' + ch.h; return ch; });
    return {
      type: 'relier',
      enonce: '<p>Voici le tableau de valeurs d\'une fonction f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>Quel graphique représente ce tableau ?</p>',
      indice: 'Chaque colonne du tableau donne un point (x ; f(x)). Place le premier point : x sur l\'axe horizontal, f(x) sur l\'axe vertical.',
      reponse: { type: 'choix' }, choix: choix, choixGraphiques: true,
      etapes: [
        { texte: 'Chaque colonne donne un point (x ; f(x)).', calcul: hm(vrais.map(function (p) { return tc(p[0], p[1]); }).join(' ; ')) },
        { texte: 'Pour chaque point, on avance de x sur l\'axe horizontal, puis on monte (ou descend) de f(x) sur l\'axe vertical.' },
        { texte: 'On cherche le graphique où les quatre points sont à ces places.' }
      ],
      verification: 'Contrôle : le point ' + hm(tc(xs[0], ys[0])) + ' doit être sur le graphique choisi.',
      rubrique: R.graphique,
      controle: { ops: 3, xs: xs, ys: ys, coefs: [k, b], grad: [1, 1], calc: { genre: 'choix-points', a: k, b: b, xs: xs } }
    };
  }

  /** D3 — compléter un tableau avec deux opérations (· k puis + b), deux cases. */
  function genTableauDeuxOperations(alea, d) {
    var k = alea.entier(2, 5), b = alea.entier(1, 9);
    var xs = alea.melanger([-2, -1, 0, 1, 2, 3, 4, 5, 6, 8, 10]).slice(0, 5).sort(function (u, v) { return u - v; });
    var ys = xs.map(function (x) { return k * x + b; });
    var trous = alea.melanger([1, 2, 3, 4]).slice(0, 2).sort();
    var aff = ys.map(function (y, i) { return trous.indexOf(i) >= 0 ? (i === trous[0] ? 'A' : 'B') : y; });
    var src = O.srcAffine(k, b);
    return {
      type: 'tableau',
      enonce: '<p>Pour la fonction ' + hf(src) + ', complète le tableau.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: aff }]),
      consigne: 'Écris les valeurs de A et de B séparées par un point-virgule : A ; B.',
      indice: 'Pour chaque case, remplace x par le nombre du haut : multiplie par ' + tn(k) + ', puis ajoute ' + tn(b) + '.',
      reponse: { type: 'liste', valeurs: trous.map(function (i) { return ys[i]; }), noms: ['A', 'B'] },
      pieges: [
        { liste: trous.map(function (i) { return k * xs[i]; }), message: 'Tu as oublié d\'ajouter ' + tn(b) + ' après la multiplication.' },
        { liste: trous.map(function (i) { return k * (xs[i] + b); }), message: 'Attention aux priorités : on multiplie d\'abord, puis on ajoute ' + tn(b) + '.' }
      ],
      etapes: [
        { texte: 'La fonction multiplie x par ' + tn(k) + ', puis ajoute ' + tn(b) + '.', calcul: hf(src) },
        { texte: 'Case A (x = ' + tn(xs[trous[0]]) + ').', calcul: hm('f(' + tn(xs[trous[0]]) + ') = ' + tn(k) + ' · ' + O.tnp(xs[trous[0]]) + ' + ' + tn(b) + ' = ' + tn(ys[trous[0]])) },
        { texte: 'Case B (x = ' + tn(xs[trous[1]]) + ').', calcul: hm('f(' + tn(xs[trous[1]]) + ') = ' + tn(k) + ' · ' + O.tnp(xs[trous[1]]) + ' + ' + tn(b) + ' = ' + tn(ys[trous[1]])) }
      ],
      verification: 'Contrôle : quand x augmente de 1, f(x) augmente de ' + tn(k) + ' ; les cases trouvées respectent cette régularité.',
      rubrique: R.tableau,
      controle: { ops: 3, xs: xs, ys: ys, coefs: [k, b], calc: { genre: 'liste', a: k, b: b, xs: trous.map(function (i) { return xs[i]; }) } }
    };
  }

  /** D3 — repérer l'erreur d'un élève qui complète un tableau de proportionnalité en ajoutant. */
  function genErreurTableau(alea, d) {
    var k = alea.entier(2, 6), nom = alea.choix(O.PRENOMS);
    var xs = [alea.entier(1, 3)];
    while (xs.length < 4) xs.push(xs[xs.length - 1] + alea.entier(1, 3));
    var ys = xs.map(function (x) { return k * x; });
    var faux = alea.entier(1, 3);
    var ecrit = ys.slice();
    ecrit[faux] = ys[faux - 1] + (xs[faux] - xs[faux - 1]);
    var choix = xs.map(function (x, i) {
      return { h: 'la case sous x = ' + tn(x), juste: i === faux, message: i === faux ? '' : 'Cette case est juste : ' + hm(tn(x) + ' · ' + tn(k) + ' = ' + tn(ys[i])) + '.' };
    }).slice(1);
    choix.push({ h: 'aucune case, tout est juste', juste: false, message: 'Une case n\'est pas obtenue en multipliant par ' + tn(k) + '.' });
    return {
      type: 'erreur',
      enonce: '<p>' + nom + ' complète ce tableau de proportionnalité (on multiplie x par ' + tn(k) + ').</p>' +
        O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ecrit }]) + '<p>Quelle case est fausse ?</p>',
      indice: 'Contrôle chaque colonne : x · ' + tn(k) + ' donne-t-il bien le nombre du bas ?',
      reponse: { type: 'choix' }, choix: choix,
      etapes: [
        { texte: 'On contrôle chaque colonne.', calcul: hm(xs.map(function (x, i) { return tn(x) + ' · ' + tn(k) + ' = ' + tn(ys[i]); }).join(' ; ')) },
        { texte: 'Sous x = ' + tn(xs[faux]) + ', ' + nom + ' a écrit ' + tn(ecrit[faux]) + ' au lieu de ' + tn(ys[faux]) + '.' },
        { texte: E.additif + ' ' + nom + ' a ajouté ' + tn(xs[faux] - xs[faux - 1]) + ' à la case précédente, comme pour x.' }
      ],
      verification: 'Contrôle : ' + hm(tn(ys[faux]) + ' : ' + tn(xs[faux]) + ' = ' + tn(k)) + ', comme dans les autres colonnes.',
      rubrique: R.proportionnalite,
      controle: { ops: 3, xs: xs, ys: ecrit.concat(ys), coefs: [k], calc: { genre: 'choix' } }
    };
  }

  /** D4 — trouver l'expression f(x) = kx + b à partir d'un tableau (x non consécutifs). */
  function genExpressionTableau(alea, d) {
    var k, b, xs;
    do {
      k = alea.entier(2, 6); b = alea.entier(1, 9);
      xs = alea.melanger([-4, -2, -1, 1, 2, 3, 5, 6, 8]).slice(0, 4).sort(function (u, v) { return u - v; });
    } while (k === b);
    var ys = xs.map(function (x) { return k * x + b; });
    var src = O.srcAffine(k, b);
    var dx = xs[1] - xs[0], dy = ys[1] - ys[0];
    return {
      type: 'tableau',
      enonce: '<p>Voici le tableau de valeurs d\'une fonction f de la forme ' + hm('f(x) = … · x + …') + '.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>Trouve son expression fonctionnelle.</p>',
      consigne: 'Écris seulement le membre de droite, par exemple 3x + 5.',
      prefixe: 'f(x) =',
      indice: 'Compare deux colonnes : quand x augmente de ' + tn(dx) + ', de combien f(x) augmente-t-il ? Déduis-en l\'augmentation pour 1, puis trouve f(0).',
      reponse: { type: 'expr', attendu: src },
      pieges: [
        { src: O.srcAffine(k, 0), message: 'Il manque le nombre ajouté : f(0) ne vaut pas 0 ici, donc le graphique ne passe pas par l\'origine (0 ; 0).' },
        { src: O.srcAffine(b, k), message: 'Tu as inversé le nombre qui multiplie x et le nombre ajouté.' }
      ],
      etapes: [
        { texte: 'Quand x augmente de ' + tn(dx) + ', f(x) augmente de ' + tn(dy) + ' ; donc pour 1 de plus, f(x) augmente de ' + tn(k) + '.', calcul: hm(tn(dy) + ' : ' + tn(dx) + ' = ' + tn(k)) },
        { texte: 'On calcule f(0) en partant d\'une colonne connue.', calcul: hm('f(0) = ' + tn(ys[0]) + ' – ' + tn(k) + ' · ' + O.tnp(xs[0]) + ' = ' + tn(b)) },
        { texte: 'On écrit l\'expression.', calcul: hf(src) }
      ],
      verification: 'Contrôle avec une autre colonne : ' + hm('f(' + tn(xs[3]) + ') = ' + tn(k) + ' · ' + O.tnp(xs[3]) + ' + ' + tn(b) + ' = ' + tn(ys[3])) + '.',
      rubrique: R.expression,
      controle: { ops: 3, xs: xs, ys: ys, coefs: [k, b], calc: { genre: 'expr', a: k, b: b } }
    };
  }

  /** D4 — utiliser un graphique (situation) pour calculer une valeur hors du graphique. */
  function genHorsGraphique(alea, d) {
    var t = tirerAffine(alea), c = t.c, fixe = t.fixe, p = t.p;
    var x0 = alea.choix([12, 15, 20, 25, 30]);
    var y0 = fixe + p * x0;
    var g = { xmin: 0, xmax: 8, ymin: 0, ymax: 50, gx: 1, gy: 2, lx: 1, ly: 10, titreX: c.titreX, titreY: c.titreY, courbes: [{ src: O.srcAffine(p, fixe) }], description: 'Droite qui part de (0 ; ' + fixe + ')' };
    return {
      type: 'probleme',
      enonce: '<p>Le graphique donne ' + c.y + ' en fonction de ' + c.x + '.</p>' + FICTIF + O.graphiqueHtml(g) + '<p>Combien paie-t-on pour ' + c.n(x0) + ' ?</p>',
      indice: 'Lis sur le graphique le prix pour 0, puis l\'augmentation pour 1 unité de plus. Écris l\'expression fonctionnelle, puis calcule f(' + tn(x0) + ').',
      reponse: { type: 'nombre', valeur: y0, montant: true },
      suffixe: 'CHF',
      pieges: [
        { valeur: (fixe + 5 * p) * x0 / 5, message: E.origine + ' Le prix n\'est donc pas proportionnel : on ne peut pas multiplier le prix de 5 par ' + tn(x0 / 5) + '.' },
        { valeur: p * x0, message: E.oubliFixe },
        { valeur: (fixe + p) * x0, message: 'Le montant fixe se paie une seule fois, pas pour chaque unité.' }
      ],
      etapes: [
        { texte: 'On lit sur le graphique : pour x = 0, le prix est ' + tm(fixe) + ' ; pour chaque unité en plus, il augmente de ' + tm(p) + '.', calcul: hm('f(0) = ' + tn(fixe) + ' ; f(1) = ' + tn(fixe + p)) },
        { texte: 'L\'expression fonctionnelle est donc :', calcul: hf(O.srcAffine(p, fixe)) },
        { texte: 'On calcule l\'image de ' + tn(x0) + '.', calcul: hm('f(' + tn(x0) + ') = ' + tn(p) + ' · ' + tn(x0) + ' + ' + tn(fixe) + ' = ' + tn(y0)) }
      ],
      verification: 'Contrôle avec un point lisible : ' + hm('f(5) = ' + tn(p) + ' · 5 + ' + tn(fixe) + ' = ' + tn(fixe + 5 * p)) + ', ce qu\'on lit sur le graphique.',
      rubrique: R.graphique,
      controle: { ops: 3, xs: [x0, 8], ys: [y0, 50], coefs: [p, fixe], grad: [1, 2], calc: { genre: 'valeur', a: p, b: fixe, x: x0 } }
    };
  }

  /* =====================================================================
   * Objectif A4 : proportionnalité et problèmes de quantité
   * ===================================================================== */
  var TAUX = { eur: 10, chf: 9 }; // taux fictif : 10 EUR = 9 CHF
  var MENTION_TAUX = 'Taux de change fictif : 10 EUR = 9 CHF.';

  /** D1 — prix unitaire ou prix de plusieurs (un calcul). */
  function genPrixUnitaire(alea, d) {
    var c = alea.choix(CONTEXTES_PROP.filter(function (x) { return x.discret; }));
    var p = alea.entier(c.min, c.max), n;
    do { n = alea.entier(2, 9); } while (n * p > 50);
    var total = n * p;
    var sens = alea.choix(['unitaire', 'total']);
    var enonce, valeur, etape, pieges;
    if (sens === 'unitaire') {
      enonce = '<p>' + c.n(n).charAt(0).toUpperCase() + c.n(n).slice(1) + ' coûtent ' + tm(total) + ' en tout.</p>' + FICTIF + '<p>Combien coûte ' + c.un + ' ?</p>';
      valeur = p;
      etape = { texte: 'On partage le prix total en ' + tn(n) + ' parts égales.', calcul: hm(tn(total) + ' : ' + tn(n) + ' = ' + tn(p)) };
      pieges = [{ valeur: total * n, message: 'Le prix d\'une seule unité est plus petit que le total : il faut diviser, pas multiplier.' }, { valeur: total - n, message: 'Il faut diviser le total par ' + tn(n) + ', pas soustraire.' }];
    } else {
      enonce = '<p>' + c.phrase(p) + '</p>' + FICTIF + '<p>Combien coûtent ' + c.n(n) + ' ?</p>';
      valeur = total;
      etape = { texte: 'On multiplie le prix d\'une unité par ' + tn(n) + '.', calcul: hm(tn(p) + ' · ' + tn(n) + ' = ' + tn(total)) };
      pieges = [{ valeur: p + n, message: E.additif }];
    }
    return {
      type: 'probleme',
      enonce: enonce,
      indice: sens === 'unitaire' ? 'Partage le prix total entre les ' + tn(n) + ' unités.' : 'Une unité coûte ' + tm(p) + '. Combien coûtent ' + tn(n) + ' unités ?',
      reponse: { type: 'nombre', valeur: valeur, montant: true },
      suffixe: 'CHF',
      pieges: pieges,
      etapes: [etape],
      verification: sens === 'unitaire' ? 'Vérification : ' + hm(tn(p) + ' · ' + tn(n) + ' = ' + tn(total)) + '.' : 'Vérification : ' + hm(tn(total) + ' : ' + tn(n) + ' = ' + tn(p)) + '.',
      rubrique: R.proportionnalite,
      controle: { ops: 1, xs: [n], ys: [total], coefs: [p], calc: sens === 'unitaire' ? { genre: 'prix', n1: n, p1: total, n2: 1 } : { genre: 'prix', n1: 1, p1: p, n2: n } }
    };
  }

  /** D1 — conversion EUR -> CHF avec le taux fictif (un calcul). */
  function genConversionSimple(alea, d) {
    var m = alea.choix([2, 3, 4, 5]);
    var eur = TAUX.eur * m, chf = TAUX.chf * m;
    return {
      type: 'probleme',
      enonce: '<p>' + MENTION_TAUX + '</p><p>Combien de CHF obtient-on pour ' + tn(eur) + ' EUR ?</p>',
      indice: tn(eur) + ' EUR, c\'est ' + m + ' fois 10 EUR.',
      reponse: { type: 'nombre', valeur: chf, montant: true },
      suffixe: 'CHF',
      pieges: [{ valeur: eur, message: 'Tu n\'as pas converti : 10 EUR ne valent pas 10 CHF, mais 9 CHF.' }, { valeur: eur - 1, message: E.additif + ' La différence entre EUR et CHF n\'est pas toujours 1.' }],
      etapes: [{ texte: tn(eur) + ' EUR = ' + m + ' · 10 EUR, donc on obtient ' + m + ' · 9 CHF.', calcul: hm(m + ' · 9 = ' + tn(chf)) }],
      verification: 'Vérification : ' + hm(tn(chf) + ' : 9 = ' + m) + ' et ' + hm(tn(eur) + ' : 10 = ' + m) + '.',
      rubrique: R.proportionnalite,
      controle: { ops: 1, xs: [eur], ys: [chf], coefs: [], calc: { genre: 'conversion', eur: eur, versChf: true } }
    };
  }

  /** D2 — règle de trois : n1 unités coûtent P, combien coûtent n2 unités ? */
  function genRegleDeTrois(alea, d) {
    var c = alea.choix(CONTEXTES_PROP);
    var p = alea.entier(c.min, c.max), n1, n2;
    do { n1 = alea.entier(2, 5); n2 = alea.entier(2, 10); } while (n2 === n1 || n2 % n1 === 0 || n2 * p > 60);
    var P1 = n1 * p, P2 = n2 * p;
    return {
      type: 'probleme',
      enonce: '<p>' + c.n(n1).charAt(0).toUpperCase() + c.n(n1).slice(1) + ' ' + (c.discret ? 'coûtent' : 'coûtent') + ' ' + tm(P1) + '.</p>' + FICTIF + '<p>Combien coûtent ' + c.n(n2) + ' ?</p>',
      indice: 'Calcule d\'abord le prix de ' + c.un + ', puis celui de ' + c.n(n2) + '.',
      reponse: { type: 'nombre', valeur: P2, montant: true },
      suffixe: 'CHF',
      pieges: [
        { valeur: P1 + (n2 - n1), message: E.additif + ' Tu as ajouté ' + tn(n2 - n1) + ' au prix, comme pour la quantité.' },
        { valeur: P1 * n2, message: 'Tu as multiplié le prix de ' + c.n(n1) + ' par ' + tn(n2) + ' : il faut d\'abord trouver le prix de ' + c.un + '.' }
      ],
      etapes: [
        { texte: 'Prix de ' + c.un + '.', calcul: hm(tn(P1) + ' : ' + tn(n1) + ' = ' + tn(p)) },
        { texte: 'Prix de ' + c.n(n2) + '.', calcul: hm(tn(p) + ' · ' + tn(n2) + ' = ' + tn(P2)) }
      ],
      verification: 'Vérification : ' + hm(tn(P2) + ' : ' + tn(n2) + ' = ' + tn(p)) + ', le même prix unitaire.',
      rubrique: R.proportionnalite,
      controle: { ops: 2, xs: [n1, n2], ys: [P1, P2], coefs: [p], calc: { genre: 'prix', n1: n1, p1: P1, n2: n2 } }
    };
  }

  /** D2 — un élève fictif raisonne en ajoutant : a-t-il raison ? */
  function genErreurAdditive(alea, d) {
    var nom = alea.choix(O.PRENOMS);
    var g = alea.choix([50, 60, 75, 80, 100]);
    var n1 = alea.choix([2, 4]), n2 = n1 * alea.choix([2, 3]);
    var m1 = g * n1, m2 = g * n2, erreur = m1 + (n2 - n1);
    var produit = alea.choix(['de farine', 'de pâtes', 'de riz']);
    var opts = O.optionsVraiFaux(alea, {
      vrai: false,
      justeVrai: '', justeFaux: 'il y a ' + (n2 / n1) + ' fois plus de personnes, donc il faut ' + (n2 / n1) + ' fois plus ' + produit + ' : ' + hm(tn(m1) + ' · ' + (n2 / n1) + ' = ' + tn(m2)) + ' g.',
      autresFaux: ['il faut ajouter ' + tn(n2 - n1) + ' fois ' + tn(m1) + ' g.'],
      autresVrai: ['il y a ' + tn(n2 - n1) + ' personnes de plus, donc ' + tn(n2 - n1) + ' g de plus.', 'on ajoute toujours la même chose aux deux grandeurs.'],
      messageFaux: E.additif
    });
    return {
      type: 'erreur',
      enonce: '<p>Pour ' + n1 + ' personnes, une recette demande ' + tn(m1) + ' g ' + produit + '. La quantité est proportionnelle au nombre de personnes.</p>' + FICTIF +
        '<p>' + nom + ' affirme : « Pour ' + n2 + ' personnes, il faut ' + tn(erreur) + ' g ' + produit + '. » Vrai ou faux ?</p>',
      indice: 'Par combien multiplie-t-on le nombre de personnes ? Fais la même chose avec la quantité.',
      reponse: { type: 'choix' }, choix: opts,
      etapes: [
        { texte: 'Le nombre de personnes est multiplié par ' + (n2 / n1) + '.', calcul: hm(n1 + ' · ' + (n2 / n1) + ' = ' + n2) },
        { texte: 'Dans une situation de proportionnalité, la quantité est aussi multipliée par ' + (n2 / n1) + '.', calcul: hm(tn(m1) + ' · ' + (n2 / n1) + ' = ' + tn(m2)) }
      ],
      verification: nom + ' a ajouté ' + tn(n2 - n1) + ' g au lieu de multiplier. ' + E.additif,
      rubrique: R.proportionnalite,
      controle: { ops: 2, xs: [n1, n2], ys: [m1, m2], coefs: [g], calc: { genre: 'choix' } }
    };
  }

  /** D3 — lire une grandeur en CHF ou en EUR sur un graphique de conversion (taux fictif). */
  function genGraphiqueConversion(alea, d) {
    var g = { xmin: 0, xmax: 50, ymin: 0, ymax: 50, gx: 5, gy: 5, lx: 10, ly: 10, titreX: 'EUR', titreY: 'CHF', courbes: [{ src: '0.9*x' }], description: 'Droite de conversion des euros en francs' };
    var sens = alea.choix(['chf', 'eur']);
    var enonce, valeur, pieges, etapes, verif, suffixe, montant;
    if (sens === 'chf') {
      var eur = alea.choix([60, 70, 80, 90, 120, 150]);
      valeur = new F(eur * 9, 10);
      var lu = alea.choix([10, 20, 30].filter(function (x) { return eur % x === 0; }));
      enonce = '<p>Combien de CHF obtient-on pour ' + tn(eur) + ' EUR ?</p>';
      pieges = [{ valeur: new F(eur * 10, 9), message: E.axes + ' Ici, les EUR sont sur l\'axe horizontal et les CHF sur l\'axe vertical.' }, { valeur: eur, message: 'Tu n\'as pas converti : 10 EUR ne valent pas 10 CHF.' }];
      etapes = [
        { texte: 'Le graphique s\'arrête à 50 EUR. On lit une valeur facile : ' + tn(lu) + ' EUR donnent ' + tn(lu * 9 / 10) + ' CHF.', calcul: hm(tn(lu) + ' EUR → ' + tn(lu * 9 / 10) + ' CHF') },
        { texte: tn(eur) + ' EUR, c\'est ' + (eur / lu) + ' fois ' + tn(lu) + ' EUR (situation de proportionnalité).', calcul: hm(tn(eur) + ' : ' + tn(lu) + ' = ' + (eur / lu)) },
        { texte: 'On multiplie aussi les CHF par ' + (eur / lu) + '.', calcul: hm(tn(lu * 9 / 10) + ' · ' + (eur / lu) + ' = ' + tn(valeur)) }
      ];
      verif = 'Vérification avec le taux : ' + hm(tn(eur) + ' : 10 · 9 = ' + tn(valeur)) + '.';
      suffixe = 'CHF'; montant = true;
    } else {
      var chf = alea.choix([18, 27, 36, 45]);
      valeur = new F(chf * 10, 9);
      enonce = '<p>Combien d\'EUR faut-il pour obtenir ' + tn(chf) + ' CHF ?</p>';
      pieges = [{ valeur: new F(chf * 9, 10), message: E.axes + ' Ici, on connaît les CHF (axe vertical) : on part de l\'axe vertical et on lit les EUR sur l\'axe horizontal.' }, { valeur: chf, message: 'Tu n\'as pas converti : 9 CHF correspondent à 10 EUR.' }];
      etapes = [
        { texte: 'On part de ' + tn(chf) + ' sur l\'axe vertical (CHF).' },
        { texte: 'On va horizontalement jusqu\'à la droite.' },
        { texte: 'On descend sur l\'axe horizontal et on lit les EUR.', calcul: hm(tn(chf) + ' CHF → ' + tn(valeur) + ' EUR') }
      ];
      verif = 'Vérification : ' + hm(tn(valeur) + ' : 10 · 9 = ' + tn(chf)) + '.';
      suffixe = 'EUR'; montant = false;
    }
    return {
      type: 'lecture',
      enonce: '<p>Le graphique permet de convertir des euros (EUR) en francs (CHF). ' + MENTION_TAUX + '</p>' + O.graphiqueHtml(g) + enonce,
      indice: sens === 'chf' ? 'Lis combien de CHF on obtient pour une valeur facile (10, 20 ou 30 EUR), puis utilise la proportionnalité.' : 'Pars de l\'axe des CHF (vertical), va jusqu\'à la droite, puis descends lire les EUR.',
      reponse: { type: 'nombre', valeur: valeur, montant: montant, unite: montant ? '' : 'EUR' },
      suffixe: suffixe,
      pieges: pieges,
      etapes: etapes,
      verification: verif,
      rubrique: R.proportionnalite,
      controle: { ops: 3, xs: [0, 50], ys: [0, 50], coefs: ['0.9'], grad: [5, 5], calc: sens === 'chf' ? { genre: 'conversion', eur: Number(eur), versChf: true } : { genre: 'conversion', chf: chf, versChf: false } }
    };
  }

  /** D3 — prix d'une quantité décimale (prix au kilo décimal). */
  function genPrixDecimal(alea, d) {
    var paires = [['2.4', '2.5'], ['1.2', '1.5'], ['3.6', '0.5'], ['4.8', '1.5'], ['2.5', '1.2'], ['3.5', '2'], ['1.8', '2.5'], ['4.4', '0.5'], ['2.8', '1.5'], ['3.2', '2.5']];
    var pr = alea.choix(paires);
    var p = val(pr[0]), q = val(pr[1]);
    var total = p.fois(q);
    var produit = alea.choix(['des tomates', 'des poires', 'du raisin', 'des oignons']);
    var entier = q.estEntier() ? null : val(Math.floor(q.valeur()));
    var demi = q.moins(entier || 0);
    return {
      type: 'probleme',
      enonce: '<p>Au marché, ' + produit + ' coûtent ' + tm(p) + ' le kilo.</p>' + FICTIF + '<p>Combien coûtent ' + tn(q) + ' kg ?</p>',
      indice: 'Décompose ' + tn(q) + ' kg : par exemple ' + (entier && !entier.estZero() ? tn(entier) + ' kg + ' : '') + tn(demi) + ' kg. Le prix de 0,5 kg est la moitié du prix de 1 kg.',
      reponse: { type: 'nombre', valeur: total, montant: true },
      suffixe: 'CHF',
      pieges: [{ valeur: p.plus(q), message: E.additif }, { valeur: p.fois(Math.round(q.valeur())), message: 'Tu as arrondi la masse : calcule avec ' + tn(q) + ' kg exactement.' }],
      etapes: entier && !entier.estZero() ? [
        { texte: 'On décompose la masse.', calcul: hm(tn(q) + ' kg = ' + tn(entier) + ' kg + ' + tn(demi) + ' kg') },
        { texte: 'Prix de chaque partie.', calcul: hm(tn(p) + ' · ' + tn(entier) + ' = ' + tn(p.fois(entier)) + ' ; ' + tn(p) + ' · ' + tn(demi) + ' = ' + tn(p.fois(demi))) },
        { texte: 'On additionne.', calcul: hm(tn(p.fois(entier)) + ' + ' + tn(p.fois(demi)) + ' = ' + tn(total)) }
      ] : [
        { texte: 'On multiplie le prix d\'un kilo par la masse.', calcul: hm(tn(p) + ' · ' + tn(q)) },
        { texte: q.estEntier() ? 'On calcule.' : tn(q) + ' kg, c\'est la moitié d\'un kilo : on divise par 2.', calcul: hm(tn(p) + ' · ' + tn(q) + ' = ' + tn(total)) }
      ],
      verification: 'Vérification : ' + hm(tn(total) + ' : ' + tn(q) + ' = ' + tn(p)) + ' CHF par kilo.',
      rubrique: R.proportionnalite,
      controle: { ops: 3, xs: [q.toString()], ys: [total.toString()], coefs: [p.toString()], calc: { genre: 'prix', n1: 1, p1: p.toString(), n2: q.toString() } }
    };
  }

  /** D4 — vitesse : distance parcourue en un temps donné (heures décimales ou h et min). */
  function genVitesseDistance(alea, d) {
    var v, t, choix = 0;
    var durees = [0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2.25, 2.5, 2.75, 3.5];
    do {
      var ctx = alea.choix(['velo', 'velo', 'bus']);
      v = ctx === 'velo' ? alea.choix([12, 14, 15, 16, 18, 20, 22, 24]) : alea.choix([40, 48, 60, 72, 80]);
      t = alea.choix(durees);
      choix++;
    } while (!val(v).fois(val(String(t))).fois(10).estEntier());
    var tF = val(String(t));
    var dist = val(v).fois(tF);
    var h = Math.floor(t), min = Math.round((t - h) * 60);
    var ecrit = alea.suivant() < 0.5 ? (h ? h + ' h ' : '') + min + ' min' : tn(tF) + ' h';
    var moyen = v >= 40 ? 'un bus régional' : alea.choix(['Aline, à vélo,', 'Dario, à vélo,', 'Un cycliste']);
    var faux115 = val(v).fois(val(h + '.' + min));
    return {
      type: 'probleme',
      enonce: '<p>' + moyen.charAt(0).toUpperCase() + moyen.slice(1) + ' roule à la vitesse moyenne de ' + v + ' km/h pendant ' + ecrit + '.</p>' + FICTIF + '<p>Quelle distance parcourt-' + (moyen.indexOf('bus') >= 0 ? 'il' : 'on') + ' ?</p>',
      indice: 'Écris d\'abord la durée en heures décimales (15 min = 0,25 h ; 30 min = 0,5 h ; 45 min = 0,75 h). En 1 h, on parcourt ' + v + ' km.',
      reponse: { type: 'nombre', valeur: dist, unite: 'km' },
      suffixe: 'km',
      pieges: [
        { valeur: faux115, message: h + ' h ' + min + ' min ne s\'écrit pas ' + h + ',' + min + ' h : ' + min + ' min = ' + tn(val(min).divise(60)) + ' h.' },
        { valeur: val(v).plus(tF), message: 'Distance = vitesse · durée : il faut multiplier, pas additionner.' },
        { valeur: val(v).divise(tF), message: 'Distance = vitesse · durée : il faut multiplier, pas diviser.' }
      ],
      etapes: [
        { texte: 'On écrit la durée en heures décimales.', calcul: hm(ecrit + ' = ' + tn(tF) + ' h') },
        { texte: 'En 1 h, on parcourt ' + v + ' km ; la distance est proportionnelle à la durée.', calcul: hm(v + ' · ' + tn(tF) + ' = ' + tn(dist)) }
      ],
      verification: 'Vérification : ' + hm(tn(dist) + ' : ' + tn(tF) + ' = ' + v) + ' km/h.',
      rubrique: R.vitesse,
      signatures: ['vitesse:v=' + v],
      controle: { ops: 2, xs: [String(t)], ys: [dist.toString()], coefs: [v], calc: { genre: 'vitesse', v: v, t: String(t) } }
    };
  }

  /** D4 — vitesse : durée d'un trajet en minutes. */
  function genVitesseDuree(alea, d) {
    var v = alea.choix([12, 15, 18, 20, 24, 30]);
    var minutes = alea.choix([10, 15, 20, 30, 40, 45, 50, 75, 90].filter(function (m) { return (v * m) % 6 === 0; }));
    var dist = val(v * minutes).divise(60);
    var nom = alea.choix(O.PRENOMS);
    var heures = val(minutes).divise(60);
    return {
      type: 'probleme',
      enonce: '<p>' + nom + ' va au collège à vélo. Le trajet mesure ' + tn(dist) + ' km et ' + nom + ' roule à la vitesse moyenne de ' + v + ' km/h.</p>' + FICTIF + '<p>Combien de minutes dure le trajet ?</p>',
      indice: 'En 60 min, ' + nom + ' parcourt ' + v + ' km. Combien de km en 1 min, ou combien de minutes pour 1 km ?',
      reponse: { type: 'nombre', valeur: minutes, unite: 'min' },
      suffixe: 'min',
      pieges: [
        { valeur: heures, message: 'Ta réponse est en heures : la question demande des minutes (1 h = 60 min).' },
        { valeur: heures.fois(100), message: tn(heures) + ' h ne font pas ' + tn(heures.fois(100)) + ' min : 1 h = 60 min, donc ' + tn(heures) + ' h = ' + tn(heures.fois(60)) + ' min.' }
      ],
      etapes: [
        { texte: 'Durée en heures : distance divisée par vitesse.', calcul: hm(tn(dist) + ' : ' + v + ' = ' + tn(heures) + ' h') },
        { texte: 'On convertit en minutes (1 h = 60 min).', calcul: hm(tn(heures) + ' · 60 = ' + minutes + ' min') }
      ],
      verification: 'Vérification : en ' + minutes + ' min à ' + v + ' km/h, on parcourt ' + hm(v + ' · ' + tn(heures) + ' = ' + tn(dist)) + ' km.',
      rubrique: R.vitesse,
      signatures: ['vitesse:v=' + v],
      controle: { ops: 2, xs: [dist.toString()], ys: [minutes], coefs: [v], calc: { genre: 'duree', d: dist.toString(), v: v } }
    };
  }

  /** D4 — comparer un prix en EUR et un prix en CHF (taux fictif). */
  function genComparerPrix(alea, d) {
    var objet = alea.choix([{ nom: 'un casque de vélo', eur: [50, 60, 70, 80] }, { nom: 'une paire de chaussures de sport', eur: [70, 80, 90, 100] }, { nom: 'un sac à dos', eur: [40, 50, 60] }]);
    var eur = alea.choix(objet.eur), enChf = eur * 9 / 10;
    var ecart = alea.choix([-6, -4, -3, 2, 3, 5]);
    var chf = enChf + ecart;
    var diff = Math.abs(ecart);
    return {
      type: 'probleme',
      enonce: '<p>On trouve ' + objet.nom + ' à ' + tn(eur) + ' EUR dans un magasin en France voisine, et à ' + tm(chf) + ' à La Chaux-de-Fonds. ' + MENTION_TAUX + '</p>' + FICTIF + '<p>Quelle est la différence de prix, en CHF, entre les deux magasins ?</p>',
      indice: 'Convertis d\'abord le prix en EUR en CHF, puis compare.',
      reponse: { type: 'nombre', valeur: diff, montant: true },
      suffixe: 'CHF',
      pieges: [{ valeur: Math.abs(chf - eur), message: 'Tu as comparé des EUR et des CHF : convertis d\'abord ' + tn(eur) + ' EUR en CHF.' }, { valeur: new F(eur * 10, 9).moins(chf).abs(), message: 'La conversion est à l\'envers : 10 EUR = 9 CHF, donc on multiplie les EUR par 9 et on divise par 10.' }],
      etapes: [
        { texte: 'On convertit le prix en EUR.', calcul: hm(tn(eur) + ' : 10 · 9 = ' + tn(enChf) + ' CHF') },
        { texte: 'On compare les deux prix en CHF.', calcul: hm(tn(enChf) + ' CHF et ' + tn(chf) + ' CHF') },
        { texte: 'On calcule la différence.', calcul: hm(tn(Math.max(chf, enChf)) + ' – ' + tn(Math.min(chf, enChf)) + ' = ' + tn(diff)) }
      ],
      verification: 'Le moins cher est ' + (chf < enChf ? 'le magasin de La Chaux-de-Fonds' : 'le magasin en France') + ', de ' + tm(diff) + '.',
      rubrique: R.proportionnalite,
      controle: { ops: 3, xs: [eur], ys: [chf], coefs: ['0.9'], calc: { genre: 'difference', eur: eur, chf: chf } }
    };
  }

  /* =====================================================================
   * Catalogue du module A
   * ===================================================================== */
  var objectifs = [
    { id: 'A1', module: 'A', annee: 9, niveaux: [1, 2], statut: 'evalue', theme: 'FA 9.1', titre: 'Vocabulaire : variable, image, expression fonctionnelle, tableau, graphique',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genImageTableau },
        { type: 'choix', dMin: 1, dMax: 1, gen: genVocabulaire },
        { type: 'directe', dMin: 2, dMax: 2, gen: genImageExpression },
        { type: 'vraifaux', dMin: 2, dMax: 2, gen: genVraiFauxProportion },
        { type: 'choix', dMin: 3, dMax: 3, gen: genSensImage },
        { type: 'directe', dMin: 3, dMax: 3, gen: genAntecedent },
        { type: 'erreur', dMin: 4, dMax: 4, gen: genErreurVocabulaire },
        { type: 'vraifaux', dMin: 4, dMax: 4, gen: genPointGraphique }
      ] },
    { id: 'A2', module: 'A', annee: 9, niveaux: [1, 2], statut: 'evalue', theme: 'FA 9.1', titre: 'Situations : les modéliser par un tableau, un graphique ou une expression',
      modeles: [
        { type: 'choix', dMin: 1, dMax: 1, gen: genExpressionSituationProp },
        { type: 'lecture', dMin: 1, dMax: 1, gen: genLireGraphiqueSituation },
        { type: 'relier', dMin: 2, dMax: 2, gen: genRelierGraphique },
        { type: 'relier', dMin: 2, dMax: 2, gen: genRelierTableau },
        { type: 'directe', dMin: 3, dMax: 3, gen: genExpressionSituation },
        { type: 'raconte', dMin: 3, dMax: 3, gen: genRaconte },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genBudget },
        { type: 'vraifaux', dMin: 4, dMax: 4, gen: genVraiFauxSituation }
      ] },
    { id: 'A3', module: 'A', annee: 9, niveaux: [1, 2], statut: 'evalue', theme: 'FA 9.1', titre: 'Tableaux de valeurs : opérations, compléter, passer au graphique et inversement',
      modeles: [
        { type: 'tableau', dMin: 1, dMax: 1, gen: genCompleterTableau },
        { type: 'tableau', dMin: 2, dMax: 2, gen: genOperationTableau },
        { type: 'lecture', dMin: 2, dMax: 2, gen: genCoordonnees },
        { type: 'relier', dMin: 3, dMax: 3, gen: genTableauVersGraphique },
        { type: 'tableau', dMin: 3, dMax: 3, gen: genTableauDeuxOperations },
        { type: 'erreur', dMin: 3, dMax: 3, gen: genErreurTableau },
        { type: 'tableau', dMin: 4, dMax: 4, gen: genExpressionTableau },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genHorsGraphique }
      ] },
    { id: 'A4', module: 'A', annee: 9, niveaux: [1, 2], statut: 'evalue', theme: 'FA 9.1', titre: 'Proportionnalité et problèmes de quantité (prix, CHF et EUR)',
      modeles: [
        { type: 'probleme', dMin: 1, dMax: 1, gen: genPrixUnitaire },
        { type: 'probleme', dMin: 1, dMax: 1, gen: genConversionSimple },
        { type: 'probleme', dMin: 2, dMax: 2, gen: genRegleDeTrois },
        { type: 'erreur', dMin: 2, dMax: 2, gen: genErreurAdditive },
        { type: 'lecture', dMin: 3, dMax: 3, gen: genGraphiqueConversion },
        { type: 'probleme', dMin: 3, dMax: 3, gen: genPrixDecimal },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genVitesseDistance },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genVitesseDuree },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genComparerPrix }
      ] }
  ];

  return { objectifs: objectifs, TAUX: TAUX };
});
