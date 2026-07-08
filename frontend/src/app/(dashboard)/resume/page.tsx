"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestResume, uploadResume } from "@/services/resume";

export default function ResumePage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function loadResume() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const data = await getLatestResume(token);
    setResume(data);
  }

  useEffect(() => {
    loadResume();
  }, []);

  async function handleUpload() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!file) {
      alert("Please select a resume PDF");
      return;
    }

    setLoading(true);

    try {
      await uploadResume(token, file);
      alert("Resume uploaded successfully");
      setFile(null);
      await loadResume();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Resume</h1>
        <p className="text-sm text-slate-500 mb-8">
          Upload your resume and analyze skills, ATS score, and job readiness.
        </p>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload Resume</h2>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4 block w-full text-sm"
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload Resume"}
          </button>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Latest Resume</h2>

          {!resume ? (
            <p className="text-sm text-slate-500">No resume uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              <p>
                <span className="font-medium">File:</span> {resume.filename}
              </p>

              <p>
                <span className="font-medium">ATS Score:</span>{" "}
                {resume.score}%
              </p>

              <div>
                <p className="font-medium mb-2">Detected Skills</p>

                <div className="flex flex-wrap gap-2">
                  {resume.skills?.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}