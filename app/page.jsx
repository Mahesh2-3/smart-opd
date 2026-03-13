import Link from "next/link";
import { Hospital, Activity, Clock, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
                <Hospital className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-800">SOQMS</span>
            </div>
            <div className="flex gap-4 items-center">
              <Link href="/login" className="text-slate-600 hover:text-blue-600 px-4 py-2 font-medium transition-colors">
                Login
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -m-32 w-[600px] h-[600px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 left-0 -m-32 w-[600px] h-[600px] bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-8 border border-blue-100 shadow-sm transition-transform hover:scale-105 cursor-pointer">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              Live Queue Tracking Now Active
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 !leading-tight">
              Smart OPD Queue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                Management System
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
              Transform your hospital&apos;s waiting experience with digital queues, AI-powered wait time predictions, and real-time mobile notifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link href="/login" className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] flex items-center justify-center gap-2 hover:-translate-y-1">
                Patient Portal <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                Doctor Access
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">Core Features</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Designed to reduce patient anxiety.</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Activity className="w-7 h-7 text-emerald-600" />,
                title: "Digital Queue",
                desc: "Generate your secure token online and track your exact position in the line from anywhere in the hospital.",
                bg: "bg-emerald-50",
                iconBg: "bg-white border text-emerald-500 border-emerald-100"
              },
              {
                icon: <Clock className="w-7 h-7 text-blue-600" />,
                title: "AI Wait Prediction",
                desc: "Our smart algorithm calculates estimated wait times based on live hospital load and historical consultation durations.",
                bg: "bg-blue-50",
                iconBg: "bg-white border border-blue-100 text-blue-500"
              },
              {
                icon: <Smartphone className="w-7 h-7 text-purple-600" />,
                title: "Live Tracking",
                desc: "Watch the queue progress in real-time on our interactive hospital display boards and your mobile dashboard.",
                bg: "bg-purple-50",
                iconBg: "bg-white border border-purple-100 text-purple-500"
              }
            ].map((feature, i) => (
              <div key={i} className={`p-8 rounded-3xl ${feature.bg} transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group cursor-default border border-transparent hover:border-slate-200/50`}>
                <div className={`${feature.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 transition-transform group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats or Info Segment */}
      <div className="bg-white border-y border-slate-200 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex-1 space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Academic Prototype Build</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                A highly responsive, production-inspired demonstration for next-generation OPD Queue Management. Look below for a simulation overview.
              </p>
            </div>
            <ul className="space-y-5">
              {[
                'Role-based Access Control (Patient/Doctor)', 
                'Simulated AI Wait Time Engine via Groq', 
                'Real-time animated queue display board', 
                'QR Code generation for secure token scanning'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1 bg-emerald-100 rounded-full p-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 font-medium text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-inner flex items-center justify-center min-h-[400px] relative overflow-hidden">
             {/* Mock Display Board illustration */}
             <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden border border-slate-700 transform transition-transform hover:scale-105">
               <div className="absolute top-0 right-0 p-4 opacity-20"><Hospital className="w-16 h-16 text-white"/></div>
               <div className="flex items-center gap-2 mb-8">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div className="text-xs text-emerald-400 font-mono tracking-widest">LIVE BOARD</div>
               </div>
               <div className="text-xl text-slate-400 font-bold mb-1 tracking-wider">NOW SERVING</div>
               <div className="text-4xl text-white font-bold mb-10">Dr. Smith</div>
               <div className="bg-slate-800 p-5 rounded-xl flex justify-between items-center border border-slate-700 shadow-inner">
                  <div className="text-slate-400 font-medium tracking-wide">TOKEN</div>
                  <div className="text-5xl text-emerald-400 font-black font-mono tracking-tighter">A23</div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-center border-t border-slate-800">
        <Hospital className="w-8 h-8 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Smart OPD Queue Management System &copy; 2026</p>
        <p className="text-sm mt-3 text-slate-500">Academic Project Demonstration</p>
      </footer>
    </div>
  );
}
