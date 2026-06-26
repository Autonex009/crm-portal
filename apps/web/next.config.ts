import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@crm/types", "@crm/db"],
};

export default nextConfig;
