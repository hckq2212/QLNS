import assert from 'assert';
import db from '../src/config/db.js';

let origConnect = db.connect;

const mockClient = {
  async query(text, params) {
    if (typeof text === 'string' && text.startsWith('BEGIN')) return { rows: [] };
    if (text.startsWith("SELECT id, amount, paid_amount, status, paid_at FROM debt WHERE id = $1 FOR UPDATE")) {
      return { rows: [{ id: 10, amount: 1000, paid_amount: 200, status: 'pending', paid_at: null }] };
    }
    if (text.startsWith('UPDATE debt SET paid_amount')) {
      return { rows: [{ id: 10, contract_id: 1, amount: 1000, paid_amount: 1200, paid_at: new Date(), status: 'paid' }] };
    }
    if (text.startsWith('COMMIT')) return { rows: [] };
    if (text.startsWith('ROLLBACK')) return { rows: [] };
    return { rows: [] };
  },
  release() {}
};

db.connect = async () => mockClient;

import debtService from '../src/services/debtService.js';

(async () => {
  try {
    const res = await debtService.payPartial(10, 1000);
    assert.ok(res, 'should return updated debt row');
    assert.strictEqual(res.id, 10);
    assert.strictEqual(res.status, 'paid');
    await assert.rejects(
      () => debtService.payPartial(10, 0),
      /payAmount must be positive/
    );
    await assert.rejects(
      () => debtService.payPartial(10, -1),
      /payAmount must be positive/
    );
    console.log('debt payPartial test passed');
  } catch (err) {
    console.error('debt test failed', err);
    process.exit(1);
  } finally {
    db.connect = origConnect;
  }
})();
