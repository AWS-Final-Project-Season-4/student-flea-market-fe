import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/policies',
        destination: '/policies/term-of-service',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
