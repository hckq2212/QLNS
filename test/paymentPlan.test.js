import assert from 'assert';
import { splitInstallments, debtsSumEquals } from '../src/lib/paymentPlan.js';

function almostEqual(a,b,eps=1e-6){ return Math.abs(a-b)<=eps }

// Basic tests
const centsSplit = splitInstallments(1000, 3);
assert.strictEqual(centsSplit.length, 3, 'splitInstallments should return 3 items');
assert.strictEqual(Math.round(centsSplit.reduce((s,x)=>s+x,0)*100)/100, 1000, 'splitInstallments sum must equal total');

const split2 = splitInstallments(100, 4);
assert.strictEqual(split2.length,4);
assert.ok(almostEqual(split2.reduce((s,x)=>s+x,0), 100));

// debtsSumEquals
assert.strictEqual(debtsSumEquals(100, [50,50]), true);
assert.strictEqual(debtsSumEquals(100, [33.33,33.33,33.34]), true);
assert.strictEqual(debtsSumEquals(100, [30,30]), false);

console.log('paymentPlan tests passed');
