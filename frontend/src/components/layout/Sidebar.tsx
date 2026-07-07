"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/applications", label: "Applications" },
  { href: "/jobs", label: "Live Jobs" },
  { href: "/resume", label: "Resume" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/chat", label: "AI Coach" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 p-5 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Career Copilot</h1>
        <p className="text-sm text-slate-500">AI job search assistant</p>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg text-sm ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="text-left px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </aside>
  );
}