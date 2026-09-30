const { execFileSync } = require('node:child_process');
const path = require('node:path');

const appPath = path.join(__dirname, 'index.js');

function runApp(input) {
  return execFileSync(process.execPath, [appPath], {
    encoding: 'utf8',
    input,
    timeout: 5000,
  });
}

describe('account management application', () => {
  test('TC-01: starts with the menu and an initial balance of 1000.00', () => {
    const output = runApp('1\n4\n');

    expect(output).toContain('Account Management System');
    expect(output).toContain('1. View Balance');
    expect(output).toContain('2. Credit Account');
    expect(output).toContain('3. Debit Account');
    expect(output).toContain('4. Exit');
    expect(output).toContain('Current balance: 1000.00');
  });

  test('TC-02: viewing the initial balance does not change it', () => {
    const output = runApp('1\n1\n4\n');

    expect(output.match(/Current balance: 1000\.00/g)).toHaveLength(2);
  });

  test('TC-03: credits an amount with cents and persists the new balance', () => {
    const output = runApp('2\n125.50\n1\n4\n');

    expect(output).toContain('Amount credited. New balance: 1125.50');
    expect(output).toContain('Current balance: 1125.50');
  });

  test('TC-04: applies multiple credits to the latest balance', () => {
    const output = runApp('2\n10.25\n2\n4.75\n1\n4\n');

    expect(output).toContain('Amount credited. New balance: 1010.25');
    expect(output).toContain('Amount credited. New balance: 1015.00');
    expect(output).toContain('Current balance: 1015.00');
  });

  test('TC-05: debits less than the available balance', () => {
    const output = runApp('3\n125.50\n1\n4\n');

    expect(output).toContain('Amount debited. New balance: 874.50');
    expect(output).toContain('Current balance: 874.50');
  });

  test('TC-06: allows a debit equal to the available balance', () => {
    const output = runApp('3\n1000.00\n1\n4\n');

    expect(output).toContain('Amount debited. New balance: 0.00');
    expect(output).toContain('Current balance: 0.00');
  });

  test('TC-07: rejects a debit one cent above the balance without changing it', () => {
    const output = runApp('3\n1000.01\n1\n4\n');

    expect(output).toContain('Insufficient funds for this debit.');
    expect(output).toContain('Current balance: 1000.00');
    expect(output).not.toContain('Amount debited.');
  });

  test('TC-08: applies a credit and debit sequentially', () => {
    const output = runApp('2\n200.00\n3\n50.25\n1\n4\n');

    expect(output).toContain('Amount credited. New balance: 1200.00');
    expect(output).toContain('Amount debited. New balance: 1149.75');
    expect(output).toContain('Current balance: 1149.75');
  });

  test('TC-09: reports an invalid menu choice and accepts the next choice', () => {
    const output = runApp('5\n1\n4\n');

    expect(output).toContain('Invalid choice, please select 1-4.');
    expect(output.match(/Account Management System/g)).toHaveLength(3);
    expect(output).toContain('Current balance: 1000.00');
  });

  test('TC-10: exits the menu loop with a goodbye message', () => {
    const output = runApp('4\n');

    expect(output).toContain('Exiting the program. Goodbye!');
    expect(output.match(/Account Management System/g)).toHaveLength(1);
  });

  test('TC-11: zero-value credits and debits leave the balance unchanged', () => {
    const output = runApp('2\n0.00\n3\n0.00\n1\n4\n');

    expect(output).toContain('Amount credited. New balance: 1000.00');
    expect(output).toContain('Amount debited. New balance: 1000.00');
    expect(output).toContain('Current balance: 1000.00');
  });
});