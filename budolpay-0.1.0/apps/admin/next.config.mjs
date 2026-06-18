/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@budolpay/database', '@budolpay/audit', '@budolpay/security', '@budolpay/notifications'],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://budolid-ten.vercel.app https://budolpay-api-monolith.vercel.app https://websocket-budol.vercel.app wss://websocket-budol.vercel.app",
            "frame-ancestors 'self'",
            "form-action 'self' https://budolid-ten.vercel.app",
          ].join('; '),
        },
      ],
    },
  ],
};

export default nextConfig;
