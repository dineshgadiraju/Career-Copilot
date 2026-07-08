"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDashboard } from "@/services/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const data = await getDashboard(token);
      setDashboard(data);
    }

    loadDashboard();
  }, [router]);

  if (!dashboard) {
    return <main className="p-8">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Career Copilot</h1>
            <p className="text-sm text-slate-500">
              Welcome back, {dashboard.user}
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/login");
            }}
            className="border border-slate-300 bg-white px-4 py-2 rounded-lg text-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">
            Your career dashboard
          </h2>
          <p className="text-slate-500 text-sm">
            Monitor your resume, applications, and job search progress.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <Link
            href="/applications"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:bg-slate-50"
          >
            <p className="text-sm text-slate-500">Applications</p>
            <p className="mt-2 text-3xl font-semibold">Open</p>
          </Link>

          <Link
            href="/resume"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:bg-slate-50"
          >
            <p className="text-sm text-slate-500">Resume</p>
            <p className="mt-2 text-3xl font-semibold">Upload</p>
          </Link>

          <Link
            href="/jobs"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:bg-slate-50"
          >
            <p className="text-sm text-slate-500">Live Jobs</p>
            <p className="mt-2 text-3xl font-semibold">View</p>
          </Link>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-6">
            <Card title="Resume Score" value={`${dashboard.resume_score}%`} />
            <Card title="Uploads" value={dashboard.uploads} />
            <Card title="Latest Resume" value={dashboard.latest_file} small />
            <Card title="Applications" value={dashboard.total_applications || 0} />
            <Card title="Interviews" value={dashboard.interviews || 0} />
            <Card title="Offers" value={dashboard.offers || 0} />
            <Card title="Rejected" value={dashboard.rejected || 0} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Detected Skills</h3>

            <div className="flex flex-wrap gap-2">
              {dashboard.skills?.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Next Actions</h3>

            <div className="space-y-3 text-sm text-slate-600">
              <p>Improve resume score above 80%.</p>
              <p>Add React, Next.js, PostgreSQL, and Docker keywords.</p>
              <p>Track every application after applying.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  small = false,
}: {
  title: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p
        className={`mt-2 font-semibold ${
          small ? "text-lg break-words" : "text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
