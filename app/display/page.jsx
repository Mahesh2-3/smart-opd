"use client";

import { useEffect, useState, useRef } from "react";
import { Hospital, Activity, Volume2 } from "lucide-react";

export default function DisplayScreen() {
  const [departments] = useState([
    "General Medicine",
    "Cardiology",
    "Orthopedics",
    "Pediatrics",
  ]);
  const [queues, setQueues] = useState({});
  const lastAnnouncedRef = useRef("");

  useEffect(() => {
    async function fetchAllQueues() {
      const updatedQueues = {};
      let newServingFound = false;
      let latestAnnouncement = lastAnnouncedRef.current;

      for (const dept of departments) {
        try {
          const res = await fetch(
            `/api/queue?department=${encodeURIComponent(dept)}`,
          );
          if (res.ok) {
            const data = await res.json();
            updatedQueues[dept] = data;

            // Sound effect logic check
            if (
              data.currentserving &&
              data.currentserving.tokenNumber !== lastAnnouncedRef.current
            ) {
              newServingFound = true;
              latestAnnouncement = data.currentserving.tokenNumber;
            }
          }
        } catch (err) {
          console.error("Error fetching queue for", dept, err);
        }
      }
      setQueues(updatedQueues);
      if (newServingFound) {
        lastAnnouncedRef.current = latestAnnouncement;
        // Simulated bell sound could go here
      }
    }

    fetchAllQueues();
    const interval = setInterval(fetchAllQueues, 3000); // Poll every 3 seconds for real-time feel
    return () => clearInterval(interval);
  }, [departments]);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-950 p-6 flex justify-between items-center border-b border-slate-800 shadow-2xl z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Hospital className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">
              Live Token Display
            </h1>
            <p className="text-emerald-400 font-bold text-sm tracking-widest flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>{" "}
              SYSTEM ACTIVE
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black font-mono tracking-tighter text-slate-200">
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
        {departments.map((dept) => {
          const deptData = queues[dept] || { currentServing: null, queue: [] };
          const { currentServing, queue } = deptData;

          return (
            <div
              key={dept}
              className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Dept Header */}
              <div className="bg-slate-800 p-5 text-center border-b border-slate-700 min-h-[90px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <h2 className="text-xl font-black tracking-wider uppercase text-slate-200 z-10">
                  {dept}
                </h2>
              </div>

              {/* Now Serving */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Now Serving
                </div>
                {currentServing ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="text-8xl md:text-7xl lg:text-8xl font-black font-mono tracking-tighter text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] relative z-10">
                      {currentServing.tokenNumber}
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl font-black text-slate-700 uppercase tracking-widest flex items-center gap-3">
                    <Activity className="w-8 h-8 text-slate-700" /> --
                  </div>
                )}
              </div>

              {/* Up Next Ribbon */}
              <div className="bg-slate-900/80 border-t border-slate-700 p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span>Up Next</span>
                  {queue.length > 0 && (
                    <span className="text-blue-400">{queue.length} Wait</span>
                  )}
                </div>

                <div className="flex gap-2 overflow-hidden h-[48px]">
                  {queue.slice(0, 3).map((token, i) => (
                    <div
                      key={token._id}
                      className="bg-slate-800 border border-slate-700 rounded-xl flex-1 flex items-center justify-center text-xl font-bold font-mono text-slate-300"
                      style={{ opacity: 1 - i * 0.25 }}
                    >
                      {token.tokenNumber}
                    </div>
                  ))}
                  {queue.length === 0 && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl w-full flex items-center justify-center text-sm font-bold text-slate-600 uppercase tracking-wider">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white p-3 overflow-hidden whitespace-nowrap border-t border-slate-800 shadow-inner flex items-center">
        <Volume2 className="w-6 h-6 text-blue-300 mr-4 flex-shrink-0 animate-pulse" />
        <div className="animate-[marquee_20s_linear_infinite] inline-block font-bold text-lg tracking-wide text-blue-100">
          Welcome to the hospital. Please wait in the designated areas until
          your token is called. Keep your QR code ready for scanning. MedQueue
          AI Assistant is available on your patient dashbaord to help you with
          waiting times.
        </div>
      </div>
    </div>
  );
}
