/*
 * nombres/js/catalogue.js — catalogue des objectifs et création des séries
 * -------------------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : objet global « Nombres ». Node : require.
 *
 *   Nombres.MODULES                         A, B, C (titre, description)
 *   Nombres.objectifs                        tous les objectifs
 *   Nombres.palier(difficulte, niveau)       1 à 5 : difficulté du curseur (1 à 4),
 *                                            + 1 au niveau 2 (le niveau 2 va plus loin)
 *   Nombres.objectifsPour(module, profil)    objectifs disponibles, avec leur statut :
 *        'courant'  : objectif de l'année de l'élève
 *        'revision' : objectif d'une année précédente
 *        'plusLoin' : « Pour aller plus loin » (entraînement facultatif, non compté)
 *   Nombres.creerSerie(options)              10 questions
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrique(require('./outils.js'), [
      require('./module-a-9e.js'), require('./module-a-10e-11e.js'),
      require('./module-b.js'), require('./module-c.js')
    ]);
  } else {
    racine.Nombres = fabrique(racine.NombresOutils, [
      racine.NombresModuleA9, racine.NombresModuleA10, racine.NombresModuleB, racine.NombresModuleC
    ]);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O, fichiers) {
  'use strict';

  var MODULES = [
    { id: 'A', titre: 'Fractions et nombres rationnels', court: 'Fractions',
      description: 'Simplifier, comparer, calculer avec des fractions, des décimaux et des pourcentages.' },
    { id: 'B', titre: 'Puissances, racines et notation scientifique', court: 'Puissances',
      description: 'Puissances, carrés et cubes parfaits, racines, préfixes, notation scientifique.' },
    { id: 'C', titre: 'Révision : nombres relatifs et priorités', court: 'Relatifs',
      description: 'Droite numérique, opérations avec les relatifs, priorités des opérations.' }
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
    probleme: 'Problème',
    visuel: 'Représentation'
  };

  function palier(difficulte, niveau) {
    var d = Math.max(1, Math.min(4, Number(difficulte) || 1));
    return d + (Number(niveau) === 2 ? 1 : 0);
  }

  /** L'objectif est-il « Pour aller plus loin » pour ce profil ? */
  function estPlusLoin(o, profil) {
    return profil.niveau === 1 && (o.plusLoinN1 || []).indexOf(profil.annee) >= 0;
  }

  /** Objectifs disponibles : jamais au-delà de l'année et du niveau choisis. */
  function objectifsPour(module, profil) {
    return objectifs.filter(function (o) {
      return (!module || o.module === module) && o.annee <= profil.annee && o.niveaux.indexOf(profil.niveau) >= 0;
    }).map(function (o) {
      return {
        objectif: o,
        statut: estPlusLoin(o, profil) ? 'plusLoin' : (o.annee === profil.annee ? 'courant' : 'revision')
      };
    });
  }

  /** Choix par défaut : objectifs de l'année (sinon toute la révision), sans « pour aller plus loin ». */
  function selectionParDefaut(module, profil) {
    var dispo = objectifsPour(module, profil);
    var courants = dispo.filter(function (d) { return d.statut === 'courant'; });
    var liste = courants.length ? courants : dispo.filter(function (d) { return d.statut === 'revision'; });
    return liste.map(function (d) { return d.objectif.id; });
  }

  /** Une question d'un objectif. typesUtilises : compteur pour varier les types. */
  function creerQuestion(o, alea, p, ctx, typesUtilises, strict) {
    var modeles = o.modeles.filter(function (m) { return !m.palierMin || p >= m.palierMin; });
    typesUtilises = typesUtilises || {};
    // on préfère les types les moins utilisés dans la série
    var min = Infinity;
    modeles.forEach(function (m) { min = Math.min(min, typesUtilises[m.type] || 0); });
    var candidats = modeles.filter(function (m) { return (typesUtilises[m.type] || 0) === min; });
    var modele = alea.choix(candidats);
    var q, essais = 0;
    for (;;) {
      try {
        q = modele.gen(alea, p, ctx);
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
    q.palier = p;
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
    var p = palier(options.difficulte, profil.niveau);
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
    var ctx = { annee: profil.annee, niveau: profil.niveau, palier: p };
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
    palier: palier,
    objectifsPour: objectifsPour,
    selectionParDefaut: selectionParDefaut,
    creerQuestion: creerQuestion,
    creerSerie: creerSerie,
    Outils: O
  };
});
