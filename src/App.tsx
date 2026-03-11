import { useState, useMemo } from 'react';
import {
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { generateImpactGraphWithCatch as generateImpactGraph } from './api';
import { getLayoutedElements } from './utils/graphLayout';
import { transformImpactData } from './utils/graphTransformer';
import {
  Sidebar,
  EvidencePanel,
  GraphCanvas,
  THEME
} from './components';

import { useImpactGraph } from './hooks/useImpactGraph';

/**
 * Synchronizes THEME constants to CSS variables for unified styling.
 */
const syncThemeVariables = () => {
  const root = document.documentElement;

  // Sync colors
  Object.entries(THEME.colors).forEach(([key, value]) => {
    // CamelCase to kebab-case conversion for CSS vars
    const cssVarKey = `--color-${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
    root.style.setProperty(cssVarKey, value);

    // Compatibility for legacy vars used in index.css
    if (key === 'panelBg') root.style.setProperty('--panel-bg', value);
    if (key === 'bgDark') root.style.setProperty('--bg-color', value);
    if (key === 'textPrimary') root.style.setProperty('--text-primary', value);
    if (key === 'textSecondary') root.style.setProperty('--text-secondary', value);
    if (key === 'borderColor' || key === 'border') root.style.setProperty('--border-color', value);
    if (key === 'accent') root.style.setProperty('--accent-color', value);
  });

  // Sync Tier colors
  Object.entries(THEME.tierConfig).forEach(([tier, config]) => {
    const tierNum = tier.replace(/\D/g, '');
    root.style.setProperty(`--color-tier${tierNum}`, config.color);
  });

  // Sync Graph settings
  root.style.setProperty('--heatmap-threshold', THEME.graph.edge.heatmapThreshold.toString());
};

// Execute synchronization
syncThemeVariables();

function App() {
  // --- Core States ---
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [edgeDetails, setEdgeDetails] = useState<{ id: number; logic: string; source: string; target: string }[]>([]);

  // --- UI & Controls States ---
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('中東での地政学リスクの高まりと原油価格の上昇');
  const [selectedModel, setSelectedModel] = useState('models/gemini-flash-latest');
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // --- Persistent States (Cache & History) ---
  const [cache, setCache] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('impact-analysis-cache');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('impact-analysis-history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // --- Filtering & Sensitivity States ---
  const [sensitivityMultiplier, setSensitivityMultiplier] = useState<number>(1.0);
  const [scoreThreshold, setScoreThreshold] = useState<number>(0.0);

  // --- React Flow Data (Nerves) ---
  const {
    visibleNodes,
    visibleEdges,
    onNodesChange,
    onEdgesChange,
    handleNodeClick,
    timeFilters,
    toggleFilter,
    setExpandedNodes
  } = useImpactGraph({
    nodes,
    edges,
    setNodes,
    setEdges,
    sensitivityMultiplier,
    scoreThreshold,
  });

  const tierItems = useMemo(() =>
    Object.entries(THEME.tierConfig).map(([id, config]) => ({ id, ...config })),
    []);

  // Sync cache/history to localStorage
  useMemo(() => {
    localStorage.setItem('impact-analysis-cache', JSON.stringify(cache));
    localStorage.setItem('impact-analysis-history', JSON.stringify(analysisHistory.slice(0, 10)));
  }, [cache, analysisHistory]);

  const loadFromResult = (data: any, input: string, model: string, isFromHistory: boolean = false) => {
    const { nodes: initialNodes, edges: generatedEdges, edgeDetails: generatedEdgeDetails } = transformImpactData(data);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, generatedEdges, 'LR');

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setEdgeDetails(generatedEdgeDetails);

    setInputValue(input);
    setSelectedModel(model);

    const allNodeIds = new Set<string>();
    layoutedNodes.forEach(n => { if (n.type === 'impact') allNodeIds.add(n.id); });
    setExpandedNodes(allNodeIds);
    setLastExecuted(`${new Date().toLocaleString()}${isFromHistory ? ' (履歴)' : ' (Cache)'}`);
  };

  /**
   * Main Orchestration Flow:
   * 1. Call API (Gemini)
   * 2. Transform into graph elements (nodes, edges, details)
   * 3. Apply layout (Dagre)
   */
  const generateGraph = async () => {
    const effectiveApiKey = apiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string);
    if (!inputValue.trim() || !effectiveApiKey) return;

    setLoading(true);
    setLoadingMessage(null);
    setLastExecuted(null);

    setLoadingMessage("AIによる分析を実行中...");

    // フェーズごとのメッセージ更新タイマー
    const timer1 = setTimeout(() => {
      setLoadingMessage("分析が複雑なため、通常より時間がかかっています...");
    }, 15000);
    const timer2 = setTimeout(() => {
      setLoadingMessage("最終的な論理構築を行っています。まもなく完了します...");
    }, 30000);
    const timer3 = setTimeout(() => {
      setLoadingMessage("大規模なネットワークを構築中です。120秒以内に完了する見込みです...");
    }, 60000);

    const cacheKey = `${inputValue.trim()}_${selectedModel}`;
    if (cache[cacheKey]) {
      console.log("Using cached result for:", cacheKey);
      loadFromResult(cache[cacheKey], inputValue, selectedModel, false);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setLoading(false);
      setLoadingMessage(null);
      return;
    }

    try {
      // 1. API Executive
      const rawData = await generateImpactGraph(
        inputValue,
        selectedModel,
        apiKey || undefined
      );
      // Step 2: Transform Data
      setLoadingMessage("分析完了。グラフを描画中...");
      const { nodes: initialNodes, edges: generatedEdges, edgeDetails: generatedEdgeDetails } = transformImpactData(rawData);

      // Step 3: Layout Calculation
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, generatedEdges, 'LR');

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setEdgeDetails(generatedEdgeDetails);

      // Cache the raw result
      setCache(prev => ({ ...prev, [cacheKey]: rawData }));

      // Update history
      const historyItem = {
        id: Date.now(),
        input: inputValue,
        model: selectedModel,
        data: rawData,
        timestamp: new Date().toLocaleString()
      };
      setAnalysisHistory(prev => {
        const filtered = prev.filter(h => h.input !== inputValue || h.model !== selectedModel);
        return [historyItem, ...filtered].slice(0, 10);
      });

      const allNodeIds = new Set<string>();
      layoutedNodes.forEach(n => { if (n.type === 'impact') allNodeIds.add(n.id); });
      setExpandedNodes(allNodeIds);
      setLastExecuted(new Date().toLocaleString());
    } catch (error) {
      console.error("Graph Generation Error Details:", {
        message: error instanceof Error ? error.message : String(error),
        error,
        inputValue,
        selectedModel
      });

      let userMessage = "グラフの生成中にエラーが発生しました。";
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          userMessage = "APIキーが無効、または設定されていません。サイドバーのAPIキーを確認してください。";
        } else if (error.message.includes("fetch")) {
          userMessage = "ネットワークエラーが発生しました。接続を確認してください。";
        } else if (error.message.includes("QUOTA_EXCEEDED")) {
          userMessage = error.message.replace("QUOTA_EXCEEDED: ", "") + "\n\n(※制限解除まであと数分〜数十分お待ちください。時間を置くと自動的に復活します)";
        } else {
          userMessage = `エラー: ${error.message}`;
        }
      }
      alert(userMessage);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setLoading(false);
      setLoadingMessage(null);
    }
  };


  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        inputValue={inputValue}
        setInputValue={setInputValue}
        sensitivityMultiplier={sensitivityMultiplier}
        setSensitivityMultiplier={setSensitivityMultiplier}
        scoreThreshold={scoreThreshold}
        setScoreThreshold={setScoreThreshold}
        timeFilters={timeFilters}
        toggleFilter={toggleFilter}
        loading={loading}
        loadingMessage={loadingMessage}
        generateGraph={generateGraph}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        tierItems={tierItems}
        heatmapThreshold={THEME.graph.edge.heatmapThreshold}
        history={analysisHistory}
        loadFromHistory={(item: any) => loadFromResult(item.data, item.input, item.model, true)}
        clearHistory={() => setAnalysisHistory([])}
      />

      <main className="main-content-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <GraphCanvas
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          lastExecuted={lastExecuted}
        />

        <EvidencePanel edgeDetails={edgeDetails} />
      </main>
    </div >
  );
}

export default App;
