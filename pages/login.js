import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Head from "next/head";

function getNextPath() {
  if (typeof window === "undefined") return "/";
  const p = new URLSearchParams(window.location.search).get("next");
  return p && p.startsWith("/") ? p : "/";
}

export default function LoginPage() {
  const [cfg, setCfg] = useState({ url: "", key: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [msg, setMsg] = useState("");
  const nextPath = useMemo(() => getNextPath(), []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const r = await fetch("/api/config");
        const c = await r.json();
        if (!mounted) return;
        setCfg({ url: c.url || "", key: c.key || "" });
      } finally {
        if (mounted) setChecking(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!cfg.url || !cfg.key) return;
    const supabase = createClient(cfg.url, cfg.key);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = nextPath;
    });
  }, [cfg, nextPath]);

  async function onLogin(e) {
    e.preventDefault();
    if (!cfg.url || !cfg.key) return setMsg("Missing Supabase config.");
    setLoading(true);
    setMsg("");
    try {
      const supabase = createClient(cfg.url, cfg.key);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      window.location.href = nextPath;
    } catch (err) {
      setMsg(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      <main style={{ maxWidth: 420, margin: "8vh auto", padding: 20, fontFamily: "\"Google Sans\", \"Roboto\", \"Segoe UI\", sans-serif" }}>
        <h1 style={{ marginBottom: 8 }}>Login</h1>
        <p style={{ color: "#556", marginBottom: 20 }}>Sign in to access your job tracker.</p>
        {msg && (
          <div style={{ marginBottom: 12, color: "#b00020", border: "1px solid #e8b4bf", padding: 10, borderRadius: 8 }}>
            {msg}
          </div>
        )}
        <form onSubmit={onLogin}>
          <label style={{ display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 12, padding: 10, borderRadius: 8, border: "1px solid #ccd" }}
          />
          <label style={{ display: "block", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 16, padding: 10, borderRadius: 8, border: "1px solid #ccd" }}
          />
          <button
            type="submit"
            disabled={loading || checking}
            style={{ width: "100%", padding: 11, borderRadius: 8, border: 0, background: "#1d4ed8", color: "#fff", cursor: "pointer" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p style={{ marginTop: 14 }}>
          New here? <a href={`/signup?next=${encodeURIComponent(nextPath)}`}>Create an account</a>
        </p>
      </main>
    </>
  );
}
