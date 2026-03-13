"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hospital, User, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface ProfileData extends UserData {
  healthCondition: string;
  age: number | "";
  bloodGroup: string;
  address: string;
}

export default function PatientProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const loggedInUser = JSON.parse(userStr);
    
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/profile?userId=${loggedInUser._id}`);
        const data = await res.json();
        if (res.ok) {
          setProfile(data.user);
          // Update localstorage partially just in case
          localStorage.setItem("user", JSON.stringify({ ...loggedInUser, ...data.user }));
        } else {
          setError(data.error);
        }
      } catch (err: unknown) {
         setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!profile) return;
      
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile._id,
          healthCondition: profile.healthCondition,
          age: profile.age,
          bloodGroup: profile.bloodGroup,
          address: profile.address,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setProfile(data.user);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/patient/dashboard" className="text-slate-500 hover:text-blue-600 transition-colors mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">My Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
              <User className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Patient Details</h2>
            
            {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{error}</div>}
            {success && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">{success}</div>}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input type="text" value={profile?.name || ""} disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input type="email" value={profile?.email || ""} disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                  <input type="number" name="age" value={profile?.age || ""} onChange={handleChange} placeholder="e.g. 35" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
                  <input type="text" name="bloodGroup" value={profile?.bloodGroup || ""} onChange={handleChange} placeholder="e.g. O+" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Health Condition / Allergies</label>
                <textarea name="healthCondition" value={profile?.healthCondition || ""} onChange={handleChange} rows={3} placeholder="Describe any existing conditions, allergies, or chronic issues..." className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <textarea name="address" value={profile?.address || ""} onChange={handleChange} rows={2} placeholder="Your residential address" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:bg-blue-400">
                  <Save className="w-5 h-5" />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
