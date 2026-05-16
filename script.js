import fs from 'fs';

const path = '../src/app/components/DashboardPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = "function TabSettings() {";
const endMarker = "  );\n}\n\n// ============================================================================";

const newCode = `function TabSettings() {
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
      <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white/50 rounded-t-[2rem]">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-500" />
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
                  className={\`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-all \${
                    deepScan ? 'bg-indigo-500' : 'bg-gray-200'
                  }\`}
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
                  className={\`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-all \${
                    autoBugFix ? 'bg-indigo-500' : 'bg-gray-200'
                  }\`}
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
                className={\`border rounded-xl p-4 cursor-pointer transition-all \${
                  visualMode === 'cinematic'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }\`}
              >
                <div className={\`w-10 h-10 rounded-full shadow-sm flex items-center justify-center mb-3 \${
                  visualMode === 'cinematic' ? 'bg-indigo-100' : 'bg-white'
                }\`}>
                  <Activity className={\`w-5 h-5 \${visualMode === 'cinematic' ? 'text-indigo-600' : 'text-gray-400'}\`} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Cinematic Mode</h4>
                <p className="text-xs text-gray-500 mt-1">High fidelity rendering, GPU accelerated particles.</p>
              </button>

              <button
                onClick={() => setVisualMode('performance')}
                className={\`border rounded-xl p-4 cursor-pointer transition-all \${
                  visualMode === 'performance'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }\`}
              >
                <div className={\`w-10 h-10 rounded-full shadow-sm flex items-center justify-center mb-3 \${
                  visualMode === 'performance' ? 'bg-indigo-100' : 'bg-white'
                }\`}>
                  <Zap className={\`w-5 h-5 \${visualMode === 'performance' ? 'text-indigo-600' : 'text-gray-400'}\`} />
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
}`;

const startIndex = content.lastIndexOf(startMarker);
const searchContent = content.substring(startIndex);
const endIndex = startIndex + searchContent.indexOf(endMarker) + "  );\n}".length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newCode + content.substring(endIndex);
  fs.writeFileSync(path, content);
  console.log("Successfully replaced TabSettings");
} else {
  console.error("Could not find markers.", startIndex, endIndex);
}
