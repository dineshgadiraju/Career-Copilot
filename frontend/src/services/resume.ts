const API_URL = "http://localhost:8081";

export async function uploadResume(token: string, file: File) {
  const formData = new FormData();
  formData.append("resume", file);

  const res = await fetch(`${API_URL}/resume/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to upload resume");
  }

  return data;
}

export async function getLatestResume(token: string) {
  const res = await fetch(`${API_URL}/resume/latest`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}