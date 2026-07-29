const API_URL = process.env.NEXT_PUBLIC_API_URL!;
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