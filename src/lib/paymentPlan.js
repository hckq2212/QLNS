// Small pure helpers for payment plan calculations

export function splitInstallments(total, n) {
  if (!Number.isFinite(total)) throw new Error('total must be a finite number');
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be integer >= 1');

  // work in cents to avoid floating point rounding issues
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const res = [];
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      res.push((cents - base * (n - 1)) / 100);
    } else {
      res.push(base / 100);
    }
  }
  return res;
}

export function debtsSumEquals(total, debts, epsilon = 0.01) {
  if (!Array.isArray(debts)) return false;
  const sum = debts.reduce((s, d) => s + (Number(d) || 0), 0);
  return Math.abs((Number(total) || 0) - sum) <= epsilon;
}
