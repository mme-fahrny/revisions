/*
 * fonctions/js/outils.js — outils communs de l'appli « Fonctions »
 * -----------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : objet global « FonctionsOutils ». Node : require.
 * Dépend de assets/maths.js.
 *
 * Contenu :
 *   - rubriques de l'aide-mémoire (renvois par le NOM de la rubrique) ;
 *   - erreurs typiques nommées dans les rétroactions ;
 *   - écriture des nombres, montants, expressions fonctionnelles (texte et HTML) ;
 *   - tableaux de valeurs (HTML) et graphiques (SVG en texte, sans bibliothèque) ;
 *   - vérification des réponses : nombre, montant, expression f(x) = …, liste de
 *     nombres, couple (x ; y), choix ; rétroactions ;
 *   - empreintes des exemples de référence de l'enseignante (jamais en clair).
 *
 * Une question :
 *   { enonce (HTML), consigne (HTML), indice (HTML), visuel?, mode: 'champ' | 'choix',
 *     reponse: { type: 'nombre' | 'expr' | 'liste' | 'couple' | 'choix', … },
 *     choix: [{ h, juste, message }], etapes: [{ titre, texte, calcul }],
 *     verification (HTML), rubrique, pieges: [{ valeur | src | liste, message }],
 *     controle: { … } (paramètres, pour les tests indépendants),
 *     verifier(texte) -> { juste, statut: 'juste' | 'faux' | 'illisible', message },
 *     exemples() -> { justes: [textes], faux: [textes] } }
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('../../assets/maths.js'));
  else racine.FonctionsOutils = fabrique(racine.Maths);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Maths) {
  'use strict';

  var F = Maths.Fraction;
  var NBSP = ' ';
  var MOINS = Maths.MOINS;

  /* =====================================================================
   * Rubriques de l'aide-mémoire. À VÉRIFIER par l'enseignante : intitulés
   * exacts de l'édition 2024. Tout est regroupé ici pour les corriger d'un coup.
   * ===================================================================== */
  /* Noms des rubriques de l'aide-mémoire (MER, édition utilisée en 9e et 10e) : seuls les noms
   * sont repris, jamais le contenu. Pas de rubrique « fonction exponentielle » : renvoi à
   * « Représentation graphique » (décision de l'enseignante). */
  var RUBRIQUES = {
    fonction: 'Fonctions – Généralités',
    tableau: 'Définir une fonction',
    expression: 'Définir une fonction',
    graphique: 'Représentation graphique',
    proportionnalite: 'Proportionnalité',
    problemeProportionnalite: 'Résoudre un problème de proportionnalité',
    vitesse: 'Vitesse moyenne',
    masseVolumique: 'Masse volumique',
    debit: 'Débit',
    affine: 'Fonction affine',
    lineaire: 'Cas particuliers de la fonction affine',
    constante: 'Cas particuliers de la fonction affine',
    pente: 'Pente de la droite représentant une fonction affine',
    penteGraphique: 'Déterminer la pente d\'une droite à partir de sa représentation graphique',
    expressionGraphique: 'Déterminer l\'expression fonctionnelle d\'une fonction affine à partir de sa représentation graphique',
    construireAffine: 'Construire la représentation graphique d\'une fonction affine',
    penteTerrain: 'Pente',
    equations: 'Résoudre une équation du premier degré à une inconnue',
    pourcentage: 'Pourcentage',
    echelle: 'Échelle',
    agrandissement: 'Figures semblables',
    diagrammes: 'Diagrammes',
    quadratique: 'Fonction quadratique',
    cubique: 'Fonction cubique',
    racineCarree: 'Fonction racine carrée',
    homographique: 'Fonction homographique',
    exponentielle: 'Représentation graphique'
  };

  /* =====================================================================
   * Erreurs typiques (nommées dans les rétroactions)
   * ===================================================================== */
  var ERREURS = {
    axes: 'Tu as lu l\'axe des x au lieu de l\'axe des y : l\'image f(x) se lit sur l\'axe vertical.',
    inverse: 'Tu as inversé les coordonnées : un point s\'écrit (x ; y), d\'abord la valeur sur l\'axe horizontal, puis celle sur l\'axe vertical.',
    variableImage: 'Tu as confondu la variable x et son image f(x) : dans f(3) = 10, 3 est la valeur de x et 10 est son image.',
    origine: 'Avec un montant fixe (forfait, prise en charge), on paie déjà quelque chose pour x = 0 : le graphique ne passe pas par l\'origine (0 ; 0).',
    fixeUnitaire: 'Tu as confondu le montant fixe et le prix par unité : le montant fixe se paie une seule fois, le prix par unité est multiplié par x.',
    oubliFixe: 'Tu as oublié le montant fixe : il s\'ajoute au prix des unités.',
    additif: 'Tu as ajouté au lieu de multiplier : dans une situation de proportionnalité, si x est multiplié par 2, y est aussi multiplié par 2.',
    premiereColonne: 'Ton expression convient pour la première colonne seulement : vérifie-la avec TOUTES les colonnes du tableau.',
    ordonneePente: 'Tu as confondu l\'ordonnée à l\'origine et la pente : dans f(x) = ax + b, b est l\'ordonnée à l\'origine (le point (0 ; b)) et a est la pente.',
    penteB: 'La pente n\'est pas l\'ordonnée à l\'origine : la pente dit de combien f(x) change quand x augmente de 1.',
    penteSigne: 'Attention au signe de la pente : si la droite descend (de gauche à droite), la pente est négative.',
    penteOrdre: 'Garde le même ordre des points en haut et en bas : p = (y₂ – y₁) : (x₂ – x₁).',
    penteInverse: 'Tu as calculé (x₂ – x₁) : (y₂ – y₁) : la pente est la différence des ordonnées DIVISÉE par la différence des abscisses.',
    affineOrigine: 'Une droite affine avec b ≠ 0 ne passe pas par l\'origine : f(0) = b.',
    intersection: 'Le point d\'intersection doit vérifier LES DEUX expressions : contrôle aussi avec l\'autre fonction.'
  };

  var PRENOMS = ['Léa', 'Noah', 'Elif', 'Luca', 'Amélie', 'Yanis', 'Sara', 'Mattia', 'Inès',
    'Gabriel', 'Aline', 'Kevin', 'Zoé', 'Nathan', 'Maëlle', 'Dario', 'Chloé', 'Arben',
    'Lou', 'Timéo', 'Jade', 'Ilyas', 'Emma', 'Loris'];

  var MENTION_FICTIVE = '<p class="donnees-fictives">Données fictives.</p>';

  /* =====================================================================
   * Nombres et écritures
   * ===================================================================== */
  function val(x) { return x instanceof F ? x : F.depuis(typeof x === 'number' ? String(x) : x); }
  function echapper(t) { return Maths.html.echapper(t); }
  /** Nombre -> texte (décimal fini, sinon fraction). */
  function tn(x) { var f = val(x); return f.estDecimale() ? Maths.formaterNombre(f) : Maths.formaterFraction(f); }
  /** Nombre -> HTML. */
  function hn(x) { var f = val(x); return f.estDecimale() ? Maths.html.nombre(f) : Maths.html.fraction(f); }
  /** Nombre entre parenthèses s'il est négatif (3 · (– 2)). */
  function tnp(x) { var f = val(x); return f.signe() < 0 ? '(' + tn(f) + ')' : tn(f); }
  /** Montant : CHF 12.50. */
  function tm(x) { return Maths.formaterMontant(val(x), { style: 'CHF' }); }
  /** Coordonnées : (2 ; – 3). */
  function tc(x, y) { return Maths.formaterCoordonnees(val(x), val(y)); }
  /** Source d'un nombre pour Maths.analyser. */
  function sn(x) { return '(' + val(x).toString() + ')'; }
  /** Expression a·x + b (source lisible par Maths.analyser). */
  /** Nombre positif écrit pour Maths.analyser : décimal (0.5) si l'écriture est finie, sinon (2/3). */
  function snPositif(x) {
    var f = val(x);
    return f.estDecimale() ? f.ecritureDecimale().replace(/[^0-9.,]/g, '').replace(',', '.') : '(' + f.toString() + ')';
  }
  /**
   * Expression a·x + b (source lisible par Maths.analyser), écrite comme dans l'aide-mémoire :
   * 2x – 4, – 3x + 1, 0,5x, x – 2 (jamais « x(– 2) » ni « (– 3)x »).
   */
  function srcAffine(a, b) {
    a = val(a); b = val(b);
    var s = '';
    if (!a.estZero()) {
      var abs = a.abs();
      s = (a.signe() < 0 ? '-' : '') + (abs.egal(1) ? 'x' : snPositif(abs) + 'x');
    }
    if (!b.estZero() || s === '') s += (b.signe() < 0 ? '-' : s ? '+' : '') + snPositif(b.abs());
    return s;
  }
  function tx(src) { return Maths.versTexte(src); }
  function hm(texte) { return '<span class="maths">' + echapper(texte) + '</span>'; }
  /** « f(x) = 3x + 4 » en HTML. */
  function hf(src, nom) { return hm((nom || 'f') + '(x) = ' + tx(src)); }
  function pluriel(n, mot, motPluriel) { return Math.abs(n) >= 2 ? (motPluriel || mot + 's') : mot; }

  /* =====================================================================
   * Tableau de valeurs (HTML)
   * lignes : [{ entete: 'x', valeurs: [nombre | null | texte] }, …]
   * Les cases null s'affichent « … » ; un texte (« A ») est affiché tel quel.
   * ===================================================================== */
  function tableauHtml(lignes, legende) {
    var h = '<div class="table-defilante"><table class="tableau-valeurs">';
    if (legende) h += '<caption>' + legende + '</caption>';
    lignes.forEach(function (l) {
      h += '<tr><th scope="row">' + l.entete + '</th>';
      l.valeurs.forEach(function (v) {
        if (v === null || v === undefined) h += '<td class="case-vide">…</td>';
        else if (typeof v === 'string' && !/^[-–\d]/.test(v)) h += '<td class="case-vide">' + echapper(v) + '</td>';
        else h += '<td>' + hn(v) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</table></div>';
  }

  /* =====================================================================
   * Graphique en SVG (texte). Utilisé dans les énoncés, les choix et l'aperçu.
   * def : { xmin, xmax, ymin, ymax, gx, gy (pas du quadrillage), lx, ly (pas des
   *         nombres écrits), titreX, titreY, courbes: [{ src | f (fonction JS), classe, nom }],
   *         segments: [[[x, y], [x, y], …]] (lignes brisées), points: [{ x, y, nom }],
   *         description (texte pour les lecteurs d'écran) }
   * ===================================================================== */
  var compteurSvg = 0;
  function nombreAxe(v) { return tn(v); }
  function svgGraphique(def) {
    compteurSvg++;
    var xmin = def.xmin, xmax = def.xmax, ymin = def.ymin, ymax = def.ymax;
    var gx = def.gx || 1, gy = def.gy || 1, lx = def.lx || gx, ly = def.ly || gy;
    var L = 300, Hh = def.hauteur || 220;
    var ux = L / (xmax - xmin), uy = Hh / (ymax - ymin);
    // axes toujours nommés (x et y par défaut), comme demandé en classe
    def = Object.assign({}, def, { titreX: def.titreX || 'x', titreY: def.titreY || 'y' });
    var mg = 42, mh = 20, md = 16, mb = 40;
    function X(x) { return +(mg + (x - xmin) * ux).toFixed(2); }
    function Y(y) { return +(mh + (ymax - y) * uy).toFixed(2); }
    var W = mg + L + md, H = mh + Hh + mb;
    var s = [];
    s.push('<svg class="svg-fonction" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + echapper(def.description || 'Graphique') + '">');
    var clip = 'clip-f-' + compteurSvg;
    s.push('<defs><clipPath id="' + clip + '"><rect x="' + X(xmin) + '" y="' + Y(ymax) + '" width="' + L + '" height="' + Hh + '"/></clipPath></defs>');
    s.push('<g class="grille">');
    var k;
    for (k = Math.ceil(xmin / gx) * gx; k <= xmax + 1e-9; k += gx) s.push('<line x1="' + X(k) + '" y1="' + Y(ymin) + '" x2="' + X(k) + '" y2="' + Y(ymax) + '"/>');
    for (k = Math.ceil(ymin / gy) * gy; k <= ymax + 1e-9; k += gy) s.push('<line x1="' + X(xmin) + '" y1="' + Y(k) + '" x2="' + X(xmax) + '" y2="' + Y(k) + '"/>');
    s.push('</g>');
    var ax = ymin <= 0 && ymax >= 0 ? 0 : ymin, ay = xmin <= 0 && xmax >= 0 ? 0 : xmin;
    s.push('<g class="axes"><line x1="' + X(xmin) + '" y1="' + Y(ax) + '" x2="' + (X(xmax) + 8) + '" y2="' + Y(ax) + '"/>');
    s.push('<line x1="' + X(ay) + '" y1="' + Y(ymin) + '" x2="' + X(ay) + '" y2="' + (Y(ymax) - 8) + '"/>');
    s.push('<path d="M' + (X(xmax) + 8) + ' ' + Y(ax) + ' l-7 -4 v8 z"/><path d="M' + X(ay) + ' ' + (Y(ymax) - 8) + ' l-4 7 h8 z"/></g>');
    s.push('<g class="nombres-axes">');
    for (k = Math.ceil(xmin / lx) * lx; k <= xmax + 1e-9; k += lx) {
      if (Math.abs(k) < 1e-9 && ay === 0 && ax === 0) { s.push('<text x="' + (X(0) - 5) + '" y="' + (Y(0) + 14) + '" text-anchor="end">0</text>'); continue; }
      s.push('<text x="' + X(k) + '" y="' + (Y(ax) + 15) + '" text-anchor="middle">' + echapper(nombreAxe(+k.toFixed(6))) + '</text>');
    }
    for (k = Math.ceil(ymin / ly) * ly; k <= ymax + 1e-9; k += ly) {
      if (Math.abs(k) < 1e-9 && ax === 0) continue;
      s.push('<text x="' + (X(ay) - 5) + '" y="' + (Y(k) + 4) + '" text-anchor="end">' + echapper(nombreAxe(+k.toFixed(6))) + '</text>');
    }
    s.push('</g>');
    // nom de l'axe horizontal : au bout de la flèche si l'axe est dans le repère, sinon sous les nombres
    if (ax !== ymin) s.push('<text class="titre-axe" x="' + (X(xmax) + 6) + '" y="' + (Y(ax) - 9) + '" text-anchor="end">' + echapper(def.titreX) + '</text>');
    else s.push('<text class="titre-axe" x="' + (X(xmax) + 6) + '" y="' + (H - 6) + '" text-anchor="end">' + echapper(def.titreX) + '</text>');
    if (def.titreY) s.push('<text class="titre-axe" x="' + (X(ay) + 8) + '" y="' + (mh - 6) + '" text-anchor="start">' + echapper(def.titreY) + '</text>');
    (def.courbes || []).forEach(function (c, i) {
      // c.src : expression lue par Maths ; c.f : fonction JS (exponentielle, racine carrée, hyperbole…)
      var ev = c.f || function (x) { return Maths.evaluerApproche(c.src, { x: x }); };
      var courbe = !!c.f || c.src.indexOf('^') >= 0 || c.src.indexOf('/x') >= 0;
      var n = courbe ? 300 : 2, morceaux = [], pts = [], haut = ymax - ymin;
      for (var j = 0; j <= n; j++) {
        var x = xmin + (xmax - xmin) * j / n, y;
        try { y = ev(x); } catch (e) { y = NaN; }
        if (typeof y !== 'number' || !isFinite(y) || y > ymax + haut || y < ymin - haut) {
          // hors du domaine ou très loin du cadre : on coupe le tracé (branches d'une hyperbole)
          if (isFinite(y) && pts.length) pts.push(X(x) + ',' + Y(Math.max(ymin - haut, Math.min(ymax + haut, y))));
          if (pts.length > 1) morceaux.push(pts);
          pts = [];
          continue;
        }
        pts.push(X(x) + ',' + Y(y));
      }
      if (pts.length > 1) morceaux.push(pts);
      morceaux.forEach(function (m) {
        s.push('<polyline class="courbe ' + (c.classe || 'c' + i) + '" clip-path="url(#' + clip + ')" points="' + m.join(' ') + '"/>');
      });
      if (c.nom) {
        // nom de la courbe près du bord droit, à l'intérieur du repère
        for (var q = 0; q <= 40; q++) {
          var xn = xmax - (xmax - xmin) * (0.04 + q * 0.02), yn;
          try { yn = ev(xn); } catch (e2) { yn = NaN; }
          if (yn < ymax - (ymax - ymin) * 0.06 && yn > ymin + (ymax - ymin) * 0.06) {
            s.push('<text class="nom-courbe ' + (c.classe || 'c' + i) + '" x="' + (X(xn) - 4) + '" y="' + (Y(yn) - 8) + '" text-anchor="end">' + echapper(c.nom) + '</text>');
            break;
          }
        }
      }
    });
    (def.segments || []).forEach(function (seg, i) {
      s.push('<polyline class="courbe c' + i + '" clip-path="url(#' + clip + ')" points="' + seg.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '"/>');
    });
    (def.points || []).forEach(function (p) {
      s.push('<circle class="point" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5"/>');
      if (p.nom) s.push('<text class="nom-point" x="' + (X(p.x) + 6) + '" y="' + (Y(p.y) - 7) + '">' + echapper(p.nom) + '</text>');
    });
    s.push('</svg>');
    return s.join('');
  }
  /**
   * Diagramme en barres (SVG). def : { categories: [texte], valeurs: [nombre | null], max, pas
   * (quadrillage), lpas (nombres écrits), titreY, description }. Une valeur null : barre absente.
   */
  function svgBarres(def) {
    var n = def.categories.length, L = 300, Hh = 200, mg = 42, mh = 22, mb = 40, md = 10;
    var W = mg + L + md, H = mh + Hh + mb, larg = L / n;
    function Y(v) { return +(mh + Hh - v * Hh / def.max).toFixed(2); }
    var s = ['<svg class="svg-fonction svg-barres" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + echapper(def.description || 'Diagramme en barres') + '">'];
    s.push('<g class="grille">');
    for (var k = 0; k <= def.max + 1e-9; k += def.pas) s.push('<line x1="' + mg + '" y1="' + Y(k) + '" x2="' + (mg + L) + '" y2="' + Y(k) + '"/>');
    s.push('</g><g class="nombres-axes">');
    for (k = 0; k <= def.max + 1e-9; k += def.lpas || def.pas) s.push('<text x="' + (mg - 5) + '" y="' + (Y(k) + 4) + '" text-anchor="end">' + echapper(tn(+k.toFixed(6))) + '</text>');
    s.push('</g>');
    def.categories.forEach(function (c, i) {
      var x = mg + i * larg + larg * 0.18, w = larg * 0.64, v = def.valeurs[i];
      if (v !== null && v !== undefined) s.push('<rect class="barre" x="' + x.toFixed(2) + '" y="' + Y(v) + '" width="' + w.toFixed(2) + '" height="' + (Y(0) - Y(v)).toFixed(2) + '"/>');
      else s.push('<rect class="barre-vide" x="' + x.toFixed(2) + '" y="' + Y(def.max * 0.04) + '" width="' + w.toFixed(2) + '" height="' + (Y(0) - Y(def.max * 0.04)).toFixed(2) + '"/>');
      s.push('<text class="categorie" x="' + (mg + (i + 0.5) * larg).toFixed(2) + '" y="' + (mh + Hh + 16) + '" text-anchor="middle">' + echapper(c) + '</text>');
    });
    s.push('<g class="axes"><line x1="' + mg + '" y1="' + Y(0) + '" x2="' + (mg + L) + '" y2="' + Y(0) + '"/><line x1="' + mg + '" y1="' + Y(0) + '" x2="' + mg + '" y2="' + (mh - 6) + '"/></g>');
    if (def.titreY) s.push('<text class="titre-axe" x="' + (mg + 6) + '" y="' + (mh - 8) + '">' + echapper(def.titreY) + '</text>');
    s.push('</svg>');
    return '<div class="cadre-graphique">' + s.join('') + '</div>';
  }

  /**
   * Diagramme en barre (SVG) : une seule bande partagée, dont les longueurs des parties sont
   * proportionnelles aux grandeurs. def : { categories: [texte], parts: [pourcentages],
   * etiquettes: [texte de la légende], description }. Graduation en % sous la bande.
   */
  function svgBarre(def) {
    var mg = 14, L = 320, y0 = 16, h = 46, W = mg * 2 + L, H = 96, x = mg;
    var s = ['<svg class="svg-fonction svg-barre" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + echapper(def.description || 'Diagramme en barre') + '">'];
    def.parts.forEach(function (p, i) {
      var w = L * p / 100;
      s.push('<rect class="secteur s' + (i % 6) + '" x="' + x.toFixed(2) + '" y="' + y0 + '" width="' + w.toFixed(2) + '" height="' + h + '"/>');
      s.push('<text class="lettre-secteur" x="' + (x + w / 2).toFixed(2) + '" y="' + (y0 + h / 2 + 5) + '" text-anchor="middle">' + lettre(i) + '</text>');
      x += w;
    });
    s.push('<g class="axes"><line x1="' + mg + '" y1="' + (y0 + h + 8) + '" x2="' + (mg + L) + '" y2="' + (y0 + h + 8) + '"/></g><g class="grille">');
    for (var k = 0; k <= 20; k++) s.push('<line x1="' + (mg + L * k / 20) + '" y1="' + (y0 + h + 8) + '" x2="' + (mg + L * k / 20) + '" y2="' + (y0 + h + (k % 2 ? 12 : 15)) + '"/>');
    s.push('</g><g class="nombres-axes">');
    for (k = 0; k <= 10; k += 2) s.push('<text x="' + (mg + L * k / 10) + '" y="' + (y0 + h + 28) + '" text-anchor="middle">' + (k * 10) + ' %</text>');
    s.push('</g></svg>');
    var leg = '<ul class="legende-secteurs">' + def.categories.map(function (c, i) {
      return '<li><span class="pastille-secteur s' + (i % 6) + '" aria-hidden="true">' + lettre(i) + '</span> ' + echapper(c) + (def.etiquettes && def.etiquettes[i] ? ' : ' + def.etiquettes[i] : '') + '</li>';
    }).join('') + '</ul>';
    return '<div class="cadre-circulaire cadre-barre">' + s.join('') + leg + '</div>';
  }

  /**
   * Diagramme circulaire (SVG). def : { categories: [texte], parts: [pourcentages], etiquettes:
   * [texte affiché dans la légende], description }. Les parts sont en % (somme 100).
   */
  function svgCirculaire(def) {
    var cx = 110, cy = 110, r = 96, a0 = -Math.PI / 2;
    var s = ['<svg class="svg-fonction svg-circulaire" viewBox="0 0 220 220" role="img" aria-label="' + echapper(def.description || 'Diagramme circulaire') + '">'];
    def.parts.forEach(function (p, i) {
      var a1 = a0 + 2 * Math.PI * p / 100;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      var grand = p > 50 ? 1 : 0;
      s.push('<path class="secteur s' + (i % 6) + '" d="M' + cx + ' ' + cy + ' L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + grand + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z"/>');
      var am = (a0 + a1) / 2;
      s.push('<text class="lettre-secteur" x="' + (cx + r * 0.62 * Math.cos(am)).toFixed(2) + '" y="' + (cy + r * 0.62 * Math.sin(am) + 5).toFixed(2) + '" text-anchor="middle">' + lettre(i) + '</text>');
      a0 = a1;
    });
    s.push('</svg>');
    var leg = '<ul class="legende-secteurs">' + def.categories.map(function (c, i) {
      return '<li><span class="pastille-secteur s' + (i % 6) + '" aria-hidden="true">' + lettre(i) + '</span> ' + echapper(c) + (def.etiquettes && def.etiquettes[i] ? ' : ' + def.etiquettes[i] : '') + '</li>';
    }).join('') + '</ul>';
    return '<div class="cadre-circulaire">' + s.join('') + leg + '</div>';
  }
  function lettre(i) { return 'ABCDEFGH'.charAt(i); }

  /** Graphique dans un cadre (HTML). */
  function graphiqueHtml(def) { return '<div class="cadre-graphique">' + svgGraphique(def) + '</div>'; }

  /** Pas de graduation adapté (1, 2, 5, 10, 20…) pour au plus ~12 traits. */
  function pasAdapte(etendue, maxTraits) {
    maxTraits = maxTraits || 12;
    var pas = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
    for (var i = 0; i < pas.length; i++) if (etendue / pas[i] <= maxTraits) return pas[i];
    return 1000;
  }

  /* =====================================================================
   * Lecture des réponses
   * ===================================================================== */
  function nettoyer(t) { return String(t === undefined || t === null ? '' : t).trim(); }
  function illisible(message) { return { juste: false, statut: 'illisible', message: message }; }
  function faux(message) { return { juste: false, statut: 'faux', message: message }; }
  var JUSTE = { juste: true, statut: 'juste', message: '' };

  var UNITES = /\s*(CHF|francs?|fr\.?|EUR|euros?|€|km\/h|km|kg|g|Go|kWh|h|min|minutes?|heures?|m|cm|l|L|°|%)\s*$/;
  /** Retire « f(4) = », « y = », « x = » en tête et une unité à la fin. */
  function sansDecor(texte) {
    var t = nettoyer(texte);
    t = t.replace(/^[a-zA-Z]\s*\([^)]*\)\s*=\s*/, '').replace(/^[a-zA-Z]\s*=\s*/, '');
    t = t.replace(/^(CHF|Fr\.?)\s*/i, '');
    var avant;
    do { avant = t; t = t.replace(UNITES, ''); } while (t !== avant);
    return t.trim();
  }
  /** Nombre seul -> Fraction (lève Maths.ErreurSaisie si illisible). */
  function lireNombre(texte, montant) {
    var t = sansDecor(texte);
    if (t === '') throw new Maths.ErreurSaisie('Écris un nombre.', 0);
    if (montant) { var m = Maths.lireMontant(t); if (m) return m; }
    var arbre = Maths.analyser(t);
    if (Maths.lettres(arbre).length) throw new Maths.ErreurSaisie('Écris un nombre, sans lettre.', 0);
    return Maths.evaluer(arbre);
  }

  function chercherPiegeValeur(pieges, f) {
    for (var i = 0; i < (pieges || []).length; i++) {
      var p = pieges[i];
      if (p.valeur !== undefined && val(p.valeur).egal(f)) return p.message;
    }
    return null;
  }

  function verifierNombre(q, texte) {
    var r = q.reponse, lu;
    if (nettoyer(texte) === '') return illisible('Écris ta réponse dans le champ.');
    try { lu = lireNombre(texte, r.montant); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible. Vérifie ta saisie.');
      throw e;
    }
    var att = val(r.valeur);
    if (lu.egal(att)) return JUSTE;
    var p = chercherPiegeValeur(q.pieges, lu);
    if (p) return faux(p);
    if (!att.estZero() && lu.egal(att.oppose())) return faux('Erreur de signe : ta réponse est l\'opposé du résultat.');
    return faux(r.messageFaux || 'Ce n\'est pas le bon résultat.');
  }

  /** Expression fonctionnelle : « 3x + 4 », « f(x) = 3x + 4 », « y = 3x + 4 », « f : x ⟼ 3x + 4 ». */
  function lireExpr(texte) {
    var t = nettoyer(texte)
      .replace(/^[a-zA-Z]\s*:\s*x\s*(⟼|↦|→|->|\|->)\s*/, '')
      .replace(/^[a-zA-Z]\s*\(\s*x\s*\)\s*=\s*/, '')
      .replace(/^y\s*=\s*/, '');
    if (t === '') throw new Maths.ErreurSaisie('Écris l\'expression, par exemple 3x + 4.', 0);
    var arbre = Maths.analyser(t);
    var autres = Maths.lettres(arbre).filter(function (l) { return l !== 'x'; });
    if (autres.length) throw new Maths.ErreurSaisie('Utilise seulement la lettre x (pas ' + autres.join(', ') + ').', 0);
    return t;
  }
  var ESSAIS_X = [0, 1, 2, 5, -3, 10];
  function verifierExpr(q, texte) {
    var r = q.reponse, t;
    if (nettoyer(texte) === '') return illisible('Écris ta réponse dans le champ.');
    try { t = lireExpr(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      throw e;
    }
    var eq;
    try { eq = Maths.equivalentes(t, r.attendu); } catch (e2) {
      if (e2 instanceof Maths.ErreurCalcul) return illisible('Ce calcul est impossible. Vérifie ta saisie.');
      throw e2;
    }
    if (eq) return JUSTE;
    for (var i = 0; i < (q.pieges || []).length; i++) {
      var p = q.pieges[i];
      try { if (p.src !== undefined && Maths.equivalentes(t, p.src)) return faux(p.message); } catch (e3) { /* ignore */ }
    }
    for (var k = 0; k < ESSAIS_X.length; k++) {
      try {
        var v = { x: ESSAIS_X[k] };
        var a = Maths.evaluer(t, v), b = Maths.evaluer(r.attendu, v);
        if (!a.egal(b)) return faux((r.messageFaux ? r.messageFaux + ' ' : '') + 'Contrôle : pour x = ' + tn(ESSAIS_X[k]) + ', ton expression donne ' + tn(a) + ' au lieu de ' + tn(b) + '.');
      } catch (e4) { /* point non calculable */ }
    }
    return faux(r.messageFaux || 'Ce n\'est pas la bonne expression.');
  }

  /** Liste de nombres dans l'ordre : « 4 ; 9 ; 16 ». */
  function verifierListe(q, texte) {
    var r = q.reponse, parties, lus;
    if (nettoyer(texte) === '') return illisible('Écris les nombres séparés par des points-virgules, par exemple 4 ; 9 ; 16.');
    try {
      parties = Maths.lireListe(nettoyer(texte));
      lus = parties.map(function (p) { return lireNombre(p, r.montant); });
    } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      if (e instanceof Maths.ErreurCalcul) return illisible('Une des valeurs est impossible à calculer.');
      throw e;
    }
    if (lus.length !== r.valeurs.length) return illisible('Écris ' + r.valeurs.length + ' nombres, séparés par des points-virgules.');
    var fausses = [];
    r.valeurs.forEach(function (v, i) { if (!val(v).egal(lus[i])) fausses.push(i); });
    if (!fausses.length) return JUSTE;
    for (var i = 0; i < (q.pieges || []).length; i++) {
      var p = q.pieges[i];
      if (p.liste && p.liste.length === lus.length && p.liste.every(function (v, j) { return val(v).egal(lus[j]); })) return faux(p.message);
    }
    var noms = r.noms || r.valeurs.map(function (v, i) { return 'n° ' + (i + 1); });
    var msg = fausses.length === 1 ? 'La valeur ' + noms[fausses[0]] + ' n\'est pas juste.' : 'Les valeurs ' + fausses.map(function (i) { return noms[i]; }).join(', ') + ' ne sont pas justes.';
    if (fausses.length === 1) { var pv = chercherPiegeValeur(q.pieges, lus[fausses[0]]); if (pv) msg += ' ' + pv; }
    return faux(msg);
  }

  /** Couple (x ; y), avec ou sans espaces ; « x = 2 ; y = 3 » accepté. */
  function lireCouple(texte) {
    var t = nettoyer(texte).replace(/^[A-Z]\s*/, '');
    var m = /x\s*=\s*([^;]+);\s*y\s*=\s*(.+)$/.exec(t);
    var parties = m ? [m[1], m[2]] : Maths.lireListe(t);
    if (parties.length !== 2) throw new Maths.ErreurSaisie('Écris un couple (x ; y), par exemple (2 ; – 1).', 0);
    return parties.map(function (p) { return lireNombre(p.replace(/[()]/g, '')); });
  }
  function verifierCouple(q, texte) {
    var r = q.reponse, lu;
    if (nettoyer(texte) === '') return illisible('Écris un couple (x ; y), par exemple (2 ; – 1).');
    try { lu = lireCouple(texte); } catch (e) {
      if (e instanceof Maths.ErreurSaisie) return illisible(e.message);
      throw e;
    }
    var ax = val(r.x), ay = val(r.y);
    if (lu[0].egal(ax) && lu[1].egal(ay)) return JUSTE;
    if (lu[0].egal(ay) && lu[1].egal(ax)) return faux(ERREURS.inverse);
    if (lu[0].egal(ax)) return faux('La valeur de x est juste, mais pas celle de y.' + (r.messageY ? ' ' + r.messageY : ''));
    if (lu[1].egal(ay)) return faux('La valeur de y est juste, mais pas celle de x.');
    return faux(r.messageFaux || 'Ce n\'est pas le bon point.');
  }

  function verifierChoix(q, texte) {
    var i = parseInt(nettoyer(texte), 10);
    if (!(i >= 0 && i < q.choix.length)) return illisible('Choisis une réponse.');
    var c = q.choix[i];
    if (c.juste) return { juste: true, statut: 'juste', message: c.message || '' };
    return faux(c.message || 'Ce n\'est pas la bonne réponse.');
  }

  function verifier(q, texte) {
    switch (q.reponse.type) {
      case 'nombre': return verifierNombre(q, texte);
      case 'expr': return verifierExpr(q, texte);
      case 'liste': return verifierListe(q, texte);
      case 'couple': return verifierCouple(q, texte);
      case 'choix': return verifierChoix(q, texte);
    }
    throw new Error('Type de réponse inconnu : ' + q.reponse.type);
  }

  /** Bonnes et mauvaises réponses d'exemple (tests automatiques, test de l'interface). */
  function exemples(q) {
    var r = q.reponse, justes = [], fx = [];
    switch (r.type) {
      case 'nombre': {
        var v = val(r.valeur);
        justes.push(tn(v));
        if (r.montant) justes.push(tm(v), v.versDecimal(2).replace('.', ','));
        else if (v.estDecimale()) justes.push(v.toString());
        fx.push(tn(v.plus(1)));
        (q.pieges || []).forEach(function (p) { if (p.valeur !== undefined) fx.push(tn(p.valeur)); });
        break;
      }
      case 'expr':
        justes.push(tx(r.attendu), 'f(x) = ' + tx(r.attendu), 'y = ' + tx(r.attendu), 'f : x ⟼ ' + tx(r.attendu));
        fx.push(tx(r.attendu + '+1'));
        (q.pieges || []).forEach(function (p) { if (p.src !== undefined) fx.push(tx(p.src)); });
        break;
      case 'liste':
        justes.push(r.valeurs.map(tn).join(' ; '), r.valeurs.map(tn).join(';'));
        fx.push(r.valeurs.map(function (v, i) { return tn(i === 0 ? val(v).plus(1) : v); }).join(' ; '));
        (q.pieges || []).forEach(function (p) { if (p.liste) fx.push(p.liste.map(tn).join(' ; ')); });
        break;
      case 'couple':
        justes.push(tc(r.x, r.y), '(' + val(r.x).toString() + ';' + val(r.y).toString() + ')');
        if (!val(r.x).egal(val(r.y))) fx.push(tc(r.y, r.x));
        fx.push(tc(val(r.x).plus(1), r.y));
        break;
      case 'choix':
        q.choix.forEach(function (c, i) { (c.juste ? justes : fx).push(String(i)); });
        break;
    }
    return { justes: justes, faux: fx };
  }

  /* =====================================================================
   * Constructeurs
   * ===================================================================== */
  function clavierPour(options) {
    options = options || {};
    var t = ['7', '8', '9', '(', ')', 'effacer',
      '4', '5', '6', '·', ':', 'fraction',
      '1', '2', '3', '+', '–', ';', '0', ','];
    if (options.x) t.push('x');
    if (options.exposant) t.push('exposant');
    t.push('valider');
    return t;
  }

  function texteAttendu(q) {
    var r = q.reponse;
    switch (r.type) {
      case 'nombre': return r.montant ? hm(tm(r.valeur)) : hm(tn(r.valeur) + (r.unite ? (r.unite === '°' ? '' : NBSP) + r.unite : ''));
      case 'expr': return hf(r.attendu, r.nom);
      case 'liste': return hm(r.valeurs.map(tn).join(' ; '));
      case 'couple': return hm(tc(r.x, r.y));
    }
    return null;
  }

  function finaliser(q) {
    if (q.pieges && q.reponse) {
      // un piège égal à la bonne réponse ne doit jamais servir
      q.pieges = q.pieges.filter(function (p) {
        try {
          if (p.valeur !== undefined && q.reponse.type === 'nombre') return !val(p.valeur).egal(val(q.reponse.valeur));
          if (p.src !== undefined && q.reponse.type === 'expr') return !Maths.equivalentes(p.src, q.reponse.attendu);
          if (p.liste && q.reponse.type === 'liste') return !p.liste.every(function (v, i) { return val(v).egal(val(q.reponse.valeurs[i])); });
        } catch (e) { return false; }
        return true;
      });
    }
    q.mode = q.reponse.type === 'choix' ? 'choix' : 'champ';
    // espaces insécables avant ? ! ; : » et après « (hors balises)
    var fines = function (h) { return typeof h === 'string' ? h.replace(/(>[^<]*)/g, function (m) { return m.replace(/ ([?!;:»])/g, NBSP + '$1').replace(/« /g, '«' + NBSP); }) : h; };
    q.enonce = fines('>' + q.enonce).slice(1);
    if (q.consigne) q.consigne = fines('>' + q.consigne).slice(1);
    (q.choix || []).forEach(function (c) { c.h = fines('>' + c.h).slice(1); });
    if (!q.etapes) q.etapes = [];
    q.etapes.forEach(function (e, i) { e.titre = 'ÉTAPE ' + (i + 1); });
    q.attenduHtml = q.attenduHtml || texteAttendu(q);
    if (q.mode === 'champ' && !q.clavier) q.clavier = clavierPour({ x: q.reponse.type === 'expr' });
    q.verifier = function (texte) { return verifier(q, texte); };
    q.exemples = function () { return exemples(q); };
    return q;
  }

  /** Choix mélangés. */
  function melanger(alea, choix) { return alea.melanger(choix); }

  /**
   * Vrai ou faux avec choix de la justification.
   * def : { vrai, justeVrai, justeFaux, autresVrai: [html], autresFaux: [html], messageFaux }
   */
  function optionsVraiFaux(alea, def) {
    var opts = [];
    opts.push(def.vrai ? { h: '<strong>Vrai</strong>, car ' + def.justeVrai, juste: true } : { h: '<strong>Faux</strong>, car ' + def.justeFaux, juste: true });
    (def.vrai ? def.autresVrai : def.autresFaux || []).slice(0, 1).forEach(function (h) {
      opts.push({ h: '<strong>' + (def.vrai ? 'Vrai' : 'Faux') + '</strong>, car ' + h, juste: false, message: 'Le verdict est bon, mais pas la justification. ' + (def.messageFaux || '') });
    });
    (def.vrai ? def.autresFaux : def.autresVrai || []).slice(0, 2).forEach(function (h) {
      opts.push({ h: '<strong>' + (def.vrai ? 'Faux' : 'Vrai') + '</strong>, car ' + h, juste: false, message: def.messageFaux || '' });
    });
    return melanger(alea, opts);
  }

  /* =====================================================================
   * Exemples de référence de l'enseignante (non publics) : seules leurs
   * EMPREINTES sont dans le code. Chaque question décrit ses paramètres par
   * des « signatures » (texte) ; si l'empreinte d'une signature figure ici,
   * la question est tirée à nouveau.
   * ===================================================================== */
  function empreinte(texte) {
    var h = 2166136261;
    for (var i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8);
  }
  var EMPREINTES_REFERENCES = ['4efeb2c6', '01fc0160', '44ff6ee8', '0fb8c8a8', '03fe54e5', '7396e873', '66d291f0', '8368a7b2', '31fcf80f'];
  function estReference(signatures) {
    return (signatures || []).some(function (s) { return EMPREINTES_REFERENCES.indexOf(empreinte(s)) >= 0; });
  }

  return {
    Maths: Maths, F: F, NBSP: NBSP, MOINS: MOINS,
    RUBRIQUES: RUBRIQUES, ERREURS: ERREURS, PRENOMS: PRENOMS, MENTION_FICTIVE: MENTION_FICTIVE,
    val: val, tn: tn, hn: hn, tnp: tnp, tm: tm, tc: tc, sn: sn, tx: tx, hm: hm, hf: hf,
    srcAffine: srcAffine, snPositif: snPositif, pluriel: pluriel, echapper: echapper,
    tableauHtml: tableauHtml, svgGraphique: svgGraphique, svgBarres: svgBarres, svgBarre: svgBarre, svgCirculaire: svgCirculaire, graphiqueHtml: graphiqueHtml, pasAdapte: pasAdapte,
    lireNombre: lireNombre, lireExpr: lireExpr, lireCouple: lireCouple,
    verifier: verifier, exemples: exemples, clavierPour: clavierPour, finaliser: finaliser,
    melanger: melanger, optionsVraiFaux: optionsVraiFaux,
    empreinte: empreinte, estReference: estReference, EMPREINTES_REFERENCES: EMPREINTES_REFERENCES
  };
});
