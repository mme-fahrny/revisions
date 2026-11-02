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

## Conventions d'écriture (aide-mémoire)

Référence des élèves : **Aide-mémoire Mathématiques 9-10-11** (CIIP, édition
2024). Toutes les applis doivent écrire comme lui. Pour cela, **ne jamais
écrire les nombres « à la main » dans le code** : utiliser les fonctions
d'affichage de `assets/maths.js` (colonne de droite).

| # | Convention | Affichage | En saisie, on accepte | Fonction |
|---|---|---|---|---|
| 1 | Multiplication : point médian, jamais × ni x | `3 · 4`, `a · 10⁴` | `·`, `*`, `×`, et implicite `3x`, `2(x + 1)`, `a(b + 5)` | `Maths.versTexte` |
| 1 | Division : deux-points ou barre de fraction, jamais ÷ | `12 : 4`, `3/4` | `:`, `/`, `÷` | `Maths.versTexte`, `Maths.formaterFraction` |
| 2 | Listes, ensembles, coordonnées : point-virgule entouré d'espaces | `{ 1 ; 2 ; 3 }`, `(2 ; – 3)`, `ppmc (4 ; 6) = 12`, `S = { – 3 ; 3 }` | `;` avec ou sans espaces | `formaterListe`, `formaterEnsemble`, `formaterCoordonnees`, `formaterSolutions` ; lecture : `lireListe`, `lireEnsemble`, `ensemblesEgaux` |
| 3 | Virgule décimale, apostrophe pour les milliers | `31'500`, `1'000'000`, `2,5` | `31'500`, `31 500`, `31500` ; virgule ou point | `formaterNombre` |
| 3 | Décimale périodique : barre sur la période | `1,18` avec barre sur 18 | touche « période » du clavier (`1,1̅8̅`) ou `1,1818…` / `1,1818...` | `formaterNombre`, `Maths.html.nombre` |
| 4 | Montants en francs, comme les étiquettes suisses | `7.20 francs`, `CHF 7.20` | `7.20`, `7,20`, `7.–`, `CHF 7.20`, `7.20 fr.` | `formaterMontant`, `lireMontant` |
| 5 | Signe moins typographique | `– 3`, `x – 1` | `-`, `–`, `−` | toutes les fonctions d'affichage |
| 6 | Nombres relatifs (9e) : parenthèses et signe | `(+ 5)`, `(– 3)` ; écriture simplifiée `5`, `– 3` | `(+ 5)`, `(– 3)`, `5`, `-3` | `formaterRelatif(x)`, `formaterRelatif(x, { parentheses: false })` |
| 7 | Ensembles de nombres | `ℕ`, `ℤ`, `𝔻` (décimaux), `ℚ`, `ℝ` | `ℝ` ou `R` pour S = ℝ | `Maths.ENSEMBLES` |

Autres écritures : puissances `x²`, `(– 3)⁴`, `10⁻³` (`formaterPuissance`) ;
notation scientifique `3,2 · 10⁴` (`formaterNotationScientifique`) ; racines
`√2`, `∛8`, `3√(x + 1)` (`formaterRacine`) ; ensemble vide `S = { }` ;
tous les réels `S = ℝ`.

Détails typographiques produits par les fonctions :

- après le signe « – » d'un nombre (`– 3`) et avant chaque « ; », l'espace est
  **insécable** (U+00A0) pour éviter une coupure de ligne au mauvais endroit ;
- les éléments de listes et d'ensembles s'écrivent en décimal si l'écriture
  est finie (`0,75`), sinon en fraction (`1/3`) ;
- dans `formaterMontant`, les montants sont arrondis au centime ; « franc » au
  singulier sous 2 francs (`1.50 franc`), comme le veut l'usage en français.

À vérifier par l'enseignante : l'espacement exact du signe moins et des
puissances dans l'édition 2024 de l'aide-mémoire (ces fonctions suivent les
exemples `(2 ; – 3)` et `(– 3)` fournis).

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

**Calcul et correction**

- `new Maths.Alea(graine)` : `suivant()`, `entier(min, max)`,
  `entierNonNul(min, max)`, `choix(t)`, `melanger(t)`, `signe()`.
- `new Maths.Fraction(3, 4)`, `Maths.Fraction.depuis('2,5')` (accepte aussi
  `31'500`, `0,1666…`) : `plus`, `moins`, `fois`, `divise`, `puissance(k)`,
  `racine(k)` (exacte, sinon `ErreurIrrationnel`), `oppose`, `inverse`, `abs`,
  `compare`, `egal`, `estEntier`, `estZero`, `valeur()`, `versDecimal(n)`,
  `estDecimale()`, `estPeriodique()`, `developpementDecimal()`,
  `ecritureDecimale()`, `toString()` (« 3/4 », écriture technique).
- `Maths.analyser(texte)` : lit une expression. Accepte `·` `*` `×`, `:` `/`
  `÷`, `-` `–` `−`, la virgule décimale, les milliers avec apostrophe ou
  espace, les périodes (`1,1̅8̅`, `1,1818…`), `√` et `∛`, `^n`, `²`,
  la multiplication implicite (`3x`, `2(x + 1)`, `a(b + 5)`, `3√2`).
  Priorités de gauche à droite : `12 : 4 · 2 = 6`, `1/2x = (1/2) · x`.
  Le radical porte sur ce qui suit immédiatement : `√2x = √2 · x`,
  `√x² = √(x²)`. Lève `Maths.ErreurSaisie` avec un message en français.
- `Maths.evaluer(expr, { x: 2 })` (exact, `Fraction`) ;
  `Maths.evaluerApproche(expr, valeurs)` (Number, utile avec √) ;
  `Maths.lettres(expr)`.
- `Maths.equivalentes(reponse, attendu)` : même valeur en plusieurs points
  tirés au hasard ; calcul exact, sauf avec des racines non exactes
  (comparaison à 10⁻¹¹ près).
- Tests de forme : `estReduite(expr)`, `estReduiteOrdonnee(expr, lettre?)`,
  `estFractionIrreductible('3/4')`, `estNotationScientifique('3,2 · 10^4')`,
  `lireNotationScientifique(texte)`.
- Lecture : `lireMontant('7,20')`, `lireListe('(2 ; – 3)')`,
  `lireEnsemble('S = { – 3 ; 3 }')`, `ensemblesEgaux(reponse, attendu)`.

**Affichage** (voir le tableau des conventions ci-dessus)

| Fonction | Exemple |
|---|---|
| `versTexte(expr)` | `'3x^2-2(x+1)'` → `3x² – 2(x + 1)` |
| `formaterNombre(x, decimales?)` | `31500` → `31'500` ; `'13/11'` → `1,18` barré ; `(2/3, 2)` → `0,67` |
| `formaterFraction(x)` | `'-6/8'` → `– 3/4` |
| `formaterRelatif(x, options?)` | `-3` → `(– 3)` ; `{ parentheses: false }` → `– 3` ; `{ fraction: true }` |
| `formaterPuissance(base, n)` | `(-3, 4)` → `(– 3)⁴` ; `('x', 2)` → `x²` |
| `formaterNotationScientifique(x, decimales?)` | `32000` → `3,2 · 10⁴` |
| `formaterRacine(radicande, indice?, coefficient?)` | `('x + 1')` → `√(x + 1)` ; `(8, 3)` → `∛8` |
| `formaterMontant(x, { style })` | `7.2` → `7.20 francs` ; `{ style: 'CHF' }` → `CHF 7.20` |
| `formaterListe(t)`, `formaterEnsemble(t)`, `formaterCoordonnees(x, y)` | `1 ; 2 ; 3`, `{ 1 ; 2 }`, `(2 ; – 3)` |
| `formaterSolutions(t)` | `[3, -3]` → `S = { – 3 ; 3 }` ; `[]` → `S = { }` ; `'R'` → `S = ℝ` |
| `Maths.html.nombre(x)`, `Maths.html.fraction(x)` | HTML avec période barrée (`.periode`) ou fraction empilée (`.frac`) |

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
  barreOblique: 'fraction',                      // ou 'division' (voir ci-dessous)
  onValider: function (texte) { corriger(texte); }
});
```

Touches (disposition « complet ») : chiffres, virgule, `·`, `:`, `+`, `–`,
`;`, `√`, `∛`, fraction (`/`), exposant (`^`), parenthèses, période,
`x`, `y`, `a`, `b`, effacer, OK. La disposition « nombres » retire les
lettres et les racines.

- **Touche période** : barre le chiffre décimal juste avant le curseur ;
  chaque nouvel appui allonge la barre vers la gauche (taper `1,18` puis
  deux fois période donne 1,18 avec une barre sur 18).
- **Clavier physique** : il reste utilisable (Entrée = valider). Les signes
  tapés sont convertis : `*` et `×` → `·` ; `÷` → `:` ; `-` → `–` ;
  `/` reste une barre de fraction avec `barreOblique: 'fraction'` (par défaut),
  ou devient `:` avec `barreOblique: 'division'` (à choisir dans les
  exercices de division, par exemple sur les relatifs en 9e).
- Sur écran tactile, le clavier du téléphone ne s'ouvre pas
  (option `clavierNatif: true` pour le garder).
- Un aperçu sous le champ montre la saisie mise en forme (exposants,
  fractions empilées, période barrée).

### `commun.css`

Classes principales : `.entete`, `.page`, `.section`, `.grille-cartes`,
`.carte`, `.bouton`, `.bouton-secondaire`, `.bouton-discret`, `.champ`,
`.retour.juste` / `.retour.faux` / `.retour.info`, `.aide-memoire`,
`.etiquette`, `.visuellement-cache`, `.periode` (barre de période),
`.frac` (fraction empilée). Les couleurs sont des variables
(`--accent`, `--sciences`, `--juste`, `--faux`…) qui s'adaptent au thème
clair ou sombre de l'appareil.

## Tests

```bash
node tests/maths.test.js
```

Tous les tests doivent indiquer « 0 échec(s) ».
