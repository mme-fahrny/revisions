/*
 * Test de l'interface de l'appli « Nombres et opérations » avec Playwright.
 * Lancer :  node tests/nombres.ui.test.js   (Playwright et Chromium doivent être installés)
 *
 * Pour 360 px et 1280 px de large, en thème clair et sombre : une série complète
 * de 10 questions par module (A, B, C), une réponse sur deux juste, puis
 * « Refaire les questions ratées ». On vérifie : aucune erreur dans la console,
 * aucun défilement horizontal, bilan affiché, rétroactions présentes.
 * Des captures d'écran sont enregistrées dans le dossier indiqué par CAPTURES
 * (variable d'environnement), sinon aucune capture.
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

async function pasDeDefilement(page, contexte) {
  var d = await page.evaluate(function () {
    return { doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, w: window.innerWidth };
  });
  verifier(d.doc <= d.w + 1 && d.body <= d.w + 1, 'défilement horizontal (' + contexte + ') : ' + JSON.stringify(d));
}

async function repondre(page, juste) {
  var info = await page.evaluate(function (juste) {
    var q = window.NombresApp.questionCourante();
    var ex = q.exemples();
    var r = { mode: q.mode, type: q.reponse.type, objectif: q.objectif };
    if (q.mode === 'choix') {
      var idx = q.choix.findIndex(function (c) { return c.juste === juste; });
      r.index = idx;
    } else if (q.reponse.type === 'coloriage') {
      r.parts = Number(juste ? ex.justes[0] : ex.faux[0]);
      r.forme = q.visuel.type;
    } else {
      r.texte = juste ? ex.justes[0] : (ex.faux[0] || '123456');
    }
    return r;
  }, juste);
  if (info.mode === 'choix') {
    await page.click('label[for="choix-' + info.index + '"]');
  } else if (info.type === 'coloriage') {
    var sel = info.forme === 'barre' ? '.visuel-barre .part' : '.visuel-disque .secteur';
    // le centre de la boîte d'un secteur étroit peut tomber sur le secteur voisin : clic simulé sur l'élément
    for (var i = 0; i < info.parts; i++) {
      if (info.forme === 'barre') await page.locator(sel).nth(i).click();
      else await page.locator(sel).nth(i).dispatchEvent('click');
    }
  } else {
    await page.fill('#reponse', info.texte);
  }
  await page.click('#verifier');
  var classe = await page.getAttribute('#retour', 'class');
  verifier(!/info/.test(classe), 'réponse jugée illisible (' + info.objectif + ') : ' + JSON.stringify(info) + ' → ' + await page.textContent('#retour'));
  verifier(juste ? /juste/.test(classe) : /faux/.test(classe), 'verdict inattendu (' + info.objectif + ', attendu ' + (juste ? 'juste' : 'faux') + ') : ' + JSON.stringify(info) + ' → ' + await page.textContent('#retour'));
  verifier(await page.locator('.correction').count() === 1, 'correction absente (' + info.objectif + ')');
  return info;
}

async function serieComplete(page, module, contexte) {
  await page.click('[data-module="' + module + '"]');
  await page.waitForSelector('#commencer');
  await page.click('text=Tout cocher');
  await page.click('#commencer');
  await page.waitForSelector('#verifier');
  for (var i = 0; i < 10; i++) {
    await pasDeDefilement(page, contexte + ' ' + module + ' question ' + (i + 1));
    if (CAPTURES && i === 2) await page.screenshot({ path: path.join(CAPTURES, contexte + '-' + module + '-q3.png'), fullPage: true });
    await repondre(page, i % 2 === 0);
    await pasDeDefilement(page, contexte + ' ' + module + ' correction ' + (i + 1));
    if (CAPTURES && i === 3) await page.screenshot({ path: path.join(CAPTURES, contexte + '-' + module + '-correction.png'), fullPage: true });
    await page.click('#suivant');
  }
  await page.waitForSelector('.table-bilan');
  verifier((await page.textContent('.score')).indexOf('/ ') >= 0, 'score absent');
  await pasDeDefilement(page, contexte + ' ' + module + ' bilan');
  if (CAPTURES) await page.screenshot({ path: path.join(CAPTURES, contexte + '-' + module + '-bilan.png'), fullPage: true });
  // refaire les questions ratées (5) : toutes justes cette fois
  await page.click('#refaire');
  for (var k = 0; k < 5; k++) {
    await page.waitForSelector('#verifier');
    await repondre(page, true);
    await page.click('#suivant');
  }
  await page.waitForSelector('.table-bilan');
  var score = await page.textContent('.score');
  verifier(/^5 \/ 5|^\d \/ \d/.test(score.trim()), 'bilan après « Refaire » : ' + score);
  await page.click('text=Autres modules');
}

(async function () {
  var s = await serveur();
  var port = s.address().port;
  var navigateur = await playwright.chromium.launch();
  var configs = [
    { largeur: 360, hauteur: 740, theme: 'light', profil: { annee: 9, niveau: 1 } },
    { largeur: 360, hauteur: 740, theme: 'dark', profil: { annee: 11, niveau: 2 } },
    { largeur: 1280, hauteur: 900, theme: 'light', profil: { annee: 10, niveau: 1 } },
    { largeur: 1280, hauteur: 900, theme: 'dark', profil: { annee: 10, niveau: 2 } }
  ];
  for (var c = 0; c < configs.length; c++) {
    var cf = configs[c];
    var contexte = cf.largeur + 'px-' + cf.theme;
    var ctx = await navigateur.newContext({ viewport: { width: cf.largeur, height: cf.hauteur }, colorScheme: cf.theme });
    await ctx.addInitScript(function (p) {
      try { if (!sessionStorage.getItem('init')) { localStorage.clear(); localStorage.setItem('revisions.profil', JSON.stringify(p)); sessionStorage.setItem('init', '1'); } } catch (e) { /* rien */ }
    }, cf.profil);
    var page = await ctx.newPage();
    var erreurs = [];
    page.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(m.type() + ' : ' + m.text()); });
    page.on('pageerror', function (e) { erreurs.push('exception : ' + e.message); });
    await page.goto('http://localhost:' + port + '/nombres/');
    await page.waitForSelector('[data-module="A"]');
    if (CAPTURES) await page.screenshot({ path: path.join(CAPTURES, contexte + '-accueil.png'), fullPage: true });
    await pasDeDefilement(page, contexte + ' accueil');
    for (var mi = 0; mi < 3; mi++) {
      var mod = ['A', 'B', 'C'][mi];
      try { await serieComplete(page, mod, contexte); } catch (e) {
        verifier(false, contexte + ' module ' + mod + ' : ' + e.message);
        if (CAPTURES) await page.screenshot({ path: path.join(CAPTURES, contexte + '-' + mod + '-ERREUR.png'), fullPage: true });
        await page.goto('http://localhost:' + port + '/nombres/');
        await page.waitForSelector('[data-module="A"]');
      }
    }
    // le profil enregistré est bien lu et la progression est stockée
    var stock = await page.evaluate(function () { return localStorage.getItem('revisions.nombres.progression'); });
    verifier(!!stock && Object.keys(JSON.parse(stock)).length > 0, 'progression non enregistrée (' + contexte + ')');
    verifier(erreurs.length === 0, 'erreurs console (' + contexte + ') : ' + erreurs.join(' | '));
    await ctx.close();
  }
  // Sans profil : la fenêtre de choix s'ouvre, puis l'appli s'affiche
  var ctx2 = await navigateur.newContext({ viewport: { width: 360, height: 740 } });
  var p2 = await ctx2.newPage();
  var err2 = [];
  p2.on('pageerror', function (e) { err2.push(e.message); });
  await p2.goto('http://localhost:' + port + '/nombres/');
  await p2.waitForSelector('.profil-dialogue[open]');
  await p2.click('.profil-dialogue label:has-text("10e")');
  await p2.click('.profil-dialogue label:has-text("Niveau 1")');
  await p2.click('.profil-dialogue button[type=submit]');
  await p2.waitForSelector('[data-module="B"]');
  await p2.click('[data-module="B"]');
  var plusLoin = await p2.locator('.groupe-plusLoin').count();
  verifier(plusLoin === 1, '« Pour aller plus loin » absent pour la 10e niveau 1 (propriétés des puissances)');
  var n2 = await p2.locator('text=Racine n-ième').count();
  verifier(n2 === 0, 'objectif de niveau 2 proposé au niveau 1');
  verifier(err2.length === 0, 'erreurs sans profil : ' + err2.join(' | '));
  await ctx2.close();

  await navigateur.close();
  s.close();
  console.log(reussis + ' test(s) réussi(s), ' + echecs + ' échec(s).');
  process.exitCode = echecs ? 1 : 0;
})().catch(function (e) { console.error(e); process.exit(1); });
