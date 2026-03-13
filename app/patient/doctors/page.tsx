"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hospital, ArrowLeft, Search, Clock, Users, ArrowRight, Activity, MapPin } from "lucide-react";
import Link from "next/link";

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface DoctorData extends UserData {
  specialty: string;
  place: string;
  status: string;
  totalConsultations: number;
  experience: number;
  liveQueueSize?: number;
  estimatedWaitTime?: number;
}

export default function DoctorsList() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [specialtyQuery, setSpecialtyQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  
  // Booking Modal
  const [bookingDoc, setBookingDoc] = useState<DoctorData | null>(null);
  const [cause, setCause] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const loggedInUser = JSON.parse(userStr);
    setUser(loggedInUser);
    fetchDoctors();
  }, [router]);

  const fetchDoctors = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctors${query}`);
      const data = await res.json();
      if (res.ok) setDoctors(data.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (specialtyQuery) params.append("specialty", specialtyQuery);
    if (placeQuery) params.append("place", placeQuery);
    fetchDoctors(`?${params.toString()}`);
  };

  const handleBook = async () => {
    if (!cause.trim() || !bookingDoc || !user) {
      setError("Please provide a reason for the visit.");
      return;
    }

    setBookingLoading(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user._id,
          doctorId: bookingDoc._id,
          department: bookingDoc.specialty,
          cause,
        }),
      });

      const data = await res.json();
      if (res.ok) {
         setBookingDoc(null);
         router.push("/patient/dashboard");
      } else {
         setError(data.error || "Booking failed");
      }
    } catch (err) {
       setError("An unexpected error occurred");
    } finally {
       setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/patient/dashboard" className="text-slate-500 hover:text-blue-600 transition-colors mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Find a Doctor</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-medium text-slate-700">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search & Filter Bar */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row gap-4">
           <div className="flex-1 relative">
             <Activity className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
             <input type="text" placeholder="Condition or Specialty (e.g. Cardiology)" value={specialtyQuery} onChange={(e) => setSpecialtyQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
           </div>
           <div className="flex-1 relative">
             <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
             <input type="text" placeholder="Location or Place" value={placeQuery} onChange={(e) => setPlaceQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
           </div>
           <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2">
             <Search className="w-4 h-4" /> Search
           </button>
        </form>

        {/* Doctors Grid */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
        ) : doctors.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500">No doctors found matching your criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doc => (
              <div key={doc._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100">
                         {doc.name.charAt(0)}
                       </div>
                       <div>
                         <h3 className="font-bold text-slate-800 text-lg">Dr. {doc.name}</h3>
                         <p className="text-sm font-medium text-blue-600">{doc.specialty}</p>
                       </div>
                    </div>
                    {doc.status === "Available" ? 
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">Available</span> :
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">Offline</span>
                    }
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm text-slate-600">
                     <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {doc.place || "Hospital Location"}</p>
                     <p className="flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> {doc.experience} Years Experience</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                     <div className="flex flex-col">
                       <span className="text-slate-500 font-medium flex items-center gap-1.5"><Users className="w-4 h-4" /> Live Queue</span>
                       <span className="font-bold text-slate-800 text-base">{doc.liveQueueSize} waiting</span>
                     </div>
                     <div className="flex flex-col text-right">
                       <span className="text-slate-500 font-medium flex items-center gap-1.5 justify-end"><Clock className="w-4 h-4" /> Est. Time</span>
                       <span className="font-bold text-slate-800 text-base">~{doc.estimatedWaitTime} mins</span>
                     </div>
                  </div>
                </div>

                <button 
                  onClick={() => setBookingDoc(doc)}
                  disabled={doc.status !== "Available"}
                  className="mt-6 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500"
                >
                  Book Appointment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {bookingDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Book Appointment</h3>
              <p className="text-slate-500 mb-6">Booking with <span className="font-bold text-slate-700">Dr. {bookingDoc.name}</span></p>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}

              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Reason for visit (Disease or Symptom)</label>
                    <input type="text" value={cause} onChange={(e) => setCause(e.target.value)} placeholder="e.g. Fever and Cough" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" autoFocus />
                 </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button onClick={() => { setBookingDoc(null); setError(""); setCause(""); }} className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                   Cancel
                 </button>
                 <button onClick={handleBook} disabled={bookingLoading} className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center gap-2">
                   {bookingLoading ? "Booking..." : "Confirm"}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
