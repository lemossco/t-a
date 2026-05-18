/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      "@prisma/client",
      "@prisma/engines",
    ];
    return config;
  },
};

export default nextConfig;
