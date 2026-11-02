/*
 * clavier.js — petit clavier mathématique à l'écran
 * --------------------------------------------------
 * Évite les difficultés du clavier du téléphone. Symboles de l'aide-mémoire :
 * « · » pour multiplier, « : » ou barre de fraction pour diviser, « – »,
 * « ; » pour séparer les éléments d'une liste, √ et ∛, barre de période.
 * Le champ reste un <input> normal : le clavier physique fonctionne aussi.
 *
 * Utilisation :
 *   <input id="reponse" class="champ" aria-label="Ta réponse">
 *   <script src="../assets/clavier.js"></script>
 *   <script>
 *     var clavier = Clavier.creer({
 *       champ: document.getElementById('reponse'),
 *       onValider: function (texte) { ... }      // touche OK ou Entrée
 *     });
 *   </script>
 *
 * Options de Clavier.creer :
 *   champ          <input> (obligatoire)
 *   conteneur      élément où placer le clavier (défaut : juste après le champ)
 *   disposition    'complet' (défaut), 'nombres' (sans lettres ni racines)
 *                  ou tableau de touches (voir Clavier.DISPOSITIONS et Clavier.TOUCHES)
 *   barreOblique   ce que devient « / » tapé au clavier physique :
 *                  'fraction' (défaut) : reste « / », la barre de fraction
 *                  (affichée empilée dans l'aperçu : 3/4 -> ¾) ;
 *                  'division' : devient « : » (exercices de division, par
 *                  exemple sur les nombres relatifs en 9e).
 *   onValider      fonction(texte) appelée à la validation
 *   apercu         true (défaut) : affiche la saisie mise en forme (x², fractions, période)
 *   clavierNatif   false (défaut) : sur écran tactile, le clavier du
 *                  téléphone ne s'ouvre pas ; true pour le garder
 *
 * Saisie au clavier physique, convertie automatiquement :
 *   « * » et « × » -> « · »     « ÷ » -> « : »     « - » et « − » -> « – »
 *   « / » -> « / » ou « : » selon l'option barreOblique
 *   Entrée = valider. Les autres caractères restent tels quels.
 *
 * Touche « période » (1̅) : place une barre sur le chiffre décimal juste avant
 * le curseur ; chaque nouvel appui allonge la barre d'un chiffre vers la gauche.
 * Exemple : taper 1,18 puis deux fois « période » donne 1,1̅8̅ (= 1,1818…).
 * L'élève peut aussi écrire 1,1818… (Maths.analyser accepte les deux).
 * La touche « effacer » supprime un chiffre avec sa barre.
 *
 * Objet renvoyé : valeur(), vider(), inserer(texte), effacer(), periode(),
 *                 focus(), valider(), detruire(), element (le clavier), champ
 * Le texte produit est lisible par Maths.analyser (assets/maths.js).
 */
(function (global) {
  'use strict';

  var OVERLINE = '̅';

  var TOUCHES = {
    '·': { insere: '·', aria: 'fois', classe: 'touche-op' },
    ':': { insere: ':', aria: 'divisé par', classe: 'touche-op' },
    '–': { insere: '–', aria: 'moins', classe: 'touche-op' },
    '+': { insere: '+', aria: 'plus', classe: 'touche-op' },
    ';': { insere: ' ; ', libelle: ';', aria: 'point-virgule', classe: 'touche-op' },
    ',': { insere: ',', aria: 'virgule' },
    '(': { insere: '(', aria: 'parenthèse ouvrante' },
    ')': { insere: ')', aria: 'parenthèse fermante' },
    '√': { insere: '√', aria: 'racine carrée', classe: 'touche-op' },
    '∛': { insere: '∛', aria: 'racine cubique', classe: 'touche-op' },
    'x': { insere: 'x', aria: 'x', classe: 'touche-lettre' },
    'y': { insere: 'y', aria: 'y', classe: 'touche-lettre' },
    'a': { insere: 'a', aria: 'a', classe: 'touche-lettre' },
    'b': { insere: 'b', aria: 'b', classe: 'touche-lettre' },
    'fraction': { insere: '/', libelle: 'a/b', aria: 'barre de fraction', classe: 'touche-op' },
    'exposant': { insere: '^', libelle: 'xⁿ', aria: 'exposant', classe: 'touche-op' },
    'periode': { action: 'periode', libelle: '1' + OVERLINE, aria: 'barre de période', classe: 'touche-op' },
    'effacer': { action: 'effacer', libelle: '⌫', aria: 'effacer', classe: 'touche-effacer' },
    'valider': { action: 'valider', libelle: 'OK', aria: 'valider', classe: 'touche-valider' }
  };

  /* 6 colonnes : chaque touche garde au moins 44 px de large dès 360 px d'écran. */
  var DISPOSITIONS = {
    complet: [
      '7', '8', '9', '(', ')', 'effacer',
      '4', '5', '6', '·', ':', 'fraction',
      '1', '2', '3', '+', '–', 'exposant',
      '0', ',', 'periode', ';', '√', '∛',
      'x', 'y', 'a', 'b', 'valider'
    ],
    nombres: [
      '7', '8', '9', '(', ')', 'effacer',
      '4', '5', '6', '·', ':', 'fraction',
      '1', '2', '3', '+', '–', 'exposant',
      '0', ',', 'periode', ';', 'valider'
    ]
  };

  function echapper(t) {
    return t.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /** Remplace les signes du clavier physique par ceux de l'aide-mémoire (même longueur). */
  function normaliser(texte, barreOblique) {
    var t = texte.replace(/[*×]/g, '·').replace(/÷/g, ':').replace(/[-−]/g, '–');
    if (barreOblique === 'division') t = t.replace(/\//g, ':');
    return t;
  }

  /**
   * Mise en forme de la saisie pour l'aperçu (HTML) :
   * x^2 -> x², 3/4 -> fraction empilée, chiffres barrés -> période.
   */
  function miseEnForme(texte) {
    var h = echapper(texte).replace(/\.\.\./g, '…').replace(/\*/g, '·').replace(/-/g, '–').replace(/\./g, ',');
    // période : chiffres suivis du trait combinant
    h = h.replace(/(?:\d̅)+/g, function (m) {
      return '<span class="periode">' + m.replace(/̅/g, '') + '</span>';
    });
    // exposants
    h = h.replace(/\^\s*(\((?:[^()]*)\)|[–+]?\d+|[a-zA-Z])/g, function (m, e) {
      if (e.charAt(0) === '(' && /^\([–+]?[\d,]+\)$/.test(e)) e = e.slice(1, -1);
      return '<sup>' + e + '</sup>';
    });
    // fractions simples : 3/4, x/2, (x+1)/(x–1)
    var terme = "(\\([^()]*\\)|[\\d',]+|[a-zA-Z])";
    h = h.replace(new RegExp(terme + '\\s*/\\s*' + terme, 'g'), function (m, a, b) {
      function sansParentheses(t) { return /^\(.*\)$/.test(t) ? t.slice(1, -1) : t; }
      return '<span class="frac"><span>' + sansParentheses(a) + '</span><span>' + sansParentheses(b) + '</span></span>';
    });
    return h;
  }

  function creer(options) {
    options = options || {};
    var champ = options.champ;
    if (!champ) throw new Error('Clavier.creer : option « champ » obligatoire.');
    var disposition = options.disposition || 'complet';
    if (typeof disposition === 'string') disposition = DISPOSITIONS[disposition] || DISPOSITIONS.complet;
    var barreOblique = options.barreOblique === 'division' ? 'division' : 'fraction';

    var tactile = !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches);
    if (tactile && !options.clavierNatif) champ.setAttribute('inputmode', 'none');
    champ.setAttribute('autocomplete', 'off');
    champ.setAttribute('autocapitalize', 'off');
    champ.setAttribute('autocorrect', 'off');
    champ.setAttribute('spellcheck', 'false');

    var clavier = document.createElement('div');
    clavier.className = 'clavier';
    clavier.setAttribute('role', 'group');
    clavier.setAttribute('aria-label', 'Clavier mathématique');

    disposition.forEach(function (cle, index) {
      var def = TOUCHES[cle] || { insere: cle, aria: cle };
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = def.libelle || cle;
      b.setAttribute('aria-label', def.aria || cle);
      b.setAttribute('data-touche', cle);
      if (def.classe) b.className = def.classe;
      // la dernière touche occupe le reste de la ligne
      if (index === disposition.length - 1) b.style.gridColumn = 'span ' + (6 - (index % 6));
      // garder le focus (et le curseur) dans le champ quand on touche une touche
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        if (def.action === 'effacer') effacer();
        else if (def.action === 'valider') valider();
        else if (def.action === 'periode') periode();
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

    if (options.conteneur) {
      if (apercu) options.conteneur.appendChild(apercu);
      options.conteneur.appendChild(clavier);
    } else {
      champ.insertAdjacentElement('afterend', clavier);
      if (apercu) champ.insertAdjacentElement('afterend', apercu);
    }

    // mémorise la sélection quand le champ perd le focus
    var selDebut = null, selFin = null;
    function memoriser() {
      try { selDebut = champ.selectionStart; selFin = champ.selectionEnd; } catch (e) { /* ignore */ }
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

    function garderFocus() { if (!tactile || options.clavierNatif) champ.focus(); }

    function inserer(texte) {
      var b = bornes();
      var v = champ.value;
      changer(v.slice(0, b[0]) + texte + v.slice(b[1]), b[0] + texte.length);
      garderFocus();
    }

    function effacer() {
      var b = bornes();
      var v = champ.value;
      if (b[0] !== b[1]) changer(v.slice(0, b[0]) + v.slice(b[1]), b[0]);
      else if (b[0] > 0) {
        var n = v.charAt(b[0] - 1) === OVERLINE && b[0] > 1 ? 2 : 1; // chiffre + barre
        changer(v.slice(0, b[0] - n) + v.slice(b[0]), b[0] - n);
      }
      garderFocus();
    }

    /** Barre de période : sur le chiffre avant le curseur, puis allonge vers la gauche. */
    function periode() {
      var v = champ.value;
      var fin = bornes()[1];
      var i = fin;
      while (i >= 2 && v.charAt(i - 1) === OVERLINE && /\d/.test(v.charAt(i - 2))) i -= 2;
      var debutNombre = i;
      while (debutNombre > 0 && /[\d̅',.]/.test(v.charAt(debutNombre - 1))) debutNombre--;
      var avant = v.slice(debutNombre, i);
      // seulement un chiffre situé après la virgule
      if (i >= 1 && /\d/.test(v.charAt(i - 1)) && /[,.]/.test(avant.slice(0, -1))) {
        changer(v.slice(0, i) + OVERLINE + v.slice(i), fin + 1);
      }
      garderFocus();
    }

    function valider() {
      if (typeof options.onValider === 'function') options.onValider(champ.value);
    }

    // conversion des signes tapés au clavier physique (ou collés)
    function surSaisie() {
      var v = champ.value;
      var n = normaliser(v, barreOblique);
      if (n !== v) {
        var d = champ.selectionStart, f = champ.selectionEnd;
        champ.value = n; // même longueur : le curseur ne bouge pas
        try { champ.setSelectionRange(d, f); } catch (e) { /* ignore */ }
      }
      if (apercu) apercu.innerHTML = miseEnForme(champ.value);
    }
    champ.addEventListener('input', surSaisie);
    surSaisie();

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
      periode: periode,
      valider: valider,
      focus: function () { champ.focus(); },
      detruire: function () {
        champ.removeEventListener('keydown', surTouche);
        champ.removeEventListener('input', surSaisie);
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
    normaliser: normaliser,
    DISPOSITIONS: DISPOSITIONS,
    TOUCHES: TOUCHES
  };
})(typeof window !== 'undefined' ? window : globalThis);
