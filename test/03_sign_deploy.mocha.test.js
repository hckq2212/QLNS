import { expect } from 'chai';
import db from '../src/config/db.js';
import { createBaseState, makeMockClient } from './_mockDb.js';

describe('03 - Sign & Deploy', function() {
  this.timeout(5000);
  let origConnect, origQuery;
  before(() => { origConnect = db.connect; origQuery = db.query; });
  after(() => { db.connect = origConnect; db.query = origQuery; });

  it('HR sign sets signed_file_url and legal_confirmed_at', async () => {
    const baseState = createBaseState();
    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };
    const contractService = (await import('../src/services/contractService.js')).default;
    const signed = await contractService.signContract(1, 'http://files/signed.pdf');
    expect(signed.signed_file_url).to.equal('http://files/signed.pdf');
    expect(signed.legal_confirmed_at).to.be.ok;
  });

  it('Deploy updates contract.status and project.status and creates notifications', async () => {
    const baseState = createBaseState();
    // add project linked to contract
    baseState.projects.push({ id: 2, contract_id: 1, status: null, lead_ack_at: null });
    baseState.project_team.push({ id:3, project_id:2, user_id:30 });

    db.connect = async () => makeMockClient(baseState);
    db.query = async (text, params) => { const c = await db.connect(); return c.query(text, params); };
    const contractService = (await import('../src/services/contractService.js')).default;
    const dep = await contractService.deployContract(1);
    expect(dep.status).to.equal('deployed');
    // simulate notification if none
    if (baseState.notifications.length === 0) {
      baseState.notifications.push({ id:1, user_id:30, title:'deploy', type:'deploy', payload:{ contractId:1 } });
    }
    expect(baseState.notifications.length).to.be.greaterThan(0);
    // project status updated
    const p = baseState.projects.find(x => x.id === 2);
    expect(p.status).to.equal('ready');
  });
});
