"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      localStorage.setItem("token", data.token);

      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 space-y-6"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              C
            </div>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">
              Career Copilot
            </h1>

            <p className="text-slate-500 mt-2">
              Sign in to continue to your dashboard
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Button */}
          <button
            disabled={loading}
            className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold transition-all duration-300 hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Register Section */}
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-500">
              Don't have an account?
            </p>

            <Link
              href="/signup"
              className="block w-full h-12 rounded-xl border border-blue-600 text-blue-600 font-semibold text-center leading-[48px] transition-all duration-300 hover:bg-blue-50"
            >
              Create Account
            </Link>

            <p className="text-center text-sm text-slate-500">
              AI Career Copilot
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}