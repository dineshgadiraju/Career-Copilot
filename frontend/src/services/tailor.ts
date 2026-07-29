const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function tailorResume(token: string, jobDescription: string) {
  const res = await fetch(`${API_URL}/resume/tailor`, {
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

  if (!res.ok) {
    throw new Error(data.error || "Failed to tailor resume");
  }

  return data;
}

export async function saveTailorResult(token: string, result: any) {
  const res = await fetch(`${API_URL}/resume/tailor/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      job_title: result.jobTitle,
      company: result.company,
      ats_score: result.ats_score,
      matched_skills: result.matched_skills || [],
      missing_skills: result.missing_skills || [],
      ai_feedback: result.ai_feedback,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to save tailoring result");
  }

  return data;
}

export async function getTailorHistory(token: string) {
  const res = await fetch(`${API_URL}/resume/tailor/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  console.log("Tailor history API:", data);
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch tailor history");
  }

  return data.history || [];
}