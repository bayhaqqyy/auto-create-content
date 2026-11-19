import "./globals.css";
import type { Metadata } from "next";
import { Shell } from "../components/Shell";

export const metadata: Metadata = { title: "Studio konten", description: "Topik jadi video pendek untuk tiap channel" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
