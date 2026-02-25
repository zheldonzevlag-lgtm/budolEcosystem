const http = require('http');

const PORT = process.env.PORT || 8005;

const server = http.createServer((req, res) => {
    console.log(`\n[Mock Gateway] Received ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url.startsWith('/checkout/')) {
        const intentId = req.url.split('/').pop();
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        
        // Use a simple string replace to avoid template literal nesting issues
        let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>budolPay Checkout</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f4f4; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 400px; text-align: center; }
        .logo { color: #ff4d4f; font-size: 24px; font-weight: bold; margin-bottom: 1rem; }
        .amount { font-size: 32px; font-weight: bold; margin: 1rem 0; }
        button { background: #ff4d4f; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 1rem; }
        button:hover { background: #e04345; }
        .details { color: #666; margin-bottom: 2rem; }
        #debug { margin-top: 1rem; font-size: 12px; color: #999; min-height: 1.2em; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">budolPay</div>
        <p class="details">Payment Intent: __INTENT_ID__</p>
        <div class="amount">₱ 54.00</div>
        <p>This is a mock authorization page.</p>
        <button id="payBtn" onclick="pay()">Authorize Payment</button>
        <div id="debug"></div>
    </div>

    <script>
        console.log('Checkout script loaded');
        
        function updateDebug(msg) {
            console.log('Debug:', msg);
            document.getElementById('debug').innerText = msg;
        }

        async function pay() {
            const btn = document.getElementById('payBtn');
            const intentId = '__INTENT_ID__';
            
            // Try to get orderId from URL first, then localStorage
            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get('orderId') || localStorage.getItem('lastOrderId') || 'unknown';
            
            btn.disabled = true;
            btn.innerText = 'Processing...';
            updateDebug('Initiating payment for order: ' + orderId);

            const ports = [3000, 3001];
            let success = false;

            for (const port of ports) {
                if (success) break;
                try {
                    updateDebug('Trying port ' + port + '...');
                    const response = await fetch('http://localhost:' + port + '/api/webhooks/budolpay', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event: 'payment.success',
                            data: {
                                id: intentId,
                                status: 'paid',
                                amount: 54.00,
                                currency: 'PHP',
                                metadata: { 
                                    orderId: orderId,
                                    app: 'budolShap'
                                }
                            }
                        })
                    });

                    if (response.ok) {
                        success = true;
                        updateDebug('Success! Redirecting...');
                        alert('✅ Payment Successful! Redirecting to your orders...');
                        // Redirect to the QR page or status page instead of orders list directly
                        // But for "internal" flow, we might want to go back to the app's return URL
                        // The return URL usually handles the final redirect.
                        // If we are testing locally, let's redirect to the return URL provided.
                        
                        // Parse the original return URL to see if it was passed
                        const urlParams = new URLSearchParams(window.location.search);
                        // In real flow, the return URL is usually passed or known.
                        // Here we default to localhost:3000/payment/return if not found.
                        
                        const returnUrl = 'http://localhost:' + port + '/payment/return?payment_intent_id=' + intentId + '&orderId=' + orderId;
                        console.log('Redirecting to:', returnUrl);
                        window.location.href = returnUrl;
                    } else {
                        updateDebug('Port ' + port + ' failed with status: ' + response.status);
                    }
                } catch (err) {
                    updateDebug('Port ' + port + ' error: ' + err.message);
                }
            }

            if (!success) {
                alert('❌ Payment Failed. Could not reach BudolShap on port 3000 or 3001.');
                btn.disabled = false;
                btn.innerText = 'Authorize Payment';
            }
        }
    </script>
</body>
</html>
`;
        res.end(html.replace(/__INTENT_ID__/g, intentId));
        return;
    }

    if (req.method === 'POST' && req.url === '/payments/create-intent') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            console.log('[Mock Gateway] Request Body:', body);
            
            const apiKey = req.headers['x-api-key'];
            if (!apiKey || apiKey !== 'bs_key_2025') {
                console.log('[Mock Gateway] ❌ Invalid API Key');
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Forbidden: Invalid API Key' }));
                return;
            }

            const parsedBody = JSON.parse(body);
            const intentId = 'pi_' + Math.random().toString(36).substring(7);
            
            const response = {
                id: intentId,
                amount: parsedBody.amount,
                currency: parsedBody.currency,
                status: 'awaiting_payment',
                checkout_url: `http://localhost:8005/checkout/${intentId}`,
                client_key: 'ck_' + Math.random().toString(36).substring(7)
            };

            console.log('[Mock Gateway] ✅ Success - Returning Intent:', intentId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`🚀 budolPay Mock Gateway running at http://localhost:${PORT}`);
});
