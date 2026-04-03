"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface TransferFile {
  id: string;
  fileName: string;
  fileSize: number;
  ossUrl: string;
}

interface Transfer {
  id: string;
  pickupCode: string;
  type: "FILE" | "TEXT";
  textContent: string | null;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
  files: TransferFile[];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function MyTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch("/api/user/transfers");
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransfers(data.transfers);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transfer?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/transfers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransfers((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Transfers</h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {transfers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-400">No transfers yet</p>
            <Link href="/" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Create one
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((t) => (
              <div
                key={t.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${
                  t.expired ? "border-slate-200 opacity-60" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          t.type === "FILE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {t.type}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-700 tracking-wider">
                        {t.pickupCode}
                      </span>
                      {t.expired && (
                        <span className="text-xs text-red-500 font-medium">Expired</span>
                      )}
                    </div>

                    {t.type === "TEXT" && t.textContent && (
                      <p className="text-sm text-slate-600 truncate mt-1">{t.textContent}</p>
                    )}

                    {t.type === "FILE" && t.files.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {t.files.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 text-sm">
                            <a
                              href={f.ossUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {f.fileName}
                            </a>
                            <span className="text-xs text-slate-400 shrink-0">
                              {formatSize(f.fileSize)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                      <span>Created: {new Date(t.createdAt).toLocaleString()}</span>
                      <span>Expires: {new Date(t.expiresAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="ml-3 shrink-0 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting === t.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
