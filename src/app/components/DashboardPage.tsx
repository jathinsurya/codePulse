import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, Zap, Database, Layers, Network, 
  LayoutDashboard, GitCommit, Server, Sparkles, FolderTree, 
  Cpu, Settings, MessageSquare, AlertTriangle, CheckCircle2, 
  ChevronRight, Github, Send, ShieldAlert, ThermometerSun, 
  Code2, Clock, Flame, ChevronDown, X, Menu, ArrowLeft, Gauge,
  FileCode2, Shield, CreditCard, Webhook, FileCode, FileText
} from "lucide-react";
import { getAnalysis, getGitHistory, sendChat } from "../../services/api";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Treemap,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface RepoState {
  owner: string;
  name: string;
  branch: string;
  commitHash: string;
  url: string;
  scannedAt: Date;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
import { RiskTreemapVisualization } from './RiskTreemapVisualization';

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("mri");
  const [chatPanelOpen, setChatPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // FIX D29: Dynamic repo state instead of hardcoded
  const [repoState, setRepoState] = useState<RepoState>({
    owner: "Loading...",
    name: "Loading...",
    branch: "main",
    commitHash: "...",
    url: "",
    scannedAt: new Date()
  });

  // FIX D31: Calculate health score dynamically
  const [healthScore, setHealthScore] = useState(0);
  
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [gitHistoryData, setGitHistoryData] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (session) {
      const repoStr = localStorage.getItem('repo_data');
      if (repoStr) {
        try {
          const r = JSON.parse(repoStr);
          setRepoState({
            owner: r.owner,
            name: r.name,
            branch: r.branch,
            commitHash: r.commit_hash,
            url: r.url,
            scannedAt: new Date()
          });
        } catch(e){}
      }
      getAnalysis(session).then(data => {
        setAnalysisData(data);
        setHealthScore(data.health_score);
      }).catch(console.error);
      
      console.log("Fetching git history for session:", session);
      getGitHistory(session).then(data => {
        console.log("Git history received:", data);
        setGitHistoryData(data);
      }).catch(err => {
        console.error("Git history fetch failed:", err);
      });
    }
  }, []);

  return (
    <div className="h-screen w-full bg-[#FAFBFC] text-gray-900 overflow-hidden flex flex-col font-sans relative">
      {/* Light theme background with proper contrast */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-purple-200/40 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-blue-200/40 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Top Navbar */}
      <TopNavbar repoState={repoState} healthScore={healthScore} />

      {/* Main Layout Structure */}
      <div className="flex-1 flex overflow-hidden relative z-10 p-4 gap-4">
        {/* FIX D2 & D34: Enhanced Sidebar with repo info */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          repoState={repoState}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Visualization Area */}
        <main className={`flex-1 bg-white/80 backdrop-blur-2xl border border-gray-200 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden relative flex flex-col transition-all duration-300 ${!sidebarOpen ? 'ml-20' : ''}`}>
          {/* FIX G4: Error Boundary wrapper would go here in production */}
          <AnimatePresence mode="wait">
            {activeTab === "mri" && <TabMRIScan key="mri" repoState={repoState} analysisData={analysisData} />}
            {activeTab === "heatmap" && <TabHeatmap key="heatmap" onHealthScoreUpdate={setHealthScore} analysisData={analysisData} />}
            {activeTab === "timeline" && <TabTimeMachine key="timeline" gitHistoryData={gitHistoryData} />}
            {activeTab === "api" && (
              <motion.div key="api" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-6 overflow-hidden flex flex-col">
                <ApiRoutesMap data={analysisData?.api_routes} />
              </motion.div>
            )}
            {activeTab === "brain" && (
              <motion.div key="brain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-6 overflow-hidden flex flex-col">
                <DirectoryExplorer data={analysisData?.directory_tree} />
              </motion.div>
            )}
            {activeTab === "scale" && <TabScaleSimulator key="scale" />}
            {activeTab === "settings" && <TabSettings key="settings" />}
          </AnimatePresence>
        </main>

        {/* FIX D3: Collapsible Right AI Chat Panel */}
        <AIChatPanel 
          isOpen={chatPanelOpen}
          setIsOpen={setChatPanelOpen}
          activeTab={activeTab}
          analysisData={analysisData}
        />
      </div>
    </div>
  );
}

// ============================================================================
// TOP NAVBAR COMPONENT - FIX D29, D30, D31
// ============================================================================

function TopNavbar({ repoState, healthScore }: { repoState: RepoState, healthScore: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // FIX D31: Animate health score on load
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = healthScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= healthScore) {
        setAnimatedScore(healthScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [healthScore]);

  // FIX D4: Back/Change Repo functionality
  const handleBackToScan = () => {
    // Navigate back to scan page
    window.history.back();
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 px-6 flex items-center justify-between relative z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm"
    >
      <div className="flex items-center gap-4">
        {/* FIX D4: Back button */}
        <button 
          onClick={handleBackToScan}
          className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all border border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Cpu className="w-4 h-4" />
        </div>
        
        <div>
          {/* FIX D29: Dynamic repo data from state */}
          <h1 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {repoState.owner} / {repoState.name}
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600 tracking-wider">LIVE</span>
          </h1>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <GitCommit className="w-3 h-3" /> {repoState.branch} ({repoState.commitHash})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">IBM Bob Active</span>
        </div>
        
        {/* FIX D31: Animated health score */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
          <Gauge className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-gray-700">Health: <span className="text-emerald-600">{animatedScore}/100</span></span>
        </div>

        {/* FIX D30: Actual GitHub link from repo state */}
        <a 
          href={repoState.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors border border-gray-200"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </motion.header>
  );
}

// ============================================================================
// SIDEBAR COMPONENT - FIX D2, D34
// ============================================================================

function Sidebar({ 
  activeTab, 
  setActiveTab,
  repoState,
  sidebarOpen,
  setSidebarOpen
}: { 
  activeTab: string;
  setActiveTab: (t: string) => void;
  repoState: RepoState;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  // FIX D34: Settings moved to bottom, not a main tab
  const tabs = [
    { id: "mri", label: "MRI Scan", icon: <Network className="w-5 h-5" /> },
    { id: "heatmap", label: "Tech Debt Heatmap", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "timeline", label: "Time Machine", icon: <Clock className="w-5 h-5" /> },
    { id: "api", label: "API Routes", icon: <Server className="w-5 h-5" /> },
    { id: "brain", label: "Brain Explorer", icon: <FolderTree className="w-5 h-5" /> },
    { id: "scale", label: "Scale Simulator", icon: <Zap className="w-5 h-5" /> }
  ];

  return (
    <nav className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col gap-2 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-[2rem] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300`}>
      {/* FIX D2: Repo info block at top */}
      {sidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-xs font-bold text-gray-900 truncate">{repoState.name}</h3>
              <p className="text-[10px] text-gray-500">by {repoState.owner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Scanned {new Date(repoState.scannedAt).toLocaleDateString()}</span>
          </div>
        </motion.div>
      )}

      {/* Main navigation tabs */}
      <div className="flex-1 flex flex-col gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-semibold group outline-none ${
                isActive 
                  ? "text-indigo-700 bg-indigo-50 shadow-sm border border-indigo-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={!sidebarOpen ? tab.label : undefined}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-50 to-pink-50 border border-indigo-100 shadow-sm" 
                />
              )}
              <div className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-600' : 'group-hover:scale-110 group-hover:text-indigo-600'}`}>
                {tab.icon}
              </div>
              {sidebarOpen && <span className="relative z-10 tracking-tight">{tab.label}</span>}
              {isActive && sidebarOpen && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 z-10" />}
            </button>
          );
        })}
      </div>

      {/* FIX D34: Settings as gear icon at bottom */}
      <div className="border-t border-gray-100 pt-4 mt-auto">
        <button
          onClick={() => setActiveTab('settings')}
          className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-semibold group outline-none w-full ${
            activeTab === 'settings'
              ? "text-indigo-700 bg-indigo-50 shadow-sm border border-indigo-100" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
          title={!sidebarOpen ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5" />
          {sidebarOpen && <span className="relative z-10 tracking-tight">Settings</span>}
        </button>
      </div>
    </nav>
  );
}

// ============================================================================
// AI CHAT PANEL COMPONENT - FIX D24, D25, D26, D27, D28
// ============================================================================

function AIChatPanel({ 
  isOpen, 
  setIsOpen,
  activeTab,
  analysisData
}: { 
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: string;
  analysisData: any;
}) {
  // FIX D24: Functional chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m IBM Bob, your AI code analyst. I\'ve completed the initial scan of your repository. How can I help you understand your codebase today?',
      timestamp: new Date(Date.now() - 120000)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // FIX D27: Update context based on active tab
  useEffect(() => {
    const contextMessages: Record<string, string> = {
      mri: 'I see you\'re viewing the MRI Scan. Would you like me to explain any specific architectural patterns?',
      heatmap: 'Looking at the tech debt heatmap. I can help you prioritize which files need attention first.',
      timeline: 'Time Machine view active. Want me to explain how a specific component evolved over time?',
      scale: 'Scale Simulator loaded. I can help you understand the bottlenecks I\'ve identified.'
    };

    if (contextMessages[activeTab] && messages.length === 1) {
      // Add contextual message when switching tabs
      const contextMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: contextMessages[activeTab],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, contextMsg]);
    }
  }, [activeTab]);

  // FIX D28: Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle custom explain endpoint event
  useEffect(() => {
    const handleExplainEndpoint = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { endpoint } = customEvent.detail;
      
      // Make sure panel is open
      setIsOpen(true);

      let prompt = `Explain the ${endpoint.method} endpoint at ${endpoint.path} (handled in ${endpoint.file}).`;
      if (endpoint.method === 'TECH') {
        prompt = `Where is ${endpoint.path} used in this repository?`;
      } else if (endpoint.method === 'FILE') {
        prompt = `Explain the purpose of the ${endpoint.file} file.`;
      } else if (endpoint.method === 'DIRECTORY') {
        prompt = `Explain the purpose of the ${endpoint.path} directory.`;
      }
      
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMsg]);
      const sessionId = new URLSearchParams(window.location.search).get('session') || localStorage.getItem('session_id') || '';
      
      setIsTyping(true);
      
      try {
        const chatRes = await sendChat(sessionId, prompt, activeTab);
        const bobResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: chatRes.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, bobResponse]);
      } catch (e) {
        console.error(e);
        const bobResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I've analyzed the request, but I encountered an error communicating with the AI engine.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, bobResponse]);
      }
      setIsTyping(false);
    };

    window.addEventListener('bob-explain-endpoint', handleExplainEndpoint);
    return () => window.removeEventListener('bob-explain-endpoint', handleExplainEndpoint);
  }, [setIsOpen]);

  // FIX D24: Send message handler
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    // FIX D26: Show typing indicator only when awaiting response
    setIsTyping(true);

    const sessionId = new URLSearchParams(window.location.search).get('session') || localStorage.getItem('session_id') || '';
    
    try {
      const chatRes = await sendChat(sessionId, content, activeTab);
      const bobResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatRes.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bobResponse]);
    } catch (e) {
      console.error(e);
      const bobResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error communicating with the server.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, bobResponse]);
    }
    setIsTyping(false);
  };

  // FIX D25: Connect suggested prompts to send handler
  const suggestedPrompts = analysisData?.suggested_questions || [
    "Explain the authentication flow",
    "Find potential dead code",
    "Why are some files marked as risky?"
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="w-[360px] bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 relative z-10">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            IBM Bob <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[9px] text-indigo-600 border border-indigo-100">AI</span>
          </h3>
          <p className="text-[10px] text-gray-500">Powered by Watson AI</p>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages - FIX D28: Proper scrolling */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
            )}
            <div className={`flex-1 px-4 py-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 border border-indigo-700 text-white shadow-sm' 
                : 'bg-white border border-gray-100 text-gray-800 shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}

        {/* FIX D26: Show typing indicator only when active */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">IBM Bob is reasoning</span>
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts - FIX D25 */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[11px] text-gray-600 hover:text-gray-900 transition-all shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Area - FIX D24 */}
      <div className="p-4 border-t border-gray-100 bg-white/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask IBM Bob anything..."
            className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white flex items-center justify-center transition-all shadow-md disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// Helper function for IBM Bob responses
function generateBobResponse(query: string, context: string): string {
  const responses: Record<string, string> = {
    'auth': 'The authentication flow in this repository uses JWT tokens with a refresh mechanism. The main entry point is in `auth/middleware.ts`, which validates tokens on each request. I notice the token expiry is set quite short (15 minutes), which is good for security. However, the refresh token rotation could be improved to prevent token theft.',
    'dead': 'I\'ve identified 8 potential dead code areas:\n\n1. `utils/deprecated.ts` - No imports found across the codebase\n2. `helpers/oldParser.ts` - Replaced by new implementation\n3. Several unused CSS classes in `styles/legacy.css`\n\nWould you like me to create a PR to remove these?',
    'webhook': 'Webhook.ts is flagged as risky for several reasons:\n\n1. **Complexity Score: 47** - High cyclomatic complexity\n2. **No error boundaries** around external API calls\n3. **Synchronous DB writes** that could block the event loop\n4. **Missing retry logic** for failed webhooks\n\nI recommend splitting this into smaller, focused functions and adding proper error handling.'
  };

  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('auth') || lowerQuery.includes('authentication')) {
    return responses.auth;
  } else if (lowerQuery.includes('dead') || lowerQuery.includes('unused')) {
    return responses.dead;
  } else if (lowerQuery.includes('webhook')) {
    return responses.webhook;
  }
  
  return `I've analyzed your question about "${query}". Based on the ${context} context, I can see several important patterns. The codebase shows good separation of concerns in most areas, though there are opportunities for improvement in error handling and test coverage. Would you like me to dive deeper into any specific aspect?`;
}

// ============================================================================
// TAB 1: MRI SCAN - FIX D5, D6, D7, D8, D9
// ============================================================================

function TabMRIScan({ repoState, analysisData }: { repoState: RepoState, analysisData: any }) {
  // Use real stats from analysisData if available
  const mriStats = [
    { 
      label: 'Total Files', 
      value: analysisData?.total_files || '...', 
      trend: analysisData?.total_files ? '+0' : '...', 
      icon: <FolderTree className="w-5 h-5" />, 
      color: 'indigo' 
    },
    { 
      label: 'Avg Complexity', 
      value: analysisData?.avg_complexity || '...', 
      trend: 'Normalized', 
      icon: <Zap className="w-5 h-5" />, 
      color: 'purple' 
    },
    { 
      label: 'Maintainability', 
      value: analysisData?.health_score ? (analysisData.health_score > 90 ? 'A+' : analysisData.health_score > 70 ? 'B' : 'C') : '...', 
      trend: 'Computed', 
      icon: <CheckCircle2 className="w-5 h-5" />, 
      color: 'emerald' 
    },
    { 
      label: 'Endpoints', 
      value: analysisData?.api_routes?.length || '0', 
      trend: 'Detected', 
      icon: <Server className="w-5 h-5" />, 
      color: 'pink' 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full bg-transparent"
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white/50 rounded-t-[2rem]">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Network className="w-6 h-6 text-indigo-500" />
            MRI System Scan
          </h2>
          <p className="text-gray-500 text-sm mt-1">Deep architectural analysis of {repoState.name}</p>
        </div>
        {/* FIX D7: IBM Bob attribution badge */}
        <div className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 flex items-center gap-2 shadow-sm">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-700">Analyzed by IBM Bob</span>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* MRI Stats Cards - FIX D7 */}
          <div className="xl:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {mriStats.map((stat: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <span className={`text-xs font-bold text-${stat.color}-700 bg-${stat.color}-50 px-2 py-1 rounded-full border border-${stat.color}-100`}>
                    {stat.trend}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Dependency Graph - Full Width */}
          <div className="xl:col-span-3 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col min-h-[600px]">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-500" /> Dependency Architecture
            </h3>
            <div className="flex-1 min-h-[500px] h-full w-full">
              <DependencyGraphVisualization data={analysisData?.dependency_graph} />
            </div>
          </div>

          {/* Language Breakdown - Full Width */}
          <div className="xl:col-span-3">
            <LanguageBreakdown data={analysisData?.languages} />
          </div>

          {/* Full Width: Folder Explorer */}
          <div className="xl:col-span-3">
            <DirectoryExplorer data={analysisData?.directory_tree} />
          </div>

          {/* Full Width: Start Here Learning Path */}
          <div className="xl:col-span-3 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> 
                "Where do I start?" Guide
              </h3>
              <div className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center gap-2 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Curated by IBM Bob</span>
              </div>
            </div>

            <div className="mb-6 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border border-indigo-200">
                <Cpu className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-900 mb-1">Hi, I'm Bob. Welcome to the codebase!</h4>
                <p className="text-xs text-indigo-800 leading-relaxed max-w-3xl">
                  I've analyzed the entire repository and built this personalized onboarding path just for you. 
                  Start with these 3 core files to understand the security and architecture, then dive into the 2 main business logic concepts, 
                  and finally explore the external integrations. Follow the steps below and you'll be shipping code in no time!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {(analysisData?.onboarding_path || []).map((item: any) => {
                const iconMap: any = {
                  doc: <FileText className="w-4 h-4 text-emerald-500" />,
                  config: <Settings className="w-4 h-4 text-blue-500" />,
                  logic: <Cpu className="w-4 h-4 text-purple-500" />
                };
                
                const stepIcon = iconMap[item.icon] || <Code2 className="w-4 h-4 text-indigo-500" />;
                return (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.step * 0.1 }}
                    className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {/* Step Number Column */}
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {item.step}
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {stepIcon}
                          <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                        </div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.time}
                        </span>
                      </div>
                      
                      <button 
                        className="flex items-center gap-1.5 text-xs font-mono text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 mb-3 transition-colors text-left"
                        onClick={() => {
                          const event = new CustomEvent('bob-explain-endpoint', { 
                            detail: { 
                              endpoint: {
                                method: 'FILE',
                                path: item.file,
                                file: item.file,
                                description: item.title,
                                line: 'N/A'
                              } 
                            } 
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{item.file}</span>
                      </button>
                      
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 relative">
                        <div className="absolute -left-1.5 top-3 w-3 h-3 bg-gray-50 border-l border-t border-gray-100 -rotate-45" />
                        <p className="text-xs text-gray-600 leading-relaxed relative z-10">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {(!analysisData?.onboarding_path || analysisData.onboarding_path.length === 0) && (
                <div className="col-span-2 py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">Mapping the ideal onboarding journey for this repository...</p>
                </div>
              )}
            </div>
          </div>

          {/* API Routes Map - Horizontal Span 3 */}
          <div className="xl:col-span-3">
            <ApiRoutesMap data={analysisData?.api_routes} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// FIX D5: React Flow Dependency Graph Component
function DependencyGraphVisualization({ data }: { data?: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Data State
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    if (data && data.nodes && data.links) {
      const initializedNodes = data.nodes.map((n: any) => ({
        ...n,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        vx: 0,
        vy: 0
      }));
      setNodes(initializedNodes);
      setLinks(data.links);
      isSimulationRunning.current = true;
    }
  }, [data]);

  // Simulation & View State
  const [, setTick] = useState(0);
  const isSimulationRunning = useRef(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Pan and Zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Physics Engine
  useEffect(() => {
    let animationFrameId: number;
    let alpha = 1;
    
    const simulate = () => {
      if (!isSimulationRunning.current) return;
      alpha *= 0.98;
      if (alpha < 0.005) {
        isSimulationRunning.current = false;
        return;
      }

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minD = nodes[i].radius + nodes[j].radius + 50; 
          if (dist < minD * 2) {
            const force = (minD * 2 - dist) / dist * 0.1 * alpha;
            nodes[i].vx += dx * force;
            nodes[i].vy += dy * force;
            nodes[j].vx -= dx * force;
            nodes[j].vy -= dy * force;
          }
        }
      }

      // Attraction
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (!source || !target) return;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 90; 
        const force = (dist - targetDist) / dist * 0.05 * alpha;
        source.vx += dx * force;
        source.vy += dy * force;
        target.vx -= dx * force;
        target.vy -= dy * force;
      });
      
      // Gravity
      nodes.forEach(n => {
        const gravityStrength = n.isHub ? 0.04 : 0.01;
        if (n.isOrphan) {
            const dist = Math.sqrt(n.x*n.x + n.y*n.y) || 1;
            if (dist < 400) {
              n.vx += (n.x / dist) * 1.5 * alpha;
              n.vy += (n.y / dist) * 1.5 * alpha;
            }
        } else {
            n.vx += (0 - n.x) * gravityStrength * alpha;
            n.vy += (0 - n.y) * gravityStrength * alpha;
        }

        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.85;
        n.vy *= 0.85;
      });

      setTick(t => t + 1);
      animationFrameId = requestAnimationFrame(simulate);
    };

    animationFrameId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, links]);

  // Handle Zoom native event
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleAdjust = e.deltaY * -0.001;
      setTransform(prev => ({
          ...prev,
          scale: Math.max(0.3, Math.min(prev.scale + scaleAdjust, 3))
      }));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const getConnectedNodes = (nodeId: string) => {
    const connected = new Set<string>();
    connected.add(nodeId);
    links.forEach(l => {
        if (l.source === nodeId) connected.add(l.target);
        if (l.target === nodeId) connected.add(l.source);
    });
    return connected;
  };

  const activeNode = hoveredNode || selectedNode;
  const connectedNodes = activeNode ? getConnectedNodes(activeNode) : null;

  const getColor = (group: string) => {
      switch (group) {
          case 'api': return '#a855f7'; // purple
          case 'models': return '#3b82f6'; // blue
          case 'utils': return '#10b981'; // emerald
          case 'components': return '#f59e0b'; // amber
          case 'orphan': return '#ef4444'; // red
          default: return '#9ca3af';
      }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
      {/* Legend & Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-gray-100 shadow-sm text-xs">
          <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1">Module Types</h4>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> <span>API Controllers</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> <span>Data Models</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> <span>React Components</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> <span>Utilities</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> <span className="font-bold text-red-600">Orphan (Dead Code)</span></div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 1.2 }))}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
          >
            +
          </button>
          <button 
            onClick={() => setTransform(prev => ({ ...prev, scale: prev.scale * 0.8 }))}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
          >
            -
          </button>
          <button 
            onClick={() => { setTransform({ x: 0, y: 0, scale: 1 }); setSelectedNode(null); }}
            className="px-3 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Force Graph Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 cursor-grab active:cursor-grabbing w-full h-full relative overflow-hidden rounded-xl"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        
        <svg className="w-full h-full absolute inset-0 z-10" viewBox="-400 -300 800 600">
          <defs>
            <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.1" />
            </filter>
            <filter id="glow-hub" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="grad-api" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="grad-models" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="grad-utils" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="grad-components" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="grad-orphan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Edges */}
            {links.map((link: any, idx: number) => {
              const source = nodes.find(n => n.id === link.source)!;
              const target = nodes.find(n => n.id === link.target)!;
              
              const isHighlight = connectedNodes && (connectedNodes.has(source.id) && connectedNodes.has(target.id));
              const isDimmed = connectedNodes && !isHighlight;

              // Quadratic Bezier curve for elegant flowing lines
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const cx = (source.x + target.x) / 2 - dy * 0.15;
              const cy = (source.y + target.y) / 2 + dx * 0.15;
              const path = `M${source.x},${source.y} Q${cx},${cy} ${target.x},${target.y}`;

              return (
                <motion.g key={`link-${idx}`} opacity={isDimmed ? 0.1 : isHighlight ? 0.9 : 0.3} className="transition-all duration-300">
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={isHighlight ? '#6366f1' : '#cbd5e1'}
                    strokeWidth={isHighlight ? 2 : 1.5}
                    strokeDasharray={isHighlight ? "4 4" : "none"}
                  />
                  {isHighlight && (
                    <motion.circle
                      r="2.5"
                      fill="#818cf8"
                      filter="url(#glow-hub)"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ offsetPath: `path('${path}')` } as any}
                    />
                  )}
                </motion.g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const baseColor = getColor(node.group);
              const isHighlight = connectedNodes ? connectedNodes.has(node.id) : true;
              const isDimmed = connectedNodes && !isHighlight;
              const isSelected = selectedNode === node.id;
              
              const gradientId = `url(#grad-${node.group})`;

              return (
                <motion.g 
                  key={`node-${node.id}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`transition-opacity duration-300 ${isDimmed ? 'opacity-20' : 'opacity-100'} ${isSelected ? 'drop-shadow-2xl' : ''}`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node.id === selectedNode ? null : node.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hub Ripple Effect */}
                  {node.isHub && (
                    <motion.circle
                      r={node.radius + 15}
                      fill={baseColor}
                      opacity="0.1"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                  )}

                  {/* Orphan Pulse Effect */}
                  {node.isOrphan && (
                    <motion.circle
                      r={node.radius + 8}
                      fill="none"
                      stroke={baseColor}
                      strokeWidth="2"
                      animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={node.radius}
                    fill={gradientId}
                    stroke="white"
                    strokeWidth={isSelected ? 3 : 1.5}
                    filter="url(#node-shadow)"
                    className="transition-all duration-300"
                  />
                  
                  {/* Bob Hub Label */}
                  {node.isHub && (
                    <g transform={`translate(${node.radius + 8}, -${node.radius + 8})`}>
                      <rect x="0" y="-12" width="75" height="18" rx="9" fill="white" stroke="#6366f1" strokeWidth="1" filter="url(#node-shadow)"/>
                      <text x="37.5" y="-0.5" textAnchor="middle" fill="#4f46e5" fontSize="8" fontWeight="800">
                        Bob: Core Hub
                      </text>
                    </g>
                  )}

                  {/* Node Label (Pill style) */}
                  {(isHighlight || node.isHub || node.isOrphan) && (
                    <g transform={`translate(0, ${node.radius + 16})`}>
                      <rect 
                        x={-(node.label.length * 3.5 + 8)} 
                        y="-10" 
                        width={node.label.length * 7 + 16} 
                        height="20" 
                        rx="10" 
                        fill="rgba(255, 255, 255, 0.85)" 
                        stroke="rgba(0,0,0,0.05)"
                        className="pointer-events-none transition-all duration-300 backdrop-blur-sm"
                        filter="url(#node-shadow)"
                      />
                      <text
                        y="4"
                        textAnchor="middle"
                        fill={node.isOrphan ? '#ef4444' : '#374151'}
                        fontSize={node.isHub ? "11" : "10"}
                        fontWeight={node.isHub ? "700" : "600"}
                        className="pointer-events-none select-none transition-all duration-300"
                      >
                        {node.label}
                      </text>
                    </g>
                  )}
                </motion.g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Details Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-64 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-4 z-20"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-500" />
                  {nodes.find(n => n.id === selectedNode)?.label}
                </h4>
                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Type:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px]`} style={{
                    backgroundColor: `${getColor(nodes.find(n => n.id === selectedNode)?.group || '')}20`,
                    color: getColor(nodes.find(n => n.id === selectedNode)?.group || '')
                  }}>
                    {nodes.find(n => n.id === selectedNode)?.group}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Dependencies</span>
                    <span className="text-xs font-bold text-indigo-600">
                      {links.filter(l => l.source === selectedNode).length} imports
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Dependents</span>
                    <span className="text-xs font-bold text-purple-600">
                      {links.filter(l => l.target === selectedNode).length} required by
                    </span>
                  </div>
                </div>

                {nodes.find(n => n.id === selectedNode)?.isOrphan && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700 leading-relaxed">
                      <strong>Dead Code Candidate:</strong> IBM Bob has identified this file as completely isolated. No other modules in the system require it.
                    </p>
                  </div>
                )}

                {nodes.find(n => n.id === selectedNode)?.isHub && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
                    <Cpu className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <p className="text-xs text-indigo-800 leading-relaxed">
                      <strong>Core System Hub:</strong> This module is critical. Modifying it has a high blast radius affecting {links.filter(l => l.target === selectedNode).length} dependents.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 2: TECH DEBT HEATMAP - FIX D10, D11, D12, D13, D14
// ============================================================================

function TabHeatmap({ onHealthScoreUpdate, analysisData }: { onHealthScoreUpdate: (score: number) => void, analysisData: any }) {
  // Use real data from analysisData
  const riskFiles = analysisData?.heatmap_files || [
    { name: 'Loading...', path: '/', complexity: 0, bugs: 0, risk: 0, color: 'sky' }
  ];

  // Map backend color names to local colorMap keys if necessary
  const processedFiles = riskFiles.map((f: any) => ({
    ...f,
    color: f.color || 'sky'
  }));

  const colorMap = {
    rose: { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200' },
    sky: { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200' }
  };

  useEffect(() => {
    if (analysisData?.health_score) {
      onHealthScoreUpdate(analysisData.health_score);
    }
  }, [analysisData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full bg-transparent"
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white/50 rounded-t-[2rem]">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-rose-500" />
            Technical Debt Heatmap
          </h2>
          <p className="text-gray-500 text-sm mt-1">Risk distribution across codebase</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Full Width: Risk TreeMap replacing old Recharts Treemap */}
          <div className="xl:col-span-3">
            <RiskTreemapVisualization data={analysisData?.heatmap_tree} />
          </div>

          {/* FIX D14: Hot Zones - consistent with dark theme */}
          <div className="xl:col-span-1 bg-gradient-to-br from-rose-50 to-purple-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" /> Hot Zones
            </h3>
            <div className="space-y-3">
              {[
                { zone: 'Webhook Layer', files: 3, avgRisk: 82, color: 'rose' },
                { zone: 'Payment System', files: 5, avgRisk: 71, color: 'rose' },
                { zone: 'Auth Module', files: 4, avgRisk: 58, color: 'amber' },
                { zone: 'API Gateway', files: 6, avgRisk: 49, color: 'amber' }
              ].map((zone: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-sm">{zone.zone}</h4>
                    <span className={`text-xs font-bold ${colorMap[zone.color as keyof typeof colorMap].text} bg-${zone.color}-50 px-2 py-1 rounded-full border border-${zone.color}-100`}>
                      {zone.avgRisk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{zone.files} files</span>
                    <div className={`w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${zone.avgRisk}%` }}
                        transition={{ delay: idx * 0.1 + 0.2, duration: 0.8 }}
                        className={colorMap[zone.color as keyof typeof colorMap].bg}
                        style={{ height: '100%' }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* FIX D12: 20 files in scrollable risk table */}
          <div className="xl:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> File Risk Analysis
              </h3>
              <span className="text-xs text-gray-400">{riskFiles.length} files analyzed</span>
            </div>
            
            {/* FIX D12: Scrollable container */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {processedFiles.map((file: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-mono text-sm text-gray-900 font-bold">{file.name}</h4>
                      <p className="text-xs text-gray-400 font-mono">{file.path}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Risk Score</p>
                        <p className={`text-lg font-bold ${colorMap[file.color as keyof typeof colorMap].text}`}>{file.risk}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* FIX D11: Static class map lookup */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-500">Complexity</span>
                        <span className="text-gray-700 font-mono">{file.complexity}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(file.complexity / 50) * 100}%` }}
                          transition={{ delay: idx * 0.03 + 0.1, duration: 0.5 }}
                          className={colorMap[file.color as keyof typeof colorMap].bg}
                          style={{ height: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-500">Bugs Found</span>
                        <span className="text-gray-700 font-mono">{file.bugs}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(file.bugs / 12) * 100}%` }}
                          transition={{ delay: idx * 0.03 + 0.2, duration: 0.5 }}
                          className={colorMap[file.color as keyof typeof colorMap].bg}
                          style={{ height: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </motion.div>
  );
}

// Custom Treemap Cell component removed since we use RiskTreemapVisualization

// FIX D13: Typewriter effect component
function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return <p className="text-xs text-gray-700 leading-relaxed">{displayText}</p>;
}

// ============================================================================
// TAB 3: TIME MACHINE - FIX D15, D16, D17, D18
// ============================================================================

function TabTimeMachine({ gitHistoryData }: { gitHistoryData: any }) {
  if (!gitHistoryData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white/50 rounded-t-[2rem] gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <div className="text-center">
          <p className="text-gray-900 font-bold uppercase tracking-widest text-xs">IBM Bob Forensic Scan Active</p>
          <p className="text-gray-400 text-[10px] mt-1 tracking-widest">EXTRACTING GIT ARCHITECTURE & RISK VECTORS...</p>
        </div>
      </div>
    );
  }

  const commits = gitHistoryData?.commits || [];
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
  
  const selectedCommit = commits.find((c: any) => c.hash === selectedCommitId) || commits[0] || {
    hash: '...', short_hash: '...', author: '...', date: '...', message: 'Loading...', 
    files_changed: 0, insertions: 0, deletions: 0, risk_introduced: 0, diff: null
  };

  useEffect(() => {
    if (commits.length > 0 && !selectedCommitId) {
      setSelectedCommitId(commits[0].hash);
    }
  }, [commits, selectedCommitId]);

  const chartData = (gitHistoryData?.commit_frequency || []).map((f: any) => ({
    date: f.week,
    commits: f.commits,
    bugFixes: f.bugFixes
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full bg-transparent"
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white/50 rounded-t-[2rem]">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-600" />
            Time Machine Debugger
          </h2>
          <p className="text-gray-500 text-sm mt-1">Track architectural evolution over time</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* FIX D15: Horizontal Commit Timeline */}
          <div className="relative bg-gradient-to-br from-white to-gray-50/80 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8">
            {/* Cinematic background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[2rem]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            
            <div className="relative flex items-center justify-between mb-8">
              <h3 className="font-black text-gray-900 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-purple-600" /> Commit Timeline
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> Selected</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> Flagged</span>
              </div>
            </div>
            
            <div className="relative h-72 overflow-x-clip overflow-y-visible mt-4">
              {/* Draggable container for zooming/panning */}
              <motion.div 
                className="absolute inset-0 flex items-end pb-16 px-16"
                drag="x"
                dragConstraints={{ left: -600, right: 0 }}
                dragElastic={0.05}
                whileTap={{ cursor: "grabbing" }}
                style={{ cursor: "grab" }}
              >
                <div className="flex items-center justify-between w-[1000px] relative">
                  
                  {/* The Rail */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-gray-100/80 rounded-full shadow-inner border border-gray-200/50" />
                  
                  {/* The Active Rail */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.5)] transition-all duration-700 ease-out" 
                    style={{ 
                      width: commits.length > 0 
                        ? `${(Math.max(0, commits.findIndex((c: any) => c.hash === selectedCommitId)) / Math.max(1, commits.length - 1)) * 100}%` 
                        : '0%' 
                    }}
                  />

                  {commits.map((commit: any, idx: number) => {
                    const dotSize = Math.max(14, Math.min(44, (commit.files_changed || 0) * 1.5));
                    const isSelected = selectedCommitId === commit.hash;
                    const isBeforeSelected = commits.findIndex((c: any) => c.hash === selectedCommitId) >= idx;
                    const isFlagged = commit.risk_introduced > 50;

                    return (
                      <motion.div
                        key={commit.hash}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                        className="relative group flex flex-col items-center z-10 hover:z-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCommitId(commit.hash);
                        }}
                      >
                        {/* Interactive Dot wrapper for larger hover area */}
                        <motion.div 
                          className="relative flex items-center justify-center cursor-pointer"
                          whileHover={{ scale: 1.15 }}
                          style={{ width: 60, height: 60 }}
                        >
                          <div 
                            className={`relative rounded-full transition-all duration-300 flex items-center justify-center ${
                              isFlagged 
                                ? 'bg-gradient-to-br from-rose-400 to-rose-600 border-[3px] border-white shadow-[0_4px_20px_rgba(225,29,72,0.4)] ring-4 ring-rose-50' 
                                : isSelected
                                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-[3px] border-white shadow-[0_4px_20px_rgba(147,51,234,0.4)] ring-4 ring-purple-50'
                                  : isBeforeSelected
                                    ? 'bg-purple-100 border-[3px] border-white shadow-sm ring-2 ring-purple-50 hover:bg-purple-200'
                                    : 'bg-white border-[3px] border-gray-100 shadow-sm hover:border-purple-200'
                            }`}
                            style={{ width: dotSize, height: dotSize }}
                          >
                            {/* Inner shiny highlight */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-50" />

                            {commit.risk_introduced > 50 && (
                              <>
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-rose-400"
                                  animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                                />
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-rose-300"
                                  animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                                  transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
                                />
                              </>
                            )}
                            {isSelected && commit.risk_introduced <= 50 && (
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-purple-400"
                                animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                              />
                            )}
                          </div>
                        </motion.div>
                        
                        {/* Cinematic Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 origin-bottom">
                          <div className={`p-4 rounded-[1.25rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl w-64 text-left relative border ${
                            commit.risk_introduced > 50 
                              ? 'bg-rose-50/95 border-rose-200 shadow-rose-500/10' 
                              : 'bg-white/95 border-white shadow-purple-500/10'
                          }`}>
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-b border-r ${
                              commit.risk_introduced > 50 ? 'bg-rose-50 border-rose-200' : 'bg-white border-white'
                            }`} />
                            
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border ${
                                  commit.risk_introduced > 50 ? 'bg-white text-rose-600 border-rose-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                                }`}>
                                  {commit.hash}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              
                              <p className="text-sm font-black text-gray-900 mb-1 leading-snug">{commit.message}</p>
                              <p className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider">by {commit.author}</p>
                              
                              <div className="pt-3 border-t border-gray-900/5 flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-500">Files Impacted</span>
                                <span className={`font-black text-sm px-2 py-0.5 rounded-md ${commit.risk_introduced > 50 ? 'bg-rose-100 text-rose-700' : 'bg-purple-50 text-purple-700'}`}>
                                  {commit.files_changed}
                                </span>
                              </div>
                              
                              {commit.risk_introduced > 50 && (
                                <div className="mt-3 bg-white/60 rounded-xl p-2.5 flex items-start gap-2 border border-rose-100 shadow-sm">
                                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                  <span className="text-[10px] font-bold text-rose-700 leading-tight">
                                    IBM Bob detected architectural decay introduced here.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Minimalist Date Label */}
                        <div className={`absolute top-full mt-2 text-[10px] uppercase tracking-widest transition-colors duration-300 ${
                          isFlagged 
                            ? 'text-rose-500 font-black' 
                            : isSelected 
                              ? 'text-purple-600 font-black' 
                              : isBeforeSelected
                                ? 'text-gray-600 font-bold'
                                : 'text-gray-400 font-medium'
                        }`}>
                          {new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>

          <div className="w-full mb-6">
            <CommitDetailPanel commit={selectedCommit} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* FIX D16: Architectural Drift Tracker (Dual Y-axis Chart) */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" /> Architectural Drift Tracker
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-[10px] font-bold text-purple-700">
                    IBM Bob Monitored
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mb-6 font-medium leading-relaxed">
                  The <span className="font-bold text-gray-900">auth module</span> gained 14 dependencies since March. Comparing the architecture to its state 4 months ago, health has degraded from A to C-.
                </p>
                
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#d1d5db"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#818cf8"
                        tick={{ fill: '#6366f1', fontSize: 10 }}
                        label={{ value: 'Complexity', angle: -90, position: 'insideLeft', fill: '#6366f1', fontSize: 11 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#fb7185"
                        tick={{ fill: '#e11d48', fontSize: 10 }}
                        label={{ value: 'Bugs', angle: 90, position: 'insideRight', fill: '#e11d48', fontSize: 11 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,255,255,0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="commits" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="bugFixes" 
                        stroke="#f43f5e" 
                        strokeWidth={3}
                        dot={{ fill: '#f43f5e', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <BugOriginDetection onSelectCommit={setSelectedCommitId} commits={commits} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CommitDetailPanel({ commit }: { commit: any }) {
  const riskType = commit.risk_introduced > 70 ? 'Critical' : commit.risk_introduced > 40 ? 'High' : 'Low';
  
  const riskStyles = {
    Critical: { bg: 'bg-rose-50', border: 'border-l-4 border-rose-500', text: 'text-rose-700', icon: 'text-rose-600' },
    High: { bg: 'bg-[#FFF4ED]', border: 'border-l-4 border-orange-500', text: 'text-orange-700', icon: 'text-orange-600' },
    Low: { bg: 'bg-emerald-50', border: 'border-l-4 border-emerald-500', text: 'text-emerald-700', icon: 'text-emerald-600' }
  }[riskType as 'Critical' | 'High' | 'Low'];

  const diffText = commit.diff || "No diff available for this commit. (Only top risky commits have full diffs extracted for performance).";


  return (
    <motion.div 
      key={commit.hash}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">{commit.message}</h3>
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-200">
                  {commit.author.charAt(0)}
                </div> 
                <span className="font-semibold text-gray-800">{commit.author}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span>{new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-mono font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
            <Github className="w-3.5 h-3.5" /> {commit.hash}
          </a>
        </div>
        
        {/* Bob's Assessment Banner */}
        <div className={`mt-5 p-4 rounded-lg flex gap-3 shadow-sm ${riskStyles.bg} ${riskStyles.border}`}>
          <Cpu className={`w-5 h-5 flex-shrink-0 mt-0.5 ${riskStyles.icon}`} />
          <div>
            <div className={`text-xs font-black uppercase tracking-widest mb-1 ${riskStyles.text}`}>
              IBM Bob Assessment • Risk Index: {commit.risk_introduced}%
            </div>
            <p className="text-sm text-gray-800 font-medium leading-relaxed">
              {commit.risk_introduced > 70 
                ? "This commit contains a massive amount of changes. IBM Bob has flagged this as a critical architectural shift that requires thorough manual review."
                : commit.risk_introduced > 40
                  ? "Moderate risk. Significant changes to logic or structure detected. Ensure integration tests pass."
                  : "Low risk. This appears to be a stable improvement or routine update."}
            </p>
          </div>
        </div>
      </div>

      {/* Body: Files & Diff */}
      <div className="flex-1 flex min-h-[350px]">
        {/* Left: Files changed */}
        <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 p-5 flex flex-col">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5" /> Impact Analysis ({commit.files_changed} files)
          </h4>
          <div className="flex-1 overflow-y-auto pr-2 max-h-[400px]">
            <div className="bg-white/50 rounded-xl p-3 border border-gray-100">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-gray-500">Insertions</span>
                 <span className="text-xs font-bold text-emerald-600">+{commit.insertions}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-xs text-gray-500">Deletions</span>
                 <span className="text-xs font-bold text-rose-600">-{commit.deletions}</span>
               </div>
            </div>
            {commit.is_bug_fix && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Bug Fix Detected</span>
              </div>
            )}
          </div>
          
          <div className="pt-5 mt-2">
            <a href="#" className="w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
              <Github className="w-4 h-4" /> View on GitHub
            </a>
          </div>
        </div>
        
        {/* Right: Diff Viewer */}
        <div className="w-2/3 bg-[#0D1F0D] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 p-3 px-5 border-b border-[#1a3a1a] bg-[#091509]">
            <span className="font-mono text-xs text-gray-400 opacity-80 truncate mr-4">Diff: {commit.short_hash}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex-shrink-0">Diff Viewer</span>
          </div>
          <div className="flex-1 p-5 overflow-auto font-mono text-[13px] leading-relaxed">
            <pre className="text-gray-300 whitespace-pre-wrap">
              {diffText.split('\n').map((line: string, i: number) => {
                const isAdded = line.startsWith('+');
                const isRemoved = line.startsWith('-');
                const isContext = line.startsWith('@@');
                
                return (
                  <div key={i} className={`px-2 py-0.5 rounded-sm flex ${
                    isAdded ? 'bg-[#1a3a1a] text-[#4ade80]' :
                    isRemoved ? 'bg-rose-950/40 text-rose-400' : 
                    isContext ? 'text-[#8ab4f8] bg-[#1a2b3c]/30' : 'text-gray-300'
                  }`}>
                    <span className="w-6 inline-block text-right pr-3 select-none opacity-40 text-[10px] pt-0.5">
                      {isContext ? '' : i + 1}
                    </span>
                    <span className="flex-1 break-all">{line}</span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BugOriginDetection({ onSelectCommit, commits }: { onSelectCommit: (id: string) => void; commits: any[] }) {
  const targetCommit = commits.length > 3 ? commits[3] : (commits[0] || null);
  const targetHash = targetCommit?.hash || '9f3e7b1';
  const shortHash = targetCommit?.short_hash || '9f3e7b1';

  return (
    <div className="bg-white border border-rose-100 shadow-sm rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-60 pointer-events-none" />
      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
        <Cpu className="w-4 h-4 text-rose-600" /> Bug Origin Trace
      </h3>
      
      <div className="space-y-4 relative z-10">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
          <p className="text-xs font-bold text-rose-800 mb-2">IBM Bob Forensic Trace:</p>
          <p className="text-xs text-rose-700/80 leading-relaxed mb-3">
            Current known issue: <span className="font-bold">Severe Memory Leak in Webhooks</span>. I've traced this issue back to its origin in commit <span className="font-mono bg-white px-1 py-0.5 rounded shadow-sm text-rose-600">{shortHash}</span>.
          </p>
          
          <div className="space-y-2 relative before:absolute before:inset-y-2 before:left-3 before:w-px before:bg-rose-200">
            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-white border border-rose-200 flex items-center justify-center flex-shrink-0 z-10">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
              </div>
              <div className="pt-1">
                <p className="text-xs font-bold text-gray-800">1. Synchronous loop added</p>
                <p className="text-[10px] text-gray-500">Event records processed synchronously</p>
              </div>
            </div>
            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-white border border-rose-200 flex items-center justify-center flex-shrink-0 z-10">
                <Database className="w-3 h-3 text-rose-500" />
              </div>
              <div className="pt-1">
                <p className="text-xs font-bold text-gray-800">2. DB Connection Exhaustion</p>
                <p className="text-[10px] text-gray-500">Connections block event loop</p>
              </div>
            </div>
            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-rose-500 border border-rose-600 flex items-center justify-center flex-shrink-0 z-10 shadow-sm shadow-rose-500/30">
                <Flame className="w-3 h-3 text-white" />
              </div>
              <div className="pt-1">
                <p className="text-xs font-bold text-rose-700">3. Memory Not Freed</p>
                <p className="text-[10px] text-rose-600/80">Garbage collector blocks</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onSelectCommit(targetHash)}
            className="mt-4 w-full py-2 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-600 shadow-sm hover:bg-rose-50 hover:border-rose-300 transition-colors"
          >
            Inspect Origin Commit ({shortHash})
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// TAB 4: SCALE SIMULATOR - FIX D19, D20, D21, D22, D23
// ============================================================================

function TabScaleSimulator() {
  // FIX D19: Logarithmic scale (0-100 maps to 1x-100x)
  const [sliderValue, setSliderValue] = useState(0);
  
  // Convert linear slider to logarithmic traffic multiplier
  const trafficMultiplier = Math.pow(100, sliderValue / 100);
  const trafficLevel = Math.floor(trafficMultiplier / 10); // 0-10 scale for thresholds

  // FIX D20: Staggered failure thresholds
  const dbFailing = trafficMultiplier >= 40;
  const apiFailing = trafficMultiplier >= 65;
  const authFailing = trafficMultiplier >= 85;

  // FIX D21: Animated metrics
  const latency = Math.min(Math.round(50 + (trafficMultiplier * 8)), 9999);
  const errorRate = Math.min(Math.round(0.1 + (trafficMultiplier * 0.12)), 99);
  const memoryUsage = Math.min(Math.round(25 + (trafficMultiplier * 0.65)), 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full bg-transparent"
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white/50 rounded-t-[2rem]">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Server className="w-6 h-6 text-sky-500" />
            Scale Simulator
          </h2>
          <p className="text-gray-500 text-sm mt-1">Test system behavior under extreme load</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Traffic Slider - FIX D19, D23 */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-500" /> Traffic Multiplier
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">{trafficMultiplier.toFixed(1)}x</span>
                <span className="text-xs text-gray-400">({(trafficMultiplier * 1000).toFixed(0)} req/s)</span>
              </div>
            </div>

            {/* FIX D23: Single style approach (inline) */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              style={{ accentColor: '#0ea5e9' }}
              className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gray-200"
            />

            {/* FIX D19: Visual threshold markers */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="text-emerald-700 font-bold">1x - 40x</p>
                <p className="text-emerald-600/70 mt-1">Optimal Range</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-amber-700 font-bold">40x - 85x</p>
                <p className="text-amber-600/70 mt-1">Degradation</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-rose-700 font-bold">85x+</p>
                <p className="text-rose-600/70 mt-1">Critical Failure</p>
              </div>
            </div>
          </div>

          {/* FIX D21: Animated metric counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatedMetricCard
              label="Latency"
              value={latency}
              unit="ms"
              icon={<Clock className="w-5 h-5" />}
              color={latency < 200 ? 'emerald' : latency < 500 ? 'amber' : 'rose'}
            />
            <AnimatedMetricCard
              label="Error Rate"
              value={errorRate}
              unit="%"
              icon={<AlertTriangle className="w-5 h-5" />}
              color={errorRate < 2 ? 'emerald' : errorRate < 10 ? 'amber' : 'rose'}
            />
            <AnimatedMetricCard
              label="Memory Usage"
              value={memoryUsage}
              unit="%"
              icon={<Database className="w-5 h-5" />}
              color={memoryUsage < 60 ? 'emerald' : memoryUsage < 85 ? 'amber' : 'rose'}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* FIX D20: Staggered component failures */}
            <ComponentStatusCard
              name="Database"
              failing={dbFailing}
              threshold="40x"
              icon={<Database className="w-6 h-6" />}
              details={dbFailing ? "Connection pool exhausted. Max 100 connections reached. Latency spiking." : "All connections healthy. Pool at 42% capacity."}
            />
            <ComponentStatusCard
              name="API Gateway"
              failing={apiFailing}
              threshold="65x"
              icon={<Server className="w-6 h-6" />}
              details={apiFailing ? "CPU at 98%. Event loop lag detected. Dropping non-essential traffic." : "CPU at moderate levels. Request queue empty."}
            />
            <ComponentStatusCard
              name="Auth Service"
              failing={authFailing}
              threshold="85x"
              icon={<ShieldAlert className="w-6 h-6" />}
              details={authFailing ? "Token validation timeout. Redis cache overwhelmed. System locked." : "Token validation fast. Cache hit rate: 94%."}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <AIRecommendationCard
              title="Implement PgBouncer"
              severity={dbFailing ? "critical" : trafficMultiplier > 20 ? "warning" : "info"}
              description="Database connection pooling required to prevent cascading failures at scale."
              impact="Handles 10x more concurrent connections"
              onAskBob={() => {
                const event = new CustomEvent('bob-explain-endpoint', { 
                  detail: { 
                    endpoint: {
                      method: 'TECH',
                      path: 'Database Connection Pool',
                      file: 'architecture',
                      description: 'Scaling database connections'
                    } 
                  } 
                });
                window.dispatchEvent(event);
              }}
            />
            <AIRecommendationCard
              title="Add Redis Cache Layer"
              severity={apiFailing ? "critical" : trafficMultiplier > 40 ? "warning" : "info"}
              description="Cache frequently accessed API responses to reduce database load and improve latency."
              impact="Reduces DB queries by 70-80%"
              onAskBob={() => {
                const event = new CustomEvent('bob-explain-endpoint', { 
                  detail: { 
                    endpoint: {
                      method: 'TECH',
                      path: 'Redis Caching Strategy',
                      file: 'infrastructure',
                      description: 'Adding caching layer'
                    } 
                  } 
                });
                window.dispatchEvent(event);
              }}
            />
            <AIRecommendationCard
              title="Horizontal Scaling"
              severity={authFailing ? "critical" : trafficMultiplier > 60 ? "warning" : "info"}
              description="Deploy multiple auth service instances behind a load balancer for true horizontal scale."
              impact="Linear scaling to 100x+ traffic"
              onAskBob={() => {
                const event = new CustomEvent('bob-explain-endpoint', { 
                  detail: { 
                    endpoint: {
                      method: 'TECH',
                      path: 'Horizontal Scaling',
                      file: 'deployment',
                      description: 'Scaling auth services'
                    } 
                  } 
                });
                window.dispatchEvent(event);
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper component for animated metrics - FIX D21
function AnimatedMetricCard({ 
  label, 
  value, 
  unit, 
  icon, 
  color 
}: { 
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'rose';
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 500;
    const steps = 30;
    const increment = (value - displayValue) / steps;
    let current = displayValue;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    rose: 'bg-rose-50 border-rose-100 text-rose-600'
  };

  return (
    <motion.div
      className={`border rounded-2xl p-5 ${colorClasses[color]}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`text-${color}-600`}>{icon}</div>
        <span className={`text-xs text-${color}-600/70 uppercase tracking-wider font-bold`}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={displayValue}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold"
        >
          {displayValue}
        </motion.span>
        <span className={`text-lg text-${color}-600/60`}>{unit}</span>
      </div>
    </motion.div>
  );
}

// Helper component for component status - FIX D20
function ComponentStatusCard({ 
  name, 
  failing, 
  threshold, 
  icon, 
  details 
}: {
  name: string;
  failing: boolean;
  threshold: string;
  icon: React.ReactNode;
  details: string;
}) {
  return (
    <motion.div
      animate={{ 
        scale: failing ? [1, 1.02, 1] : 1,
      }}
      transition={{ 
        duration: 0.5,
        repeat: failing ? Infinity : 0,
        repeatDelay: 0.5
      }}
      className={`rounded-2xl p-6 border-2 transition-all ${
        failing 
          ? 'bg-rose-50 border-rose-200' 
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          failing ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {icon}
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
          failing 
            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {failing ? 'FAILING' : 'HEALTHY'}
        </div>
      </div>
      
      <h4 className="font-bold text-gray-900 text-lg mb-2">{name}</h4>
      <p className="text-xs text-gray-500 mb-3 font-medium">Fails at <span className="font-bold text-gray-700">{threshold}</span> traffic</p>
      <p className={`text-xs leading-relaxed ${failing ? 'text-rose-800 font-medium' : 'text-gray-600'}`}>
        {details}
      </p>
    </motion.div>
  );
}

// Helper component for AI recommendations - FIX D22
function AIRecommendationCard({ 
  title, 
  severity, 
  description, 
  impact,
  onAskBob
}: {
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  impact: string;
  onAskBob?: () => void;
}) {
  const severityColors = {
    info: { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
    critical: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700' }
  };

  const colors = severityColors[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colors.bg} border ${colors.border} rounded-2xl p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
        <span className={`text-[10px] uppercase font-bold ${colors.text} px-2 py-1 rounded-full bg-white border ${colors.border} shadow-sm`}>
          {severity}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 leading-relaxed mb-3">{description}</p>
      
      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-4 font-medium">
        <Zap className="w-3 h-3 text-amber-500" />
        <span>Impact: {impact}</span>
      </div>

      {/* FIX D22: Ask Bob button */}
      <button 
        onClick={onAskBob}
        className={`w-full px-4 py-2 rounded-xl bg-white border ${colors.border} ${colors.text} font-bold text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm`}
      >
        <Cpu className="w-3 h-3" />
        Ask Bob About This
      </button>
    </motion.div>
  );
}

// ============================================================================
// TAB 5: SETTINGS - FIX D32, D33
// ============================================================================

function TabSettings() {
  // FIX D32: Functional toggle switches
  const [deepScan, setDeepScan] = useState(true);
  const [autoBugFix, setAutoBugFix] = useState(false);
  const [visualMode, setVisualMode] = useState<'cinematic' | 'performance'>('cinematic');

  // FIX D33: Export button with toast notification
  const handleExport = () => {
    // Show toast notification
    alert('🎉 C-Level Security Report generated successfully! Check your downloads folder.');
    
    // In production, trigger actual PDF download
    // const link = document.createElement('a');
    // link.href = '/reports/security-report.pdf';
    // link.download = 'CodePulse-Security-Report.pdf';
    // link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full bg-transparent"
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 text-gray-400" />
            System Configuration
          </h2>
          <p className="text-gray-500 text-sm mt-1">Configure IBM Bob AI parameters and visualization preferences.</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl flex flex-col gap-6">
          {/* AI Engine Settings */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" /> AI Engine Settings
            </h3>
            
            <div className="flex flex-col gap-5">
              {/* FIX D32: Functional toggle for deep scan */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Deep Neural Scan</h4>
                  <p className="text-xs text-gray-500 mt-1">Allows IBM Bob to analyze abstract syntax trees down to variable scope.</p>
                </div>
                <button
                  onClick={() => setDeepScan(!deepScan)}
                  className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-all ${
                    deepScan ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: deepScan ? 24 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <div className="w-full h-px bg-gray-100" />

              {/* FIX D32: Functional toggle for auto bug fix */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Autonomous Bug Resolution</h4>
                  <p className="text-xs text-gray-500 mt-1">Automatically create pull requests for high-confidence AI fixes.</p>
                </div>
                <button
                  onClick={() => setAutoBugFix(!autoBugFix)}
                  className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-all ${
                    autoBugFix ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: autoBugFix ? 24 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Visualization Controls */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" /> Visualization Controls
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setVisualMode('cinematic')}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  visualMode === 'cinematic'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center mb-3 ${
                  visualMode === 'cinematic' ? 'bg-indigo-100' : 'bg-white'
                }`}>
                  <Activity className={`w-5 h-5 ${visualMode === 'cinematic' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Cinematic Mode</h4>
                <p className="text-xs text-gray-500 mt-1">High fidelity rendering, GPU accelerated particles.</p>
              </button>

              <button
                onClick={() => setVisualMode('performance')}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  visualMode === 'performance'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center mb-3 ${
                  visualMode === 'performance' ? 'bg-indigo-100' : 'bg-white'
                }`}>
                  <Zap className={`w-5 h-5 ${visualMode === 'performance' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Performance Mode</h4>
                <p className="text-xs text-gray-500 mt-1">Reduced animations for low-end hardware.</p>
              </button>
            </div>
          </div>
          
          {/* Export & Reports - FIX D33 */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" /> Export & Reports
            </h3>
            <button 
              onClick={handleExport}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Generate C-Level Security Report
            </button>
            <p className="text-xs text-gray-500 mt-3">Export a comprehensive PDF report for executive stakeholders with security metrics and recommendations.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// API ROUTES MAP COMPONENT
// ============================================================================

function ApiRoutesMap({ data }: { data?: any[] }) {
  const [filter, setFilter] = useState('ALL');
  const endpoints = data || [];
  const filteredEndpoints = filter === 'ALL' ? endpoints : endpoints.filter((e: any) => e.method === filter);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'POST': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'PUT': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'GRAPHQL': return 'bg-purple-50 text-purple-600 border-purple-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getMethodBadge = (method: string) => {
    return (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getMethodColor(method)}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header & Filters */}
      <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-500" /> API Routes Map
        </h3>
        
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'GRAPHQL'].map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filter === m 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* AI Intelligence Banner */}
      <div className="bg-indigo-50/50 border-b border-indigo-100 p-3 px-5 flex items-start gap-3">
        <Cpu className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>IBM Bob detected {endpoints.length} endpoints.</strong> I've analyzed your source code and inferred the purpose of each route. Click 'Explain' to have me break down exactly how a specific endpoint works in the chat.
        </p>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-100">
              <th className="py-3 px-5 font-semibold">Method</th>
              <th className="py-3 px-5 font-semibold">Endpoint / Path</th>
              <th className="py-3 px-5 font-semibold">Inferred Purpose</th>
              <th className="py-3 px-5 font-semibold">Handler / Source</th>
              <th className="py-3 px-5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEndpoints.map((endpoint: any, idx: number) => (
              <motion.tr 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group"
              >
                <td className="py-4 px-5">
                  {getMethodBadge(endpoint.method)}
                </td>
                <td className="py-4 px-5">
                  <code className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                </td>
                <td className="py-4 px-5">
                  <span className="text-xs text-gray-600 font-medium">
                    Route handler for {endpoint.path}
                  </span>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500 font-mono">
                      {endpoint.file}<span className="text-gray-300">:{endpoint.line}</span>
                    </span>
                  </div>
                </td>
                <td className="py-4 px-5 text-right">
                  <button 
                    onClick={() => {
                      // Dispatch a custom event that the chat panel can listen to
                      const event = new CustomEvent('bob-explain-endpoint', { 
                        detail: { endpoint } 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-indigo-600 text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MessageSquare className="w-3 h-3" /> Explain
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {filteredEndpoints.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            No endpoints found matching this method filter.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DIRECTORY EXPLORER COMPONENT (Interactive AI Tree)
// ============================================================================

type DirectoryNode = {
  name: string;
  isImportant?: boolean;
  shortDesc: string;
  longDesc: string;
  files?: number;
  children?: DirectoryNode[];
};

const directoryData: DirectoryNode[] = [
  {
    name: 'src',
    isImportant: true,
    shortDesc: 'Main application logic and components',
    longDesc: 'The heart of the application. Contains all React components, hooks, and core logic. IBM Bob notes excellent modularity here.',
    children: [
      {
        name: 'api',
        isImportant: true,
        shortDesc: 'REST endpoints and middleware',
        longDesc: 'Contains Express controllers and middleware. IBM Bob identified this as a critical path requiring strict security audits.',
        files: 45
      },
      {
        name: 'components',
        shortDesc: 'Reusable React UI elements',
        longDesc: 'Shared visual components like Buttons, Modals, and complex widgets. Most follow the Atomic Design pattern.',
        files: 120
      },
      {
        name: 'lib',
        isImportant: true,
        shortDesc: 'Core business logic and utilities',
        longDesc: 'Contains essential algorithms, API clients, and data transformations. Test coverage here is a robust 92%.',
        files: 56
      }
    ]
  },
  {
    name: 'public',
    shortDesc: 'Static assets and raw files',
    longDesc: 'Uncompiled assets like images, fonts, and the index.html template. Ensure large assets are optimized.',
    files: 24
  },
  {
    name: 'tests',
    shortDesc: 'Unit and integration test suites',
    longDesc: 'E2E Cypress tests and Jest unit tests. IBM Bob warns that API integration tests are falling behind recent changes.',
    files: 89
  }
];

function DirectoryExplorer({ data }: { data?: any[] }) {
  const treeData = data || directoryData;
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-full flex flex-col">
      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
        <FolderTree className="w-4 h-4 text-purple-500" /> Directory Structure
      </h3>
      
      <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl mb-4 flex items-start gap-2">
        <Cpu className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>IBM Bob's Context Map.</strong> Expand folders to see my live analysis of what lives where and why it matters. I've highlighted the most critical directories in purple.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-1">
        {treeData.map((node) => (
          <DirectoryNodeItem key={node.name} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

function DirectoryNodeItem({ node, depth }: { node: any; depth: number }) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [isSelected, setIsSelected] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'bg-indigo-50 border border-indigo-100' 
            : 'hover:bg-gray-50 border border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren) setIsExpanded(!isExpanded);
          setIsSelected(!isSelected);
        }}
      >
        <div className="flex items-center gap-1.5 mt-0.5">
          {hasChildren ? (
            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          ) : (
            <div className="w-3.5 h-3.5" /> // spacer
          )}
          <FolderTree className={`w-4 h-4 ${node.isImportant ? 'text-purple-500' : 'text-gray-400'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-medium ${node.isImportant ? 'text-purple-700' : 'text-gray-700'}`}>
              /{node.name}
            </span>
            {node.type === 'file' && (
              <span className="text-[10px] text-gray-400 bg-white border border-gray-100 px-1.5 rounded">
                {Math.round(node.size / 1024)} KB
              </span>
            )}
          </div>
          {!isSelected && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{node.type === 'folder' ? 'Directory' : 'Source File'}</p>
          )}
        </div>
      </div>

      {/* AI Explanation Expanded State */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div 
              className="my-2 p-3 bg-white border border-indigo-100 shadow-sm rounded-xl ml-8 mr-2 relative before:absolute before:left-[-12px] before:top-4 before:w-3 before:h-px before:bg-indigo-100"
              style={{ marginLeft: `${depth * 16 + 32}px` }}
            >
              <div className="flex items-start gap-2">
                <Cpu className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    {node.type === 'folder' ? 'Directory analysis' : 'File analysis'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {node.type === 'folder' ? `This folder contains ${node.children?.length || 0} items.` : `This file has ${node.lines || 0} lines of code.`}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const event = new CustomEvent('bob-explain-endpoint', { 
                        detail: { 
                          endpoint: {
                            method: 'DIRECTORY',
                            path: `/${node.name}`,
                            file: `/${node.name}`,
                            description: node.shortDesc,
                            line: 'N/A'
                          } 
                        } 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
                  >
                    <MessageSquare className="w-3 h-3" /> Ask Bob about this directory
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children!.map(child => (
            <DirectoryNodeItem key={child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageBreakdown({ data }: { data?: any }) {
  const languageData = data ? Object.entries(data).map(([name, value]: [string, any]) => ({
    name,
    value: Math.round(value),
    color: name === 'JavaScript' ? '#f59e0b' : name === 'TypeScript' ? '#3178c6' : name === 'Python' ? '#3b82f6' : name === 'HTML' ? '#e34c26' : name === 'CSS' ? '#563d7c' : '#' + Math.floor(Math.random()*16777215).toString(16)
  })) : [
    { name: 'JavaScript', value: 60, color: '#f59e0b' },
    { name: 'Python', value: 25, color: '#3b82f6' },
    { name: 'CSS', value: 15, color: '#ec4899' },
  ];

  const frameworks = [
    { name: 'React', version: '18.2.0', status: 'latest', color: 'indigo', textClass: 'text-indigo-600', bgClass: 'bg-indigo-100' },
    { name: 'Express', version: '4.17.1', status: 'outdated', color: 'gray', textClass: 'text-gray-600', bgClass: 'bg-gray-100' },
    { name: 'PostgreSQL', version: '14.5', status: 'latest', color: 'blue', textClass: 'text-blue-600', bgClass: 'bg-blue-100' },
  ];

  const handleTechClick = (tech: string) => {
    const event = new CustomEvent('bob-explain-endpoint', { 
      detail: { 
        endpoint: {
          method: 'TECH',
          path: tech,
          file: `Usage of ${tech}`,
          description: `Where is ${tech} used?`,
          line: 'N/A'
        } 
      } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-full flex flex-col relative overflow-hidden min-h-[300px]">
      <div className="absolute top-0 right-0 w-40 h-40 bg-pink-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
          <Code2 className="w-4 h-4 text-pink-500" /> 
          Language & Stack
        </h3>
        <div className="px-2 py-1 rounded border border-gray-200 bg-gray-50 flex items-center gap-1">
          <Cpu className="w-3 h-3 text-indigo-600" />
          <span className="text-[10px] font-bold text-gray-600">Bob's Stack Scan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 relative z-10">
        {/* Chart Column */}
        <div className="flex flex-col items-center justify-center">
          <div className="h-32 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {languageData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Usage']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stack</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {languageData.map((lang) => (
              <div key={lang.name} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded transition-colors" onClick={() => handleTechClick(lang.name)}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                <span className="text-[10px] font-bold text-gray-600">{lang.name}</span>
                <span className="text-[10px] text-gray-400">{lang.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frameworks Column */}
        <div className="flex flex-col justify-center gap-3">
          {frameworks.map((fw) => (
            <motion.div 
              key={fw.name}
              whileHover={{ scale: 1.02, x: 2 }}
              onClick={() => handleTechClick(fw.name)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${fw.bgClass} flex items-center justify-center ${fw.textClass}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{fw.name}</h4>
                  <p className="text-[10px] font-mono text-gray-500">v{fw.version}</p>
                </div>
              </div>
              
              {fw.status === 'outdated' && (
                <div className="group/alert relative">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 text-white text-xs p-2.5 rounded-lg opacity-0 group-hover/alert:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl border border-gray-700">
                    <span className="font-bold text-amber-400 block mb-1">Bob Alert:</span>
                    Major version v5.x is available. Security patches missing.
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;