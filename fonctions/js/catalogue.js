/*
 * fonctions/js/catalogue.js — catalogue des objectifs et création des séries
 * ---------------------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : objet global « Fonctions ». Node : require.
 *
 *   Fonctions.MODULES                       A (9e), B (10e), C (11e)
 *   Fonctions.objectifs                      tous les objectifs
 *   Fonctions.objectifsPour(module, profil)  objectifs disponibles, jamais au-delà de l'année
 *        et du niveau. Statut d'affichage : 'courant' (année de l'élève), 'revision',
 *        'theorique' (questions de reconnaissance, non comptées dans le bilan) ou
 *        'plusLoin' (prolongement facultatif, non compté).
 *   Fonctions.creerSerie(options)           10 questions
 *
 * Difficulté 1 à 4, la même aux deux niveaux : le niveau 2 a du contenu en plus
 * (objectifs ou modèles réservés au niveau 2), jamais des nombres plus grands.
 * Un objectif d'une année précédente est calibré selon les règles de SON année.
 *
 * Décisions de l'enseignante (à appliquer aux modules B et C) :
 *   - les règles propres à une année l'emportent sur les tailles générales
 *     (ex. 11e N1, difficulté 1 : a de – 4 à 4) ;
 *   - x et y peuvent être négatifs dès la 9e ; seuls les coefficients négatifs sont exclus en 9e ;
 *   - 10e : lire les coordonnées sur tout graphique (parabole comprise) ; tracer x² et – x²
 *     avec un tableau de valeurs : prolongement en N1, évalué en N2 ;
 *   - 11e : croissance et décroissance en prolongement ; exponentielle (base 2) en N2 :
 *     reconnaître son graphique, et lire un graphique dans des problèmes (lecture
 *     d'abscisse et d'ordonnée), sans calcul de type « double chaque année ».
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrique(require('./outils.js'), [require('./module-a.js'), require('./module-b.js')]);
  } else {
    racine.Fonctions = fabrique(racine.FonctionsOutils, [racine.FonctionsModuleA, racine.FonctionsModuleB]);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O, fichiers) {
  'use strict';

  var MODULES = [
    { id: 'A', titre: 'Situations, tableaux et graphiques', description: 'Vocabulaire, tableaux de valeurs, graphiques, proportionnalité, CHF et EUR.', debut: 9 },
    { id: 'B', titre: 'Fonctions affines, linéaires et constantes', description: 'Expression, tableau et graphique, intersection de deux droites, diagrammes.', debut: 10 },
    { id: 'C', titre: 'Autres fonctions et graphiques', description: 'Coefficients a et b, intersections avec les axes, paraboles.', debut: 11 }
  ];

  var objectifs = [];
  fichiers.forEach(function (f) { objectifs = objectifs.concat(f.objectifs); });
  var parId = {};
  objectifs.forEach(function (o) {
    if (parId[o.id]) throw new Error('Objectif en double : ' + o.id);
    parId[o.id] = o;
  });

  var TYPES = {
    directe: 'Application directe',
    lecture: 'Lire un graphique ou un tableau',
    relier: 'Relier les représentations',
    tableau: 'Tableau de valeurs',
    raconte: 'Raconte ce graphique',
    vraifaux: 'Vrai ou faux',
    erreur: 'Repère l\'erreur',
    probleme: 'Problème',
    choix: 'Choix'
  };

  function difficulte(d) { return Math.max(1, Math.min(4, Number(d) || 1)); }

  function objectifsPour(module, profil) {
    return objectifs.filter(function (o) {
      return (!module || o.module === module) && o.annee <= profil.annee && o.niveaux.indexOf(profil.niveau) >= 0;
    }).map(function (o) {
      var plusLoin = o.statut === 'plusLoin' || (profil.niveau === 1 && (o.plusLoinN1 || []).indexOf(profil.annee) >= 0);
      var statut = o.statut === 'theorique' ? 'theorique' : plusLoin ? 'plusLoin' : (o.annee === profil.annee ? 'courant' : 'revision');
      return { objectif: o, statut: statut };
    });
  }

  function selectionParDefaut(module, profil) {
    var dispo = objectifsPour(module, profil);
    var courants = dispo.filter(function (d) { return d.statut === 'courant'; });
    var revision = dispo.filter(function (d) { return d.statut === 'revision'; });
    return (courants.length ? courants : revision.length ? revision : dispo).map(function (d) { return d.objectif.id; });
  }

  /** Modèles d'un objectif disponibles à la difficulté p et au niveau donné. */
  function modelesPour(o, p, niveau) {
    var m = o.modeles.filter(function (x) { return (!x.dMin || p >= x.dMin) && (!x.dMax || p <= x.dMax) && (!x.niveaux || x.niveaux.indexOf(niveau) >= 0); });
    if (!m.length) {
      // pas de modèle à cette difficulté : on prend la difficulté disponible la plus proche
      var ecart = Infinity;
      o.modeles.forEach(function (x) {
        if (x.niveaux && x.niveaux.indexOf(niveau) < 0) return;
        ecart = Math.min(ecart, Math.abs((x.dMin || 1) - p), Math.abs((x.dMax || 4) - p));
      });
      m = o.modeles.filter(function (x) { return (!x.niveaux || x.niveaux.indexOf(niveau) >= 0) && Math.min(Math.abs((x.dMin || 1) - p), Math.abs((x.dMax || 4) - p)) === ecart; });
    }
    return m;
  }

  /** Une question de l'objectif o, à la difficulté d (1 à 4). ctx : { annee, niveau }. */
  function creerQuestion(o, alea, d, ctx, typesUtilises, strict, modeleImpose) {
    var p = difficulte(d);
    ctx = ctx || {};
    var c2 = { annee: o.annee, anneeEleve: ctx.annee || o.annee, niveau: ctx.niveau || o.niveaux[0], difficulte: p };
    var modeles = modeleImpose ? [modeleImpose] : modelesPour(o, p, c2.niveau);
    typesUtilises = typesUtilises || {};
    var min = Infinity;
    modeles.forEach(function (m) { min = Math.min(min, typesUtilises[m.gen.name] || 0); });
    var modele = alea.choix(modeles.filter(function (m) { return (typesUtilises[m.gen.name] || 0) === min; }));
    // modèle d'une autre difficulté (aucun à la difficulté demandée) : on annonce la difficulté réelle
    if (modele.dMin && p < modele.dMin) p = modele.dMin;
    if (modele.dMax && p > modele.dMax) p = modele.dMax;
    c2.difficulte = p;
    var q, essais = 0;
    for (;;) {
      try {
        q = modele.gen(alea, p, c2);
        // jamais un exemple de référence de l'enseignante (non public)
        if (O.estReference(q.signatures) && essais < 30) { essais++; continue; }
        break;
      } catch (e) {
        essais++;
        if (strict || essais > 8) throw e;
      }
    }
    q.objectif = o.id;
    q.objectifTitre = o.titre;
    q.module = o.module;
    q.difficulte = p;
    q.modele = modele.gen.name;
    q.type = q.type || modele.type;
    q.typeTexte = TYPES[q.type] || '';
    typesUtilises[modele.gen.name] = (typesUtilises[modele.gen.name] || 0) + 1;
    return O.finaliser(q);
  }

  /**
   * Série de questions.
   * options : { module, profil: { annee, niveau }, difficulte: 1-4, objectifs: [ids] (facultatif),
   *             graine (facultatif), nombre: 10, strict: false }
   */
  function creerSerie(options) {
    var profil = options.profil;
    var p = difficulte(options.difficulte);
    var dispo = objectifsPour(options.module, profil);
    var ids = options.objectifs && options.objectifs.length ? options.objectifs : selectionParDefaut(options.module, profil);
    var choisis = dispo.filter(function (d) { return ids.indexOf(d.objectif.id) >= 0; });
    if (!choisis.length) throw new Error('Aucun objectif disponible.');
    var alea = new O.Maths.Alea(options.graine);
    var n = options.nombre || 10;
    var ordre = [];
    while (ordre.length < n) ordre = ordre.concat(alea.melanger(choisis));
    ordre = ordre.slice(0, n);
    var typesUtilises = {};
    var ctx = { annee: profil.annee, niveau: profil.niveau };
    return ordre.map(function (d, i) {
      var q = creerQuestion(d.objectif, alea, p, ctx, typesUtilises, options.strict);
      q.statut = d.statut;
      q.compte = d.statut === 'courant' || d.statut === 'revision';
      q.numero = i + 1;
      return q;
    });
  }

  return {
    MODULES: MODULES,
    TYPES: TYPES,
    objectifs: objectifs,
    parId: parId,
    difficulte: difficulte,
    objectifsPour: objectifsPour,
    selectionParDefaut: selectionParDefaut,
    modelesPour: modelesPour,
    creerQuestion: creerQuestion,
    creerSerie: creerSerie,
    Outils: O
  };
});
