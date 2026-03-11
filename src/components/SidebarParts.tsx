import React from 'react';
import { Play, RefreshCw, SlidersHorizontal, Activity } from 'lucide-react';

// --- EventInput ---
interface EventInputProps {
    inputValue: string;
    setInputValue: (val: string) => void;
    loading: boolean;
    loadingMessage: string | null;
    generateGraph: () => void;
    hasApiKey: boolean;
}

export const EventInput: React.FC<EventInputProps> = ({
    inputValue,
    setInputValue,
    loading,
    loadingMessage,
    generateGraph,
    hasApiKey
}) => {
    return (
        <>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>イベントの入力</label>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="例: 中央銀行の予期せぬ利上げ..."
                />
            </div>

            <button
                className="btn-primary"
                onClick={generateGraph}
                disabled={loading || !hasApiKey}
                style={{ opacity: !hasApiKey ? 0.5 : 1, cursor: !hasApiKey ? 'not-allowed' : 'pointer' }}
            >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                {loading ? '実行中...' : '実行'}
            </button>
            {loadingMessage && (
                <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    fontSize: '0.75rem',
                    color: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: '4px',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    lineHeight: '1.4'
                }}>
                    {loadingMessage}
                </div>
            )}
        </>
    );
};

// --- ParameterControls ---
interface ParameterControlsProps {
    sensitivityMultiplier: number;
    setSensitivityMultiplier: (val: number) => void;
    heatmapThreshold: number;
    scoreThreshold: number;
    setScoreThreshold: (val: number) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
    sensitivityMultiplier,
    setSensitivityMultiplier,
    heatmapThreshold,
    scoreThreshold,
    setScoreThreshold
}) => {
    return (
        <div className="input-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'help' }} title="AIが判定した影響力（スコア）に乗算する独自の感度パラメータです。スライダーを動かすとグラフの太さやヒートマップ表示が連動します。">
                <SlidersHorizontal size={16} /> 感度パラメータ（影響の乗数）: {sensitivityMultiplier.toFixed(1)}x
            </label>
            <input
                type="range"
                min="0.1" max="3.0" step="0.1"
                value={sensitivityMultiplier}
                onChange={(e) => setSensitivityMultiplier(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1.2rem', cursor: 'help' }} title="指定したスコア以下のノードやエッジを非表示にします。複雑なグラフの重要な部分だけを抽出するのに便利です。">
                <Activity size={16} /> 影響度フィルタ（下限値）: {scoreThreshold.toFixed(2)}
            </label>
            <input
                type="range"
                min="0.0" max="1.0" step="0.05"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
            />

            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                ・ヒートマップ: 影響力(絶対値)が{heatmapThreshold}を超えると発光。
            </div>
        </div>
    );
};

// --- TimeHorizonFilters ---
interface TimeHorizonFiltersProps {
    timeFilters: string[];
    toggleFilter: (val: string) => void;
}

export const TimeHorizonFilters: React.FC<TimeHorizonFiltersProps> = ({
    timeFilters,
    toggleFilter
}) => {
    return (
        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>時間軸フィルタ (表示切替)</label>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                {['Short', 'Medium', 'Long'].map(th => (
                    <label key={th} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <input
                            type="checkbox"
                            checked={timeFilters.includes(th)}
                            onChange={() => toggleFilter(th)}
                        />
                        {th}
                    </label>
                ))}
            </div>
        </div>
    );
};

// --- ImpactLegend ---
interface LegendTierItem {
    id: string;
    label: string;
    color: string;
}

interface ImpactLegendProps {
    tierItems: LegendTierItem[];
}

export const ImpactLegend: React.FC<ImpactLegendProps> = ({ tierItems }) => {
    return (
        <div className="info-cards" style={{ marginTop: '2rem' }}>
            <div className="info-card">
                <strong>凡例</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <div style={{ width: 12, height: 12, background: 'var(--color-positive-bg)', border: '1px solid var(--color-positive)', borderRadius: '50%' }}></div>
                    <span>追い風 (ポジティブな影響)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <div style={{ width: 12, height: 12, background: 'var(--color-negative-bg)', border: '1px solid var(--color-negative)', borderRadius: '50%' }}></div>
                    <span>逆風 (ネガティブな影響)</span>
                </div>
                <div style={{ marginTop: '14px', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '4px' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Tierの定義 (影響の階層)</strong>
                    {tierItems.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span
                                className="tier-badge"
                                style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: item.color }}
                            >
                                {item.id}
                            </span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '14px', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '4px' }}>
                    <strong>影響度のスコア定義</strong><br />
                    ・0〜±1.0までの範囲で表示されます。<br />
                    ・数値の絶対値が大きいほど、波及効果が強力であることを示します。矢印の太さも比例して太くなります。<br />
                </div>
            </div>
        </div>
    );
};
