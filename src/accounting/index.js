const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

const MAX_BALANCE_CENTS = 99_999_999;

function formatMoney(cents) {
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, '0');
  return `${whole}.${fraction}`;
}

function parseAmount(value) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ''] = normalized.split('.');
  const wholeAmount = Number(whole);
  if (!Number.isSafeInteger(wholeAmount)) {
    return null;
  }

  const cents = wholeAmount * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= MAX_BALANCE_CENTS
    ? cents
    : null;
}

async function run() {
  const terminal = readline.createInterface({ input: stdin, output: stdout });
  const lines = terminal[Symbol.asyncIterator]();
  let balanceCents = 100_000;

  async function ask(prompt) {
    stdout.write(prompt);
    const result = await lines.next();
    return result.done ? null : result.value;
  }

  try {
    let running = true;
    while (running) {
      stdout.write('--------------------------------\n');
      stdout.write('Account Management System\n');
      stdout.write('1. View Balance\n');
      stdout.write('2. Credit Account\n');
      stdout.write('3. Debit Account\n');
      stdout.write('4. Exit\n');
      stdout.write('--------------------------------\n');

      const choice = await ask('Enter your choice (1-4): ');
      if (choice === null) {
        break;
      }

      switch (choice.trim()) {
        case '1':
          stdout.write(`Current balance: ${formatMoney(balanceCents)}\n`);
          break;
        case '2':
        case '3': {
          const isCredit = choice.trim() === '2';
          const label = isCredit ? 'credit' : 'debit';
          const inputAmount = await ask(`Enter ${label} amount: `);
          if (inputAmount === null) {
            running = false;
            break;
          }

          const amountCents = parseAmount(inputAmount);
          if (amountCents === null) {
            stdout.write('Enter a non-negative amount with up to two decimal places.\n');
            break;
          }

          if (isCredit) {
            const updatedBalance = balanceCents + amountCents;
            if (updatedBalance > MAX_BALANCE_CENTS) {
              stdout.write('Credit exceeds the maximum balance of 999999.99.\n');
              break;
            }

            balanceCents = updatedBalance;
            stdout.write(`Amount credited. New balance: ${formatMoney(balanceCents)}\n`);
          } else if (balanceCents >= amountCents) {
            balanceCents -= amountCents;
            stdout.write(`Amount debited. New balance: ${formatMoney(balanceCents)}\n`);
          } else {
            stdout.write('Insufficient funds for this debit.\n');
          }
          break;
        }
        case '4':
          running = false;
          break;
        default:
          stdout.write('Invalid choice, please select 1-4.\n');
      }
    }

    stdout.write('Exiting the program. Goodbye!\n');
  } finally {
    terminal.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});