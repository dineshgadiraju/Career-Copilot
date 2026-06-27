"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"
)
  .replace(/\/health\/?$/, "")
  .replace(/\/$/, "");

async function parseApiResponse(res: Response) {
  const rawText = await res.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      `Backend returned non-JSON response: ${rawText.slice(0, 220)}`
    );
  }
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [roleRecommendation, setRoleRecommendation] = useState<any>(null);
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
  const allJobs = [...jobs, ...liveJobs];

  const missingSkills = Array.from(
    new Set(allJobs.flatMap((job) => job.missing_skills || []))
  );

  async function register() {
    if (!email || !password) return alert("Enter email and password");

    setLoading("register");

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: email.split("@")[0],
          email,
          password,
        }),
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      alert("Account created successfully. Please login now.");
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Registration failed");
    }
  }

  async function login() {
    if (!email || !password) return alert("Enter email and password");

    setLoading("login");

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      setToken(data.token);
      alert("Logged in successfully");
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Login failed");
    }
  }

  async function loadDashboard(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("dashboard");

    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) return alert(data.error || "Failed to load dashboard");

      setDashboard(data);
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Failed to load dashboard");
    }
  }

  async function loadJobs(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("jobs");

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/recommended`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) return alert(data.error || "Failed to load jobs");

      setJobs(data.jobs || []);
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Failed to load jobs");
    }
  }

  async function fetchLiveJobs(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("fetchLiveJobs");

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/fetch-role-based`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) return alert(data.error || "Failed to fetch live jobs");

      alert(`Fetched ${data.count || 0} live jobs successfully`);
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Failed to fetch live jobs");
    }
  }

  async function loadLiveJobs(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("liveJobs");

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/live-recommended`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) return alert(data.error || "Failed to load live jobs");

      setLiveJobs(data.jobs || []);
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Failed to load live jobs");
    }
  }

  async function loadRoadmap(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("roadmap");

    try {
      const res = await fetch(`${API_BASE_URL}/roadmap`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) return alert(data.error || "Failed to load roadmap");

      setRoadmap(data);
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Failed to load roadmap");
    }
  }

  async function loadRoleRecommendation(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("roleRecommendation");

    try {
      const res = await fetch(`${API_BASE_URL}/role-recommendation`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await parseApiResponse(res);
      setLoading("");

      if (!res.ok) {
        return alert(data.error || "Failed to load role recommendation");
      }

      setRoleRecommendation(data);
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Failed to load role recommendation");
    }
  }

  async function uploadResume() {
    if (!token) return alert("Please login first");
    if (!file) return alert("Please select a resume PDF first");

    setLoading("upload");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setLoading("");
        return alert(data.error || "Resume upload failed");
      }

      setUploadResult(data);
      await loadDashboard(token);
      await loadJobs(token);
      await loadLiveJobs(token);
      await loadRoadmap(token);
      await loadRoleRecommendation(token);
      setLoading("");
    } catch (err: any) {
      setLoading("");
      alert(err.message || "Failed to analyze resume");
    }
  }

  async function sendMessage() {
    if (!token) return alert("Please login first");
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage;

    setChatHistory((prev) => [
      ...prev,
      { role: "user", message: userMessage },
    ]);

    setChatMessage("");
    setLoading("chat");

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await parseApiResponse(res);
      setLoading("");

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          message: res.ok ? data.reply : data.error || "Something went wrong.",
        },
      ]);
    } catch (err: any) {
      setLoading("");
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          message: err.message || "Something went wrong.",
        },
      ]);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 text-slate-950">
      <section className="relative overflow-hidden px-6 py-8">
        <div className="absolute left-[-140px] top-[-140px] h-[420px] w-[420px] rounded-full bg-sky-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-[420px] w-[420px] rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-100/80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-10 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950">
                AI Career Copilot
              </h1>
              <p className="text-sm text-slate-500">
                Resume intelligence • AI roadmap • USA job matching
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#upload"
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
              >
                Analyze Resume
              </a>
              <button
                onClick={() => setChatOpen(true)}
                className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-600"
              >
                Ask AI Coach
              </button>
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-8 shadow-xl shadow-slate-200/70 backdrop-blur">
              <p className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700">
                🚀 Full-stack AI career platform
              </p>

              <h2 className="mb-5 max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                Turn your resume into a smarter job-search engine.
              </h2>

              <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-600">
                Upload your resume, get instant skill analysis, discover missing
                skills, find USA-based job matches, and get a personalized AI
                roadmap for your next software role.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["AI resume scoring", "bg-sky-50 text-sky-700"],
                  ["USA job recommendations", "bg-emerald-50 text-emerald-700"],
                  ["F1 / OPT / sponsorship tags", "bg-violet-50 text-violet-700"],
                  ["Personalized career roadmap", "bg-orange-50 text-orange-700"],
                ].map(([item, classes]) => (
                  <div
                    key={item}
                    className={`rounded-2xl border border-slate-200 p-4 font-bold ${classes}`}
                  >
                    ✅ {item}
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/80">
              <h2 className="mb-2 text-2xl font-black text-slate-950">
                Get Started
              </h2>
              <p className="mb-5 text-sm text-slate-500">
                Create an account or login to analyze your resume.
              </p>

              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  placeholder="Email address"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />

                <input
                  type="password"
                  value={password}
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />

                <button
                  onClick={login}
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  {loading === "login" ? "Logging in..." : "Login"}
                </button>

                <button
                  onClick={register}
                  className="w-full rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 font-black text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-100"
                >
                  {loading === "register"
                    ? "Creating account..."
                    : "Create Account"}
                </button>

                {token && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    ✅ Logged in successfully. Upload your resume to start.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-4">
          <StatCard title="Resume Score" value={`${score}%`} subtitle="Overall strength" color="sky" />
          <StatCard title="Skills Found" value={skills.length} subtitle="Detected from resume" color="emerald" />
          <StatCard title="Total Jobs" value={allJobs.length} subtitle="Static + live matches" color="violet" />
          <StatCard title="Skill Gaps" value={missingSkills.length} subtitle="Skills to learn next" color="orange" />
        </div>

        <section
          id="upload"
          className="mt-8 rounded-[2rem] border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/70"
        >
          <h2 className="text-2xl font-black text-slate-950">
            Upload Resume
          </h2>
          <p className="mb-5 text-sm text-slate-500">
            Upload a PDF resume to generate your score, skills, roadmap, and job
            matches.
          </p>

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-[2rem] border-2 border-dashed p-10 text-center transition ${
              isDragActive
                ? "border-violet-400 bg-violet-50"
                : "border-violet-200 bg-violet-50/60 hover:border-violet-400 hover:bg-violet-50"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-xl font-black text-violet-700">
              📄 Drop your resume PDF here
            </p>
            <p className="mt-2 text-slate-500">or click to browse</p>

            {file && (
              <p className="mt-4 font-semibold text-emerald-700">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-4">
            <ActionButton onClick={uploadResume} active={loading === "upload"} tone="violet">
              {loading === "upload" ? "Analyzing..." : "Upload & Analyze"}
            </ActionButton>

            <ActionButton onClick={() => loadDashboard()} active={loading === "dashboard"} tone="sky">
              {loading === "dashboard" ? "Loading..." : "Load Dashboard"}
            </ActionButton>

            <ActionButton onClick={() => fetchLiveJobs()} active={loading === "fetchLiveJobs"} tone="pink">
              {loading === "fetchLiveJobs" ? "Fetching..." : "Fetch Live Jobs"}
            </ActionButton>

            <ActionButton onClick={() => loadLiveJobs()} active={loading === "liveJobs"} tone="emerald">
              {loading === "liveJobs" ? "Loading..." : "Load Live Matches"}
            </ActionButton>

            <ActionButton onClick={() => loadRoadmap()} active={loading === "roadmap"} tone="orange">
              {loading === "roadmap" ? "Loading..." : "Career Roadmap"}
            </ActionButton>

            <ActionButton onClick={() => loadRoleRecommendation()} active={loading === "roleRecommendation"} tone="sky">
              {loading === "roleRecommendation" ? "Loading..." : "Recommended Role"}
            </ActionButton>
          </div>
        </section>

        {(dashboard || uploadResult) && (
          <section className="mt-8 rounded-[2rem] border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100/70">
            <h2 className="mb-4 text-2xl font-black text-slate-950">
              Resume Intelligence
            </h2>

            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-slate-600">Resume Strength</span>
              <span className="text-3xl font-black text-sky-600">{score}%</span>
            </div>

            <div className="h-5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-500"
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <InfoBlock title="Latest Resume">
                {dashboard?.latest_file ||
                  uploadResult?.analysis?.filename ||
                  "No resume uploaded yet"}
              </InfoBlock>

              <InfoBlock title="Uploads">{dashboard?.uploads || 0}</InfoBlock>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-bold text-slate-700">
                Detected Skills
              </h3>
              <SkillCloud skills={skills} color="blue" />
            </div>
          </section>
        )}

        {roleRecommendation && (
          <section className="mt-8 rounded-[2rem] border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100/70">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-3 inline-flex rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700">
                  🎯 Resume-Based Role Match
                </p>
                <h2 className="text-3xl font-black text-slate-950">
                  {roleRecommendation.recommended_role}
                </h2>
                <p className="mt-3 max-w-3xl text-slate-600">
                  {roleRecommendation.reason}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4 text-center">
                <p className="text-sm font-bold text-sky-600">Best Fit</p>
                <p className="text-2xl font-black text-sky-700">High</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="mb-3 font-black text-emerald-700">
                  Current Strengths
                </h3>
                <SkillCloud
                  skills={roleRecommendation.current_skills || []}
                  color="blue"
                />
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <h3 className="mb-3 font-black text-orange-700">
                  Learn Next
                </h3>
                <SkillCloud
                  skills={roleRecommendation.next_skills || []}
                  color="yellow"
                />
              </div>
            </div>
          </section>
        )}

        {missingSkills.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-yellow-100 bg-white p-6 shadow-xl shadow-yellow-100/70">
            <h2 className="mb-3 text-2xl font-black text-slate-950">
              Skill Gap Analysis
            </h2>
            <p className="mb-4 text-slate-500">
              These skills appear in recommended jobs but are missing from your
              resume.
            </p>
            <SkillCloud skills={missingSkills} color="yellow" />
          </section>
        )}

        {roadmap && (
          <section className="mt-8 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-100/70">
            <h2 className="mb-4 text-2xl font-black text-slate-950">
              🚀 AI Career Roadmap
            </h2>

            <div className="mb-6 rounded-2xl bg-orange-50 p-4">
              <p className="text-sm font-semibold text-orange-600">Target Role</p>
              <p className="text-xl font-black text-orange-800">
                {roadmap.target_role}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-bold text-emerald-700">
                  Current Skills
                </h3>
                <SkillCloud skills={roadmap.current_skills || []} color="blue" />
              </div>

              <div>
                <h3 className="mb-3 font-bold text-yellow-700">
                  Missing Skills
                </h3>
                <SkillCloud skills={roadmap.missing_skills || []} color="yellow" />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-bold text-slate-700">
                90-Day Learning Plan
              </h3>

              <div className="space-y-3">
                {roadmap.roadmap?.map((item: string, index: number) => (
                  <div
                    key={index}
                    className="rounded-xl border border-orange-100 bg-orange-50/70 p-4 text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {liveJobs.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-pink-100 bg-white p-6 shadow-xl shadow-pink-100/70">
            <h2 className="mb-5 text-2xl font-black text-slate-950">
              Live USA Resume-Matched Jobs
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              {liveJobs.map((job) => (
                <JobCard key={job.id} job={job} variant="live" />
              ))}
            </div>
          </section>
        )}

        {jobs.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-100/70">
            <h2 className="mb-5 text-2xl font-black text-slate-950">
              Static Resume-Matched Jobs
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} variant="static" />
              ))}
            </div>
          </section>
        )}
      </section>

      <ChatWidget
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        chatHistory={chatHistory}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        sendMessage={sendMessage}
        loading={loading}
      />
    </main>
  );
}

function ActionButton({
  children,
  onClick,
  active,
  tone = "sky",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  tone?: "sky" | "emerald" | "violet" | "orange" | "pink";
}) {
  const tones = {
    sky: "bg-sky-500 hover:bg-sky-600 shadow-sky-100",
    emerald: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100",
    violet: "bg-violet-500 hover:bg-violet-600 shadow-violet-100",
    orange: "bg-orange-500 hover:bg-orange-600 shadow-orange-100",
    pink: "bg-pink-500 hover:bg-pink-600 shadow-pink-100",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 ${
        active ? "bg-slate-950" : tones[tone]
      }`}
    >
      {children}
    </button>
  );
}

function JobCard({ job, variant }: { job: any; variant: "live" | "static" }) {
  const badgeClass =
    variant === "live"
      ? "bg-pink-50 text-pink-700 border-pink-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-950">{job.title}</h3>
          <p className="font-semibold text-slate-600">{job.company}</p>

          {job.location && (
            <p className="text-sm text-slate-500">{job.location}</p>
          )}

          {job.source && (
            <p className="mt-1 text-xs text-slate-400">Source: {job.source}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {job.usa_only && <Badge tone="sky">🇺🇸 USA</Badge>}
            {job.visa_sponsorship && <Badge tone="emerald">💼 Sponsorship</Badge>}
            {job.opt_friendly && <Badge tone="violet">🎓 OPT</Badge>}
            {job.stem_opt_friendly && <Badge tone="pink">🚀 STEM OPT</Badge>}
          </div>
        </div>

        <span className={`rounded-full border px-3 py-1 text-sm font-black ${badgeClass}`}>
          {job.match_score}%
        </span>
      </div>

      <p className="mb-2 text-sm text-slate-700">
        <strong>Matched:</strong> {job.matched_skills?.join(", ") || "None"}
      </p>

      <p className="mb-4 text-sm text-slate-500">
        <strong>Missing:</strong> {job.missing_skills?.join(", ") || "None"}
      </p>

      {job.apply_url && (
        <a
          href={job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-slate-950 px-4 py-2 font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Apply Now →
        </a>
      )}
    </div>
  );
}

function Badge({
  children,
  tone = "sky",
}: {
  children: React.ReactNode;
  tone?: "sky" | "emerald" | "violet" | "orange" | "pink";
}) {
  const tones = {
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    pink: "bg-pink-50 text-pink-700 border-pink-100",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ChatWidget({
  chatOpen,
  setChatOpen,
  chatHistory,
  chatMessage,
  setChatMessage,
  sendMessage,
  loading,
}: {
  chatOpen: boolean;
  setChatOpen: (value: boolean) => void;
  chatHistory: { role: string; message: string }[];
  chatMessage: string;
  setChatMessage: (value: string) => void;
  sendMessage: () => void;
  loading: string;
}) {
  return (
    <>
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-violet-500 text-3xl shadow-2xl shadow-sky-200 transition hover:scale-105"
        aria-label="Open AI Career Coach"
      >
        🤖
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[92vw] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-sky-50 p-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                AI Career Coach
              </h2>
              <p className="text-xs text-slate-500">
                Ask about resumes, jobs, skills, and interviews
              </p>
            </div>

            <button
              onClick={() => setChatOpen(false)}
              className="rounded-full px-3 py-1 text-slate-500 hover:bg-white hover:text-slate-950"
              aria-label="Close AI Career Coach"
            >
              ✕
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4">
            {chatHistory.length === 0 ? (
              <div className="space-y-3 text-sm text-slate-500">
                <p className="font-semibold text-slate-700">Try asking:</p>

                <button
                  onClick={() =>
                    setChatMessage(
                      "What should I learn next based on my resume?"
                    )
                  }
                  className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-slate-700 hover:bg-sky-50"
                >
                  What should I learn next?
                </button>

                <button
                  onClick={() => setChatMessage("Which live jobs fit me best?")}
                  className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-slate-700 hover:bg-sky-50"
                >
                  Which live jobs fit me best?
                </button>

                <button
                  onClick={() =>
                    setChatMessage(
                      "How can I improve my resume for backend roles?"
                    )
                  }
                  className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-slate-700 hover:bg-sky-50"
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
                    className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-6 ${
                      msg.role === "user"
                        ? "bg-sky-500 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            )}

            {loading === "chat" && (
              <p className="text-sm font-semibold text-violet-600">
                Coach is typing...
              </p>
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-200 p-4">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask your AI Career Coach..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />

            <button
              onClick={sendMessage}
              className="rounded-xl bg-violet-500 px-4 py-3 font-bold text-white hover:bg-violet-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: "sky" | "emerald" | "violet" | "orange";
}) {
  const colors = {
    sky: "from-sky-50 to-white text-sky-600 border-sky-100",
    emerald: "from-emerald-50 to-white text-emerald-600 border-emerald-100",
    violet: "from-violet-50 to-white text-violet-600 border-violet-100",
    orange: "from-orange-50 to-white text-orange-600 border-orange-100",
  };

  return (
    <div
      className={`rounded-[2rem] border bg-gradient-to-br p-5 shadow-lg shadow-slate-100 transition hover:-translate-y-1 ${colors[color]}`}
    >
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 break-words font-bold text-slate-800">{children}</p>
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
      ? "bg-sky-50 text-sky-700 border-sky-100"
      : "bg-yellow-50 text-yellow-700 border-yellow-100";

  if (!skills || skills.length === 0) {
    return <p className="text-sm text-slate-500">No skills found yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`rounded-full border px-3 py-1 text-sm font-bold ${classes}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}
