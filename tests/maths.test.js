/*
 * Tests du moteur assets/maths.js — sans dépendance.
 * Lancer :  node tests/maths.test.js
 */
'use strict';
var path = require('path');
var M = require(path.join(__dirname, '..', 'assets', 'maths.js'));
var F = M.Fraction;

var reussis = 0, echecs = 0;
function test(nom, fn) {
  try { fn(); reussis++; }
  catch (e) { echecs++; console.error('ÉCHEC  ' + nom + '\n        ' + e.message); }
}
function egal(obtenu, attendu, msg) {
  if (obtenu !== attendu) {
    throw new Error((msg ? msg + ' : ' : '') + 'obtenu ' + JSON.stringify(String(obtenu)) +
      ', attendu ' + JSON.stringify(String(attendu)));
  }
}
function vrai(v, msg) { egal(v, true, msg); }
function faux(v, msg) { egal(v, false, msg); }
function leve(fn, Type, msg) {
  try { fn(); } catch (e) {
    if (!Type || e instanceof Type) return;
    throw new Error((msg || '') + ' : mauvaise erreur ' + e.name);
  }
  throw new Error((msg || '') + ' : aucune erreur levée');
}

/* ---------- Aléatoire ---------- */
test('Alea : même graine, même suite', function () {
  var a = new M.Alea(42), b = new M.Alea(42);
  for (var i = 0; i < 20; i++) egal(a.suivant(), b.suivant());
  var c = new M.Alea('9e-niveau2'), d = new M.Alea('9e-niveau2');
  egal(c.entier(1, 100), d.entier(1, 100));
});
test('Alea : bornes respectées et valeurs variées', function () {
  var a = new M.Alea(1), vus = {};
  for (var i = 0; i < 2000; i++) {
    var n = a.entier(-3, 3);
    vrai(n >= -3 && n <= 3 && Number.isInteger(n), 'borne ' + n);
    vus[n] = true;
    vrai(a.entierNonNul(-2, 2) !== 0);
    var s = a.suivant();
    vrai(s >= 0 && s < 1);
  }
  egal(Object.keys(vus).length, 7);
});
test('Alea : mélange = permutation, sans modifier l’original', function () {
  var t = [1, 2, 3, 4, 5, 6];
  var m = new M.Alea(7).melanger(t);
  egal(t.join(), '1,2,3,4,5,6');
  egal(m.slice().sort().join(), '1,2,3,4,5,6');
  vrai(t.indexOf(new M.Alea(3).choix(t)) >= 0);
});

/* ---------- Fractions ---------- */
test('Fraction : simplification et signe', function () {
  egal(new F(6, 8).toString(), '3/4');
  egal(new F(3, -9).toString(), '-1/3');
  egal(new F(-4, -2).toString(), '2');
  egal(new F(0, 5).toString(), '0');
  leve(function () { new F(1, 0); }, M.ErreurCalcul);
});
test('Fraction : opérations', function () {
  egal(new F(1, 2).plus(new F(1, 3)).toString(), '5/6');
  egal(new F(3, 4).moins(new F(5, 6)).toString(), '-1/12');
  egal(new F(2, 3).fois(new F(9, 4)).toString(), '3/2');
  egal(new F(2, 3).divise(new F(4, 9)).toString(), '3/2');
  egal(new F(-2, 3).puissance(3).toString(), '-8/27');
  egal(new F(2, 5).puissance(-2).toString(), '25/4');
  egal(new F(7, 3).puissance(0).toString(), '1');
  egal(new F(-3, 4).inverse().toString(), '-4/3');
  egal(new F(-3, 4).oppose().toString(), '3/4');
  egal(new F(-3, 4).abs().toString(), '3/4');
  leve(function () { new F(1, 2).divise(0); }, M.ErreurCalcul);
  leve(function () { new F(0).puissance(-1); }, M.ErreurCalcul);
});
test('Fraction : grands nombres exacts (BigInt)', function () {
  egal(new F(2).puissance(80).plus(1).moins(new F(2).puissance(80)).toString(), '1');
});
test('Fraction : lecture de textes et de décimaux', function () {
  egal(F.depuis('3/4').toString(), '3/4');
  egal(F.depuis('2,5').toString(), '5/2');
  egal(F.depuis('-0.125').toString(), '-1/8');
  egal(F.depuis("1'250,5").toString(), '2501/2');
  egal(F.depuis('−6/4').toString(), '-3/2');
  egal(F.depuis(0.1).toString(), '1/10');
  egal(F.depuis(1e-7).toString(), '1/10000000');
  egal(new F('0,75').toString(), '3/4');
  leve(function () { F.depuis('abc'); }, M.ErreurSaisie);
});
test('Fraction : comparaison', function () {
  egal(new F(2, 3).compare(new F(3, 4)), -1);
  egal(new F(-1, 2).compare(new F(-2, 3)), 1);
  vrai(new F(4, 6).egal('2/3'));
  vrai(new F(10, 5).estEntier());
  vrai(new F(0, 3).estZero());
  egal(new F(-1, 3).signe(), -1);
});
test('Fraction : conversion décimale (format suisse)', function () {
  egal(new F(3, 4).valeur(), 0.75);
  egal(new F(2, 3).versDecimal(3), '0,667');
  egal(new F(-2, 3).versDecimal(2), '-0,67');
  egal(new F(1, 2).versDecimal(2, { fixe: true }), '0,50');
  egal(new F(1234567, 2).versDecimal(1), "617'283,5");
  egal(new F(1, 1000).versDecimal(2), '0');
  egal(M.formaterNombre(1000), "1'000");
  egal(M.formaterNombre(2.5), '2,5');
  egal(M.formaterNombre(1234.5678, 2), "1'234,57");
});
test('Fraction : décimale finie ou périodique', function () {
  vrai(new F(3, 8).estDecimale());
  vrai(new F(7, 20).estDecimale());
  vrai(new F(1, 3).estPeriodique());
  vrai(new F(1, 6).estPeriodique());
  faux(new F(21, 7).estPeriodique());
  var d = new F(1, 6).developpementDecimal();
  egal(d.entier, '0'); egal(d.avantPeriode, '1'); egal(d.periode, '6'); vrai(d.periodique);
  d = new F(-22, 7).developpementDecimal();
  egal(d.signe, '-'); egal(d.entier, '3'); egal(d.avantPeriode, ''); egal(d.periode, '142857');
  d = new F(5, 4).developpementDecimal();
  egal(d.periode, ''); egal(d.avantPeriode, '25'); faux(d.periodique);
  egal(new F(1, 7).ecritureDecimale({ periode: 'parentheses' }), '0,(142857)');
  egal(new F(1, 12).ecritureDecimale({ periode: 'parentheses' }), '0,08(3)');
  egal(new F(5, 4).ecritureDecimale(), '1,25');
  egal(new F(1, 3).ecritureDecimale(), '0,3̅');
});

/* ---------- Analyseur et évaluation ---------- */
function val(expr, valeurs) { return M.evaluer(expr, valeurs).toString(); }
test('Analyseur : priorités et signes', function () {
  egal(val('2+3*4'), '14');
  egal(val('(2+3)*4'), '20');
  egal(val('-2^2'), '-4');
  egal(val('(-2)^2'), '4');
  egal(val('2^3^0'.slice(0, 3)), '8');
  egal(val('10-4-3'), '3');
  egal(val('12/3/2'), '2');
  egal(val('2^-1'), '1/2');
  egal(val('2^(-2)'), '1/4');
  egal(val('1/2x', { x: 4 }), '2', '1/2x se lit (1/2)·x');
  egal(val('2*-3'), '-6');
  egal(val('5 − 7'), '-2');
  egal(val('6 ÷ 4'), '3/2');
  egal(val('3 × 4'), '12');
  egal(val("1'000 + 0,5"), '2001/2');
});
test('Analyseur : multiplication implicite et lettres', function () {
  egal(val('3a', { a: 5 }), '15');
  egal(val('2(x+1)', { x: 3 }), '8');
  egal(val('(x+1)(x-1)', { x: 3 }), '8');
  egal(val('ab', { a: 2, b: 7 }), '14');
  egal(val('3x^2', { x: -2 }), '12');
  egal(val('-2x + 3', { x: 5 }), '-7');
  egal(val('x²y', { x: 3, y: 2 }), '18');
  egal(val('x⁻¹', { x: 4 }), '1/4');
  egal(val('[2(x+1)]^2', { x: 1 }), '16');
  egal(val('3/4x', { x: '2/3' }), '1/2');
  egal(M.lettres('2ab + b^2 - x').join(), 'a,b,x');
});
test('Analyseur : erreurs de saisie', function () {
  ['', '2+', '(x+1', 'x+1)', '3 4', 'x2', '2^', 'x^y', 'x^1,5', '2#3', '()', ',5', '*3'].forEach(function (e) {
    leve(function () { M.analyser(e); }, M.ErreurSaisie, 'saisie « ' + e + ' »');
  });
  leve(function () { M.evaluer('1/(x-2)', { x: 2 }); }, M.ErreurCalcul);
});
test('versTexte : écriture lisible', function () {
  egal(M.versTexte('3x^2-2(x+1)'), '3x^2 − 2(x + 1)');
  egal(M.versTexte('1/2x'), '(1/2)x');
  egal(M.versTexte('a-(-3)'), 'a − (−3)');
  egal(M.versTexte('2,5*3'), '2,5 × 3');
});

/* ---------- Équivalence ---------- */
test('Équivalence : accepte les formes équivalentes', function () {
  [
    ['(x+1)^2', 'x^2+2x+1'],
    ['2(x+3)', '2x+6'],
    ['3x-2x', 'x'],
    ['(a+b)(a-b)', 'a^2-b^2'],
    ['x/2', '0,5x'],
    ['x/2', '1/2x'],
    ['-(x-3)', '3-x'],
    ['ab+ba', '2ab'],
    ['(2x)^3', '8x^3'],
    ['x^2·x^3', 'x^5'],
    ['(x^2-1)/(x-1)', 'x+1'],
    ['3/4 + 1/6', '11/12'],
    ['2^10', "1'024"],
    ['−3(2a − b)', '3b − 6a']
  ].forEach(function (p) { vrai(M.equivalentes(p[0], p[1]), p[0] + ' ≡ ' + p[1]); });
});
test('Équivalence : rejette les formes fausses', function () {
  [
    ['(x+1)^2', 'x^2+1'],
    ['2(x+3)', '2x+3'],
    ['x^2·x^3', 'x^6'],
    ['-(x-3)', '-x-3'],
    ['(a+b)^2', 'a^2+b^2'],
    ['3/4 + 1/6', '4/10'],
    ['x', 'y'],
    ['2x', 'x^2'],
    ['x^3', 'x^3 + x(x-1)(x-2)(x-3)(x-4)(x-5)'],
    ['1/x', '1/(x+0,001)']
  ].forEach(function (p) { faux(M.equivalentes(p[0], p[1]), p[0] + ' ≢ ' + p[1]); });
});
test('Équivalence : reproductible et erreurs', function () {
  egal(M.equivalentes('x+1', 'x+1', { graine: 5 }), M.equivalentes('x+1', 'x+1', { graine: 5 }));
  leve(function () { M.equivalentes('2x+', '2x'); }, M.ErreurSaisie);
  faux(M.equivalentes('1/0', '1/0'), 'jamais calculable');
});

/* ---------- Formes ---------- */
test('Forme réduite : acceptée', function () {
  ['3x^2 - 2x + 1', '-2x + 3', 'x', '0', '7', 'x/2 + 3', '3/4x - 1', '0,5a + b',
   '2ab - b', 'x^2y + xy^2', '-x^2', '3x/4', '2a^2 + 3ab - 5b^2'].forEach(function (e) {
    vrai(M.estReduite(e), e);
  });
});
test('Forme réduite : refusée', function () {
  ['3x + 2x', '2·3x', 'x·x', '2(x+1)', 'x + 0', '1x', '6/8x', 'x^1', '3 + 4', 'x + 2 - 5',
   '(x+1)^2', '2x·3', 'x^2 + 3x - x^2', '-(x+1)', '2x/4', 'ab + ba', '0x + 1', '--x', '2^3x'].forEach(function (e) {
    faux(M.estReduite(e), e);
  });
});
test('Forme réduite et ordonnée', function () {
  vrai(M.estReduiteOrdonnee('3x^2 - 2x + 1'));
  vrai(M.estReduiteOrdonnee('-x^3 + 4'));
  vrai(M.estReduiteOrdonnee('5'));
  faux(M.estReduiteOrdonnee('1 - 2x + 3x^2'));
  faux(M.estReduiteOrdonnee('2x + x^2'));
  faux(M.estReduiteOrdonnee('3x^2 + 2x + x'), 'pas réduite');
  vrai(M.estReduiteOrdonnee('x^2 + xy + y^2'));
  vrai(M.estReduiteOrdonnee('a^2x + ax + 1', 'x'), 'selon x : a^2x et ax sont de degré 1');
  faux(M.estReduiteOrdonnee('1 + ax', 'x'));
  vrai(M.estReduiteOrdonnee('ax^2 + a^3x + 1', 'x'));
  faux(M.estReduiteOrdonnee('ax^2 + a^3x + 1'), 'degré total : 3 puis 4');
});
test('Fraction irréductible (écriture)', function () {
  ['3/4', '-5/2', '−7/9', '13/27', '4'].forEach(function (t) { vrai(M.estFractionIrreductible(t), t); });
  ['6/8', '4/1', '3/-4', '0/5', '3/4 + 1', '2,5', '1/2/3', '10/15'].forEach(function (t) { faux(M.estFractionIrreductible(t), t); });
  faux(M.estFractionIrreductible('4', { entierAccepte: false }));
});
test('Notation scientifique', function () {
  ['3,2 × 10^4', '3.2*10^4', '-1,05×10^(-3)', '7 · 10^0', '9,99 x 10^12', '4×10⁻³', '1,5 × 10^-2'].forEach(function (t) {
    vrai(M.estNotationScientifique(t), t);
  });
  ['32 × 10^3', '0,32 × 10^5', '10^4', '3,2 × 10', '3,2 × 10^4,5', '3,2e4', '10 × 10^2'].forEach(function (t) {
    faux(M.estNotationScientifique(t), t);
  });
  var n = M.lireNotationScientifique('-1,05×10^(-3)');
  egal(n.exposant, -3);
  egal(n.mantisse.toString(), '-21/20');
  egal(n.valeur.toString(), '-21/20000');
  egal(M.lireNotationScientifique('4×10⁻³').valeur.versDecimal(), '0,004');
});

console.log('\n' + reussis + ' test(s) réussi(s), ' + echecs + ' échec(s).');
process.exitCode = echecs ? 1 : 0;
