import React, { memo } from 'react';
import { THEME } from './theme';

interface TierGroupNodeProps {
    data: {
        label: string;
    };
}

const TierGroupNodeComponent = ({ data }: TierGroupNodeProps) => {
    return (
        <div style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>
            <div style={{
                position: 'absolute',
                top: '-14px',
                left: '16px',
                background: THEME.colors.panelBg,
                color: THEME.colors.textSecondary,
                padding: '0 8px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                zIndex: 10
            }}>
                {data.label}
            </div>
        </div>
    );
};

export const TierGroupNode = memo(TierGroupNodeComponent);
