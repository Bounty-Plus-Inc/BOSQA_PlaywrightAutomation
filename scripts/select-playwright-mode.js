const readline = require('readline');
const { spawn } = require('child_process');

const extraArgs = process.argv.slice(2);

const choices = {
  '1': { label: 'headed', args: ['test', '--headed'] },
  h: { label: 'headed', args: ['test', '--headed'] },
  '2': { label: 'ui', args: ['test', '--ui'] },
  u: { label: 'ui', args: ['test', '--ui'] }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Select Playwright mode:');
console.log('  1) headed');
console.log('  2) ui');

rl.question('Run mode [1/2]: ', (answer) => {
  rl.close();

  const choice = choices[answer.trim().toLowerCase()];
  if (!choice) {
    console.error('Invalid selection. Use 1 for headed or 2 for ui.');
    process.exit(1);
  }

  const child = spawn('npx', ['playwright', ...choice.args, ...extraArgs], {
    stdio: 'inherit',
    shell: true
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
});
