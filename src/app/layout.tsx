import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "教育コンテンツMASTER｜REALIZE OS",
  description: "REALIZE OSの知識・教材・資料を、ひとつに。",
  // 社内向けツールのため検索エンジンには載せない
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen text-[16px] leading-relaxed">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
