/** @type {import('next').NextConfig} */
const nextConfig = {
   // Disable experimental turbo that may be causing memory issues
   experimental: {
      turbo: {
         enabled: false
      },
   },
   // Disable React strict mode during development
   reactStrictMode: false,
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
   }
};

module.exports = nextConfig;
