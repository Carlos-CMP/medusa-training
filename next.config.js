const checkEnvVariables = require("./check-env-variables")

// Webflow Cloud's image loader (webflow-loader.ts) imports this config file,
// which pulls this module into the client bundle too. Only run the Node-only
// env check when actually building/running in Node, not when this file's
// side effects get re-executed in the browser.
if (typeof window === "undefined") {
  checkEnvVariables()
}

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    // Webflow Cloud sets a custom `loader` (webflow-loader.ts) that replaces
    // Next's whole optimization pipeline, including basePath prefixing for
    // local assets. `unoptimized: true` was skipping that loader entirely,
    // which is why local images 404'd without the `/tienda` prefix.
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "ngs-medusa-backend.onrender.com",
      },
      {
        protocol: "https",
        hostname: "b2b-novicell.medusajs.app",
      },
      {
        protocol: "https",
        hostname: "b2b-novicell.medusajs.site",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
    ],
  },
}

module.exports = nextConfig
