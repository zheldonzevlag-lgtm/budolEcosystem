/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // API configuration is not a top-level next.config.js option in newer Next.js versions.
  // It should be defined inside individual route handlers if using App Router.
};

export default nextConfig;
