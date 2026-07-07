"use client";

import { useEffect, useState } from "react";
import {
  createApplication,
  deleteApplication,
  getApplications,
} from "@/services/applications";

type Application = {
  id: number;
  company: string;
  position: string;
  status: string;
  notes?: string;
  applied_date?: string;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("Applied");
  const [notes, setNotes] = useState("");

  async function loadApplications() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const data = await getApplications(token);
    console.log("Applications Response:", data);

    const apps = Array.isArray(data)
      ? data
      : data.applications || data.data || [];

    console.log("Final apps:", apps);

    setApplications(apps);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const result = await createApplication(token, {
        company,
        position,
        status,
        notes,
      });

      console.log("Create Result:", result);

      setCompany("");
      setPosition("");
      setStatus("Applied");
      setNotes("");

      await loadApplications();
    } catch (error) {
      console.error(error);
      alert("Failed to add application");
    }
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("token");
    if (!token) return;

    await deleteApplication(token, id);
    await loadApplications();
  }

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Applications</h1>
        <p className="text-slate-600 text-sm mt-1">
          Track companies, roles, and application status.
        </p>
        <p className="text-sm text-blue-600 mt-2">
          Applications loaded: {applications.length}
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <input
            className="border border-slate-300 text-slate-900 bg-white rounded-lg px-3 py-2"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />

          <input
            className="border border-slate-300 text-slate-900 bg-white rounded-lg px-3 py-2"
            placeholder="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
          />

          <select
            className="border border-slate-300 text-slate-900 bg-white rounded-lg px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Applied</option>
            <option>Interview</option>
            <option>OA</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>

          <input
            className="border border-slate-300 text-slate-900 bg-white rounded-lg px-3 py-2"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button className="bg-slate-900 text-white rounded-lg px-4 py-2">
            + Add Application
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="text-left p-4">Company</th>
              <th className="text-left p-4">Position</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Notes</th>
              <th className="text-left p-4">Applied Date</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-t border-slate-200">
                <td className="p-4 font-medium text-slate-900">
                  {app.company}
                </td>
                <td className="p-4 text-slate-700">{app.position}</td>
                <td className="p-4 text-slate-700">{app.status}</td>
                <td className="p-4 text-slate-700">{app.notes || "-"}</td>
                <td className="p-4 text-slate-700">
                  {app.applied_date || "-"}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {applications.length === 0 && (
              <tr>
                <td className="p-6 text-slate-500" colSpan={6}>
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}