"use client";

import { useState } from "react";
import { login, signup } from "@/lib/api";

// ---------- validation helpers ----------
const isValidGmail = (email: string) =>
  email.endsWith("@gmail.com");

const isStrongPassword = (password: string) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password);

// ---------- component ----------
export default function AuthCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMsg("");
    setError(false);

    // frontend validation (matches backend)
    if (!isValidGmail(email)) {
      setMsg("Only @gmail.com emails are allowed");
      setError(true);
      return;
    }

    if (mode === "signup" && !isStrongPassword(password)) {
      setMsg(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      );
      setError(true);
      return;
    }

    try {
      setLoading(true);

      if (mode === "login") {
        const data = await login(email, password);
        localStorage.setItem("token", data.access_token);
        setMsg("Logged in successfully");
      } else {
        const data = await signup(email, password);
        setMsg(data.message || "Account created successfully");
      }
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.detail || "Invalid email or password";

      setMsg(
        Array.isArray(backendMsg)
          ? backendMsg[0].msg
          : backendMsg
      );
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[420px] rounded-2xl bg-white shadow-2xl p-8">
      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 mb-1">
        {mode === "login" ? "Welcome back 👋" : "Create your account ✨"}
      </h2>
      <p className="text-gray-500 mb-6">
        {mode === "login"
          ? "Login to continue"
          : "Sign up to get started"}
      </p>

      {/* Inputs */}
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900
            focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900
            focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`mt-6 w-full rounded-lg py-3 font-semibold text-white transition
          ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }
        `}
      >
        {loading
          ? "Please wait..."
          : mode === "login"
          ? "Login"
          : "Create account"}
      </button>

      {/* Message */}
      {msg && (
        <p
          className={`mt-4 text-center text-sm font-medium ${
            error ? "text-red-600" : "text-green-600"
          }`}
        >
          {msg}
        </p>
      )}

      {/* Toggle */}
      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <span
          onClick={() =>
            setMode(mode === "login" ? "signup" : "login")
          }
          className="cursor-pointer font-semibold text-indigo-600 hover:underline"
        >
          {mode === "login" ? "Create account" : "Login"}
        </span>
      </p>
    </div>
  );
}
