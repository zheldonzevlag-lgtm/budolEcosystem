/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@budolpay/database', '@budolpay/audit', '@budolpay/security', '@budolpay/notifications'],
};

export default nextConfig;
