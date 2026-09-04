import path from "node:path";
import type { NextConfig } from "next";

/**
 * GitHub Pages 用の静的書き出しは環境変数で切り替える。
 *   ローカル開発（npm run dev）        → サーバーあり・basePath なし
 *   GitHub Pages 用（npm run build:pages）→ 静的HTML出力・basePath あり
 */
const isPagesBuild = process.env.GITHUB_PAGES === "true";
const basePath = isPagesBuild ? "/education-content-master" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 画像などをふつうの <img> で読むときに、公開先の基準パスを付けられるようにする
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // C:\Users\realize5\package-lock.json が存在するため、Next.js が
  // ワークスペースのルートをそちらと誤認して警告を出す。
  // このプロジェクト自身をルートとして明示することで回避する。
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  ...(isPagesBuild
    ? {
        output: "export" as const,
        basePath,
        // GitHub Pages は /foo → /foo/index.html を配信するため末尾スラッシュが必要
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
