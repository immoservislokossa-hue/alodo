/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,

  allowedDevOrigins: ['172.27.255.71'],

  async headers() {
    return [
      // 🔥 Service Worker → jamais en cache
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },

      // 🔥 HTML / pages → jamais en cache (évite bugs)
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },

      // ⚡ Assets Next (ultra perf)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ⚡ Images / fonts / static
      {
        source: "/(.*)\\.(png|jpg|jpeg|gif|webp|svg|ico|ttf|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;