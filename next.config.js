/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ofhcflgysgwczjnsxxxl.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
