/*
 * fonctions/js/app.js — interface de l'appli « Fonctions » (navigateur)
 * ----------------------------------------------------------------------
 * Écrans : modules -> réglages (objectifs, difficulté) -> questions -> bilan.
 * La logique (questions, vérification, rétroactions) est dans catalogue.js et les modules.
 * Progression : localStorage « revisions.fonctions.progression » (réussites par objectif,
 * aucune donnée personnelle), lu et écrit dans des try/catch.
 */
(function (global) {
  'use strict';

  var A = global.Fonctions, Profil = global.Profil, Clavier = global.Clavier;
  var CLE_PROGRESSION = 'revisions.fonctions.progression';
  var CLE_REGLAGES = 'revisions.fonctions.reglages';
  var NIVEAUX_DIFFICULTE = { 1: 'Échauffement', 2: 'Standard', 3: 'Costaud', 4: 'Expert' };
  var DESCRIPTIONS_DIFFICULTE = ['',
    'Une seule lecture ou un seul calcul, petits nombres entiers.',
    'Nombres négatifs possibles, deux étapes.',
    'Nombres décimaux, trois étapes.',
    'Niveau de fin de module : problèmes en plusieurs étapes.'];

  var etat = { ecran: 'modules', module: null, difficulte: 2, choisis: null, serie: [], index: 0, resultats: [], repondu: false, clavier: null, choix: null };

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
          el('span', { 'class': 'carte-module-info', texte: A.objectifs.some(function (o) { return o.module === m.id; }) ? 'Au programme à partir de la ' + m.debut + 'e.' : 'En préparation.' })
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
    r.appendChild(el('p', {}, [el('button', { type: 'button', 'class': 'bouton-discret', texte: '← Modules', onclick: ecranModules })]));
    r.appendChild(el('h2', { texte: 'Module ' + m.id + ' – ' + m.titre }));
    var form = el('form', { 'class': 'reglages', novalidate: 'novalidate' });
    [{ statut: 'courant', titre: 'Objectifs de ta ' + profil.annee + 'e (niveau ' + profil.niveau + ')' }, { statut: 'revision', titre: 'Révision des années précédentes' },
      { statut: 'theorique', titre: 'Pour reconnaître (questions de compréhension, non comptées dans le bilan)' },
      { statut: 'plusLoin', titre: 'Prolongement (entraînement facultatif, non compté dans le bilan)' }].forEach(function (g) {
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
    etat.repondu = false; etat.choix = null; etat.essai = 1;
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
      q.statut === 'revision' ? el('span', { 'class': 'etiquette', texte: 'Révision' }) : null,
      q.statut === 'plusLoin' ? el('span', { 'class': 'etiquette etiquette-plus-loin', texte: 'Prolongement (non compté)' }) : null,
      q.statut === 'theorique' ? el('span', { 'class': 'etiquette etiquette-plus-loin', texte: 'Pour reconnaître (non compté)' }) : null
    ]));
    var carte = el('section', { 'class': 'question', 'aria-labelledby': 'titre-question' });
    carte.appendChild(el('h2', { id: 'titre-question', 'class': 'visuellement-cache', texte: 'Question ' + (etat.index + 1) }));
    carte.appendChild(el('div', { 'class': 'enonce', html: q.enonce }));
    if (q.consigne) carte.appendChild(el('p', { 'class': 'consigne', html: q.consigne }));
    var zone = el('div', { 'class': 'zone-reponse' });
    carte.appendChild(zone);
    if (q.mode === 'choix') {
      var fs = el('fieldset', { 'class': 'choix-reponses' + (q.choixGraphiques ? ' choix-graphiques' : '') }, [el('legend', { 'class': 'visuellement-cache', texte: 'Réponses possibles' })]);
      q.choix.forEach(function (c, i) {
        var input = el('input', { type: 'radio', name: 'reponse-choix', id: 'choix-' + i, value: String(i) });
        input.addEventListener('change', function () { etat.choix = i; });
        fs.appendChild(el('label', { 'for': 'choix-' + i, 'class': 'option' }, [input, el('span', { html: c.h })]));
      });
      zone.appendChild(fs);
    } else {
      var ligne = el('div', { 'class': 'ligne-champ' });
      if (q.prefixe) ligne.appendChild(el('label', { 'for': 'reponse', 'class': 'prefixe', texte: q.prefixe }));
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
    if (champFocus && !tactile()) champFocus.focus({ preventScroll: true });
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
    // Premier essai faux : la rétroaction nomme l'erreur, l'élève corrige sa réponse (2e essai).
    // La réponse attendue et la correction ne s'affichent qu'après le 2e essai.
    if (!res.juste && etat.essai === 1) {
      etat.essai = 2;
      retour.className = 'retour faux';
      retour.innerHTML = '';
      retour.appendChild(el('p', {}, [el('strong', { texte: res.statut === 'forme' ? 'Forme non conforme. ' : 'Pas tout à fait. ' }), el('span', { texte: res.message })]));
      retour.appendChild(el('p', { 'class': 'deuxieme-essai', texte: 'Corrige ta réponse : tu as droit à un deuxième essai.' }));
      if (q.mode === 'choix') {
        var lab = racine().querySelector('label[for="choix-' + etat.choix + '"]');
        if (lab) { lab.classList.add('option-fausse'); lab.querySelector('input').disabled = true; lab.querySelector('input').checked = false; }
        etat.choix = null;
      } else {
        var c2 = $('#reponse'); if (c2 && !tactile()) c2.focus({ preventScroll: true });
      }
      $('#verifier').textContent = 'Vérifier (2e essai)';
      return;
    }
    etat.repondu = true;
    etat.resultats.push({ q: q, juste: res.juste, statut: res.statut, essais: etat.essai });
    enregistrerResultat(q.compte === false ? q.objectif + ' (plus loin)' : q.objectif, res.juste);
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
    if (res.juste) retour.appendChild(el('p', {}, [el('strong', { texte: etat.essai === 2 ? 'Juste au 2e essai !' : 'Juste !' }), res.message ? el('span', { texte: ' ' + res.message }) : null]));
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
    var comptes = etat.resultats.filter(function (x) { return x.q.compte !== false; });
    var reussis = comptes.filter(function (x) { return x.juste; }).length;
    r.appendChild(el('h2', { texte: 'Bilan de la série' }));
    if (comptes.length) r.appendChild(el('p', { 'class': 'score' }, [el('strong', { texte: reussis + ' / ' + comptes.length }), ' réponse' + (reussis > 1 ? 's' : '') + ' juste' + (reussis > 1 ? 's' : '') + (comptes.length < etat.resultats.length ? ' (sans les questions non comptées)' : '') + '.',
      (function () { var n2 = comptes.filter(function (x) { return x.juste && x.essais === 2; }).length; return n2 ? ' Dont ' + n2 + ' au 2e essai.' : ''; })()]));
    else {
      var libres = etat.resultats.filter(function (x) { return x.juste; }).length;
      r.appendChild(el('p', { 'class': 'score' }, ['Entraînement facultatif : ', el('strong', { texte: libres + ' / ' + etat.resultats.length }), ' (non compté dans le bilan).']));
    }
    var parObj = {};
    etat.resultats.forEach(function (x) {
      var k = x.q.objectif;
      if (!parObj[k]) parObj[k] = { titre: x.q.objectifTitre, n: 0, j: 0, compte: x.q.compte !== false };
      parObj[k].n++; if (x.juste) parObj[k].j++;
    });
    var table = el('table', { 'class': 'table-bilan' });
    table.appendChild(el('caption', { texte: 'Réussites par objectif' }));
    table.appendChild(el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', texte: 'Objectif' }), el('th', { scope: 'col', texte: 'Réussites' })])]));
    var tb = el('tbody');
    Object.keys(parObj).forEach(function (k) {
      var o = parObj[k];
      tb.appendChild(el('tr', { 'class': o.j === o.n ? 'bilan-ok' : o.j === 0 ? 'bilan-ko' : 'bilan-moyen' }, [el('td', {}, [o.titre, o.compte ? null : el('span', { 'class': 'etiquette etiquette-plus-loin', texte: 'non compté' })]), el('td', { 'class': 'nombre-bilan', texte: o.j + ' / ' + o.n })]));
    });
    table.appendChild(tb);
    r.appendChild(el('div', { 'class': 'table-defilante' }, [table]));
    var ratees = etat.resultats.filter(function (x) { return !x.juste; }).map(function (x) { return x.q; });
    var conseil = reussis === comptes.length && reussis ? 'Bravo ! Tu peux augmenter la difficulté.' : (ratees.length ? 'Relis la correction des questions ratées, puis refais-les.' : '');
    if (conseil) r.appendChild(el('p', { texte: conseil }));
    var actions = el('div', { 'class': 'actions' });
    if (ratees.length) actions.appendChild(el('button', { type: 'button', 'class': 'bouton', id: 'refaire', texte: 'Refaire les questions ratées (' + ratees.length + ')', onclick: function () { demarrerSerie(ratees); } }));
    actions.appendChild(el('button', { type: 'button', 'class': ratees.length ? 'bouton-secondaire' : 'bouton', id: 'nouvelle', texte: 'Nouvelle série', onclick: function () {
      var profil = Profil.get();
      if (!profil || !etat.module) { ecranModules(); return; }
      demarrerSerie(A.creerSerie({ module: etat.module, profil: profil, difficulte: etat.difficulte, objectifs: etat.choisis }));
    } }));
    actions.appendChild(el('button', { type: 'button', 'class': 'bouton-secondaire', texte: 'Changer les réglages', onclick: ecranReglages }));
    actions.appendChild(el('button', { type: 'button', 'class': 'bouton-discret', id: 'autres-modules', texte: 'Autres modules', onclick: ecranModules }));
    r.appendChild(actions);
    r.appendChild(el('p', { 'class': 'petit', texte: 'Tes résultats restent sur cet appareil (aucun nom, aucun envoi).' }));
    focusTitre();
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
  global.FonctionsApp = { etat: etat, questionCourante: function () { return etat.serie[etat.index]; }, demarrerSerie: demarrerSerie };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})(window);
