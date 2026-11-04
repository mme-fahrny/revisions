/*
 * Test de l'interface de l'appli « Fonctions » avec Playwright.
 * Lancer :  node tests/fonctions.ui.test.js   (Playwright et Chromium doivent être installés)
 *
 * Pour 360 px et 1280 px de large, en thème clair et sombre (écran tactile simulé) :
 *   - une série complète de 10 questions par module disponible et par difficulté testée
 *     (une réponse sur deux juste), puis « Refaire les questions ratées » ;
 *   - une série qui passe par tous les modèles de questions du module (graphiques et
 *     tableaux en option à 360 px compris) ;
 * en vérifiant : aucune erreur dans la console, aucun défilement horizontal, rétroactions
 * et corrections présentes, progression enregistrée, modules non disponibles grisés.
 * Captures d'écran dans le dossier CAPTURES (variable d'environnement), sinon aucune.
 */
'use strict';
var http = require('http');
var fs = require('fs');
var path = require('path');
var playwright;
try { playwright = require('playwright'); } catch (e) {
  console.log('Playwright n\'est pas installé : test de l\'interface ignoré.');
  process.exit(0);
}

var RACINE = path.join(__dirname, '..');
var CAPTURES = process.env.CAPTURES || '';
var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function serveur() {
  return new Promise(function (ok) {
    var s = http.createServer(function (req, res) {
      var url = decodeURIComponent(req.url.split('?')[0]);
      if (url.endsWith('/')) url += 'index.html';
      var f = path.join(RACINE, url);
      if (f.indexOf(RACINE) !== 0 || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, function () { ok(s); });
  });
}

var echecs = 0, reussis = 0;
function verifier(cond, msg) { if (cond) reussis++; else { echecs++; console.error('ÉCHEC  ' + msg); } }
async function capture(page, nom) { if (CAPTURES) await page.screenshot({ path: path.join(CAPTURES, nom + '.png'), fullPage: true }); }

async function pasDeDefilement(page, contexte) {
  var d = await page.evaluate(function () {
    return { doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, w: window.innerWidth };
  });
  verifier(d.doc <= d.w + 1 && d.body <= d.w + 1, 'défilement horizontal (' + contexte + ') : ' + JSON.stringify(d));
}

/** Toucher un élément au doigt (événements tactiles simulés par Playwright). */
async function toucher(page, sel) {
  var loc = typeof sel === 'string' ? page.locator(sel).first() : sel;
  await loc.scrollIntoViewIfNeeded();
  await loc.tap();
}

/* ---------- réponses ---------- */
async function repondre(page, juste, ctx) {
  var info = await page.evaluate(function (juste) {
    var q = window.FonctionsApp.questionCourante();
    var ex = q.exemples();
    var r = { mode: q.mode, objectif: q.objectif, modele: q.modele, juste: juste };
    if (q.mode === 'choix') r.index = q.choix.findIndex(function (c) { return c.juste === juste; });
    else r.texte = juste ? ex.justes[0] : ex.faux[0];
    return r;
  }, juste);
  if (info.mode === 'choix') await toucher(page, 'label[for="choix-' + info.index + '"]');
  else await page.fill('#reponse', info.texte);
  await toucher(page, '#verifier');
  var classe = await page.getAttribute('#retour', 'class');
  verifier(!/info/.test(classe), 'réponse jugée illisible (' + ctx + ' ' + info.modele + ') : ' + JSON.stringify(info) + ' → ' + await page.textContent('#retour'));
  verifier(juste ? /juste/.test(classe) : /faux/.test(classe), 'verdict inattendu (' + ctx + ' ' + info.modele + ') : ' + JSON.stringify(info) + ' → ' + await page.textContent('#retour'));
  verifier(await page.locator('.correction').count() === 1, 'correction absente (' + info.modele + ')');
  verifier(/ÉTAPE 1/.test(await page.textContent('.correction')), 'correction sans ÉTAPE 1 (' + info.modele + ')');
  verifier(/Voir l'aide-mémoire, rubrique/.test(await page.textContent('.correction')), 'renvoi à l\'aide-mémoire absent (' + info.modele + ')');
  if (!juste) verifier((await page.textContent('#retour')).length > 20, 'rétroaction trop courte (' + info.modele + ')');
  return info;
}

async function finirSerie(page, ctx, n) {
  var nbJustes = 0;
  for (var i = 0; i < n; i++) {
    await page.waitForSelector('#verifier');
    await pasDeDefilement(page, ctx + ' question ' + (i + 1));
    if (i === 0) {
      await toucher(page, '#bouton-indice');
      verifier(await page.isVisible('#zone-indice'), 'indice non affiché (' + ctx + ')');
    }
    if (i === 2) await capture(page, ctx + '-q3');
    if ((await repondre(page, i % 2 === 0, ctx)).juste) nbJustes++;
    await pasDeDefilement(page, ctx + ' correction ' + (i + 1));
    if (i === 3) await capture(page, ctx + '-correction');
    await toucher(page, '#suivant');
  }
  await page.waitForSelector('.table-bilan');
  return nbJustes;
}

async function serieComplete(page, module, difficulte, ctx) {
  await toucher(page, '[data-module="' + module + '"]');
  await page.waitForSelector('#commencer');
  await toucher(page, 'text=Tout cocher');
  await page.evaluate(function (d) { var c = document.getElementById('difficulte'); c.value = String(d); c.dispatchEvent(new Event('input')); }, difficulte);
  verifier(new RegExp('Difficulté ' + difficulte + ' sur 4').test(await page.textContent('#difficulte-texte')), 'curseur de difficulté (' + ctx + ')');
  await toucher(page, '#commencer');
  var c = ctx + ' ' + module + ' D' + difficulte;
  var nbJustes = await finirSerie(page, c, 10);
  verifier((await page.textContent('.score')).trim().indexOf(nbJustes + ' / 10') === 0, 'score inattendu (' + c + ') : ' + await page.textContent('.score'));
  await pasDeDefilement(page, c + ' bilan');
  await capture(page, c + '-bilan');
  await toucher(page, '#refaire');
  for (var k = 0; k < 10 - nbJustes; k++) {
    await page.waitForSelector('#verifier');
    await repondre(page, true, c + ' refaire');
    await toucher(page, '#suivant');
  }
  await page.waitForSelector('.table-bilan');
  var rat = 10 - nbJustes;
  verifier((await page.textContent('.score')).trim().indexOf(rat + ' / ' + rat) === 0, 'bilan après « Refaire » (' + c + ') : ' + await page.textContent('.score'));
  await toucher(page, '#autres-modules');
}

/** Une série qui contient un exemple de chaque modèle du module (toutes difficultés). */
async function tousLesModeles(page, module, ctx) {
  var n = await page.evaluate(function (module) {
    var F = window.Fonctions, al = new Maths.Alea('ui-modeles-' + module), qs = [];
    var profil = Profil.get();
    F.objectifsPour(module, profil).forEach(function (d) {
      d.objectif.modeles.forEach(function (m) {
        var q = F.creerQuestion(d.objectif, al, m.dMin || 1, profil, {}, true, m);
        q.statut = d.statut; q.compte = true; qs.push(q);
      });
    });
    FonctionsApp.demarrerSerie(qs);
    return qs.length;
  }, module);
  await finirSerie(page, ctx + ' ' + module + ' tous les modèles', n);
  await toucher(page, '#autres-modules');
}

(async function () {
  var s = await serveur();
  var port = s.address().port;
  var navigateur = await playwright.chromium.launch();
  var configs = [
    { largeur: 360, hauteur: 740, theme: 'light', profil: { annee: 9, niveau: 1 }, mobile: true, difficultes: [1, 3] },
    { largeur: 360, hauteur: 740, theme: 'dark', profil: { annee: 9, niveau: 2 }, mobile: true, difficultes: [2, 4] },
    { largeur: 1280, hauteur: 900, theme: 'light', profil: { annee: 10, niveau: 1 }, difficultes: [2] },
    { largeur: 1280, hauteur: 900, theme: 'dark', profil: { annee: 11, niveau: 2 }, difficultes: [4] }
  ];
  for (var c = 0; c < configs.length; c++) {
    var cf = configs[c];
    var ctx = cf.largeur + 'px-' + cf.theme + '-' + cf.profil.annee + 'e-N' + cf.profil.niveau;
    var contexte = await navigateur.newContext({ viewport: { width: cf.largeur, height: cf.hauteur }, colorScheme: cf.theme, hasTouch: true, isMobile: !!cf.mobile });
    await contexte.addInitScript(function (p) {
      try { if (!sessionStorage.getItem('init')) { localStorage.clear(); localStorage.setItem('revisions.profil', JSON.stringify(p)); sessionStorage.setItem('init', '1'); } } catch (e) { /* rien */ }
    }, cf.profil);
    var page = await contexte.newPage();
    var erreurs = [];
    page.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(m.type() + ' : ' + m.text()); });
    page.on('pageerror', function (e) { erreurs.push('exception : ' + e.message); });
    await page.goto('http://localhost:' + port + '/fonctions/');
    await page.waitForSelector('[data-module="A"]');
    await capture(page, ctx + '-accueil');
    await pasDeDefilement(page, ctx + ' accueil');
    var modules = await page.evaluate(function () { return Array.prototype.map.call(document.querySelectorAll('[data-module]'), function (b) { return b.getAttribute('data-module'); }); });
    verifier(modules.indexOf('A') >= 0, 'module A absent (' + ctx + ')');
    if (cf.profil.annee === 9) verifier(await page.locator('[data-module-inactif="B"]').count() === 1 && await page.locator('[data-module-inactif="C"]').count() === 1, 'modules B ou C proposés en 9e');
    for (var mi = 0; mi < modules.length; mi++) {
      for (var di = 0; di < cf.difficultes.length; di++) {
        try { await serieComplete(page, modules[mi], cf.difficultes[di], ctx); } catch (e) {
          verifier(false, ctx + ' module ' + modules[mi] + ' : ' + e.message);
          await capture(page, ctx + '-' + modules[mi] + '-ERREUR');
          await page.goto('http://localhost:' + port + '/fonctions/');
          await page.waitForSelector('[data-module="A"]');
        }
      }
      if (cf.mobile) {
        try { await tousLesModeles(page, modules[mi], ctx); } catch (e) {
          verifier(false, ctx + ' tous les modèles ' + modules[mi] + ' : ' + e.message);
          await capture(page, ctx + '-modeles-ERREUR');
          await page.goto('http://localhost:' + port + '/fonctions/');
          await page.waitForSelector('[data-module="A"]');
        }
      }
    }
    var stock = await page.evaluate(function () { return localStorage.getItem('revisions.fonctions.progression'); });
    verifier(!!stock && Object.keys(JSON.parse(stock)).length > 0, 'progression non enregistrée (' + ctx + ')');
    verifier(erreurs.length === 0, 'erreurs console (' + ctx + ') : ' + erreurs.join(' | '));
    await contexte.close();
  }
  // Sans profil : la fenêtre de choix s'ouvre, puis l'appli s'affiche
  var ctx2 = await navigateur.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true });
  var p2 = await ctx2.newPage();
  var err2 = [];
  p2.on('pageerror', function (e) { err2.push(e.message); });
  await p2.goto('http://localhost:' + port + '/fonctions/');
  await p2.waitForSelector('.profil-dialogue[open]');
  await p2.click('.profil-dialogue label:has-text("10e")');
  await p2.click('.profil-dialogue label:has-text("Niveau 1")');
  await p2.click('.profil-dialogue button[type=submit]');
  await p2.waitForSelector('[data-module="A"]');
  await p2.click('[data-module="A"]');
  verifier(await p2.locator('.groupe-revision #obj-A1').count() === 1, 'module A non proposé en révision en 10e');
  verifier(err2.length === 0, 'erreurs sans profil : ' + err2.join(' | '));
  await ctx2.close();

  await navigateur.close();
  s.close();
  console.log(reussis + ' test(s) réussi(s), ' + echecs + ' échec(s).');
  process.exitCode = echecs ? 1 : 0;
})().catch(function (e) { console.error(e); process.exit(1); });
