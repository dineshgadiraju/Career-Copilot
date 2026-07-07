const API_URL = "http://localhost:8081";

export async function getDashboard(token: string) {
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}