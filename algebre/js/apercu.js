/*
 * algebre/js/apercu.js — aperçu pour l'enseignante
 * -------------------------------------------------
 * Affiche, pour un module, un niveau et une difficulté, UN exemple de chaque modèle
 * de question de chaque objectif, avec la réponse attendue, les rétroactions, l'indice
 * et la correction. Utilise les vrais générateurs (Algebre.creerQuestion) : l'aperçu
 * reste donc à jour quand l'appli change. Page non liée depuis l'accueil des élèves.
 */
(function (global) {
  'use strict';
  var A = global.Algebre, O = A.Outils, V = global.AlgebreVisuels, doc = global.document;

  var etat = { module: 'A', niveau: 1, difficulte: 1 };
  var NOMS_ANNEE = { 9: '9e', 10: '10e', 11: '11e' };

  function el(nom, attrs, enfants) {
    var e = doc.createElement(nom);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'texte') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'onclick') e.addEventListener('click', attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (enfants || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return e;
  }

  function htmlPiege(pg) {
    try {
      if (pg.src !== undefined) return O.hx(pg.src);
      if (pg.valeur !== undefined) return O.hn(pg.valeur);
    } catch (e) { /* affichage brut ci-dessous */ }
    return '<span class="maths">' + O.echapper(String(pg.src !== undefined ? pg.src : pg.valeur)) + '</span>';
  }

  function htmlAttendu(q) {
    if (q.attenduHtml) return q.attenduHtml;
    try {
      var ex = q.exemples();
      if (ex && ex.justes && ex.justes.length) return 'par exemple <span class="maths">' + O.echapper(ex.justes[0]) + '</span>';
    } catch (e) { /* rien */ }
    return '';
  }

  /** Une question du modèle m seul (mêmes règles que dans une série). */
  function tirer(o, m) {
    var seul = Object.create(o);
    seul.modeles = [m];
    return A.creerQuestion(seul, new O.Maths.Alea(), etat.difficulte, { annee: o.annee, niveau: etat.niveau }, {}, false);
  }

  function carte(o, m, numero) {
    var art = el('article', { 'class': 'q-apercu' });
    function remplir() {
      art.textContent = '';
      var q;
      try { q = tirer(o, m); } catch (e) {
        art.appendChild(el('p', { 'class': 'erreur-apercu', texte: 'Erreur du générateur : ' + e.message }));
        return;
      }
      art.appendChild(el('div', { 'class': 'meta-apercu' }, [
        el('span', { 'class': 'no', texte: String(numero) }),
        el('span', { 'class': 'type', texte: q.typeTexte || q.type }),
        el('button', { type: 'button', 'class': 'bouton-discret', texte: 'Autre exemple', onclick: remplir })
      ]));
      art.appendChild(el('div', { 'class': 'enonce', html: q.enonce }));
      if (q.visuel) {
        try { art.appendChild(el('div', { 'class': 'zone-visuel', 'data-visuel': q.visuel.type }, [V.creer(q.visuel, {}).element])); }
        catch (e) { art.appendChild(el('p', { 'class': 'erreur-apercu', texte: 'Outil visuel : ' + e.message })); }
      }
      if (q.consigne) art.appendChild(el('p', { 'class': 'consigne', html: q.consigne }));
      if (q.mode === 'choix') {
        var ol = el('ol', { 'class': 'choix-apercu', type: 'A' });
        q.choix.forEach(function (c) {
          ol.appendChild(el('li', { 'class': c.juste ? 'ok' : 'ko' }, [
            el('div', { html: c.h }),
            c.juste ? el('p', { 'class': 'fb ok', html: 'Bonne réponse' + (c.message ? ' — ' + c.message : '') })
              : (c.message ? el('p', { 'class': 'fb', html: 'Rétroaction : ' + c.message }) : null)
          ]));
        });
        art.appendChild(ol);
      } else {
        var att = htmlAttendu(q);
        art.appendChild(el('p', { 'class': 'attendu', html: '<b>Réponse attendue</b> ' + (att || '(voir la correction)') + (q.suffixe ? ' <span class="note-suffixe">(l\'unité « ' + O.echapper(q.suffixe) + ' » est déjà affichée à côté du champ : l\'élève n\'écrit que le nombre)</span>' : '') }));
        var pieges = (q.pieges || []).filter(function (pg) { return pg.message; });
        if (pieges.length) {
          var ul = el('ul', { 'class': 'pieges-apercu' });
          pieges.forEach(function (pg) { ul.appendChild(el('li', { html: '<b>Si l\'élève répond ' + htmlPiege(pg) + '</b> : ' + pg.message })); });
          art.appendChild(ul);
        }
      }
      var det = el('details', {}, [el('summary', { texte: 'Indice, correction et renvoi' })]);
      if (q.indice) det.appendChild(el('p', { html: '<b>Indice</b> : ' + q.indice }));
      var etapes = el('ol', { 'class': 'etapes' });
      (q.etapes || []).forEach(function (e) {
        etapes.appendChild(el('li', {}, [
          el('span', { 'class': 'etape-titre', texte: e.titre + ' ' }),
          el('span', { 'class': 'etape-texte', html: e.texte }),
          e.calcul ? el('div', { 'class': 'etape-calcul', html: e.calcul }) : null
        ]));
      });
      det.appendChild(etapes);
      if (q.verification) det.appendChild(el('p', { 'class': 'verification', html: q.verification }));
      if (q.rubrique) det.appendChild(el('p', { 'class': 'renvoi', texte: 'Voir l\'aide-mémoire, rubrique « ' + q.rubrique + ' ».' }));
      art.appendChild(det);
    }
    remplir();
    return art;
  }

  function afficher() {
    var zone = doc.getElementById('apercu'), sommaire = doc.getElementById('sommaire');
    zone.textContent = ''; sommaire.textContent = '';
    var mod = A.MODULES.filter(function (m) { return m.id === etat.module; })[0];
    doc.getElementById('titre-apercu').textContent = 'Module ' + mod.id + ' – ' + mod.titre + ' · niveau ' + etat.niveau + ' · difficulté ' + etat.difficulte;
    var objectifs = A.objectifs.filter(function (o) { return o.module === etat.module && o.niveaux.indexOf(etat.niveau) >= 0; });
    var numero = 0;
    [9, 10, 11].forEach(function (annee) {
      var liste = objectifs.filter(function (o) { return o.annee === annee; });
      if (!liste.length) return;
      sommaire.appendChild(el('a', { href: '#annee-' + annee, texte: NOMS_ANNEE[annee] + ' (' + liste.length + ' objectifs)' }));
      var section = el('section', { id: 'annee-' + annee }, [el('h2', { texte: 'Objectifs de ' + NOMS_ANNEE[annee] })]);
      liste.forEach(function (o) {
        var plusLoin = etat.niveau === 1 && (o.plusLoinN1 || []).length;
        section.appendChild(el('div', { 'class': 'objectif-apercu' }, [
          el('h3', { texte: o.titre }),
          el('p', { 'class': 'etiquettes' }, [
            el('span', { 'class': 'etiquette', texte: o.id }),
            el('span', { 'class': 'etiquette', texte: o.niveaux.length === 2 ? 'niveaux 1 et 2' : 'niveau ' + o.niveaux[0] + ' seulement' }),
            plusLoin ? el('span', { 'class': 'etiquette etiquette-plus-loin', texte: 'Pour aller plus loin (non compté)' }) : null
          ])
        ]));
        o.modeles.forEach(function (m) {
          var actif = (!m.dMin || etat.difficulte >= m.dMin) && (!m.dMax || etat.difficulte <= m.dMax);
          if (!actif) {
            section.appendChild(el('p', { 'class': 'absent', texte: 'Modèle « ' + (A.TYPES[m.type] || m.type) + ' » : proposé seulement ' + (m.dMin ? 'dès la difficulté ' + m.dMin : 'jusqu\'à la difficulté ' + m.dMax) + '.' }));
            return;
          }
          numero++;
          section.appendChild(carte(o, m, numero));
        });
      });
      zone.appendChild(section);
    });
  }

  function boutons(groupe, valeurs) {
    var conteneur = doc.querySelector('[data-groupe="' + groupe + '"]');
    valeurs.forEach(function (v) {
      var b = el('button', { type: 'button', 'aria-pressed': String(etat[groupe] === v.valeur), texte: v.texte, onclick: function () {
        etat[groupe] = v.valeur;
        Array.prototype.forEach.call(conteneur.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        afficher();
      } });
      conteneur.appendChild(b);
    });
  }

  boutons('module', A.MODULES.map(function (m) { return { valeur: m.id, texte: m.id + ' – ' + m.titre }; }));
  boutons('niveau', [{ valeur: 1, texte: 'Niveau 1' }, { valeur: 2, texte: 'Niveau 2' }]);
  boutons('difficulte', [1, 2, 3, 4].map(function (d) { return { valeur: d, texte: String(d) }; }));
  doc.getElementById('tout-retirer').addEventListener('click', afficher);
  afficher();
})(typeof globalThis !== 'undefined' ? globalThis : this);
