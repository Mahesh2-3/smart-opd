"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hospital, User, Stethoscope } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Store in local storage for the prototype
      localStorage.setItem("user", JSON.stringify(data.user));

      if (role === "doctor") {
        router.push("/doctor/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1">
        <div className="bg-blue-600 p-8 text-center text-white">
          <Hospital className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">SOQMS Login</h2>
          <p className="text-blue-100 mt-2 text-sm">
            Smart OPD Queue Management
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex bg-gray-100 p-1.5 rounded-lg mb-6">
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${role === "patient" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setRole("patient")}
              >
                <User className="w-4 h-4" /> Patient
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${role === "doctor" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setRole("doctor")}
              >
                <Stethoscope className="w-4 h-4" /> Doctor
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md mt-4"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="px-8 pb-8 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-800 font-semibold ml-1"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
