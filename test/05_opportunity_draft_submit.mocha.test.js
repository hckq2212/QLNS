import { expect } from 'chai';
import db from '../src/config/db.js';
import { createBaseState, makeMockClient } from './_mockDb.js';

describe('05 - Opportunity create -> draft -> submit', function() {
  this.timeout(5000);
  let origConnect, origQuery;
  before(() => { origConnect = db.connect; origQuery = db.query; });
  after(() => { db.connect = origConnect; db.query = origQuery; });

  it('should create opportunity as waiting_bod_approval by default and submitting is idempotent', async () => {
    const baseState = createBaseState();
    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };

    const oppService = (await import('../src/services/opportunityService.js')).default;

    const payload = { customer_temp: JSON.stringify({ name: 'Test Co' }), description: 'Test opp' };
    const created = await oppService.createOpportunity(payload);
  expect(created).to.exist;
  expect(created.status).to.equal('waiting_bod_approval');

  // submitting an already waiting opportunity should be idempotent
  const submitted = await oppService.submitToBod(created.id, 101);
  expect(submitted).to.exist;
  expect(submitted.status).to.equal('waiting_bod_approval');
  });
});
