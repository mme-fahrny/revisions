# Révisions maths et sciences

Site d'applications interactives de révision pour les élèves du Cycle 3
(9e, 10e et 11e HarmoS, canton de Neuchâtel), en mathématiques et en sciences
de la nature. Il fonctionne sur téléphone, tablette et ordinateur, en classe
ou à la maison, sans installation et sans compte.

Le site est fait uniquement de fichiers HTML, CSS et JavaScript : pas de
compilation, pas de framework. On modifie un fichier, on l'envoie sur GitHub,
et le site est à jour.

## Organisation des fichiers

```
index.html              page d'accueil (une carte par appli)
.nojekyll               fichier vide, nécessaire pour GitHub Pages
assets/
  commun.css            couleurs, textes, boutons (clair et sombre)
  profil.js             choix de l'année et du niveau de l'élève
  maths.js              moteur mathématique (fractions, expressions, corrections)
  clavier.js            clavier mathématique à l'écran
nombres/                une appli = un dossier avec son index.html
algebre/
fonctions/
chimie-10e/
tests/maths.test.js     tests automatiques du moteur
```

## Ajouter une appli

1. **Créer un dossier** à la racine, par exemple `geometrie/`, avec un fichier
   `index.html`. Le plus simple : copier `nombres/index.html` et le modifier.
   Garder l'en-tête commun et les chemins relatifs qui commencent par `../` :

   ```html
   <link rel="stylesheet" href="../assets/commun.css">
   ...
   <header class="entete">
     <a class="entete-titre" href="../">← Révisions maths et sciences</a>
     <div data-profil></div>
   </header>
   ...
   <script src="../assets/profil.js"></script>
   <script src="../assets/maths.js"></script>   <!-- si besoin -->
   <script src="../assets/clavier.js"></script> <!-- si besoin -->
   ```

2. **Ajouter une carte** dans `index.html` (racine), dans la bonne section :

   ```html
   <li class="carte">
     <h3><a href="geometrie/">Géométrie</a></h3>
     <p>Aires, volumes, théorème de Pythagore.</p>
   </li>
   ```

3. Toujours utiliser des **chemins relatifs** (`geometrie/`, `../assets/…`),
   jamais de chemin qui commence par `/` : le site est servi depuis un
   sous-dossier (`https://<compte>.github.io/revisions/`).

## Activer GitHub Pages

1. Sur GitHub, ouvrir le dépôt, puis **Settings** → **Pages**.
2. Sous **Build and deployment**, choisir **Source : Deploy from a branch**.
3. Choisir la branche **main** et le dossier **/ (root)**, puis **Save**.
4. Après une ou deux minutes, l'adresse du site s'affiche en haut de la page
   (de la forme `https://<compte>.github.io/revisions/`).

Les menus de GitHub peuvent changer de nom avec le temps ; en cas de doute,
voir la documentation officielle « Configuring a publishing source for your
GitHub Pages site ».

Attention : en ouvrant simplement `index.html` depuis son ordinateur
(double-clic), les liens vers les dossiers des applis affichent la liste des
fichiers au lieu de l'appli. Le plus simple est de vérifier sur le site publié,
ou d'ouvrir directement le fichier `index.html` du dossier de l'appli.

## Confidentialité

- **Aucune donnée personnelle** : pas de compte, pas de nom d'élève, pas de
  mot de passe.
- Seuls l'année et le niveau choisis (par ex. « 10e · niveau 2 ») sont
  enregistrés, **uniquement sur l'appareil de l'élève** (localStorage du
  navigateur, clé `revisions.profil`). Ils ne sont envoyés nulle part.
- Pas de cookies, pas de statistiques de visite, pas de services de suivi,
  pas de publicité.
- Règle pour les nouvelles applis : ne jamais demander de nom ni ajouter de
  service tiers de suivi. Les résultats éventuels restent dans la page
  (ou dans le localStorage de l'appareil).

Remarque : GitHub, qui héberge le site, peut tenir ses propres journaux
techniques de connexion, comme tout hébergeur ; le site lui-même ne collecte
rien.

## Bibliothèques externes

Aucune pour l'instant. Si une appli a vraiment besoin d'afficher des formules
complexes, on peut ajouter **KaTeX** avec une version exacte, par exemple :

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
```

Toujours garder une version exacte (jamais `katex@latest`) et noter ici
chaque bibliothèque ajoutée et l'appli qui l'utilise.

## Pour les développeurs : API des fichiers `assets/`

### `profil.js` (objet global `Profil`)

| Fonction | Rôle |
|---|---|
| `Profil.get()` | `{ annee: 9 \| 10 \| 11, niveau: 1 \| 2 }` ou `null` si pas encore choisi |
| `Profil.set({ annee, niveau })` | enregistre et prévient les abonnés |
| `Profil.onChange(fn)` | `fn(profil)` à chaque changement ; renvoie une fonction de désabonnement |
| `Profil.ouvrir()` | ouvre la fenêtre de choix |
| `Profil.texte()` | « 10e · niveau 2 » |

Le script remplit automatiquement l'élément `[data-profil]` de l'en-tête et
ouvre la fenêtre au premier passage (`<body data-profil-auto="non">` pour
l'éviter).

### `maths.js` (objet global `Maths`, ou `require('./assets/maths.js')` dans Node)

- `new Maths.Alea(graine)` : `suivant()`, `entier(min, max)`,
  `entierNonNul(min, max)`, `choix(t)`, `melanger(t)`, `signe()`.
- `new Maths.Fraction(3, 4)`, `Maths.Fraction.depuis('2,5')` :
  `plus`, `moins`, `fois`, `divise`, `puissance(k)`, `oppose`, `inverse`,
  `abs`, `compare`, `egal`, `estEntier`, `estZero`, `valeur()`,
  `versDecimal(n)` (« 1'234,5 »), `estDecimale()`, `estPeriodique()`,
  `developpementDecimal()`, `ecritureDecimale()`, `toString()` (« 3/4 »).
- `Maths.analyser(texte)` : lit une expression (`3x^2 − 2(x+1)`, `ab`,
  `0,5a`, `x²`, `3/4x` = (3/4)·x). Lève `Maths.ErreurSaisie` avec un message
  en français pour l'élève.
- `Maths.evaluer(expr, { x: 2 })`, `Maths.lettres(expr)`, `Maths.versTexte(expr)`.
- `Maths.equivalentes(reponse, attendu)` : vrai si les deux expressions
  sont égales (calcul exact en plusieurs points tirés au hasard).
- Tests de forme : `Maths.estReduite(expr)`,
  `Maths.estReduiteOrdonnee(expr, lettre?)`,
  `Maths.estFractionIrreductible('3/4')`,
  `Maths.estNotationScientifique('3,2 × 10^4')`,
  `Maths.lireNotationScientifique(texte)`.
- `Maths.formaterNombre(1234.5)` → « 1'234,5 ».

Correction typique d'une réponse :

```js
try {
  var juste = Maths.equivalentes(reponse, '2x + 6') && Maths.estReduite(reponse);
} catch (e) {
  if (e instanceof Maths.ErreurSaisie) afficher(e.message); // saisie illisible
}
```

### `clavier.js` (objet global `Clavier`)

```js
var clavier = Clavier.creer({
  champ: document.getElementById('reponse'),   // un <input class="champ">
  disposition: 'complet',                        // ou 'nombres', ou une liste de touches
  onValider: function (texte) { corriger(texte); }
});
```

Touches : chiffres, virgule, + − × ÷, x, a, b, parenthèses, fraction (/),
exposant (^), effacer, valider. Le clavier physique fonctionne aussi
(Entrée = valider). Sur écran tactile, le clavier du téléphone ne s'ouvre pas
(option `clavierNatif: true` pour le garder).

### `commun.css`

Classes principales : `.entete`, `.page`, `.section`, `.grille-cartes`,
`.carte`, `.bouton`, `.bouton-secondaire`, `.bouton-discret`, `.champ`,
`.retour.juste` / `.retour.faux` / `.retour.info`, `.aide-memoire`,
`.etiquette`, `.visuellement-cache`. Les couleurs sont des variables
(`--accent`, `--sciences`, `--juste`, `--faux`…) qui s'adaptent au thème
clair ou sombre de l'appareil.

## Tests

```bash
node tests/maths.test.js
```

Tous les tests doivent indiquer « 0 échec(s) ».
