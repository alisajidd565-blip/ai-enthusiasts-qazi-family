"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "../actions";

const initial: LoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="glass rounded-3xl p-8">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-wide text-zinc-400">Admin access</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-400">Only the competition admin can upload and score.</p>
        </div>

        <form action={formAction} className="space-y-4">
          <label className="block text-sm text-zinc-300">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-cyan-400/30 focus:ring"
            />
          </label>

          {state.error ? <div className="text-sm text-red-300">{state.error}</div> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Continue"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          <Link className="text-cyan-300 hover:underline" href="/">
            Back to arena
          </Link>
        </div>
      </div>
    </main>
  );
}
