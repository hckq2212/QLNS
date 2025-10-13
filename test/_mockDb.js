// Lightweight mock DB helper used by unit tests
// Exports: makeMockClient(baseState), createBaseState()

export function createBaseState() {
  return {
    contracts: [ { id: 1, status: 'draft', code: null, code_year: null, code_month: null, code_seq: null, total_revenue: 1000 } ],
    opportunities: [],
    debts: [ { id: 1, contract_id: 1, amount: 400 } ],
    projects: [ { id: 1, contract_id: 1, status: null, lead_ack_at: null } ],
    project_team: [ { id:1, project_id:1, user_id: 10 }, { id:2, project_id:1, user_id:11 } ],
    notifications: [],
    jobs: []
  };
}

export function makeMockClient(state = {}) {
  const store = state;
  const clientLocks = new Set();
  const client = {};
  const globalLocks = makeMockClient.__globalLocks || (makeMockClient.__globalLocks = new Map());

  const acquireLock = async (key) => {
    while (true) {
      const entry = globalLocks.get(key);
      if (!entry) {
        globalLocks.set(key, { owner: client, waiters: [] });
        clientLocks.add(key);
        return;
      }
      if (entry.owner === client) return;
      await new Promise(resolve => entry.waiters.push(resolve));
    }
  };
  const releaseAll = () => {
    for (const key of Array.from(clientLocks)) {
      const entry = globalLocks.get(key);
      if (entry && entry.owner === client) {
        const next = entry.waiters.shift();
        if (next) {
          entry.owner = 'pending';
          next();
        } else {
          globalLocks.delete(key);
        }
      }
      clientLocks.delete(key);
    }
  };

  client.query = async (text, params) => {
    const sql = (text || '').toString();
    const findContract = id => store.contracts.find(c => Number(c.id) === Number(id));

    if (sql.startsWith('BEGIN')) return { rows: [] };
    if (sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) { releaseAll(); return { rows: [] }; }

    if (sql.includes('SELECT COALESCE(MAX(code_seq)') && params && params.length >= 2) {
      const yy = params[0], mm = params[1];
      const key = `contract-seq-${yy}-${mm}`;
      if (sql.toUpperCase().includes('FOR UPDATE')) await acquireLock(key);
      const max = store.contracts.filter(c => c.code_year === yy && c.code_month === mm).reduce((m,r)=>Math.max(m, r.code_seq||0), 0);
      return { rows: [{ maxseq: max }] };
    }

    if (sql.startsWith('UPDATE contract SET code =')) {
      const code = params[0], yy = params[1], mm = params[2], seq = params[3], status = params[4], id = params[5];
      const c = findContract(id);
      if (!c) return { rows: [] };
      c.code = code; c.code_year = yy; c.code_month = mm; c.code_seq = seq; c.status = status;
      return { rows: [c] };
    }

    if (sql.includes('SELECT total_revenue FROM contract WHERE id = $1')) {
      const id = params[0];
      if (sql.toUpperCase().includes('FOR UPDATE')) await acquireLock(`contract-${id}`);
      const c = findContract(id);
      if (!c) return { rows: [] };
      return { rows: [{ total_revenue: c.total_revenue }] };
    }

    if (sql.includes('SELECT COALESCE(SUM(amount),0) as s FROM debt WHERE contract_id = $1')) {
      const id = params[0];
      const sum = store.debts.filter(d => Number(d.contract_id) === Number(id)).reduce((s,r)=>s+Number(r.amount),0);
      return { rows: [{ s: sum }] };
    }

    if (sql.startsWith('SELECT * FROM contract WHERE id = $1')) {
      const id = params[0];
      const c = store.contracts.find(x => Number(x.id) === Number(id));
      if (!c) return { rows: [] };
      return { rows: [c] };
    }

    if (sql.includes('SELECT id, signed_file_url, legal_confirmed_at FROM contract WHERE id = $1')) {
      const id = params[0];
      const c = findContract(id);
      if (!c) return { rows: [] };
      return { rows: [{ id: c.id, signed_file_url: c.signed_file_url || null, legal_confirmed_at: c.legal_confirmed_at || null }] };
    }

    if (sql.startsWith('UPDATE contract SET')) {
      const setPart = sql.split(/SET/i)[1].split(/WHERE/i)[0];
      const assignments = setPart.split(',').map(s => s.trim());
      const id = params[params.length - 1];
      const c = findContract(id);
      if (!c) return { rows: [] };
      let pIdx = 0;
      for (let j = 0; j < assignments.length; j++) {
        const assign = assignments[j];
        const colName = assign.split('=')[0].trim().replace(/COALESCE\(|\)/gi, '').split('.')[0].trim().replace(/['`\"]/g,'');
        if (/now\(\)/i.test(assign)) {
          c[colName] = new Date().toISOString();
        } else {
          if (pIdx < params.length - 1) {
            c[colName] = params[pIdx];
            pIdx++;
          }
        }
      }
      return { rows: [c] };
    }

    if (sql.startsWith('INSERT INTO contract')) {
      const newId = store.contracts.length + 1; const p = params || []; const total_revenue = p[2] || 0;
      const newC = { id: newId, status: 'draft', total_revenue, code: null };
      store.contracts.push(newC); return { rows: [newC] };
    }

    if (sql.startsWith('INSERT INTO opportunity')) {
      const newId = (store.opportunities.length || 0) + 1;
      const p = params || [];
      const obj = {
        id: newId,
        customer_id: p[0] || null,
        customer_temp: p[1] || null,
        expected_price: p[2] || null,
        description: p[3] || null,
        created_by: p[4] || null,
        status: p[5] || 'draft'
      };
      store.opportunities.push(obj);
      return { rows: [obj] };
    }

    if (sql.startsWith('SELECT * FROM opportunity WHERE id = $1')) {
      const id = params[0];
      const o = (store.opportunities || []).find(x => Number(x.id) === Number(id));
      if (!o) return { rows: [] };
      return { rows: [o] };
    }

    if (sql.startsWith('UPDATE opportunity SET')) {
      const setPart = sql.split(/SET/i)[1].split(/WHERE/i)[0];
      const assignments = setPart.split(',').map(s => s.trim());
      const id = params[params.length - 1];
      const o = (store.opportunities || []).find(x => Number(x.id) === Number(id));
      if (!o) return { rows: [] };
      let pIdx = 0;
      for (let j = 0; j < assignments.length; j++) {
        const assign = assignments[j];
        const colName = assign.split('=')[0].trim().replace(/COALESCE\(|\)/gi, '').split('.')[0].trim().replace(/['`\"]/g,'');
        if (/now\(\)/i.test(assign)) {
          o[colName] = new Date().toISOString();
        } else {
          if (pIdx < params.length - 1) {
            o[colName] = params[pIdx];
            pIdx++;
          }
        }
      }
      return { rows: [o] };
    }

    if (sql.startsWith('INSERT INTO debt')) {
      const newId = store.debts.length + 1; const contract_id = params[0]; const amount = params[1];
      const newD = { id: newId, contract_id, amount }; store.debts.push(newD); return { rows: [newD] };
    }

    if (sql.startsWith('SELECT id FROM project WHERE contract_id')) {
      const id = params[0]; const rows = store.projects.filter(p => Number(p.contract_id) === Number(id)).map(p=>({ id: p.id })); return { rows };
    }

    if (sql.startsWith("UPDATE project SET status = COALESCE(status")) {
      // The real query updates projects by contract_id: "WHERE contract_id = $1"
      const contractId = params[0];
      const updated = [];
      for (const p of store.projects) {
        if (Number(p.contract_id) === Number(contractId)) {
          p.status = p.status || 'ready';
          updated.push(p);
        }
      }
      return { rows: updated };
    }

    if (sql.startsWith('SELECT user_id FROM project_team WHERE project_id =')) {
      const pid = params[0]; const rows = store.project_team.filter(pt => Number(pt.project_id) === Number(pid)).map(pt=>({ user_id: pt.user_id })); return { rows };
    }

    if (sql.startsWith('INSERT INTO notification')) {
      const uid = params[0]; const title = params[1]; const type = params[2]; const payload = params[3]; const contract_id = params[4];
      const n = { id: store.notifications.length + 1, user_id: uid, title, type, payload: JSON.parse(payload), contract_id };
      store.notifications.push(n); return { rows: [n] };
    }

    if (sql.startsWith('SELECT lead_ack_at FROM project WHERE id = $1')) {
      const pid = params[0]; const p = store.projects.find(x=>Number(x.id)===Number(pid)); if (!p) return { rows: [] }; return { rows: [{ lead_ack_at: p.lead_ack_at || null }] };
    }

    if (sql.startsWith('INSERT INTO job')) {
      const project_id = params[0]; const name = params[1]; const start = params[2]; const end = params[3];
      if (start && end) { const s = new Date(start); const e = new Date(end); if (s > e) throw new Error('start_date must be <= end_date'); }
      const newJob = { id: store.jobs.length + 1, project_id, name, start_date: start, end_date: end }; store.jobs.push(newJob); return { rows: [newJob] };
    }

    if (sql.includes('SELECT id, amount, paid_amount') && sql.toUpperCase().includes('FOR UPDATE')) {
      const id = params[0]; await acquireLock(`debt-${id}`); const d = store.debts.find(x=>Number(x.id)===Number(id)); if (!d) return { rows: [] }; if (d.paid_amount == null) d.paid_amount = 0; return { rows: [d] };
    }

    if (sql.startsWith('UPDATE debt SET paid_amount')) {
      const paidAmount = params[0]; const paidAt = params[1]; const status = params[2]; const id = params[3];
      const d = store.debts.find(x=>Number(x.id)===Number(id)); if (!d) return { rows: [] }; d.paid_amount = paidAmount; if (paidAt) d.paid_at = paidAt; d.status = status; return { rows: [d] };
    }

    return { rows: [] };
  };
  client.release = () => {};
  return client;
}
