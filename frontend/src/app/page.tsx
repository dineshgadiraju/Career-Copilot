"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any>(null);
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

    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) {
      alert(data.error || "Registration failed");
      return;
    }

    alert("Account created successfully. Please login now.");
  }

  async function login() {
    if (!email || !password) return alert("Enter email and password");

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
    if (!currentToken) return alert("Please login first");

    setLoading("dashboard");

    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) return alert(data.error || "Failed to load dashboard");

    setDashboard(data);
  }

  async function loadJobs(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("jobs");

    const res = await fetch(`${API_BASE_URL}/jobs/recommended`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) return alert(data.error || "Failed to load jobs");

    setJobs(data.jobs || []);
  }

  async function fetchLiveJobs(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("fetchLiveJobs");

    const res = await fetch(`${API_BASE_URL}/jobs/fetch-live`, {
      method: "POST",
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) return alert(data.error || "Failed to fetch live jobs");

    alert(`Fetched ${data.count || 0} live jobs successfully`);
  }

  async function loadLiveJobs(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("liveJobs");

    const res = await fetch(`${API_BASE_URL}/jobs/live-recommended`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) return alert(data.error || "Failed to load live jobs");

    setLiveJobs(data.jobs || []);
  }

  async function loadRoadmap(currentToken = token) {
    if (!currentToken) return alert("Please login first");

    setLoading("roadmap");

    const res = await fetch(`${API_BASE_URL}/roadmap`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    const data = await res.json();
    setLoading("");

    if (!res.ok) return alert(data.error || "Failed to load roadmap");

    setRoadmap(data);
  }

  async function uploadResume() {
    if (!token) return alert("Please login first");
    if (!file) return alert("Please select a resume PDF first");

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
      return alert(data.error || "Resume upload failed");
    }

    setUploadResult(data);
    await loadDashboard(token);
    await loadJobs(token);
    await loadLiveJobs(token);
    await loadRoadmap(token);
    setLoading("");
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
    <main className="min-h-screen bg-[#030712] text-white">
      <section className="relative overflow-hidden px-6 py-8">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
            <div>
              <h1 className="text-2xl font-black">AI Career Copilot</h1>
              <p className="text-xs text-slate-400">
                Resume intelligence • AI roadmap • USA job matching
              </p>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="rounded-full bg-cyan-400 px-5 py-2 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-300"
            >
              Ask AI Coach
            </button>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur">
              <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                🚀 Full-stack AI career platform
              </p>

              <h2 className="mb-5 max-w-3xl text-5xl font-black leading-tight md:text-6xl">
                Turn your resume into a smarter job-search engine.
              </h2>

              <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-300">
                Upload your resume, get instant skill analysis, discover missing
                skills, find USA-based job matches, and get a personalized AI
                roadmap for your next software role.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "AI resume scoring",
                  "USA job recommendations",
                  "F1 / OPT / sponsorship tags",
                  "Personalized career roadmap",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-semibold text-slate-200"
                  >
                    ✅ {item}
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 shadow-2xl">
              <h2 className="mb-2 text-2xl font-black text-cyan-300">
                Get Started
              </h2>
              <p className="mb-5 text-sm text-slate-400">
                Create an account or login to analyze your resume.
              </p>

              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  placeholder="Email address"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-cyan-400"
                />

                <input
                  type="password"
                  value={password}
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 px-4 py-3 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-cyan-400"
                />

                <button
                  onClick={login}
                  className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
                >
                  {loading === "login" ? "Logging in..." : "Login"}
                </button>

                <button
                  onClick={register}
                  className="w-full rounded-xl border border-cyan-400 px-5 py-3 font-black text-cyan-300 hover:bg-cyan-400 hover:text-slate-950"
                >
                  {loading === "register"
                    ? "Creating account..."
                    : "Create Account"}
                </button>

                {token && (
                  <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
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
          <StatCard title="Resume Score" value={`${score}%`} subtitle="Overall strength" />
          <StatCard title="Skills Found" value={skills.length} subtitle="Detected from resume" />
          <StatCard title="Total Jobs" value={allJobs.length} subtitle="Static + live matches" />
          <StatCard title="Skill Gaps" value={missingSkills.length} subtitle="Skills to learn next" />
        </div>

        <section className="mt-8 rounded-[2rem] border border-purple-500/20 bg-slate-900/80 p-6 shadow-xl">
          <h2 className="text-2xl font-black text-purple-300">
            Upload Resume
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            Upload a PDF resume to generate your score, skills, roadmap, and job
            matches.
          </p>

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-[2rem] border-2 border-dashed p-10 text-center transition ${
              isDragActive
                ? "border-purple-300 bg-purple-500/20"
                : "border-purple-400/50 bg-slate-950/60 hover:border-purple-300"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-xl font-black text-purple-200">
              📄 Drop your resume PDF here
            </p>
            <p className="mt-2 text-slate-400">or click to browse</p>

            {file && (
              <p className="mt-4 text-emerald-300">Selected: {file.name}</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-4">
            <ActionButton onClick={uploadResume} active={loading === "upload"}>
              {loading === "upload" ? "Analyzing..." : "Upload & Analyze"}
            </ActionButton>

            <ActionButton onClick={() => loadDashboard()} active={loading === "dashboard"}>
              {loading === "dashboard" ? "Loading..." : "Load Dashboard"}
            </ActionButton>

            <ActionButton onClick={() => fetchLiveJobs()} active={loading === "fetchLiveJobs"}>
              {loading === "fetchLiveJobs" ? "Fetching..." : "Fetch Live Jobs"}
            </ActionButton>

            <ActionButton onClick={() => loadLiveJobs()} active={loading === "liveJobs"}>
              {loading === "liveJobs" ? "Loading..." : "Load Live Matches"}
            </ActionButton>

            <ActionButton onClick={() => loadRoadmap()} active={loading === "roadmap"}>
              {loading === "roadmap" ? "Loading..." : "Career Roadmap"}
            </ActionButton>
          </div>
        </section>

        {(dashboard || uploadResult) && (
          <section className="mt-8 rounded-[2rem] border border-cyan-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-black text-cyan-300">
              Resume Intelligence
            </h2>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-slate-300">Resume Strength</span>
              <span className="text-3xl font-black text-cyan-300">{score}%</span>
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

              <InfoBlock title="Uploads">{dashboard?.uploads || 0}</InfoBlock>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-bold text-blue-300">
                Detected Skills
              </h3>
              <SkillCloud skills={skills} color="blue" />
            </div>
          </section>
        )}

        {missingSkills.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-yellow-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-3 text-2xl font-black text-yellow-300">
              Skill Gap Analysis
            </h2>
            <p className="mb-4 text-slate-400">
              These skills appear in recommended jobs but are missing from your
              resume.
            </p>
            <SkillCloud skills={missingSkills} color="yellow" />
          </section>
        )}

        {roadmap && (
          <section className="mt-8 rounded-[2rem] border border-orange-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-black text-orange-300">
              🚀 AI Career Roadmap
            </h2>

            <div className="mb-6">
              <p className="text-sm text-slate-400">Target Role</p>
              <p className="text-xl font-black text-orange-200">
                {roadmap.target_role}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-bold text-green-300">
                  Current Skills
                </h3>
                <SkillCloud skills={roadmap.current_skills || []} color="blue" />
              </div>

              <div>
                <h3 className="mb-3 font-bold text-yellow-300">
                  Missing Skills
                </h3>
                <SkillCloud skills={roadmap.missing_skills || []} color="yellow" />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-bold text-cyan-300">
                90-Day Learning Plan
              </h3>

              <div className="space-y-3">
                {roadmap.roadmap?.map((item: string, index: number) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {liveJobs.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-pink-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-black text-pink-300">
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
          <section className="mt-8 rounded-[2rem] border border-emerald-500/20 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-black text-emerald-300">
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-3 font-bold transition ${
        active
          ? "bg-white text-slate-950"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function JobCard({ job, variant }: { job: any; variant: "live" | "static" }) {
  const badgeClass =
    variant === "live"
      ? "bg-pink-400/10 text-pink-300"
      : "bg-emerald-400/10 text-emerald-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black">{job.title}</h3>
          <p className="text-slate-400">{job.company}</p>

          {job.location && (
            <p className="text-sm text-slate-500">{job.location}</p>
          )}

          {job.source && (
            <p className="mt-1 text-xs text-slate-500">Source: {job.source}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {job.usa_only && <Badge>🇺🇸 USA</Badge>}
            {job.visa_sponsorship && <Badge>💼 Sponsorship</Badge>}
            {job.opt_friendly && <Badge>🎓 OPT</Badge>}
            {job.stem_opt_friendly && <Badge>🚀 STEM OPT</Badge>}
          </div>
        </div>

        <span className={`rounded-full px-3 py-1 text-sm font-black ${badgeClass}`}>
          {job.match_score}%
        </span>
      </div>

      <p className="mb-2 text-sm text-slate-300">
        <strong>Matched:</strong> {job.matched_skills?.join(", ") || "None"}
      </p>

      <p className="mb-4 text-sm text-slate-400">
        <strong>Missing:</strong> {job.missing_skills?.join(", ") || "None"}
      </p>

      {job.apply_url && (
        <a
          href={job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-300"
        >
          Apply Now →
        </a>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
      {children}
    </span>
  );
}