const SERVICES = [
  { name: 'budolID', url: 'http://localhost:8000/api/health' },
  { name: 'budolPay Gateway', url: 'http://localhost:8080/health' },
  { name: 'Auth Service', url: 'http://localhost:8001/health' },
  { name: 'Wallet Service', url: 'http://localhost:8002/health' },
  { name: 'Transaction Service', url: 'http://localhost:8003/health' },
  { name: 'Payment Gateway', url: 'http://localhost:8004/health' },
  { name: 'Verification Service', url: 'http://localhost:8005/health' },
  { name: 'Settlement Service', url: 'http://localhost:8006/health' },
  { name: 'budolShap', url: 'http://localhost:3001/api/hello' }
];

async function verifyHealth() {
  console.log('🩺 Verifying Ecosystem Health...\n');
  
  for (const service of SERVICES) {
    try {
      const response = await fetch(service.url, { timeout: 3000 });
      if (response.ok) {
        console.log(`✅ ${service.name.padEnd(20)}: UP (${response.status})`);
      } else {
        console.log(`❌ ${service.name.padEnd(20)}: DOWN (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${service.name.padEnd(20)}: UNREACHABLE (${error.message})`);
    }
  }
}

verifyHealth();
