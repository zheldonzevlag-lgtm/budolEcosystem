
import { getRealtimeConfig } from '../../budolshap-0.1.0/lib/realtime.js';

async function verify() {
    console.log("--- Realtime Provider Verification ---");
    try {
        const config = await getRealtimeConfig();
        console.log("Current Config:", JSON.stringify(config, null, 2));
        
        if (['POLLING', 'PUSHER', 'SOCKET_IO'].includes(config.provider)) {
            console.log("✅ Provider is valid:", config.provider);
        } else {
            console.error("❌ Invalid provider found:", config.provider);
            process.exit(1);
        }

        console.log("--- Verification Complete ---");
    } catch (error) {
        console.error("❌ Verification Failed:", error.message);
        process.exit(1);
    }
}

verify();
