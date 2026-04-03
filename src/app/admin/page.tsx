"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserStorage {
  id: string;
  phone: string;
  nickname: string | null;
  role: string;
  storageBytes: number;
}

interface DashboardData {
  totalFiles: number;
  totalUsers: number;
  totalTransfers: number;
  tempTransfers: number;
  totalStorageBytes: number;
  dau: number;
  mau: number;
  userStorage: UserStorage[];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <p className="text-slate-500">Loading dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Total Files", value: data.totalFiles, color: "bg-blue-500" },
    { label: "Total Users", value: data.totalUsers, color: "bg-emerald-500" },
    { label: "Total Transfers", value: data.totalTransfers, color: "bg-violet-500" },
    { label: "Temp Transfers", value: data.tempTransfers, color: "bg-amber-500" },
    { label: "Storage", value: formatSize(data.totalStorageBytes), color: "bg-rose-500" },
    { label: "DAU (Today)", value: data.dau, color: "bg-cyan-500" },
    { label: "MAU (30d)", value: data.mau, color: "bg-indigo-500" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Back to Home
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
              <div className="text-2xl font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* User Storage Ranking */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">User Storage Ranking</h2>
          {data.userStorage.length === 0 ? (
            <p className="text-slate-400 text-sm">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">#</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Phone</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Nickname</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Role</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userStorage.map((u, i) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{u.phone}</td>
                      <td className="py-2.5 px-3 text-slate-600">{u.nickname || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                        {formatSize(u.storageBytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
