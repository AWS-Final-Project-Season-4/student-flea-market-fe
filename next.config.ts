import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
