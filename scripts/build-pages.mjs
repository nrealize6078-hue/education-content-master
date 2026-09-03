/**
 * GitHub Pages 用の静的書き出しビルド。
 * Windows / macOS / Linux のどこでも同じように動くよう、
 * 環境変数の設定をNode側で行っている（cross-envなどの追加依存を避けるため）。
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// next の実行ファイルを直接指すことで shell を使わずに済ませる
const nextBin = require.resolve("next/dist/bin/next");

const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: { ...process.env, GITHUB_PAGES: "true" },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

// GitHub Pages が _next/ ディレクトリをJekyll扱いして無視しないようにする
const outDir = join(process.cwd(), "out");
if (existsSync(outDir)) {
  writeFileSync(join(outDir, ".nojekyll"), "");
  console.log("\n✓ out/.nojekyll を作成しました");
  console.log("✓ 静的ファイルの出力先: out/");
} else {
  mkdirSync(outDir, { recursive: true });
  console.warn("out/ が見つかりませんでした。next.config.ts の output 設定を確認してください。");
}
