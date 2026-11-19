"use client";
import { usePathname } from "next/navigation";
import { Nav } from "./Nav";
import { ChannelProvider } from "./channel";

/** Kerangka app (menu + konten). Halaman login tampil sendiri tanpa menu. */
export function Shell({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/login") return <>{children}</>;
  return (
    <ChannelProvider>
      <div className="shell">
        <Nav />
        <main className="main">{children}</main>
      </div>
    </ChannelProvider>
  );
}
