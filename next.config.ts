import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // 홈 디렉토리에 떠돌이 package-lock.json 이 있어서 Turbopack 이 워크스페이스
    // 루트를 잘못 추론한다. 프로젝트 디렉토리로 고정해 둔다.
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
