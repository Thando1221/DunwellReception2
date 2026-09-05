import { API_BASE } from "./config";

function getToken(): string | null {
  const token = localStorage.getItem("token");
  if (token) return token;

  const auth = localStorage.getItem("dunwell_auth");
  if (!auth) return null;
  try {
    const parsed = JSON.parse(auth);
    return parsed.token || null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    console.warn(`[api] Authorization needed for ${endpoint} (${res.status})`);
    // Do not abruptly wipe session if offline or in guest mode, throw clear error
    throw new Error("Unauthorized or session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || err.message || "Request failed");
  }

  return res.json();
}

export const api = async (endpoint: string, method = "GET", body: any = null, token: string | null = null) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const effectiveToken = token || getToken();
  if (effectiveToken) headers.Authorization = `Bearer ${effectiveToken}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "API request failed");
  return data;
};

export async function login(username: string, password: string) {
  const data = await apiFetch<{ token: string; user: { id: number; name: string; surname: string; role: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("dunwell_auth", JSON.stringify({ token: data.token, user: data.user, loggedIn: true }));
  }
  return data;
}

export async function fetchPatients(startDate: string, endDate: string) {
  return apiFetch<any[]>(`/patients?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function fetchAppointments(startDate: string, endDate: string) {
  return apiFetch<any[]>(`/appointments?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function fetchRegister(startDate: string, endDate: string) {
  return apiFetch<any[]>(`/register?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function fetchUsers() {
  return apiFetch<any[]>("/users");
}

export async function fetchCatalogue() {
  return apiFetch<any[]>("/catalogue");
}

export async function fetchFinancial(startDate: string, endDate: string) {
  return apiFetch<{ records: any[]; summary: any }>(`/financial?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function fetchPayroll(month: number, year: number) {
  return apiFetch<any[]>(`/payroll?month=${month}&year=${year}`);
}

export async function addPayrollItem(item: {
  FullName: string; Bank: string; Position: string;
  AccountNumber: string; Status: string; Salary: number;
  Month: number; Year: number;
}) {
  return apiFetch<any>("/payroll", { method: "POST", body: JSON.stringify(item) });
}

export async function updatePayrollItem(id: number, item: {
  FullName: string; Bank: string; Position: string;
  AccountNumber: string; Status: string; Salary: number;
}) {
  return apiFetch<any>(`/payroll/${id}`, { method: "PUT", body: JSON.stringify(item) });
}

export async function deletePayrollItem(id: number) {
  return apiFetch<any>(`/payroll/${id}`, { method: "DELETE" });
}
