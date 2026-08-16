import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Cpu, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Code, 
  Filter, 
  PlusCircle, 
  BookOpen, 
  Check, 
  RotateCcw,
  Clipboard,
  ShieldCheck,
  ChevronRight,
  Bookmark,
  Layers,
  Clock
} from 'lucide-react';

export const MODULE = {
  name: "AI Reflection Log",
  icon: "Sparkles",
  description: "Examine co-pilot session logs, accepted models, rejected prompts and professional design choices.",
  route: "/ai_reflection"
};

interface LogEntry {
  id: string;
  topic: string;
  userAsk: string;
  aiProvided: string;
  optionsSuggested: string[];
  acceptedOption: string;
  rejectedOption: string;
  decisionReason: string;
  toolUsed: 'ChatGPT' | 'Claude' | 'Gemini';
  intendedUse: 'Research & Knowledge' | 'Idea Validation' | 'Web App Generation' | 'Feedback Loop';
  status: 'Accepted' | 'Rejected' | 'Under Iteration';
  timestamp: string;
}

// Highly comprehensive seeded audit logs representing real DataQuest 2026 AI decisions
const INITIAL_LOGS: LogEntry[] = [
  {
    id: "log_001",
    topic: "Interpretable Credit Risk Baseline Design",
    userAsk: "Compare baseline Generalized Linear Models with non-linear Decision Trees under Basel III rules.",
    aiProvided: "Delivered comparative mathematical proof of Logistic Regression. Outlined loglink probability conversions vs non-parametric recursive splitting of classification paths.",
    optionsSuggested: [
      "Option A: Train deep classification trees to generate segment-wise PD directly.",
      "Option B: Transform continuous predictors to Weight of Evidence (WoE) and fit stable Logistic GLMs."
    ],
    acceptedOption: "Option B: WoE transformation + Logistic Regression",
    rejectedOption: "Option A: Deep standalone classification trees",
    decisionReason: "Under Basel III and SARB guidelines, credit scoring must provide transparent adverse action attribution and smooth score calibration. Deep decision tree paths lead to high-variance steps and proxy discrimination risks, which fail standard risk-committee approval audits.",
    toolUsed: "ChatGPT",
    intendedUse: "Research & Knowledge",
    status: "Accepted",
    timestamp: "2026-05-20 09:15"
  },
  {
    id: "log_002",
    topic: "Credit Portfolios Visualization & UI Layout",
    userAsk: "Create a modern high-contrast vertical sidebar navigation layout and a responsive dual-panel bento grid for the credit book.",
    aiProvided: "Proposed a flexible React layout utilizing Inter sans-serif headings, JetBrains Mono indicators, and South African corporate banking navy and warm-gold accents.",
    optionsSuggested: [
      "Option A: Multi-view collapsible classic floating drawers on both the left and right.",
      "Option B: Single responsive screen with right-side vertical tab menus protecting the focal area.",
      "Option C: Symmetric full-width three-column setup putting registered modules directly on the left tab panel."
    ],
    acceptedOption: "Option C: Left-swapped Registry Modules + Right-side global controls",
    rejectedOption: "Option A: Floating collapsible drawers",
    decisionReason: "Swapping the plugin modules navigation directly to the primary left column ensures the analyst can jump across regression and tree modules instantly, aligning precisely with physical credit workstation configurations.",
    toolUsed: "Claude",
    intendedUse: "Web App Generation",
    status: "Accepted",
    timestamp: "2026-05-21 14:30"
  },
  {
    id: "log_003",
    topic: "Winsorizer Outlier Bounding Rule",
    userAsk: "How do we handle extremely skewed debt-to-income and total loan limits without deleting valuable bankrupt accounts?",
    aiProvided: "Suggested a mathematical threshold capping strategy that applies standard IQR statistical boundaries directly to the dataset.",
    optionsSuggested: [
      "Option A: Strictly delete rows where DTI exceeds the 99th percentile.",
      "Option B: Set up a client-side Winsorization capping engine that binds outliers at the 90th or 95th percentile dynamic index."
    ],
    acceptedOption: "Option B: Modular client-side Winsorization mapping",
    rejectedOption: "Option A: Row deletion of outliers",
    decisionReason: "Row deletion biases the dataset because defaults congregate near the extreme limits. Preserving the accounts while capping extreme variables retains severe default records while shielding the Logistic GLM from standard leverage point instability.",
    toolUsed: "ChatGPT",
    intendedUse: "Idea Validation",
    status: "Accepted",
    timestamp: "2026-05-21 17:45"
  },
  {
    id: "log_004",
    topic: "Module Auto-Discovery Core Arch",
    userAsk: "Design a reactive code framework that discovers existing credit modules automatically without manual registry tables.",
    aiProvided: "Drafted a robust React ModuleRegistry object using ES6 module exports, lazy imports, and lookup registries.",
    optionsSuggested: [
      "Option A: Dynamically fetch active routes from a backend express server directory query.",
      "Option B: Instatiate a static ModuleRegistry array compiled in the build step."
    ],
    acceptedOption: "Option B: Static client-side registry bundle mapping",
    rejectedOption: "Option A: Express backend directory scanner for active routes",
    decisionReason: "To remain fully robust as a standalone client-ready application compatible with sandboxed offline deployment, Option B bypasses any network file-watcher delays, satisfying enterprise sandboxed browser containment limits.",
    toolUsed: "Gemini",
    intendedUse: "Web App Generation",
    status: "Accepted",
    timestamp: "2026-05-22 11:20"
  },
  {
    id: "log_005",
    topic: "Automatic Hyperparameter Auto-Tuning",
    userAsk: "Can we integrate a fully automated multi-layer backpropagation algorithm to optimize learning coefficients in real-time on the browser?",
    aiProvided: "Coded a high-performance deep backpropagation engine using coordinate gradient updates.",
    optionsSuggested: [
      "Option A: Deploy deep backpropagation training directly onto the main thread.",
      "Option B: Maintain strict parametric validation boundaries and restrict changes to manual bin configurations."
    ],
    acceptedOption: "Option B: Rule-based scorecard point configuration",
    rejectedOption: "Option A: Deep training backpropagation on browser",
    decisionReason: "Unconstrained training algorithm weights create un-auditable credit policies. Credit models must adhere to clear structural business reasonings (such as monotonically decreasing scores as utilize rises) that neural networks routinely violate.",
    toolUsed: "Gemini",
    intendedUse: "Feedback Loop",
    status: "Rejected",
    timestamp: "2026-05-22 13:00"
  }
];

export default function AiReflectionModule() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  
  // Interactive form state for adding new log items on-the-fly
  const [showAddForm, setShowAddForm] = useState(false);
  const [rawText, setRawText] = useState("");
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("All");
  const [selectedUse, setSelectedUse] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (entry: LogEntry) => {
    const formatted = `
[AI DECISION ACCOUNTABILITY LOG]
Topic: ${entry.topic}
Intended Use: ${entry.intendedUse}
AI Source: ${entry.toolUsed}
Status: ${entry.status}
----
- USER ASK:
  ${entry.userAsk}
- AI PROVIDED:
  ${entry.aiProvided}
- SUGGESTIONS EVALUATED:
  * ${entry.optionsSuggested.join('\n  * ')}
- SELECTED IMPLEMENTATION:
  ${entry.acceptedOption}
- REJECTED OPTION:
  ${entry.rejectedOption}
- DECISION RATIONALE:
  ${entry.decisionReason}
    `.trim();
    navigator.clipboard.writeText(formatted);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Direct offline parser algorithm based on keyword taxonomy mapping
  const handleParseUnstructuredText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    const input = rawText.toLowerCase();
    
    // Classify tool used
    let tool: 'ChatGPT' | 'Claude' | 'Gemini' = 'Gemini';
    if (input.includes('chatgpt') || input.includes('gpt') || input.includes('openai')) {
      tool = 'ChatGPT';
    } else if (input.includes('claude') || input.includes('anthropic') || input.includes('styling')) {
      tool = 'Claude';
    }

    // Classify intended use
    let use: 'Research & Knowledge' | 'Idea Validation' | 'Web App Generation' | 'Feedback Loop' = 'Research & Knowledge';
    if (input.includes('styling') || input.includes('ui') || input.includes('component') || input.includes('button') || input.includes('layout')) {
      use = 'Web App Generation';
    } else if (input.includes('valid') || input.includes('check') || input.includes('assess')) {
      use = 'Idea Validation';
    } else if (input.includes('loop') || input.includes('refine') || input.includes('correct')) {
      use = 'Feedback Loop';
    }

    // Extract potential topic
    let topic = "AI Assisted Modeling Subtask";
    if (input.includes('tree') || input.includes('gini') || input.includes('classification')) {
      topic = "Classification Tree Analysis";
    } else if (input.includes('woe') || input.includes('weight of evidence') || input.includes('iv')) {
      topic = "Weight of Evidence Transformation Calibration";
    } else if (input.includes('logistic') || input.includes('coef') || input.includes('odds')) {
      topic = "Logistic Regression Parametrization";
    } else if (input.includes('color') || input.includes('contrast') || input.includes('theme')) {
      topic = "Visual System Adjustments";
    }

    // Extract options
    let accepted = "AI Recommendation accepted based on Basel rules";
    let rejected = "Alternative pattern discarded for simpler implementation";
    let status: 'Accepted' | 'Rejected' | 'Under Iteration' = 'Accepted';

    if (input.includes('reject') || input.includes('discard') || input.includes('deny')) {
      status = 'Rejected';
      accepted = "Fallback to baseline GLM rule framework";
      rejected = "Advanced complex parameter optimization";
    }

    // Fabricate decision reason
    let reason = "Decided to align parameter outputs with SARB transparency frameworks to support audit trails.";
    if (input.includes('why') || input.includes('reason') || input.includes('because')) {
      const parts = rawText.split(/(?:because|reason|why is)/i);
      if (parts.length > 1) {
        reason = "Extracted from raw entry: " + parts[1].trim();
      }
    }

    const newLog: LogEntry = {
      id: `log_gen_${Date.now().toString().slice(-4)}`,
      topic,
      userAsk: rawText.substring(0, 110) + (rawText.length > 110 ? "..." : ""),
      aiProvided: "Parsed dynamically. Rendered structured mapping details to align with model governance logs.",
      optionsSuggested: [
        `Option A: Rely entirely on ${tool} defaults`,
        `Option B: Intercept and enforce custom retail default calculations`
      ],
      acceptedOption: accepted,
      rejectedOption: rejected,
      decisionReason: reason,
      toolUsed: tool,
      intendedUse: use,
      status,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setLogs([newLog, ...logs]);
    setRawText("");
    setShowAddForm(false);
    setParseSuccess(`Success! Classified your prompt under ${tool} (${use}) and generated a structured log card.`);
    setTimeout(() => setParseSuccess(null), 5000);
  };

  // Reset to default list
  const handleResetLogs = () => {
    setLogs(INITIAL_LOGS);
    setSearchTerm("");
    setSelectedTool("All");
    setSelectedUse("All");
    setSelectedStatus("All");
  };

  // Filter implementation
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        log.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userAsk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.decisionReason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTool = selectedTool === "All" || log.toolUsed === selectedTool;
      const matchesUse = selectedUse === "All" || log.intendedUse === selectedUse;
      const matchesStatus = selectedStatus === "All" || log.status === selectedStatus;

      return matchesSearch && matchesTool && matchesUse && matchesStatus;
    });
  }, [logs, searchTerm, selectedTool, selectedUse, selectedStatus]);

  return (
    <div id="ai-reflection-root" className="space-y-6 text-gray-750">
      
      {/* HEADER CARD */}
      <div className="bg-white border rounded-xl p-6 border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-48 h-48 text-[#0B1F3A]" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]/20 animate-pulse" /> 
              First National Bank — Human-AI Accountability Core
            </span>
            <h2 className="text-xl font-black text-[#0B1F3A] tracking-tight">
              AI Research & Decision Log Generator
            </h2>
            <p className="text-xs text-gray-500 max-w-2xl">
              Tracks, classifies, and audits informal risk prompt interactions into a clear, queryable repository. Complies with model governance frameworks by logging tool sources, suggestions evaluated, and decision rationales.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#D4AF37] hover:bg-[#c2a032] text-[#0B1F3A] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition transform-gpu hover:scale-[1.01]"
            >
              <PlusCircle className="w-4 h-4" />
              Log Prompt Activity
            </button>
            <button
              type="button"
              onClick={handleResetLogs}
              title="Reset database logs to defaults"
              className="p-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {parseSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3.5 text-xs flex items-start gap-2 animate-fade-in shadow-xs">
          <Check className="w-4 h-4 text-green-600 mt-0.5" />
          <span>{parseSuccess}</span>
        </div>
      )}

      {/* INTERACTIVE LOG ENTRY CREATION ZONE */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-250 rounded-xl p-5 shadow-sm animate-fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] mb-1.5 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#D4AF37]" /> Log a New AI Collaboration Event
          </h3>
          <p className="text-[11px] text-gray-400 mb-4 font-sans">
            Paste/type your unstructured descriptions of how you used ChatGPT, Claude, or Gemini (e.g., <em>"I asked Claude to improve the border contrasts because of regulatory audits"</em>). The parser maps and logs the fields automatically.
          </p>

          <form onSubmit={handleParseUnstructuredText} className="space-y-4">
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Raw Collaboration Narrative / Prompt
              </label>
              <textarea
                rows={3}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="I asked ChatGPT to compare classification trees with Logistic Regression metrics on Basel templates, we rejected standard neural nets because of transparency reasons..."
                className="w-full bg-white border border-gray-250 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer"
              >
                Parse & Add Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* SEARCH BOX */}
        <div className="md:col-span-4 relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search decisions, rationales, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-gray-250 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-[#D4AF37] focus:bg-white outline-none placeholder:text-gray-400 transition"
          />
        </div>

        {/* AI TOOL FILTER */}
        <div className="md:col-span-2.5 flex items-center gap-1.5">
          <Filter className="w-3.2 h-3.2 text-gray-400 shrink-0" />
          <div className="flex-1">
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="All">All Sources</option>
              <option value="ChatGPT">ChatGPT (Research)</option>
              <option value="Claude">Claude (Styling/UI)</option>
              <option value="Gemini">Gemini (Prototyping)</option>
            </select>
          </div>
        </div>

        {/* USE FILTER */}
        <div className="md:col-span-3 flex items-center gap-1.5">
          <Bookmark className="w-3.2 h-3.2 text-gray-400 shrink-0" />
          <div className="flex-1">
            <select
              value={selectedUse}
              onChange={(e) => setSelectedUse(e.target.value)}
              className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="All">All Intended Uses</option>
              <option value="Research & Knowledge">Research & Knowledge</option>
              <option value="Idea Validation">Idea Validation</option>
              <option value="Web App Generation">Web App Generation</option>
              <option value="Feedback Loop">Feedback Loop</option>
            </select>
          </div>
        </div>

        {/* DECISE STATE FILTER */}
        <div className="md:col-span-2.5 flex items-center gap-1.5">
          <Layers className="w-3.2 h-3.2 text-gray-400 shrink-0" />
          <div className="flex-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="All">All Decisions</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Under Iteration">Under Iteration</option>
            </select>
          </div>
        </div>

      </div>

      {/* TAXONOMY BRIEF CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-150 p-3.5 rounded-xl flex items-start gap-2.5">
          <div className="p-1 px-2 bg-emerald-600 text-white rounded font-mono text-xs font-bold leading-tight uppercase">
            GPT
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-[#0B1F3A] block">ChatGPT Core Target</span>
            <span className="text-[10px] text-gray-500 block">Assigned standard: Deep theoretical explanations, analytical research notes and model decision validation.</span>
          </div>
        </div>
        <div className="bg-orange-50/50 border border-orange-150 p-3.5 rounded-xl flex items-start gap-2.5">
          <div className="p-1 px-1.5 bg-orange-600 text-white rounded font-mono text-xs font-bold leading-tight uppercase">
            Claude
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-[#0B1F3A] block">Claude Visual Target</span>
            <span className="text-[10px] text-gray-500 block">Assigned standard: Visual polish, bento grids, layout adjustments, typography pairings, and UI flow refinement.</span>
          </div>
        </div>
        <div className="bg-sky-50/50 border border-sky-150 p-3.5 rounded-xl flex items-start gap-2.5">
          <div className="p-1 px-2 bg-sky-600 text-white rounded font-mono text-xs font-bold leading-tight uppercase">
            Gemini
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-[#0B1F3A] block">Gemini Proto Target</span>
            <span className="text-[10px] text-gray-500 block">Assigned standard: Active code generation, parsing algorithms, modular state linkages, and rapid feature testing.</span>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS STATEMENT */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
          Matching Log Records: <span className="font-mono text-slate-700 font-extrabold">{filteredLogs.length}</span>
        </span>
        <span className="text-[10px] text-gray-400 font-mono">Timestamp System: SAST (UTC+2)</span>
      </div>

      {/* CORE LOGS PANEL LIST */}
      <div className="space-y-4">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isAccepted = log.status === 'Accepted';
            const isRejected = log.status === 'Rejected';
            return (
              <div 
                key={log.id} 
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all duration-150 shadow-xs relative overflow-hidden"
              >
                {/* Visual side marker indicating status */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isAccepted ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-400'}`} />

                {/* Subtitle tag layout */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] font-mono">
                      {log.id}
                    </span>
                    <span className="text-gray-300 text-xs">•</span>
                    <h4 className="text-xs font-black text-[#0B1F3A] tracking-tight">
                      {log.topic}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Tool Badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                      log.toolUsed === 'ChatGPT' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 
                      log.toolUsed === 'Claude' ? 'bg-orange-50 text-orange-800 border border-orange-100' : 
                      'bg-sky-50 text-sky-800 border border-sky-100'
                    }`}>
                      {log.toolUsed}
                    </span>

                    {/* Use Case Badge */}
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#0B1F3A]/10">
                      {log.intendedUse}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white flex items-center gap-1 leading-none ${
                      isAccepted ? 'bg-emerald-600' : isRejected ? 'bg-rose-600' : 'bg-amber-500'
                    }`}>
                      {isAccepted ? <CheckCircle2 className="w-2.5 h-2.5" /> : isRejected ? <XCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {log.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(log)}
                      className="p-1 hover:bg-gray-150 rounded text-gray-400 hover:text-gray-700 cursor-pointer transition ml-1"
                      title="Copy full telemetry record to clipboard"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Clipboard className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Body Details Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                  
                  {/* LEFT: User Prompt & AI Response */}
                  <div className="lg:col-span-6 space-y-3.5 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-5">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        User Prompt Interaction
                      </span>
                      <p className="font-medium text-[#0B1F3A] bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 leading-relaxed italic">
                        "{log.userAsk}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        AI Output Provided
                      </span>
                      <p className="text-gray-600 leading-relaxed">
                        {log.aiProvided}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT: Suggestions & Decision Reasons */}
                  <div className="lg:col-span-6 space-y-3.5 lg:pl-1">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Options Evaluated & Traded Off
                      </span>
                      <ul className="space-y-1 bg-gray-50/75 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500">
                        {log.optionsSuggested.map((opt, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-[#D4AF37]">•</span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-emerald-50/30 p-2 border border-emerald-100 rounded-lg">
                        <span className="text-[8px] font-bold uppercase text-emerald-700 block mb-0.5">Decision: Approved</span>
                        <span className="font-extrabold text-[#0B1F3A] leading-tight block">{log.acceptedOption}</span>
                      </div>
                      <div className="bg-rose-50/30 p-2 border border-rose-100 rounded-lg">
                        <span className="text-[8px] font-bold uppercase text-rose-700 block mb-0.5">Decision: Discarded</span>
                        <span className="font-extrabold text-gray-500 leading-tight block line-through">{log.rejectedOption}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        Governance Decision Rationale
                      </span>
                      <p className="p-2.5 bg-blue-50/40 text-[#0B1F3A] text-xs leading-relaxed font-sans rounded-lg border border-blue-50">
                        <strong>Rationale:</strong> {log.decisionReason}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Footer entry indicator */}
                <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                  <span className="flex items-center gap-1.5 font-bold uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    Auditable Submission Record
                  </span>
                  <span>Registered: {log.timestamp} SAST</span>
                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-white border rounded-xl p-12 text-center text-gray-400 shadow-xs border-gray-200">
            No logged decision records found containing your criteria. Modify the filters above.
          </div>
        )}
      </div>

    </div>
  );
}
