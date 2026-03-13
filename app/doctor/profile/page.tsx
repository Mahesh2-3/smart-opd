"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, User, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface DoctorProfileData extends UserData {
  specialty: string;
  place: string;
  status: string;
  totalConsultations: number;
  experience: number;
  avgTimePerConsultation: number;
}

export default function DoctorProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfileData | null>(null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          specialty: profile.specialty,
          place: profile.place,
          status: profile.status,
          experience: profile.experience,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setProfile(data.user);
        localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...data.user }));
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
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/doctor/dashboard" className="text-slate-500 hover:text-teal-600 transition-colors mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Doctor Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center border border-teal-200">
              <User className="w-4 h-4 text-teal-700" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">Dr. {profile?.name.split(" ")[0]}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="bg-teal-50 border-b border-teal-100 p-6 flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-teal-200">
                <Stethoscope className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Dr. {profile?.name}</h2>
                <span className="text-teal-600 font-medium">{profile?.specialty}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-slate-700">{profile?.totalConsultations || 0}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Consults</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-slate-700">{profile?.avgTimePerConsultation || 0}<span className="text-sm font-medium text-slate-500 ml-1">min</span></div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Time</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-slate-700">{profile?.experience || 0}<span className="text-sm font-medium text-slate-500 ml-1">yrs</span></div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Experience</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Edit Profile Basics</h3>
            
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Specialty</label>
                  <input type="text" name="specialty" value={profile?.specialty || ""} onChange={handleChange} placeholder="e.g. Cardiology" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                  <input type="number" name="experience" value={profile?.experience || ""} onChange={handleChange} placeholder="e.g. 5" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Clinic Location / Room</label>
                  <input type="text" name="place" value={profile?.place || ""} onChange={handleChange} placeholder="e.g. Room 302, Building B" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Availability Status</label>
                  <select name="status" value={profile?.status || "Available"} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none bg-white">
                    <option value="Available">Available for Consultations</option>
                    <option value="Offline">Offline / Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:bg-teal-400">
                  <Save className="w-5 h-5" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
