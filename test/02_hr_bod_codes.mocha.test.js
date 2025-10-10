import { expect } from 'chai';
import db from '../src/config/db.js';
import { createBaseState, makeMockClient } from './_mockDb.js';

describe('02 - HR confirm & BOD approve (code issuance + debt sum check)', function() {
  this.timeout(5000);
  let origConnect, origQuery;
  before(() => { origConnect = db.connect; origQuery = db.query; });
  after(() => { db.connect = origConnect; db.query = origQuery; });

  it('HR confirm issues unique code and sets waiting_hr_confirm', async () => {
    const baseState = createBaseState();
    // ensure created_at yields specific month
    baseState.contracts[0].created_at = '2025-10-05T12:00:00Z';
    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };

    const contractService = (await import('../src/services/contractService.js')).default;

    const updated = await contractService.updateStatus(1, 'waiting_hr_confirm', 10);
    expect(updated.status).to.equal('waiting_hr_confirm');
    expect(updated.code).to.match(/^SGMK-25-10-\d{3}$/);
  });

  it('BOD approve blocked when debt sum != total_revenue', async () => {
    const baseState = createBaseState();
    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };
    const contractService = (await import('../src/services/contractService.js')).default;

    let threw = false;
    try { await contractService.updateStatus(1, 'approved', 50); } catch (e) { threw = true; }
    expect(threw).to.equal(true);
  });

  it('BOD approve succeeds when debts equal total_revenue', async () => {
    const baseState = createBaseState();
    // adjust debts
    baseState.debts = [ { id: 2, contract_id: 1, amount: 1000 } ];
    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };
    const contractService = (await import('../src/services/contractService.js')).default;
    const r = await contractService.updateStatus(1, 'approved', 50);
    expect(r.status).to.equal('approved');
  });
});
