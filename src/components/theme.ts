/**
 * Project-wide theme and graph configuration constants.
 * Centralizing these values ensures visual consistency and easier maintenance.
 */

export const THEME = {
    colors: {
        // Semantic colors for impact types
        positive: '#0284c7',
        positiveBg: '#e0f2fe',
        negative: '#dc2626',
        negativeBg: '#fee2e2',
        neutral: '#4b5563',
        neutralBg: '#f3f4f6',

        // UI Theme colors
        accent: '#3b82f6',
        border: '#334155',
        panelBg: '#1e2130',
        textPrimary: '#e2e8f0',
        textSecondary: '#94a3b8',
        bgDark: '#0f111a',
    },

    // Configuration for each impact tier
    tierConfig: {
        'Tier 0': { label: 'Sentiment', color: '#ec4899' },
        'Tier 1': { label: 'Direct', color: '#f59e0b' },
        'Tier 2': { label: 'Indirect', color: '#8b5cf6' },
        'Tier 3': { label: 'Corporate Performance', color: '#10b981' },
        'Tier 4': { label: 'Management Agenda', color: '#e11d48' },
    } as Record<string, { label: string; color: string }>,

    graph: {
        // Layout engine settings (Dagre)
        layout: {
            ranksep: 200, // Horizontal distance between layers
            nodesep: 50,  // Vertical distance between nodes
            edgesep: 80,  // Distance between edges
            direction: 'LR',
        },

        // Node dimensions used for layout calculations
        node: {
            dagreWidth: 320,
            dagreHeight: 100,
            // Refined dimensions used for coordinate centering
            renderWidth: 280,
            renderHeight: 120,
        },

        // Edge styling
        edge: {
            defaultStrokeWidth: 1,
            maxStrokeWidthMultiplier: 4,
            heatmapThreshold: 0.8,
            animationSpeed: '2s',
        }
    }
};
