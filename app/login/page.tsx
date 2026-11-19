"use client";
import { useState } from "react";

const STEPS = [
  { t: "00:00", label: "Riset topik" },
  { t: "00:03", label: "Naskah" },
  { t: "00:12", label: "Suara narator" },
  { t: "00:45", label: "Render 9:16" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Gagal masuk.");
      const next = new URLSearchParams(window.location.search).get("next") || "/";
      window.location.href = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-side" aria-hidden="true">
        <span className="logo login-logo">Studio<b>.</b></span>
        <div className="login-pitch">
          <p className="login-kicker">Studio konten</p>
          <h2 className="login-headline">Topik masuk,<br />video pendek keluar.</h2>
        </div>
        <ol className="login-track">
          {STEPS.map((s) => (
            <li key={s.t}>
              <span className="login-tc">{s.t}</span>
              <span>{s.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="login-main">
        <form className="login-card" onSubmit={submit} noValidate>
          <span className="logo login-logo-sm">Studio<b>.</b></span>
          <div className="login-head">
            <h1 className="h2">Masuk</h1>
            <p className="muted small">Pakai akun studio untuk lanjut ke proyek dan channel.</p>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="login-pass">
              <input id="password" className="input" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="login-eye" onClick={() => setShow((v) => !v)} aria-pressed={show}>
                {show ? "Sembunyikan" : "Lihat"}
              </button>
            </div>
          </div>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="btn primary login-submit" disabled={busy || !email || !password}>
            {busy ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </section>
    </div>
  );
}
