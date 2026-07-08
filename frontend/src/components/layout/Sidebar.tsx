"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/jobs", label: "Live Jobs", icon: "🔥" },
  { href: "/applications", label: "Applications", icon: "📌" },
  { href: "/resume", label: "Resume", icon: "📄" },
  { href: "/resume-tailor-history", label: "Tailor History", icon: "✨" },
  { href: "/roadmap", label: "Roadmap", icon: "🗺️" },
  { href: "/chat", label: "AI Coach", icon: "🤖" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <aside className="w-72 min-h-screen bg-white border-r border-slate-200 px-5 py-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
            C
          </div>

          <div>
            <h1 className="text-lg font-bold">Career Copilot</h1>
            <p className="text-xs text-slate-500">AI job search assistant</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border border-slate-200 rounded-2xl p-4 mb-4 bg-slate-50">
        <p className="text-xs font-medium text-slate-500">Today’s focus</p>
        <p className="text-sm font-semibold mt-1">Apply to 5 high-match jobs</p>
      </div>

      <button
        onClick={logout}
        className="text-left px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 transition"
      >
        Logout
      </button>
    </aside>
  );
}