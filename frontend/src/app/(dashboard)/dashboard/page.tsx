"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDashboard } from "@/services/dashboard";
import { getRecommendedJobs } from "@/services/jobs";

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const data = await getDashboard(token);
      setDashboard(data);

      try {
        const jobData = await getRecommendedJobs(token);
        setJobs((jobData.jobs || []).slice(0, 3));
      } catch {
        setJobs([]);
      }
    }

    loadDashboard();
  }, [router]);

  if (!dashboard) {
    return <main className="p-8">Loading dashboard...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-6">
          <p className="text-sm font-medium text-blue-600">Career Copilot</p>
          <h1 className="text-3xl font-bold mt-2">
            Welcome back, {dashboard.user || "Dinesh"} 👋
          </h1>
          <p className="text-slate-500 mt-2">
            Track applications, improve your resume, and apply to high-match U.S. jobs.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
          <StatCard title="Resume Score" value={`${dashboard.resume_score || 0}%`} />
          <StatCard title="Applications" value={dashboard.total_applications || 0} />
          <StatCard title="Interviews" value={dashboard.interviews || 0} />
          <StatCard title="Offers" value={dashboard.offers || 0} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <QuickAction href="/jobs" title="Live Jobs" desc="View personalized U.S. job matches" />
          <QuickAction href="/resume" title="Resume" desc="Upload and analyze your latest resume" />
          <QuickAction href="/applications" title="Applications" desc="Track saved jobs and progress" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Top Recommended Jobs</h2>

            {jobs.length === 0 ? (
              <p className="text-sm text-slate-500">
                Upload a resume to see live job recommendations.
              </p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="border border-slate-200 rounded-2xl p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">{job.title}</p>
                        <p className="text-sm text-slate-500">{job.company}</p>
                      </div>
                      <p className="font-bold text-green-600">{job.match_score}%</p>
                    </div>
                  </div>
                ))}

                <Link
                  href="/jobs"
                  className="inline-block text-sm font-medium text-blue-600 hover:underline"
                >
                  View all jobs →
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Detected Skills</h2>

            <div className="flex flex-wrap gap-2">
              {dashboard.skills?.length > 0 ? (
                dashboard.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No skills detected yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Next Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionItem title="Apply" desc="Save 5 high-match jobs today." />
            <ActionItem title="Tailor" desc="Tailor your resume for your top job." />
            <ActionItem title="Improve" desc="Close missing skill gaps from live jobs." />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function QuickAction({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition"
    >
      <p className="text-lg font-bold">{title}</p>
      <p className="text-sm text-slate-500 mt-2">{desc}</p>
    </Link>
  );
}

function ActionItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </div>
  );
}