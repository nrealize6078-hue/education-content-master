"use client";

import type { ReactNode } from "react";
import { ContentStoreProvider } from "@/features/contents/content-store";
import { AppShell } from "@/components/app-shell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ContentStoreProvider>
      <AppShell>{children}</AppShell>
    </ContentStoreProvider>
  );
}
