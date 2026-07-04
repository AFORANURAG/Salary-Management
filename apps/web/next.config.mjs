/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@salary-mgmt/types",
    "@salary-mgmt/ui",
    "@salary-mgmt/store",
    "@salary-mgmt/errors",
    "@salary-mgmt/money",
  ],
  output: "standalone",
};

export default nextConfig;
