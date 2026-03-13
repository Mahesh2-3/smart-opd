"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hospital,
  User,
  Stethoscope,
  ChevronRight,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentServing, setCurrentServing] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== "doctor") {
      router.push("/login");
      return;
    }
    setUser(parsed);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchQueue = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/queue?doctorId=${user._id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentServing(data.currentserving);
        setQueue(data.queue);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "call_next", doctorId: user._id }),
      });
      if (res.ok) fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinish = async () => {
    if (!currentServing) return;
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          tokenId: currentServing._id,
        }),
      });
      if (res.ok) fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl text-slate-800 hidden sm:block">
                Doctor Provider Portal
              </span>
            </div>

            <div className="flex gap-4 items-center">
              <button onClick={() => router.push("/doctor/history")} className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors">History</button>
              <button onClick={() => router.push("/doctor/profile")} className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors">Profile</button>
              <div className="text-sm font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hidden md:block">
                {user?.specialty || "Specialist"}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                <User className="w-4 h-4 text-teal-600" /> Dr.{" "}
                {user?.name.split(" ")[0]}
              </div>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors px-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid lg:grid-cols-3 gap-8">
        {/* Left Column: Current Patient Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> Active
                Consultation
              </h2>
              <div className="text-sm font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>{" "}
                Live
              </div>
            </div>

            <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
              {currentServing ? (
                <div className="w-full">
                  <div className="flex flex-col sm:flex-row gap-8">
                    {/* Left side Token Number */}
                    <div className="text-center sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-100 pb-6 sm:pb-0 sm:pr-8 flex flex-col justify-center">
                      <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Token Number</div>
                      <div className="bg-emerald-50 text-emerald-700 font-mono text-5xl sm:text-6xl font-black py-6 px-4 rounded-3xl border border-emerald-100 shadow-inner tracking-tighter w-full mb-4">
                        {currentServing.tokenNumber}
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Wait Time: {currentServing.durationMinutes || 0}m</p>
                    </div>
                    
                    {/* Right side Profile Data */}
                    <div className="flex-1 text-left space-y-4">
                       <h3 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-2">{currentServing.patientId?.name || "Unknown Patient"}</h3>
                       <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                           <span className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">Age</span>
                           <span className="font-semibold text-slate-700">{currentServing.patientId?.age || "--"} yrs</span>
                         </div>
                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                           <span className="block text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">Blood Group</span>
                           <span className="font-semibold text-slate-700">{currentServing.patientId?.bloodGroup || "--"}</span>
                         </div>
                       </div>
                       
                       <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-4">
                         <span className="block text-amber-700 font-bold uppercase text-[10px] tracking-wider mb-1">Reason for Visit</span>
                         <span className="font-medium text-amber-900">{currentServing.cause || "Not specified"}</span>
                       </div>

                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                         <span className="block text-blue-700 font-bold uppercase text-[10px] tracking-wider mb-1">Medical Background</span>
                         <span className="font-medium text-blue-900 text-xs sm:text-sm">{currentServing.patientId?.healthCondition || "No prior conditions reported."}</span>
                       </div>
                    </div>
                  </div>

                  <button
                    onClick={handleFinish}
                    className="mt-8 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg py-5 rounded-3xl shadow-lg transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-6 h-6" /> Complete & Notify Analytics
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Hospital className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">
                    Room Available
                  </h3>
                  <p className="text-slate-500 mb-8 max-w-sm">
                    No active consultation. You can call the next patient from
                    the waiting queue.
                  </p>

                  <button
                    onClick={handleCallNext}
                    disabled={queue.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  >
                    Call Next Patient <ChevronRight className="w-5 h-5" />
                  </button>
                  {queue.length === 0 && (
                    <p className="text-sm text-slate-400 mt-4">
                      Queue is empty right now.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Queue Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-28 flex flex-col max-h-[calc(100vh-140px)]">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Waiting Queue
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {queue.length} Waiting
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {queue.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No patients waiting
                </div>
              ) : (
                queue.map((token, idx) => (
                  <div
                    key={token._id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center font-mono font-bold text-slate-800">
                        <span className="text-lg leading-none">{token.tokenNumber.split("-")[1] || token.tokenNumber}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 mb-0.5">
                          {token.patientId?.name || "Patient"}
                        </div>
                        <div className="flex gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <span>Pos: {token.queuePosition}</span>
                          <span className="text-blue-500">Est: {token.estimatedWaitTime} min</span>
                        </div>
                      </div>
                    </div>
                    {idx === 0 && !currentServing && (
                      <button
                        onClick={handleCallNext}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-sm rounded-xl shadow-sm transition-colors"
                      >
                        Call
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick Action when serving someone */}
            {currentServing && queue.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                <div className="text-sm text-slate-500 font-medium">
                  Next up:{" "}
                  <span className="font-bold text-slate-800">
                    {queue[0].tokenNumber}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure Activity icon is imported correctly above
function Activity(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
