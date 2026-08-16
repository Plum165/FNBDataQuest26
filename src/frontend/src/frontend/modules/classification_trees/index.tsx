import React, { useState, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import {
  HelpCircle,
  Layers,
  ArrowDown,
  ShieldAlert,
  CheckCircle,
  Info,
  Sliders,
  AlertTriangle,
  BookOpen,
  GitMerge,
  Award,
  Database,
  TrendingUp,
  BarChart2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Undo2,
  Percent,
} from 'lucide-react';

export const MODULE = {
  name: "Classification Trees",
  icon: "Network",
  description: "Visualize hierarchical credit segmentation rules and splits to isolate high-default loan pools.",
  route: "/classification_trees"
};

// --- TREE NODE INTERFACE ---
export interface TreeNode {
  id: string; 
  samples: number;
  bads: number;
  goods: number;
  defaultRate: number;
  impurity: number;
  depth: number;
  isLeaf: boolean;
  label: string;
  variable?: 'fico' | 'dti' | 'income' | 'loanAmount' | 'employmentLength';
  threshold?: number;
  gain?: number;
  left?: TreeNode;
  right?: TreeNode;
  pathCondition?: string;
  accounts?: any[];
}

// --- TREE CANDIDATE SPLIT INTERFACE ---
export interface SplitCandidate {
  variable: 'fico' | 'dti' | 'income' | 'loanAmount' | 'employmentLength';
  threshold: number;
  leftCount: number;
  rightCount: number;
  leftBads: number;
  rightBads: number;
  leftImpurity: number;
  rightImpurity: number;
  weightedImpurity: number;
  gain: number;
}

// Helper to calculate impurity metric (Gini or Entropy)
export function calculateImpurity(bads: number, total: number, metric: 'gini' | 'entropy'): number {
  if (total === 0) return 0;
  const pBad = bads / total;
  const pGood = (total - bads) / total;

  if (metric === 'gini') {
    return 1 - (pBad * pBad + pGood * pGood);
  } else {
    if (pBad === 0 || pGood === 0) return 0;
    return -(pBad * Math.log2(pBad) + pGood * Math.log2(pGood));
  }
}

// Helper to get variable display name
export function getVarLabel(variable: string): string {
  switch (variable) {
    case 'fico': return 'FICO Score';
    case 'dti': return 'DTI Ratio (%)';
    case 'income': return 'Annual Income (k ZAR)';
    case 'loanAmount': return 'Loan Amount (k ZAR)';
    case 'employmentLength': return 'Employment Tenure';
    default: return variable;
  }
}

// Dynamic recursive TreeNode visualizer component
function RenderTreeNode({
  node,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const isSelected = selectedId === node.id;
  const hasChildren = !node.isLeaf && node.left && node.right;

  return (
    <div className="flex flex-col items-center flex-1 min-w-[180px] px-1 relative">
      {/* Node Button Card */}
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`w-52 p-3.5 rounded-xl text-center shadow-xs relative transition duration-150 border cursor-pointer hover:border-[#D4AF37] ${
          isSelected
            ? 'ring-2 ring-[#D4AF37] bg-[#0B1F3A] text-white border-[#0B1F3A]'
            : 'bg-[#F8FAFC] text-gray-800 border-gray-200'
        }`}
      >
        {node.pathCondition && (
          <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-white font-bold font-mono text-[8.5px] tracking-tight px-1.5 py-0.5 rounded shadow ${
            node.id.endsWith('-L') ? 'bg-[#D4AF37]' : 'bg-[#0B1F3A] border border-white/10 text-[#D4AF37]'
          }`}>
            {node.pathCondition}
          </span>
        )}
        <span className="text-[8px] uppercase font-mono font-bold tracking-wider opacity-60 block">
          {node.id === 'Root' ? 'Root Segment' : `Level ${node.depth}`}
        </span>
        <span className="font-bold text-[11px] mt-1 block truncate">
          {node.isLeaf ? (
            <span className={isSelected ? 'text-[#D4AF37] font-semibold' : 'text-[#0B1F3A] font-semibold'}>{node.label}</span>
          ) : (
            `Split: ${getVarLabel(node.variable!)}`
          )}
        </span>
        
        <div className="mt-1.5 text-[9px] font-mono py-0.5 px-1.5 rounded bg-black/5 inline-block text-gray-650">
          Size: {node.samples} | {node.defaultRate.toFixed(1)}% Def
        </div>

        {node.isLeaf && (
          <div className="mt-1.5">
            <span className={`text-[8px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded ${
              node.defaultRate > 15 ? 'bg-red-50 text-red-700 font-bold border border-red-200' : 'bg-green-50 text-green-700 font-bold border border-green-200'
            }`}>
              {node.label}
            </span>
          </div>
        )}
      </button>

      {/* Children connector lines and recursive render */}
      {hasChildren ? (
        <div className="flex flex-col items-center w-full mt-2">
          {/* Vertical stem line */}
          <div className="w-[1px] h-3 bg-gray-200"></div>
          
          {/* Left/Right branches container */}
          <div className="flex w-full relative pt-2">
            {/* Horizontal branch line connecting centers of left and right children */}
            <div className="absolute top-0 left-[25%] right-[25%] h-[1px] bg-gray-200"></div>
            
            <div className="w-1/2 flex justify-center">
              <RenderTreeNode node={node.left!} selectedId={selectedId} onSelect={onSelect} />
            </div>
            <div className="w-1/2 flex justify-center">
              <RenderTreeNode node={node.right!} selectedId={selectedId} onSelect={onSelect} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ClassificationTreesModule({ context }: { context: any }) {
  const { activeAccounts, currentFileName } = useAppState();

  // --- LOCAL COMPONENT STATES ---
  const [activeTab, setActiveTab] = useState<'decision_tree' | 'overfitting_sandbox' | 'concepts_math'>('decision_tree');
  const [criterion, setCriterion] = useState<'gini' | 'entropy'>('gini');
  const [maxDepth, setMaxDepth] = useState<number>(2);
  const [minSamplesSplit, setMinSamplesSplit] = useState<number>(10);
  
  // Custom interactive node selection state for calculation logs
  const [selectedNodeId, setSelectedNodeId] = useState<string>("Root");

  // Noise injection simulation state
  const [noiseInjected, setNoiseInjected] = useState<boolean>(false);
  const [customNoiseCards, setCustomNoiseCards] = useState<any[]>([]);

  // Manual Hand Calculations Sandbox state
  const [manualBads, setManualBads] = useState<number>(4);
  const [manualGoods, setManualGoods] = useState<number>(6);
  const [manualSplitVal, setManualSplitVal] = useState<number>(620);
  const [manualLeftBads, setManualLeftBads] = useState<number>(3);
  const [manualLeftGoods, setManualLeftGoods] = useState<number>(1);

  // --- DERIVE PORTFOLIO WITH OPTIONAL NOISE INJECTION ---
  const baselineAccounts = useMemo(() => {
    return activeAccounts;
  }, [activeAccounts]);

  const treeAccounts = useMemo(() => {
    if (!noiseInjected) {
      return baselineAccounts;
    }
    // Append highly erratic outliers designed to trigger overfitting
    return [...baselineAccounts, ...customNoiseCards];
  }, [baselineAccounts, noiseInjected, customNoiseCards]);

  // Inject 20 artificial outliers
  const handleToggleNoise = () => {
    if (noiseInjected) {
      setNoiseInjected(false);
    } else {
      const generatedOutliers = [];
      for (let i = 0; i < 24; i++) {
        const isOdd = i % 2 === 0;
        generatedOutliers.push({
          id: `FNB-NOISE-${i}`,
          fico: isOdd ? 820 : 510, // Extreme mismatching FICO
          dti: isOdd ? 78.5 : 12.0, // High DTI but low default or vice versa
          income: isOdd ? 180 : 25,
          loanAmount: isOdd ? 190 : 35,
          employmentLength: isOdd ? 18 : 1,
          defaulted: isOdd ? 1 : 0, // High FICO defaulted (noise), Low FICO solvent (noise)
          anomalyFlag: false
        });
      }
      setCustomNoiseCards(generatedOutliers);
      setNoiseInjected(true);
    }
  };

  // --- OFFLINE CART ALGORITHM BUILDER ---
  // Returns all evaluation split candidates ranked by mathematical impurity reduction
  const findSplitsAtNode = (accounts: any[]): SplitCandidate[] => {
    const list: SplitCandidate[] = [];
    if (accounts.length < 5) return [];

    const variables: Array<'fico' | 'dti' | 'income' | 'loanAmount' | 'employmentLength'> = [
      'fico', 'dti', 'income', 'loanAmount', 'employmentLength'
    ];

    const totalN = accounts.length;
    const parentBads = accounts.filter(a => a.defaulted === 1).length;
    const parentImpurity = calculateImpurity(parentBads, totalN, criterion);

    for (const V of variables) {
      // Gather non-corrupt values for testing thresholds
      const vals = accounts
        .map(a => a[V])
        .filter(val => val !== undefined && val !== -99 && !isNaN(val));

      if (vals.length < 2) continue;

      // Sample a subset of quantiles/steps to guarantee high UI rendering speed
      const sortedUnique = Array.from(new Set(vals)).sort((a, b) => a - b);
      let testThresholds: number[] = [];

      if (sortedUnique.length <= 12) {
        for (let i = 0; i < sortedUnique.length - 1; i++) {
          testThresholds.push((sortedUnique[i] + sortedUnique[i + 1]) / 2);
        }
      } else {
        const minVal = sortedUnique[0];
        const maxVal = sortedUnique[sortedUnique.length - 1];
        const step = (maxVal - minVal) / 11;
        for (let i = 1; i <= 10; i++) {
          testThresholds.push(minVal + step * i);
        }
      }

      for (const T of testThresholds) {
        const left = accounts.filter(a => a[V] !== -99 && a[V] < T);
        const right = accounts.filter(a => a[V] === -99 || a[V] >= T);

        if (left.length < 2 || right.length < 2) continue;

        const leftN = left.length;
        const rightN = right.length;
        const leftBads = left.filter(a => a.defaulted === 1).length;
        const rightBads = right.filter(a => a.defaulted === 1).length;

        const lImp = calculateImpurity(leftBads, leftN, criterion);
        const rImp = calculateImpurity(rightBads, rightN, criterion);

        const weightedImp = (leftN / totalN) * lImp + (rightN / totalN) * rImp;
        const gain = parentImpurity - weightedImp;

        list.push({
          variable: V,
          threshold: Math.round(T * 10) / 10,
          leftCount: leftN,
          rightCount: rightN,
          leftBads,
          rightBads,
          leftImpurity: lImp,
          rightImpurity: rImp,
          weightedImpurity: weightedImp,
          gain
        });
      }
    }

    return list.sort((a, b) => b.gain - a.gain);
  };

  // Build recursive Decision Tree structure down to maxDepth
  const liveTree: TreeNode = useMemo(() => {
    function construct(
      subset: any[],
      depth: number,
      nodeId: string,
      pathCond: string
    ): TreeNode {
      const n = subset.length;
      const bads = subset.filter(a => a.defaulted === 1).length;
      const goods = n - bads;
      const dRate = n > 0 ? (bads / n) * 100 : 0;
      const imp = calculateImpurity(bads, n, criterion);

      const leafNode: TreeNode = {
        id: nodeId,
        samples: n,
        bads,
        goods,
        defaultRate: dRate,
        impurity: imp,
        depth,
        isLeaf: true,
        label: dRate >= 20 ? "DECLINE CLASS" : "APPROVE CLASS",
        pathCondition: pathCond,
        accounts: subset
      };

      if (depth >= maxDepth || n < minSamplesSplit || imp === 0) {
        return leafNode;
      }

      const splits = findSplitsAtNode(subset);
      if (splits.length === 0 || splits[0].gain <= 0.0001) {
        return leafNode;
      }

      const winningSplit = splits[0];
      const leftSubset = subset.filter(a => a[winningSplit.variable] !== -99 && a[winningSplit.variable] < winningSplit.threshold);
      const rightSubset = subset.filter(a => a[winningSplit.variable] === -99 || a[winningSplit.variable] >= winningSplit.threshold);

      if (leftSubset.length === 0 || rightSubset.length === 0) {
        return leafNode;
      }

      const leftChildId = `${nodeId}-L`;
      const rightChildId = `${nodeId}-R`;

      const varDisplay = winningSplit.variable === 'fico' ? 'FICO' : winningSplit.variable === 'dti' ? 'DTI' : winningSplit.variable;
      const leftCond = `${varDisplay} < ${winningSplit.threshold}`;
      const rightCond = `${varDisplay} ≥ ${winningSplit.threshold}`;

      return {
        ...leafNode,
        isLeaf: false,
        variable: winningSplit.variable,
        threshold: winningSplit.threshold,
        gain: winningSplit.gain,
        left: construct(leftSubset, depth + 1, leftChildId, leftCond),
        right: construct(rightSubset, depth + 1, rightChildId, rightCond)
      };
    }

    return construct(treeAccounts, 0, "Root", "All Accounts");
  }, [treeAccounts, maxDepth, criterion, minSamplesSplit]);

  // Flatten tree nodes so memory lookup remains painless
  const flattenedNodes = useMemo(() => {
    const map: Record<string, TreeNode> = {};
    function traverse(n: TreeNode) {
      map[n.id] = n;
      if (n.left) traverse(n.left);
      if (n.right) traverse(n.right);
    }
    traverse(liveTree);
    return map;
  }, [liveTree]);

  // Selected node computational data
  const selectedNodeObject = useMemo(() => {
    return flattenedNodes[selectedNodeId] || liveTree;
  }, [flattenedNodes, selectedNodeId, liveTree]);

  // Calculate sorted evaluation candidates details for the selected active node
  const nodeCandidatesCalculations = useMemo(() => {
    if (!selectedNodeObject || selectedNodeObject.isLeaf) return [];
    
    // Evaluate splits specifically on the subset segment trapped at this node
    const counts = selectedNodeObject.accounts || treeAccounts;
    // (If accounts not stored directly, reconstruct subset from path identifiers)
    return findSplitsAtNode(selectedNodeObject.id === "Root" ? treeAccounts : getSubsetByNodeId(liveTree, selectedNodeObject.id));
  }, [selectedNodeObject, treeAccounts, liveTree]);

  function getSubsetByNodeId(root: TreeNode, id: string): any[] {
    const pathParts = id.split('-');
    let current = root;
    for (let i = 1; i < pathParts.length; i++) {
      const val = pathParts[i];
      if (val === 'L' && current.left) {
        current = current.left;
      } else if (val === 'R' && current.right) {
        current = current.right;
      }
    }
    return current.id === id ? (current.accounts || []) : [];
  }

  // --- NOISE OVERFITTING CHART GENERATOR DATA ---
  const learningCurvePoints = useMemo(() => {
    const list = [];
    const maxTestedDepth = [1, 2, 3, 4, 5, 6];
    
    for (const d of maxTestedDepth) {
      // Calculate typical misclassification patterns
      // Pre-calculated representative coordinates depicting standard structural overfitting
      const baseTrain = Math.max(4.5, 26 - d * 4.8);
      let baseValid = Math.max(7.2, 28 - d * 4.4);

      if (d >= 4) {
        // Validation error spikes up as depth grows excessively (overfitting)
        baseValid = 8.5 + (d - 3) * 3.8;
      }

      // If noise is injected, training error drops even lower while validation rate deteriorates aggressively
      const finalTrain = noiseInjected 
        ? Math.max(1.8, baseTrain - 3.2)
        : baseTrain;
        
      const finalValid = noiseInjected
        ? baseValid + 8.4 + (d * 1.5)
        : baseValid;

      list.push({
        depth: d,
        trainErr: Math.round(finalTrain * 10) / 10,
        validErr: Math.round(finalValid * 10) / 10
      });
    }
    return list;
  }, [noiseInjected]);

  // Manual sandbox derived variables
  const derivedManualProps = useMemo(() => {
    const total = manualBads + manualGoods;
    const parentGini = calculateImpurity(manualBads, total, 'gini');
    
    // Left Node Calculations
    const leftTotal = manualLeftBads + manualLeftGoods;
    const leftGini = calculateImpurity(manualLeftBads, leftTotal, 'gini');

    // Right Node Calculations
    const rightTotal = Math.max(0, total - leftTotal);
    const rightBads = Math.max(0, manualBads - manualLeftBads);
    const rightGoods = Math.max(0, manualGoods - manualLeftGoods);
    const rightGini = calculateImpurity(rightBads, rightTotal, 'gini');

    // Split calculations
    const weightedGini = total > 0 ? ((leftTotal / total) * leftGini + (rightTotal / total) * rightGini) : 0;
    const giniGain = parentGini - weightedGini;

    return {
      total,
      parentGini,
      leftTotal,
      leftGini,
      rightTotal,
      rightBads,
      rightGoods,
      rightGini,
      weightedGini,
      giniGain
    };
  }, [manualBads, manualGoods, manualLeftBads, manualLeftGoods]);

  return (
    <div className="space-y-6">
      
      {/* BRAND HEADER & DESCRIPTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#0B1F3A] tracking-tight flex items-center gap-2">
              <span className="p-1 px-2.5 bg-[#0B1F3A] text-[#D4AF37] font-black rounded text-[10px] uppercase font-mono tracking-wider">
                CART Lab
              </span>
              Decision Tree Credit Segmentation
            </h2>
            <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
              Analyze non-linear risk segments through recursive binary partitioning. Identify severe default risk groupings by evaluating custom thresholds, Gini Purities, and Early Stopping criteria.
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0 bg-gray-50 border p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('decision_tree')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'decision_tree' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
            >
              Interactive Tree
            </button>
            <button
              onClick={() => setActiveTab('overfitting_sandbox')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'overfitting_sandbox' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
            >
              Overfitting Simulator
            </button>
            <button
              onClick={() => {
                setActiveTab('concepts_math');
                setSelectedNodeId("Root");
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'concepts_math' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
            >
              Mathematical Notes
            </button>
          </div>
        </div>
      </div>

      {/* RENDER TAB 1: INTERACTIVE TREE EXPLORER */}
      {activeTab === 'decision_tree' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

            {/* Sidebar Adjustments Panel */}
            <div className="xl:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6">
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#D4AF37]" />
                  Hyperparameters
                </h3>
                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">CART Model</span>
              </div>

              {/* Impurity split criterion */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Impurity Criterion:
                </label>
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  <button
                    onClick={() => { setCriterion('gini'); setSelectedNodeId("Root"); }}
                    className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition ${criterion === 'gini' ? 'bg-[#0B1F3A] text-white' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Gini Impurity
                  </button>
                  <button
                    onClick={() => { setCriterion('entropy'); setSelectedNodeId("Root"); }}
                    className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition ${criterion === 'entropy' ? 'bg-[#0B1F3A] text-white' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Entropy (Gain)
                  </button>
                </div>
              </div>

              {/* Max Depth */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-650">
                  <span>Max Tree Depth:</span>
                  <span className="font-mono text-[#D4AF37]">{maxDepth} Levels</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={maxDepth}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value);
                    setMaxDepth(nextVal);
                    setSelectedNodeId("Root");
                  }}
                  className="w-full accent-[#0B1F3A] bg-gray-200 h-1 roundedcursor-pointer"
                />
                <span className="text-[9px] text-gray-400 block leading-tight">
                  Constrains the vertical splits count to prevent deep overfitting profiles.
                </span>
              </div>

              {/* Min Samples to Split */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-650">
                  <span>Min Samples per Split:</span>
                  <span className="font-mono text-[#D4AF37]">{minSamplesSplit} Loans</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="45"
                  step="2"
                  value={minSamplesSplit}
                  onChange={(e) => {
                    setMinSamplesSplit(Number(e.target.value));
                    setSelectedNodeId("Root");
                  }}
                  className="w-full accent-[#0B1F3A] bg-gray-200 h-1 rounded cursor-pointer"
                />
                <span className="text-[9px] text-gray-400 block leading-tight">
                  Stopping rule. Keeps any sparse leaf segments from partition.
                </span>
              </div>

              {/* Preprocessing Active Metadata */}
              <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-150 space-y-2.5">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                  Active Sample Info
                </span>
                <div className="text-xs space-y-1.5 text-gray-600 font-medium">
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="font-mono text-[#0B1F3A] truncate max-w-[130px] font-bold">{currentFileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Size:</span>
                    <span className="font-mono text-gray-800 font-bold">{treeAccounts.length} Loans</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Defaults:</span>
                    <span className="font-mono text-red-650 font-bold">
                      {treeAccounts.filter(a => a.defaulted === 1).length} ({((treeAccounts.filter(a => a.defaulted === 1).length / (treeAccounts.length || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {noiseInjected && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-[11px] text-amber-900 leading-normal">
                  <span className="font-bold flex items-center gap-1 mb-1 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Overfit Noise Triggered
                  </span>
                  Artificial outliers are mixed. Reduce Max Depth or raise Min split criteria to stabilize nodes below.
                </div>
              )}
            </div>

            {/* Tree Graphical Renderer */}
            <div className="xl:col-span-3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-x-auto">
              <div className="pb-4 mb-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">Hierarchical Segment Map</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click any internal node below to inspect full split mathematical options</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-green-500"></span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">SOLVENT COHORT</span>
                  <span className="w-2.5 h-2.5 rounded bg-red-500 ml-2"></span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">HIGH DEFAULT ZONE</span>
                </div>
              </div>

              {/* LIVE TREE DIAGRAM DRAWING */}
              <div className="min-w-[800px] flex flex-col items-center py-4 relative overflow-x-auto select-none">
                <RenderTreeNode
                  node={liveTree}
                  selectedId={selectedNodeId}
                  onSelect={setSelectedNodeId}
                />
              </div>
            </div>

          </div>

          {/* SPLIT CANDIDATES EVALUATION LOG (SHOW FULL CALCULATIONS) */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#D4AF37]" />
                  Internal Math Log: Splitting Calculations
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Examine competitive division thresholds for selected Node ID: <span className="font-mono bg-blue-50 text-[#0B1F3A] px-2 py-0.5 rounded text-[11px] font-bold">{selectedNodeId}</span>
                </p>
              </div>
              <div className="bg-gray-50 border py-1.5 px-3 rounded-lg text-xs font-bold flex gap-4 text-gray-650">
                <span>Node samples: <span className="font-mono text-[#0B1F3A] font-black">{selectedNodeObject?.samples}</span></span>
                <span>Parent Impurity ({criterion}): <span className="font-mono text-[#D4AF37] font-black">{selectedNodeObject?.impurity.toFixed(4)}</span></span>
              </div>
            </div>

            {selectedNodeObject?.isLeaf ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs">
                Node <strong className="text-gray-600 font-mono">"{selectedNodeId}"</strong> is a terminal leaf node (no further sub-splits according to early stopping settings). Hover or click on the parent internal node above to view candidates log.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-650 leading-relaxed bg-[#0B1F3A]/5 p-3 rounded-lg border border-[#0B1F3A]/10">
                  <span className="font-bold block text-[#0B1F3A] mb-1">How CART selects the best split:</span>
                  The algorithm evaluates splits using candidate thresholds, computing the weighted average of Left Child and Right Child Impurity. The winner maximizes:
                  <code className="block bg-white text-gray-700 font-mono p-2 rounded mt-2 border text-[11px] leading-tight">
                    Gain = Parent {criterion === 'gini' ? 'Gini' : 'Entropy'} - [ (Left_Size / Total_Size) * Gini_Left + (Right_Size / Total_Size) * Gini_Right ]
                  </code>
                </p>

                {/* Log list table */}
                <div className="overflow-x-auto border border-gray-150 rounded-xl">
                  <table className="w-full text-xs text-left text-gray-600 border-collapse">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Tested Attribute</th>
                        <th className="p-3 text-center">Cut Border</th>
                        <th className="p-3">Left Size / Dec Rate</th>
                        <th className="p-3">Right Size / Dec Rate</th>
                        <th className="p-3 text-center">Child Impurities</th>
                        <th className="p-3 font-mono text-right text-gray-800">Impurity Gain</th>
                        <th className="p-3 text-center">Result Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {nodeCandidatesCalculations.slice(0, 7).map((cand, idx) => {
                        const isWinner = idx === 0;
                        const leftRate = cand.leftCount > 0 ? (cand.leftBads / cand.leftCount) * 100 : 0;
                        const rightRate = cand.rightCount > 0 ? (cand.rightBads / cand.rightCount) * 100 : 0;

                        return (
                          <tr key={idx} className={`hover:bg-gray-50/50 ${isWinner ? 'bg-amber-50/40 font-semibold text-gray-900' : ''}`}>
                            <td className="p-3 font-bold text-gray-800">
                              {getVarLabel(cand.variable)}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-[#0B1F3A]">
                              {cand.variable === 'fico' ? cand.threshold : cand.variable === 'dti' ? `${cand.threshold}%` : cand.threshold}
                            </td>
                            <td className="p-3">
                              <span className="font-mono">{cand.leftCount}</span> loans <span className="opacity-70">({leftRate.toFixed(1)}% def)</span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono">{cand.rightCount}</span> loans <span className="opacity-70">({rightRate.toFixed(1)}% def)</span>
                            </td>
                            <td className="p-3 text-center font-mono text-[11px]">
                              L: {cand.leftImpurity.toFixed(3)} | R: {cand.rightImpurity.toFixed(3)}
                            </td>
                            <td className="p-3 font-mono text-right font-black text-blue-600">
                              {cand.gain.toFixed(5)}
                            </td>
                            <td className="p-3 text-center">
                              {isWinner ? (
                                <span className="bg-green-100 text-green-800 text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase block">
                                  WINNER SPLIT
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase block">
                                  EVALUATED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Show details for the winning split math */}
                {nodeCandidatesCalculations.length > 0 && (
                  <div className="bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20 p-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#a48624] tracking-wide block">
                      Worked Formula for Winner Split ({getVarLabel(nodeCandidatesCalculations[0].variable)} &lt; {nodeCandidatesCalculations[0].threshold})
                    </span>
                    <div className="font-mono text-xs text-gray-700 leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-2 bg-white rounded shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">1. Parent Impurity:</span>
                        I(P) = {selectedNodeObject?.impurity.toFixed(4)}
                      </div>
                      <div className="p-2 bg-white rounded shadow-sm">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">2. Weighted Children Imp.:</span>
                        I(Children) = ({nodeCandidatesCalculations[0].leftCount}/{selectedNodeObject?.samples}) * {nodeCandidatesCalculations[0].leftImpurity.toFixed(4)} + ({nodeCandidatesCalculations[0].rightCount}/{selectedNodeObject?.samples}) * {nodeCandidatesCalculations[0].rightImpurity.toFixed(4)} = <span className="font-bold text-[#0B1F3A]">{nodeCandidatesCalculations[0].weightedImpurity.toFixed(4)}</span>
                      </div>
                      <div className="p-2 bg-white rounded shadow-sm text-[#0B1F3A]">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">3. Split Gain:</span>
                        Gain = {selectedNodeObject?.impurity.toFixed(4)} - {nodeCandidatesCalculations[0].weightedImpurity.toFixed(4)} = <span className="font-black text-green-700">{nodeCandidatesCalculations[0].gain.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 2: OVERFITTING SANDBOX */}
      {activeTab === 'overfitting_sandbox' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Explanation, Outlier Sandbox Trigger */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0B1F3A] flex items-center gap-1.5">
                <AlertTriangle className="text-red-500 w-5 h-5 animate-pulse" />
                Understanding Overfitting in Decision Trees
              </h3>
              <p className="text-xs text-gray-500 leading-normal">
                Because trees partition space greedily, their branching can continue until every training account sits inside a single leaf. If the tree grows unconstrained (large depth, tiny sample-stopping thresholds), it memorizes normal statistical noise or temporary file outliers as a systemic trend. This ruins out-of-sample rating accuracy!
              </p>
            </div>

            <div className="space-y-3.5 pt-3 border-t">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Early Stopping Procedures (Pre-Pruning)</h4>
              <ul className="text-xs text-gray-650 space-y-2.5 leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-gray-800">Max Depth Limitation:</strong> Restricting levels (e.g., to 2) forces the algorithm to focus only on major macroeconomic patterns (FICO score classification) rather than minor details.
                </li>
                <li>
                  <strong className="text-gray-800">Minimum Split Size limit:</strong> Stopping splits if there are fewer than 20 loans left ensures leaves represent a valid sample of cases.
                </li>
                <li>
                  <strong className="text-gray-800">Post-Pruning / Cost-Complexity Pruning ($T_\alpha$):</strong> Grows a very deep tree, then removes branches that increase the sub-tree cost complexity error, where:
                  <code className="block bg-gray-50 border p-2 rounded text-gray-700 font-mono text-[11px] mt-1.5 leading-tight">
                    R_&alpha;(T) = MisclassificationRate(T) + &alpha; * |Terminal Leaves|
                  </code>
                </li>
              </ul>
            </div>

            <div className="bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-[#0B1F3A] block uppercase">Outlier Sandbox: Trigger Overfitting!</span>
              <p className="text-xs text-gray-650 leading-relaxed">
                Add 24 synthetic default outliers (high-FICO bankrupts, low-FICO gold payers) and watch how training error vs validation error values diverge.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleToggleNoise}
                  className={`px-4 py-2 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    noiseInjected
                      ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                      : 'bg-[#0B1F3A] text-white border-[#0B1F3A] hover:bg-[#0B1F3A]/90'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${noiseInjected ? 'animate-spin' : ''}`} />
                  {noiseInjected ? "Purge Outliers" : "Inject Outliers (Trigger Overfitting)"}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Learning Curve Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="border-b pb-3 border-gray-100">
              <h3 className="text-sm font-bold text-[#0B1F3A]">Dynamic Generalization Curve: Training vs. Validation</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Plotting error rate (%) against complexity (Depth count)</p>
            </div>

            {/* SVG Learning curve drawing */}
            <div className="relative border border-gray-100 rounded-xl p-4 bg-gray-50/40">
              <svg className="w-full h-64" viewBox="0 0 500 240">
                {/* Underfitting / Overfitting background blocks */}
                <rect x="50" y="20" width="130" height="180" fill="#E2E8F0" opacity="0.3" rx="4" />
                <rect x="320" y="20" width="130" height="180" fill="#FEE2E2" opacity="0.3" rx="4" />
                <text x="115" y="32" fontSize="9" fontWeight="bold" fill="#64748B" textAnchor="middle">UNDERFITTING ZONE</text>
                <text x="385" y="32" fontSize="9" fontWeight="bold" fill="#EF4444" textAnchor="middle">OVERFITTING ZONE</text>

                {/* Draw axes */}
                <line x1="50" y1="200" x2="450" y2="200" stroke="#94A3B8" strokeWidth="2" />
                <line x1="50" y1="20" x2="50" y2="200" stroke="#94A3B8" strokeWidth="2" />

                {/* Y-axis labels */}
                <text x="45" y="55" fontSize="9" textAnchor="end" fill="#64748B" className="font-mono">30%</text>
                <text x="45" y="100" fontSize="9" textAnchor="end" fill="#64748B" className="font-mono">20%</text>
                <text x="45" y="145" fontSize="9" textAnchor="end" fill="#64748B" className="font-mono">10%</text>
                <text x="45" y="195" fontSize="9" textAnchor="end" fill="#64748B" className="font-mono">0%</text>
                
                {/* Horizontal gridlines */}
                <line x1="50" y1="50" x2="450" y2="50" stroke="#E2E8F0" strokeDasharray="3" />
                <line x1="50" y1="100" x2="450" y2="100" stroke="#E2E8F0" strokeDasharray="3" />
                <line x1="50" y1="150" x2="450" y2="150" stroke="#E2E8F0" strokeDasharray="3" />

                {/* X-axis labels */}
                {learningCurvePoints.map((pt, i) => {
                  const x = 50 + (i * 70);
                  return (
                    <g key={i}>
                      <line x1={x} y1="198" x2={x} y2="202" stroke="#94A3B8" />
                      <text x={x} y="215" fontSize="9" textAnchor="middle" fill="#64748B" className="font-bold font-mono">
                        D={pt.depth}
                      </text>
                    </g>
                  );
                })}

                {/* Labels for graph axis */}
                <text x="250" y="235" fontSize="10" fontWeight="bold" fill="#334155" textAnchor="middle">
                  CART Tree Max Depth Limit (Complexity)
                </text>
                <text x="15" y="110" fontSize="10" fontWeight="bold" fill="#334155" transform="rotate(-90 15 110)" textAnchor="middle">
                  Misclassification Error (%)
                </text>

                {/* Line 1: Training Error */}
                {(() => {
                  const pointsStr = learningCurvePoints.map((pt, i) => {
                    const x = 50 + (i * 70);
                    // Map error% to visual height (y)
                    // y value: 200 is 0% error, 50 is 30% error
                    const y = 200 - (pt.trainErr / 30) * 150;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polyline
                      fill="none"
                      stroke="var(--fnb-navy)"
                      strokeWidth="3"
                      points={pointsStr}
                    />
                  );
                })()}

                {/* Line 2: Validation Error */}
                {(() => {
                  const pointsStr = learningCurvePoints.map((pt, i) => {
                    const x = 50 + (i * 70);
                    const y = 200 - (pt.validErr / 30) * 150;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polyline
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3"
                      strokeDasharray={noiseInjected ? "0" : "4 4"}
                      points={pointsStr}
                    />
                  );
                })()}

                {/* Dots overlay */}
                {learningCurvePoints.map((pt, i) => {
                  const x = 50 + (i * 70);
                  const trainY = 200 - (pt.trainErr / 30) * 150;
                  const validY = 200 - (pt.validErr / 30) * 150;

                  return (
                    <g key={i}>
                      <circle cx={x} cy={trainY} r="4" fill="#0B1F3A" />
                      <circle cx={x} cy={validY} r="4" fill="#EF4444" />
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="flex justify-center gap-6 text-[11px] font-bold border-t pt-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-1 bg-[#0B1F3A]"></div>
                  <span>Training Set Error</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-1 bg-red-500 border-dashed border-t-2"></div>
                  <span>Validation / Out-of-Sample Error</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-650 bg-gray-50 border p-4 rounded-xl leading-normal space-y-1.5">
              <span className="font-bold text-[#0B1F3A] block">Simulation Insights:</span>
              <span>
                {noiseInjected
                  ? "NOTICE: Injected outliers allow deep trees (Depth ≥ 4) to drive training error near 0%, but the Validation curve spikes severely to high levels. Overfitting has occurred! Reduce tree depth to 2 to generalize correctly."
                  : "Under clean baseline data, the validation error stabilizes at Depth=2 or 3. Restricting depth or cost complexity ensures stable Gini scoring profiles."
                }
              </span>
            </div>
          </div>

        </div>
      )}

      {/* RENDER TAB 3: MATHEMATICAL NOTES */}
      {activeTab === 'concepts_math' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          
          {/* Theory Reference Column */}
          <div className="xl:col-span-3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
              <BookOpen className="text-[#D4AF37] w-5 h-5" />
              CART Methodology & Baseline Formulations
            </h3>

            <div className="prose prose-sm max-w-none text-xs text-gray-650 space-y-4 leading-relaxed">
              <div>
                <h4 className="font-bold text-[#0B1F3A] text-xs uppercase block mb-1">Gini Impurity Equation ($1 - \sum p_k^2$)</h4>
                <p>
                  Measuring how often a randomly chosen element from the node would be incorrectly labeled. For credit risk, we have two classes: Good Solvent (0) and Bad defaulted (1).
                  <code className="block bg-gray-50 border p-2.5 rounded mt-1.5 font-mono text-gray-700">
                    Gini(Node) = 1 - [ (Solvent_Count/Total)^2 + (Defaulted_Count/Total)^2 ]
                  </code>
                  0.0 represents absolute purity (all solvent or all default); 0.5 represents an even, high-impurity mix of classes.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#0B1F3A] text-xs uppercase block mb-1">Entropy Calculation ($- \sum p_k \log_2 p_k$)</h4>
                <p>
                  Measures the expected message cost or chaos in bits. Perfect balance of positive and negative defaults gives Entropy = 1.0; complete purity yields 0.0.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#0B1F3A] text-xs uppercase block mb-1">Cost Complexity Pruning ($T_\alpha$)</h4>
                <p>
                  Post-pruning controls variance by optimizing $R_\alpha(T) = R(T) + \alpha |T|$. Level of $\alpha \ge 0$ parameterizes the premium per extra split block. Larger penalty coefficient collapses shallow splits to guarantee stability.
                </p>
              </div>

              <div className="p-3 bg-[#E2E8F0]/30 rounded-lg border">
                <span className="font-bold text-[#0B1F3A] uppercase text-[10px] block mb-1">Regulatory Stance</span>
                Decision trees provide excellent insights on segment-splitting. While the final model deployed to South African Reserve Bank (SARB) and Basel III is typically Logistic Regression scoring cards, we utilize shallow decision trees for exploratory threshold selection.
              </div>
            </div>
          </div>

          {/* Hands-on Simple Sandbox Math Workspace */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-[#D4AF37]" />
                Interactive worked examples
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Toggle numbers to calculate the fractions step-by-step</p>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-650 block">1. Set parent balance sample size:</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-bold">Good (Solvent) loans</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setManualGoods(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-[#0B1F3A] w-6 text-center">{manualGoods}</span>
                    <button
                      onClick={() => setManualGoods(prev => Math.min(25, prev + 1))}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-bold text-red-650">Bad (Defaulted) loans</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setManualBads(prev => Math.max(1, prev - 1));
                        setManualLeftBads(prev => Math.min(prev, Math.max(1, manualBads - 2)));
                      }}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-[#0B1F3A] w-6 text-center">{manualBads}</span>
                    <button
                      onClick={() => setManualBads(prev => Math.min(25, prev + 1))}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-gray-650 block border-t pt-3">2. Split Left child distribution subset:</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-bold">Left Goods (FICO &lt; {manualSplitVal})</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setManualLeftGoods(prev => Math.max(0, prev - 1))}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-[#0B1F3A] w-6 text-center">{manualLeftGoods}</span>
                    <button
                      onClick={() => setManualLeftGoods(prev => Math.min(manualGoods, prev + 1))}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-bold text-red-650">Left Bads (FICO &lt; {manualSplitVal})</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setManualLeftBads(prev => Math.max(0, prev - 1))}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-[#0B1F3A] w-6 text-center">{manualLeftBads}</span>
                    <button
                      onClick={() => setManualLeftBads(prev => Math.min(manualBads, prev + 1))}
                      className="w-7 h-7 bg-gray-100 border text-xs font-bold rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Fractional Math Visual Proof Outputs */}
              <div className="bg-[#0B1F3A] text-white rounded-xl p-4 space-y-3 font-mono text-[11px] border border-[#0B1F3A]">
                <div className="pb-1.5 border-b border-white/10 font-bold text-[#D4AF37] uppercase text-[10px] tracking-wide">
                  Real-time worked proof:
                </div>
                <div>
                  <span className="opacity-70 text-gray-300">Total samples (N):</span> {derivedManualProps.total || 0} ({manualBads} Bad, {manualGoods} Good)
                </div>
                <div>
                  <span className="text-[#a5c2f4]">Parent Gini:</span>
                  <div className="mt-1 pl-2 text-gray-300">
                    1 - [ ({manualGoods}/{derivedManualProps.total})^2 + ({manualBads}/{derivedManualProps.total})^2 ] = <span className="text-white font-bold">{derivedManualProps.parentGini.toFixed(4)}</span>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2">
                  <span className="text-[#a5c2f4]">Left Child (N={derivedManualProps.leftTotal}):</span>
                  <div className="mt-1 pl-2 text-gray-300">
                     1 - [ ({manualLeftGoods}/{derivedManualProps.leftTotal || 1})^2 + ({manualLeftBads}/{derivedManualProps.leftTotal || 1})^2 ] = <span className="text-white font-bold">{derivedManualProps.leftGini.toFixed(4)}</span>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2">
                  <span className="text-[#a5c2f4]">Right Child (N={derivedManualProps.rightTotal}):</span>
                  <div className="mt-1 pl-2 text-gray-300">
                     1 - [ ({derivedManualProps.rightGoods}/{derivedManualProps.rightTotal || 1})^2 + ({derivedManualProps.rightBads}/{derivedManualProps.rightTotal || 1})^2 ] = <span className="text-white font-bold">{derivedManualProps.rightGini.toFixed(4)}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-2 text-[#D4AF37] font-sans text-xs">
                  <span className="font-bold block uppercase text-[10px] text-white opacity-70 font-mono">Weighted split gain result:</span>
                  <div className="mt-1 pl-2 font-mono text-[11px]">
                    Gain = {derivedManualProps.parentGini.toFixed(4)} - [ ({derivedManualProps.leftTotal}/{derivedManualProps.total}) * {derivedManualProps.leftGini.toFixed(3)} + ({derivedManualProps.rightTotal}/{derivedManualProps.total}) * {derivedManualProps.rightGini.toFixed(3)} ] = <span className="text-green-400 font-bold font-black">{derivedManualProps.giniGain.toFixed(5)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
