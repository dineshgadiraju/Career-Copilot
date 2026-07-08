"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecommendedJobs } from "@/services/jobs";
import { createApplication } from "@/services/applications";
import { tailorResume, saveTailorResult } from "@/services/tailor";

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingJobId, setSavingJobId] = useState<number | null>(null);
  const [tailoringJobId, setTailoringJobId] = useState<number | null>(null);
  const [tailorResult, setTailorResult] = useState<any>(null);
  const [message, setMessage] = useState("");

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
        setMessage(err.message);
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
    setMessage("");

    try {
      await createApplication(token, {
        company: job.company,
        position: job.title,
        status: "Saved",
        job_url: job.apply_url,
      });

      setMessage("Job saved to Applications.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSavingJobId(null);
    }
  }

  async function handleTailorResume(job: any) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    setTailoringJobId(job.id);
    setTailorResult(null);
    setMessage("");

    const jobDescription = `
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Job Type: ${job.job_type}

Job Description:
${job.description}

Matched Skills:
${job.matched_skills?.join(", ")}

Missing Skills:
${job.missing_skills?.join(", ")}

Apply URL:
${job.apply_url}
`;

    try {
      const data = await tailorResume(token, jobDescription);

      setTailorResult({
        jobTitle: job.title,
        company: job.company,
        ...data,
      });

      setMessage("Resume tailoring completed.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setTailoringJobId(null);
    }
  }

  async function handleSaveTailorResult() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!tailorResult) {
      setMessage("No tailoring result to save.");
      return;
    }

    try {
      await saveTailorResult(token, tailorResult);
      setMessage("Tailoring result saved to history.");
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-6 shadow-sm">
          <h2 className="text-lg font-semibold">Loading personalized jobs...</h2>
          <p className="text-sm text-slate-500 mt-1">
            Matching live U.S. roles with your resume skills.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">Recommended Live Jobs</h1>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  U.S. only
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  Resume matched
                </span>
              </div>

              <p className="text-slate-500">
                Personalized roles ranked using your uploaded resume skills.
              </p>

              <p className="text-sm mt-3 text-slate-500">
                Search query:{" "}
                <span className="font-medium text-slate-900">{query}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 min-w-[300px]">
              <MiniStat label="Jobs" value={jobs.length} />
              <MiniStat
                label="Top Match"
                value={
                  jobs.length > 0
                    ? `${Math.max(...jobs.map((j) => j.match_score || 0))}%`
                    : "0%"
                }
              />
              <MiniStat label="Region" value="US" />
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 border border-slate-200 bg-white rounded-2xl px-5 py-4 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        {tailorResult && (
          <div className="mb-8 bg-white border border-blue-200 rounded-3xl p-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  AI Resume Tailoring
                </p>
                <h2 className="text-2xl font-bold mt-1">
                  {tailorResult.jobTitle}
                </h2>
                <p className="text-slate-500 mt-1">
                  {tailorResult.company}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveTailorResult}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
                >
                  Save Result
                </button>

                <button
                  onClick={() => setTailorResult(null)}
                  className="border border-slate-300 px-4 py-2 rounded-xl text-sm hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <ResultCard
                label="ATS Score"
                value={`${tailorResult.ats_score}%`}
                tone="green"
              />
              <ResultCard
                label="Matched Skills"
                value={tailorResult.matched_skills?.length || 0}
              />
              <ResultCard
                label="Missing Skills"
                value={tailorResult.missing_skills?.length || 0}
                tone="red"
              />
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {tailorResult.missing_skills?.length > 0 ? (
                  tailorResult.missing_skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No major missing keywords detected.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">AI Recruiter Feedback</h3>
              <div className="whitespace-pre-wrap bg-slate-50 rounded-2xl p-5 text-sm text-slate-700 border border-slate-200">
                {tailorResult.ai_feedback}
              </div>
            </div>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
            <h2 className="text-xl font-semibold">No jobs found.</h2>
            <p className="text-slate-500 mt-2">
              Upload a resume first, or try again later when new roles are available.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                        Live role
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                        United States
                      </span>
                    </div>

                    <h2 className="text-xl font-bold">{job.title}</h2>
                    <p className="text-slate-600 mt-1">{job.company}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {job.location || "United States"} •{" "}
                      {job.job_type || "Remote"}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-4xl font-bold text-green-600">
                      {job.match_score}%
                    </p>
                    <p className="text-xs text-slate-500">Resume match</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                  <SkillBox
                    title="Matched Skills"
                    emptyText="No direct matches found."
                    skills={job.matched_skills || []}
                    color="green"
                  />

                  <SkillBox
                    title="Missing Skills"
                    emptyText="No major gaps detected."
                    skills={(job.missing_skills || []).slice(0, 8)}
                    color="red"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-slate-700"
                  >
                    Apply Now
                  </a>

                  <button
                    onClick={() => handleSaveJob(job)}
                    disabled={savingJobId === job.id}
                    className="border border-slate-300 px-5 py-2.5 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    {savingJobId === job.id ? "Saving..." : "Save Job"}
                  </button>

                  <button
                    onClick={() => handleTailorResume(job)}
                    disabled={tailoringJobId === job.id}
                    className="border border-blue-300 text-blue-700 px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 disabled:opacity-60"
                  >
                    {tailoringJobId === job.id
                      ? "Tailoring..."
                      : "✨ Tailor Resume"}
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "green" | "red" | "slate";
}) {
  const color =
    tone === "green"
      ? "text-green-600"
      : tone === "red"
      ? "text-red-600"
      : "text-slate-900";

  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

function SkillBox({
  title,
  skills,
  emptyText,
  color,
}: {
  title: string;
  skills: string[];
  emptyText: string;
  color: "green" | "red";
}) {
  const classes =
    color === "green"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((skill: string) => (
            <span
              key={skill}
              className={`px-3 py-1 rounded-full text-sm ${classes}`}
            >
              {skill}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyText}</p>
        )}
      </div>
    </div>
  );
}