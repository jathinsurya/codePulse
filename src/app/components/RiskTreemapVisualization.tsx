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

const getRiskColor = (risk: number) => {
  if (risk < 30) return 'rgba(16, 185, 129, 0.15)'; // emerald (healthy)
  if (risk < 70) return 'rgba(245, 158, 11, 0.18)'; // amber (warning)
  if (risk < 90) return 'rgba(244, 63, 94, 0.22)';  // rose (high risk)
  return 'rgba(225, 29, 72, 0.30)'; // rose (critical)
};

const getRiskBorderColor = (risk: number) => {
  if (risk < 30) return 'rgba(16, 185, 129, 0.4)';
  if (risk < 70) return 'rgba(245, 158, 11, 0.5)';
  if (risk < 90) return 'rgba(244, 63, 94, 0.6)';
  return 'rgba(225, 29, 72, 0.8)';
};

const getRiskTextColor = (risk: number) => {
  if (risk < 30) return '#065f46';
  if (risk < 70) return '#78350f';
  if (risk < 90) return '#881337';
  return '#881337';
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
  const [isGeneratingFix, setIsGeneratingFix] = useState(false);
  const [selectedFile, setSelectedFile] = useState<d3.HierarchyRectangularNode<NodeData> | null>(null);
  const [hoveredFile, setHoveredFile] = useState<d3.HierarchyRectangularNode<NodeData> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Use a stable empty root when no data is available (hooks must always run)
  const emptyRoot: NodeData = useMemo(() => ({ name: 'root', children: [] }), []);
  const treeData = (data && data.children && data.children.length > 0) ? data : emptyRoot;
  const hasData = treeData !== emptyRoot;

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

  const currentRootData = currentPath[currentPath.length - 1];

  const root = useMemo(() => {
    const hierarchy = d3.hierarchy(currentRootData)
      .sum(d => d.size || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const leafCount = Math.max(hierarchy.leaves().length, 1);
    const depthMax = hierarchy.height;

    // Each leaf needs at least 160x90px to be readable
    // Total area needed = leafCount * 160 * 90
    // Distribute into a roughly 16:9 layout
    const totalArea = leafCount * 160 * 90;
    const aspectRatio = 1.6;
    const baseWidth = Math.sqrt(totalArea * aspectRatio);
    const baseHeight = totalArea / baseWidth;

    // Add extra space for folder header padding at each nesting level
    const paddingExtra = depthMax * 40;

    const layoutWidth = Math.max(dimensions.width, Math.ceil(baseWidth) + paddingExtra, 1000);
    const layoutHeight = Math.max(dimensions.height, Math.ceil(baseHeight) + paddingExtra, 600);

    const treemap = d3.treemap<NodeData>()
      .size([layoutWidth, layoutHeight])
      .tile(d3.treemapSquarify.ratio(1.2))
      .paddingTop(32)
      .paddingRight(6)
      .paddingBottom(6)
      .paddingLeft(6)
      .paddingInner(5)
      .round(true);

    return treemap(hierarchy);
  }, [dimensions, currentRootData]);

  const leaves = root.leaves();
  const internalNodes = root.descendants().filter(d => d.depth > 0 && d.children);

  // If no data from API, show loading state (AFTER all hooks)
  if (!hasData) {
    return (
      <div className="relative w-full h-[750px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col font-sans items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Activity className="w-10 h-10 animate-pulse" />
          <p className="text-sm font-bold uppercase tracking-widest">Waiting for analysis data...</p>
          <p className="text-xs text-gray-400">Scan a repository to see the risk treemap</p>
        </div>
      </div>
    );
  }


  const handleFixClick = () => {
    setIsGeneratingFix(true);
    setTimeout(() => {
      setIsGeneratingFix(false);
    }, 1500);
  };

  return (
    <div className="relative w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col font-sans" style={{ height: '75vh', minHeight: '600px' }}>
      <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-gray-50/50 shrink-0">
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
      <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-1.5 text-xs font-mono overflow-x-auto shadow-sm z-10 shrink-0">
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

      <div className="flex-1 relative overflow-auto bg-slate-50/50" ref={containerRef}>
        <div 
          className="relative" 
          style={{ 
            width: root.x1, 
            height: root.y1,
            minWidth: '100%',
            minHeight: '100%'
          }}
        >
          {/* Render internal nodes (Folders) */}
        {internalNodes.map((node, i) => (
          <motion.div
            key={`folder-${node.data.name}-${i}`}
            layout
            className="absolute border border-gray-200/60 rounded-lg cursor-pointer group hover:border-indigo-300/60 transition-all z-0"
            style={{
              backgroundColor: 'rgba(248, 250, 252, 0.7)',
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
            <div className="px-3 py-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest truncate flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              {node.data.name}
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              whileHover={{ scale: 0.97, zIndex: 20 }}
              onClick={() => setSelectedFile(node)}
              onMouseEnter={() => setHoveredFile(node)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              <div
                className={`w-full h-full rounded-lg flex flex-col p-2.5 overflow-hidden transition-shadow duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                style={{
                  backgroundColor: getRiskColor(risk),
                  borderColor: getRiskBorderColor(risk),
                  borderWidth: '1.5px',
                  borderStyle: 'solid',
                }}
              >
                {/* Critical Pulse */}
                {isCritical && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-rose-500/10 pointer-events-none"
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                <div className="relative z-10 flex items-start justify-between gap-1">
                  <span className="text-[11px] font-bold truncate" style={{ color: getRiskTextColor(risk) }}>
                    {node.data.name}
                  </span>
                  {risk >= 70 && (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                </div>
                {node.y1 - node.y0 > 50 && node.x1 - node.x0 > 80 && (
                  <div className="mt-auto relative z-10">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-block ${
                      risk >= 70 ? 'bg-rose-100 text-rose-700' : risk >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {risk}
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
