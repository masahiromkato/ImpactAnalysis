import React from 'react';
import { Activity } from 'lucide-react';
import { THEME } from './theme';
import { type EdgeDetail } from '../utils/graphTransformer';

interface EvidencePanelProps {
    edgeDetails: EdgeDetail[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ edgeDetails }) => {
    if (edgeDetails.length === 0) return null;

    return (
        <div className="logic-panel" style={{ flex: 'none', height: '140px', backgroundColor: THEME.colors.panelBg, overflowY: 'auto', padding: '0.75rem 1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: THEME.colors.textPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color={THEME.colors.accent} />
                影響波及の論理的背景（根拠）
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {edgeDetails.map((detail) => (
                    <div key={detail.id} style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.colors.border}` }}>
                        <div style={{
                            minWidth: '24px', height: '24px', borderRadius: '12px', background: THEME.colors.accent,
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px'
                        }}>
                            {detail.id}
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: THEME.colors.textSecondary, marginBottom: '4px' }}>
                                {detail.source} ➔ {detail.target}
                            </div>
                            <div style={{ fontSize: '14px', color: '#f8fafc', lineHeight: '1.5' }}>
                                {detail.logic}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
