import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "../components/Nav";
import { ChannelProvider } from "../components/channel";

export const metadata: Metadata = { title: "Studio konten", description: "Topik jadi video pendek untuk tiap channel" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <ChannelProvider>
          <div className="shell">
            <Nav />
            <main className="main">{children}</main>
          </div>
        </ChannelProvider>
      </body>
    </html>
  );
}
