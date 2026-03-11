import { type Node, type Edge, MarkerType } from '@xyflow/react';
import { type ImpactDataNode } from '../api';
import { THEME } from '../components/theme';

/**
 * Normalizes node IDs to ensure consistency even if the LLM returns slightly
 * variant strings (extra whitespace, repeating Tier tags, etc.).
 */
export const normalizeId = (id: string): string => {
    if (!id) return '';
    return id
        .trim()
        // Remove common LLM-inserted Tier tags like 【Tier 1】
        .replace(/^【\s*Tier\s*\d\s*】\s*/i, '')
        // Replace multiple spaces/newlines with a single space
        .replace(/\s+/g, ' ');
};

/**
 * Pure domain logic: Applies sensitivity multiplier to a score.
 */
export const applySensitivity = (score: number, multiplier: number): number => {
    return score * multiplier;
};

/**
 * Interface for edge detail information shown in the bottom panel.
 */
export interface EdgeDetail {
    id: number;
    logic: string;
    source: string;
    target: string;
}

/**
 * Result of the impact propagation data transformation.
 */
interface TransformationResult {
    nodes: Node[];
    edges: Edge[];
    edgeDetails: EdgeDetail[];
}

/**
 * Interface for edge style result.
 */
export interface EdgeStyleResult {
    stroke: string;
    strokeWidth: number;
    className: string;
}

/**
 * Determines if a node should be visible based on filters and expansion state.
 */
export const isNodeVisible = (
    node: Node,
    edges: Edge[],
    timeFilters: string[],
    expandedNodes: Set<string>
): boolean => {
    if (node.type === 'tierGroup') return true;

    // Time horizon filter
    if (node.data?.time_horizon && node.data.time_horizon !== 'N/A') {
        if (!timeFilters.includes(node.data.time_horizon as string)) {
            return false;
        }
    }

    // Tier-based visibility (Tier 3/4 specific expansion logic)
    const tier = node.data?.tier as string;
    if (tier === 'Tier 3' || tier === 'Tier 4') {
        const incomingEdges = edges.filter((e) => e.target === node.id);
        return incomingEdges.some((e) => expandedNodes.has(e.source));
    }

    return true;
};

/**
 * Calculates the visual style of an edge based on score and sensitivity.
 */
export const calculateEdgeStyle = (
    originalScore: number,
    sensitivityMultiplier: number
): EdgeStyleResult => {
    const score = applySensitivity(originalScore, sensitivityMultiplier);
    const absScore = Math.abs(score);
    const isPositive = score > 0;

    const color = isPositive ? THEME.colors.positive : THEME.colors.negative;
    const isHeatmap = absScore >= THEME.graph.edge.heatmapThreshold;

    return {
        stroke: color,
        strokeWidth: Math.min(
            Math.max(
                THEME.graph.edge.defaultStrokeWidth,
                absScore * THEME.graph.edge.maxStrokeWidthMultiplier
            ),
            10
        ),
        className: isHeatmap ? (isPositive ? 'edge-heatmap-positive' : 'edge-heatmap-negative') : '',
    };
};

/**
 * Transforms raw causal impact data from the API into React Flow elements.
 * Handles node deduplication, score-based typing, and initial edge styling.
 */
export const transformImpactData = (data: ImpactDataNode[]): TransformationResult => {
    // API Safety: Return empty result if data is missing or not an array
    if (!data || !Array.isArray(data)) {
        console.warn("transformImpactData: Input data is missing or invalid.");
        return { nodes: [], edges: [], edgeDetails: [] };
    }

    const extractedDetails: EdgeDetail[] = [];
    const generatedNodesMap = new Map<string, Node>();
    const generatedEdges: Edge[] = [];

    // Pass 1: Deduplicate Unique Nodes and calculate total incoming scores
    const nodeScores = new Map<string, number>();

    data.forEach((item) => {
        const sourceId = normalizeId(item.source);
        const targetId = normalizeId(item.target);

        // Guard: Skip items with empty IDs (malformed data)
        if (!sourceId || !targetId) return;

        const tierValue = (item.tier || '').trim();
        const horizonValue = (item.time_horizon || 'N/A').trim();

        // Accumulate scores using normalized ID
        const currentScore = nodeScores.get(targetId) || 0;
        nodeScores.set(targetId, currentScore + (item.impact_score || 0));

        // Use normalized ID for display label for consistency
        const cleanSourceLabel = sourceId;
        const cleanTargetLabel = targetId;

        // Initialize source node if new
        if (!generatedNodesMap.has(sourceId)) {
            generatedNodesMap.set(sourceId, {
                id: sourceId,
                type: 'impact',
                position: { x: 0, y: 0 },
                data: { label: cleanSourceLabel, type: 'neutral', time_horizon: 'N/A' },
                parentId: undefined,
            });
        }

        // Initialize target node if new, or update metadata
        if (!generatedNodesMap.has(targetId)) {
            generatedNodesMap.set(targetId, {
                id: targetId,
                type: 'impact',
                position: { x: 0, y: 0 },
                data: { label: cleanTargetLabel, type: 'neutral', tier: tierValue, time_horizon: horizonValue },
                parentId: tierValue || undefined,
            });
        } else {
            const node = generatedNodesMap.get(targetId);
            if (node) {
                // Update tier/parentId if missing
                if ((!node.data.tier || node.data.tier === 'N/A') && tierValue) {
                    node.data.tier = tierValue;
                    node.parentId = tierValue;
                }
                // Update time horizon if it was default
                if ((!node.data.time_horizon || node.data.time_horizon === 'N/A') && horizonValue !== 'N/A') {
                    node.data.time_horizon = horizonValue;
                }
            }
        }
    });

    // Pass 2: Update Node Impact Types based on aggregate scores
    nodeScores.forEach((totalScore, nodeId) => {
        const node = generatedNodesMap.get(nodeId);
        if (node) {
            if (totalScore > 0) node.data.type = 'positive';
            else if (totalScore < 0) node.data.type = 'negative';
        }
    });

    // Pass 3: Create Tier Group (Parent) nodes
    const initialNodes: Node[] = [];
    const activeTiers = new Set<string>();
    data.forEach((item) => {
        const sId = normalizeId(item.source);
        const tId = normalizeId(item.target);
        if (sId && tId && item.tier) {
            activeTiers.add(item.tier.trim());
        }
    });

    activeTiers.forEach((tier) => {
        initialNodes.push({
            id: tier,
            type: 'tierGroup',
            position: { x: 0, y: 0 },
            data: { label: tier },
            style: {
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '2px dashed #475569',
                borderRadius: '12px',
                zIndex: -1,
            },
        });
    });

    // Add impact nodes to the list
    Array.from(generatedNodesMap.values()).forEach((n) => initialNodes.push(n));

    // Pass 4: Generate Edges and Extraction Details
    data.forEach((item, index) => {
        const sourceId = normalizeId(item.source);
        const targetId = normalizeId(item.target);

        // Guard: Skip items with empty IDs
        if (!sourceId || !targetId) return;

        const impactScore = item.impact_score || 0;
        const stepNum = index + 1;

        // Record data for the details panel
        extractedDetails.push({
            id: stepNum,
            logic: item.logic || '',
            source: sourceId,
            target: targetId,
        });

        // Format the edge label
        const scoreSign = impactScore > 0 ? '+' : '';
        const sensStr = item.sensitivity && item.sensitivity !== 'N/A' ? `[${item.sensitivity}] ` : '';
        const displayLabel = `${stepNum} ${sensStr}(影響: ${scoreSign}${impactScore})`;

        // Style calculation
        const style = calculateEdgeStyle(impactScore, 1.0);

        generatedEdges.push({
            id: `e${index}`,
            source: sourceId,
            target: targetId,
            animated: true,
            data: { originalScore: impactScore },
            style: {
                stroke: style.stroke,
                strokeWidth: style.strokeWidth
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke },
            label: displayLabel,
            labelStyle: { fill: '#fff', fontSize: 16, fontWeight: 'bold' },
            labelBgStyle: { fill: '#1e293b', fillOpacity: 1, color: '#fff', strokeWidth: 1, stroke: style.stroke },
            labelBgPadding: [12, 8],
            labelBgBorderRadius: 8,
            className: style.className,
        });
    });

    return {
        nodes: initialNodes,
        edges: generatedEdges,
        edgeDetails: extractedDetails,
    };
};
