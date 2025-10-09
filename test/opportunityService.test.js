import assert from 'assert';
import db from '../src/config/db.js';

// We'll monkeypatch db.connect() to return a mock client for this test

let originalConnect = db.connect;

const mockClient = {
  async query(text, params) {
    // crude matching by SQL substrings to return appropriate mock rows
    if (typeof text === 'string' && text.startsWith('BEGIN')) return { rows: [] };
    if (text.includes('SELECT * FROM opportunity WHERE id = $1 FOR UPDATE')) {
      return { rows: [{ id: 1, customer_id: null, customer_temp: { name: 'K', email: 'k@example.com' }, description: 'Test opp', status: 'pending' }] };
    }
    if (text.startsWith('INSERT INTO customer')) {
      return { rows: [{ id: 101, name: 'K' }] };
    }
    if (text.includes("UPDATE opportunity SET customer_id")) {
      return { rows: [] };
    }
    if (text.includes("UPDATE opportunity SET status = 'approved'")) {
      return { rows: [{ id: 1, status: 'approved', customer_id: 101 }] };
    }
    if (text.startsWith('INSERT INTO contract')) {
      return { rows: [{ id: 201, total_cost: 0, total_revenue: 0 }] };
    }
    if (text.startsWith('INSERT INTO project')) {
      return { rows: [{ id: 301 }] };
    }
    if (text.includes('SELECT * FROM opportunity_service WHERE opportunity_id = $1 FOR UPDATE')) {
      return { rows: [{ id: 11, opportunity_id: 1, service_id: 2, quantity: 1, proposed_price: null, service_job_id: null, note: null }] };
    }
    if (text.includes('SELECT name, base_cost') || text.includes('SELECT id, base_cost FROM service WHERE id = $1')) {
      return { rows: [{ name: 'Svc', base_cost: 1000 }] };
    }
    if (text.startsWith('INSERT INTO job')) {
      return { rows: [{ id: 401 }] };
    }
    if (text.includes('SELECT * FROM contract WHERE id = $1')) {
      return { rows: [{ id: 201, total_cost: 1000, total_revenue: 1500 }] };
    }
    if (text.startsWith('INSERT INTO debt')) {
      return { rows: [{ id: 501, contract_id: 201, amount: 1500, due_date: null, status: 'pending' }] };
    }
    if (text.includes('SELECT id FROM "user" WHERE role IN')) {
      return { rows: [] };
    }
    if (text.startsWith('COMMIT')) return { rows: [] };
    if (text.startsWith('ROLLBACK')) return { rows: [] };
    return { rows: [] };
  },
  release() {}
};

// Replace connect with a function that returns our mock client
db.connect = async () => mockClient;

// Import opportunityService after monkeypatching db
import opportunityService from '../src/services/opportunityService.js';

(async () => {
  try {
    const result = await opportunityService.approveOpportunity(1, 10, null);
    assert.ok(result && result.contract && result.project && result.debts, 'approveOpportunity should return contract, project and debts');
    assert.strictEqual(result.contract.id, 201, 'contract id should be 201');
    assert.strictEqual(result.project.id, 301, 'project id should be 301');
    assert.strictEqual(Array.isArray(result.debts), true, 'debts should be an array');
    console.log('opportunityService approve test passed');
  } catch (err) {
    console.error('opportunityService test error', err);
    process.exit(1);
  } finally {
    // restore original connect
    db.connect = originalConnect;
  }
})();
