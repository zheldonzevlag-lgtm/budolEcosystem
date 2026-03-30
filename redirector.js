const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    console.log('[Redirector] Intercepted Request to ' + req.url);
    const parsedUrl = url.parse(req.url, true);
    const token = parsedUrl.query.token;
    
    if (token) {
        const targetUrl = `https://budolpay.vercel.app/api/auth/callback?token=${token}`;
        res.writeHead(302, {
            'Location': targetUrl
        });
        res.end();
    } else {
        res.writeHead(200);
        res.end('Redirector running. Waiting for token redirect.');
    }
});

server.listen(3000, '0.0.0.0', () => {
    console.log('[Redirector] Listening on port 3000. Forwarding to Vercel.');
});
