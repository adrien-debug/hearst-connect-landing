import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: true },
  devIndicators: false,
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...(isProd ? [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] : []),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProd ? 'public, max-age=31536000, immutable' : 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/hub',
        destination: '/',
        permanent: true,
      },
      {
        source: '/launch-app',
        destination: '/app',
        permanent: true,
      },
    ];
  },
  webpack(config) {
    // Silence MetaMask SDK warning about react-native-async-storage (browser-only)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    config.module.rules.forEach((rule) => {
      if (!rule.oneOf) return;
      rule.oneOf.forEach((r) => {
        if (!r.use || !Array.isArray(r.use)) return;
        const postcssIdx = r.use.findIndex(
          (u) =>
            (typeof u === 'string' && u.includes('postcss-loader')) ||
            (typeof u === 'object' && u.loader && u.loader.includes('postcss-loader')),
        );
        if (postcssIdx === -1) return;
        r.use[postcssIdx] = {
          loader: require.resolve('@tailwindcss/webpack'),
          options: { base: resolve(__dirname, 'src') },
        };
      });
    });
    return config;
  },
};

export default nextConfig;
