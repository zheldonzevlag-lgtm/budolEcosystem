const { Bonjour } = require('bonjour-service');
const bonjour = new Bonjour();

console.log('Browsing for budolEcosystem services via mDNS...');

const browser = bonjour.find({ type: 'budolpay' });

browser.on('up', (service) => {
    console.log(`✅ Found Service: ${service.name}`);
    console.log(`   Type: ${service.type}`);
    console.log(`   IP: ${service.referer.address}`);
    console.log(`   Port: ${service.port}`);
    console.log(`   TXT: ${JSON.stringify(service.txt)}`);
});

// Also look for other types we advertised
const types = ['budolid', 'budolshap', 'budoladmin', 'budolpg'];
types.forEach(type => {
    bonjour.find({ type }).on('up', (service) => {
        console.log(`✅ Found Service: ${service.name} (${type}) at ${service.referer.address}:${service.port}`);
    });
});

setTimeout(() => {
    console.log('Stopping discovery.');
    bonjour.destroy();
    process.exit(0);
}, 10000);
