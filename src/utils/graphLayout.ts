import dagre from 'dagre';
import { type Node, type Edge } from '@xyflow/react';
import { THEME } from '../components/theme';

/**
 * Layout engine using dagre to position nodes in a hierarchical impact graph.
 */
export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = THEME.graph.layout.direction) => {
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });

    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: THEME.graph.layout.ranksep,
        nodesep: THEME.graph.layout.nodesep,
        edgesep: THEME.graph.layout.edgesep,
    });

    dagreGraph.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
        if (node.type === 'tierGroup') {
            dagreGraph.setNode(node.id, { label: node.data?.label });
        }
    });

    nodes.forEach((node) => {
        if (node.type !== 'tierGroup') {
            dagreGraph.setNode(node.id, {
                width: THEME.graph.node.dagreWidth,
                height: THEME.graph.node.dagreHeight
            });
            if (node.parentId) {
                dagreGraph.setParent(node.id, node.parentId);
            }
        }
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode = { ...node };

        if (node.type === 'tierGroup') {
            newNode.position = {
                x: nodeWithPosition.x - nodeWithPosition.width / 2,
                y: nodeWithPosition.y - nodeWithPosition.height / 2,
            };
            newNode.style = {
                ...newNode.style,
                width: nodeWithPosition.width,
                height: nodeWithPosition.height,
            };
        } else {
            const nodeWidth = THEME.graph.node.renderWidth;
            const nodeHeight = THEME.graph.node.renderHeight;

            if (node.parentId) {
                const parentPosition = dagreGraph.node(node.parentId);
                const absoluteX = nodeWithPosition.x - nodeWidth / 2;
                const absoluteY = nodeWithPosition.y - nodeHeight / 2;
                const parentTopLeftX = parentPosition.x - parentPosition.width / 2;
                const parentTopLeftY = parentPosition.y - parentPosition.height / 2;

                newNode.position = {
                    x: absoluteX - parentTopLeftX,
                    y: absoluteY - parentTopLeftY,
                };
            } else {
                newNode.position = {
                    x: nodeWithPosition.x - nodeWidth / 2,
                    y: nodeWithPosition.y - nodeHeight / 2,
                };
            }
        }
        return newNode;
    });

    return { nodes: layoutedNodes, edges };
};
