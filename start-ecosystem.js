const { spawn } = require('child_process');
const path = require('path');

const apps = [
    {
        name: 'budolID (SSO)',
        cwd: path.join(__dirname, 'budolID-0.1.0'),
        command: 'npm',
        args: ['run', 'start'],
        port: 8000,
        color: '\x1b[35m' // Magenta
    },
    {
        name: 'budolShap (App)',
        cwd: path.join(__dirname, 'budolshap-0.1.0'),
        command: 'npm',
        args: ['run', 'dev'],
        port: 3001,
        color: '\x1b[32m' // Green
    },
    {
        name: 'budolPay (Admin)',
        cwd: path.join(__dirname, 'budolpay-0.1.0'),
        command: 'npm',
        args: ['run', 'dev'],
        port: 3000,
        color: '\x1b[34m' // Blue
    }
];

console.log('\x1b[1m\x1b[33m%s\x1b[0m', '🚀 Starting budolEcosystem Central Runner...');
console.log('\x1b[36m%s\x1b[0m', 'Local IP: 192.168.1.24');
console.log('--------------------------------------------------');

apps.forEach(app => {
    const childProcess = spawn(app.command, app.args, { 
        cwd: app.cwd, 
        shell: true,
        env: { ...process.env, PORT: app.port.toString() }
    });

    childProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${app.color}[${app.name}]\x1b[0m ${line.trim()}`);
            }
        });
    });

    childProcess.stderr.on('data', (data) => {
        console.error(`${app.color}[${app.name} ERROR]\x1b[0m ${data.toString().trim()}`);
    });

    childProcess.on('close', (code) => {
        console.log(`${app.color}[${app.name}]\x1b[0m exited with code ${code}`);
    });
});

process.on('SIGINT', () => {
    console.log('\n\x1b[31mStopping ecosystem...\x1b[0m');
    process.exit();
});
