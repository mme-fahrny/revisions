/*
 * nombres/js/apercu.js — aperçu pour l'enseignante
 * -------------------------------------------------
 * Affiche, pour un module, un niveau et une difficulté, UN exemple de chaque modèle
 * de question de chaque objectif, avec la réponse attendue, les rétroactions, l'indice
 * et la correction. Utilise les vrais générateurs (Nombres.creerQuestion) : l'aperçu
 * reste donc à jour quand l'appli change. Page non liée depuis l'accueil des élèves.
 */
(function (global) {
  'use strict';
  var N = global.Nombres, O = N.Outils, H = O.H, V = global.NombresVisuels, doc = global.document;

  var etat = { module: 'A', niveau: 1, difficulte: 1 };
  var NOMS_ANNEE = { 9: '9e', 10: '10e', 11: '11e' };
  var DIFFICULTES = [1, 2, 3, 4];

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
  function echapper(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function maths(h) { return '<span class="maths">' + h + '</span>'; }
  function liste(t) { return t.length > 1 ? t.slice(0, -1).join(', ') + ' et ' + t[t.length - 1] : String(t[0]); }

  /* ---------- Disponibilité d'un modèle (mêmes règles que Nombres.creerQuestion) ---------- */
  function contexte(o, niveau, p) { return { annee: o.annee, niveau: niveau, palier: p }; }
  function estActif(o, m, niveau, p) {
    return (!m.palierMin || p >= m.palierMin) && (!m.si || !!m.si(contexte(o, niveau, p), p));
  }
  /** Phrase « proposé seulement… » pour un modèle absent aux réglages choisis. */
  function raisonAbsence(o, m) {
    var ici = DIFFICULTES.filter(function (p) { return estActif(o, m, etat.niveau, p); });
    if (ici.length) {
      var suite = ici.every(function (p, i) { return p === ici[0] + i; });
      if (suite && ici[ici.length - 1] === 4) return ici.length === 1 ? 'proposé seulement en difficulté 4' : 'proposé seulement dès la difficulté ' + ici[0];
      if (suite && ici[0] === 1) return ici.length === 1 ? 'proposé seulement en difficulté 1' : 'proposé seulement jusqu\'à la difficulté ' + ici[ici.length - 1];
      return 'proposé seulement en difficulté ' + liste(ici);
    }
    var autre = etat.niveau === 1 ? 2 : 1;
    var la = DIFFICULTES.filter(function (p) { return o.niveaux.indexOf(autre) >= 0 && estActif(o, m, autre, p); });
    if (la.length) return 'proposé seulement au niveau ' + autre + (la.length === 4 ? '' : ' (difficulté ' + liste(la) + ')');
    return 'jamais proposé en ' + NOMS_ANNEE[o.annee] + ' (réservé à la révision par une autre année)';
  }
  /** Nom du générateur, pour désigner un modèle sans ambiguïté. */
  function nomModele(m) {
    var r = /return\s+(?:[A-Za-z0-9_]+\.)*([A-Za-z0-9_]+)\s*\(/.exec(String(m.gen));
    return r ? r[1] : '';
  }

  /* ---------- Écriture d'une mauvaise réponse ---------- */
  function htmlValeur(q, v) {
    var r = q.reponse, f = O.val(v);
    if (r.type === 'montant') return H.chf(f);
    if (r.type === 'coloriage') return f.estEntier() ? String(f.num) + ' part' + (f.num > 1n ? 's' : '') + ' coloriée' + (f.num > 1n ? 's' : '') : H.f(f);
    if (r.forme === 'scientifique') return H.sci(f);
    if (r.forme === 'decimal' || r.forme === 'entier' || r.forme === 'sciOuNombre') return H.n(f);
    return H.f(f);
  }
  function htmlPiege(q, pg) {
    var r = q.reponse;
    try {
      if (pg.valeur !== undefined) return maths(htmlValeur(q, pg.valeur));
      if (pg.exposant !== undefined && r.forme === 'puissance') {
        return maths(typeof r.base === 'string' ? r.base + O.Maths.texteExposant(pg.exposant) : H.pui(r.base, pg.exposant));
      }
      if (pg.racine) return maths(pg.racine[1] === 1 ? String(pg.racine[0]) : H.rac(pg.racine[1], 2, pg.racine[0] === 1 ? undefined : pg.racine[0]));
    } catch (e) { /* cas décrit sans valeur ci-dessous */ }
    return '';
  }

  /** Liste des rétroactions d'une question à réponse saisie. */
  function retroactions(q) {
    var lignes = [], vus = {};
    var attendu = q.reponse.valeur !== undefined && q.reponse.type !== 'coloriage' ? q.reponse.valeur : null;
    (q.pieges || []).forEach(function (pg) {
      if (!pg.message) return;
      if (pg.valeur !== undefined && attendu) {
        var v = O.val(pg.valeur);
        if (v.egal(attendu)) return;                 // même valeur que la réponse attendue : jamais affichée
        var cle = v.toString();
        if (vus[cle]) return;                         // seule la première rétroaction d'une valeur est affichée
        vus[cle] = true;
      }
      var h = htmlPiege(q, pg);
      lignes.push(h ? '<b>Si l\'élève répond ' + h + '</b> : ' + pg.message
        : '<b>Erreur reconnue par l\'appli</b> (plusieurs réponses possibles) : ' + pg.message);
    });
    // réponses de bonne valeur mais de forme non conforme, et listes rangées à l'envers
    var messages = {};
    try {
      (q.exemples().faux || []).forEach(function (t) {
        var res = q.verifier(t);
        var inverse = q.reponse.type === 'liste' && /ordre inverse/.test(res.message || '');
        if ((res.statut !== 'forme' && !inverse) || messages[res.message]) return;
        messages[res.message] = true;
        lignes.push('<b>Si l\'élève répond ' + maths(echapper(t)) + '</b>' + (res.statut === 'forme' ? ' (forme non conforme)' : '') + ' : ' + res.message);
      });
    } catch (e) { /* pas d'exemple pour ce type de réponse */ }
    return lignes;
  }

  /** Réponse attendue, sans l'unité quand elle est déjà affichée à côté du champ. */
  function htmlAttendu(q) {
    var h = q.attenduHtml || '';
    if (!h) {
      try {
        var ex = q.exemples();
        if (ex && ex.justes && ex.justes.length) h = 'par exemple ' + maths(echapper(ex.justes[0]));
      } catch (e) { /* rien */ }
    }
    if (q.suffixe) {
      var fin = [O.NBSP + q.suffixe, ' ' + q.suffixe];
      for (var i = 0; i < fin.length; i++) {
        if (h.length > fin[i].length && h.slice(-fin[i].length) === fin[i]) { h = h.slice(0, -fin[i].length); break; }
      }
      // montant écrit « CHF 13.50 » alors que « francs » figure à côté du champ
      if (q.reponse.type === 'montant') h = h.replace(/^CHF[\s\u00a0]+/, '');
    }
    return h;
  }

  /** Une question du modèle m seul (mêmes règles que dans une série). */
  function tirer(o, m) {
    var seul = Object.create(o);
    seul.modeles = [m];
    return N.creerQuestion(seul, new O.Maths.Alea(), N.palier(etat.difficulte, etat.niveau), contexte(o, etat.niveau, N.palier(etat.difficulte, etat.niveau)), {}, false);
  }

  function carte(o, m, numero, repli) {
    var art = el('article', { 'class': 'q-apercu' });
    function remplir() {
      art.textContent = '';
      var q;
      try { q = tirer(o, m); } catch (e) {
        art.appendChild(el('p', { 'class': 'erreur-apercu', texte: 'Erreur du générateur : ' + e.message }));
        return;
      }
      var nom = nomModele(m);
      art.appendChild(el('div', { 'class': 'meta-apercu' }, [
        el('span', { 'class': 'no', texte: String(numero) }),
        el('span', { 'class': 'type', texte: q.typeTexte || q.type }),
        nom ? el('code', { 'class': 'nom-modele', texte: nom }) : null,
        el('button', { type: 'button', 'class': 'bouton-discret', texte: 'Autre exemple', onclick: remplir })
      ]));
      if (repli) art.appendChild(el('p', { 'class': 'absent', texte: 'Modèle de repli : aucun modèle de cet objectif n\'est prévu à cette difficulté, l\'appli utilise donc celui-ci.' }));
      art.appendChild(el('div', { 'class': 'enonce', html: q.enonce }));
      if (q.visuel) {
        try {
          var compte = q.reponse.type === 'coloriage' ? el('p', { 'class': 'compte-coloriage', texte: '0 part coloriée sur ' + q.visuel.parts }) : null;
          var vis = V.creer(q.visuel, { surChangement: function (n) { if (compte) compte.textContent = n + ' part' + (n > 1 ? 's' : '') + ' coloriée' + (n > 1 ? 's' : '') + ' sur ' + q.visuel.parts; } });
          var cadre = el('div', { 'class': 'zone-visuel' + (q.visuel.aide ? ' visuel-aide' : ''), 'data-visuel': q.visuel.type }, [vis.element]);
          if (q.visuel.aide) cadre.insertBefore(el('p', { 'class': 'petit', texte: 'Aide facultative : tu peux colorier le disque pour t\'aider.' }), vis.element);
          art.appendChild(cadre);
          if (compte) art.appendChild(compte);
        } catch (e) { art.appendChild(el('p', { 'class': 'erreur-apercu', texte: 'Outil visuel : ' + e.message })); }
      }
      if (q.consigne) art.appendChild(el('p', { 'class': 'consigne', html: q.consigne }));
      if (q.mode === 'choix') {
        var ol = el('ol', { 'class': 'choix-apercu', type: 'A' });
        q.choix.forEach(function (c) {
          ol.appendChild(el('li', { 'class': c.juste ? 'ok' : 'ko' }, [
            el('div', { html: c.h }),
            c.juste ? el('p', { 'class': 'fb ok', html: 'Bonne réponse' + (c.message ? ' — ' + c.message : '') })
              : el('p', { 'class': 'fb', html: 'Rétroaction : ' + (c.message || 'Ce n\'est pas la bonne réponse. <i>(message par défaut : aucune rétroaction propre à ce choix)</i>') })
          ]));
        });
        art.appendChild(ol);
      } else {
        var att = htmlAttendu(q);
        var note = '';
        if (q.reponse.type === 'coloriage') note = ' <span class="note-suffixe">(l\'élève répond en coloriant la figure : n\'importe quelles parts conviennent)</span>';
        else if (q.suffixe) note = ' <span class="note-suffixe">(l\'unité « ' + echapper(q.suffixe) + ' » est déjà affichée à côté du champ : l\'élève n\'écrit que le nombre)</span>';
        art.appendChild(el('p', { 'class': 'attendu', html: '<b>Réponse attendue</b> ' + (att ? maths(att) : '(voir la correction)') + note }));
        var lignes = retroactions(q);
        if (lignes.length) {
          var ul = el('ul', { 'class': 'pieges-apercu' });
          lignes.forEach(function (h) { ul.appendChild(el('li', { html: h })); });
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
      if (q.visuelCorrection) {
        try { det.appendChild(el('div', { 'class': 'zone-visuel', 'data-visuel': q.visuelCorrection.type }, [V.creer(q.visuelCorrection, {}).element])); }
        catch (e) { det.appendChild(el('p', { 'class': 'erreur-apercu', texte: 'Outil visuel : ' + e.message })); }
      }
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
    var mod = N.MODULES.filter(function (m) { return m.id === etat.module; })[0];
    var p = N.palier(etat.difficulte, etat.niveau);
    doc.getElementById('titre-apercu').textContent = 'Module ' + mod.id + ' – ' + mod.titre + ' · niveau ' + etat.niveau + ' · difficulté ' + etat.difficulte;
    var objectifs = N.objectifs.filter(function (o) { return o.module === etat.module && o.niveaux.indexOf(etat.niveau) >= 0; });
    var numero = 0;
    [9, 10, 11].forEach(function (annee) {
      var liste = objectifs.filter(function (o) { return o.annee === annee; });
      if (!liste.length) return;
      sommaire.appendChild(el('a', { href: '#annee-' + annee, texte: NOMS_ANNEE[annee] + ' (' + liste.length + ' objectif' + (liste.length > 1 ? 's' : '') + ')' }));
      var section = el('section', { id: 'annee-' + annee }, [el('h2', { texte: 'Objectifs de ' + NOMS_ANNEE[annee] })]);
      liste.forEach(function (o) {
        var plusLoin = etat.niveau === 1 && (o.plusLoinN1 || []).indexOf(o.annee) >= 0;
        section.appendChild(el('div', { 'class': 'objectif-apercu' }, [
          el('h3', { texte: o.titre }),
          el('p', { 'class': 'etiquettes' }, [
            el('span', { 'class': 'etiquette', texte: o.id }),
            o.theme ? el('span', { 'class': 'etiquette', texte: o.theme }) : null,
            el('span', { 'class': 'etiquette', texte: o.niveaux.length === 2 ? 'niveaux 1 et 2' : 'niveau ' + o.niveaux[0] + ' seulement' }),
            plusLoin ? el('span', { 'class': 'etiquette etiquette-plus-loin', texte: 'Pour aller plus loin (non compté)' }) : null
          ])
        ]));
        var actifs = o.modeles.filter(function (m) { return estActif(o, m, etat.niveau, p); });
        // même repli que l'appli : sans modèle prévu, elle prend ceux qui n'ont pas de condition « si »
        var replis = actifs.length ? [] : o.modeles.filter(function (m) { return !m.si; });
        o.modeles.forEach(function (m) {
          var repli = replis.indexOf(m) >= 0;
          if (actifs.indexOf(m) < 0 && !repli) {
            var nom = nomModele(m);
            section.appendChild(el('p', { 'class': 'absent' }, [
              'Modèle « ' + (N.TYPES[m.type] || m.type) + ' » ',
              nom ? el('code', { 'class': 'nom-modele', texte: nom }) : null,
              ' : ' + raisonAbsence(o, m) + '.'
            ]));
            return;
          }
          numero++;
          section.appendChild(carte(o, m, numero, repli));
        });
      });
      zone.appendChild(section);
    });
    if (!numero) zone.appendChild(el('p', { 'class': 'absent', texte: 'Aucun objectif pour ce module et ce niveau.' }));
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

  boutons('module', N.MODULES.map(function (m) { return { valeur: m.id, texte: m.id + ' – ' + m.titre }; }));
  boutons('niveau', [{ valeur: 1, texte: 'Niveau 1' }, { valeur: 2, texte: 'Niveau 2' }]);
  boutons('difficulte', DIFFICULTES.map(function (d) { return { valeur: d, texte: String(d) }; }));
  doc.getElementById('tout-retirer').addEventListener('click', afficher);
  afficher();
})(typeof globalThis !== 'undefined' ? globalThis : this);
