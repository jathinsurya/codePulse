import React from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Network } from "lucide-react";

export function Root() {
  const location = useLocation();
  const isDashboard = location.pathname.includes("/dashboard");

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-gray-900 overflow-x-hidden selection:bg-purple-200 selection:text-purple-900 font-sans">
      {!isDashboard && <Navbar />}
      <Outlet />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/60 backdrop-blur-xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <Network className="w-4 h-4" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">CodePulse</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="/#features" className="hover:text-purple-600 transition-colors">Features</a>
          <a href="/#how-it-works" className="hover:text-purple-600 transition-colors">How it Works</a>
          <a href="/#system-visualization" className="hover:text-purple-600 transition-colors">System MRI</a>
          <a href="/#time-machine" className="hover:text-purple-600 transition-colors">Time Machine</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/scan" className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            Start Scan
          </Link>
        </div>
      </div>
    </nav>
  );
}
