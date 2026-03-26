"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Stethoscope, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Store in local storage
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
          <UserPlus className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-blue-100 mt-2 text-sm">Join SOQMS today</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="flex bg-gray-100 p-1.5 rounded-lg mb-4">
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
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border text-black border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border text-black border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                  className="w-full px-4 py-3 border text-black border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 mt-6"
            >
              {loading ? "Creating API..." : "Register"}
            </button>
          </form>
        </div>

        <div className="px-8 pb-8 text-center text-sm text-gray-500 border-t border-gray-100 pt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-semibold ml-1"
          >
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
