import axios from 'axios';

const maskPII = (str, type = 'AUTO') => {
    if (!str) return 'N/A';
    if (type === 'AUTO') {
        if (str.includes('@')) type = 'EMAIL';
        else if (/\d/.test(str) && str.length >= 7) type = 'PHONE';
        else type = 'NAME';
    }
    if (type === 'EMAIL') {
        const [user, domain] = str.split('@');
        return `${user.charAt(0)}${'*'.repeat(Math.max(0, user.length - 1))}@${domain}`;
    }
    if (type === 'PHONE') {
        const digits = str.replace(/\D/g, '');
        if (digits.length >= 10) {
            return `${digits.substring(0, 3)}${'*'.repeat(Math.max(0, digits.length - 6))}${digits.slice(-3)}`;
        }
        return '***' + digits.slice(-3);
    }
    if (type === 'NAME') {
        return `${str.charAt(0)}${'*'.repeat(Math.max(0, str.length - 1))}`;
    }
    return '***';
};

async function verifyCompliance() {
    console.log('\n=== Budol Ecosystem Compliance Verification v3.2.0 ===\n');
    
    console.log('Testing maskPII local logic:');
    console.log('Email:', maskPII('test@example.com'));
    console.log('Phone:', maskPII('09123456789'));
    console.log('Name:', maskPII('Test'));

    const services = [
        { name: 'budolID', url: 'http://localhost:8000' },
        { name: 'auth-service', url: 'http://localhost:8001' }
    ];

    for (const service of services) {
        try {
            console.log(`Checking ${service.name} at ${service.url}...`);
            // Try a simple health check or root
            const res = await axios.get(service.url).catch(e => e.response);
            if (res) {
                console.log(`✓ ${service.name} is reachable (Status: ${res.status})`);
            } else {
                console.log(`✗ ${service.name} is unreachable`);
            }
        } catch (error) {
            console.log(`✗ ${service.name} error: ${error.message}`);
        }
    }

    console.log('\n--- Verifying PII Masking in Auth Service ---');
    try {
        // Test /user/find endpoint for PII masking
        const findRes = await axios.get('http://localhost:8001/user/find?phone=09123456789');
        if (findRes.data) {
            console.log('User Find Response:', JSON.stringify(findRes.data, null, 2));
            const { firstName, lastName, phoneNumber, email } = findRes.data;
            
            const isMasked = (val) => val && val.includes('*');
            
            if (isMasked(firstName) && isMasked(lastName) && isMasked(phoneNumber)) {
                console.log('✓ PII Masking verified in /user/find endpoint');
            } else {
                console.log('✗ PII Masking FAILED in /user/find endpoint');
            }
        }
    } catch (error) {
        console.log(`✗ Auth Service PII Test Error: ${error.message}`);
    }

    console.log('\n--- Verifying OTP Highlighting ---');
    console.log('Please check the server console for yellow OTP values.');
    console.log('Triggering OTP via /login/mobile/identify...');
    
    try {
        const otpRes = await axios.post('http://localhost:8001/login/mobile/identify', {
            phoneNumber: '09123456789',
            deviceId: 'test-device-v3.2.0'
        });
        console.log('ℹ OTP Response Status:', otpRes.data.status);
        console.log('ℹ OTP triggered. Verify yellow text in auth-service console.');
    } catch (error) {
        console.log(`✗ OTP Trigger Error: ${error.message}`);
    }

    console.log('\n=== Verification Complete ===\n');
}

verifyCompliance();
