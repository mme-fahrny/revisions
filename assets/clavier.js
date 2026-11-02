/*
 * clavier.js — petit clavier mathématique à l'écran
 * --------------------------------------------------
 * Évite les difficultés du clavier du téléphone (virgule, exposant,
 * parenthèses…). Le champ reste un <input> normal : le clavier physique
 * fonctionne aussi (Entrée = valider).
 *
 * Utilisation :
 *   <input id="reponse" class="champ" autocomplete="off" aria-label="Ta réponse">
 *   <script src="../assets/clavier.js"></script>
 *   <script>
 *     var clavier = Clavier.creer({
 *       champ: document.getElementById('reponse'),
 *       onValider: function (texte) { ... }      // bouton ✓ ou touche Entrée
 *     });
 *   </script>
 *
 * Options de Clavier.creer :
 *   champ          <input> (obligatoire)
 *   conteneur      élément où placer le clavier (défaut : juste après le champ)
 *   disposition    'complet' (défaut), 'nombres' (sans lettres)
 *                  ou tableau de touches (voir Clavier.DISPOSITIONS)
 *   onValider      fonction(texte) appelée à la validation
 *   apercu         true (défaut) : affiche la saisie mise en forme (x², ×, −)
 *   clavierNatif   false (défaut) : sur écran tactile, le clavier du
 *                  téléphone ne s'ouvre pas ; true pour le garder
 *
 * Objet renvoyé : valeur(), vider(), inserer(texte), effacer(), focus(),
 *                 valider(), detruire(), element (le clavier), champ
 *
 * Touches : une chaîne insère ce texte ; touches spéciales :
 *   'effacer', 'valider', 'fraction' (insère « / »), 'exposant' (insère « ^ »)
 * Le texte produit est lisible par Maths.analyser (assets/maths.js).
 */
(function (global) {
  'use strict';

  var TOUCHES = {
    '÷': { insere: '÷', aria: 'divisé par', classe: 'touche-op' },
    '×': { insere: '×', aria: 'fois', classe: 'touche-op' },
    '−': { insere: '−', aria: 'moins', classe: 'touche-op' },
    '+': { insere: '+', aria: 'plus', classe: 'touche-op' },
    ',': { insere: ',', aria: 'virgule' },
    '(': { insere: '(', aria: 'parenthèse ouvrante' },
    ')': { insere: ')', aria: 'parenthèse fermante' },
    'x': { insere: 'x', aria: 'x', classe: 'touche-lettre' },
    'a': { insere: 'a', aria: 'a', classe: 'touche-lettre' },
    'b': { insere: 'b', aria: 'b', classe: 'touche-lettre' },
    'fraction': { insere: '/', libelle: 'a/b', aria: 'trait de fraction', classe: 'touche-op' },
    'exposant': { insere: '^', libelle: 'xⁿ', aria: 'exposant', classe: 'touche-op' },
    'effacer': { action: 'effacer', libelle: '⌫', aria: 'effacer', classe: 'touche-effacer' },
    'valider': { action: 'valider', libelle: 'OK', aria: 'valider', classe: 'touche-valider' }
  };

  var DISPOSITIONS = {
    complet: [
      '7', '8', '9', '÷', '(', ')',
      '4', '5', '6', '×', 'x', 'a',
      '1', '2', '3', '−', 'b', 'exposant',
      '0', ',', '+', 'fraction', 'effacer', 'valider'
    ],
    nombres: [
      '7', '8', '9', '÷', '(', ')',
      '4', '5', '6', '×', 'fraction', 'exposant',
      '1', '2', '3', '−', '+', 'effacer',
      '0', ',', 'valider'
    ]
  };

  function echapper(t) {
    return t.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /** Mise en forme simple de la saisie : x^2 -> x², * -> ×, - -> −. */
  function miseEnForme(texte) {
    var h = echapper(texte)
      .replace(/\*/g, '×')
      .replace(/-/g, '−')
      .replace(/\./g, ',');
    h = h.replace(/\^\s*(\((?:[^()]*)\)|[−+]?\d+|[a-zA-Z])/g, function (m, e) {
      if (e.charAt(0) === '(' && /^\([−+]?[\d,]+\)$/.test(e)) e = e.slice(1, -1);
      return '<sup>' + e + '</sup>';
    });
    return h;
  }

  function creer(options) {
    options = options || {};
    var champ = options.champ;
    if (!champ) throw new Error('Clavier.creer : option « champ » obligatoire.');
    var disposition = options.disposition || 'complet';
    if (typeof disposition === 'string') disposition = DISPOSITIONS[disposition] || DISPOSITIONS.complet;

    var tactile = global.matchMedia && global.matchMedia('(pointer: coarse)').matches;
    if (tactile && !options.clavierNatif) champ.setAttribute('inputmode', 'none');
    champ.setAttribute('autocomplete', 'off');
    champ.setAttribute('autocapitalize', 'off');
    champ.setAttribute('autocorrect', 'off');
    champ.setAttribute('spellcheck', 'false');

    var clavier = document.createElement('div');
    clavier.className = 'clavier';
    clavier.setAttribute('role', 'group');
    clavier.setAttribute('aria-label', 'Clavier mathématique');

    disposition.forEach(function (cle) {
      var def = TOUCHES[cle] || { insere: cle, aria: cle };
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = def.libelle || cle;
      b.setAttribute('aria-label', def.aria || cle);
      if (def.classe) b.className = def.classe;
      if (cle === 'valider') b.style.gridColumn = 'span ' + Math.max(1, 6 - (disposition.indexOf('valider') % 6));
      // garder le focus (et le curseur) dans le champ quand on touche une touche
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        if (def.action === 'effacer') effacer();
        else if (def.action === 'valider') valider();
        else inserer(def.insere);
      });
      clavier.appendChild(b);
    });

    var apercu = null;
    if (options.apercu !== false) {
      apercu = document.createElement('div');
      apercu.className = 'apercu';
      apercu.setAttribute('aria-hidden', 'true');
    }

    var conteneur = options.conteneur;
    if (conteneur) {
      if (apercu) conteneur.appendChild(apercu);
      conteneur.appendChild(clavier);
    } else {
      champ.insertAdjacentElement('afterend', clavier);
      if (apercu) champ.insertAdjacentElement('afterend', apercu);
    }

    // mémorise la sélection quand le champ perd le focus
    var selDebut = null, selFin = null;
    function memoriser() {
      try { selDebut = champ.selectionStart; selFin = champ.selectionEnd; } catch (e) { /* type sans sélection */ }
    }
    champ.addEventListener('blur', memoriser);
    champ.addEventListener('keyup', memoriser);
    champ.addEventListener('click', memoriser);

    function bornes() {
      var d = champ.selectionStart, f = champ.selectionEnd;
      if (document.activeElement !== champ && selDebut !== null) { d = selDebut; f = selFin; }
      if (d === null || d === undefined) { d = f = champ.value.length; }
      return [d, f];
    }

    function changer(nouveau, curseur) {
      champ.value = nouveau;
      try { champ.setSelectionRange(curseur, curseur); } catch (e) { /* ignore */ }
      selDebut = selFin = curseur;
      champ.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function inserer(texte) {
      var b = bornes();
      var v = champ.value;
      changer(v.slice(0, b[0]) + texte + v.slice(b[1]), b[0] + texte.length);
      if (!tactile || options.clavierNatif) champ.focus();
    }

    function effacer() {
      var b = bornes();
      var v = champ.value;
      if (b[0] !== b[1]) changer(v.slice(0, b[0]) + v.slice(b[1]), b[0]);
      else if (b[0] > 0) changer(v.slice(0, b[0] - 1) + v.slice(b[0]), b[0] - 1);
    }

    function valider() {
      if (typeof options.onValider === 'function') options.onValider(champ.value);
    }

    function majApercu() { if (apercu) apercu.innerHTML = miseEnForme(champ.value); }
    champ.addEventListener('input', majApercu);
    majApercu();

    function surTouche(e) {
      if (e.key === 'Enter') { e.preventDefault(); valider(); }
    }
    champ.addEventListener('keydown', surTouche);

    return {
      element: clavier,
      champ: champ,
      valeur: function () { return champ.value; },
      vider: function () { changer('', 0); },
      inserer: inserer,
      effacer: effacer,
      valider: valider,
      focus: function () { champ.focus(); },
      detruire: function () {
        champ.removeEventListener('keydown', surTouche);
        champ.removeEventListener('input', majApercu);
        champ.removeEventListener('blur', memoriser);
        champ.removeEventListener('keyup', memoriser);
        champ.removeEventListener('click', memoriser);
        clavier.remove();
        if (apercu) apercu.remove();
      }
    };
  }

  global.Clavier = {
    creer: creer,
    miseEnForme: miseEnForme,
    DISPOSITIONS: DISPOSITIONS,
    TOUCHES: TOUCHES
  };
})(typeof window !== 'undefined' ? window : globalThis);
