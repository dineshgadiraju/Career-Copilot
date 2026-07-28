const API_URL = "http://localhost:8081";
export async function getDashboard(token: string) {
  console.log("Dashboard Token:", token);

  const res = await fetch(`${API_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Status:", res.status);

  if (!res.ok) {
    console.log(await res.text());
    throw new Error("Failed to fetch dashboard");
  }

  return res.json();
}