/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  output: "standalone",
  // Turbopack is now stable in Next.js 15.4
  turbopack: {
    // Enable for development
  },
};
