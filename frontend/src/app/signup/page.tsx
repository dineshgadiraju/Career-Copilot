"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await register(email, password);

      router.push("/login");
    } catch {
      setError("Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleRegister}
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
              Create Account
            </h1>

            <p className="text-slate-500 mt-2">
              Start your AI Career Copilot journey
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
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Confirm Password
            </label>

            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full h-12 rounded-xl border border-slate-300 px-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Create Account Button */}
          <button
            disabled={loading}
            className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold transition-all duration-300 hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="mt-3 inline-block font-semibold text-blue-600 hover:text-blue-700"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}