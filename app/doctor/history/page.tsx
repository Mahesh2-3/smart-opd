"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, History, CheckCircle, Activity } from "lucide-react";
import Link from "next/link";
import { UserData } from "../profile/page"; // We can reuse the exported interface

interface AppointmentHistory {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    age: number;
    healthCondition: string;
  } | null;
  cause: string;
  status: string;
  tokenNumber: string;
  durationMinutes: number;
  startedTime: string;
  completedTime: string;
  createdAt: string;
}

export default function DoctorHistory() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userStr);
    setUser(parsedUser);

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/appointments?doctorId=${parsedUser._id}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only show finished or past appointments if necessary
          // For now, let's keep all or just highlight them
          setAppointments(data.appointments.filter((app: AppointmentHistory) => app.status === "finished"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/doctor/dashboard" className="text-slate-500 hover:text-teal-600 transition-colors mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center border border-teal-200">
              <History className="w-4 h-4 text-teal-700" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Consultation History</span>
          </div>
          {user && (
            <div className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Dr. {user.name.split(" ")[0]}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Past Consultations</h1>
            <p className="text-slate-500">Record of all completed patient visits.</p>
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            Total: <span className="text-teal-600">{appointments.length}</span>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <History className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-700 mb-2">No History Yet</h3>
             <p className="text-slate-500 max-w-sm mx-auto">You haven't completed any consultations yet. Once you serve patients from your dashboard, they will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((app) => (
              <div key={app._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center font-mono font-bold text-slate-700 shadow-sm">
                      {app.tokenNumber.split("-")[1] || "—"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{app.patientId?.name || "Unknown Patient"}</h3>
                      <p className="text-sm text-slate-500">Visited on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 uppercase tracking-wider">
                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" /> {app.durationMinutes || "—"} min
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Medical Cause</span>
                    <p className="font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{app.cause || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient Details</span>
                    <div className="flex gap-4">
                      <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex-1">
                        <span className="text-xs text-slate-500 block">Age</span>
                        <span className="font-bold text-slate-700">{app.patientId?.age || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {app.startedTime && app.completedTime && (
                   <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                     <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Started: {new Date(app.startedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Ended: {new Date(app.completedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
