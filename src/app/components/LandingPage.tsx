import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Spline from "@splinetool/react-spline";
import { Link } from "react-router";
import {
  Activity,
  ArrowRight,
  Box,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FileCode2,
  GitBranch,
  GitCommit,
  GitMerge,
  Layers,
  LayoutDashboard,
  Network,
  RefreshCcw,
  Search,
  Server,
  Zap,
} from "lucide-react";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <TechStrip />
      <FeaturesShowcase />
      <HowItWorks />
      <SystemVisualization />
      <TimeMachineDebugger />
      <FinalCTA />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#D3D3D3] pt-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
      >
        <iframe
          src="https://my.spline.design/johnnyv-FVwaNzPklfC8n90gbRD8FVlG/"
          title="3D Robot - CodePulse AI"
          loading="lazy"
          className="h-full w-full border-none"
          allow="autoplay; fullscreen"
        />
        {/* Spline logo hider */}
        <div className="absolute bottom-0 right-0 w-48 h-16 bg-[#D3D3D3] z-10 pointer-events-auto cursor-default" />
      </motion.div>

      <div 
        className="absolute inset-y-0 left-0 w-full lg:w-[55%] z-10" 
        style={{ background: 'rgba(255, 255, 255, 0.005)', pointerEvents: 'auto' }} 
      />

      <div className="relative z-20 flex min-h-screen items-center px-8 md:px-16 lg:px-24 pointer-events-none -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl relative pointer-events-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-8"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 drop-shadow-sm">
              Understand Any<br />
              Codebase in Minutes
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl leading-relaxed text-gray-800 max-w-xl font-light"
          >
            Deep architectural intelligence that maps, analyzes, and decodes complex repositories instantly.
          </motion.p>
        </motion.div>
      </div>


    </section>
  );
}

function TechStrip() {
  const technologies = [
    { name: "IBM Bob Analyst", icon: <Cpu className="w-5 h-5" /> },
    { name: "Real-time Architecture MRI", icon: <Network className="w-5 h-5" /> },
    { name: "Semantic Code Search", icon: <Search className="w-5 h-5" /> },
    { name: "Tech Debt Heatmaps", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Automated Dependency Mapping", icon: <Layers className="w-5 h-5" /> },
    { name: "Time Machine Debugger", icon: <GitCommit className="w-5 h-5" /> },
    { name: "Intelligent Refactor Plans", icon: <Zap className="w-5 h-5" /> },
    { name: "GitHub Integration", icon: <GitBranch className="w-5 h-5" /> }
  ];

  return (
    <section className="relative py-8 overflow-hidden bg-white/60 backdrop-blur-xl border-y border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] z-30">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#FAFBFC] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#FAFBFC] to-transparent z-10" />
      
      <div className="flex gap-16 animate-scroll whitespace-nowrap">
        {[...technologies, ...technologies, ...technologies].map((tech: any, i: number) => (
          <div
            key={i}
            className="flex items-center gap-3 text-gray-500 font-semibold tracking-wide hover:text-purple-600 transition-colors duration-300"
          >
            {tech.icon}
            <span className="text-sm uppercase tracking-wider">{tech.name}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </section>
  );
}

function FeaturesShowcase() {
  const features = [
    {
      title: "Repository MRI Scan",
      description: "Deep structural analysis revealing hidden patterns, dependencies, and architectural decisions across your entire codebase.",
      icon: <Network className="w-8 h-8 text-indigo-500" />,
      gradient: "from-indigo-50 to-blue-50/50",
      accent: "bg-indigo-500",
      metrics: { label: "Nodes", value: "1.2M+" }
    },
    {
      title: "Tech Debt Heatmap",
      description: "Visualize code quality distribution and track debt accumulation over time with stunning 3D heatmaps.",
      icon: <LayoutDashboard className="w-8 h-8 text-purple-500" />,
      gradient: "from-purple-50 to-pink-50/50",
      accent: "bg-purple-500",
      metrics: { label: "Issues", value: "842" }
    },
    {
      title: "Time Machine Debugger",
      description: "Trace bug origins through commit history, and understand exactly how and when issues emerged.",
      icon: <GitCommit className="w-8 h-8 text-rose-500" />,
      gradient: "from-rose-50 to-orange-50/50",
      accent: "bg-rose-500",
      metrics: { label: "Commits", value: "45K" }
    },
    {
      title: "Scale Failure Simulator",
      description: "Predict system behavior under load and simulate infrastructure stress scenarios before they happen.",
      icon: <Server className="w-8 h-8 text-emerald-500" />,
      gradient: "from-emerald-50 to-teal-50/50",
      accent: "bg-emerald-500",
      metrics: { label: "Sims", value: "10K/s" }
    }
  ];

  return (
    <section id="features" className="relative px-6 py-32 overflow-hidden bg-[#FAFBFC]">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-purple-200/40 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-blue-200/40 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 opacity-60 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm mb-6">
            <Box className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold tracking-widest text-gray-900 uppercase">Core Platform</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            Intelligence <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">Redefined</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light">
            We don't just search your code. We build a semantic understanding of your entire engineering organization.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
            >
              <div className="relative h-full rounded-[2.5rem] bg-white border border-gray-100 p-10 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    
                    <div className="px-4 py-2 bg-white/90 backdrop-blur rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${feature.accent} animate-pulse`} />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{feature.metrics.label}</span>
                      <span className="text-sm font-bold text-gray-900">{feature.metrics.value}</span>
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-lg mb-8 flex-grow font-light">
                    {feature.description}
                  </p>
                  

                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Connect Repository",
      description: "Secure OAuth integration with GitHub, GitLab, or Bitbucket.",
      stat: "2.4s Average Connect Time"
    },
    {
      title: "Deep Semantic Scan",
      description: "IBM Bob parses ASTs, resolves dependencies, and maps architecture.",
      stat: "100k lines/sec processed"
    },
    {
      title: "Query & Visualize",
      description: "Ask natural language questions. Get highly precise visual answers.",
      stat: "Zero configuration needed"
    }
  ];

  return (
    <section id="how-it-works" className="relative px-6 py-32 overflow-hidden bg-white">
      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Three steps to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">total clarity.</span>
            </h2>
            <p className="text-xl text-gray-500 mb-12 font-light">
              We eliminated the setup process. No agents to install, no config files to write. Just connect and understand.
            </p>

            <div className="space-y-12">
              {steps.map((step: any, index: number) => (
                <div key={index} className="relative pl-10 group">
                  {index !== steps.length - 1 && (
                    <div className="absolute left-[15px] top-10 bottom-[-40px] w-0.5 bg-gradient-to-b from-purple-200 to-transparent" />
                  )}
                  
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-4 border-purple-100 flex items-center justify-center shadow-sm z-10 group-hover:border-purple-300 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-lg text-gray-500 mb-4 font-light">{step.description}</p>
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50/50 rounded-lg border border-purple-100/50">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">{step.stat}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[600px] w-full rounded-[2.5rem] bg-[#FAFBFC] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-8 overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/40 via-purple-50/20 to-transparent blur-2xl" />
            
            <div className="relative z-10 h-full flex flex-col items-center justify-center space-y-6">
              <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl bg-white/80">
                <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-4 text-xs font-mono text-gray-400">terminal - scan</span>
                </div>
                <div className="p-5 font-mono text-sm text-gray-600 space-y-3">
                  <p className="text-purple-600">$ codepulse connect org/core</p>
                  <p className="text-gray-400">Authenticating with GitHub...</p>
                  <p className="text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Connected</p>
                  <p className="text-gray-400">Parsing ASTs on 4,201 files...</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              <motion.div 
                className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl p-5 flex items-center justify-between"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Architecture Graph</p>
                    <p className="text-xs text-gray-400">12 microservices mapped</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">Ready</div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function SystemVisualization() {
  return (
    <section id="system-visualization" className="relative px-6 py-32 overflow-hidden bg-[#FAFBFC] text-gray-900 border-y border-white shadow-[0_0_40px_rgba(0,0,0,0.02)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">Live Rendering</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900">
            Software MRI Scanner
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
            Watch as your repository's exact structural DNA is rendered in real-time, mapping every dependency and risk zone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-[700px] w-full rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden flex"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-90 pointer-events-none">
             <Spline 
              scene="https://prod.spline.design/XUBXQ59rpiXln8A4/scene.splinecode" 
              className="w-full h-full scale-[1.2]"
              style={{ pointerEvents: 'none' }}
            />
          </div>

          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
            <div className="flex justify-between items-start">
              <div className="bg-white/80 backdrop-blur-xl border border-gray-100 p-4 rounded-2xl shadow-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-bold">Scanning Target</p>
                <p className="text-sm font-mono text-gray-800 flex items-center gap-2 font-semibold">
                  <FileCode2 className="w-4 h-4 text-blue-500" />
                  github.com/org/core-backend
                </p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl border border-gray-100 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">System Optimal</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl">
              {[
                { val: "1.2M", label: "Lines of Code", color: "blue" },
                { val: "842", label: "Tech Debt Issues", color: "purple" },
                { val: "0", label: "Critical Risk", color: "pink" }
              ].map((stat: any, i: number) => (
                <div key={i} className="bg-white/90 backdrop-blur-xl border border-gray-100 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}-500`} />
                  <p className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{stat.val}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TimeMachineDebugger() {
  const commits = [
    { hash: "8f4a2b1", author: "Sarah Chen", date: "2 hours ago", desc: "Refactor payment gateway webhook", risk: "high", status: "Critical" },
    { hash: "3c9d7e4", author: "Alex K.", date: "5 hours ago", desc: "Update Redis caching strategy", risk: "medium", status: "Warning" },
    { hash: "1a5b8f2", author: "System Bot", date: "1 day ago", desc: "Automated dependency updates", risk: "low", status: "Safe" },
  ];

  return (
    <section id="time-machine" className="relative px-6 py-32 overflow-hidden bg-white">
      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 mb-6 w-max">
              <RefreshCcw className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold tracking-widest text-rose-700 uppercase">Historical Tracing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Time Machine Debugger
            </h2>
            <p className="text-xl text-gray-500 mb-8 font-light">
              Stop guessing when a bug was introduced. We instantly trace any error back to its exact origin commit by analyzing logical mutations over time.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAFBFC] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Semantic Regression Search</h4>
                  <p className="text-sm text-gray-500 font-light">Find exactly when a specific behavior changed, not just text.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAFBFC] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-pink-600">
                  <GitMerge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Blame Evolution</h4>
                  <p className="text-sm text-gray-500 font-light">Visualize how a complex bug evolved across multiple PRs.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-100/50 to-blue-100/50 rounded-[2.5rem] blur-3xl opacity-60" />
            <div className="relative bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Timeline Analysis</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1 bg-gray-50 px-2 py-1 rounded-md inline-block">Target: src/services/payment.ts</p>
                </div>
                <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-xs font-bold flex items-center gap-2 border border-rose-100">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Bug Origin Found
                </div>
              </div>

              <div className="space-y-4">
                {commits.map((commit: any, i: number) => (
                  <div 
                    key={i} 
                    className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                      commit.risk === 'high' 
                        ? 'bg-gradient-to-r from-rose-50/50 to-transparent border-rose-100 shadow-sm scale-[1.02]' 
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-gray-800 bg-gray-100/50 px-2 py-1 rounded">{commit.hash}</span>
                        <span className="text-xs text-gray-400 font-medium">{commit.date}</span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        commit.risk === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        commit.risk === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {commit.status}
                      </span>
                    </div>
                    <p className={`text-sm ${commit.risk === 'high' ? 'text-rose-900 font-medium' : 'text-gray-500 font-light'}`}>
                      {commit.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50/50 via-white to-white" />
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.1]">
            Ready to decode your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">entire architecture?</span>
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto font-light">
            Join elite engineering teams who stopped guessing and started knowing. Connect your repo in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/scan" className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:shadow-xl flex items-center gap-2">
              Start Free Scan <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-full font-bold text-lg transition-all border border-gray-200 shadow-sm flex items-center gap-2">
              View Interactive Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}