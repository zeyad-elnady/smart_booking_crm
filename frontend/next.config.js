/** @type {import('next').NextConfig} */
const nextConfig = {
   // Disable experimental turbo that may be causing memory issues
   experimental: {
      turbo: {
         enabled: false
      },
   },
   // Disable React strict mode during development
   reactStrictMode: true,
   // Compiler options
   compiler: {
      // Add any compiler options here if needed
   },
   // Disable source maps in production to save memory
   productionBrowserSourceMaps: false,
   // Optimize memory usage
   onDemandEntries: {
      // period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 15 * 1000,
      // number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
   },
   // Reduce image optimization memory usage
   images: {
      minimumCacheTTL: 60,
      formats: ['image/webp'],
      domains: ['localhost'],
      unoptimized: process.env.NODE_ENV === 'development'
   },
   swcMinify: true,
   output: 'standalone',
   poweredByHeader: false,
   compress: true,
   env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9876',
   },
   webpack: (config, { isServer }) => {
      if (!isServer) {
         config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            url: require.resolve('url'),
            zlib: require.resolve('browserify-zlib'),
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            assert: require.resolve('assert'),
            os: require.resolve('os-browserify'),
            path: require.resolve('path-browserify'),
         };
      }
      return config;
   },
};

module.exports = nextConfig;
