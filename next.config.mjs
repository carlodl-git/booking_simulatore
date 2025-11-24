/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disabilita il type checking durante il build (usa con cautela!)
    // ignoreBuildErrors: true,
  },
  eslint: {
    // Disabilita l'ESLint durante il build per test
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
