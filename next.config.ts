import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Pin the workspace root so Turbopack resolves modules against this app
     directory. Without this, sibling/parent lockfiles can make Turbopack
     infer a wrong root and break the React Server Components manifest. */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
