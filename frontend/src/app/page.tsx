"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

const API_BASE_URL = "https://ai-career-copilot-backend-yzm9.onrender.com";

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
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
  });

  async function login() {
    setLoading("login");

    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
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
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

    if (!res.ok) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", message: data.error || "Something went wrong." },
      ]);
      return;
    }

    setChatHistory((prev) => [
      ...prev,
      { role: "assistant", message: data.reply },
    ]);
  }

  const score = dashboard?.resume_score || uploadResult?.analysis?.score || 0;

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 p-8 shadow-2xl">
          <h1 className="mb-3 text-5xl font-bold">AI Career Copilot</h1>
          <p className="text-lg text-white/90">
            Resume analysis, skill detection, job recommendations, and AI career
            coaching.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-cyan-300">Login</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
            />

            <input
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl bg-slate-800 px-4 py-3 text-white outline-none ring-1 ring-slate-700 focus:ring-cyan-400"
            />

            <button
              onClick={login}
              className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              {loading === "login" ? "Logging in..." : "Login"}
            </button>
          </div>

          {token && (
            <p className="mt-4 text-sm text-emerald-300">
              Logged in successfully. You can now upload resumes, view
              recommendations, and chat with your AI Career Coach.
            </p>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-purple-500/30 bg-slate-900 p-6 shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-purple-300">
            Resume Upload
          </h2>

          <div
            {...getRootProps()}
            className={`mb-5 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              isDragActive
                ? "border-purple-300 bg-purple-500/20"
                : "border-purple-400/60 bg-slate-800 hover:border-purple-300"
            }`}
          >
            <input {...getInputProps()} />

            <p className="text-lg font-semibold text-purple-200">
              📄 Drag & drop your resume PDF here
            </p>

            <p className="mt-2 text-sm text-slate-400">or click to browse</p>

            {file && (
              <p className="mt-4 text-sm text-emerald-300">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={uploadResume}
              className="rounded-xl bg-purple-500 px-5 py-3 font-semibold hover:bg-purple-400"
            >
              {loading === "upload" ? "Uploading..." : "Upload Resume"}
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
          <section className="mb-8 rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-cyan-300">
              Resume Score
            </h2>

            <div className="mb-2 flex items-center justify-between">
              <span className="text-slate-300">Overall Resume Strength</span>
              <span className="text-2xl font-bold text-cyan-300">{score}%</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400"
                style={{ width: `${score}%` }}
              />
            </div>
          </section>
        )}

        {uploadResult && (
          <section className="mb-8 rounded-2xl border border-purple-500/30 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-purple-300">
              Resume Upload Result
            </h2>

            <p>
              <strong>Message:</strong> {uploadResult.message}
            </p>

            <p>
              <strong>File:</strong> {uploadResult.analysis?.filename}
            </p>

            <p>
              <strong>Text Length:</strong> {uploadResult.analysis?.text_length}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {uploadResult.analysis?.skills?.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-full bg-purple-500/20 px-4 py-2 text-purple-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {dashboard && (
          <section className="mb-8 rounded-2xl border border-blue-500/30 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-blue-300">
              Dashboard
            </h2>

            <p>
              <strong>User:</strong> {dashboard.user}
            </p>

            <p>
              <strong>Latest Resume:</strong> {dashboard.latest_file}
            </p>

            <p>
              <strong>Uploads:</strong> {dashboard.uploads}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {dashboard.skills?.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-full bg-blue-500/20 px-4 py-2 text-blue-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {jobs.length > 0 && (
          <section className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold text-emerald-300">
              Recommended Jobs
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                >
                  <h3 className="text-xl font-bold">{job.title}</h3>

                  <p className="text-slate-400">{job.company}</p>

                  <p className="mt-3 text-emerald-300">
                    <strong>Match Score:</strong> {job.match_score}%
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    <strong>Matched:</strong>{" "}
                    {job.matched_skills?.join(", ") || "None"}
                  </p>

                  <p className="text-sm text-slate-400">
                    <strong>Missing:</strong>{" "}
                    {job.missing_skills?.join(", ") || "None"}
                  </p>

                  <div className="mt-3">
                    <p className="font-semibold text-yellow-300">
                      Learning Recommendations
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.learning_recommendations?.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-full bg-yellow-500/20 px-3 py-1 text-yellow-200"
                        >
                          📚 {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-3xl shadow-2xl hover:bg-pink-400"
      >
        🤖
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] rounded-2xl border border-pink-500/30 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 p-4">
            <h2 className="text-lg font-bold text-pink-300">
              AI Career Coach
            </h2>

            <button
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4">
            {chatHistory.length === 0 ? (
              <p className="text-slate-400">
                Ask me about resumes, interviews, jobs, or skills.
              </p>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] rounded-xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-700 text-white"
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

          <div className="flex gap-2 border-t border-slate-700 p-4">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
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