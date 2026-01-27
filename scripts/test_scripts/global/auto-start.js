const { spawn } = require('child_process');

const child = spawn('node', ['start-ecosystem.js'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true
});

child.stdin.write('1\n');
child.stdin.end();
