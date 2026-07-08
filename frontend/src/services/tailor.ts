const API_URL = "http://localhost:8081";

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