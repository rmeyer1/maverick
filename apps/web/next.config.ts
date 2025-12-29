import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@maverick/shared", "@maverick/db", "@maverick/jobs"],
};

export default nextConfig;
