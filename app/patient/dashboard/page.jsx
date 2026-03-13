"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Hospital,
  User,
  Clock,
  AlertCircle,
  RefreshCw,
  Send,
  MessageSquare,
  Activity,
  Calendar,
  Users,
  Settings,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== "patient") {
      router.push("/login");
      return;
    }
    setUser(parsed);
    fetchTokens(parsed._id);

    // Set up WebSocket listeners
    let socket;
    let isMounted = true;

    import("socket.io-client").then(({ io }) => {
      if (!isMounted) return;
      socket = io();

      socket.on("queue_updated", () => {
        fetchTokens(parsed._id);
      });

      socket.on("token_called", () => {
        fetchTokens(parsed._id);
      });

      socket.on("consultation_completed", () => {
        fetchTokens(parsed._id);
      });
    });

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [router]);

  const fetchTokens = async (patientId) => {
    try {
      const res = await fetch(`/api/appointments?patientId=${patientId}`);
      const data = await res.json();
      if (res.ok && data.appointments && data.appointments.length > 0) {
        const active = data.appointments.find(
          (t) => t.status === "waiting" || t.status === "serving",
        );
        setActiveToken(active || null);
      } else {
        setActiveToken(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Note: Token generation moved to Doctors List -> Booking flow
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newChatHistory = [
      ...chatHistory,
      { role: "user", content: chatMessage },
    ];
    setChatHistory(newChatHistory);
    setChatMessage("");
    setChatLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage, patient_id: user._id }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory([
          ...newChatHistory,
          { role: "assistant", content: data.response },
        ]);
      } else {
        setChatHistory([
          ...newChatHistory,
          {
            role: "assistant",
            content:
              "Sorry, the MedQueue assistant is currently malfunctioning.",
          },
        ]);
      }
    } catch (err) {
      setChatHistory([
        ...newChatHistory,
        {
          role: "assistant",
          content:
            "Connection error with AI Server. Make sure Python is running on port 8000.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28 relative">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-sm">
                <Hospital className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl text-slate-800 hidden sm:block">
                Patient Portal
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                <User className="w-4 h-4 text-blue-600" /> {user?.name}
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />{" "}
            <span className="font-medium">{error}</span>
          </div>
        )}

        {!activeToken ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Welcome, {user?.name.split(" ")[0]}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/patient/doctors" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col items-start gap-4 cursor-pointer relative overflow-hidden">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Find a Doctor</h3>
                  <p className="text-slate-500 text-sm">Search specialists and book new appointments.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 absolute bottom-6 right-6 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
              
              <Link href="/patient/history" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col items-start gap-4 cursor-pointer relative overflow-hidden">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">My History</h3>
                  <p className="text-slate-500 text-sm">View past consultations and detailed logs.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 absolute bottom-6 right-6 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link href="/patient/profile" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col items-start gap-4 cursor-pointer relative overflow-hidden sm:col-span-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Profile Details</h3>
                  <p className="text-slate-500 text-sm">Update your medical information and background.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 absolute bottom-6 right-6 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Simulated Notification if estimated time is low */}
            {activeToken.estimatedWaitTime <= 15 &&
              activeToken.status === "waiting" && (
                <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 p-5 rounded-r-xl shadow-md flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-full animate-bounce mt-0.5">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-900 tracking-wide uppercase text-sm mb-1">
                      Approaching Turn
                    </h4>
                    <p className="text-base font-medium">
                      Your turn is arriving in approximately{" "}
                      <span className="font-bold">
                        {activeToken.estimatedWaitTime} minutes
                      </span>
                      . Please approach the consultation room.
                    </p>
                  </div>
                </div>
              )}

            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden transform transition-all hover:shadow-2xl">
              <div
                className={`p-8 text-center text-white relative ${activeToken.status === "serving" ? "bg-emerald-500" : "bg-blue-600"}`}
              >
                {activeToken.status === "serving" && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between">
                    <span className="w-3 h-3 rounded-full bg-white opacity-20"></span>
                    <span className="w-3 h-3 rounded-full bg-white opacity-20"></span>
                  </div>
                )}
                <div className="text-white/80 font-bold tracking-[0.2em] text-sm mb-2 uppercase">
                  Digital Token
                </div>
                <h2 className="text-7xl font-black font-mono tracking-tighter mb-2 drop-shadow-md">
                  {activeToken.tokenNumber}
                </h2>
                <p className="text-xl font-medium opacity-90">
                  {activeToken.department}
                </p>
                {activeToken.status === "serving" && (
                  <div className="mt-6 inline-flex items-center gap-3 bg-white/20 px-6 py-2 rounded-full text-sm font-bold backdrop-blur-md shadow-inner border border-white/30 tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>{" "}
                    NOW SERVING
                  </div>
                )}
              </div>

              <div className="p-10 flex flex-col items-center border-b-[3px] border-dashed border-slate-100 bg-white relative">
                <div className="absolute -left-6 -top-6 w-12 h-12 bg-slate-50 rounded-full"></div>
                <div className="absolute -right-6 -top-6 w-12 h-12 bg-slate-50 rounded-full"></div>

                <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 mb-4 transform hover:scale-105 transition-transform cursor-pointer">
                  <QRCodeSVG
                    value={activeToken._id}
                    size={200}
                    level="H"
                    fgColor="#0f172a"
                  />
                </div>
                <p className="text-sm tracking-widest text-slate-400 font-mono mt-2 uppercase font-semibold">
                  [{activeToken._id.slice(-8)}]
                </p>
              </div>

              <div className="p-8 grid grid-cols-2 gap-8 bg-slate-50/50">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Queue Position
                  </div>
                  <div className="text-4xl font-black text-slate-800 mt-auto">
                    {activeToken.status === "serving"
                      ? "-"
                      : activeToken.queuePosition}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl shadow-inner border border-blue-100 relative overflow-hidden flex flex-col">
                  <Clock className="absolute top-4 right-4 w-32 h-32 text-blue-500 opacity-[0.03] transform rotate-12" />
                  <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2 z-10 relative">
                    AI Est. Wait
                  </div>
                  <div className="text-4xl font-black text-slate-800 z-10 relative mt-auto">
                    {activeToken.status === "serving"
                      ? "0"
                      : activeToken.estimatedWaitTime}{" "}
                    <span className="text-lg font-semibold text-slate-500">
                      min
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-100/80 text-center border-t border-slate-200">
                <button
                  onClick={() => fetchTokens(user._id)}
                  className="text-slate-600 hover:text-blue-700 font-bold text-sm flex items-center justify-center gap-2 w-full py-3 bg-white rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <RefreshCw className="w-5 h-5" /> Refresh Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating MedQueue Assistant */}
      <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.5)] flex items-center justify-center text-white transition-all transform hover:scale-110 hover:shadow-[0_15px_35px_rgba(37,99,235,0.6)]"
          >
            <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full translate-x-1 -translate-y-1"></div>
            <MessageSquare className="w-7 h-7" />
          </button>
        ) : (
          <div
            className="w-[340px] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col transform transition-all animate-in slide-in-from-bottom-10 fade-in zoom-in-95"
            style={{ height: "550px" }}
          >
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-5 text-white flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide">
                    MedQueue AI
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    <p className="text-xs font-medium text-blue-100">
                      Online & ready
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 space-y-5 custom-scrollbar">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200">
                  🤖
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 leading-relaxed">
                  Hi{" "}
                  <span className="font-bold text-blue-600">
                    {user?.name.split(" ")[0]}
                  </span>
                  ! I&apos;m MedQueue Assistant powered by Groq. You can ask me
                  about your queue status, estimated times, or hospital
                  directions!
                </div>
              </div>

              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200 mt-auto">
                      🤖
                    </div>
                  )}
                  <div
                    className={`p-4 text-sm shadow-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" : "bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm"}`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200">
                    🤖
                  </div>
                  <div className="bg-white border border-slate-100 py-4 px-5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={sendChatMessage} className="flex gap-3 relative">
                <input
                  type="text"
                  className="flex-1 pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] font-medium text-slate-700"
                  placeholder="Ask me anything..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={chatLoading || !chatMessage.trim()}
                  className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
