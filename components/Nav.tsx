"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useChannel } from "./channel";

const GROUPS = [
  { label: "Produksi", items: [{ href: "/", label: "Buat konten" }, { href: "/proyek", label: "Proyek" }, { href: "/affiliate", label: "Video affiliate" }] },
  {
    label: "Pengaturan channel",
    items: [
      { href: "/channel", label: "Brand kit" },
      { href: "/template", label: "Template" },
      { href: "/karakter", label: "Karakter & suara" },
    ],
  },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { channels, current, setCurrent } = useChannel();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  };
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <nav className={"nav" + (open ? " open" : "")} aria-label="Menu utama">
      <div className="nav-top">
        <Link href="/" className="logo" aria-label="Studio, beranda">
          Studio<b>.</b>
        </Link>
        <button className="btn quiet nav-toggle" aria-expanded={open} aria-controls="menu-utama" onClick={() => setOpen((o) => !o)}>
          {open ? "Tutup" : "Menu"}
        </button>
      </div>
      <div className="field channel-pick">
        <label htmlFor="pilih-channel" className="small">Channel aktif</label>
        <select id="pilih-channel" className="select" value={current?.id || ""} onChange={(e) => setCurrent(e.target.value)} disabled={!channels}>
          {(channels || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Link href="/channel/baru" className="small">Buat channel baru</Link>
      </div>
      <div className="nav-groups" id="menu-utama">
        {GROUPS.map((g) => (
          <div className="nav-group" key={g.label}>
            <div className="nav-label">{g.label}</div>
            {g.items.map((it) => (
              <Link key={it.href} href={it.href} className="nav-link" aria-current={active(it.href) ? "page" : undefined}>
                {it.label}
              </Link>
            ))}
          </div>
        ))}
        <div className="nav-group">
          <button className="nav-link nav-logout" onClick={logout}>Keluar</button>
        </div>
      </div>
    </nav>
  );
}
