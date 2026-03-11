import { useMemo, useState, useCallback } from 'react';
import {
    type Node,
    type Edge,
    MarkerType,
    type NodeChange,
    type EdgeChange,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react';
import { isNodeVisible, calculateEdgeStyle } from '../utils/graphTransformer';

interface UseImpactGraphProps {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    sensitivityMultiplier: number;
    scoreThreshold: number;
}

export const useImpactGraph = ({
    nodes,
    edges,
    setNodes,
    setEdges,
    sensitivityMultiplier,
    scoreThreshold,
}: UseImpactGraphProps) => {
    // --- Internal States for Filtering & Interaction ---
    const [timeFilters, setTimeFilters] = useState<string[]>(['Short', 'Medium', 'Long', 'N/A']);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // --- Interaction Handlers ---
    const onNodesChange = useCallback((changes: NodeChange[]) =>
        setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) =>
        setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);

    const toggleFilter = useCallback((val: string) => {
        setTimeFilters(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    }, []);

    const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(node.id)) next.delete(node.id);
            else next.add(node.id);
            return next;
        });
    }, []);

    // --- Graph Transformation Logic ---
    const visibleNodes = useMemo(() => {
        return nodes.map((n) => {
            const isVisibleBase = isNodeVisible(n, edges, timeFilters, expandedNodes);

            // Score threshold filtering (skip for tierGroup nodes)
            let isScoreVisible = true;
            if (n.type === 'impact') {
                // Find all incoming edges to check max score influence, or check node data if available
                // Actually, the edge's originalScore is the best indicator of "importance" of a relationship.
                // But if a node has NO visible incoming edges, it should be hidden (except root).
                // Let's check if there's ANY incoming edge >= threshold.
                const incomingEdges = edges.filter(e => e.target === n.id);
                if (incomingEdges.length > 0) {
                    isScoreVisible = incomingEdges.some(e => Math.abs(e.data?.originalScore as number || 0) >= scoreThreshold);
                }
            }

            const isVisible = isVisibleBase && isScoreVisible;

            return {
                ...n,
                hidden: !isVisible,
                style: {
                    ...n.style,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s',
                    boxShadow:
                        expandedNodes.has(n.id) && edges.some((e) => e.source === n.id)
                            ? '0 0 0 3px var(--accent-color)'
                            : 'none',
                },
            };
        });
    }, [nodes, edges, timeFilters, expandedNodes, scoreThreshold]);

    const visibleEdges = useMemo(() => {
        return edges.map((e) => {
            const sourceNode = nodes.find((n) => n.id === e.source);
            const targetNode = nodes.find((n) => n.id === e.target);

            // Visibility determined by endpoints AND score
            const sourceVisible = sourceNode ? isNodeVisible(sourceNode, edges, timeFilters, expandedNodes) : true;
            const targetVisible = targetNode ? isNodeVisible(targetNode, edges, timeFilters, expandedNodes) : true;
            const scoreVisible = Math.abs(e.data?.originalScore as number || 0) >= scoreThreshold;

            const style = calculateEdgeStyle(e.data?.originalScore as number || 0, sensitivityMultiplier);

            return {
                ...e,
                hidden: !sourceVisible || !targetVisible || !scoreVisible,
                style: {
                    stroke: style.stroke,
                    strokeWidth: style.strokeWidth,
                    transition: 'stroke-width 0.3s',
                },
                markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke },
                className: style.className,
            };
        });
    }, [edges, nodes, timeFilters, expandedNodes, sensitivityMultiplier, scoreThreshold]);

    return {
        visibleNodes,
        visibleEdges,
        onNodesChange,
        onEdgesChange,
        handleNodeClick,
        timeFilters,
        toggleFilter,
        setExpandedNodes // App may need to clear expansion on new graph
    };
};
