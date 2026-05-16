import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3-hierarchy';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X, Activity, Info, FileCode, Cpu, Wrench, Sparkles, BrainCircuit, ChevronRight } from 'lucide-react';

interface RiskFactors {
  complexity: number;
  duplication: number;
  noTests: number;
}

interface NodeData {
  name: string;
  size?: number;
  riskScore?: number;
  riskFactors?: RiskFactors;
  bobExplanation?: string;
  issues?: string[];
  children?: NodeData[];
}

const repoData: NodeData = {
  name: "root",
  children: [
    {
      name: "src",
      children: [
        {
          name: "components",
          children: [
            { 
              name: "DashboardPage.tsx", 
              size: 1200, 
              riskScore: 85, 
              riskFactors: { complexity: 88, duplication: 65, noTests: 100 },
              bobExplanation: "This file has grown into a monolithic component with multiple layout responsibilities and excessive cyclomatic complexity. It entirely lacks test coverage, making it highly volatile for future changes.",
              issues: ["Complex logic", "Large file", "Multiple responsibilities"] 
            },
            { 
              name: "auth.ts", 
              size: 400, 
              riskScore: 92, 
              riskFactors: { complexity: 75, duplication: 40, noTests: 100 },
              bobExplanation: "Critical security logic is mixed with outdated session handling methods and zero unit tests. This poses a significant risk of authentication bypass vulnerabilities if modified without extreme care.",
              issues: ["High risk of vulnerabilities", "Deprecated methods"] 
            },
            { name: "Button.tsx", size: 400, riskScore: 5, riskFactors: { complexity: 10, duplication: 0, noTests: 0 }, bobExplanation: "Clean, focused component with excellent test coverage.", issues: [] },
            { name: "Card.tsx", size: 450, riskScore: 12, riskFactors: { complexity: 15, duplication: 10, noTests: 20 }, bobExplanation: "Standard presentational component. Minor lack of edge-case testing.", issues: [] },
            { name: "Sidebar.tsx", size: 500, riskScore: 28, riskFactors: { complexity: 35, duplication: 20, noTests: 40 }, bobExplanation: "State management could be extracted, but currently stable.", issues: [] },
            { name: "Header.tsx", size: 450, riskScore: 15, riskFactors: { complexity: 20, duplication: 10, noTests: 15 }, bobExplanation: "Well-structured component with appropriate abstraction.", issues: [] },
            { name: "RiskTreemap.tsx", size: 550, riskScore: 8, riskFactors: { complexity: 25, duplication: 5, noTests: 10 }, bobExplanation: "D3 logic is well-isolated. Good separation of concerns.", issues: [] },
          ]
        },
        {
          name: "api",
          children: [
            { 
              name: "payment.ts", 
              size: 800, 
              riskScore: 88, 
              riskFactors: { complexity: 90, duplication: 60, noTests: 80 },
              bobExplanation: "Contains a massive switch statement for routing payment providers with deprecated API usages. The lack of rate-limiting tests makes it a prime candidate for DDOS vulnerabilities.",
              issues: ["Deprecated API usage", "No rate limiting"] 
            },
            { 
              name: "user.ts", 
              size: 600, 
              riskScore: 55, 
              riskFactors: { complexity: 60, duplication: 45, noTests: 50 },
              bobExplanation: "Error handling is inconsistent across different controller methods. Missing boundary tests for user input edge cases.",
              issues: ["Missing error handling", "Inconsistent returns"] 
            },
            { name: "index.ts", size: 400, riskScore: 2, riskFactors: { complexity: 5, duplication: 0, noTests: 0 }, bobExplanation: "Simple export file.", issues: [] },
            { 
              name: "webhook.ts", 
              size: 550, 
              riskScore: 78, 
              riskFactors: { complexity: 65, duplication: 50, noTests: 90 },
              bobExplanation: "Payloads are largely unvalidated before processing. This endpoint is slow and completely lacks mocked webhook testing.",
              issues: ["Unvalidated payload", "Slow response"] 
            },
          ]
        },
        {
          name: "utils",
          children: [
            { name: "helpers.ts", size: 400, riskScore: 15, riskFactors: { complexity: 20, duplication: 10, noTests: 5 }, bobExplanation: "Pure functions with good test coverage.", issues: [] },
            { name: "formatter.ts", size: 400, riskScore: 12, riskFactors: { complexity: 15, duplication: 5, noTests: 10 }, bobExplanation: "Reliable string manipulation utilities.", issues: [] },
            { 
              name: "legacy.ts", 
              size: 900, 
              riskScore: 95, 
              riskFactors: { complexity: 98, duplication: 85, noTests: 100 },
              bobExplanation: "This is a dumping ground for old utility functions with multiple code smells and missing types. It has 0% test coverage and is heavily duplicated.",
              issues: ["Dead code", "Multiple code smells", "Missing types"] 
            },
            { name: "dateUtils.ts", size: 400, riskScore: 8, riskFactors: { complexity: 12, duplication: 0, noTests: 5 }, bobExplanation: "Wraps date-fns properly.", issues: [] },
          ]
        }
      ]
    },
    {
      name: "config",
      children: [
        { 
          name: "webpack.config.js", 
          size: 500, 
          riskScore: 45, 
          riskFactors: { complexity: 50, duplication: 30, noTests: 100 },
          bobExplanation: "Complex build configuration that generates a large bundle size warning. Could benefit from chunk splitting.",
          issues: ["Large bundle size warning"] 
        },
        { name: "jest.config.js", size: 450, riskScore: 20, riskFactors: { complexity: 10, duplication: 0, noTests: 100 }, bobExplanation: "Standard test configuration.", issues: [] },
        { name: "tailwind.config.js", size: 450, riskScore: 5, riskFactors: { complexity: 5, duplication: 0, noTests: 100 }, bobExplanation: "Clean design tokens.", issues: [] },
      ]
    },
    {
      name: "public",
      children: [
        { name: "index.html", size: 400, riskScore: 2, riskFactors: { complexity: 0, duplication: 0, noTests: 0 }, bobExplanation: "Static entrypoint.", issues: [] },
        { name: "favicon.ico", size: 350, riskScore: 0, riskFactors: { complexity: 0, duplication: 0, noTests: 0 }, bobExplanation: "Static asset.", issues: [] },
      ]
    }
  ]
};

const getRiskColor = (risk: number) => {
  if (risk < 30) return 'rgba(16, 185, 129, 0.2)'; // emerald-500 (healthy)
  if (risk < 70) return 'rgba(245, 158, 11, 0.3)'; // amber-500 (warning)
  if (risk < 90) return 'rgba(244, 63, 94, 0.4)';  // rose-500 (high risk)
  return 'rgba(225, 29, 72, 0.6)'; // rose-600 (critical)
};

const getRiskBorderColor = (risk: number) => {
  if (risk < 30) return 'rgba(16, 185, 129, 0.5)';
  if (risk < 70) return 'rgba(245, 158, 11, 0.6)';
  if (risk < 90) return 'rgba(244, 63, 94, 0.7)';
  return 'rgba(225, 29, 72, 0.9)';
};

const RiskBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
  <div className="mb-2">
    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
      <span>{label}</span>
      <span className="text-gray-900">{value}/100</span>
    </div>
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full ${colorClass}`} 
      />
    </div>
  </div>
);

export function RiskTreemapVisualization({ data }: { data?: NodeData }) {
  const treeData = data || repoData;
  const [selectedFile, setSelectedFile] = useState<d3.HierarchyRectangularNode<NodeData> | null>(null);
  const [hoveredFile, setHoveredFile] = useState<d3.HierarchyRectangularNode<NodeData> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentPath, setCurrentPath] = useState<NodeData[]>([treeData]);

  // Extract all folders for the dropdown filter, preserving the NodeData path
  const folders = useMemo(() => {
    const extractFolders = (node: NodeData, pathSoFar: NodeData[] = []): { path: string, pathNodes: NodeData[] }[] => {
      if (!node.children || node.children.length === 0) return [];
      const newPath = [...pathSoFar, node];
      const pathString = newPath.map(n => n.name === 'root' ? 'repository' : n.name).join('/');
      let folderList = [{ path: pathString, pathNodes: newPath }];
      node.children.forEach(child => {
        if (child.children) {
          folderList = [...folderList, ...extractFolders(child, newPath)];
        }
      });
      return folderList;
    };
    return extractFolders(treeData);
  }, [treeData]);

  useEffect(() => {
    setCurrentPath([treeData]);
  }, [treeData]);

  const currentRootData = currentPath[currentPath.length - 1];

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const root = useMemo(() => {
    const hierarchy = d3.hierarchy(currentRootData)
      .sum(d => d.size || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const layoutWidth = Math.max(dimensions.width, 800);
    const layoutHeight = Math.max(dimensions.height, 400);

    const treemap = d3.treemap<NodeData>()
      .size([layoutWidth, layoutHeight])
      .paddingTop(24)
      .paddingRight(4)
      .paddingBottom(4)
      .paddingLeft(4)
      .paddingInner(4);

    return treemap(hierarchy);
  }, [dimensions, currentRootData]);

  const leaves = root.leaves();
  const internalNodes = root.descendants().filter(d => d.depth > 0 && d.children);

  const handleFixClick = () => {
    setIsGeneratingFix(true);
    setTimeout(() => {
      setIsGeneratingFix(false);
      // In a real app, this would open the chat panel with the plan
    }, 1500);
  };

  return (
    <div className="relative w-full h-[600px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col font-sans">
      <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex-1 min-w-0 w-full">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-rose-500" /> Codebase Risk Treemap
          </h3>
          <div className="flex flex-wrap items-center gap-3 w-full">
            <label className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 whitespace-nowrap shrink-0">
              Choose filter for better visuals:
            </label>
            <select 
              value={currentPath.map(n => n.name === 'root' ? 'repository' : n.name).join('/')} 
              onChange={(e) => {
                const target = folders.find(f => f.path === e.target.value);
                if (target) setCurrentPath(target.pathNodes);
              }}
              className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm font-mono font-bold max-w-full sm:max-w-xs truncate"
            >
              {folders.map(f => (
                <option key={f.path} value={f.path}>{f.path}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">Tile size = Lines of Code | Color = Risk Score (0-100)</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 shrink-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/50" /> Healthy (0-29)
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/60" /> Warning (30-69)
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className="w-3 h-3 rounded-sm bg-rose-500/40 border border-rose-500/70" /> Critical (70+)
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-1.5 text-xs font-mono overflow-x-auto shadow-sm z-10">
        {currentPath.map((node, i) => (
          <React.Fragment key={`crumb-${i}`}>
            <button 
              onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
              className={`hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors ${i === currentPath.length - 1 ? 'font-bold text-gray-900' : 'text-indigo-600'}`}
            >
              {node.name === 'root' ? 'repository' : node.name}
            </button>
            {i < currentPath.length - 1 && <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 relative overflow-auto bg-gray-50" ref={containerRef}>
        <div 
          className="relative" 
          style={{ 
            width: Math.max(dimensions.width, 800), 
            height: Math.max(dimensions.height, 400) 
          }}
        >
          {/* Render internal nodes (Folders) */}
        {internalNodes.map((node, i) => (
          <motion.div
            key={`folder-${node.data.name}-${i}`}
            layout
            className="absolute border border-gray-200/50 rounded-md cursor-pointer hover:bg-indigo-50/30 transition-colors z-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
            }}
            animate={{
              left: node.x0,
              top: node.y0,
              width: Math.max(0, node.x1 - node.x0),
              height: Math.max(0, node.y1 - node.y0),
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            onClick={() => setCurrentPath([...currentPath, node.data])}
          >
            <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
              {node.data.name} <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity" />
            </div>
          </motion.div>
        ))}

        {/* Render leaves (Files) */}
        {leaves.map((node, i) => {
          const risk = node.data.riskScore || 0;
          const isCritical = risk >= 70;
          const isSelected = selectedFile === node;
          
          return (
            <motion.div
              key={`file-${node.data.name}-${i}`}
              layout
              className="absolute cursor-pointer z-10"
              animate={{
                left: node.x0,
                top: node.y0,
                width: Math.max(0, node.x1 - node.x0),
                height: Math.max(0, node.y1 - node.y0),
              }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              whileHover={{ scale: 0.98, zIndex: 20 }}
              onClick={() => setSelectedFile(node)}
              onMouseEnter={() => setHoveredFile(node)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              <div
                className={`w-full h-full rounded-md shadow-sm flex flex-col p-2 overflow-hidden backdrop-blur-sm ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                style={{
                  backgroundColor: getRiskColor(risk),
                  borderColor: getRiskBorderColor(risk),
                  borderWidth: '1px'
                }}
              >
                {/* Critical Pulse */}
                {isCritical && (
                  <motion.div
                    className="absolute inset-0 bg-rose-500/20 pointer-events-none"
                    animate={{ opacity: [0, 0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-800 truncate mix-blend-overlay">
                    {node.data.name}
                  </span>
                  {risk >= 70 && (
                    <AlertTriangle className="w-3 h-3 text-rose-700 shrink-0" />
                  )}
                </div>
                {node.data.issues && node.data.issues.length > 0 && node.y1 - node.y0 > 60 && node.x1 - node.x0 > 100 && (
                  <div className="mt-auto relative z-10">
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm bg-white/60 text-gray-800 backdrop-blur-md">
                      Risk: {risk}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        </div>
      </div>

      {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredFile && !selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute z-50 pointer-events-none bg-white rounded-xl shadow-xl border border-gray-200 w-[300px] overflow-hidden"
              style={{
                left: Math.min(hoveredFile.x1 + 10, dimensions.width - 320),
                top: Math.min(hoveredFile.y0 + 10, dimensions.height - 250),
              }}
            >
              <div className="p-3 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-gray-500" />
                  <span className="font-bold text-sm text-gray-900 truncate max-w-[150px]">{hoveredFile.data.name}</span>
                </div>
                <div className={`px-2 py-0.5 rounded-md text-xs font-bold ${hoveredFile.data.riskScore! >= 70 ? 'bg-rose-100 text-rose-700' : hoveredFile.data.riskScore! >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  Risk {hoveredFile.data.riskScore}
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <RiskBar label="Complexity" value={hoveredFile.data.riskFactors?.complexity || 0} colorClass="bg-purple-500" />
                  <RiskBar label="Duplication" value={hoveredFile.data.riskFactors?.duplication || 0} colorClass="bg-orange-500" />
                  <RiskBar label="No Tests" value={hoveredFile.data.riskFactors?.noTests || 0} colorClass="bg-rose-500" />
                </div>

                <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100/50 flex gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                    {hoveredFile.data.bobExplanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide-in Detail Panel */}
        <AnimatePresence>
          {selectedFile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-20"
                onClick={() => setSelectedFile(null)}
              />
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute top-0 right-0 bottom-0 w-[380px] bg-white border-l border-gray-200 shadow-2xl z-30 flex flex-col"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                  <div className="flex flex-col">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-500" />
                      {selectedFile.data.name}
                    </h4>
                    <span className="text-xs text-gray-500 pl-6">{selectedFile.data.size} lines of code</span>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                  {/* Big Risk Score */}
                  <div className="flex items-center justify-between p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Risk Score</div>
                      <div className={`text-5xl font-black ${selectedFile.data.riskScore! >= 70 ? 'text-rose-500' : selectedFile.data.riskScore! >= 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {selectedFile.data.riskScore}
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100">
                      {selectedFile.data.riskScore! >= 70 ? <AlertTriangle className="w-8 h-8 text-rose-500" /> : selectedFile.data.riskScore! >= 30 ? <Activity className="w-8 h-8 text-amber-500" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
                    </div>
                  </div>



                  {/* Risk Factors Breakdown */}
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" /> Risk Factors
                    </h5>
                    <div className="space-y-4">
                      <RiskBar label="Cyclomatic Complexity" value={selectedFile.data.riskFactors?.complexity || 0} colorClass="bg-purple-500" />
                      <RiskBar label="Code Duplication" value={selectedFile.data.riskFactors?.duplication || 0} colorClass="bg-orange-500" />
                      <RiskBar label="Missing Tests" value={selectedFile.data.riskFactors?.noTests || 0} colorClass="bg-rose-500" />
                    </div>
                  </div>

                  {/* Top Issues */}
                  {selectedFile.data.issues && selectedFile.data.issues.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500" /> Top Issues
                      </h5>
                      <div className="space-y-2">
                        {selectedFile.data.issues.map((issue, idx) => (
                          <div key={idx} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                            <p className="text-xs text-rose-900 font-medium">{issue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fix Suggestions Button */}
                  <div className="mt-auto pt-4">
                    <button 
                      onClick={handleFixClick}
                      disabled={isGeneratingFix}
                      className="group relative w-full py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md overflow-hidden flex items-center justify-center gap-2 disabled:bg-gray-800 disabled:cursor-not-allowed"
                    >
                      {isGeneratingFix ? (
                        <>
                          <BrainCircuit className="w-4 h-4 animate-pulse" /> Generating Refactor Plan...
                        </>
                      ) : (
                        <>
                          <Wrench className="w-4 h-4 group-hover:-rotate-12 transition-transform" /> 
                          Fix suggestions
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">Bob will generate a step-by-step refactoring plan</p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
    </div>
  );
}
