"use client";

import { useState } from "react";

type Props = {
  token: string;
  apiBaseUrl: string;
};

export default function ResumeTailorCard({
  token,
  apiBaseUrl,
}: Props) {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function tailorResume() {
    if (!token) {
      alert("Please login first.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Paste a job description.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/resume/tailor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_description: jobDescription,
        }),
      });

      const data = await res.json();

      setLoading(false);

      if (!res.ok) {
        alert(data.error);
        return;
      }

      setResult(data);
    } catch (err) {
      setLoading(false);
      alert("Something went wrong.");
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-xl">

      <h2 className="text-2xl font-black mb-2">
        ✨ AI Resume Tailoring
      </h2>

      <p className="text-slate-500 mb-5">
        Paste any job description and compare it with your resume.
      </p>

      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={10}
        placeholder="Paste Job Description..."
        className="w-full rounded-xl border p-4"
      />

      <button
        onClick={tailorResume}
        className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 text-white font-bold"
      >
        {loading ? "Analyzing..." : "Analyze Job"}
      </button>

      {result && (
        <div className="mt-8">

          <div className="mb-6 rounded-xl bg-indigo-50 p-5">

            <h3 className="text-lg font-bold">
              ATS Match Score
            </h3>

            <p className="text-5xl font-black text-indigo-700 mt-2">
              {result.ats_score}%
            </p>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div>

              <h3 className="font-bold text-green-700 mb-3">
                ✅ Matched Skills
              </h3>

              <div className="flex flex-wrap gap-2">
                {result.matched_skills?.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full bg-green-100 px-3 py-1"
                  >
                    {skill}
                  </span>
                ))}
              </div>

            </div>

            <div>

              <h3 className="font-bold text-red-700 mb-3">
                ❌ Missing Skills
              </h3>

              <div className="flex flex-wrap gap-2">
                {result.missing_skills?.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full bg-red-100 px-3 py-1"
                  >
                    {skill}
                  </span>
                ))}
              </div>

            </div>

          </div>

          <div className="mt-8">

            <h3 className="font-bold mb-3">
              AI Suggestions
            </h3>

            <ul className="space-y-2">
              {result.suggestions?.map((item: string, index: number) => (
                <li
                  key={index}
                  className="rounded-lg bg-slate-50 p-3"
                >
                  • {item}
                </li>
              ))}
            </ul>

          </div>

        </div>
      )}

    </section>
  );
}