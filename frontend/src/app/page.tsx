"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function Home() {
  const [email, setEmail] = useState("dinesh-prod@test.com");
  const [password, setPassword] = useState("password123");
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [loading, setLoading] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; message: string }[]
  >([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    onDrop: (acceptedFiles) => setFile(acceptedFiles[0]),
  });

  const score = dashboard?.resume_score || uploadResult?.analysis?.score || 0;
  const skills = dashboard?.skills || uploadResult?.analysis?.skills || [];
  const missingSkills = Array.from(
    new Set(jobs.flatMap((job) => job.missing_skills || []))
  );

  async function login() {
    setLoading("login");

    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    setToken(data.token);
    alert("Logged in successfully");
  }

  async function loadDashboard(currentToken = token) {
    if (!currentToken) {
      alert("Please login first");
      return;
    }

    setLoading("dashboard");

    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) {
      alert(data.error || "Failed to load dashboard");
      return;
    }

    setDashboard(data);
  }

  async function loadJobs(currentToken = token) {
    if (!currentToken) {
      alert("Please login first");
      return;
    }

    setLoading("jobs");

    const res = await fetch(`${API_BASE_URL}/jobs/recommended`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) {
      alert(data.error || "Failed to load jobs");
      return;
    }

    setJobs(data.jobs || []);
  }

  async function uploadResume() {
    if (!token) {
      alert("Please login first");
      return;
    }

    if (!file) {
      alert("Please select a resume PDF first");
      return;
    }

    setLoading("upload");

    const formData = new FormData();
    formData.append("resume", file);

    const res = await fetch(`${API_BASE_URL}/resume/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading("");
      alert(data.error || "Resume upload failed");
      return;
    }

    setUploadResult(data);
    await loadDashboard(token);
    await loadJobs(token);
    setLoading("");
  }

  async function sendMessage() {
    if (!token) {
      alert("Please login first");
      return;
    }

    if (!chatMessage.trim()) return;

    const userMessage = chatMessage;

    setChatHistory((prev) => [
      ...prev,
      { role: "user", message: userMessage },
    ]);

    setChatMessage("");
    setLoading("chat");

    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();
    setLoading("");

    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        message: res.ok ? data.reply : data.error || "Something went wrong.",
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden px-6 py-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="mx-auto max-w-7xl relative">
          <nav className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
            <div>
              <h1 className="text-xl font-bold">AI Career Copilot</h1>
              <p className="text-xs text-slate-400">
                Resume intelligence + job matching
              </p>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="rounded-full bg-cyan-400 px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Ask AI Coach
            </button>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
              <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                Built for software job seekers
              </p>

              <h2 className="mb-5 text-5xl font-extrabold leading-tight">
                Land better tech jobs with an AI-powered career assistant.
              </h2>

              <p className="mb-8 text-lg text-slate-300">
                Upload your resume, get a resume score, discover missing skills,
                match with jobs, and chat with your AI Career Coach.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Resume scoring",
                  "Skill extraction",
                  "Job matching",
                  "AI career coaching",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200"
                  >
                    ✅ {item}
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
              <h2 className="mb-4 text-2xl font-bold text-cyan-300">
                Login
              </h2>

              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
                />

                <input
                  type="password"
                  value={password}
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
                />

                <button
                  onClick={login}
                  className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300"
                >
                  {loading === "login" ? "Logging in..." : "Login"}
                </button>

                {token && (
                  <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    Logged in successfully. Upload your resume to generate your
                    dashboard.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-4">
          <StatCard title="Resume Score" value={`${score}%`} subtitle="Overall strength" />
          <StatCard title="Skills Found" value={skills.length} subtitle="Detected from resume" />
          <StatCard title="Job Matches" value={jobs.length} subtitle="Recommended roles" />
          <StatCard
            title="Skill Gaps"
            value={missingSkills.length}
            subtitle="Skills to learn next"
          />
        </div>

        <section className="mt-8 rounded-3xl border border-purple-500/20 bg-slate-900/80 p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-purple-300">
                Upload Resume
              </h2>
              <p className="text-sm text-slate-400">
                Upload a PDF resume to get score, skills, jobs, and AI advice.
              </p>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition ${
              isDragActive
                ? "border-purple-300 bg-purple-500/20"
                : "border-purple-400/50 bg-slate-950/60 hover:border-purple-300"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-xl font-bold text-purple-200">
              📄 Drag & drop your resume PDF here
            </p>
            <p className="mt-2 text-slate-400">or click to browse</p>

            {file && (
              <p className="mt-4 text-emerald-300">Selected: {file.name}</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-4">
            <button
              onClick={uploadResume}
              className="rounded-xl bg-purple-500 px-5 py-3 font-semibold hover:bg-purple-400"
            >
              {loading === "upload" ? "Analyzing..." : "Upload & Analyze"}
            </button>

            <button
              onClick={() => loadDashboard()}
              className="rounded-xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400"
            >
              {loading === "dashboard" ? "Loading..." : "Load Dashboard"}
            </button>

            <button
              onClick={() => loadJobs()}
              className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold hover:bg-emerald-400"
            >
              {loading === "jobs" ? "Loading..." : "Load Jobs"}
            </button>
          </div>
        </section>

        {(dashboard || uploadResult) && (
          <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-cyan-300">
              Resume Intelligence
            </h2>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-slate-300">Resume Strength</span>
              <span className="text-3xl font-bold text-cyan-300">{score}%</span>
            </div>

            <div className="h-5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400"
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <InfoBlock title="Latest Resume">
                {dashboard?.latest_file ||
                  uploadResult?.analysis?.filename ||
                  "No resume uploaded yet"}
              </InfoBlock>

              <InfoBlock title="Uploads">
                {dashboard?.uploads || 0}
              </InfoBlock>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-semibold text-blue-300">
                Detected Skills
              </h3>
              <SkillCloud skills={skills} color="blue" />
            </div>
          </section>
        )}

        {missingSkills.length > 0 && (
          <section className="mt-8 rounded-3xl border border-yellow-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-3 text-2xl font-bold text-yellow-300">
              Skill Gap Analysis
            </h2>
            <p className="mb-4 text-slate-400">
              These skills appear in matched jobs but are missing from your
              resume.
            </p>
            <SkillCloud skills={missingSkills} color="yellow" />
          </section>
        )}

        {jobs.length > 0 && (
          <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold text-emerald-300">
              Recommended Jobs
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:-translate-y-1 hover:border-emerald-400/40"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <p className="text-slate-400">{job.company}</p>
                    </div>

                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">
                      {job.match_score}%
                    </span>
                  </div>

                  <p className="mb-2 text-sm text-slate-300">
                    <strong>Matched:</strong>{" "}
                    {job.matched_skills?.join(", ") || "None"}
                  </p>

                  <p className="mb-4 text-sm text-slate-400">
                    <strong>Missing:</strong>{" "}
                    {job.missing_skills?.join(", ") || "None"}
                  </p>

                  <div>
                    <p className="mb-2 font-semibold text-yellow-300">
                      Learning Recommendations
                    </p>
                    <SkillCloud
                      skills={job.learning_recommendations || []}
                      color="yellow"
                    />
                  </div>
                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
                    >
                      Apply Now →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-3xl shadow-2xl hover:bg-pink-400"
      >
        🤖
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[92vw] rounded-3xl border border-pink-500/30 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div>
              <h2 className="text-lg font-bold text-pink-300">
                AI Career Coach
              </h2>
              <p className="text-xs text-slate-400">
                Ask about resumes, jobs, or interviews
              </p>
            </div>

            <button
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4">
            {chatHistory.length === 0 ? (
              <div className="space-y-3 text-sm text-slate-400">
                <p>Try asking:</p>
                <button
                  onClick={() =>
                    setChatMessage("What should I learn next based on my resume?")
                  }
                  className="block rounded-xl bg-slate-800 px-3 py-2 text-left hover:bg-slate-700"
                >
                  What should I learn next?
                </button>
                <button
                  onClick={() =>
                    setChatMessage("How can I improve my resume?")
                  }
                  className="block rounded-xl bg-slate-800 px-3 py-2 text-left hover:bg-slate-700"
                >
                  How can I improve my resume?
                </button>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            )}

            {loading === "chat" && (
              <p className="text-sm text-pink-300">Coach is typing...</p>
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-800 p-4">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask your AI Career Coach..."
              className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-white outline-none"
            />

            <button
              onClick={sendMessage}
              className="rounded-xl bg-pink-500 px-4 py-3 font-semibold hover:bg-pink-400"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 break-words font-semibold">{children}</p>
    </div>
  );
}

function SkillCloud({
  skills,
  color,
}: {
  skills: string[];
  color: "blue" | "yellow";
}) {
  const classes =
    color === "blue"
      ? "bg-blue-500/15 text-blue-200"
      : "bg-yellow-500/15 text-yellow-200";

  if (!skills || skills.length === 0) {
    return <p className="text-sm text-slate-500">No skills found yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill} className={`rounded-full px-3 py-1 text-sm ${classes}`}>
          {skill}
        </span>
      ))}
    </div>
  );
}