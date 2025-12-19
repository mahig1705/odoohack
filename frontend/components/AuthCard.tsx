"use client";

import { useState } from "react";
import { login, signup } from "@/lib/api";

export default function AuthCard() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    setMsg("");
    try {
      if (mode === "login") {
        const data = await login(email, password);
        localStorage.setItem("token", data.access_token);
        setMsg("Logged in successfully");
      } else {
        const data = await signup(email, password);
        setMsg(data.message || "Account created");
      }
    } catch {
      setMsg("Something went wrong");
    }
  };

  return (
    <div className="w-[420px] rounded-2xl bg-white shadow-xl p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-1">
        {mode === "login" ? "Welcome back" : "Create account"}
      </h2>
      <p className="text-gray-500 mb-6">
        {mode === "login"
          ? "Login to continue"
          : "Sign up to get started"}
      </p>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 transition"
      >
        {mode === "login" ? "Login" : "Create account"}
      </button>

      {msg && (
        <p className="mt-4 text-center text-sm text-indigo-600">
          {msg}
        </p>
      )}

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
