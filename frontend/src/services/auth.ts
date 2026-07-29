const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function login(email: string, password: string) {
  console.log("API_URL:", API_URL);

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Login failed");
  }

  return res.json();
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Registration failed");
  }

  return res.json();
}