import type { NextConfig } from "next";

const config: NextConfig = {
  async rewrites() {
    const apiOrigin = (process.env.API_ORIGIN || "http://127.0.0.1:3001").replace(/\/$/, "");
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }];
  },
};

export default config;
