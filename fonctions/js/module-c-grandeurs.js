/*
 * fonctions/js/module-c-grandeurs.js — Module C, 2e partie (11e)
 * -----------------------------------------------------------------
 * Logique pure (sans DOM). Navigateur : « FonctionsModuleC2 ». Node : require.
 *   C7  proportionnalité : échelle, pourcentage, pente, vitesse moyenne, masse volumique
 *       (niveau 2 : débit) — FA 11.3
 *   C8  diagrammes : circulaire, en barre, en colonnes — FA 11.3
 *   C9  fonction exponentielle (base 2) : reconnaître le graphique, y lire des valeurs,
 *       sans calcul du type « double chaque année » — FA 11.3
 *   C10 résoudre une équation par voie graphique, intersection de deux droites — FA 11.2
 *       (niveau 2 : équation du deuxième degré par voie graphique)
 *   C11 croissance et décroissance d'une fonction (niveau 2, questions de compréhension,
 *       sans dérivée) — FA 11.3
 *
 * Champ « controle » : voir module-a.js.
 */
(function (racine, fabrique) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require('./outils.js'), require('./module-b.js'), require('./module-c.js'));
  else racine.FonctionsModuleC2 = fabrique(racine.FonctionsOutils, racine.FonctionsModuleB, racine.FonctionsModuleC);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (O, B, C) {
  'use strict';

  var val = O.val, tn = O.tn, tnp = O.tnp, tm = O.tm, tc = O.tc, hm = O.hm, tx = O.tx;
  var R = O.RUBRIQUES, FICTIF = O.MENTION_FICTIVE;
  var U = C.outils, st = U.st, hS = U.hS, hE = U.hE;
  function src(l) { return O.srcAffine(l.a, l.b); }
  function image(l, x) { return val(l.a).fois(val(x)).plus(val(l.b)); }
  /** Au plus n décimales ? */
  function decimalesOk(x, n) { var p = Math.pow(10, n); return Math.abs(x * p - Math.round(x * p)) < 1e-9; }

  /* =====================================================================
   * C7 : proportionnalité et grandeurs composées
   * ===================================================================== */

  /** D1 à D3 — masse volumique : la calculer (D1), calculer une masse (D2), un volume avec conversion (D3). */
  function genMasseVolumique(alea, d) {
    var objet = alea.choix(['Un bloc de métal', 'Une statuette', 'Un galet', 'Une pièce de machine']);
    if (d <= 1) {
      var r1 = alea.choix([2, 3, 4, 5, 7, 8]), v1 = alea.choix([5, 10, 20, 30, 40, 50]), m1 = r1 * v1;
      return {
        type: 'directe',
        enonce: '<p>' + objet + ' de ' + v1 + ' cm³ a une masse de ' + m1 + ' g.</p>' + FICTIF + '<p>Calcule sa masse volumique, en g/cm³.</p>',
        indice: 'Masse volumique = masse divisée par volume.',
        reponse: { type: 'nombre', valeur: r1, unite: 'g/cm³' }, suffixe: 'g/cm³',
        pieges: [{ valeur: m1 * v1, message: 'Tu as multiplié : la masse volumique est le quotient de la masse par le volume.' }, { valeur: val(v1).divise(m1), message: 'Tu as inversé la division : masse volumique = masse : volume.' }],
        etapes: [{ texte: 'On divise la masse par le volume.', calcul: hm('ρ = ' + m1 + ' : ' + v1 + ' = ' + r1 + ' g/cm³') }],
        verification: 'Cela signifie que 1 cm³ de cet objet a une masse de ' + r1 + ' g.',
        rubrique: R.masseVolumique,
        controle: { ops: 1, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: m1 + '/' + v1 } }
      };
    }
    if (d === 2) {
      var r2 = val(alea.choix(['0.8', '2.5', '7.5', '1.2', '0.5'])), v2 = alea.choix([20, 40, 60, 100, 200]), m2 = r2.fois(v2);
      return {
        type: 'probleme',
        enonce: '<p>' + objet + ' a une masse volumique de ' + tn(r2) + ' g/cm³ et un volume de ' + v2 + ' cm³.</p>' + FICTIF + '<p>Calcule sa masse, en grammes.</p>',
        indice: 'Une masse volumique de ' + tn(r2) + ' g/cm³ signifie que 1 cm³ a une masse de ' + tn(r2) + ' g.',
        reponse: { type: 'nombre', valeur: m2, unite: 'g' }, suffixe: 'g',
        pieges: [{ valeur: val(v2).divise(r2), message: 'Tu as divisé : chaque cm³ a une masse de ' + tn(r2) + ' g, il faut multiplier par le volume.' }, { valeur: r2.divise(v2), message: 'Tu as divisé : chaque cm³ a une masse de ' + tn(r2) + ' g, il faut multiplier par le volume.' }],
        etapes: [
          { texte: '1 cm³ a une masse de ' + tn(r2) + ' g : la masse est proportionnelle au volume.' },
          { texte: 'On multiplie par le volume.', calcul: hm('m = ' + tn(r2) + ' · ' + v2 + ' = ' + tn(m2) + ' g') }
        ],
        verification: 'Contrôle : ' + hm(tn(m2) + ' : ' + v2 + ' = ' + tn(r2)) + ' g/cm³.',
        rubrique: R.masseVolumique,
        controle: { ops: 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: st(r2) + '*' + v2 } }
      };
    }
    var r3 = val(alea.choix([2, '2.5', 5, 8])), v3 = alea.choix([200, 400, 600, 800]), g3 = r3.fois(v3), kg = g3.divise(1000);
    return {
      type: 'probleme',
      enonce: '<p>' + objet + ' a une masse de ' + tn(kg) + ' kg. Sa masse volumique est de ' + tn(r3) + ' g/cm³.</p>' + FICTIF + '<p>Calcule son volume, en cm³.</p>',
      indice: 'Exprime d\'abord la masse en grammes. Puis : volume = masse divisée par masse volumique.',
      reponse: { type: 'nombre', valeur: v3, unite: 'cm³' }, suffixe: 'cm³',
      pieges: [{ valeur: kg.divise(r3), message: 'Convertis d\'abord la masse en grammes : la masse volumique est donnée en g/cm³.' }, { valeur: g3.fois(r3), message: 'Tu as multiplié : volume = masse : masse volumique.' }],
      etapes: [
        { texte: 'On exprime la masse en grammes.', calcul: hm(tn(kg) + ' kg = ' + tn(g3) + ' g') },
        { texte: 'ρ = m : V, donc V = m : ρ.' },
        { texte: 'On divise.', calcul: hm('V = ' + tn(g3) + ' : ' + tn(r3) + ' = ' + v3 + ' cm³') }
      ],
      verification: 'Contrôle : ' + hm(tn(r3) + ' · ' + v3 + ' = ' + tn(g3)) + ' g, soit ' + tn(kg) + ' kg.',
      rubrique: R.masseVolumique,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: U.js(kg) + '*1000/' + U.js(r3) } }
    };
  }

  /** D1, D3 — vitesse moyenne ; à la difficulté 3, la durée est en heures et minutes. */
  function genVitesse11(alea, d) {
    var qui = alea.choix([['Un train régional', [60, 80, 90]], ['Une cycliste', [15, 20, 25]], ['Un car postal', [40, 50, 60]]]);
    var v = alea.choix(qui[1]);
    if (d <= 1) {
      var t1 = alea.entier(2, 4), d1 = v * t1;
      return {
        type: 'directe',
        enonce: '<p>' + qui[0] + ' parcourt ' + d1 + ' km en ' + t1 + ' heures.</p>' + FICTIF + '<p>Calcule sa vitesse moyenne, en km/h.</p>',
        indice: 'Vitesse moyenne = distance parcourue divisée par la durée du parcours.',
        reponse: { type: 'nombre', valeur: v, unite: 'km/h' }, suffixe: 'km/h',
        pieges: [{ valeur: d1 * t1, message: 'Tu as multiplié : la vitesse est le quotient de la distance par la durée.' }, { valeur: val(t1).divise(d1), message: 'Tu as inversé la division : vitesse = distance : durée.' }],
        etapes: [{ texte: 'On divise la distance par la durée.', calcul: hm('v = ' + d1 + ' : ' + t1 + ' = ' + v + ' km/h') }],
        verification: 'Contrôle : en ' + t1 + ' h à ' + v + ' km/h, on parcourt ' + hm(v + ' · ' + t1 + ' = ' + d1) + ' km.',
        rubrique: R.vitesse,
        controle: { ops: 1, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: d1 + '/' + t1 } }
      };
    }
    var h = alea.entier(0, 2), min = alea.choix([12, 15, 24, 30, 36, 45, 48]);
    var duree = val(h).plus(val(min).divise(60)), dist = duree.fois(v);
    var texteDuree = (h ? h + ' h ' : '') + min + ' min';
    return {
      type: 'probleme',
      enonce: '<p>' + qui[0] + ' parcourt ' + tn(dist) + ' km en ' + texteDuree + '.</p>' + FICTIF + '<p>Calcule sa vitesse moyenne, en km/h.</p>',
      indice: 'Exprime d\'abord la durée en heures : ' + min + ' min = ' + min + ' : 60 h.',
      reponse: { type: 'nombre', valeur: v, unite: 'km/h' }, suffixe: 'km/h',
      pieges: [{ valeur: dist.divise(val(h).plus(val(min).divise(100))), message: texteDuree + ' ne vaut pas ' + tn(val(h).plus(val(min).divise(100))) + ' h : une heure compte 60 minutes, pas 100.' }, { valeur: dist.divise(h * 60 + min), message: 'Tu as divisé par la durée en minutes : tu obtiens des km par minute. Exprime la durée en heures.' }],
      etapes: [
        { texte: 'On exprime la durée en heures.', calcul: hm(min + ' min = ' + min + ' : 60 h = ' + tn(val(min).divise(60)) + ' h' + (h ? ', donc ' + texteDuree + ' = ' + tn(duree) + ' h' : '')) },
        { texte: 'Vitesse = distance : durée.', calcul: hm('v = ' + tn(dist) + ' : ' + tn(duree)) },
        { texte: 'On calcule.', calcul: hm('v = ' + v + ' km/h') }
      ],
      verification: 'Contrôle : ' + hm(v + ' · ' + tn(duree) + ' = ' + tn(dist)) + ' km.',
      rubrique: R.vitesse,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: st(dist) + '/(' + h + '+' + min + '/60)' } }
    };
  }

  /** D4 — convertir une vitesse : m/s ↔ km/h. */
  function genVitesseConversion(alea, d) {
    var ms = alea.choix([5, 10, 15, 20, 25, 30]), kmh = ms * 36 / 10, vers = alea.choix(['kmh', 'ms']);
    if (vers === 'kmh') {
      return {
        type: 'probleme',
        enonce: '<p>Un coureur cycliste roule à ' + ms + ' m/s.</p>' + FICTIF + '<p>Exprime cette vitesse en km/h.</p>',
        indice: 'Combien de mètres parcourt-il en 1 heure (3600 secondes) ? Convertis ensuite en kilomètres.',
        reponse: { type: 'nombre', valeur: kmh, unite: 'km/h' }, suffixe: 'km/h',
        pieges: [{ valeur: val(ms * 60).divise(1000), message: 'Une heure compte 3600 secondes (60 · 60), pas 60.' }, { valeur: ms * 3600, message: 'C\'est la distance en mètres parcourue en 1 heure : convertis-la en kilomètres.' }, { valeur: val(ms * 10).divise(36), message: 'Tu as divisé par 3,6 : pour passer des m/s aux km/h, on multiplie par 3,6.' }],
        etapes: [
          { texte: 'En 1 seconde : ' + ms + ' m. En 1 heure (3600 s) :', calcul: hm(ms + ' · 3600 = ' + tn(ms * 3600) + ' m') },
          { texte: 'On convertit en kilomètres.', calcul: hm(tn(ms * 3600) + ' m = ' + tn(kmh) + ' km') },
          { texte: 'Vitesse : ' + tn(kmh) + ' km/h.' }
        ],
        verification: 'Raccourci : ' + hm(ms + ' · 3,6 = ' + tn(kmh)) + '.',
        rubrique: R.vitesse,
        controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: ms + '*3600/1000' } }
      };
    }
    return {
      type: 'probleme',
      enonce: '<p>Une voiture roule à ' + tn(kmh) + ' km/h.</p>' + FICTIF + '<p>Exprime cette vitesse en m/s.</p>',
      indice: 'Combien de mètres parcourt-elle en 1 heure ? Une heure compte 3600 secondes.',
      reponse: { type: 'nombre', valeur: ms, unite: 'm/s' }, suffixe: 'm/s',
      pieges: [{ valeur: val(kmh * 1000).divise(60), message: 'Une heure compte 3600 secondes (60 · 60), pas 60 : tu as des mètres par minute.' }, { valeur: val(kmh).fois(36).divise(10), message: 'Tu as multiplié par 3,6 : pour passer des km/h aux m/s, on divise par 3,6.' }],
      etapes: [
        { texte: 'En 1 heure : ' + tn(kmh) + ' km, soit', calcul: hm(tn(kmh * 1000) + ' m') },
        { texte: '1 heure = 3600 secondes.', calcul: hm(tn(kmh * 1000) + ' : 3600 = ' + ms + ' m') },
        { texte: 'Vitesse : ' + ms + ' m/s.' }
      ],
      verification: 'Raccourci : ' + hm(tn(kmh) + ' : 3,6 = ' + ms) + '.',
      rubrique: R.vitesse,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: kmh + '*1000/3600' } }
    };
  }

  /** D2, D3 — déterminer la pente moyenne d'une route, en pour-cent. */
  function genPentePourcent(alea, d) {
    var p = alea.choix([4, 5, 6, 8, 10, 12, 15]);
    var lieu = alea.choix(['d\'une route du Val-de-Travers', 'd\'un chemin forestier', 'd\'une piste cyclable']);
    if (d <= 2) {
      var L = alea.choix([200, 400, 500, 800]), D = p * L / 100;
      return {
        type: 'probleme',
        enonce: '<p>Sur un tronçon ' + lieu + ', la dénivellation est de ' + tn(D) + ' m pour une distance horizontale de ' + L + ' m.</p>' + FICTIF + '<p>Calcule la pente moyenne de ce tronçon, en pour-cent.</p>',
        indice: 'Pente = dénivellation divisée par la distance horizontale. Écris ensuite le résultat en pour-cent.',
        reponse: { type: 'nombre', valeur: p, unite: '%' }, suffixe: '%',
        pieges: [{ valeur: val(L).divise(D), message: 'Tu as inversé la division : pente = dénivellation : distance horizontale.' }, { valeur: val(D).divise(L), message: 'C\'est la pente sous forme décimale : écris-la en pour-cent (' + tn(val(D).divise(L)) + ' = ' + p + ' %).' }, { valeur: D, message: 'C\'est la dénivellation : il faut la diviser par la distance horizontale.' }],
        etapes: [
          { texte: 'On divise la dénivellation par la distance horizontale.', calcul: hm(tn(D) + ' : ' + L + ' = ' + tn(val(D).divise(L))) },
          { texte: 'On écrit le résultat en pour-cent.', calcul: hm(tn(val(D).divise(L)) + ' = ' + p + ' %') }
        ],
        verification: 'Une pente de ' + p + ' % : on monte de ' + p + ' m pour 100 m à l\'horizontale.',
        rubrique: R.penteTerrain,
        controle: { ops: 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: D + '/' + L + '*100' } }
      };
    }
    var km = val(alea.choix(['0.5', '1.5', 2, '2.5', 4])), m = km.fois(1000), D3 = m.fois(p).divise(100);
    return {
      type: 'probleme',
      enonce: '<p>Sur une carte, on constate que, sur une distance horizontale de ' + tn(km) + ' km, la dénivellation ' + lieu + ' est de ' + tn(D3) + ' m.</p>' + FICTIF + '<p>Calcule la pente moyenne, en pour-cent.</p>',
      indice: 'Exprime d\'abord les deux longueurs dans la même unité. Puis : pente = dénivellation : distance horizontale.',
      reponse: { type: 'nombre', valeur: p, unite: '%' }, suffixe: '%',
      pieges: [{ valeur: D3.divise(km), message: 'Les deux longueurs doivent être dans la même unité : ' + tn(km) + ' km = ' + tn(m) + ' m.' }, { valeur: D3.divise(m), message: 'C\'est la pente sous forme décimale : écris-la en pour-cent.' }, { valeur: m.divise(D3), message: 'Tu as inversé la division : pente = dénivellation : distance horizontale.' }],
      etapes: [
        { texte: 'On exprime les longueurs dans la même unité.', calcul: hm(tn(km) + ' km = ' + tn(m) + ' m') },
        { texte: 'On divise la dénivellation par la distance horizontale.', calcul: hm(tn(D3) + ' : ' + tn(m) + ' = ' + tn(D3.divise(m))) },
        { texte: 'On écrit le résultat en pour-cent.', calcul: hm(tn(D3.divise(m)) + ' = ' + p + ' %') }
      ],
      verification: 'Une pente de ' + p + ' % : on monte de ' + p + ' m pour 100 m à l\'horizontale.',
      rubrique: R.penteTerrain,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: st(D3) + '/(' + st(km) + '*1000)*100' } }
    };
  }

  /** D3 — déterminer l'échelle d'une carte. */
  function genEchelleDeterminer(alea, d) {
    var n = alea.choix([10000, 25000, 50000, 100000, 200000]), cm = alea.choix([2, 3, 4, 5, 6, 8]);
    var km = val(cm * n).divise(100000);
    return {
      type: 'probleme',
      enonce: '<p>Sur une carte, une distance réelle de ' + tn(km) + ' km est représentée par une longueur de ' + cm + ' cm.</p>' + FICTIF + '<p>Quelle est l\'échelle de cette carte ?</p>',
      consigne: 'L\'échelle s\'écrit 1 : n. Écris seulement le nombre n.',
      prefixe: '1 :',
      indice: 'Échelle = longueur sur la carte divisée par la longueur réelle, dans la même unité. 1 km = ' + tn(100000) + ' cm.',
      reponse: { type: 'nombre', valeur: n },
      attenduHtml: hm('1 : ' + tn(n)),
      pieges: [{ valeur: km.fois(1000).divise(cm), message: 'Tu as converti en mètres : la longueur réelle doit être en centimètres, comme la longueur sur la carte (1 km = ' + tn(100000) + ' cm).' }, { valeur: km.divise(cm), message: 'Exprime les deux longueurs dans la même unité avant de diviser : 1 km = ' + tn(100000) + ' cm.' }, { valeur: km.fois(100000), message: 'C\'est la longueur réelle en centimètres : divise-la encore par ' + cm + ' pour savoir ce que représente 1 cm.' }],
      etapes: [
        { texte: 'On exprime la longueur réelle en centimètres.', calcul: hm(tn(km) + ' km = ' + tn(km.fois(100000)) + ' cm') },
        { texte: cm + ' cm sur la carte représentent ' + tn(km.fois(100000)) + ' cm en réalité. Pour 1 cm :', calcul: hm(tn(km.fois(100000)) + ' : ' + cm + ' = ' + tn(n)) },
        { texte: 'Échelle de la carte.', calcul: hm('1 : ' + tn(n)) }
      ],
      verification: 'Contrôle : 1 cm sur la carte représente ' + tn(n) + ' cm, soit ' + tn(val(n).divise(100000)) + ' km.',
      rubrique: R.echelle,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: st(km) + '*100000/' + cm } }
    };
  }

  /** D2 — déterminer un pourcentage (partie et tout). */
  function genPourcentageDeterminer(alea, d) {
    var T, p, n;
    do { T = alea.choix([20, 25, 40, 50, 80, 200, 250, 400]); p = alea.choix([10, 15, 20, 25, 30, 35, 40, 60, 75]); n = T * p / 100; } while (!Number.isInteger(n));
    var c = alea.choix([
      ['Dans un collège de ' + T + ' élèves, ' + n + ' viennent à vélo.', 'd\'élèves qui viennent à vélo'],
      ['Une salle de spectacle a ' + T + ' places ; ' + n + ' sont occupées.', 'de places occupées'],
      ['Un club compte ' + T + ' membres, dont ' + n + ' ont moins de 16 ans.', 'de membres de moins de 16 ans']
    ]);
    return {
      type: 'probleme',
      enonce: '<p>' + c[0] + '</p>' + FICTIF + '<p>Calcule le pourcentage ' + c[1] + '.</p>',
      indice: 'Divise la partie par le tout, puis écris le résultat sous la forme d\'une fraction de dénominateur 100.',
      reponse: { type: 'nombre', valeur: p, unite: '%' }, suffixe: '%',
      pieges: [{ valeur: n, message: 'C\'est la partie (' + n + ') : il faut la diviser par le tout (' + T + ').' }, { valeur: val(T).divise(n), message: 'Tu as inversé la division : pourcentage = partie : tout.' }, { valeur: val(n).divise(T), message: 'C\'est le facteur de proportionnalité sous forme décimale : écris-le en pour-cent.' }],
      etapes: [
        { texte: 'On divise la partie par le tout.', calcul: hm(n + ' : ' + T + ' = ' + tn(val(n).divise(T))) },
        { texte: 'On écrit le résultat en pour-cent.', calcul: hm(tn(val(n).divise(T)) + ' = ' + p + ' %') }
      ],
      verification: 'Contrôle : ' + hm(p + ' % de ' + T + ' = ' + T + ' : 100 · ' + p + ' = ' + n) + '.',
      rubrique: R.pourcentage,
      controle: { ops: 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: n + '/' + T + '*100' } }
    };
  }

  /** D4 — pourcentage de rabais à partir de deux prix. */
  function genRabais(alea, d) {
    var P = alea.choix([40, 50, 60, 80, 120, 150, 200]), r = alea.choix([10, 15, 20, 25, 30, 40]);
    var rabais = val(P * r).divise(100), Q = val(P).moins(rabais);
    var article = alea.choix(['Un sac à dos', 'Une paire de baskets', 'Un casque audio', 'Une veste']);
    return {
      type: 'probleme',
      enonce: '<p>' + article + ' coûte ' + tm(P) + '. Pendant les soldes, son prix est de ' + tm(Q) + '.</p>' + FICTIF + '<p>Calcule le pourcentage de rabais.</p>',
      indice: 'Calcule d\'abord le rabais en francs. Quelle part du prix de départ représente-t-il ?',
      reponse: { type: 'nombre', valeur: r, unite: '%' }, suffixe: '%',
      pieges: [{ valeur: 100 - r, message: 'C\'est le pourcentage du prix que l\'on paie encore : le rabais est le reste (100 % – ' + (100 - r) + ' %).' }, { valeur: rabais, message: 'C\'est le rabais en francs : divise-le par le prix de départ pour obtenir un pourcentage.' }, { valeur: rabais.divise(Q).fois(100), message: 'Le rabais se compare au prix de départ (' + tm(P) + '), pas au prix soldé.' }],
      etapes: [
        { texte: 'Rabais en francs.', calcul: hm(tn(P) + ' – ' + tn(Q) + ' = ' + tn(rabais)) },
        { texte: 'On divise par le prix de départ.', calcul: hm(tn(rabais) + ' : ' + P + ' = ' + tn(rabais.divise(P))) },
        { texte: 'On écrit le résultat en pour-cent.', calcul: hm(tn(rabais.divise(P)) + ' = ' + r + ' %') }
      ],
      verification: 'Contrôle : ' + hm(r + ' % de ' + P + ' = ' + tn(rabais)) + ', et ' + hm(P + ' – ' + tn(rabais) + ' = ' + tn(Q)) + '.',
      rubrique: R.pourcentage,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: '(' + P + '-' + st(Q) + ')/' + P + '*100' } }
    };
  }

  /** D2 à D4 (niveau 2) — débit : le calculer, calculer une durée (avec conversion), convertir. */
  function genDebit(alea, d) {
    if (d <= 2) {
      var V, t, q;
      do { V = alea.choix([12, 18, 24, 30, 45, 60]); t = alea.entier(2, 6); q = V / t; } while (!decimalesOk(q, 1));
      return {
        type: 'probleme',
        enonce: '<p>Un robinet remplit un arrosoir de ' + V + ' litres en ' + t + ' minutes.</p>' + FICTIF + '<p>Calcule le débit de ce robinet, en l/min.</p>',
        indice: 'Débit = volume divisé par la durée de l\'écoulement.',
        reponse: { type: 'nombre', valeur: val(V).divise(t), unite: 'l/min' }, suffixe: 'l/min',
        pieges: [{ valeur: V * t, message: 'Tu as multiplié : le débit est le quotient du volume par la durée.' }, { valeur: val(t).divise(V), message: 'Tu as inversé la division : débit = volume : durée.' }],
        etapes: [{ texte: 'Le débit est le volume écoulé en 1 minute.' }, { texte: 'On divise le volume par la durée.', calcul: hm('d = ' + V + ' : ' + t + ' = ' + tn(q) + ' l/min') }],
        verification: 'Contrôle : ' + hm(tn(q) + ' · ' + t + ' = ' + V) + ' litres.',
        rubrique: R.debit,
        controle: { ops: 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: V + '/' + t } }
      };
    }
    if (d === 3) {
      var m3, deb, duree;
      do { m3 = alea.choix([3, 6, 9, 12]); deb = alea.choix([20, 25, 30, 40, 50]); duree = m3 * 1000 / deb; } while (!Number.isInteger(duree));
      return {
        type: 'probleme',
        enonce: '<p>On remplit un bassin de ' + m3 + ' m³ avec un tuyau dont le débit est de ' + deb + ' l/min. (1 m³ = 1000 litres)</p>' + FICTIF + '<p>Calcule la durée du remplissage, en minutes.</p>',
        indice: 'Exprime d\'abord le volume en litres. Puis : durée = volume divisé par débit.',
        reponse: { type: 'nombre', valeur: duree, unite: 'min' }, suffixe: 'min',
        pieges: [{ valeur: val(m3).divise(deb), message: 'Convertis d\'abord le volume en litres : le débit est donné en litres par minute.' }, { valeur: m3 * 1000 * deb, message: 'Tu as multiplié : durée = volume : débit.' }],
        etapes: [
          { texte: 'On exprime le volume en litres.', calcul: hm(m3 + ' m³ = ' + tn(m3 * 1000) + ' l') },
          { texte: 'd = V : t, donc t = V : d.' },
          { texte: 'On divise.', calcul: hm('t = ' + tn(m3 * 1000) + ' : ' + deb + ' = ' + tn(duree) + ' min') }
        ],
        verification: 'Contrôle : ' + hm(deb + ' · ' + tn(duree) + ' = ' + tn(m3 * 1000)) + ' litres.',
        rubrique: R.debit,
        controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: m3 + '*1000/' + deb } }
      };
    }
    var ls = alea.choix([5, 10, 15, 20, 25, 50]), m3h = ls * 36 / 10;
    return {
      type: 'probleme',
      enonce: '<p>Une pompe a un débit de ' + ls + ' l/s. (1 m³ = 1000 litres)</p>' + FICTIF + '<p>Exprime ce débit en m³/h.</p>',
      indice: 'Combien de litres la pompe débite-t-elle en 1 heure (3600 secondes) ? Convertis ensuite en m³.',
      reponse: { type: 'nombre', valeur: m3h, unite: 'm³/h' }, suffixe: 'm³/h',
      pieges: [{ valeur: ls * 3600, message: 'C\'est le volume en litres écoulé en 1 heure : convertis-le en m³.' }, { valeur: val(ls * 60).divise(1000), message: 'Une heure compte 3600 secondes (60 · 60), pas 60.' }],
      etapes: [
        { texte: 'En 1 seconde : ' + ls + ' l. En 1 heure (3600 s) :', calcul: hm(ls + ' · 3600 = ' + tn(ls * 3600) + ' l') },
        { texte: 'On convertit en m³.', calcul: hm(tn(ls * 3600) + ' l = ' + tn(m3h) + ' m³') },
        { texte: 'Débit : ' + tn(m3h) + ' m³/h.' }
      ],
      verification: 'Contrôle : ' + hm(tn(m3h) + ' m³ = ' + tn(ls * 3600) + ' l') + ', et ' + hm(tn(ls * 3600) + ' : 3600 = ' + ls) + ' l/s.',
      rubrique: R.debit,
      controle: { ops: 3, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: ls + '*3600/1000' } }
    };
  }

  /* =====================================================================
   * C8 : diagrammes (circulaire, en barre, en colonnes)
   * ===================================================================== */
  var LOISIRS = ['sport', 'musique', 'lecture', 'jeux vidéo', 'dessin'];
  var REPARTITIONS = [[40, 30, 20, 10], [35, 25, 25, 15], [45, 30, 15, 10], [50, 20, 20, 10], [30, 30, 25, 15], [40, 25, 20, 15]];

  /** D1 à D3 — lire un diagramme en barre : pourcentage de la 1re partie (D1), d'une autre partie (D2), effectif (D3). */
  function genBarreLire(alea, d) {
    var cats = alea.melanger(LOISIRS).slice(0, 4), parts = alea.melanger(alea.choix(REPARTITIONS));
    var i = d <= 1 ? 0 : alea.entier(1, 3);
    var debut = 0;
    for (var k = 0; k < i; k++) debut += parts[k];
    var fin = debut + parts[i], total = alea.choix([20, 40, 60, 80, 200]);
    var effectif = total * parts[i] / 100;
    if (!Number.isInteger(effectif)) { total = 200; effectif = 2 * parts[i]; }
    var diagramme = O.svgBarre({ categories: cats, parts: parts, description: 'Diagramme en barre du loisir préféré' });
    var lettre = 'ABCD'.charAt(i);
    var etapes = [i === 0 ? { texte: 'La partie ' + lettre + ' (« ' + cats[i] + ' ») va de 0 % à ' + fin + ' %.', calcul: hm(parts[i] + ' %') }
      : { texte: 'La partie ' + lettre + ' (« ' + cats[i] + ' ») va de ' + debut + ' % à ' + fin + ' %.', calcul: hm(fin + ' – ' + debut + ' = ' + parts[i] + ' %') }];
    if (d >= 3) etapes.push({ texte: parts[i] + ' % de ' + total + ' élèves.', calcul: hm(total + ' : 100 · ' + parts[i] + ' = ' + effectif) });
    return {
      type: 'lecture',
      enonce: '<p>' + (d >= 3 ? 'On a demandé à ' + total + ' élèves leur loisir préféré.' : 'On a demandé à des élèves leur loisir préféré.') + ' Les réponses sont représentées par un diagramme en barre.</p>' + FICTIF + diagramme
        + '<p>' + (d >= 3 ? 'Combien d\'élèves ont choisi « ' + cats[i] + ' » ?' : 'Quel pourcentage des élèves a choisi « ' + cats[i] + ' » ?') + '</p>',
      indice: 'La longueur de chaque partie est proportionnelle au nombre de réponses. Lis sur la graduation où la partie commence et où elle se termine.',
      reponse: d >= 3 ? { type: 'nombre', valeur: effectif } : { type: 'nombre', valeur: parts[i], unite: '%' }, suffixe: d >= 3 ? '' : '%',
      pieges: d >= 3 ? [{ valeur: parts[i], message: 'C\'est le pourcentage : calcule ' + parts[i] + ' % de ' + total + ' élèves.' }, { valeur: total * fin / 100, message: 'La partie ne commence pas à 0 % : sa longueur est ' + fin + ' % – ' + debut + ' %.' }]
        : (i === 0 ? [] : [{ valeur: fin, message: 'Tu as lu où la partie se termine. Elle commence à ' + debut + ' % : sa longueur est ' + fin + ' – ' + debut + '.' }, { valeur: debut, message: 'Tu as lu où la partie commence. Elle se termine à ' + fin + ' % : sa longueur est ' + fin + ' – ' + debut + '.' }]),
      etapes: etapes,
      verification: 'Contrôle : les quatre parties font ensemble ' + hm(parts.join(' + ') + ' = 100') + ' %.',
      rubrique: R.diagrammes,
      controle: { ops: d >= 3 ? 3 : i === 0 ? 1 : 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: d >= 3 ? total + '*(' + fin + '-' + debut + ')/100' : fin + '-' + debut } }
    };
  }

  /** D3 — réaliser un diagramme en barre : longueur d'une partie. */
  function genBarreLongueur(alea, d) {
    var T, n, L, l;
    do { T = alea.choix([20, 40, 50, 80]); n = alea.entier(3, T - 5); L = alea.choix([10, 20]); l = n / T * L; } while (!decimalesOk(l, 1) || n * 2 === T || T === L);
    var cat = alea.choix(LOISIRS);
    return {
      type: 'probleme',
      enonce: '<p>Dans un sondage auprès de ' + T + ' élèves, ' + n + ' ont choisi « ' + cat + ' » comme loisir préféré. On représente les résultats par un diagramme en barre de ' + L + ' cm de long.</p>' + FICTIF + '<p>Quelle doit être la longueur, en centimètres, de la partie « ' + cat + ' » ?</p>',
      indice: 'Les longueurs des parties sont proportionnelles aux effectifs : la barre entière (' + L + ' cm) représente ' + T + ' élèves.',
      reponse: { type: 'nombre', valeur: val(n * L).divise(T), unite: 'cm' }, suffixe: 'cm',
      pieges: [{ valeur: val(n * 100).divise(T), message: 'C\'est le pourcentage : la barre mesure ' + L + ' cm, pas 100 cm.' }, { valeur: n, message: 'C\'est le nombre d\'élèves : il faut le transformer en longueur.' }, { valeur: val(T).divise(n).fois(L), message: 'Tu as inversé la division : la part est ' + n + ' : ' + T + '.' }],
      etapes: [
        { texte: 'Part des élèves qui ont choisi « ' + cat + ' ».', calcul: hm(n + ' : ' + T + ' = ' + tn(val(n).divise(T))) },
        { texte: 'On prend la même part de la longueur totale.', calcul: hm(tn(val(n).divise(T)) + ' · ' + L + ' = ' + tn(l) + ' cm') }
      ],
      verification: 'Contrôle : ' + hm(tn(l) + ' : ' + L + ' = ' + tn(val(n).divise(T))) + ', la même part que ' + n + ' élèves sur ' + T + '.',
      rubrique: R.diagrammes,
      controle: { ops: 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: n + '/' + T + '*' + L } }
    };
  }

  /** D4 — passer d'un diagramme en barre à un diagramme circulaire. */
  function genBarreVersCirculaire(alea, d) {
    var L = alea.choix([10, 12, 15, 18, 20]), l = alea.entier(2, L - 3), angle = l * 360 / L;
    var cat = alea.choix(LOISIRS);
    return {
      type: 'probleme',
      enonce: '<p>Dans un diagramme en barre de ' + L + ' cm de long, la partie « ' + cat + ' » mesure ' + l + ' cm. On veut représenter les mêmes données par un diagramme circulaire.</p><p>Quel angle, en degrés, faut-il dessiner pour le secteur « ' + cat + ' » ?</p>',
      indice: 'La barre entière correspond au disque entier : ' + L + ' cm correspondent à 360°.',
      reponse: { type: 'nombre', valeur: angle, unite: '°' }, suffixe: '°',
      pieges: [{ valeur: val(l * 100).divise(L), message: 'C\'est le pourcentage : un diagramme circulaire se dessine avec des angles (le disque entier fait 360°).' }, { valeur: val(L * 360).divise(l), message: 'Tu as inversé la division : la part est ' + l + ' : ' + L + '.' }, { valeur: l * 36, message: 'La barre mesure ' + L + ' cm, pas 10 cm : 1 cm correspond à 360° : ' + L + '.' }],
      etapes: [
        { texte: L + ' cm correspondent à 360°. Pour 1 cm :', calcul: hm('360 : ' + L + ' = ' + tn(val(360).divise(L)) + '°') },
        { texte: 'Pour ' + l + ' cm :', calcul: hm(l + ' · ' + tn(val(360).divise(L)) + ' = ' + tn(angle) + '°') }
      ],
      verification: 'Contrôle : la part est la même dans les deux diagrammes, ' + hm(l + ' : ' + L + ' = ' + tn(val(l).divise(L))) + ' et ' + hm(tn(angle) + ' : 360 = ' + tn(val(l).divise(L))) + '.',
      rubrique: R.diagrammes,
      controle: { ops: 2, xs: [], ys: [], coefs: [], calc: { genre: 'formule', formule: l + '/' + L + '*360' } }
    };
  }

  /* =====================================================================
   * C9 : fonction exponentielle (base 2) — reconnaître le graphique, y lire des valeurs
   * ===================================================================== */
  var CROISSANCES = [
    { intro: 'Le graphique montre le nombre de bactéries d\'une culture, en milliers, en fonction du temps.', titreX: 'temps (h)', titreY: 'milliers', qY: function (x) { return 'Combien de milliers de bactéries y a-t-il après ' + x + ' heures ?'; }, qX: function (y) { return 'Après combien d\'heures y a-t-il ' + y + ' milliers de bactéries ?'; }, qD: function (x) { return 'De combien de milliers le nombre de bactéries augmente-t-il entre ' + x + ' h et ' + (x + 1) + ' h ?'; }, uX: 'h', nomY: 'le nombre de milliers de bactéries' },
    { intro: 'Le graphique montre le nombre de vues d\'une vidéo, en centaines, en fonction du nombre de jours depuis sa publication.', titreX: 'jours', titreY: 'centaines de vues', qY: function (x) { return 'Combien de centaines de vues la vidéo a-t-elle après ' + x + ' jours ?'; }, qX: function (y) { return 'Après combien de jours la vidéo a-t-elle ' + y + ' centaines de vues ?'; }, qD: function (x) { return 'De combien de centaines le nombre de vues augmente-t-il entre le jour ' + x + ' et le jour ' + (x + 1) + ' ?'; }, uX: 'jours', nomY: 'le nombre de centaines de vues' },
    { intro: 'Le graphique montre la surface d\'un étang couverte par des lentilles d\'eau, en m², en fonction du nombre de semaines.', titreX: 'semaines', titreY: 'surface (m²)', qY: function (x) { return 'Quelle surface, en m², est couverte après ' + x + ' semaines ?'; }, qX: function (y) { return 'Après combien de semaines la surface couverte est-elle de ' + y + ' m² ?'; }, qD: function (x) { return 'De combien de m² la surface couverte augmente-t-elle entre la semaine ' + x + ' et la semaine ' + (x + 1) + ' ?'; }, uX: 'semaines', nomY: 'la surface couverte' }
  ];
  function graphiqueExpo(s, k) {
    var gy = k === 1 ? 2 : k === 2 ? 4 : 10;
    return { xmin: 0, xmax: 5, ymin: 0, ymax: 32 * k, gx: 1, gy: gy, lx: 1, ly: 2 * gy, titreX: s.titreX, titreY: s.titreY,
      courbes: [{ f: function (x) { return k * Math.pow(2, x); } }], description: 'Courbe qui monte de plus en plus vite' };
  }

  /** D1 — reconnaître le graphique d'une fonction exponentielle parmi trois. */
  function genExpoReconnaitre(alea, d) {
    var autres = alea.melanger([
      { c: { src: 'x^2' }, message: 'Ce graphique est une parabole (symétrique, en forme de U) : c\'est une fonction quadratique.' },
      { c: { src: O.srcAffine(alea.choix([1, 2]), alea.entier(0, 2)) }, message: 'Ce graphique est une droite : c\'est une fonction affine.' },
      { c: { src: 'x^3' }, message: 'Cette courbe passe sous l\'axe horizontal pour les x négatifs : c\'est une fonction cubique. Une fonction exponentielle reste au-dessus de l\'axe horizontal.' },
      { c: { f: function (x) { return 4 / x; } }, message: 'Ce graphique a deux branches séparées : c\'est une hyperbole (fonction homographique).' }
    ]).slice(0, 2);
    function g(c) { return O.graphiqueHtml({ xmin: -4, xmax: 4, ymin: -4, ymax: 12, gx: 1, gy: 1, lx: 2, ly: 2, courbes: [c], description: 'Courbe d\'une fonction dans un repère' }); }
    var choix = [{ h: g({ f: function (x) { return Math.pow(2, x); } }), juste: true, param: 'exponentielle' }].concat(autres.map(function (a) { return { h: g(a.c), juste: false, param: 'autre', message: a.message }; }));
    return {
      type: 'relier',
      enonce: '<p>Lequel de ces graphiques représente une fonction exponentielle ?</p>',
      indice: 'Le graphique d\'une fonction exponentielle reste au-dessus de l\'axe horizontal : presque plat d\'un côté, il monte de plus en plus vite de l\'autre.',
      reponse: { type: 'choix' }, choix: U.nommer(O.melanger(alea, choix), 'Graphique'), choixGraphiques: true,
      etapes: [{ texte: 'On cherche une courbe qui reste au-dessus de l\'axe horizontal, presque plate à gauche, et qui monte de plus en plus vite à droite.' }],
      verification: 'Ce n\'est ni une droite, ni une parabole (pas d\'axe de symétrie), ni une hyperbole (une seule branche).',
      rubrique: R.exponentielle,
      controle: { ops: 1, xs: [], ys: [], coefs: [], grad: [1, 1], calc: { genre: 'choix-cle', attendu: 'exponentielle' } }
    };
  }

  /** D2 (ordonnée), D3 (abscisse) — lire une valeur sur le graphique d'une croissance exponentielle. */
  function genExpoLire(alea, d) {
    var s = alea.choix(CROISSANCES), k = alea.choix([1, 2, 5]), x = alea.entier(2, 5), y = k * Math.pow(2, x);
    var ordonnee = d <= 2;
    return {
      type: 'lecture',
      enonce: '<p>' + s.intro + '</p>' + FICTIF + O.graphiqueHtml(graphiqueExpo(s, k)) + '<p>' + (ordonnee ? s.qY(x) : s.qX(y)) + '</p>',
      indice: ordonnee ? 'Pars de ' + x + ' sur l\'axe horizontal, monte jusqu\'à la courbe, puis lis la valeur sur l\'axe vertical.' : 'Pars de ' + y + ' sur l\'axe vertical, va horizontalement jusqu\'à la courbe, puis lis la valeur sur l\'axe horizontal.',
      reponse: ordonnee ? { type: 'nombre', valeur: y } : { type: 'nombre', valeur: x, unite: s.uX },
      suffixe: ordonnee ? '' : s.uX,
      pieges: ordonnee ? [{ valeur: k * 2 * x, message: 'Le graphique n\'est pas une droite : ' + s.nomY + ' n\'est pas proportionnel au temps. Lis la valeur sur la courbe.' }, { valeur: x, message: 'Tu as donné la valeur de l\'axe horizontal : la réponse se lit sur l\'axe vertical.' }]
        : [{ valeur: y, message: 'Tu as donné la valeur de l\'axe vertical : la réponse se lit sur l\'axe horizontal.' }, { valeur: val(y).divise(2 * k), message: 'Le graphique n\'est pas une droite : il n\'y a pas proportionnalité. Lis la valeur sur la courbe.' }],
      etapes: [{ texte: ordonnee ? 'De ' + x + ' sur l\'axe horizontal, on monte jusqu\'à la courbe et on lit l\'ordonnée.' : 'De ' + y + ' sur l\'axe vertical, on rejoint la courbe et on lit l\'abscisse.', calcul: hm(tc(x, y)) }],
      verification: 'Le point ' + hm(tc(x, y)) + ' est sur la courbe.',
      rubrique: R.exponentielle,
      controle: { ops: 1, xs: [x], ys: [y], coefs: [k], grad: [1, k === 1 ? 2 : k === 2 ? 4 : 10], calc: { genre: 'formule', formule: ordonnee ? k + '*Math.pow(2,' + x + ')' : 'Math.log2(' + y + '/' + k + ')' } }
    };
  }

  /** D4 — comparer deux augmentations lues sur le graphique (la croissance n'est pas régulière). */
  function genExpoDifference(alea, d) {
    var s = alea.choix(CROISSANCES), k = alea.choix([1, 2, 5]), x = alea.entier(2, 4);
    var y1 = k * Math.pow(2, x), y2 = 2 * y1;
    return {
      type: 'probleme',
      enonce: '<p>' + s.intro + '</p>' + FICTIF + O.graphiqueHtml(graphiqueExpo(s, k)) + '<p>' + s.qD(x) + '</p>',
      indice: 'Lis les deux valeurs sur la courbe, puis calcule leur différence.',
      reponse: { type: 'nombre', valeur: y2 - y1 },
      pieges: [{ valeur: y2, message: 'C\'est la valeur lue pour ' + (x + 1) + ' : on demande l\'augmentation, donc la différence entre les deux valeurs.' }, { valeur: y1 / 2, message: 'C\'est l\'augmentation de l\'intervalle précédent : ici, l\'augmentation n\'est pas la même à chaque fois (le graphique n\'est pas une droite).' }],
      etapes: [
        { texte: 'On lit les deux valeurs sur la courbe.', calcul: hm(tc(x, y1) + ' et ' + tc(x + 1, y2)) },
        { texte: 'On calcule la différence.', calcul: hm(y2 + ' – ' + y1 + ' = ' + (y2 - y1)) }
      ],
      verification: 'Entre ' + (x - 1) + ' et ' + x + ', l\'augmentation n\'était que de ' + (y1 / 2) + ' : la courbe monte de plus en plus vite, ce n\'est pas une droite.',
      rubrique: R.exponentielle,
      controle: { ops: 3, xs: [x, x + 1], ys: [y1, y2], coefs: [k], grad: [1, k === 1 ? 2 : k === 2 ? 4 : 10], calc: { genre: 'formule', formule: k + '*Math.pow(2,' + (x + 1) + ')-' + k + '*Math.pow(2,' + x + ')' } }
    };
  }

  /* =====================================================================
   * C10 : résoudre une équation par voie graphique, intersection de deux droites (FA 11.2)
   * ===================================================================== */
  function fenetre(courbes, description) { return { xmin: -6, xmax: 6, ymin: -8, ymax: 8, gx: 1, gy: 1, lx: 2, ly: 2, courbes: courbes, description: description }; }

  /** D1 — résoudre ax + b = c à l'aide du graphique de f(x) = ax + b. */
  function genResoudreGraphConst(alea, d) {
    var l, x0, c;
    do { l = { a: val(alea.choix([-2, -1, 1, 2, 3])), b: val(alea.entier(-4, 4)) }; x0 = alea.entierNonNul(-4, 4); c = image(l, x0); }
    while (Math.abs(c.valeur()) > 7 || c.egal(x0) || c.estZero() || O.estReference([U.sig(l)]));
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique de ' + hE(l, 'f') + '.</p>' + O.graphiqueHtml(fenetre([{ src: src(l), nom: 'f' }], 'Droite dans un repère')) + '<p>Utilise ce graphique pour résoudre l\'équation ' + hm(tx(src(l)) + ' = ' + tn(c)) + '.</p>',
      prefixe: 'x =',
      indice: 'Cherche le point de la droite dont l\'ordonnée est ' + tn(c) + ', puis lis son abscisse.',
      reponse: { type: 'nombre', valeur: x0 },
      attenduHtml: hm('x = ' + tn(x0)),
      pieges: [{ valeur: c, message: tn(c) + ' est la valeur de f(x) : la solution de l\'équation est l\'abscisse x du point.' }, { valeur: image(l, c), message: 'Tu as calculé l\'image de ' + tn(c) + ' : on cherche au contraire le nombre x dont l\'image est ' + tn(c) + '.' }],
      etapes: [{ texte: 'Sur la droite, le point d\'ordonnée ' + tn(c) + ' est ' + hm(tc(x0, c)) + ' : son abscisse est la solution.', calcul: hm('x = ' + tn(x0)) }],
      verification: 'Contrôle : ' + hm('f(' + tn(x0) + ') = ' + tn(l.a) + ' · ' + tnp(x0) + ' + ' + tnp(l.b) + ' = ' + tn(c)) + '.',
      rubrique: R.graphique,
      signatures: [U.sig(l)],
      controle: { ops: 1, xs: [x0], ys: [st(c)], coefs: [st(l.a), st(l.b)], grad: [1, 1], calc: { genre: 'formule', formule: '(' + st(c) + '-(' + st(l.b) + '))/(' + st(l.a) + ')' } }
    };
  }

  /** D2 — résoudre ax + b = cx + d à l'aide des graphiques de f et de g. */
  function genResoudreGraphDeux(alea, d) {
    var l1, l2, x0, y0, essais = 0;
    do {
      x0 = alea.entierNonNul(-4, 4); y0 = alea.entierNonNul(-5, 5);
      var a1 = alea.choix([-2, -1, 1, 2, 3]), a2 = alea.choix([-2, -1, 1, 2, 3]);
      l1 = { a: val(a1), b: val(y0 - a1 * x0) }; l2 = { a: val(a2), b: val(y0 - a2 * x0) };
      essais++;
    } while ((l1.a.egal(l2.a) || Math.abs(l1.b.valeur()) > 7 || Math.abs(l2.b.valeur()) > 7 || x0 === y0) && essais < 500);
    return {
      type: 'lecture',
      enonce: '<p>Voici les graphiques de ' + hE(l1, 'f') + ' et de ' + hE(l2, 'g') + '.</p>' + O.graphiqueHtml(fenetre([{ src: src(l1), nom: 'f' }, { src: src(l2), nom: 'g' }], 'Deux droites qui se coupent'))
        + '<p>Utilise ces graphiques pour résoudre l\'équation ' + hm(tx(src(l1)) + ' = ' + tx(src(l2))) + '.</p>',
      prefixe: 'x =',
      indice: 'L\'équation dit que f(x) = g(x) : cherche le point commun aux deux droites et lis son abscisse.',
      reponse: { type: 'nombre', valeur: x0 },
      attenduHtml: hm('x = ' + tn(x0)),
      pieges: [{ valeur: y0, message: 'Tu as donné l\'ordonnée du point d\'intersection : la solution de l\'équation est son abscisse.' }],
      etapes: [
        { texte: 'Les deux droites se coupent au point ' + hm(tc(x0, y0)) + ' : pour cette valeur de x, f(x) = g(x).' },
        { texte: 'La solution de l\'équation est l\'abscisse de ce point.', calcul: hm('x = ' + tn(x0)) }
      ],
      verification: 'Contrôle : ' + hm('f(' + tn(x0) + ') = ' + tn(image(l1, x0))) + ' et ' + hm('g(' + tn(x0) + ') = ' + tn(image(l2, x0))) + '.',
      rubrique: R.graphique,
      controle: { ops: 2, xs: [x0], ys: [y0], coefs: [st(l1.a), st(l1.b), st(l2.a), st(l2.b)], grad: [1, 1], calc: { genre: 'formule', formule: '((' + st(l2.b) + ')-(' + st(l1.b) + '))/((' + st(l1.a) + ')-(' + st(l2.a) + '))' } }
    };
  }

  /** D4 (niveau 2) — résoudre x² = px + q à l'aide de la parabole et de la droite. */
  function genEquation2Graph(alea, d) {
    var r1, r2;
    do { r1 = alea.entier(-3, 2); r2 = alea.entier(r1 + 1, 3); } while (r1 * r2 === 0 && r1 + r2 === 0);
    var p = r1 + r2, q = -r1 * r2, l = { a: val(p), b: val(q) };
    var g = { xmin: -4, xmax: 4, ymin: -4, ymax: 10, gx: 1, gy: 1, lx: 1, ly: 2, courbes: [{ src: 'x^2' }, { src: src(l), nom: 'g' }], description: 'Une parabole et une droite qui se coupent en deux points' };
    return {
      type: 'lecture',
      enonce: '<p>Voici la parabole qui représente ' + hS('x^2', 'f') + ' et la droite qui représente ' + hE(l, 'g') + '.</p>' + O.graphiqueHtml(g) + '<p>Utilise ces graphiques pour résoudre l\'équation ' + hm('x² = ' + tx(src(l))) + '.</p>',
      consigne: 'Écris les deux solutions, de la plus petite à la plus grande, séparées par un point-virgule.',
      indice: 'L\'équation dit que f(x) = g(x) : cherche les points communs à la parabole et à la droite, et lis leurs abscisses.',
      reponse: { type: 'liste', valeurs: [r1, r2], noms: ['la plus petite', 'la plus grande'] },
      pieges: [{ liste: [r2, r1], message: 'Les deux solutions sont justes, mais écris-les de la plus petite à la plus grande.' }, { liste: [Math.min(r1 * r1, r2 * r2), Math.max(r1 * r1, r2 * r2)], message: 'Tu as donné les ordonnées des points d\'intersection : les solutions de l\'équation sont leurs abscisses.' }],
      etapes: [
        { texte: 'La parabole et la droite se coupent en deux points.', calcul: hm(tc(r1, r1 * r1) + ' et ' + tc(r2, r2 * r2)) },
        { texte: 'Les solutions sont les abscisses de ces points.', calcul: hm('x = ' + tn(r1) + ' ou x = ' + tn(r2)) }
      ],
      verification: 'Contrôle : ' + hm(tnp(r1) + '² = ' + (r1 * r1) + ' et g(' + tn(r1) + ') = ' + tn(image(l, r1))) + ' ; ' + hm(tnp(r2) + '² = ' + (r2 * r2) + ' et g(' + tn(r2) + ') = ' + tn(image(l, r2))) + '.',
      rubrique: R.graphique,
      controle: { ops: 2, xs: [r1, r2], ys: [r1 * r1, r2 * r2], coefs: [p, q], grad: [1, 1], calc: { genre: 'racines', a: 1, b: -p, c: -q } }
    };
  }

  /* =====================================================================
   * C11 (niveau 2) : croissance et décroissance d'une fonction
   * ===================================================================== */
  var DEF_CROISSANCE = 'Une fonction est croissante si f(x) augmente quand x augmente (sa courbe monte de gauche à droite) ; elle est décroissante si f(x) diminue quand x augmente.';

  /** D1 — fonction affine : croissante ou décroissante, selon le signe de la pente. */
  function genCroissanceAffine(alea, d) {
    var a = alea.entierNonNul(-5, 5), b = alea.entier(1, 9) * (a > 0 ? -1 : 1), l = { a: val(a), b: val(b) };
    var choix = [
      { h: 'croissante, car la pente est positive', juste: a > 0, message: 'La pente est ' + tn(a) + ' : elle est négative, f(x) diminue quand x augmente.' },
      { h: 'décroissante, car la pente est négative', juste: a < 0, message: 'La pente est ' + tn(a) + ' : elle est positive, f(x) augmente quand x augmente.' },
      { h: 'croissante, car l\'ordonnée à l\'origine est positive', juste: false, message: 'L\'ordonnée à l\'origine dit seulement où la droite coupe l\'axe vertical. C\'est le signe de la pente qui indique si la fonction est croissante ou décroissante.' },
      { h: 'décroissante, car l\'ordonnée à l\'origine est négative', juste: false, message: 'L\'ordonnée à l\'origine dit seulement où la droite coupe l\'axe vertical. C\'est le signe de la pente qui indique si la fonction est croissante ou décroissante.' }
    ];
    return {
      type: 'choix',
      enonce: '<p>On donne ' + hE(l, 'f', U.fleche(alea)) + '.</p><p>La fonction f est…</p>',
      indice: DEF_CROISSANCE,
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'La pente est a = ' + tn(a) + ' : quand x augmente de 1, f(x) ' + (a > 0 ? 'augmente' : 'diminue') + ' de ' + Math.abs(a) + '.' },
        { texte: 'La droite ' + (a > 0 ? 'monte de gauche à droite : la fonction est croissante.' : 'descend de gauche à droite : la fonction est décroissante.') }
      ],
      verification: 'Contrôle : ' + hm('f(0) = ' + tn(b) + ' et f(1) = ' + tn(a + b)) + '.',
      rubrique: R.pente,
      controle: { ops: 1, xs: [], ys: [], coefs: [a, b], calc: { genre: 'choix' } }
    };
  }

  /** D2 — lire sur une parabole pour quelles valeurs de x la fonction est croissante (ou décroissante). */
  function genCroissanceParabole(alea, d) {
    var a = alea.choix([1, -1]), h = alea.entierNonNul(-3, 3), k = alea.entier(-4, 4) * (a > 0 ? 1 : 1);
    if (a > 0 && k > 2) k = -k;
    if (a < 0 && k < -2) k = -k;
    var quoi = alea.choix(['croissante', 'décroissante']);
    var aDroite = (a > 0) === (quoi === 'croissante');
    var source = (a === 1 ? '' : '-') + '(x' + (h > 0 ? '-' + h : '+' + (-h)) + ')^2' + (k ? (k > 0 ? '+' : '') + k : '');
    var choix = [
      { h: 'pour x ≥ ' + tn(h), juste: aDroite, message: 'Regarde la courbe à droite du sommet : elle ' + (a > 0 ? 'monte' : 'descend') + '.' },
      { h: 'pour x ≤ ' + tn(h), juste: !aDroite, message: 'Regarde la courbe à gauche du sommet : elle ' + (a > 0 ? 'descend' : 'monte') + '.' },
      { h: 'pour toutes les valeurs de x', juste: false, message: 'La courbe change de sens au sommet : elle ' + (a > 0 ? 'descend puis monte.' : 'monte puis descend.') },
      { h: 'pour aucune valeur de x', juste: false, message: 'La courbe change de sens au sommet : elle ' + (a > 0 ? 'descend puis monte.' : 'monte puis descend.') }
    ];
    var g = fenetre([{ src: source }], 'Parabole dans un repère');
    g.points = [{ x: h, y: k, nom: 'S' }];
    return {
      type: 'lecture',
      enonce: '<p>Voici le graphique d\'une fonction f. Le sommet de la parabole est ' + hm('S' + tc(h, k)) + '.</p>' + O.graphiqueHtml(g) + '<p>Pour quelles valeurs de x la fonction f est-elle ' + quoi + ' ?</p>',
      indice: DEF_CROISSANCE,
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [
        { texte: 'On parcourt la courbe de gauche à droite : elle ' + (a > 0 ? 'descend jusqu\'au sommet S, puis elle monte.' : 'monte jusqu\'au sommet S, puis elle descend.') },
        { texte: 'La fonction est ' + quoi + ' là où la courbe ' + (quoi === 'croissante' ? 'monte' : 'descend') + ' : ' + (aDroite ? 'à droite du sommet, pour x ≥ ' + tn(h) : 'à gauche du sommet, pour x ≤ ' + tn(h)) + '.' }
      ],
      verification: '',
      rubrique: R.graphique,
      controle: { ops: 2, xs: [h], ys: [k], coefs: [a, h, k], grad: [1, 1], calc: { genre: 'choix' } }
    };
  }

  /** D3 — vrai ou faux : croissance lue dans un tableau de valeurs. */
  function genCroissanceTableau(alea, d) {
    var forme = alea.choix(['croissante', 'decroissante', 'mixte', 'mixte']);
    var x0 = alea.entier(-3, 0), xs = [0, 1, 2, 3, 4].map(function (i) { return x0 + i; });
    var y = alea.entier(-6, 3), ys = [y], cassure = alea.entier(1, 3);
    for (var i = 1; i < 5; i++) {
      var pas = alea.entier(1, 4);
      var monte = forme === 'croissante' ? true : forme === 'decroissante' ? false : i <= cassure;
      y += monte ? pas : -pas; ys.push(y);
    }
    var dit = alea.choix(['croissante', 'décroissante']);
    var vrai = (forme === 'croissante' && dit === 'croissante') || (forme === 'decroissante' && dit === 'décroissante');
    // première colonne où f(x) va dans le mauvais sens
    var j = 1;
    while (j < 5 && ((ys[j] > ys[j - 1]) === (dit === 'croissante'))) j++;
    var contre = j < 5 ? 'entre x = ' + tn(xs[j - 1]) + ' et x = ' + tn(xs[j]) + ', f(x) ' + (dit === 'croissante' ? 'diminue' : 'augmente') + ' (de ' + tn(ys[j - 1]) + ' à ' + tn(ys[j]) + ').' : '';
    return {
      type: 'vraifaux',
      enonce: '<p>Voici un tableau de valeurs d\'une fonction f.</p>' + O.tableauHtml([{ entete: 'x', valeurs: xs }, { entete: 'f(x)', valeurs: ys }]) + '<p>« D\'après ce tableau, f est ' + dit + ' pour x allant de ' + tn(xs[0]) + ' à ' + tn(xs[4]) + '. » Vrai ou faux ?</p>',
      indice: DEF_CROISSANCE + ' Compare chaque valeur de f(x) à la précédente.',
      reponse: { type: 'choix' }, choix: O.optionsVraiFaux(alea, {
        vrai: vrai,
        justeVrai: 'd\'une colonne à la suivante, f(x) ' + (dit === 'croissante' ? 'augmente' : 'diminue') + ' chaque fois.',
        justeFaux: contre,
        autresVrai: ['les valeurs de x augmentent d\'une colonne à la suivante.', 'la dernière valeur de f(x) est ' + (ys[4] > ys[0] ? 'plus grande' : 'plus petite') + ' que la première.'],
        autresFaux: ['le tableau contient des nombres négatifs.', 'f(x) ne change pas toujours du même nombre.'],
        messageFaux: 'Il faut comparer chaque valeur de f(x) à la précédente : la fonction est ' + dit + ' seulement si f(x) ' + (dit === 'croissante' ? 'augmente' : 'diminue') + ' chaque fois.'
      }),
      etapes: [
        { texte: 'On regarde comment f(x) change d\'une colonne à la suivante.', calcul: hm(ys.slice(1).map(function (v, n) { return (v - ys[n] > 0 ? '+ ' : '– ') + Math.abs(v - ys[n]); }).join(' ; ')) },
        { texte: vrai ? 'f(x) ' + (dit === 'croissante' ? 'augmente' : 'diminue') + ' chaque fois : l\'affirmation est vraie.' : 'L\'affirmation est fausse : ' + contre }
      ],
      verification: '',
      rubrique: R.tableau,
      controle: { ops: 2, xs: xs, ys: ys, coefs: [], calc: { genre: 'vf-monotone', ys: ys, dit: dit === 'croissante' ? 1 : -1 } }
    };
  }

  /** D4 — parmi plusieurs fonctions, laquelle est croissante (ou décroissante) pour toutes les valeurs de x ? */
  function genCroissanceFamilles(alea, d) {
    var a = alea.entier(2, 5), b = alea.entier(1, 9), quoi = alea.choix(['croissante', 'décroissante']);
    var affineC = { h: hS(O.srcAffine(a, -b)), sens: 1, pourquoi: 'fonction affine de pente positive (' + a + ') : elle est croissante partout.' };
    var affineD = { h: hS(O.srcAffine(-a, b)), sens: -1, pourquoi: 'fonction affine de pente négative (– ' + a + ') : elle est décroissante partout.' };
    var cubeC = { h: hS('x^3'), sens: 1, pourquoi: 'fonction cubique : sa courbe monte de gauche à droite, elle est croissante partout.' };
    var expo = { h: U.ecrire('2<sup>x</sup>'), sens: 1, pourquoi: 'fonction exponentielle : sa courbe monte de gauche à droite, elle est croissante partout.' };
    var cubeD = { h: hS('-x^3'), sens: -1, pourquoi: 'sa courbe descend de gauche à droite : elle est décroissante partout.' };
    var carre = { h: hS(U.srcQuad(1, 0, -b)), sens: 0, pourquoi: 'fonction quadratique : sa parabole descend puis monte, elle change de sens au sommet.' };
    var carreN = { h: hS(U.srcQuad(-1, 0, b)), sens: 0, pourquoi: 'fonction quadratique : sa parabole monte puis descend, elle change de sens au sommet.' };
    var constante = { h: hS(String(b)), sens: 0, pourquoi: 'fonction affine constante : f(x) ne change pas, elle n\'est ni croissante ni décroissante.' };
    var juste = quoi === 'croissante' ? alea.choix([affineC, cubeC, expo]) : alea.choix([affineD, cubeD]);
    var autres = alea.melanger((quoi === 'croissante' ? [affineD, cubeD] : [affineC, cubeC, expo]).concat([carre, carreN, constante])).slice(0, 3);
    var choix = [{ h: juste.h, juste: true, message: '' }].concat(autres.map(function (o) { return { h: o.h, juste: false, message: 'Cette fonction ne convient pas : ' + o.pourquoi }; }));
    return {
      type: 'choix',
      enonce: '<p>Laquelle de ces fonctions est ' + quoi + ' pour toutes les valeurs de x ?</p>',
      indice: DEF_CROISSANCE + ' Pense à la forme du graphique de chaque fonction.',
      reponse: { type: 'choix' }, choix: O.melanger(alea, choix),
      etapes: [{ texte: 'La bonne réponse : ' + juste.pourquoi }].concat(autres.map(function (o) { return { texte: o.h + ' : ' + o.pourquoi }; })),
      verification: '',
      rubrique: R.graphique,
      controle: { ops: 4, xs: [], ys: [], coefs: [a, b], calc: { genre: 'choix' } }
    };
  }

  /* ---------- objectifs ---------- */
  var T = 'FA 11.3';
  var objectifs = [
    { id: 'C7', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Proportionnalité : échelle, pourcentage, pente, vitesse moyenne, masse volumique (niveau 2 : débit)',
      modeles: [
        { type: 'directe', dMin: 1, dMax: 1, gen: genVitesse11 },
        { type: 'directe', dMin: 1, dMax: 3, gen: genMasseVolumique },
        { type: 'probleme', dMin: 2, dMax: 2, gen: genPourcentageDeterminer },
        { type: 'probleme', dMin: 2, dMax: 3, gen: genPentePourcent },
        { type: 'probleme', dMin: 2, dMax: 4, gen: genDebit, niveaux: [2] },
        { type: 'probleme', dMin: 3, dMax: 3, gen: genVitesse11 },
        { type: 'probleme', dMin: 3, dMax: 3, gen: genEchelleDeterminer },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genVitesseConversion },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genRabais }
      ] },
    { id: 'C8', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Lire et réaliser un diagramme circulaire, en barre ou en colonnes',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 3, gen: genBarreLire },
        { type: 'lecture', dMin: 1, dMax: 1, gen: B.gens.genLireBarres },
        { type: 'lecture', dMin: 2, dMax: 2, gen: B.gens.genLireCirculaire },
        { type: 'probleme', dMin: 3, dMax: 3, gen: genBarreLongueur },
        { type: 'probleme', dMin: 3, dMax: 3, gen: B.gens.genAngleSecteur },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genBarreVersCirculaire },
        { type: 'probleme', dMin: 4, dMax: 4, gen: B.gens.genCompleterCirculaire },
        { type: 'erreur', dMin: 4, dMax: 4, gen: B.gens.genErreurDiagramme }
      ] },
    { id: 'C9', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: T, titre: 'Fonction exponentielle : reconnaître son graphique et y lire des valeurs',
      modeles: [
        { type: 'relier', dMin: 1, dMax: 1, gen: genExpoReconnaitre },
        { type: 'lecture', dMin: 2, dMax: 3, gen: genExpoLire },
        { type: 'probleme', dMin: 4, dMax: 4, gen: genExpoDifference }
      ] },
    { id: 'C10', module: 'C', annee: 11, niveaux: [1, 2], statut: 'evalue', theme: 'FA 11.2', titre: 'Résoudre une équation par voie graphique, intersection de deux droites (niveau 2 : équation du deuxième degré)',
      modeles: [
        { type: 'lecture', dMin: 1, dMax: 1, gen: genResoudreGraphConst },
        { type: 'lecture', dMin: 2, dMax: 2, gen: genResoudreGraphDeux },
        { type: 'lecture', dMin: 3, dMax: 3, gen: B.gens.genIntersectionGraphique },
        { type: 'directe', dMin: 4, dMax: 4, gen: B.gens.genIntersectionAlgebrique },
        { type: 'directe', dMin: 4, dMax: 4, gen: B.gens.genIntersectionLireCalculer },
        { type: 'lecture', dMin: 4, dMax: 4, gen: genEquation2Graph, niveaux: [2] }
      ] },
    { id: 'C11', module: 'C', annee: 11, niveaux: [2], statut: 'evalue', theme: T, titre: 'Croissance et décroissance d\'une fonction (compréhension)',
      modeles: [
        { type: 'choix', dMin: 1, dMax: 1, gen: genCroissanceAffine },
        { type: 'lecture', dMin: 2, dMax: 2, gen: genCroissanceParabole },
        { type: 'vraifaux', dMin: 3, dMax: 3, gen: genCroissanceTableau },
        { type: 'choix', dMin: 4, dMax: 4, gen: genCroissanceFamilles }
      ] }
  ];

  return { objectifs: objectifs };
});
