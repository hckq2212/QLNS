import { expect } from 'chai';
import { execSync } from 'child_process';

// This mocha wrapper runs the existing ad-hoc contract flow test script and fails if it exits non-zero.
describe('contract flow (mocha wrapper)', function() {
  this.timeout(20000);
  it('runs the contract flow script successfully', function() {
    // run the existing script; execSync will throw if the script exits non-zero
    execSync('node test/contract.flow.test.js', { stdio: 'inherit' });
  });
});
