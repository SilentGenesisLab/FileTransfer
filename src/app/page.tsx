"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

type AuthTab = "account" | "phone" | "register";

interface AuthUser {
  id: string;
  phone: string;
  username?: string | null;
  role: string;
  nickname: string | null;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("account");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  // Account login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // Register
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCode, setRegCode] = useState("");
  const [regCodeSent, setRegCodeSent] = useState(false);
  const [regCountdown, setRegCountdown] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (regCountdown <= 0) return;
    const timer = setTimeout(() => setRegCountdown(regCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [regCountdown]);

  // Account login handler
  const handleAccountLogin = async () => {
    if (!loginUsername || !loginPassword) return;
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setShowLogin(false);
      setLoginUsername("");
      setLoginPassword("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setAuthLoading(false);
    }
  };

  // Register handler
  const handleRegister = async () => {
    if (!regUsername || !regPassword || !regPhone || !regCode) return;
    if (regPassword !== regConfirm) {
      setError("两次密码输入不一致");
      return;
    }
    if (regPassword.length < 6) {
      setError("密码至少6个字符");
      return;
    }
    setAuthLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          phone: regPhone,
          code: regCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setShowLogin(false);
      setRegUsername("");
      setRegPassword("");
      setRegConfirm("");
      setRegPhone("");
      setRegCode("");
      setRegCodeSent(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "注册失败");
    } finally {
      setAuthLoading(false);
    }
  };

  // Send code for registration
  const handleRegSendCode = async () => {
    if (!regPhone || !/^1[3-9]\d{9}$/.test(regPhone)) {
      setError("请输入正确的手机号");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRegCodeSent(true);
      setRegCountdown(60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "发送验证码失败");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!loginPhone || !/^1[3-9]\d{9}$/.test(loginPhone)) {
      setError("请输入正确的手机号");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCodeSent(true);
      setCountdown(60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginCode) return;
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, code: loginCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needRegister) {
          setAuthTab("register");
          setRegPhone(loginPhone);
          throw new Error(data.error);
        }
        throw new Error(data.error);
      }
      setUser(data.user);
      setShowLogin(false);
      setLoginPhone("");
      setLoginCode("");
      setCodeSent(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  // File upload
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
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

    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`File "${oversized.name}" exceeds 100MB limit (${(oversized.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    reset();

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setResult(data.pickupCode);
          setFiles([]);
          if (fileRef.current) fileRef.current.value = "";
        } else {
          setError(data.error || "Upload failed");
        }
      } catch {
        setError("Upload failed");
      }
      setLoading(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      setError("Network error during upload");
      setLoading(false);
      setUploadProgress(0);
    };

    xhr.open("POST", "/api/transfer/file");
    xhr.send(formData);
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
        {/* Auth Header */}
        <div className="flex justify-end items-center gap-2 mb-4 text-sm">
          {user ? (
            <>
              <span className="text-slate-500">{user.nickname || user.phone}</span>
              <Link href="/my" className="text-blue-600 hover:underline">My Transfers</Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="text-red-600 hover:underline">Admin</Link>
              )}
              <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600">Logout</button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              登录 / 注册
            </button>
          )}
        </div>

        {/* Auth Modal */}
        {showLogin && !user && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            {/* Auth Tabs */}
            <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
              {([
                { key: "account" as AuthTab, label: "账号登录" },
                { key: "phone" as AuthTab, label: "手机登录" },
                { key: "register" as AuthTab, label: "注册" },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setAuthTab(t.key); setError(null); }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    authTab === t.key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Account Login */}
            {authTab === "account" && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="用户名"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && handleAccountLogin()}
                />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && handleAccountLogin()}
                />
                <button
                  onClick={handleAccountLogin}
                  disabled={authLoading || !loginUsername || !loginPassword}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? "登录中..." : "登录"}
                </button>
              </div>
            )}

            {/* Phone Login */}
            {authTab === "phone" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="手机号"
                    maxLength={11}
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={authLoading || countdown > 0}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {countdown > 0 ? `${countdown}s` : "发送验证码"}
                  </button>
                </div>
                {codeSent && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={loginCode}
                      onChange={(e) => setLoginCode(e.target.value)}
                      placeholder="验证码"
                      maxLength={6}
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <button
                      onClick={handleLogin}
                      disabled={authLoading || !loginCode}
                      className="px-6 py-2.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {authLoading ? "..." : "登录"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Register */}
            {authTab === "register" && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="用户名（3-20个字符）"
                  maxLength={20}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="密码（至少6个字符）"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="确认密码"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="手机号"
                    maxLength={11}
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleRegSendCode}
                    disabled={authLoading || regCountdown > 0}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {regCountdown > 0 ? `${regCountdown}s` : "发送验证码"}
                  </button>
                </div>
                {regCodeSent && (
                  <input
                    type="text"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                    placeholder="验证码"
                    maxLength={6}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  />
                )}
                <button
                  onClick={handleRegister}
                  disabled={authLoading || !regUsername || !regPassword || !regConfirm || !regPhone || !regCode}
                  className="w-full py-2.5 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? "注册中..." : "注册"}
                </button>
              </div>
            )}

            <button
              onClick={() => { setShowLogin(false); setCodeSent(false); setLoginPhone(""); setLoginCode(""); setError(null); }}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600"
            >
              取消
            </button>
          </div>
        )}

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
                <p className="text-sm text-slate-400 mt-1">Support multiple files (max 100MB each)</p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    const oversized = selected.find((f) => f.size > MAX_FILE_SIZE);
                    if (oversized) {
                      setError(`File "${oversized.name}" exceeds 100MB limit (${(oversized.size / 1024 / 1024).toFixed(1)}MB)`);
                      e.target.value = "";
                      return;
                    }
                    setError(null);
                    setFiles(selected);
                  }}
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

              {loading && uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleFileUpload}
                disabled={!files.length || loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? `Uploading${uploadProgress > 0 ? ` ${uploadProgress}%` : "..."}` : "Upload & Get Code"}
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
