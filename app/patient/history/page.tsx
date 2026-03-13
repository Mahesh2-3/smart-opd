"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hospital, ArrowLeft, Calendar, Clock, Activity, FileText } from "lucide-react";
import Link from "next/link";

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AppointmentData {
  _id: string;
  tokenNumber: string;
  department: string;
  cause: string;
  status: string;
  queuePosition: number;
  estimatedWaitTime: number;
  startedTime: string | null;
  completedTime: string | null;
  durationMinutes: number;
  createdAt: string;
  doctorId: { _id: string; name: string; specialty: string };
}

export default function PatientHistory() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const loggedInUser = JSON.parse(userStr);
    setUser(loggedInUser);
    
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/appointments?patientId=${loggedInUser._id}`);
        const data = await res.json();
        if (res.ok) setAppointments(data.appointments);
        else setError(data.error);
      } catch (err) {
        setError("Failed to load history.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/patient/dashboard" className="text-slate-500 hover:text-blue-600 transition-colors mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">My Appointments</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
        ) : error ? (
          <div className="text-center p-12 bg-white rounded-xl border border-red-200 text-red-500">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500 flex flex-col items-center gap-4">
             <Calendar className="w-12 h-12 text-slate-300" />
             <p>You have no past or upcoming appointments.</p>
             <Link href="/patient/doctors" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors mt-2">
               Find a Doctor
             </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">History & Records</h2>
            {appointments.map(app => (
              <div key={app._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                {/* Visual Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    app.status === 'serving' ? 'bg-blue-500' :
                    app.status === 'waiting' ? 'bg-amber-400' :
                    app.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
                }`}></div>

                {/* Left Col - Context */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                       <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                          Appointment ID: {app.tokenNumber}
                       </span>
                       <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                         Dr. {app.doctorId.name} 
                         <span className="text-sm font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                           {app.doctorId.specialty}
                         </span>
                       </h3>
                    </div>
                    <div>
                       {app.status === 'serving' && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg border border-blue-200 animate-pulse">Serving Now</span>}
                       {app.status === 'waiting' && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-lg border border-amber-200">Waiting (# {app.queuePosition})</span>}
                       {app.status === 'finished' && <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-lg border border-green-200">Completed</span>}
                       {app.status === 'cancelled' && <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">Cancelled</span>}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                    <p className="flex items-start gap-3 text-slate-700">
                      <Activity className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                      <span><strong className="block text-sm text-slate-500 mb-0.5">Reported Condition / Cause:</strong>{app.cause}</span>
                    </p>
                  </div>
                </div>

                {/* Right Col - Times */}
                <div className="sm:border-l sm:border-slate-200 sm:pl-6 sm:w-64 flex flex-col justify-center gap-4">
                  <div className="text-sm text-slate-600">
                     <p className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-slate-400" /> 
                       <strong>Booked:</strong> {new Date(app.createdAt).toLocaleDateString()}
                     </p>
                     <p className="flex items-center gap-2 pl-6">
                       {new Date(app.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                  </div>

                  {app.startedTime && (
                    <div className="text-sm text-slate-600 pt-4 border-t border-slate-100">
                      <p className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-green-500" /> 
                         <strong>Started:</strong> {new Date(app.startedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {app.completedTime && (
                        <>
                          <p className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-blue-500" /> 
                             <strong>Finished:</strong> {new Date(app.completedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <div className="mt-3 p-2 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between">
                            <span className="font-medium text-slate-500 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Duration</span>
                            <span className="font-bold text-slate-800">{app.durationMinutes} mins</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {app.status === 'waiting' && app.estimatedWaitTime > 0 && (
                     <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                        <span className="block text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Est. Wait</span>
                        <span className="text-lg font-bold text-blue-700">~{app.estimatedWaitTime} mins</span>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
