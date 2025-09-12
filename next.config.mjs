/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
 images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,  // ✅ enable SVG support
    domains: ["res.cloudinary.com", "images.unsplash.com", "via.placeholder.com"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  reactStrictMode: true,
  swcMinify: true,
}

export default nextConfig
