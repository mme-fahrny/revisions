/*
 * algebre/js/catalogue.js — catalogue des objectifs et création des séries
 * -------------------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : objet global « Algebre ». Node : require.
 *
 *   Algebre.MODULES                         A (calcul littéral), B (équations)
 *   Algebre.objectifs                        tous les objectifs
 *   Algebre.difficulte(d)                    1 à 4 (curseur). Pas de décalage au niveau 2 :
 *        le niveau 2 a des objectifs en plus, et chaque générateur lit ctx.niveau
 *        là où le calibrage le prévoit (fractions, cas particuliers en niveau 2 seulement).
 *        Chaque objectif est calibré selon les règles de SON année (révision comprise).
 *   Algebre.objectifsPour(module, profil)    objectifs disponibles, jamais au-delà de
 *        l'année et du niveau : statut 'courant' (année de l'élève), 'revision',
 *        ou 'plusLoin' (objectif facultatif du niveau 1, non compté dans le bilan :
 *        champ plusLoinN1 = années concernées)
 *   Algebre.creerSerie(options)              10 questions
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrique(require('./outils.js'), [require('./module-a.js'), require('./module-b.js')]);
  } else {
    racine.Algebre = fabrique(racine.AlgebreOutils, [racine.AlgebreModuleA, racine.AlgebreModuleB]);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O, fichiers) {
  'use strict';

  var MODULES = [
    { id: 'A', titre: 'Calcul littéral', description: 'Conventions d\'écriture, valeur numérique, monômes et polynômes, réduire, développer, factoriser.', debut: 9 },
    { id: 'B', titre: 'Équations', description: 'Règles d\'équivalence, résoudre et vérifier, problèmes, formules, résolution graphique.', debut: 10 }
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
    vraifaux: 'Vrai ou faux',
    erreur: 'Repère l\'erreur',
    traduction: 'Traduction',
    probleme: 'Problème',
    visuel: 'Outil visuel',
    choix: 'Choix',
    valeur: 'Problème'
  };

  function difficulte(d) {
    return Math.max(1, Math.min(4, Number(d) || 1));
  }

  /** Objectifs disponibles : jamais au-delà de l'année et du niveau choisis. */
  function objectifsPour(module, profil) {
    return objectifs.filter(function (o) {
      return (!module || o.module === module) && o.annee <= profil.annee && o.niveaux.indexOf(profil.niveau) >= 0;
    }).map(function (o) {
      var plusLoin = profil.niveau === 1 && (o.plusLoinN1 || []).indexOf(profil.annee) >= 0;
      return { objectif: o, statut: plusLoin ? 'plusLoin' : (o.annee === profil.annee ? 'courant' : 'revision') };
    });
  }

  function selectionParDefaut(module, profil) {
    var dispo = objectifsPour(module, profil);
    var courants = dispo.filter(function (d) { return d.statut === 'courant'; });
    var revision = dispo.filter(function (d) { return d.statut === 'revision'; });
    return (courants.length ? courants : revision).map(function (d) { return d.objectif.id; });
  }

  /** Une question de l'objectif o, à la difficulté d (1 à 4). ctx : { annee, niveau }. */
  function creerQuestion(o, alea, d, ctx, typesUtilises, strict) {
    var p = difficulte(d);
    ctx = ctx || {};
    var c2 = { annee: ctx.annee || o.annee, niveau: ctx.niveau || o.niveaux[0], difficulte: p, objectifAnnee: o.annee };
    var modeles = o.modeles.filter(function (m) { return (!m.dMin || p >= m.dMin) && (!m.dMax || p <= m.dMax); });
    typesUtilises = typesUtilises || {};
    var min = Infinity;
    modeles.forEach(function (m) { min = Math.min(min, typesUtilises[m.type] || 0); });
    var candidats = modeles.filter(function (m) { return (typesUtilises[m.type] || 0) === min; });
    var modele = alea.choix(candidats);
    var q, essais = 0;
    for (;;) {
      try {
        q = modele.gen(alea, p, c2);
        // jamais un exemple de référence de l'enseignante (non public)
        if (O.ressembleReference(O.sourcesQuestion(q)) && essais < 30) { essais++; continue; }
        break;
      } catch (e) {
        essais++;
        if (strict || essais > 8) throw e;
        modele = alea.choix(modeles);
      }
    }
    q.objectif = o.id;
    q.objectifTitre = o.titre;
    q.module = o.module;
    q.difficulte = p;
    q.type = q.type || modele.type;
    q.typeTexte = TYPES[q.type] || '';
    typesUtilises[modele.type] = (typesUtilises[modele.type] || 0) + 1;
    return q;
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
      q.compte = d.statut !== 'plusLoin';
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
    creerQuestion: creerQuestion,
    creerSerie: creerSerie,
    Outils: O,
    ModuleA: fichiers[0],
    ModuleB: fichiers[1]
  };
});
