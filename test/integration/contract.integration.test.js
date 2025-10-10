import { expect } from 'chai';
import { Pool } from 'pg';
import fs from 'fs';

describe('Integration: contract concurrency', function() {
  this.timeout(20000);
  let pool;
  before(async function() {
    // connect to integration DB
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'qlns_test'
    });
  // ensure schema loaded
  const sql = fs.readFileSync('test/integration/schema.sql', 'utf8');
  await pool.query(sql);
  });

  after(async function() {
    if (pool) await pool.end();
  });

  it('should assign unique codes under high concurrency', async function() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // create 10 draft contracts with same created_at month
      const now = new Date('2025-10-05T12:00:00Z');
      const insertPromises = [];
      for (let i=0;i<10;i++) {
        insertPromises.push(client.query('INSERT INTO contract (status, created_at) VALUES ($1, $2) RETURNING id', ['draft', now]));
      }
      const inserted = await Promise.all(insertPromises);
      await client.query('COMMIT');
      const ids = inserted.map(r => r.rows[0].id);

      // function to hr-confirm a contract inside its own transaction
      const hrConfirm = async (cid) => {
        const c = await pool.connect();
        try {
          await c.query('BEGIN');
          // select max seq FOR UPDATE
          const partDate = new Date('2025-10-05T12:00:00Z');
          const yy = String(partDate.getUTCFullYear()).slice(-2);
          const mm = String(partDate.getUTCMonth()+1).padStart(2,'0');
          // Acquire an advisory lock for the year+month so allocations are serialized
          // even when no existing rows are present.
          const lockKey = Number(`${yy}${mm}`); // e.g. '2510' -> 2510
          await c.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);
          const seqRes = await c.query('SELECT COALESCE(MAX(code_seq),0) as maxseq FROM contract WHERE code_year = $1 AND code_month = $2', [yy, mm]);
          const nextSeq = Number(seqRes.rows[0].maxseq || 0) + 1;
          const seqStr = String(nextSeq).padStart(3,'0');
          const code = `SGMK-${yy}-${mm}-${seqStr}`;
          await c.query('UPDATE contract SET code=$1, code_year=$2, code_month=$3, code_seq=$4, status=$5 WHERE id=$6', [code, yy, mm, nextSeq, 'waiting_hr_confirm', cid]);
          await c.query('COMMIT');
          return code;
        } catch (e) {
          await c.query('ROLLBACK');
          throw e;
        } finally {
          c.release();
        }
      };

      // fire confirmations in parallel
      const codes = await Promise.all(ids.map(id => hrConfirm(id)));
      const unique = new Set(codes);
      expect(unique.size).to.equal(ids.length);
    } finally {
      client.release();
    }
  });

  it('should handle concurrent partial payments correctly', async function() {
    // create contract and debt
    const res = await pool.query('INSERT INTO contract (status) VALUES ($1) RETURNING id', ['pending']);
    const cid = res.rows[0].id;
    const dres = await pool.query('INSERT INTO debt (contract_id, amount) VALUES ($1, $2) RETURNING id', [cid, 1000]);
    const did = dres.rows[0].id;

    // concurrent payers
    const pay = async (amt) => {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const cur = await c.query('SELECT id, amount, paid_amount FROM debt WHERE id = $1 FOR UPDATE', [did]);
        if (!cur.rows || cur.rows.length === 0) { await c.query('ROLLBACK'); return null; }
        const row = cur.rows[0];
        const currentPaid = row.paid_amount || 0;
        let newPaid = Number(currentPaid) + Number(amt);
        if (newPaid > Number(row.amount)) newPaid = Number(row.amount);
        let status = newPaid >= Number(row.amount) ? 'paid' : 'pending';
        await c.query('UPDATE debt SET paid_amount=$1, status=$2 WHERE id=$3', [newPaid, status, did]);
        await c.query('COMMIT');
      } catch (e) {
        await c.query('ROLLBACK');
        throw e;
      } finally { c.release(); }
    };

    const promises = [];
    for (let i=0;i<10;i++) promises.push(pay(150));
    await Promise.all(promises);

    const final = await pool.query('SELECT amount, paid_amount, status FROM debt WHERE id = $1', [did]);
    expect(Number(final.rows[0].paid_amount)).to.be.at.most(Number(final.rows[0].amount));
    expect(final.rows[0].status).to.equal('paid');
  });
});
