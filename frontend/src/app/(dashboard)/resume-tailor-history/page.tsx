"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTailorHistory } from "@/services/tailor";

export default function ResumeTailorHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
    console.log("Resume Tailor History Page Loaded");
  useEffect(() => {
    async function loadHistory() {
        console.log("Calling getTailorHistory...");
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
         const data = await getTailorHistory(token);
            console.log("Tailor History:", data);
            setHistory(Array.isArray(data) ? data : data.history || []);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [router]);

  if (loading) {
    return <main className="p-8">Loading tailor history...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold">Resume Tailoring History</h1>
        <p className="text-slate-500 mt-2 mb-8">
          Saved AI resume tailoring results.
        </p>

        {history.length === 0 ? (
          <div className="bg-white border rounded-2xl p-8">
            No saved tailoring results yet.
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white border rounded-2xl p-6 shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{item.job_title}</h2>
                    <p className="text-slate-500">{item.company}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">
                      {item.ats_score}%
                    </p>
                    <p className="text-xs text-slate-500">ATS Score</p>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="font-semibold mb-2">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.missing_skills?.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="font-semibold mb-2">AI Feedback</h3>
                  <pre className="whitespace-pre-wrap bg-slate-50 rounded-xl p-4 text-sm">
                    {item.ai_feedback}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}