/*
 * Test de l'interface de l'appli « Calcul littéral et équations » avec Playwright.
 * Lancer :  node tests/algebre.ui.test.js   (Playwright et Chromium doivent être installés)
 *
 * Pour 360 px et 1280 px de large, en thème clair et sombre (écran tactile simulé) :
 *   - une série complète de 10 questions par module disponible (une réponse sur deux juste),
 *     puis « Refaire les questions ratées » ;
 *   - une série d'outils visuels manipulés au doigt (touchers simulés) : tuiles (réduction),
 *     rectangle des produits, balance (opérations refusées, résolution, vérification par
 *     substitution), machine à substituer, graphique ;
 *   - l'écran « Outils » : glisser une tuile au doigt (événements tactiles), balance libre ;
 * en vérifiant : aucune erreur dans la console, aucun défilement horizontal, rétroactions
 * et corrections présentes, objectifs de niveau 2 absents au niveau 1.
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

/** Glisser au doigt d'un élément à un autre (événements tactiles bruts via le protocole Chrome). */
async function glisserAuDoigt(page, selA, selB) {
  await page.locator(selA).first().scrollIntoViewIfNeeded();
  var a = await page.locator(selA).first().boundingBox();
  var b = await page.locator(selB).first().boundingBox();
  var cdp = await page.context().newCDPSession(page);
  var x0 = a.x + a.width / 2, y0 = a.y + a.height / 2, x1 = b.x + b.width / 2, y1 = b.y + b.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (var k = 1; k <= 8; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * k / 8, y: y0 + (y1 - y0) * k / 8 }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  // Chromium attend la fin d'un éventuel double toucher avant le toucher suivant
  await page.waitForTimeout(600);
}

/* ---------- manipulation des outils visuels ---------- */
async function manipulerTuiles(page, ctx) {
  var paire = await page.evaluate(function () {
    var t = Array.prototype.slice.call(document.querySelectorAll('.tapis [data-tuile]'));
    for (var i = 0; i < t.length; i++) {
      for (var j = 0; j < t.length; j++) {
        if (t[i].dataset.forme === t[j].dataset.forme && t[i].dataset.signe === '1' && t[j].dataset.signe === '-1') return [t[i].dataset.tuile, t[j].dataset.tuile, t.length];
      }
    }
    return [null, null, t.length];
  });
  if (paire[0] !== null) {
    await toucher(page, '.tapis [data-tuile="' + paire[0] + '"]');
    verifier(await page.locator('.tapis [data-tuile="' + paire[0] + '"]').getAttribute('aria-pressed') === 'true', 'tuile non sélectionnée au toucher (' + ctx + ')');
    await toucher(page, '.tapis [data-tuile="' + paire[1] + '"]');
    var n = await page.locator('.tapis [data-tuile]').count();
    verifier(n === paire[2] - 2, 'paire de tuiles opposées non annulée (' + ctx + ') : ' + n + ' / ' + paire[2]);
  }
  await toucher(page, '[data-action="ranger"]');
  verifier(await page.locator('.rangee-tuiles').count() >= 1, 'tuiles non regroupées (' + ctx + ')');
}

async function manipulerAire(page, ctx) {
  var total = await page.locator('.case-aire').count();
  await toucher(page, '.case-aire[data-case="0"]');
  verifier(await page.locator('.case-aire[data-case="0"] rect.tuile-svg').count() === 1, 'case du rectangle non remplie au toucher (' + ctx + ')');
  await toucher(page, '[data-action="remplir"]');
  verifier(await page.locator('.case-aire rect.tuile-svg').count() === total, 'rectangle incomplet (' + ctx + ')');
  verifier(/rempli/.test(await page.textContent('.outil-aire .message-outil')), 'message du rectangle absent (' + ctx + ')');
}

async function remplirTerme(page, texte) {
  await page.fill('.outil-balance .ligne-terme input', texte);
}
async function manipulerBalance(page, ctx) {
  // opération appliquée à un seul membre : refusée, la balance penche
  await toucher(page, '.outil-balance .option-membre:nth-child(2)');
  await remplirTerme(page, '1');
  await toucher(page, '[data-action="appliquer"]');
  verifier(/DEUX membres/.test(await page.textContent('.outil-balance .message-outil')), 'opération sur un seul membre non refusée (' + ctx + ')');
  verifier(/penche/.test(await page.getAttribute('.fleau', 'class')), 'la balance ne penche pas (' + ctx + ')');
  await toucher(page, '.outil-balance .option-membre:nth-child(2)');
  // division par zéro et par l'inconnue : refusées
  await toucher(page, '.option-operation[data-operation="div"]');
  await remplirTerme(page, '0');
  await toucher(page, '[data-action="appliquer"]');
  verifier(/diviser par 0/.test(await page.textContent('.outil-balance .message-outil')), 'division par zéro non refusée (' + ctx + ')');
  await remplirTerme(page, 'x');
  await toucher(page, '[data-action="appliquer"]');
  verifier(/inconnue/.test(await page.textContent('.outil-balance .message-outil')), 'division par l\'inconnue non refusée (' + ctx + ')');
  // résolution : les opérations sont calculées à partir de l'équation affichée
  var plan = await page.evaluate(function () {
    var txt = document.querySelector('.outil-balance .petit').textContent.replace('Équation de départ : ', '');
    var parties = txt.split('=');
    var e = AlgebreModuleB.lineaire(parties[0], parties[1]);
    var ops = [];
    function t(f) { return f.toString(); }
    if (!e.c.estZero()) ops.push([e.c.signe() > 0 ? 'moins' : 'plus', t(e.c.abs()) + 'x']);
    if (!e.b.estZero()) ops.push([e.b.signe() > 0 ? 'moins' : 'plus', t(e.b.abs())]);
    var A = e.a.moins(e.c);
    if (!A.egal(1)) ops.push(['div', '(' + t(A) + ')']);
    var sol = e.d.moins(e.b).divise(A);
    return { ops: ops, g: parties[0], d: parties[1], sol: t(sol) };
  });
  for (var i = 0; i < plan.ops.length; i++) {
    await toucher(page, '.option-operation[data-operation="' + plan.ops[i][0] + '"]');
    await remplirTerme(page, plan.ops[i][1]);
    await toucher(page, '[data-action="appliquer"]');
  }
  verifier(/est isolé/.test(await page.textContent('.etat-balance')), 'x non isolé sur la balance (' + ctx + ') : ' + JSON.stringify(plan) + ' → ' + await page.textContent('.scene-balance'));
  verifier(await page.locator('.historique-balance li').count() === plan.ops.length, 'historique de la balance incomplet (' + ctx + ')');
  // vérification par substitution
  var valeurs = await page.evaluate(function (plan) {
    var v = { x: Maths.Fraction.depuis(plan.sol) };
    return [Maths.evaluer(plan.g, v).toString(), Maths.evaluer(plan.d, v).toString()];
  }, plan);
  await page.fill('[data-verif="g"]', valeurs[0]);
  await page.fill('[data-verif="d"]', valeurs[1]);
  await toucher(page, '[data-action="verifier-substitution"]');
  verifier(/vérifiée/.test(await page.textContent('.verif-substitution .message-outil')), 'vérification par substitution refusée (' + ctx + ')');
  return plan;
}

async function manipulerMachine(page, ctx) {
  var avant = await page.textContent('.sorties-machine');
  await toucher(page, '[data-pas="+x"]');
  var apres = await page.textContent('.sorties-machine');
  verifier(avant !== apres, 'la machine à substituer ne réagit pas (' + ctx + ')');
}

async function manipulerGraphique(page, ctx) {
  await toucher(page, '.svg-graphique');
  verifier(/^x = /.test((await page.textContent('.lecture-graphique')).trim()), 'lecture du graphique absente (' + ctx + ')');
  await toucher(page, '[data-action="droite"]');
}

async function manipulerVisuel(page, type, ctx) {
  if (type === 'tuiles') await manipulerTuiles(page, ctx);
  else if (type === 'aire') await manipulerAire(page, ctx);
  else if (type === 'balance') await manipulerBalance(page, ctx);
  else if (type === 'machine') await manipulerMachine(page, ctx);
  else if (type === 'graphique') await manipulerGraphique(page, ctx);
}

/* ---------- réponses ---------- */
async function repondre(page, juste, ctx) {
  var info = await page.evaluate(function (juste) {
    var q = window.AlgebreApp.questionCourante();
    var ex = q.exemples();
    var r = { mode: q.mode, objectif: q.objectif, visuel: q.visuel ? q.visuel.type : null };
    if (q.mode === 'choix') r.index = q.choix.findIndex(function (c) { return c.juste === juste; });
    else r.texte = juste ? ex.justes[0] : (ex.faux[0] || '123456');
    return r;
  }, juste);
  if (info.mode === 'choix') await toucher(page, 'label[for="choix-' + info.index + '"]');
  else await page.fill('#reponse', info.texte);
  await toucher(page, '#verifier');
  var classe = await page.getAttribute('#retour', 'class');
  verifier(!/info/.test(classe), 'réponse jugée illisible (' + ctx + ' ' + info.objectif + ') : ' + JSON.stringify(info) + ' → ' + await page.textContent('#retour'));
  verifier(juste ? /juste/.test(classe) : /faux/.test(classe), 'verdict inattendu (' + ctx + ' ' + info.objectif + ', attendu ' + (juste ? 'juste' : 'faux') + ') : ' + JSON.stringify(info) + ' → ' + await page.textContent('#retour'));
  verifier(await page.locator('.correction').count() === 1, 'correction absente (' + info.objectif + ')');
  if (!juste) verifier((await page.textContent('#retour')).length > 20, 'rétroaction trop courte (' + info.objectif + ')');
  return info;
}

async function serieComplete(page, module, ctx) {
  await toucher(page, '[data-module="' + module + '"]');
  await page.waitForSelector('#commencer');
  await toucher(page, 'text=Tout cocher');
  await toucher(page, '#commencer');
  await page.waitForSelector('#verifier');
  for (var i = 0; i < 10; i++) {
    await pasDeDefilement(page, ctx + ' ' + module + ' question ' + (i + 1));
    if (i === 2) await capture(page, ctx + '-' + module + '-q3');
    var vis = await page.evaluate(function () { var q = AlgebreApp.questionCourante(); return q.visuel ? q.visuel.type : null; });
    if (vis) await manipulerVisuel(page, vis, ctx + ' ' + module + ' q' + (i + 1));
    await repondre(page, i % 2 === 0, ctx + ' ' + module);
    await pasDeDefilement(page, ctx + ' ' + module + ' correction ' + (i + 1));
    if (i === 3) await capture(page, ctx + '-' + module + '-correction');
    await toucher(page, '#suivant');
  }
  await page.waitForSelector('.table-bilan');
  verifier(/^5 \/ 10/.test((await page.textContent('.score')).trim()), 'score inattendu : ' + await page.textContent('.score'));
  await pasDeDefilement(page, ctx + ' ' + module + ' bilan');
  await capture(page, ctx + '-' + module + '-bilan');
  await toucher(page, '#refaire');
  for (var k = 0; k < 5; k++) {
    await page.waitForSelector('#verifier');
    await repondre(page, true, ctx + ' ' + module + ' refaire');
    await toucher(page, '#suivant');
  }
  await page.waitForSelector('.table-bilan');
  verifier(/^5 \/ 5/.test((await page.textContent('.score')).trim()), 'bilan après « Refaire » : ' + await page.textContent('.score'));
  await toucher(page, '#autres-modules');
}

async function serieVisuels(page, ctx) {
  var types = await page.evaluate(function () {
    var A = window.Algebre, al = new Maths.Alea('ui-visuels');
    function trouver(id, type, p, deja) {
      for (var k = 0; k < 300; k++) {
        var q = A.creerQuestion(A.parId[id], al, p, {}, JSON.parse(JSON.stringify(deja)));
        if (q.visuel && q.visuel.type === type) { q.statut = 'courant'; q.compte = true; return q; }
      }
      throw new Error('visuel introuvable : ' + id + ' ' + type);
    }
    var qs = [
      trouver('A10-red', 'tuiles', 2, { erreur: 1, vraifaux: 1 }),
      trouver('A10-mul', 'aire', 2, {}),
      trouver('B10-res', 'balance', 2, { directe: 1, erreur: 1 }),
      trouver('A9-val', 'machine', 2, { directe: 1 }),
      trouver('B10-graph', 'graphique', 3, {}),
      trouver('A9-geo', 'figure', 2, {})
    ];
    AlgebreApp.demarrerSerie(qs);
    return qs.map(function (q) { return q.visuel.type; });
  });
  for (var i = 0; i < types.length; i++) {
    await page.waitForSelector('#verifier');
    await pasDeDefilement(page, ctx + ' visuel ' + types[i]);
    await manipulerVisuel(page, types[i], ctx + ' visuel');
    await pasDeDefilement(page, ctx + ' visuel ' + types[i] + ' manipulé');
    await capture(page, ctx + '-visuel-' + types[i]);
    await repondre(page, true, ctx + ' visuel ' + types[i]);
    await toucher(page, '#suivant');
  }
  await page.waitForSelector('.table-bilan');
  verifier(/^6 \/ 6/.test((await page.textContent('.score')).trim()), 'bilan des visuels : ' + await page.textContent('.score'));
  await toucher(page, '#autres-modules');
}

async function ecranOutils(page, ctx, avecBalance) {
  // tuiles : exemple, glisser au doigt une tuile sur son opposée
  await toucher(page, '[data-outil="tuiles"]');
  await page.waitForSelector('.tapis [data-tuile]');
  var paire = await page.evaluate(function () {
    var t = Array.prototype.slice.call(document.querySelectorAll('.tapis [data-tuile]'));
    for (var i = 0; i < t.length; i++) for (var j = 0; j < t.length; j++) {
      if (t[i].dataset.forme === t[j].dataset.forme && t[i].dataset.signe === '1' && t[j].dataset.signe === '-1') return [t[i].dataset.tuile, t[j].dataset.tuile, t.length];
    }
    return null;
  });
  verifier(!!paire, 'aucune paire opposée dans l\'exemple de tuiles');
  if (paire) {
    await glisserAuDoigt(page, '.tapis [data-tuile="' + paire[0] + '"]', '.tapis [data-tuile="' + paire[1] + '"]');
    var n = await page.locator('.tapis [data-tuile]').count();
    verifier(n === paire[2] - 2, 'glisser une tuile au doigt ne l\'annule pas (' + ctx + ') : ' + n + ' / ' + paire[2]);
  }
  verifier(/Sur le tapis : x² – 2x \+ 3/.test(await page.textContent('.total-tuiles')), 'total du tapis faux : ' + await page.textContent('.total-tuiles'));
  await toucher(page, '[data-action="afficher-aire"]');
  await manipulerAire(page, ctx + ' outils');
  verifier(/Aire = 2x² \+ 7x \+ 6/.test(await page.textContent('.outil-aire .message-outil')), 'aire du rectangle libre fausse : ' + await page.textContent('.outil-aire .message-outil'));
  await pasDeDefilement(page, ctx + ' outil tuiles');
  await capture(page, ctx + '-outil-tuiles');
  await toucher(page, 'text=← Modules et outils');
  if (avecBalance) {
    await toucher(page, '[data-outil="balance"]');
    await page.waitForSelector('.outil-balance');
    var plan = await manipulerBalance(page, ctx + ' outils');
    verifier(plan.sol === '4', 'solution de 3x + 5 = x + 13 : ' + plan.sol);
    await toucher(page, '[data-action="annuler"]');
    verifier(await page.locator('.historique-balance li').count() === plan.ops.length - 1, 'annulation de la dernière opération');
    await pasDeDefilement(page, ctx + ' outil balance');
    await capture(page, ctx + '-outil-balance');
    await toucher(page, 'text=← Modules et outils');
  } else {
    verifier(await page.locator('[data-outil="balance"]').count() === 0, 'balance proposée avant la 10e');
  }
  await toucher(page, '[data-outil="machine"]');
  await page.waitForSelector('.outil-machine');
  verifier(/contre-exemple/.test(await page.textContent('.sorties-machine')), 'machine : 5 + 3x et 8x non distingués pour x = 2');
  await toucher(page, '[data-pas="-x"]');
  await toucher(page, '[data-pas="-x"]');
  verifier(/même valeur/.test(await page.textContent('.sorties-machine')), 'machine : 5 + 3x = 8x pour x = 1 non détecté');
  await pasDeDefilement(page, ctx + ' outil machine');
  await toucher(page, 'text=← Modules et outils');
}

(async function () {
  var s = await serveur();
  var port = s.address().port;
  var navigateur = await playwright.chromium.launch();
  var configs = [
    { largeur: 360, hauteur: 740, theme: 'light', profil: { annee: 9, niveau: 1 }, mobile: true },
    { largeur: 360, hauteur: 740, theme: 'dark', profil: { annee: 11, niveau: 2 }, mobile: true },
    { largeur: 1280, hauteur: 900, theme: 'light', profil: { annee: 10, niveau: 1 } },
    { largeur: 1280, hauteur: 900, theme: 'dark', profil: { annee: 10, niveau: 2 } }
  ];
  for (var c = 0; c < configs.length; c++) {
    var cf = configs[c];
    var ctx = cf.largeur + 'px-' + cf.theme;
    var contexte = await navigateur.newContext({ viewport: { width: cf.largeur, height: cf.hauteur }, colorScheme: cf.theme, hasTouch: true, isMobile: !!cf.mobile });
    await contexte.addInitScript(function (p) {
      try { if (!sessionStorage.getItem('init')) { localStorage.clear(); localStorage.setItem('revisions.profil', JSON.stringify(p)); sessionStorage.setItem('init', '1'); } } catch (e) { /* rien */ }
    }, cf.profil);
    var page = await contexte.newPage();
    var erreurs = [];
    page.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(m.type() + ' : ' + m.text()); });
    page.on('pageerror', function (e) { erreurs.push('exception : ' + e.message); });
    await page.goto('http://localhost:' + port + '/algebre/');
    await page.waitForSelector('[data-module="A"]');
    await capture(page, ctx + '-accueil');
    await pasDeDefilement(page, ctx + ' accueil');
    var modules = cf.profil.annee >= 10 ? ['A', 'B'] : ['A'];
    if (cf.profil.annee < 10) verifier(await page.locator('[data-module-inactif="B"]').count() === 1, 'module B proposé en 9e');
    if (cf.profil.annee === 10 && cf.profil.niveau === 1) {
      await toucher(page, '[data-module="A"]');
      verifier(await page.locator('#obj-A10-mul').count() === 0, 'objectif de niveau 2 (multiplier des polynômes) proposé au niveau 1');
      verifier(await page.locator('#obj-A11-fact').count() === 0, 'objectif de 11e proposé en 10e');
      await toucher(page, 'text=← Modules et outils');
      await toucher(page, '[data-module="B"]');
      verifier(await page.locator('#obj-B10-graph').count() === 0, 'résolution graphique (niveau 2) proposée au niveau 1');
      await toucher(page, 'text=← Modules et outils');
    }
    for (var mi = 0; mi < modules.length; mi++) {
      try { await serieComplete(page, modules[mi], ctx); } catch (e) {
        verifier(false, ctx + ' module ' + modules[mi] + ' : ' + e.message);
        await capture(page, ctx + '-' + modules[mi] + '-ERREUR');
        await page.goto('http://localhost:' + port + '/algebre/');
        await page.waitForSelector('[data-module="A"]');
      }
    }
    try { await serieVisuels(page, ctx); } catch (e) {
      verifier(false, ctx + ' visuels : ' + e.message);
      await capture(page, ctx + '-visuels-ERREUR');
      await page.goto('http://localhost:' + port + '/algebre/');
      await page.waitForSelector('[data-module="A"]');
    }
    try { await ecranOutils(page, ctx, cf.profil.annee >= 10); } catch (e) {
      verifier(false, ctx + ' outils : ' + e.message);
      await capture(page, ctx + '-outils-ERREUR');
    }
    var stock = await page.evaluate(function () { return localStorage.getItem('revisions.algebre.progression'); });
    verifier(!!stock && Object.keys(JSON.parse(stock)).length > 0, 'progression non enregistrée (' + ctx + ')');
    verifier(erreurs.length === 0, 'erreurs console (' + ctx + ') : ' + erreurs.join(' | '));
    await contexte.close();
  }
  // Sans profil : la fenêtre de choix s'ouvre, puis l'appli s'affiche
  var ctx2 = await navigateur.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true });
  var p2 = await ctx2.newPage();
  var err2 = [];
  p2.on('pageerror', function (e) { err2.push(e.message); });
  await p2.goto('http://localhost:' + port + '/algebre/');
  await p2.waitForSelector('.profil-dialogue[open]');
  await p2.click('.profil-dialogue label:has-text("11e")');
  await p2.click('.profil-dialogue label:has-text("Niveau 1")');
  await p2.click('.profil-dialogue button[type=submit]');
  await p2.waitForSelector('[data-module="B"]');
  await p2.click('[data-module="B"]');
  verifier(await p2.locator('#obj-B11-sys').count() === 0, 'systèmes (niveau 2) proposés au niveau 1');
  verifier(await p2.locator('#obj-B11-graph').count() === 1, 'résolution graphique absente en 11e niveau 1');
  verifier(err2.length === 0, 'erreurs sans profil : ' + err2.join(' | '));
  await ctx2.close();

  await navigateur.close();
  s.close();
  console.log(reussis + ' test(s) réussi(s), ' + echecs + ' échec(s).');
  process.exitCode = echecs ? 1 : 0;
})().catch(function (e) { console.error(e); process.exit(1); });
