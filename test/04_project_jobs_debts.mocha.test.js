import { expect } from 'chai';
import db from '../src/config/db.js';
import { createBaseState, makeMockClient } from './_mockDb.js';

describe('04 - Project team, lead ack, jobs & debts payments', function() {
  this.timeout(5000);
  let origConnect, origQuery;
  before(() => { origConnect = db.connect; origQuery = db.query; });
  after(() => { db.connect = origConnect; db.query = origQuery; });

  it('lead ack required before creating job and job date validation', async () => {
    const baseState = createBaseState();
    // create project linked to contract and add team lead
    baseState.projects.push({ id: 2, contract_id: 1, status: 'ready', lead_ack_at: null });
    baseState.project_team.push({ id:3, project_id:2, user_id:201, role: 'team_lead' });

    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };

    const jobsModel = (await import('../src/models/jobs.js')).default;

    // creating job should fail before lead ack
    let failed = false;
    try {
      await jobsModel.create({ project_id: 2, name: 'Job1', start_date: '2025-11-01', end_date: '2025-11-10' });
    } catch (e) { failed = true; }
    expect(failed).to.equal(true);

    // after ack, job creation should succeed
    baseState.projects.find(p => p.id === 2).lead_ack_at = new Date().toISOString();
    const job = await jobsModel.create({ project_id: 2, name: 'Job1', start_date: '2025-11-01', end_date: '2025-11-10' });
    expect(job).to.exist;

    // date validation
    let bad = false;
    try { await jobsModel.create({ project_id: 2, name: 'JobBad', start_date: '2025-12-01', end_date: '2025-11-01' }); } catch (e) { bad = true; }
    expect(bad).to.equal(true);
  });

  it('partial payments update debt and set status to paid when complete', async () => {
    const baseState = createBaseState();
    // create a debt to pay
    baseState.debts.push({ id: 300, contract_id: 1, amount: 1000, paid_amount: 0, status: 'pending' });
    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };
    const debtsModel = (await import('../src/models/debts.js')).default;
    const p1 = await debtsModel.payPartial(300, 400);
    expect(p1.paid_amount).to.equal(400);
    expect(p1.status).to.equal('pending');
    const p2 = await debtsModel.payPartial(300, 600);
    expect(p2.paid_amount).to.equal(1000);
    expect(p2.status).to.equal('paid');
  });
});
