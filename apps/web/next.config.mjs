/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@salary-mgmt/types"],
  output: "standalone",
};

export default nextConfig;
