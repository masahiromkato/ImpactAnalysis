import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { THEME } from './theme';

interface ImpactNodeProps {
    data: {
        label: string;
        type: 'neutral' | 'positive' | 'negative';
        tier?: string;
        time_horizon?: string;
    };
}

const ImpactNodeComponent = ({ data }: ImpactNodeProps) => {
    const tierInfo = data.tier ? THEME.tierConfig[data.tier] : null;

    return (
        <div className={`custom-node ${data.type}`}>
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {data.tier && (
                        <div
                            className="tier-badge"
                            style={{ backgroundColor: tierInfo?.color || '#334155' }}
                        >
                            {data.tier}
                        </div>
                    )}
                    {data.time_horizon && data.time_horizon !== 'N/A' && (
                        <div style={{ fontSize: '0.65rem', background: '#334155', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            {data.time_horizon}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {data.type === 'positive' && <TrendingUp size={16} />}
                    {data.type === 'negative' && <TrendingDown size={16} />}
                    {data.type === 'neutral' && <Activity size={16} />}
                </div>
                <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '1rem' }}>{data.label}</span>
            </div>
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </div>
    );
};

export const ImpactNode = memo(ImpactNodeComponent);
