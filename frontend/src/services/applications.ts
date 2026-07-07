const API_URL = "http://localhost:8081";

export async function getApplications(token: string) {
  const res = await fetch(`${API_URL}/applications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

export async function createApplication(token: string, application: any) {
  const res = await fetch(`${API_URL}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      company: application.company,
      position: application.position,
      status: application.status,
      job_url: application.job_url,
      jobUrl: application.job_url,
    }),
  });

  const data = await res.json();
  console.log("Create Application API Response:", data);

  if (!res.ok) throw new Error(data.error || "Failed to create application");
  return data;
}

export async function deleteApplication(token: string, id: number) {
  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to delete application");
}