/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disabilita il type checking durante il build (usa con cautela!)
    // ignoreBuildErrors: true,
  },
  eslint: {
    // Disabilita l'ESLint durante il build (Vercel non installa devDependencies)
    ignoreDuringBuilds: true,
  },
  // Security headers per produzione
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
