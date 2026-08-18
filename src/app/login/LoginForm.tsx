"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await login(username.trim(), password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/backoffice");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted">Username</span>
        <input
          type="text"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-[12px] px-3 py-2.5 text-[16px] font-body text-teal-ink"
          style={{ background: "#F4FBF9", border: "1px solid rgba(16,48,47,0.08)", minHeight: 44 }}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[12px] px-3 py-2.5 text-[16px] font-body text-teal-ink"
          style={{ background: "#F4FBF9", border: "1px solid rgba(16,48,47,0.08)", minHeight: 44 }}
          required
        />
      </label>
      {error && (
        <div
          className="rounded-[10px] px-3 py-2 text-[12.5px] font-extrabold"
          style={{ background: "#FFECE7", color: "#B4351A" }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-coral mt-2 disabled:opacity-70"
        style={{ padding: "12px 20px", fontSize: 15 }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
