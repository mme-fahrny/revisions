/*
 * algebre/js/app.js — interface de l'appli « Calcul littéral et équations » (navigateur)
 * --------------------------------------------------------------------------------------
 * Écrans : modules et outils -> réglages (objectifs, difficulté) -> questions -> bilan ;
 *          outils libres (tuiles, balance, machine à substituer).
 * La logique (questions, vérification, rétroactions) est dans catalogue.js et les modules.
 * Progression : localStorage « revisions.algebre.progression » (réussites par objectif,
 * aucune donnée personnelle), lu et écrit dans des try/catch.
 */
(function (global) {
  'use strict';

  var A = global.Algebre, Profil = global.Profil, Clavier = global.Clavier, V = global.AlgebreVisuels;
  var Maths = global.Maths, P = global.AlgebrePoly, O = global.AlgebreOutils;
  var CLE_PROGRESSION = 'revisions.algebre.progression';
  var CLE_REGLAGES = 'revisions.algebre.reglages';
  var NIVEAUX_DIFFICULTE = { 1: 'Échauffement', 2: 'Standard', 3: 'Costaud', 4: 'Expert' };
  var DESCRIPTIONS_DIFFICULTE = ['',
    'Exercices de base : une lettre, nombres positifs, une ou deux étapes.',
    'Nombres négatifs, parenthèses simples, deux ou trois étapes.',
    'Parenthèses, inconnue des deux côtés, trois ou quatre étapes.',
    'Niveau de fin d\'année : les exercices les plus exigeants de ton année.'];

  var etat = { ecran: 'modules', module: null, difficulte: 2, choisis: null, serie: [], index: 0, resultats: [], repondu: false, clavier: null, visuel: null, choix: null };

  /* ---------- Outils ---------- */
  function $(sel) { return document.querySelector(sel); }
  function el(nom, attrs, enfants) {
    var n = document.createElement(nom);
    for (var k in attrs || {}) {
      if (k === 'texte') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    }
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === 'string' ? document.createTextNode(e) : e); });
    return n;
  }
  function lireStockage(cle) { try { var t = global.localStorage.getItem(cle); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function ecrireStockage(cle, v) { try { global.localStorage.setItem(cle, JSON.stringify(v)); } catch (e) { /* stockage indisponible : on continue */ } }
  function progression() { return lireStockage(CLE_PROGRESSION) || {}; }
  function enregistrerResultat(objectif, juste) {
    var p = progression();
    var o = p[objectif] || { essais: 0, reussites: 0 };
    o.essais++; if (juste) o.reussites++;
    p[objectif] = o;
    ecrireStockage(CLE_PROGRESSION, p);
  }
  function racine() { return $('#appli'); }
  function vider() {
    if (etat.clavier) { try { etat.clavier.detruire(); } catch (e) { /* rien */ } etat.clavier = null; }
    var r = racine(); r.innerHTML = ''; return r;
  }
  function focusTitre() {
    var h = racine().querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    global.scrollTo(0, 0);
  }
  function moduleInfo(id) { return A.MODULES.filter(function (m) { return m.id === id; })[0]; }
  function tactile() { return !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches); }

  /* ---------- Écran 1 : modules et outils ---------- */
  function ecranModules() {
    etat.ecran = 'modules';
    var r = vider();
    var profil = Profil.get();
    if (!profil) {
      r.appendChild(el('div', { 'class': 'retour info' }, [
        el('p', {}, [el('strong', { texte: 'Choisis d\'abord ton année et ton niveau.' })]),
        el('p', { texte: 'Les questions s\'adaptent à ce choix ; il reste enregistré sur cet appareil seulement.' }),
        el('button', { type: 'button', 'class': 'bouton', texte: 'Choisir mon année et mon niveau', onclick: function () { Profil.ouvrir(); } })
      ]));
      return;
    }
    r.appendChild(el('h2', { texte: 'Choisis un module' }));
    r.appendChild(el('p', { 'class': 'intro', texte: 'Séries de 10 questions, sans calculatrice. Un indice est disponible, chaque réponse est corrigée étape par étape.' }));
    var p = progression();
    var liste = el('ul', { 'class': 'grille-cartes modules' });
    A.MODULES.forEach(function (m) {
      var dispo = A.objectifsPour(m.id, profil);
      if (!dispo.length) {
        liste.appendChild(el('li', {}, [el('div', { 'class': 'carte-module carte-inactive', 'data-module-inactif': m.id }, [
          el('span', { 'class': 'carte-module-titre', texte: m.id + ' – ' + m.titre }),
          el('span', { 'class': 'carte-module-texte', texte: m.description }),
          el('span', { 'class': 'carte-module-info', texte: 'Au programme à partir de la ' + m.debut + 'e.' })
        ])]));
        return;
      }
      var courants = dispo.filter(function (d) { return d.statut === 'courant'; }).length;
      var essais = 0, reussites = 0;
      dispo.forEach(function (d) { var o = p[d.objectif.id]; if (o) { essais += o.essais; reussites += o.reussites; } });
      liste.appendChild(el('li', {}, [el('button', { type: 'button', 'class': 'carte-module', 'data-module': m.id, onclick: function () { etat.module = m.id; etat.choisis = null; ecranReglages(); } }, [
        el('span', { 'class': 'carte-module-titre', texte: m.id + ' – ' + m.titre }),
        el('span', { 'class': 'carte-module-texte', texte: m.description }),
        el('span', { 'class': 'carte-module-info', texte: (courants ? courants + ' objectif' + (courants > 1 ? 's' : '') + ' de ta ' + profil.annee + 'e' : 'Révision') + ' · ' + dispo.length + ' en tout' + (essais ? ' · ' + reussites + ' / ' + essais + ' réussies jusqu\'ici' : '') })
      ])]));
    });
    r.appendChild(liste);

    r.appendChild(el('h2', { 'class': 'titre-outils', texte: 'Outils pour comprendre' }));
    var outils = el('ul', { 'class': 'grille-cartes modules' });
    [
      { id: 'tuiles', titre: 'Tuiles algébriques', texte: 'Visualiser la réduction (termes semblables) et la multiplication (aire d\'un rectangle).' },
      { id: 'balance', titre: 'Balance des équations', texte: 'Appliquer la même opération aux deux membres, puis vérifier la solution.', min: 10 },
      { id: 'machine', titre: 'Machine à substituer', texte: 'Faire varier la valeur des lettres et voir la valeur de l\'expression changer.' }
    ].forEach(function (o) {
      if (o.min && profil.annee < o.min) return;
      outils.appendChild(el('li', {}, [el('button', { type: 'button', 'class': 'carte-module carte-outil', 'data-outil': o.id, onclick: function () { ecranOutil(o.id); } }, [
        el('span', { 'class': 'carte-module-titre', texte: o.titre }),
        el('span', { 'class': 'carte-module-texte', texte: o.texte })
      ])]));
    });
    r.appendChild(outils);
    r.appendChild(el('p', { 'class': 'petit', texte: 'Profil actuel : ' + Profil.texte() + '. Les objectifs des années précédentes restent disponibles en révision.' }));
  }

  /* ---------- Écran 2 : réglages ---------- */
  function ecranReglages() {
    etat.ecran = 'reglages';
    var profil = Profil.get();
    if (!profil) { ecranModules(); return; }
    var r = vider();
    var m = moduleInfo(etat.module);
    var dispo = A.objectifsPour(etat.module, profil);
    if (!dispo.length) { ecranModules(); return; }
    var reg = lireStockage(CLE_REGLAGES) || {};
    if (reg.difficulte) etat.difficulte = reg.difficulte;
    var choisis = etat.choisis || A.selectionParDefaut(etat.module, profil);
    var p = progression();
    r.appendChild(el('p', {}, [el('button', { type: 'button', 'class': 'bouton-discret', texte: '← Modules et outils', onclick: ecranModules })]));
    r.appendChild(el('h2', { texte: 'Module ' + m.id + ' – ' + m.titre }));
    var form = el('form', { 'class': 'reglages', novalidate: 'novalidate' });
    [{ statut: 'courant', titre: 'Objectifs de ta ' + profil.annee + 'e (niveau ' + profil.niveau + ')' }, { statut: 'revision', titre: 'Révision des années précédentes' }].forEach(function (g) {
      var items = dispo.filter(function (d) { return d.statut === g.statut; });
      if (!items.length) return;
      var fs = el('fieldset', { 'class': 'groupe-objectifs groupe-' + g.statut }, [el('legend', { texte: g.titre })]);
      items.forEach(function (d) {
        var o = d.objectif, idc = 'obj-' + o.id, pr = p[o.id];
        var box = el('input', { type: 'checkbox', id: idc, value: o.id, name: 'objectif' });
        if (choisis.indexOf(o.id) >= 0) box.checked = true;
        fs.appendChild(el('label', { 'for': idc, 'class': 'objectif' }, [box, el('span', { 'class': 'objectif-texte' }, [
          el('span', { 'class': 'objectif-titre', texte: o.titre }),
          el('span', { 'class': 'objectif-info', texte: o.annee + 'e · ' + o.theme + (o.niveaux.length === 1 ? ' · niveau 2' : '') + (pr ? ' · ' + pr.reussites + ' / ' + pr.essais + ' réussies' : '') })
        ])]));
      });
      form.appendChild(fs);
    });
    form.appendChild(el('div', { 'class': 'actions actions-petites' }, [
      el('button', { type: 'button', 'class': 'bouton-discret', texte: 'Tout cocher', onclick: function () { form.querySelectorAll('input[name=objectif]').forEach(function (b) { b.checked = true; }); } }),
      el('button', { type: 'button', 'class': 'bouton-discret', texte: 'Tout décocher', onclick: function () { form.querySelectorAll('input[name=objectif]').forEach(function (b) { b.checked = false; }); } })
    ]));
    var curseur = el('input', { type: 'range', min: '1', max: '4', step: '1', value: String(etat.difficulte), id: 'difficulte', 'aria-describedby': 'difficulte-texte' });
    var texteDiff = el('p', { id: 'difficulte-texte', 'class': 'difficulte-texte' });
    function majDiff() {
      var d = Number(curseur.value);
      texteDiff.textContent = 'Difficulté ' + d + ' sur 4 : ' + NIVEAUX_DIFFICULTE[d] + '. ' + DESCRIPTIONS_DIFFICULTE[d] + (profil.niveau === 2 ? ' (Au niveau 2, des objectifs supplémentaires sont proposés.)' : '');
    }
    curseur.addEventListener('input', majDiff);
    majDiff();
    form.appendChild(el('div', { 'class': 'bloc-difficulte' }, [
      el('label', { 'for': 'difficulte', texte: 'Difficulté' }),
      el('div', { 'class': 'curseur-ligne' }, [el('span', { texte: '1', 'aria-hidden': 'true' }), curseur, el('span', { texte: '4', 'aria-hidden': 'true' })]),
      texteDiff
    ]));
    var message = el('p', { 'class': 'message-erreur', role: 'alert' });
    form.appendChild(message);
    form.appendChild(el('div', { 'class': 'actions' }, [el('button', { type: 'submit', 'class': 'bouton', id: 'commencer', texte: 'Commencer la série de 10 questions' })]));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ids = Array.prototype.map.call(form.querySelectorAll('input[name=objectif]:checked'), function (b) { return b.value; });
      if (!ids.length) { message.textContent = 'Coche au moins un objectif.'; return; }
      etat.choisis = ids;
      etat.difficulte = Number(curseur.value);
      ecrireStockage(CLE_REGLAGES, { difficulte: etat.difficulte });
      demarrerSerie(A.creerSerie({ module: etat.module, profil: profil, difficulte: etat.difficulte, objectifs: ids }));
    });
    r.appendChild(form);
    focusTitre();
  }

  /* ---------- Écran 3 : questions ---------- */
  function demarrerSerie(questions) {
    etat.serie = questions; etat.index = 0; etat.resultats = [];
    afficherQuestion();
  }

  function afficherQuestion() {
    etat.ecran = 'question';
    etat.repondu = false; etat.choix = null; etat.visuel = null;
    var q = etat.serie[etat.index];
    var r = vider();
    var total = etat.serie.length;
    r.appendChild(el('div', { 'class': 'question-entete' }, [
      el('p', { 'class': 'avancement', texte: 'Question ' + (etat.index + 1) + ' / ' + total }),
      el('div', { 'class': 'barre-avancement', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(etat.index), 'aria-label': 'Avancement de la série' }, [el('span', { style: 'width:' + (100 * etat.index / total) + '%' })])
    ]));
    r.appendChild(el('p', { 'class': 'etiquettes' }, [
      el('span', { 'class': 'etiquette', texte: q.typeTexte }),
      el('span', { 'class': 'etiquette etiquette-objectif', texte: q.objectifTitre }),
      q.statut === 'revision' ? el('span', { 'class': 'etiquette', texte: 'Révision' }) : null
    ]));
    var carte = el('section', { 'class': 'question', 'aria-labelledby': 'titre-question' });
    carte.appendChild(el('h2', { id: 'titre-question', 'class': 'visuellement-cache', texte: 'Question ' + (etat.index + 1) }));
    carte.appendChild(el('div', { 'class': 'enonce', html: q.enonce }));
    if (q.visuel) {
      var vis = V.creer(q.visuel, {});
      etat.visuel = vis;
      carte.appendChild(el('div', { 'class': 'zone-visuel', 'data-visuel': q.visuel.type }, [vis.element]));
    }
    if (q.consigne) carte.appendChild(el('p', { 'class': 'consigne', html: q.consigne }));
    var zone = el('div', { 'class': 'zone-reponse' });
    carte.appendChild(zone);
    if (q.mode === 'choix') {
      var fs = el('fieldset', { 'class': 'choix-reponses' }, [el('legend', { 'class': 'visuellement-cache', texte: 'Réponses possibles' })]);
      q.choix.forEach(function (c, i) {
        var input = el('input', { type: 'radio', name: 'reponse-choix', id: 'choix-' + i, value: String(i) });
        input.addEventListener('change', function () { etat.choix = i; });
        fs.appendChild(el('label', { 'for': 'choix-' + i, 'class': 'option' }, [input, el('span', { html: c.h })]));
      });
      zone.appendChild(fs);
    } else {
      var ligne = el('div', { 'class': 'ligne-champ' });
      var champ = el('input', { type: 'text', id: 'reponse', 'class': 'champ maths', 'aria-label': 'Ta réponse', autocomplete: 'off' });
      ligne.appendChild(champ);
      if (q.suffixe) ligne.appendChild(el('span', { 'class': 'suffixe', texte: q.suffixe }));
      zone.appendChild(ligne);
      var conteneurClavier = el('div', { 'class': 'conteneur-clavier' });
      zone.appendChild(conteneurClavier);
      etat.clavier = Clavier.creer({ champ: champ, conteneur: conteneurClavier, disposition: q.clavier || 'complet', barreOblique: 'fraction', onValider: function () { valider(); } });
    }
    var retour = el('div', { id: 'retour', 'class': 'retour', role: 'status', 'aria-live': 'polite' });
    var zoneIndice = el('div', { id: 'zone-indice', 'class': 'aide-memoire', hidden: 'hidden' }, [el('p', {}, [el('strong', { texte: 'Indice : ' }), el('span', { html: q.indice })])]);
    carte.appendChild(el('div', { 'class': 'actions', id: 'actions-question' }, [
      el('button', { type: 'button', 'class': 'bouton', id: 'verifier', texte: 'Vérifier', onclick: valider }),
      el('button', { type: 'button', 'class': 'bouton-secondaire', id: 'bouton-indice', texte: 'Afficher un indice', onclick: function () { zoneIndice.hidden = false; this.disabled = true; } })
    ]));
    carte.appendChild(zoneIndice);
    carte.appendChild(retour);
    carte.appendChild(el('div', { id: 'correction' }));
    r.appendChild(carte);
    r.appendChild(el('p', { 'class': 'petit' }, [el('button', { type: 'button', 'class': 'bouton-discret', texte: 'Arrêter la série', onclick: function () { if (etat.resultats.length) ecranBilan(); else ecranReglages(); } })]));
    focusTitre();
    var champFocus = $('#reponse');
    if (champFocus && !tactile() && !q.visuel) champFocus.focus({ preventScroll: true });
  }

  function texteReponse(q) {
    if (q.mode === 'choix') return etat.choix === null ? '' : String(etat.choix);
    var c = $('#reponse');
    return c ? c.value : '';
  }

  function valider() {
    if (etat.repondu) return;
    var q = etat.serie[etat.index];
    var retour = $('#retour');
    var res;
    try { res = q.verifier(texteReponse(q)); } catch (e) {
      if (global.console) console.error(e);
      res = { juste: false, statut: 'illisible', message: 'Réponse illisible : vérifie ta saisie.' };
    }
    if (res.statut === 'illisible') {
      retour.className = 'retour info';
      retour.innerHTML = '';
      retour.appendChild(el('p', {}, [el('strong', { texte: 'À corriger : ' }), el('span', { texte: res.message })]));
      return;
    }
    etat.repondu = true;
    etat.resultats.push({ q: q, juste: res.juste, statut: res.statut });
    enregistrerResultat(q.objectif, res.juste);
    if (etat.clavier) etat.clavier.element.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    var champ = $('#reponse'); if (champ) champ.readOnly = true;
    racine().querySelectorAll('.choix-reponses input').forEach(function (b) { b.disabled = true; });
    if (q.mode === 'choix') {
      racine().querySelectorAll('.choix-reponses .option').forEach(function (lab, i) {
        if (q.choix[i].juste) lab.classList.add('option-juste');
        else if (i === etat.choix) lab.classList.add('option-fausse');
      });
    }
    $('#verifier').hidden = true;
    $('#bouton-indice').hidden = true;
    retour.className = 'retour ' + (res.juste ? 'juste' : 'faux');
    retour.innerHTML = '';
    if (res.juste) retour.appendChild(el('p', {}, [el('strong', { texte: 'Juste !' }), res.message ? el('span', { texte: ' ' + res.message }) : null]));
    else {
      retour.appendChild(el('p', {}, [el('strong', { texte: res.statut === 'forme' ? 'Forme non conforme. ' : 'Pas tout à fait. ' }), el('span', { texte: res.message })]));
      if (q.attenduHtml && q.mode !== 'choix') retour.appendChild(el('p', {}, [el('span', { texte: 'Réponse attendue : ' }), el('span', { 'class': 'maths', html: q.attenduHtml })]));
    }
    afficherCorrection(q, !res.juste);
    var suivant = el('button', { type: 'button', 'class': 'bouton', id: 'suivant', texte: etat.index + 1 < etat.serie.length ? 'Question suivante' : 'Voir le bilan', onclick: function () {
      etat.index++;
      if (etat.index < etat.serie.length) afficherQuestion(); else ecranBilan();
    } });
    $('#actions-question').appendChild(suivant);
    suivant.focus({ preventScroll: true });
  }

  function afficherCorrection(q, ouvert) {
    var details = el('details', { 'class': 'correction' });
    if (ouvert) details.open = true;
    details.appendChild(el('summary', { texte: 'Correction détaillée' }));
    var ol = el('ol', { 'class': 'etapes' });
    q.etapes.forEach(function (e) {
      ol.appendChild(el('li', {}, [
        el('span', { 'class': 'etape-titre', texte: e.titre }),
        el('span', { 'class': 'etape-texte', html: e.texte }),
        e.calcul ? el('span', { 'class': 'etape-calcul', html: e.calcul }) : null
      ]));
    });
    details.appendChild(ol);
    if (q.verification) details.appendChild(el('p', { 'class': 'verification', html: q.verification }));
    if (q.rubrique) details.appendChild(el('p', { 'class': 'renvoi', texte: 'Voir l\'aide-mémoire, rubrique « ' + q.rubrique + ' ».' }));
    $('#correction').appendChild(details);
  }

  /* ---------- Écran 4 : bilan ---------- */
  function ecranBilan() {
    etat.ecran = 'bilan';
    var r = vider();
    var reussis = etat.resultats.filter(function (x) { return x.juste; }).length;
    r.appendChild(el('h2', { texte: 'Bilan de la série' }));
    r.appendChild(el('p', { 'class': 'score' }, [el('strong', { texte: reussis + ' / ' + etat.resultats.length }), ' réponse' + (reussis > 1 ? 's' : '') + ' juste' + (reussis > 1 ? 's' : '') + '.']));
    var parObj = {};
    etat.resultats.forEach(function (x) {
      var k = x.q.objectif;
      if (!parObj[k]) parObj[k] = { titre: x.q.objectifTitre, n: 0, j: 0 };
      parObj[k].n++; if (x.juste) parObj[k].j++;
    });
    var table = el('table', { 'class': 'table-bilan' });
    table.appendChild(el('caption', { texte: 'Réussites par objectif' }));
    table.appendChild(el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', texte: 'Objectif' }), el('th', { scope: 'col', texte: 'Réussites' })])]));
    var tb = el('tbody');
    Object.keys(parObj).forEach(function (k) {
      var o = parObj[k];
      tb.appendChild(el('tr', { 'class': o.j === o.n ? 'bilan-ok' : o.j === 0 ? 'bilan-ko' : 'bilan-moyen' }, [el('td', { texte: o.titre }), el('td', { 'class': 'nombre-bilan', texte: o.j + ' / ' + o.n })]));
    });
    table.appendChild(tb);
    r.appendChild(el('div', { 'class': 'table-defilante' }, [table]));
    var ratees = etat.resultats.filter(function (x) { return !x.juste; }).map(function (x) { return x.q; });
    var conseil = reussis === etat.resultats.length && reussis ? 'Bravo ! Tu peux augmenter la difficulté.' : (ratees.length ? 'Relis la correction des questions ratées, puis refais-les.' : '');
    if (conseil) r.appendChild(el('p', { texte: conseil }));
    var actions = el('div', { 'class': 'actions' });
    if (ratees.length) actions.appendChild(el('button', { type: 'button', 'class': 'bouton', id: 'refaire', texte: 'Refaire les questions ratées (' + ratees.length + ')', onclick: function () { demarrerSerie(ratees); } }));
    actions.appendChild(el('button', { type: 'button', 'class': ratees.length ? 'bouton-secondaire' : 'bouton', id: 'nouvelle', texte: 'Nouvelle série', onclick: function () {
      var profil = Profil.get();
      if (!profil || !etat.module) { ecranModules(); return; }
      demarrerSerie(A.creerSerie({ module: etat.module, profil: profil, difficulte: etat.difficulte, objectifs: etat.choisis }));
    } }));
    actions.appendChild(el('button', { type: 'button', 'class': 'bouton-secondaire', texte: 'Changer les réglages', onclick: ecranReglages }));
    actions.appendChild(el('button', { type: 'button', 'class': 'bouton-discret', id: 'autres-modules', texte: 'Modules et outils', onclick: ecranModules }));
    r.appendChild(actions);
    r.appendChild(el('p', { 'class': 'petit', texte: 'Tes résultats restent sur cet appareil (aucun nom, aucun envoi).' }));
    focusTitre();
  }

  /* ---------- Écran 5 : outils libres ---------- */
  function termesPourTuiles(texte) {
    var arbre = Maths.analyser(texte);
    var termes = [];
    (function aplatir(n, signe) {
      if (!n.parentheses && (n.type === '+' || n.type === '-')) { aplatir(n.g, signe); aplatir(n.d, n.type === '-' ? -signe : signe); }
      else if (!n.parentheses && n.type === 'neg') aplatir(n.arg, -signe);
      else termes.push({ signe: signe, n: n });
    })(arbre, 1);
    var res = [], lettre = null, nb = 0;
    termes.forEach(function (t) {
      var p = P.depuis(t.n);
      if (p.length > 1) throw new Error('Écris une somme de termes, sans parenthèses (par exemple 2x² + 3x – x + 1).');
      if (!p.length) return;
      var m = p[0], ls = Object.keys(m.l);
      if (ls.length > 1 || (ls.length && m.l[ls[0]] > 2)) throw new Error('Les tuiles représentent seulement x², x et 1 (une seule lettre, degré 2 au plus).');
      if (ls.length) { if (lettre && lettre !== ls[0]) throw new Error('Utilise une seule lettre.'); lettre = ls[0]; }
      if (!m.c.estEntier()) throw new Error('Utilise des coefficients entiers.');
      var c = Number(m.c.num) * t.signe;
      nb += Math.abs(c);
      res.push({ c: c, d: ls.length ? m.l[ls[0]] : 0 });
    });
    if (nb > 40) throw new Error('Trop de tuiles : utilise des coefficients plus petits (40 tuiles au plus).');
    if (!res.length) throw new Error('Écris une expression.');
    return { termes: res, lettre: lettre || 'x' };
  }
  function lireFacteur(texte) {
    var p = P.depuis(texte);
    var ls = P.lettres(p);
    if (ls.length > 1 || P.degre(p) > 1) throw new Error('Chaque facteur doit être de la forme ax + b.');
    var l = ls[0] || 'x', lx = {}; lx[l] = 1;
    var a = P.coef(p, lx), b = P.coef(p, {});
    if (!a.estEntier() || !b.estEntier() || Math.abs(Number(a.num)) > 4 || Math.abs(Number(b.num)) > 6) throw new Error('Coefficients entiers, au plus 4 pour x et 6 pour le nombre.');
    return { f: [Number(a.num), Number(b.num)], lettre: l };
  }

  function ecranOutil(quel) {
    etat.ecran = 'outil';
    var r = vider();
    var profil = Profil.get() || { annee: 10, niveau: 1 };
    var alea = new Maths.Alea();
    r.appendChild(el('p', {}, [el('button', { type: 'button', 'class': 'bouton-discret', texte: '← Modules et outils', onclick: ecranModules })]));
    var zone = el('div', { 'class': 'zone-outil', id: 'zone-outil' });
    var message = el('p', { 'class': 'message-erreur', role: 'alert' });
    function montrer(def) {
      zone.innerHTML = '';
      message.textContent = '';
      try { zone.appendChild(V.creer(def, { libre: true }).element); } catch (e) { message.textContent = e.message; }
    }
    if (quel === 'tuiles') {
      r.appendChild(el('h2', { texte: 'Tuiles algébriques' }));
      r.appendChild(el('p', { 'class': 'intro', texte: 'Une tuile carrée représente x², une tuile rectangulaire x, un petit carré 1. Les tuiles rouges (avec un signe –) sont négatives : une tuile et son opposée s\'annulent.' }));
      var champ = el('input', { type: 'text', id: 'expr-tuiles', 'class': 'champ maths', value: '2x² + 3x – x² – 5x + 4 – 1', 'aria-label': 'Expression à représenter' });
      var f1 = el('input', { type: 'text', id: 'facteur-1', 'class': 'champ champ-court maths', value: 'x + 2', 'aria-label': 'Premier facteur' });
      var f2 = el('input', { type: 'text', id: 'facteur-2', 'class': 'champ champ-court maths', value: '2x + 3', 'aria-label': 'Second facteur' });
      r.appendChild(el('fieldset', { 'class': 'groupe-objectifs' }, [el('legend', { texte: 'Réduire une expression' }), champ,
        el('div', { 'class': 'actions actions-outil' }, [
          el('button', { type: 'button', 'class': 'bouton', 'data-action': 'afficher-reduction', texte: 'Afficher les tuiles', onclick: function () {
            try { var t = termesPourTuiles(champ.value); montrer({ type: 'tuiles', mode: 'reduction', termes: t.termes, lettre: t.lettre }); } catch (e) { message.textContent = e.message; }
          } }),
          el('button', { type: 'button', 'class': 'bouton-secondaire', 'data-action': 'exemple-reduction', texte: 'Exemple au hasard', onclick: function () {
            var t = A.ModuleA.termesAReduire(alea, 2);
            champ.value = Maths.versTexte(O.srcTermes(t.termes));
            montrer({ type: 'tuiles', mode: 'reduction', termes: t.termes.map(function (m) { return { c: Number(m.c.num), d: P.degreMonome(m) }; }), lettre: 'x' });
          } })
        ])]));
      r.appendChild(el('fieldset', { 'class': 'groupe-objectifs' }, [el('legend', { texte: 'Multiplier deux facteurs (aire d\'un rectangle)' }),
        el('div', { 'class': 'ligne-facteurs' }, ['(', f1, ') · (', f2, ')']),
        el('div', { 'class': 'actions actions-outil' }, [el('button', { type: 'button', 'class': 'bouton', 'data-action': 'afficher-aire', texte: 'Afficher le rectangle', onclick: function () {
          try { var a = lireFacteur(f1.value), b = lireFacteur(f2.value); montrer({ type: 'aire', f1: a.f, f2: b.f, lettre: a.lettre }); } catch (e) { message.textContent = e instanceof Maths.ErreurSaisie ? e.message : e.message; }
        } })])]));
    } else if (quel === 'balance') {
      r.appendChild(el('h2', { texte: 'Balance des équations' }));
      r.appendChild(el('p', { 'class': 'intro', texte: 'Une équation est comme une balance en équilibre : on peut appliquer la même opération aux deux plateaux (règles 2 et 3), ou développer et réduire un membre (règle 1).' }));
      var champEq = el('input', { type: 'text', id: 'equation-balance', 'class': 'champ maths', value: '3x + 5 = x + 13', 'aria-label': 'Équation du premier degré' });
      r.appendChild(el('fieldset', { 'class': 'groupe-objectifs' }, [el('legend', { texte: 'Ton équation (premier degré, inconnue x)' }), champEq,
        el('div', { 'class': 'actions actions-outil' }, [
          el('button', { type: 'button', 'class': 'bouton', 'data-action': 'afficher-balance', texte: 'Placer sur la balance', onclick: function () {
            var parties = champEq.value.split('=');
            if (parties.length !== 2) { message.textContent = 'Écris une équation avec un seul signe « = ».'; return; }
            try {
              var g = P.depuis(parties[0]), d = P.depuis(parties[1]);
              var ls = P.lettres(g.concat(d));
              if (ls.length !== 1 || P.degre(g, ls[0]) > 1 || P.degre(d, ls[0]) > 1) throw new Error('Écris une équation du premier degré avec une seule inconnue.');
              montrer({ type: 'balance', g: parties[0].trim(), d: parties[1].trim(), lettre: ls[0] });
            } catch (e) { message.textContent = e.message; }
          } }),
          el('button', { type: 'button', 'class': 'bouton-secondaire', 'data-action': 'exemple-balance', texte: 'Exemple au hasard', onclick: function () {
            var eq;
            do { eq = A.ModuleB.equationAleatoire(alea, alea.entier(2, 3), { uniqueSeulement: true }); } while (!eq.sol.estEntier());
            champEq.value = Maths.versTexte(eq.g) + ' = ' + Maths.versTexte(eq.d);
            montrer({ type: 'balance', g: eq.g, d: eq.d, lettre: 'x' });
          } })
        ])]));
    } else {
      r.appendChild(el('h2', { texte: 'Machine à substituer' }));
      r.appendChild(el('p', { 'class': 'intro', texte: 'Écris une ou deux expressions. Fais varier les lettres pour voir leur valeur changer. Avec deux expressions, cherche un contre-exemple : une valeur pour laquelle elles sont différentes.' }));
      var ea = el('input', { type: 'text', id: 'expr-a', 'class': 'champ maths', value: '5 + 3x', 'aria-label': 'Expression A' });
      var eb = el('input', { type: 'text', id: 'expr-b', 'class': 'champ maths', value: '8x', 'aria-label': 'Expression B (facultative)' });
      r.appendChild(el('fieldset', { 'class': 'groupe-objectifs' }, [el('legend', { texte: 'Expressions' }),
        el('label', { 'for': 'expr-a', 'class': 'etiquette-champ', texte: 'A =' }), ea,
        el('label', { 'for': 'expr-b', 'class': 'etiquette-champ', texte: 'B = (facultatif)' }), eb,
        el('div', { 'class': 'actions actions-outil' }, [el('button', { type: 'button', 'class': 'bouton', 'data-action': 'afficher-machine', texte: 'Mettre en marche', onclick: function () {
          try {
            var exprs = [ea.value, eb.value].filter(function (t) { return t.trim(); });
            exprs.forEach(function (t) { Maths.analyser(t); });
            var ls = Maths.lettres(exprs.join('+'));
            if (!ls.length) throw new Error('Écris une expression avec au moins une lettre.');
            if (ls.length > 3) throw new Error('Trois lettres au plus.');
            montrer({ type: 'machine', expressions: exprs.map(function (t) { return t.replace(/[–−]/g, '-'); }), lettres: ls, min: -10, max: 10, pas: 0.5 });
          } catch (e) { message.textContent = e.message; }
        } })])]));
    }
    r.appendChild(message);
    r.appendChild(zone);
    var premier = r.querySelector('[data-action^="afficher"]');
    if (premier) premier.click();
    focusTitre();
    void profil;
  }

  /* ---------- Démarrage ---------- */
  function demarrer() {
    ecranModules();
    Profil.onChange(function () {
      if (etat.ecran === 'question' || etat.ecran === 'reglages') {
        etat.choisis = null;
        if (etat.ecran === 'reglages') ecranReglages();
        else {
          ecranModules();
          racine().insertBefore(el('div', { 'class': 'retour info', role: 'status' }, [el('p', { texte: 'Ton année ou ton niveau a changé : choisis à nouveau un module.' })]), racine().firstChild);
        }
      } else if (etat.ecran === 'modules') ecranModules();
    });
  }

  // accès pour les tests automatiques de l'interface (aucune donnée personnelle)
  global.AlgebreApp = { etat: etat, questionCourante: function () { return etat.serie[etat.index]; }, demarrerSerie: demarrerSerie };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})(window);
