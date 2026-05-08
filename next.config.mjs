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
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
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
      {
        source: '/videos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProd ? 'public, max-age=2592000, stale-while-revalidate=86400' : 'no-store',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProd ? 'public, max-age=2592000, stale-while-revalidate=86400' : 'no-store',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProd ? 'public, max-age=31536000, immutable' : 'no-store',
          },
        ],
      },
      {
        source: '/logos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProd ? 'public, max-age=2592000, stale-while-revalidate=86400' : 'no-store',
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
      {
        source: '/products',
        destination: '/app',
        permanent: true,
      },
      {
        source: '/vaults',
        destination: '/app',
        permanent: true,
      },
      {
        source: '/vault',
        destination: '/app',
        permanent: true,
      },
    ];
  },
  turbopack: {},
  webpack(config, { isServer }) {
    // Silence MetaMask SDK warning about react-native-async-storage (browser-only)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    // Fix wagmi v3 webpack issues with optional modules
    const path = require('path');
    const webpack = require('webpack');
    const mockPath = path.resolve(__dirname, 'src/lib/wagmi-tempo-mock.js');

    // Alias-based resolution for static imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@wagmi/core/tempo': mockPath,
      '@wagmi/core/dist/esm/tempo/Connectors.js': mockPath,
      '@wagmi/core/dist/esm/tempo/exports.js': mockPath,
      '@base-org/account': mockPath,
      '@coinbase/wallet-sdk': mockPath,
      '@metamask/connect-evm': mockPath,
    };

    // NormalModuleReplacementPlugin catches dynamic imports that alias misses
    const optionalDeps = [
      /^porto$/,
      /^porto\/internal$/,
      /^@safe-global\/safe-apps-sdk$/,
      /^@safe-global\/safe-apps-provider$/,
      /^@walletconnect\/ethereum-provider$/,
    ];
    for (const pattern of optionalDeps) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(pattern, mockPath),
      );
    }

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
