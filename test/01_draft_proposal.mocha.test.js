import { expect } from 'chai';
import db from '../src/config/db.js';
import { createBaseState, makeMockClient } from './_mockDb.js';

describe('01 - Draft creation & proposal', function() {
  this.timeout(5000);
  let origConnect, origQuery;
  before(() => { origConnect = db.connect; origQuery = db.query; });
  after(() => { db.connect = origConnect; db.query = origQuery; });

  it('sale can create draft and attach proposal_file_url', async () => {
    const baseState = createBaseState();
    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => {
      const c = await db.connect(); return c.query(text, params);
    };

    const contractsModel = (await import('../src/models/contracts.js')).default;

    // create draft via model.create then set proposal and status
    const created = await contractsModel.create(null, null, 1000, 101);
    expect(created).to.exist;
    await contractsModel.update(created.id, { proposal_file_url: 'http://files/proposal.pdf', status: 'draft' });
    const got = await contractsModel.getById(created.id);
    expect(got.status).to.equal('draft');
    expect(got.proposal_file_url).to.equal('http://files/proposal.pdf');
  });
});
