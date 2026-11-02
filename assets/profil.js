/*
 * profil.js — choix de l'année et du niveau de l'élève
 * -----------------------------------------------------
 * Aucune donnée personnelle : on enregistre seulement { annee, niveau }
 * dans le localStorage de l'appareil (clé « revisions.profil »).
 * Si le stockage est indisponible (navigation privée, réglages…),
 * le choix reste en mémoire pendant la visite.
 *
 * Utilisation dans une page :
 *   <header class="entete">
 *     <a class="entete-titre" href="../">Révisions maths et sciences</a>
 *     <div data-profil></div>
 *   </header>
 *   <script src="../assets/profil.js"></script>
 *
 * Le script remplit [data-profil] avec le profil actuel et le bouton
 * « Changer d'année ou de niveau ». Au premier passage, la fenêtre de
 * choix s'ouvre toute seule.
 *
 * API :
 *   Profil.get()            -> { annee: 9|10|11, niveau: 1|2 } ou null
 *   Profil.set({annee, niveau})  enregistre et prévient les abonnés
 *   Profil.onChange(fn)     fn(profil) appelée à chaque changement ;
 *                           renvoie une fonction pour se désabonner
 *   Profil.ouvrir()         ouvre la fenêtre de choix
 *   Profil.texte(profil?)   « 10e · niveau 2 »
 *   Profil.niveauSciences(profil?)
 *                           niveau à utiliser dans une appli de SCIENCES :
 *                           'tronc commun' en 9e (pas de niveaux en sciences),
 *                           1 ou 2 (niveau choisi) en 10e et 11e,
 *                           null si aucun profil n'est choisi.
 *                           En mathématiques, utiliser Profil.get().niveau
 *                           (niveaux 1 et 2 dans les trois années).
 *   Profil.ANNEES, Profil.NIVEAUX
 *
 * Attribut facultatif sur <body> : data-profil-auto="non" pour ne pas
 * ouvrir la fenêtre automatiquement au premier passage.
 */
(function (global) {
  'use strict';

  var CLE = 'revisions.profil';
  var ANNEES = [9, 10, 11];
  var NIVEAUX = [1, 2];
  var TRONC_COMMUN = 'tronc commun';
  var enMemoire = null;
  var abonnes = [];

  function valide(p) {
    if (!p || typeof p !== 'object') return null;
    var annee = Number(p.annee), niveau = Number(p.niveau);
    if (ANNEES.indexOf(annee) < 0 || NIVEAUX.indexOf(niveau) < 0) return null;
    return { annee: annee, niveau: niveau };
  }

  function lire() {
    try {
      var brut = global.localStorage.getItem(CLE);
      if (brut) return valide(JSON.parse(brut));
    } catch (e) { /* stockage indisponible : on garde la mémoire */ }
    return null;
  }

  function ecrire(p) {
    try { global.localStorage.setItem(CLE, JSON.stringify(p)); } catch (e) { /* idem */ }
  }

  function get() {
    var p = enMemoire || lire();
    if (p) enMemoire = p;
    return p ? { annee: p.annee, niveau: p.niveau } : null;
  }

  function prevenir() {
    var p = get();
    abonnes.slice().forEach(function (fn) {
      try { fn(p); } catch (e) { if (global.console) console.error(e); }
    });
    majEntete();
  }

  function set(p) {
    var v = valide(p);
    if (!v) throw new Error('Profil invalide : année 9, 10 ou 11 et niveau 1 ou 2 attendus.');
    var avant = get();
    enMemoire = v;
    ecrire(v);
    if (!avant || avant.annee !== v.annee || avant.niveau !== v.niveau) prevenir();
    return get();
  }

  function onChange(fn) {
    abonnes.push(fn);
    return function () {
      var i = abonnes.indexOf(fn);
      if (i >= 0) abonnes.splice(i, 1);
    };
  }

  function texte(p) {
    p = p === undefined ? get() : p;
    return p ? p.annee + 'e · niveau ' + p.niveau : 'aucun profil choisi';
  }

  /**
   * Niveau pour les sciences de la nature : la 9e est un tronc commun sans
   * niveaux ; les niveaux 1 et 2 n'existent qu'en 10e et 11e.
   * Renvoie 'tronc commun', 1, 2, ou null si aucun profil n'est choisi.
   * Le choix du niveau fait en 9e (utile en maths) est simplement ignoré.
   */
  function niveauSciences(p) {
    p = p === undefined ? get() : valide(p);
    if (!p) return null;
    return p.annee === 9 ? TRONC_COMMUN : p.niveau;
  }

  /* Synchronisation entre onglets ouverts */
  if (global.addEventListener) {
    global.addEventListener('storage', function (e) {
      if (e.key !== CLE) return;
      var p = null;
      try { p = valide(JSON.parse(e.newValue)); } catch (err) { p = null; }
      if (p) { enMemoire = p; prevenir(); }
    });
  }

  /* ---------- Interface ---------- */

  var dialogue = null;
  var dernierFocus = null;

  function el(nom, attrs, enfants) {
    var n = document.createElement(nom);
    for (var k in attrs) {
      if (k === 'texte') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (enfants || []).forEach(function (e) { n.appendChild(e); });
    return n;
  }

  function groupe(nom, legende, valeurs, etiquette) {
    var choix = valeurs.map(function (v) {
      return el('label', { 'class': 'choix' }, [
        el('input', { type: 'radio', name: nom, value: String(v) }),
        el('span', { texte: etiquette(v) })
      ]);
    });
    return el('fieldset', {}, [
      el('legend', { texte: legende }),
      el('div', { 'class': 'choix-groupe' }, choix)
    ]);
  }

  function creerDialogue() {
    var form = el('form', { method: 'dialog' }, [
      el('h2', { id: 'profil-titre', texte: 'Ton année et ton niveau' }),
      el('p', { texte: 'Les exercices s\'adaptent à ce choix. Il reste enregistré sur cet appareil seulement.' }),
      groupe('annee', 'Année', ANNEES, function (a) { return a + 'e'; }),
      groupe('niveau', 'Niveau', NIVEAUX, function (n) { return 'Niveau ' + n; }),
      el('p', { 'class': 'profil-message', role: 'alert' }),
      el('div', { 'class': 'actions' }, [
        el('button', { type: 'submit', 'class': 'bouton', value: 'valider', texte: 'Valider' }),
        el('button', { type: 'button', 'class': 'bouton-secondaire', 'data-action': 'annuler', texte: 'Annuler' })
      ])
    ]);
    var d = el('dialog', { 'class': 'profil-dialogue', 'aria-labelledby': 'profil-titre' }, [form]);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = form.querySelector('input[name="annee"]:checked');
      var n = form.querySelector('input[name="niveau"]:checked');
      if (!a || !n) {
        form.querySelector('.profil-message').textContent = 'Choisis une année et un niveau.';
        return;
      }
      set({ annee: a.value, niveau: n.value });
      fermer();
    });
    form.querySelector('[data-action="annuler"]').addEventListener('click', function () {
      if (get()) fermer();
      else form.querySelector('.profil-message').textContent = 'Choisis une année et un niveau pour commencer.';
    });
    // Touche Échap : on ne ferme que si un profil existe déjà
    d.addEventListener('cancel', function (e) {
      if (!get()) e.preventDefault();
    });
    document.body.appendChild(d);
    return d;
  }

  function ouvrir() {
    if (!document.body) return;
    if (!dialogue) dialogue = creerDialogue();
    var p = get();
    dialogue.querySelector('.profil-message').textContent = '';
    dialogue.querySelectorAll('input').forEach(function (i) {
      i.checked = !!p && ((i.name === 'annee' && Number(i.value) === p.annee) ||
                          (i.name === 'niveau' && Number(i.value) === p.niveau));
    });
    dernierFocus = document.activeElement;
    // annuler masqué au premier passage
    dialogue.querySelector('[data-action="annuler"]').hidden = !p;
    if (typeof dialogue.showModal === 'function') {
      if (!dialogue.open) dialogue.showModal();
    } else {
      dialogue.setAttribute('open', '');
    }
    var premier = dialogue.querySelector('input:checked') || dialogue.querySelector('input');
    if (premier) premier.focus();
  }

  function fermer() {
    if (!dialogue) return;
    if (typeof dialogue.close === 'function' && dialogue.open) dialogue.close();
    else dialogue.removeAttribute('open');
    if (dernierFocus && dernierFocus.focus) dernierFocus.focus();
  }

  function majEntete() {
    if (typeof document === 'undefined') return;
    var zones = document.querySelectorAll('[data-profil]');
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (!z.querySelector('.profil-actuel')) {
        z.classList.add('profil-zone');
        var actuel = el('span', { 'class': 'profil-actuel', 'aria-live': 'polite' });
        var bouton = el('button', { type: 'button', 'class': 'bouton-discret', texte: 'Changer d\'année ou de niveau' });
        bouton.addEventListener('click', ouvrir);
        z.appendChild(actuel);
        z.appendChild(bouton);
      }
      var p = get();
      var a = z.querySelector('.profil-actuel');
      a.textContent = '';
      if (p) {
        a.appendChild(document.createTextNode('Profil : '));
        a.appendChild(el('strong', { texte: texte(p) }));
      } else {
        a.textContent = 'Profil : à choisir';
      }
    }
  }

  function demarrer() {
    majEntete();
    if (!get() && document.body.getAttribute('data-profil-auto') !== 'non') ouvrir();
  }

  global.Profil = {
    get: get,
    set: set,
    onChange: onChange,
    ouvrir: ouvrir,
    texte: texte,
    niveauSciences: niveauSciences,
    TRONC_COMMUN: TRONC_COMMUN,
    ANNEES: ANNEES.slice(),
    NIVEAUX: NIVEAUX.slice()
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
    else demarrer();
  }
})(typeof window !== 'undefined' ? window : globalThis);
