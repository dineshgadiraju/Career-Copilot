"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecommendedJobs } from "@/services/jobs";
import { createApplication } from "@/services/applications";

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingJobId, setSavingJobId] = useState<number | null>(null);

  useEffect(() => {
    async function loadJobs() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await getRecommendedJobs(token);
        setJobs(data.jobs || []);
        setQuery(data.query || "");
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [router]);

  async function handleSaveJob(job: any) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    setSavingJobId(job.id);

    try {
      await createApplication(token, {
        company: job.company,
        position: job.title,
        status: "Saved",
        job_url: job.apply_url,
      });

      alert("Job saved to Applications");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingJobId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h2 className="text-xl font-semibold">Loading personalized jobs...</h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">🎯 Recommended Live Jobs</h1>

          <p className="text-slate-500 mt-2">
            Personalized using your uploaded resume skills.
          </p>

          <p className="text-sm mt-2 text-blue-600">
            Search Query: <strong>{query}</strong>
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow">
            <p className="text-lg">No jobs found.</p>

            <p className="text-slate-500 mt-2">
              Upload a resume first or try again later.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow border p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{job.title}</h2>

                    <p className="text-slate-600 mt-1">{job.company}</p>

                    <p className="text-sm text-slate-500">
                      {job.location} • {job.job_type}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {job.match_score}%
                    </div>

                    <div className="text-xs text-slate-500">Match</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold">✅ Matched Skills</h3>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.matched_skills?.length > 0 ? (
                      job.matched_skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="font-semibold">📚 Missing Skills</h3>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.missing_skills?.slice(0, 8).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-700"
                  >
                    Apply Now
                  </a>

                  <button
                    onClick={() => handleSaveJob(job)}
                    disabled={savingJobId === job.id}
                    className="border border-slate-300 px-5 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-60"
                  >
                    {savingJobId === job.id ? "Saving..." : "Save Job"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}