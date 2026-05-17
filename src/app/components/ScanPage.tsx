import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { scanRepo } from "../../services/api";
import { 
  Github, 
  UploadCloud, 
  ArrowRight, 
  Zap, 
  Terminal, 
  Database, 
  Activity, 
  Code2, 
  Layers, 
  Server,
  Network,
  LayoutDashboard,
  GitCommit,
  Sparkles,
  CheckCircle2,
  FolderTree,
  Cpu,
  Fingerprint
} from "lucide-react";

export function ScanPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const navigate = useNavigate();

  const startScan = async () => {
    if (!repoUrl) return;
    setScanError(null);
    setIsScanning(true);
    setScanStep(1);

    try {
      // Steps 1→4 animate while waiting for the API (each ~800ms)
      const stepTimer = setInterval(() => {
        setScanStep(s => {
          if (s < 4) return s + 1;
          clearInterval(stepTimer);
          return s;
        });
      }, 800);

      const result = await scanRepo(repoUrl);
      clearInterval(stepTimer);

      if (result.detail) {
        // FastAPI error response has a `detail` field
        setScanError(result.detail);
        setIsScanning(false);
        setScanStep(0);
        return;
      }

      localStorage.setItem("session_id", result.session_id);
      localStorage.setItem("repo_data", JSON.stringify(result.repo));

      setScanStep(6); // trigger "complete" animation
      setTimeout(() => {
        navigate(`/dashboard?session=${result.session_id}`);
      }, 1200);
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      if (msg.includes("fetch") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setScanError("Could not connect to backend. Make sure uvicorn is running on port 8000.");
      } else {
        setScanError(`Scan failed: ${msg}`);
      }
      setIsScanning(false);
      setScanStep(0);
    }
  };

  useEffect(() => {
    // No-op: step advancement is now handled inside startScan
  }, [isScanning, scanStep]);


  return (
    <div className="pt-32 pb-24 min-h-screen relative overflow-hidden bg-[#FAFBFC]">
      {/* Ultra-Premium Ambient Background System */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ 
            rotate: [0, 5, 0],
            scale: [1, 1.05, 1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(216,180,254,0.15),transparent_60%)] rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            rotate: [0, -5, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(253,164,175,0.15),transparent_60%)] rounded-full blur-3xl" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)]" />
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!isScanning ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <HeroInputArea repoUrl={repoUrl} setRepoUrl={setRepoUrl} startScan={startScan} scanError={scanError} />
              <DemoRepositories setRepoUrl={setRepoUrl} />
              <FeaturePreviewStrip />

              <BottomCTA />
            </motion.div>
          ) : (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-[85vh] flex items-center justify-center pt-8"
            >
              <ScanExperience scanStep={scanStep} repoUrl={repoUrl} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HeroInputArea({ repoUrl, setRepoUrl, startScan, scanError }: { repoUrl: string, setRepoUrl: (url: string) => void, startScan: () => void, scanError: string | null }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section className="px-6 pb-20">
      <div className="max-w-4xl mx-auto text-center mb-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] mb-8">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-bold tracking-widest text-indigo-900 uppercase">System Online</span>
          </div>
          <h1 className="text-6xl md:text-[5.5rem] font-bold tracking-tight text-gray-900 mb-8 leading-[1.05]">
            Inject Your Repository <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
              Into CodePulse AI
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto font-light leading-relaxed">
            IBM Bob transforms complex codebases into living intelligence systems. 
            Upload or link your repository to begin the neural mapping process.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto relative group"
      >
        {/* Soft elegant shadow layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative rounded-[3rem] bg-white/70 backdrop-blur-2xl border border-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.8)] p-3 overflow-hidden">
          <div className="bg-white/40 rounded-[2.5rem] p-8 border border-white/50 relative overflow-hidden">
            
            {/* Elegant inner lighting */}
            <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-gradient-to-b from-white/80 to-transparent blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6">
              {/* Ultra-refined URL Input */}
              <div className="relative group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-[1.25rem] blur opacity-0 group-focus-within/input:opacity-30 transition-opacity duration-500" />
                <div className="relative flex items-center bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 group-focus-within/input:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                  <div className="pl-6 text-gray-400">
                    <Github className="w-6 h-6 group-focus-within/input:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="Paste GitHub repository URL..."
                    className="w-full py-6 px-5 bg-transparent outline-none text-gray-900 text-lg placeholder:text-gray-400 font-medium"
                  />
                  {repoUrl && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="pr-6 text-emerald-500"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </motion.div>
                  )}
                </div>
              </div>





              {/* Error message */}
              {scanError && (
                <div className="mt-2 px-5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span> {scanError}
                </div>
              )}

              {/* Ultra-Premium Scan Button */}
              <button 
                onClick={startScan}
                disabled={!repoUrl && !isDragging}
                className={`mt-4 w-full py-5 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden group/btn ${
                  repoUrl || isDragging 
                    ? "shadow-[0_10px_30px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:-translate-y-0.5" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {(repoUrl || isDragging) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 group-hover/btn:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2),transparent)]" />
                  </>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  Start AI Repository Scan <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DemoRepositories({ setRepoUrl }: { setRepoUrl: (url: string) => void }) {
  const demos = [
    { name: "React", icon: <Code2 className="w-5 h-5" />, url: "https://github.com/facebook/react", color: "text-blue-500", bg: "bg-blue-50/50", border: "border-blue-100", nodes: 142, health: 98 },
    { name: "Next.js", icon: <Layers className="w-5 h-5" />, url: "https://github.com/vercel/next.js", color: "text-gray-900", bg: "bg-gray-50/50", border: "border-gray-200", nodes: 384, health: 92 },
    { name: "FastAPI", icon: <Zap className="w-5 h-5" />, url: "https://github.com/tiangolo/fastapi", color: "text-emerald-500", bg: "bg-emerald-50/50", border: "border-emerald-100", nodes: 89, health: 96 },
    { name: "TensorFlow", icon: <Cpu className="w-5 h-5" />, url: "https://github.com/tensorflow/tensorflow", color: "text-orange-500", bg: "bg-orange-50/50", border: "border-orange-100", nodes: 512, health: 85 }
  ];

  return (
    <section className="px-6 py-12 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10 justify-center">
          <div className="h-px bg-gradient-to-r from-transparent to-gray-200 w-16" />
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Try a Demo Repository</p>
          <div className="h-px bg-gradient-to-l from-transparent to-gray-200 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demos.map((demo: any, i: number) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setRepoUrl(demo.url)}
              className="flex flex-col p-5 rounded-[1.5rem] bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between w-full mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${demo.bg} ${demo.border} border ${demo.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                  {demo.icon}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Health</span>
                  <span className={`text-sm font-bold ${demo.health > 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{demo.health}%</span>
                </div>
              </div>
              
              <span className="font-bold text-lg text-gray-900 tracking-tight mb-1 relative z-10">{demo.name}</span>
              
              <div className="w-full mt-4 p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-gray-600">{demo.nodes} Nodes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScanExperience({ scanStep, repoUrl }: { scanStep: number, repoUrl: string }) {
  const navigate = useNavigate();
  const steps = [
    { title: "Initializing Connection", desc: `Establishing secure uplink to ${repoUrl || "target repository"}`, icon: <Network className="w-6 h-6 text-indigo-500" /> },
    { title: "Extracting Source", desc: "Cloning architecture and resolving deep dependencies...", icon: <UploadCloud className="w-6 h-6 text-purple-500" /> },
    { title: "Neural Scan Active", desc: "IBM Bob is processing ASTs and extracting module semantics...", icon: <Cpu className="w-6 h-6 text-pink-500" /> },
    { title: "Mapping Architecture", desc: "Constructing multi-dimensional dependency graphs...", icon: <FolderTree className="w-6 h-6 text-rose-500" /> },
    { title: "Activating Intelligence", desc: "Generating semantic vectors and logic pathways...", icon: <Zap className="w-6 h-6 text-amber-500" /> },
    { title: "Scan Complete", desc: "Repository successfully digitized into living intelligence.", icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> }
  ];

  const currentStep = steps[scanStep - 1] || steps[0];

  return (
    <div className="w-full max-w-4xl px-6">
      <div className="bg-white/70 backdrop-blur-3xl border border-white rounded-[3rem] p-10 md:p-16 shadow-[0_30px_100px_rgba(168,85,247,0.15),inset_0_1px_1px_rgba(255,255,255,1)] relative overflow-hidden">
        {/* Soft inner glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-white/80 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div 
            key={scanStep}
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-40 h-40 rounded-[2.5rem] bg-white border border-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex items-center justify-center mb-10 relative"
          >
            {/* Holographic glowing lines branching out */}
            <svg className="absolute -inset-20 w-[calc(100%+160px)] h-[calc(100%+160px)] pointer-events-none opacity-40">
              <path d="M160 160 L 50 50 M160 160 L 270 50 M160 160 L 50 270 M160 160 L 270 270" stroke="url(#holograd)" strokeWidth="2" fill="none" strokeDasharray="4 4">
                <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1s" repeatCount="indefinite" />
              </path>
              <defs>
                <linearGradient id="holograd" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>

            {/* Neural network floating nodes */}
            <motion.div animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-white/80 backdrop-blur border border-indigo-100 shadow-sm flex items-center justify-center text-indigo-500"><Code2 className="w-5 h-5" /></motion.div>
            <motion.div animate={{ y: [10, -10, 10], x: [5, -5, 5] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-4 -right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-pink-100 shadow-sm flex items-center justify-center text-pink-500"><Database className="w-4 h-4" /></motion.div>

            {/* Cinematic Pulse rings */}
            <div className="absolute inset-0 rounded-[2.5rem] border-2 border-indigo-400/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-[-15px] rounded-[3rem] border-2 border-pink-400/20 animate-[ping_3.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-pink-50 rounded-[2.5rem] opacity-50" />
            
            <div className="relative z-10 p-4 bg-white rounded-3xl shadow-sm">
              {React.cloneElement(currentStep.icon, { className: `w-14 h-14 ${currentStep.icon.props.className}` })}
            </div>
          </motion.div>

          <motion.h2 
            key={`title-${scanStep}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight"
          >
            {currentStep.title}
          </motion.h2>
          
          <motion.p 
            key={`desc-${scanStep}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-gray-500 font-light mb-12 max-w-xl"
          >
            {currentStep.desc}
          </motion.p>

          {/* Premium Progress Bar */}
          <div className="w-full max-w-lg bg-gray-100/80 rounded-full h-2.5 mb-10 overflow-hidden shadow-inner relative border border-gray-200/50">
            <motion.div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              initial={{ width: `${((scanStep - 1) / 6) * 100}%` }}
              animate={{ width: `${(scanStep / 6) * 100}%` }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.3),transparent)] pointer-events-none" />
          </div>

          {/* Elegant Light-Mode Terminal Logs */}
          <div className="w-full bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6 text-left font-mono text-sm shadow-[0_8px_30px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,1)] h-48 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none z-10" />
            <div className="space-y-3 opacity-90 flex flex-col justify-end h-full relative z-0">
              {steps.slice(0, scanStep).map((step: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-[13px]"
                >
                  <span className="text-gray-400">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
                  <span className="text-indigo-500 font-semibold">SYS</span>
                  <span className="text-gray-700">{step.title.toLowerCase().replace(/ /g, '_')}</span>
                  <span className="text-emerald-500 font-bold ml-auto tracking-wider">SUCCESS</span>
                </motion.div>
              ))}
              {scanStep < 6 && (
                <motion.div 
                  animate={{ opacity: [1, 0.4, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="text-gray-400 text-[13px] flex gap-2"
                >
                  <span className="text-indigo-400">❯</span> processing_neural_weights...
                </motion.div>
              )}
            </div>
          </div>

          {scanStep === 6 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate(`/dashboard?session=${localStorage.getItem('session_id')}`)}
              className="mt-10 px-10 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-full font-bold text-lg shadow-[0_12px_40px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
            >
              Open Intelligence Dashboard <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturePreviewStrip() {
  const features = [
    { title: "Repository MRI", desc: "Understand repository architecture instantly.", icon: <Network /> },
    { title: "Tech Debt Heatmap", desc: "Detect dangerous code before production bugs happen.", icon: <LayoutDashboard /> },
    { title: "Time Machine", desc: "Trace how bugs evolved through git history.", icon: <GitCommit /> },
    { title: "AI Onboarding", desc: "Learn unfamiliar repositories in minutes.", icon: <Server /> },
  ];

  return (
    <section className="py-20 mt-12 relative z-10">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl border-y border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.02)]" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center group cursor-pointer p-6 rounded-[2rem] hover:bg-white/60 transition-colors"
            >
              <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-white to-gray-50 border border-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 group-hover:shadow-[0_12px_30px_rgba(99,102,241,0.2)] group-hover:-translate-y-2 transition-all duration-500 relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-[1.25rem] opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                {React.cloneElement(feature.icon as React.ReactElement, { className: "w-7 h-7" })}
              </div>
              <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 mb-3 tracking-tight">{feature.title}</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[200px]">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



function BottomCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-32 px-6 relative text-center z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,114,182,0.15),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-4xl mx-auto bg-white/40 backdrop-blur-2xl border border-white shadow-[0_20px_60px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] rounded-[3rem] p-16"
      >
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.1]">
          Turn Any Repository Into <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500">Living Intelligence</span>
        </h2>
        <p className="text-xl text-gray-500 mb-12 font-light max-w-2xl mx-auto">
          Experience the world's most advanced repository analysis platform. Powered by IBM Bob.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="px-10 py-5 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-black text-white rounded-full font-bold text-lg shadow-[0_12px_30px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] transition-all duration-300 flex items-center gap-2 group">
            Analyze Repository <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </motion.div>
    </section>
  );
}