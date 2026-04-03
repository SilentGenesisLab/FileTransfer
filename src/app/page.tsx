"use client";

import { useState, useRef } from "react";

type Tab = "file" | "text" | "pickup";

interface PickupResult {
  type: "FILE" | "TEXT";
  pickupCode: string;
  createdAt: string;
  expiresAt: string;
  textContent: string | null;
  files: { id: string; fileName: string; fileSize: number; ossUrl: string }[];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File upload
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Text
  const [text, setText] = useState("");

  // Pickup
  const [pickupCode, setPickupCode] = useState("");
  const [pickupResult, setPickupResult] = useState<PickupResult | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
    setPickupResult(null);
  };

  const handleFileUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    reset();
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/transfer/file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.pickupCode);
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTextTransfer = async () => {
    if (!text.trim()) return;
    setLoading(true);
    reset();
    try {
      const res = await fetch("/api/transfer/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.pickupCode);
      setText("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async () => {
    if (!pickupCode.trim()) return;
    setLoading(true);
    reset();
    try {
      const res = await fetch(`/api/transfer/${pickupCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPickupResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Retrieval failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "file", label: "File Upload" },
    { key: "text", label: "Text Transfer" },
    { key: "pickup", label: "Pickup" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">FileTransfer</h1>
        <p className="text-center text-slate-500 mb-8">Upload files or text, get a pickup code to share</p>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); reset(); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* File Upload Tab */}
          {tab === "file" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <div className="text-4xl mb-2 text-slate-400">+</div>
                <p className="text-slate-600 font-medium">Click to select files</p>
                <p className="text-sm text-slate-400 mt-1">Support multiple files</p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-slate-700 truncate mr-4">{f.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{formatSize(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleFileUpload}
                disabled={!files.length || loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Uploading..." : "Upload & Get Code"}
              </button>
            </div>
          )}

          {/* Text Transfer Tab */}
          {tab === "text" && (
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to transfer..."
                rows={6}
                className="w-full border border-slate-300 rounded-lg p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleTextTransfer}
                disabled={!text.trim() || loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Transferring..." : "Transfer & Get Code"}
              </button>
            </div>
          )}

          {/* Pickup Tab */}
          {tab === "pickup" && (
            <div className="space-y-4">
              <input
                type="text"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit pickup code"
                maxLength={6}
                className="w-full text-center text-2xl tracking-[0.3em] font-mono border border-slate-300 rounded-lg py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                onKeyDown={(e) => e.key === "Enter" && handlePickup()}
              />
              <button
                onClick={handlePickup}
                disabled={pickupCode.length < 6 || loading}
                className="w-full py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Retrieving..." : "Retrieve"}
              </button>

              {pickupResult && (
                <div className="mt-4 space-y-3">
                  {pickupResult.type === "TEXT" && pickupResult.textContent && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-xs text-slate-400 mb-2 font-medium">TEXT CONTENT</div>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap break-words">{pickupResult.textContent}</pre>
                    </div>
                  )}
                  {pickupResult.type === "FILE" && pickupResult.files.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 font-medium">FILES ({pickupResult.files.length})</div>
                      {pickupResult.files.map((f) => (
                        <a
                          key={f.id}
                          href={f.ossUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors group"
                        >
                          <span className="text-sm text-slate-700 truncate mr-4 group-hover:text-blue-600">{f.fileName}</span>
                          <span className="text-xs text-slate-400 shrink-0">{formatSize(f.fileSize)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 text-center">
                    Expires: {new Date(pickupResult.expiresAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result: pickup code */}
          {result && (
            <div className="mt-6 text-center bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-sm text-green-600 font-medium mb-2">Pickup Code</div>
              <div className="text-4xl font-mono font-bold text-green-700 tracking-[0.3em]">{result}</div>
              <p className="text-xs text-green-500 mt-2">Valid for 24 hours</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 text-center bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Files expire after 24 hours</p>
      </div>
    </main>
  );
}
