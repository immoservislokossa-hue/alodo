/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.129.107.71'],
  
  // PWA Configuration
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },

  // Static optimization
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
