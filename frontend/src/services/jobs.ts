const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function getRecommendedJobs(token: string) {
  const res = await fetch(`${API_URL}/jobs/recommended`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch recommended jobs");
  }

  return data;
}