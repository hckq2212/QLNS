import assert from 'assert';
import db from '../src/config/db.js';

let origConnect = db.connect;

const mockClient = {
  async query(text, params) {
    if (typeof text === 'string' && text.startsWith('SELECT * FROM job WHERE id = $1')) {
      return { rows: [{ id: 20, status: 'pending', progress_percent: 0 }] };
    }
    if (typeof text === 'string' && text.startsWith('UPDATE job SET')) {
      return { rows: [{ id: 20, status: params[0] || 'in_progress', progress_percent: params[1] || 50 }] };
    }
    return { rows: [] };
  },
  release() {}
};

db.connect = async () => mockClient;

import jobService from '../src/services/jobService.js';

(async () => {
  try {
    const res = await jobService.update(20, { status: 'in_progress', progress_percent: 30 });
    assert.ok(res, 'should return updated job');
    assert.strictEqual(res.id, 20);
    assert.strictEqual(res.status, 'in_progress');
    console.log('job update test passed');
  } catch (err) {
    console.error('job test failed', err);
    process.exit(1);
  } finally {
    db.connect = origConnect;
  }
})();
