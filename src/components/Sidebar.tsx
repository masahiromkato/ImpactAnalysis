import React from 'react';
import {
    Activity,
    ChevronLeft
} from 'lucide-react';
import {
    EventInput,
    ParameterControls,
    TimeHorizonFilters,
    ImpactLegend
} from './SidebarParts';

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    inputValue: string;
    setInputValue: (val: string) => void;
    sensitivityMultiplier: number;
    setSensitivityMultiplier: (val: number) => void;
    timeFilters: string[];
    toggleFilter: (val: string) => void;
    loading: boolean;
    loadingMessage: string | null;
    generateGraph: () => void;
    apiKey: string;
    setApiKey: (val: string) => void;
    selectedModel: string;
    setSelectedModel: (val: string) => void;
    tierItems: { id: string; label: string; color: string }[];
    heatmapThreshold: number;
    scoreThreshold: number;
    setScoreThreshold: (val: number) => void;
    history: any[];
    loadFromHistory: (item: any) => void;
    clearHistory: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    inputValue,
    setInputValue,
    sensitivityMultiplier,
    setSensitivityMultiplier,
    timeFilters,
    toggleFilter,
    loading,
    loadingMessage,
    generateGraph,
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    tierItems,
    heatmapThreshold,
    scoreThreshold,
    setScoreThreshold,
    history,
    loadFromHistory,
    clearHistory
}) => {
    const hasApiKey = !!(apiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY);

    return (
        <aside
            className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
            style={{
                width: isSidebarOpen ? '320px' : '0px',
                transition: 'width 0.3s ease',
                overflowX: 'hidden',
                opacity: isSidebarOpen ? 1 : 0
            }}
        >
            <div style={{ width: '100%', padding: '0.75rem 0.75rem 1.5rem 0.75rem', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <Activity color="var(--accent-color)" /> 影響波及分析
                    </h1>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                            transition: 'background 0.2s',
                        }}
                        title="サイドバーを閉じる"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <EventInput
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    loading={loading}
                    loadingMessage={loadingMessage}
                    generateGraph={generateGraph}
                    hasApiKey={hasApiKey}
                />

                <ParameterControls
                    sensitivityMultiplier={sensitivityMultiplier}
                    setSensitivityMultiplier={setSensitivityMultiplier}
                    heatmapThreshold={heatmapThreshold}
                    scoreThreshold={scoreThreshold}
                    setScoreThreshold={setScoreThreshold}
                />

                <TimeHorizonFilters
                    timeFilters={timeFilters}
                    toggleFilter={toggleFilter}
                />

                <div className="input-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <label>使用するモデル</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit'
                        }}
                    >
                        <option value="models/gemini-flash-latest" style={{ color: '#000' }}>Gemini Flash (高速・最新版)</option>
                        <option value="models/gemini-pro-latest" style={{ color: '#000' }}>Gemini Pro (高精度・最新版)</option>
                        <option value="models/gemini-2.5-pro" style={{ color: '#000' }}>Gemini 2.5 Pro (最新・安定版)</option>
                        <option value="models/gemini-3.1-pro-preview" style={{ color: '#000' }}>Gemini 3.1 Pro (超高性能・プレビュー)</option>
                    </select>
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Gemini API キー</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={import.meta.env.VITE_GEMINI_API_KEY ? "環境変数のキーを使用中..." : "AIzaSy... (API Keyを入力)"}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <ImpactLegend tierItems={tierItems} />

                {history.length > 0 && (
                    <div className="input-group" style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label style={{ margin: 0 }}>分析履歴 (最新10件)</label>
                            <button
                                onClick={clearHistory}
                                style={{ fontSize: '0.7rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                全削除
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => loadFromHistory(item)}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        textAlign: 'left',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    className="history-item"
                                >
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.input}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{item.timestamp}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};
