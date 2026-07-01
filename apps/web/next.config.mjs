/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@salary-mgmt/types",
    "@salary-mgmt/ui",
    "@salary-mgmt/store",
    "@salary-mgmt/errors",
  ],
  output: "standalone",
};

export default nextConfig;
